'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _bcxjsCores = require('bcxjs-cores');

var _bcxjsWs = require('bcxjs-ws');

var _account = require('./account');

var _utils = require('../../utils');

var _helper = require('../../lib/common/helper');

var _helper2 = _interopRequireDefault(_helper);

var _account_utils = require('../../lib/common/account_utils');

var _account_utils2 = _interopRequireDefault(_account_utils);

var _api = require('../api');

var _api2 = _interopRequireDefault(_api);

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var signTransaction = function _callee(transaction, store) {
  var _ref, pubkeys, addys, my_pubkeys, required_pubkeys, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, pubkey_string, private_key, app_keys;

  return _regenerator2.default.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return _regenerator2.default.awrap(transaction.get_potential_signatures());

        case 2:
          _ref = _context.sent;
          pubkeys = _ref.pubkeys;
          addys = _ref.addys;
          my_pubkeys = store.rootGetters["PrivateKeyStore/getPubkeys_having_PrivateKey"](pubkeys, addys);
          _context.next = 8;
          return _regenerator2.default.awrap(transaction.get_required_signatures(my_pubkeys));

        case 8:
          required_pubkeys = _context.sent;
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 12;
          _iterator = (0, _getIterator3.default)(required_pubkeys);

        case 14:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context.next = 25;
            break;
          }

          pubkey_string = _step.value;
          _context.next = 18;
          return _regenerator2.default.awrap(store.dispatch("WalletDb/getPrivateKey", pubkey_string, { root: true }));

        case 18:
          private_key = _context.sent;

          if (private_key) {
            _context.next = 21;
            break;
          }

          throw new Error("Missing signing key for " + pubkey_string);

        case 21:
          transaction.add_signer(private_key, pubkey_string);

        case 22:
          _iteratorNormalCompletion = true;
          _context.next = 14;
          break;

        case 25:
          _context.next = 31;
          break;

        case 27:
          _context.prev = 27;
          _context.t0 = _context['catch'](12);
          _didIteratorError = true;
          _iteratorError = _context.t0;

        case 31:
          _context.prev = 31;
          _context.prev = 32;

          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }

        case 34:
          _context.prev = 34;

          if (!_didIteratorError) {
            _context.next = 37;
            break;
          }

          throw _iteratorError;

        case 37:
          return _context.finish(34);

        case 38:
          return _context.finish(31);

        case 39:
          //Contract authentication
          try {
            app_keys = store.rootGetters["PrivateKeyStore/app_keys"];

            app_keys.forEach(function (app_key) {
              app_key = _bcxjsCores.PrivateKey.fromWif(app_key);
              transaction.add_signer(app_key, app_key.toPublicKey().toPublicKeyString());
            });
          } catch (e) {}

        case 40:
        case 'end':
          return _context.stop();
      }
    }
  }, null, undefined, [[12, 27, 31, 39], [32,, 34, 38]]);
};

var buildOperationsAndBroadcast = function _callee2(transaction, store) {
  var feeObj, feeAsset, res;
  return _regenerator2.default.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return _regenerator2.default.awrap(signTransaction(transaction, store));

        case 2:
          _context2.next = 4;
          return _regenerator2.default.awrap(transaction.update_head_block());

        case 4:
          _context2.next = 6;
          return _regenerator2.default.awrap(transaction.set_required_fees());

        case 6:
          if (!store.rootGetters["transactions/onlyGetOPFee"]) {
            _context2.next = 12;
            break;
          }

          feeObj = transaction.operations[0][1].fee;
          _context2.next = 10;
          return _regenerator2.default.awrap(store.dispatch("assets/fetchAssets", { assets: [feeObj.asset_id], isOne: true }, { root: true }));

        case 10:
          feeAsset = _context2.sent;
          return _context2.abrupt('return', {
            fee_amount: _helper2.default.getFullNum(feeObj.amount / Math.pow(10, feeAsset.precision)),
            fee_symbol: feeAsset.symbol
          });

        case 12:
          _context2.next = 14;
          return _regenerator2.default.awrap(transaction.broadcast());

        case 14:
          res = _context2.sent;
          return _context2.abrupt('return', res);

        case 16:
        case 'end':
          return _context2.stop();
      }
    }
  }, null, undefined);
};

var process_transaction = function process_transaction(transaction, store) {
  return new _promise2.default(function _callee3(resolve) {
    var broadcastTimeout, transactionResData, _error;

    return _regenerator2.default.async(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            broadcastTimeout = setTimeout(function () {
              resolve({ success: false, error: { message: 'Expiry of the transaction' }, code: 119 });
            }, _bcxjsWs.ChainConfig.expire_in_secs * 2000);
            _context3.prev = 1;
            _context3.next = 4;
            return _regenerator2.default.awrap(buildOperationsAndBroadcast(transaction, store));

          case 4:
            transactionResData = _context3.sent;

            clearTimeout(broadcastTimeout);
            resolve({ success: true, data: transactionResData, code: 1 });

            _context3.next = 15;
            break;

          case 9:
            _context3.prev = 9;
            _context3.t0 = _context3['catch'](1);
            _error = {
              message: _context3.t0
            };

            try {
              _context3.t0 = _context3.t0.message.match(/@@.*@@/)[0].replace(/@@/g, "");
              _error = JSON.parse(_context3.t0);
              // if(_error.message.indexOf(' -delta: Insufficient Balance: ')>=0){
              //   let {a,b,r}=_error.data.stack[0].data;
              //   _error.message="Insufficient Balance for the fee of "+r+;//balance after current operation: "+b+",
              // }
            } catch (e) {
              _error = {
                message: _context3.t0.message
              };
            }
            clearTimeout(broadcastTimeout);
            resolve({ success: false, error: _error, code: 0 });

          case 15:
          case 'end':
            return _context3.stop();
        }
      }
    }, null, undefined, [[1, 9]]);
  });
};

var transactionOpWorker = function _callee4(fromId, operations, fromAccount, propose_options, store) {
  var opObjects, keys, aes_private, _passwordKey, app_keys, core_asset, $passwordKey, getPrivateKeyPromises, privateKeys;

  return _regenerator2.default.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 2;
          return _regenerator2.default.awrap(buildOPObjects(operations, fromId, fromAccount, store));

        case 2:
          opObjects = _context4.sent;

          if (!(opObjects.success == false)) {
            _context4.next = 5;
            break;
          }

          return _context4.abrupt('return', opObjects);

        case 5:
          keys = store.rootGetters["PrivateKeyStore/keys"];
          aes_private = store.rootGetters["WalletDb/aes_private"];
          _passwordKey = store.rootGetters["WalletDb/_passwordKey"];
          app_keys = store.rootGetters["PrivateKeyStore/app_keys"];
          _context4.next = 11;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch(["1.3.0"], true));

        case 11:
          core_asset = _context4.sent;
          ;

          $passwordKey = {};

          if (!_passwordKey) {
            _context4.next = 18;
            break;
          }

          (0, _keys2.default)(_passwordKey).forEach(function (pubkeyStr) {
            $passwordKey[pubkeyStr] = _passwordKey[pubkeyStr].toWif();
          });
          _context4.next = 24;
          break;

        case 18:
          getPrivateKeyPromises = [];

          (0, _keys2.default)(keys).forEach(function (pubkeyStr) {
            getPrivateKeyPromises.push(store.dispatch("WalletDb/getPrivateKey", pubkeyStr, { root: true }));
          });

          _context4.next = 22;
          return _regenerator2.default.awrap(_promise2.default.all(getPrivateKeyPromises));

        case 22:
          privateKeys = _context4.sent;

          privateKeys.forEach(function (key) {
            $passwordKey[key.toPublicKey().toString()] = key.toWif();
          });

        case 24:
          return _context4.abrupt('return', new _promise2.default(function (resolve) {
            var transactionWorker = require("bcl-worker-loader?name=bcxWorker.js!../workers/transactionWorker.js");
            var worker = new transactionWorker();
            // console.info("opObjects",opObjects);
            worker.postMessage({
              opObjects: opObjects,
              propose_options: propose_options,
              core_asset: core_asset,
              onlyGetOPFee: store.rootGetters["transactions/onlyGetOPFee"],
              url: store.rootGetters["setting/SELECT_WS_NODE_URL"],
              keys: keys,
              aes_private: aes_private,
              _passwordKey: $passwordKey,
              app_keys: app_keys,
              networks: store.rootGetters["setting/networks"],
              fromId: fromId
            });
            worker.onmessage = function (event) {
              var res = event.data;
              resolve(res);
            };
          }));

        case 25:
        case 'end':
          return _context4.stop();
      }
    }
  }, null, undefined);
};

var transactionOp = function _callee5(fromId, operations, fromAccount) {
  var proposeAccountId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "";
  var store = arguments[4];
  var opObjects, transaction, crontab, startTime, executeInterval, executeTimes, res, now_time, crontab_options, propose_options;
  return _regenerator2.default.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
          return _regenerator2.default.awrap(buildOPObjects(operations, proposeAccountId || fromId, fromAccount, store));

        case 2:
          opObjects = _context5.sent;

          if (!(opObjects.code && opObjects.code != 1)) {
            _context5.next = 5;
            break;
          }

          return _context5.abrupt('return', opObjects);

        case 5:

          // if(store.rootGetters["PrivateKeyStore/app_keys"])
          transaction = new _bcxjsCores.TransactionBuilder();


          opObjects.forEach(function (op) {
            transaction.add_type_operation(op.type, op.opObject);
          });

          crontab = store.rootState.crontab.crontab;

          if (!crontab) {
            _context5.next = 29;
            break;
          }

          _context5.next = 11;
          return _regenerator2.default.awrap(transaction.set_required_fees());

        case 11:
          _context5.next = 13;
          return _regenerator2.default.awrap(transaction.update_head_block());

        case 13:
          startTime = crontab.startTime, executeInterval = crontab.executeInterval, executeTimes = crontab.executeTimes;

          if (!(startTime == undefined || executeInterval == undefined || executeTimes == undefined)) {
            _context5.next = 16;
            break;
          }

          return _context5.abrupt('return', { code: 101, message: "Crontab parameter is missing" });

        case 16:
          startTime = parseInt(startTime);
          executeInterval = parseInt(executeInterval);
          executeTimes = parseInt(executeTimes);

          if (!(isNaN(startTime) || isNaN(executeInterval) || isNaN(executeTimes))) {
            _context5.next = 21;
            break;
          }

          return _context5.abrupt('return', { code: 1011, message: "Parameter error" });

        case 21:
          if (!(startTime <= 0 || executeInterval <= 0 || executeTimes <= 0)) {
            _context5.next = 23;
            break;
          }

          return _context5.abrupt('return', { code: 176, message: "Crontab must have parameters greater than 0" });

        case 23:
          _context5.next = 25;
          return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec("get_objects", [["2.1.0"]]));

        case 25:
          res = _context5.sent;
          now_time = new Date(res[0].time + "Z").getTime();
          crontab_options = {
            crontab_creator: fromId,
            start_time: Math.floor((now_time + startTime) / 1000), //+Number(startTime),
            execute_interval: executeInterval,
            scheduled_execute_times: executeTimes
          };

          transaction.crontab(crontab_options);

        case 29:
          if (!proposeAccountId) {
            _context5.next = 36;
            break;
          }

          _context5.next = 32;
          return _regenerator2.default.awrap(transaction.set_required_fees());

        case 32:
          _context5.next = 34;
          return _regenerator2.default.awrap(transaction.update_head_block());

        case 34:
          propose_options = {
            fee_paying_account: fromId
          };

          transaction.propose(propose_options);

        case 36:
          return _context5.abrupt('return', process_transaction(transaction, store));

        case 37:
        case 'end':
          return _context5.stop();
      }
    }
  }, null, undefined);
};

var buildOPObjects = function _callee6(operations, fromId, fromAccount, store) {
  var opObjects, opObject, opItem, i, opParams, _opParams$asset_id, asset_id, _opParams$fee_asset_i, fee_asset_id, assetObj, name, data, authority, contractId, functionName, valueList, runTime, pending_orders_fee, price, _opParams$priceAssetI, priceAssetId, price_amount_res, _opItem, op_type, to, _opParams$amount, amount, memo, toAccount, amount_res, memo_key, memo_from_privkey, feeAssetObj;

  return _regenerator2.default.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          opObjects = [];
          opObject = void 0, opItem = void 0;
          i = 0;

        case 3:
          if (!(i < operations.length)) {
            _context6.next = 110;
            break;
          }

          opItem = operations[i];
          _context6.prev = 5;
          opParams = opItem.params;
          _opParams$asset_id = opParams.asset_id, asset_id = _opParams$asset_id === undefined ? "1.3.0" : _opParams$asset_id, _opParams$fee_asset_i = opParams.fee_asset_id, fee_asset_id = _opParams$fee_asset_i === undefined ? "1.3.0" : _opParams$fee_asset_i;
          _context6.next = 10;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(asset_id));

        case 10:
          assetObj = _context6.sent;

          if (!(assetObj.code != 1)) {
            _context6.next = 13;
            break;
          }

          return _context6.abrupt('return', assetObj);

        case 13:
          assetObj = assetObj.data;

          _context6.t0 = opItem.type;
          _context6.next = _context6.t0 === "account_update" ? 17 : _context6.t0 === "contract_create" ? 19 : _context6.t0 === "revise_contract" ? 22 : _context6.t0 === "call_contract_function" ? 24 : _context6.t0 === "creat_nh_asset_order" ? 27 : _context6.t0 === "limit_order_cancel" ? 42 : _context6.t0 === "vesting_balance_withdraw" ? 44 : 46;
          break;

        case 17:
          if ("action" in opParams) {
            opObject = getUpdateAccountObject(opParams, fromAccount.account);
          } else {
            opObject = opParams.updateObject;
          }
          return _context6.abrupt('break', 46);

        case 19:
          name = opParams.name, data = opParams.data, authority = opParams.authority;

          opObject = {
            owner: fromId,
            name: name,
            data: data,
            contract_authority: authority,
            extensions: []
          };
          return _context6.abrupt('break', 46);

        case 22:
          opObject = (0, _extends3.default)({
            reviser: fromId
          }, opParams, {
            extensions: []
          });
          return _context6.abrupt('break', 46);

        case 24:
          contractId = opParams.contractId, functionName = opParams.functionName, valueList = opParams.valueList, runTime = opParams.runTime;

          opObject = {
            caller: fromId,
            contract_id: contractId,
            function_name: functionName,
            value_list: valueList,
            extensions: []
          };
          return _context6.abrupt('break', 46);

        case 27:
          pending_orders_fee = opParams.pending_orders_fee, price = opParams.price, _opParams$priceAssetI = opParams.priceAssetId, priceAssetId = _opParams$priceAssetI === undefined ? "1.3.0" : _opParams$priceAssetI;
          _context6.next = 30;
          return _regenerator2.default.awrap(_helper2.default.toOpAmount(pending_orders_fee, assetObj));

        case 30:
          pending_orders_fee = _context6.sent;

          if (pending_orders_fee.success) {
            _context6.next = 33;
            break;
          }

          return _context6.abrupt('return', pending_orders_fee);

        case 33:
          opParams.pending_orders_fee = pending_orders_fee.data;

          _context6.next = 36;
          return _regenerator2.default.awrap(_helper2.default.toOpAmount(price, priceAssetId));

        case 36:
          price_amount_res = _context6.sent;

          if (price_amount_res.success) {
            _context6.next = 39;
            break;
          }

          return _context6.abrupt('return', price_amount_res);

        case 39:
          opParams.price = price_amount_res.data;

          opObject = (0, _extends3.default)({
            seller: fromId
          }, opParams);
          return _context6.abrupt('break', 46);

        case 42:
          opObject = {
            fee_paying_account: fromId,
            order: opParams.orderId
          };
          return _context6.abrupt('break', 46);

        case 44:
          opObject = (0, _extends3.default)({
            owner: fromId
          }, opParams);
          return _context6.abrupt('break', 46);

        case 46:
          _opItem = opItem, op_type = _opItem.op_type;

          if (!(typeof op_type != "undefined")) {
            _context6.next = 91;
            break;
          }

          if (!(op_type >= 46 && op_type <= 54 && op_type != 52)) {
            _context6.next = 61;
            break;
          }

          if ("asset_id" in opParams) opParams.asset_id = assetObj.symbol;

          opObject = opParams;
          _context6.t1 = op_type;
          _context6.next = _context6.t1 === 51 ? 54 : _context6.t1 === 48 ? 56 : 58;
          break;

        case 54:
          opObject.from = fromId;
          return _context6.abrupt('break', 59);

        case 56:
          opObject.related_account = fromId;
          return _context6.abrupt('break', 59);

        case 58:
          opObject.fee_paying_account = fromId;

        case 59:
          _context6.next = 91;
          break;

        case 61:
          if (!(op_type == 0 || op_type == 13)) {
            _context6.next = 90;
            break;
          }

          to = opParams.to, _opParams$amount = opParams.amount, amount = _opParams$amount === undefined ? 0 : _opParams$amount, memo = opParams.memo;
          _context6.next = 65;
          return _regenerator2.default.awrap((0, _account.getUser)(to));

        case 65:
          toAccount = _context6.sent;

          if (toAccount.success) {
            _context6.next = 68;
            break;
          }

          return _context6.abrupt('return', { success: false, error: 'Account receivable does not exist', code: 116 });

        case 68:
          _context6.next = 70;
          return _regenerator2.default.awrap(_helper2.default.toOpAmount(amount, assetObj));

        case 70:
          amount_res = _context6.sent;

          if (amount_res.success) {
            _context6.next = 73;
            break;
          }

          return _context6.abrupt('return', amount_res);

        case 73:
          amount = amount_res.data;

          opObject = {};
          if (op_type == 0) {
            opObject.from = fromId;
            opObject.to = toAccount.data.account.id;
            opObject.amount = amount;
          } else if (op_type == 13) {
            opObject.issuer = fromId;
            opObject.issue_to_account = toAccount.data.account.id;
            opObject.asset_to_issue = amount;
          }

          if (!memo) {
            _context6.next = 88;
            break;
          }

          memo_key = toAccount.data.account.options.memo_key;
          _context6.next = 80;
          return _regenerator2.default.awrap(store.dispatch("WalletDb/getPrivateKey", fromAccount.account.options.memo_key, { root: true }));

        case 80:
          memo_from_privkey = _context6.sent;
          _context6.prev = 81;

          opObject.memo = (0, _utils.encryptMemo)(new Buffer(memo, "utf-8"), memo_from_privkey, memo_key);
          _context6.next = 88;
          break;

        case 85:
          _context6.prev = 85;
          _context6.t2 = _context6['catch'](81);
          return _context6.abrupt('return', { success: false, error: 'Encrypt memo failed', code: 118 });

        case 88:
          _context6.next = 91;
          break;

        case 90:
          if (!opObject) {
            opObject = opParams;
          }

        case 91:

          opObject.fee = {
            amount: 0,
            asset_id: "1.3.0"
          };

          if (!("transfer,account_upgrade,call_order_update,limit_order_cancel".indexOf(opItem.type) != -1)) {
            _context6.next = 101;
            break;
          }

          _context6.next = 95;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(fee_asset_id));

        case 95:
          feeAssetObj = _context6.sent;

          if (!(feeAssetObj.code != 1)) {
            _context6.next = 98;
            break;
          }

          return _context6.abrupt('return', feeAssetObj);

        case 98:
          _context6.next = 100;
          return _regenerator2.default.awrap(_account_utils2.default.getFinalFeeAsset(_immutable2.default.fromJS(fromAccount), opItem.type, feeAssetObj.data.id));

        case 100:
          opObject.fee.asset_id = _context6.sent;

        case 101:

          opObjects.push({
            type: opItem.type,
            opObject: opObject
          });
          _context6.next = 107;
          break;

        case 104:
          _context6.prev = 104;
          _context6.t3 = _context6['catch'](5);
          return _context6.abrupt('return', {
            success: false,
            error: _context6.t3.message,
            code: 0
          });

        case 107:
          i++;
          _context6.next = 3;
          break;

        case 110:
          return _context6.abrupt('return', opObjects);

        case 111:
        case 'end':
          return _context6.stop();
      }
    }
  }, null, undefined, [[5, 104], [81, 85]]);
};

var getUpdateAccountObject = function getUpdateAccountObject(params, fromAccount) {
  var updated_account = fromAccount;
  var updateObject = { account: updated_account.id };
  var new_options = JSON.parse((0, _stringify2.default)(updated_account.options));

  var action = params.action,
      activePubkey = params.activePubkey,
      ownerPubkey = params.ownerPubkey;

  if (action == "changePassword") {
    var active = JSON.parse((0, _stringify2.default)(updated_account.active));
    var owner = JSON.parse((0, _stringify2.default)(updated_account.owner));
    active.key_auths[0] = [activePubkey, 1];
    owner.key_auths[0] = [ownerPubkey, 1];

    updateObject.active = active;
    updateObject.owner = owner;
    new_options.memo_key = activePubkey;
  }
  updateObject.new_options = new_options;
  return updateObject;
};

exports.default = { transactionOp: transactionOp, transactionOpWorker: transactionOpWorker };