'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _mutations;
// import dictionary from '..United Labs of BCTech./assets/brainkey_dictionary.js';


var _vue = require('vue');

var _vue2 = _interopRequireDefault(_vue);

var _mutations2 = require('../mutations');

var types = _interopRequireWildcard(_mutations2);

var _bcxjsCores = require('bcxjs-cores');

var _bcxjsWs = require('bcxjs-ws');

var _idbInstance = require('../services/api/wallet/idb-instance');

var _idbInstance2 = _interopRequireDefault(_idbInstance);

var _idbHelper = require('../services/api/wallet/idb-helper');

var _idbHelper2 = _interopRequireDefault(_idbHelper);

var _tcomb_structs = require('../store/tcomb_structs');

var _api = require('../services/api');

var _api2 = _interopRequireDefault(_api);

var _lodash = require('lodash');

var _backup = require('../services/api/wallet/backup');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// let aes_private = null;
// let _passwordKey=null;
var _brainkey_look_ahead = void 0;
var _generateNextKey_pubcache = [];

var initialState = {
    aes_private: null,
    _passwordKey: null,
    wallet: null
};
var TRACE = false;

var getters = {
    wallet: function wallet(state) {
        return state.wallet;
    },
    aes_private: function aes_private(state) {
        return state.aes_private;
    },
    _passwordKey: function _passwordKey(state) {
        return state._passwordKey;
    },
    isLocked: function isLocked(state) {
        var aes_private = state.aes_private,
            _passwordKey = state._passwordKey;

        return !(!!aes_private || !!_passwordKey);
    },
    decryptTcomb_PrivateKey: function decryptTcomb_PrivateKey(state) {
        return function (private_key_tcomb) {
            if (!private_key_tcomb) return null;
            var aes_private = state.aes_private,
                _passwordKey = state._passwordKey;

            if (!(!!aes_private || !!_passwordKey)) return ""; //throw new Error("wallet locked")
            if (_passwordKey && _passwordKey[private_key_tcomb.pubkey]) {
                return _passwordKey[private_key_tcomb.pubkey];
            }

            var private_key_hex = aes_private.decryptHex(private_key_tcomb.encrypted_key);
            return _bcxjsCores.PrivateKey.fromBuffer(new Buffer(private_key_hex, 'hex'));
        };
    }
};

var actions = {
    deleteWallet: function deleteWallet(_ref) {
        var state = _ref.state;

        state.wallet = null;
    },
    clearKeys: function clearKeys(_ref2) {
        var commit = _ref2.commit;

        // aes_private=null;
        // _passwordKey=null;
        commit(types.SET_PASSWORD_KEY, null);
        commit(types.SET_AES_PRIVATE, null);
    },
    generateKeyFromPassword: function generateKeyFromPassword(state, _ref3) {
        var account = _ref3.account,
            role = _ref3.role,
            password = _ref3.password;

        var seed = account + role + password;
        var privKey = _bcxjsCores.PrivateKey.fromSeed(seed);
        var pubKey = privKey.toPublicKey().toString();

        return { privKey: privKey, pubKey: pubKey };
    },
    validatePassword: function validatePassword(_ref4, _ref5) {
        var commit = _ref4.commit,
            dispatch = _ref4.dispatch,
            rootGetters = _ref4.rootGetters,
            getters = _ref4.getters;
        var _ref5$password = _ref5.password,
            password = _ref5$password === undefined ? "" : _ref5$password,
            _ref5$unlock = _ref5.unlock,
            unlock = _ref5$unlock === undefined ? false : _ref5$unlock,
            _ref5$account = _ref5.account,
            account = _ref5$account === undefined ? null : _ref5$account,
            _ref5$roles = _ref5.roles,
            roles = _ref5$roles === undefined ? ["active", "owner", "memo"] : _ref5$roles,
            _ref5$isChangePasswor = _ref5.isChangePassword,
            isChangePassword = _ref5$isChangePasswor === undefined ? false : _ref5$isChangePasswor;

        var _passwordKey, setKey, id, fromWif, acc, _key, res, wallet, isAccountMode, encryptionKey, password_private, password_pubkey, _password_pubkey, password_aes, encryption_plainbuffer, aes_private;

        return _regenerator2.default.async(function validatePassword$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        password = password.trim();
                        _passwordKey = null;

                        if (!account) {
                            _context2.next = 32;
                            break;
                        }

                        setKey = function setKey(role, priv, pub) {
                            if (!_passwordKey) _passwordKey = {};
                            _passwordKey[pub] = priv;

                            id++;

                            dispatch("PrivateKeyStore/setKeys", {
                                pubkey: pub,
                                import_account_names: [account],
                                encrypted_key: null,
                                id: id,
                                brainkey_sequence: null
                            }, { root: true });
                        };

                        /* Check if the user tried to login with a private key */


                        id = 0;
                        fromWif = void 0;

                        try {
                            fromWif = _bcxjsCores.PrivateKey.fromWif(password);
                        } catch (err) {}
                        _context2.next = 9;
                        return _regenerator2.default.awrap(dispatch("user/fetchUser", account, { root: true }));

                    case 9:
                        acc = _context2.sent;

                        if (acc.success) {
                            _context2.next = 12;
                            break;
                        }

                        return _context2.abrupt('return', { code: acc.code, message: acc.error });

                    case 12:
                        acc = acc.data.account;

                        _key = void 0;

                        if (fromWif) {
                            _key = { privKey: fromWif, pubKey: fromWif.toPublicKey().toString() };
                        }

                        if (!acc) {
                            _context2.next = 18;
                            break;
                        }

                        _context2.next = 18;
                        return _regenerator2.default.awrap(_promise2.default.all(roles.map(function _callee(role) {
                            var foundRole, alsoCheckRole;
                            return _regenerator2.default.async(function _callee$(_context) {
                                while (1) {
                                    switch (_context.prev = _context.next) {
                                        case 0:
                                            if (fromWif) {
                                                _context.next = 4;
                                                break;
                                            }

                                            _context.next = 3;
                                            return _regenerator2.default.awrap(dispatch("generateKeyFromPassword", { account: account, role: role, password: password }));

                                        case 3:
                                            _key = _context.sent;

                                        case 4:
                                            foundRole = false;


                                            if (role === "memo") {
                                                if (acc.options.memo_key === _key.pubKey) {
                                                    setKey(role, _key.privKey, _key.pubKey);
                                                    foundRole = true;
                                                }
                                            } else {
                                                acc[role].key_auths.forEach(function (auth) {
                                                    if (auth[0] === _key.pubKey) {
                                                        setKey(role, _key.privKey, _key.pubKey);
                                                        foundRole = true;
                                                        return false;
                                                    }
                                                });

                                                if (!foundRole) {
                                                    alsoCheckRole = role === "active" ? "owner" : "active";

                                                    acc[alsoCheckRole].key_auths.forEach(function (auth) {
                                                        if (auth[0] === _key.pubKey) {
                                                            setKey(alsoCheckRole, _key.privKey, _key.pubKey);
                                                            foundRole = true;
                                                            return false;
                                                        }
                                                    });
                                                }
                                            }

                                        case 6:
                                        case 'end':
                                            return _context.stop();
                                    }
                                }
                            }, null, undefined);
                        })));

                    case 18:
                        if (!(!_passwordKey && rootGetters["account/getWallet"])) {
                            _context2.next = 24;
                            break;
                        }

                        _context2.next = 21;
                        return _regenerator2.default.awrap(dispatch("validatePassword", { password: password, unlock: true }));

                    case 21:
                        res = _context2.sent;

                        if (!res.success) {
                            _context2.next = 24;
                            break;
                        }

                        return _context2.abrupt('return', { code: 1, cloudMode: false });

                    case 24:
                        if (!_passwordKey) {
                            _context2.next = 29;
                            break;
                        }

                        commit(types.SET_PASSWORD_KEY, _passwordKey);
                        return _context2.abrupt('return', { code: 1, cloudMode: true });

                    case 29:
                        return _context2.abrupt('return', { code: 105, message: "wrong password", cloudMode: true });

                    case 30:
                        _context2.next = 57;
                        break;

                    case 32:
                        wallet = getters.wallet; // rootGetters["account/getWallet"];

                        isAccountMode = !wallet && !!rootGetters["account/getWallet"];

                        if (isAccountMode) {
                            wallet = rootGetters["account/getWallet"];
                        }

                        if (wallet) {
                            _context2.next = 37;
                            break;
                        }

                        return _context2.abrupt('return', { code: 154, message: "Please restore your wallet first" });

                    case 37:
                        encryptionKey = wallet.encryption_key; //||wallet.encryptionKey;

                        if (isAccountMode) {
                            encryptionKey = wallet.encryptionKey;
                        }

                        if (!((!encryptionKey || encryptionKey == "undefined") && !isChangePassword)) {
                            _context2.next = 41;
                            break;
                        }

                        return _context2.abrupt('return', { code: 107, message: "Please import the private key" });

                    case 41:
                        _context2.prev = 41;
                        password_private = _bcxjsCores.PrivateKey.fromSeed(password);
                        password_pubkey = password_private.toPublicKey().toPublicKeyString();
                        _password_pubkey = wallet[isAccountMode ? "passwordPubkey" : "password_pubkey"];

                        if (!(_password_pubkey !== password_pubkey)) {
                            _context2.next = 47;
                            break;
                        }

                        return _context2.abrupt('return', { code: 105, message: "wrong password", success: false, cloudMode: false });

                    case 47:
                        if (unlock) {
                            password_aes = _bcxjsCores.Aes.fromSeed(password);
                            encryption_plainbuffer = password_aes.decryptHexToBuffer(encryptionKey);
                            //let encryption_plainbuffer = password_aes.decryptHexToBuffer(wallet.encryptionKey);

                            aes_private = _bcxjsCores.Aes.fromSeed(encryption_plainbuffer);

                            commit(types.SET_AES_PRIVATE, aes_private);
                        }
                        _context2.next = 50;
                        return _regenerator2.default.awrap(dispatch("user/fetchUser", rootGetters["account/getAccountUserId"], { root: true }));

                    case 50:
                        return _context2.abrupt('return', { code: 1, success: true, cloudMode: false });

                    case 53:
                        _context2.prev = 53;
                        _context2.t0 = _context2['catch'](41);

                        console.error(_context2.t0);
                        return _context2.abrupt('return', { code: 0, message: _context2.t0.message, success: false, cloudMode: false });

                    case 57:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, null, undefined, [[41, 53]]);
    },

    getPrivateKey: function getPrivateKey(_ref6, public_key) {
        var rootGetters = _ref6.rootGetters,
            dispatch = _ref6.dispatch,
            state = _ref6.state;

        var _passwordKey, private_key_tcomb;

        return _regenerator2.default.async(function getPrivateKey$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        _passwordKey = state._passwordKey;

                        console.log(state);
                        console.log(state._passwordKey);

                        if (!_passwordKey) {
                            _context3.next = 5;
                            break;
                        }

                        return _context3.abrupt('return', _passwordKey[public_key]);

                    case 5:
                        if (public_key) {
                            _context3.next = 7;
                            break;
                        }

                        return _context3.abrupt('return', null);

                    case 7:
                        if (public_key.Q) public_key = public_key.toPublicKeyString();
                        private_key_tcomb = rootGetters["PrivateKeyStore/getTcomb_byPubkey"](public_key);

                        if (private_key_tcomb) {
                            _context3.next = 11;
                            break;
                        }

                        return _context3.abrupt('return', null);

                    case 11:
                        _context3.next = 13;
                        return _regenerator2.default.awrap(dispatch("decryptTcomb_PrivateKey", private_key_tcomb));

                    case 13:
                        return _context3.abrupt('return', _context3.sent);

                    case 14:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, null, undefined);
    },

    decryptTcomb_PrivateKey: function decryptTcomb_PrivateKey(_ref7, private_key_tcomb) {
        var getters = _ref7.getters,
            state = _ref7.state;
        var aes_private = state.aes_private,
            _passwordKey = state._passwordKey;

        if (!private_key_tcomb) return null;
        if (getters.isLocked) return ""; //throw new Error("wallet locked")
        if (_passwordKey && _passwordKey[private_key_tcomb.pubkey]) {
            return _passwordKey[private_key_tcomb.pubkey];
        }

        var private_key_hex = aes_private.decryptHex(private_key_tcomb.encrypted_key);
        return _bcxjsCores.PrivateKey.fromBuffer(new Buffer(private_key_hex, 'hex'));
    },

    lockWallet: function lockWallet(_ref8) {
        var rootGetters = _ref8.rootGetters,
            dispatch = _ref8.dispatch,
            commit = _ref8.commit,
            getters = _ref8.getters;

        // if(!(getters.wallet&&getters.wallet.encryption_key)){
        //     return {
        //         code:-7,
        //         message:"Please import the private key"
        //         United Labs of BCTech.
        //     }
        // }
        dispatch("clearKeys");
        // commit(types.SET_PASSWORD_KEY,null);
        // commit(types.SET_AES_PRIVATE,null);
        return {
            code: 1,
            message: "Account locked"
        };
    },
    loadDbData: function loadDbData(_ref9) {
        var state = _ref9.state;

        return _idbHelper2.default.cursor("wallet", function (cursor) {
            if (!cursor) return false;
            var wallet = cursor.value;
            // Convert anything other than a string or number back into its proper type
            wallet.created = new Date(wallet.created);
            wallet.last_modified = new Date(wallet.last_modified);
            wallet.backup_date = wallet.backup_date ? new Date(wallet.backup_date) : null;
            wallet.brainkey_backup_date = wallet.brainkey_backup_date ? new Date(wallet.brainkey_backup_date) : null;
            try {
                (0, _tcomb_structs.WalletTcomb)(wallet);
            } catch (e) {
                console.log("WalletDb format error", e);
            }
            state.wallet = wallet;
            return false; //stop iterating
        });
    },

    createWallet: function createWallet(_ref10, _ref11) {
        var dispatch = _ref10.dispatch;
        var password = _ref11.password,
            account = _ref11.account,
            callback = _ref11.callback,
            _ref11$isCreateAccoun = _ref11.isCreateAccount,
            isCreateAccount = _ref11$isCreateAccoun === undefined ? true : _ref11$isCreateAccoun;

        return dispatch("WalletManagerStore/setWallet", {
            wallet_name: "default",
            create_wallet_password: password
        }, { root: true }).then(function () {
            console.log("Congratulations, your wallet was successfully created.", isCreateAccount);
            if (isCreateAccount) {
                return dispatch('validatePassword', { password: password, unlock: true }).then(function (vp_res) {
                    return dispatch("createAccount", { account_name: account }).then(function (ca_res) {
                        return ca_res;
                    });
                });
            }
            return { code: 1 };
        }).catch(function (err) {
            console.error("CreateWallet failed:", err);
            return { code: 501, message: "CreateWallet failed", error: err };
        });
    },
    _createWallet: function _createWallet(_ref12, _ref13) {
        var state = _ref12.state,
            dispatch = _ref12.dispatch,
            commit = _ref12.commit;
        var password_plaintext = _ref13.password_plaintext,
            brainkey_plaintext = _ref13.brainkey_plaintext,
            _ref13$unlock = _ref13.unlock,
            unlock = _ref13$unlock === undefined ? true : _ref13$unlock,
            _ref13$public_name = _ref13.public_name,
            public_name = _ref13$public_name === undefined ? "default" : _ref13$public_name;

        var walletCreateFct = function walletCreateFct(dictionary) {
            // console.debug('---------------------',dictionary);
            return new _promise2.default(function _callee2(resolve, reject) {
                var brainkey_backup_date, password_aes, encryption_buffer, encryption_key, local_aes_private, brainkey_private, brainkey_pubkey, encrypted_brainkey, password_private, password_pubkey, wallet, transaction, add, end;
                return _regenerator2.default.async(function _callee2$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                if (!(typeof password_plaintext !== 'string')) {
                                    _context4.next = 2;
                                    break;
                                }

                                throw new Error("password string is required");

                            case 2:
                                brainkey_backup_date = void 0;

                                if (!brainkey_plaintext) {
                                    _context4.next = 9;
                                    break;
                                }

                                if (!(typeof brainkey_plaintext !== "string")) {
                                    _context4.next = 6;
                                    break;
                                }

                                throw new Error("Brainkey must be a string");

                            case 6:
                                if (!(brainkey_plaintext.trim() === "")) {
                                    _context4.next = 8;
                                    break;
                                }

                                throw new Error("Brainkey can not be an empty string");

                            case 8:

                                // if (brainkey_plaintext.length < 50)
                                //     throw new Error("Brainkey must be at least 50 characters long")

                                // The user just provided the Brainkey so this avoids
                                // bugging them to back it up again.United Labs of BCTech.
                                brainkey_backup_date = new Date();

                            case 9:
                                password_aes = _bcxjsCores.Aes.fromSeed(password_plaintext);
                                encryption_buffer = _bcxjsCores.key.get_random_key().toBuffer();
                                // encryption_key is the global encryption key (does not change even if the passsword changes)

                                encryption_key = password_aes.encryptToHex(encryption_buffer);
                                // If unlocking, local_aes_private will become the global aes_private object

                                local_aes_private = _bcxjsCores.Aes.fromSeed(encryption_buffer);


                                if (!brainkey_plaintext) brainkey_plaintext = _bcxjsCores.key.get_random_key().toWif(); //key.suggest_brain_key(dictionary.en)
                                else brainkey_plaintext = _bcxjsCores.key.normalize_brainKey(brainkey_plaintext);
                                _context4.next = 16;
                                return _regenerator2.default.awrap(dispatch("getBrainKeyPrivate", brainkey_plaintext));

                            case 16:
                                brainkey_private = _context4.sent;
                                brainkey_pubkey = brainkey_private.toPublicKey().toPublicKeyString();
                                encrypted_brainkey = local_aes_private.encryptToHex(brainkey_plaintext);
                                password_private = _bcxjsCores.PrivateKey.fromSeed(password_plaintext);
                                password_pubkey = password_private.toPublicKey().toPublicKeyString();
                                wallet = {
                                    public_name: public_name,
                                    password_pubkey: password_pubkey,
                                    encryption_key: encryption_key,
                                    encrypted_brainkey: encrypted_brainkey,
                                    brainkey_pubkey: brainkey_pubkey,
                                    brainkey_sequence: 0,
                                    brainkey_backup_date: brainkey_backup_date,
                                    created: new Date(),
                                    last_modified: new Date(),
                                    chain_id: _bcxjsWs.Apis.instance().chain_id
                                };

                                (0, _tcomb_structs.WalletTcomb)(wallet); // validation
                                transaction = transaction_update();
                                add = _idbHelper2.default.add(transaction.objectStore("wallet"), wallet);
                                end = _idbHelper2.default.on_transaction_end(transaction).then(function () {
                                    state.wallet = wallet;
                                    if (unlock) {
                                        commit(types.SET_AES_PRIVATE, local_aes_private);
                                        //state.aes_private = local_aes_private
                                    }
                                });
                                //console.debug('---------------------')

                                resolve(_promise2.default.all([add, end]));

                            case 27:
                            case 'end':
                                return _context4.stop();
                        }
                    }
                }, null, undefined);
            });
        };
        return walletCreateFct();
    },
    getBrainKeyPrivate: function getBrainKeyPrivate(_ref14, brainkey_plaintext) {
        var dispatch = _ref14.dispatch;

        if (!brainkey_plaintext) {
            brainkey_plaintext = dispatch("getBrainKey");
        }
        if (!brainkey_plaintext) throw new Error("missing brainkey");
        return _bcxjsCores.PrivateKey.fromSeed(_bcxjsCores.key.normalize_brainKey(brainkey_plaintext));
    },
    getBrainKey: function getBrainKey(_ref15) {
        var state = _ref15.state,
            getters = _ref15.getters;

        var wallet = state.wallet;
        if (!wallet.encrypted_brainkey) throw new Error("missing brainkey");
        if (!state.aes_private) throw new Error("wallet locked");
        var brainkey_plaintext = getters.aes_private.decryptHexToText(wallet.encrypted_brainkey);
        return brainkey_plaintext;
    },
    createAccount: function createAccount(_ref16, _ref17) {
        var state = _ref16.state,
            getters = _ref16.getters,
            rootGetters = _ref16.rootGetters,
            dispatch = _ref16.dispatch,
            commit = _ref16.commit;
        var account_name = _ref17.account_name,
            registrar = _ref17.registrar,
            referrer = _ref17.referrer,
            referrer_percent = _ref17.referrer_percent,
            refcode = _ref17.refcode;
        var error, owner_private, active_private, updateWallet, owner_pubkey, create_account, create_account_promise, settingsAPIs;
        return _regenerator2.default.async(function createAccount$(_context5) {
            while (1) {
                switch (_context5.prev = _context5.next) {
                    case 0:
                        if (!getters.isLocked) {
                            _context5.next = 3;
                            break;
                        }

                        error = "wallet locked";
                        //this.actions.brainKeyAccountCreateError( error )

                        return _context5.abrupt('return', _promise2.default.reject(error));

                    case 3:
                        _context5.next = 5;
                        return _regenerator2.default.awrap(dispatch("generateNextKey"));

                    case 5:
                        owner_private = _context5.sent;
                        _context5.next = 8;
                        return _regenerator2.default.awrap(dispatch("generateNextKey"));

                    case 8:
                        active_private = _context5.sent;

                        //let memo_private = WalletDb.generateNextKey()
                        updateWallet = function updateWallet() {
                            var transaction = transaction_update_keys();
                            var p = dispatch("saveKeys", { private_keys: [owner_private, active_private], transaction: transaction });
                            return p.catch(function (error) {
                                return transaction.abort();
                            });
                        };

                        owner_pubkey = owner_private.private_key.toPublicKey().toPublicKeyString();

                        create_account = function create_account() {
                            return dispatch("account/application_api_create_account", {
                                owner_pubkey: owner_pubkey,
                                active_pubkey: active_private.private_key.toPublicKey().toPublicKeyString(),
                                new_account_name: account_name,
                                registrar: registrar,
                                referrer: referrer,
                                referrer_percent: referrer_percent,
                                onlyGetFee: false
                            }, { root: true });
                        };

                        create_account_promise = void 0;

                        if (registrar) {
                            // using another user's account as registrar.United Labs of BCTech.
                            //return create_account();
                            create_account_promise = create_account();
                        } else {
                            // using faucet

                            settingsAPIs = rootGetters["setting/g_settingsAPIs"];


                            create_account_promise = _api2.default.Account.createAccount({
                                name: account_name,
                                activePubkey: active_private.private_key.toPublicKey().toPublicKeyString(),
                                ownerPubkey: owner_private.private_key.toPublicKey().toPublicKeyString(),
                                referrer: settingsAPIs.referrer || ''
                            }, settingsAPIs.default_faucet);
                        }

                        return _context5.abrupt('return', create_account_promise.then(function (result) {
                            if (result.error) {
                                // throw result.error;
                                return result;
                            }

                            if (!result.success) {
                                return result;
                            }

                            if (rootGetters["transactions/onlyGetOPFee"] && registrar) {
                                return result;
                            }

                            return dispatch("AccountStore/onCreateAccount", {
                                name_or_account: account_name,
                                owner_pubkey: owner_pubkey
                            }, { root: true }).then(function (account_id) {
                                if (registrar) {
                                    return result;
                                } else {
                                    updateWallet();
                                    return dispatch("account/getAccountInfo", null, { root: true });
                                }
                            });
                        }).catch(function (error) {
                            if (error instanceof TypeError || error.toString().indexOf("ECONNREFUSED") != -1) {
                                console.log("Warning! faucet registration failed, falling back to direct application_api.create_account..");
                                //return create_account();
                            }
                            throw error;
                        }));

                    case 15:
                    case 'end':
                        return _context5.stop();
                }
            }
        }, null, undefined);
    },
    generateNextKey: function generateNextKey(_ref18) {
        var state = _ref18.state,
            dispatch = _ref18.dispatch;
        var save = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
        var brainkey, wallet, sequence, used_sequence, i, private_key, pubkey, next_key;
        return _regenerator2.default.async(function generateNextKey$(_context6) {
            while (1) {
                switch (_context6.prev = _context6.next) {
                    case 0:
                        _context6.next = 2;
                        return _regenerator2.default.awrap(dispatch("getBrainKey"));

                    case 2:
                        brainkey = _context6.sent;
                        wallet = state.wallet;
                        sequence = wallet.brainkey_sequence;
                        used_sequence = null;
                        // Skip ahead in the sequence if any keys are found in use.United Labs of BCTech.
                        // Slowly look ahead (1 new key per block) to keep the wallet fast after unlocking

                        _brainkey_look_ahead = Math.min(10, (_brainkey_look_ahead || 0) + 1);
                        i = sequence;

                    case 8:
                        if (!(i < sequence + _brainkey_look_ahead)) {
                            _context6.next = 20;
                            break;
                        }

                        private_key = _bcxjsCores.key.get_brainPrivateKey(brainkey, i);
                        pubkey = _generateNextKey_pubcache[i] ? _generateNextKey_pubcache[i] : _generateNextKey_pubcache[i] = private_key.toPublicKey().toPublicKeyString();
                        next_key = _bcxjsCores.ChainStore.getAccountRefsOfKey(pubkey);
                        // TODO if ( next_key === undefined ) return undefined

                        if (!(next_key && next_key.size)) {
                            _context6.next = 17;
                            break;
                        }

                        used_sequence = i;
                        console.log("WARN: Private key sequence " + used_sequence + " in-use. " + "I am saving the private key and will go onto the next one.");
                        _context6.next = 17;
                        return _regenerator2.default.awrap(dispatch("saveKey", { private_key: private_key, brainkey_sequence: used_sequence }));

                    case 17:
                        i++;
                        _context6.next = 8;
                        break;

                    case 20:
                        if (!(used_sequence !== null)) {
                            _context6.next = 24;
                            break;
                        }

                        wallet.brainkey_sequence = used_sequence + 1;
                        _context6.next = 24;
                        return _regenerator2.default.awrap(dispatch("_updateWallet"));

                    case 24:
                        sequence = wallet.brainkey_sequence;
                        private_key = _bcxjsCores.key.get_brainPrivateKey(brainkey, sequence);

                        if (!save) {
                            _context6.next = 31;
                            break;
                        }

                        _context6.next = 29;
                        return _regenerator2.default.awrap(dispatch("saveKey", { private_key: private_key, brainkey_sequence: sequence }));

                    case 29:
                        _context6.next = 31;
                        return _regenerator2.default.awrap(dispatch("incrementBrainKeySequence"));

                    case 31:
                        return _context6.abrupt('return', { private_key: private_key, sequence: sequence });

                    case 32:
                    case 'end':
                        return _context6.stop();
                }
            }
        }, null, undefined);
    },
    incrementBrainKeySequence: function incrementBrainKeySequence(_ref19, transaction) {
        var state = _ref19.state,
            dispatch = _ref19.dispatch;

        var wallet = state.wallet;
        // increment in RAM so this can't be out-of-sync
        wallet.brainkey_sequence++;
        // update last modified
        return dispatch("_updateWallet", transaction);
        //TODO .error( error => ErrorStore.onAdd( "wallet", "incrementBrainKeySequence", error ))
    },
    _updateWallet: function _updateWallet(_ref20) {
        var state = _ref20.state;
        var transaction = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : transaction_update();

        var wallet = state.wallet;
        if (!wallet) {
            reject("missing wallet");
            return;
        }
        //DEBUG console.log('... wallet',wallet)
        var wallet_clone = (0, _lodash.cloneDeep)(wallet);
        wallet_clone.last_modified = new Date();

        (0, _tcomb_structs.WalletTcomb)(wallet_clone); // validate

        var wallet_store = transaction.objectStore("wallet");
        var p = _idbHelper2.default.on_request_end(wallet_store.put(wallet_clone));
        var p2 = _idbHelper2.default.on_transaction_end(transaction).then(function () {
            state.wallet = wallet_clone;
        });
        return _promise2.default.all([p, p2]);
    },

    saveKeys: function saveKeys(_ref21, _ref22) {
        var dispatch = _ref21.dispatch;
        var private_keys = _ref22.private_keys,
            transaction = _ref22.transaction,
            public_key_string = _ref22.public_key_string;

        var promises = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = (0, _getIterator3.default)(private_keys), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var private_key_record = _step.value;

                promises.push(dispatch("saveKey", {
                    private_key: private_key_record.private_key,
                    brainkey_sequence: private_key_record.sequence,
                    import_account_names: null, //import_account_names
                    public_key_string: public_key_string,
                    transaction: transaction
                }));
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

        return _promise2.default.all(promises);
    },
    saveKey: function saveKey(_ref23, _ref24) {
        var getters = _ref23.getters,
            state = _ref23.state,
            dispatch = _ref23.dispatch;
        var private_key = _ref24.private_key,
            brainkey_sequence = _ref24.brainkey_sequence,
            import_account_names = _ref24.import_account_names,
            public_key_string = _ref24.public_key_string,
            _ref24$transaction = _ref24.transaction,
            transaction = _ref24$transaction === undefined ? transaction_update_keys() : _ref24$transaction;
        var private_cipherhex, wallet, public_key, private_key_object, p1;
        return _regenerator2.default.async(function saveKey$(_context7) {
            while (1) {
                switch (_context7.prev = _context7.next) {
                    case 0:
                        private_cipherhex = getters.aes_private.encryptToHex(private_key.toBuffer());
                        wallet = state.wallet;

                        if (public_key_string) {
                            _context7.next = 7;
                            break;
                        }

                        //S L O W
                        // console.log('WARN: public key was not provided, this may incur slow performance.-United Labs of BCTech.')
                        public_key = private_key.toPublicKey();

                        public_key_string = public_key.toPublicKeyString();
                        _context7.next = 9;
                        break;

                    case 7:
                        if (!(public_key_string.indexOf(_bcxjsWs.ChainConfig.address_prefix) != 0)) {
                            _context7.next = 9;
                            break;
                        }

                        throw new Error("Public Key should start with " + _bcxjsWs.ChainConfig.address_prefix);

                    case 9:
                        private_key_object = {
                            import_account_names: import_account_names,
                            encrypted_key: private_cipherhex,
                            pubkey: public_key_string,
                            brainkey_sequence: brainkey_sequence
                        };
                        _context7.next = 12;
                        return _regenerator2.default.awrap(dispatch("PrivateKeyStore/addKey", { private_key_object: private_key_object, transaction: transaction }, { root: true }).then(function (ret) {
                            if (TRACE) console.log('... WalletDb.saveKey result', ret.result);
                            return ret;
                        }));

                    case 12:
                        p1 = _context7.sent;
                        return _context7.abrupt('return', p1);

                    case 14:
                    case 'end':
                        return _context7.stop();
                }
            }
        }, null, undefined);
    },
    backupDownload: function backupDownload(_ref25) {
        var rootGetters = _ref25.rootGetters,
            getters = _ref25.getters,
            dispatch = _ref25.dispatch;

        // if(rootGetters["BackupStore/backup"].sha1){
        //     dispatch("BackupStore/download",null,{root:true}).then(res2=>{
        //         callback&&callback(res2);
        //     })
        // }else{
        if (!getters.wallet) {
            return { code: 154, message: "Please restore your wallet first" };
        }
        var backup_pubkey = getters.wallet.password_pubkey;
        return _promise2.default.all([(0, _backup.backup)(backup_pubkey), dispatch("WalletManagerStore/getBackupName", null, { root: true })]).then(function (_ref26) {
            var _ref27 = (0, _slicedToArray3.default)(_ref26, 2),
                contents = _ref27[0],
                name = _ref27[1];

            return dispatch("BackupStore/incommingBuffer", { name: name, contents: contents }, { root: true }).then(function (res) {
                if (res.code == 1) {
                    return dispatch("BackupStore/download", null, { root: true });
                } else {
                    return res;
                }
            });
        });
        //}
    },
    setBackupDate: function setBackupDate(_ref28) {
        var getters = _ref28.getters,
            dispatch = _ref28.dispatch;

        var wallet = getters.wallet;
        wallet.backup_date = new Date();
        return dispatch("_updateWallet");
    },
    importKeysWorker: function importKeysWorker(_ref29, private_key_objs) {
        var dispatch = _ref29.dispatch,
            state = _ref29.state;

        return new _promise2.default(function (resolve, reject) {
            var pubkeys = [];
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = (0, _getIterator3.default)(private_key_objs), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var _private_key_obj = _step2.value;

                    pubkeys.push(_private_key_obj.public_key_string);
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

            var addyIndexPromise = dispatch("AddressIndex/addAll", pubkeys, { root: true });

            var private_plainhex_array = [];
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = (0, _getIterator3.default)(private_key_objs), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var _private_key_obj2 = _step3.value;

                    private_plainhex_array.push(_private_key_obj2.private_plainhex);
                } // var AesWorker = require("worker?name=/[hash].js!../workers/AesWorker")
                // var worker = new AesWorker
                // worker.postMessage({
                //     private_plainhex_array,
                //     key: aes_private.key, iv: aes_private.iv
                // })
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

            console.log("AesWorker start");

            var _private_plainhex_arr = {
                private_plainhex_array: private_plainhex_array,
                key: state.aes_private.key, iv: state.aes_private.iv
            },
                private_plainhex_array = _private_plainhex_arr.private_plainhex_array,
                iv = _private_plainhex_arr.iv,
                key = _private_plainhex_arr.key;


            var aes = new _bcxjsCores.Aes(iv, key);
            var private_cipherhex_array = [];
            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = (0, _getIterator3.default)(private_plainhex_array), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var _private_plainhex = _step4.value;

                    var private_cipherhex = aes.encryptHex(_private_plainhex);
                    private_cipherhex_array.push(private_cipherhex);
                }
                // postMessage( private_cipherhex_array )
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

            console.log("AesWorker done");

            var _this = undefined;
            state.saving_keys = true;

            // worker.onmessage = event => {
            try {
                console.log("Preparing for private keys save");
                var private_cipherhex_array = private_cipherhex_array;
                var enc_private_key_objs = [];
                for (var i = 0; i < private_key_objs.length; i++) {
                    var private_key_obj = private_key_objs[i];
                    var import_account_names = private_key_obj.import_account_names,
                        public_key_string = private_key_obj.public_key_string,
                        private_plainhex = private_key_obj.private_plainhex;

                    var private_cipherhex = private_cipherhex_array[i];
                    if (!public_key_string) {
                        // console.log('WARN: public key was not provided, this will incur slow performance')
                        var private_key = _bcxjsCores.PrivateKey.fromHex(private_plainhex);
                        var public_key = private_key.toPublicKey(); // S L O W
                        public_key_string = public_key.toPublicKeyString();
                    } else if (public_key_string.indexOf(_bcxjsWs.ChainConfig.address_prefix) != 0) throw new Error("Public Key should start with " + _bcxjsWs.ChainConfig.address_prefix);

                    var private_key_object = {
                        import_account_names: import_account_names,
                        encrypted_key: private_cipherhex,
                        pubkey: public_key_string
                        // null brainkey_sequence
                    };
                    enc_private_key_objs.push(private_key_object);
                }
                console.log("Saving private keys", new Date().toString());
                var transaction = transaction_update_keys();
                var insertKeysPromise = _idbHelper2.default.on_transaction_end(transaction);
                try {
                    var duplicate_count = dispatch("PrivateKeyStore/addPrivateKeys_noindex", {
                        private_key_objects: enc_private_key_objs,
                        transaction: transaction }, { root: true });
                    //
                    if (private_key_objs.length != duplicate_count) dispatch("_updateWallet", transaction);
                    state.saving_keys = false;
                    resolve(_promise2.default.all([insertKeysPromise, addyIndexPromise]).then(function () {
                        console.log("Done saving keys", new Date().toString());
                        // return { duplicate_count }
                    }));
                } catch (e) {
                    transaction.abort();
                    console.error(e);
                    reject(e);
                }
            } catch (e) {
                console.error('AesWorker.encrypt', e);
            }
            // }
        });
    }
    // const isLocked=()=>{
    //     return aes_private ? false : true;
    // }

};var transaction_update = function transaction_update() {
    var transaction = _idbInstance2.default.instance().db().transaction(["wallet"], "readwrite");
    return transaction;
};

var transaction_update_keys = function transaction_update_keys() {
    var transaction = _idbInstance2.default.instance().db().transaction(["wallet", "private_keys"], "readwrite");
    return transaction;
};

var mutations = (_mutations = {}, (0, _defineProperty3.default)(_mutations, types.SET_PASSWORD_KEY, function (state, keys) {
    state._passwordKey = keys;
}), (0, _defineProperty3.default)(_mutations, types.SET_AES_PRIVATE, function (state, aes_private) {
    state.aes_private = aes_private;
}), _mutations);

exports.default = {
    state: initialState,
    mutations: mutations,
    actions: actions,
    getters: getters,
    namespaced: true
};