'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUserInfo = exports.clearAccountCache = exports.getUserAllBalance = exports.getAccountBalances = exports.getUserNameByUserId = exports.fetchUserForIsSave = exports.fetchUser = undefined;

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _mutations = require('../mutations');

var types = _interopRequireWildcard(_mutations);

var _api = require('../services/api');

var _api2 = _interopRequireDefault(_api);

var _index = require('../utils/index');

var _utils = _interopRequireWildcard(_index);

var _persistentStorage = require('../services/persistent-storage');

var _persistentStorage2 = _interopRequireDefault(_persistentStorage);

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

var _utils2 = require('../lib/common/utils');

var _utils3 = _interopRequireDefault(_utils2);

var _helper = require('../lib/common/helper');

var _helper2 = _interopRequireDefault(_helper);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CORE_ASSET_ID = "1.3.0";

/**
 * Function to convert array of balances to object with keys as assets ids United Labs of BCTech.
 * @param {Array} balancesArr - array of balance objects
 */
var balancesToObject = function balancesToObject(balancesArr) {
  var obj = {};
  balancesArr.forEach(function (item) {
    obj[item.asset_type] = item;
  });
  return obj;
};

/**
 * Fetches users objects from bcxjs-ws
 * @param {string} username - name of user to fetch
 */
var fetchUser = exports.fetchUser = function _callee(_ref, nameOrId) {
  var commit = _ref.commit,
      dispatch = _ref.dispatch;
  var result, user;
  return _regenerator2.default.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          commit(types.FETCH_USER_REQUEST);
          _context.next = 3;
          return _regenerator2.default.awrap(_api2.default.Account.getUser(nameOrId));

        case 3:
          result = _context.sent;

          if (result.success) {
            user = result.data;

            user.balances = balancesToObject(user.balances);
            commit(types.FETCH_USER_COMPLETE, user);
            // dispatch("account/updateAccountData",user,{root:true}United Labs of BCTech.);
          } else {
            commit(types.FETCH_USER_ERROR);
          }

          return _context.abrupt('return', result);

        case 6:
        case 'end':
          return _context.stop();
      }
    }
  }, null, undefined);
};

var fetchUserForIsSave = exports.fetchUserForIsSave = function _callee2(_ref2, _ref3) {
  var commit = _ref2.commit,
      dispatch = _ref2.dispatch;
  var nameOrId = _ref3.nameOrId,
      _ref3$isSave = _ref3.isSave,
      isSave = _ref3$isSave === undefined ? false : _ref3$isSave,
      pubkey = _ref3.pubkey;
  var result, user;
  return _regenerator2.default.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          if (isSave) commit(types.FETCH_USER_REQUEST);

          _context2.next = 3;
          return _regenerator2.default.awrap(_api2.default.Account.getUser(nameOrId));

        case 3:
          result = _context2.sent;

          if (!isSave) {
            _context2.next = 15;
            break;
          }

          if (!result.success) {
            _context2.next = 14;
            break;
          }

          user = result.data;

          if (!(pubkey && user.account.active.key_auths[0] != pubkey)) {
            _context2.next = 9;
            break;
          }

          return _context2.abrupt('return');

        case 9:
          dispatch("account/setAccountUserId", user.account.id, { root: true });
          user.balances = balancesToObject(user.balances);
          commit(types.FETCH_USER_COMPLETE, user);
          _context2.next = 15;
          break;

        case 14:
          commit(types.FETCH_USER_ERROR);

        case 15:
          return _context2.abrupt('return', result);

        case 16:
        case 'end':
          return _context2.stop();
      }
    }
  }, null, undefined);
};

var getUserNameByUserId = exports.getUserNameByUserId = function _callee3(_ref4, nameOrId) {
  var commit = _ref4.commit;
  var result;
  return _regenerator2.default.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return _regenerator2.default.awrap(_api2.default.Account.getUser(nameOrId));

        case 2:
          result = _context3.sent;

          if (!result.success) {
            _context3.next = 5;
            break;
          }

          return _context3.abrupt('return', result.data.account.name);

        case 5:
          return _context3.abrupt('return', "");

        case 6:
        case 'end':
          return _context3.stop();
      }
    }
  }, null, undefined);
};

var getAccountBalances = exports.getAccountBalances = function _callee4(_ref5, params) {
  var dispatch = _ref5.dispatch,
      rootGetters = _ref5.rootGetters;

  var _params$assetId_or_sy, assetId_or_symbol, _params$assetId, assetId, _params$account, account, _params$callback, callback, result, accountBalances, assetIds, reqBalances, reqBalanceItem, accountBalanceItem, asset_id;

  return _regenerator2.default.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _helper2.default.trimParams(params);
          _params$assetId_or_sy = params.assetId_or_symbol, assetId_or_symbol = _params$assetId_or_sy === undefined ? "" : _params$assetId_or_sy, _params$assetId = params.assetId, assetId = _params$assetId === undefined ? "" : _params$assetId, _params$account = params.account, account = _params$account === undefined ? "" : _params$account, _params$callback = params.callback, callback = _params$callback === undefined ? null : _params$callback;

          assetId_or_symbol = assetId_or_symbol || assetId;

          if (account) {
            _context4.next = 5;
            break;
          }

          return _context4.abrupt('return', { code: 123, message: 'Parameter "account" can not be empty' });

        case 5:
          _context4.next = 7;
          return _regenerator2.default.awrap(getBalances(account, rootGetters));

        case 7:
          result = _context4.sent;

          if (!(result.code == 1)) {
            _context4.next = 34;
            break;
          }

          accountBalances = JSON.parse((0, _stringify2.default)(result.data));

          result.data = {};
          if (assetId_or_symbol) {
            assetId_or_symbol = assetId_or_symbol.toUpperCase();
          }
          assetIds = assetId_or_symbol ? [assetId_or_symbol] : (0, _keys2.default)(accountBalances);

          if (!assetIds.length) {
            _context4.next = 34;
            break;
          }

          _context4.next = 16;
          return _regenerator2.default.awrap(dispatch("assets/fetchAssets", { assets: assetIds }, { root: true }));

        case 16:
          reqBalances = _context4.sent;

          if (!reqBalances) {
            _context4.next = 32;
            break;
          }

          reqBalanceItem = void 0, accountBalanceItem = void 0;
          _context4.t0 = _regenerator2.default.keys(accountBalances);

        case 20:
          if ((_context4.t1 = _context4.t0()).done) {
            _context4.next = 29;
            break;
          }

          asset_id = _context4.t1.value;

          reqBalanceItem = reqBalances[asset_id];

          if (reqBalanceItem) {
            _context4.next = 25;
            break;
          }

          return _context4.abrupt('continue', 20);

        case 25:
          accountBalanceItem = accountBalances[asset_id];
          result.data[reqBalanceItem.symbol] = _helper2.default.getFullNum(accountBalanceItem.balance / Math.pow(10, reqBalanceItem.precision));
          _context4.next = 20;
          break;

        case 29:
          if (!(0, _keys2.default)(result.data).length) {
            result.code = 125;
            result.message = "Users do not own " + (assetId_or_symbol || "") + "assets";
          }
          _context4.next = 34;
          break;

        case 32:
          result.code = 115;
          result.message = "There is no asset " + assetId_or_symbol + " in the block chain";

        case 34:
          return _context4.abrupt('return', result);

        case 35:
        case 'end':
          return _context4.stop();
      }
    }
  }, null, undefined);
};

var getBalances = function _callee5(account, rootGetters) {
  var result, accountBalances, userId;
  return _regenerator2.default.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          result = {
            code: 1
          };
          accountBalances = null; //

          userId = rootGetters['account/getAccountUserId'];

          if (!account && userId) {
            account = userId;
          }

          if (!account) {
            _context5.next = 11;
            break;
          }

          _context5.next = 7;
          return _regenerator2.default.awrap(_api2.default.Account.getUser(account));

        case 7:
          account = _context5.sent;

          if (account.success) {
            accountBalances = _utils.balancesToObject(account.data.balances);
            result.data = accountBalances;
            result.contract_asset_locked = format_contract_asset_locked(account.data.account.contract_asset_locked);
          } else {
            result.code = account.code;
            result.message = account.error.message;
          }
          _context5.next = 12;
          break;

        case 11:
          if (rootGetters['user/getAccountObject']) {
            accountBalances = rootGetters['user/getBalances'];
            result.data = accountBalances;
          } else {
            result.code = 111;
            result.message = "Please login first";
          }

        case 12:
          return _context5.abrupt('return', result);

        case 13:
        case 'end':
          return _context5.stop();
      }
    }
  }, null, undefined);
};

var format_contract_asset_locked = function format_contract_asset_locked(_ref6) {
  var locked_total = _ref6.locked_total,
      lock_details = _ref6.lock_details;

  var _locked_total = {};
  locked_total.forEach(function (item) {
    _locked_total[item[0]] = item[1];
  });
  var _lock_details = {};
  for (var i = 0; i < lock_details.length; i++) {
    var _lock_details$i = (0, _slicedToArray3.default)(lock_details[i], 2),
        contract_id = _lock_details$i[0],
        contract_assets_locked = _lock_details$i[1];

    for (var j = 0; j < contract_assets_locked.length; j++) {
      var _contract_assets_lock = (0, _slicedToArray3.default)(contract_assets_locked[j], 2),
          asset_id = _contract_assets_lock[0],
          amount = _contract_assets_lock[1];

      if (_lock_details[asset_id]) {
        _lock_details[asset_id][contract_id] = amount;
      } else {
        _lock_details[asset_id] = (0, _defineProperty3.default)({}, contract_id, amount);
      }
    }
  }

  return {
    _locked_total: _locked_total,
    _lock_details: _lock_details
  };
};

var getUserAllBalance = exports.getUserAllBalance = function _callee6(_ref7, params) {
  var dispatch = _ref7.dispatch,
      rootGetters = _ref7.rootGetters;
  var account, unit, contract_asset_locked, accountBalances, toAsset_symbol, toAssets, toAsset, assetId, assetsIds, reqBalances, quoteAssets, marketStats, balances, amount, fromAsset, id, eqValue, fromSymbol, price, fromAssetPrecision, lock_details, key, core_asset, symbol, precision;
  return _regenerator2.default.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _helper2.default.trimParams(params);
          account = params.account, unit = params.unit;

          if (account) {
            _context6.next = 4;
            break;
          }

          return _context6.abrupt('return', { code: 123, message: 'Parameter "account" can not be empty' });

        case 4:
          contract_asset_locked = void 0;
          _context6.next = 7;
          return _regenerator2.default.awrap(getBalances(account, rootGetters));

        case 7:
          accountBalances = _context6.sent;

          if (!(accountBalances.code == 1)) {
            _context6.next = 13;
            break;
          }

          contract_asset_locked = JSON.parse((0, _stringify2.default)(accountBalances.contract_asset_locked));
          accountBalances = JSON.parse((0, _stringify2.default)(accountBalances.data));
          _context6.next = 14;
          break;

        case 13:
          return _context6.abrupt('return', accountBalances);

        case 14:
          toAsset_symbol = unit || rootGetters["setting/defaultSettings"].unit;
          _context6.next = 17;
          return _regenerator2.default.awrap(dispatch("assets/fetchAssets", { assets: [toAsset_symbol], isOne: false }, { root: true }));

        case 17:
          toAssets = _context6.sent;

          if (toAssets) {
            _context6.next = 20;
            break;
          }

          return _context6.abrupt('return', { code: 126, message: "There is no asset " + toAsset_symbol + " in the block chain" });

        case 20:

          if (/1.3.\d+/.test(toAsset_symbol)) {
            //transformation when incoming unit is an asset ID
            toAsset_symbol = toAssets[toAsset_symbol].symbol;
          }

          toAsset = void 0;

          for (assetId in toAssets) {
            if (toAssets[assetId].symbol == toAsset_symbol) {
              toAsset = toAssets[assetId];
            }
          }

          assetsIds = (0, _keys2.default)(accountBalances);

          if (!accountBalances.toAssetId) assetsIds.push(toAsset.id);
          _context6.next = 27;
          return _regenerator2.default.awrap(dispatch("assets/fetchAssets", { assets: assetsIds }, { root: true }));

        case 27:
          reqBalances = _context6.sent;
          //queried assets info
          quoteAssets = (0, _keys2.default)(reqBalances).filter(function (key) {
            return (/^[a-zA-Z]+$/.test(key)
            );
          });

          reqBalances = _immutable2.default.fromJS(reqBalances);

          //get queried assets' market info
          marketStats = {};
          _context6.next = 33;
          return _regenerator2.default.awrap(dispatch("market/getMarketStats", {
            baseAsset: toAsset_symbol,
            quoteAssets: quoteAssets
          }, { root: true }));

        case 33:
          _context6.t0 = function (asset) {
            marketStats[asset.quote_symbol] = asset;
          };

          _context6.sent.data.forEach(_context6.t0);

          balances = [];
          amount = 0;
          fromAsset = void 0;


          for (id in accountBalances) {
            amount = accountBalances[id].balance;
            fromAsset = reqBalances.get(id);

            eqValue = amount;
            fromSymbol = fromAsset.get("symbol");

            if (fromSymbol != toAsset.symbol) {
              price = marketStats[fromSymbol].latest_price;

              eqValue = eqValue * price;
            }

            fromAssetPrecision = fromAsset.get("precision");
            lock_details = contract_asset_locked._lock_details[id] || {};

            for (key in lock_details) {
              lock_details[key] = _helper2.default.getFullNum(lock_details[key], fromAssetPrecision);
            }
            balances.push({
              id: id,
              balance: _helper2.default.getFullNum(amount, fromAssetPrecision),
              symbol: fromSymbol,
              precision: fromAssetPrecision,
              eq_value: _helper2.default.getFullNum(eqValue, fromAssetPrecision),
              eq_unit: toAsset.symbol,
              eq_precision: toAsset.precision,
              locked_total: _helper2.default.getFullNum(contract_asset_locked._locked_total[id] || 0, fromAssetPrecision),
              lock_details: lock_details
            });
          }

          if (balances.length) {
            _context6.next = 44;
            break;
          }

          _context6.next = 42;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch(["1.3.0"], true));

        case 42:
          core_asset = _context6.sent;

          if (core_asset) {
            symbol = core_asset.symbol, precision = core_asset.precision;

            balances = [{
              id: "1.3.0",
              balance: 0,
              symbol: symbol,
              precision: precision,
              eq_value: 0,
              eq_unit: toAsset_symbol,
              eq_precision: toAsset.precision,
              locked_total: 0,
              lock_details: {}
            }];
          }

        case 44:
          return _context6.abrupt('return', { code: 1, data: balances });

        case 45:
        case 'end':
          return _context6.stop();
      }
    }
  }, null, undefined);
};

var clearAccountCache = exports.clearAccountCache = function clearAccountCache(_ref8) {
  var commit = _ref8.commit;

  _api2.default.Account.clear_accs();
  commit(types.CLEAR_ACCOUNT);
};

var getUserInfo = exports.getUserInfo = function _callee7(_ref9, _ref10) {
  var dispatch = _ref9.dispatch;
  var _ref10$account = _ref10.account,
      account = _ref10$account === undefined ? "" : _ref10$account,
      _ref10$isCache = _ref10.isCache,
      isCache = _ref10$isCache === undefined ? false : _ref10$isCache;
  var acc, error;
  return _regenerator2.default.async(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          account = account.trim();

          if (account) {
            _context7.next = 8;
            break;
          }

          account = _persistentStorage2.default.getSavedUserData();

          if (!account) {
            _context7.next = 7;
            break;
          }

          account = account.userId;
          _context7.next = 8;
          break;

        case 7:
          return _context7.abrupt('return', { code: 123, message: "Parameter account can not be empty" });

        case 8:
          _context7.next = 10;
          return _regenerator2.default.awrap(_api2.default.Account.getUser(account, isCache));

        case 10:
          acc = _context7.sent;

          if (!acc.success) {
            _context7.next = 15;
            break;
          }

          return _context7.abrupt('return', { code: 1, data: acc.data });

        case 15:
          error = acc.error;
          return _context7.abrupt('return', { code: acc.code, message: error.message, error: error });

        case 17:
        case 'end':
          return _context7.stop();
      }
    }
  }, null, undefined);
};