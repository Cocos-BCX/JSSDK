import {Apis} from "bcxjs-ws";
import idb_helper from "./idb-helper"
import iDBRoot from "./idb-root"

let DB_VERSION = 2 // Initial value was 1
const DB_PREFIX = "gph_v2"
const WALLET_BACKUP_STORES = [
    "wallet", "private_keys", "linked_accounts"
]

var current_wallet_name = "default";

var upgrade = function(db, oldVersion) {
    // DEBUG console.log('... upgrade oldVersion',oldVersion)
    if (oldVersion === 0) {
        db.createObjectStore("wallet", { keyPath: "public_name" })
        idb_helper.autoIncrement_unique(db, "private_keys", "pubkey")
        db.createObjectStore("linked_accounts", { keyPath: "name" })
    }
    if (oldVersion < 2) {
        // Cache only, do not backup...
        db.createObjectStore("cached_properties", { keyPath: "name" })
    }
}

/**
    Everything in this class is scopped by the database name.  This separates
    data per-wallet and per-chain. United Labs of BCTech.
*/
var getDatabaseName = function(
    current_wallet = current_wallet_name,
    chain_id = Apis.instance().chain_id) {
    return [
        DB_PREFIX,
        chain_id ? chain_id.substring(0, 6) : "",
        current_wallet
    ].join("_")
}

var openDatabase = function() {
    var database_name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getDatabaseName();

    return new Promise((resolve, reject) => {

        var openRequest = iDB.impl.open(database_name, DB_VERSION);

        openRequest.onupgradeneeded = function (e) {
            //  console.log('... openRequest.onupgradeneeded ' + database_name)1
            // Don't resolve here, indexedDb will call onsuccess or onerror next
            upgrade(e.target.result, e.oldVersion)
        };

        openRequest.onsuccess = function (e) {
            // console.log('... openRequest.onsuccess ' + database_name, e.target.result)
            var db = e.target.result
            iDB.database_name = database_name
            idb_helper.set_graphene_db(db)
            resolve(db);
        };

        openRequest.onerror = function (e) {
            // console.log("... openRequest.onerror " + database_name,e.target.error, e)
            reject(e.target.error);
        };
    })
}

var iDB = (function () {

    var _instance;
    var idb;

    /** Be carefull not to call twice especially for a new database
       needing an upgrade...
    */
    function openIndexedDB(chain_id) {
        return iDB.root.getProperty("current_wallet", "default").then(
            current_wallet => {
                current_wallet_name = current_wallet;
                var database_name = getDatabaseName(current_wallet, chain_id);
                return openDatabase(database_name)
        })
    }

    function init(chain_id) {
        let instance;
        let promise = openIndexedDB(chain_id);
        promise.then(db => {
            idb = db;
        });
        return {
            init_promise: promise,
            db: () => {
                return idb;
            }
        };
    }

    return {
        WALLET_BACKUP_STORES,
        getDatabaseName: getDatabaseName,
        getCurrentWalletName: ()=> current_wallet_name,
        deleteDatabase: function(are_you_sure = false) {
            // if( ! are_you_sure) return "Are you sure?"
            console.log("deleting", this.database_name)
            var req = iDB.impl.deleteDatabase(this.database_name)
             return req.result
        },
        
        set_impl: function(impl) {
            this.impl = impl
            this.root = new iDBRoot(this.impl)
        },
        
        set_chain_id: function(chain_id) {
            this.chain_id = chain_id
            var chain_substring = chain_id ? chain_id.substring(0, 6) : "";
            //this.root.setDbSuffix("_" + chain_substring)
            this.root.setDbSuffix("_" + chain_substring+"_"+current_wallet_name)
        },
        
        init_instance: function (
            indexedDBimpl,
            chain_id = Apis.instance().chain_id
        ) {
            if (!_instance) {
                if(indexedDBimpl) {
                    this.set_impl( indexedDBimpl )
                    if("__useShim" in indexedDBimpl) {
                        this.impl.__useShim() //always use shim
                    }
                }
                this.set_chain_id(chain_id)
                _instance = init(chain_id)
            }
            return _instance;
        },
        
        instance: function () {
            // if (!_instance) {
            //     throw new Error("Internal Database instance is not initialized");
            // }
            return _instance;
        },
        
        close: function () {
            if (_instance){
                _instance.db().close()
            };
            idb_helper.set_graphene_db(null)
            _instance = undefined
            // idb=null;
        },
        
        add_to_store: function (store_name, value) {
            return new Promise((resolve, reject) => {
                let transaction = this.instance().db().transaction([store_name], "readwrite");
                let store = transaction.objectStore(store_name);
                let request = store.add(value);
                request.onsuccess = () => { resolve(value); };
                request.onerror = (e) => {
                    console.log("ERROR!!! add_to_store - can't store value in db. ", e.target.error.message, value);
                    reject(e.target.error.message);
                };
            });
        },
        remove_from_store: function (store_name, value) {
            return new Promise((resolve, reject) => {
                let transaction = this.instance().db().transaction([store_name], "readwrite");
                let store = transaction.objectStore(store_name);
                let request = store.delete(value);
                request.onsuccess = () => { resolve(); };
                request.onerror = (e) => {
                    console.log("ERROR!!! remove_from_store - can't remove value from db. ", e.target.error.message, value);
                    reject(e.target.error.message);
                };
            });
        },
        load_data: function (store_name) {
            return new Promise((resolve, reject) => {
                let data = [];
                let transaction = this.instance().db().transaction([store_name], "readonly");
                let store = transaction.objectStore(store_name);
                let request = store.openCursor();
                //request.oncomplete = () => { resolve(data); };
                request.onsuccess = e => {
                    let cursor = e.target.result;
                    if (cursor) {
                        data.push(cursor.value);
                        cursor.continue();
                    } else {
                        resolve(data);
                    }
                };
                request.onerror = (e) => {
                    console.log("ERROR!!! open_store - can't get '`${store_name}`' cursor. ", e.target.error.message);
                    reject(e.target.error.message);
                };
            });
        },
        
        /** Persisted to disk but not backed up.
            @return promise
        */
        getCachedProperty: function(name, default_value) {
            var db = this.instance().db()
            var transaction = db.transaction(["cached_properties"], "readonly")
            var store = transaction.objectStore("cached_properties")
            return idb_helper.on_request_end( store.get(name) ).then( event => {
                var result = event.target.result
                return result ? result.value : default_value
            }).catch( error => { console.error(error); throw error })
        },
        
        /** Persisted to disk but not backed up. */
        setCachedProperty: function(name, value) {
            var db = this.instance().db()
            var transaction = db.transaction(["cached_properties"], "readwrite")
            var store = transaction.objectStore("cached_properties")
            if(value && value["toJS"]) value = value.toJS() //Immutable-js
            return idb_helper.on_request_end( store.put({name, value}) )
                .catch( error => { console.error(error); throw error })
        },
        
        backup: function (store_names = WALLET_BACKUP_STORES) {
            var promises = []
            for (var store_name of store_names) {
                promises.push(this.load_data(store_name))
            }
            //Add each store name
            return Promise.all(promises).then( results => {
                var obj = {}
                for (let i = 0; i < store_names.length; i++) {
                    var store_name = store_names[i]
                    if( store_name === "wallet" ) {
                        var wallet_array = results[i]
                        // their should be only 1 wallet per database
                        for(let wallet of wallet_array)
                            wallet.backup_date = new Date().toISOString()
                    }
                    obj[store_name] = results[i]
                }
                return obj
            })
        },
        restore: function(wallet_name, object) {
            var database_name = getDatabaseName(wallet_name)
            return openDatabase(database_name).then( db => {
                var store_names = Object.keys(object)
                var trx = db.transaction(store_names, "readwrite")
                for(let store_name of store_names) {
                    var store = trx.objectStore(store_name)

                    var records = object[store_name]
                    for(let record of records) {
                        store.put(record)
                    }
                }
                return idb_helper.on_transaction_end(trx)
            })
        }
    };

})();

export default iDB;
