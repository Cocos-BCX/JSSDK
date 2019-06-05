import * as types from '../mutations';
import iDB from "../services/api/wallet/idb-instance";
import Immutable from "immutable";
import {hash, PublicKey,PrivateKey} from "bcxjs-cores";
import {saveAs} from "file-saver";
import {decryptWalletBackup} from "../services/api/wallet/backup";
import { ChainConfig } from 'bcxjs-ws';
import API from '../services/api';

let _chainstore_account_ids_by_key;
let _no_account_refs;
const initialState = {
    backup: {
        name: null,
        contents: null,
        sha1: null,
        size: null,
        last_modified: null,
        public_key: null,
        wallet_object: null
    }
};
const getters={
    backup:state=>state.backup
}

const actions={
    reset:({state})=>{
        state.backup={
            name: null,
            contents: null,
            sha1: null,
            size: null,
            last_modified: null,
            public_key: null,
            wallet_object: null
        }
    },
    incommingBuffer:({dispatch,state},{name, contents, public_key})=>{
        dispatch("reset");
        var sha1 = hash.sha1(contents).toString('hex')
        var size = contents.length
        if( ! public_key) public_key = getBackupPublicKey(contents);
        // state.backup={
        //     name,
        //     contents,
        //     sha1,
        //     size,
        //     public_key
        // }
        state.backup=Object.assign(state.backup,{
            name, contents, sha1, size, public_key
        });
        return {code:1}
    },
    download:({getters,dispatch})=>{
        let isFileSaverSupported = false;
        try {
            isFileSaverSupported = !!new Blob;
        } catch (e) {
        }
        if (!isFileSaverSupported) {
            return {code:151,message:"File saving is not supported"}
        }
        let backup=getters.backup;
        let blob = new Blob([backup.contents], {
            type: "application/octet-stream; charset=us-ascii"
            //type: "text/plain;charset=us-ascii"
        })

        if (blob.size !== backup.size) {
            return {code:152,message:"Invalid backup to download conversion"}
        }
        saveFile(blob, backup.name);
        dispatch("WalletDb/setBackupDate",null,{root:true});

        return {code:1};
    },
    incommingWebFile:({dispatch},{file})=>{
        return new Promise((resolve)=>{
            let reader = new FileReader();
            reader.onload = evt => {
                let contents = new Buffer(evt.target.result, "binary");
                let name = file.name;
                let last_modified = file.lastModifiedDate.toString();

                resolve({name, contents, last_modified})               
            };
            reader.readAsBinaryString(file);
        }).then(result=>{
           return  dispatch("onIncommingFile",result);
        }).catch(error=>{
            return {code:155,message:"Your browser may not support wallet file recovery",error};
        })
        
    },
    onIncommingFile({state},{name, contents, last_modified}) {
        var sha1 = hash.sha1(contents).toString('hex');
        var size = contents.length
        var public_key = getBackupPublicKey(contents)
        if(!public_key){
            return {code:173,message:"Please select the correct wallet file"};
        }
        state.backup=Object.assign(state.backup,{
            name, contents, sha1, size, last_modified, public_key
        });
        return {code:1,data:state.backup};
       // this.setState({ name, contents, sha1, size, last_modified, public_key })
    },
    onRestore:async ({dispatch,state,rootGetters},{password})=>{
        if(rootGetters["WalletDb/wallet"]){
            return {code:163,message:"The wallet already exists. Please try importing the private key"}
        }else{
            await dispatch("account/_logout",null,{root:true});
        }

        let backup=state.backup;
        let wallet=rootGetters["WalletManagerStore/wallet"];

        let has_current_wallet = !!wallet.current_wallet
        let wallet_name="";
        if (!has_current_wallet) {
            wallet_name="default";
        }else if(backup.name){
            wallet_name= backup.name.match(/[a-z0-9_-]*/)[0];
        }
         

        let private_key = PrivateKey.fromSeed(password || "");
        let contents = backup.contents;
        return decryptWalletBackup(private_key.toWif(), contents).then(wallet_object => {
            let brainkey_pubkey=wallet_object.wallet[0].brainkey_pubkey;
            let coreAssetSymbol=brainkey_pubkey.substr(0,brainkey_pubkey.length-50);
            if(ChainConfig.address_prefix!=coreAssetSymbol){
                return {code:158,message:'Imported Wallet core assets can not be '+coreAssetSymbol+", and it should be "+ChainConfig.address_prefix};
            }
            var g_wallet=rootGetters["WalletDb/wallet"];
            if(g_wallet&&wallet_object.wallet[0].brainkey_pubkey==g_wallet.brainkey_pubkey){
                return {code:156,message:'The wallet has been imported. Do not repeat import'};
            }
            let wallet_chain_id=wallet_object.wallet[0].chain_id;
            if(wallet_chain_id!=ChainConfig.chain_id){
                return {code:166,message:"The Wallet Chain ID does not match the current chain configuration information. The chain ID of the wallet is:"+wallet_chain_id};
            }

            state.backup.wallet_object=wallet_object;
            wallet_object.private_keys.forEach(keyObj => {
                dispatch("PrivateKeyStore/setKeys",keyObj,{root:true});
            });

            return dispatch("checkNewName",password);
        }).catch(error => {
            console.log("Error verifying wallet " + backup.name, error);
            if (error === "invalid_decryption_key"){
                return {code:105,message:"wrong password"};
            }
            else{
                return {code:0,message:error.message,error};
            }     
        })
    },
    checkNewName:async ({dispatch,state,rootGetters})=>{
        let has_current_wallet = !!rootGetters["WalletManagerStore/wallet"].current_wallet
        let backup=state.backup;
        if (!has_current_wallet) {
            let walletName = "default";
            if (backup.name) {
                walletName = backup.name.match(/[a-z0-9_-]*/)[0];
            }
            await dispatch("WalletManagerStore/setNewWallet",walletName,{root:true});
            // WalletActions.restore(name, this.props.backup.wallet_object);
            state.accept=true;
            state.new_wallet=walletName;
            await dispatch("WalletManagerStore/restore",{wallet_name:walletName,wallet_object:backup.wallet_object},{root:true});
        }

        if (has_current_wallet && backup.name && !state.new_wallet) {
            let new_wallet = backup.name.match(/[a-z0-9_-]*/)[0];
            if (new_wallet)
                 state.new_wallet=new_wallet;
        }     

        let userId = await API.Account.getAccountIdByOwnerPubkey(backup.wallet_object.private_keys[0].pubkey);
        userId = userId && userId[0];
        if(!userId){
          return {code:165,message:"There is no account information in the wallet on the chain"};   
        }

        let acc_res=await API.Account.getUser(userId,true);
        if(acc_res.code!=1){
            return acc_res;
        }
        
        if(!backup.wallet_object.linked_accounts.length){
            backup.wallet_object.linked_accounts=[{
                name:acc_res.data.account.name,
                chainId:backup.wallet_object.wallet[0].chain_id
            }];
        }
            
        await dispatch("AccountStore/setCurrentAccount",backup.wallet_object.linked_accounts[0].name,{root:true});
        return await dispatch("account/getAccountInfo",null,{root:true});   
    }
    
}

function saveFile(obj, name) {
    if (window.requestFileSystem !== undefined) {
        console.debug('use window.requestFileSystem');
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
            fileSystem.root.getDirectory('Download', {create: true}, function (dirTry) {
                dirTry.getFile(name, {create: true, exclusive: false}, function (entry) {
                    let fileUrl = entry.toURL();
                    entry.createWriter(function (writer) {
                        writer.onwriteend = function (evt) {
                            //console.debug("Successfully saved file to " + fileUrl);
                            NotificationActions.success("Successfully saved file to " + fileUrl);
                        };
                        // Write to the file
                        writer.write(obj);
                    }, function (error) {
                        //console.debug("Error: Could not create file writer, " + error.code);
                        NotificationActions.error("Could not create file writer, " + error.code);
                    });
                }, function (error) {
                    //console.debug("Error: Could not create file, " + error.code);
                    NotificationActions.error("Could not create file, " + error.code);
                });
            }, function (error) {
                NotificationActions.error("Could not create dir, " + error.code);
            });
        }, function (evt) {
            //console.debug("Error: Could not access file system, " + evt.target.error.code);
            NotificationActions.error("Could not access file system, " + evt.target.error.code);
        });
    } else {
        console.debug('not window.requestFileSystem');
        // console.info("saveAs",saveAs);
        saveAs(obj, name);
    }
}

function getBackupPublicKey(contents) {
    try {
        return PublicKey.fromBuffer(contents.slice(0, 33))
    } catch(e) {
        //console.error(e, e.stack);
        return false
    }
}


export default {
  state: initialState,
  actions,
  getters,
  namespaced: true
};
