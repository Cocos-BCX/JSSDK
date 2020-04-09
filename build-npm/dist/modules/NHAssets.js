'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _api = require('../services/api');

var _api2 = _interopRequireDefault(_api);

var _helper = require('../lib/common/helper');

var _helper2 = _interopRequireDefault(_helper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var initialState = {};

var actions = {
    relateNHAsset: function relateNHAsset(_ref, params) {
        var dispatch = _ref.dispatch;
        return _regenerator2.default.async(function relateNHAsset$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                    case 'end':
                        return _context.stop();
                }
            }
        }, null, undefined);
    },
    registerCreator: function registerCreator(_ref2) {
        var dispatch = _ref2.dispatch;

        return dispatch('transactions/_transactionOperations', {
            operations: [{
                op_type: 37,
                type: "register_nh_asset_creator",
                params: {}
            }]
        }, { root: true });
    },
    creatWorldView: function creatWorldView(_ref3, _ref4) {
        var dispatch = _ref3.dispatch;
        var _ref4$worldView = _ref4.worldView,
            worldView = _ref4$worldView === undefined ? "" : _ref4$worldView;

        if (!worldView) {
            return { code: 131, message: "Parameter 'worldView' can not be empty" };
        }
        worldView = worldView.trim();
        return dispatch('transactions/_transactionOperations', {
            operations: [{
                op_type: 38,
                type: "create_world_view",
                params: {
                    world_view: worldView
                }
            }]
        }, { root: true });
    },
    lookupNHAssets: function lookupNHAssets(store, _ref5) {
        var NHAssetIds = _ref5.NHAssetIds,
            _ref5$owner = _ref5.owner,
            owner = _ref5$owner === undefined ? false : _ref5$owner;
        return _regenerator2.default.async(function lookupNHAssets$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        if (Array.isArray(NHAssetIds)) {
                            _context2.next = 2;
                            break;
                        }

                        return _context2.abrupt('return', { code: 141, message: "Please check the data in parameter 'NHAssetIds'" });

                    case 2:
                        if (NHAssetIds.length) {
                            _context2.next = 4;
                            break;
                        }

                        return _context2.abrupt('return', { code: 137, message: "Parameter 'NHAssetIds' can not be empty" });

                    case 4:
                        NHAssetIds = NHAssetIds.map(function (id) {
                            return id ? id.trim() : "";
                        });

                        _context2.next = 7;
                        return _regenerator2.default.awrap(_api2.default.NHAssets.lookupNHAssets(NHAssetIds, owner, store.rootGetters["account/getAccountUserId"]));

                    case 7:
                        return _context2.abrupt('return', _context2.sent);

                    case 8:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, null, undefined);
    },
    queryAccountNHAssets: function queryAccountNHAssets(_ref6, params) {
        var dispatch = _ref6.dispatch;
        var result;
        return _regenerator2.default.async(function queryAccountNHAssets$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        _context3.next = 2;
                        return _regenerator2.default.awrap(_api2.default.NHAssets.listAccountNHAssets(params));

                    case 2:
                        result = _context3.sent;
                        return _context3.abrupt('return', result);

                    case 4:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, null, undefined);
    },
    formatItems: function formatItems(_ref7, result) {
        var dispatch = _ref7.dispatch;
        var items, i, item_wv_ids, wvs_id, contract_name, ii;
        return _regenerator2.default.async(function formatItems$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        if (!(result.code == 1)) {
                            _context4.next = 21;
                            break;
                        }

                        items = result.data;
                        i = 0;

                    case 3:
                        if (!(i < items.length)) {
                            _context4.next = 21;
                            break;
                        }

                        item_wv_ids = (0, _keys2.default)(items[i].world_view);
                        wvs_id = "";
                        contract_name = "";
                        ii = 0;

                    case 8:
                        if (!(ii < item_wv_ids.length)) {
                            _context4.next = 18;
                            break;
                        }

                        wvs_id = item_wv_ids[ii];
                        _context4.next = 12;
                        return _regenerator2.default.awrap(dispatch("contract/getContract", { nameOrId: wvs_id }, { root: true }));

                    case 12:
                        contract_name = _context4.sent.data.contract_name;

                        items[i].world_view[contract_name] = items[i].world_view[wvs_id];
                        delete items[i].world_view[wvs_id];

                    case 15:
                        ii++;
                        _context4.next = 8;
                        break;

                    case 18:
                        i++;
                        _context4.next = 3;
                        break;

                    case 21:
                        return _context4.abrupt('return', result);

                    case 22:
                    case 'end':
                        return _context4.stop();
                }
            }
        }, null, undefined);
    },
    queryNHAssetOrders: function queryNHAssetOrders(store, params) {
        var dispatch;
        return _regenerator2.default.async(function queryNHAssetOrders$(_context5) {
            while (1) {
                switch (_context5.prev = _context5.next) {
                    case 0:
                        dispatch = store.dispatch;


                        _helper2.default.trimParams(params);

                        if (params) {
                            _context5.next = 4;
                            break;
                        }

                        return _context5.abrupt('return', { code: 101, message: "Parameter is missing" });

                    case 4:
                        _context5.next = 6;
                        return _regenerator2.default.awrap(_api2.default.NHAssets.listNHAssetOrders(params, store));

                    case 6:
                        return _context5.abrupt('return', _context5.sent);

                    case 7:
                    case 'end':
                        return _context5.stop();
                }
            }
        }, null, undefined);
    },
    queryAccountNHAssetOrders: function queryAccountNHAssetOrders(store, params) {
        return _regenerator2.default.async(function queryAccountNHAssetOrders$(_context6) {
            while (1) {
                switch (_context6.prev = _context6.next) {
                    case 0:
                        _context6.next = 2;
                        return _regenerator2.default.awrap(_api2.default.NHAssets.listAccountNHAssetOrders(params));

                    case 2:
                        return _context6.abrupt('return', _context6.sent);

                    case 3:
                    case 'end':
                        return _context6.stop();
                }
            }
        }, null, undefined);
    },
    queryNHCreator: function queryNHCreator(_ref8, _ref9) {
        var dispatch = _ref8.dispatch;
        var account_id = _ref9.account_id;

        return _api2.default.NHAssets.getNHCreator(account_id);
    },
    queryNHAssetsByCreator: function queryNHAssetsByCreator(store, params) {
        return _regenerator2.default.async(function queryNHAssetsByCreator$(_context7) {
            while (1) {
                switch (_context7.prev = _context7.next) {
                    case 0:
                        _context7.next = 2;
                        return _regenerator2.default.awrap(_api2.default.NHAssets.listNHAssetsByCreator(params));

                    case 2:
                        return _context7.abrupt('return', _context7.sent);

                    case 3:
                    case 'end':
                        return _context7.stop();
                }
            }
        }, null, undefined);
    },
    lookupWorldViews: function lookupWorldViews(store, _ref10) {
        var worldViews = _ref10.worldViews;

        return _api2.default.NHAssets.lookupWorldViews(worldViews);
    },
    creatNHAsset: function creatNHAsset(_ref11, params) {
        var dispatch = _ref11.dispatch,
            rootGetters = _ref11.rootGetters;

        var _params$assetId, assetId, _params$worldView, worldView, _params$baseDescribe, baseDescribe, _params$type, type, _params$NHAssetsCount, NHAssetsCount, _params$NHAssets, NHAssets, ownerAccount, _params$onlyGetFee, onlyGetFee, proposeAccount, operations, overLimit0, acc_res, operation, i, overLimit1, j, _acc_res;

        return _regenerator2.default.async(function creatNHAsset$(_context8) {
            while (1) {
                switch (_context8.prev = _context8.next) {
                    case 0:
                        _helper2.default.trimParams(params);
                        //type:0 for single creation, 2 for batch creation
                        _params$assetId = params.assetId, assetId = _params$assetId === undefined ? "" : _params$assetId, _params$worldView = params.worldView, worldView = _params$worldView === undefined ? "" : _params$worldView, _params$baseDescribe = params.baseDescribe, baseDescribe = _params$baseDescribe === undefined ? "" : _params$baseDescribe, _params$type = params.type, type = _params$type === undefined ? 0 : _params$type, _params$NHAssetsCount = params.NHAssetsCount, NHAssetsCount = _params$NHAssetsCount === undefined ? 1 : _params$NHAssetsCount, _params$NHAssets = params.NHAssets, NHAssets = _params$NHAssets === undefined ? null : _params$NHAssets, ownerAccount = params.ownerAccount, _params$onlyGetFee = params.onlyGetFee, onlyGetFee = _params$onlyGetFee === undefined ? false : _params$onlyGetFee, proposeAccount = params.proposeAccount;
                        operations = [];

                        if (!(type == 0)) {
                            _context8.next = 25;
                            break;
                        }

                        overLimit0 = _isOverLimit(rootGetters, NHAssetsCount, "Create item");

                        if (!(overLimit0.code != 1)) {
                            _context8.next = 7;
                            break;
                        }

                        return _context8.abrupt('return', overLimit0);

                    case 7:
                        if (!(!assetId || !worldView)) {
                            _context8.next = 9;
                            break;
                        }

                        return _context8.abrupt('return', { code: 101, message: "Parameter is missing" });

                    case 9:
                        if (!ownerAccount) {
                            _context8.next = 20;
                            break;
                        }

                        _context8.next = 12;
                        return _regenerator2.default.awrap(dispatch("user/getUserInfo", { account: ownerAccount, isCache: true }, { root: true }));

                    case 12:
                        acc_res = _context8.sent;

                        if (!(acc_res.code == 1)) {
                            _context8.next = 17;
                            break;
                        }

                        ownerAccount = acc_res.data.account.id;
                        _context8.next = 18;
                        break;

                    case 17:
                        return _context8.abrupt('return', acc_res);

                    case 18:
                        _context8.next = 21;
                        break;

                    case 20:
                        ownerAccount = rootGetters["account/getAccountUserId"];

                    case 21:
                        operation = {
                            op_type: 40,
                            type: "create_nh_asset",
                            params: {
                                asset_id: assetId,
                                world_view: worldView,
                                base_describe: (typeof baseDescribe === 'undefined' ? 'undefined' : (0, _typeof3.default)(baseDescribe)) == "object" ? (0, _stringify2.default)(baseDescribe) : baseDescribe,
                                owner: ownerAccount
                            }
                        };


                        for (i = 0; i < NHAssetsCount; i++) {
                            operations.push(operation);
                        }

                        _context8.next = 49;
                        break;

                    case 25:
                        if (!(type == 1)) {
                            _context8.next = 49;
                            break;
                        }

                        if (!(NHAssets && Array.isArray(NHAssets) && NHAssets.length)) {
                            _context8.next = 48;
                            break;
                        }

                        overLimit1 = _isOverLimit(rootGetters, NHAssets.length, "create NHAsset");

                        if (!(overLimit1.code != 1)) {
                            _context8.next = 30;
                            break;
                        }

                        return _context8.abrupt('return', overLimit1);

                    case 30:
                        j = 0;

                    case 31:
                        if (!(j < NHAssets.length)) {
                            _context8.next = 46;
                            break;
                        }

                        if (!(!NHAssets[j].assetId || !NHAssets[j].worldView || !NHAssets[j].ownerAccount)) {
                            _context8.next = 34;
                            break;
                        }

                        return _context8.abrupt('return', { code: 141, message: "Please check the data in parameter 'NHAssets'" });

                    case 34:
                        _context8.next = 36;
                        return _regenerator2.default.awrap(dispatch("user/getUserInfo", { account: NHAssets[j].ownerAccount, isCache: true }, { root: true }));

                    case 36:
                        _acc_res = _context8.sent;

                        if (!(_acc_res.code == 1)) {
                            _context8.next = 41;
                            break;
                        }

                        NHAssets[j].ownerAccount = _acc_res.data.account.id;
                        _context8.next = 42;
                        break;

                    case 41:
                        return _context8.abrupt('return', _acc_res);

                    case 42:
                        operations.push({
                            op_type: 40,
                            type: "create_nh_asset",
                            params: {
                                asset_id: NHAssets[j].assetId,
                                world_view: NHAssets[j].worldView,
                                base_describe: (0, _typeof3.default)(NHAssets[j].baseDescribe) == "object" ? (0, _stringify2.default)(NHAssets[j].baseDescribe) : NHAssets[j].baseDescribe,
                                owner: NHAssets[j].ownerAccount
                            }
                        });

                    case 43:
                        j++;
                        _context8.next = 31;
                        break;

                    case 46:
                        _context8.next = 49;
                        break;

                    case 48:
                        return _context8.abrupt('return', { code: 142, message: "Please check the data type of parameter 'NHAssets'" });

                    case 49:
                        return _context8.abrupt('return', dispatch('transactions/_transactionOperations', {
                            operations: operations,
                            onlyGetFee: onlyGetFee,
                            proposeAccount: proposeAccount
                        }, { root: true }));

                    case 50:
                    case 'end':
                        return _context8.stop();
                }
            }
        }, null, undefined);
    },
    deleteNHAsset: function deleteNHAsset(_ref12, params) {
        var dispatch = _ref12.dispatch,
            rootGetters = _ref12.rootGetters;

        var callback, itemId, NHAssetIds, _params$onlyGetFee2, onlyGetFee, _params$owner, owner, overLimit, nhs_res, operations;

        return _regenerator2.default.async(function deleteNHAsset$(_context9) {
            while (1) {
                switch (_context9.prev = _context9.next) {
                    case 0:
                        _helper2.default.trimParams(params);
                        callback = params.callback, itemId = params.itemId, NHAssetIds = params.NHAssetIds, _params$onlyGetFee2 = params.onlyGetFee, onlyGetFee = _params$onlyGetFee2 === undefined ? false : _params$onlyGetFee2, _params$owner = params.owner, owner = _params$owner === undefined ? false : _params$owner;

                        if (NHAssetIds) {
                            _context9.next = 4;
                            break;
                        }

                        return _context9.abrupt('return', { code: 101, message: "Parameter is missing" });

                    case 4:
                        if (Array.isArray(NHAssetIds)) {
                            _context9.next = 6;
                            break;
                        }

                        return _context9.abrupt('return', { code: 135, message: "Please check parameter data type	" });

                    case 6:
                        overLimit = _isOverLimit(rootGetters, NHAssetIds.length, "delete item");

                        if (!(overLimit.code != 1)) {
                            _context9.next = 9;
                            break;
                        }

                        return _context9.abrupt('return', overLimit);

                    case 9:
                        _context9.next = 11;
                        return _regenerator2.default.awrap(_api2.default.NHAssets.lookupNHAssets(NHAssetIds, owner, rootGetters['account/getAccountUserId']));

                    case 11:
                        nhs_res = _context9.sent;

                        if (!(nhs_res.code == 1)) {
                            _context9.next = 19;
                            break;
                        }

                        if (nhs_res.data.length) {
                            _context9.next = 15;
                            break;
                        }

                        return _context9.abrupt('return', { code: 176, message: "You are not the owner of " + NHAssetIds });

                    case 15:
                        operations = nhs_res.data.map(function (_ref13) {
                            var id = _ref13.id;

                            return {
                                op_type: 41,
                                type: "delete_nh_asset",
                                params: {
                                    nh_asset: id
                                }
                            };
                        });
                        return _context9.abrupt('return', dispatch('transactions/_transactionOperations', {
                            operations: operations,
                            onlyGetFee: onlyGetFee
                        }, { root: true }));

                    case 19:
                        return _context9.abrupt('return', nhs_res);

                    case 20:
                    case 'end':
                        return _context9.stop();
                }
            }
        }, null, undefined);
    },
    transferNHAsset: function transferNHAsset(_ref14, _ref15) {
        var dispatch = _ref14.dispatch,
            rootGetters = _ref14.rootGetters;
        var to_account_id = _ref15.to_account_id,
            NHAssetIds = _ref15.NHAssetIds;
        var overLimit, nhs_res, operations;
        return _regenerator2.default.async(function transferNHAsset$(_context10) {
            while (1) {
                switch (_context10.prev = _context10.next) {
                    case 0:
                        if (NHAssetIds) {
                            _context10.next = 2;
                            break;
                        }

                        return _context10.abrupt('return', { code: 101, message: "Parameter is missing" });

                    case 2:
                        if (Array.isArray(NHAssetIds)) {
                            _context10.next = 4;
                            break;
                        }

                        return _context10.abrupt('return', { code: 135, message: "Please check parameter data type	" });

                    case 4:
                        overLimit = _isOverLimit(rootGetters, NHAssetIds.length, "transfer item");

                        if (!(overLimit.code != 1)) {
                            _context10.next = 7;
                            break;
                        }

                        return _context10.abrupt('return', overLimit);

                    case 7:
                        _context10.next = 9;
                        return _regenerator2.default.awrap(_api2.default.NHAssets.lookupNHAssets(NHAssetIds));

                    case 9:
                        nhs_res = _context10.sent;

                        if (!(nhs_res.code == 1)) {
                            _context10.next = 15;
                            break;
                        }

                        operations = nhs_res.data.map(function (_ref16) {
                            var id = _ref16.id;

                            return {
                                op_type: 42,
                                type: "transfer_nh_asset",
                                params: {
                                    to: to_account_id,
                                    nh_asset: id
                                }
                            };
                        });
                        return _context10.abrupt('return', dispatch('transactions/_transactionOperations', {
                            operations: operations
                        }, { root: true }));

                    case 15:
                        return _context10.abrupt('return', nhs_res);

                    case 16:
                    case 'end':
                        return _context10.stop();
                }
            }
        }, null, undefined);
    },
    creatNHAssetOrder: function creatNHAssetOrder(_ref17, params) {
        var dispatch = _ref17.dispatch;

        var otc_account_id, orderFee, NHAssetId, _params$memo, memo, price, _params$priceAssetId, priceAssetId, _params$expiration, expiration, _params$onlyGetFee3, onlyGetFee, priceAssetRes, _priceAssetRes$data$, precision, dynamic, nhs_res;

        return _regenerator2.default.async(function creatNHAssetOrder$(_context11) {
            while (1) {
                switch (_context11.prev = _context11.next) {
                    case 0:
                        _helper2.default.trimParams(params);
                        otc_account_id = params.otc_account_id, orderFee = params.orderFee, NHAssetId = params.NHAssetId, _params$memo = params.memo, memo = _params$memo === undefined ? "" : _params$memo, price = params.price, _params$priceAssetId = params.priceAssetId, priceAssetId = _params$priceAssetId === undefined ? "1.3.0" : _params$priceAssetId, _params$expiration = params.expiration, expiration = _params$expiration === undefined ? 3600 * 48 : _params$expiration, _params$onlyGetFee3 = params.onlyGetFee, onlyGetFee = _params$onlyGetFee3 === undefined ? false : _params$onlyGetFee3;

                        if (!(!NHAssetId || !priceAssetId)) {
                            _context11.next = 4;
                            break;
                        }

                        return _context11.abrupt('return', { code: 101, message: "Parameter is missing" });

                    case 4:
                        if (!(isNaN(Number(orderFee)) || isNaN(Number(price)) || isNaN(Number(expiration)))) {
                            _context11.next = 6;
                            break;
                        }

                        return _context11.abrupt('return', { code: 135, message: "Please check parameter data type" });

                    case 6:
                        _context11.next = 8;
                        return _regenerator2.default.awrap(dispatch("assets/queryAssets", { assetId: priceAssetId }, { root: true }));

                    case 8:
                        priceAssetRes = _context11.sent;

                        if (!(priceAssetRes.code != 1)) {
                            _context11.next = 11;
                            break;
                        }

                        return _context11.abrupt('return', priceAssetRes);

                    case 11:
                        _priceAssetRes$data$ = priceAssetRes.data[0], precision = _priceAssetRes$data$.precision, dynamic = _priceAssetRes$data$.dynamic;

                        if (!(price > dynamic.current_supply)) {
                            _context11.next = 14;
                            break;
                        }

                        return _context11.abrupt('return', { code: 177, message: "Prices exceed current supply" });

                    case 14:
                        _context11.next = 16;
                        return _regenerator2.default.awrap(_api2.default.NHAssets.lookupNHAssets([NHAssetId]));

                    case 16:
                        nhs_res = _context11.sent;

                        if (!(nhs_res.code == 1)) {
                            _context11.next = 22;
                            break;
                        }

                        NHAssetId = nhs_res.data[0].id;
                        return _context11.abrupt('return', dispatch('transactions/_transactionOperations', {
                            operations: [{
                                op_type: 43,
                                type: "create_nh_asset_order",
                                params: {
                                    otcaccount: otc_account_id,
                                    pending_orders_fee: orderFee,
                                    nh_asset: NHAssetId,
                                    memo: memo,
                                    price: price,
                                    priceAssetId: priceAssetId,
                                    expiration: parseInt(new Date().getTime() / 1000 + Number(expiration))
                                }
                            }],
                            onlyGetFee: onlyGetFee
                        }, { root: true }));

                    case 22:
                        return _context11.abrupt('return', nhs_res);

                    case 23:
                    case 'end':
                        return _context11.stop();
                }
            }
        }, null, undefined);
    },
    cancelNHAssetOrder: function cancelNHAssetOrder(_ref18, _ref19) {
        var dispatch = _ref18.dispatch;
        var orderId = _ref19.orderId,
            _ref19$onlyGetFee = _ref19.onlyGetFee,
            onlyGetFee = _ref19$onlyGetFee === undefined ? false : _ref19$onlyGetFee;

        if (!orderId) {
            return { code: 136, message: "Parameter 'orderId' can not be empty" };
        }
        orderId = orderId.trim();
        return dispatch('transactions/_transactionOperations', {
            operations: [{
                op_type: 44,
                type: "cancel_nh_asset_order",
                params: {
                    order: orderId,
                    extensions: []
                }
            }],
            onlyGetFee: onlyGetFee
        }, { root: true });
    },
    fillNHAssetOrder: function fillNHAssetOrder(_ref20, _ref21) {
        var dispatch = _ref20.dispatch;
        var orderId = _ref21.orderId,
            _ref21$onlyGetFee = _ref21.onlyGetFee,
            onlyGetFee = _ref21$onlyGetFee === undefined ? false : _ref21$onlyGetFee;

        var order_res, _order_res$data, nh_asset_id, seller, price_amount, price_asset_id, price_asset_symbol;

        return _regenerator2.default.async(function fillNHAssetOrder$(_context12) {
            while (1) {
                switch (_context12.prev = _context12.next) {
                    case 0:
                        if (orderId) {
                            _context12.next = 2;
                            break;
                        }

                        return _context12.abrupt('return', { code: 101, message: "Parameter is missing" });

                    case 2:
                        orderId = orderId.trim();
                        _context12.next = 5;
                        return _regenerator2.default.awrap(_api2.default.NHAssets.queryOrderDetail(orderId));

                    case 5:
                        order_res = _context12.sent;

                        if (!(order_res.code != 1)) {
                            _context12.next = 8;
                            break;
                        }

                        return _context12.abrupt('return', order_res);

                    case 8:
                        _order_res$data = order_res.data, nh_asset_id = _order_res$data.nh_asset_id, seller = _order_res$data.seller, price_amount = _order_res$data.price_amount, price_asset_id = _order_res$data.price_asset_id, price_asset_symbol = _order_res$data.price_asset_symbol;
                        return _context12.abrupt('return', dispatch('transactions/_transactionOperations', {
                            operations: [{
                                op_type: 45,
                                type: "fill_nh_asset_order",
                                params: {
                                    order: orderId,
                                    seller: seller,
                                    nh_asset: nh_asset_id,
                                    price_amount: price_amount + "",
                                    price_asset_id: price_asset_id,
                                    price_asset_symbol: price_asset_symbol,
                                    extensions: []
                                }
                            }],
                            onlyGetFee: onlyGetFee
                        }, { root: true }));

                    case 10:
                    case 'end':
                        return _context12.stop();
                }
            }
        }, null, undefined);
    },
    proposeRelateWorldView: function proposeRelateWorldView(_ref22, _ref23) {
        var dispatch = _ref22.dispatch,
            rootGetters = _ref22.rootGetters;
        var worldView = _ref23.worldView,
            _ref23$onlyGetFee = _ref23.onlyGetFee,
            onlyGetFee = _ref23$onlyGetFee === undefined ? false : _ref23$onlyGetFee,
            _ref23$proposeAccount = _ref23.proposeAccount,
            proposeAccount = _ref23$proposeAccount === undefined ? "" : _ref23$proposeAccount;
        var wv_detail, view_owner_id;
        return _regenerator2.default.async(function proposeRelateWorldView$(_context13) {
            while (1) {
                switch (_context13.prev = _context13.next) {
                    case 0:
                        _context13.next = 2;
                        return _regenerator2.default.awrap(_api2.default.NHAssets.lookupWorldViews([worldView]));

                    case 2:
                        wv_detail = _context13.sent;

                        if (!(wv_detail.code != 1)) {
                            _context13.next = 5;
                            break;
                        }

                        return _context13.abrupt('return', wv_detail);

                    case 5:
                        view_owner_id = wv_detail.data[0].creators[0].creator;
                        return _context13.abrupt('return', dispatch('transactions/_transactionOperations', {
                            operations: [{
                                op_type: 39,
                                type: "relate_world_view",
                                params: {
                                    world_view: worldView,
                                    view_owner: view_owner_id
                                }
                            }],
                            proposeAccount: rootGetters["account/getAccountUserId"],
                            onlyGetFee: onlyGetFee
                        }, { root: true }));

                    case 7:
                    case 'end':
                        return _context13.stop();
                }
            }
        }, null, undefined);
    }
};

var mutations = {};

var _isOverLimit = function _isOverLimit(rootGetters, params_count, title) {

    var ops_limit = rootGetters["setting/ops_limit"];
    if (params_count > ops_limit) {
        return { code: 144, message: "Your current batch " + title + " number is " + params_count + ", and batch operations can not exceed " + ops_limit };
    }

    return { code: 1 };
};

exports.default = {
    state: initialState,
    actions: actions,
    //getters,
    mutations: mutations,
    namespaced: true
};