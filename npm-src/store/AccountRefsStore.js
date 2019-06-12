import * as types from '../mutations';
import iDB from "../services/api/wallet/idb-instance";
import Immutable from "immutable";
import {ChainStore} from "bcxjs-cores";
import PrivateKeyStore from "../modules/PrivateKeyStore"
import API from '../services/api';

let _chainstore_account_ids_by_key;
let _no_account_refs;
const initialState = {
    account_refs: Immutable.Set()
};
const getters={
    account_refs:state=>state.account_refs
}

const actions={
    loadDbData:({commit,dispatch})=>{
        commit("_getInitialState");
        return loadNoAccountRefs()
            .then( no_account_refs => _no_account_refs = no_account_refs )
            .then( ()=> {
                chainStoreUpdate({dispatch})
            } )
    },
    checkPrivateKeyStore:async ({rootGetters,state})=>{
        var no_account_refs =_no_account_refs;
        var account_refs = Immutable.Set();
        //.keySeq()
        let keys= rootGetters["PrivateKeyStore/keys"];
        await Promise.all(Object.keys(keys).map(async pubkey => {
            if(no_account_refs.has(pubkey)) return

            var refs;
            if(pubkey!="undefined"){
                refs =await API.Account.getAccountIdByOwnerPubkey(pubkey)//ChainStore.getAccountRefsOfKey(pubkey)
                refs=Immutable.fromJS(refs);
            }
            if(refs === undefined) return
            if( ! refs.size) {
                // Performance optimization... 
                // There are no references for this public key, this is going
                // to block it.  There many be many TITAN keys that do not have
                // accounts for example. United Labs of BCTech.
                {
                    // Do Not block brainkey generated keys.. Those are new and
                    // account references may be pending.
                    var private_key_object =  rootGetters["PrivateKeyStore/keys"][pubkey]
                    if( typeof private_key_object.brainkey_sequence === 'number' ) {
                        return
                    }
                }
                no_account_refs = no_account_refs.add(pubkey)
                return
            }
            account_refs = account_refs.add(refs.valueSeq())
        }));

        account_refs = account_refs.flatten()
        await Promise.all(account_refs.map(async account => {
            let refs =await API.Account.getAccountRefsOfAccount(account); //ChainStore.getAccountRefsOfAccount(account);
            refs=Immutable.fromJS(refs);
            if(refs === undefined) return;
            if( ! refs.size) return;
            account_refs = account_refs.add(refs.valueSeq());
        }))

        account_refs = account_refs.flatten();

        if( ! state.account_refs.equals(account_refs)) {
            // console.log("AccountRefsStore account_refs",account_refs.size);
           state.account_refs=account_refs;
        }
        if(!_no_account_refs.equals(no_account_refs)) {
            _no_account_refs= no_account_refs
            saveNoAccountRefs(no_account_refs)
        }
    }
}

function saveNoAccountRefs(no_account_refs) {
    var array = []
    for(let pubkey of no_account_refs) array.push(pubkey)
    iDB.root.setProperty("no_account_refs", array)
}

// Performance optimization for large wallets
function loadNoAccountRefs() {
    return iDB.root.getProperty("no_account_refs", [])
        .then( array => Immutable.Set(array) )
}

var  chainStoreUpdate=({dispatch})=>{
    if(_chainstore_account_ids_by_key === ChainStore.account_ids_by_key) return
    _chainstore_account_ids_by_key = ChainStore.account_ids_by_key;
    dispatch("checkPrivateKeyStore")
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
