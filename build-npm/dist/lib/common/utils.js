"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _getIterator2 = require("babel-runtime/core-js/get-iterator");

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _parseInt = require("babel-runtime/core-js/number/parse-int");

var _parseInt2 = _interopRequireDefault(_parseInt);

var _numeral = require("numeral");

var _numeral2 = _interopRequireDefault(_numeral);

var _MarketClasses = require("./MarketClasses");

var _bcxjsCores = require("bcxjs-cores");

var _immutable = require("immutable");

var _immutable2 = _interopRequireDefault(_immutable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var id_regex = /\b\d+\.\d+\.(\d+)\b/;
var object_type = _bcxjsCores.ChainTypes.object_type,
    operations = _bcxjsCores.ChainTypes.operations;


var Utils = {
    get_object_id: function get_object_id(obj_id) {
        var id_regex_res = id_regex.exec(obj_id);
        return id_regex_res ? (0, _parseInt2.default)(id_regex_res[1]) : 0;
    },

    is_object_id: function is_object_id(obj_id) {
        if ('string' != typeof obj_id) return false;
        var match = id_regex.exec(obj_id);
        return match !== null && obj_id.split(".").length === 3;
    },

    is_object_type: function is_object_type(obj_id, type) {
        var prefix = object_type[type];
        if (!prefix || !obj_id) return null;
        prefix = "1." + prefix.toString();
        return obj_id.substring(0, prefix.length) === prefix;
    },

    get_satoshi_amount: function get_satoshi_amount(amount, asset) {
        var precision = asset.toJS ? asset.get("precision") : asset.precision;
        var assetPrecision = this.get_asset_precision(precision);
        amount = typeof amount === "string" ? amount : amount.toString();

        var decimalPosition = amount.indexOf(".");
        if (decimalPosition === -1) {
            return parseInt(amount, 10) * assetPrecision;
        } else {
            var amountLength = amount.length,
                i = void 0;
            amount = amount.replace(".", "");
            amount = amount.substr(0, decimalPosition + precision);
            for (i = 0; i < precision; i++) {
                decimalPosition += 1;
                if (decimalPosition > amount.length) {
                    amount += "0";
                }
            }
            ;

            return parseInt(amount, 10);
        }
    },


    get_asset_precision: function get_asset_precision(precision) {
        precision = precision.toJS ? precision.get("precision") : precision;
        return Math.pow(10, precision);
    },

    get_asset_amount: function get_asset_amount(amount, asset) {
        if (amount === 0) return amount;
        if (!amount) return null;
        return amount / this.get_asset_precision(asset.toJS ? asset.get("precision") : asset.precision);
    },

    get_asset_price: function get_asset_price(quoteAmount, quoteAsset, baseAmount, baseAsset) {
        var inverted = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

        if (!quoteAsset || !baseAsset) {
            return 1;
        }
        var price = this.get_asset_amount(quoteAmount, quoteAsset) / this.get_asset_amount(baseAmount, baseAsset);
        // if(isNaN(price)) price=0;
        if (price == Infinity || isNaN(price)) return 0;
        return inverted ? 1 / price : price;
    },

    round_number: function round_number(number, asset) {
        var assetPrecision = asset.toJS ? asset.get("precision") : asset.precision;
        var precision = this.get_asset_precision(assetPrecision);
        return Math.round(number * precision) / precision;
    },

    format_volume: function format_volume(amount) {

        if (amount < 10000) {
            return this.format_number(amount, 3);
        } else if (amount < 1000000) {
            return (Math.round(amount / 10) / 100).toFixed(2) + "k";
        } else {
            return (Math.round(amount / 10000) / 100).toFixed(2) + "M";
        }
    },
    format_volume_s: function format_volume_s(amount) {

        if (amount < 1000) {
            return this.format_number(amount, 3);
        } else if (amount < 100000) {
            return (Math.round(amount / 10) / 100).toFixed(2) + "k";
        } else {
            return (Math.round(amount / 10000) / 100).toFixed(2) + "M";
        }
    },


    format_number: function format_number(number, decimals) {
        var trailing_zeros = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

        if (isNaN(number) || !isFinite(number) || number === undefined || number === null) return "" || 0;
        var zeros = ".";
        for (var i = 0; i < decimals; i++) {
            zeros += "0";
        }
        var num = (0, _numeral2.default)(number).format("0,0" + zeros);
        if (num.indexOf('.') > 0 && !trailing_zeros) {
            num = num.replace(/0+$/, "").replace(/\.$/, "");
            return num || 0;
        }
        num = num.replace(/,/g, "") || 0;
        return num;
    },
    formatNumber: function formatNumber(num, s) {
        var z = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

        num = num.replace(',', "");
        if (isNaN(num)) return num;
        var zeros = ".";
        for (var i = 0; i < s; i++) {
            zeros += "0";
        }
        var x = parseFloat(num);
        var m = (0, _numeral2.default)(x.toFixed(s)).format("0,0" + zeros);
        if (m.indexOf('.') > 0 && !z) m = m.replace(/0+$/, "").replace(/\.$/, "");
        return m;
    },

    format_asset: function format_asset(amount, asset, noSymbol) {
        var trailing_zeros = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

        var symbol = void 0;
        var digits = 0;
        if (asset === undefined) return undefined;
        if ('symbol' in asset) {
            // console.log( "asset: ", asset )
            symbol = asset.symbol;
            digits = asset.precision;
        } else {
            // console.log( "asset: ", asset.toJS() )
            symbol = asset.get('symbol');
            digits = asset.get('precision');
        }
        var precision = this.get_asset_precision(digits);
        // console.log( "precision: ", precision )

        return "" + this.format_number(amount / precision, digits, trailing_zeros) + (!noSymbol ? " " + symbol : "");
    },

    format_price: function format_price(quoteAmount, quoteAsset, baseAmount, baseAsset, noSymbol) {
        var inverted = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
        var trailing_zeros = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : true;

        if (quoteAsset.size) quoteAsset = quoteAsset.toJS();
        if (baseAsset.size) baseAsset = baseAsset.toJS();

        var precision = this.get_asset_precision(quoteAsset.precision);
        var basePrecision = this.get_asset_precision(baseAsset.precision);

        if (inverted) {
            if (parseInt(quoteAsset.id.split(".")[2], 10) < parseInt(baseAsset.id.split(".")[2], 10)) {
                return "" + this.format_number(quoteAmount / precision / (baseAmount / basePrecision), Math.max(5, quoteAsset.precision), trailing_zeros) + (!noSymbol ? " " + quoteAsset.symbol + "/" + baseAsset.symbol : "");
            } else {
                return "" + this.format_number(baseAmount / basePrecision / (quoteAmount / precision), Math.max(5, baseAsset.precision), trailing_zeros) + (!noSymbol ? " " + baseAsset.symbol + "/" + quoteAsset.symbol : "");
            }
        } else {
            if (parseInt(quoteAsset.id.split(".")[2], 10) > parseInt(baseAsset.id.split(".")[2], 10)) {
                return "" + this.format_number(quoteAmount / precision / (baseAmount / basePrecision), Math.max(5, quoteAsset.precision), trailing_zeros) + (!noSymbol ? " " + quoteAsset.symbol + "/" + baseAsset.symbol : "");
            } else {
                return "" + this.format_number(baseAmount / basePrecision / (quoteAmount / precision), Math.max(5, baseAsset.precision), trailing_zeros) + (!noSymbol ? " " + baseAsset.symbol + "/" + quoteAsset.symbol : "");
            }
        }
    },

    price_text: function price_text(price, base, quote) {
        var maxDecimals = 8;
        var priceText = void 0;
        var quoteID = quote.toJS ? quote.get("id") : quote.id;
        var quotePrecision = quote.toJS ? quote.get("precision") : quote.precision;
        var baseID = base.toJS ? base.get("id") : base.id;
        var basePrecision = base.toJS ? base.get("precision") : base.precision;
        if (quoteID === "1.3.0") {
            priceText = this.format_number(price, quotePrecision);
        } else if (baseID === "1.3.0") {
            priceText = this.format_number(price, Math.min(maxDecimals, quotePrecision + 2));
        } else {
            priceText = this.format_number(price, Math.min(maxDecimals, quotePrecision + basePrecision));
        }
        return priceText;
    },

    price_to_text: function price_to_text(price, base, quote) {
        var forcePrecision = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

        if (typeof price !== "number" || !base || !quote) {
            return;
        }

        if (price === Infinity) {
            price = 0;
        }
        var precision = void 0;
        var priceText = void 0;

        if (forcePrecision) {
            priceText = this.format_number(price, forcePrecision);
        } else {
            priceText = this.price_text(price, base, quote);
        }
        var price_split = priceText.split(".");
        var int = price_split[0];
        var dec = price_split[1];
        var i = void 0;

        var zeros = 0;
        if (dec) {
            if (price > 1) {
                var l = dec.length;
                for (i = l - 1; i >= 0; i--) {
                    if (dec[i] !== "0") {
                        break;
                    }
                    zeros++;
                }
                ;
            } else {
                var _l = dec.length;
                for (i = 0; i < _l; i++) {
                    if (dec[i] !== "0") {
                        i--;
                        break;
                    }
                    zeros++;
                }
                ;
            }
        }

        var trailing = zeros ? dec.substr(Math.max(0, i + 1), dec.length) : null;

        if (trailing) {
            if (trailing.length === dec.length) {
                dec = null;
            } else if (trailing.length) {
                dec = dec.substr(0, i + 1);
            }
        }

        return {
            text: priceText,
            int: int,
            dec: dec,
            trailing: trailing,
            full: price
        };
    },

    get_op_type: function get_op_type(object) {
        var type = parseInt(object.split(".")[1], 10);

        for (var id in object_type) {
            if (object_type[id] === type) {
                return id;
            }
        }
    },

    add_comma: function add_comma(value) {
        if (typeof value === "number") {
            value = value.toString();
        }
        value = value.trim();
        value = value.replace(/,/g, "");
        if (value == "." || value == "") {
            return value;
        } else if (value.length) {
            // console.log( "before: ",value )
            var n = Number(value);
            if (isNaN(n)) return;
            var parts = value.split('.');
            // console.log( "split: ", parts )
            n = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            if (parts.length > 1) n += "." + parts[1];
            // console.log( "after: ",transfer.amount )
            return n;
        }
    },

    parse_float_with_comma: function parse_float_with_comma(value) {
        // let value = new_state.transfer.amount
        // United Labs of BCTech.
        value = value.replace(/,/g, "");
        var fvalue = parseFloat(value);
        if (value.length && isNaN(fvalue) && value != ".") throw "parse_float_with_comma: must be a number";else if (fvalue < 0) return 0;

        return fvalue;
    },

    are_equal_shallow: function are_equal_shallow(a, b) {
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length > b.length) {
                return false;
            }
        }
        for (var key in a) {
            if (!(key in b) || a[key] !== b[key]) {
                return false;
            }
        }
        for (var key in b) {
            if (!(key in a) || a[key] !== b[key]) {
                return false;
            }
        }
        return true;
    },

    format_date: function format_date(date_str) {
        var date = new Date(date_str);
        return date.toLocaleDateString();
    },

    format_time: function format_time(time_str) {
        var date = new Date(time_str);
        return date.toLocaleString();
    },

    limitByPrecision: function limitByPrecision(value, assetPrecision) {
        var valueString = value.toString();
        var splitString = valueString.split(".");
        if (splitString.length === 1 || splitString.length === 2 && splitString[1].length <= assetPrecision) {
            return valueString;
        } else {
            return splitString[0] + "." + splitString[1].substr(0, assetPrecision);
        }
        // let precision = this.get_asset_precision(assetPrecision);
        // value = Math.floor(value * precision) / precision;
        // if (isNaN(value) || !isFinite(value)) {
        //     return 0;
        // }
        // return value;
    },

    estimateFee: function estimateFee(op_type, options, globalObject) {
        if (!globalObject) return 0;
        globalObject = _immutable2.default.fromJS(globalObject);
        var op_code = operations[op_type];
        var currentFees = globalObject.getIn(["parameters", "current_fees", "parameters", op_code, 1]); //.toJS();
        if (currentFees) {
            currentFees = currentFees.toJS();
        } else {
            return 0;
        }
        var fee = 0;
        if (currentFees.fee) {
            fee += currentFees.fee;
        }

        if (options) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = (0, _getIterator3.default)(options), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var option = _step.value;

                    fee += currentFees[option];
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }

        return fee * globalObject.getIn(["parameters", "current_fees", "scale"]) / 10000;
    },
    getFee: function getFee(op_type, asset, coreAsset, globalObject) {
        asset = _immutable2.default.fromJS(asset);
        var fee = this.estimateFee(op_type, [], globalObject || _bcxjsCores.ChainStore.getObject("2.0.0")) || 0;
        var coreFee = new _MarketClasses.Asset({
            amount: fee,
            precision: coreAsset ? coreAsset.precision : 8
        });
        if (!asset || asset.get("id") === "1.3.0") return coreFee;

        var cer = asset.getIn(["options", "core_exchange_rate"]).toJS();

        // if(cer.base.amount==cer.quote.amount) return 0
        if (cer.base.asset_id === cer.quote.asset_id) {
            coreFee._real_amount = 0;
            return coreFee;
        }

        var cerBase = new _MarketClasses.Asset({
            asset_id: cer.base.asset_id,
            amount: cer.base.amount,
            precision: coreAsset ? coreAsset.precision : 5
        });

        var cerQuote = new _MarketClasses.Asset({
            asset_id: cer.quote.asset_id,
            amount: cer.quote.amount,
            precision: asset.get("precision")
        });

        try {
            var cerPrice = new _MarketClasses.Price({
                base: cerBase, quote: cerQuote
            });
            var convertedFee = coreFee.times(cerPrice);

            return convertedFee;
        } catch (err) {
            return coreFee;
        }
    },
    convertPrice: function convertPrice(fromRate, toRate, fromID, toID) {

        if (!fromRate || !toRate) {
            return null;
        }

        // Handle case of input simply being a fromAsset and toAsset
        if (fromRate.toJS && this.is_object_type(fromRate.get("id"), "asset")) {
            fromID = fromRate.get("id");
            fromRate = fromRate.get("bitasset") ? fromRate.getIn(["bitasset", "current_feed", "settlement_price"]).toJS() : fromID == "1.3.1" ? fromRate.getIn(["options", "core_exchange_rate"]).toJS() : fromRate.toJS(); //fromRate.getIn(["options", "core_exchange_rate"]).toJS();
        }

        if (toRate.toJS) {
            toID = toRate.get("id");
            toRate = toRate.get("bitasset") ? toRate.getIn(["bitasset", "current_feed", "settlement_price"]).toJS() : toID == "1.3.1" ? toRate.getIn(["options", "core_exchange_rate"]).toJS() : toRate.toJS(); //toRate.getIn(["options", "core_exchange_rate"]).toJS();
        }

        var fromRateQuoteID = fromRate.quote ? fromRate.quote.asset_id : fromRate.asset_id;
        var toRateQuoteID = toRate.quote ? toRate.quote.asset_id : toRate.asset_id;
        // console.info("fromRate",fromRate,toRate);

        var fromRateQuoteAmount = void 0,
            fromRateBaseAmount = void 0,
            finalQuoteID = void 0,
            finalBaseID = void 0;

        if (fromRateQuoteID === fromID) {

            fromRateQuoteAmount = fromRate.quote ? fromRate.quote.amount : 0;
            fromRateBaseAmount = fromRate.base ? fromRate.base.amount : 0;
        } else {

            fromRateQuoteAmount = fromRate.base ? fromRate.base.amount : 0;
            fromRateBaseAmount = fromRate.quote ? fromRate.quote.amount : 0;
        }

        var toRateQuoteAmount = void 0,
            toRateBaseAmount = void 0;
        if (toRateQuoteID === toID) {
            toRateQuoteAmount = toRate.quote ? toRate.quote.amount : 1;
            toRateBaseAmount = toRate.base ? toRate.base.amount : 1;
        } else {
            toRateQuoteAmount = toRate.base ? toRate.base.amount : 1;
            toRateBaseAmount = toRate.quote ? toRate.quote.amount : 1;
        }

        var baseRatio = void 0,
            finalQuoteAmount = void 0,
            finalBaseAmount = void 0;
        if (toRateBaseAmount > fromRateBaseAmount) {
            baseRatio = toRateBaseAmount / fromRateBaseAmount;
            finalQuoteAmount = fromRateQuoteAmount * baseRatio;
            finalBaseAmount = toRateQuoteAmount;
        } else {
            if (toRateBaseAmount) baseRatio = fromRateBaseAmount / toRateBaseAmount;else baseRatio = 0;
            finalQuoteAmount = fromRateQuoteAmount;
            finalBaseAmount = toRateQuoteAmount * baseRatio;
            // console.info("fromRateQuoteAmount",fromRateQuoteAmount);
        }
        // console.info("finalQuoteAmount",finalQuoteAmount,finalBaseAmount);
        // console.info("toRateBaseAmount",toRateBaseAmount,fromRateBaseAmount,finalBaseAmount);

        return {
            quote: {
                amount: finalQuoteAmount,
                asset_id: toID
            },
            base: {
                amount: finalBaseAmount,
                asset_id: fromID
            }
        };
    },

    convertValue: function convertValue(priceObject, amount, fromAsset, toAsset) {
        priceObject = priceObject.toJS ? priceObject.toJS() : priceObject;
        var quotePrecision = this.get_asset_precision(fromAsset.get("precision"));
        var basePrecision = this.get_asset_precision(toAsset.get("precision"));
        var assetPrice = this.get_asset_price(priceObject.quote.amount, fromAsset, priceObject.base.amount, toAsset);
        var eqValue = fromAsset.get("id") !== toAsset.get("id") ? basePrecision * (amount / quotePrecision) / assetPrice : amount;
        if (isNaN(eqValue) || !isFinite(eqValue)) {
            return null;
        }
        return eqValue;
    },

    isValidPrice: function isValidPrice(rate) {
        if (!rate || !rate.toJS) {
            return false;
        }
        var base = rate.get("base").toJS();
        var quote = rate.get("quote").toJS();
        if (base.amount > 0 && quote.amount > 0 && base.asset_id !== quote.asset_id) {
            return true;
        } else {
            return false;
        }
    },
    sortText: function sortText(a, b) {
        var inverse = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

        if (a > b) {
            return inverse ? 1 : -1;
        } else if (a < b) {
            return inverse ? -1 : 1;
        } else {
            return 0;
        }
    },
    sortID: function sortID(a, b) {
        var inverse = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

        // inverse = false => low to high
        var intA = parseInt(a.split(".")[2], 10);
        var intB = parseInt(b.split(".")[2], 10);

        return inverse ? intB - intA : intA - intB;
    },
    calc_block_time: function calc_block_time(block_number, globalObject, dynGlobalObject) {
        if (!globalObject || !dynGlobalObject) return null;
        var block_interval = globalObject.get("parameters").get("block_interval");
        var head_block = dynGlobalObject.get("head_block_number");
        var head_block_time = new Date(dynGlobalObject.get("time") + "+00:00");
        var seconds_below = (head_block - block_number) * block_interval;
        return new Date(head_block_time - seconds_below * 1000);
    },
    get_translation_parts: function get_translation_parts(str) {
        var result = [];
        var toReplace = {};
        var re = /\((.*?)\)/g;
        var interpolators = str.split(re);
        // console.log("split:", str.split(re)); 
        return str.split(re);
        // var str = '{{azazdaz}} {{azdazd}}';
        // var m;
        // United Labs of BCTech.
        // while ((m = re.exec(str)) !== null) {
        //     if (m.index === re.lastIndex) {
        //         re.lastIndex++;
        //     }
        //     console.log("m:", m);
        //     // View your result using the m-variable.
        //     // eg m[0] etc.
        //     // 
        //     toReplace[m[1]] = m[0]
        //     result.push(m[1])
        // }

        // return result;
    },
    get_percentage: function get_percentage(a, b) {
        return Math.round(a / b * 100) + "%";
    },
    replaceName: function replaceName(name) {
        var isBitAsset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        var toReplace = ["TRADE.", "OPEN.", "METAEX."];
        var suffix = "";
        var i = void 0;
        for (i = 0; i < toReplace.length; i++) {
            if (name.indexOf(toReplace[i]) !== -1) {
                name = name.replace(toReplace[i], "") + suffix;
                break;
            }
        }

        return {
            name: name,
            prefix: isBitAsset ? "bit" : toReplace[i] ? toReplace[i].toLowerCase() : null
        };
    },
    getAssetName: function getAssetName(asset) {
        var noPrefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var replace = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

        var name = asset.get("symbol");
        var isBitAsset = asset.has("bitasset");
        var isPredMarket = isBitAsset && asset.getIn(["bitasset", "is_prediction_market"]);

        var _replaceName = this.replaceName(name, isBitAsset && !isPredMarket && asset.get("issuer") === "1.2.0"),
            replacedName = _replaceName.name,
            prefix = _replaceName.prefix;

        if (prefix == null) {
            prefix = '';
        }
        if (replace && replacedName !== name) {

            return "" + (!noPrefix ? prefix : '') + replacedName;
        } else {
            return "" + (!noPrefix ? prefix : '') + name;
        }
    }
};

exports.default = Utils;