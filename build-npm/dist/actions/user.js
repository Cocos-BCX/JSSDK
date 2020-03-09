'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUserInfo = exports.clearAccountCache = exports.getUserAllBalance = exports.getAccountBalances = exports.getUserNameByUserId = exports.fetchUserForIsSave = exports.fetchUser = undefined;

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

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

var getAccountBalances = exports.getAccountBalances = function _callee4(store, params) {
  var dispatch, rootGetters, _params$assetId_or_sy, assetId_or_symbol, _params$assetId, assetId, _params$account, account, _params$callback, callback, result, accountBalances, assetIds, reqBalances, reqBalanceItem, accountBalanceItem, asset_id;

  return _regenerator2.default.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          dispatch = store.dispatch, rootGetters = store.rootGetters;

          _helper2.default.trimParams(params);
          _params$assetId_or_sy = params.assetId_or_symbol, assetId_or_symbol = _params$assetId_or_sy === undefined ? "" : _params$assetId_or_sy, _params$assetId = params.assetId, assetId = _params$assetId === undefined ? "" : _params$assetId, _params$account = params.account, account = _params$account === undefined ? "" : _params$account, _params$callback = params.callback, callback = _params$callback === undefined ? null : _params$callback;

          assetId_or_symbol = assetId_or_symbol || assetId;

          if (account) {
            _context4.next = 6;
            break;
          }

          return _context4.abrupt('return', { code: 123, message: 'Parameter "account" can not be empty' });

        case 6:
          _context4.next = 8;
          return _regenerator2.default.awrap(getBalances(account, store));

        case 8:
          result = _context4.sent;

          if (!(result.code == 1)) {
            _context4.next = 35;
            break;
          }

          accountBalances = JSON.parse((0, _stringify2.default)(result.data));

          result.data = {};
          if (assetId_or_symbol) {
            assetId_or_symbol = assetId_or_symbol.toUpperCase();
          }
          assetIds = assetId_or_symbol ? [assetId_or_symbol] : (0, _keys2.default)(accountBalances);

          if (!assetIds.length) {
            _context4.next = 35;
            break;
          }

          _context4.next = 17;
          return _regenerator2.default.awrap(dispatch("assets/fetchAssets", { assets: assetIds }, { root: true }));

        case 17:
          reqBalances = _context4.sent;

          if (!reqBalances) {
            _context4.next = 33;
            break;
          }

          reqBalanceItem = void 0, accountBalanceItem = void 0;
          _context4.t0 = _regenerator2.default.keys(accountBalances);

        case 21:
          if ((_context4.t1 = _context4.t0()).done) {
            _context4.next = 30;
            break;
          }

          asset_id = _context4.t1.value;

          reqBalanceItem = reqBalances[asset_id];

          if (reqBalanceItem) {
            _context4.next = 26;
            break;
          }

          return _context4.abrupt('continue', 21);

        case 26:
          accountBalanceItem = accountBalances[asset_id];
          result.data[reqBalanceItem.symbol] = _helper2.default.getFullNum(accountBalanceItem.balance / Math.pow(10, reqBalanceItem.precision));
          _context4.next = 21;
          break;

        case 30:
          if (!(0, _keys2.default)(result.data).length) {
            result.code = 125;
            result.message = "Users do not own " + (assetId_or_symbol || "") + "assets";
          }
          _context4.next = 35;
          break;

        case 33:
          result.code = 115;
          result.message = "There is no asset " + assetId_or_symbol + " in the block chain";

        case 35:
          return _context4.abrupt('return', result);

        case 36:
        case 'end':
          return _context4.stop();
      }
    }
  }, null, undefined);
};

var getBalances = function _callee5(account, store) {
  var rootGetters, result, accountBalances, userId, full_account, account_res;
  return _regenerator2.default.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          rootGetters = store.rootGetters;
          result = {
            code: 1
          };
          accountBalances = null; //

          userId = rootGetters['account/getAccountUserId'];

          if (!account && userId) {
            account = userId;
          }
          full_account = void 0;

          if (!account) {
            _context5.next = 13;
            break;
          }

          _context5.next = 9;
          return _regenerator2.default.awrap(_api2.default.Account.getUser(account));

        case 9:
          account_res = _context5.sent;

          if (account_res.success) {
            full_account = account_res.data;
            accountBalances = _utils.balancesToObject(full_account.balances);
            // if(account.data.account.contract_asset_locked)
            //    result.contract_asset_locked=format_contract_asset_locked(account.data.account.contract_asset_locked);
          } else {
            result.code = account_res.code;
            result.message = account_res.error.message;
          }
          _context5.next = 14;
          break;

        case 13:
          if (rootGetters['user/getAccountObject']) {
            full_account = rootGetters['user/getAccountObject'];
            accountBalances = rootGetters['user/getBalances'];
          } else {
            result.code = 111;
            result.message = "Please login first";
          }

        case 14:
          if (!(result.code == 1)) {
            _context5.next = 19;
            break;
          }

          result.data = accountBalances;
          _context5.next = 18;
          return _regenerator2.default.awrap(format_asset_locked(full_account, store));

        case 18:
          result.asset_locked = _context5.sent;

        case 19:
          return _context5.abrupt('return', result);

        case 20:
        case 'end':
          return _context5.stop();
      }
    }
  }, null, undefined);
};

var format_asset_locked = function _callee8(full_account, store) {
  var _full_account$account, locked_total, witness_freeze, vote_for_witness, contract_lock_details, _ref5, precision, symbol, _witness_freeze, vote_freeze, contract_freeze, _locked_total, locked_total_assets, assets, contract_name;

  return _regenerator2.default.async(function _callee8$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _full_account$account = full_account.account.asset_locked, locked_total = _full_account$account.locked_total, witness_freeze = _full_account$account.witness_freeze, vote_for_witness = _full_account$account.vote_for_witness, contract_lock_details = _full_account$account.contract_lock_details;
          _context8.next = 3;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch(["1.3.0"], true));

        case 3:
          _ref5 = _context8.sent;
          precision = _ref5.precision;
          symbol = _ref5.symbol;
          _witness_freeze = {
            amount: 0,
            symbol: symbol
          };
          vote_freeze = {
            amount: 0,
            symbol: symbol,
            details: []
          };
          contract_freeze = {
            amount: 0,
            symbol: symbol,
            details: [],
            contracts: []
          };


          if (witness_freeze) _witness_freeze.amount = _helper2.default.getFullNum(witness_freeze.amount, precision);

          if (!vote_for_witness) {
            _context8.next = 15;
            break;
          }

          vote_freeze.amount = _helper2.default.getFullNum(vote_for_witness.amount, precision);
          _context8.next = 14;
          return _regenerator2.default.awrap(_promise2.default.all(full_account.votes.map(function _callee6(vote) {
            var vote_acc_name, acc_res;
            return _regenerator2.default.async(function _callee6$(_context6) {
              while (1) {
                switch (_context6.prev = _context6.next) {
                  case 0:
                    vote_acc_name = vote.witness_account;
                    _context6.next = 3;
                    return _regenerator2.default.awrap(_api2.default.Account.getAccount(vote_acc_name, true));

                  case 3:
                    acc_res = _context6.sent;

                    if (acc_res.success) {
                      vote_acc_name = acc_res.data.account.name;
                    }
                    return _context6.abrupt('return', vote_acc_name);

                  case 6:
                  case 'end':
                    return _context6.stop();
                }
              }
            }, null, undefined);
          })));

        case 14:
          vote_freeze.details = _context8.sent;

        case 15:
          _locked_total = {};
          locked_total_assets = locked_total.map(function (item) {
            return item[0];
          });

          if (!locked_total_assets.length) {
            _context8.next = 26;
            break;
          }

          _context8.next = 20;
          return _regenerator2.default.awrap(store.dispatch("assets/fetchAssets", {
            assets: locked_total_assets,
            isCache: true
          }, { root: true }));

        case 20:
          assets = _context8.sent;

          locked_total.forEach(function (item) {
            _locked_total[item[0]] = _helper2.default.getFullNum(item[1], assets[item[0]].precision);
          });

          contract_name = "";

          if (!contract_lock_details) {
            _context8.next = 26;
            break;
          }

          _context8.next = 26;
          return _regenerator2.default.awrap(_promise2.default.all(contract_lock_details.map(function _callee7(item) {
            var c_res;
            return _regenerator2.default.async(function _callee7$(_context7) {
              while (1) {
                switch (_context7.prev = _context7.next) {
                  case 0:
                    contract_name = item[0];
                    _context7.next = 3;
                    return _regenerator2.default.awrap(_api2.default.Contract.getContract(item[0], true));

                  case 3:
                    c_res = _context7.sent;

                    if (c_res.code == 1) contract_name = c_res.data.name;
                    contract_freeze.contracts.push(contract_name);
                    item[1].forEach(function (asset) {
                      var amount = _helper2.default.getFullNum(asset[1], precision);
                      if (asset[0] == "1.3.0") contract_freeze.amount += amount;
                      contract_freeze.details.push({
                        contract_name: contract_name,
                        amount: amount,
                        symbol: assets[asset[0]].symbol
                      });
                    });

                    return _context7.abrupt('return', item);

                  case 8:
                  case 'end':
                    return _context7.stop();
                }
              }
            }, null, undefined);
          })));

        case 26:
          return _context8.abrupt('return', {
            locked_total: _locked_total,
            lock_details: {
              vote_freeze: vote_freeze,
              contract_freeze: contract_freeze,
              witness_freeze: _witness_freeze
            }
          });

        case 27:
        case 'end':
          return _context8.stop();
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

var getUserAllBalance = exports.getUserAllBalance = function _callee9(store, params) {
  var dispatch, rootGetters, account, unit, contract_asset_locked, asset_locked, accountBalances, toAsset_symbol, toAssets, toAsset, assetId, assetsIds, reqBalances, quoteAssets, marketStats, balances, amount, fromAsset, id, eqValue, fromSymbol, price, fromAssetPrecision, locked_total, balance, core_asset, symbol, precision;
  return _regenerator2.default.async(function _callee9$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          dispatch = store.dispatch, rootGetters = store.rootGetters;

          _helper2.default.trimParams(params);
          account = params.account, unit = params.unit;

          if (account) {
            _context9.next = 5;
            break;
          }

          return _context9.abrupt('return', { code: 123, message: 'Parameter "account" can not be empty' });

        case 5:
          contract_asset_locked = void 0;
          asset_locked = void 0;
          _context9.next = 9;
          return _regenerator2.default.awrap(getBalances(account, store));

        case 9:
          accountBalances = _context9.sent;

          if (!(accountBalances.code == 1)) {
            _context9.next = 15;
            break;
          }

          // if(accountBalances.contract_asset_locked)
          //   contract_asset_locked=JSON.parse(JSON.stringify(accountBalances.contract_asset_locked));
          if (accountBalances.asset_locked) asset_locked = JSON.parse((0, _stringify2.default)(accountBalances.asset_locked));

          accountBalances = JSON.parse((0, _stringify2.default)(accountBalances.data));
          _context9.next = 16;
          break;

        case 15:
          return _context9.abrupt('return', accountBalances);

        case 16:
          toAsset_symbol = unit || rootGetters["setting/defaultSettings"].unit;
          _context9.next = 19;
          return _regenerator2.default.awrap(dispatch("assets/fetchAssets", { assets: [toAsset_symbol], isOne: false }, { root: true }));

        case 19:
          toAssets = _context9.sent;

          if (toAssets) {
            _context9.next = 22;
            break;
          }

          return _context9.abrupt('return', { code: 126, message: "There is no asset " + toAsset_symbol + " in the block chain" });

        case 22:

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
          _context9.next = 29;
          return _regenerator2.default.awrap(dispatch("assets/fetchAssets", { assets: assetsIds }, { root: true }));

        case 29:
          reqBalances = _context9.sent;
          //queried assets info
          quoteAssets = (0, _keys2.default)(reqBalances).filter(function (key) {
            return (/^[a-zA-Z]+$/.test(key)
            );
          });

          reqBalances = _immutable2.default.fromJS(reqBalances);

          //get queried assets' market info
          marketStats = {};
          _context9.next = 35;
          return _regenerator2.default.awrap(dispatch("market/getMarketStats", {
            baseAsset: toAsset_symbol,
            quoteAssets: quoteAssets
          }, { root: true }));

        case 35:
          _context9.t0 = function (asset) {
            marketStats[asset.quote_symbol] = asset;
          };

          _context9.sent.data.forEach(_context9.t0);

          // console.info("marketStats",marketStats);
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
            locked_total = asset_locked.locked_total[id] || 0;
            balance = _helper2.default.getFullNum(amount, fromAssetPrecision);
            // let locked_total=asset_locked._locked_total;
            // if(id in locked_total){

            // }
            // let lock_details;
            // if(contract_asset_locked){
            //    lock_details=contract_asset_locked._lock_details[id]||{};
            //   for(let key in lock_details){
            //     lock_details[key]=helper.getFullNum(lock_details[key],fromAssetPrecision);
            //   }
            // }

            balances.push({
              id: id,
              balance: balance,
              available_balance: Number((balance - locked_total).toFixed(fromAssetPrecision)),
              symbol: fromSymbol,
              precision: fromAssetPrecision,
              eq_value: id != "1.3.1" ? _helper2.default.getFullNum(eqValue, fromAssetPrecision) : 0,
              eq_unit: toAsset.symbol,
              eq_precision: toAsset.precision,
              locked_total: locked_total
              //locked_total:contract_asset_locked?helper.getFullNum(contract_asset_locked._locked_total[id]||0,fromAssetPrecision):0,
              //lock_details:lock_details||{}
            });
          }

          if (balances.length) {
            _context9.next = 46;
            break;
          }

          _context9.next = 44;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch(["1.3.0"], true));

        case 44:
          core_asset = _context9.sent;

          if (core_asset) {
            symbol = core_asset.symbol, precision = core_asset.precision;

            balances = [{
              id: "1.3.0",
              balance: 0,
              available_balance: 0,
              symbol: symbol,
              precision: precision,
              eq_value: 0,
              eq_unit: toAsset_symbol,
              eq_precision: toAsset.precision,
              locked_total: 0 //,
              //lock_details:{}
            }];
          }

        case 46:
          return _context9.abrupt('return', { code: 1, data: balances, asset_locked: asset_locked });

        case 47:
        case 'end':
          return _context9.stop();
      }
    }
  }, null, undefined);
};

var clearAccountCache = exports.clearAccountCache = function clearAccountCache(_ref7) {
  var commit = _ref7.commit;

  _api2.default.Account.clear_accs();
  commit(types.CLEAR_ACCOUNT);
};

var getUserInfo = exports.getUserInfo = function _callee10(_ref8, _ref9) {
  var dispatch = _ref8.dispatch;
  var _ref9$account = _ref9.account,
      account = _ref9$account === undefined ? "" : _ref9$account,
      _ref9$isCache = _ref9.isCache,
      isCache = _ref9$isCache === undefined ? false : _ref9$isCache,
      _ref9$isSubscribe = _ref9.isSubscribe,
      isSubscribe = _ref9$isSubscribe === undefined ? false : _ref9$isSubscribe;
  var acc, error;
  return _regenerator2.default.async(function _callee10$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          account = account.trim();

          if (account) {
            _context10.next = 8;
            break;
          }

          account = _persistentStorage2.default.getSavedUserData();

          if (!account) {
            _context10.next = 7;
            break;
          }

          account = account.userId;
          _context10.next = 8;
          break;

        case 7:
          return _context10.abrupt('return', { code: 123, message: "Parameter account can not be empty" });

        case 8:
          _context10.next = 10;
          return _regenerator2.default.awrap(_api2.default.Account.getUser(account, isCache, isSubscribe));

        case 10:
          acc = _context10.sent;

          if (!acc.success) {
            _context10.next = 15;
            break;
          }

          return _context10.abrupt('return', { code: 1, data: acc.data });

        case 15:
          error = acc.error;
          return _context10.abrupt('return', { code: acc.code, message: error.message, error: error });

        case 17:
        case 'end':
          return _context10.stop();
      }
    }
  }, null, undefined);
};