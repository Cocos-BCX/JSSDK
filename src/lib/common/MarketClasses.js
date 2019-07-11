import {Fraction} from "fractional";

const GRAPHENE_100_PERCENT = 10000;

function limitByPrecision(value, p = 8) {
    if (typeof p !== "number") throw new Error("Input must be a number");
    let valueString = value.toString();
    let splitString = valueString.split(".");
    if (
        splitString.length === 1 ||
        (splitString.length === 2 && splitString[1].length <= p)
    ) {
        return parseFloat(valueString);
    } else {
        return parseFloat(splitString[0] + "." + splitString[1].substr(0, p));
    }
}

function precisionToRatio(p) {
    if (typeof p !== "number") throw new Error("Input must be a number");
    return Math.pow(10, p);
}

function didOrdersChange(newOrders, oldOrders) {
    let changed = oldOrders && oldOrders.size !== newOrders.size;
    if (changed) return changed;

    newOrders.forEach((a, key) => {
        let oldOrder = oldOrders.get(key);
        if (!oldOrder) {
            changed = true;
        } else {
            if (a.market_base === oldOrder.market_base) {
                changed = changed || a.ne(oldOrder);
            }
        }
    });
    return changed;
}

class Asset {
    constructor({
        asset_id = "1.3.0",
        amount = 0,
        precision = 5,
        real = null
    } = {}) {
        this.satoshi = precisionToRatio(precision);
        this.asset_id = asset_id;
        this.setAmount({sats: amount, real});
        this.precision = precision;
    }

    hasAmount() {
        return this.amount > 0;
    }

    toSats(amount = 1) {
        // Return the full integer amount in 'satoshis'
        // Round to prevent floating point math errors
        return Math.round(amount * this.satoshi);
    }

    setAmount({sats, real}) {
        if (typeof sats === "string") sats = parseInt(sats, 10);
        if (typeof real === "string") real = parseFloat(real);

        if (typeof sats !== "number" && typeof real !== "number") {
            throw new Error("Invalid arguments for setAmount");
        }
        if (typeof real === "number") {
            this.amount = this.toSats(real);
            this._clearCache();
        } else if (typeof sats === "number") {
            this.amount = Math.floor(sats);
            this._clearCache();
        } else {
            throw new Error("Invalid setAmount input");
        }
    }

    _clearCache() {
        this._real_amount = null;
    }

    getAmount({real = false} = {}) {
        if (real) {
            if (this._real_amount!=null) return this._real_amount;
            return (this._real_amount = limitByPrecision(
                this.amount / this.toSats(),
                this.precision
            ));
        } else {
            return Math.floor(this.amount);
        }
    }

    plus(asset) {
        if (asset.asset_id !== this.asset_id)
            throw new Error("Assets are not the same type");
        this.amount += asset.amount;
        this._clearCache();
    }

    minus(asset) {
        if (asset.asset_id !== this.asset_id)
            throw new Error("Assets are not the same type");
        this.amount -= asset.amount;
        this.amount = Math.max(0, this.amount);
        this._clearCache();
    }

    equals(asset) {
        return (
            this.asset_id === asset.asset_id &&
            this.getAmount() === asset.getAmount()
        );
    }

    ne(asset) {
        return !this.equals(asset);
    }

    gt(asset) {
        return this.getAmount() > asset.getAmount();
    }

    lt(asset) {
        return this.getAmount() < asset.getAmount();
    }

    times(p, isBid = false) {
        // asset amount times a price p
        let temp, amount;
        if (this.asset_id === p.base.asset_id) {
            temp = this.amount * p.quote.amount / p.base.amount;
            amount = Math.floor(temp);
            /*
            * Sometimes prices are inexact for the relevant amounts, in the case
            * of bids this means we need to round up in order to pay 1 sat more
            * than the floored price, if we don't do this the orders don't match
            */
            if (isBid && temp !== amount) {
                amount += 1;
            }
            if (amount === 0) amount = 1;
            return new Asset({
                asset_id: p.quote.asset_id,
                amount,
                precision: p.quote.precision
            });
        } else if (this.asset_id === p.quote.asset_id) {
            temp = this.amount * p.base.amount / p.quote.amount;
            amount = Math.floor(temp);
            /*
            * Sometimes prices are inexact for the relevant amounts, in the case
            * of bids this means we need to round up in order to pay 1 sat more
            * than the floored price, if we don't do this the orders don't match
            */
            if (isBid && temp !== amount) {
                amount += 1;
            }
            if (amount === 0) amount = 1;
            return new Asset({
                asset_id: p.base.asset_id,
                amount,
                precision: p.base.precision
            });
        }
        throw new Error("Invalid asset types for price multiplication");
    }

    divide(quote, base = this) {
        return new Price({base, quote});
    }

    toObject() {
        return {
            asset_id: this.asset_id,
            amount: this.amount
        };
    }

    clone(amount = this.amount) {
        return new Asset({
            amount,
            asset_id: this.asset_id,
            precision: this.precision
        });
    }
}

/**
 * @brief The price struct stores asset prices in the Graphene system.
 *
 * A price is defined as a ratio between two assets, and represents a possible exchange rate between those two
 * assets. prices are generally not stored in any simplified form, i.e. a price of (1000 CORE)/(20 USD) is perfectly
 * normal.
 *
 * The assets within a price are labeled base and quote. Throughout the Graphene code base, the convention used is
 * that the base asset is the asset being sold, and the quote asset is the asset being purchased, where the price is
 * represented as base/quote, so in the example price above the seller is looking to sell CORE asset and get USD in
 * return.
 */

class Price {
    constructor({base, quote, real = false} = {}) {
        if (!base || !quote) {
            throw new Error("Base and Quote assets must be defined");
        }
        if (base.asset_id === quote.asset_id) {
            throw new Error("Base and Quote assets must be different");
        }

        base = base.clone();
        quote = quote.clone();
        if (real && typeof real === "number") {
            /*
            * In order to make large numbers work properly, we assume numbers
            * larger than 100k do not need more than 5 decimals. Without this we
            * quickly encounter JavaScript floating point errors for large numbers.
            */
            if (real > 100000) {
                real = limitByPrecision(real, 5);
            }
            let frac = new Fraction(real);
            let baseSats = base.toSats(),
                quoteSats = quote.toSats();
            let numRatio = baseSats / quoteSats,
                denRatio = quoteSats / baseSats;

            if (baseSats >= quoteSats) {
                denRatio = 1;
            } else {
                numRatio = 1;
            }

            base.amount = frac.numerator * numRatio;
            quote.amount = frac.denominator * denRatio;
        } else if (real === 0) {
            base.amount = 0;
            quote.amount = 0;
        }

        if (
            !base.asset_id ||
            !("amount" in base) ||
            !quote.asset_id ||
            !("amount" in quote)
        )
            throw new Error("Invalid Price inputs");
        this.base = base;
        this.quote = quote;
    }

    getUnits() {
        return this.base.asset_id + "_" + this.quote.asset_id;
    }

    isValid() {
        return (
            this.base.amount !== 0 &&
            this.quote.amount !== 0 &&
            !isNaN(this.toReal()) &&
            isFinite(this.toReal())
        );
    }

    toReal(sameBase = false) {
        const key = sameBase ? "_samebase_real" : "_not_samebase_real";
        if (this[key]) {
            return this[key];
        }
        let real = sameBase
            ? this.quote.amount *
              this.base.toSats() /
              (this.base.amount * this.quote.toSats())
            : this.base.amount *
              this.quote.toSats() /
              (this.quote.amount * this.base.toSats());
        return (this[key] = parseFloat(real.toFixed(8))); // toFixed and parseFloat helps avoid floating point errors for really big or small numbers
    }

    invert() {
        return new Price({
            base: this.quote,
            quote: this.base
        });
    }

    clone(real = null) {
        return new Price({
            base: this.base,
            quote: this.quote,
            real
        });
    }

    equals(b) {
        if (
            this.base.asset_id !== b.base.asset_id ||
            this.quote.asset_id !== b.quote.asset_id
        ) {
            // console.error("Cannot compare prices for different assets");
            return false;
        }
        const amult = b.quote.amount * this.base.amount;
        const bmult = this.quote.amount * b.base.amount;

        return amult === bmult;
    }

    lt(b) {
        if (
            this.base.asset_id !== b.base.asset_id ||
            this.quote.asset_id !== b.quote.asset_id
        ) {
            throw new Error("Cannot compare prices for different assets");
        }
        const amult = b.quote.amount * this.base.amount;
        const bmult = this.quote.amount * b.base.amount;

        return amult < bmult;
    }

    lte(b) {
        return this.equals(b) || this.lt(b);
    }

    ne(b) {
        return !this.equals(b);
    }

    gt(b) {
        return !this.lte(b);
    }

    gte(b) {
        return !this.lt(b);
    }

    toObject() {
        return {
            base: this.base.toObject(),
            quote: this.quote.toObject()
        };
    }

    times(p, common = "1.3.0") {
        const p2 =
            (p.base.asset_id === common && this.quote.asset_id === common) ||
            (p.quote.asset_id === common && this.base.asset_id === common)
                ? p.clone()
                : p.invert();

        const np = p2.toReal() * this.toReal();
        return new Price({
            base: p2.base,
            quote: this.quote,
            real: np
        });
    }
}

class FeedPrice extends Price {
    constructor({priceObject, assets, market_base, sqr, real = false}) {
        if (
            !priceObject ||
            typeof priceObject !== "object" ||
            !market_base ||
            !assets ||
            !sqr
        ) {
            throw new Error("Invalid FeedPrice inputs");
        }

        if (priceObject.toJS) {
            priceObject = priceObject.toJS();
        }

        const inverted = market_base === priceObject.base.asset_id;

        const base = new Asset({
            asset_id: priceObject.base.asset_id,
            amount: priceObject.base.amount,
            precision: assets[priceObject.base.asset_id].precision
        });

        const quote = new Asset({
            asset_id: priceObject.quote.asset_id,
            amount: priceObject.quote.amount,
            precision: assets[priceObject.quote.asset_id].precision
        });

        super({
            base: inverted ? quote : base,
            quote: inverted ? base : quote,
            real
        });

        this.sqr = parseInt(sqr, 10) / 1000;
        this.inverted = inverted;
    }

    getSqueezePrice({real = false} = {}) {
        if (!this._squeeze_price) {
            this._squeeze_price = this.clone();
            if (this.inverted)
                this._squeeze_price.base.amount = Math.floor(
                    this._squeeze_price.base.amount * this.sqr
                );
            if (!this.inverted)
                this._squeeze_price.quote.amount = Math.floor(
                    this._squeeze_price.quote.amount * this.sqr
                );
        }

        if (real) {
            return this._squeeze_price.toReal();
        }
        return this._squeeze_price;
    }
}

class LimitOrderCreate {
    constructor({
        for_sale,
        to_receive,
        seller = "",
        expiration = new Date(),
        fill_or_kill = false,
        fee = {amount: 0, asset_id: "1.3.0"}
    } = {}) {
        if (!for_sale || !to_receive) {
            throw new Error("Missing order amounts");
        }

        if (for_sale.asset_id === to_receive.asset_id) {
            throw new Error("Order assets cannot be the same");
        }

        this.amount_for_sale = for_sale;
        this.min_to_receive = to_receive;
        this.setExpiration(expiration);
        this.fill_or_kill = fill_or_kill;
        this.seller = seller;
        this.fee = fee;
    }

    setExpiration(expiration = null) {
        if (!expiration) {
            expiration = new Date();
            expiration.setYear(expiration.getFullYear() + 5);
        }
        this.expiration = expiration;
    }

    getExpiration() {
        return this.expiration;
    }

    toObject() {
        return {
            seller: this.seller,
            min_to_receive: this.min_to_receive.toObject(),
            amount_to_sell: this.amount_for_sale.toObject(),
            expiration: this.expiration,
            fill_or_kill: this.fill_or_kill,
            fee: this.fee
        };
    }
}


class LimitOrder {
    constructor(order, assets, market_base) {
        if (!market_base) {
            throw new Error("LimitOrder requires a market_base id");
        }
        this.assets = assets;
        this.market_base = market_base;
        this.id = order.id;
        this.expiration = order.expiration && new Date(order.expiration);
        this.seller = order.seller;
        this.for_sale = parseInt(order.for_sale, 10); // asset id is sell_price.base.asset_id

        let base = new Asset({
            asset_id: order.sell_price.base.asset_id,
            amount: parseInt(order.sell_price.base.amount, 10),
            precision: assets[order.sell_price.base.asset_id].precision
        });
        let quote = new Asset({
            asset_id: order.sell_price.quote.asset_id,
            amount: parseInt(order.sell_price.quote.amount, 10),
            precision: assets[order.sell_price.quote.asset_id].precision
        });

        this.sell_price = new Price({
            base, quote
        });

        this.fee = order.deferred_fee;
    }

    getPrice(p = this.sell_price) {
        if (this._real_price) {
            return this._real_price;
        }
        return this._real_price = p.toReal(p.base.asset_id === this.market_base);
    }

    isBid() {
        return !(this.sell_price.base.asset_id === this.market_base);
    }

    isCall() {
        return false;
    }

    sellPrice() {
        return this.sell_price;
    }

    amountForSale() {
        if (this._for_sale) return this._for_sale;
        return this._for_sale = new Asset({
            asset_id: this.sell_price.base.asset_id,
            amount: this.for_sale,
            precision: this.assets[this.sell_price.base.asset_id].precision
        });
    }

    amountToReceive(isBid = this.isBid()) {
        if (this._to_receive) return this._to_receive;
        this._to_receive = this.amountForSale().times(this.sell_price, isBid);
        return this._to_receive;
    }

    sum(order) {
        this.for_sale += order.for_sale;
        this._for_sale = null;
        this._total_to_receive = null;
        this._total_for_sale = null;
    }

    ne(order) {
        return (
            this.sell_price.ne(order.sell_price) ||
            this.for_sale !== order.for_sale
        );
    }

    equals(order) {
        return !this.ne(order);
    }

    setTotalToReceive(total) {
        this.total_to_receive = total;
    }

    setTotalForSale(total) {
        this.total_for_sale = total;
        this._total_to_receive = null;
    }

    totalToReceive({noCache = false} = {}) {
        if (!noCache && this._total_to_receive) return this._total_to_receive;
        this._total_to_receive = (this.total_to_receive || this.amountToReceive()).clone();
        return this._total_to_receive;
    }

    totalForSale({noCache = false} = {}) {
        if (!noCache && this._total_for_sale) return this._total_for_sale;
        return this._total_for_sale = (this.total_for_sale || this.amountForSale()).clone();
    }
}
// class LimitOrder {
//     constructor(order, assets, market_base) {
//         if (!market_base) {
//             throw new Error("LimitOrder requires a market_base id");
//         }
//         this.order = order;
//         this.assets = assets;
//         this.market_base = market_base;
//         this.id = order.id;
//         this.sellers = [order.seller];
//         this.expiration = order.expiration && new Date(order.expiration);
//         this.seller = order.seller;
//         this.for_sale = parseInt(order.for_sale, 10); // asset id is sell_price.base.asset_id

//         let base = new Asset({
//             asset_id: order.sell_price.base.asset_id,
//             amount: parseInt(order.sell_price.base.amount, 10),
//             precision: assets[order.sell_price.base.asset_id].precision
//         });
//         let quote = new Asset({
//             asset_id: order.sell_price.quote.asset_id,
//             amount: parseInt(order.sell_price.quote.amount, 10),
//             precision: assets[order.sell_price.quote.asset_id].precision
//         });

//         this.sell_price = new Price({
//             base,
//             quote
//         });

//         this.fee = order.deferred_fee;
//     }

//     getPrice(p = this.sell_price) {
//         if (this._real_price) {
//             return this._real_price;
//         }
//         return (this._real_price = p.toReal(
//             p.base.asset_id === this.market_base
//         ));
//     }

//     isBid() {
//         return !(this.sell_price.base.asset_id === this.market_base);
//     }

//     isCall() {
//         return false;
//     }

//     sellPrice() {
//         return this.sell_price;
//     }

//     amountForSale() {
//         if (this._for_sale) return this._for_sale;
//         return (this._for_sale = new Asset({
//             asset_id: this.sell_price.base.asset_id,
//             amount: this.for_sale,
//             precision: this.assets[this.sell_price.base.asset_id].precision
//         }));
//     }

//     amountToReceive(isBid = this.isBid()) {
//         if (this._to_receive) return this._to_receive;
//         this._to_receive = this.amountForSale().times(this.sell_price, isBid);
//         return this._to_receive;
//     }

//     sum(order) {
//         let newOrder = this.clone();
//         if (newOrder.sellers.indexOf(order.seller) === -1) {
//             newOrder.sellers.push(order.seller);
//         }
//         newOrder.for_sale += order.for_sale;
//         console.info("newOrder.for_sale",newOrder.for_sale);
//         return newOrder;
//     }

//     isMine(id) {
//         return this.sellers.indexOf(id) !== -1;
//     }

//     clone() {
//         return new LimitOrder(this.order, this.assets, this.market_base);
//     }

//     ne(order) {
//         return (
//             this.sell_price.ne(order.sell_price) ||
//             this.for_sale !== order.for_sale
//         );
//     }

//     equals(order) {
//         return !this.ne(order);
//     }

//     setTotalToReceive(total) {
//         this.total_to_receive = total;
//     }

//     setTotalForSale(total) {
//         this.total_for_sale = total;
//         this._total_to_receive = null;
//     }

//     totalToReceive({noCache = false} = {}) {
//         if (!noCache && this._total_to_receive) return this._total_to_receive;
//         this._total_to_receive = (
//             this.total_to_receive || this.amountToReceive()
//         ).clone();
//         return this._total_to_receive;
//     }

//     totalForSale({noCache = false} = {}) {
//         if (!noCache && this._total_for_sale) return this._total_for_sale;
//         return (this._total_for_sale = (
//             this.total_for_sale || this.amountForSale()
//         ).clone());
//     }
// }

class CallOrder {
    constructor(
        order,
        assets,
        market_base,
        feed,
        is_prediction_market = false
    ) {
        if (!order || !assets || !market_base || !feed) {
            throw new Error("CallOrder missing inputs");
        }

        this.order = order;
        this.assets = assets;
        this.market_base = market_base;
        this.is_prediction_market = is_prediction_market;
        this.inverted = market_base === order.call_price.base.asset_id;
        this.id = order.id;
        this.borrower = order.borrower;
        this.borrowers = [order.borrower];
        /* Collateral asset type is call_price.base.asset_id */
        this.for_sale = parseInt(order.collateral, 10);
        this.for_sale_id = order.call_price.base.asset_id;
        /* Debt asset type is call_price.quote.asset_id */
        this.to_receive = parseInt(order.debt, 10);
        this.to_receive_id = order.call_price.quote.asset_id;

        let base = new Asset({
            asset_id: order.call_price.base.asset_id,
            amount: parseInt(order.call_price.base.amount, 10),
            precision: assets[order.call_price.base.asset_id].precision
        });
        let quote = new Asset({
            asset_id: order.call_price.quote.asset_id,
            amount: parseInt(order.call_price.quote.amount, 10),
            precision: assets[order.call_price.quote.asset_id].precision
        });

        /*
        * The call price is DEBT * MCR / COLLATERAL. This calculation is already
        * done by the witness_node before returning the orders so it is not necessary
        * to deal with the MCR (maintenance collateral ratio) here.
        */
        this.call_price = new Price({
            base: this.inverted ? quote : base,
            quote: this.inverted ? base : quote
        });

        if (feed.base.asset_id !== this.call_price.base.asset_id) {
            throw new Error(
                "Feed price assets and call price assets must be the same"
            );
        }

        this.feed_price = feed;
    }

    clone(f = this.feed_price) {
        return new CallOrder(this.order, this.assets, this.market_base, f);
    }

    setFeed(f) {
        this.feed_price = f;
        this._clearCache();
    }

    getPrice(squeeze = true, p = this.call_price) {
        if (squeeze) {
            return this.getSqueezePrice();
        }
        if (this._real_price) {
            return this._real_price;
        }
        return (this._real_price = p.toReal(
            p.base.asset_id === this.market_base
        ));
    }

    getFeedPrice(f = this.feed_price) {
        if (this._feed_price) {
            return this._feed_price;
        }
        return (this._feed_price = f.toReal(
            f.base.asset_id === this.market_base
        ));
    }

    getSqueezePrice(f = this.feed_price) {
        if (this._squeeze_price) {
            return this._squeeze_price;
        }
        return (this._squeeze_price = f.getSqueezePrice().toReal());
    }

    isMarginCalled() {
        if (this.is_prediction_market) return false;
        return this.isBid()
            ? this.call_price.lt(this.feed_price)
            : this.call_price.gt(this.feed_price);
    }

    isBid() {
        return !this.inverted;
    }

    isCall() {
        return true;
    }

    sellPrice(squeeze = true) {
        if (squeeze) {
            return this.isBid()
                ? this.feed_price.getSqueezePrice()
                : this.feed_price.getSqueezePrice().invert();
        }
        return this.call_price;
    }

    getCollateral() {
        if (this._collateral) return this._collateral;
        return (this._collateral = new Asset({
            amount: this.for_sale,
            asset_id: this.for_sale_id,
            precision: this.assets[this.for_sale_id].precision
        }));
    }

    amountForSale(isBid = this.isBid()) {
        if (this._for_sale) return this._for_sale;
        return (this._for_sale = this.amountToReceive().times(
            this.feed_price.getSqueezePrice(),
            isBid
        ));
    }

    amountToReceive() {
        if (this._to_receive) return this._to_receive;
        // return this._to_receive = this.amountForSale().times(this.feed_price.getSqueezePrice(), isBid);
        return (this._to_receive = new Asset({
            asset_id: this.to_receive_id,
            amount: this.to_receive,
            precision: this.assets[this.to_receive_id].precision
        }));
    }

    sum(order) {
        let newOrder = this.clone();
        if (newOrder.borrowers.indexOf(order.borrower) === -1) {
            newOrder.borrowers.push(order.borrower);
        }
        newOrder.to_receive += order.to_receive;
        newOrder.for_sale += order.for_sale;
        newOrder._clearCache();
        return newOrder;
    }

    _clearCache() {
        this._for_sale = null;
        this._to_receive = null;
        this._feed_price = null;
        this._squeeze_price = null;
        this._total_to_receive = null;
        this._total_for_sale = null;
    }

    ne(order) {
        return (
            this.call_price.ne(order.call_price) ||
            this.feed_price.ne(order.feed_price) ||
            this.to_receive !== order.to_receive ||
            this.for_sale !== order.for_sale
        );
    }

    equals(order) {
        return !this.ne(order);
    }

    setTotalToReceive(total) {
        this.total_to_receive = total;
    }

    setTotalForSale(total) {
        this.total_for_sale = total;
    }

    totalToReceive({noCache = false} = {}) {
        if (!noCache && this._total_to_receive) return this._total_to_receive;
        this._total_to_receive = (
            this.total_to_receive || this.amountToReceive()
        ).clone();
        return this._total_to_receive;
    }

    totalForSale({noCache = false} = {}) {
        if (!noCache && this._total_for_sale) return this._total_for_sale;
        return (this._total_for_sale = (
            this.total_for_sale || this.amountForSale()
        ).clone());
    }

    getRatio() {
        return (
            this.getCollateral().getAmount({real: true}) /
            this.amountToReceive().getAmount({real: true}) /
            this.getFeedPrice()
        );
    }

    getStatus() {
        const mr =
            this.assets[this.to_receive_id].bitasset.current_feed
                .maintenance_collateral_ratio / 1000;
        const cr = this.getRatio();

        if (isNaN(cr)) return null;
        if (cr < mr) {
            return "danger";
        } else if (cr < mr + 0.5) {
            return "warning";
        } else {
            return "";
        }
    }

    isMine(id) {
        return this.borrowers.indexOf(id) !== -1;
    }
}

class SettleOrder extends LimitOrder {
    constructor(order, assets, market_base, feed_price, bitasset_options) {
        if (!feed_price || !bitasset_options) {
            throw new Error(
                "SettleOrder needs feed_price and bitasset_options inputs"
            );
        }

        order.sell_price = feed_price.toObject();
        order.seller = order.owner;
        super(order, assets, market_base);

        this.offset_percent = bitasset_options.force_settlement_offset_percent;
        this.settlement_date = new Date(order.settlement_date);

        this.for_sale = new Asset({
            amount: order.balance.amount,
            asset_id: order.balance.asset_id,
            precision: assets[order.balance.asset_id].precision
        });

        this.inverted = this.for_sale.asset_id === market_base;
        this.feed_price = feed_price[this.inverted ? "invert" : "clone"]();
    }

    isBefore(order) {
        return this.settlement_date < order.settlement_date;
    }

    amountForSale() {
        return this.for_sale;
    }

    amountToReceive() {
        let to_receive = this.for_sale.times(this.feed_price, this.isBid());
        to_receive.setAmount({
            sats:
                to_receive.getAmount() *
                ((GRAPHENE_100_PERCENT - this.offset_percent) /
                    GRAPHENE_100_PERCENT)
        });
        return (this._to_receive = to_receive);
    }

    isBid() {
        return !this.inverted;
    }
}

export {
    Asset,
    Price,
    FeedPrice,
    LimitOrderCreate,
    limitByPrecision,
    precisionToRatio,
    LimitOrder,
    CallOrder,
    SettleOrder,
    didOrdersChange
};
