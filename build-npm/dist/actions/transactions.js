'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setOrderData = exports._transactionOperations = exports.setOnlyGetOPFee = exports.transferAsset = exports._checkingSignString = exports._signString = undefined;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _mutations = require('../mutations');

var types = _interopRequireWildcard(_mutations);

var _api = require('../services/api');

var _api2 = _interopRequireDefault(_api);

var _helper = require('../lib/common/helper');

var _helper2 = _interopRequireDefault(_helper);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// 2020-03-05  xulin_add  签名
var _signString = exports._signString = function _callee(store, params) {
  var signContent, fromId, fromAccount, result;
  return _regenerator2.default.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          signContent = params.signContent;

          if (!store.rootGetters['WalletDb/isLocked']) {
            _context.next = 3;
            break;
          }

          return _context.abrupt('return', { code: 114, message: "Account is locked or not logged in" });

        case 3:
          fromId = store.rootGetters['account/getAccountUserId'];
          _context.next = 6;
          return _regenerator2.default.awrap(store.dispatch("user/fetchUser", fromId, { root: true }));

        case 6:
          fromAccount = _context.sent.data;
          _context.next = 9;
          return _regenerator2.default.awrap(_api2.default.Transactions.signString(fromAccount, store, signContent));

        case 9:
          result = _context.sent;

          if (!result) {
            _context.next = 12;
            break;
          }

          return _context.abrupt('return', result);

        case 12:
        case 'end':
          return _context.stop();
      }
    }
  }, null, undefined);
};

// 2020-03-05  xulin_add 解签
var _checkingSignString = exports._checkingSignString = function _callee2(store, checkingSignParams) {
  var result;
  return _regenerator2.default.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return _regenerator2.default.awrap(_api2.default.Transactions.checkingSignString(checkingSignParams));

        case 2:
          result = _context2.sent;

          if (!result) {
            _context2.next = 5;
            break;
          }

          return _context2.abrupt('return', result);

        case 5:
        case 'end':
          return _context2.stop();
      }
    }
  }, null, undefined);
};

var transferAsset = exports.transferAsset = function _callee3(_ref, params) {
  var dispatch = _ref.dispatch,
      rootGetters = _ref.rootGetters;

  var _params$fromAccount, fromAccount, toAccount, _params$amount, amount, memo, _params$assetId, assetId, _params$isEncryption, isEncryption, _params$onlyGetFee, onlyGetFee, _params$proposeAccoun, proposeAccount, isPropose;

  return _regenerator2.default.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _helper2.default.trimParams(params);

          _params$fromAccount = params.fromAccount, fromAccount = _params$fromAccount === undefined ? "" : _params$fromAccount, toAccount = params.toAccount, _params$amount = params.amount, amount = _params$amount === undefined ? 0 : _params$amount, memo = params.memo, _params$assetId = params.assetId, assetId = _params$assetId === undefined ? "1.3.0" : _params$assetId, _params$isEncryption = params.isEncryption, isEncryption = _params$isEncryption === undefined ? true : _params$isEncryption, _params$onlyGetFee = params.onlyGetFee, onlyGetFee = _params$onlyGetFee === undefined ? false : _params$onlyGetFee, _params$proposeAccoun = params.proposeAccount, proposeAccount = _params$proposeAccoun === undefined ? "" : _params$proposeAccoun, isPropose = params.isPropose;

          if (toAccount) {
            _context3.next = 4;
            break;
          }

          return _context3.abrupt('return', { code: 124, message: "Receivables account name can not be empty" });

        case 4:

          if (isPropose) {
            proposeAccount = fromAccount;
          }

          assetId = assetId || "1.3.0";
          assetId = assetId.toUpperCase();

          return _context3.abrupt('return', dispatch('_transactionOperations', {
            operations: [{
              op_type: 0,
              type: "transfer",
              params: {
                to: toAccount,
                amount: amount,
                asset_id: assetId,
                memo: memo,
                isEncryption: isEncryption
              }
            }],
            proposeAccount: proposeAccount,
            onlyGetFee: onlyGetFee
          }));

        case 8:
        case 'end':
          return _context3.stop();
      }
    }
  }, null, undefined);
};

var setOnlyGetOPFee = exports.setOnlyGetOPFee = function setOnlyGetOPFee(_ref2, b) {
  var commit = _ref2.commit;

  commit(types.SET_ONLY_GET_OP_FEE, b);
};

var _transactionOperations = exports._transactionOperations = function _callee5(store, _ref3) {
  var operations = _ref3.operations,
      _ref3$proposeAccount = _ref3.proposeAccount,
      proposeAccount = _ref3$proposeAccount === undefined ? "" : _ref3$proposeAccount,
      _ref3$onlyGetFee = _ref3.onlyGetFee,
      onlyGetFee = _ref3$onlyGetFee === undefined ? false : _ref3$onlyGetFee;

  var commit, rootGetters, dispatch, fromId, pAcc, fromAccount, worker, res, _ret;

  return _regenerator2.default.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          commit = store.commit, rootGetters = store.rootGetters, dispatch = store.dispatch;

          dispatch("setOnlyGetOPFee", onlyGetFee);
          commit(types.TRANSFER_ASSET_REQUEST);
          commit(types.SET_TRX_DATA, null); //clear last SET_TRX_DATA
          fromId = rootGetters['account/getAccountUserId'];

          if (!proposeAccount) {
            _context5.next = 12;
            break;
          }

          _context5.next = 8;
          return _regenerator2.default.awrap(_api2.default.Account.getUser(proposeAccount, true));

        case 8:
          pAcc = _context5.sent;

          if (!(pAcc.code != 1)) {
            _context5.next = 11;
            break;
          }

          return _context5.abrupt('return', pAcc);

        case 11:
          proposeAccount = pAcc.data.account.id;

        case 12:
          _context5.next = 14;
          return _regenerator2.default.awrap(dispatch("user/fetchUser", fromId, { root: true }));

        case 14:
          fromAccount = _context5.sent.data;

          if (!rootGetters['WalletDb/isLocked']) {
            _context5.next = 17;
            break;
          }

          return _context5.abrupt('return', { code: 114, message: "Account is locked or not logged in" });

        case 17:
          worker = rootGetters["setting/g_settingsAPIs"].worker;
          // console.info("worker",worker,rootGetters["setting/g_settingsAPIs"]);

          _context5.next = 20;
          return _regenerator2.default.awrap(_api2.default.Transactions[worker ? "transactionOpWorker" : "transactionOp"](fromId, operations, fromAccount, proposeAccount, store));

        case 20:
          res = _context5.sent;

          if (!res.success) {
            _context5.next = 29;
            break;
          }

          _context5.next = 24;
          return _regenerator2.default.awrap(function _callee4() {
            var _res$data$, id, block_num, trx, results, op_result, i, _operations, params;

            return _regenerator2.default.async(function _callee4$(_context4) {
              while (1) {
                switch (_context4.prev = _context4.next) {
                  case 0:

                    // if(onlyGetFee) return {code:1,data:res.data}

                    _res$data$ = res.data[0], id = _res$data$.id, block_num = _res$data$.block_num, trx = _res$data$.trx;
                    results = [];
                    op_result = void 0;
                    i = 0;

                  case 4:
                    if (!(i < trx.operation_results.length)) {
                      _context4.next = 16;
                      break;
                    }

                    op_result = trx.operation_results[i][1];

                    if (!op_result.contract_affecteds) {
                      _context4.next = 12;
                      break;
                    }

                    _operations = op_result.contract_affecteds.map(function (item) {
                      var op_num = item[0] + 300;
                      if (item[0] == 1) {
                        op_num = op_num + "" + item[1].action;
                      }
                      return {
                        block_num: block_num,
                        id: "",
                        op: [Number(op_num), item[1]]
                      };
                    });
                    _context4.next = 10;
                    return _regenerator2.default.awrap(_api2.default.Operations.parseOperations({
                      operations: _operations,
                      store: store,
                      isContract: true
                    }));

                  case 10:
                    _context4.t0 = function (item) {
                      item.result = item.parse_operations;
                      item.result_text = item.parse_operations_text;

                      delete item.payload;
                      delete item.parse_operations;
                      delete item.parse_operations_text;

                      return item;
                    };

                    op_result.contract_affecteds = _context4.sent.map(_context4.t0);

                  case 12:

                    if ((0, _keys2.default)(op_result).length) results.push(op_result);

                  case 13:
                    i++;
                    _context4.next = 4;
                    break;

                  case 16:
                    params = operations[0].params;

                    if ("action" in params && params.action == "changePassword") {
                      dispatch("account/_logout", null, { root: true });
                    }

                    return _context4.abrupt('return', {
                      v: {
                        code: 1,
                        data: results,
                        trx_data: {
                          trx_id: id,
                          block_num: block_num
                        }
                      }
                    });

                  case 19:
                  case 'end':
                    return _context4.stop();
                }
              }
            }, null, undefined);
          }());

        case 24:
          _ret = _context5.sent;

          if (!((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object")) {
            _context5.next = 27;
            break;
          }

          return _context5.abrupt('return', _ret.v);

        case 27:
          _context5.next = 30;
          break;

        case 29:
          return _context5.abrupt('return', TRANSFER_ASSET_ERROR({ error: res.error, code: res.code }));

        case 30:
        case 'end':
          return _context5.stop();
      }
    }
  }, null, undefined);
};

var TRANSFER_ASSET_ERROR = function TRANSFER_ASSET_ERROR(_ref4) {
  var error = _ref4.error,
      code = _ref4.code;

  if (typeof error == "string") {
    error = {
      message: error
    };
  }

  var message = error.message;
  if (typeof error.message == "string") {
    if (error.message.indexOf("o.issuer == a.issuer") != -1) {
      code = 160;
      message = "You are not the creator of assets";
    }
  }

  return {
    code: code,
    message: message,
    error: error
  };
};

var setOrderData = exports.setOrderData = function setOrderData(_ref5, params) {
  var commit = _ref5.commit;

  commit(types.SET_ORDER_DATA, params);
};