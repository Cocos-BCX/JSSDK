import * as types from '../mutations';
import iDB from "../services/api/wallet/idb-instance";
import {key} from "bcxjs-cores";
import {ChainConfig} from "bcxjs-ws";
import Immutable from "immutable"

var _saveAddyMapTimeout=0;
var _loadAddyMapPromise;
const initialState = {
    addresses: Immutable.Map(),
    saving: false,
    pubkeys: new Set()
};
const getters={
}

const actions={
    add:({dispatch,state},pubkey)=>{
        dispatch("loadAddyMap").then( () => {
            var dirty = false
            if(state.pubkeys[pubkey]) return
            state.pubkeys.add(pubkey);
            dispatch("saving")
            // Gather all 5 legacy address formats (see key.addresses)
            var address_strings = key.addresses(pubkey)
            for(let address of address_strings) {
                state.addresses = state.addresses.set(address, pubkey)
                dirty = true
            }
            if( dirty ) {
                dispatch("saveAddyMap");
            } else state.saving=false;
        }).catch ( e => { throw e })
    },
    /** Worker thread implementation (for more than 10K keys) */
    addAll:({dispatch,state},pubkeys)=>{
        return new Promise( (resolve, reject) => {
            state.saving=true;
            dispatch("loadAddyMap").then(()=>{
                 // var AddressIndexWorker = require("worker?name=/[hash].js!../workers/AddressIndexWorker")
                // var worker = new AddressIndexWorker
                // worker.postMessage({ pubkeys, address_prefix: ChainConfig.address_prefix });


                // try {
                //     console.log("AddressIndexWorker start");
                //     var {pubkeys, address_prefix} = event.data
                //     var results = []
                //     for (let pubkey of pubkeys) {
                //         results.push( key.addresses(pubkey, address_prefix) )
                //     }
                //     postMessage( results )
                //     console.log("AddressIndexWorker done");
                // } catch( e ) { 
                //     console.error("AddressIndexWorker", e) 
                // } 
                // console.info("key",key);
                let results=[key.addresses(pubkeys[0],ChainConfig.address_prefix)];
                  try {
                    var key_addresses = results
                    var dirty = false
                    var addresses = state.addresses.withMutations( addresses => {
                        for(let i = 0; i < pubkeys.length; i++) {
                            var pubkey = pubkeys[i]
                            if(state.pubkeys.has(pubkey)) continue
                            state.pubkeys.add(pubkey)
                            // Gather all 5 legacy address formats (see key.addresses)
                            var address_strings = key_addresses[i]
                            for(let address of address_strings) {
                                addresses.set(address, pubkey)
                                dirty = true
                            }
                        }
                    })
                    if( dirty ) {
                        state.addresses=addresses;
                        dispatch("saveAddyMap");
                    } else {
                        state.saving=false;
                    }
                    resolve()
                } catch( e ) { console.error('AddressIndex.addAll', e); reject(e) }
            }).catch ( e => { throw e })
        })
    },
    loadAddyMap:({commit,state})=>{
        if(_loadAddyMapPromise) return _loadAddyMapPromise
        _loadAddyMapPromise = iDB.root.getProperty("AddressIndex").then( map => {
            state.addresses = map ? Immutable.Map(map) : Immutable.Map()
            // console.log("AddressIndex load", this.state.addresses.size)
             state.addresses.valueSeq().forEach( pubkey => state.pubkeys.add(pubkey) )
        })
        return _loadAddyMapPromise;
    },
    saving:({state})=>{
        if( state.saving ) return
        state.saving = true
    },
    
    saveAddyMap:({state})=>{
        clearTimeout(_saveAddyMapTimeout)
        _saveAddyMapTimeout = setTimeout(()=> {
            console.log("AddressIndex save", state.addresses.size)
            state.saving=false;
            // If indexedDB fails to save, it will re-try via PrivateKeyStore calling this.add
            return iDB.root.setProperty("AddressIndex", state.addresses.toObject())
        }, 100)
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
