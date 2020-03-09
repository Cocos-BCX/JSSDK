'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var NodesManager = function () {
  function NodesManager(_ref) {
    var nodes = _ref.nodes,
        defaultNode = _ref.defaultNode;
    (0, _classCallCheck3.default)(this, NodesManager);

    this._nodes = nodes;
    this._selectedNodeUrl = defaultNode;
    this.firstTestPing = true;
  }

  (0, _createClass3.default)(NodesManager, [{
    key: 'addAPINode',
    value: function addAPINode(node) {
      this._nodes[node.url] = { location: node.name };
    }
  }, {
    key: 'deleteAPINode',
    value: function deleteAPINode(url) {
      delete this._nodes[url];
      // PersistentStorage.saveNodesData({ data: this._nodes });
    }
  }, {
    key: 'setAPINode',
    value: function setAPINode(nodes) {
      this._nodes = nodes;
      return this.testNodesPings();
    }
  }, {
    key: '_retrieveCachedNodesData',
    value: function _retrieveCachedNodesData() {
      var _this = this;

      var cachedData = {}; //PersistentStorage.getSavedNodesData();
      if (!this._nodes) return;

      (0, _keys2.default)(this._nodes).forEach(function (url) {
        var cachedNode = cachedData[url];
        if (cachedNode && cachedNode.ping && typeof cachedNode.ping === 'number') {
          _this._nodes[url].ping = cachedNode.ping;
        }
      });
    }
  }, {
    key: '_selectFastestNode',
    value: function _selectFastestNode() {
      var _this2 = this;

      if (!this._nodes) return;
      (0, _keys2.default)(this._nodes).forEach(function (url) {
        var node = _this2._nodes[url];
        var selectedNode = _this2._nodes[_this2._selectedNodeUrl];
        if (node.ping && node.ping <= (selectedNode ? selectedNode.ping : 100000)) {
          _this2._selectedNodeUrl = url;
        }
      });
      return this._selectedNodeUrl;
    }
  }, {
    key: 'testNodesPings',
    value: function testNodesPings() {
      var _this3 = this;

      if (!this._nodes) return;
      return new _promise2.default(function (resolve) {
        _promise2.default.all((0, _keys2.default)(_this3._nodes).map(function _callee(url) {
          return _regenerator2.default.async(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  if (!(url !== _this3._selectedNodeUrl || _this3.firstTestPing || !_this3._nodes[url].ping)) {
                    _context.next = 4;
                    break;
                  }

                  _context.next = 3;
                  return _regenerator2.default.awrap(NodesManager._pingNode(url));

                case 3:
                  _this3._nodes[url].ping = _context.sent;

                case 4:
                case 'end':
                  return _context.stop();
              }
            }
          }, null, _this3);
        })).then(function () {
          // PersistentStorage.saveNodesData({ data: this._nodes });
          _this3.firstTestPing = false;
          resolve(_this3._nodes);
        });
      });
    }
  }, {
    key: 'getInitialNodeUrl',
    value: function getInitialNodeUrl() {
      this._retrieveCachedNodesData();
      return this._selectFastestNode();
    }
  }, {
    key: 'getAnotherNodeUrl',
    value: function getAnotherNodeUrl(url) {
      var urls = (0, _keys2.default)(this._nodes);
      if (url) {
        var index = urls.indexOf(url);
        urls.splice(index, 1);
      }

      return urls[Math.floor(Math.random() * urls.length)];
    }
  }], [{
    key: '_pingNode',
    value: function _pingNode(url) {
      return new _promise2.default(function (resolve) {
        var date = new Date();
        try {
          var ping_timer = setTimeout(function () {
            resolve(0);
          }, 2000);

          var socket = new WebSocket(url);
          socket.onopen = function () {
            clearTimeout(ping_timer);
            socket.close();
            socket = null;
            resolve(new Date() - date);
          };
          socket.onerror = function () {
            clearTimeout(ping_timer);
            resolve(0);
          };
        } catch (e) {
          resolve(e.message);
        }
      });
    }
  }]);
  return NodesManager;
}();

exports.default = NodesManager;