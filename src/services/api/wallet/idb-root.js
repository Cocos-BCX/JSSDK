import idb_helper from "./idb-helper"
import {Apis} from "bcxjs-ws";

const DB_VERSION_MAIN = 1
const DB_PREFIX = "gph_db"

/** Usage: openIndexDB.then( db => ... */
export default class iDBRoot {
    
    constructor(impl) {
        this.impl = impl
    }
    
    setDbSuffix(db_suffix) {
        // "graphene_db_06f667"
        this.database_name = DB_PREFIX + db_suffix
    }
    
    /** @return promise */
    openIndexedDB() {
        if(this.db) return Promise.resolve(this.db)
        return new Promise( (resolve, reject) => {
            var openRequest = this.impl.open(this.database_name, DB_VERSION_MAIN)
            openRequest.onupgradeneeded = e => {
                this.db = e.target.result
                this.db.createObjectStore("properties", { keyPath: "name" })
            }
            openRequest.onsuccess = e => {
                this.db = e.target.result
                resolve(this.db)
            }
            openRequest.onerror = e => {
                reject(e.target.error)
            }
        })
    }
    
    /** @return promise */
    getProperty(name, default_value) {
        return this.openIndexedDB().then( db => {
            var transaction = db.transaction(["properties"], "readonly")
            var store = transaction.objectStore("properties")
            return idb_helper.on_request_end( store.get(name) ).then( event => {
                var result = event.target.result
                return result ? result.value : default_value
            })
        }).catch( error => { console.error(error); throw error })
    }
    
    /** @return promise */
    setProperty(name, value) {
        return this.openIndexedDB().then( db => {
            var transaction = db.transaction(["properties"], "readwrite")
            var store = transaction.objectStore("properties")
            if(value && value["toJS"]) value = value.toJS() //Immutable-js
            return idb_helper.on_request_end( store.put({name, value}) )
        }).catch( error => { console.error(error); throw error })
    }
    
    deleteDatabase(are_you_sure = false) {
        if( ! are_you_sure) return "Are you sure?"
        console.log("deleting", this.database_name)
        var req = iDB.impl.deleteDatabase(this.database_name)
        return req.result
    }
    
    close() {
        this.db.close()
        this.db = null
    }
    
}
