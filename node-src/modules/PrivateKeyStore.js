import Vue from 'vue';
import * as types from '../mutations';
import {PublicKey, ChainStore, Aes} from "bcxjs-cores";
import idb_helper from "../services/api/wallet/idb-helper";
import {PrivateKeyTcomb} from "../store/tcomb_structs";


import Immutable from "immutable";

const initialState = {
    keys:{},
    app_keys:[],

    privateKeyStorage_error: false,
    pending_operation_count: 0,
    privateKeyStorage_error_add_key: null,
    privateKeyStorage_error_loading: null
};

const getters={
    keys:state=>state.keys,
    app_keys:state=>state.app_keys,
    getTcomb_byPubkey:state=>{
        return public_key => {
            if(! public_key) return null;
            if(public_key.Q)
                public_key = public_key.toPublicKeyString();
            return state.keys[public_key];
        };
    },
    getPubkeys_having_PrivateKey:state=>{
       return (pubkeys, addys = null)=>{
            let _pubkeys = [];
            if(pubkeys) {
                for(let pubkey of pubkeys) {
                    if(state.keys[pubkey]) {
                        _pubkeys.push(pubkey);
                    }
                }
            }
            return _pubkeys;
       }
    },
    decodeMemo:state=>{
        return (memo,store)=>{
            let lockedWallet = false;
            let memo_text, isMine = false;
            let from_private_key = state.keys[memo.from];
            let to_private_key = state.keys[memo.to];
            let private_key = from_private_key ? from_private_key : to_private_key;
            let public_key = from_private_key ? memo.to : memo.from;
            public_key = PublicKey.fromPublicKeyString(public_key)
            try {
                private_key =store.getters["WalletDb/decryptTcomb_PrivateKey"](private_key);//WalletDb.decryptTcomb_PrivateKey(private_key);
            }
            catch (e) {
                // Failed because wallet is locked
                lockedWallet = true;
                private_key = null;
                isMine = true;
            }
            let code=1;
            if (private_key) {
                let tryLegacy = false;
                try {
                    memo_text = private_key ? Aes.decrypt_with_checksum(
                        private_key,
                        public_key,
                        memo.nonce,
                        memo.message
                    ).toString("utf-8") : null;
                    if (private_key && !memo_text) {
                        // debugger
                    }
                } catch (e) {
                    console.log("transfer memo exception ...", e);
                    memo_text = "*";
                    tryLegacy = true;
                    code=184;
                }
        
                // Apply legacy method if new, correct method fails to decode
                if (private_key && tryLegacy) {
                    // debugger;
                    try {
                        memo_text = Aes.decrypt_with_checksum(
                            private_key,
                            public_key,
                            memo.nonce,
                            memo.message,
                            true
                        ).toString("utf-8");
                    } catch (e) {
                        console.log("transfer memo exception ...", e);
                        memo_text = "**";
                        code=184;
                    }
                }
            }    
            return {
                text: memo_text,
                isMine
            }
        }
    }
}

const actions = {
    setKeys:({commit}, key) => {
        commit(types.SET_KEYS,key)
    },
    clearKeys:({commit})=>{
        commit(types.CLEAR_KEYS);
    },
    setAppkeys:({commit},keys)=>{
        commit(types.SET_APP_KEYS,keys)
    },
    decodeMemo:async ({commit,state,dispatch},memo)=>{
        let lockedWallet = false;
        let memo_text, isMine = false;
        let from_private_key = state.keys[memo.from];
        let to_private_key = state.keys[memo.to];
        let private_key = from_private_key ? from_private_key : to_private_key;
        let public_key = from_private_key ? memo.to : memo.from;
        public_key = PublicKey.fromPublicKeyString(public_key)
    
        try {
            private_key =await dispatch("WalletDb/decryptTcomb_PrivateKey",private_key,{root:true});//WalletDb.decryptTcomb_PrivateKey(private_key);
        }
        catch (e) {
            // Failed because wallet is locked
            lockedWallet = true;
            private_key = null;
            isMine = true;
        }
        if (private_key) {
            let tryLegacy = false;
            try {
                memo_text = private_key ? Aes.decrypt_with_checksum(
                    private_key,
                    public_key,
                    memo.nonce,
                    memo.message
                ).toString("utf-8") : null;
                if (private_key && !memo_text) {
                    // debugger
                }
            } catch (e) {
                console.log("transfer memo exception ...", e);
                memo_text = "*";
                tryLegacy = true;
            }
    
            // Apply legacy method if new, correct method fails to decode
            if (private_key && tryLegacy) {
                // debugger;
                try {
                    memo_text = Aes.decrypt_with_checksum(
                        private_key,
                        public_key,
                        memo.nonce,
                        memo.message,
                        true
                    ).toString("utf-8");
                } catch (e) {
                    console.log("transfer memo exception ...", e);
                    memo_text = "**";
                }
            }
        }

        return {
            text: memo_text,
            isMine
        }
    },
    loadDbData:({commit,state,dispatch})=>{
        commit("_getInitialState");
        commit("pendingOperation");
        var p = idb_helper.cursor("private_keys", cursor => {
            if (!cursor) {
                //state.keys={};
                return
            }
            var private_key_tcomb = PrivateKeyTcomb(cursor.value)
            commit(types.SET_KEYS,PrivateKeyTcomb(private_key_tcomb))
            dispatch("AddressIndex/add",private_key_tcomb.pubkey,{root:true});
            cursor.continue()
        }).then(() => {
           setTimeout(() => {
            dispatch("pendingOperationDone"); 
           }, 2000);
        }).catch(error => {
            commit("_getInitialState");
            throw error
        })
        return p;
    },
    pendingOperationDone({state}) {
        // console.info("state.pending_operation_count11111111",state.pending_operation_count);

        if (state.pending_operation_count == 0){
            // console.log("Pending operation done called too many times")
        }
            // throw new Error("Pending operation done called too many times")
        state.pending_operation_count--
    },
    addKey:({state,dispatch,commit},{private_key_object, transaction, resolve})=>{// resolve is deprecated
        if(state.keys[private_key_object.pubkey]) {
            resolve({result:"duplicate",id:null});
            return;
        }
        commit("pendingOperation")
        //console.log("... onAddKey private_key_object.pubkey", private_key_object.pubkey)
        //console.info("state.keys",state.keys);
        // state.keys = state.keys.set(
        //     private_key_object.pubkey,
        //     PrivateKeyTcomb(private_key_object)
        // );
        commit(types.SET_KEYS,PrivateKeyTcomb(private_key_object))
        // Vue.set(state.keys,private_key_object.pubkey, PrivateKeyTcomb(private_key_object));

        dispatch("AddressIndex/add",private_key_object.pubkey,{root:true});

        let p = new Promise((resolve, reject) => {
            PrivateKeyTcomb(private_key_object);
            let duplicate = false;
            let p = idb_helper.add(
                transaction.objectStore("private_keys"),
                private_key_object
            );

            //console.log("p:", p);
            p.catch( event => {
                // ignore_duplicates
                let error = event.target.error;
                console.log("... error", error, event);
                if( error.name != "ConstraintError" ||
                    error.message.indexOf("by_encrypted_key") == -1
                ) {
                    //this.privateKeyStorageError("add_key", error);
                    throw event;
                }
                duplicate = true;
                event.preventDefault();
            }).then( ()=> {
                dispatch("pendingOperationDone"); 
                if(duplicate) return {result:"duplicate",id:null};
                if( private_key_object.brainkey_sequence == null)
                    //this.binaryBackupRecommended(); // non-deterministic
                    disconnect("CachedPropertyStore/set",{name:"backup_recommended", value:true});
                idb_helper.on_transaction_end(transaction).then(
                    () => { 

                        //this.setState({ keys: this.state.keys }); 
                    } );
                return {
                    result: "added",
                    id: private_key_object.id
                };
            });
            resolve(p);
        });
        return p;
    },
    addPrivateKeys_noindex:({state,dispatch},{private_key_objects, transaction})=>{
        var store = transaction.objectStore("private_keys")
        var duplicate_count = 0

        var keys = Immutable.fromJS(state.keys).withMutations(keys => {
            for (let private_key_object of private_key_objects) {
                if (state.keys[private_key_object.pubkey]) {
                    duplicate_count++
                    continue
                }
                var private_tcomb = PrivateKeyTcomb(private_key_object)
                store.add(private_key_object)
                keys.set(private_key_object.pubkey, private_tcomb)
                ChainStore.getAccountRefsOfKey(private_key_object.pubkey)
            }
        })
        state.keys=keys.toJS();
        binaryBackupRecommended(dispatch);
        return duplicate_count
    }
}

function binaryBackupRecommended(dispatch){
    dispatch("CachedPropertyStore/Set",{ name:"backup_recommended", value:true },{root:true});
}

const mutations = {
  [types.SET_KEYS]: (state,key) => {
    Vue.set(state.keys,key.pubkey,key);
  },
  [types.SET_APP_KEYS]:(state,keys)=>{
      state.app_keys=keys;
  },
  [types.CLEAR_KEYS]:(state)=>{
      state.keys={};
    //state.app_keys=[];
  },
  pendingOperation:(state)=>{
    state.pending_operation_count++
  },
  _getInitialState:(state)=>{
    state.privateKeyStorage_error=false;
    state.pending_operation_count=0;
    state.privateKeyStorage_error_add_key=null;
    state.privateKeyStorage_error_loading=null;
  }
}


export default {
    state: initialState,
    mutations,
    actions,
    getters,
    namespaced: true
  };