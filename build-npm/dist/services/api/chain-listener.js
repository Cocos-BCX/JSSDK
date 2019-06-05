'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _bcxjsWs = require('bcxjs-ws');

var _bcxjsCores = require('bcxjs-cores');

var _api = require('../api');

var _api2 = _interopRequireDefault(_api);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Subscribe to updates from bcxjs-ws
 */

var ChainListener = function () {
  function ChainListener() {
    (0, _classCallCheck3.default)(this, ChainListener);

    this._subscribers = [];
    this._enabled = false;
    this.isCallbackOk = true;
    this.exist_block_num = 0;
    this.sub_max_ops = 13;
    this.real_sub = true;
  }

  (0, _createClass3.default)(ChainListener, [{
    key: 'enable',
    value: function enable() {
      return _regenerator2.default.async(function enable$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _bcxjsCores.ChainStore.setCustomSubscribeCallback(this._mainCallback.bind(this));
              this._enabled = true;

            case 2:
            case 'end':
              return _context.stop();
          }
        }
      }, null, this);
    }
  }, {
    key: 'disable',
    value: function disable() {
      var _this = this;

      return _bcxjsWs.Apis.instance().db_api().exec('cancel_all_subscriptions', []).then(function () {
        _this._enabled = false;
      });
    }
  }, {
    key: 'addSubscription',
    value: function addSubscription(subscription) {
      var userId = "";
      if (subscription.type == "userOperation") {
        userId = subscription._userId;
      }
      this._deleteSubscription(subscription.type, userId);

      this._subscribers.push(subscription);
      return true;
    }
  }, {
    key: '_deleteSubscription',
    value: function _deleteSubscription(type, userId) {
      if (!type) {
        this._subscribers = [];
        return { code: 1 };
      }
      this._subscribers = this._subscribers.filter(function (item) {
        if (userId) {
          return item._userId != userId;
        } else {
          return item.type != type;
        }
      });
      return { code: 1 };
    }
  }, {
    key: '_mainCallback',
    value: function _mainCallback(data) {
      var _this2 = this;

      // console.info("this.real_sub",this.real_sub);  
      if (this.real_sub) {
        data[0].forEach(function (operation) {
          _this2._subscribers.forEach(function (subscriber) {
            if (subscriber.type == "BlocksOp" && operation.id == "2.1.0") {
              operation.block_num = operation.block_height = operation.head_block_number;
              operation.block_id = operation.head_block_id;
              subscriber.notify(operation, false);
            }
            subscriber.notify(operation);
          });
        });
        return;
      }

      if (!this._subscribers.length) return;
      data[0].forEach(function (operation) {

        if (operation && operation.id == "2.1.0") {
          var head_block_number = operation.head_block_number;


          if (head_block_number <= _this2.exist_block_num) return;

          _this2.exist_block_num = head_block_number;
          //If the subscription has only one subscription block and does not request a transaction
          if (_this2._subscribers.length == 1 && _this2._subscribers[0].type == "BlocksOp" && !_this2._subscribers[0].isReqTrx) {
            _this2._subscribers[0].notify(operation, false);
            return;
          }

          _api2.default.Operations.getBlock(head_block_number).then(function (res) {
            if (res.code == 1) {
              res.data.block_num = head_block_number;
              res.data.block_id = operation.head_block_id;
              _this2._subscribers.forEach(function (subscriber) {
                subscriber.notify(JSON.parse((0, _stringify2.default)(res.data)), true);
              });

              var opCount = 0; //op counts
              //Traversing trx
              res.data.transactions.some(function (trx, trx_index) {
                //Traversing OP Account record
                trx[1].operations.forEach(function (op, op_index) {
                  _this2._subscribers.forEach(function (subscriber) {
                    subscriber.notify({
                      block_num: head_block_number,
                      id: head_block_number + "." + trx_index + "." + op_index,
                      op: op,
                      result: trx[1].operation_results[op_index]
                    });
                  });
                });
                opCount += trx[1].operations.length;
                if (opCount > _this2.sub_max_ops) {
                  trx[1].operations.length = _this2.sub_max_ops;
                  return true;
                }
              });
            }
            // subscriber.notify(operation);
          });
        }
      });
      //this.isCallbackOk=true;
    }
  }]);
  return ChainListener;
}();

exports.default = new ChainListener();