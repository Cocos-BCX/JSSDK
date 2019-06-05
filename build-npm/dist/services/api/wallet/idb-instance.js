"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _bcxjsWs = require("bcxjs-ws");

var _idbHelper = require("./idb-helper");

var _idbHelper2 = _interopRequireDefault(_idbHelper);

var _idbRoot = require("./idb-root");

var _idbRoot2 = _interopRequireDefault(_idbRoot);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DB_VERSION = 2; // Initial value was 1
var DB_PREFIX = "gph_v2";
var WALLET_BACKUP_STORES = ["wallet", "private_keys", "linked_accounts"];

var current_wallet_name = "default";

var upgrade = function upgrade(db, oldVersion) {
    // DEBUG console.log('... upgrade oldVersion',oldVersion)
    if (oldVersion === 0) {
        db.createObjectStore("wallet", { keyPath: "public_name" });
        _idbHelper2.default.autoIncrement_unique(db, "private_keys", "pubkey");
        db.createObjectStore("linked_accounts", { keyPath: "name" });
    }
    if (oldVersion < 2) {
        // Cache only, do not backup...
        db.createObjectStore("cached_properties", { keyPath: "name" });
    }
};

/**
    Everything in this class is scopped by the database name.  This separates
    data per-wallet and per-chain. United Labs of BCTech.
*/
var getDatabaseName = function getDatabaseName() {
    var current_wallet = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : current_wallet_name;
    var chain_id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _bcxjsWs.Apis.instance().chain_id;

    return [DB_PREFIX, chain_id ? chain_id.substring(0, 6) : "", current_wallet].join("_");
};

var openDatabase = function openDatabase() {
    var database_name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getDatabaseName();

    return new _promise2.default(function (resolve, reject) {

        var openRequest = iDB.impl.open(database_name, DB_VERSION);

        openRequest.onupgradeneeded = function (e) {
            //  console.log('... openRequest.onupgradeneeded ' + database_name)1
            // Don't resolve here, indexedDb will call onsuccess or onerror next
            upgrade(e.target.result, e.oldVersion);
        };

        openRequest.onsuccess = function (e) {
            // console.log('... openRequest.onsuccess ' + database_name, e.target.result)
            var db = e.target.result;
            iDB.database_name = database_name;
            _idbHelper2.default.set_graphene_db(db);
            resolve(db);
        };

        openRequest.onerror = function (e) {
            // console.log("... openRequest.onerror " + database_name,e.target.error, e)
            reject(e.target.error);
        };
    });
};

var iDB = function () {

    var _instance;
    var idb;

    /** Be carefull not to call twice especially for a new database
       needing an upgrade...
    */
    function openIndexedDB(chain_id) {
        return iDB.root.getProperty("current_wallet", "default").then(function (current_wallet) {
            current_wallet_name = current_wallet;
            var database_name = getDatabaseName(current_wallet, chain_id);
            return openDatabase(database_name);
        });
    }

    function init(chain_id) {
        var instance = void 0;
        var promise = openIndexedDB(chain_id);
        promise.then(function (db) {
            idb = db;
        });
        return {
            init_promise: promise,
            db: function db() {
                return idb;
            }
        };
    }

    return {
        WALLET_BACKUP_STORES: WALLET_BACKUP_STORES,
        getDatabaseName: getDatabaseName,
        getCurrentWalletName: function getCurrentWalletName() {
            return current_wallet_name;
        },
        deleteDatabase: function deleteDatabase() {
            var are_you_sure = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            // if( ! are_you_sure) return "Are you sure?"
            console.log("deleting", this.database_name);
            var req = iDB.impl.deleteDatabase(this.database_name);
            return req.result;
        },

        set_impl: function set_impl(impl) {
            this.impl = impl;
            this.root = new _idbRoot2.default(this.impl);
        },

        set_chain_id: function set_chain_id(chain_id) {
            this.chain_id = chain_id;
            var chain_substring = chain_id ? chain_id.substring(0, 6) : "";
            //this.root.setDbSuffix("_" + chain_substring)
            this.root.setDbSuffix("_" + chain_substring + "_" + current_wallet_name);
        },

        init_instance: function init_instance(indexedDBimpl) {
            var chain_id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _bcxjsWs.Apis.instance().chain_id;

            if (!_instance) {
                if (indexedDBimpl) {
                    this.set_impl(indexedDBimpl);
                    if ("__useShim" in indexedDBimpl) {
                        this.impl.__useShim(); //always use shim
                    }
                }
                this.set_chain_id(chain_id);
                _instance = init(chain_id);
            }
            return _instance;
        },

        instance: function instance() {
            // if (!_instance) {
            //     throw new Error("Internal Database instance is not initialized");
            // }
            return _instance;
        },

        close: function close() {
            if (_instance) {
                _instance.db().close();
            };
            _idbHelper2.default.set_graphene_db(null);
            _instance = undefined;
            // idb=null;
        },

        add_to_store: function add_to_store(store_name, value) {
            var _this = this;

            return new _promise2.default(function (resolve, reject) {
                var transaction = _this.instance().db().transaction([store_name], "readwrite");
                var store = transaction.objectStore(store_name);
                var request = store.add(value);
                request.onsuccess = function () {
                    resolve(value);
                };
                request.onerror = function (e) {
                    console.log("ERROR!!! add_to_store - can't store value in db. ", e.target.error.message, value);
                    reject(e.target.error.message);
                };
            });
        },
        remove_from_store: function remove_from_store(store_name, value) {
            var _this2 = this;

            return new _promise2.default(function (resolve, reject) {
                var transaction = _this2.instance().db().transaction([store_name], "readwrite");
                var store = transaction.objectStore(store_name);
                var request = store.delete(value);
                request.onsuccess = function () {
                    resolve();
                };
                request.onerror = function (e) {
                    console.log("ERROR!!! remove_from_store - can't remove value from db. ", e.target.error.message, value);
                    reject(e.target.error.message);
                };
            });
        },
        load_data: function load_data(store_name) {
            var _this3 = this;

            return new _promise2.default(function (resolve, reject) {
                var data = [];
                var transaction = _this3.instance().db().transaction([store_name], "readonly");
                var store = transaction.objectStore(store_name);
                var request = store.openCursor();
                //request.oncomplete = () => { resolve(data); };
                request.onsuccess = function (e) {
                    var cursor = e.target.result;
                    if (cursor) {
                        data.push(cursor.value);
                        cursor.continue();
                    } else {
                        resolve(data);
                    }
                };
                request.onerror = function (e) {
                    console.log("ERROR!!! open_store - can't get '`${store_name}`' cursor. ", e.target.error.message);
                    reject(e.target.error.message);
                };
            });
        },

        /** Persisted to disk but not backed up.
            @return promise
        */
        getCachedProperty: function getCachedProperty(name, default_value) {
            var db = this.instance().db();
            var transaction = db.transaction(["cached_properties"], "readonly");
            var store = transaction.objectStore("cached_properties");
            return _idbHelper2.default.on_request_end(store.get(name)).then(function (event) {
                var result = event.target.result;
                return result ? result.value : default_value;
            }).catch(function (error) {
                console.error(error);throw error;
            });
        },

        /** Persisted to disk but not backed up. */
        setCachedProperty: function setCachedProperty(name, value) {
            var db = this.instance().db();
            var transaction = db.transaction(["cached_properties"], "readwrite");
            var store = transaction.objectStore("cached_properties");
            if (value && value["toJS"]) value = value.toJS(); //Immutable-js
            return _idbHelper2.default.on_request_end(store.put({ name: name, value: value })).catch(function (error) {
                console.error(error);throw error;
            });
        },

        backup: function backup() {
            var store_names = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : WALLET_BACKUP_STORES;

            var promises = [];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = (0, _getIterator3.default)(store_names), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var store_name = _step.value;

                    promises.push(this.load_data(store_name));
                }
                //Add each store name
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return _promise2.default.all(promises).then(function (results) {
                var obj = {};
                for (var i = 0; i < store_names.length; i++) {
                    var store_name = store_names[i];
                    if (store_name === "wallet") {
                        var wallet_array = results[i];
                        // their should be only 1 wallet per database
                        var _iteratorNormalCompletion2 = true;
                        var _didIteratorError2 = false;
                        var _iteratorError2 = undefined;

                        try {
                            for (var _iterator2 = (0, _getIterator3.default)(wallet_array), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                var wallet = _step2.value;

                                wallet.backup_date = new Date().toISOString();
                            }
                        } catch (err) {
                            _didIteratorError2 = true;
                            _iteratorError2 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                    _iterator2.return();
                                }
                            } finally {
                                if (_didIteratorError2) {
                                    throw _iteratorError2;
                                }
                            }
                        }
                    }
                    obj[store_name] = results[i];
                }
                return obj;
            });
        },
        restore: function restore(wallet_name, object) {
            var database_name = getDatabaseName(wallet_name);
            return openDatabase(database_name).then(function (db) {
                var store_names = (0, _keys2.default)(object);
                var trx = db.transaction(store_names, "readwrite");
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = (0, _getIterator3.default)(store_names), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var store_name = _step3.value;

                        var store = trx.objectStore(store_name);

                        var records = object[store_name];
                        var _iteratorNormalCompletion4 = true;
                        var _didIteratorError4 = false;
                        var _iteratorError4 = undefined;

                        try {
                            for (var _iterator4 = (0, _getIterator3.default)(records), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                var record = _step4.value;

                                store.put(record);
                            }
                        } catch (err) {
                            _didIteratorError4 = true;
                            _iteratorError4 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion4 && _iterator4.return) {
                                    _iterator4.return();
                                }
                            } finally {
                                if (_didIteratorError4) {
                                    throw _iteratorError4;
                                }
                            }
                        }
                    }
                } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                            _iterator3.return();
                        }
                    } finally {
                        if (_didIteratorError3) {
                            throw _iteratorError3;
                        }
                    }
                }

                return _idbHelper2.default.on_transaction_end(trx);
            });
        }
    };
}();

exports.default = iDB;