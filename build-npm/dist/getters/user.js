"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUserName = getUserName;
exports.getAccountObject = getAccountObject;
exports.getAllAccountObject = getAllAccountObject;
exports.getBalances = getBalances;
exports.isFetching = isFetching;
exports.getAccountExtensions = getAccountExtensions;
exports.proxy_account_id = proxy_account_id;
/**
 * Returns current user's name string
 */
function getUserName(_ref) {
  var account = _ref.account;

  return account && account.name;
}

/**
 * Returns current user's account object
 */
function getAccountObject(_ref2) {
  var account = _ref2.account;

  return account;
}

function getAllAccountObject(_ref3) {
  var allAccount = _ref3.allAccount;

  return allAccount;
}

var getCurrentUserBalances = exports.getCurrentUserBalances = function getCurrentUserBalances(state) {
  return state.allAccount && state.allAccount.balances || {};
};
/**
 * Returns current users's balances object
 */
function getBalances(_ref4) {
  var balances = _ref4.balances;

  return balances;
}

/**
 * User fetching in progress indicator
 */
function isFetching(state) {
  return state.fetching;
}

function getAccountExtensions(state) {
  return state.account.options.extensions;
}

function proxy_account_id(_ref5) {
  var account = _ref5.account;

  var proxyId = account.options.voting_account;
  var proxy_account_id = proxyId === "1.2.5" ? "" : proxyId;
  return proxy_account_id;
}