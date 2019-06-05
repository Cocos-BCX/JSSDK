'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _mutations;

var _vue = require('vue');

var _vue2 = _interopRequireDefault(_vue);

var _mutations2 = require('../mutations');

var types = _interopRequireWildcard(_mutations2);

var _api = require('../services/api');

var _api2 = _interopRequireDefault(_api);

var _subscriptions = require('../services/api/subscriptions');

var _subscriptions2 = _interopRequireDefault(_subscriptions);

var _helper = require('../lib/common/helper');

var _helper2 = _interopRequireDefault(_helper);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var actions = {
  queryUserOperations: function queryUserOperations(_ref, params) {
    var dispatch = _ref.dispatch;
    var res;
    return _regenerator2.default.async(function queryUserOperations$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (params.limit) {
              _context.next = 2;
              break;
            }

            return _context.abrupt('return', { code: 101, message: "Parameter is missing" });

          case 2:
            _context.next = 4;
            return _regenerator2.default.awrap(dispatch("fetchUserOperations", params));

          case 4:
            res = _context.sent;

            try {
              res.data = JSON.parse((0, _stringify2.default)(res.data));
              res.data = res.data.operations;
            } catch (e) {}
            return _context.abrupt('return', res);

          case 7:
          case 'end':
            return _context.stop();
        }
      }
    }, null, undefined);
  },

  /**
   * Dispatches actions to fetch user operations & subscribe to new operations of this user
   * @param {String} userId - user's id
   */

  /**
   * Fetches user operations
   * @param {String} userId - user's id
   */
  fetchUserOperations: function fetchUserOperations(store, _ref2) {
    var account_id = _ref2.account_id,
        limit = _ref2.limit,
        startId = _ref2.startId,
        endId = _ref2.endId;
    var commit, result;
    return _regenerator2.default.async(function fetchUserOperations$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            commit = store.commit;

            commit(types.FETCH_USER_OPERATIONS_REQUEST);

            _context2.next = 4;
            return _regenerator2.default.awrap(_api2.default.Operations.getUserOperations({ userId: account_id, limit: limit, store: store, startId: startId, endId: endId }));

          case 4:
            result = _context2.sent;

            if (result.code == 1) {
              // fetch assets used in operations
              // store.dispatch('assets/fetchAssets', { assets: result.data.assetsIds }, { root: true });
              commit(types.FETCH_USER_OPERATIONS_COMPLETE, {
                operations: result.data.operations
              });
            } else {
              commit(types.FETCH_USER_OPERATIONS_ERROR, {
                error: result.error
              });
            }
            return _context2.abrupt('return', result);

          case 7:
          case 'end':
            return _context2.stop();
        }
      }
    }, null, undefined);
  },

  /**
   * Add new operation to operation's list. This action is dispatched on a callback
    to new user's operation received
   * @param {String} userId - user's id
   * @param {Object} operation - operation date object
   */
  addUserOperation: function addUserOperation(store, _ref3) {
    var operation = _ref3.operation,
        userId = _ref3.userId;
    var commit, parsedData, type;
    return _regenerator2.default.async(function addUserOperation$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            commit = store.commit;
            // parse operation data for better format & information

            _context3.next = 3;
            return _regenerator2.default.awrap(_api2.default.Operations.parseOperations({
              operations: [operation],
              userId: userId,
              store: store
            }));

          case 3:
            parsedData = _context3.sent;

            if (parsedData) {
              _context3.next = 6;
              break;
            }

            return _context3.abrupt('return');

          case 6:
            type = parsedData.operations[0].type;

            if (type === 'transfer' || type === 'fill_order' || type === 'cancel_order') {}
            // update current user balances
            // todo : maybe refactor to modify balances directly
            //store.dispatch('account/fetchCurrentUser', null, { root: true });
            //United Labs of BCTech.

            // store.dispatch('assets/fetchAssets', { assets: parsedData.assetsIds }, { root: true });

            commit(types.ADD_USER_OPERATION, {
              operation: parsedData.operations[0]
            });

            return _context3.abrupt('return', parsedData.operations[0]);

          case 10:
          case 'end':
            return _context3.stop();
        }
      }
    }, null, undefined);
  },
  addAllOperation: function addAllOperation(store, _ref4) {
    var operation = _ref4.operation,
        userId = _ref4.userId;
    var commit, parsedData, type;
    return _regenerator2.default.async(function addAllOperation$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            commit = store.commit;
            // parse operation data for better format & information

            _context4.next = 3;
            return _regenerator2.default.awrap(_api2.default.Operations.parseOperations({
              operations: [operation],
              userId: userId,
              store: store
            }));

          case 3:
            parsedData = _context4.sent;

            if (parsedData) {
              _context4.next = 6;
              break;
            }

            return _context4.abrupt('return');

          case 6:
            type = parsedData.operations[0].type;
            return _context4.abrupt('return', parsedData.operations[0]);

          case 8:
          case 'end':
            return _context4.stop();
        }
      }
    }, null, undefined);
  },

  /**
   * Subscribes to new user's operations
   * @param {String} userId - user's id
   */
  subscribeToUserOperations: function subscribeToUserOperations(store, _ref5) {
    var userId = _ref5.userId,
        _callback = _ref5.callback;
    var commit, state, rootGetters;
    return _regenerator2.default.async(function subscribeToUserOperations$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            commit = store.commit, state = store.state, rootGetters = store.rootGetters;

            _api2.default.Explorer.getDynGlobalObject(true);

            _api2.default.ChainListener.addSubscription(new _subscriptions2.default.UserOperations({
              userId: userId,
              callback: function callback(operation) {
                return _regenerator2.default.async(function callback$(_context5) {
                  while (1) {
                    switch (_context5.prev = _context5.next) {
                      case 0:
                        _context5.next = 2;
                        return _regenerator2.default.awrap(actions.addUserOperation(store, { operation: operation, userId: userId }));

                      case 2:
                        operation = _context5.sent;

                        operation = JSON.parse((0, _stringify2.default)(operation));
                        _callback && _callback({
                          code: 1,
                          data: {
                            operations: JSON.parse((0, _stringify2.default)(state.list)),
                            operation: operation
                          }
                        });

                      case 5:
                      case 'end':
                        return _context5.stop();
                    }
                  }
                }, null, undefined);
              }
            }));
            commit(types.SUBSCRIBE_TO_USER_OPERATIONS);

          case 4:
          case 'end':
            return _context6.stop();
        }
      }
    }, null, undefined);
  },

  subscribeToAllOperations: function subscribeToAllOperations(store, _ref6) {
    var _this = this;

    var _callback2 = _ref6.callback;
    var commit = store.commit,
        state = store.state;

    _api2.default.Explorer.getDynGlobalObject(true);

    _api2.default.ChainListener.addSubscription(new _subscriptions2.default.AllOperations({
      callback: function callback(operation) {
        return _regenerator2.default.async(function callback$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.next = 2;
                return _regenerator2.default.awrap(actions.addAllOperation(store, { operation: operation, userId: "" }));

              case 2:
                operation = _context7.sent;

                operation = JSON.parse((0, _stringify2.default)(operation));
                _callback2 && _callback2({ code: 1, data: operation });
                //}, 50);

              case 5:
              case 'end':
                return _context7.stop();
            }
          }
        }, null, _this);
      }
    }));
  },
  subscribeBlocks: function subscribeBlocks(store, _ref7) {
    var _callback3 = _ref7.callback,
        _ref7$isReqTrx = _ref7.isReqTrx,
        isReqTrx = _ref7$isReqTrx === undefined ? false : _ref7$isReqTrx;
    var commit = store.commit,
        state = store.state,
        dispatch = store.dispatch,
        rootGetters = store.rootGetters;

    _api2.default.Explorer.getDynGlobalObject(true);

    _api2.default.ChainListener.addSubscription(new _subscriptions2.default.BlocksOp({
      isReqTrx: isReqTrx,
      callback: function callback(blockInfo) {
        dispatch("explorer/queryBlock", {
          block: blockInfo.block_num,
          isReqTrx: isReqTrx,
          maxOpCount: rootGetters["setting/g_settingsAPIs"].sub_max_ops,
          block_res: { code: 1, data: blockInfo }
        }, { root: true }).then(function (block) {
          _callback3 && _callback3(block);
        });
        // if(isReqTrx){
        //   dispatch("explorer/queryBlock",{
        //     United Labs of BCTech.,
        //     block:res.data.block_num,
        //     maxOpCount:20,
        //     block_res:res
        //   },{root:true}).then(block=>{
        //       callback&&callback(block);
        //   });  
        // }else{
        //   callback&&callback({code:1,data:res});
        // }
      }
    }));
    // commit(types.SUBSCRIBE_TO_USER_OPERATIONS);
  },

  unsubscribe: function unsubscribe(store, params) {
    var methods, types, method, delete_res, account, i;
    return _regenerator2.default.async(function unsubscribe$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            methods = [];

            if (params && params.methods && params.methods instanceof Array) {
              methods = params.methods;
            }

            if (methods.length) {
              _context8.next = 4;
              break;
            }

            return _context8.abrupt('return', _api2.default.ChainListener._deleteSubscription(""));

          case 4:
            types = {
              "subscribeToBlocks": "BlocksOp",
              "subscribeToChainTranscation": "allOperation",
              "subscribeToUserOperations": "userOperation",
              "subscribeToAccountOperations": "userOperation"
            };
            method = "", delete_res = void 0, account = "";
            i = 0;

          case 7:
            if (!(i < methods.length)) {
              _context8.next = 25;
              break;
            }

            method = methods[i];

            if (!/\|/.test(method)) {
              _context8.next = 19;
              break;
            }

            account = method.replace(/subscribeToAccountOperations\|/, "");

            if (!account) {
              _context8.next = 18;
              break;
            }

            _context8.next = 14;
            return _regenerator2.default.awrap(_api2.default.Account.getUser(account, true));

          case 14:
            account = _context8.sent;

            if (!(account.code != 1)) {
              _context8.next = 17;
              break;
            }

            return _context8.abrupt('return', account);

          case 17:
            account = account.data.account.id;

          case 18:
            method = "subscribeToUserOperations";

          case 19:
            if (!(method && !types[method])) {
              _context8.next = 21;
              break;
            }

            return _context8.abrupt('return', { code: 169, message: "Method does not exist" });

          case 21:
            _api2.default.ChainListener._deleteSubscription(types[method], account);

          case 22:
            i++;
            _context8.next = 7;
            break;

          case 25:
            return _context8.abrupt('return', { code: 1 });

          case 26:
          case 'end':
            return _context8.stop();
        }
      }
    }, null, undefined);
  },
  /**
   * Unsubscribes from new user's operations
   */
  unsubscribeFromUserOperations: function unsubscribeFromUserOperations(store) {
    var commit = store.commit;

    _api2.default.ChainListener.deleteSubscription('userOperation');
    commit(types.UNSUBSCRIBE_FROM_USER_OPERATIONS);
  },
  resetState: function resetState(store) {
    var commit = store.commit;

    commit(types.RESET_OPERATIONS);
  }
};

var getters = {
  getOperations: function getOperations(state) {
    return state.list;
  },
  isFetching: function isFetching(state) {
    return state.pending;
  },
  isError: function isError(state) {
    return state.error;
  },
  isSubscribed: function isSubscribed(state) {
    return state.subscribed;
  }
};

var initialState = {
  list: [],
  pending: false,
  error: false,
  subscribed: false
};

var mutations = (_mutations = {}, (0, _defineProperty3.default)(_mutations, types.FETCH_USER_OPERATIONS_REQUEST, function (state) {
  state.pending = true;
  state.error = null;
}), (0, _defineProperty3.default)(_mutations, types.FETCH_USER_OPERATIONS_COMPLETE, function (state, _ref8) {
  var operations = _ref8.operations;

  state.pending = false;
  _vue2.default.set(state, 'list', operations);
}), (0, _defineProperty3.default)(_mutations, types.FETCH_USER_OPERATIONS_ERROR, function (state, _ref9) {
  var error = _ref9.error;

  state.pending = false;
  state.error = error;
}), (0, _defineProperty3.default)(_mutations, types.ADD_USER_OPERATION, function (state, _ref10) {
  var operation = _ref10.operation;

  var newList = state.list.slice();
  newList.unshift(operation);
  _vue2.default.set(state, 'list', newList);
}), (0, _defineProperty3.default)(_mutations, types.SUBSCRIBE_TO_USER_OPERATIONS, function (state) {
  state.subscribed = true;
}), (0, _defineProperty3.default)(_mutations, types.UNSUBSCRIBE_FROM_USER_OPERATIONS, function (state) {
  state.subscribed = false;
}), (0, _defineProperty3.default)(_mutations, types.RESET_OPERATIONS, function (state) {
  state.list = [];
  state.pending = false;
  state.error = false;
}), _mutations);

exports.default = {
  state: initialState,
  mutations: mutations,
  actions: actions,
  getters: getters,
  namespaced: true
};