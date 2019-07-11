'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bcxjsWs = require('bcxjs-ws');

var _nodesManager = require('./nodes-manager');

var _nodesManager2 = _interopRequireDefault(_nodesManager);

var _mutations = require('../../mutations');

var types = _interopRequireWildcard(_mutations);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var nodesManager = void 0;
/**
 * Connects to bcxjs-ws with provided callback function
 * United Labs of BCTech.
 */
var connect = function _callee(_ref) {
  var _ref$statusCallback = _ref.statusCallback,
      statusCallback = _ref$statusCallback === undefined ? null : _ref$statusCallback,
      _ref$changeNodeUrl = _ref.changeNodeUrl,
      changeNodeUrl = _ref$changeNodeUrl === undefined ? "" : _ref$changeNodeUrl,
      store = _ref.store,
      _ref$refresh = _ref.refresh,
      refresh = _ref$refresh === undefined ? false : _ref$refresh;

  var _store$rootGetters$se, ws_node_list, select_ws_node, check_cached_nodes_data, url, isTestPing;

  return _regenerator2.default.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _store$rootGetters$se = store.rootGetters["setting/g_settingsAPIs"], ws_node_list = _store$rootGetters$se.ws_node_list, select_ws_node = _store$rootGetters$se.select_ws_node, check_cached_nodes_data = _store$rootGetters$se.check_cached_nodes_data;
          url = changeNodeUrl;
          isTestPing = false; //check if ping tested; 

          if (!(!nodesManager || refresh)) {
            _context.next = 8;
            break;
          }

          nodesManager = new _nodesManager2.default({
            nodes: ws_node_list,
            defaultNode: changeNodeUrl
          });
          isTestPing = true;
          _context.next = 8;
          return _regenerator2.default.awrap(nodesManager.testNodesPings());

        case 8:
          if (!url) {
            _context.next = 12;
            break;
          }

          //if connected url is selected address, then get another address
          if (select_ws_node == url) url = nodesManager.getAnotherNodeUrl(url) || url;
          _context.next = 17;
          break;

        case 12:
          //if connected url is null or empty, then connect the fastest one
          nodesManager._selectedNodeUrl = "";

          if (isTestPing) {
            _context.next = 16;
            break;
          }

          _context.next = 16;
          return _regenerator2.default.awrap(nodesManager.testNodesPings());

        case 16:
          url = nodesManager.getInitialNodeUrl();

        case 17:

          if (url) {
            console.log('Connecting to node : ', url);
            store.commit(types.RPC_STATUS_UPDATE, { status: 'connecting', url: url });
            _bcxjsWs.Apis.instance(url, true, 4000, undefined, function () {
              statusCallback && statusCallback('closed');
            }).init_promise.then(function () {
              _bcxjsWs.Apis.setAutoReconnect(false);
              statusCallback && _bcxjsWs.Apis.setRpcConnectionStatusCallback(statusCallback);
              statusCallback && statusCallback('realopen', url);
            }).catch(function (error) {
              statusCallback && statusCallback('error', url);
            });
          } else {
            statusCallback && statusCallback('error', url);
          }

        case 18:
        case 'end':
          return _context.stop();
      }
    }
  }, null, undefined);
};

var testNodesPings = function testNodesPings() {
  var refresh = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

  if (!nodesManager) {
    return;
  }
  if (refresh) {
    return nodesManager.testNodesPings();
  }
  return nodesManager._nodes;
};

var addAPINode = function _callee2(node) {
  return _regenerator2.default.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          nodesManager.addAPINode(node);

          if (!nodesManager) {
            _context2.next = 5;
            break;
          }

          _context2.next = 4;
          return _regenerator2.default.awrap(nodesManager.testNodesPings());

        case 4:
          return _context2.abrupt('return', _context2.sent);

        case 5:
        case 'end':
          return _context2.stop();
      }
    }
  }, null, undefined);
};

var deleteAPINode = function deleteAPINode(url) {
  nodesManager.deleteAPINode(url);
};

var setAPINode = function setAPINode(nodes) {
  if (nodesManager) return nodesManager.setAPINode(nodes);
};

var disconnect = function disconnect() {
  _bcxjsWs.Apis.setRpcConnectionStatusCallback(null);
  return _bcxjsWs.Apis.close();
};

exports.default = {
  connect: connect, disconnect: disconnect, testNodesPings: testNodesPings, addAPINode: addAPINode, deleteAPINode: deleteAPINode, setAPINode: setAPINode
};