'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bcxjsWs = require('bcxjs-ws');

var _utils2 = require('../../utils');

var utils = _interopRequireWildcard(_utils2);

var _chainListener = require('./chain-listener');

var _chainListener2 = _interopRequireDefault(_chainListener);

var _subscriptions = require('./subscriptions');

var _subscriptions2 = _interopRequireDefault(_subscriptions);

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

var _MarketClasses = require('../../lib/common/MarketClasses');

var _bcxjsCores = require('bcxjs-cores');

var _utils3 = require('../../lib/common/utils');

var _utils4 = _interopRequireDefault(_utils3);

var _market_utils = require('../../lib/common/market_utils');

var _market_utils2 = _interopRequireDefault(_market_utils);

var _api = require('../api');

var _api2 = _interopRequireDefault(_api);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var operations = _bcxjsCores.ChainTypes.operations;

var nullPrice = {
  getPrice: function getPrice() {
    return 0;
  },
  sellPrice: function sellPrice() {
    return 0;
  }
};

var findOrder = function findOrder(orderId) {
  return function (order) {
    return orderId === order.id;
  };
};

var calcOrderRate = function calcOrderRate(order) {
  var _order$sell_price = order.sell_price,
      quoteAmount = _order$sell_price.quote.amount,
      baseAmount = _order$sell_price.base.amount;

  return baseAmount / quoteAmount;
};

var loadLimitOrders = function _callee(baseId, quoteId) {
  var limit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 500;
  var orders, buyOrders, sellOrders;
  return _regenerator2.default.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('get_limit_orders', [baseId, quoteId, limit]));

        case 2:
          orders = _context.sent;
          buyOrders = [];
          sellOrders = [];

          orders.forEach(function (order) {
            if (order.sell_price.base.asset_id === baseId) {
              buyOrders.push(order);
            } else {
              sellOrders.push(order);
            }
          });
          return _context.abrupt('return', { buyOrders: buyOrders, sellOrders: sellOrders });

        case 7:
        case 'end':
          return _context.stop();
      }
    }
  }, null, undefined);
};

var _marketAddSubscription = false;

var Market = function () {
  function Market() {
    var base = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "1.3.0";
    (0, _classCallCheck3.default)(this, Market);

    this.base = base;
    this.markets = {};
    this.fee = 578;
    this.marketData = {};
    this.marketLimitOrders = _immutable2.default.Map();
    this.marketCallOrders = _immutable2.default.Map();
    this.activeMarketHistory = _immutable2.default.OrderedSet();

    // const marketsSubscription = new Subscriptions.Markets({
    //   callback: this.onMarketUpdate.bind(this)
    // });
    // console.info("marketsSubscription",marketsSubscription);
    // listener.addSubscription(marketsSubscription);
  }

  (0, _createClass3.default)(Market, [{
    key: 'getFee',
    value: function getFee() {
      return this.fee;
    }
  }, {
    key: 'getCallback',
    value: function getCallback(pays, receives) {
      if (pays === this.base) {
        if (this.isSubscribed(receives)) {
          return this.markets[receives].callback;
        }
      }
      if (receives === this.base) {
        if (this.isSubscribed(pays)) {
          return this.markets[pays].callback;
        }
      }
      return false;
    }
  }, {
    key: 'getOrdersArray',
    value: function getOrdersArray(pays, receives) {
      if (pays === this.base) {
        if (this.isSubscribed(receives)) {
          return this.markets[receives].orders.buy;
        }
      }
      if (receives === this.base) {
        if (this.isSubscribed(pays)) {
          return this.markets[pays].orders.sell;
        }
      }
      return false;
    }
  }, {
    key: 'onMarketUpdate',
    value: function onMarketUpdate(type, object) {
      var _this = this;

      var assetId = this.quoteAsset.get("id");
      clearTimeout(this.marketUpdateTimer);
      this.marketUpdateTimer = setTimeout(function () {
        _this.subscribeToMarket(assetId);
      }, 300);
    }
  }, {
    key: 'onOrderDelete',
    value: function onOrderDelete(notification) {
      var _this2 = this;

      (0, _keys2.default)(this.markets).forEach(function (market) {
        (0, _keys2.default)(_this2.markets[market].orders).forEach(function (type) {
          var idx = _this2.markets[market].orders[type].findIndex(findOrder(notification));
          if (idx >= 0) {
            _this2.markets[market].orders[type].splice(idx, 1);
            _this2.markets[market].callback('DELETE ORDER');
          }
        });
      });
    }
  }, {
    key: 'onNewLimitOrder',
    value: function onNewLimitOrder(order) {
      var _order$sell_price2 = order.sell_price,
          pays = _order$sell_price2.base.asset_id,
          receives = _order$sell_price2.quote.asset_id;


      var orders = this.getOrdersArray(pays, receives);

      if (orders) {
        orders.push(order);
        var callback = this.getCallback(pays, receives);
        callback('ADD ORDER');
      }
    }
  }, {
    key: 'onOrderFill',
    value: function onOrderFill(data) {
      var _data$op$ = data.op[1],
          orderId = _data$op$.order_id,
          _data$op$$pays = _data$op$.pays,
          amount = _data$op$$pays.amount,
          pays = _data$op$$pays.asset_id,
          receives = _data$op$.receives.asset_id;


      var orders = this.getOrdersArray(pays, receives);

      if (orders) {
        var idx = orders.findIndex(findOrder(orderId));
        if (idx !== -1) {
          orders[idx].for_sale -= amount;
          var callback = this.getCallback(pays, receives);
          callback('FILL ORDER');
        }
      }
    }
  }, {
    key: 'isSubscribed',
    value: function isSubscribed(assetId) {
      return this.markets[assetId] !== undefined;
    }
  }, {
    key: 'setDefaultObjects',
    value: function setDefaultObjects(assetId) {
      if (!this.markets[assetId]) {
        this.markets[assetId] = {
          orders: {
            buy: [], sell: []
          },
          callback: function callback() {}
        };
      }
    }
  }, {
    key: 'subscribeToMarket',
    value: function subscribeToMarket(assetId, callback) {
      var _this3 = this,
          _assets;

      var _ref, buyOrders, sellOrders, history, assets;

      return _regenerator2.default.async(function subscribeToMarket$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              if (!(assetId === this.base)) {
                _context3.next = 2;
                break;
              }

              return _context3.abrupt('return');

            case 2:
              _context3.next = 4;
              return _regenerator2.default.awrap(loadLimitOrders(this.base, assetId));

            case 4:
              _ref = _context3.sent;
              buyOrders = _ref.buyOrders;
              sellOrders = _ref.sellOrders;


              if (!this.markets[assetId]) {
                this.setDefaultObjects(assetId);
                this.markets[assetId].callback = callback;
              }

              // console.log('setting default: ' + assetId + ' : ', this.markets[assetId]);
              this.markets[assetId].orders.buy = buyOrders;
              this.markets[assetId].orders.sell = sellOrders;

              this.marketData = this.markets[assetId];
              this.marketData.limits = buyOrders.concat(sellOrders);
              _context3.next = 14;
              return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().history_api().exec("get_fill_order_history", [this.base, assetId, 200]));

            case 14:
              this.marketData.history = _context3.sent;

              if (!(this.hasMyTradeHistory && this.currentAccount)) {
                _context3.next = 22;
                break;
              }

              _context3.next = 18;
              return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().history_api().exec('get_account_history', [this.currentAccount.account.id, '1.11.0', 100, '1.11.0']));

            case 18:
              history = _context3.sent;
              _context3.next = 21;
              return _regenerator2.default.awrap(_promise2.default.all(history.map(function _callee2(item) {
                var block_res;
                return _regenerator2.default.async(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        _context2.next = 2;
                        return _regenerator2.default.awrap(_api2.default.Operations.get_block_header(item.block_num));

                      case 2:
                        block_res = _context2.sent;

                        if (block_res.code == 1) {
                          item.block_time = new Date(block_res.data.timestamp + "Z").format("yyyy/MM/dd HH:mm:ss");
                        }
                        return _context2.abrupt('return', item);

                      case 5:
                      case 'end':
                        return _context2.stop();
                    }
                  }
                }, null, _this3);
              })));

            case 21:
              this.currentAccount.history = _context3.sent;

            case 22:

              this.marketData.history.forEach(function (order) {
                order.op.time = order.time;
                _this3.activeMarketHistory = _this3.activeMarketHistory.add(order.op);
              });
              assets = (_assets = {}, (0, _defineProperty3.default)(_assets, this.quoteAsset.get("id"), { precision: this.quoteAsset.get("precision") }), (0, _defineProperty3.default)(_assets, this.baseAsset.get("id"), { precision: this.baseAsset.get("precision") }), _assets);

              this.marketLimitOrders = _immutable2.default.Map();
              this._marketLimitOrders = _immutable2.default.Map();
              this.marketData.limits.forEach(function (order) {
                _bcxjsCores.ChainStore._updateObject(order, false, false);
                if (typeof order.for_sale !== "number") {
                  order.for_sale = parseInt(order.for_sale, 10);
                }
                order.expiration = new Date(order.expiration);
                _this3.marketLimitOrders = _this3.marketLimitOrders.set(order.id, new _MarketClasses.LimitOrder(order, assets, assetId));
                _this3._marketLimitOrders = _this3._marketLimitOrders.set(order.id, new _MarketClasses.LimitOrder(order, assets, assetId));
              });
              this._orderBook();
              this.markets[assetId].callback && this.markets[assetId].callback();

            case 29:
            case 'end':
              return _context3.stop();
          }
        }
      }, null, this);
    }
  }, {
    key: '_orderBook',
    value: function _orderBook() {
      var limitsChanged = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      var callsChanged = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      // Loop over limit orders and return array containing bids
      var constructBids = function constructBids(orderArray) {
        var bids = orderArray.filter(function (a) {
          return a.isBid();
        }).sort(function (a, b) {
          return a.getPrice() - b.getPrice();
        }).map(function (order) {
          return order;
        }).toArray();

        // Sum bids at same price
        if (bids.length > 1) {
          for (var i = bids.length - 2; i >= 0; i--) {
            if (bids[i].getPrice() === bids[i + 1].getPrice()) {
              bids[i].sum(bids[i + 1]);
              bids.splice(i + 1, 1);
            }
          }
        }
        return bids;
      };
      // Loop over limit orders and return array containing asks
      var constructAsks = function constructAsks(orderArray) {
        var asks = orderArray.filter(function (a) {
          return !a.isBid();
        }).sort(function (a, b) {
          return a.getPrice() - b.getPrice();
        }).map(function (order) {
          return order;
        }).toArray();
        // Sum asks at same price
        if (asks.length > 1) {
          for (var i = asks.length - 2; i >= 0; i--) {
            if (asks[i].getPrice() === asks[i + 1].getPrice()) {
              asks[i].sum(asks[i + 1]);
              asks.splice(i + 1, 1);
            }
          }
        }
        return asks;
      };

      // Assign to store variables
      if (limitsChanged) {
        // console.time("Construct limit orders " + this.activeMarket);
        this.marketData.bids = constructBids(this.marketLimitOrders);
        this.marketData.asks = constructAsks(this.marketLimitOrders);
        if (!callsChanged) {
          this._combineOrders();
        }
        // console.timeEnd("Construct limit orders " + this.activeMarket);
      }

      if (callsChanged) {
        // console.time("Construct calls " + this.activeMarket);
        this.marketData.calls = this.constructCalls(this.marketCallOrders);
        this._combineOrders();
        // console.timeEnd("Construct calls " + this.activeMarket);
      }
      // console.log("time to construct orderbook:", new Date() - orderBookStart, "ms");
    }
  }, {
    key: 'constructCalls',
    value: function constructCalls(callsArray) {
      var _this4 = this;

      var calls = [];
      if (callsArray.size) {
        calls = callsArray.sort(function (a, b) {
          return a.getPrice() - b.getPrice();
        }).map(function (order) {
          if (_this4.invertedCalls) {
            _this4.lowestCallPrice = !_this4.lowestCallPrice ? order.getPrice(false) : Math.max(_this4.lowestCallPrice, order.getPrice(false));
          } else {
            _this4.lowestCallPrice = !_this4.lowestCallPrice ? order.getPrice(false) : Math.min(_this4.lowestCallPrice, order.getPrice(false));
          }

          return order;
        }).toArray();

        // Sum calls at same price
        if (calls.length > 1) {
          for (var i = calls.length - 2; i >= 0; i--) {
            calls[i] = calls[i].sum(calls[i + 1]);
            calls.splice(i + 1, 1);
          }
        }
      }
      return calls;
    }
  }, {
    key: 'unsubscribeFromMarket',
    value: function unsubscribeFromMarket(assetId) {
      if (this.isSubscribed(assetId)) {
        delete this.markets[assetId];
      }
    }
  }, {
    key: 'unsubscribeFromExchangeRate',
    value: function unsubscribeFromExchangeRate(assetId) {
      this.unsubscribeFromMarket(assetId);
    }
  }, {
    key: 'unsubscribeFromMarkets',
    value: function unsubscribeFromMarkets() {
      this.markets = {};
    }
  }, {
    key: 'subscribeToExchangeRate',
    value: function subscribeToExchangeRate(trxPair, currentAccount, hasMyTradeHistory, callback) {
      var _this5 = this;

      var asset_ress, assetId, canReceiveInBasePrev, wrappedCallback;
      return _regenerator2.default.async(function subscribeToExchangeRate$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              this.currentAccount = currentAccount;
              this.hasMyTradeHistory = hasMyTradeHistory;
              trxPair = trxPair.split("_");
              _context4.next = 5;
              return _regenerator2.default.awrap(_promise2.default.all(trxPair.map(function (asset, index) {
                return _api2.default.Assets.fetch_asset_one(asset);
              })));

            case 5:
              asset_ress = _context4.sent;

              if (!(asset_ress[0].code != 1)) {
                _context4.next = 9;
                break;
              }

              callback && callback(asset_ress[0]);
              return _context4.abrupt('return');

            case 9:
              if (!(asset_ress[1].code != 1)) {
                _context4.next = 12;
                break;
              }

              callback && callback(asset_ress[1]);
              return _context4.abrupt('return');

            case 12:
              this.quoteAsset = _immutable2.default.fromJS(asset_ress[0].data);
              this.baseAsset = _immutable2.default.fromJS(asset_ress[1].data);
              this.base = this.baseAsset.get("id");
              assetId = this.quoteAsset.get("id");


              this.amount = currentAccount && currentAccount.balances[assetId] ? currentAccount.balances[assetId].balance : 0;

              canReceiveInBasePrev = 0;

              this.firstCallSub = true;

              wrappedCallback = function wrappedCallback() {
                var canReceiveInBase = _this5.calcExchangeRate(assetId, 'sell', _this5.amount);
                if (canReceiveInBase !== canReceiveInBasePrev && canReceiveInBase > 0) {
                  canReceiveInBasePrev = canReceiveInBase;
                }

                var _marketData = _this5.marketData,
                    combinedBids = _marketData.combinedBids,
                    combinedAsks = _marketData.combinedAsks;

                var _marketsData = {
                  orders: {
                    buy: _this5.ordersToObject(combinedBids),
                    sell: _this5.ordersToObject(combinedAsks)
                  },
                  my_orders: _this5.currentAccount ? _this5.getMyOrders() : [],
                  last_trade_history: _this5.getTradeHistory()
                  //_marketsData.my_last_trade_history=
                };_this5.getMyHistory().then(function (data) {
                  _marketsData.my_last_trade_history = data;
                  callback({ code: 1, data: _marketsData }, assetId, canReceiveInBase, _this5.firstCallSub);
                  _this5.firstCallSub = false;
                });
              };

              _context4.next = 22;
              return _regenerator2.default.awrap(this.subscribeToMarket(assetId, wrappedCallback));

            case 22:
            case 'end':
              return _context4.stop();
          }
        }
      }, null, this);
    }
  }, {
    key: 'getMyHistory',
    value: function getMyHistory() {
      var _this6 = this;

      var keyIndex, flipped, ApiObject, ApiObjectDyn;
      return _regenerator2.default.async(function getMyHistory$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              if (!(!this.hasMyTradeHistory || !this.currentAccount)) {
                _context6.next = 2;
                break;
              }

              return _context6.abrupt('return', []);

            case 2:
              keyIndex = -1;
              flipped = this.baseAsset.get("id").split(".")[2] > this.quoteAsset.get("id").split(".")[2];
              _context6.next = 6;
              return _regenerator2.default.awrap(_api2.default.Explorer.getGlobalObject());

            case 6:
              _context6.t0 = _context6.sent.data;
              ApiObject = [_context6.t0];
              _context6.next = 10;
              return _regenerator2.default.awrap(_api2.default.Explorer.getDynGlobalObject(false));

            case 10:
              _context6.t1 = _context6.sent.data;
              ApiObjectDyn = [_context6.t1];
              return _context6.abrupt('return', _promise2.default.all(_immutable2.default.fromJS(this.currentAccount.history).filter(function (a) {
                var opType = a.getIn(["op", 0]);
                return opType === operations.fill_order;
              }).filter(function (a) {
                var quoteID = _this6.quoteAsset.get("id");
                var baseID = _this6.baseAsset.get("id");
                var pays = a.getIn(["op", 1, "pays", "asset_id"]);
                var receives = a.getIn(["op", 1, "receives", "asset_id"]);
                var hasQuote = quoteID === pays || quoteID === receives;
                var hasBase = baseID === pays || baseID === receives;
                return hasQuote && hasBase;
              }).sort(function (a, b) {
                return a.get("block_num") - a.get("block_num");
              }).map(function _callee3(trx) {
                var order, paysAsset, receivesAsset, isAsk, parsed_order, block_num, price, date, block_res;
                return _regenerator2.default.async(function _callee3$(_context5) {
                  while (1) {
                    switch (_context5.prev = _context5.next) {
                      case 0:
                        order = trx.toJS().op[1];
                        //console.debug('order',trx.toJS());

                        keyIndex++;
                        paysAsset = void 0, receivesAsset = void 0, isAsk = false;

                        if (order.pays.asset_id === _this6.baseAsset.get("id")) {
                          paysAsset = _this6.baseAsset;
                          receivesAsset = _this6.quoteAsset;
                          isAsk = true;
                        } else {
                          paysAsset = _this6.quoteAsset;
                          receivesAsset = _this6.baseAsset;
                        }

                        parsed_order = _market_utils2.default.parse_order_history(order, paysAsset, receivesAsset, isAsk, flipped);
                        block_num = trx.get("block_num");
                        price = parsed_order.int + ".";


                        price += parsed_order.dec || "";
                        price += parsed_order.trailing || "";

                        date = "";
                        _context5.next = 12;
                        return _regenerator2.default.awrap(_api2.default.Operations.get_block_header(block_num));

                      case 12:
                        block_res = _context5.sent;

                        if (block_res.code == 1) {
                          date = new Date(block_res.data.timestamp + "Z").format("yyyy/MM/dd HH:mm:ss");
                        } else {
                          date = _api2.default.Operations._getOperationDate(trx.toJS(), ApiObject, ApiObjectDyn);
                        }

                        return _context5.abrupt('return', {
                          price: price,
                          price_unit: _this6.baseAsset.get("symbol"),
                          amount: _utils4.default.formatNumber(parsed_order.receives, 4),
                          amount_unit: _this6.quoteAsset.get("symbol"),
                          turnover: _utils4.default.formatNumber(parsed_order.pays, 4),
                          turnover_unit: _this6.baseAsset.get("symbol"),
                          block_num: block_num,
                          block_time: date, //trx.get("block_time"),
                          type: parsed_order.className == "orderHistoryBid" ? "buy" : "sell"
                        });

                      case 15:
                      case 'end':
                        return _context5.stop();
                    }
                  }
                }, null, _this6);
              }).toArray()));

            case 13:
            case 'end':
              return _context6.stop();
          }
        }
      }, null, this);
    }
  }, {
    key: 'getTradeHistory',
    value: function getTradeHistory() {
      var _this7 = this;

      var index = 0;
      var keyIndex = -1;
      var flipped = this.baseAsset.get("id").split(".")[2] > this.quoteAsset.get("id").split(".")[2];

      return this.activeMarketHistory.filter(function (a) {
        index++;
        return index % 2 === 0;
      }).take(100).map(function (order) {
        //console.debug('order:',order)
        keyIndex++;
        var paysAsset = void 0,
            receivesAsset = void 0,
            isAsk = false;
        if (order.pays.asset_id === _this7.baseAsset.get("id")) {
          paysAsset = _this7.baseAsset;
          receivesAsset = _this7.quoteAsset;
          isAsk = true;
        } else {
          paysAsset = _this7.quoteAsset;
          receivesAsset = _this7.baseAsset;
        }

        var parsed_order = _market_utils2.default.parse_order_history(order, paysAsset, receivesAsset, isAsk, flipped);
        // let time = parsed_order.time.split(':');
        // if (time.length > 2) {
        //     time = time[0].substr(2) + ':' + time[1];
        // }

        var price = parsed_order.int + ".";

        //if(formattedPrice.full >= 1){
        price += parsed_order.dec || "";
        price += parsed_order.trailing || "";
        //}
        return {
          price: price,
          price_unit: _this7.baseAsset.get("symbol") + "/" + _this7.quoteAsset.get("symbol"),
          amount: _utils4.default.formatNumber(parsed_order.receives, 4),
          amount_unit: _this7.quoteAsset.get("symbol"),
          turnover: _utils4.default.formatNumber(parsed_order.pays, 4),
          turnover_unit: _this7.baseAsset.get("symbol"),
          block_time: parsed_order.time,
          type: parsed_order.className == "orderHistoryBid" ? "buy" : "sell"
        };
      }).toArray();
    }
  }, {
    key: 'getMyOrders',
    value: function getMyOrders() {
      var _this8 = this;

      var buyOrders = this._marketLimitOrders.filter(function (a) {
        return a.seller === _this8.currentAccount.account.id && a.sell_price.quote.asset_id !== _this8.baseAsset.get("id");
      }).sort(function (a, b) {
        var _market_utils$parseOr = _market_utils2.default.parseOrder(a, _this8.baseAsset, _this8.quoteAsset),
            a_price = _market_utils$parseOr.price;

        var _market_utils$parseOr2 = _market_utils2.default.parseOrder(b, _this8.baseAsset, _this8.quoteAsset),
            b_price = _market_utils$parseOr2.price;

        return b_price.full - a_price.full;
      }).toArray().map(function (item) {
        item.type = "buy";
        return item;
      });

      var sellOrders = this._marketLimitOrders.filter(function (a) {
        return a.seller === _this8.currentAccount.account.id && a.sell_price.quote.asset_id === _this8.baseAsset.get("id");
      }).sort(function (a, b) {
        var _market_utils$parseOr3 = _market_utils2.default.parseOrder(a, _this8.baseAsset, _this8.quoteAsset),
            a_price = _market_utils$parseOr3.price;

        var _market_utils$parseOr4 = _market_utils2.default.parseOrder(b, _this8.baseAsset, _this8.quoteAsset),
            b_price = _market_utils$parseOr4.price;

        return a_price.full - b_price.full;
      }).toArray().map(function (item) {
        item.type = "sell";
        return item;
      });

      return this.ordersToObject(buyOrders.concat(sellOrders));
    }
  }, {
    key: 'ordersToObject',
    value: function ordersToObject(orders) {
      var _this9 = this;

      return orders.map(function (order) {
        var isBid = order.isBid();

        var _market_utils$parseOr5 = _market_utils2.default.parseOrder(order, _this9.baseAsset, _this9.quoteAsset),
            price = _market_utils$parseOr5.price;

        var item = {
          order_id: order.id,
          price: _utils4.default.format_number(price.full, _this9.baseAsset.get("precision")),
          price_unit: _this9.baseAsset.get("symbol"),
          amount: _utils4.default.format_number(order[isBid ? "amountToReceive" : "amountForSale"]().getAmount({ real: true }), _this9.quoteAsset.get("precision")),
          amount_unit: _this9.quoteAsset.get("symbol"),
          turnover: _utils4.default.format_number(order[isBid ? "amountForSale" : "amountToReceive"]().getAmount({ real: true }), _this9.baseAsset.get("precision")),
          turnover_unit: _this9.baseAsset.get("symbol"),
          expiration: new Date(order.expiration + "Z").format("yyyy/MM/dd HH:mm:ss")
        };
        if (order.type) {
          item.type = order.type;
        }
        return item;
      });
    }
  }, {
    key: 'calcExchangeRate',
    value: function calcExchangeRate(assetId, weWantTo, amount) {
      var totalPay = amount;
      var totalReceive = 0;

      var requiredType = weWantTo === 'sell' ? 'buy' : 'sell';
      // console.log('cakc exchange rate for ' + assetId + ': ', this.markets[assetId]);
      var orders = [].concat((0, _toConsumableArray3.default)(this.markets[assetId].orders[requiredType])).sort(function (a, b) {
        return calcOrderRate(b) - calcOrderRate(a);
      });
      for (var i = 0; i < orders.length; i += 1) {
        var _orders$i = orders[i],
            saleAmount = _orders$i.for_sale,
            price = _orders$i.sell_price;

        var orderPrice = price.base.amount / price.quote.amount;
        var weCanPayHere = saleAmount / orderPrice;

        if (totalPay > weCanPayHere) {
          totalReceive += saleAmount;
          totalPay -= weCanPayHere;
        } else {
          totalReceive += totalPay * orderPrice;
          break;
        }
      }
      return Math.floor(totalReceive);
    }
  }, {
    key: 'generateOrders',
    value: function generateOrders(_ref2) {
      var _this10 = this;

      var update = _ref2.update,
          balances = _ref2.balances,
          baseBalances = _ref2.baseBalances,
          userId = _ref2.userId;

      var calculated = utils.getValuesToUpdate(balances, baseBalances, update);
      var sellOrders = [];
      var buyOrders = [];

      (0, _keys2.default)(calculated.sell).forEach(function (assetId) {
        var toSell = calculated.sell[assetId];
        // if (!toSell) return;
        var toReceive = _this10.calcExchangeRate(assetId, 'sell', toSell);
        var fee = _this10.getFee(assetId);
        if (toReceive > fee) {
          toReceive -= fee;
          var orderObject = {
            sell: {
              asset_id: assetId,
              amount: toSell
            },
            receive: {
              asset_id: _this10.base,
              amount: toReceive
            },
            userId: userId,
            fillOrKill: true
          };
          var order = utils.createOrder(orderObject);

          sellOrders.push(order);
        }
      });

      (0, _keys2.default)(calculated.buy).forEach(function (assetId) {
        var toSellBase = calculated.buy[assetId];
        var fee = _this10.getFee(assetId);
        if (toSellBase > fee) {
          toSellBase -= fee;
          var toReceive = _this10.calcExchangeRate(assetId, 'buy', toSellBase);
          if (!toReceive) return;
          var orderObject = {
            sell: {
              asset_id: _this10.base,
              amount: toSellBase
            },
            receive: {
              asset_id: assetId,
              amount: toReceive
            },
            userId: userId
          };
          var order = utils.createOrder(orderObject);
          buyOrders.push(order);
        }
      });

      return {
        sellOrders: sellOrders,
        buyOrders: buyOrders
      };
    }
  }, {
    key: '_combineOrders',
    value: function _combineOrders() {
      var hasCalls = !!this.marketCallOrders.size;
      var isBid = hasCalls && this.marketCallOrders.first().isBid();
      if (isBid) {
        this.marketData.combinedBids = this.marketData.bids.concat(this.marketData.calls);
        this.marketData.combinedAsks = this.marketData.asks.concat([]);
      } else {
        this.marketData.combinedBids = this.marketData.bids.concat([]);
        this.marketData.combinedAsks = this.marketData.asks.concat(this.marketData.calls || []);
      }

      var totalToReceive = new _MarketClasses.Asset({
        asset_id: this.quoteAsset.get("id"),
        precision: this.quoteAsset.get("precision")
      });

      var totalForSale = new _MarketClasses.Asset({
        asset_id: this.baseAsset.get("id"),
        precision: this.baseAsset.get("precision")
      });
      this.marketData.combinedBids.sort(function (a, b) {
        return b.getPrice() - a.getPrice();
      }).forEach(function (a) {
        totalToReceive.plus(a.amountToReceive(false));
        totalForSale.plus(a.amountForSale());

        a.setTotalForSale(totalForSale.clone());
        a.setTotalToReceive(totalToReceive.clone());
      });

      totalToReceive = new _MarketClasses.Asset({
        asset_id: this.baseAsset.get("id"),
        precision: this.baseAsset.get("precision")
      });

      totalForSale = new _MarketClasses.Asset({
        asset_id: this.quoteAsset.get("id"),
        precision: this.quoteAsset.get("precision")
      });

      this.marketData.combinedAsks.sort(function (a, b) {
        return b.getPrice() - a.getPrice();
      }).forEach(function (a) {
        totalForSale.plus(a.amountForSale());
        totalToReceive.plus(a.amountToReceive(true));
        a.setTotalForSale(totalForSale.clone());
        a.setTotalToReceive(totalToReceive.clone());
      });

      this.marketData.lowestAsk = !this.marketData.combinedAsks.length ? nullPrice : this.marketData.combinedAsks[0];

      this.marketData.highestBid = !this.marketData.combinedBids.length ? nullPrice : this.marketData.combinedBids[0];
    }
  }]);
  return Market;
}();

exports.default = Market;