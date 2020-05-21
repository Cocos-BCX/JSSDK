'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _mutations;

var _vue = require('vue');

var _vue2 = _interopRequireDefault(_vue);

var _mutations2 = require('../mutations');

var types = _interopRequireWildcard(_mutations2);

var _helper = require('../lib/common/helper');

var _helper2 = _interopRequireDefault(_helper);

var _api = require('../services/api');

var _api2 = _interopRequireDefault(_api);

var _bcxjsWs = require('bcxjs-ws');

var _persistentStorage = require('../services/persistent-storage');

var _persistentStorage2 = _interopRequireDefault(_persistentStorage);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var initialState = {
    versions: "2.2.9",
    ops_limit: 100,
    autoReconnect: true,
    defaultSettings: {
        locale: "zh",
        unit: "1.3.0",
        showSettles: false,
        showAssetPercent: false,
        walletLockTimeout: 60 * 10
    },
    settingsAPIs: {
        default_ws_node: "",
        select_ws_node: "",
        ws_node_list: {},
        networks: [],
        default_faucet: "",
        //defaultAssetsNames: ['COCOS'],
        referrer: '',
        check_cached_account_data: true,
        check_cached_nodes_data: false,
        sub_max_ops: 13,
        real_sub: true
    },
    trx_results: ["error_result", "void_result", "object_id_result", "asset_result", "contract_result", "logger_result"]
};
var getters = {
    trx_results: function trx_results(state) {
        return state.trx_results;
    },
    SELECT_WS_NODE_URL: function SELECT_WS_NODE_URL(state) {
        return state.settingsAPIs.select_ws_node;
    },
    default_ws_node: function default_ws_node(state) {
        return state.settingsAPIs.default_ws_node;
    },
    networks: function networks(state) {
        return state.settingsAPIs.networks;
    },
    worker: function worker(state) {
        return state.settingsAPIs.worker;
    },
    g_settingsAPIs: function g_settingsAPIs(state) {
        return state.settingsAPIs;
    },
    defaultSettings: function defaultSettings(state) {
        return state.defaultSettings;
    },
    ws_node_list: function ws_node_list(state) {
        var nodes = state.settingsAPIs.ws_node_list;
        return (0, _keys2.default)(nodes).map(function (key) {
            var _nodes$key = nodes[key],
                location = _nodes$key.location,
                ping = _nodes$key.ping;

            return {
                url: key,
                name: location,
                ping: ping
            };
        });
    },
    ops_limit: function ops_limit(state) {
        return state.ops_limit;
    },
    autoReconnect: function autoReconnect(state) {
        return state.autoReconnect;
    },
    getApiConfig: function getApiConfig(state) {
        var settingsAPIs = state.settingsAPIs,
            ops_limit = state.ops_limit,
            autoReconnect = state.autoReconnect,
            defaultSettings = state.defaultSettings,
            versions = state.versions;

        var _settingsAPIs = JSON.parse((0, _stringify2.default)(settingsAPIs));
        delete _settingsAPIs.referrer;

        return JSON.parse((0, _stringify2.default)((0, _extends3.default)({}, _settingsAPIs, {
            versions: versions,
            ops_limit: ops_limit,
            auto_reconnect: autoReconnect,
            locale: defaultSettings.locale,
            unit: defaultSettings.unit
        })));
    }
};
var actions = {
    setAutoReconnect: function setAutoReconnect(_ref, b) {
        var commit = _ref.commit;

        commit(types.SET_AUTO_RECONNECT, b);
    },
    setSettingsAPIS: function setSettingsAPIS(_ref2, params) {
        var commit = _ref2.commit,
            dispatch = _ref2.dispatch;

        if (!params || typeof params == "function") {
            return { code: 0 };
        }
        var app_keys = params.app_keys,
            check_cached_account_data = params.check_cached_account_data;
        //contract authorization app_keys configuration

        if (app_keys != undefined && app_keys && Array.isArray(app_keys)) dispatch("PrivateKeyStore/setAppkeys", app_keys, { root: true });

        //whether check and use the local cache of accounts info
        if (check_cached_account_data) dispatch("account/checkCachedUserData", null, { root: true });

        commit(types.SET_SETTINGS_APIS, params);
        return { code: 1 };
    },
    set_SELECT_WS_NODE: function set_SELECT_WS_NODE(_ref3, url) {
        var commit = _ref3.commit;

        commit(types.SET_SELECT_WS_NODE, url);
    },
    addAPINode: function addAPINode(_ref4, node) {
        var commit = _ref4.commit,
            dispatch = _ref4.dispatch,
            state = _ref4.state;
        var url, nodes;
        return _regenerator2.default.async(function addAPINode$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        if (_helper2.default.trimParams(node)) {
                            _context.next = 2;
                            break;
                        }

                        return _context.abrupt('return', { code: 101, message: "Parameter is missing" });

                    case 2:
                        url = node.url;

                        if (/^ws{1,2}:\/\/./.test(url)) {
                            _context.next = 5;
                            break;
                        }

                        return _context.abrupt('return', { code: 139, message: "Node address must start with ws:// or wss://" });

                    case 5:
                        nodes = state.settingsAPIs.ws_node_list;

                        if (!(0, _keys2.default)(nodes).find(function (n_url) {
                            return n_url === url;
                        })) {
                            _context.next = 8;
                            break;
                        }

                        return _context.abrupt('return', { code: 140, message: "API server node address already exists" });

                    case 8:
                        commit(types.ADD_API_NODE, node); //referring here may cause ping missing

                        _context.next = 11;
                        return _regenerator2.default.awrap(dispatch("connection/addAPINode", node, { root: true }));

                    case 11:
                        return _context.abrupt('return', { code: 1, data: JSON.parse((0, _stringify2.default)(nodes)) });

                    case 12:
                    case 'end':
                        return _context.stop();
                }
            }
        }, null, undefined);
    },
    deleteAPINode: function deleteAPINode(_ref5, url) {
        var commit = _ref5.commit,
            dispatch = _ref5.dispatch;

        commit(types.DELETE_API_NODE, url);
        dispatch("connection/deleteAPINode", url, { root: true });
    }
};

var mutations = (_mutations = {}, (0, _defineProperty3.default)(_mutations, types.SET_AUTO_RECONNECT, function (state, b) {
    state.autoReconnect = b;
}), (0, _defineProperty3.default)(_mutations, types.SET_SETTINGS_APIS, function (state, params) {
    var default_ws_node = params.default_ws_node,
        faucet_url = params.faucet_url,
        unit = params.unit,
        ws_node_list = params.ws_node_list,
        networks = params.networks,
        check_cached_account_data = params.check_cached_account_data,
        check_cached_nodes_data = params.check_cached_nodes_data,
        worker = params.worker,
        auto_reconnect = params.auto_reconnect,
        sub_max_ops = params.sub_max_ops,
        real_sub = params.real_sub,
        locale = params.locale;


    var settingsAPIs = state.settingsAPIs;

    if (default_ws_node != undefined) settingsAPIs.default_ws_node = default_ws_node;

    if (faucet_url != undefined) settingsAPIs.default_faucet = faucet_url;

    if (unit != undefined) state.defaultSettings.unit = unit;

    if (sub_max_ops) _api2.default.ChainListener.sub_max_ops = sub_max_ops;

    //chain config
    if (networks) {
        _bcxjsWs.ChainConfig.networks = networks;
        settingsAPIs.networks = networks;
        console.log('bcxjs version\uFF1A' + state.versions);
    }

    if (check_cached_account_data != undefined) settingsAPIs.check_cached_account_data = !!check_cached_account_data;
    if (check_cached_nodes_data != undefined) {
        settingsAPIs.check_cached_nodes_data = !!check_cached_nodes_data;
        !check_cached_nodes_data && _persistentStorage2.default.clearNodesData();
    }
    var cached_nodes_data = _persistentStorage2.default.getSavedNodesData();
    if (settingsAPIs.check_cached_nodes_data && (0, _keys2.default)(cached_nodes_data).length) {
        settingsAPIs.ws_node_list = _persistentStorage2.default.getSavedNodesData();
    } else if (ws_node_list) {
        settingsAPIs.ws_node_list = {};
        ws_node_list.forEach(function (node) {
            settingsAPIs.ws_node_list[node.url] = { location: node.name };
        });
        _api2.default.Connection.setAPINode(settingsAPIs.ws_node_list);
    }

    if (worker != undefined) settingsAPIs.worker = !!worker;
    if (auto_reconnect != undefined) state.autoReconnect = !!auto_reconnect;

    if (real_sub != undefined) {
        _api2.default.ChainListener.real_sub = real_sub;
        settingsAPIs.real_sub = real_sub;
    }

    if (locale != undefined) {
        state.defaultSettings.locale = locale;
    }
}), (0, _defineProperty3.default)(_mutations, types.SET_SELECT_WS_NODE, function (state, url) {
    state.settingsAPIs.select_ws_node = url;
}), (0, _defineProperty3.default)(_mutations, types.ADD_API_NODE, function (state, _ref6) {
    var name = _ref6.name,
        url = _ref6.url;

    _vue2.default.set(state.settingsAPIs.ws_node_list, url, { location: name });
}), (0, _defineProperty3.default)(_mutations, types.DELETE_API_NODE, function (state, url) {
    _vue2.default.delete(state.settingsAPIs.ws_node_list, url);
}), _mutations);

exports.default = {
    state: initialState,
    actions: actions,
    mutations: mutations,
    getters: getters,
    namespaced: true
};