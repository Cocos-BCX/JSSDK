'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getWallet = exports.getAccountPendingState = exports.getAccountUserId = exports.getAccountError = exports.isValidPassword = exports.getKeys = exports.getBrainkey = undefined;

var _bcxjsCores = require('bcxjs-cores');

var _WalletDb = require('../store/WalletDb');

var WalletDb = _interopRequireWildcard(_WalletDb);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var ACTIVE_KEY_INDEX = 0;
var OWNER_KEY_INDEX = 1;

var getBrainkey = exports.getBrainkey = function getBrainkey(state) {
  if (!state.aesPrivate) return null;
  return state.aesPrivate.decryptHexToText(state.encryptedBrainkey);
};

var getKeys = exports.getKeys = function getKeys(state) {
  var brainkey = getBrainkey(state);
  return null;
  if (!brainkey) return null;
  // return {
  //   active: key.get_brainPrivateKey(brainkey, ACTIVE_KEY_INDEX),
  //   owner: key.get_brainPrivateKey(brainkey, OWNER_KEY_INDEX)
  // };
  var keys = state.keys;
  if (keys && keys[_passwordKey]) {
    return keys._passwordKey;
  } else {
    return null;
  }
};

var isValidPassword = exports.isValidPassword = function isValidPassword(state) {
  return function (password) {
    var passwordPrivate = _bcxjsCores.PrivateKey.fromSeed(password);
    var passwordPubkey = passwordPrivate.toPublicKey().toPublicKeyString();
    return passwordPubkey === state.passwordPubkey;
  };
};

// export const isLocked = state => {
//   return state.aesPrivate == null;
// };

var getAccountError = exports.getAccountError = function getAccountError(state) {
  return state.error;
};

var getAccountUserId = exports.getAccountUserId = function getAccountUserId(state) {
  return state.userId;
};

var getAccountPendingState = exports.getAccountPendingState = function getAccountPendingState(state) {
  return state.pending;
};

var getWallet = exports.getWallet = function getWallet(state) {
  return {
    passwordPubkey: state.passwordPubkey,
    encryptedBrainkey: state.encryptedBrainkey,
    encryptionKey: state.encryptionKey,
    encrypted_key: state.encrypted_key
  };
};