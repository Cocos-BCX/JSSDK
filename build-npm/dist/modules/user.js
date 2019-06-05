'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _mutations;

var _mutations2 = require('../mutations');

var types = _interopRequireWildcard(_mutations2);

var _user = require('../actions/user');

var actions = _interopRequireWildcard(_user);

var _user2 = require('../getters/user');

var getters = _interopRequireWildcard(_user2);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var initialState = {
  account: null,
  allAccount: null,
  balances: [],
  fetching: false,
  error: false
};

var mutations = (_mutations = {}, (0, _defineProperty3.default)(_mutations, types.FETCH_USER_REQUEST, function (state) {
  state.fetching = true;
  state.error = false;
}), (0, _defineProperty3.default)(_mutations, types.FETCH_USER_COMPLETE, function (state, result) {
  state.account = result.account;
  state.balances = result.balances;
  state.allAccount = result;
  state.fetching = false;
}), (0, _defineProperty3.default)(_mutations, types.FETCH_USER_ERROR, function (state) {
  state.fetching = false;
  state.error = true;
}), (0, _defineProperty3.default)(_mutations, types.CLEAR_ACCOUNT, function (state) {
  state.account = null;
  state.balances = [];
}), _mutations);

exports.default = {
  state: initialState,
  actions: actions,
  getters: getters,
  mutations: mutations,
  namespaced: true
};