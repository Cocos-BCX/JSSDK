"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _set = require("babel-runtime/core-js/set");

var _set2 = _interopRequireDefault(_set);

var _mutations = require("../mutations");

var types = _interopRequireWildcard(_mutations);

var _idbInstance = require("../services/api/wallet/idb-instance");

var _idbInstance2 = _interopRequireDefault(_idbInstance);

var _bcxjsCores = require("bcxjs-cores");

var _bcxjsWs = require("bcxjs-ws");

var _immutable = require("immutable");

var _immutable2 = _interopRequireDefault(_immutable);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _saveAddyMapTimeout = 0;
var _loadAddyMapPromise;
var initialState = {
    addresses: _immutable2.default.Map(),
    saving: false,
    pubkeys: new _set2.default()
};
var getters = {};

var actions = {
    add: function add(_ref, pubkey) {
        var dispatch = _ref.dispatch,
            state = _ref.state;

        dispatch("loadAddyMap").then(function () {
            var dirty = false;
            if (state.pubkeys[pubkey]) return;
            state.pubkeys.add(pubkey);
            dispatch("saving");
            // Gather all 5 legacy address formats (see key.addresses)
            var address_strings = _bcxjsCores.key.addresses(pubkey);
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = (0, _getIterator3.default)(address_strings), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var address = _step.value;

                    state.addresses = state.addresses.set(address, pubkey);
                    dirty = true;
                }
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

            if (dirty) {
                dispatch("saveAddyMap");
            } else state.saving = false;
        }).catch(function (e) {
            throw e;
        });
    },
    /** Worker thread implementation (for more than 10K keys) */
    addAll: function addAll(_ref2, pubkeys) {
        var dispatch = _ref2.dispatch,
            state = _ref2.state;

        return new _promise2.default(function (resolve, reject) {
            state.saving = true;
            dispatch("loadAddyMap").then(function () {
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
                var results = [_bcxjsCores.key.addresses(pubkeys[0], _bcxjsWs.ChainConfig.address_prefix)];
                try {
                    var key_addresses = results;
                    var dirty = false;
                    var addresses = state.addresses.withMutations(function (addresses) {
                        for (var i = 0; i < pubkeys.length; i++) {
                            var pubkey = pubkeys[i];
                            if (state.pubkeys.has(pubkey)) continue;
                            state.pubkeys.add(pubkey);
                            // Gather all 5 legacy address formats (see key.addresses)
                            var address_strings = key_addresses[i];
                            var _iteratorNormalCompletion2 = true;
                            var _didIteratorError2 = false;
                            var _iteratorError2 = undefined;

                            try {
                                for (var _iterator2 = (0, _getIterator3.default)(address_strings), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                    var address = _step2.value;

                                    addresses.set(address, pubkey);
                                    dirty = true;
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
                    });
                    if (dirty) {
                        state.addresses = addresses;
                        dispatch("saveAddyMap");
                    } else {
                        state.saving = false;
                    }
                    resolve();
                } catch (e) {
                    console.error('AddressIndex.addAll', e);reject(e);
                }
            }).catch(function (e) {
                throw e;
            });
        });
    },
    loadAddyMap: function loadAddyMap(_ref3) {
        var commit = _ref3.commit,
            state = _ref3.state;

        if (_loadAddyMapPromise) return _loadAddyMapPromise;
        _loadAddyMapPromise = _idbInstance2.default.root.getProperty("AddressIndex").then(function (map) {
            state.addresses = map ? _immutable2.default.Map(map) : _immutable2.default.Map();
            // console.log("AddressIndex load", this.state.addresses.size)
            state.addresses.valueSeq().forEach(function (pubkey) {
                return state.pubkeys.add(pubkey);
            });
        });
        return _loadAddyMapPromise;
    },
    saving: function saving(_ref4) {
        var state = _ref4.state;

        if (state.saving) return;
        state.saving = true;
    },

    saveAddyMap: function saveAddyMap(_ref5) {
        var state = _ref5.state;

        clearTimeout(_saveAddyMapTimeout);
        _saveAddyMapTimeout = setTimeout(function () {
            console.log("AddressIndex save", state.addresses.size);
            state.saving = false;
            // If indexedDB fails to save, it will re-try via PrivateKeyStore calling this.add
            return _idbInstance2.default.root.setProperty("AddressIndex", state.addresses.toObject());
        }, 100);
    }
};

var mutations = {};

exports.default = {
    state: initialState,
    actions: actions,
    mutations: mutations,
    getters: getters,
    namespaced: true
};