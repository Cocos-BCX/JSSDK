"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _assets = require("../../services/api/assets");

var _assets2 = _interopRequireDefault(_assets);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var helper = {
    filterArr: function filterArr(arr, propertyName, propertyValue, type) {
        var index = -1;
        arr.some(function (item, itemIndex) {
            if (item[propertyName] == propertyValue) {
                index = itemIndex;
                return;
            }
        });

        return type == "index" ? index : index == -1 ? null : arr[index];
    },
    formatAmount: function formatAmount(amount, precision) {
        return this.getFullNum(amount / Math.pow(10, precision));
    },

    toOpAmount: function toOpAmount(amount, assetObj) {
        var _assetObj, precision, id;

        return _regenerator2.default.async(function toOpAmount$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        if (!(typeof assetObj == "string")) {
                            _context.next = 9;
                            break;
                        }

                        _context.next = 3;
                        return _regenerator2.default.awrap(_assets2.default.fetch_asset_one(assetObj));

                    case 3:
                        assetObj = _context.sent;

                        if (!(assetObj.code != 1)) {
                            _context.next = 8;
                            break;
                        }

                        return _context.abrupt("return", assetObj);

                    case 8:
                        assetObj = assetObj.data;

                    case 9:
                        _assetObj = assetObj, precision = _assetObj.precision, id = _assetObj.id;

                        if (!(helper.getDecimals(amount) > precision)) {
                            _context.next = 12;
                            break;
                        }

                        return _context.abrupt("return", { success: false, code: 117, error: 'The current asset precision is configured as ' + precision + '，and the decimal cannot exceed ' + precision });

                    case 12:
                        amount = parseInt((amount * Math.pow(10, precision)).toFixed(0));
                        return _context.abrupt("return", { success: true, data: { amount: amount, asset_id: id } });

                    case 14:
                    case "end":
                        return _context.stop();
                }
            }
        }, null, undefined);
    },
    getFullNum: function getFullNum(num, precision) {
        //deal with non-numeric
        if (isNaN(num)) {
            return num;
        };
        if (precision && precision != 0) num = num / Math.pow(10, precision);
        //process numberics that needn't transformation
        var str = '' + num;

        if (!/e/i.test(str)) {
            return num;
        };
        num = Number(num).toFixed(18).replace(/\.?0+$/, "");

        return num;
    },
    getDecimals: function getDecimals(num) {
        var num_str = this.getFullNum(num);
        if (typeof num_str != "string") {
            return 0;
        }
        if (num_str.indexOf(".") != -1) {
            return num_str.split(".")[1].length;
        }

        return 0;
    },

    trimParams: function trimParams(params) {
        var noValidates = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var p_value = void 0;
        var requireParams = true;
        for (var key in params) {
            if (key != "callback") {
                p_value = params[key];
                if (typeof p_value == "string") {
                    if (p_value) {
                        params[key] = p_value.trim();
                    }
                    if (!p_value && !(key in noValidates)) {
                        requireParams = false;
                    }
                }
            }
        }
        return requireParams;
    },
    formatTable: function formatTable(table) {
        var result = {};
        table.forEach(function (item) {
            var key = item[0].key[1].v;
            var value = item[1][1].v;
            switch (item[1][0]) {
                case 4:
                    result[key] = helper.formatTable(value);
                    break;
                case 0:
                case 1:
                    result[key] = Number(value);
                    break;
                default:
                    result[key] = value;
            }
        });
        return result;
    }
};

exports.default = helper;