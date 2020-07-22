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
    var date = new Date(headBlockTime - secondsBelow * 1000).bcxformat("yyyy/MM/dd HH:mm:ss");
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

  // Parses operation for improved format
  _parseOperation: function _parseOperation(operation, ApiObject, ApiObjectDyn) {
    var isReqDate = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

    var _operation$op, type, payload, operationType, date, block_res, isBid, otherUserName, res, op_id, _operations, additional_cost, amount, _asset_id;

    return _regenerator2.default.async(function _parseOperation$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _operation$op = (0, _slicedToArray3.default)(operation.op, 2), type = _operation$op[0], payload = _operation$op[1];
            operationType = Operations._operationTypes[type];
            date = "";

            if (!operation.date) {
              _context2.next = 7;
              break;
            }

            date = operation.date;
            _context2.next = 13;
            break;

          case 7:
            if (!isReqDate) {
              _context2.next = 13;
              break;
            }

            if (ApiObjectDyn.code == 1) date = Operations._getOperationDate(operation, ApiObject, ApiObjectDyn);
            _context2.next = 11;
            return _regenerator2.default.awrap(_api2.default.Operations.get_block_header(operation.block_num));

          case 11:
            block_res = _context2.sent;

            if (block_res.code == 1) {
              date = new Date(block_res.data.timestamp + "Z").bcxformat("yyyy/MM/dd HH:mm:ss");
            }

          case 13:
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
            // if (operationType === 'fill_order' || operationType === 'limit_order_create') {
            //   isBid = await Operations._checkIfBidOperation(operation);
            //   res.buyer=isBid;
            // }

            if (!operation.result) {
              _context2.next = 34;
              break;
            }

            res.result = operation.result[1];
            res.result.type = _store.rootGetters["setting/trx_results"][operation.result[0]];
            if (operationType == "create_nh_asset") {
              res.payload.item_id = operation.result[1].result;
            }
            if (operationType == "create_world_view") {
              res.payload.version_id = operation.result[1];
            }

            if (!(operationType == "call_contract_function")) {
              _context2.next = 34;
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
            _context2.next = 27;
            return _regenerator2.default.awrap(Operations.parseOperations({
              operations: _operations,
              store: _store,
              isContract: true,
              isReqDate: false
            }));

          case 27:
            res.result.contract_affecteds = _context2.sent;
            additional_cost = res.result.additional_cost;

            if (!additional_cost) {
              _context2.next = 34;
              break;
            }

            amount = additional_cost.amount, _asset_id = additional_cost.asset_id;
            _context2.next = 33;
            return _regenerator2.default.awrap(Operations.FormattedAsset(amount, _asset_id, 0));

          case 33:
            res.result.additional_cost_text = _context2.sent;

          case 34:
            return _context2.abrupt('return', res);

          case 35:
          case 'end':
            return _context2.stop();
        }
      }
    }, null, undefined);
  },

  // Parses array of operations, return array of parsed operations and array of assets ids
  // that were user in it. United Labs of BCTech.
  parseOperations: function parseOperations(_ref) {
    var operations = _ref.operations,
        store = _ref.store,
        _ref$isContract = _ref.isContract,
        isContract = _ref$isContract === undefined ? false : _ref$isContract,
        _ref$isReqDate = _ref.isReqDate,
        isReqDate = _ref$isReqDate === undefined ? true : _ref$isReqDate;

    var ApiInstance, ApiObject, ApiObjectDyn, operationTypes, filteredOperations, parsedOperations, j, item, i, parseOpObj, fees, _i, feeObj, feeAsset, trxType;

    return _regenerator2.default.async(function parseOperations$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            // console.info("operations",operations);
            _store = store;
            ApiInstance = _bcxjsWs.Apis.instance();

            if (!isReqDate) {
              _context3.next = 9;
              break;
            }

            _context3.next = 5;
            return _regenerator2.default.awrap(_api2.default.Explorer.getGlobalObject(true));

          case 5:
            _context3.t1 = _context3.sent.data;
            _context3.t0 = [_context3.t1];
            _context3.next = 10;
            break;

          case 9:
            _context3.t0 = null;

          case 10:
            ApiObject = _context3.t0;

            if (!isReqDate) {
              _context3.next = 18;
              break;
            }

            _context3.next = 14;
            return _regenerator2.default.awrap(_api2.default.Explorer.getDynGlobalObject(false));

          case 14:
            _context3.t3 = _context3.sent.data;
            _context3.t2 = [_context3.t3];
            _context3.next = 19;
            break;

          case 18:
            _context3.t2 = null;

          case 19:
            ApiObjectDyn = _context3.t2;
            operationTypes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 26, 27, 30, 31, 34, 35, 37, 38, 39, 40, 41, 42, 43, 44, 45, 50, 54, 300, 301, 303, 3010, 3011, 3012]; //,53,54.55,56,57,58

            filteredOperations = operations.filter(function (op) {
              return operationTypes.includes(op.op[0]);
            });
            parsedOperations = [];
            j = 0;

          case 24:
            if (!(j < filteredOperations.length)) {
              _context3.next = 33;
              break;
            }

            _context3.t4 = parsedOperations;
            _context3.next = 28;
            return _regenerator2.default.awrap(Operations._parseOperation(filteredOperations[j], ApiObject, ApiObjectDyn, isReqDate));

          case 28:
            _context3.t5 = _context3.sent;

            _context3.t4.push.call(_context3.t4, _context3.t5);

          case 30:
            j++;
            _context3.next = 24;
            break;

          case 33:
            // const assetsIds = Operations._getOperationsAssetsIds(parsedOperations);

            item = void 0;
            i = 0;

          case 35:
            if (!(i < parsedOperations.length)) {
              _context3.next = 62;
              break;
            }

            item = parsedOperations[i];

            if (isContract) {
              delete item.id;
              delete item.date;
            }
            _context3.next = 40;
            return _regenerator2.default.awrap(Operations.getParseOperations(item));

          case 40:
            parseOpObj = _context3.sent;

            item.parseOperationsText = parseOpObj.opText.join("");
            item.parseOperations = parseOpObj.opObj;
            item.parseOperations.fees = [];

            if (!item.result) {
              _context3.next = 57;
              break;
            }

            fees = item.result.fees;

            if (!fees) {
              _context3.next = 57;
              break;
            }

            _i = 0;

          case 48:
            if (!(_i < fees.length)) {
              _context3.next = 57;
              break;
            }

            feeObj = fees[_i];
            _context3.next = 52;
            return _regenerator2.default.awrap(_api2.default.Assets.fetch([feeObj.asset_id], true));

          case 52:
            feeAsset = _context3.sent;

            if (feeAsset) item.parseOperations.fees.push(_helper2.default.getFullNum(feeObj.amount / Math.pow(10, feeAsset.precision)) + " " + feeAsset.symbol);

          case 54:
            _i++;
            _context3.next = 48;
            break;

          case 57:

            // let feeObj=item.payload.fee;
            // if(feeObj){
            //   let feeAsset=await API.Assets.fetch([feeObj.asset_id],true);
            //   if(feeAsset)
            //   item.parseOperations.fee=helper.getFullNum(feeObj.amount/Math.pow(10,feeAsset.precision))+" "+feeAsset.symbol;
            // }

            trxType = "trxTypes_" + item.type;

            if (trxType in _zh2.default) {
              item.typeName = _locales[_store.rootGetters["setting/defaultSettings"].locale][trxType];
            }

          case 59:
            i++;
            _context3.next = 35;
            break;

          case 62:
            if (!isContract) {
              _context3.next = 66;
              break;
            }

            delete parsedOperations.id;
            delete parsedOperations.date;
            return _context3.abrupt('return', parsedOperations.map(function (item) {
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

          case 66:
            return _context3.abrupt('return', {
              operations: parsedOperations.map(function (item) {
                item.parse_operations = item.parseOperations;
                // item.parse_operations.fees=JSON.parse(item.parse_operations.fees);
                item.parse_operations_text = item.parseOperationsText;
                item.raw_data = item.payload;
                item.type_name = item.typeName;

                delete item.parseOperations;
                delete item.parseOperationsText;
                delete item.payload;
                delete item.typeName;
                return item;
              })
              // ,
              // assetsIds
            });

          case 67:
          case 'end':
            return _context3.stop();
        }
      }
    }, null, undefined);
  },

  getParseOperations: function getParseOperations(op) {
    var o, base2, quote2, _market_utils$getMark, first2, second2, isBid2, priceBase, priceQuote, amount, receivedAmount, base, quote, _market_utils$getMark2, first, second, isBid, contract, action, value_list_jsons, v, types, proposal_create, proposalOp, proposal_content, restricted_type_text, start_time, crontab_create, crontabOp, crontab_content, restart_time;

    return _regenerator2.default.async(function getParseOperations$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            o = void 0;
            _context4.t0 = op.type;
            _context4.next = _context4.t0 === "transfer" ? 4 : _context4.t0 === "account_create" ? 8 : _context4.t0 === "account_update" ? 12 : _context4.t0 === "account_upgrade" ? 16 : _context4.t0 === "witness_create" ? 20 : _context4.t0 === "committee_member_create" ? 24 : _context4.t0 === "witness_update" ? 28 : _context4.t0 === "committee_member_update" ? 32 : _context4.t0 === "fill_order" ? 36 : _context4.t0 === "limit_order_create" ? 49 : _context4.t0 === "limit_order_cancel" ? 58 : _context4.t0 === "call_order_update" ? 62 : _context4.t0 === "vesting_balance_withdraw" ? 66 : _context4.t0 === "call_contract_function" ? 70 : _context4.t0 === "contract_create" ? 82 : _context4.t0 === "revise_contract" ? 86 : _context4.t0 === "register_nh_asset_creator" ? 90 : _context4.t0 === "create_world_view" ? 94 : _context4.t0 === "create_nh_asset" ? 98 : _context4.t0 === "delete_nh_asset" ? 104 : _context4.t0 === "transfer_nh_asset" ? 108 : _context4.t0 === "relate_nh_asset" ? 112 : _context4.t0 === "create_nh_asset_order" ? 116 : _context4.t0 === "cancel_nh_asset_order" ? 120 : _context4.t0 === "fill_nh_asset_order" ? 124 : _context4.t0 === "relate_world_view" ? 128 : _context4.t0 === "proposal_create" ? 132 : _context4.t0 === "committee_member_update_global_parameters" ? 142 : _context4.t0 === "proposal_update" ? 146 : _context4.t0 === "contract_affecteds_nh_transfer_from" ? 150 : _context4.t0 === "contract_affecteds_nh_transfer_to" ? 154 : _context4.t0 === "contract_affecteds_nh_modifined" ? 158 : _context4.t0 === "contract_affecteds_asset" ? 162 : _context4.t0 === "contract_affecteds_log" ? 166 : _context4.t0 === "asset_create" ? 170 : _context4.t0 === "asset_update_bitasset" ? 174 : _context4.t0 === "asset_update" ? 174 : _context4.t0 === "asset_update_restricted" ? 178 : _context4.t0 === "asset_issue" ? 183 : _context4.t0 === "asset_reserve" ? 187 : _context4.t0 === "asset_fund_fee_pool" ? 191 : _context4.t0 === "asset_publish_feed" ? 195 : _context4.t0 === "asset_global_settle" ? 199 : _context4.t0 === "asset_settle" ? 203 : _context4.t0 === "asset_settle_cancel" ? 207 : _context4.t0 === "vesting_balance_create" ? 211 : _context4.t0 === "asset_update_feed_producers" ? 215 : _context4.t0 === "asset_claim_fees" ? 219 : _context4.t0 === "crontab_create" ? 223 : _context4.t0 === "crontab_cancel" ? 237 : _context4.t0 === "crontab_recover" ? 241 : _context4.t0 === "update_collateral_for_gas" ? 247 : 251;
            break;

          case 4:
            _context4.next = 6;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_transfer", [{ type: "account", value: op.payload.from, arg: "from" }, {
              type: "amount",
              value: op.payload.amount,
              arg: "amount",
              decimalOffset: op.payload.amount.asset_id === "1.3.0" ? 0 : null
            }, { type: "account", value: op.payload.to, arg: "to" }]));

          case 6:
            return _context4.abrupt('return', _context4.sent);

          case 8:
            _context4.next = 10;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_reg_account", [{ type: "account", value: op.payload.registrar, arg: "registrar" }, { type: "account", value: op.payload.name, arg: "new_account" }]));

          case 10:
            return _context4.abrupt('return', _context4.sent);

          case 12:
            _context4.next = 14;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_update_account", [{ type: "account", value: op.payload.account, arg: "account" }]));

          case 14:
            return _context4.abrupt('return', _context4.sent);

          case 16:
            _context4.next = 18;
            return _regenerator2.default.awrap(Operations.getTranslateInfo(op.payload.upgrade_to_lifetime_member ? "operation_lifetime_upgrade_account" : "operation_annual_upgrade_account", [{ type: "account", value: op.payload.account_to_upgrade, arg: "account" }]));

          case 18:
            return _context4.abrupt('return', _context4.sent);

          case 20:
            _context4.next = 22;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_witness_create", [{ type: "account", value: op.payload.witness_account, arg: "account" }]));

          case 22:
            return _context4.abrupt('return', _context4.sent);

          case 24:
            _context4.next = 26;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_committee_member_create", [{ type: "account", value: op.payload.committee_member_account, arg: "account" }]));

          case 26:
            return _context4.abrupt('return', _context4.sent);

          case 28:
            _context4.next = 30;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_witness_update", [{ type: "account", value: op.payload.witness_account, arg: "account" }]));

          case 30:
            return _context4.abrupt('return', _context4.sent);

          case 32:
            _context4.next = 34;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_committee_member_update", [{ type: "account", value: op.payload.committee_member_account, arg: "account" }]));

          case 34:
            return _context4.abrupt('return', _context4.sent);

          case 36:
            o = op.payload;
            // let receivedAmount = o.fee.asset_id === o.receives.asset_id ? o.receives.amount - o.fee.amount : o.receives.amount;
            base2 = o.receives.asset_id;
            quote2 = o.pays.asset_id;
            _market_utils$getMark = _market_utils2.default.getMarketName(base2, quote2), first2 = _market_utils$getMark.first2, second2 = _market_utils$getMark.second2;
            isBid2 = o.pays.asset_id === second2;
            priceBase = isBid2 ? o.receives : o.pays;
            priceQuote = isBid2 ? o.pays : o.receives;
            amount = isBid2 ? o.pays : o.receives;
            receivedAmount = amount.amount;
            // o.fee.asset_id === amount.asset_id
            //     ? amount.amount - o.fee.amount
            //     : amount.amount;

            _context4.next = 47;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_fill_order", [{ type: "account", value: o.account_id, arg: "account" }, {
              type: "amount",
              value: { amount: receivedAmount, asset_id: amount.asset_id },
              arg: "received",
              decimalOffset: o.receives.asset_id === "1.3.0" ? 3 : null
            }, { type: "price", value: { base: priceBase, quote: priceQuote }, arg: "price" }]));

          case 47:
            return _context4.abrupt('return', _context4.sent);

          case 49:
            o = op.payload;
            // let isAsk = market_utils.isAskOp(o);
            base = o.min_to_receive.asset_id;
            quote = o.amount_to_sell.asset_id;
            _market_utils$getMark2 = _market_utils2.default.getMarketName(base, quote), first = _market_utils$getMark2.first, second = _market_utils$getMark2.second;
            isBid = o.amount_to_sell.asset_id === second;
            _context4.next = 56;
            return _regenerator2.default.awrap(Operations.getTranslateInfo(isBid ? "operation_limit_order_buy" : "operation_limit_order_sell", [{ type: "account", value: o.seller, arg: "account" }, {
              type: "amount",
              value: isBid ? o.min_to_receive : o.amount_to_sell,
              arg: "amount"
            }, {
              type: "price",
              value: {
                base: isBid ? o.amount_to_sell : o.min_to_receive,
                quote: isBid ? o.min_to_receive : o.amount_to_sell
              },
              arg: "price"
            }]));

          case 56:
            return _context4.abrupt('return', _context4.sent);

          case 58:
            _context4.next = 60;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_limit_order_cancel", [{ type: "account", value: op.payload.fee_paying_account, arg: "account" }, { type: 'order', value: op.payload.order.substring(4), arg: 'order' }]));

          case 60:
            return _context4.abrupt('return', _context4.sent);

          case 62:
            _context4.next = 64;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_call_order_update", [{ type: "account", value: op.payload.funding_account, arg: "account" }, { type: "asset", value: op.payload.delta_debt.asset_id, arg: "debtSymbol" }, { type: "amount", value: op.payload.delta_debt, arg: "debt" }, { type: "amount", value: op.payload.delta_collateral, arg: "collateral" }]));

          case 64:
            return _context4.abrupt('return', _context4.sent);

          case 66:
            _context4.next = 68;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_vesting_balance_withdraw", [{ type: "account", value: op.payload.owner, arg: "account" }, { type: "amount", value: op.payload.amount, arg: "amount" }, { type: "vesting_balance", value: op.payload.vesting_balance, arg: "vesting_balance_id" }]));

          case 68:
            return _context4.abrupt('return', _context4.sent);

          case 70:
            _context4.next = 72;
            return _regenerator2.default.awrap(_store.dispatch("contract/getContract", { nameOrId: op.payload.contract_id, isCache: true }, { root: true }));

          case 72:
            contract = _context4.sent.data;
            action = contract ? contract.abi_actions.find(function (item) {
              return item.name == op.payload.function_name;
            }) : null;
            value_list_jsons = {}; //use parameters as keyname and merge values into a Json string

            v = "";

            if (action) {
              action.arglist.forEach(function (arg, index) {
                var v_l_item = op.payload.value_list[index];
                if (v_l_item) {
                  v = v_l_item[1].v;
                  if (Array.isArray(v)) {
                    v = _helper2.default.formatTable(v);
                  }
                  value_list_jsons[arg] = v;
                }
              });
            } else {
              value_list_jsons = op.payload.value_list.map(function (item) {
                return item[1].v;
              });
            }

            value_list_jsons = (0, _stringify2.default)(value_list_jsons);

            _context4.next = 80;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_call_contract_function", [{ type: "account", value: op.payload.caller, arg: "caller" }, { type: "contract_name", value: contract.contract_name, arg: "contract_name" }, { type: "function_name", value: op.payload.function_name, arg: "function_name" }, { type: "value_list", value: value_list_jsons, arg: "arg_list" }]));

          case 80:
            return _context4.abrupt('return', _context4.sent);

          case 82:
            _context4.next = 84;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_contract_create", [{ type: "account", value: op.payload.owner, arg: "owner" }, { type: "contract_name", value: op.payload.name, arg: "contract_name"
              // ,
              // {type: "contract_data", value: op.payload.data, arg: "contract_data"}
            }]));

          case 84:
            return _context4.abrupt('return', _context4.sent);

          case 86:
            _context4.next = 88;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_revise_contract", [{ type: "account", value: op.payload.reviser, arg: "reviser" }, { type: "contract_id", value: op.payload.contract_id, arg: "contract_name" }]));

          case 88:
            return _context4.abrupt('return', _context4.sent);

          case 90:
            _context4.next = 92;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_register_nh_asset_creator", [{ type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account" }]));

          case 92:
            return _context4.abrupt('return', _context4.sent);

          case 94:
            _context4.next = 96;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_create_world_view", [{ type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account" }, { type: "world_view", value: op.payload.world_view, arg: "world_view" }]));

          case 96:
            return _context4.abrupt('return', _context4.sent);

          case 98:
            types = [{ type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account" }, { type: "account", value: op.payload.owner, arg: "owner" }];

            if (op.result) {
              types.push({ type: "nh_asset", value: op.result.result, arg: "nh_asset" });
            }
            _context4.next = 102;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_create_nh_asset", types));

          case 102:
            return _context4.abrupt('return', _context4.sent);

          case 104:
            _context4.next = 106;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_delete_nh_asset", [{ type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account" }, { type: "nh_asset", value: op.payload.nh_asset, arg: "nh_asset" }]));

          case 106:
            return _context4.abrupt('return', _context4.sent);

          case 108:
            _context4.next = 110;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_transfer_nh_asset", [{ type: "account", value: op.payload.from, arg: "from" }, { type: "account", value: op.payload.to, arg: "to" }, { type: "nh_asset", value: op.payload.nh_asset, arg: "nh_asset" }]));

          case 110:
            return _context4.abrupt('return', _context4.sent);

          case 112:
            _context4.next = 114;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_relate_nh_asset", [{ type: "account", value: op.payload.nh_asset_creator, arg: "nh_asset_creator" }, { type: "relate", value: op.payload.relate ? "将" : "取消", arg: "relate" }, { type: "nh_asset", value: op.payload.parent, arg: "nh_asset" }, { type: "nh_asset", value: op.payload.child, arg: "nh_asset" }]));

          case 114:
            return _context4.abrupt('return', _context4.sent);

          case 116:
            _context4.next = 118;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_create_nh_asset_order", [{ type: "account", value: op.payload.seller, arg: "seller" }, { type: "nh_asset", value: op.payload.nh_asset, arg: "nh_asset" }, {
              type: "amount",
              value: op.payload.price,
              arg: "amount"
            }, {
              type: "amount",
              value: op.payload.pending_orders_fee,
              arg: "pending_orders_fee"
            }]));

          case 118:
            return _context4.abrupt('return', _context4.sent);

          case 120:
            _context4.next = 122;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_cancel_nh_asset_order", [{ type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account" }, { type: "order", value: op.payload.order, arg: "order" }]));

          case 122:
            return _context4.abrupt('return', _context4.sent);

          case 124:
            _context4.next = 126;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_fill_nh_asset_order", [{ type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account" }, { type: "price_amount", value: op.payload.price_amount, arg: "price_amount" }, { type: "price_asset_symbol", value: op.payload.price_asset_symbol, arg: "price_asset_symbol" }, { type: "account", value: op.payload.seller, arg: "seller" }, { type: "nh_asset", value: op.payload.nh_asset, arg: "nh_asset" }]));

          case 126:
            return _context4.abrupt('return', _context4.sent);

          case 128:
            _context4.next = 130;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_relate_world_view", [{ type: "account", value: op.payload.related_account, arg: "related_account" }, { type: "account", value: op.payload.view_owner, arg: "view_owner" }, { type: "world_view", value: op.payload.world_view, arg: "world_view" }]));

          case 130:
            return _context4.abrupt('return', _context4.sent);

          case 132:
            _context4.next = 134;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_proposal_create", [{ type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account" }, { type: "result", value: op.result.result, arg: "result" }]));

          case 134:
            proposal_create = _context4.sent;
            proposalOp = op.payload.proposed_ops[0].op;

            proposalOp = {
              account: op.payload.fee_paying_account,
              payload: proposalOp[1],
              type: Operations._operationTypes[proposalOp[0]]
            };

            _context4.next = 139;
            return _regenerator2.default.awrap(Operations.getParseOperations(proposalOp));

          case 139:
            proposal_content = _context4.sent;
            return _context4.abrupt('return', {
              opText: proposal_create.opText.concat(proposal_content.opText),
              opObj: (0, _extends3.default)({}, proposal_create.opObj, proposal_content.opObj)
            });

          case 142:
            _context4.next = 144;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_committee_member_update_global_parameters", [{ type: "account", value: op.account, arg: "account" }]));

          case 144:
            return _context4.abrupt('return', _context4.sent);

          case 146:
            _context4.next = 148;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_proposal_update", [{ type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account" }, { type: "proposal", value: op.payload.proposal, arg: "proposal" }]));

          case 148:
            return _context4.abrupt('return', _context4.sent);

          case 150:
            _context4.next = 152;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("contract_affecteds_nh_transfer_from", [{ type: "account", value: op.payload.affected_account, arg: "affected_account" }, { type: "affected_item", value: op.payload.affected_item, arg: "affected_item" }]));

          case 152:
            return _context4.abrupt('return', _context4.sent);

          case 154:
            _context4.next = 156;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("contract_affecteds_nh_transfer_to", [{ type: "account", value: op.payload.affected_account, arg: "affected_account" }, { type: "affected_item", value: op.payload.affected_item, arg: "affected_item" }]));

          case 156:
            return _context4.abrupt('return', _context4.sent);

          case 158:
            _context4.next = 160;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("contract_affecteds_nh_modifined", [{ type: "account", value: op.payload.affected_account, arg: "affected_account" }, { type: "affected_item", value: op.payload.affected_item, arg: "affected_item" }, { type: "modified", value: op.payload.modified, arg: "modified" }]));

          case 160:
            return _context4.abrupt('return', _context4.sent);

          case 162:
            _context4.next = 164;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("contract_affecteds_asset", [{ type: "account", value: op.payload.affected_account, arg: "affected_account" }, {
              type: "amount",
              value: op.payload.affected_asset,
              arg: "aseet_amount",
              decimalOffset: op.payload.affected_asset.asset_id === "1.3.0" ? 0 : null
            }]));

          case 164:
            return _context4.abrupt('return', _context4.sent);

          case 166:
            _context4.next = 168;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("contract_affecteds_log", [{ type: "account", value: op.payload.affected_account, arg: "affected_account" }, {
              type: "message",
              value: op.payload.message,
              arg: "message"
            }]));

          case 168:
            return _context4.abrupt('return', _context4.sent);

          case 170:
            _context4.next = 172;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_asset_create", [{ type: "account", value: op.payload.issuer, arg: "account" }, { type: "symbol", value: op.payload.symbol, arg: "asset" }]));

          case 172:
            return _context4.abrupt('return', _context4.sent);

          case 174:
            _context4.next = 176;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_asset_update", [{ type: "account", value: op.payload.issuer, arg: "account" }, { type: "asset", value: op.payload.asset_to_update, arg: "asset" }]));

          case 176:
            return _context4.abrupt('return', _context4.sent);

          case 178:
            restricted_type_text = _locales[_store.rootGetters["setting/defaultSettings"].locale]["restricted_type_" + op.payload.restricted_type];
            _context4.next = 181;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_asset_update_restricted", [{ type: "account", value: op.payload.payer, arg: "payer" }, { type: "asset", value: op.payload.target_asset, arg: "target_asset" }, { type: "restricted_type", value: restricted_type_text, arg: "restricted_type_text" }]));

          case 181:
            return _context4.abrupt('return', _context4.sent);

          case 183:
            _context4.next = 185;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_asset_issue", [{ type: "account", value: op.payload.issuer, arg: "account" }, {
              type: "amount",
              value: op.payload.asset_to_issue,
              arg: "amount",
              decimalOffset: op.payload.asset_to_issue.asset_id === "1.3.0" ? 0 : null
            }, { type: "account", value: op.payload.issue_to_account, arg: "to" }]));

          case 185:
            return _context4.abrupt('return', _context4.sent);

          case 187:
            _context4.next = 189;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_asset_reserve", [{ type: "account", value: op.payload.payer, arg: "account" }, {
              type: "amount",
              value: op.payload.amount_to_reserve,
              arg: "amount"
            }]));

          case 189:
            return _context4.abrupt('return', _context4.sent);

          case 191:
            _context4.next = 193;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_asset_fund_fee_pool", [{ type: "account", value: op.payload.from_account, arg: "account" }, {
              type: "amount",
              value: { amount: op.payload.amount, asset_id: "1.3.0" },
              arg: "amount"
            }, { type: "asset", value: op.payload.asset_id, arg: "asset" }]));

          case 193:
            return _context4.abrupt('return', _context4.sent);

          case 195:
            _context4.next = 197;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_asset_publish_feed", [{ type: "account", value: op.payload.publisher, arg: "account" }, { type: "price", value: op.payload.feed.settlement_price, arg: "price" }]));

          case 197:
            return _context4.abrupt('return', _context4.sent);

          case 199:
            _context4.next = 201;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_asset_global_settle", [{ type: "account", value: op.payload.issuer, arg: "account" }, { type: "price", value: op.payload.settle_price, arg: "price" }, { type: "asset", value: op.payload.asset_to_settle, arg: "asset" }]));

          case 201:
            return _context4.abrupt('return', _context4.sent);

          case 203:
            _context4.next = 205;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_asset_settle", [{ type: "account", value: op.payload.account, arg: "account" }, { type: "amount", value: op.payload.amount, arg: "amount" }]));

          case 205:
            return _context4.abrupt('return', _context4.sent);

          case 207:
            _context4.next = 209;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_asset_settle_cancel", [{ type: "account", value: op.payload.creator, arg: "account" }, { type: "amount", value: op.payload.amount, arg: "amount" }]));

          case 209:
            return _context4.abrupt('return', _context4.sent);

          case 211:
            _context4.next = 213;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_vesting_balance_create", [{ type: "account", value: op.payload.creator, arg: "account" }, { type: "amount", value: op.payload.amount, arg: "amount" }]));

          case 213:
            return _context4.abrupt('return', _context4.sent);

          case 215:
            _context4.next = 217;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_asset_update_feed_producers", [{ type: "account", value: op.payload.issuer, arg: "account" }, { type: "asset", value: op.payload.asset_to_update, arg: "asset" }]));

          case 217:
            return _context4.abrupt('return', _context4.sent);

          case 219:
            _context4.next = 221;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_asset_claim_fees", [{ type: "account", value: op.payload.issuer, arg: "account" }, {
              type: "amount",
              value: op.payload.amount_to_claim,
              arg: "balance_amount"
            }, { type: "asset", value: op.payload.amount_to_claim.asset_id, arg: "asset" }]));

          case 221:
            return _context4.abrupt('return', _context4.sent);

          case 223:
            start_time = op.payload.start_time;

            start_time = new Date(start_time + "Z").bcxformat("yyyy/MM/dd HH:mm:ss");
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
            _context4.next = 229;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_crontab_create", [{ type: "account", value: op.payload.crontab_creator, arg: "crontab_creator" }, { type: "start_time", value: start_time, arg: "start_time" }, { type: "execute_interval", value: op.payload.execute_interval, arg: "execute_interval" }, { type: "execute_times", value: op.payload.scheduled_execute_times, arg: "execute_times" }, { type: "result", value: op.result.result, arg: "result" }]));

          case 229:
            crontab_create = _context4.sent;
            crontabOp = op.payload.crontab_ops[0].op;

            crontabOp = {
              payload: crontabOp[1],
              type: Operations._operationTypes[crontabOp[0]]
            };

            _context4.next = 234;
            return _regenerator2.default.awrap(Operations.getParseOperations(crontabOp));

          case 234:
            crontab_content = _context4.sent;
            return _context4.abrupt('return', {
              opText: crontab_create.opText.concat(crontab_content.opText),
              opObj: (0, _extends3.default)({}, crontab_create.opObj, crontab_content.opObj)
            });

          case 237:
            _context4.next = 239;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_crontab_cancel", [{ type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account" }, { type: "task", value: op.payload.task, arg: "task" }]));

          case 239:
            return _context4.abrupt('return', _context4.sent);

          case 241:
            restart_time = op.payload.restart_time;

            restart_time = new Date(restart_time + "Z").bcxformat("yyyy/MM/dd HH:mm:ss");
            _context4.next = 245;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_crontab_recover", [{ type: "account", value: op.payload.crontab_owner, arg: "crontab_owner" }, { type: "crontab", value: op.payload.crontab, arg: "crontab" }, { type: "restart_time", value: restart_time, arg: "restart_time" }]));

          case 245:
            return _context4.abrupt('return', _context4.sent);

          case 247:
            _context4.next = 249;
            return _regenerator2.default.awrap(Operations.getTranslateInfo("operation_update_collateral_for_gas", [{ type: "account", value: op.payload.mortgager, arg: "mortgager" }, { type: "account", value: op.payload.beneficiary, arg: "beneficiary" }, {
              type: "amount",
              value: {
                amount: op.payload.collateral,
                asset_id: "1.3.0"
              },
              arg: "collateral"
            }]));

          case 249:
            return _context4.abrupt('return', _context4.sent);

          case 251:
          case 'end':
            return _context4.stop();
        }
      }
    }, null, undefined);
  },
  getTranslateInfo: function getTranslateInfo(localId, keys) {
    var lang, text, splitText, key, opObj, i, value;
    return _regenerator2.default.async(function getTranslateInfo$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            lang = _store.rootGetters["setting/defaultSettings"].locale;
            text = _locales[lang][localId];

            if (localId == "operation_create_nh_asset" && keys.length == 2) {
              text = lang == 'en' ? '(fee_paying_account) Create NH assets with ownership account (owner)' : "(fee_paying_account) 创建NH资产，所有权账户为 (owner)";
            }
            splitText = _utils2.default.get_translation_parts(text);
            key = void 0;
            opObj = {};
            i = 0;

          case 7:
            if (!(i < keys.length)) {
              _context6.next = 19;
              break;
            }

            key = keys[i];

            if (!splitText.indexOf(key.arg)) {
              _context6.next = 16;
              break;
            }

            value = key.value;
            _context6.next = 13;
            return _regenerator2.default.awrap(function _callee() {
              var acc_res, asset, amount, response, item_data;
              return _regenerator2.default.async(function _callee$(_context5) {
                while (1) {
                  switch (_context5.prev = _context5.next) {
                    case 0:
                      _context5.t0 = key.type;
                      _context5.next = _context5.t0 === "account" ? 3 : _context5.t0 === "asset" ? 9 : _context5.t0 === "amount" ? 15 : _context5.t0 === "price" ? 20 : _context5.t0 === "contract_id" ? 24 : _context5.t0 === "modified" ? 29 : 34;
                      break;

                    case 3:
                      if (!/^1.2.\d+/.test(key.value)) {
                        _context5.next = 8;
                        break;
                      }

                      _context5.next = 6;
                      return _regenerator2.default.awrap(_api2.default.Account.getAccount(key.value, true));

                    case 6:
                      acc_res = _context5.sent;

                      if (acc_res.success) {
                        value = acc_res.data.account.name;
                      }

                    case 8:
                      return _context5.abrupt('break', 36);

                    case 9:
                      _context5.next = 11;
                      return _regenerator2.default.awrap(_api2.default.Assets.fetch([key.value], true));

                    case 11:
                      asset = _context5.sent;

                      if (!asset) {
                        console.log("链上不存在资产" + asset_id);
                      }
                      value = asset ? asset.symbol : asset;
                      return _context5.abrupt('break', 36);

                    case 15:
                      _context5.next = 17;
                      return _regenerator2.default.awrap(Operations.FormattedAsset(key.value.amount, key.value.asset_id, key.decimalOffset));

                    case 17:
                      value = _context5.sent;

                      if (localId == "contract_affecteds_asset") {
                        amount = Number(value.split(" ")[0]);

                        if (amount > 0) {
                          value = "+" + value;
                        }
                      }
                      return _context5.abrupt('break', 36);

                    case 20:
                      _context5.next = 22;
                      return _regenerator2.default.awrap(Operations.FormattedPrice({
                        base_asset: key.value.base.asset_id,
                        base_amount: key.value.base.amount,
                        quote_asset: key.value.quote.asset_id,
                        quote_amount: key.value.quote.amount
                      }));

                    case 22:
                      value = _context5.sent;
                      return _context5.abrupt('break', 36);

                    case 24:
                      _context5.next = 26;
                      return _regenerator2.default.awrap(_api2.default.Contract.getContract(key.value, true));

                    case 26:
                      response = _context5.sent;

                      if (response.code == 1) {
                        value = response.data.name;
                      } else {
                        value = key.value;
                      }
                      return _context5.abrupt('break', 36);

                    case 29:
                      item_data = {};

                      value = [value];
                      value.forEach(function (keyValue) {
                        item_data[keyValue[0]] = keyValue[1];
                      });
                      value = (0, _stringify2.default)(item_data);
                      return _context5.abrupt('break', 36);

                    case 34:
                      value = key.value;
                      return _context5.abrupt('break', 36);

                    case 36:
                    case 'end':
                      return _context5.stop();
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
            _context6.next = 7;
            break;

          case 19:
            return _context6.abrupt('return', {
              opText: splitText,
              opObj: opObj
              //return splitText;
            });

          case 20:
          case 'end':
            return _context6.stop();
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
    return _regenerator2.default.async(function FormattedPrice$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            // let marketId=quote_asset+"_"+base_asset;
            assets = _store.rootGetters["assets/getAssets"];

            if (!(assets && assets[base_asset] && assets[quote_asset])) {
              _context7.next = 6;
              break;
            }

            base_asset = assets[base_asset];
            quote_asset = assets[quote_asset];
            _context7.next = 22;
            break;

          case 6:
            if (!_api2.default.Assets.fetch_asset_by_cache(base_asset)) {
              _context7.next = 10;
              break;
            }

            base_asset = _api2.default.Assets.fetch_asset_by_cache(base_asset);
            _context7.next = 14;
            break;

          case 10:
            _context7.next = 12;
            return _regenerator2.default.awrap(_api2.default.Assets.fetch([base_asset], true));

          case 12:
            base_asset = _context7.sent;

            if (!base_asset) {
              base_asset = { precision: 8, symbol: "1.3.0" };
            }

          case 14:
            if (!_api2.default.Assets.fetch_asset_by_cache(quote_asset)) {
              _context7.next = 18;
              break;
            }

            quote_asset = _api2.default.Assets.fetch_asset_by_cache(quote_asset);
            _context7.next = 22;
            break;

          case 18:
            _context7.next = 20;
            return _regenerator2.default.awrap(_api2.default.Assets.fetch([quote_asset], true));

          case 20:
            quote_asset = _context7.sent;

            if (!quote_asset) {
              quote_asset = { precision: 8, symbol: "1.3.0" };
            }

          case 22:
            base_precision = _utils2.default.get_asset_precision(base_asset.precision);
            quote_precision = _utils2.default.get_asset_precision(quote_asset.precision);
            value = base_amount / base_precision / (quote_amount / quote_precision);

            value = Number(value.toFixed(base_asset.precision));
            return _context7.abrupt('return', value + " " + base_asset.symbol + "/" + quote_asset.symbol);

          case 27:
          case 'end':
            return _context7.stop();
        }
      }
    }, null, undefined);
  },
  FormattedAsset: function FormattedAsset(amount, asset_id, decimalOffset) {
    var asset;
    return _regenerator2.default.async(function FormattedAsset$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.next = 2;
            return _regenerator2.default.awrap(_api2.default.Assets.fetch([asset_id], true));

          case 2:
            asset = _context8.sent;

            if (!asset) {
              asset = { precision: 5, symbol: "1.3.0" };
            }
            return _context8.abrupt('return', _helper2.default.getFullNum(amount / Math.pow(10, asset.precision)) + " " + asset.symbol);

          case 5:
          case 'end':
            return _context8.stop();
        }
      }
    }, null, undefined);
  },
  // retrieves array of assets ids that were used in operations


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
    return _regenerator2.default.async(function getUserOperations$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.prev = 0;
            _context9.next = 3;
            return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().history_api().exec('get_account_history', [userId, startId, limit, endId]));

          case 3:
            response = _context9.sent;

            if (!(response && (typeof response === 'undefined' ? 'undefined' : (0, _typeof3.default)(response)) === 'object')) {
              _context9.next = 9;
              break;
            }

            _context9.next = 7;
            return _regenerator2.default.awrap(Operations.parseOperations({ operations: response, store: store }));

          case 7:
            parsedOperations = _context9.sent;
            return _context9.abrupt('return', {
              code: 1,
              data: parsedOperations
            });

          case 9:
            return _context9.abrupt('return', {
              code: 120,
              message: 'Error fetching account record',
              error: 'Error fetching account record'
            });

          case 12:
            _context9.prev = 12;
            _context9.t0 = _context9['catch'](0);
            return _context9.abrupt('return', {
              code: 0,
              message: _context9.t0.message,
              error: _context9.t0
            });

          case 15:
          case 'end':
            return _context9.stop();
        }
      }
    }, null, undefined, [[0, 12]]);
  },
  get_block_header: function get_block_header(block_num) {
    var response, res;
    return _regenerator2.default.async(function get_block_header$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.prev = 0;

            if (!(block_num in _cacheBlocks)) {
              _context10.next = 5;
              break;
            }

            if (!_cacheBlocks[block_num]) {
              _context10.next = 4;
              break;
            }

            return _context10.abrupt('return', _cacheBlocks[block_num]);

          case 4:
            return _context10.abrupt('return', { code: 0 });

          case 5:
            _cacheBlocks[block_num] = "";
            _context10.next = 8;
            return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec("get_block_header", [block_num]));

          case 8:
            response = _context10.sent;

            if (!(response && (typeof response === 'undefined' ? 'undefined' : (0, _typeof3.default)(response)) === 'object')) {
              _context10.next = 13;
              break;
            }

            res = {
              code: 1,
              data: response
            };

            _cacheBlocks[block_num] = res;
            return _context10.abrupt('return', res);

          case 13:
            return _context10.abrupt('return', {
              code: 121,
              message: 'block and transaction information cannot be found'
            });

          case 16:
            _context10.prev = 16;
            _context10.t0 = _context10['catch'](0);
            return _context10.abrupt('return', {
              code: 0,
              message: _context10.t0.message,
              error: _context10.t0
            });

          case 19:
          case 'end':
            return _context10.stop();
        }
      }
    }, null, undefined, [[0, 16]]);
  },
  getBlock: function getBlock(block_num) {
    var response;
    return _regenerator2.default.async(function getBlock$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            _context11.prev = 0;
            _context11.next = 3;
            return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec("get_block", [block_num]));

          case 3:
            response = _context11.sent;

            if (!(response && (typeof response === 'undefined' ? 'undefined' : (0, _typeof3.default)(response)) === 'object')) {
              _context11.next = 6;
              break;
            }

            return _context11.abrupt('return', {
              code: 1,
              data: response
            });

          case 6:
            return _context11.abrupt('return', {
              code: 121,
              message: 'block and transaction information cannot be found'
            });

          case 9:
            _context11.prev = 9;
            _context11.t0 = _context11['catch'](0);
            return _context11.abrupt('return', {
              code: 0,
              message: _context11.t0.message,
              error: _context11.t0
            });

          case 12:
          case 'end':
            return _context11.stop();
        }
      }
    }, null, undefined, [[0, 9]]);
  }
};

Operations.prepareOperationTypes();

exports.default = Operations;