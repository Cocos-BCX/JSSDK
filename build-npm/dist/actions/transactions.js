'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setOrderData = exports._transactionOperations = exports._encryptionOneMomeOperations = exports.setOnlyGetOPFee = exports.transferAsset = exports.encryptionOneMome = exports._decodeOneMemo = exports._checkingSignString = exports._signString = undefined;

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

var _bcxjsCores = require('bcxjs-cores');

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

// 2020-03-05  xulin_add 验签
var _checkingSignString = exports._checkingSignString = function _callee2(store, checkingSignParams) {
  var result;
  return _regenerator2.default.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          if (!store.rootGetters['WalletDb/isLocked']) {
            _context2.next = 2;
            break;
          }

          return _context2.abrupt('return', { code: 114, message: "Account is locked or not logged in" });

        case 2:
          _context2.next = 4;
          return _regenerator2.default.awrap(_api2.default.Transactions.checkingSignString(checkingSignParams));

        case 4:
          result = _context2.sent;

          if (!result) {
            _context2.next = 7;
            break;
          }

          return _context2.abrupt('return', result);

        case 7:
        case 'end':
          return _context2.stop();
      }
    }
  }, null, undefined);
};

// 4-29 解码单个备注
var _decodeOneMemo = exports._decodeOneMemo = function _callee3(store, memo_con, storeApi) {
  var memo, fromId, fromAccount, activepubkey, private_key, pubkey, public_key, memo_text, result;
  return _regenerator2.default.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          memo = memo_con;

          if (!store.rootGetters['WalletDb/isLocked']) {
            _context3.next = 3;
            break;
          }

          return _context3.abrupt('return', { code: 114, message: "Account is locked or not logged in" });

        case 3:
          if (!(!memo.from || !memo.to || !memo.nonce || !memo.message)) {
            _context3.next = 5;
            break;
          }

          return _context3.abrupt('return', { code: 101, message: "Parameter is missing" });

        case 5:
          fromId = store.rootGetters['account/getAccountUserId'];
          _context3.next = 8;
          return _regenerator2.default.awrap(store.dispatch("user/fetchUser", fromId, { root: true }));

        case 8:
          fromAccount = _context3.sent.data;
          activepubkey = fromAccount.account.active.key_auths[0][0];
          _context3.next = 12;
          return _regenerator2.default.awrap(store.dispatch("WalletDb/getPrivateKey", activepubkey, { root: true }));

        case 12:
          private_key = _context3.sent;
          pubkey = memo.from == activepubkey ? memo.to : memo.from;
          public_key = _bcxjsCores.PublicKey.fromPublicKeyString(pubkey);
          memo_text = private_key ? _bcxjsCores.Aes.decrypt_with_checksum(private_key, public_key, memo.nonce, memo.message).toString("utf-8") : null;
          result = {
            code: 1,
            data: {
              text: memo_text, isMine: memo.from == activepubkey
            }
          };
          return _context3.abrupt('return', result);

        case 18:
        case 'end':
          return _context3.stop();
      }
    }
  }, null, undefined);
};

// 2020-05-13  xulin add  加密memo
var encryptionOneMome = exports.encryptionOneMome = function _callee4(_ref, params) {
  var dispatch = _ref.dispatch,
      rootGetters = _ref.rootGetters;

  var fromId, _params$fromAccount, fromAccount, toAccount, _params$amount, amount, memo, _params$assetId, assetId, _params$isEncryption, isEncryption, _params$onlyGetFee, onlyGetFee, _params$proposeAccoun, proposeAccount, isPropose;

  return _regenerator2.default.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          if (!rootGetters['WalletDb/isLocked']) {
            _context4.next = 2;
            break;
          }

          return _context4.abrupt('return', { code: 114, message: "Account is locked or not logged in" });

        case 2:
          if (!(!params.memo || !params.toAccount)) {
            _context4.next = 4;
            break;
          }

          return _context4.abrupt('return', { code: 101, message: "Parameter is missing" });

        case 4:
          _helper2.default.trimParams(params);
          fromId = rootGetters['account/getAccountUserId'];
          _params$fromAccount = params.fromAccount, fromAccount = _params$fromAccount === undefined ? "" : _params$fromAccount, toAccount = params.toAccount, _params$amount = params.amount, amount = _params$amount === undefined ? 0 : _params$amount, memo = params.memo, _params$assetId = params.assetId, assetId = _params$assetId === undefined ? "1.3.0" : _params$assetId, _params$isEncryption = params.isEncryption, isEncryption = _params$isEncryption === undefined ? true : _params$isEncryption, _params$onlyGetFee = params.onlyGetFee, onlyGetFee = _params$onlyGetFee === undefined ? false : _params$onlyGetFee, _params$proposeAccoun = params.proposeAccount, proposeAccount = _params$proposeAccoun === undefined ? "" : _params$proposeAccoun, isPropose = params.isPropose;

          if (toAccount) {
            _context4.next = 9;
            break;
          }

          return _context4.abrupt('return', { code: 124, message: "Receivables account name can not be empty" });

        case 9:

          if (isPropose) {
            proposeAccount = fromAccount;
          }

          assetId = assetId || "1.3.0";
          assetId = assetId.toUpperCase();

          return _context4.abrupt('return', dispatch('_encryptionOneMomeOperations', {
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

        case 13:
        case 'end':
          return _context4.stop();
      }
    }
  }, null, undefined);
};

var transferAsset = exports.transferAsset = function _callee5(_ref2, params) {
  var dispatch = _ref2.dispatch,
      rootGetters = _ref2.rootGetters;

  var _params$fromAccount2, fromAccount, toAccount, _params$amount2, amount, memo, _params$assetId2, assetId, _params$isEncryption2, isEncryption, _params$onlyGetFee2, onlyGetFee, _params$proposeAccoun2, proposeAccount, isPropose;

  return _regenerator2.default.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _helper2.default.trimParams(params);
          _params$fromAccount2 = params.fromAccount, fromAccount = _params$fromAccount2 === undefined ? "" : _params$fromAccount2, toAccount = params.toAccount, _params$amount2 = params.amount, amount = _params$amount2 === undefined ? 0 : _params$amount2, memo = params.memo, _params$assetId2 = params.assetId, assetId = _params$assetId2 === undefined ? "1.3.0" : _params$assetId2, _params$isEncryption2 = params.isEncryption, isEncryption = _params$isEncryption2 === undefined ? true : _params$isEncryption2, _params$onlyGetFee2 = params.onlyGetFee, onlyGetFee = _params$onlyGetFee2 === undefined ? false : _params$onlyGetFee2, _params$proposeAccoun2 = params.proposeAccount, proposeAccount = _params$proposeAccoun2 === undefined ? "" : _params$proposeAccoun2, isPropose = params.isPropose;

          if (toAccount) {
            _context5.next = 4;
            break;
          }

          return _context5.abrupt('return', { code: 124, message: "Receivables account name can not be empty" });

        case 4:

          if (isPropose) {
            proposeAccount = fromAccount;
          }

          assetId = assetId || "1.3.0";
          assetId = assetId.toUpperCase();

          return _context5.abrupt('return', dispatch('_transactionOperations', {
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
          return _context5.stop();
      }
    }
  }, null, undefined);
};

var setOnlyGetOPFee = exports.setOnlyGetOPFee = function setOnlyGetOPFee(_ref3, b) {
  var commit = _ref3.commit;

  commit(types.SET_ONLY_GET_OP_FEE, b);
};

// 2020-05-13 xulin add 加密memo
var _encryptionOneMomeOperations = exports._encryptionOneMomeOperations = function _callee6(store, _ref4) {
  var operations = _ref4.operations,
      _ref4$proposeAccount = _ref4.proposeAccount,
      proposeAccount = _ref4$proposeAccount === undefined ? "" : _ref4$proposeAccount,
      _ref4$onlyGetFee = _ref4.onlyGetFee,
      onlyGetFee = _ref4$onlyGetFee === undefined ? false : _ref4$onlyGetFee;
  var commit, rootGetters, dispatch, fromId, pAcc, fromAccount, res;
  return _regenerator2.default.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          commit = store.commit, rootGetters = store.rootGetters, dispatch = store.dispatch;

          dispatch("setOnlyGetOPFee", onlyGetFee);
          commit(types.TRANSFER_ASSET_REQUEST);
          commit(types.SET_TRX_DATA, null); //clear last SET_TRX_DATA
          fromId = rootGetters['account/getAccountUserId'];

          if (!proposeAccount) {
            _context6.next = 12;
            break;
          }

          _context6.next = 8;
          return _regenerator2.default.awrap(_api2.default.Account.getUser(proposeAccount, true));

        case 8:
          pAcc = _context6.sent;

          if (!(pAcc.code != 1)) {
            _context6.next = 11;
            break;
          }

          return _context6.abrupt('return', pAcc);

        case 11:
          proposeAccount = pAcc.data.account.id;

        case 12:
          _context6.next = 14;
          return _regenerator2.default.awrap(dispatch("user/fetchUser", fromId, { root: true }));

        case 14:
          fromAccount = _context6.sent.data;

          if (!rootGetters['WalletDb/isLocked']) {
            _context6.next = 17;
            break;
          }

          return _context6.abrupt('return', { code: 114, message: "Account is locked or not logged in" });

        case 17:
          _context6.next = 19;
          return _regenerator2.default.awrap(_api2.default.Transactions.oneMomeOp(fromId, operations, fromAccount, proposeAccount, store));

        case 19:
          res = _context6.sent;
          return _context6.abrupt('return', res);

        case 21:
        case 'end':
          return _context6.stop();
      }
    }
  }, null, undefined);
};

var _transactionOperations = exports._transactionOperations = function _callee8(store, _ref5) {
  var operations = _ref5.operations,
      _ref5$proposeAccount = _ref5.proposeAccount,
      proposeAccount = _ref5$proposeAccount === undefined ? "" : _ref5$proposeAccount,
      _ref5$onlyGetFee = _ref5.onlyGetFee,
      onlyGetFee = _ref5$onlyGetFee === undefined ? false : _ref5$onlyGetFee;

  var commit, rootGetters, dispatch, fromId, pAcc, fromAccount, worker, res, _ret;

  return _regenerator2.default.async(function _callee8$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          commit = store.commit, rootGetters = store.rootGetters, dispatch = store.dispatch;

          dispatch("setOnlyGetOPFee", onlyGetFee);
          commit(types.TRANSFER_ASSET_REQUEST);
          commit(types.SET_TRX_DATA, null); //clear last SET_TRX_DATA
          fromId = rootGetters['account/getAccountUserId'];

          if (!proposeAccount) {
            _context8.next = 12;
            break;
          }

          _context8.next = 8;
          return _regenerator2.default.awrap(_api2.default.Account.getUser(proposeAccount, true));

        case 8:
          pAcc = _context8.sent;

          if (!(pAcc.code != 1)) {
            _context8.next = 11;
            break;
          }

          return _context8.abrupt('return', pAcc);

        case 11:
          proposeAccount = pAcc.data.account.id;

        case 12:
          _context8.next = 14;
          return _regenerator2.default.awrap(dispatch("user/fetchUser", fromId, { root: true }));

        case 14:
          fromAccount = _context8.sent.data;

          if (!rootGetters['WalletDb/isLocked']) {
            _context8.next = 17;
            break;
          }

          return _context8.abrupt('return', { code: 114, message: "Account is locked or not logged in" });

        case 17:
          worker = rootGetters["setting/g_settingsAPIs"].worker;
          // console.info("worker",worker,rootGetters["setting/g_settingsAPIs"]);

          _context8.next = 20;
          return _regenerator2.default.awrap(_api2.default.Transactions[worker ? "transactionOpWorker" : "transactionOp"](fromId, operations, fromAccount, proposeAccount, store));

        case 20:
          res = _context8.sent;

          if (!res.success) {
            _context8.next = 29;
            break;
          }

          _context8.next = 24;
          return _regenerator2.default.awrap(function _callee7() {
            var _res$data$, id, block_num, trx, results, op_result, i, _operations, params;

            return _regenerator2.default.async(function _callee7$(_context7) {
              while (1) {
                switch (_context7.prev = _context7.next) {
                  case 0:

                    // if(onlyGetFee) return {code:1,data:res.data}

                    _res$data$ = res.data[0], id = _res$data$.id, block_num = _res$data$.block_num, trx = _res$data$.trx;
                    results = [];
                    op_result = void 0;
                    i = 0;

                  case 4:
                    if (!(i < trx.operation_results.length)) {
                      _context7.next = 16;
                      break;
                    }

                    op_result = trx.operation_results[i][1];

                    if (!op_result.contract_affecteds) {
                      _context7.next = 12;
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
                    _context7.next = 10;
                    return _regenerator2.default.awrap(_api2.default.Operations.parseOperations({
                      operations: _operations,
                      store: store,
                      isContract: true
                    }));

                  case 10:
                    _context7.t0 = function (item) {
                      item.result = item.parse_operations;
                      item.result_text = item.parse_operations_text;

                      delete item.payload;
                      delete item.parse_operations;
                      delete item.parse_operations_text;

                      return item;
                    };

                    op_result.contract_affecteds = _context7.sent.map(_context7.t0);

                  case 12:

                    if ((0, _keys2.default)(op_result).length) results.push(op_result);

                  case 13:
                    i++;
                    _context7.next = 4;
                    break;

                  case 16:
                    params = operations[0].params;

                    if ("action" in params && params.action == "changePassword") {
                      dispatch("account/_logout", null, { root: true });
                    }

                    return _context7.abrupt('return', {
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
                    return _context7.stop();
                }
              }
            }, null, undefined);
          }());

        case 24:
          _ret = _context8.sent;

          if (!((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object")) {
            _context8.next = 27;
            break;
          }

          return _context8.abrupt('return', _ret.v);

        case 27:
          _context8.next = 30;
          break;

        case 29:
          return _context8.abrupt('return', TRANSFER_ASSET_ERROR({ error: res.error, code: res.code }));

        case 30:
        case 'end':
          return _context8.stop();
      }
    }
  }, null, undefined);
};

var TRANSFER_ASSET_ERROR = function TRANSFER_ASSET_ERROR(_ref6) {
  var error = _ref6.error,
      code = _ref6.code;

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

var setOrderData = exports.setOrderData = function setOrderData(_ref7, params) {
  var commit = _ref7.commit;

  commit(types.SET_ORDER_DATA, params);
};