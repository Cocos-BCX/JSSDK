'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAccountContractData = exports.getContract = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _bcxjsWs = require('bcxjs-ws');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var contract_cache = {};
var getContract = exports.getContract = function _callee(nameOrId) {
  var isCache = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var response, chainInfo, result, message;
  return _regenerator2.default.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(isCache && contract_cache[nameOrId])) {
            _context.next = 2;
            break;
          }

          return _context.abrupt('return', JSON.parse((0, _stringify2.default)(contract_cache[nameOrId])));

        case 2:
          _context.prev = 2;
          _context.next = 5;
          return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('get_contract', [nameOrId]));

        case 5:
          response = _context.sent;

          if (!response) {
            _context.next = 20;
            break;
          }

          if (!(response.current_version == "0000000000000000000000000000000000000000000000000000000000000000")) {
            _context.next = 14;
            break;
          }

          _context.next = 10;
          return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('get_objects', [["2.11.0"]]));

        case 10:
          chainInfo = _context.sent;

          response.lua_code = chainInfo[0].base_contract;
          _context.next = 17;
          break;

        case 14:
          _context.next = 16;
          return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('get_transaction_by_id', [response.current_version]));

        case 16:
          response.lua_code = _context.sent.operations[0][1].data;

        case 17:
          result = {
            code: 1,
            data: response
          };

          if (isCache) {
            contract_cache[nameOrId] = result;
          }
          return _context.abrupt('return', JSON.parse((0, _stringify2.default)(result)));

        case 20:
          return _context.abrupt('return', {
            code: 145,
            message: nameOrId + ' contract not found'
          });

        case 23:
          _context.prev = 23;
          _context.t0 = _context['catch'](2);

          // console.log(error);
          message = _context.t0.message;

          if (_context.t0.message.indexOf("does not exist") >= 0) {
            message = 'The contract (' + nameOrId + ') does not exist';
          }
          return _context.abrupt('return', {
            code: 145,
            message: message,
            error: _context.t0
          });

        case 28:
        case 'end':
          return _context.stop();
      }
    }
  }, null, undefined, [[2, 23]]);
};

var getAccountContractData = exports.getAccountContractData = function _callee2(accountId, contractId) {
  var response;
  return _regenerator2.default.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('get_account_contract_data', [accountId, contractId]));

        case 3:
          response = _context2.sent;

          if (!response) {
            _context2.next = 6;
            break;
          }

          return _context2.abrupt('return', {
            code: 1,
            data: response
          });

        case 6:
          return _context2.abrupt('return', {
            code: 146,
            message: "The account does not contain information about the contract"
          });

        case 9:
          _context2.prev = 9;
          _context2.t0 = _context2['catch'](0);
          return _context2.abrupt('return', {
            code: 0,
            message: _context2.t0.message,
            error: _context2.t0
          });

        case 12:
        case 'end':
          return _context2.stop();
      }
    }
  }, null, undefined, [[0, 9]]);
};

exports.default = {
  getContract: getContract,
  getAccountContractData: getAccountContractData
};