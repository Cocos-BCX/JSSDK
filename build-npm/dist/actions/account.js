"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAccountInfo = exports.claimVestingBalance = exports.getVestingBalances = exports.setAccountUserId = exports.fetchCurrentUser = exports._validateAccount = exports._accountOpt = exports.accountOpt = exports._getPrivateKey = exports.checkIfUsernameFree = exports.checkCachedUserData = exports._logout = exports.logout = exports.changePassword = exports.upgradeAccount = exports.passwordLogin = exports.getInitialState = exports.saveImport = exports.importWIFKey = exports.importPrivateKey = exports.keyLogin = exports.account_signup_complete = exports.application_api_create_account = exports.createAccountWithWallet = exports.createAccountWithPublicKey = exports.createAccountWithPassword = exports.lockWallet = exports.unlockWallet = undefined;

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _slicedToArray2 = require("babel-runtime/helpers/slicedToArray");

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _bcxjsCores = require("bcxjs-cores");

var _immutable = require("immutable");

var _immutable2 = _interopRequireDefault(_immutable);

var _mutations = require("../mutations");

var types = _interopRequireWildcard(_mutations);

var _api = require("../services/api");

var _api2 = _interopRequireDefault(_api);

var _persistentStorage = require("../services/persistent-storage");

var _persistentStorage2 = _interopRequireDefault(_persistentStorage);

var _WalletDb = require("../store/WalletDb");

var WalletDbS = _interopRequireWildcard(_WalletDb);

var _utils = require("../lib/common/utils");

var _utils2 = _interopRequireDefault(_utils);

var _helper = require("../lib/common/helper");

var _helper2 = _interopRequireDefault(_helper);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _passwordKey = null;
// import _dictionary from '../../test/brainkey_dictionary.js';United Labs of BCTech.

var OWNER_KEY_INDEX = 1;
var ACTIVE_KEY_INDEX = 0;

// helper fync
var createWallet = function createWallet(_ref) {
  var password = _ref.password,
      wif = _ref.wif;

  var passwordAes = _bcxjsCores.Aes.fromSeed(password);
  var encryptionBuffer = _bcxjsCores.key.get_random_key().toBuffer();
  var encryptionKey = passwordAes.encryptToHex(encryptionBuffer);
  var aesPrivate = _bcxjsCores.Aes.fromSeed(encryptionBuffer);

  var private_key = _bcxjsCores.PrivateKey.fromWif(wif); //could throw and error
  var private_plainhex = private_key.toBuffer().toString('hex');
  // const brainkey = API.Account.suggestBrainkey(_dictionary.en);
  // const normalizedBrainkey = key.normalize_brainKey(brainkey);
  // const encryptedBrainkey = aesPrivate.encryptToHex(normalizedBrainkey);
  var encrypted_key = aesPrivate.encryptHex(private_plainhex);

  var passwordPrivate = _bcxjsCores.PrivateKey.fromSeed(password);
  var passwordPubkey = passwordPrivate.toPublicKey().toPublicKeyString();

  var result = {
    passwordPubkey: passwordPubkey,
    encryptionKey: encryptionKey,
    encrypted_key: encrypted_key,
    aesPrivate: aesPrivate
  };

  return result;
};

/**United Labs of BCTech.
 * Unlocks user's wallet via provided password
 * @param {string} password - user password
 */
var unlockWallet = exports.unlockWallet = function unlockWallet(_ref2, password) {
  var commit = _ref2.commit,
      state = _ref2.state;

  var passwordAes = _bcxjsCores.Aes.fromSeed(password);
  var encryptionPlainbuffer = passwordAes.decryptHexToBuffer(state.encryptionKey);
  var aesPrivate = _bcxjsCores.Aes.fromSeed(encryptionPlainbuffer);
  commit(types.ACCOUNT_UNLOCK_WALLET, aesPrivate);
};

/**
 * Locks user's wallet
 */
var lockWallet = exports.lockWallet = function lockWallet(_ref3) {
  var commit = _ref3.commit;

  commit(types.ACCOUNT_LOCK_WALLET);
};

/**
 * Creates account & wallet for user
 * @param {string} name - user name
 * @param {string} password - user password
 * @param {string} dictionary - string to generate brainkey from
 */
var createAccountWithPassword = exports.createAccountWithPassword = function _callee(store, params) {
  var account, password, _params$autoLogin, autoLogin, _params$onlyGetFee, onlyGetFee, commit, dispatch, rootGetters, getters, acc_res, _WalletDbS$generateKe, owner_private, _WalletDbS$generateKe2, active_private, result, exist_account_id, settingsAPIs, userId, id;

  return _regenerator2.default.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (_helper2.default.trimParams(params)) {
            _context.next = 2;
            break;
          }

          return _context.abrupt("return", { code: 101, message: "Parameter is missing" });

        case 2:
          account = params.account, password = params.password, _params$autoLogin = params.autoLogin, autoLogin = _params$autoLogin === undefined ? false : _params$autoLogin, _params$onlyGetFee = params.onlyGetFee, onlyGetFee = _params$onlyGetFee === undefined ? false : _params$onlyGetFee;

          if (/^[a-z]([a-z0-9\.-]){4,63}$/.test(account)) {
            _context.next = 5;
            break;
          }

          return _context.abrupt("return", { code: 103, message: "Please enter the correct account name(/^[a-z]([a-z0-9\.-]){4,63}$/)" });

        case 5:
          commit = store.commit, dispatch = store.dispatch, rootGetters = store.rootGetters, getters = store.getters;
          _context.next = 8;
          return _regenerator2.default.awrap(dispatch("user/getUserInfo", { account: account, isCache: true }, { root: true }));

        case 8:
          acc_res = _context.sent;

          if (!(acc_res.code == 1)) {
            _context.next = 11;
            break;
          }

          return _context.abrupt("return", { code: 159, message: "Account exists" });

        case 11:

          commit(types.ACCOUNT_SIGNUP_REQUEST);
          //generate owner and active keys
          _WalletDbS$generateKe = WalletDbS.generateKeyFromPassword(account, "owner", password), owner_private = _WalletDbS$generateKe.privKey;
          _WalletDbS$generateKe2 = WalletDbS.generateKeyFromPassword(account, "active", password), active_private = _WalletDbS$generateKe2.privKey;
          // getAccountUserId

          result = void 0;
          exist_account_id = getters.getAccountUserId;

          if (!exist_account_id) {
            _context.next = 22;
            break;
          }

          _context.next = 19;
          return _regenerator2.default.awrap(dispatch("application_api_create_account", {
            owner_pubkey: owner_private.toPublicKey().toPublicKeyString(),
            active_pubkey: active_private.toPublicKey().toPublicKeyString(),
            new_account_name: account,
            registrar: exist_account_id,
            referrer: exist_account_id,
            referrer_percent: 0,
            onlyGetFee: onlyGetFee
          }));

        case 19:
          return _context.abrupt("return", _context.sent);

        case 22:
          settingsAPIs = rootGetters["setting/g_settingsAPIs"];
          //faucet account registration

          _context.next = 25;
          return _regenerator2.default.awrap(_api2.default.Account.createAccount({
            name: account,
            activePubkey: active_private.toPublicKey().toPublicKeyString(),
            ownerPubkey: owner_private.toPublicKey().toPublicKeyString(),
            referrer: settingsAPIs.referrer || ''
          }, settingsAPIs.default_faucet));

        case 25:
          result = _context.sent;

        case 26:

          console.log('Account created : ', result.success);

          if (!result.success) {
            _context.next = 35;
            break;
          }

          _context.next = 30;
          return _regenerator2.default.awrap(_api2.default.Account.getAccountIdByOwnerPubkey(result.data.account.owner_key));

        case 30:
          userId = _context.sent;
          id = userId && userId[0];

          if (id) id = userId[0];
          return _context.abrupt("return", new _promise2.default(function (resolve) {
            setTimeout(function () {
              if (autoLogin) {
                resolve(dispatch("account/passwordLogin", {
                  account: account,
                  password: password
                }, { root: true }));
              } else {
                resolve({ code: 1, data: { account_id: id, account_name: account } });
              }
            }, 2000);
          }));

        case 35:

          commit(types.ACCOUNT_SIGNUP_ERROR, { error: result.error });
          return _context.abrupt("return", { code: 0, message: result.error, error: result.error });

        case 37:
        case "end":
          return _context.stop();
      }
    }
  }, null, undefined);
};

var createAccountWithPublicKey = exports.createAccountWithPublicKey = function _callee2(store, params) {
  var account, ownerPubkey, activePubkey, commit, dispatch, rootGetters, getters, acc_res, result, exist_account_id, settingsAPIs, userId, id;
  return _regenerator2.default.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          if (_helper2.default.trimParams(params)) {
            _context2.next = 2;
            break;
          }

          return _context2.abrupt("return", { code: 101, message: "Parameter is missing" });

        case 2:
          account = params.account, ownerPubkey = params.ownerPubkey, activePubkey = params.activePubkey;

          if (/^[a-z]([a-z0-9\.-]){4,63}$/.test(account)) {
            _context2.next = 5;
            break;
          }

          return _context2.abrupt("return", { code: 103, message: "Please enter the correct account name(/^[a-z]([a-z0-9\.-]){4,63}$/)" });

        case 5:
          commit = store.commit, dispatch = store.dispatch, rootGetters = store.rootGetters, getters = store.getters;
          _context2.next = 8;
          return _regenerator2.default.awrap(dispatch("user/getUserInfo", { account: account, isCache: true }, { root: true }));

        case 8:
          acc_res = _context2.sent;

          if (!(acc_res.code == 1)) {
            _context2.next = 11;
            break;
          }

          return _context2.abrupt("return", { code: 159, message: "Account exists" });

        case 11:

          commit(types.ACCOUNT_SIGNUP_REQUEST);
          result = void 0;
          exist_account_id = getters.getAccountUserId;

          if (!exist_account_id) {
            _context2.next = 20;
            break;
          }

          _context2.next = 17;
          return _regenerator2.default.awrap(dispatch("application_api_create_account", {
            owner_pubkey: ownerPubkey,
            active_pubkey: activePubkey,
            new_account_name: account,
            registrar: exist_account_id,
            referrer: exist_account_id,
            referrer_percent: 0
          }));

        case 17:
          return _context2.abrupt("return", _context2.sent);

        case 20:
          settingsAPIs = rootGetters["setting/g_settingsAPIs"];
          //faucet account registration

          _context2.next = 23;
          return _regenerator2.default.awrap(_api2.default.Account.createAccount({
            name: account,
            activePubkey: activePubkey,
            ownerPubkey: ownerPubkey,
            referrer: settingsAPIs.referrer || ''
          }, settingsAPIs.default_faucet));

        case 23:
          result = _context2.sent;

        case 24:

          console.log('Account created : ', result.success);

          if (!result.success) {
            _context2.next = 32;
            break;
          }

          _context2.next = 28;
          return _regenerator2.default.awrap(_api2.default.Account.getAccountIdByOwnerPubkey(result.data.account.owner_key));

        case 28:
          userId = _context2.sent;
          id = userId && userId[0];

          if (id) id = userId[0];
          // console.info("id",id,result);
          return _context2.abrupt("return", { code: 1, data: {
              "account_id": id,
              account_name: account,
              active_public_key: activePubkey,
              owner_public_key: ownerPubkey
            } });

        case 32:

          commit(types.ACCOUNT_SIGNUP_ERROR, { error: result.error });
          return _context2.abrupt("return", { code: 0, message: result.error, error: result.error });

        case 34:
        case "end":
          return _context2.stop();
      }
    }
  }, null, undefined);
};

var createAccountWithWallet = exports.createAccountWithWallet = function _callee3(_ref4, params) {
  var dispatch = _ref4.dispatch,
      rootGetters = _ref4.rootGetters;

  var callback, account, password, _params$onlyGetFee2, onlyGetFee, acc_res;

  return _regenerator2.default.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          if (_helper2.default.trimParams(params)) {
            _context3.next = 2;
            break;
          }

          return _context3.abrupt("return", { code: 101, message: "Parameter is missing" });

        case 2:
          callback = params.callback, account = params.account, password = params.password, _params$onlyGetFee2 = params.onlyGetFee, onlyGetFee = _params$onlyGetFee2 === undefined ? false : _params$onlyGetFee2;

          dispatch("transactions/setOnlyGetOPFee", onlyGetFee, { root: true });

          if (/^[a-z]([a-z0-9\.-]){4,63}/.test(account)) {
            _context3.next = 6;
            break;
          }

          return _context3.abrupt("return", { code: 103, message: "Please enter the correct account name(/^[a-z]([a-z0-9\.-]){4,63}/)" });

        case 6:
          if (rootGetters["WalletDb/wallet"]) {
            _context3.next = 9;
            break;
          }

          _context3.next = 9;
          return _regenerator2.default.awrap(dispatch("account/_logout", null, { root: true }));

        case 9:
          _context3.next = 11;
          return _regenerator2.default.awrap(dispatch("user/getUserInfo", { account: account, isCache: true }, { root: true }));

        case 11:
          acc_res = _context3.sent;

          if (!(acc_res.code == 1)) {
            _context3.next = 14;
            break;
          }

          return _context3.abrupt("return", { code: 159, message: "Account exists" });

        case 14:
          if (!rootGetters["WalletDb/wallet"]) {
            _context3.next = 20;
            break;
          }

          if (!rootGetters["WalletDb/isLocked"]) {
            _context3.next = 17;
            break;
          }

          return _context3.abrupt("return", { code: 149, message: "Please unlock your wallet first" });

        case 17:
          return _context3.abrupt("return", dispatch("WalletDb/createAccount", {
            account_name: account,
            registrar: rootGetters["account/getAccountUserId"],
            referrer: rootGetters["account/getAccountUserId"]
          }, { root: true }).then(function (res) {
            if (res.code != 1) {
              dispatch("WalletManagerStore/deleteWallet", null, { root: true });
            }
            return res;
          }).catch(function (error) {
            return { code: 0, message: error.message, error: error };
          }));

        case 20:
          return _context3.abrupt("return", dispatch("WalletDb/createWallet", { password: password, account: account }, { root: true }));

        case 21:
        case "end":
          return _context3.stop();
      }
    }
  }, null, undefined);
};

var application_api_create_account = exports.application_api_create_account = function application_api_create_account(_ref5, _ref6) {
  var dispatch = _ref5.dispatch;
  var owner_pubkey = _ref6.owner_pubkey,
      active_pubkey = _ref6.active_pubkey,
      new_account_name = _ref6.new_account_name,
      registrar = _ref6.registrar,
      referrer = _ref6.referrer,
      _ref6$onlyGetFee = _ref6.onlyGetFee,
      onlyGetFee = _ref6$onlyGetFee === undefined ? false : _ref6$onlyGetFee,
      _ref6$referrer_percen = _ref6.referrer_percent,
      referrer_percent = _ref6$referrer_percen === undefined ? 0 : _ref6$referrer_percen;


  _bcxjsCores.ChainValidation.required(registrar, "registrar_id");
  _bcxjsCores.ChainValidation.required(referrer, "referrer_id");

  return _promise2.default.all([(0, _bcxjsCores.FetchChain)("getAccount", registrar), (0, _bcxjsCores.FetchChain)("getAccount", referrer)]).then(function (res) {
    var _res = (0, _slicedToArray3.default)(res, 2),
        chain_registrar = _res[0],
        chain_referrer = _res[1];

    var ca_res = dispatch('transactions/_transactionOperations', {
      operations: [{
        op_type: 5,
        type: "account_create",
        params: {
          fee: {
            amount: 0,
            asset_id: 0
          },
          "registrar": chain_registrar.get("id"),
          "referrer": chain_referrer.get("id"),
          "referrer_percent": referrer_percent,
          "name": new_account_name,
          "owner": {
            "weight_threshold": 1,
            "account_auths": [],
            "key_auths": [[owner_pubkey, 1]],
            "address_auths": []
          },
          "active": {
            "weight_threshold": 1,
            "account_auths": [],
            "key_auths": [[active_pubkey, 1]],
            "address_auths": []
          },
          "options": {
            "memo_key": active_pubkey,
            "voting_account": "1.2.5",
            "num_witness": 0,
            "num_committee": 0,
            "votes": []
          }
        }
      }],
      onlyGetFee: onlyGetFee
    }, { root: true });
    return ca_res;
  });
};

var account_signup_complete = exports.account_signup_complete = function account_signup_complete(_ref7, _ref8) {
  var commit = _ref7.commit;
  var wallet = _ref8.wallet,
      userId = _ref8.userId;

  commit(types.ACCOUNT_LOGIN_COMPLETE, { wallet: wallet, userId: userId });
};

var keyLogin = exports.keyLogin = function _callee4(store, params) {
  var _params$password, password, wif, commit, dispatch, rootGetters, private_key, activePubkey, userId, id, wallet;

  return _regenerator2.default.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          if (_helper2.default.trimParams(params)) {
            _context4.next = 2;
            break;
          }

          return _context4.abrupt("return", { code: 101, message: "Parameter is missing" });

        case 2:
          _params$password = params.password, password = _params$password === undefined ? "" : _params$password, wif = params.wif;

          if (/^5[HJK][1-9A-Za-z]{49}$/.test(wif)) {
            _context4.next = 5;
            break;
          }

          return _context4.abrupt("return", { code: 109, message: "Please enter the correct private key" });

        case 5:
          commit = store.commit, dispatch = store.dispatch, rootGetters = store.rootGetters;

          if (!rootGetters["WalletDb/wallet"]) {
            _context4.next = 9;
            break;
          }

          _context4.next = 9;
          return _regenerator2.default.awrap(dispatch("WalletManagerStore/deleteWallet", null, { root: true }));

        case 9:
          private_key = _bcxjsCores.PrivateKey.fromWif(wif); //could throw and error

          activePubkey = private_key.toPublicKey().toPublicKeyString();
          _context4.next = 13;
          return _regenerator2.default.awrap(_api2.default.Account.getAccountIdByOwnerPubkey(activePubkey));

        case 13:
          userId = _context4.sent;
          id = userId && userId[0];

          if (!id) {
            _context4.next = 26;
            break;
          }

          _context4.next = 18;
          return _regenerator2.default.awrap(dispatch("_logout"));

        case 18:
          wallet = createWallet({ password: password, wif: wif });

          commit(types.ACCOUNT_LOGIN_COMPLETE, { wallet: wallet, userId: id });
          _persistentStorage2.default.saveUserData({
            id: id,
            encrypted_key: wallet.encrypted_key,
            encryptionKey: wallet.encryptionKey,
            passwordPubkey: wallet.passwordPubkey,
            activePubkey: activePubkey
          });

          dispatch("PrivateKeyStore/setKeys", {
            import_account_names: [id],
            encrypted_key: wallet.encrypted_key,
            pubkey: activePubkey
          }, { root: true });
          dispatch('WalletDb/validatePassword', { password: password, unlock: true }, { root: true });

          _context4.next = 25;
          return _regenerator2.default.awrap(dispatch("user/fetchUser", id, { root: true }));

        case 25:
          return _context4.abrupt("return", dispatch("getAccountInfo"));

        case 26:
          commit(types.ACCOUNT_LOGIN_ERROR, { error: 'Login error' });
          return _context4.abrupt("return", {
            code: 110,
            message: 'The private key has no account information'
          });

        case 28:
        case "end":
          return _context4.stop();
      }
    }
  }, null, undefined);
};

var importPrivateKey = exports.importPrivateKey = function _callee5(_ref9, params) {
  var rootGetters = _ref9.rootGetters,
      state = _ref9.state,
      dispatch = _ref9.dispatch;

  var _params$password2, password, privateKey, accounts, vp_res, private_key, private_plainhex, public_key, public_key_string, userId, id, acc_res, account_name;

  return _regenerator2.default.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          if (_helper2.default.trimParams(params)) {
            _context5.next = 2;
            break;
          }

          return _context5.abrupt("return", { code: 101, message: "Parameter is missing" });

        case 2:
          _params$password2 = params.password, password = _params$password2 === undefined ? "" : _params$password2, privateKey = params.privateKey;
          accounts = rootGetters["AccountStore/linkedAccounts"].toJS();

          if (!accounts.length) {
            _context5.next = 10;
            break;
          }

          _context5.next = 7;
          return _regenerator2.default.awrap(dispatch("WalletDb/validatePassword", { password: password, unlock: true }, { root: true }));

        case 7:
          vp_res = _context5.sent;

          if (!(vp_res.code != 1)) {
            _context5.next = 10;
            break;
          }

          return _context5.abrupt("return", vp_res);

        case 10:
          if (rootGetters["WalletDb/wallet"]) {
            _context5.next = 13;
            break;
          }

          _context5.next = 13;
          return _regenerator2.default.awrap(dispatch("account/_logout", null, { root: true }));

        case 13:
          private_key = _bcxjsCores.PrivateKey.fromWif(privateKey); //could throw and error

          private_plainhex = private_key.toBuffer().toString('hex');
          public_key = private_key.toPublicKey(); // S L O W

          public_key_string = public_key.toPublicKeyString();

          state.imported_keys_public[public_key_string] = true;

          if (!rootGetters["PrivateKeyStore/keys"][public_key_string]) {
            _context5.next = 20;
            break;
          }

          return _context5.abrupt("return", { code: 160, message: "The private key has been imported into the wallet" });

        case 20:
          _context5.next = 22;
          return _regenerator2.default.awrap(_api2.default.Account.getAccountIdByOwnerPubkey(public_key_string));

        case 22:
          userId = _context5.sent;
          id = userId && userId[0];
          acc_res = void 0, account_name = "";

          if (!id) {
            _context5.next = 38;
            break;
          }

          _context5.next = 28;
          return _regenerator2.default.awrap(dispatch("user/fetchUserForIsSave", { nameOrId: id, isSave: true }, { root: true }));

        case 28:
          acc_res = _context5.sent;

          if (!acc_res.success) {
            _context5.next = 35;
            break;
          }

          account_name = acc_res.data.account.name;
          _context5.next = 33;
          return _regenerator2.default.awrap(dispatch("AccountStore/setCurrentAccount", account_name, { root: true }));

        case 33:
          _context5.next = 36;
          break;

        case 35:
          return _context5.abrupt("return", acc_res);

        case 36:
          _context5.next = 39;
          break;

        case 38:
          return _context5.abrupt("return", { code: 110, message: "The private key has no account information" });

        case 39:

          state.keys_to_account[private_plainhex] = {
            account_names: [account_name], public_key_string: public_key_string
          };

          if (!rootGetters["WalletDb/wallet"]) {
            _context5.next = 44;
            break;
          }

          return _context5.abrupt("return", dispatch("importWIFKey", { password: password, public_key_string: public_key_string }));

        case 44:
          return _context5.abrupt("return", dispatch("WalletDb/createWallet", { password: password, isCreateAccount: false }, { root: true }).then(function () {
            return dispatch("importWIFKey", { password: password, p_public_key_string: public_key_string });
          }));

        case 45:
        case "end":
          return _context5.stop();
      }
    }
  }, null, undefined);
};

var importWIFKey = exports.importWIFKey = function _callee6(_ref10, _ref11) {
  var rootGetters = _ref10.rootGetters,
      state = _ref10.state,
      dispatch = _ref10.dispatch;
  var password = _ref11.password,
      p_public_key_string = _ref11.p_public_key_string;

  var keys, dups, _public_key_string, keys_to_account, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, private_plainhex, _keys_to_account$priv, account_names, public_key_string;

  return _regenerator2.default.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          keys = rootGetters["PrivateKeyStore/keys"];
          dups = {};
          _context6.t0 = _regenerator2.default.keys(state.imported_keys_public);

        case 3:
          if ((_context6.t1 = _context6.t0()).done) {
            _context6.next = 11;
            break;
          }

          _public_key_string = _context6.t1.value;

          if (keys[_public_key_string]) {
            _context6.next = 7;
            break;
          }

          return _context6.abrupt("continue", 3);

        case 7:
          delete state.imported_keys_public[_public_key_string];
          dups[_public_key_string] = true;
          _context6.next = 3;
          break;

        case 11:
          if (!((0, _keys2.default)(state.imported_keys_public).length === 0)) {
            _context6.next = 13;
            break;
          }

          return _context6.abrupt("return", { code: 149, message: "This wallet has already been imported" });

        case 13:
          keys_to_account = state.keys_to_account;
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context6.prev = 17;

          for (_iterator = (0, _getIterator3.default)((0, _keys2.default)(keys_to_account)); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            private_plainhex = _step.value;
            _keys_to_account$priv = keys_to_account[private_plainhex], account_names = _keys_to_account$priv.account_names, public_key_string = _keys_to_account$priv.public_key_string;

            if (dups[public_key_string]) delete keys_to_account[private_plainhex];
          }

          _context6.next = 25;
          break;

        case 21:
          _context6.prev = 21;
          _context6.t2 = _context6["catch"](17);
          _didIteratorError = true;
          _iteratorError = _context6.t2;

        case 25:
          _context6.prev = 25;
          _context6.prev = 26;

          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }

        case 28:
          _context6.prev = 28;

          if (!_didIteratorError) {
            _context6.next = 31;
            break;
          }

          throw _iteratorError;

        case 31:
          return _context6.finish(28);

        case 32:
          return _context6.finish(25);

        case 33:
          return _context6.abrupt("return", dispatch('WalletDb/validatePassword', { password: password, unlock: true }, { root: true }).then(function (res) {
            if (res.code == 1) {
              return dispatch("saveImport");
            } else {
              return res;
            }
          }));

        case 34:
        case "end":
          return _context6.stop();
      }
    }
  }, null, undefined, [[17, 21, 25, 33], [26,, 28, 32]]);
};

var saveImport = exports.saveImport = function saveImport(_ref12) {
  var state = _ref12.state,
      dispatch = _ref12.dispatch,
      rootGetters = _ref12.rootGetters;

  var keys_to_account = state.keys_to_account;
  var private_key_objs = [];
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = (0, _getIterator3.default)((0, _keys2.default)(keys_to_account)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var private_plainhex = _step2.value;
      var _keys_to_account$priv2 = keys_to_account[private_plainhex],
          account_names = _keys_to_account$priv2.account_names,
          public_key_string = _keys_to_account$priv2.public_key_string;

      private_key_objs.push({
        private_plainhex: private_plainhex,
        import_account_names: account_names,
        public_key_string: public_key_string
      });
    }
    // this.reset()
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

  dispatch("getInitialState");
  return dispatch("WalletDb/importKeysWorker", private_key_objs, { root: true }).then(function (result) {

    var import_count = private_key_objs.length;
    console.log("Successfully imported " + import_count + " keys.");
    // this.onCancel() // back to claim balances. United Labs of BCTech.

    return dispatch("AccountStore/onCreateAccount", { name_or_account: private_key_objs[0].import_account_names[0] }, { root: true }).then(function () {
      var names = rootGetters["AccountStore/linkedAccounts"].toArray().sort();
      return dispatch("getAccountInfo");
    });
  }).catch(function (error) {
    console.error("error:", error);
    var message = error;
    try {
      message = error.target.error.message;
    } catch (e) {}
    return { code: 150, message: "Key import error: " + message, error: error };
  });
};

var getInitialState = exports.getInitialState = function getInitialState(_ref13) {
  var state = _ref13.state;
  var keep_file_name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  state.keys_to_account = {};
  state.no_file = true;
  state.account_keys = [];
  state.reset_file_name = keep_file_name ? undefined.state.reset_file_name : Date.now();
  state.reset_password = Date.now();
  state.password_checksum = null;
  state.import_file_message = null;
  state.import_password_message = null;
  state.imported_keys_public = {};
  state.key_text_message = null;
  state.validPassword = false;
  state.error_message = null;
  state.wif = "";
  state.encrypt_wif = false;
};

var passwordLogin = exports.passwordLogin = function _callee7(store, params) {
  var account, password, commit, rootGetters, dispatch, _ref14, ownerKey, _ref15, activeKey, ownerPubkey, userId, id, vp_result;

  return _regenerator2.default.async(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          if (_helper2.default.trimParams(params)) {
            _context7.next = 2;
            break;
          }

          return _context7.abrupt("return", { code: 101, message: "Parameter is missing" });

        case 2:
          account = params.account, password = params.password;
          commit = store.commit, rootGetters = store.rootGetters, dispatch = store.dispatch;

          commit(types.ACCOUNT_LOGIN_REQUEST);

          _context7.next = 7;
          return _regenerator2.default.awrap(dispatch("WalletDb/generateKeyFromPassword", {
            account: account,
            role: "owner",
            password: password
          }, { root: true }));

        case 7:
          _ref14 = _context7.sent;
          ownerKey = _ref14.privKey;
          _context7.next = 11;
          return _regenerator2.default.awrap(dispatch("WalletDb/generateKeyFromPassword", {
            account: account,
            role: "active",
            password: password
          }, { root: true }));

        case 11:
          _ref15 = _context7.sent;
          activeKey = _ref15.privKey;
          ownerPubkey = ownerKey.toPublicKey().toPublicKeyString();
          _context7.next = 16;
          return _regenerator2.default.awrap(_api2.default.Account.getAccountIdByOwnerPubkey(ownerPubkey));

        case 16:
          userId = _context7.sent;
          id = userId && userId[0];

          if (!id) {
            _context7.next = 41;
            break;
          }

          if (!rootGetters["WalletDb/wallet"]) {
            _context7.next = 24;
            break;
          }

          _context7.next = 22;
          return _regenerator2.default.awrap(dispatch("WalletManagerStore/deleteWallet", null, { root: true }));

        case 22:
          _context7.next = 26;
          break;

        case 24:
          _context7.next = 26;
          return _regenerator2.default.awrap(dispatch("_logout"));

        case 26:
          _context7.next = 28;
          return _regenerator2.default.awrap(dispatch("WalletDb/validatePassword", {
            password: password,
            unlock: true,
            account: account,
            roles: ["active", "owner", "memo"]
          }, { root: true }));

        case 28:
          vp_result = _context7.sent;


          delete vp_result.cloudMode;
          delete vp_result.success;

          if (!(vp_result.code != 1)) {
            _context7.next = 33;
            break;
          }

          return _context7.abrupt("return", vp_result);

        case 33:

          id = userId[0];

          commit(types.ACCOUNT_LOGIN_COMPLETE, { userId: id });
          _persistentStorage2.default.saveUserData({ id: id });

          _context7.next = 38;
          return _regenerator2.default.awrap(dispatch("getAccountInfo"));

        case 38:
          return _context7.abrupt("return", _context7.sent);

        case 41:
          commit(types.ACCOUNT_LOGIN_ERROR, { error: 'Login error' });
          return _context7.abrupt("return", {
            code: 108,
            //Please confirm that account is registered through account mode, accounts registered in wallet mode cannot login here.
            message: 'User name or password error (please confirm that your account is registered in account mode)'
          });

        case 43:
        case "end":
          return _context7.stop();
      }
    }
  }, null, undefined);
};

var upgradeAccount = exports.upgradeAccount = function upgradeAccount(_ref16, _ref17) {
  var dispatch = _ref16.dispatch,
      getters = _ref16.getters;
  var onlyGetFee = _ref17.onlyGetFee,
      feeAssetId = _ref17.feeAssetId;

  return dispatch('transactions/_transactionOperations', {
    operations: [{
      op_type: 7,
      type: "account_upgrade",
      params: {
        account_to_upgrade: getters.getAccountUserId,
        upgrade_to_lifetime_member: true,
        fee_asset_id: feeAssetId
      }
    }],
    onlyGetFee: onlyGetFee
  }, { root: true });
};

var changePassword = exports.changePassword = function _callee8(_ref18, params) {
  var dispatch = _ref18.dispatch,
      rootGetters = _ref18.rootGetters;

  var account, oldPassword, newPassword, _passwordKey, aes_private, account_name, validatePasswordParams, vp_result, _ref19, ownerKey, _ref20, activeKey;

  return _regenerator2.default.async(function _callee8$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          if (_helper2.default.trimParams(params)) {
            _context8.next = 2;
            break;
          }

          return _context8.abrupt("return", { code: 101, message: "Parameter is missing" });

        case 2:
          account = params.account, oldPassword = params.oldPassword, newPassword = params.newPassword;
          _passwordKey = rootGetters["WalletDb/_passwordKey"];
          aes_private = rootGetters["WalletDb/aes_private"];
          account_name = account.name;
          validatePasswordParams = {
            password: oldPassword,
            unlock: true,
            isChangePassword: true
          };

          if (!_passwordKey) {
            _context8.next = 12;
            break;
          }

          validatePasswordParams.account = account_name;
          validatePasswordParams.roles = ["active", "owner", "memo"];
          _context8.next = 15;
          break;

        case 12:
          if (!aes_private) {
            _context8.next = 15;
            break;
          }

          if (rootGetters["PrivateKeyStore/getTcomb_byPubkey"](account.owner.key_auths[0][0])) {
            _context8.next = 15;
            break;
          }

          return _context8.abrupt("return", { code: 112, message: "Must have owner permission to change the password, please confirm that you imported the ownerPrivateKey" });

        case 15:
          _context8.next = 17;
          return _regenerator2.default.awrap(dispatch("WalletDb/validatePassword", validatePasswordParams, { root: true }));

        case 17:
          vp_result = _context8.sent;

          if (!(vp_result.code != 1)) {
            _context8.next = 20;
            break;
          }

          return _context8.abrupt("return", { code: 113, message: "Please enter the correct " + (_passwordKey ? "original" : "temporary") + " password" });

        case 20:
          _context8.next = 22;
          return _regenerator2.default.awrap(dispatch("WalletDb/generateKeyFromPassword", {
            account: account_name,
            role: "owner",
            password: newPassword
          }, { root: true }));

        case 22:
          _ref19 = _context8.sent;
          ownerKey = _ref19.privKey;
          _context8.next = 26;
          return _regenerator2.default.awrap(dispatch("WalletDb/generateKeyFromPassword", {
            account: account_name,
            role: "active",
            password: newPassword
          }, { root: true }));

        case 26:
          _ref20 = _context8.sent;
          activeKey = _ref20.privKey;
          return _context8.abrupt("return", dispatch("transactions/_transactionOperations", {
            operations: [{
              type: "account_update",
              params: {
                action: "changePassword",
                activePubkey: activeKey.toPublicKey().toPublicKeyString(),
                ownerPubkey: ownerKey.toPublicKey().toPublicKeyString()
              }
            }]
          }, { root: true }));

        case 29:
        case "end":
          return _context8.stop();
      }
    }
  }, null, undefined);
};

var logout = exports.logout = function logout(_ref21) {
  var commit = _ref21.commit;

  commit(types.ACCOUNT_LOGOUT);
};

var _logout = exports._logout = function _callee9(_ref22) {
  var commit = _ref22.commit,
      dispatch = _ref22.dispatch;
  return _regenerator2.default.async(function _callee9$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          commit(types.ACCOUNT_LOGOUT);
          _context9.next = 3;
          return _regenerator2.default.awrap(dispatch("user/clearAccountCache", null, { root: true }));

        case 3:
          _context9.next = 5;
          return _regenerator2.default.awrap(dispatch("WalletDb/clearKeys", null, { root: true }));

        case 5:
          _context9.next = 7;
          return _regenerator2.default.awrap(dispatch("PrivateKeyStore/clearKeys", null, { root: true }));

        case 7:

          _persistentStorage2.default.clearUserData();
          return _context9.abrupt("return", { code: 1 });

        case 9:
        case "end":
          return _context9.stop();
      }
    }
  }, null, undefined);
};

//cache of userId and privateKey login in account mode
var checkCachedUserData = exports.checkCachedUserData = function _callee10(_ref23) {
  var commit = _ref23.commit,
      dispatch = _ref23.dispatch,
      rootGetters = _ref23.rootGetters;
  var data, cacheAccount;
  return _regenerator2.default.async(function _callee10$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          data = _persistentStorage2.default.getSavedUserData();

          if (!data) {
            _context10.next = 10;
            break;
          }

          if (!rootGetters["connection/isWsConnected"]) {
            _context10.next = 10;
            break;
          }

          _context10.next = 5;
          return _regenerator2.default.awrap(dispatch("user/fetchUserForIsSave", {
            nameOrId: data.userId,
            isSave: true,
            activePubkey: data.activePubkey
          }, { root: true }));

        case 5:
          cacheAccount = _context10.sent;

          if (!(cacheAccount.code == 1 && data.activePubkey && cacheAccount.data.account.active.key_auths[0][0] == data.activePubkey)) {
            _context10.next = 10;
            break;
          }

          _context10.next = 9;
          return _regenerator2.default.awrap(dispatch("PrivateKeyStore/setKeys", {
            import_account_names: [data.userId],
            encrypted_key: data.encrypted_key,
            pubkey: data.activePubkey || "activePubkey"
          }, { root: true }));

        case 9:
          commit(types.ACCOUNT_LOGIN_COMPLETE, {
            userId: data.userId,
            wallet: {
              encrypted_key: data.encrypted_key,
              encryptionKey: data.encryptionKey,
              passwordPubkey: data.passwordPubkey
            }
          });

        case 10:
        case "end":
          return _context10.stop();
      }
    }
  }, null, undefined);
};
/**
 * Checks username for existance
 * @param {string} username - name of user to fetch
 */
var checkIfUsernameFree = exports.checkIfUsernameFree = function _callee11(state, _ref24) {
  var username = _ref24.username;
  var result;
  return _regenerator2.default.async(function _callee11$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          _context11.next = 2;
          return _regenerator2.default.awrap(_api2.default.Account.getUser(username));

        case 2:
          result = _context11.sent;
          return _context11.abrupt("return", !result.success);

        case 4:
        case "end":
          return _context11.stop();
      }
    }
  }, null, undefined);
};

var _getPrivateKey = exports._getPrivateKey = function _callee14(_ref25, _ref26) {
  var dispatch = _ref25.dispatch;
  var account = _ref26.account;
  var result, active, owner, activePrivateKeys, ownerPrivateKeys, activePrivateKey, ownerPrivateKey;
  return _regenerator2.default.async(function _callee14$(_context14) {
    while (1) {
      switch (_context14.prev = _context14.next) {
        case 0:
          result = void 0;
          active = account.active;
          owner = account.owner;
          // let activePublicKey = (active.key_auths && active.key_auths.length > 0) ? active.key_auths[0][0] : '';
          // let ownerPublicKey = (owner.key_auths && owner.key_auths.length > 0) ? owner.key_auths[0][0] : '';

          activePrivateKeys = [];
          ownerPrivateKeys = [];
          activePrivateKey = "";
          ownerPrivateKey = "";
          _context14.next = 9;
          return _regenerator2.default.awrap(_promise2.default.all(active.key_auths.map(function _callee12(item) {
            return _regenerator2.default.async(function _callee12$(_context12) {
              while (1) {
                switch (_context12.prev = _context12.next) {
                  case 0:
                    _context12.next = 2;
                    return _regenerator2.default.awrap(dispatch("WalletDb/getPrivateKey", item[0], { root: true }));

                  case 2:
                    activePrivateKey = _context12.sent;

                    if (!!activePrivateKey) activePrivateKeys.push(activePrivateKey.toWif());
                    return _context12.abrupt("return", true);

                  case 5:
                  case "end":
                    return _context12.stop();
                }
              }
            }, null, undefined);
          })));

        case 9:
          _context14.next = 11;
          return _regenerator2.default.awrap(_promise2.default.all(owner.key_auths.map(function _callee13(item) {
            return _regenerator2.default.async(function _callee13$(_context13) {
              while (1) {
                switch (_context13.prev = _context13.next) {
                  case 0:
                    _context13.next = 2;
                    return _regenerator2.default.awrap(dispatch("WalletDb/getPrivateKey", item[0], { root: true }));

                  case 2:
                    ownerPrivateKey = _context13.sent;

                    if (ownerPrivateKey) ownerPrivateKeys.push(ownerPrivateKey.toWif());
                    return _context13.abrupt("return", true);

                  case 5:
                  case "end":
                    return _context13.stop();
                }
              }
            }, null, undefined);
          })));

        case 11:
          if (!(activePrivateKeys.length || ownerPrivateKeys.length)) {
            _context14.next = 15;
            break;
          }

          return _context14.abrupt("return", {
            code: 1,
            data: {
              active_private_keys: activePrivateKeys,
              owner_private_keys: ownerPrivateKeys
            }
          });

        case 15:
          return _context14.abrupt("return", {
            code: 114,
            message: "Account is locked or not logged in"
          });

        case 16:
        case "end":
          return _context14.stop();
      }
    }
  }, null, undefined);
};

var accountOpt = exports.accountOpt = function _callee15(_ref27, _ref28) {
  var commit = _ref27.commit,
      rootGetters = _ref27.rootGetters,
      dispatch = _ref27.dispatch;
  var method = _ref28.method,
      params = _ref28.params;
  var account, userId, user_result;
  return _regenerator2.default.async(function _callee15$(_context15) {
    while (1) {
      switch (_context15.prev = _context15.next) {
        case 0:
          _helper2.default.trimParams(params);

          account = rootGetters["user/getAccountObject"];

          if (account) {
            _context15.next = 9;
            break;
          }

          userId = rootGetters["account/getAccountUserId"];

          if (!userId) {
            _context15.next = 9;
            break;
          }

          _context15.next = 7;
          return _regenerator2.default.awrap(dispatch("user/fetchUser", userId, { root: true }));

        case 7:
          user_result = _context15.sent;

          if (user_result.success) account = user_result.data.account;

        case 9:
          if (account) {
            params.account = account;
            dispatch(method, params, { root: true });
          } else {
            params.callback && params.callback({ code: -11, message: "Please login first" });
          }

        case 10:
        case "end":
          return _context15.stop();
      }
    }
  }, null, undefined);
};

//accountOpt will check login status and trim params
var _accountOpt = exports._accountOpt = function _callee16(_ref29, _ref30) {
  var commit = _ref29.commit,
      rootGetters = _ref29.rootGetters,
      dispatch = _ref29.dispatch;
  var method = _ref30.method,
      _ref30$params = _ref30.params,
      params = _ref30$params === undefined ? {} : _ref30$params;
  var account, userId, user_result;
  return _regenerator2.default.async(function _callee16$(_context16) {
    while (1) {
      switch (_context16.prev = _context16.next) {
        case 0:

          _helper2.default.trimParams(params);
          // params.crontab=params.crontab||null;
          // dispatch("crontab/setCrontab",params.crontab,{root:true});

          account = rootGetters["user/getAccountObject"];

          if (account) {
            _context16.next = 9;
            break;
          }

          userId = rootGetters["account/getAccountUserId"];

          if (!userId) {
            _context16.next = 9;
            break;
          }

          _context16.next = 7;
          return _regenerator2.default.awrap(dispatch("user/fetchUser", userId, { root: true }));

        case 7:
          user_result = _context16.sent;

          if (user_result.success) account = user_result.data.account;

        case 9:
          if (!account) {
            _context16.next = 14;
            break;
          }

          if (!params.account) params.account = account;
          return _context16.abrupt("return", dispatch(method, params, { root: true }));

        case 14:
          return _context16.abrupt("return", { code: -11, message: "Please login first" });

        case 15:
        case "end":
          return _context16.stop();
      }
    }
  }, null, undefined);
};

//_validateAccount will check the incoming parameters of account to determine whether the account exists.
var _validateAccount = exports._validateAccount = function _callee17(_ref31, _ref32) {
  var dispatch = _ref31.dispatch;
  var method = _ref32.method,
      params = _ref32.params,
      account = _ref32.account,
      _ref32$accountFieldNa = _ref32.accountFieldName,
      accountFieldName = _ref32$accountFieldNa === undefined ? "account_id" : _ref32$accountFieldNa;
  var acc_res;
  return _regenerator2.default.async(function _callee17$(_context17) {
    while (1) {
      switch (_context17.prev = _context17.next) {
        case 0:
          _helper2.default.trimParams(params);

          if (account) {
            _context17.next = 6;
            break;
          }

          if (!(accountFieldName == "to_account_id")) {
            _context17.next = 4;
            break;
          }

          return _context17.abrupt("return", { code: 133, message: "Parameter 'toAccount' can not be empty" });

        case 4:
          _context17.next = 12;
          break;

        case 6:
          _context17.next = 8;
          return _regenerator2.default.awrap(dispatch("user/getUserInfo", { account: account, isCache: true }, { root: true }));

        case 8:
          acc_res = _context17.sent;

          if (!(acc_res.code != 1)) {
            _context17.next = 11;
            break;
          }

          return _context17.abrupt("return", acc_res);

        case 11:
          params[accountFieldName] = acc_res.data.account.id;

        case 12:
          return _context17.abrupt("return", dispatch(method, params, { root: true }));

        case 13:
        case "end":
          return _context17.stop();
      }
    }
  }, null, undefined);
};

var fetchCurrentUser = exports.fetchCurrentUser = function _callee18(store) {
  var commit, getters, userId, result, user;
  return _regenerator2.default.async(function _callee18$(_context18) {
    while (1) {
      switch (_context18.prev = _context18.next) {
        case 0:
          commit = store.commit, getters = store.getters;
          userId = getters.getAccountUserId;

          if (userId) {
            _context18.next = 4;
            break;
          }

          return _context18.abrupt("return");

        case 4:
          commit(types.FETCH_CURRENT_USER_REQUEST);
          _context18.next = 7;
          return _regenerator2.default.awrap(_api2.default.Account.getUser(userId));

        case 7:
          result = _context18.sent;

          if (result.success) {
            user = result.data;

            result.data.balances = balancesToObject(user.balances);
            commit(types.FETCH_CURRENT_USER_COMPLETE, { data: user });
          } else {
            commit(types.FETCH_CURRENT_USER_ERROR);
          }

        case 9:
        case "end":
          return _context18.stop();
      }
    }
  }, null, undefined);
};

var setAccountUserId = exports.setAccountUserId = function setAccountUserId(_ref33, userId) {
  var commit = _ref33.commit;

  commit(types.ACCOUNT_LOGIN_COMPLETE, { userId: userId });
};

var getVestingBalances = exports.getVestingBalances = function _callee19(_ref34, _ref35) {
  var dispatch = _ref34.dispatch,
      rootGetters = _ref34.rootGetters;
  var account = _ref35.account,
      _ref35$type = _ref35.type,
      type = _ref35$type === undefined ? 1 : _ref35$type;

  var vbs, cvbAsset, vestingPeriod, earned, secondsPerDay, availablePercent, new_vbs, i, _vbs$i, id, balance, policy, require_coindays, remaining_days, precision_value, res;

  return _regenerator2.default.async(function _callee19$(_context19) {
    while (1) {
      switch (_context19.prev = _context19.next) {
        case 0:
          _context19.next = 2;
          return _regenerator2.default.awrap(_api2.default.Account.getVestingBalances(account.id));

        case 2:
          vbs = _context19.sent;
          cvbAsset = void 0, vestingPeriod = void 0, earned = void 0, secondsPerDay = 60 * 60 * 24, availablePercent = void 0;
          new_vbs = [];
          i = 0;

        case 6:
          if (!(i < vbs.length)) {
            _context19.next = 24;
            break;
          }

          _vbs$i = vbs[i], id = _vbs$i.id, balance = _vbs$i.balance, policy = _vbs$i.policy;
          _context19.next = 10;
          return _regenerator2.default.awrap(dispatch("assets/fetchAssets", { assets: [balance.asset_id], isOne: true }, { root: true }));

        case 10:
          cvbAsset = _context19.sent;

          earned = policy[1].coin_seconds_earned;

          vestingPeriod = policy[1].vesting_seconds;

          if (!(type == 1 && vestingPeriod != 86400)) {
            _context19.next = 15;
            break;
          }

          return _context19.abrupt("continue", 21);

        case 15:
          require_coindays = _utils2.default.format_number(_utils2.default.get_asset_amount(balance.amount * vestingPeriod / secondsPerDay, cvbAsset), 0);


          availablePercent = vestingPeriod === 0 ? 1 : earned / (vestingPeriod * balance.amount);

          remaining_days = _utils2.default.format_number(vestingPeriod * (1 - availablePercent) / secondsPerDay || 0, 2);
          // remaining_days=Number(remaining_days.replace(/,/g,""));
          // let available_get=utils.format_number(availablePercent * 100, 2)+" % / "
          //                   + (availablePercent * balance.amount/Math.pow(10,cvbAsset.precision))+" "+cvbAsset.symbol;

          earned = _utils2.default.format_number(_utils2.default.get_asset_amount(earned / secondsPerDay, cvbAsset), 0);
          precision_value = Math.pow(10, cvbAsset.precision);

          new_vbs.push({
            id: id,
            return_cash: balance.amount / precision_value,
            earned_coindays: earned,
            require_coindays: require_coindays,
            remaining_days: remaining_days,
            available_percent: _utils2.default.format_number(availablePercent * 100, 2),
            available_balance: {
              amount: _utils2.default.format_number(availablePercent * balance.amount / precision_value, 8),
              asset_id: cvbAsset.id,
              symbol: cvbAsset.symbol,
              precision: cvbAsset.precision
            }
          });

        case 21:
          i++;
          _context19.next = 6;
          break;

        case 24:
          if (type != 2) {
            new_vbs = new_vbs.length ? new_vbs[0] : null;
          }
          res = { code: 1, data: new_vbs };

          if (!new_vbs) {
            res = { code: 127, message: "No reward available" };
          }
          return _context19.abrupt("return", res);

        case 28:
        case "end":
          return _context19.stop();
      }
    }
  }, null, undefined);
};

var claimVestingBalance = exports.claimVestingBalance = function _callee20(_ref36, _ref37) {
  var dispatch = _ref36.dispatch;
  var id = _ref37.id;

  var res, rewards, _rewards$0$available_, amount, precision, asset_id;

  return _regenerator2.default.async(function _callee20$(_context20) {
    while (1) {
      switch (_context20.prev = _context20.next) {
        case 0:
          if (id) {
            _context20.next = 2;
            break;
          }

          return _context20.abrupt("return", { code: 101, message: "Parameter is missing" });

        case 2:
          id = id.trim();

          _context20.next = 5;
          return _regenerator2.default.awrap(dispatch("_accountOpt", {
            method: "account/getVestingBalances",
            params: { type: 2 }
          }));

        case 5:
          res = _context20.sent;

          if (!(res.code != 1)) {
            _context20.next = 8;
            break;
          }

          return _context20.abrupt("return", res);

        case 8:
          rewards = res.data.filter(function (item) {
            return item.id == id;
          });

          if (!rewards.length) {
            _context20.next = 15;
            break;
          }

          _rewards$0$available_ = rewards[0].available_balance, amount = _rewards$0$available_.amount, precision = _rewards$0$available_.precision, asset_id = _rewards$0$available_.asset_id;

          amount = Math.floor(amount * Math.pow(10, precision));
          return _context20.abrupt("return", dispatch('transactions/_transactionOperations', {
            operations: [{
              op_type: 31,
              type: "vesting_balance_withdraw",
              params: {
                vesting_balance: id,
                amount: {
                  amount: amount,
                  asset_id: asset_id
                }
              }
            }]
          }, { root: true }));

        case 15:
          return _context20.abrupt("return", { code: 127, message: "No reward available" });

        case 16:
        case "end":
          return _context20.stop();
      }
    }
  }, null, undefined);
};

var balancesToObject = function balancesToObject(balancesArr) {
  var obj = {};
  balancesArr.forEach(function (item) {
    obj[item.asset_type] = item;
  });
  return obj;
};

var getAccountInfo = exports.getAccountInfo = function getAccountInfo(_ref38) {
  var rootGetters = _ref38.rootGetters;

  var accountObject = rootGetters["user/getAccountObject"];
  var res = {
    account_id: rootGetters["account/getAccountUserId"] || "",
    locked: rootGetters["WalletDb/isLocked"]
  };
  res.account_name = accountObject ? accountObject.name : "";
  res.mode = rootGetters["WalletDb/wallet"] ? "wallet" : "account";
  return {
    code: 1,
    data: res
  };
};