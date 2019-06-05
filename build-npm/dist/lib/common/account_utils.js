"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _bcxjsCores = require("bcxjs-cores");

var _utils = require("./utils");

var _utils2 = _interopRequireDefault(_utils);

var _trxHelper = require("./trxHelper");

var _api = require("../../services/api");

var _api2 = _interopRequireDefault(_api);

var _immutable = require("immutable");

var _immutable2 = _interopRequireDefault(_immutable);

var _bcxjsWs = require("bcxjs-ws");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import counterpart from "counterpart";
var AccountUtils = function () {
    function AccountUtils() {
        (0, _classCallCheck3.default)(this, AccountUtils);
    }

    (0, _createClass3.default)(AccountUtils, null, [{
        key: "checkFeePool",

        /**
         *  takes asset as immutable object or id, fee as integer amount
         *  @return undefined if asset is undefined
         *  @return false if fee pool has insufficient balance
         *  @return true if the fee pool has sufficient balance
         */
        value: function checkFeePool(asset, fee) {
            var dynamicObject, feePool;
            return _regenerator2.default.async(function checkFeePool$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            asset = asset.toJS ? asset : _bcxjsCores.ChainStore.getAsset(asset);

                            if (asset) {
                                _context.next = 3;
                                break;
                            }

                            return _context.abrupt("return", undefined);

                        case 3:
                            dynamicObject = _bcxjsCores.ChainStore.getObject(asset.get("dynamic_asset_data_id"));

                            if (dynamicObject) {
                                _context.next = 9;
                                break;
                            }

                            _context.next = 7;
                            return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('get_objects', [[asset.get("dynamic_asset_data_id")]]));

                        case 7:
                            dynamicObject = _context.sent;

                            if (dynamicObject && dynamicObject[0]) {
                                dynamicObject = dynamicObject[0];
                            }

                        case 9:
                            if (dynamicObject) {
                                _context.next = 11;
                                break;
                            }

                            return _context.abrupt("return", undefined);

                        case 11:
                            feePool = parseInt(dynamicObject.toJS ? dynamicObject.get("fee_pool") : dynamicObject.fee_pool, 10);
                            return _context.abrupt("return", feePool >= fee);

                        case 13:
                        case "end":
                            return _context.stop();
                    }
                }
            }, null, this);
        }
    }, {
        key: "getPossibleFees",
        value: function getPossibleFees(account, operation) {
            var _this = this;

            var core, assets, fees, globalObject, fee, accountBalances;
            return _regenerator2.default.async(function getPossibleFees$(_context3) {
                while (1) {
                    switch (_context3.prev = _context3.next) {
                        case 0:
                            _context3.t0 = _immutable2.default;
                            _context3.next = 3;
                            return _regenerator2.default.awrap(_api2.default.Assets.fetch(["1.3.0"], true));

                        case 3:
                            _context3.t1 = _context3.sent;
                            core = _context3.t0.fromJS.call(_context3.t0, _context3.t1);

                            account = !account || account.toJS ? account : _bcxjsCores.ChainStore.getAccount(account);

                            if (!(!account || !core)) {
                                _context3.next = 8;
                                break;
                            }

                            return _context3.abrupt("return", { assets: ["1.3.0"], fees: { "1.3.0": 0 } });

                        case 8:
                            assets = [], fees = {};
                            globalObject = _bcxjsCores.ChainStore.getObject("2.0.0");
                            fee = (0, _trxHelper.estimateFee)(operation, null, globalObject);
                            accountBalances = account.get("balances");

                            if (accountBalances) {
                                _context3.next = 14;
                                break;
                            }

                            return _context3.abrupt("return", { assets: ["1.3.0"], fees: { "1.3.0": 0 } });

                        case 14:
                            _context3.next = 16;
                            return _regenerator2.default.awrap(_promise2.default.all(accountBalances.toArray().map(function _callee(balanceID) {
                                var assetID, balanceObject, balance, hasBalance, eqFee, asset, price;
                                return _regenerator2.default.async(function _callee$(_context2) {
                                    while (1) {
                                        switch (_context2.prev = _context2.next) {
                                            case 0:
                                                //balanceID
                                                assetID = balanceID.get("asset_type");
                                                balanceObject = balanceID; //ChainStore.getObject(balanceID);

                                                balance = balanceObject ? parseInt(balanceObject.get("balance"), 10) : 0;
                                                hasBalance = false, eqFee = void 0;

                                                if (!(assetID === "1.3.0" && balance >= fee)) {
                                                    _context2.next = 8;
                                                    break;
                                                }

                                                hasBalance = true;
                                                _context2.next = 24;
                                                break;

                                            case 8:
                                                if (!balance) {
                                                    _context2.next = 24;
                                                    break;
                                                }

                                                _context2.next = 11;
                                                return _regenerator2.default.awrap(_api2.default.Assets.fetch([assetID], true));

                                            case 11:
                                                asset = _context2.sent;

                                                if (!asset) {
                                                    _context2.next = 24;
                                                    break;
                                                }

                                                asset = _immutable2.default.fromJS(asset);
                                                price = _utils2.default.convertPrice(core, asset, null, asset.get("id"));

                                                eqFee = parseInt(_utils2.default.convertValue(price, fee, core, asset), 10);
                                                if (parseInt(eqFee, 10) !== eqFee) {
                                                    eqFee += 1; // Add 1 to round up;
                                                }
                                                _context2.t0 = balance >= eqFee;

                                                if (!_context2.t0) {
                                                    _context2.next = 22;
                                                    break;
                                                }

                                                _context2.next = 21;
                                                return _regenerator2.default.awrap(_this.checkFeePool(asset, fee));

                                            case 21:
                                                _context2.t0 = _context2.sent;

                                            case 22:
                                                if (!_context2.t0) {
                                                    _context2.next = 24;
                                                    break;
                                                }

                                                hasBalance = true;

                                            case 24:

                                                if (hasBalance) {
                                                    assets.push(assetID);
                                                    fees[assetID] = eqFee ? eqFee : fee;
                                                }

                                            case 25:
                                            case "end":
                                                return _context2.stop();
                                        }
                                    }
                                }, null, _this);
                            })));

                        case 16:
                            return _context3.abrupt("return", { assets: assets, fees: fees });

                        case 17:
                        case "end":
                            return _context3.stop();
                    }
                }
            }, null, this);
        }
    }, {
        key: "getFinalFeeAsset",
        value: function getFinalFeeAsset(account, operation) {
            var fee_asset_id = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "1.3.0";

            var _ref, feeAssets;

            return _regenerator2.default.async(function getFinalFeeAsset$(_context4) {
                while (1) {
                    switch (_context4.prev = _context4.next) {
                        case 0:
                            _context4.next = 2;
                            return _regenerator2.default.awrap(this.getPossibleFees(account, operation));

                        case 2:
                            _ref = _context4.sent;
                            feeAssets = _ref.assets;

                            if (!(feeAssets.length === 1)) {
                                _context4.next = 9;
                                break;
                            }

                            fee_asset_id = feeAssets[0];
                            return _context4.abrupt("return", fee_asset_id);

                        case 9:
                            if (!(feeAssets.length > 0 && feeAssets.indexOf(fee_asset_id) !== -1)) {
                                _context4.next = 11;
                                break;
                            }

                            return _context4.abrupt("return", fee_asset_id);

                        case 11:
                            return _context4.abrupt("return", "1.3.0");

                        case 12:
                        case "end":
                            return _context4.stop();
                    }
                }
            }, null, this);
        }
    }]);
    return AccountUtils;
}();

exports.default = AccountUtils;