'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lookupWSNodeList = exports.IDB_INIT = exports.initConnection = exports.setSubscribeToRpcConnectionStatusCallback = exports.disconnect = exports.switchNode = exports.deleteAPINode = exports.addAPINode = exports.testNodesPings = undefined;

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _api = require('../services/api');

var _api2 = _interopRequireDefault(_api);

var _mutations = require('../mutations');

var types = _interopRequireWildcard(_mutations);

var _bcxjsCores = require('bcxjs-cores');

var _bcxjsWs = require('bcxjs-ws');

var _idbInstance = require('../services/api/wallet/idb-instance');

var _idbInstance2 = _interopRequireDefault(_idbInstance);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _new_node_connecting = false; //if here is new incoming node connection.
/**
 * Initializes connection to WS
 */
var testNodesPings = exports.testNodesPings = function testNodesPings(store, refresh) {
  return _api2.default.Connection.testNodesPings(refresh);
};

var addAPINode = exports.addAPINode = function addAPINode(store, node) {
  return _api2.default.Connection.addAPINode(node);
};

var deleteAPINode = exports.deleteAPINode = function deleteAPINode(store, _ref) {
  var url = _ref.url;

  if (!url) {
    return { code: 138, message: "Parameter 'url' can not be empty" };
  }
  url = url.trim();
  _api2.default.Connection.deleteAPINode(url);
  return { code: 1 };
};
var _startConnectTimer = 0;

var switchNode = exports.switchNode = function _callee(_ref2, _ref3) {
  var commit = _ref2.commit,
      dispatch = _ref2.dispatch,
      rootGetters = _ref2.rootGetters;
  var url = _ref3.url,
      callback = _ref3.callback;
  return _regenerator2.default.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          clearTimeout(_startConnectTimer);
          if (!url) {
            url = rootGetters["setting/ws_node_list"][0].url;
            //callback&&callback({code:138,message:"Parameter 'url' can not be empty"});
            //return;
          }
          //clear all the cache created by current chain to avoid a chain switch.
          dispatch("vote/setGlobalObject", null, { root: true });
          dispatch("explorer/set_last_current_aslot", null, { root: true });
          dispatch("assets/set_assets", {}, { root: true });

          _new_node_connecting = true;
          _bcxjsCores.ChainStore.clearCache();
          _bcxjsCores.ChainStore.subscribed = false;

          _context.next = 10;
          return _regenerator2.default.awrap(_api2.default.Connection.disconnect());

        case 10:
          _new_node_connecting = false;
          commit(types.WS_DISCONNECTED);
          dispatch("initConnection", { callback: callback, url: url });

        case 13:
        case 'end':
          return _context.stop();
      }
    }
  }, null, undefined);
};

var disconnect = exports.disconnect = function _callee2(_ref4) {
  var dispatch = _ref4.dispatch,
      commit = _ref4.commit;
  return _regenerator2.default.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;

          commit(types.SET_WS_CONNECTING, false);
          dispatch("setting/setAutoReconnect", false, { root: true });
          _context2.next = 5;
          return _regenerator2.default.awrap(_api2.default.Connection.disconnect());

        case 5:
          return _context2.abrupt('return', { code: 1 });

        case 8:
          _context2.prev = 8;
          _context2.t0 = _context2['catch'](0);
          return _context2.abrupt('return', { code: 0, message: _context2.t0.message });

        case 11:
        case 'end':
          return _context2.stop();
      }
    }
  }, null, undefined, [[0, 8]]);
};
//Set RPC connection status change callback
var setSubscribeToRpcConnectionStatusCallback = exports.setSubscribeToRpcConnectionStatusCallback = function setSubscribeToRpcConnectionStatusCallback(_ref5, _ref6) {
  var commit = _ref5.commit;
  var callback = _ref6.callback;

  commit(types.SET_RPC_STATUS_CALLBACK, callback);
};

var _callbacks = []; //Collection of callback functions to prevent functions from being called without initialization.
var initConnection = exports.initConnection = function initConnection(store, params) {
  var dispatch = store.dispatch,
      commit = store.commit,
      getters = store.getters,
      rootGetters = store.rootGetters,
      state = store.state;

  if (getters.wsConnecting) {
    //The incoming callbacks while RPC is initializing will be pushed in _callbacks
    _callbacks.push(typeof params == "function" ? params : params.callback);
    return;
  };
  var connect_url = rootGetters["setting/g_settingsAPIs"].default_ws_node;
  if (params) {
    //Here is the compatible with old version directly callback or object parameter.
    if ((typeof params === 'undefined' ? 'undefined' : (0, _typeof3.default)(params)) == "object") {
      var callback = params.callback,
          subscribeToRpcConnectionStatusCallback = params.subscribeToRpcConnectionStatusCallback,
          autoReconnect = params.autoReconnect,
          url = params.url;

      if (callback) _callbacks = [callback];
      if (subscribeToRpcConnectionStatusCallback) commit(types.SET_RPC_STATUS_CALLBACK, subscribeToRpcConnectionStatusCallback);
      if (autoReconnect) commit(types.SET_AUTO_RECONNECT, !!autoReconnect);
      if (url) connect_url = url;
    } else if (typeof params == "function") {
      _callbacks = [params];
    }
  } else if (!params || params.clearCallback) {
    _callbacks = [];
  }

  //If the RPC connected, then execute the callback 
  if (getters.isWsConnected && params && !params.refresh) {
    _callbacks.length && _callbacks[0]({ code: 1 });
    return;
  }

  //RPC status changed callback
  var updateConnectionStatus = function _callee3(status) {
    var selectedNodeUrl = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
    var store_autoReconnect;
    return _regenerator2.default.async(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            console.log('Connection status : ', status, selectedNodeUrl);
            commit(types.RPC_STATUS_UPDATE, { status: status, url: selectedNodeUrl });
            dispatch("setting/set_SELECT_WS_NODE", selectedNodeUrl, { root: true });

            store_autoReconnect = rootGetters["setting/autoReconnect"];

            if (!(status === 'error' || status === 'closed')) {
              _context3.next = 13;
              break;
            }

            //connection error
            commit(types.WS_DISCONNECTED);
            if (_startConnectTimer) {
              clearTimeout(_startConnectTimer);
            }
            _bcxjsCores.ChainStore.subscribed = false;

            if (!(_new_node_connecting == false && store_autoReconnect)) {
              _context3.next = 13;
              break;
            }

            _context3.next = 11;
            return _regenerator2.default.awrap(_api2.default.Connection.disconnect());

          case 11:
            _startConnectTimer = setTimeout(function () {
              startConnect(selectedNodeUrl);
            }, 3000);
            return _context3.abrupt('return');

          case 13:

            //RPC connected
            if (status === 'realopen') {
              commit(types.SET_WS_CONNECTING, false);
              dispatch("IDB_INIT");

              // ChainStore.init().then(()=>{
              //   API.ChainListener.enable();
              //   Promise.all([
              //     rootGetters["setting/g_settingsAPIs"].check_cached_account_data? dispatch("account/checkCachedUserData",null,{root:true}):true,
              //     API.Explorer.getGlobalObject()
              //   ]).then((res)=>{
              //      _callbacks.forEach(callback_item=>{ callback_item({code:1}); });
              //      _callbacks.length=1;    
              //   })
              // }).catch(error=>{
              //   _callbacks.forEach(callback=>{ callback({code:300,message:"ChainStore sync error, please check your system clock"}); });
              // })
            } else if (!store_autoReconnect) {
              //if auto reconnection isn't configured, execute callback
              !_new_node_connecting && _callbacks.length && _callbacks.forEach(function (callback) {
                callback({ code: 301, message: "RPC connection failed. Please check your network" });
              });
            }

          case 14:
          case 'end':
            return _context3.stop();
        }
      }
    }, null, undefined);
  };

  var startConnect = function startConnect() {
    var url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    var refresh = arguments[1];

    commit(types.SET_WS_CONNECTING, true);
    _api2.default.Connection.connect({
      statusCallback: updateConnectionStatus,
      changeNodeUrl: refresh ? "" : url,
      store: store,
      refresh: refresh
    });
  };
  startConnect(connect_url || rootGetters["setting/g_settingsAPIs"].default_ws_node, params ? !!params.refresh : false);
};

var IDB_INIT = exports.IDB_INIT = function IDB_INIT(store) {
  var dispatch = store.dispatch,
      rootGetters = store.rootGetters,
      commit = store.commit,
      state = store.state;

  var db;
  try {
    //install indexeddbshim 2.2.1 other version may cause problems
    db = _idbInstance2.default.init_instance(window.openDatabase ? shimIndexedDB || indexedDB : indexedDB).init_promise;
  } catch (err) {
    console.log("db init error:", err);
  }
  //Init websql
  return _promise2.default.all([db]).then(function () {
    console.log("db init done");
    return _promise2.default.all([dispatch("PrivateKeyStore/loadDbData", null, { root: true }).then(function () {
      dispatch("AccountRefsStore/loadDbData", null, { root: true });
    }), dispatch("WalletDb/loadDbData", null, { root: true }).then(function () {}).catch(function (error) {
      console.error("----- WalletDb.willTransitionTo error ----->", error);
    }), dispatch("WalletManagerStore/init", null, { root: true })]).then(function () {
      var _rootGetters$setting = rootGetters["setting/g_settingsAPIs"],
          check_cached_account_data = _rootGetters$setting.check_cached_account_data,
          real_sub = _rootGetters$setting.real_sub,
          select_ws_node = _rootGetters$setting.select_ws_node;

      // ChainStore.clearCache();
      // ChainStore.subscribed=false;

      _bcxjsCores.ChainStore.init(!!real_sub).then(function () {
        commit(types.WS_CONNECTED);
        state.reconnectCounter = 3;
        _api2.default.ChainListener.enable();
        _api2.default.ChainListener.store = store;

        //whether check local User Info Cache and use its data
        if (check_cached_account_data) dispatch("account/checkCachedUserData", null, { root: true });

        dispatch("AccountStore/loadDbData", null, { root: true }).then(function () {
          _promise2.default.all([_api2.default.Explorer.getGlobalObject()]).then(function (res) {
            _callbacks.forEach(function (callback_item) {
              callback_item({ code: 1, data: { selectedNodeUrl: select_ws_node } });
            });
            _callbacks.length = 1;
            select_ws_node = "";
          });
        }).catch(function (error) {
          console.log("[Root.js] ----- ERROR ----->", error);
        });
      }).catch(function (error) {
        if (state.reconnectCounter > 5) {
          _callbacks.forEach(function (callback) {
            callback({ code: 300, message: "ChainStore sync error, please check your system clock" });
          });
        } else {
          commit(types.WS_DISCONNECTED);
          state.reconnectCounter++;
          dispatch("initConnection", { refresh: false, clearCallback: false });
        }
      });
    });
  });
};

//Get API server list
var lookupWSNodeList = exports.lookupWSNodeList = function _callee4(_ref7, _ref8) {
  var dispatch = _ref7.dispatch,
      rootGetters = _ref7.rootGetters;
  var _ref8$refresh = _ref8.refresh,
      refresh = _ref8$refresh === undefined ? false : _ref8$refresh;
  var settingsAPIs, nodes;
  return _regenerator2.default.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          settingsAPIs = rootGetters["setting/g_settingsAPIs"];
          _context4.next = 3;
          return _regenerator2.default.awrap(dispatch("testNodesPings", refresh));

        case 3:
          nodes = _context4.sent;

          nodes = (0, _keys2.default)(nodes).map(function (key) {
            var _nodes$key = nodes[key],
                location = _nodes$key.location,
                ping = _nodes$key.ping;

            return {
              url: key,
              name: location,
              ping: ping
            };
          });
          return _context4.abrupt('return', {
            code: 1,
            data: {
              nodes: nodes,
              selectedNodeUrl: settingsAPIs.select_ws_node
            }
          });

        case 6:
        case 'end':
          return _context4.stop();
      }
    }
  }, null, undefined);
};