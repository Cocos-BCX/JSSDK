'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _mutations;

var _mutations2 = require('../mutations');

var types = _interopRequireWildcard(_mutations2);

var _connection = require('../actions/connection');

var actions = _interopRequireWildcard(_connection);

var _connection2 = require('../getters/connection');

var getters = _interopRequireWildcard(_connection2);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var initialState = {
  wsConnected: false,
  rpcStatus: null,
  wsConnecting: false,
  rpcStatusCallback: null, //listener of RPC connection status callback
  reconnectCounter: 0
};

var mutations = (_mutations = {}, (0, _defineProperty3.default)(_mutations, types.WS_CONNECTED, function (state) {
  state.wsConnected = true;
}), (0, _defineProperty3.default)(_mutations, types.WS_DISCONNECTED, function (state) {
  state.wsConnected = false;
}), (0, _defineProperty3.default)(_mutations, types.SET_WS_CONNECTING, function (state, status) {
  state.wsConnecting = status;
}), (0, _defineProperty3.default)(_mutations, types.RPC_STATUS_UPDATE, function (state, _ref) {
  var status = _ref.status,
      _ref$url = _ref.url,
      url = _ref$url === undefined ? "" : _ref$url;

  if (state.rpcStatus == status) return;
  state.rpcStatus = status;
  var res = {
    code: 1,
    data: { status: status, url: url }
  };

  if (status == "error" && url == "") {
    res = {
      code: 168,
      message: "No available nodes or check your network."
    };
  }
  state.rpcStatusCallback && state.rpcStatusCallback(res);
}), (0, _defineProperty3.default)(_mutations, types.SET_RPC_STATUS_CALLBACK, function (state, callback) {
  state.rpcStatusCallback = callback;
}), _mutations);

exports.default = {
  state: initialState,
  getters: getters,
  actions: actions,
  mutations: mutations,
  namespaced: true
};