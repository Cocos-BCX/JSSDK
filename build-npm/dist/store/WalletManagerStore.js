"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _mutations = require("../mutations");

var types = _interopRequireWildcard(_mutations);

var _idbInstance = require("../services/api/wallet/idb-instance");

var _idbInstance2 = _interopRequireDefault(_idbInstance);

var _immutable = require("immutable");

var _immutable2 = _interopRequireDefault(_immutable);

var _bcxjsCores = require("bcxjs-cores");

var _PrivateKeyStore = require("../modules/PrivateKeyStore");

var _PrivateKeyStore2 = _interopRequireDefault(_PrivateKeyStore);

var _bcxjsWs = require("bcxjs-ws");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var initialState = {
    new_wallet: undefined, // pending restore
    current_wallet: undefined,
    wallet_names: _immutable2.default.Set()
};

var getters = {
    current_wallet: function current_wallet(state) {
        return state.current_wallet;
    },
    wallet: function wallet(state) {
        return state;
    }
};

var actions = {
    init: function init(_ref) {
        var state = _ref.state;

        return _idbInstance2.default.root.getProperty("current_wallet").then(function (current_wallet) {
            return _idbInstance2.default.root.getProperty("wallet_names", []).then(function (wallet_names) {
                state.wallet_names = _immutable2.default.Set(wallet_names);
                state.current_wallet = current_wallet;
            });
        });
    },
    setWallet: function setWallet(_ref2, _ref3) {
        var dispatch = _ref2.dispatch;
        var wallet_name = _ref3.wallet_name,
            create_wallet_password = _ref3.create_wallet_password,
            brnkey = _ref3.brnkey;
        return _regenerator2.default.async(function setWallet$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        // WalletUnlockActions.lock();
                        if (!wallet_name) wallet_name = "default";

                        return _context.abrupt("return", dispatch("onSetWallet", { wallet_name: wallet_name, create_wallet_password: create_wallet_password, brnkey: brnkey }));

                    case 2:
                    case "end":
                        return _context.stop();
                }
            }
        }, null, undefined);
    },
    onSetWallet: function onSetWallet(_ref4, _ref5) {
        var state = _ref4.state,
            dispatch = _ref4.dispatch;
        var _ref5$wallet_name = _ref5.wallet_name,
            wallet_name = _ref5$wallet_name === undefined ? "default" : _ref5$wallet_name,
            create_wallet_password = _ref5.create_wallet_password,
            brnkey = _ref5.brnkey,
            resolve = _ref5.resolve;


        var p = new _promise2.default(function (resolve) {
            if (/[^a-z0-9_-]/.test(wallet_name) || wallet_name === "") throw new Error("Invalid wallet name");

            if (state.current_wallet === wallet_name) {
                resolve();
                return;
            }

            var add = void 0;
            if (!state.wallet_names.has(wallet_name)) {
                var wallet_names = state.wallet_names.add(wallet_name);
                add = _idbInstance2.default.root.setProperty("wallet_names", wallet_names);
                state.wallet_names = wallet_names;
            }

            var current = _idbInstance2.default.root.setProperty("current_wallet", wallet_name);

            resolve(_promise2.default.all([add, current]).then(function () {
                // Restart the database before current application initializing its new status
                _idbInstance2.default.close();
                _bcxjsCores.ChainStore.clearCache();
                // BalanceClaimActiveStore.reset()
                // Store may be reset when calling loadDbData
                // United Labs of BCTech.

                return _idbInstance2.default.init_instance().init_promise.then(function () {
                    // before calling CachedPropertyStore.reset(), make sure the database is standby
                    // CachedPropertyStore.reset()

                    dispatch("CachedPropertyStore/reset", null, { root: true });
                    return _promise2.default.all([dispatch("WalletDb/loadDbData", null, { root: true }).then(function () {
                        dispatch("AccountStore/loadDbData", null, { root: true });
                    }), dispatch("PrivateKeyStore/loadDbData", null, { root: true }).then(function () {
                        return dispatch("AccountRefsStore/loadDbData", null, { root: true });
                    })]).then(function () {
                        // Update status again in order to re-render listeners
                        if (!create_wallet_password) {
                            state.current_wallet = wallet_name;
                            return;
                        }
                        return dispatch("WalletDb/_createWallet", { password_plaintext: create_wallet_password,
                            brainkey_plaintext: brnkey, //brainkey,
                            unlock: true, //unlock
                            public_name: wallet_name
                        }, { root: true }).then(function () {
                            state.current_wallet = wallet_name;
                        });
                    });
                });
            }));
        }).catch(function (error) {
            console.error(error);
            return _promise2.default.reject(error);
        });
        return p;
        // if (resolve) resolve(p)
    },
    getBackupName: function getBackupName(_ref6) {
        var getters = _ref6.getters;

        var name = getters.current_wallet;
        var address_prefix = _bcxjsWs.ChainConfig.address_prefix.toLowerCase();
        if (name.indexOf(address_prefix) !== 0) name = address_prefix + "_" + name;
        var date = new Date();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var stampedName = name + "_" + date.getFullYear() + (month >= 10 ? month : "0" + month) + (day >= 10 ? day : "0" + day);
        name = stampedName + ".bin";
        return name;
    },
    setNewWallet: function setNewWallet(_ref7, new_wallet) {
        var state = _ref7.state;

        state.new_wallet = new_wallet;
    },
    restore: function restore(_ref8, _ref9) {
        var dispatch = _ref8.dispatch;
        var wallet_name = _ref9.wallet_name,
            wallet_object = _ref9.wallet_object;

        return _idbInstance2.default.restore(wallet_name, wallet_object).then(function () {
            return dispatch("onSetWallet", { wallet_name: wallet_name });
        }).catch(function (error) {
            console.error(error);
            return _promise2.default.reject(error);
        });
    },
    deleteWallet: function deleteWallet(_ref10) {
        var state = _ref10.state,
            dispatch = _ref10.dispatch;

        var delete_wallet_name = state.current_wallet;
        dispatch("AccountStore/setCurrentAccount", null, { root: true });
        if (!delete_wallet_name) {
            return { code: 154, message: "Please restore your wallet first" };
        }
        return new _promise2.default(function (resolve) {
            var current_wallet = state.current_wallet,
                wallet_names = state.wallet_names;


            if (!wallet_names.has(delete_wallet_name)) {
                return { code: 157, message: "Can't delete wallet, does not exist in index"
                    // throw new Error("Can't delete wallet, does not exist in index. United Labs of BCTech.")
                };
            }
            wallet_names = wallet_names.delete(delete_wallet_name);

            var add = true,
                current = true;
            add = _idbInstance2.default.root.setProperty("wallet_names", wallet_names);
            if (current_wallet === delete_wallet_name) {
                current_wallet = wallet_names.size ? wallet_names.first() : undefined;
                current = _idbInstance2.default.root.setProperty("current_wallet", current_wallet);
                if (current_wallet) dispatch("onSetWallet", { wallet_name: current_wallet });
            }
            state.current_wallet = current_wallet;
            state.wallet_names = wallet_names;

            _promise2.default.all([add, current]).then(function () {
                var database_name = _idbInstance2.default.getDatabaseName(delete_wallet_name);
                var req = _idbInstance2.default.impl.deleteDatabase(database_name);
                dispatch("WalletDb/deleteWallet", null, { root: true });
                dispatch("account/_logout", null, { root: true });
                resolve({ code: 1, data: database_name });
            });
        });
    }
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