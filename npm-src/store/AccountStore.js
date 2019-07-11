import * as types from '../mutations';
import iDB from "../services/api/wallet/idb-instance";
import Immutable from "immutable";
import {ChainStore, ChainValidation, FetchChain} from "bcxjs-cores";
import PrivateKeyStore from "../modules/PrivateKeyStore"
import {Apis} from "bcxjs-ws";
import ls from "../lib/common/localStorage";
import API from '../services/api';
import { resolve } from 'url';

const STORAGE_KEY = "__gph__";

let accountStorage = new ls(STORAGE_KEY)

let _chainstore_account_ids_by_key;
let _no_account_refs;

const initialState = {
    update: false,
    subbed: false,
    currentAccount: null,
    linkedAccounts: Immutable.Set(),
    myIgnoredAccounts: Immutable.Set(),
    unFollowedAccounts: Immutable.Set(process.browser?accountStorage.get("unfollowed_accounts", []):[]),
    searchAccounts: Immutable.Map(),
    searchTerm: "",
    initial_account_refs_load:true,
    account_refs:null
};

const getters={
    linkedAccounts:state=>state.linkedAccounts
}

const actions={
    loadDbData:({dispatch,state})=>{
        var linkedAccounts = Immutable.Set().asMutable();
        let chainId = Apis.instance().chain_id;
        return new Promise((resolve, reject) => {
            iDB.load_data("linked_accounts")
            .then(data => {
                if(!data.length){
                    //config current account
                    accountStorage.set("currentAccount", null);
                }
                let accountPromises = data.filter(a => {
                    if (a.chainId) {
                        return a.chainId === chainId;
                    } else {
                        return true;
                    }
                }).map(a => {
                    linkedAccounts.add(a.name);
                    dispatch("_addIgnoredAccount",a.name)
                    return FetchChain("getAccount", a.name);
                });
                Promise.all(accountPromises).then(results => {
                    state.linkedAccounts=linkedAccounts.asImmutable();
                    dispatch("tryToSetCurrentAccount",null).then(acc_res=>{
                        ChainStore.subscribe(()=>{
                            dispatch("chainStoreUpdate");
                        });
                        resolve();
                        state.subbed=true;
                    });
                }).catch(err => {
                    ChainStore.subscribe(()=>{
                        dispatch("chainStoreUpdate");
                    });     
                    state.subbed=true;
                    reject(err);
                });
            }).catch(err => {
				// alert(err);
                reject(err);
            });
        });

    },
    _addIgnoredAccount({state},name) {
        if (state.unFollowedAccounts.includes(name) && !state.myIgnoredAccounts.has(name)) {
           state.myIgnoredAccounts =state.myIgnoredAccounts.add(name);
        }
    },
    chainStoreUpdate:({dispatch,state})=>{
        if(state.update) {
            state.update=false;
        }        
        dispatch("addAccountRefs");
    },
    addAccountRefs:({rootGetters,state,dispatch})=>{
        //  Simply add them to the linkedAccounts list (no need to persist them)
        var account_refs =rootGetters["AccountRefsStore/account_refs"];
        if( ! state.initial_account_refs_load && state.account_refs === account_refs) return
        state.account_refs = account_refs
        var pending = false
        state.linkedAccounts = state.linkedAccounts.withMutations(linkedAccounts => {
            account_refs.forEach(id => {
                var account = ChainStore.getAccount(id);
                    if (account === undefined) {
                    pending = true
                    return
                }
                if (account && !state.unFollowedAccounts.includes(account.get("name"))) {
                    linkedAccounts.add(account.get("name"));
                } else {
                    dispatch("_addIgnoredAccount",account.get("name"))
                }
            })
        })
        state.initial_account_refs_load = pending;
        dispatch("tryToSetCurrentAccount")
    },
    tryToSetCurrentAccount:({dispatch,state})=>{
        if (accountStorage.get("currentAccount", null)) {
            return dispatch("setCurrentAccount",accountStorage.get("currentAccount", null));
        }
        if (state.linkedAccounts.size) {
           return dispatch("setCurrentAccount",state.linkedAccounts.first())
        }
        return true;
    },
    setCurrentAccount:async ({dispatch,state},name)=>{
        let isCreateAccount=false;
        if(name&&typeof name=="object"){
            isCreateAccount=!!name.isCreateAccount;
            name=name.account;
        }
        if (!name) {
            state.currentAccount = null;
            state.linkedAccounts=Immutable.Set();
        } else {
            state.currentAccount = name
            state.linkedAccounts=state.linkedAccounts.add(name);
        }
        accountStorage.set("currentAccount", state.currentAccount);
        if(name){
            return new Promise(resolve=>{
                setTimeout(()=>{
                    dispatch("user/fetchUserForIsSave",{nameOrId:name,isSave:true},{root:true}).then(acc_res=>{
                        delete acc_res.success;
                        resolve(acc_res)
                    });
                },isCreateAccount?2000:100);
            })
        }else{
            return {code:0,message:"Name can not be empty"};
        }
    },
    onCreateAccount:({state,dispatch},{name_or_account,owner_pubkey})=>{
        var account = name_or_account;
        if (typeof account === "string") {
            account = {
                name: account
            };
        }

        if(account["toJS"])
            account = account.toJS()

        if(account.name == "" || state.linkedAccounts.get(account.name))
            return Promise.resolve()

        if( ! ChainValidation.is_account_name(account.name))
            throw new Error("Invalid account name: " + account.name)
        return iDB.add_to_store("linked_accounts", {
            name: account.name,
            chainId: Apis.instance().chain_id
        }).then(() => {
            //console.log("[AccountStore.js] ----- Added account to store: ----->", account.name);
            // return dispatch("AccountRefsStore/loadDbData",null,{root:true}).then(()=>{
            //     return dispatch("loadDbData").then(()=>{
                  
            //     })  
            // })  
            state.linkedAccounts = state.linkedAccounts.add(account.name);

            if (state.linkedAccounts.size === 1) {
                return dispatch("setCurrentAccount",{account:account.name,isCreateAccount:true}).then((acc_res)=>{
                    if(owner_pubkey){
                        return API.Account.getAccountIdByOwnerPubkey(owner_pubkey).then(userId=>{
                            let id = userId && userId[0];
                            if(id){
                                id=userId[0];
                                dispatch("account/account_signup_complete",{userId:id},{root:true});
                                return id;
                            }
                        })
                    }
                });  
            }else{
                return {code:1}
            }        
        });
    }
}


const mutations = {
};

export default {
  state: initialState,
  actions,
  mutations,
  getters,
  namespaced: true
};
