'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _bcxjsCores = require('bcxjs-cores');

var _bcxjsWs = require('bcxjs-ws');

var _api = require('../api');

var _api2 = _interopRequireDefault(_api);

var _zh = require('../../assets/lang/zh.js');

var _zh2 = _interopRequireDefault(_zh);

var _en = require('../../assets/lang/en.js');

var _en2 = _interopRequireDefault(_en);

var _utils = require('../../lib/common/utils');

var _utils2 = _interopRequireDefault(_utils);

var _helper = require('../../lib/common/helper');

var _helper2 = _interopRequireDefault(_helper);

var _market_utils = require('../../lib/common/market_utils');

var _market_utils2 = _interopRequireDefault(_market_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _locales = {
  en: _en2.default,
  zh: _zh2.default
};

var _store = void 0;
var _cacheBlocks = {};
var reqBlockOK = true;
// Service for dealing with operations (transactions)
var Operations = {
  _operationTypes: {
    300: "contract_affecteds_asset",
    3010: "contract_affecteds_nh_transfer_from",
    3011: "contract_affecteds_nh_transfer_to",
    3012: "contract_affecteds_nh_modifined",
    303: "contract_affecteds_log"
  },

  results: ["error_result", "void_result", "object_id_result", "asset_result", "contract_result", "logger_result"],
  // Prepares object with code : operation's name format
  prepareOperationTypes: function prepareOperationTypes() {
    (0, _keys2.default)(_bcxjsCores.ChainTypes.operations).forEach(function (name) {
      var code = _bcxjsCores.ChainTypes.operations[name];
      Operations._operationTypes[code] = name;
    });
  },

  // Gets operation's data based on it's block number
  _getOperationDate: function _getOperationDate(operation, ApiObject, ApiObjectDyn) {
    var blockInterval = ApiObject[0].parameters.block_interval;
    var headBlock = ApiObjectDyn[0].head_block_number;
    var headBlockTime = new Date(ApiObjectDyn[0].time + 'Z');
    var secondsBelow = (headBlock - operation.block_num) * blockInterval;
    var date = new Date(headBlockTime - secondsBelow * 1000).format("yyyy/MM/dd HH:mm:ss");
    return date;
  },

  // Used for place order and fill order operations. Determines if user is a seller or buyer
  _checkIfBidOperation: function _checkIfBidOperation(operation) {
    var ApiInstance, blockNum, trxInBlock, transaction, amountAssetId, feeAssetId;
    return _regenerator2.default.async(function _checkIfBidOperation$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            ApiInstance = _bcxjsWs.Apis.instance();
            blockNum = operation.block_num;
            trxInBlock = operation.trx_in_block;
            _context.next = 5;
            return _regenerator2.default.awrap(ApiInstance.db_api().exec('get_transaction', [blockNum, trxInBlock]));

          case 5:
            transaction = _context.sent;
            amountAssetId = transaction.operations[0][1].amount_to_sell.asset_id;
            feeAssetId = transaction.operations[0][1].fee.asset_id;
            return _context.abrupt('return', amountAssetId === feeAssetId);

          case 9:
          case 'end':
            return _context.stop();
        }
      }
    }, null, undefined);
  },

  // User for transfer operations. Determines if user received or sent
  _getOperationOtherUserName: function _getOperationOtherUserName(userId, payload) {
    var otherUserId, userRequest;
    return _regenerator2.default.async(function _getOperationOtherUserName$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            otherUserId = payload.to === userId ? payload.from : payload.to;
            _context2.next = 3;
            return _regenerator2.default.awrap(_api2.default.Account.getAccount(otherUserId, true));

          case 3:
            userRequest = _context2.sent;
            return _context2.abrupt('return', userRequest.success ? userRequest.data.account.name : '');

          case 5:
          case 'end':
            return _context2.stop();
        }
      }
    }, null, undefined);
  },

  // Parses operation for improved format
  _parseOperation: function _parseOperation(operation, userId, ApiObject, ApiObjectDyn) {
    var _operation$op, type, payload, operationType, date, block_res, isBid, otherUserName, res, op_id, _operations;

    return _regenerator2.default.async(function _parseOperation$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _operation$op = (0, _slicedToArray3.default)(operation.op, 2), type = _operation$op[0], payload = _operation$op[1];
            operationType = Operations._operationTypes[type];
            date = Operations._getOperationDate(operation, ApiObject, ApiObjectDyn);
            _context3.next = 5;
            return _regenerator2.default.awrap(_api2.default.Operations.get_block_header(operation.block_num));

          case 5:
            block_res = _context3.sent;

            if (block_res.code == 1) {
              date = new Date(block_res.data.timestamp + "Z").format("yyyy/MM/dd HH:mm:ss");
            }
            isBid = false;
            otherUserName = null;
            res = {
              block_num: operation.block_num,
              type: operationType,
              payload: payload,
              date: date
            };
            op_id = operation.id;

            if (op_id) {
              res.id = op_id;
            }

            if (!(operationType === 'fill_order' || operationType === 'limit_order_create')) {
              _context3.next = 17;
              break;
            }

            _context3.next = 15;
            return _regenerator2.default.awrap(Operations._checkIfBidOperation(operation));

          case 15:
            isBid = _context3.sent;

            res.buyer = isBid;

          case 17:
            if (!(operationType === 'transfer' && userId)) {
              _context3.next = 22;
              break;
            }

            _context3.next = 20;
            return _regenerator2.default.awrap(Operations._getOperationOtherUserName(userId, payload));

          case 20:
            otherUserName = _context3.sent;

            res.other_user_name = otherUserName;

          case 22:
            if (!operation.result) {
              _context3.next = 32;
              break;
            }

            res.result = operation.result[1];
            res.result.type = _store.rootGetters["setting/trx_results"][operation.result[0]];
            if (operationType == "creat_nh_asset") {
              res.payload.item_id = operation.result[1].result;
            }
            if (operationType == "creat_world_view") {
              res.payload.version_id = operation.result[1];
            }

            if (!(operationType == "call_contract_function")) {
              _context3.next = 32;
              break;
            }

            _operations = operation.result[1].contract_affecteds.map(function (item) {
              var op_num = item[0] + 300;
              if (item[0] == 1) {
                op_num = op_num + "" + item[1].action;
              }
              return {
                block_num: operation.block_num,
                id: operation.id,
                op: [Number(op_num), item[1]]
              };
            });
            _context3.next = 31;
            return _regenerator2.default.awrap(Operations.parseOperations({
              operations: _operations,
              userId: _store.rootGetters["account/getAccountUserId"],
              store: _store,
              isContract: true
            }));

          case 31:
            res.result.contract_affecteds = _context3.sent;

          case 32:
            return _context3.abrupt('return', res);

          case 33:
          case 'end':
            return _context3.stop();
        }
      }
    }, null, undefined);
  },

  // Parses array of operations, return array of parsed operations and array of assets ids
  // that were user in it. United Labs of BCTech.
  parseOperations: function parseOperations(_ref) {
    var operations = _ref.operations,
        _ref$userId = _ref.userId,
        userId = _ref$userId === undefined ? null : _ref$userId,
        store = _ref.store,
        _ref$isContract = _ref.isContract,
        isContract = _ref$isContract === undefined ? false : _ref$isContract;
    var ApiInstance, ApiObject, ApiObjectDyn, operationTypes, filteredOperations, parsedOperations, j, assetsIds, item, i, parseOpObj, feeObj, feeAsset, trxType;
    return _regenerator2.default.async(function parseOperations$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _store = store;
            ApiInstance = _bcxjsWs.Apis.instance();
            _context4.next = 4;
            return _regenerator2.default.awrap(_api2.default.Explorer.getGlobalObject());

          case 4:
            _context4.t0 = _context4.sent.data;
            ApiObject = [_context4.t0];
            _context4.next = 8;
            return _regenerator2.default.awrap(_api2.default.Explorer.getDynGlobalObject(false));

          case 8:
            _context4.t1 = _context4.sent.data;
            ApiObjectDyn = [_context4.t1];

            // console.info('operations',JSON.parse(JSON.stringify(operations)));
            operationTypes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 18, 21, 22, 32, 39, 43, 44, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 60, 61, 62, 300, 301, 303, 3010, 3011, 3012]; //,53,54.55,56,57,58

            filteredOperations = operations.filter(function (op) {
              return operationTypes.includes(op.op[0]);
            });
            parsedOperations = [];
            j = 0;

          case 14:
            if (!(j < filteredOperations.length)) {
              _context4.next = 23;
              break;
            }

            _context4.t2 = parsedOperations;
            _context4.next = 18;
            return _regenerator2.default.awrap(Operations._parseOperation(filteredOperations[j], userId, ApiObject, ApiObjectDyn));

          case 18:
            _context4.t3 = _context4.sent;

            _context4.t2.push.call(_context4.t2, _context4.t3);

          case 20:
            j++;
            _context4.next = 14;
            break;

          case 23:
            assetsIds = Operations._getOperationsAssetsIds(parsedOperations);
            item = void 0;
            i = 0;

          case 26:
            if (!(i < parsedOperations.length)) {
              _context4.next = 45;
              break;
            }

            item = parsedOperations[i];

            if (isContract) {
              delete item.id;
              delete item.date;
            }
            _context4.next = 31;
            return _regenerator2.default.awrap(Operations.getParseOperations(item));

          case 31:
            parseOpObj = _context4.sent;

            item.parseOperationsText = parseOpObj.opText.join("");
            item.parseOperations = parseOpObj.opObj;
            feeObj = item.payload.fee;

            if (!feeObj) {
              _context4.next = 40;
              break;
            }

            _context4.next = 38;
            return _regenerator2.default.awrap(_api2.default.Assets.fetch([feeObj.asset_id], true));

          case 38:
            feeAsset = _context4.sent;

            if (feeAsset) item.parseOperations.fee = _helper2.default.getFullNum(feeObj.amount / Math.pow(10, feeAsset.precision)) + " " + feeAsset.symbol;

          case 40:
            trxType = "trxTypes_" + item.type;

            if (trxType in _zh2.default) {
              item.typeName = _locales[_store.rootGetters["setting/defaultSettings"].locale][trxType];
            }

          case 42:
            i++;
            _context4.next = 26;
            break;

          case 45:
            if (!isContract) {
              _context4.next = 49;
              break;
            }

            delete parsedOperations.id;
            delete parsedOperations.date;
            return _context4.abrupt('return', parsedOperations.map(function (item) {
              item.parse_operations = item.parseOperations;
              item.parse_operations_text = item.parseOperationsText;
              item.raw_data = item.payload;
              item.type_name = item.typeName;

              delete item.parseOperations;
              delete item.parseOperationsText;
              delete item.payload;
              delete item.typeName;
              return item;
            }));

          case 49:
            return _context4.abrupt('return', {
              operations: parsedOperations.map(function (item) {
                item.parse_operations = item.parseOperations;
                item.parse_operations_text = item.parseOperationsText;
                item.raw_data = item.payload;
                item.type_name = item.typeName;

                delete item.parseOperations;
                delete item.parseOperationsText;
                delete item.payload;
                delete item.typeName;
                return item;
              }),
              assetsIds: assetsIds
            });

          case 50:
          case 'end':
            return _context4.stop();
        }
      }
    }, null, undefined);
  },

  getParseOperations: function getParseOperations(op) {
    var o, receivedAmount, isAsk, contract, action, value_list_jsons, v, types, proposal_create, proposalOp, proposal_content, restricted_type_text, start_time, crontab_create, crontabOp, crontab_content, restart_time;
    return _regenerator2.default.async(function getParseOperations$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            o = void 0;
            _context5.t0 = op.type;
            _context5.next = _context5.t0 === "transfer" ? 4 : _context5.t0 === "account_create" ? 8 : _context5.t0 === "account_update" ? 12 : _context5.t0 === "account_upgrade" ? 16 : _context5.t0 === "fill_order" ? 20 : _context5.t0 === "limit_order_create" ? 26 : _context5.t0 === "limit_order_cancel" ? 32 : _context5.t0 === "vesting_balance_withdraw" ? 36 : _context5.t0 === "call_contract_function" ? 40 : _context5.t0 === "contract_create" ? 52 : _context5.t0 === "revise_contract" ? 56 : _context5.t0 === "register_nh_asset_creator" ? 60 : _context5.t0 === "creat_world_view" ? 64 : _context5.t0 === "creat_nh_asset" ? 68 : _context5.t0 === "delete_nh_asset" ? 74 : _context5.t0 === "transfer_nh_asset" ? 78 : _context5.t0 === "relate_nh_asset" ? 82 : _context5.t0 === "creat_nh_asset_order" ? 86 : _context5.t0 === "cancel_nh_asset_order" ? 90 : _context5.t0 === "fill_nh_asset_order" ? 94 : _context5.t0 === "relate_world_view" ? 98 : _context5.t0 === "proposal_create" ? 102 : _context5.t0 === "proposal_update" ? 112 : _context5.t0 === "contract_affecteds_nh_transfer_from" ? 116 : _context5.t0 === "contract_affecteds_nh_transfer_to" ? 120 : _context5.t0 === "contract_affecteds_nh_modifined" ? 124 : _context5.t0 === "contract_affecteds_asset" ? 128 : _context5.t0 === "contract_affecteds_log" ? 132 : _context5.t0 === "asset_create" ? 136 : _context5.t0 === "asset_update" ? 140 : _context5.t0 === "asset_update_restricted" ? 144 : _context5.t0 === "asset_issue" ? 149 : _context5.t0 === "asset_reserve" ? 153 : _context5.t0 === "asset_fund_fee_pool" ? 157 : _context5.t0 === "asset_publish_feed" ? 161 : _context5.t0 === "asset_claim_fees" ? 165 : _context5.t0 === "crontab_create" ? 169 : _context5.t0 === "crontab_cancel" ? 183 : _context5.t0 === "crontab_recover" ? 187 : 193;
            break;

          case 4:
            _context5.next = 6;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_transfer", [{ type: "account", value: op.payload.from, arg: "from" }, {
              type: "amount",
              value: op.payload.amount,
              arg: "amount",
              decimalOffset: op.payload.amount.asset_id === "1.3.0" ? 0 : null
            }, { type: "account", value: op.payload.to, arg: "to" }]));

          case 6:
            return _context5.abrupt('return', _context5.sent);

          case 8:
            _context5.next = 10;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_reg_account", [{ type: "account", value: op.payload.registrar, arg: "registrar" }, { type: "account", value: op.payload.name, arg: "new_account" }]));

          case 10:
            return _context5.abrupt('return', _context5.sent);

          case 12:
            _context5.next = 14;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_update_account", [{ type: "account", value: op.payload.account, arg: "account" }]));

          case 14:
            return _context5.abrupt('return', _context5.sent);

          case 16:
            _context5.next = 18;
            return _regenerator2.default.awrap(Operations.getTranslateInfo(op.payload.upgrade_to_lifetime_member ? "operation_lifetime_upgrade_account" : "operation_annual_upgrade_account", [{ type: "account", value: op.payload.account_to_upgrade, arg: "account" }]));

          case 18:
            return _context5.abrupt('return', _context5.sent);

          case 20:
            o = op.payload;
            receivedAmount = o.fee.asset_id === o.receives.asset_id ? o.receives.amount - o.fee.amount : o.receives.amount;
            _context5.next = 24;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_fill_order", [{ type: "account", value: o.account_id, arg: "account" }, {
              type: "amount",
              value: { amount: receivedAmount, asset_id: o.receives.asset_id },
              arg: "received",
              decimalOffset: o.receives.asset_id === "1.3.0" ? 3 : null
            }, { type: "price", value: { base: o.pays, quote: o.receives }, arg: "price" }]));

          case 24:
            return _context5.abrupt('return', _context5.sent);

          case 26:
            o = op.payload;
            isAsk = _market_utils2.default.isAskOp(o);
            _context5.next = 30;
            return _regenerator2.default.awrap(Operations.getTranslateInfo(isAsk ? "operation_limit_order_sell" : "operation_limit_order_buy", [{ type: "account", value: o.seller, arg: "account" }, {
              type: "amount",
              value: isAsk ? o.amount_to_sell : o.min_to_receive,
              arg: "amount"
            }, {
              type: "price",
              value: {
                base: isAsk ? o.min_to_receive : o.amount_to_sell,
                quote: isAsk ? o.amount_to_sell : o.min_to_receive
              },
              arg: "price"
            }]));

          case 30:
            return _context5.abrupt('return', _context5.sent);

          case 32:
            _context5.next = 34;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_limit_order_cancel", [{ type: "account", value: op.payload.fee_paying_account, arg: "account" }, { type: 'order', value: op.payload.order.substring(4), arg: 'order' }]));

          case 34:
            return _context5.abrupt('return', _context5.sent);

          case 36:
            _context5.next = 38;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_vesting_balance_withdraw", [{ type: "account", value: op.payload.owner, arg: "account" }, { type: "amount", value: op.payload.amount, arg: "amount" }]));

          case 38:
            return _context5.abrupt('return', _context5.sent);

          case 40:
            _context5.next = 42;
            return _regenerator2.default.awrap(_store.dispatch("contract/getContract", { nameOrId: op.payload.contract_id, isCache: true }, { root: true }));

          case 42:
            contract = _context5.sent.data;
            action = contract.abi_actions.find(function (item) {
              return item.name == op.payload.function_name;
            });
            value_list_jsons = {}; //use parameters as keyname and merge values into a Json string

            v = "";


            if (action) {
              action.arglist.forEach(function (arg, index) {
                v = op.payload.value_list[index][1].v;
                if (v instanceof Array) {
                  v = _helper2.default.formatTable(v);
                }
                value_list_jsons[arg] = v;
              });
            } else {
              value_list_jsons = op.payload.value_list.map(function (item) {
                return item[1].v;
              });
            }

            value_list_jsons = (0, _stringify2.default)(value_list_jsons);

            _context5.next = 50;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_call_contract_function", [{ type: "account", value: op.payload.caller, arg: "caller" }, { type: "contract_name", value: contract.contract_name, arg: "contract_name" }, { type: "function_name", value: op.payload.function_name, arg: "function_name" }, { type: "value_list", value: value_list_jsons, arg: "arg_list" }]));

          case 50:
            return _context5.abrupt('return', _context5.sent);

          case 52:
            _context5.next = 54;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_contract_create", [{ type: "account", value: op.payload.owner, arg: "owner" }, { type: "contract_name", value: op.payload.name, arg: "contract_name"
              // ,
              // {type: "contract_data", value: op.payload.data, arg: "contract_data"}
            }]));

          case 54:
            return _context5.abrupt('return', _context5.sent);

          case 56:
            _context5.next = 58;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_revise_contract", [{ type: "account", value: op.payload.reviser, arg: "reviser" }, { type: "contract_id", value: op.payload.contract_id, arg: "contract_name" }]));

          case 58:
            return _context5.abrupt('return', _context5.sent);

          case 60:
            _context5.next = 62;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_register_nh_asset_creator", [{ type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account" }]));

          case 62:
            return _context5.abrupt('return', _context5.sent);

          case 64:
            _context5.next = 66;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_creat_world_view", [{ type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account" }, { type: "world_view", value: op.payload.world_view, arg: "world_view" }]));

          case 66:
            return _context5.abrupt('return', _context5.sent);

          case 68:
            types = [{ type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account" }, { type: "account", value: op.payload.owner, arg: "owner" }];

            if (op.result) {
              types.push({ type: "nh_asset", value: op.result.result, arg: "nh_asset" });
            }
            _context5.next = 72;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_creat_nh_asset", types));

          case 72:
            return _context5.abrupt('return', _context5.sent);

          case 74:
            _context5.next = 76;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_delete_nh_asset", [{ type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account" }, { type: "nh_asset", value: op.payload.nh_asset, arg: "nh_asset" }]));

          case 76:
            return _context5.abrupt('return', _context5.sent);

          case 78:
            _context5.next = 80;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_transfer_nh_asset", [{ type: "account", value: op.payload.from, arg: "from" }, { type: "account", value: op.payload.to, arg: "to" }, { type: "nh_asset", value: op.payload.nh_asset, arg: "nh_asset" }]));

          case 80:
            return _context5.abrupt('return', _context5.sent);

          case 82:
            _context5.next = 84;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_relate_nh_asset", [{ type: "account", value: op.payload.nh_asset_creator, arg: "nh_asset_creator" }, { type: "relate", value: op.payload.relate ? "将" : "取消", arg: "relate" }, { type: "nh_asset", value: op.payload.parent, arg: "nh_asset" }, { type: "nh_asset", value: op.payload.child, arg: "nh_asset" }]));

          case 84:
            return _context5.abrupt('return', _context5.sent);

          case 86:
            _context5.next = 88;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_creat_nh_asset_order", [{ type: "account", value: op.payload.seller, arg: "seller" }, { type: "nh_asset", value: op.payload.nh_asset, arg: "nh_asset" }, {
              type: "amount",
              value: op.payload.price,
              arg: "amount"
            }]));

          case 88:
            return _context5.abrupt('return', _context5.sent);

          case 90:
            _context5.next = 92;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_cancel_nh_asset_order", [{ type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account" }, { type: "order", value: op.payload.order, arg: "order" }]));

          case 92:
            return _context5.abrupt('return', _context5.sent);

          case 94:
            _context5.next = 96;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_fill_nh_asset_order", [{ type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account" }, { type: "price_amount", value: op.payload.price_amount, arg: "price_amount" }, { type: "price_asset_symbol", value: op.payload.price_asset_symbol, arg: "price_asset_symbol" }, { type: "account", value: op.payload.seller, arg: "seller" }, { type: "nh_asset", value: op.payload.nh_asset, arg: "nh_asset" }]));

          case 96:
            return _context5.abrupt('return', _context5.sent);

          case 98:
            _context5.next = 100;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_relate_world_view", [{ type: "account", value: op.payload.related_account, arg: "related_account" }, { type: "account", value: op.payload.view_owner, arg: "view_owner" }, { type: "world_view", value: op.payload.world_view, arg: "world_view" }]));

          case 100:
            return _context5.abrupt('return', _context5.sent);

          case 102:
            _context5.next = 104;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_proposal_create", [{ type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account" }, { type: "result", value: op.result.result, arg: "result" }]));

          case 104:
            proposal_create = _context5.sent;
            proposalOp = op.payload.proposed_ops[0].op;

            proposalOp = {
              payload: proposalOp[1],
              type: Operations._operationTypes[proposalOp[0]]
            };

            _context5.next = 109;
            return _regenerator2.default.awrap(Operations.getParseOperations(proposalOp));

          case 109:
            proposal_content = _context5.sent;
            return _context5.abrupt('return', {
              opText: proposal_create.opText.concat(proposal_content.opText),
              opObj: (0, _extends3.default)({}, proposal_create.opObj, proposal_content.opObj)
            });

          case 112:
            _context5.next = 114;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_proposal_update", [{ type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account" }, { type: "proposal", value: op.payload.proposal, arg: "proposal" }]));

          case 114:
            return _context5.abrupt('return', _context5.sent);

          case 116:
            _context5.next = 118;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("contract_affecteds_nh_transfer_from", [{ type: "account", value: op.payload.affected_account, arg: "affected_account" }, { type: "affected_item", value: op.payload.affected_item, arg: "affected_item" }]));

          case 118:
            return _context5.abrupt('return', _context5.sent);

          case 120:
            _context5.next = 122;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("contract_affecteds_nh_transfer_to", [{ type: "account", value: op.payload.affected_account, arg: "affected_account" }, { type: "affected_item", value: op.payload.affected_item, arg: "affected_item" }]));

          case 122:
            return _context5.abrupt('return', _context5.sent);

          case 124:
            _context5.next = 126;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("contract_affecteds_nh_modifined", [{ type: "account", value: op.payload.affected_account, arg: "affected_account" }, { type: "affected_item", value: op.payload.affected_item, arg: "affected_item" }, { type: "modified", value: op.payload.modified, arg: "modified" }]));

          case 126:
            return _context5.abrupt('return', _context5.sent);

          case 128:
            _context5.next = 130;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("contract_affecteds_asset", [{ type: "account", value: op.payload.affected_account, arg: "affected_account" }, {
              type: "amount",
              value: op.payload.affected_asset,
              arg: "aseet_amount",
              decimalOffset: op.payload.affected_asset.asset_id === "1.3.0" ? 0 : null
            }]));

          case 130:
            return _context5.abrupt('return', _context5.sent);

          case 132:
            _context5.next = 134;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("contract_affecteds_log", [{ type: "account", value: op.payload.affected_account, arg: "affected_account" }, {
              type: "message",
              value: op.payload.message,
              arg: "message"
            }]));

          case 134:
            return _context5.abrupt('return', _context5.sent);

          case 136:
            _context5.next = 138;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_asset_create", [{ type: "account", value: op.payload.issuer, arg: "account" }, { type: "symbol", value: op.payload.symbol, arg: "asset" }]));

          case 138:
            return _context5.abrupt('return', _context5.sent);

          case 140:
            _context5.next = 142;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_asset_update", [{ type: "account", value: op.payload.issuer, arg: "account" }, { type: "asset", value: op.payload.asset_to_update, arg: "asset" }]));

          case 142:
            return _context5.abrupt('return', _context5.sent);

          case 144:
            restricted_type_text = _locales[_store.rootGetters["setting/defaultSettings"].locale]["restricted_type_" + op.payload.restricted_type];
            _context5.next = 147;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_asset_update_restricted", [{ type: "account", value: op.payload.payer, arg: "payer" }, { type: "asset", value: op.payload.target_asset, arg: "target_asset" }, { type: "restricted_type", value: restricted_type_text, arg: "restricted_type_text" }]));

          case 147:
            return _context5.abrupt('return', _context5.sent);

          case 149:
            _context5.next = 151;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_asset_issue", [{ type: "account", value: op.payload.issuer, arg: "account" }, {
              type: "amount",
              value: op.payload.asset_to_issue,
              arg: "amount",
              decimalOffset: op.payload.asset_to_issue.asset_id === "1.3.0" ? 0 : null
            }, { type: "account", value: op.payload.issue_to_account, arg: "to" }]));

          case 151:
            return _context5.abrupt('return', _context5.sent);

          case 153:
            _context5.next = 155;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_asset_reserve", [{ type: "account", value: op.payload.payer, arg: "account" }, {
              type: "amount",
              value: op.payload.amount_to_reserve,
              arg: "amount"
            }]));

          case 155:
            return _context5.abrupt('return', _context5.sent);

          case 157:
            _context5.next = 159;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_asset_fund_fee_pool", [{ type: "account", value: op.payload.from_account, arg: "account" }, {
              type: "amount",
              value: { amount: op.payload.amount, asset_id: "1.3.0" },
              arg: "amount"
            }, { type: "asset", value: op.payload.asset_id, arg: "asset" }]));

          case 159:
            return _context5.abrupt('return', _context5.sent);

          case 161:
            _context5.next = 163;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_asset_publish_feed", [{ type: "account", value: op.payload.publisher, arg: "account" }, { type: "price", value: op.payload.feed.settlement_price, arg: "price" }]));

          case 163:
            return _context5.abrupt('return', _context5.sent);

          case 165:
            _context5.next = 167;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_asset_claim_fees", [{ type: "account", value: op.payload.issuer, arg: "account" }, {
              type: "amount",
              value: op.payload.amount_to_claim,
              arg: "balance_amount"
            }, { type: "asset", value: op.payload.amount_to_claim.asset_id, arg: "asset" }]));

          case 167:
            return _context5.abrupt('return', _context5.sent);

          case 169:
            start_time = op.payload.start_time;

            start_time = new Date(start_time + "Z").format("yyyy/MM/dd HH:mm:ss");
            if (op.type == "void_result") {
              op.result = {
                result: "void_result"
              };
            }
            if (!op.result) {
              op.result = {
                result: "***"
              };
            }
            _context5.next = 175;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_crontab_create", [{ type: "account", value: op.payload.crontab_creator, arg: "crontab_creator" }, { type: "start_time", value: start_time, arg: "start_time" }, { type: "execute_interval", value: op.payload.execute_interval, arg: "execute_interval" }, { type: "execute_times", value: op.payload.scheduled_execute_times, arg: "execute_times" }, { type: "result", value: op.result.result, arg: "result" }]));

          case 175:
            crontab_create = _context5.sent;
            crontabOp = op.payload.crontab_ops[0].op;

            crontabOp = {
              payload: crontabOp[1],
              type: Operations._operationTypes[crontabOp[0]]
            };

            _context5.next = 180;
            return _regenerator2.default.awrap(Operations.getParseOperations(crontabOp));

          case 180:
            crontab_content = _context5.sent;
            return _context5.abrupt('return', {
              opText: crontab_create.opText.concat(crontab_content.opText),
              opObj: (0, _extends3.default)({}, crontab_create.opObj, crontab_content.opObj)
            });

          case 183:
            _context5.next = 185;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_crontab_cancel", [{ type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account" }, { type: "task", value: op.payload.task, arg: "task" }]));

          case 185:
            return _context5.abrupt('return', _context5.sent);

          case 187:
            restart_time = op.payload.restart_time;

            restart_time = new Date(restart_time + "Z").format("yyyy/MM/dd HH:mm:ss");
            _context5.next = 191;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_crontab_recover", [{ type: "account", value: op.payload.crontab_owner, arg: "crontab_owner" }, { type: "crontab", value: op.payload.crontab, arg: "crontab" }, { type: "restart_time", value: restart_time, arg: "restart_time" }]));

          case 191:
            return _context5.abrupt('return', _context5.sent);

          case 193:
          case 'end':
            return _context5.stop();
        }
      }
    }, null, undefined);
  },
  getTranslateInfo: function getTranslateInfo(localId, keys) {
    var lang, text, splitText, key, opObj, i, value;
    return _regenerator2.default.async(function getTranslateInfo$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            lang = _store.rootGetters["setting/defaultSettings"].locale;
            text = _locales[lang][localId];

            if (localId == "operation_creat_nh_asset" && keys.length == 2) {
              text = lang == 'en' ? '(fee_paying_account) Create NH assets with ownership account (owner)' : "(fee_paying_account) 创建NH资产，所有权账户为 (owner)";
            }
            splitText = _utils2.default.get_translation_parts(text);
            key = void 0;
            opObj = {};
            i = 0;

          case 7:
            if (!(i < keys.length)) {
              _context7.next = 19;
              break;
            }

            key = keys[i];

            if (!splitText.indexOf(key.arg)) {
              _context7.next = 16;
              break;
            }

            value = key.value;
            _context7.next = 13;
            return _regenerator2.default.awrap(function _callee() {
              var acc_res, asset, amount, response, item_data;
              return _regenerator2.default.async(function _callee$(_context6) {
                while (1) {
                  switch (_context6.prev = _context6.next) {
                    case 0:
                      _context6.t0 = key.type;
                      _context6.next = _context6.t0 === "account" ? 3 : _context6.t0 === "asset" ? 8 : _context6.t0 === "amount" ? 14 : _context6.t0 === "price" ? 19 : _context6.t0 === "contract_id" ? 23 : _context6.t0 === "modified" ? 28 : 33;
                      break;

                    case 3:
                      _context6.next = 5;
                      return _regenerator2.default.awrap(_api2.default.Account.getAccount(key.value, true));

                    case 5:
                      acc_res = _context6.sent;

                      if (acc_res.success) {
                        value = acc_res.data.account.name;
                      } else {
                        value = key.value;
                      }
                      return _context6.abrupt('break', 35);

                    case 8:
                      _context6.next = 10;
                      return _regenerator2.default.awrap(_api2.default.Assets.fetch([key.value], true));

                    case 10:
                      asset = _context6.sent;

                      if (!asset) {
                        console.log("链上不存在资产" + asset_id);
                      }
                      value = asset ? asset.symbol : "";
                      return _context6.abrupt('break', 35);

                    case 14:
                      _context6.next = 16;
                      return _regenerator2.default.awrap(Operations.FormattedAsset(key.value.amount, key.value.asset_id, key.decimalOffset));

                    case 16:
                      value = _context6.sent;

                      if (localId == "contract_affecteds_asset") {
                        amount = Number(value.split(" ")[0]);

                        if (amount > 0) {
                          value = "+" + value;
                        }
                      }
                      return _context6.abrupt('break', 35);

                    case 19:
                      _context6.next = 21;
                      return _regenerator2.default.awrap(Operations.FormattedPrice({
                        base_asset: key.value.base.asset_id,
                        base_amount: key.value.base.amount,
                        quote_asset: key.value.quote.asset_id,
                        quote_amount: key.value.quote.amount
                      }));

                    case 21:
                      value = _context6.sent;
                      return _context6.abrupt('break', 35);

                    case 23:
                      _context6.next = 25;
                      return _regenerator2.default.awrap(_api2.default.Contract.getContract(key.value, true));

                    case 25:
                      response = _context6.sent;

                      if (response.code == 1) {
                        value = response.data.name;
                      } else {
                        value = key.value;
                      }
                      return _context6.abrupt('break', 35);

                    case 28:
                      item_data = {};

                      value = [value];
                      value.forEach(function (keyValue) {
                        item_data[keyValue[0]] = keyValue[1];
                      });
                      value = (0, _stringify2.default)(item_data);
                      return _context6.abrupt('break', 35);

                    case 33:
                      value = key.value;
                      return _context6.abrupt('break', 35);

                    case 35:
                    case 'end':
                      return _context6.stop();
                  }
                }
              }, null, undefined);
            }());

          case 13:

            splitText[splitText.indexOf(key.arg)] = value;
            opObj[key.arg] = value;
            if (key.type == "value_list") {
              opObj[key.arg] = JSON.parse(value);
            }

          case 16:
            i++;
            _context7.next = 7;
            break;

          case 19:
            return _context7.abrupt('return', {
              opText: splitText,
              opObj: opObj
              //return splitText;
            });

          case 20:
          case 'end':
            return _context7.stop();
        }
      }
    }, null, undefined);
  },
  FormattedPrice: function FormattedPrice(_ref2) {
    var base_asset = _ref2.base_asset,
        base_amount = _ref2.base_amount,
        quote_asset = _ref2.quote_asset,
        quote_amount = _ref2.quote_amount;
    var assets, base_precision, quote_precision, value;
    return _regenerator2.default.async(function FormattedPrice$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            // let marketId=quote_asset+"_"+base_asset;
            assets = _store.rootGetters["assets/getAssets"];

            if (!(assets && assets[base_asset] && assets[quote_asset])) {
              _context8.next = 6;
              break;
            }

            base_asset = assets[base_asset];
            quote_asset = assets[quote_asset];
            _context8.next = 22;
            break;

          case 6:
            if (!_api2.default.Assets.fetch_asset_by_cache(base_asset)) {
              _context8.next = 10;
              break;
            }

            base_asset = _api2.default.Assets.fetch_asset_by_cache(base_asset);
            _context8.next = 14;
            break;

          case 10:
            _context8.next = 12;
            return _regenerator2.default.awrap(_api2.default.Assets.fetch([base_asset], true));

          case 12:
            base_asset = _context8.sent;

            if (!base_asset) {
              base_asset = { precision: 8, symbol: "1.3.0" };
            }

          case 14:
            if (!_api2.default.Assets.fetch_asset_by_cache(quote_asset)) {
              _context8.next = 18;
              break;
            }

            quote_asset = _api2.default.Assets.fetch_asset_by_cache(quote_asset);
            _context8.next = 22;
            break;

          case 18:
            _context8.next = 20;
            return _regenerator2.default.awrap(_api2.default.Assets.fetch([quote_asset], true));

          case 20:
            quote_asset = _context8.sent;

            if (!quote_asset) {
              quote_asset = { precision: 8, symbol: "1.3.0" };
            }

          case 22:
            base_precision = _utils2.default.get_asset_precision(base_asset.precision);
            quote_precision = _utils2.default.get_asset_precision(quote_asset.precision);
            value = base_amount / base_precision / (quote_amount / quote_precision);

            value = Number(value.toFixed(base_asset.precision));
            return _context8.abrupt('return', value + " " + base_asset.symbol + "/" + quote_asset.symbol);

          case 27:
          case 'end':
            return _context8.stop();
        }
      }
    }, null, undefined);
  },
  FormattedAsset: function FormattedAsset(amount, asset_id, decimalOffset) {
    var asset;
    return _regenerator2.default.async(function FormattedAsset$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.next = 2;
            return _regenerator2.default.awrap(_api2.default.Assets.fetch([asset_id], true));

          case 2:
            asset = _context9.sent;

            if (!asset) {
              asset = { precision: 8, symbol: "1.3.0" };
            }
            return _context9.abrupt('return', _helper2.default.getFullNum(amount / Math.pow(10, asset.precision)) + " " + asset.symbol);

          case 5:
          case 'end':
            return _context9.stop();
        }
      }
    }, null, undefined);
  },
  // retrieves array of assets ids that were used in operations
  _getOperationsAssetsIds: function _getOperationsAssetsIds(parsedOperations) {
    function addNewId(array, id) {
      if (array.indexOf(id) === -1) array.push(id);
    }

    return parsedOperations.reduce(function (result, operation) {
      switch (operation.type) {
        case 'transfer':
          addNewId(result, operation.payload.amount.asset_id);
          break;
        case 'fill_order':
          addNewId(result, operation.payload.pays.asset_id);
          addNewId(result, operation.payload.receives.asset_id);
          break;
        case 'limit_order_create':
          addNewId(result, operation.payload.amount_to_sell.asset_id);
          addNewId(result, operation.payload.min_to_receive.asset_id);
          break;
        default:
      }
      return result;
    }, []);
  },

  // fetches user's operations
  getUserOperations: function getUserOperations(_ref3) {
    var userId = _ref3.userId,
        _ref3$startId = _ref3.startId,
        startId = _ref3$startId === undefined ? "1.11.0" : _ref3$startId,
        _ref3$endId = _ref3.endId,
        endId = _ref3$endId === undefined ? "1.11.0" : _ref3$endId,
        limit = _ref3.limit,
        store = _ref3.store;
    var response, parsedOperations;
    return _regenerator2.default.async(function getUserOperations$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.prev = 0;
            _context10.next = 3;
            return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().history_api().exec('get_account_history', [userId, startId, limit, endId]));

          case 3:
            response = _context10.sent;

            if (!(response && (typeof response === 'undefined' ? 'undefined' : (0, _typeof3.default)(response)) === 'object')) {
              _context10.next = 9;
              break;
            }

            _context10.next = 7;
            return _regenerator2.default.awrap(Operations.parseOperations({ operations: response, userId: userId, store: store }));

          case 7:
            parsedOperations = _context10.sent;
            return _context10.abrupt('return', {
              code: 1,
              data: parsedOperations
            });

          case 9:
            return _context10.abrupt('return', {
              code: 120,
              message: 'Error fetching account record',
              error: 'Error fetching account record'
            });

          case 12:
            _context10.prev = 12;
            _context10.t0 = _context10['catch'](0);
            return _context10.abrupt('return', {
              code: 0,
              message: _context10.t0.message,
              error: _context10.t0
            });

          case 15:
          case 'end':
            return _context10.stop();
        }
      }
    }, null, undefined, [[0, 12]]);
  },
  get_block_header: function get_block_header(block_num) {
    var response, res;
    return _regenerator2.default.async(function get_block_header$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            _context11.prev = 0;

            if (!(block_num in _cacheBlocks)) {
              _context11.next = 5;
              break;
            }

            if (!_cacheBlocks[block_num]) {
              _context11.next = 4;
              break;
            }

            return _context11.abrupt('return', _cacheBlocks[block_num]);

          case 4:
            return _context11.abrupt('return', { code: 0 });

          case 5:
            _cacheBlocks[block_num] = "";
            _context11.next = 8;
            return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec("get_block_header", [block_num]));

          case 8:
            response = _context11.sent;

            if (!(response && (typeof response === 'undefined' ? 'undefined' : (0, _typeof3.default)(response)) === 'object')) {
              _context11.next = 13;
              break;
            }

            res = {
              code: 1,
              data: response
            };

            _cacheBlocks[block_num] = res;
            return _context11.abrupt('return', res);

          case 13:
            return _context11.abrupt('return', {
              code: 121,
              message: 'block and transaction information cannot be found'
            });

          case 16:
            _context11.prev = 16;
            _context11.t0 = _context11['catch'](0);
            return _context11.abrupt('return', {
              code: 0,
              message: _context11.t0.message,
              error: _context11.t0
            });

          case 19:
          case 'end':
            return _context11.stop();
        }
      }
    }, null, undefined, [[0, 16]]);
  },
  getBlock: function getBlock(block_num) {
    var response;
    return _regenerator2.default.async(function getBlock$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            _context12.prev = 0;
            _context12.next = 3;
            return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec("get_block", [block_num]));

          case 3:
            response = _context12.sent;

            if (!(response && (typeof response === 'undefined' ? 'undefined' : (0, _typeof3.default)(response)) === 'object')) {
              _context12.next = 6;
              break;
            }

            return _context12.abrupt('return', {
              code: 1,
              data: response
            });

          case 6:
            return _context12.abrupt('return', {
              code: 121,
              message: 'block and transaction information cannot be found'
            });

          case 9:
            _context12.prev = 9;
            _context12.t0 = _context12['catch'](0);
            return _context12.abrupt('return', {
              code: 0,
              message: _context12.t0.message,
              error: _context12.t0
            });

          case 12:
          case 'end':
            return _context12.stop();
        }
      }
    }, null, undefined, [[0, 9]]);
  }
};

Operations.prepareOperationTypes();

exports.default = Operations;