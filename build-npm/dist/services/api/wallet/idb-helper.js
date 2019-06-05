"use strict";

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var db;
var idb_helper;

module.exports = idb_helper = {

    set_graphene_db: function set_graphene_db(database) {
        db = database;
    },

    trx_readwrite: function trx_readwrite(object_stores) {
        return db.transaction([object_stores], "readwrite");
    },

    on_request_end: function on_request_end(request) {
        //return request => {
        return new _promise2.default(function (resolve, reject) {
            request.onsuccess = new ChainEvent(request.onsuccess, resolve, request).event;
            request.onerror = new ChainEvent(request.onerror, reject, request).event;
        });
        //}(request)
    },

    on_transaction_end: function on_transaction_end(transaction) {
        return new _promise2.default(function (resolve, reject) {
            transaction.oncomplete = new ChainEvent(transaction.oncomplete, resolve).event;
            transaction.onabort = new ChainEvent(transaction.onabort, reject).event;
        });
    },

    /** Chain an add event.  Provide the @param store and @param object and
        this method gives you convenient hooks into the database events.
        United Labs of BCTech.
        @param event_callback (within active transaction)
        @return Promise (resolves or rejects outside of the transaction)
    */
    add: function add(store, object, event_callback) {
        return function (object, event_callback) {
            var request = store.add(object);
            var event_promise = null;
            if (event_callback) request.onsuccess = new ChainEvent(request.onsuccess, function (event) {
                event_promise = event_callback(event);
            }).event;

            var request_promise = idb_helper.on_request_end(request).then(function (event) {
                //DEBUG console.log('... object',object,'result',event.target.result,'event',event)
                if (event.target.result != void 0) {
                    //todo does event provide the keyPath name? (instead of id)
                    object.id = event.target.result;
                }
                return [object, event];
            });

            if (event_promise) return _promise2.default.all([event_promise, request_promise]);
            return request_promise;
        }(object, event_callback); //copy var references for callbacks
    },

    /** callback may return <b>false</b> to indicate that iteration should stop */
    cursor: function cursor(store_name, callback, transaction) {
        return new _promise2.default(function (resolve, reject) {
            if (!transaction) {
                transaction = db.transaction([store_name], "readonly");
                transaction.onerror = function (error) {
                    console.error("ERROR idb_helper.cursor transaction", error);
                    reject(error);
                };
            }

            var store = transaction.objectStore(store_name);
            var request = store.openCursor();
            request.onsuccess = function (e) {
                var cursor = e.target.result;
                var ret = callback(cursor, e);
                if (ret === false) resolve();
                if (!cursor) resolve(ret);
            };
            request.onerror = function (e) {
                var error = {
                    error: e.target.error.message,
                    data: e
                };
                console.log("ERROR idb_helper.cursor request", error);
                reject(error);
            };
        }).then();
    },

    autoIncrement_unique: function autoIncrement_unique(db, table_name, unique_index) {
        return db.createObjectStore(table_name, { keyPath: "id", autoIncrement: true }).createIndex("by_" + unique_index, unique_index, { unique: true });
    }

};

var ChainEvent = function ChainEvent(existing_on_event, callback, request) {
    (0, _classCallCheck3.default)(this, ChainEvent);

    this.event = function (event) {
        if (event.target.error) console.error("---- transaction error ---->", event.target.error);
        //event.request = request
        callback(event);
        if (existing_on_event) existing_on_event(event);
    };
};