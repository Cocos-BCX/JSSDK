'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _mutations;

var _mutations2 = require('../mutations');

var types = _interopRequireWildcard(_mutations2);

var _transactions = require('../actions/transactions');

var actions = _interopRequireWildcard(_transactions);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var initialState = {
  pending: false,
  error: null,
  callback: null,
  orderData: null,
  trxData: null,
  callbacks: new _set2.default(),
  onlyGetOPFee: false
};
var getters = {
  onlyGetOPFee: function onlyGetOPFee(state) {
    return state.onlyGetOPFee;
  }
};
var mutations = (_mutations = {}, (0, _defineProperty3.default)(_mutations, types.SET_ONLY_GET_OP_FEE, function (state, b) {
  state.onlyGetOPFee = b;
}), (0, _defineProperty3.default)(_mutations, types.TRANSFER_ASSET_REQUEST, function (state) {
  state.pending = true;
}), (0, _defineProperty3.default)(_mutations, types.TRANSFER_ASSET_ERROR, function (state, _ref) {
  var error = _ref.error,
      callback = _ref.callback,
      code = _ref.code;

  if (typeof error == "string") {
    error = {
      message: error
    };
  }

  state.pending = false;
  var message = error.message;

  if (typeof error.message == "string") {
    if (error.message.indexOf("o.issuer == a.issuer") != -1) {
      code = 160;
      message = "You are not the creator of assets";
    }
  }

  callback && callback({
    code: code,
    message: message,
    error: error
  });
}), (0, _defineProperty3.default)(_mutations, types.TRANSFER_ASSET_COMPLETE, function (state, _ref2) {
  var callback = _ref2.callback,
      trxData = _ref2.trxData,
      _ref2$data = _ref2.data,
      data = _ref2$data === undefined ? null : _ref2$data;

  state.pending = false;
  var res = { code: 1 };
  if (data) {
    res.data = data;
  }
  if (trxData) {
    res.trxData = JSON.parse((0, _stringify2.default)(trxData));
    var result_id = trxData.result_id,
        result_ids = trxData.result_ids;

    if (result_ids && result_ids.length && result_ids[0]) {
      res.data = {
        result_id: result_id,
        result_ids: result_ids
      };
    }
  }
  callback && callback(res);
}), (0, _defineProperty3.default)(_mutations, types.SET_OP_CALLBACK, function (state, _ref3) {
  var callback = _ref3.callback,
      type = _ref3.type;

  if (type == "+") {
    state.callbacks.add(callback);
  } else if (type == "-") {
    if (state.callbacks.has(callback)) {
      state.callbacks.delete(callback);
    }
  }
}), (0, _defineProperty3.default)(_mutations, types.SET_ORDER_DATA, function (state, orderData) {
  state.orderData = orderData;
}), (0, _defineProperty3.default)(_mutations, types.SET_TRX_DATA, function (state, trxData) {
  state.trxData = trxData;
}), _mutations);

exports.default = {
  state: initialState,
  getters: getters,
  actions: actions,
  mutations: mutations,
  namespaced: true
};