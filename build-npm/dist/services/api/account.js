'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getVestingBalances = exports.createAccount = exports.getAccountRefsOfAccount = exports.getAccountIdByOwnerPubkey = exports.getUser = exports.getAccount = exports.clear_accs = exports.suggestBrainkey = undefined;

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bcxjsCores = require('bcxjs-cores');

var _bcxjsWs = require('bcxjs-ws');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var suggestBrainkey = exports.suggestBrainkey = function suggestBrainkey(dictionary) {
  return _bcxjsCores.key.suggest_brain_key(dictionary);
};

var _accs = {};
var clear_accs = exports.clear_accs = function clear_accs() {
  _accs = {};
};

var getAccount = exports.getAccount = function _callee(id) {
  var isCache = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var response, user;
  return _regenerator2.default.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!isCache) {
            _context.next = 7;
            break;
          }

          if (!(id in _accs)) {
            _context.next = 6;
            break;
          }

          if (!_accs[id]) {
            _context.next = 4;
            break;
          }

          return _context.abrupt('return', { code: 1, data: _accs[id], success: true });

        case 4:
          _context.next = 7;
          break;

        case 6:
          _accs[id] = { account: { name: id } };

        case 7:
          _context.prev = 7;

          if (/^1.2.\d+/.test(id)) {
            _context.next = 10;
            break;
          }

          return _context.abrupt('return', { code: 0 });

        case 10:
          _context.next = 12;
          return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('get_objects', [[id]]));

        case 12:
          response = _context.sent;

          if (!(response && response[0])) {
            _context.next = 18;
            break;
          }

          user = {
            account: response[0]
          };


          if (isCache) {
            _accs[response[0].id] = user;
            _accs[response[0].name] = user;
          }
          return _context.abrupt('return', {
            code: 1,
            data: user,
            success: true
          });

        case 18:
          return _context.abrupt('return', {
            code: 104,
            message: nameOrId + ' Account not found',
            error: { message: nameOrId + ' Account not found' },
            success: false
          });

        case 21:
          _context.prev = 21;
          _context.t0 = _context['catch'](7);
          return _context.abrupt('return', {
            code: 0,
            message: _context.t0.message,
            error: _context.t0,
            success: false
          });

        case 24:
        case 'end':
          return _context.stop();
      }
    }
  }, null, undefined, [[7, 21]]);
};

var getUser = exports.getUser = function _callee2(nameOrId) {
  var isCache = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var isSubscribe = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  var response, user;
  return _regenerator2.default.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          if (!(isCache && _accs[nameOrId])) {
            _context2.next = 2;
            break;
          }

          return _context2.abrupt('return', { code: 1, data: _accs[nameOrId], success: true });

        case 2:
          if (_bcxjsWs.Apis.instance().db_api()) {
            _context2.next = 4;
            break;
          }

          return _context2.abrupt('return', {
            success: false,
            code: 102,
            message: "The network is busy, please check your network connection",
            error: {
              message: "The network is busy, please check your network connection"
            }
          });

        case 4:
          _context2.prev = 4;
          _context2.next = 7;
          return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('get_full_accounts', [[nameOrId], isSubscribe]));

        case 7:
          response = _context2.sent;

          if (!(response && response[0])) {
            _context2.next = 12;
            break;
          }

          user = response[0][1];


          if (isCache) {
            _accs[user.account.id] = user;
            _accs[user.account.name] = user;
          }

          return _context2.abrupt('return', {
            code: 1,
            data: user,
            success: true
          });

        case 12:
          return _context2.abrupt('return', {
            code: 104,
            message: nameOrId + ' Account not found',
            error: { message: nameOrId + ' Account not found' },
            success: false
          });

        case 15:
          _context2.prev = 15;
          _context2.t0 = _context2['catch'](4);
          return _context2.abrupt('return', {
            code: 0,
            message: _context2.t0.message,
            error: _context2.t0,
            success: false
          });

        case 18:
        case 'end':
          return _context2.stop();
      }
    }
  }, null, undefined, [[4, 15]]);
};

var getAccountIdByOwnerPubkey = exports.getAccountIdByOwnerPubkey = function _callee3(ownerPubkey) {
  var res;
  return _regenerator2.default.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('get_key_references', [[ownerPubkey]]));

        case 2:
          res = _context3.sent;
          return _context3.abrupt('return', res ? res[0] : null);

        case 4:
        case 'end':
          return _context3.stop();
      }
    }
  }, null, undefined);
};

var getAccountRefsOfAccount = exports.getAccountRefsOfAccount = function _callee4(account_id) {
  var res;
  return _regenerator2.default.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 2;
          return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('get_account_references', [account_id]));

        case 2:
          res = _context4.sent;
          return _context4.abrupt('return', res);

        case 4:
        case 'end':
          return _context4.stop();
      }
    }
  }, null, undefined);
};

var createAccount = exports.createAccount = function _callee5(_ref, faucetUrl) {
  var name = _ref.name,
      ownerPubkey = _ref.ownerPubkey,
      activePubkey = _ref.activePubkey,
      referrer = _ref.referrer;
  var response, result, code, data, msg, res, error;
  return _regenerator2.default.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          _context5.next = 3;
          return _regenerator2.default.awrap(fetch(faucetUrl + '/api/v1/accounts', {
            method: 'post',
            mode: 'cors',
            headers: {
              Accept: 'application/json',
              'Content-type': 'application/json',
              Authorization: "YnVmZW5nQDIwMThidWZlbmc="
              // Origin:"United Labs of BCTech."
              //'Content-type': 'application/x-www-form-urlencoded'
            },
            body: (0, _stringify2.default)({
              account: {
                name: name,
                owner_key: ownerPubkey,
                active_key: activePubkey,
                memo_key: activePubkey,
                refcode: null,
                referrer: referrer
              }
            })
          }));

        case 3:
          response = _context5.sent;
          _context5.next = 6;
          return _regenerator2.default.awrap(response.json());

        case 6:
          result = _context5.sent;

          if (!(result && "code" in result)) {
            _context5.next = 12;
            break;
          }

          code = result.code, data = result.data, msg = result.msg;
          res = {
            success: code == 200,
            code: code,
            data: data,
            msg: msg,
            message: msg
          };

          if (code != 200) {
            res.error = msg;
          }
          return _context5.abrupt('return', res);

        case 12:
          if (!(!result || result && result.error)) {
            _context5.next = 16;
            break;
          }

          error = result.error;

          if ("base" in error) {
            error = error.base[0];
          } else if ("name" in error) {
            error = error.name[0];
          } else if ("remote_ip" in error) {
            error = error.remote_ip[0];
          }
          return _context5.abrupt('return', {
            success: false,
            error: error
          });

        case 16:
          return _context5.abrupt('return', {
            success: true,
            data: result,
            code: 1
          });

        case 19:
          _context5.prev = 19;
          _context5.t0 = _context5['catch'](0);
          return _context5.abrupt('return', {
            success: false,
            error: _context5.t0.message, //'Account creation error'
            error_obj: _context5.t0
          });

        case 22:
        case 'end':
          return _context5.stop();
      }
    }
  }, null, undefined, [[0, 19]]);
};

var getVestingBalances = exports.getVestingBalances = function _callee6(account_id) {
  var res;
  return _regenerator2.default.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.next = 2;
          return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('get_vesting_balances', [account_id]));

        case 2:
          res = _context6.sent;
          return _context6.abrupt('return', res ? res : null);

        case 4:
        case 'end':
          return _context6.stop();
      }
    }
  }, null, undefined);
};

exports.default = {
  suggestBrainkey: suggestBrainkey, getAccount: getAccount, getUser: getUser, getAccountIdByOwnerPubkey: getAccountIdByOwnerPubkey,
  getAccountRefsOfAccount: getAccountRefsOfAccount, createAccount: createAccount, getVestingBalances: getVestingBalances, clear_accs: clear_accs
};