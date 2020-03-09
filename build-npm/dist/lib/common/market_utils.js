"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _utils = require("./utils");

var _utils2 = _interopRequireDefault(_utils);

var _bcxjsCores = require("bcxjs-cores");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var object_type = _bcxjsCores.ChainTypes.object_type;

var opTypes = (0, _keys2.default)(object_type);

var MarketUtils = {
    order_type: function order_type(id) {
        if (typeof id !== "string") {
            return false;
        }
        var type = id.split(".")[1];
        return opTypes[type];
    },
    isAsk: function isAsk(order, base) {
        var baseId = base.toJS ? base.get("id") : base.id;
        ;

        if (order.sell_price) {
            return order.sell_price.quote.asset_id === baseId;
        } else if (order.call_price) {
            return order.call_price.quote.asset_id === baseId;
        }
    },
    isAskOp: function isAskOp(op) {
        return op.amount_to_sell.asset_id !== op.fee.asset_id;
    },
    getMarketName: function getMarketName(base, quote) {
        // if (!base || !quote) return {marketName: "_"};
        var baseID = parseInt(base.split(".")[2], 10);
        var quoteID = parseInt(quote.split(".")[2], 10);

        var first = quoteID > baseID ? quote : base;
        var second = quoteID > baseID ? base : quote;

        // const marketName = `${first.get("symbol")}_${second.get("symbol")}`;
        return { baseID: baseID, quoteID: quoteID, first: first, second: second };
    },
    limitByPrecision: function limitByPrecision(value, asset) {
        var floor = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

        var assetPrecision = asset.toJS ? asset.get("precision") : asset.precision;
        var valueString = value.toString();
        var splitString = valueString.split(".");
        if (splitString.length === 1 || splitString.length === 2 && splitString[1].length <= assetPrecision) {
            return value;
        }
        var precision = _utils2.default.get_asset_precision(assetPrecision);
        value = floor ? Math.floor(value * precision) / precision : Math.round(value * precision) / precision;
        if (isNaN(value) || !isFinite(value)) {
            return 0;
        }
        return value;
    },
    getFeedPrice: function getFeedPrice(settlement_price) {
        var invert = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        var quoteAsset = _bcxjsCores.ChainStore.getAsset(settlement_price.getIn(["quote", "asset_id"]));
        var baseAsset = _bcxjsCores.ChainStore.getAsset(settlement_price.getIn(["base", "asset_id"]));

        var price = _utils2.default.get_asset_price(settlement_price.getIn(["quote", "amount"]), quoteAsset, settlement_price.getIn(["base", "amount"]), baseAsset);

        if (invert) {
            return 1 / price;
        } else {
            return price;
        }
    },
    parseOrder: function parseOrder(order, base, quote) {
        var invert = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

        var ask = this.isAsk(order, base);

        var quotePrecision = _utils2.default.get_asset_precision(quote.toJS ? quote.get("precision") : quote.precision);
        var basePrecision = _utils2.default.get_asset_precision(base.toJS ? base.get("precision") : base.precision);
        var pricePrecision = order.call_price ? quote.toJS ? quote.get("precision") : quote.precision : base.toJS ? base.get("precision") : base.precision;

        var buy = void 0,
            sell = void 0;
        var callPrice = void 0;
        if (order.sell_price) {
            buy = ask ? order.sell_price.base : order.sell_price.quote;
            sell = ask ? order.sell_price.quote : order.sell_price.base;
        } else if (order.call_price) {
            buy = order.call_price.base;
            sell = order.call_price.quote;
            var marginPrice = buy.amount / basePrecision / (sell.amount / quotePrecision);
            if (!invert) {
                callPrice = marginPrice;
            } else {
                callPrice = 1 / marginPrice;
            }
        }

        if (typeof sell.amount !== "number") {
            sell.amount = parseInt(sell.amount, 10);
        }

        if (typeof buy.amount !== "number") {
            buy.amount = parseInt(buy.amount, 10);
        }
        var fullPrice = callPrice ? callPrice : sell.amount / basePrecision / (buy.amount / quotePrecision);
        var price = _utils2.default.price_to_text(fullPrice, order.call_price ? base : quote, order.call_price ? quote : base);

        var amount = void 0,
            value = void 0;

        // We need to figure out a better way to set the number of decimals
        // United Labs of BCTech.
        // let price_split = utils.format_number(price.full, Math.max(5, pricePrecision)).split(".");
        // price.int = price_split[0];
        // price.dec = price_split[1];

        if (order.debt) {
            if (invert) {
                // Price in USD/GPH, amount should be in GPH, value should be in USD, debt is in USD
                // buy is in USD, sell is in GPH
                // quote is USD, base is GPH
                value = order.debt / quotePrecision;
                amount = this.limitByPrecision(value / price.full, base);
            } else {
                // Price in GPH/USD, amount should be in USD, value should be in GPH, debt is in USD
                // buy is in USD, sell is in GPH
                // quote is USD, base is GPH

                amount = this.limitByPrecision(order.debt / quotePrecision, quote);
                value = price.full * amount;
            }
        } else if (!ask) {
            amount = this.limitByPrecision(buy.amount / sell.amount * order.for_sale / quotePrecision, quote);
            value = order.for_sale / basePrecision;
        } else {
            amount = this.limitByPrecision(order.for_sale / quotePrecision, quote);
            value = price.full * amount;
        }

        value = this.limitByPrecision(value, base);

        if (!ask && order.for_sale) {
            value = this.limitByPrecision(price.full * amount, base);
        }

        return {
            value: value,
            price: price,
            amount: amount
        };
    },
    parse_order_history: function parse_order_history(order, paysAsset, receivesAsset, isAsk, flipped) {
        var isCall = order.order_id.split(".")[1] == object_type.limit_order ? false : true;
        var receivePrecision = _utils2.default.get_asset_precision(receivesAsset.get("precision"));
        var payPrecision = _utils2.default.get_asset_precision(paysAsset.get("precision"));

        var receives = order.receives.amount / receivePrecision;
        receives = _utils2.default.format_number(receives, receivesAsset.get("precision"));
        var pays = order.pays.amount / payPrecision;
        pays = _utils2.default.format_number(pays, paysAsset.get("precision"));
        var price_full = _utils2.default.get_asset_price(order.receives.amount, receivesAsset, order.pays.amount, paysAsset, isAsk);
        // price_full = !flipped ? (1 / price_full) : price_full;
        // let {int, dec} = this.split_price(price_full, isAsk ? receivesAsset.get("precision") : paysAsset.get("precision"));

        var _utils$price_to_text = _utils2.default.price_to_text(price_full, isAsk ? receivesAsset : paysAsset, isAsk ? paysAsset : receivesAsset),
            int = _utils$price_to_text.int,
            dec = _utils$price_to_text.dec,
            trailing = _utils$price_to_text.trailing;

        var className = isCall ? "orderHistoryCall" : isAsk ? "orderHistoryBid" : "orderHistoryAsk";

        var time = void 0;
        if (order.time) {
            time = order.time.split("T")[1];
            var now = new Date();
            var offset = now.getTimezoneOffset() / 60;
            var date = _utils2.default.format_date(order.time + "Z").split(/\W/);
            var hour = time.substr(0, 2);
            var hourNumber = parseInt(hour, 10);
            var localHour = hourNumber - offset;
            if (localHour >= 24) {
                localHour -= 24;
            } else if (localHour < 0) {
                localHour += 24;
            }
            var hourString = localHour.toString();
            if (parseInt(hourString, 10) < 10) {
                hourString = "0" + hourString;
            }
            time = date[0] + "/" + date[1] + "/" + date[2] + " " + time.replace(hour, hourString);
        }
        return {
            receives: isAsk ? receives : pays,
            pays: isAsk ? pays : receives,
            full: price_full,
            int: int,
            dec: dec,
            trailing: trailing,
            className: className,
            time: time
        };
    },
    split_price: function split_price(price, pricePrecision) {
        // We need to figure out a better way to set the number of decimals
        var price_split = _utils2.default.format_number(price, Math.max(5, pricePrecision)).split(".");
        var int = price_split[0];
        var dec = price_split[1];
        return { int: int, dec: dec };
    },


    // flatten_orderbookchart(array, sumBoolean, inverse, precision) {
    //     inverse = inverse === undefined ? false : inverse;
    //     let orderBookArray = [];
    //     let maxStep, arrayLength = array.length;
    //     // United Labs of BCTech.
    //     // Sum orders at same price
    //     // if (arrayLength > 1) {
    //     //     for (var i = arrayLength - 2; i >= 0; i--) {
    //     //         if (array[i].x === array[i + 1].x) {
    //     //             console.log("found order to sum");
    //     //             array[i].y += array[i + 1].y;
    //     //             array.splice(i + 1, 1);
    //     //         }
    //     //     }
    //     // }
    //     // arrayLength = array.length;

    //     if (inverse) {

    //         if (array && arrayLength) {
    //             arrayLength = arrayLength - 1;
    //             orderBookArray.unshift({
    //                 x: array[arrayLength].x,
    //                 y: array[arrayLength].y
    //             });
    //             if (array.length > 1) {
    //                 for (let i = array.length - 2; i >= 0; i--) {
    //                     // maxStep = Math.min((array[i + 1].x - array[i].x) / 2, 0.1 / precision);
    //                     orderBookArray.unshift({
    //                         x: array[i].x + maxStep,
    //                         y: array[i + 1].y
    //                     });
    //                     if (sumBoolean) {
    //                         array[i].y += array[i + 1].y;
    //                     }
    //                     orderBookArray.unshift({
    //                         x: array[i].x,
    //                         y: array[i].y
    //                     });
    //                 }
    //             } else {
    //                 orderBookArray.unshift({
    //                     x: 0,
    //                     y: array[arrayLength].y
    //                 });
    //             }
    //         }
    //     } else {
    //         if (array && arrayLength) {
    //             orderBookArray.push({
    //                 x: array[0].x,
    //                 y: array[0].y
    //             });
    //             if (array.length > 1) {
    //                 for (let i = 1; i < array.length; i++) {
    //                     // maxStep = Math.min((array[i].x - array[i - 1].x) / 2, 0.1 / precision);
    //                     orderBookArray.push({
    //                         x: array[i].x - maxStep,
    //                         y: array[i - 1].y
    //                     });
    //                     if (sumBoolean) {
    //                         array[i].y += array[i - 1].y;
    //                     }
    //                     orderBookArray.push({
    //                         x: array[i].x,
    //                         y: array[i].y
    //                     });
    //                 }
    //             } else {
    //                 orderBookArray.push({
    //                     x: array[0].x * 1.5,
    //                     y: array[0].y
    //                 });
    //             }
    //         }
    //     }
    //     return orderBookArray;
    // }

    flatten_orderbookchart_highcharts: function flatten_orderbookchart_highcharts(array, sumBoolean, inverse, precision) {
        inverse = inverse === undefined ? false : inverse;
        var orderBookArray = [];
        var arrayLength = void 0;

        if (inverse) {

            if (array && array.length) {
                arrayLength = array.length - 1;
                orderBookArray.unshift([array[arrayLength][0], array[arrayLength][1]]);
                if (array.length > 1) {
                    for (var _i = array.length - 2; _i >= 0; _i--) {
                        if (sumBoolean) {
                            array[_i][1] += array[_i + 1][1];
                        }
                        orderBookArray.unshift([array[_i][0], array[_i][1]]);
                    }
                } else {
                    orderBookArray.unshift([0, array[arrayLength][1]]);
                }
            }
        } else {
            if (array && array.length) {
                orderBookArray.push([array[0][0], array[0][1]]);
                if (array.length > 1) {
                    for (var i = 1; i < array.length; i++) {
                        if (sumBoolean) {
                            array[i][1] += array[i - 1][1];
                        }
                        orderBookArray.push([array[i][0], array[i][1]]);
                    }
                } else {
                    orderBookArray.push([array[0][0] * 1.5, array[0][1]]);
                }
            }
        }
        return orderBookArray;
    },
    priceToObject: function priceToObject(x, type) {
        var tolerance = 1.0E-8;
        var h1 = 1;
        var h2 = 0;
        var k1 = 0;
        var k2 = 1;
        var b = x;
        do {
            var a = Math.floor(b);
            var aux = h1;
            h1 = a * h1 + h2;
            h2 = aux;
            aux = k1;
            k1 = a * k1 + k2;
            k2 = aux;
            b = 1 / (b - a);
        } while (Math.abs(x - h1 / k1) > x * tolerance);

        if (type === "ask") {
            return { base: h1, quote: k1 };
        } else if (type === "bid") {
            return { quote: h1, base: k1 };
        } else {
            throw "Unknown type";
        }
    },
    isMarketAsset: function isMarketAsset(quote, base) {
        var isMarketAsset = false,
            marketAsset = void 0,
            inverted = false;

        if (quote.get("bitasset") && base.get("id") === quote.getIn(["bitasset", "options", "short_backing_asset"])) {
            isMarketAsset = true;
            marketAsset = { id: quote.get("id") };
        } else if (base.get("bitasset") && quote.get("id") === base.getIn(["bitasset", "options", "short_backing_asset"])) {
            inverted = true;
            isMarketAsset = true;
            marketAsset = { id: base.get("id") };
        }

        return {
            isMarketAsset: isMarketAsset,
            marketAsset: marketAsset,
            inverted: inverted
        };
    }
};

exports.default = MarketUtils;