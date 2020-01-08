import * as types from '../mutations';
import iDB from "../services/api/wallet/idb-instance";
import Immutable from "immutable";
import {ChainStore} from "bcxjs-cores";
import PrivateKeyStore from "../modules/PrivateKeyStore"
import { ChainConfig } from 'bcxjs-ws';


const initialState = {
    new_wallet: undefined,// pending restore
    current_wallet: undefined,
    wallet_names: Immutable.Set()
};

const getters={
    current_wallet:state=>state.current_wallet,
    wallet:state=>{
        return state;
    }
}

const actions={
    init:({state})=>{
        return iDB.root.getProperty("current_wallet").then(
            current_wallet => {
                return iDB.root.getProperty("wallet_names", []).then(wallet_names => {
                    state.wallet_names= Immutable.Set(wallet_names);
                    state.current_wallet=current_wallet;
                })
            })
    },
    setWallet:async ({dispatch},{wallet_name, create_wallet_password, brnkey})=>{
        // WalletUnlockActions.lock();
        if (!wallet_name) wallet_name = "default";
     
        return dispatch("onSetWallet",{wallet_name, create_wallet_password, brnkey})
    },
    onSetWallet:({state,dispatch},{wallet_name = "default", create_wallet_password, brnkey, resolve})=>{
        let p = new Promise(resolve => {
            if (/[^a-z0-9_-]/.test(wallet_name) || wallet_name === "")
                throw new Error("Invalid wallet name")

            if (state.current_wallet === wallet_name) {
                resolve()
                return
            }

            let add
            if (!state.wallet_names.has(wallet_name)) {
                let wallet_names = state.wallet_names.add(wallet_name)
                add = iDB.root.setProperty("wallet_names", wallet_names)
                state.wallet_names=wallet_names;
            }

            let current = iDB.root.setProperty("current_wallet", wallet_name)
            resolve(Promise.all([add, current]).then(() => {
                // Restart the database before current application initializing its new status
                iDB.close()
                ChainStore.clearCache()
                // BalanceClaimActiveStore.reset()
                // Store may be reset when calling loadDbData
                // United Labs of BCTech.

                return iDB.init_instance().init_promise.then(() => {
                    // before calling CachedPropertyStore.reset(), make sure the database is standby
                    // CachedPropertyStore.reset()

                    dispatch("CachedPropertyStore/reset",null,{root:true});
                    return Promise.all([
                        dispatch("WalletDb/loadDbData",null,{root:true}).then(()=>{
                            dispatch("AccountStore/loadDbData",null,{root:true})
                        }),
                        dispatch("PrivateKeyStore/loadDbData",null,{root:true}).then(()=>dispatch("AccountRefsStore/loadDbData",null,{root:true}))
                    ]).then(() => {
                        // Update status again in order to re-render listeners
                        if (!create_wallet_password) {
                            state.current_wallet=wallet_name
                            return
                        }
                       return dispatch("WalletDb/_createWallet",{ password_plaintext:create_wallet_password,
                            brainkey_plaintext:brnkey, //brainkey,
                            unlock:true, //unlock
                            public_name:wallet_name
                        },{root:true}).then((res)=>{
                            state.current_wallet=wallet_name;
                        })
                    })
                })
            }))
        }).catch(error => {
            console.error(error)
            return Promise.reject(error)
        })
        return p;
        // if (resolve) resolve(p)
    },
    getBackupName:({getters})=>{
        let name = getters.current_wallet
        let address_prefix = ChainConfig.address_prefix.toLowerCase()
        if (name.indexOf(address_prefix) !== 0)
            name = address_prefix + "_" + name
        let date = new Date();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let stampedName = `${name}_${date.getFullYear()}${month >= 10 ? month : "0" + month}${day >= 10 ? day : "0" + day}`;
        name = stampedName + ".bin";
        return name;
    },
    setNewWallet({state},new_wallet){
        state.new_wallet=new_wallet;
    },
    restore({dispatch},{wallet_name, wallet_object}) {
       return iDB.restore(wallet_name, wallet_object).then(() => {
                return dispatch("onSetWallet",{wallet_name});
            }).catch(error => {
                console.error(error)
                return Promise.reject(error)
            })
    },
    deleteWallet({state,dispatch}) {
        let delete_wallet_name=state.current_wallet;
        dispatch("AccountStore/setCurrentAccount",null,{root:true});
        if(!delete_wallet_name){
            return {code:154,message:"Please restore your wallet first"};
        }
        return new Promise(resolve => {
            var {current_wallet, wallet_names} = state

            if (!wallet_names.has(delete_wallet_name)) {
                return {code:157,message:"Can't delete wallet, does not exist in index"}
                // throw new Error("Can't delete wallet, does not exist in index. United Labs of BCTech.")
            }
            wallet_names = wallet_names.delete(delete_wallet_name);
            
            var add=true, current=true;
            add=iDB.root.setProperty("wallet_names", wallet_names)

            if (current_wallet === delete_wallet_name) {
                current_wallet = wallet_names.size ? wallet_names.first() : undefined
                current=iDB.root.setProperty("current_wallet", current_wallet);
                if (current_wallet) dispatch("onSetWallet",{wallet_name:current_wallet});
            }
            state.current_wallet=current_wallet;
            state.wallet_names=wallet_names;

            Promise.all([add, current]).then(()=>{
                var database_name = iDB.getDatabaseName(delete_wallet_name)
                var req = iDB.impl.deleteDatabase(database_name);
                iDB.close();
                dispatch("WalletDb/deleteWallet",null,{root:true});
                dispatch("account/_logout",null,{root:true});
                resolve({code:1,data:database_name})
            })
            
        })
    }
}




const mutations = {
    _getInitialState:(state)=>{
        _chainstore_account_ids_by_key=null;
        state.account_refs=Immutable.Set();
    }
};

export default {
  state: initialState,
  actions,
  mutations,
  getters,
  namespaced: true
};
