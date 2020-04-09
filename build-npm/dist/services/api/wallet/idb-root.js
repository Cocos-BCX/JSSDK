"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _idbHelper = require("./idb-helper");

var _idbHelper2 = _interopRequireDefault(_idbHelper);

var _bcxjsWs = require("bcxjs-ws");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DB_VERSION_MAIN = 1;
var DB_PREFIX = "gph_db";

/** Usage: openIndexDB.then( db => ... */

var iDBRoot = function () {
    function iDBRoot(impl) {
        (0, _classCallCheck3.default)(this, iDBRoot);

        this.impl = impl;
    }

    (0, _createClass3.default)(iDBRoot, [{
        key: "setDbSuffix",
        value: function setDbSuffix(db_suffix) {
            // "graphene_db_06f667"
            this.database_name = DB_PREFIX + db_suffix;
        }

        /** @return promise */

    }, {
        key: "openIndexedDB",
        value: function openIndexedDB() {
            var _this = this;

            if (this.db) return _promise2.default.resolve(this.db);
            return new _promise2.default(function (resolve, reject) {
                var openRequest = _this.impl.open(_this.database_name, DB_VERSION_MAIN);
                openRequest.onupgradeneeded = function (e) {
                    _this.db = e.target.result;
                    _this.db.createObjectStore("properties", { keyPath: "name" });
                };
                openRequest.onsuccess = function (e) {
                    _this.db = e.target.result;
                    resolve(_this.db);
                };
                openRequest.onerror = function (e) {
                    reject(e.target.error);
                };
            });
        }

        /** @return promise */

    }, {
        key: "getProperty",
        value: function getProperty(name, default_value) {
            return this.openIndexedDB().then(function (db) {
                var transaction = db.transaction(["properties"], "readonly");
                var store = transaction.objectStore("properties");
                return _idbHelper2.default.on_request_end(store.get(name)).then(function (event) {
                    var result = event.target.result;
                    return result ? result.value : default_value;
                });
            }).catch(function (error) {
                console.error(error);throw error;
            });
        }

        /** @return promise */

    }, {
        key: "setProperty",
        value: function setProperty(name, value) {
            return this.openIndexedDB().then(function (db) {
                var transaction = db.transaction(["properties"], "readwrite");
                var store = transaction.objectStore("properties");
                if (value && value["toJS"]) value = value.toJS(); //Immutable-js
                return _idbHelper2.default.on_request_end(store.put({ name: name, value: value }));
            }).catch(function (error) {
                console.error(error);throw error;
            });
        }
    }, {
        key: "deleteDatabase",
        value: function deleteDatabase() {
            var are_you_sure = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            if (!are_you_sure) return "Are you sure?";
            console.log("deleting", this.database_name);
            var req = iDB.impl.deleteDatabase(this.database_name);
            return req.result;
        }
    }, {
        key: "close",
        value: function close() {
            this.db.close();
            this.db = null;
        }
    }]);
    return iDBRoot;
}();

exports.default = iDBRoot;