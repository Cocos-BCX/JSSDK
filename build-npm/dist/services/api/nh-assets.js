'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.queryOrderDetail = exports.listNHAssetsByCreator = exports.getNHCreator = exports.lookupWorldViews = exports.listAccountNHAssetOrders = exports.listNHAssetOrders = exports.lookupNHAssets = exports.listAccountNHAssets = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _bcxjsWs = require('bcxjs-ws');

var _api = require('../api');

var _api2 = _interopRequireDefault(_api);

var _helper = require('../../lib/common/helper');

var _helper2 = _interopRequireDefault(_helper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var formatItems = function _callee(items, total) {
    var i, describe_with_contracts, c_id, contract_name, req_accounts, accounts_res, j, ii, result;
    return _regenerator2.default.async(function _callee$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    items = items.map(function (item) {
                        item.create_time = new Date(item.create_time + 'Z').bcxformat("yyyy/MM/dd HH:mm:ss");
                        var describe_with_contract = {};
                        var item_data = void 0;

                        item.describe_with_contract.forEach(function (wv_item) {
                            item_data = {};
                            wv_item[1].forEach(function (prop) {
                                if (prop) item_data[prop[0]] = prop[1];
                            });
                            describe_with_contract[wv_item[0]] = item_data;
                        });
                        item["describe_with_contract"] = describe_with_contract;
                        return item;
                    });
                    i = 0;

                case 2:
                    if (!(i < items.length)) {
                        _context.next = 36;
                        break;
                    }

                    describe_with_contracts = (0, _keys2.default)(items[i].describe_with_contract);
                    c_id = "";
                    contract_name = "";
                    req_accounts = [_api2.default.Account.getUser(items[i].nh_asset_creator, true), _api2.default.Account.getUser(items[i].nh_asset_owner, true)];

                    if (items[i].nh_asset_active) {
                        req_accounts.push(_api2.default.Account.getUser(items[i].nh_asset_active, true));
                    }
                    if (items[i].dealership) {
                        req_accounts.push(_api2.default.Account.getUser(items[i].dealership, true));
                    }
                    _context.next = 11;
                    return _regenerator2.default.awrap(_promise2.default.all(req_accounts));

                case 11:
                    accounts_res = _context.sent;
                    j = 0;

                case 13:
                    if (!(j < accounts_res.length)) {
                        _context.next = 19;
                        break;
                    }

                    if (!(accounts_res[j].code != 1)) {
                        _context.next = 16;
                        break;
                    }

                    return _context.abrupt('return', accounts_res[j]);

                case 16:
                    j++;
                    _context.next = 13;
                    break;

                case 19:
                    items[i].nh_asset_creator_name = accounts_res[0].data.account.name;
                    items[i].nh_asset_owner_name = accounts_res[1].data.account.name;
                    if (req_accounts.length > 2) {
                        items[i].nh_asset_active_name = accounts_res[2].data.account.name;
                        items[i].dealership_name = accounts_res[3].data.account.name;
                    }

                    ii = 0;

                case 23:
                    if (!(ii < describe_with_contracts.length)) {
                        _context.next = 33;
                        break;
                    }

                    c_id = describe_with_contracts[ii];
                    _context.next = 27;
                    return _regenerator2.default.awrap(_api2.default.Contract.getContract(c_id, true));

                case 27:
                    contract_name = _context.sent.data.name;

                    items[i].describe_with_contract[contract_name] = items[i].describe_with_contract[c_id];
                    delete items[i].describe_with_contract[c_id];

                case 30:
                    ii++;
                    _context.next = 23;
                    break;

                case 33:
                    i++;
                    _context.next = 2;
                    break;

                case 36:
                    result = { code: 1, data: items };

                    if (total) {
                        result.total = total;
                    }
                    return _context.abrupt('return', result);

                case 39:
                case 'end':
                    return _context.stop();
            }
        }
    }, null, undefined);
};

var listAccountNHAssets = exports.listAccountNHAssets = function _callee2(_ref) {
    var account_id = _ref.account_id,
        _ref$worldViews = _ref.worldViews,
        worldViews = _ref$worldViews === undefined ? [] : _ref$worldViews,
        _ref$page = _ref.page,
        page = _ref$page === undefined ? 1 : _ref$page,
        _ref$pageSize = _ref.pageSize,
        pageSize = _ref$pageSize === undefined ? 10 : _ref$pageSize,
        _ref$type = _ref.type,
        type = _ref$type === undefined ? 4 : _ref$type;
    var response, message;
    return _regenerator2.default.async(function _callee2$(_context2) {
        while (1) {
            switch (_context2.prev = _context2.next) {
                case 0:
                    _context2.prev = 0;
                    _context2.next = 3;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('list_account_nh_asset', [account_id, worldViews, pageSize, page, type]));

                case 3:
                    response = _context2.sent;

                    if (!response) {
                        _context2.next = 8;
                        break;
                    }

                    _context2.next = 7;
                    return _regenerator2.default.awrap(formatItems(response[0], response[1]));

                case 7:
                    return _context2.abrupt('return', _context2.sent);

                case 8:
                    return _context2.abrupt('return', {
                        code: 104,
                        message: worldViews + ' not found'
                    });

                case 11:
                    _context2.prev = 11;
                    _context2.t0 = _context2['catch'](0);
                    message = _context2.t0.message;
                    return _context2.abrupt('return', {
                        code: 0,
                        message: message,
                        error: _context2.t0
                    });

                case 15:
                case 'end':
                    return _context2.stop();
            }
        }
    }, null, undefined, [[0, 11]]);
};

var lookupNHAssets = exports.lookupNHAssets = function _callee3(nh_asset_hash_or_ids) {
    var owner = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var account_id = arguments[2];
    var response, message;
    return _regenerator2.default.async(function _callee3$(_context3) {
        while (1) {
            switch (_context3.prev = _context3.next) {
                case 0:
                    _context3.prev = 0;
                    _context3.next = 3;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('lookup_nh_asset', [nh_asset_hash_or_ids]));

                case 3:
                    response = _context3.sent;

                    if (!response) {
                        _context3.next = 15;
                        break;
                    }

                    response = response.filter(function (item) {
                        return item != null;
                    });

                    if (!(owner && response.length)) {
                        _context3.next = 10;
                        break;
                    }

                    response = response.filter(function (item) {
                        return item.nh_asset_owner == account_id;
                    });

                    if (response.length) {
                        _context3.next = 10;
                        break;
                    }

                    return _context3.abrupt('return', { code: 176, message: "You are not the owner of " + nh_asset_hash_or_ids });

                case 10:
                    ;

                    if (!response.length) {
                        _context3.next = 15;
                        break;
                    }

                    _context3.next = 14;
                    return _regenerator2.default.awrap(formatItems(response));

                case 14:
                    return _context3.abrupt('return', _context3.sent);

                case 15:
                    return _context3.abrupt('return', {
                        code: 147,
                        message: nh_asset_hash_or_ids + ' NHAsset do not exist'
                    });

                case 18:
                    _context3.prev = 18;
                    _context3.t0 = _context3['catch'](0);
                    message = _context3.t0.message;

                    if (message.indexOf("Invalid hex character") != -1) {
                        message = "请输入正确的NH资产id或hash";
                    }

                    return _context3.abrupt('return', {
                        code: 0,
                        message: message,
                        error: _context3.t0
                    });

                case 23:
                case 'end':
                    return _context3.stop();
            }
        }
    }, null, undefined, [[0, 18]]);
};

var listNHAssetOrders = exports.listNHAssetOrders = function _callee4(_ref2) {
    var assetIds = _ref2.assetIds,
        worldViews = _ref2.worldViews,
        _ref2$baseDescribe = _ref2.baseDescribe,
        baseDescribe = _ref2$baseDescribe === undefined ? "" : _ref2$baseDescribe,
        _ref2$pageSize = _ref2.pageSize,
        pageSize = _ref2$pageSize === undefined ? 10 : _ref2$pageSize,
        _ref2$page = _ref2.page,
        page = _ref2$page === undefined ? 1 : _ref2$page,
        _ref2$isAscendingOrde = _ref2.isAscendingOrder,
        isAscendingOrder = _ref2$isAscendingOrde === undefined ? true : _ref2$isAscendingOrde;
    var response, orders;
    return _regenerator2.default.async(function _callee4$(_context4) {
        while (1) {
            switch (_context4.prev = _context4.next) {
                case 0:
                    _context4.prev = 0;
                    _context4.next = 3;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('list_nh_asset_order', [assetIds, worldViews, baseDescribe, Number(pageSize), Number(page), isAscendingOrder]));

                case 3:
                    response = _context4.sent;

                    if (!response) {
                        _context4.next = 9;
                        break;
                    }

                    _context4.next = 7;
                    return _regenerator2.default.awrap(fomatOrders(response[0]));

                case 7:
                    orders = _context4.sent;
                    return _context4.abrupt('return', {
                        code: 1,
                        data: orders,
                        total: response[1]
                    });

                case 9:
                    _context4.next = 14;
                    break;

                case 11:
                    _context4.prev = 11;
                    _context4.t0 = _context4['catch'](0);
                    return _context4.abrupt('return', {
                        code: 0,
                        message: _context4.t0.message,
                        error: _context4.t0
                    });

                case 14:
                case 'end':
                    return _context4.stop();
            }
        }
    }, null, undefined, [[0, 11]]);
};

var listAccountNHAssetOrders = exports.listAccountNHAssetOrders = function _callee5(_ref3) {
    var account_id = _ref3.account_id,
        _ref3$pageSize = _ref3.pageSize,
        pageSize = _ref3$pageSize === undefined ? 10 : _ref3$pageSize,
        _ref3$page = _ref3.page,
        page = _ref3$page === undefined ? 1 : _ref3$page;
    var response, orders;
    return _regenerator2.default.async(function _callee5$(_context5) {
        while (1) {
            switch (_context5.prev = _context5.next) {
                case 0:
                    _context5.prev = 0;
                    _context5.next = 3;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('list_account_nh_asset_order', [account_id, Number(pageSize), Number(page)]));

                case 3:
                    response = _context5.sent;

                    if (!response) {
                        _context5.next = 9;
                        break;
                    }

                    _context5.next = 7;
                    return _regenerator2.default.awrap(fomatOrders(response[0]));

                case 7:
                    orders = _context5.sent;
                    return _context5.abrupt('return', {
                        code: 1,
                        data: orders,
                        total: response[1]
                    });

                case 9:
                    _context5.next = 14;
                    break;

                case 11:
                    _context5.prev = 11;
                    _context5.t0 = _context5['catch'](0);
                    return _context5.abrupt('return', {
                        code: 0,
                        message: _context5.t0.message,
                        error: _context5.t0
                    });

                case 14:
                case 'end':
                    return _context5.stop();
            }
        }
    }, null, undefined, [[0, 11]]);
};

var lookupWorldViews = exports.lookupWorldViews = function _callee6(world_view_name_or_ids) {
    var response, versions, i, wv_item, developers, j, account;
    return _regenerator2.default.async(function _callee6$(_context6) {
        while (1) {
            switch (_context6.prev = _context6.next) {
                case 0:
                    _context6.prev = 0;
                    _context6.next = 3;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('lookup_world_view', [world_view_name_or_ids]));

                case 3:
                    response = _context6.sent;

                    if (!(response && response[0])) {
                        _context6.next = 28;
                        break;
                    }

                    versions = [];
                    i = 0;

                case 7:
                    if (!(i < response.length)) {
                        _context6.next = 27;
                        break;
                    }

                    wv_item = response[i];
                    _context6.next = 11;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('get_objects', [wv_item.related_nht_creator]));

                case 11:
                    developers = _context6.sent;
                    j = 0;

                case 13:
                    if (!(j < developers.length)) {
                        _context6.next = 21;
                        break;
                    }

                    _context6.next = 16;
                    return _regenerator2.default.awrap(_api2.default.Account.getUser(developers[j].creator, true));

                case 16:
                    account = _context6.sent;

                    developers[j].developer_name = account.data.account.name;

                case 18:
                    j++;
                    _context6.next = 13;
                    break;

                case 21:
                    wv_item.creators = developers;
                    delete wv_item.related_nht_creator;
                    versions.push(wv_item);

                case 24:
                    i++;
                    _context6.next = 7;
                    break;

                case 27:
                    return _context6.abrupt('return', { code: 1, data: versions });

                case 28:
                    return _context6.abrupt('return', { code: 164, message: world_view_name_or_ids + " do not exist" });

                case 31:
                    _context6.prev = 31;
                    _context6.t0 = _context6['catch'](0);
                    return _context6.abrupt('return', {
                        code: 0,
                        message: _context6.t0.message,
                        error: _context6.t0
                    });

                case 34:
                case 'end':
                    return _context6.stop();
            }
        }
    }, null, undefined, [[0, 31]]);
};

var getNHCreator = exports.getNHCreator = function _callee7(nh_asset_creator_account_id) {
    var response, message, item_error_index;
    return _regenerator2.default.async(function _callee7$(_context7) {
        while (1) {
            switch (_context7.prev = _context7.next) {
                case 0:
                    _context7.prev = 0;
                    _context7.next = 3;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('get_nh_creator', [nh_asset_creator_account_id]));

                case 3:
                    response = _context7.sent;

                    if (!response) {
                        _context7.next = 9;
                        break;
                    }

                    _context7.next = 7;
                    return _regenerator2.default.awrap(_api2.default.Account.getUser(response.creator, true));

                case 7:
                    response.creator_name = _context7.sent.data.account.name;
                    return _context7.abrupt('return', {
                        code: 1,
                        data: response
                    });

                case 9:
                    _context7.next = 17;
                    break;

                case 11:
                    _context7.prev = 11;
                    _context7.t0 = _context7['catch'](0);

                    console.info("error", _context7.t0);
                    message = _context7.t0.message;

                    try {
                        item_error_index = message.indexOf('end():');

                        if (item_error_index != -1) {
                            message = message.substring(item_error_index + 6);
                        }
                    } catch (e) {}
                    return _context7.abrupt('return', {
                        code: 0,
                        message: message,
                        error: _context7.t0
                    });

                case 17:
                case 'end':
                    return _context7.stop();
            }
        }
    }, null, undefined, [[0, 11]]);
};

var listNHAssetsByCreator = exports.listNHAssetsByCreator = function _callee8(_ref4) {
    var account_id = _ref4.account_id,
        _ref4$worldView = _ref4.worldView,
        worldView = _ref4$worldView === undefined ? "" : _ref4$worldView,
        _ref4$pageSize = _ref4.pageSize,
        pageSize = _ref4$pageSize === undefined ? 10 : _ref4$pageSize,
        _ref4$page = _ref4.page,
        page = _ref4$page === undefined ? 1 : _ref4$page;
    var response;
    return _regenerator2.default.async(function _callee8$(_context8) {
        while (1) {
            switch (_context8.prev = _context8.next) {
                case 0:
                    _context8.prev = 0;
                    _context8.next = 3;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('list_nh_asset_by_creator', [account_id, worldView, pageSize, page]));

                case 3:
                    response = _context8.sent;

                    if (!response) {
                        _context8.next = 8;
                        break;
                    }

                    _context8.next = 7;
                    return _regenerator2.default.awrap(formatItems(response[0], response[1]));

                case 7:
                    return _context8.abrupt('return', _context8.sent);

                case 8:
                    return _context8.abrupt('return', {
                        code: 104,
                        message: 'not found'
                    });

                case 11:
                    _context8.prev = 11;
                    _context8.t0 = _context8['catch'](0);
                    return _context8.abrupt('return', {
                        code: 0,
                        message: _context8.t0.message,
                        error: _context8.t0
                    });

                case 14:
                case 'end':
                    return _context8.stop();
            }
        }
    }, null, undefined, [[0, 11]]);
};

var queryOrderDetail = exports.queryOrderDetail = function _callee9(orderId) {
    var order, asset;
    return _regenerator2.default.async(function _callee9$(_context9) {
        while (1) {
            switch (_context9.prev = _context9.next) {
                case 0:
                    _context9.prev = 0;
                    _context9.next = 3;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('get_objects', [[orderId]]));

                case 3:
                    order = _context9.sent;

                    if (!(order && order[0])) {
                        _context9.next = 14;
                        break;
                    }

                    order = order[0];
                    _context9.next = 8;
                    return _regenerator2.default.awrap(_api2.default.Assets.fetch([order.price.asset_id], true));

                case 8:
                    asset = _context9.sent;

                    if (!asset) {
                        console.log("链上不存在资产" + asset_id);
                        asset = {
                            id: "1.3.0",
                            symbol: "COCOS",
                            precision: 5
                        };
                    }
                    order.price_amount = _helper2.default.formatAmount(order.price.amount, asset.precision);
                    order.price_asset_symbol = asset.symbol;
                    order.price_asset_id = asset.id;

                    return _context9.abrupt('return', {
                        code: 1,
                        data: order
                    });

                case 14:
                    return _context9.abrupt('return', { code: 161, message: "Orders do not exist" });

                case 17:
                    _context9.prev = 17;
                    _context9.t0 = _context9['catch'](0);
                    return _context9.abrupt('return', {
                        code: 0,
                        message: _context9.t0.message,
                        error: _context9.t0
                    });

                case 20:
                case 'end':
                    return _context9.stop();
            }
        }
    }, null, undefined, [[0, 17]]);
};

exports.default = {
    listAccountNHAssets: listAccountNHAssets,
    lookupNHAssets: lookupNHAssets,
    listNHAssetOrders: listNHAssetOrders,
    listAccountNHAssetOrders: listAccountNHAssetOrders,
    lookupWorldViews: lookupWorldViews,
    getNHCreator: getNHCreator,
    listNHAssetsByCreator: listNHAssetsByCreator,
    queryOrderDetail: queryOrderDetail
};


var fomatOrders = function _callee11(orders) {
    var nh_asset_ids, items;
    return _regenerator2.default.async(function _callee11$(_context11) {
        while (1) {
            switch (_context11.prev = _context11.next) {
                case 0:
                    orders = orders.sort(function (a, b) {
                        var a_split = a.id.split(".");
                        var b_split = b.id.split(".");
                        return parseInt(b_split[2], 10) - parseInt(a_split[2], 10);
                    }).map(function (item) {
                        item.expiration = new Date(item.expiration + "Z").bcxformat("yyyy/MM/dd HH:mm:ss");
                        return item;
                    });

                    if (!orders.length) {
                        _context11.next = 11;
                        break;
                    }

                    nh_asset_ids = orders.map(function (order) {
                        return order.nh_asset_id;
                    });
                    items = {};
                    _context11.next = 6;
                    return _regenerator2.default.awrap(lookupNHAssets(nh_asset_ids));

                case 6:
                    _context11.t0 = function (item) {
                        items[item.id] = item;
                    };

                    _context11.sent.data.forEach(_context11.t0);

                    _context11.next = 10;
                    return _regenerator2.default.awrap(_promise2.default.all(orders.map(function _callee10(order, index) {
                        var asset;
                        return _regenerator2.default.async(function _callee10$(_context10) {
                            while (1) {
                                switch (_context10.prev = _context10.next) {
                                    case 0:
                                        if (items[order.nh_asset_id] && items[order.nh_asset_id].describe_with_contract) order.describe_with_contract = items[order.nh_asset_id].describe_with_contract;
                                        _context10.next = 3;
                                        return _regenerator2.default.awrap(_api2.default.Assets.fetch([order.price.asset_id], true));

                                    case 3:
                                        asset = _context10.sent;

                                        if (asset) {
                                            order.price_amount = _helper2.default.formatAmount(order.price.amount, asset.precision);
                                            order.price_asset_symbol = asset.symbol;
                                            order.price_asset_id = asset.id;
                                        } else {
                                            console.log("链上不存在资产" + asset_id);
                                        }
                                        _context10.next = 7;
                                        return _regenerator2.default.awrap(_api2.default.Account.getUser(order.seller, true));

                                    case 7:
                                        order.seller_name = _context10.sent.data.account.name;
                                        return _context10.abrupt('return', order);

                                    case 9:
                                    case 'end':
                                        return _context10.stop();
                                }
                            }
                        }, null, undefined);
                    })));

                case 10:
                    orders = _context11.sent;

                case 11:
                    return _context11.abrupt('return', orders);

                case 12:
                case 'end':
                    return _context11.stop();
            }
        }
    }, null, undefined);
};