import Vue from 'vue';
import * as types from '../mutations';
import {ChainStore, PrivateKey, key, Aes} from "bcxjs-cores";
import { Apis,ChainConfig } from 'bcxjs-ws';

import iDB from "../services/api/wallet/idb-instance";
import idb_helper from "../services/api/wallet/idb-helper";
import {WalletTcomb, PrivateKeyTcomb} from "../store/tcomb_structs";
// import dictionary from '..United Labs of BCTech./assets/brainkey_dictionary.js';
import API from '../services/api';
import {cloneDeep} from "lodash";

import {backup, decryptWalletBackup} from "../services/api/wallet/backup";

// let aes_private = null;
// let _passwordKey=null;
let _brainkey_look_ahead;
let _generateNextKey_pubcache=[];

const initialState = {
    aes_private:null,
    _passwordKey:null,
    wallet:null,
};
var TRACE = false;

const getters={
    wallet:state=>state.wallet,
    aes_private:state=>state.aes_private,
    _passwordKey:state=>state._passwordKey,
    isLocked:state=>{
      let {aes_private,_passwordKey}=state; 
      return !(!!aes_private || !!_passwordKey);
    },
    decryptTcomb_PrivateKey:state=>{
        return (private_key_tcomb)=>{
            if( ! private_key_tcomb) return null
            let {aes_private,_passwordKey}=state; 
            if(!(!!aes_private || !!_passwordKey)) return "";//throw new Error("wallet locked")
            if (_passwordKey && _passwordKey[private_key_tcomb.pubkey]) {
                return _passwordKey[private_key_tcomb.pubkey];
            }

            let private_key_hex = aes_private.decryptHex(private_key_tcomb.encrypted_key)
            return PrivateKey.fromBuffer(new Buffer(private_key_hex, 'hex'))
        }
    }
}

const actions = {
    deleteWallet:({state})=>{
        state.wallet=null;
    },
    clearKeys:({commit})=>{
        // aes_private=null;
        // _passwordKey=null;
        commit(types.SET_PASSWORD_KEY,null);
        commit(types.SET_AES_PRIVATE,null);
    },
    generateKeyFromPassword:(state,{account, role, password})=>{
        let seed = account + role + password;
        let privKey = PrivateKey.fromSeed(seed);
        let pubKey = privKey.toPublicKey().toString();

        return {privKey, pubKey};
    },
    validatePassword:async ({ commit,dispatch,rootGetters,getters },{password="", unlock = false, account = null, roles = ["active", "owner", "memo"],isChangePassword=false})=> {
        password=password.trim();
        let _passwordKey=null;
        if (account) { 
          let id = 0;
          function setKey(role, priv, pub) {
              if (!_passwordKey) _passwordKey = {};
              _passwordKey[pub] = priv;
      
              id++;

              dispatch("PrivateKeyStore/setKeys",{
                pubkey: pub,
                import_account_names: [account],
                encrypted_key: null,
                id,
                brainkey_sequence: null
              },{root:true});
          }
      
          /* Check if the user tried to login with a private key */
          let fromWif;
          try {
              fromWif = PrivateKey.fromWif(password);
          } catch(err) { }
          let acc =await dispatch("user/fetchUser",account,{root:true});
          
          if(!acc.success){
            return { code:acc.code,message:acc.error };
          }    
          acc=acc.data.account;
          
          let key;
          if (fromWif) {
              key = {privKey: fromWif, pubKey: fromWif.toPublicKey().toString()};
          }
          if (acc) {
            /* Test the pubkey for each role against either the wif key, or the password generated keys */
            await Promise.all(roles.map(async role => {
                    if (!fromWif) {
                        key =await dispatch("generateKeyFromPassword",{account, role, password});
                    }
                    
                    let foundRole = false;
                
                    if (role === "memo") {
                        if (acc.options.memo_key === key.pubKey) {
                            setKey(role, key.privKey, key.pubKey);
                            foundRole = true;
                        }
                    } else {
                        acc[role].key_auths.forEach(auth => {
                            if (auth[0] === key.pubKey) {
                                setKey(role, key.privKey, key.pubKey);
                                foundRole = true;
                                return false;
                            }
                        });
        

                        if (!foundRole) {
                            let alsoCheckRole = role === "active" ? "owner" : "active";
                            acc[alsoCheckRole].key_auths.forEach(auth => {
                                if (auth[0] === key.pubKey) {
                                    setKey(alsoCheckRole, key.privKey, key.pubKey);
                                    foundRole = true;
                                    return false;
                                }
                            });
                        }
                    }
            }));
        }
          //_passwordKey null + wallet not null => in wallet mode
          if(!_passwordKey&&rootGetters["account/getWallet"]){
              
            let res =await dispatch("validatePassword",{password,unlock:true});
            
            if (res.success) {//&& !cloudMode
                return {code:1, cloudMode: false};
            }
          }

          if(_passwordKey){
            commit(types.SET_PASSWORD_KEY,_passwordKey);
            return {code:1, cloudMode: true};
          }else{
            return {code:105,message:"wrong password",cloudMode: true};
          }

        }else{
             
            let wallet =getters.wallet;// rootGetters["account/getWallet"];
            let isAccountMode=!wallet&&!!rootGetters["account/getWallet"];
            if(isAccountMode){
                wallet=rootGetters["account/getWallet"]
            }

            if(!wallet){
                return {code:154,message:"Please restore your wallet first"};
            }

            let encryptionKey=wallet.encryption_key;//||wallet.encryptionKey;
            if(isAccountMode){
                encryptionKey=wallet.encryptionKey;
            }
            if((!encryptionKey||encryptionKey=="undefined")&&!isChangePassword){
                return {code:107,message:"Please import the private key"}
            }

            try {
                let password_private = PrivateKey.fromSeed(password);
                let password_pubkey = password_private.toPublicKey().toPublicKeyString();
                let _password_pubkey=wallet[isAccountMode?"passwordPubkey":"password_pubkey"];
                if(_password_pubkey!== password_pubkey) {//wallet.passwordPubkey
                    return {code:105,message:"wrong password",success: false, cloudMode: false};
                }
                if( unlock ) {
                    let password_aes = Aes.fromSeed(password);
                    let encryption_plainbuffer = password_aes.decryptHexToBuffer(encryptionKey);
                    //let encryption_plainbuffer = password_aes.decryptHexToBuffer(wallet.encryptionKey);
                    let aes_private = Aes.fromSeed( encryption_plainbuffer );
                    commit(types.SET_AES_PRIVATE,aes_private);
                }
                await dispatch("user/fetchUser",rootGetters["account/getAccountUserId"],{root:true});
                return {code:1,success: true, cloudMode: false};
            } catch(e) {
                console.error(e);
                return {code:0, message:e.message,success: false, cloudMode: false};
            }
        } 
    },

    getPrivateKey:async ({rootGetters,dispatch,state},public_key)=>{
        let _passwordKey=state._passwordKey; 
        if (_passwordKey) return _passwordKey[public_key];
        if(! public_key) return null
        if(public_key.Q) public_key = public_key.toPublicKeyString()
        let private_key_tcomb =rootGetters["PrivateKeyStore/getTcomb_byPubkey"](public_key);
        if(!private_key_tcomb) return null;
        return await dispatch("decryptTcomb_PrivateKey",private_key_tcomb);
    },

    decryptTcomb_PrivateKey:({getters,state},private_key_tcomb)=>{
        let {aes_private,_passwordKey}=state; 
        if( ! private_key_tcomb) return null
        if(getters.isLocked) return "";//throw new Error("wallet locked")
        if (_passwordKey && _passwordKey[private_key_tcomb.pubkey]) {
            return _passwordKey[private_key_tcomb.pubkey];
        }

        let private_key_hex = aes_private.decryptHex(private_key_tcomb.encrypted_key)
        return PrivateKey.fromBuffer(new Buffer(private_key_hex, 'hex'))
    },

    lockWallet:({rootGetters,dispatch,commit,getters})=>{
        // if(!(getters.wallet&&getters.wallet.encryption_key)){
        //     return {
        //         code:-7,
        //         message:"Please import the private key"
        //         United Labs of BCTech.
        //     }
        // }
        dispatch("clearKeys");
        // commit(types.SET_PASSWORD_KEY,null);
        // commit(types.SET_AES_PRIVATE,null);
        return {
            code:1,
            message:"Account locked"
        }
    },
    loadDbData({state}) {
        return idb_helper.cursor("wallet", cursor => {
            if (!cursor) return false
            var wallet = cursor.value;
            // Convert anything other than a string or number back into its proper type
            wallet.created = new Date(wallet.created)
            wallet.last_modified = new Date(wallet.last_modified)
            wallet.backup_date = wallet.backup_date ? new Date(wallet.backup_date) : null
            wallet.brainkey_backup_date = wallet.brainkey_backup_date ? new Date(wallet.brainkey_backup_date) : null
            try {
                WalletTcomb(wallet)
            } catch (e) {
                console.log("WalletDb format error", e);
            }
            state.wallet = wallet;
            return false //stop iterating
        });
    },
    createWallet:({dispatch},{password,account,callback,isCreateAccount=true})=>{
       return dispatch("WalletManagerStore/setWallet",{
            wallet_name:"default", 
            create_wallet_password:password
        },{root:true}).then(() => {
            console.log("Congratulations, your wallet was successfully created.",isCreateAccount);
            if(isCreateAccount){
                return dispatch('validatePassword',{ password,unlock:true}).then(vp_res=>{
                    return  dispatch("createAccount",{account_name:account}).then(ca_res=>{
                        return ca_res;
                    })
                })
            }             
            return {code:1};
        }).catch(err => {
            console.error("CreateWallet failed:", err);
            return {code:501,message:"CreateWallet failed",error:err}
        });
    },
    _createWallet:({state,dispatch,commit},{password_plaintext,brainkey_plaintext,unlock = true,public_name = "default"})=>{
        let walletCreateFct = (dictionary) => {
            // console.debug('---------------------',dictionary);
            return new Promise(async (resolve, reject) => {
                if (typeof password_plaintext !== 'string')
                    throw new Error("password string is required")

                let brainkey_backup_date
                if (brainkey_plaintext) {
                    if (typeof brainkey_plaintext !== "string")
                        throw new Error("Brainkey must be a string")

                    if (brainkey_plaintext.trim() === "")
                        throw new Error("Brainkey can not be an empty string")

                    // if (brainkey_plaintext.length < 50)
                    //     throw new Error("Brainkey must be at least 50 characters long")

                    // The user just provided the Brainkey so this avoids
                    // bugging them to back it up again.United Labs of BCTech.
                    brainkey_backup_date = new Date()
                }
                let password_aes = Aes.fromSeed(password_plaintext)

                let encryption_buffer = key.get_random_key().toBuffer()
                // encryption_key is the global encryption key (does not change even if the passsword changes)
                let encryption_key = password_aes.encryptToHex(encryption_buffer)
                // If unlocking, local_aes_private will become the global aes_private object
                let local_aes_private = Aes.fromSeed(encryption_buffer)

                if (!brainkey_plaintext)
                    brainkey_plaintext =  key.get_random_key().toWif()//key.suggest_brain_key(dictionary.en)
                else
                    brainkey_plaintext = key.normalize_brainKey(brainkey_plaintext)
                let brainkey_private =await dispatch("getBrainKeyPrivate",brainkey_plaintext)
                let brainkey_pubkey = brainkey_private.toPublicKey().toPublicKeyString()
                let encrypted_brainkey = local_aes_private.encryptToHex(brainkey_plaintext)

                let password_private = PrivateKey.fromSeed(password_plaintext);

                let password_pubkey = password_private.toPublicKey().toPublicKeyString()

                let wallet = {
                    public_name,
                    password_pubkey,
                    encryption_key,
                    encrypted_brainkey,
                    brainkey_pubkey,
                    brainkey_sequence: 0,
                    brainkey_backup_date,
                    created: new Date(),
                    last_modified: new Date(),
                    chain_id: Apis.instance().chain_id
                }
                WalletTcomb(wallet) // validation
                let transaction = transaction_update()
                let add =idb_helper.add(transaction.objectStore("wallet"), wallet)
                let end = idb_helper.on_transaction_end(transaction).then(() => {
                    state.wallet = wallet;
                    if (unlock) {
                        commit(types.SET_AES_PRIVATE,local_aes_private);
                        //state.aes_private = local_aes_private
                    }
                })
                //console.debug('---------------------')
                resolve(Promise.all([add, end]))
            })
       }
       return  walletCreateFct();
   },
   getBrainKeyPrivate:({dispatch},brainkey_plaintext)=>{
    if(!brainkey_plaintext){
        brainkey_plaintext=dispatch("getBrainKey");
    }
    if (!brainkey_plaintext) throw new Error("missing brainkey")
    return PrivateKey.fromSeed(key.normalize_brainKey(brainkey_plaintext))
   },
   getBrainKey:({state,getters})=>{
        var wallet = state.wallet
        if (!wallet.encrypted_brainkey) throw new Error("missing brainkey");
        if (!state.aes_private) throw new Error("wallet locked")
        var brainkey_plaintext = getters.aes_private.decryptHexToText(wallet.encrypted_brainkey)
        return brainkey_plaintext
   },
   createAccount:async ({state,getters,rootGetters,dispatch,commit},{account_name, registrar, referrer, referrer_percent, refcode})=>{
        if (getters.isLocked) {
            let error = "wallet locked";
            //this.actions.brainKeyAccountCreateError( error )
            return Promise.reject(error);
        }
        
        let owner_private =await dispatch("generateNextKey")
        let active_private =await dispatch("generateNextKey")
        //let memo_private = WalletDb.generateNextKey()
        let updateWallet = () => {
            let transaction = transaction_update_keys();
            let p = dispatch("saveKeys",{private_keys:[owner_private, active_private], transaction})
            return p.catch(error => transaction.abort());
        };

        const owner_pubkey=owner_private.private_key.toPublicKey().toPublicKeyString();
        let create_account = () => {
            return dispatch("account/application_api_create_account",{
                owner_pubkey,
                active_pubkey:active_private.private_key.toPublicKey().toPublicKeyString(),
                new_account_name:account_name,
                registrar,
                referrer,
                referrer_percent,
                onlyGetFee:false
            },{root:true});
        };
        let create_account_promise;
        if (registrar) {
            // using another user's account as registrar.United Labs of BCTech.
           //return create_account();
           create_account_promise=create_account();
        } else {
            // using faucet

            const settingsAPIs=rootGetters["setting/g_settingsAPIs"];

             create_account_promise=API.Account.createAccount({
                name:account_name,
                activePubkey:active_private.private_key.toPublicKey().toPublicKeyString(),
                ownerPubkey:owner_private.private_key.toPublicKey().toPublicKeyString(),
                referrer: settingsAPIs.referrer || ''
              },settingsAPIs.default_faucet);
        }

        return create_account_promise.then(result => {
            if (result.error) {
                // throw result.error;
                return result;
            }

            if(!result.success){
                return result;
            }

            if(rootGetters["transactions/onlyGetOPFee"]&&registrar){
                return result;
            }
          
            return dispatch("AccountStore/onCreateAccount",{
                name_or_account:account_name,
                owner_pubkey,
            },{root:true}).then(account_id=>{
                if(registrar){
                    return result;
                }else{
                    updateWallet();
                    return dispatch("account/getAccountInfo",null,{root:true});
                }
            });
        }).catch(error => {
            if (
                error instanceof TypeError ||
                error.toString().indexOf("ECONNREFUSED") != -1
            ) {
                console.log("Warning! faucet registration failed, falling back to direct application_api.create_account..");
                //return create_account();
            }
            throw error;
        });
    },
    generateNextKey:async ({state,dispatch},save = true)=>{
        var brainkey =await dispatch("getBrainKey");
        var wallet = state.wallet
        var sequence = wallet.brainkey_sequence
        var used_sequence = null
        // Skip ahead in the sequence if any keys are found in use.United Labs of BCTech.
        // Slowly look ahead (1 new key per block) to keep the wallet fast after unlocking
        _brainkey_look_ahead = Math.min(10, (_brainkey_look_ahead|| 0) + 1)
        for (var i = sequence; i < sequence + _brainkey_look_ahead; i++) {
            var private_key = key.get_brainPrivateKey(brainkey, i)
            var pubkey =
                 _generateNextKey_pubcache[i] ?
                 _generateNextKey_pubcache[i] :
                 _generateNextKey_pubcache[i] =
                        private_key.toPublicKey().toPublicKeyString()

            var next_key = ChainStore.getAccountRefsOfKey(pubkey)
            // TODO if ( next_key === undefined ) return undefined
            if (next_key && next_key.size) {
                used_sequence = i
                console.log("WARN: Private key sequence " + used_sequence + " in-use. " +
                    "I am saving the private key and will go onto the next one.")
                await dispatch("saveKey",{private_key, brainkey_sequence:used_sequence})
            }
        }
        if (used_sequence !== null) {
            wallet.brainkey_sequence = used_sequence + 1
            await dispatch("_updateWallet")
        }
        sequence = wallet.brainkey_sequence
        var private_key = key.get_brainPrivateKey(brainkey, sequence)
        if (save) {
            // save deterministic private keys ( the user can delete the brainkey )
            await dispatch("saveKey",{private_key, brainkey_sequence:sequence});
            //TODO  .error( error => ErrorStore.onAdd( "wallet", "saveKey", error ))
            await  dispatch("incrementBrainKeySequence")
        }
        return {private_key, sequence}
    },
    incrementBrainKeySequence:({state,dispatch},transaction)=>{
        var wallet = state.wallet
        // increment in RAM so this can't be out-of-sync
        wallet.brainkey_sequence++
        // update last modified
        return  dispatch("_updateWallet",transaction)
        //TODO .error( error => ErrorStore.onAdd( "wallet", "incrementBrainKeySequence", error ))
    },
    _updateWallet({state},transaction = transaction_update()) {
        var wallet = state.wallet
        if (!wallet) {
            reject("missing wallet")
            return
        }
        //DEBUG console.log('... wallet',wallet)
        var wallet_clone = cloneDeep(wallet)
        wallet_clone.last_modified = new Date()

        WalletTcomb(wallet_clone) // validate

        var wallet_store = transaction.objectStore("wallet")
        var p = idb_helper.on_request_end(wallet_store.put(wallet_clone))
        var p2 = idb_helper.on_transaction_end(transaction).then(() => {
            state.wallet = wallet_clone
        })
        return Promise.all([p, p2])
    },
    saveKeys:({dispatch},{private_keys, transaction, public_key_string})=>{
        var promises = []
        for (let private_key_record of private_keys) {
            promises.push(
                dispatch("saveKey",{
                    private_key:private_key_record.private_key,
                    brainkey_sequence:private_key_record.sequence,
                    import_account_names:null, //import_account_names
                    public_key_string,
                    transaction
                })
            )       
        }
        return Promise.all(promises)
    },
    saveKey:async ({getters,state,dispatch},{private_key,
            brainkey_sequence,
            import_account_names,
            public_key_string,
            transaction = transaction_update_keys()})=>{

        var private_cipherhex = getters.aes_private.encryptToHex(private_key.toBuffer())
        var wallet = state.wallet
        if (!public_key_string) {
            //S L O W
            // console.log('WARN: public key was not provided, this may incur slow performance.-United Labs of BCTech.')
            var public_key = private_key.toPublicKey()
            public_key_string = public_key.toPublicKeyString()
        } else if (public_key_string.indexOf(ChainConfig.address_prefix) != 0)
            throw new Error("Public Key should start with " + ChainConfig.address_prefix)

        var private_key_object = {
            import_account_names,
            encrypted_key: private_cipherhex,
            pubkey: public_key_string,
            brainkey_sequence
        }
        var p1 =await dispatch("PrivateKeyStore/addKey",{private_key_object, transaction},{root:true}) 
        .then((ret) => {
            if (TRACE) console.log('... WalletDb.saveKey result', ret.result)
            return ret
        })
        return p1
    },
    backupDownload:({rootGetters,getters,dispatch})=>{
        // if(rootGetters["BackupStore/backup"].sha1){
        //     dispatch("BackupStore/download",null,{root:true}).then(res2=>{
        //         callback&&callback(res2);
        //     })
        // }else{
        if(!getters.wallet){
            return {code:154,message:"Please restore your wallet first"};
        }
        let backup_pubkey = getters.wallet.password_pubkey;
        return  Promise.all([
                    backup(backup_pubkey),
                    dispatch("WalletManagerStore/getBackupName",null,{root:true})
                ]).then(([contents,name])=>{
                    return dispatch("BackupStore/incommingBuffer",{name, contents},{root:true}).then(res=>{
                        if(res.code==1){
                        return dispatch("BackupStore/download",null,{root:true})
                        }else{
                            return res;
                        }
                    })
                })
        //}
    },
    setBackupDate:({getters,dispatch})=>{
        var wallet = getters.wallet
        wallet.backup_date = new Date()
        return dispatch("_updateWallet");
    },
    importKeysWorker:({dispatch,state},private_key_objs)=>{
        return new Promise((resolve, reject) => {
            var pubkeys = []
            for (let private_key_obj of private_key_objs)
                pubkeys.push(private_key_obj.public_key_string)
            var addyIndexPromise =dispatch("AddressIndex/addAll",pubkeys,{root:true});

            var private_plainhex_array = []
            for (let private_key_obj of private_key_objs)
                private_plainhex_array.push(private_key_obj.private_plainhex)

            // var AesWorker = require("worker?name=/[hash].js!../workers/AesWorker")
            // var worker = new AesWorker
            // worker.postMessage({
            //     private_plainhex_array,
            //     key: aes_private.key, iv: aes_private.iv
            // })
            
            console.log("AesWorker start");

            var {private_plainhex_array, iv, key} = {
                private_plainhex_array,
                key: state.aes_private.key, iv: state.aes_private.iv
            };

            var aes = new Aes(iv, key)
            var private_cipherhex_array = []
            for(let private_plainhex of private_plainhex_array) {
                var private_cipherhex = aes.encryptHex( private_plainhex )
                private_cipherhex_array.push( private_cipherhex )
            }
            // postMessage( private_cipherhex_array )
            console.log("AesWorker done");


            var _this = this
            state.saving_keys=true;

            // worker.onmessage = event => {
                try {
                    console.log("Preparing for private keys save");
                    var private_cipherhex_array =private_cipherhex_array
                    var enc_private_key_objs = []
                    for (let i = 0; i < private_key_objs.length; i++) {
                        var private_key_obj = private_key_objs[i]
                        var {import_account_names, public_key_string, private_plainhex} = private_key_obj
                        var private_cipherhex = private_cipherhex_array[i]
                        if (!public_key_string) {
                            // console.log('WARN: public key was not provided, this will incur slow performance')
                            var private_key = PrivateKey.fromHex(private_plainhex)
                            var public_key = private_key.toPublicKey() // S L O W
                            public_key_string = public_key.toPublicKeyString()
                        } else if (public_key_string.indexOf(ChainConfig.address_prefix) != 0)
                            throw new Error("Public Key should start with " + ChainConfig.address_prefix)

                        var private_key_object = {
                            import_account_names,
                            encrypted_key: private_cipherhex,
                            pubkey: public_key_string
                            // null brainkey_sequence
                        }
                        enc_private_key_objs.push(private_key_object)
                    }
                    console.log("Saving private keys", new Date().toString());
                    var transaction =transaction_update_keys()
                    var insertKeysPromise = idb_helper.on_transaction_end(transaction)
                    try {
                        var duplicate_count =dispatch("PrivateKeyStore/addPrivateKeys_noindex",{
                            private_key_objects:enc_private_key_objs,
                             transaction},{root:true})  
                            //
                        if (private_key_objs.length != duplicate_count)
                             dispatch("_updateWallet",transaction)
                         state.saving_keys=false;
                            resolve(Promise.all([insertKeysPromise, addyIndexPromise]).then(() => {
                                console.log("Done saving keys", new Date().toString())
                                // return { duplicate_count }
                            }))
                    } catch (e) {
                        transaction.abort()
                        console.error(e)
                        reject(e)
                    }
                } catch (e) {
                    console.error('AesWorker.encrypt', e)
                }
            // }
        })
    }
}
// const isLocked=()=>{
//     return aes_private ? false : true;
// }

const transaction_update=()=>{
    var transaction = iDB.instance().db().transaction(
        ["wallet"], "readwrite"
    )
    return transaction
}

const transaction_update_keys=()=>{
    var transaction = iDB.instance().db().transaction(
        ["wallet", "private_keys"], "readwrite"
    )
    return transaction
}

const mutations = {
  [types.SET_PASSWORD_KEY]:(state,keys)=>{
      state._passwordKey=keys;
  },
  [types.SET_AES_PRIVATE]:(state,aes_private)=>{
      state.aes_private=aes_private;
  }
}


export default {
    state: initialState,
    mutations,
    actions,
    getters,
    namespaced: true
  };