import utils from "./utils";
import {ChainStore, ChainTypes} from "bcxjs-cores";
let {object_type} = ChainTypes;
let opTypes = Object.keys(object_type);

const MarketUtils = {
    order_type(id) {
        if (typeof id !== "string") {
            return false;
        }
        let type = id.split(".")[1];
        return opTypes[type];
    },

    isAsk(order, base) {
        let baseId = base.toJS ? base.get("id") : base.id;
        ;

        if (order.sell_price) {
            return order.sell_price.quote.asset_id === baseId;
        } else if (order.call_price) {
            return order.call_price.quote.asset_id === baseId;
        }
    },

    isAskOp(op) {
        return op.amount_to_sell.asset_id !== op.fee.asset_id;
    },

    getMarketName(base, quote) {
        // if (!base || !quote) return {marketName: "_"};
        let baseID = parseInt(base.split(".")[2], 10);
        let quoteID = parseInt(quote.split(".")[2], 10);

        let first = quoteID > baseID ? quote : base;
        let second = quoteID > baseID ? base : quote;

        // const marketName = `${first.get("symbol")}_${second.get("symbol")}`;
        return {baseID, quoteID, first, second};
    },
    limitByPrecision(value, asset, floor = true) {
        let assetPrecision = asset.toJS ? asset.get("precision") : asset.precision;
        let valueString = value.toString();
        let splitString = valueString.split(".");
        if (splitString.length === 1 || splitString.length === 2 && splitString[1].length <= assetPrecision) {
            return value;
        }
        let precision = utils.get_asset_precision(assetPrecision);
        value = floor ? Math.floor(value * precision) / precision : Math.round(value * precision) / precision;
        if (isNaN(value) || !isFinite(value)) {
            return 0;
        }
        return value;
    },

    getFeedPrice(settlement_price, invert = false) {
        let quoteAsset = ChainStore.getAsset(settlement_price.getIn(["quote", "asset_id"]));
        let baseAsset = ChainStore.getAsset(settlement_price.getIn(["base", "asset_id"]));

        let price = utils.get_asset_price(
            settlement_price.getIn(["quote", "amount"]),
            quoteAsset,
            settlement_price.getIn(["base", "amount"]),
            baseAsset
        );

        if (invert) {
            return 1 / price;
        } else {
            return price;
        }
    },

    parseOrder(order, base, quote, invert = false) {
        let ask = this.isAsk(order, base);

        let quotePrecision = utils.get_asset_precision(quote.toJS ? quote.get("precision") : quote.precision);
        let basePrecision = utils.get_asset_precision(base.toJS ? base.get("precision") : base.precision);
        let pricePrecision = order.call_price ?
            (quote.toJS ? quote.get("precision") : quote.precision) :
            (base.toJS ? base.get("precision") : base.precision);

        let buy, sell;
        let callPrice;
        if (order.sell_price) {
            buy = ask ? order.sell_price.base : order.sell_price.quote;
            sell = ask ? order.sell_price.quote : order.sell_price.base;
        } else if (order.call_price) {
            buy = order.call_price.base;
            sell = order.call_price.quote;
            let marginPrice = (buy.amount / basePrecision) / (sell.amount / quotePrecision);
            if (!invert) {
                callPrice = marginPrice;
            } else {
                callPrice = 1 / (marginPrice);
            }
        }

        if (typeof sell.amount !== "number") {
            sell.amount = parseInt(sell.amount, 10);
        }

        if (typeof buy.amount !== "number") {
            buy.amount = parseInt(buy.amount, 10);
        }
        let fullPrice = callPrice ? callPrice : (sell.amount / basePrecision) / (buy.amount / quotePrecision)
        let price = utils.price_to_text(fullPrice, order.call_price ? base : quote, order.call_price ? quote : base);

        let amount, value;

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
            amount = this.limitByPrecision((buy.amount / sell.amount) * order.for_sale / quotePrecision, quote);
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

    parse_order_history(order, paysAsset, receivesAsset, isAsk, flipped) {
        let isCall = order.order_id.split(".")[1] == object_type.limit_order ? false : true;
        let receivePrecision = utils.get_asset_precision(receivesAsset.get("precision"));
        let payPrecision = utils.get_asset_precision(paysAsset.get("precision"));

        let receives = order.receives.amount / receivePrecision;
        receives = utils.format_number(receives, receivesAsset.get("precision"));
        let pays = order.pays.amount / payPrecision;
        pays = utils.format_number(pays, paysAsset.get("precision"));
        let price_full = utils.get_asset_price(order.receives.amount, receivesAsset, order.pays.amount, paysAsset, isAsk);
        // price_full = !flipped ? (1 / price_full) : price_full;
        // let {int, dec} = this.split_price(price_full, isAsk ? receivesAsset.get("precision") : paysAsset.get("precision"));

        let {int, dec, trailing} = utils.price_to_text(price_full, isAsk ? receivesAsset : paysAsset, isAsk ? paysAsset : receivesAsset);
        let className = isCall ? "orderHistoryCall" : isAsk ? "orderHistoryBid" : "orderHistoryAsk";

        let time;
        if (order.time) {
            time = order.time.split("T")[1];
            let now = new Date();
            let offset = now.getTimezoneOffset() / 60;
            let date = utils.format_date(order.time + "Z").split(/\W/);
            let hour = time.substr(0, 2);
            let hourNumber = parseInt(hour, 10);
            let localHour = hourNumber - offset;
            if (localHour >= 24) {
                localHour -= 24;
            } else if (localHour < 0) {
                localHour += 24;
            }
            let hourString = localHour.toString();
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

    split_price(price, pricePrecision) {
        // We need to figure out a better way to set the number of decimals
        let price_split = utils.format_number(price, Math.max(5, pricePrecision)).split(".");
        let int = price_split[0];
        let dec = price_split[1];
        return {int: int, dec: dec};
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

    flatten_orderbookchart_highcharts(array, sumBoolean, inverse, precision) {
        inverse = inverse === undefined ? false : inverse;
        let orderBookArray = [];
        let arrayLength;

        if (inverse) {

            if (array && array.length) {
                arrayLength = array.length - 1;
                orderBookArray.unshift([array[arrayLength][0], array[arrayLength][1]]);
                if (array.length > 1) {
                    for (let i = array.length - 2; i >= 0; i--) {
                        if (sumBoolean) {
                            array[i][1] += array[i + 1][1];
                        }
                        orderBookArray.unshift([array[i][0], array[i][1]]);
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

    priceToObject(x, type) {
        let tolerance = 1.0E-8;
        let h1 = 1;
        let h2 = 0;
        let k1 = 0;
        let k2 = 1;
        let b = x;
        do {
            let a = Math.floor(b);
            let aux = h1;
            h1 = a * h1 + h2;
            h2 = aux;
            aux = k1;
            k1 = a * k1 + k2;
            k2 = aux;
            b = 1 / (b - a);
        } while (Math.abs(x - h1 / k1) > x * tolerance);

        if (type === "ask") {
            return {base: h1, quote: k1};
        } else if (type === "bid") {
            return {quote: h1, base: k1};
        } else {
            throw "Unknown type";
        }
    },

    isMarketAsset(quote, base) {
        let isMarketAsset = false, marketAsset, inverted = false;

        if (quote.get("bitasset") && base.get("id") === quote.getIn(["bitasset", "options", "short_backing_asset"])) {
            isMarketAsset = true;
            marketAsset = {id: quote.get("id")};
        } else if (base.get("bitasset") && quote.get("id") === base.getIn(["bitasset", "options", "short_backing_asset"])) {
            inverted = true;
            isMarketAsset = true;
            marketAsset = {id: base.get("id")};
        }

        return {
            isMarketAsset,
            marketAsset,
            inverted
        };
    }
};

export default MarketUtils;
