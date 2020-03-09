'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _mutations;

var _account = require('../actions/account');

var actions = _interopRequireWildcard(_account);

var _mutations2 = require('../mutations');

var types = _interopRequireWildcard(_mutations2);

var _account2 = require('../getters/account');

var getters = _interopRequireWildcard(_account2);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var initialState = {
  passwordPubkey: null,
  encryptedBrainkey: null,
  encrypted_key: null,
  brainkeyBackupDate: null,
  encryptionKey: null,
  created: null,
  aesPrivate: null,
  userId: null,
  error: null,
  pending: false,
  keys: null,
  callback: null,
  userData: null,
  userFetching: false,
  userError: false,
  imported_keys_public: {},
  keys_to_account: {}
};

var mutations = (_mutations = {}, (0, _defineProperty3.default)(_mutations, types.ACCOUNT_SIGNUP_REQUEST, function (state) {
  state.pending = true;
}), (0, _defineProperty3.default)(_mutations, types.ACCOUNT_SIGNUP_COMPLETE, function (state, _ref) {
  var wallet = _ref.wallet,
      userId = _ref.userId;

  state.pending = false;
  state.passwordPubkey = wallet.passwordPubkey;
  state.encrypted_key = wallet.encrypted_key;
  state.encryptionKey = wallet.encryptionKey;
  // state.aesPrivate = wallet.aesPrivate;
  state.brainkeyBackupDate = null;
  state.created = new Date();
  state.userId = userId;
}), (0, _defineProperty3.default)(_mutations, types.ACCOUNT_SIGNUP_ERROR, function (state, _ref2) {
  var error = _ref2.error;

  state.pending = false;
  state.error = error;
}), (0, _defineProperty3.default)(_mutations, types.ACCOUNT_LOGIN_REQUEST, function (state) {
  state.pending = true;
}), (0, _defineProperty3.default)(_mutations, types.ACCOUNT_LOGIN_COMPLETE, function (state, _ref3) {
  var wallet = _ref3.wallet,
      userId = _ref3.userId;

  state.pending = false;
  state.userId = userId;
  if (wallet) {
    state.passwordPubkey = wallet.passwordPubkey;
    state.encrypted_key = wallet.encrypted_key;
    state.encryptionKey = wallet.encryptionKey;
    // state.aesPrivate = wallet.aesPrivate;
    state.wallet = wallet;
  }
}), (0, _defineProperty3.default)(_mutations, types.ACCOUNT_LOGIN_ERROR, function (state, _ref4) {
  var error = _ref4.error;

  state.pending = false;
  state.error = error;
}), (0, _defineProperty3.default)(_mutations, types.ACCOUNT_BRAINKEY_BACKUP, function (state) {
  state.brainkeyBackupDate = Date();
}), (0, _defineProperty3.default)(_mutations, types.ACCOUNT_LOCK_WALLET, function (state) {
  state.aesPrivate = null;
}), (0, _defineProperty3.default)(_mutations, types.ACCOUNT_UNLOCK_WALLET, function (state, aesPrivate) {
  state.aesPrivate = aesPrivate;
}), (0, _defineProperty3.default)(_mutations, types.SET_ACCOUNT_USER_DATA, function (state, _ref5) {
  var userId = _ref5.userId,
      encryptedBrainkey = _ref5.encryptedBrainkey,
      encryptionKey = _ref5.encryptionKey,
      backupDate = _ref5.backupDate,
      passwordPubkey = _ref5.passwordPubkey;

  //state.userId = userId;
  // state.encryptedBrainkey = encryptedBrainkey; 
  // state.encryptionKey = encryptionKey;
  state.brainkeyBackupDate = backupDate;
  //state.passwordPubkey = passwordPubkey;
}), (0, _defineProperty3.default)(_mutations, types.ACCOUNT_LOGOUT, function (state) {
  state.passwordPubkey = null;
  state.encryptedBrainkey = null;
  state.brainkeyBackupDate = null;
  state.encryptionKey = null;
  state.created = null;
  state.aesPrivate = null;
  state.userId = null;
  state.error = null;
  state.pending = false;
}), (0, _defineProperty3.default)(_mutations, types.FETCH_CURRENT_USER_REQUEST, function (state) {
  state.userFetching = true;
}), (0, _defineProperty3.default)(_mutations, types.FETCH_CURRENT_USER_COMPLETE, function (state, _ref6) {
  var data = _ref6.data;

  state.userFetching = false;
  state.userData = data;
}), (0, _defineProperty3.default)(_mutations, types.FETCH_CURRENT_USER_ERROR, function (state) {
  state.userFetching = false;
  state.userError = false;
}), (0, _defineProperty3.default)(_mutations, types.SET_PASSWORD_LONGIN_KEY, function (state, keys) {
  state.keys = keys;
}), (0, _defineProperty3.default)(_mutations, types.SET_CALLBACK, function (state, callback) {

  state.callback = callback;
}), _mutations);

exports.default = {
  state: initialState,
  mutations: mutations,
  actions: actions,
  getters: getters,
  namespaced: true
};