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

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

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

// 2020-03-05  xulin_add  签名
var signString = function _callee(transaction, store, signContent) {
  var pubkey, private_key, signBuffer, signArray, signArr, signUint8Array, signre;
  return _regenerator2.default.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          pubkey = transaction.account.active.key_auths[0][0];
          _context.next = 3;
          return _regenerator2.default.awrap(store.dispatch("WalletDb/getPrivateKey", pubkey, { root: true }));

        case 3:
          private_key = _context.sent;
          signBuffer = new Buffer(signContent);
          signArray = (0, _from2.default)(signBuffer);

          signArray.unshift(signContent.length);
          signArr = new ArrayBuffer(signArray.length);
          signUint8Array = new Uint8Array(signArr);

          signUint8Array.set(signArray, 0);
          signre = _bcxjsCores.Signature.signBuffer(signUint8Array, private_key);
          return _context.abrupt('return', {
            code: 1,
            data: {
              message: signContent,
              signature: signre.toHex()
            }
          });

        case 12:
        case 'end':
          return _context.stop();
      }
    }
  }, null, undefined);
};

// 2020-03-05  xulin_add  解签
var checkingSignString = function _callee2(checkingSignParams) {
  var checkingSignContent, signContent, signre, signBuffer, signArray, signArr, signUint8Array, signature_obj, mypubkey, userId;
  return _regenerator2.default.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          checkingSignContent = checkingSignParams.checkingSignContent, signContent = checkingSignParams.signContent;
          // 解签

          signre = '';
          _context2.prev = 2;

          signre = _bcxjsCores.Signature.fromHex(checkingSignContent);
          _context2.next = 9;
          break;

        case 6:
          _context2.prev = 6;
          _context2.t0 = _context2['catch'](2);
          return _context2.abrupt('return', {
            success: false,
            error: "Incorrect information",
            code: 0
          });

        case 9:
          signBuffer = new Buffer(signContent);
          signArray = (0, _from2.default)(signBuffer);

          signArray.unshift(signContent.length);
          signArr = new ArrayBuffer(signArray.length);
          signUint8Array = new Uint8Array(signArr);

          signUint8Array.set(signArray, 0);
          signature_obj = new _bcxjsCores.Signature(signre.r, signre.s, signre.i);
          mypubkey = signature_obj.recoverPublicKeyFromBuffer(signUint8Array);
          _context2.next = 19;
          return _regenerator2.default.awrap(_api2.default.Account.getAccountIdByOwnerPubkey(mypubkey.toPublicKeyString()));

        case 19:
          userId = _context2.sent;

          if (!(userId.length == 0)) {
            _context2.next = 24;
            break;
          }

          return _context2.abrupt('return', {
            success: false,
            error: "Incorrect information",
            code: 0
          });

        case 24:
          return _context2.abrupt('return', { success: true, data: userId, code: 1 });

        case 25:
        case 'end':
          return _context2.stop();
      }
    }
  }, null, undefined, [[2, 6]]);
};

var signTransaction = function _callee3(transaction, store) {
  var _ref, pubkeys, addys, my_pubkeys, required_pubkeys, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, pubkey_string, private_key, app_keys;

  return _regenerator2.default.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return _regenerator2.default.awrap(transaction.get_potential_signatures());

        case 2:
          _ref = _context3.sent;
          pubkeys = _ref.pubkeys;
          addys = _ref.addys;
          my_pubkeys = store.rootGetters["PrivateKeyStore/getPubkeys_having_PrivateKey"](pubkeys, addys);
          _context3.next = 8;
          return _regenerator2.default.awrap(transaction.get_required_signatures(my_pubkeys));

        case 8:
          required_pubkeys = _context3.sent;
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context3.prev = 12;
          _iterator = (0, _getIterator3.default)(required_pubkeys);

        case 14:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context3.next = 25;
            break;
          }

          pubkey_string = _step.value;
          _context3.next = 18;
          return _regenerator2.default.awrap(store.dispatch("WalletDb/getPrivateKey", pubkey_string, { root: true }));

        case 18:
          private_key = _context3.sent;

          if (private_key) {
            _context3.next = 21;
            break;
          }

          throw new Error("Missing signing key for " + pubkey_string);

        case 21:
          transaction.add_signer(private_key, pubkey_string);

        case 22:
          _iteratorNormalCompletion = true;
          _context3.next = 14;
          break;

        case 25:
          _context3.next = 31;
          break;

        case 27:
          _context3.prev = 27;
          _context3.t0 = _context3['catch'](12);
          _didIteratorError = true;
          _iteratorError = _context3.t0;

        case 31:
          _context3.prev = 31;
          _context3.prev = 32;

          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }

        case 34:
          _context3.prev = 34;

          if (!_didIteratorError) {
            _context3.next = 37;
            break;
          }

          throw _iteratorError;

        case 37:
          return _context3.finish(34);

        case 38:
          return _context3.finish(31);

        case 39:
          // console.info("transaction",transaction);
          //Contract authentication
          try {
            app_keys = store.rootGetters["PrivateKeyStore/app_keys"];

            if (app_keys.length && transaction.operations[0][0] == 35) //app_keys只作用于合约调用
              app_keys.forEach(function (app_key) {
                app_key = _bcxjsCores.PrivateKey.fromWif(app_key);
                transaction.add_signer(app_key, app_key.toPublicKey().toPublicKeyString());
              });
          } catch (e) {}

        case 40:
        case 'end':
          return _context3.stop();
      }
    }
  }, null, undefined, [[12, 27, 31, 39], [32,, 34, 38]]);
};

var buildOperationsAndBroadcast = function _callee4(transaction, store, opObjects) {
  var res;
  return _regenerator2.default.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 2;
          return _regenerator2.default.awrap(signTransaction(transaction, store));

        case 2:
          _context4.next = 4;
          return _regenerator2.default.awrap(transaction.update_head_block());

        case 4:
          _context4.next = 6;
          return _regenerator2.default.awrap(transaction.broadcast());

        case 6:
          res = _context4.sent;
          return _context4.abrupt('return', res);

        case 8:
        case 'end':
          return _context4.stop();
      }
    }
  }, null, undefined);
};

var process_transaction = function process_transaction(transaction, store, opObjects) {
  return new _promise2.default(function _callee5(resolve) {
    var broadcastTimeout, transactionResData, _error;

    return _regenerator2.default.async(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            broadcastTimeout = setTimeout(function () {
              resolve({ success: false, error: { message: 'Expiry of the transaction' }, code: 119 });
            }, _bcxjsWs.ChainConfig.expire_in_secs * 2000);
            _context5.prev = 1;
            _context5.next = 4;
            return _regenerator2.default.awrap(buildOperationsAndBroadcast(transaction, store, opObjects));

          case 4:
            transactionResData = _context5.sent;

            clearTimeout(broadcastTimeout);
            resolve({ success: true, data: transactionResData, code: 1 });

            _context5.next = 15;
            break;

          case 9:
            _context5.prev = 9;
            _context5.t0 = _context5['catch'](1);
            _error = {
              message: _context5.t0
            };

            try {
              _context5.t0 = _context5.t0.message.match(/@@.*@@/)[0].replace(/@@/g, "");
              _error = JSON.parse(_context5.t0);
              // if(_error.message.indexOf(' -delta: Insufficient Balance: ')>=0){
              //   let {a,b,r}=_error.data.stack[0].data;
              //   _error.message="Insufficient Balance for the fee of "+r+;//balance after current operation: "+b+",
              // }
            } catch (e) {
              _error = {
                message: _context5.t0.message
              };
            }
            clearTimeout(broadcastTimeout);
            resolve({ success: false, error: _error, code: 0 });

          case 15:
          case 'end':
            return _context5.stop();
        }
      }
    }, null, undefined, [[1, 9]]);
  });
};

var transactionOpWorker = function _callee6(fromId, operations, fromAccount, propose_options, store) {
  var opObjects, keys, aes_private, _passwordKey, app_keys, core_asset, $passwordKey, getPrivateKeyPromises, privateKeys;

  return _regenerator2.default.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          if (!process.browser) {
            _context6.next = 26;
            break;
          }

          _context6.next = 3;
          return _regenerator2.default.awrap(buildOPObjects(operations, fromId, fromAccount, store));

        case 3:
          opObjects = _context6.sent;

          if (!(opObjects.success == false)) {
            _context6.next = 6;
            break;
          }

          return _context6.abrupt('return', opObjects);

        case 6:
          keys = store.rootGetters["PrivateKeyStore/keys"];
          aes_private = store.rootGetters["WalletDb/aes_private"];
          _passwordKey = store.rootGetters["WalletDb/_passwordKey"];
          app_keys = store.rootGetters["PrivateKeyStore/app_keys"];
          _context6.next = 12;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch(["1.3.0"], true));

        case 12:
          core_asset = _context6.sent;
          ;

          $passwordKey = {};

          if (!_passwordKey) {
            _context6.next = 19;
            break;
          }

          (0, _keys2.default)(_passwordKey).forEach(function (pubkeyStr) {
            $passwordKey[pubkeyStr] = _passwordKey[pubkeyStr].toWif();
          });
          _context6.next = 25;
          break;

        case 19:
          getPrivateKeyPromises = [];

          (0, _keys2.default)(keys).forEach(function (pubkeyStr) {
            getPrivateKeyPromises.push(store.dispatch("WalletDb/getPrivateKey", pubkeyStr, { root: true }));
          });

          _context6.next = 23;
          return _regenerator2.default.awrap(_promise2.default.all(getPrivateKeyPromises));

        case 23:
          privateKeys = _context6.sent;

          privateKeys.forEach(function (key) {
            $passwordKey[key.toPublicKey().toString()] = key.toWif();
          });

        case 25:
          return _context6.abrupt('return', new _promise2.default(function (resolve) {
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

        case 26:
        case 'end':
          return _context6.stop();
      }
    }
  }, null, undefined);
};

// 2020-05-13 xulin add 加密memo
var oneMomeOp = function _callee7(fromId, operations, fromAccount) {
  var proposeAccountId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "";
  var store = arguments[4];
  var opObjects;
  return _regenerator2.default.async(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.next = 2;
          return _regenerator2.default.awrap(buildOPObjects(operations, proposeAccountId || fromId, fromAccount, store));

        case 2:
          opObjects = _context7.sent;

          opObjects.success = true;
          return _context7.abrupt('return', opObjects);

        case 5:
        case 'end':
          return _context7.stop();
      }
    }
  }, null, undefined);
};

var transactionOp = function _callee8(fromId, operations, fromAccount) {
  var proposeAccountId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "";
  var store = arguments[4];
  var opObjects, transaction, propose_options;
  return _regenerator2.default.async(function _callee8$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _context8.next = 2;
          return _regenerator2.default.awrap(buildOPObjects(operations, proposeAccountId || fromId, fromAccount, store));

        case 2:
          opObjects = _context8.sent;

          if (!(opObjects.code && opObjects.code != 1)) {
            _context8.next = 5;
            break;
          }

          return _context8.abrupt('return', opObjects);

        case 5:
          transaction = new _bcxjsCores.TransactionBuilder();
          // console.info("opObjects",opObjects);

          opObjects.forEach(function (op) {
            transaction.add_type_operation(op.type, op.opObject);
          });
          // let {crontab}=store.rootState.crontab;

          // if(crontab){
          //   await transaction.set_required_fees();
          //   await  transaction.update_head_block();
          //   let {startTime,executeInterval,executeTimes}=crontab;

          //   if(startTime==undefined||executeInterval==undefined||executeTimes==undefined){
          //     return {code:101,message:"Crontab parameter is missing"};
          //   }
          //   startTime=parseInt(startTime);
          //   executeInterval=parseInt(executeInterval);
          //   executeTimes=parseInt(executeTimes);
          //   if(isNaN(startTime)||isNaN(executeInterval)||isNaN(executeTimes)){
          //     return {code:1011,message:"Parameter error"};
          //   }

          //   if(startTime<=0||executeInterval<=0||executeTimes<=0){
          //       return {code:176,message:"Crontab must have parameters greater than 0"}
          //   }

          //   let res=await Apis.instance().db_api().exec("get_objects", [["2.1.0"]]);
          //   let now_time=new Date(res[0].time+"Z").getTime();
          //   let crontab_options={
          //     crontab_creator:fromId,
          //     start_time:Math.floor((now_time+startTime)/1000),//+Number(startTime),
          //     execute_interval:executeInterval,
          //     scheduled_execute_times:executeTimes
          //   }
          //   transaction.crontab(crontab_options)   
          // }

          if (!proposeAccountId) {
            _context8.next = 12;
            break;
          }

          _context8.next = 10;
          return _regenerator2.default.awrap(transaction.update_head_block());

        case 10:
          propose_options = {
            fee_paying_account: fromId
          };

          transaction.propose(propose_options);

        case 12:
          return _context8.abrupt('return', process_transaction(transaction, store, opObjects));

        case 13:
        case 'end':
          return _context8.stop();
      }
    }
  }, null, undefined);
};

var buildOPObjects = function _callee9(operations, fromId, fromAccount, store) {
  var opObjects, opObject, opItem, i, opParams, _opParams$asset_id, asset_id, _opParams$fee_asset_i, fee_asset_id, assetObj, name, data, authority, contractId, functionName, valueList, runTime, pending_orders_fee, price, _opParams$priceAssetI, priceAssetId, price_amount_res, _opItem, op_type, to, _opParams$amount, amount, memo, isEncryption, toAccount, amount_res, memo_key, memo_from_privkey;

  return _regenerator2.default.async(function _callee9$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          opObjects = [];
          opObject = void 0, opItem = void 0;
          i = 0;

        case 3:
          if (!(i < operations.length)) {
            _context9.next = 104;
            break;
          }

          opObject = null;
          opItem = operations[i];
          _context9.prev = 6;
          opParams = opItem.params;
          _opParams$asset_id = opParams.asset_id, asset_id = _opParams$asset_id === undefined ? "1.3.0" : _opParams$asset_id, _opParams$fee_asset_i = opParams.fee_asset_id, fee_asset_id = _opParams$fee_asset_i === undefined ? "1.3.0" : _opParams$fee_asset_i;
          _context9.next = 11;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(asset_id));

        case 11:
          assetObj = _context9.sent;

          if (!(assetObj.code != 1)) {
            _context9.next = 14;
            break;
          }

          return _context9.abrupt('return', assetObj);

        case 14:
          assetObj = assetObj.data;
          _context9.t0 = opItem.type;
          _context9.next = _context9.t0 === "account_update" ? 18 : _context9.t0 === "contract_create" ? 20 : _context9.t0 === "revise_contract" ? 23 : _context9.t0 === "call_contract_function" ? 25 : _context9.t0 === "create_nh_asset_order" ? 28 : _context9.t0 === "limit_order_cancel" ? 43 : _context9.t0 === "vesting_balance_withdraw" ? 45 : 47;
          break;

        case 18:
          if ("action" in opParams) {
            opObject = getUpdateAccountObject(opParams, fromAccount.account);
          } else {
            opObject = opParams.updateObject;
          }
          return _context9.abrupt('break', 47);

        case 20:
          name = opParams.name, data = opParams.data, authority = opParams.authority;

          opObject = {
            owner: fromId,
            name: name,
            data: data,
            contract_authority: authority,
            extensions: []
          };
          return _context9.abrupt('break', 47);

        case 23:
          opObject = (0, _extends3.default)({
            reviser: fromId
          }, opParams, {
            extensions: []
          });
          return _context9.abrupt('break', 47);

        case 25:
          contractId = opParams.contractId, functionName = opParams.functionName, valueList = opParams.valueList, runTime = opParams.runTime;

          opObject = {
            caller: fromId,
            contract_id: contractId,
            function_name: functionName,
            value_list: valueList,
            extensions: []
          };
          return _context9.abrupt('break', 47);

        case 28:
          pending_orders_fee = opParams.pending_orders_fee, price = opParams.price, _opParams$priceAssetI = opParams.priceAssetId, priceAssetId = _opParams$priceAssetI === undefined ? "1.3.0" : _opParams$priceAssetI;
          _context9.next = 31;
          return _regenerator2.default.awrap(_helper2.default.toOpAmount(pending_orders_fee, assetObj));

        case 31:
          pending_orders_fee = _context9.sent;

          if (pending_orders_fee.success) {
            _context9.next = 34;
            break;
          }

          return _context9.abrupt('return', pending_orders_fee);

        case 34:
          opParams.pending_orders_fee = pending_orders_fee.data;

          _context9.next = 37;
          return _regenerator2.default.awrap(_helper2.default.toOpAmount(price, priceAssetId));

        case 37:
          price_amount_res = _context9.sent;

          if (price_amount_res.success) {
            _context9.next = 40;
            break;
          }

          return _context9.abrupt('return', price_amount_res);

        case 40:
          opParams.price = price_amount_res.data;

          opObject = (0, _extends3.default)({
            seller: fromId
          }, opParams);
          return _context9.abrupt('break', 47);

        case 43:
          opObject = {
            fee_paying_account: fromId,
            order: opParams.orderId
          };
          return _context9.abrupt('break', 47);

        case 45:
          opObject = (0, _extends3.default)({
            owner: fromId
          }, opParams);
          return _context9.abrupt('break', 47);

        case 47:
          _opItem = opItem, op_type = _opItem.op_type;

          if (!(typeof op_type != "undefined")) {
            _context9.next = 95;
            break;
          }

          if (!(op_type >= 37 && op_type <= 45 && op_type != 43)) {
            _context9.next = 62;
            break;
          }

          if ("asset_id" in opParams) opParams.asset_id = assetObj.symbol;

          opObject = opParams;
          _context9.t1 = op_type;
          _context9.next = _context9.t1 === 42 ? 55 : _context9.t1 === 39 ? 57 : 59;
          break;

        case 55:
          opObject.from = fromId;
          return _context9.abrupt('break', 60);

        case 57:
          opObject.related_account = fromId;
          return _context9.abrupt('break', 60);

        case 59:
          opObject.fee_paying_account = fromId;

        case 60:
          _context9.next = 95;
          break;

        case 62:
          if (!(op_type == 0 || op_type == 13)) {
            _context9.next = 94;
            break;
          }

          to = opParams.to, _opParams$amount = opParams.amount, amount = _opParams$amount === undefined ? 0 : _opParams$amount, memo = opParams.memo, isEncryption = opParams.isEncryption;
          _context9.next = 66;
          return _regenerator2.default.awrap((0, _account.getUser)(to));

        case 66:
          toAccount = _context9.sent;

          if (toAccount.success) {
            _context9.next = 69;
            break;
          }

          return _context9.abrupt('return', { success: false, error: 'Account receivable does not exist', code: 116 });

        case 69:
          _context9.next = 71;
          return _regenerator2.default.awrap(_helper2.default.toOpAmount(amount, assetObj));

        case 71:
          amount_res = _context9.sent;

          if (amount_res.success) {
            _context9.next = 74;
            break;
          }

          return _context9.abrupt('return', amount_res);

        case 74:
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
            _context9.next = 92;
            break;
          }

          if (!isEncryption) {
            _context9.next = 84;
            break;
          }

          memo_key = toAccount.data.account.options.memo_key;
          _context9.next = 82;
          return _regenerator2.default.awrap(store.dispatch("WalletDb/getPrivateKey", fromAccount.account.options.memo_key, { root: true }));

        case 82:
          memo_from_privkey = _context9.sent;

          memo = (0, _utils.encryptMemo)(new Buffer(memo, "utf-8"), memo_from_privkey, memo_key);

        case 84:
          memo.message = memo.message.toString("hex");
          _context9.prev = 85;
          return _context9.abrupt('return', {
            code: 1,
            success: false,
            data: {
              memo: memo
            }
          });

        case 89:
          _context9.prev = 89;
          _context9.t2 = _context9['catch'](85);
          return _context9.abrupt('return', { success: false, error: 'Encrypt memo failed', code: 118 });

        case 92:
          _context9.next = 95;
          break;

        case 94:
          if (!opObject) {
            opObject = opParams;
          }

        case 95:

          opObjects.push({
            type: opItem.type,
            opObject: opObject
          });
          _context9.next = 101;
          break;

        case 98:
          _context9.prev = 98;
          _context9.t3 = _context9['catch'](6);
          return _context9.abrupt('return', {
            success: false,
            error: _context9.t3.message,
            code: 0
          });

        case 101:
          i++;
          _context9.next = 3;
          break;

        case 104:
          return _context9.abrupt('return', opObjects);

        case 105:
        case 'end':
          return _context9.stop();
      }
    }
  }, null, undefined, [[6, 98], [85, 89]]);
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

exports.default = { oneMomeOp: oneMomeOp, transactionOp: transactionOp, transactionOpWorker: transactionOpWorker, signString: signString, checkingSignString: checkingSignString };