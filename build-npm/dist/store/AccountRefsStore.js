"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _mutations = require("../mutations");

var types = _interopRequireWildcard(_mutations);

var _idbInstance = require("../services/api/wallet/idb-instance");

var _idbInstance2 = _interopRequireDefault(_idbInstance);

var _immutable = require("immutable");

var _immutable2 = _interopRequireDefault(_immutable);

var _bcxjsCores = require("bcxjs-cores");

var _PrivateKeyStore = require("../modules/PrivateKeyStore");

var _PrivateKeyStore2 = _interopRequireDefault(_PrivateKeyStore);

var _api = require("../services/api");

var _api2 = _interopRequireDefault(_api);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _chainstore_account_ids_by_key = void 0;
var _no_account_refs = void 0;
var initialState = {
    account_refs: _immutable2.default.Set()
};
var getters = {
    account_refs: function account_refs(state) {
        return state.account_refs;
    }
};

var actions = {
    loadDbData: function loadDbData(_ref) {
        var commit = _ref.commit,
            dispatch = _ref.dispatch;

        commit("_getInitialState");
        return loadNoAccountRefs().then(function (no_account_refs) {
            return _no_account_refs = no_account_refs;
        }).then(function () {
            chainStoreUpdate({ dispatch: dispatch });
        });
    },
    checkPrivateKeyStore: function checkPrivateKeyStore(_ref2) {
        var rootGetters = _ref2.rootGetters,
            state = _ref2.state;
        var no_account_refs, account_refs, keys;
        return _regenerator2.default.async(function checkPrivateKeyStore$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        no_account_refs = _no_account_refs;
                        account_refs = _immutable2.default.Set();
                        //.keySeq()

                        keys = rootGetters["PrivateKeyStore/keys"];
                        _context3.next = 5;
                        return _regenerator2.default.awrap(_promise2.default.all((0, _keys2.default)(keys).map(function _callee(pubkey) {
                            var refs, private_key_object;
                            return _regenerator2.default.async(function _callee$(_context) {
                                while (1) {
                                    switch (_context.prev = _context.next) {
                                        case 0:
                                            if (!no_account_refs.has(pubkey)) {
                                                _context.next = 2;
                                                break;
                                            }

                                            return _context.abrupt("return");

                                        case 2:
                                            if (!(pubkey != "undefined")) {
                                                _context.next = 7;
                                                break;
                                            }

                                            _context.next = 5;
                                            return _regenerator2.default.awrap(_api2.default.Account.getAccountIdByOwnerPubkey(pubkey));

                                        case 5:
                                            refs = _context.sent;
                                            //ChainStore.getAccountRefsOfKey(pubkey)
                                            refs = _immutable2.default.fromJS(refs);

                                        case 7:
                                            if (!(refs === undefined)) {
                                                _context.next = 9;
                                                break;
                                            }

                                            return _context.abrupt("return");

                                        case 9:
                                            if (refs.size) {
                                                _context.next = 15;
                                                break;
                                            }

                                            // Do Not block brainkey generated keys.. Those are new and
                                            // account references may be pending.
                                            private_key_object = rootGetters["PrivateKeyStore/keys"][pubkey];

                                            if (!(typeof private_key_object.brainkey_sequence === 'number')) {
                                                _context.next = 13;
                                                break;
                                            }

                                            return _context.abrupt("return");

                                        case 13:
                                            no_account_refs = no_account_refs.add(pubkey);
                                            return _context.abrupt("return");

                                        case 15:
                                            account_refs = account_refs.add(refs.valueSeq());

                                        case 16:
                                        case "end":
                                            return _context.stop();
                                    }
                                }
                            }, null, undefined);
                        })));

                    case 5:

                        account_refs = account_refs.flatten();

                        _context3.next = 8;
                        return _regenerator2.default.awrap(_promise2.default.all(account_refs.map(function _callee2(account) {
                            var refs;
                            return _regenerator2.default.async(function _callee2$(_context2) {
                                while (1) {
                                    switch (_context2.prev = _context2.next) {
                                        case 0:
                                            _context2.next = 2;
                                            return _regenerator2.default.awrap(_api2.default.Account.getAccountRefsOfAccount(account));

                                        case 2:
                                            refs = _context2.sent;
                                            //ChainStore.getAccountRefsOfAccount(account);
                                            refs = _immutable2.default.fromJS(refs);

                                            if (!(refs === undefined)) {
                                                _context2.next = 6;
                                                break;
                                            }

                                            return _context2.abrupt("return");

                                        case 6:
                                            if (refs.size) {
                                                _context2.next = 8;
                                                break;
                                            }

                                            return _context2.abrupt("return");

                                        case 8:
                                            account_refs = account_refs.add(refs.valueSeq());

                                        case 9:
                                        case "end":
                                            return _context2.stop();
                                    }
                                }
                            }, null, undefined);
                        })));

                    case 8:

                        account_refs = account_refs.flatten();
                        if (!state.account_refs.equals(account_refs)) {
                            // console.log("AccountRefsStore account_refs",account_refs.size);
                            state.account_refs = account_refs;
                        }
                        if (!_no_account_refs.equals(no_account_refs)) {
                            _no_account_refs = no_account_refs;
                            saveNoAccountRefs(no_account_refs);
                        }

                    case 11:
                    case "end":
                        return _context3.stop();
                }
            }
        }, null, undefined);
    }
};

function saveNoAccountRefs(no_account_refs) {
    var array = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = (0, _getIterator3.default)(no_account_refs), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var pubkey = _step.value;
            array.push(pubkey);
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

    _idbInstance2.default.root.setProperty("no_account_refs", array);
}

// Performance optimization for large wallets
function loadNoAccountRefs() {
    return _idbInstance2.default.root.getProperty("no_account_refs", []).then(function (array) {
        return _immutable2.default.Set(array);
    });
}

var chainStoreUpdate = function chainStoreUpdate(_ref3) {
    var dispatch = _ref3.dispatch;

    if (_chainstore_account_ids_by_key === _bcxjsCores.ChainStore.account_ids_by_key) return;
    _chainstore_account_ids_by_key = _bcxjsCores.ChainStore.account_ids_by_key;
    dispatch("checkPrivateKeyStore");
};
var mutations = {
    _getInitialState: function _getInitialState(state) {
        _chainstore_account_ids_by_key = null;
        state.account_refs = _immutable2.default.Set();
    }
};

exports.default = {
    state: initialState,
    actions: actions,
    mutations: mutations,
    getters: getters,
    namespaced: true
};