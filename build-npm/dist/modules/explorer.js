'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _mutations2 = require('../mutations');

var types = _interopRequireWildcard(_mutations2);

var _api = require('../services/api');

var _api2 = _interopRequireDefault(_api);

var _helper = require('../lib/common/helper');

var _helper2 = _interopRequireDefault(_helper);

var _bcxjsCores = require('bcxjs-cores');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var initialState = {
  //ex_global_object:null
  last_current_aslot: 0
};

// let _last_current_aslot=0;
var _last_date_now = 0;
var actions = {
  getDataByIds: function getDataByIds(store, _ref) {
    var ids = _ref.ids;

    return _api2.default.Explorer.getDataByIds(ids);
  },
  queryTransaction: function queryTransaction(store, _ref2) {
    var _ref2$transactionId = _ref2.transactionId,
        transactionId = _ref2$transactionId === undefined ? "" : _ref2$transactionId;
    var result, transaction, operations, block_num, operation_results, parse_ops;
    return _regenerator2.default.async(function queryTransaction$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!/^[a-zA-Z\d]{64}$/.test(transactionId)) {
              _context.next = 20;
              break;
            }

            _context.next = 3;
            return _regenerator2.default.awrap(_api2.default.Explorer.getTransactionById(transactionId));

          case 3:
            result = _context.sent;

            if (!(result.code != 1)) {
              _context.next = 6;
              break;
            }

            return _context.abrupt('return', result);

          case 6:
            transaction = result.data;
            operations = transaction.operations, block_num = transaction.block_num, operation_results = transaction.operation_results;
            parse_ops = operations.map(function (op, op_index) {
              return {
                op: op,
                block_num: block_num,
                result: operation_results[op_index]
              };
            });
            _context.next = 11;
            return _regenerator2.default.awrap(_api2.default.Operations.parseOperations({ operations: parse_ops, store: store }));

          case 11:
            parse_ops = _context.sent;

            transaction.parse_ops = parse_ops.operations;
            transaction.trx_id = transactionId;
            transaction.expiration = new Date(transaction.expiration + "Z").format("yyyy/MM/dd HH:mm:ss");
            delete transaction.operations;
            delete transaction.operation_results;

            return _context.abrupt('return', {
              code: 1,
              data: transaction
            });

          case 20:
            return _context.abrupt('return', { code: 1011, message: "Parameter error" });

          case 21:
          case 'end':
            return _context.stop();
        }
      }
    }, null, undefined);
  },
  queryBlock: function queryBlock(store, params) {
    var _params$block, block, _params$isReqTrx, isReqTrx, _params$isParseTrx, isParseTrx, _params$maxOpCount, maxOpCount, _params$block_res, block_res, result;

    return _regenerator2.default.async(function queryBlock$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _params$block = params.block, block = _params$block === undefined ? "" : _params$block, _params$isReqTrx = params.isReqTrx, isReqTrx = _params$isReqTrx === undefined ? true : _params$isReqTrx, _params$isParseTrx = params.isParseTrx, isParseTrx = _params$isParseTrx === undefined ? true : _params$isParseTrx, _params$maxOpCount = params.maxOpCount, maxOpCount = _params$maxOpCount === undefined ? 1000000 : _params$maxOpCount, _params$block_res = params.block_res, block_res = _params$block_res === undefined ? null : _params$block_res;

            if (isParseTrx == undefined) {
              isParseTrx = true;
            }
            if (block && typeof block == "string") block = block.trim();

            if (/^\d+$/.test(block)) {
              _context4.next = 5;
              break;
            }

            return _context4.abrupt('return', {
              code: 1011,
              message: "Parameter error"
            });

          case 5:
            if (!(block_res && !isReqTrx)) {
              _context4.next = 9;
              break;
            }

            _context4.t0 = block_res;
            _context4.next = 12;
            break;

          case 9:
            _context4.next = 11;
            return _regenerator2.default.awrap(_api2.default.Operations.getBlock(block));

          case 11:
            _context4.t0 = _context4.sent;

          case 12:
            result = _context4.t0;

            if (!(result.code == 1)) {
              _context4.next = 16;
              break;
            }

            _context4.next = 16;
            return _regenerator2.default.awrap(function _callee2() {
              var _result$data, head_block_id, time, current_witness, current_transaction_count, blockInfo;

              return _regenerator2.default.async(function _callee2$(_context3) {
                while (1) {
                  switch (_context3.prev = _context3.next) {
                    case 0:

                      if (block_res && !isReqTrx) {
                        _result$data = result.data, head_block_id = _result$data.head_block_id, time = _result$data.time, current_witness = _result$data.current_witness, current_transaction_count = _result$data.current_transaction_count;

                        result.data = {
                          block_num: block,
                          block_height: block,
                          block_id: head_block_id,
                          witness: current_witness,
                          timestamp: time,
                          trx_count: current_transaction_count,
                          op_count: current_transaction_count
                        };
                      }

                      blockInfo = result.data;

                      blockInfo.time = new Date(blockInfo.timestamp + "Z").format("yyyy/MM/dd HH:mm:ss");
                      blockInfo.block_height = block;
                      _context3.next = 6;
                      return _regenerator2.default.awrap(_api2.default.Explorer.getWitnessName(blockInfo.witness));

                    case 6:
                      blockInfo.witness_name = _context3.sent;

                      if (!isReqTrx) {
                        _context3.next = 10;
                        break;
                      }

                      _context3.next = 10;
                      return _regenerator2.default.awrap(function _callee() {
                        var transactions, parse_ops, transaction, filter_transactions, trx_ops_count, i;
                        return _regenerator2.default.async(function _callee$(_context2) {
                          while (1) {
                            switch (_context2.prev = _context2.next) {
                              case 0:
                                transactions = blockInfo.transactions;
                                parse_ops = void 0;
                                transaction = void 0;
                                filter_transactions = [];
                                trx_ops_count = 0;

                                blockInfo.op_count = 0;
                                i = 0;

                              case 7:
                                if (!(i < transactions.length)) {
                                  _context2.next = 28;
                                  break;
                                }

                                transaction = transactions[i][1];
                                trx_ops_count = transaction.operations.length;
                                blockInfo.op_count += trx_ops_count;

                                if (!(!block_res && blockInfo.op_count < maxOpCount && isParseTrx)) {
                                  _context2.next = 22;
                                  break;
                                }

                                parse_ops = transaction.operations.map(function (op, op_index) {
                                  return {
                                    op: op,
                                    block_num: block,
                                    result: transaction.operation_results[op_index]
                                  };
                                });
                                _context2.next = 15;
                                return _regenerator2.default.awrap(_api2.default.Operations.parseOperations({ operations: parse_ops, store: store }));

                              case 15:
                                parse_ops = _context2.sent;

                                transaction.parse_ops = parse_ops.operations;
                                transaction.parse_ops = transaction.parse_ops.map(function (item) {
                                  item.date = blockInfo.time;
                                  return item;
                                });
                                delete transaction.operations;
                                delete transaction.operation_results;
                                _context2.next = 23;
                                break;

                              case 22:
                                parse_ops = transaction.operations;

                              case 23:

                                transaction.trx_id = transactions[i][0];
                                filter_transactions.push(transaction);

                              case 25:
                                i++;
                                _context2.next = 7;
                                break;

                              case 28:
                                blockInfo.transactions = filter_transactions;
                                blockInfo.trx_count = transactions.length;

                              case 30:
                              case 'end':
                                return _context2.stop();
                            }
                          }
                        }, null, undefined);
                      }());

                    case 10:
                    case 'end':
                      return _context3.stop();
                  }
                }
              }, null, undefined);
            }());

          case 16:
            return _context4.abrupt('return', result);

          case 17:
          case 'end':
            return _context4.stop();
        }
      }
    }, null, undefined);
  },
  set_last_current_aslot: function set_last_current_aslot(_ref3) {
    var commit = _ref3.commit;

    commit(types.SET_LAST_CURRENT_ASLOT, 0);
  },
  getDynGlobalObject: function getDynGlobalObject(store) {
    return _api2.default.Explorer.getDynGlobalObject(true, true);
  },
  getExplorerWitnesses: function getExplorerWitnesses(store) {
    var dispatch, rootGetters, state, commit, _last_current_aslot, globalObject, dynGlobalObject, _globalObject, active_witnesses, parameters, _dynGlobalObject, current_witness, current_witness_name, participation, witness_budget, next_maintenance_time, current_aslot, coreAsset, pow_precision;

    return _regenerator2.default.async(function getExplorerWitnesses$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            dispatch = store.dispatch, rootGetters = store.rootGetters, state = store.state, commit = store.commit;
            _last_current_aslot = state.last_current_aslot;
            globalObject = rootGetters["vote/globalObject"];

            if (globalObject) {
              _context5.next = 12;
              break;
            }

            _context5.next = 6;
            return _regenerator2.default.awrap(_api2.default.Explorer.getGlobalObject());

          case 6:
            globalObject = _context5.sent;

            if (!(globalObject.code != 1)) {
              _context5.next = 9;
              break;
            }

            return _context5.abrupt('return', globalObject);

          case 9:
            globalObject = globalObject.data;
            _context5.next = 13;
            break;

          case 12:
            globalObject = JSON.parse((0, _stringify2.default)(globalObject));

          case 13:
            _context5.next = 15;
            return _regenerator2.default.awrap(_api2.default.Explorer.getDynGlobalObject(true, true));

          case 15:
            dynGlobalObject = _context5.sent;

            if (!(dynGlobalObject.code != 1)) {
              _context5.next = 18;
              break;
            }

            return _context5.abrupt('return', dynGlobalObject);

          case 18:
            dynGlobalObject = dynGlobalObject.data;
            _globalObject = globalObject, active_witnesses = _globalObject.active_witnesses, parameters = _globalObject.parameters;
            _dynGlobalObject = dynGlobalObject, current_witness = _dynGlobalObject.current_witness, current_witness_name = _dynGlobalObject.current_witness_name, participation = _dynGlobalObject.participation, witness_budget = _dynGlobalObject.witness_budget, next_maintenance_time = _dynGlobalObject.next_maintenance_time, current_aslot = _dynGlobalObject.current_aslot;
            _context5.next = 23;
            return _regenerator2.default.awrap(dispatch("assets/fetchAssets", { assets: ["1.3.0"], isOne: true }, { root: true }));

          case 23:
            coreAsset = _context5.sent;
            pow_precision = Math.pow(10, coreAsset.precision);
            //  let all_witness=

            return _context5.abrupt('return', new _promise2.default(function (resolve) {
              dispatch("vote/getVoteObjects", { type: "witnesses", isExplorer: true, callback: function callback(res) {
                  if (res.code == 1) {
                    var date_now = void 0;
                    var witnesses = res.data.filter(function (item) {
                      return ("," + active_witnesses.join(",") + ",").indexOf("," + item.witness_id + ",") >= 0;
                    });
                    witnesses = witnesses.map(function (item) {
                      if (_last_current_aslot != current_aslot) {
                        commit(types.SET_LAST_CURRENT_ASLOT, current_aslot);
                        date_now = Date.now();
                        _last_date_now = date_now;
                      } else {
                        date_now = _last_date_now;
                      }
                      item.last_aslot_time = new Date(date_now - (current_aslot - item.last_aslot) * parameters.block_interval * 1000).format("yyyy/MM/dd HH:mm:ss");

                      return item;
                    });

                    participation = participation || 100;
                    resolve({
                      code: 1,
                      data: {
                        current_witness: current_witness,
                        current_witness_name: current_witness_name,
                        active_witnesses: active_witnesses,
                        participation: participation,
                        witness_pay_per_block: _helper2.default.getFullNum(parameters.witness_pay_per_block / pow_precision),
                        witness_budget: _helper2.default.getFullNum(witness_budget / pow_precision),
                        next_maintenance_time: new Date(next_maintenance_time + "Z").format("yyyy/MM/dd HH:mm:ss"),
                        witnesses: witnesses,
                        core_asset_symbol: coreAsset.symbol
                      }
                    });
                  } else {
                    resolve(res);
                  }
                } }, { root: true });
            }));

          case 26:
          case 'end':
            return _context5.stop();
        }
      }
    }, null, undefined);
  }
};

var mutations = (0, _defineProperty3.default)({}, types.SET_LAST_CURRENT_ASLOT, function (state, aslot) {
  state.last_current_aslot = aslot;
});

exports.default = {
  state: initialState,
  actions: actions,
  // getters,
  mutations: mutations,
  namespaced: true
};