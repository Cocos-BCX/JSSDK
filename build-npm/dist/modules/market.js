'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _mutations;

// const GphMarket = API.Market['1.3.0'];


var _vue = require('vue');

var _vue2 = _interopRequireDefault(_vue);

var _mutations2 = require('../mutations');

var types = _interopRequireWildcard(_mutations2);

var _api = require('../services/api');

var _api2 = _interopRequireDefault(_api);

var _market = require('../services/api/market');

var _market2 = _interopRequireDefault(_market);

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

var _market_utils = require('../lib/common/market_utils');

var _market_utils2 = _interopRequireDefault(_market_utils);

var _utils = require('../lib/common/utils');

var _utils2 = _interopRequireDefault(_utils);

var _MarketClasses = require('../lib/common/MarketClasses');

var _bcxjsCores = require('bcxjs-cores');

var _chainListener = require('../services/api/chain-listener');

var _chainListener2 = _interopRequireDefault(_chainListener);

var _subscriptions = require('../services/api/subscriptions');

var _subscriptions2 = _interopRequireDefault(_subscriptions);

var _bcxjsWs = require('bcxjs-ws');

var _helper = require('../lib/common/helper');

var _helper2 = _interopRequireDefault(_helper);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var actions = {
    cancelLimitOrder: function cancelLimitOrder(_ref, _ref2) {
        var dispatch = _ref.dispatch;
        var orderId = _ref2.orderId,
            _ref2$feeAssetId = _ref2.feeAssetId,
            feeAssetId = _ref2$feeAssetId === undefined ? "1.3.0" : _ref2$feeAssetId;

        if (!orderId) {
            return { code: 136, message: "Parameter 'orderId' can not be empty" };
        }
        return dispatch('transactions/_transactionOperations', {
            operations: [{
                op_type: 2,
                type: "limit_order_cancel",
                params: {
                    orderId: orderId,
                    fee_asset_id: feeAssetId
                }
            }]
        }, { root: true });
    },
    queryDebt: function queryDebt(_ref3, params) {
        var rootGetters = _ref3.rootGetters,
            dispatch = _ref3.dispatch;

        var account_id, debtAssetId, collateralAssetId, debt_asset, user_result, currentPosition, base_asset, base_asset_precision, _base_asset, smart_asset_res, _smart_asset_res$data, format_feed_price, format_feed_price_text, current_feed;

        return _regenerator2.default.async(function queryDebt$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        account_id = params.account_id, debtAssetId = params.debtAssetId, collateralAssetId = params.collateralAssetId;
                        _context.next = 3;
                        return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(debtAssetId));

                    case 3:
                        debt_asset = _context.sent;

                        if (!(debt_asset.code != 1)) {
                            _context.next = 6;
                            break;
                        }

                        return _context.abrupt('return', debt_asset);

                    case 6:
                        debtAssetId = debt_asset.data.id;
                        _context.next = 9;
                        return _regenerator2.default.awrap(dispatch("user/fetchUser", account_id, { root: true }));

                    case 9:
                        user_result = _context.sent;

                        if (!user_result.success) {
                            _context.next = 42;
                            break;
                        }

                        currentPosition = user_result.data.call_orders.filter(function (item) {
                            return !!item;
                        }).find(function (item) {
                            return item.call_price.quote.asset_id === debtAssetId;
                        });

                        if (!currentPosition) {
                            _context.next = 24;
                            break;
                        }

                        _context.next = 15;
                        return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(currentPosition.call_price.base.asset_id));

                    case 15:
                        base_asset = _context.sent;
                        base_asset_precision = base_asset.data.precision;


                        currentPosition.call_price_text = _utils2.default.format_price(currentPosition.call_price.quote.amount, debt_asset.data, currentPosition.call_price.base.amount, base_asset.data, false, true, false);

                        // currentPosition.call_price_text=(helper.getFullNum(currentPosition.call_price.base.amount,
                        //     base_asset_precision)/helper.getFullNum(currentPosition.call_price.quote.amount,
                        //         debt_asset.data.precision)).toFixed(base_asset_precision)+" "+base_asset.data.symbol+"/"+debt_asset.data.symbol;
                        //Call Price
                        currentPosition.collateral_value = _helper2.default.getFullNum(currentPosition.collateral, base_asset_precision);
                        currentPosition.debt_value = _helper2.default.getFullNum(currentPosition.debt, debt_asset.data.precision);
                        currentPosition.collateral_symbol = base_asset.data.symbol;
                        currentPosition.debt_symbol = debt_asset.data.symbol;
                        _context.next = 30;
                        break;

                    case 24:
                        if (collateralAssetId) {
                            _context.next = 26;
                            break;
                        }

                        return _context.abrupt('return', { code: 178, message: "collateralAssetId Can not be empty" });

                    case 26:
                        _context.next = 28;
                        return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(collateralAssetId));

                    case 28:
                        _base_asset = _context.sent;

                        // console.info("collateralAssetId",collateralAssetId,base_asset);
                        currentPosition = {
                            call_price_text: "无",
                            collateral_value: 0,
                            debt_value: 0,
                            collateral_symbol: _base_asset.data.symbol,
                            debt_symbol: debt_asset.data.symbol
                        };

                    case 30:
                        _context.next = 32;
                        return _regenerator2.default.awrap(dispatch("assets/queryAssets", { assetId: debt_asset.data.symbol }, { root: true }));

                    case 32:
                        smart_asset_res = _context.sent;

                        if (!(smart_asset_res.code != 1)) {
                            _context.next = 35;
                            break;
                        }

                        return _context.abrupt('return', smart_asset_res);

                    case 35:
                        _smart_asset_res$data = smart_asset_res.data[0].bitasset_data, format_feed_price = _smart_asset_res$data.format_feed_price, format_feed_price_text = _smart_asset_res$data.format_feed_price_text, current_feed = _smart_asset_res$data.current_feed;

                        currentPosition.format_feed_price = format_feed_price;
                        currentPosition.format_feed_price_text = format_feed_price_text;
                        currentPosition.maintenance_collateral_ratio = current_feed.maintenance_collateral_ratio / 1000;
                        return _context.abrupt('return', { code: 1, data: currentPosition });

                    case 42:
                        return _context.abrupt('return', user_result);

                    case 43:
                    case 'end':
                        return _context.stop();
                }
            }
        }, null, undefined);
    },
    callOrderUpdate: function callOrderUpdate(_ref4, params) {
        var commit = _ref4.commit,
            rootGetters = _ref4.rootGetters,
            dispatch = _ref4.dispatch;

        var collateralAmount, collateralAssetId, debtAmount, debtAssetId, account, collateral_asset, debt_asset, delta_collateral, delta_debt, user_result, currentPosition, _currentPosition;

        return _regenerator2.default.async(function callOrderUpdate$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        if (!(!_helper2.default.trimParams(params) || !params.collateralAmount || !params.debtAmount)) {
                            _context2.next = 2;
                            break;
                        }

                        return _context2.abrupt('return', { code: 101, message: "Parameter is missing" });

                    case 2:
                        collateralAmount = params.collateralAmount, collateralAssetId = params.collateralAssetId, debtAmount = params.debtAmount, debtAssetId = params.debtAssetId, account = params.account;

                        collateralAmount = Number(collateralAmount);
                        debtAmount = Number(debtAmount);
                        collateralAmount = isNaN(collateralAmount) ? 0 : collateralAmount;
                        debtAmount = isNaN(debtAmount) ? 0 : debtAmount;

                        _context2.next = 9;
                        return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(collateralAssetId));

                    case 9:
                        collateral_asset = _context2.sent;
                        _context2.next = 12;
                        return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(debtAssetId));

                    case 12:
                        debt_asset = _context2.sent;

                        if (!(collateral_asset.code != 1)) {
                            _context2.next = 15;
                            break;
                        }

                        return _context2.abrupt('return', collateral_asset);

                    case 15:
                        if (!(debt_asset.code != 1)) {
                            _context2.next = 17;
                            break;
                        }

                        return _context2.abrupt('return', debt_asset);

                    case 17:
                        _context2.next = 19;
                        return _regenerator2.default.awrap(_helper2.default.toOpAmount(collateralAmount, collateral_asset.data));

                    case 19:
                        delta_collateral = _context2.sent.data;
                        _context2.next = 22;
                        return _regenerator2.default.awrap(_helper2.default.toOpAmount(debtAmount, debt_asset.data));

                    case 22:
                        delta_debt = _context2.sent.data;
                        _context2.next = 25;
                        return _regenerator2.default.awrap(dispatch("user/fetchUser", account.id, { root: true }));

                    case 25:
                        user_result = _context2.sent;
                        currentPosition = {
                            collateral: null,
                            debt: null
                        };

                        if (!user_result.success) {
                            _context2.next = 32;
                            break;
                        }

                        _currentPosition = user_result.data.call_orders.filter(function (item) {
                            return !!item;
                        }).find(function (item) {
                            return item.call_price.quote.asset_id === debtAssetId;
                        });

                        if (_currentPosition) currentPosition = _currentPosition;
                        _context2.next = 33;
                        break;

                    case 32:
                        return _context2.abrupt('return', user_result);

                    case 33:

                        delta_collateral.amount = parseInt(delta_collateral.amount - currentPosition.collateral, 10);
                        delta_debt.amount = parseInt(delta_debt.amount - currentPosition.debt, 10);

                        return _context2.abrupt('return', dispatch('transactions/_transactionOperations', {
                            operations: [{
                                op_type: 3,
                                type: "call_order_update",
                                params: {
                                    funding_account: rootGetters["account/getAccountUserId"],
                                    delta_collateral: delta_collateral,
                                    delta_debt: delta_debt
                                }
                            }]
                        }, { root: true }));

                    case 36:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, null, undefined);
    },
    createLimitOrder: function createLimitOrder(_ref5, _ref6) {
        var dispatch = _ref5.dispatch,
            rootGetters = _ref5.rootGetters;
        var price = _ref6.price,
            amount = _ref6.amount,
            transactionPair = _ref6.transactionPair,
            _ref6$type = _ref6.type,
            type = _ref6$type === undefined ? 0 : _ref6$type,
            callback = _ref6.callback,
            _ref6$isAsk = _ref6.isAsk,
            isAsk = _ref6$isAsk === undefined ? true : _ref6$isAsk,
            _ref6$onlyGetFee = _ref6.onlyGetFee,
            onlyGetFee = _ref6$onlyGetFee === undefined ? false : _ref6$onlyGetFee;

        var quoteAsset, baseAsset, coreAsset, currentAccount, _amount, turnover, a, val, current, accountBalance, quoteBalance, baseBalance, coreBalance, id, order;

        return _regenerator2.default.async(function createLimitOrder$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:

                        transactionPair = transactionPair.split("_");
                        _context3.next = 3;
                        return _regenerator2.default.awrap(dispatch("assets/fetchAssets", { assets: [transactionPair[0]], isOne: true }, { root: true }));

                    case 3:
                        quoteAsset = _context3.sent;
                        _context3.next = 6;
                        return _regenerator2.default.awrap(dispatch("assets/fetchAssets", { assets: [transactionPair[1]], isOne: true }, { root: true }));

                    case 6:
                        baseAsset = _context3.sent;
                        _context3.next = 9;
                        return _regenerator2.default.awrap(dispatch("assets/fetchAssets", { assets: ["1.3.0"], isOne: true }, { root: true }));

                    case 9:
                        coreAsset = _context3.sent;
                        currentAccount = rootGetters["user/getAllAccountObject"];
                        // let {
                        //   sellFeeAsset,
                        //   sellFeeAssets,
                        //   sellFee
                        //  } = getFeeAssets(quoteAsset, baseAsset, coreAsset,currentAccount);

                        _amount = new _MarketClasses.Asset({
                            asset_id: quoteAsset.id,
                            precision: quoteAsset.precision
                        });
                        turnover = new _MarketClasses.Asset({
                            asset_id: baseAsset.id,
                            precision: baseAsset.precision
                        });


                        price = new _MarketClasses.Price({
                            base: isAsk ? _amount : turnover,
                            quote: isAsk ? turnover : _amount,
                            real: parseFloat(price) || 0
                        });

                        a = parseFloat(amount) || 0;
                        val = price.toReal() * a;


                        amount = _amount;
                        amount.setAmount({ real: a || 0 });
                        turnover.setAmount({ real: val || 0 });

                        current = {
                            orderType: 0,
                            price: price,
                            amount: amount,
                            turnover: turnover
                            //   chargefee:sellFee
                        };
                        accountBalance = currentAccount.balances;
                        quoteBalance = void 0, baseBalance = void 0, coreBalance = void 0;

                        if (accountBalance) {
                            for (id in accountBalance) {
                                if (id === quoteAsset.id) {
                                    quoteBalance = accountBalance[id].balance;
                                }
                                if (id === baseAsset.id) {
                                    baseBalance = accountBalance[id].balance;
                                }
                                if (id === "1.3.0") {
                                    coreBalance = accountBalance[id].balance;
                                }
                            }
                        }
                        quoteBalance = current.amount.clone(quoteBalance ? parseInt(quoteBalance, 10) : 0);
                        coreBalance = new _MarketClasses.Asset({
                            amount: coreBalance ? parseInt(coreBalance, 10) : 0
                        });

                        // let fee = utils.getFee("limit_order_create",sellFeeAsset,coreAsset);

                        // let feeID = verifyFee(fee, current.amount.getAmount(), quoteBalance.getAmount(), coreBalance.getAmount());
                        // if(!feeID){
                        //   return {code:1,message:"Insufficient funds to pay fees"};
                        // }
                        type = Number(type);
                        order = new _MarketClasses.LimitOrderCreate({
                            for_sale: type ? current.turnover : current.amount,
                            to_receive: type ? current.amount : current.turnover,
                            seller: currentAccount.account.id
                            // fee: {
                            //     asset_id: feeID,
                            //     amount: 0
                            // }
                        });


                        order.setExpiration();
                        order = order.toObject();
                        return _context3.abrupt('return', dispatch('transactions/_transactionOperations', {
                            operations: [{
                                op_type: 1,
                                type: "limit_order_create",
                                params: order
                            }],
                            onlyGetFee: onlyGetFee
                        }, { root: true }));

                    case 30:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, null, undefined);
    },
    queryPriceHistory: function queryPriceHistory(_ref7, _ref8) {
        var dispatch = _ref7.dispatch;
        var trxSymbol = _ref8.trxSymbol,
            step = _ref8.step,
            _ref8$page = _ref8.page,
            page = _ref8$page === undefined ? 1 : _ref8$page,
            pageSize = _ref8.pageSize;

        var _trxSymbols, trxAssets, base, quote, endDate, _startDate, _endDate, startDateISO, endDateISO, history, prices;

        return _regenerator2.default.async(function queryPriceHistory$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        _trxSymbols = trxSymbol.split("_");
                        _context4.next = 3;
                        return _regenerator2.default.awrap(dispatch("assets/fetchAssets", { assets: _trxSymbols, isCache: true }, { root: true }));

                    case 3:
                        trxAssets = _context4.sent;
                        base = trxAssets[_trxSymbols[1]];
                        quote = trxAssets[_trxSymbols[0]];
                        endDate = new Date();
                        _startDate = new Date(endDate - step * 1000 * pageSize * page);
                        _endDate = new Date(endDate - step * 1000 * pageSize * (page - 1));
                        startDateISO = _startDate.toISOString().slice(0, -5);
                        endDateISO = _endDate.toISOString().slice(0, -5);
                        _context4.next = 13;
                        return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().history_api().exec('get_market_history', [base.id, quote.id, step, startDateISO, endDateISO]));

                    case 13:
                        history = _context4.sent;
                        prices = _priceChart(history, _immutable2.default.fromJS(base), _immutable2.default.fromJS(quote), step);
                        return _context4.abrupt('return', { code: 1, data: prices });

                    case 16:
                    case 'end':
                        return _context4.stop();
                }
            }
        }, null, undefined);
    },
    getMarketStats: function getMarketStats(_ref9, params) {
        var dispatch = _ref9.dispatch,
            state = _ref9.state,
            getters = _ref9.getters;

        var quoteAssets, baseAsset, _params$days, days, _params$assetCache, assetCache, callback, quoteAssetsIds, baseAssetId;

        return _regenerator2.default.async(function getMarketStats$(_context5) {
            while (1) {
                switch (_context5.prev = _context5.next) {
                    case 0:
                        state.getMarketStatsParams = params && params.subscribe ? params : null;

                        if (params.subscribe && !getters.isSubscribed) {
                            dispatch("subscribeToMarket");
                        }

                        quoteAssets = params.quoteAssets, baseAsset = params.baseAsset, _params$days = params.days, days = _params$days === undefined ? 2 : _params$days, _params$assetCache = params.assetCache, assetCache = _params$assetCache === undefined ? true : _params$assetCache, callback = params.callback;
                        _context5.next = 5;
                        return _regenerator2.default.awrap(dispatch("assets/fetchAssets", { assets: [baseAsset].concat((0, _toConsumableArray3.default)(quoteAssets)), isCache: assetCache }, { root: true }));

                    case 5:
                        quoteAssets = _context5.sent;
                        quoteAssetsIds = [];
                        baseAssetId = "1.3.0";


                        (0, _keys2.default)(quoteAssets).forEach(function (asset_id) {
                            if (/1.3.\d+/.test(asset_id)) {
                                var asset = quoteAssets[asset_id];
                                if (asset.symbol != baseAsset) {
                                    quoteAssetsIds.push(asset_id);
                                } else {
                                    baseAssetId = asset_id;
                                }
                            }
                        });
                        return _context5.abrupt('return', dispatch("market/fetchMarketHistory_v1", {
                            assetsIds: quoteAssetsIds,
                            baseId: baseAssetId,
                            days: days
                        }, { root: true }).then(function (data) {
                            callback && callback({ code: 1, data: data });
                            return { code: 1, data: data };
                        }).catch(function (error) {
                            callback && callback({ code: 0, message: error.message, error: error });
                            return { code: 0, message: error.message, error: error };
                        }));

                    case 10:
                    case 'end':
                        return _context5.stop();
                }
            }
        }, null, undefined);
    },
    fetchMarketHistory_v1: function fetchMarketHistory_v1(store, _ref10) {
        var assetsIds = _ref10.assetsIds,
            baseId = _ref10.baseId,
            _ref10$days = _ref10.days,
            days = _ref10$days === undefined ? 2 : _ref10$days;
        var dispatch = store.dispatch,
            commit = store.commit,
            rootGetters = store.rootGetters;

        var assets = rootGetters['assets/getAssets'];
        var baseAsset = assets[baseId];
        commit(types.FETCH_MARKET_HISTORY_REQUEST, { baseId: baseId, days: days });
        return _promise2.default.all(assetsIds.map(function _callee(assetId) {
            var quote, result, marketStats, stats, price;
            return _regenerator2.default.async(function _callee$(_context6) {
                while (1) {
                    switch (_context6.prev = _context6.next) {
                        case 0:
                            // const prices = await API.Assets.fetchPriceHistory(baseAsset, assets[assetId], days);
                            // console.info("prices",prices);
                            quote = assets[assetId];
                            _context6.next = 3;
                            return _regenerator2.default.awrap(_api2.default.Assets.fetchPriceHistory(baseAsset, assets[assetId], days));

                        case 3:
                            result = _context6.sent;

                            if (result) {
                                _context6.next = 6;
                                break;
                            }

                            throw new Error('error market history');

                        case 6:
                            marketStats = {
                                history: result[0],
                                last: result[1],
                                market: quote.symbol + "_" + baseAsset.symbol,
                                base: baseAsset,
                                quote: quote
                                // console.info("result",result,marketStats);

                            };
                            stats = _calcMarketStats(marketStats.history, marketStats.base, marketStats.quote, marketStats.last);
                            price = _utils2.default.convertPrice(_immutable2.default.fromJS(marketStats.quote), _immutable2.default.fromJS(marketStats.base));


                            stats.latestPrice = stats && stats.latestPrice ? stats.latestPrice : stats && stats.close && stats.close.quote.amount && stats.close.base.amount ? _utils2.default.get_asset_price(stats.close.quote.amount, marketStats.quote, stats.close.base.amount, marketStats.base, true) : _utils2.default.get_asset_price(price.base.amount, marketStats.base, price.quote.amount, marketStats.quote);

                            stats.latest_price = stats.latestPrice.toFixed(baseAsset.precision);

                            delete stats.latestPrice;

                            stats.base_symbol = baseAsset.symbol;
                            stats.quote_symbol = quote.symbol;

                            stats.volume_base = stats.volumeBase;
                            stats.volume_quote = stats.volumeQuote;
                            delete stats.volumeBase;
                            delete stats.volumeQuote;

                            return _context6.abrupt('return', stats);

                        case 19:
                        case 'end':
                            return _context6.stop();
                    }
                }
            }, null, undefined);
        })).then(function (results) {
            return results.map(function (item) {
                delete item.close;
                return item;
            });
        }).catch(function () {
            commit(types.FETCH_MARKET_HISTORY_ERROR);
        });
    },
    fetchMarketHistory: function fetchMarketHistory(store, _ref11) {
        var assetsIds = _ref11.assetsIds,
            baseId = _ref11.baseId,
            days = _ref11.days;
        var commit = store.commit,
            rootGetters = store.rootGetters;

        var assets = rootGetters['assets/getAssets'];
        var baseAsset = assets[baseId];

        commit(types.FETCH_MARKET_HISTORY_REQUEST, { baseId: baseId, days: days });
        _promise2.default.all(assetsIds.map(function _callee2(assetId) {
            var prices;
            return _regenerator2.default.async(function _callee2$(_context7) {
                while (1) {
                    switch (_context7.prev = _context7.next) {
                        case 0:
                            _context7.next = 2;
                            return _regenerator2.default.awrap(_api2.default.Assets.fetchPriceHistory(baseAsset, assets[assetId], days));

                        case 2:
                            prices = _context7.sent;

                            if (prices) {
                                _context7.next = 5;
                                break;
                            }

                            throw new Error('error market history');

                        case 5:
                            return _context7.abrupt('return', {
                                assetId: assetId,
                                prices: prices
                            });

                        case 6:
                        case 'end':
                            return _context7.stop();
                    }
                }
            }, null, undefined);
        })).then(function (pricesObjects) {
            var prices = pricesObjects.reduce(function (result, obj) {
                result[obj.assetId] = obj.prices;
                return result;
            }, {});
            commit(types.FETCH_MARKET_HISTORY_COMPLETE, { prices: prices });
        }).catch(function () {
            commit(types.FETCH_MARKET_HISTORY_ERROR);
        });
    },
    getTransactionPairData: function getTransactionPairData(store, params) {
        var commit, state, dispatch, rootGetters, getters, transactionPair, _params$hasMyTradeHis, hasMyTradeHistory, callback, currentAccount;

        return _regenerator2.default.async(function getTransactionPairData$(_context8) {
            while (1) {
                switch (_context8.prev = _context8.next) {
                    case 0:
                        commit = store.commit, state = store.state, dispatch = store.dispatch, rootGetters = store.rootGetters, getters = store.getters;

                        state.getTrxPairDataParams = params.subscribe ? params : null;
                        transactionPair = params.transactionPair, _params$hasMyTradeHis = params.hasMyTradeHistory, hasMyTradeHistory = _params$hasMyTradeHis === undefined ? false : _params$hasMyTradeHis, callback = params.callback;
                        currentAccount = rootGetters["user/getAllAccountObject"];

                        if (params.subscribe && !getters.isSubscribed) {
                            dispatch("subscribeToMarket");
                        }
                        return _context8.abrupt('return', new _market2.default().subscribeToExchangeRate(transactionPair, currentAccount, hasMyTradeHistory, function (marketsDataRes, id, amount) {
                            callback && callback(marketsDataRes);
                        }).then(function () {
                            console.log('subscribed to market successfully');
                        }));

                    case 6:
                    case 'end':
                        return _context8.stop();
                }
            }
        }, null, undefined);
    },
    subscribeToMarket: function subscribeToMarket(_ref12) {
        var commit = _ref12.commit,
            state = _ref12.state,
            dispatch = _ref12.dispatch;

        var marketsSubscription = new _subscriptions2.default.Markets({
            callback: function callback(type, object) {
                clearTimeout(state.marketUpdateTimer);
                state.marketUpdateTimer = setTimeout(function () {
                    var getTrxPairDataParams = state.getTrxPairDataParams,
                        getMarketStatsParams = state.getMarketStatsParams;

                    if (getTrxPairDataParams) {
                        dispatch("getTransactionPairData", getTrxPairDataParams);
                    }
                    if (getMarketStatsParams) {
                        dispatch("getMarketStats", getMarketStatsParams);
                    }
                }, 500);
            }
        });
        _chainListener2.default.addSubscription(marketsSubscription);
        commit(types.SUB_TO_MARKET_COMPLETE);
    },
    unsubscribeFromMarket: function unsubscribeFromMarket(store, _ref13) {
        var balances = _ref13.balances;
        var commit = store.commit;

        var assetsIds = (0, _keys2.default)(balances);
        GphMarket.unsubscribeFromMarkets();
        _promise2.default.all(assetsIds.map(function (id) {
            console.log('unsubscribing: ', id);
            return GphMarket.unsubscribeFromExchangeRate(id);
        })).then(function () {
            commit(types.UNSUB_FROM_MARKET_COMPLETE);
            console.log('unsubscribed from market');
        });
    },


    updateMarketPrice: function updateMarketPrice(store, _ref14) {
        var assetId = _ref14.assetId,
            price = _ref14.price,
            GphMarket = _ref14.GphMarket;
        var commit, orders;
        return _regenerator2.default.async(function updateMarketPrice$(_context9) {
            while (1) {
                switch (_context9.prev = _context9.next) {
                    case 0:
                        commit = store.commit;

                        commit(types.UPDATE_MARKET_PRICE, { assetId: assetId, price: price });
                        _context9.next = 4;
                        return _regenerator2.default.awrap(store.dispatch('transactions/createOrdersFromDistribution', GphMarket, { root: true }));

                    case 4:
                        orders = _context9.sent;
                        return _context9.abrupt('return', orders);

                    case 6:
                    case 'end':
                        return _context9.stop();
                }
            }
        }, null, undefined);
    },

    setMarketStats: function setMarketStats(_ref15, payload) {
        var commit = _ref15.commit;

        commit(types.SET_MARKET_STATS, payload);
    }
};

var getFeeAssets = function getFeeAssets(quote, base, coreAsset, currentAccount) {
    quote = _immutable2.default.fromJS(quote);
    base = _immutable2.default.fromJS(base);
    currentAccount = _immutable2.default.fromJS(currentAccount);
    function addMissingAsset(target, asset) {
        if (target.indexOf(asset) === -1) {
            target.push(asset);
        }
    }

    var sellFeeAssets = [coreAsset, quote === coreAsset ? base : quote];
    addMissingAsset(sellFeeAssets, quote);
    addMissingAsset(sellFeeAssets, base);
    var sellFeeAsset = void 0;

    var balances = {};

    currentAccount.get("balances", []).filter(function (balance, id) {
        return ["1.3.0", quote.get("id"), base.get("id")].indexOf(id) >= 0;
    }).forEach(function (balance, id) {
        var balanceObject = balance;
        balances[id] = {
            balance: balanceObject ? parseInt(balanceObject.get("balance"), 10) : 0,
            fee: _utils2.default.getFee("limit_order_create", _bcxjsCores.ChainStore.getAsset(id))
        };
    });

    // await Promise.all(currentAccount.get("balances", []).filter((balance, id) => {
    //     return (["1.3.0", quote.get("id"), base.get("id")].indexOf(id) >= 0);
    // }).map(async (balance, id) => {
    //     let balanceObject = balance;
    //     let coreAsset=(await API.Assets.fetch_asset_one(id)).data;
    //     console.info('coreAsset',coreAsset,id);

    //     balances[id] = {
    //         balance: balanceObject ? parseInt(balanceObject.get("balance"), 10) : 0,
    //         fee: utils.getFee("limit_order_create",coreAsset)
    //     };
    // }))

    sellFeeAssets = sellFeeAssets.filter(function (a) {
        if (!balances[a.id]) {
            return false;
        }
        return balances[a.id].balance > balances[a.id].fee.getAmount();
    });

    if (!sellFeeAssets.length) {
        sellFeeAsset = coreAsset;
        sellFeeAssets.push(coreAsset);
    } else {
        sellFeeAsset = sellFeeAssets[Math.min(sellFeeAssets.length - 1, 0)]; //sellFeeAssetIdx
    }

    //   let sellFee = utils.getFee("limit_order_create",sellFeeAsset);

    return {
        sellFeeAsset: sellFeeAsset,
        sellFeeAssets: sellFeeAssets
        //sellFee
    };
};

var verifyFee = function verifyFee(fee, sellAmount, sellBalance, coreBalance) {
    var coreFee = _utils2.default.getFee("limit_order_create");

    var sellSum = fee.getAmount() + sellAmount;
    if (fee.asset_id === "1.3.0") {
        if (coreFee.getAmount() <= coreBalance) {
            return "1.3.0";
        } else {
            return null;
        }
    } else {

        if (sellSum <= sellBalance) {
            // sufficient funds
            return fee.asset_id;
        } else if (coreFee.getAmount() <= coreBalance && fee.asset_id !== "1.3.0") {
            // sufficient core assets for fee cost
            return "1.3.0";
        } else {
            return null; // insufficient funds
        }
    }
};

var getters = {
    getPriceById: function getPriceById(state) {
        return function (assetId) {
            if (assetId === state.baseId) return 1;
            return state.prices[assetId] || 0;
        };
    },
    getBaseAssetId: function getBaseAssetId(state) {
        return state.baseAssetId;
    },
    getAssetMultiplier: function getAssetMultiplier(state) {
        return function (assetId) {
            if (!state.history[assetId]) {
                return {
                    first: 0,
                    last: 0
                };
            }
            return {
                first: 1 / state.history[assetId].first,
                last: 1 / state.history[assetId].last
            };
        };
    },
    getMarketHistory: function getMarketHistory(state) {
        return state.history;
    },
    isFetching: function isFetching(state) {
        return state.pending;
    },
    isError: function isError(state) {
        return state.error;
    },
    isSubscribed: function isSubscribed(state) {
        return state.subscribed;
    },
    getAllMarketStats: function getAllMarketStats(state) {
        return state.allMarketStats;
    }
};

var initialState = {
    history: {},
    days: 7,
    pending: false,
    error: false,
    baseAssetId: null,
    subscribed: false,
    prices: {},
    allMarketStats: {},
    markets: {},
    getMarketStatsParams: null,
    getTrxPairDataParams: null,
    marketUpdateTimer: 0
};

var mutations = (_mutations = {}, (0, _defineProperty3.default)(_mutations, types.FETCH_MARKET_HISTORY_REQUEST, function (state, _ref16) {
    var baseId = _ref16.baseId,
        days = _ref16.days;

    state.fetching = true;
    state.baseAssetId = baseId;
    state.days = days;
}), (0, _defineProperty3.default)(_mutations, types.FETCH_MARKET_HISTORY_COMPLETE, function (state, _ref17) {
    var prices = _ref17.prices;

    state.fetching = false;
    (0, _keys2.default)(prices).forEach(function (assetId) {
        _vue2.default.set(state.history, assetId, prices[assetId]);
    });
}), (0, _defineProperty3.default)(_mutations, types.FETCH_MARKET_HISTORY_ERROR, function (state) {
    state.fetching = false;
    state.error = true;
}), (0, _defineProperty3.default)(_mutations, types.UPDATE_MARKET_PRICE, function (state, _ref18) {
    var assetId = _ref18.assetId,
        price = _ref18.price;

    if (!state.history[assetId]) _vue2.default.set(state.history, assetId, {});
    _vue2.default.set(state.history[assetId], 'last', price);
}), (0, _defineProperty3.default)(_mutations, types.SUB_TO_MARKET_COMPLETE, function (state) {
    state.subscribed = true;
}), (0, _defineProperty3.default)(_mutations, types.UNSUB_FROM_MARKET_COMPLETE, function (state) {
    state.subscribed = false;
}), (0, _defineProperty3.default)(_mutations, types.SET_MARKET_STATS, function (state, payload) {
    if (payload) {
        var stats = _calcMarketStats(payload.history, payload.base, payload.quote, payload.last);
        _vue2.default.set(state.allMarketStats, payload.market, stats);
    }
}), _mutations);

var _calcMarketStats = function _calcMarketStats(history, baseAsset, quoteAsset, recent) {
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    // console.info("yesterday",yesterday.format("yyyy/MM:dd HH:mm:ss"))

    yesterday = yesterday.getTime();
    var volumeBase = 0,
        volumeQuote = 0,
        change = 0,
        last = { close_quote: null, close_base: null },
        invert = void 0,
        latestPrice = void 0,
        noTrades = true;

    baseAsset = _immutable2.default.fromJS(baseAsset);
    quoteAsset = _immutable2.default.fromJS(quoteAsset);

    if (history.length) {
        var first = void 0;
        history.forEach(function (bucket, i) {
            var date = new Date(bucket.key.open + "+00:00").getTime();
            if (date > yesterday) {
                noTrades = false;
                if (!first) {
                    first = history[i > 0 ? i - 1 : i];
                    invert = first.key.base === baseAsset.get("id");
                }
                if (invert) {
                    volumeBase += parseInt(bucket.base_volume, 10);
                    volumeQuote += parseInt(bucket.quote_volume, 10);
                } else {
                    volumeQuote += parseInt(bucket.base_volume, 10);
                    volumeBase += parseInt(bucket.quote_volume, 10);
                }
            }
        });
        if (!first) {
            first = history[0];
        }
        last = history[history.length - 1];
        var open = void 0,
            _close = void 0;
        if (invert) {
            open = _utils2.default.get_asset_price(first.open_quote, quoteAsset, first.open_base, baseAsset, invert);
            _close = _utils2.default.get_asset_price(last.close_quote, quoteAsset, last.close_base, baseAsset, invert);
        } else {
            open = _utils2.default.get_asset_price(first.open_quote, baseAsset, first.open_base, quoteAsset, invert); //Opening price
            _close = _utils2.default.get_asset_price(last.close_quote, baseAsset, last.close_base, quoteAsset, invert); //Closing price
        }
        change = noTrades ? 0 : Math.round(10000 * (_close - open) / open) / 100;
    }

    if (recent && recent.length && recent.length > 1) {
        var order = recent[1].op;
        var paysAsset = void 0,
            receivesAsset = void 0,
            isAsk = false;

        if (order.pays.asset_id === baseAsset.get("id")) {
            paysAsset = baseAsset;
            receivesAsset = quoteAsset;
            isAsk = true;
        } else {
            paysAsset = quoteAsset;
            receivesAsset = baseAsset;
        }
        var flipped = baseAsset.get("id").split(".")[2] > quoteAsset.get("id").split(".")[2];
        latestPrice = _market_utils2.default.parse_order_history(order, paysAsset, receivesAsset, isAsk, flipped).full;
    }

    var close = last.close_base && last.close_quote ? {
        quote: {
            amount: invert ? last.close_quote : last.close_base,
            asset_id: invert ? last.key.quote : last.key.base
        },
        base: {
            amount: invert ? last.close_base : last.close_quote,
            asset_id: invert ? last.key.base : last.key.quote
        }
    } : null;

    return {
        change: change.toFixed(2),
        volumeBase: _utils2.default.get_asset_amount(volumeBase, baseAsset),
        volumeQuote: _utils2.default.get_asset_amount(volumeQuote, quoteAsset),
        close: close,
        latestPrice: latestPrice
    };
};

var _priceChart = function _priceChart(priceHistory, baseAsset, quoteAsset, bucketSize) {
    var volumeData = [];
    var prices = [];

    var open = void 0,
        high = void 0,
        low = void 0,
        close = void 0,
        volume = void 0;

    var addTime = function addTime(time, i, bucketSize) {
        return new Date(time.getTime() + i * bucketSize * 1000);
    };

    for (var i = 0; i < priceHistory.length; i++) {
        var findMax = function findMax(a, b) {
            if (a !== Infinity && b !== Infinity) {
                return Math.max(a, b);
            } else if (a === Infinity) {
                return b;
            } else {
                return a;
            }
        };

        var findMin = function findMin(a, b) {
            if (a !== 0 && b !== 0) {
                return Math.min(a, b);
            } else if (a === 0) {
                return b;
            } else {
                return a;
            }
        };

        var current = priceHistory[i];
        if (!/Z$/.test(current.key.open)) {
            current.key.open += "Z";
        }
        var date = new Date(current.key.open);

        if (quoteAsset.get("id") === current.key.quote) {
            high = _utils2.default.get_asset_price(current.high_base, baseAsset, current.high_quote, quoteAsset);
            low = _utils2.default.get_asset_price(current.low_base, baseAsset, current.low_quote, quoteAsset);
            open = _utils2.default.get_asset_price(current.open_base, baseAsset, current.open_quote, quoteAsset);
            close = _utils2.default.get_asset_price(current.close_base, baseAsset, current.close_quote, quoteAsset);
            volume = _utils2.default.get_asset_amount(current.quote_volume, quoteAsset);
        } else {
            low = _utils2.default.get_asset_price(current.high_quote, baseAsset, current.high_base, quoteAsset);
            high = _utils2.default.get_asset_price(current.low_quote, baseAsset, current.low_base, quoteAsset);
            open = _utils2.default.get_asset_price(current.open_quote, baseAsset, current.open_base, quoteAsset);
            close = _utils2.default.get_asset_price(current.close_quote, baseAsset, current.close_base, quoteAsset);
            volume = _utils2.default.get_asset_amount(current.base_volume, quoteAsset);
        }

        if (low === 0) {
            low = findMin(open, close);
        }

        if (isNaN(high) || high === Infinity) {
            high = findMax(open, close);
        }

        if (close === Infinity || close === 0) {
            close = open;
        }

        if (open === Infinity || open === 0) {
            open = close;
        }

        if (high > 1.3 * ((open + close) / 2)) {
            high = findMax(open, close);
        }

        if (low < 0.7 * ((open + close) / 2)) {
            low = findMin(open, close);
        }

        prices.push({ date: date, open: open, high: high, low: low, close: close, volume: volume });
        volumeData.push([date, volume]);
    }

    // max buckets returned is 200, if we get less, fill in the gaps starting at the first data point
    var priceLength = prices.length;
    if (priceLength > 0 && priceLength < 200) {
        var now = new Date().getTime();
        // let firstDate = prices[0].date;
        // United Labs of BCTech.
        // ensure there's a final entry close to the current time
        var _i = 1;
        while (addTime(prices[0].date, _i, bucketSize).getTime() < now) {
            _i++;
        }
        var finalDate = addTime(prices[0].date, _i - 1, bucketSize);
        if (prices[priceLength - 1].date !== finalDate) {
            if (priceLength === 1) {
                prices.push({
                    date: addTime(finalDate, -1, bucketSize),
                    open: prices[0].close,
                    high: prices[0].close,
                    low: prices[0].close,
                    close: prices[0].close,
                    volume: 0
                });
                prices.push({
                    date: finalDate,
                    open: prices[0].close,
                    high: prices[0].close,
                    low: prices[0].close,
                    close: prices[0].close,
                    volume: 0
                });
                volumeData.push([addTime(finalDate, -1, bucketSize), 0]);
            } else {
                prices.push({
                    date: finalDate,
                    open: prices[priceLength - 1].close,
                    high: prices[priceLength - 1].close,
                    low: prices[priceLength - 1].close,
                    close: prices[priceLength - 1].close,
                    volume: 0
                });
            }
            volumeData.push([finalDate, 0]);
        }

        // Loop over the data and fill in any blank time periods
        for (var ii = 0; ii < prices.length - 1; ii++) {
            // If next date is beyond one bucket up
            if (prices[ii + 1].date.getTime() !== addTime(prices[ii].date, 1, bucketSize).getTime()) {
                // Break if next date is beyond now
                if (addTime(prices[ii].date, 1, bucketSize).getTime() > now) {
                    break;
                }

                prices.splice(ii + 1, 0, {
                    date: addTime(prices[ii].date, 1, bucketSize),
                    open: prices[ii].close,
                    high: prices[ii].close,
                    low: prices[ii].close,
                    close: prices[ii].close,
                    volume: 0
                });
                volumeData.splice(ii + 1, 0, [addTime(prices[ii].date, 1, bucketSize), 0]);
            }
        }
    }
    return prices;
};
exports.default = {
    state: initialState,
    actions: actions,
    getters: getters,
    mutations: mutations,
    namespaced: true
};