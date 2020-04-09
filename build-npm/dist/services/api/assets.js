'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bcxjsWs = require('bcxjs-ws');

var _utils = require('../../utils');

var utils = _interopRequireWildcard(_utils);

var _bcxjsCores = require('bcxjs-cores');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var inProgress = {};
var _assets = {};
/**
 * Fetches array of assets from bcxjs-ws
 */
var fetch = function _callee(assets) {
    var cacheAndOne = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var result;
    return _regenerator2.default.async(function _callee$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    if (!(!assets || !assets[0])) {
                        _context.next = 2;
                        break;
                    }

                    return _context.abrupt('return', null);

                case 2:
                    if (!cacheAndOne) {
                        _context.next = 8;
                        break;
                    }

                    if (!_assets[assets[0]]) {
                        _context.next = 7;
                        break;
                    }

                    return _context.abrupt('return', _assets[assets[0]]);

                case 7:
                    _assets[assets[0]] = { precision: 5, symbol: assets[0] };

                case 8:
                    _context.prev = 8;
                    _context.next = 11;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('lookup_asset_symbols', [assets]));

                case 11:
                    result = _context.sent;

                    result = result.filter(function (item) {
                        return item != null;
                    });

                    if (!cacheAndOne) {
                        _context.next = 18;
                        break;
                    }

                    if (!result.length) {
                        _context.next = 17;
                        break;
                    }

                    _assets[result[0].id] = result[0];
                    return _context.abrupt('return', result[0]);

                case 17:
                    return _context.abrupt('return', null);

                case 18:
                    return _context.abrupt('return', result);

                case 21:
                    _context.prev = 21;
                    _context.t0 = _context['catch'](8);

                    console.log(_context.t0);
                    return _context.abrupt('return', null);

                case 25:
                case 'end':
                    return _context.stop();
            }
        }
    }, null, undefined, [[8, 21]]);
};

var fetch_asset_one = function _callee2(asset_id) {
    var result;
    return _regenerator2.default.async(function _callee2$(_context2) {
        while (1) {
            switch (_context2.prev = _context2.next) {
                case 0:
                    if (!_assets[asset_id]) {
                        _context2.next = 2;
                        break;
                    }

                    return _context2.abrupt('return', { code: 1, data: _assets[asset_id] });

                case 2:
                    _context2.prev = 2;
                    _context2.next = 5;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('lookup_asset_symbols', [[asset_id]]));

                case 5:
                    result = _context2.sent;

                    if (result[0]) {
                        _context2.next = 8;
                        break;
                    }

                    return _context2.abrupt('return', { code: 115, message: "There is no asset " + asset_id + " on block chain", error: "There is no asset " + asset_id + " on block chain" });

                case 8:
                    _assets[result[0].id] = result[0];
                    return _context2.abrupt('return', { code: 1, data: result[0] });

                case 12:
                    _context2.prev = 12;
                    _context2.t0 = _context2['catch'](2);

                    console.log(_context2.t0);
                    return _context2.abrupt('return', null);

                case 16:
                case 'end':
                    return _context2.stop();
            }
        }
    }, null, undefined, [[2, 12]]);
};

var fetch_asset_by_cache = function fetch_asset_by_cache(asset_id) {
    return _assets[asset_id];
};

var fetch_all_assets = function fetch_all_assets() {
    return _assets;
};
/**
 * Returns prices bistory between base and quote assets from the last specified number of days
 * @param {Object} base - base asset object
 * @param {Object} quote - quote asset object
 * @param {number} days - number of days
 */
var fetchPriceHistory = function _callee3(base, quote, days) {
    var bucketSize, endDate, startDate, endDateISO, startDateISO, history, prices;
    return _regenerator2.default.async(function _callee3$(_context3) {
        while (1) {
            switch (_context3.prev = _context3.next) {
                case 0:
                    _context3.prev = 0;
                    bucketSize = 3600 * 24;
                    endDate = new Date();
                    startDate = new Date(endDate - 1000 * 60 * 60 * 24 * days);
                    endDateISO = endDate.toISOString().slice(0, -5);
                    startDateISO = startDate.toISOString().slice(0, -5);


                    endDate.setDate(endDate.getDate() + 1);
                    _context3.next = 9;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().history_api().exec('get_market_history', [base.id, quote.id, bucketSize, startDateISO, endDateISO]));

                case 9:
                    history = _context3.sent;
                    prices = utils.formatPrices(utils.getPrices(history), base, quote);
                    _context3.t0 = history;
                    _context3.next = 14;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().history_api().exec("get_fill_order_history", [base.id, quote.id, 1]));

                case 14:
                    _context3.t1 = _context3.sent;
                    return _context3.abrupt('return', [_context3.t0, _context3.t1]);

                case 18:
                    _context3.prev = 18;
                    _context3.t2 = _context3['catch'](0);

                    console.log(_context3.t2);
                    return _context3.abrupt('return', null);

                case 22:
                case 'end':
                    return _context3.stop();
            }
        }
    }, null, undefined, [[0, 18]]);
};

var getAssetList = function getAssetList(start, count) {
    var id = start + "_" + count;
    if (!inProgress[id]) {
        inProgress[id] = true;
        return _bcxjsWs.Apis.instance().db_api().exec("list_assets", [start, count]).then(function (assets) {
            var bitAssetIDS = [];
            var dynamicIDS = [];

            assets.forEach(function (asset) {
                _bcxjsCores.ChainStore._updateObject(asset, false);
                dynamicIDS.push(asset.dynamic_asset_data_id);

                if (asset.bitasset_data_id) {
                    bitAssetIDS.push(asset.bitasset_data_id);
                }
            });

            var dynamicPromise = _bcxjsWs.Apis.instance().db_api().exec("get_objects", [dynamicIDS]);

            var bitAssetPromise = bitAssetIDS.length > 0 ? _bcxjsWs.Apis.instance().db_api().exec("get_objects", [bitAssetIDS]) : null;

            return _promise2.default.all([dynamicPromise, bitAssetPromise]).then(function (results) {
                delete inProgress[id];
                //   console.info("dispatch assets",{
                //       assets: assets,
                //       dynamic: results[0],
                //       bitasset_data: results[1],
                //       loading: false
                //   })
                return {
                    assets: assets,
                    dynamic: results[0],
                    bitasset_data: results[1]
                    //loading: false

                    //return assets && assets.length;
                };
            });
        }).catch(function (error) {
            console.log("Error in AssetActions.getAssetList: ", error);
            delete inProgress[id];
            return { code: 161, message: "Error in AssetActions.getAssetList", error: error };
        });
    }
};

var list_asset_restricted_objects = function _callee4(asset_id, restricted_type) {
    var response;
    return _regenerator2.default.async(function _callee4$(_context4) {
        while (1) {
            switch (_context4.prev = _context4.next) {
                case 0:
                    _context4.prev = 0;
                    _context4.next = 3;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('list_asset_restricted_objects', [asset_id, restricted_type]));

                case 3:
                    response = _context4.sent;

                    if (!response) {
                        _context4.next = 6;
                        break;
                    }

                    return _context4.abrupt('return', { code: 1, data: response });

                case 6:
                    return _context4.abrupt('return', {
                        code: 104,
                        message: 'not found'
                    });

                case 9:
                    _context4.prev = 9;
                    _context4.t0 = _context4['catch'](0);
                    return _context4.abrupt('return', {
                        code: 0,
                        message: _context4.t0.message,
                        error: _context4.t0
                    });

                case 12:
                case 'end':
                    return _context4.stop();
            }
        }
    }, null, undefined, [[0, 9]]);
};

var estimation_gas = function _callee5(amountObj) {
    var response;
    return _regenerator2.default.async(function _callee5$(_context5) {
        while (1) {
            switch (_context5.prev = _context5.next) {
                case 0:
                    _context5.prev = 0;
                    _context5.next = 3;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('estimation_gas', [amountObj]));

                case 3:
                    response = _context5.sent;

                    if (!response) {
                        _context5.next = 6;
                        break;
                    }

                    return _context5.abrupt('return', { code: 1, data: response });

                case 6:
                    return _context5.abrupt('return', {
                        code: 104,
                        message: 'not found'
                    });

                case 9:
                    _context5.prev = 9;
                    _context5.t0 = _context5['catch'](0);
                    return _context5.abrupt('return', {
                        code: 0,
                        message: _context5.t0.message,
                        error: _context5.t0
                    });

                case 12:
                case 'end':
                    return _context5.stop();
            }
        }
    }, null, undefined, [[0, 9]]);
};
exports.default = {
    fetch: fetch,
    fetch_asset_one: fetch_asset_one,
    fetch_asset_by_cache: fetch_asset_by_cache,
    fetch_all_assets: fetch_all_assets,
    list_asset_restricted_objects: list_asset_restricted_objects,
    fetchPriceHistory: fetchPriceHistory,
    getAssetList: getAssetList,
    estimation_gas: estimation_gas
};