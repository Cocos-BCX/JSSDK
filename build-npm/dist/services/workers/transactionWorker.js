'use strict';

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bcxjsCores = require('bcxjs-cores');

var _bcxjsWs = require('bcxjs-ws');

var _helper = require('../../lib/common/helper');

var _helper2 = _interopRequireDefault(_helper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

onmessage = function onmessage(event) {
  var _this = this;

  try {
    console.log("transactionWorkers start");
    var _event_data = event.data;
    var _event$data = event.data,
        opObjects = _event$data.opObjects,
        propose_options = _event$data.propose_options,
        core_asset = _event$data.core_asset,
        onlyGetOPFee = _event$data.onlyGetOPFee,
        url = _event$data.url,
        networks = _event$data.networks,
        fromId = _event$data.fromId;

    _bcxjsWs.ChainConfig.networks = networks;
    _bcxjsWs.Apis.instance(url, true, 4000, undefined, function () {
      console.log("transactionWorker rpc close");
      // postMessage({ success: false, error:{message:"The network is busy, please check your network connection"},code:102});
    }).init_promise.then(function _callee() {
      var transaction, res;
      return _regenerator2.default.async(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _bcxjsWs.Apis.setAutoReconnect(false);
              transaction = new _bcxjsCores.TransactionBuilder();
              _context.next = 4;
              return _regenerator2.default.awrap(transactionOp(transaction));

            case 4:
              res = _context.sent;

              postMessage(res);

              _bcxjsWs.Apis.setRpcConnectionStatusCallback(null);
              _bcxjsWs.Apis.close();

            case 8:
            case 'end':
              return _context.stop();
          }
        }
      }, null, _this);
    }).catch(function (error) {
      console.info("error:::::", error);
      postMessage({ success: false, error: { message: "The network is busy, please check your network connection" }, code: 102 });
    });

    var transactionOp = function _callee2(transaction) {
      return _regenerator2.default.async(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              opObjects.forEach(function (op) {
                transaction.add_type_operation(op.type, op.opObject);
              });

              if (!propose_options) {
                _context2.next = 8;
                break;
              }

              _context2.next = 4;
              return _regenerator2.default.awrap(transaction.set_required_fees());

            case 4:
              propose_options.fee_paying_account = fromId;
              _context2.next = 7;
              return _regenerator2.default.awrap(transaction.update_head_block());

            case 7:
              transaction.propose(propose_options);

            case 8:
              if (!(transaction.success == false)) {
                _context2.next = 10;
                break;
              }

              return _context2.abrupt('return', transaction);

            case 10:
              return _context2.abrupt('return', process_transaction(transaction));

            case 11:
            case 'end':
              return _context2.stop();
          }
        }
      }, null, _this);
    };

    var process_transaction = function process_transaction(transaction) {
      return new _promise2.default(function (resolve) {
        var broadcastTimeout = setTimeout(function () {
          resolve({ success: false, error: { message: 'Expiry of the transaction' }, code: 119 });
        }, _bcxjsWs.ChainConfig.expire_in_secs * 2000);

        buildOperationsAndBroadcast(transaction).then(function (transactionResData) {
          clearTimeout(broadcastTimeout);
          resolve({ success: true, data: transactionResData, code: 1 });
        }).catch(function (error) {
          console.info("error", error);
          doError(error);
        });

        var doError = function doError(error) {
          var _error = {
            message: error
          };
          try {
            error = error.message.match(/@@.*@@/)[0].replace(/@@/g, "");
            _error = JSON.parse(error);
          } catch (e) {
            _error = {
              message: error.message
            };
          }
          clearTimeout(broadcastTimeout);
          resolve({ success: false, error: _error, code: 0 });
        };
      });
    };

    var buildOperationsAndBroadcast = function _callee3(transaction) {
      var feeObj, feeAsset, res;
      return _regenerator2.default.async(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return _regenerator2.default.awrap(signTransaction(transaction));

            case 2:
              _context3.next = 4;
              return _regenerator2.default.awrap(transaction.update_head_block());

            case 4:
              _context3.next = 6;
              return _regenerator2.default.awrap(transaction.set_required_fees());

            case 6:
              if (!onlyGetOPFee) {
                _context3.next = 13;
                break;
              }

              feeObj = transaction.operations[0][1].fee;
              _context3.next = 10;
              return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('get_objects', [[feeObj.asset_id]]));

            case 10:
              feeAsset = _context3.sent;

              feeAsset = feeAsset[0];
              return _context3.abrupt('return', {
                fee_amount: _helper2.default.getFullNum(feeObj.amount / Math.pow(10, feeAsset.precision)),
                fee_symbol: feeAsset.symbol
              });

            case 13:
              _context3.next = 15;
              return _regenerator2.default.awrap(transaction.broadcast());

            case 15:
              res = _context3.sent;
              return _context3.abrupt('return', res);

            case 17:
            case 'end':
              return _context3.stop();
          }
        }
      }, null, _this);
    };

    var signTransaction = function _callee4(transaction) {
      var _ref, pubkeys, addys, my_pubkeys, required_pubkeys, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, pubkey_string, private_key, app_keys;

      return _regenerator2.default.async(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return _regenerator2.default.awrap(transaction.get_potential_signatures());

            case 2:
              _ref = _context4.sent;
              pubkeys = _ref.pubkeys;
              addys = _ref.addys;
              my_pubkeys = PrivateKeyStore.getPubkeys_having_PrivateKey(pubkeys, addys);
              _context4.next = 8;
              return _regenerator2.default.awrap(transaction.get_required_signatures(my_pubkeys));

            case 8:
              required_pubkeys = _context4.sent;
              _iteratorNormalCompletion = true;
              _didIteratorError = false;
              _iteratorError = undefined;
              _context4.prev = 12;
              _iterator = (0, _getIterator3.default)(required_pubkeys);

            case 14:
              if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                _context4.next = 23;
                break;
              }

              pubkey_string = _step.value;
              private_key = WalletDb.getPrivateKey(pubkey_string);

              if (private_key) {
                _context4.next = 19;
                break;
              }

              throw new Error("Missing signing key for " + pubkey_string);

            case 19:

              transaction.add_signer(private_key, pubkey_string);

            case 20:
              _iteratorNormalCompletion = true;
              _context4.next = 14;
              break;

            case 23:
              _context4.next = 29;
              break;

            case 25:
              _context4.prev = 25;
              _context4.t0 = _context4['catch'](12);
              _didIteratorError = true;
              _iteratorError = _context4.t0;

            case 29:
              _context4.prev = 29;
              _context4.prev = 30;

              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }

            case 32:
              _context4.prev = 32;

              if (!_didIteratorError) {
                _context4.next = 35;
                break;
              }

              throw _iteratorError;

            case 35:
              return _context4.finish(32);

            case 36:
              return _context4.finish(29);

            case 37:
              //contract authentication. United Labs of BCTech.
              try {
                app_keys = _event_data.app_keys;

                app_keys.forEach(function (app_key) {
                  app_key = _bcxjsCores.PrivateKey.fromWif(app_key);
                  transaction.add_signer(app_key, app_key.toPublicKey().toPublicKeyString());
                });
              } catch (e) {}

            case 38:
            case 'end':
              return _context4.stop();
          }
        }
      }, null, _this, [[12, 25, 29, 37], [30,, 32, 36]]);
    };

    var PrivateKeyStore = {
      getPubkeys_having_PrivateKey: function getPubkeys_having_PrivateKey(pubkeys) {
        var addys = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        var _pubkeys = [];
        if (pubkeys) {
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = (0, _getIterator3.default)(pubkeys), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var pubkey = _step2.value;

              if (_event_data.keys[pubkey]) {
                _pubkeys.push(pubkey);
              }
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }
        }
        return _pubkeys;
      },
      getTcomb_byPubkey: function getTcomb_byPubkey(public_key) {
        return function (public_key) {
          if (!public_key) return null;
          if (public_key.Q) public_key = public_key.toPublicKeyString();
          return _event_data.keys[public_key];
        };
      }
    };

    var WalletDb = {
      getPrivateKey: function getPrivateKey(public_key) {
        var _passwordKey = _event_data._passwordKey;
        if (_passwordKey) return _bcxjsCores.PrivateKey.fromWif(_passwordKey[public_key]);
        if (!public_key) return null;
        if (public_key.Q) public_key = public_key.toPublicKeyString();
        var private_key_tcomb = PrivateKeyStore.getTcomb_byPubkey(public_key);
        if (!private_key_tcomb) return null;
        return this.decryptTcomb_PrivateKey(private_key_tcomb);
      },

      decryptTcomb_PrivateKey: function decryptTcomb_PrivateKey(private_key_tcomb) {
        var aes_private = _event_data.aes_private,
            _passwordKey = _event_data._passwordKey;

        if (!private_key_tcomb) return null;
        // if(getters.isLocked) return "";//throw new Error("wallet locked")
        if (_passwordKey && _passwordKey[private_key_tcomb.pubkey]) {
          return _passwordKey[private_key_tcomb.pubkey];
        }
        var private_key_hex = aes_private.decryptHex(private_key_tcomb.encrypted_key);
        return _bcxjsCores.PrivateKey.fromBuffer(new Buffer(private_key_hex, 'hex'));
      }
    };
  } catch (e) {
    console.error("transactionWorkers", e);
  }
};