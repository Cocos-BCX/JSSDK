'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _mutations;

var _vue = require('vue');

var _vue2 = _interopRequireDefault(_vue);

var _mutations2 = require('../mutations');

var types = _interopRequireWildcard(_mutations2);

var _bcxjsCores = require('bcxjs-cores');

var _idbHelper = require('../services/api/wallet/idb-helper');

var _idbHelper2 = _interopRequireDefault(_idbHelper);

var _tcomb_structs = require('../store/tcomb_structs');

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var initialState = {
    keys: {},
    app_keys: [],

    privateKeyStorage_error: false,
    pending_operation_count: 0,
    privateKeyStorage_error_add_key: null,
    privateKeyStorage_error_loading: null
};

var getters = {
    keys: function keys(state) {
        return state.keys;
    },
    app_keys: function app_keys(state) {
        return state.app_keys;
    },
    getTcomb_byPubkey: function getTcomb_byPubkey(state) {
        return function (public_key) {
            if (!public_key) return null;
            if (public_key.Q) public_key = public_key.toPublicKeyString();
            return state.keys[public_key];
        };
    },
    getPubkeys_having_PrivateKey: function getPubkeys_having_PrivateKey(state) {
        return function (pubkeys) {
            var addys = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

            var _pubkeys = [];
            if (pubkeys) {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = (0, _getIterator3.default)(pubkeys), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var pubkey = _step.value;

                        if (state.keys[pubkey]) {
                            _pubkeys.push(pubkey);
                        }
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
            }
            return _pubkeys;
        };
    },
    decodeMemo: function decodeMemo(state) {
        return function (memo, store) {
            var lockedWallet = false;
            var memo_text = void 0,
                isMine = false;
            var from_private_key = state.keys[memo.from];
            var to_private_key = state.keys[memo.to];
            var private_key = from_private_key ? from_private_key : to_private_key;
            var public_key = from_private_key ? memo.to : memo.from;
            public_key = _bcxjsCores.PublicKey.fromPublicKeyString(public_key);
            try {
                private_key = store.getters["WalletDb/decryptTcomb_PrivateKey"](private_key); //WalletDb.decryptTcomb_PrivateKey(private_key);
            } catch (e) {
                // Failed because wallet is locked
                lockedWallet = true;
                private_key = null;
                isMine = true;
            }
            if (private_key) {
                var tryLegacy = false;
                try {
                    memo_text = private_key ? _bcxjsCores.Aes.decrypt_with_checksum(private_key, public_key, memo.nonce, memo.message).toString("utf-8") : null;
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
                        memo_text = _bcxjsCores.Aes.decrypt_with_checksum(private_key, public_key, memo.nonce, memo.message, true).toString("utf-8");
                    } catch (e) {
                        console.log("transfer memo exception ...", e);
                        memo_text = "**";
                    }
                }
            }
            return {
                text: memo_text,
                isMine: isMine
            };
        };
    }
};

var actions = {
    setKeys: function setKeys(_ref, key) {
        var commit = _ref.commit;

        commit(types.SET_KEYS, key);
    },
    clearKeys: function clearKeys(_ref2) {
        var commit = _ref2.commit;

        commit(types.CLEAR_KEYS);
    },
    setAppkeys: function setAppkeys(_ref3, keys) {
        var commit = _ref3.commit;

        commit(types.SET_APP_KEYS, keys);
    },
    decodeMemo: function decodeMemo(_ref4, memo) {
        var commit = _ref4.commit,
            state = _ref4.state,
            dispatch = _ref4.dispatch;
        var lockedWallet, memo_text, isMine, from_private_key, to_private_key, private_key, public_key, tryLegacy;
        return _regenerator2.default.async(function decodeMemo$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        lockedWallet = false;
                        memo_text = void 0, isMine = false;
                        from_private_key = state.keys[memo.from];
                        to_private_key = state.keys[memo.to];
                        private_key = from_private_key ? from_private_key : to_private_key;
                        public_key = from_private_key ? memo.to : memo.from;

                        public_key = _bcxjsCores.PublicKey.fromPublicKeyString(public_key);

                        _context.prev = 7;
                        _context.next = 10;
                        return _regenerator2.default.awrap(dispatch("WalletDb/decryptTcomb_PrivateKey", private_key, { root: true }));

                    case 10:
                        private_key = _context.sent;
                        _context.next = 18;
                        break;

                    case 13:
                        _context.prev = 13;
                        _context.t0 = _context['catch'](7);

                        // Failed because wallet is locked
                        lockedWallet = true;
                        private_key = null;
                        isMine = true;

                    case 18:
                        if (private_key) {
                            tryLegacy = false;

                            try {
                                memo_text = private_key ? _bcxjsCores.Aes.decrypt_with_checksum(private_key, public_key, memo.nonce, memo.message).toString("utf-8") : null;
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
                                    memo_text = _bcxjsCores.Aes.decrypt_with_checksum(private_key, public_key, memo.nonce, memo.message, true).toString("utf-8");
                                } catch (e) {
                                    console.log("transfer memo exception ...", e);
                                    memo_text = "**";
                                }
                            }
                        }

                        return _context.abrupt('return', {
                            text: memo_text,
                            isMine: isMine
                        });

                    case 20:
                    case 'end':
                        return _context.stop();
                }
            }
        }, null, undefined, [[7, 13]]);
    },
    loadDbData: function loadDbData(_ref5) {
        var commit = _ref5.commit,
            state = _ref5.state,
            dispatch = _ref5.dispatch;

        commit("_getInitialState");
        commit("pendingOperation");
        var p = _idbHelper2.default.cursor("private_keys", function (cursor) {
            if (!cursor) {
                //state.keys={};
                return;
            }
            var private_key_tcomb = (0, _tcomb_structs.PrivateKeyTcomb)(cursor.value);
            commit(types.SET_KEYS, (0, _tcomb_structs.PrivateKeyTcomb)(private_key_tcomb));
            dispatch("AddressIndex/add", private_key_tcomb.pubkey, { root: true });
            cursor.continue();
        }).then(function () {
            setTimeout(function () {
                dispatch("pendingOperationDone");
            }, 2000);
        }).catch(function (error) {
            commit("_getInitialState");
            throw error;
        });
        return p;
    },
    pendingOperationDone: function pendingOperationDone(_ref6) {
        var state = _ref6.state;

        // console.info("state.pending_operation_count11111111",state.pending_operation_count);

        if (state.pending_operation_count == 0) {
            console.log("Pending operation done called too many times");
        }
        // throw new Error("Pending operation done called too many times")
        state.pending_operation_count--;
    },

    addKey: function addKey(_ref7, _ref8) {
        var state = _ref7.state,
            dispatch = _ref7.dispatch,
            commit = _ref7.commit;
        var private_key_object = _ref8.private_key_object,
            transaction = _ref8.transaction,
            resolve = _ref8.resolve;
        // resolve is deprecated
        if (state.keys[private_key_object.pubkey]) {
            resolve({ result: "duplicate", id: null });
            return;
        }
        commit("pendingOperation");
        //console.log("... onAddKey private_key_object.pubkey", private_key_object.pubkey)
        //console.info("state.keys",state.keys);
        // state.keys = state.keys.set(
        //     private_key_object.pubkey,
        //     PrivateKeyTcomb(private_key_object)
        // );
        commit(types.SET_KEYS, (0, _tcomb_structs.PrivateKeyTcomb)(private_key_object));
        // Vue.set(state.keys,private_key_object.pubkey, PrivateKeyTcomb(private_key_object));

        dispatch("AddressIndex/add", private_key_object.pubkey, { root: true });

        var p = new _promise2.default(function (resolve, reject) {
            (0, _tcomb_structs.PrivateKeyTcomb)(private_key_object);
            var duplicate = false;
            var p = _idbHelper2.default.add(transaction.objectStore("private_keys"), private_key_object);

            //console.log("p:", p);
            p.catch(function (event) {
                // ignore_duplicates
                var error = event.target.error;
                console.log("... error", error, event);
                if (error.name != "ConstraintError" || error.message.indexOf("by_encrypted_key") == -1) {
                    //this.privateKeyStorageError("add_key", error);
                    throw event;
                }
                duplicate = true;
                event.preventDefault();
            }).then(function () {
                dispatch("pendingOperationDone");
                if (duplicate) return { result: "duplicate", id: null };
                if (private_key_object.brainkey_sequence == null)
                    //this.binaryBackupRecommended(); // non-deterministic
                    disconnect("CachedPropertyStore/set", { name: "backup_recommended", value: true });
                _idbHelper2.default.on_transaction_end(transaction).then(function () {

                    //this.setState({ keys: this.state.keys }); 
                });
                return {
                    result: "added",
                    id: private_key_object.id
                };
            });
            resolve(p);
        });
        return p;
    },
    addPrivateKeys_noindex: function addPrivateKeys_noindex(_ref9, _ref10) {
        var state = _ref9.state,
            dispatch = _ref9.dispatch;
        var private_key_objects = _ref10.private_key_objects,
            transaction = _ref10.transaction;

        var store = transaction.objectStore("private_keys");
        var duplicate_count = 0;

        var keys = _immutable2.default.fromJS(state.keys).withMutations(function (keys) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = (0, _getIterator3.default)(private_key_objects), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var private_key_object = _step2.value;

                    if (state.keys[private_key_object.pubkey]) {
                        duplicate_count++;
                        continue;
                    }
                    var private_tcomb = (0, _tcomb_structs.PrivateKeyTcomb)(private_key_object);
                    store.add(private_key_object);
                    keys.set(private_key_object.pubkey, private_tcomb);
                    _bcxjsCores.ChainStore.getAccountRefsOfKey(private_key_object.pubkey);
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
        });
        state.keys = keys.toJS();
        binaryBackupRecommended(dispatch);
        return duplicate_count;
    }
};

function binaryBackupRecommended(dispatch) {
    dispatch("CachedPropertyStore/Set", { name: "backup_recommended", value: true }, { root: true });
}

var mutations = (_mutations = {}, (0, _defineProperty3.default)(_mutations, types.SET_KEYS, function (state, key) {
    _vue2.default.set(state.keys, key.pubkey, key);
}), (0, _defineProperty3.default)(_mutations, types.SET_APP_KEYS, function (state, keys) {
    state.app_keys = keys;
}), (0, _defineProperty3.default)(_mutations, types.CLEAR_KEYS, function (state) {
    state.keys = {};
    //state.app_keys=[];
}), (0, _defineProperty3.default)(_mutations, 'pendingOperation', function pendingOperation(state) {
    state.pending_operation_count++;
}), (0, _defineProperty3.default)(_mutations, '_getInitialState', function _getInitialState(state) {
    state.privateKeyStorage_error = false;
    state.pending_operation_count = 0;
    state.privateKeyStorage_error_add_key = null;
    state.privateKeyStorage_error_loading = null;
}), _mutations);

exports.default = {
    state: initialState,
    mutations: mutations,
    actions: actions,
    getters: getters,
    namespaced: true
};