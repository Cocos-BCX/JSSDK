'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assetSettle = exports.assetGlobalSettle = exports.assetUpdateFeedProducers = exports.assetPublishFeed = exports.queryAssetRestricted = exports.onGetAssetList = exports.formatAssets = exports.queryAssets = exports.assetUpdateRestricted = exports.issueAsset = exports._createAsset = exports.createAsset = exports.reserveAsset = exports.assetFundFeePool = exports.assetClaimFees = exports._updateAsset = exports.updateAsset = exports.getTransactionBaseFee = exports.set_assets = exports.fetchDefaultAssets = exports.fetchAssets = undefined;

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _mutations = require('../mutations');

var types = _interopRequireWildcard(_mutations);

var _api = require('../services/api');

var _api2 = _interopRequireDefault(_api);

var _utils = require('../utils');

var _utils2 = require('../lib/common/utils');

var _utils3 = _interopRequireDefault(_utils2);

var _helper = require('../lib/common/helper');

var _helper2 = _interopRequireDefault(_helper);

var _asset_constants = require('../lib/chain/asset_constants');

var _asset_constants2 = _interopRequireDefault(_asset_constants);

var _asset_utils = require('../lib/common/asset_utils');

var _asset_utils2 = _interopRequireDefault(_asset_utils);

var _bcxjsCores = require('bcxjs-cores');

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

var _bignumber = require('bignumber.js');

var _bignumber2 = _interopRequireDefault(_bignumber);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fetchAssets = exports.fetchAssets = function _callee(store, _ref) {
  var assets = _ref.assets,
      _ref$isOne = _ref.isOne,
      isOne = _ref$isOne === undefined ? false : _ref$isOne,
      _ref$isCache = _ref.isCache,
      isCache = _ref$isCache === undefined ? true : _ref$isCache;
  var commit, getters, rootGetters, composedResult, currentAssetsIds, filteredAssets, result;
  return _regenerator2.default.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          commit = store.commit, getters = store.getters, rootGetters = store.rootGetters;
          composedResult = [];
          currentAssetsIds = (0, _keys2.default)(getters.getAssets);
          filteredAssets = assets.filter(function (id) {
            //Get the collection of requested assets not in cache.
            if (currentAssetsIds.indexOf(id) >= 0) {
              //if current asset is in cache.
              composedResult.push(getters.getAssets[id]);
            } else {
              return true; //Requested asset didn't exists in cache.
            }
          });

          if (!(isCache && filteredAssets.length == 0)) {
            _context.next = 9;
            break;
          }

          //All the requested assets are existing in cache.
          composedResult = (0, _utils.arrayToObject)(composedResult);

          if (!isOne) {
            _context.next = 8;
            break;
          }

          return _context.abrupt('return', composedResult[assets[0]]);

        case 8:
          return _context.abrupt('return', composedResult);

        case 9:

          commit(types.FETCH_ASSETS_REQUEST);
          //If it is a cache request, only requests the assets didn't exist in cache
          _context.next = 12;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch(isCache ? filteredAssets : assets));

        case 12:
          result = _context.sent;

          if (result && result.length) {
            //If it is a cache request, then merge request assets into cached assets, else return the requested asset.
            composedResult = isCache ? result.concat(composedResult) : result;
          }

          if (!composedResult.length) {
            _context.next = 20;
            break;
          }

          composedResult = (0, _utils.arrayToObject)(composedResult);
          commit(types.FETCH_ASSETS_COMPLETE, { assets: composedResult });

          if (!isOne) {
            _context.next = 19;
            break;
          }

          return _context.abrupt('return', composedResult[assets[0]] || null);

        case 19:
          return _context.abrupt('return', composedResult);

        case 20:

          commit(types.FETCH_ASSETS_ERROR);
          return _context.abrupt('return', null);

        case 22:
        case 'end':
          return _context.stop();
      }
    }
  }, null, undefined);
};

var fetchDefaultAssets = exports.fetchDefaultAssets = function _callee2(store) {
  var commit, rootGetters, defaultAssetsNames, assets, ids;
  return _regenerator2.default.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          commit = store.commit, rootGetters = store.rootGetters;
          defaultAssetsNames = rootGetters["setting/g_settingsAPIs"].defaultAssetsNames;
          _context2.next = 4;
          return _regenerator2.default.awrap(fetchAssets(store, { assets: defaultAssetsNames }));

        case 4:
          assets = _context2.sent;

          if (assets) {
            ids = (0, _keys2.default)(assets);

            commit(types.SAVE_DEFAULT_ASSETS_IDS, { ids: ids });
          }

          return _context2.abrupt('return', assets);

        case 7:
        case 'end':
          return _context2.stop();
      }
    }
  }, null, undefined);
};

var set_assets = exports.set_assets = function set_assets(_ref2, assets) {
  var commit = _ref2.commit;

  commit(types.SET_ASSETS, assets);
};

var getTransactionBaseFee = exports.getTransactionBaseFee = function _callee3(_ref3, _ref4) {
  var dispatch = _ref3.dispatch;
  var transactionType = _ref4.transactionType,
      _ref4$feeAssetId = _ref4.feeAssetId,
      feeAssetId = _ref4$feeAssetId === undefined ? "1.3.0" : _ref4$feeAssetId,
      _ref4$isCache = _ref4.isCache,
      isCache = _ref4$isCache === undefined ? true : _ref4$isCache;
  var globalObject, feeAsset, coreAsset, fee;
  return _regenerator2.default.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          if (transactionType) {
            _context3.next = 2;
            break;
          }

          return _context3.abrupt('return', { code: 128, message: "Parameter 'transactionType' can not be empty" });

        case 2:
          _context3.next = 4;
          return _regenerator2.default.awrap(_api2.default.Explorer.getGlobalObject());

        case 4:
          globalObject = _context3.sent;

          if (!(globalObject.code != 1)) {
            _context3.next = 7;
            break;
          }

          return _context3.abrupt('return', globalObject);

        case 7:
          globalObject = globalObject.data;
          _context3.prev = 8;
          _context3.next = 11;
          return _regenerator2.default.awrap(dispatch("fetchAssets", { assets: [feeAssetId], isOne: true, isCache: isCache }));

        case 11:
          feeAsset = _context3.sent;
          _context3.next = 14;
          return _regenerator2.default.awrap(dispatch("fetchAssets", { assets: ["1.3.0"], isOne: true }));

        case 14:
          coreAsset = _context3.sent;


          // let fee =helper.getFullNum(utils.estimateFee(transactionType, null, globalObject)/Math.pow(10,coreAsset.precision));
          // console.info('globalObject',globalObject);
          fee = _helper2.default.getFullNum(_utils3.default.getFee(transactionType, feeAsset, coreAsset, globalObject).getAmount({ real: true }));
          return _context3.abrupt('return', { code: 1, data: {
              fee_amount: fee,
              fee_symbol: feeAsset.symbol
            } });

        case 19:
          _context3.prev = 19;
          _context3.t0 = _context3['catch'](8);
          return _context3.abrupt('return', { code: 0, message: _context3.t0.message });

        case 22:
        case 'end':
          return _context3.stop();
      }
    }
  }, null, undefined, [[8, 19]]);
};

var updateAsset = exports.updateAsset = function _callee4(_ref5, _ref6) {
  var dispatch = _ref5.dispatch;
  var issuer = _ref6.issuer,
      new_issuer = _ref6.new_issuer,
      update = _ref6.update,
      core_exchange_rate = _ref6.core_exchange_rate,
      asset = _ref6.asset,
      flags = _ref6.flags,
      permissions = _ref6.permissions,
      isBitAsset = _ref6.isBitAsset,
      bitasset_opts = _ref6.bitasset_opts,
      original_bitasset_opts = _ref6.original_bitasset_opts,
      description = _ref6.description,
      feedProducers = _ref6.feedProducers,
      originalFeedProducers = _ref6.originalFeedProducers,
      onlyGetFee = _ref6.onlyGetFee,
      callback = _ref6.callback,
      assetChanged = _ref6.assetChanged;
  var quotePrecision, max_market_fee, cr_quote_asset, cr_quote_precision, cr_base_asset, cr_base_precision, cr_quote_amount, cr_base_amount, updateObject;
  return _regenerator2.default.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          quotePrecision = _utils3.default.get_asset_precision(asset.get("precision"));


          _bignumber2.default.config({ DECIMAL_PLACES: asset.get("precision") });
          // let max_supply = new big(update.max_supply)
          //     .times(quotePrecision)
          //     .toString();
          max_market_fee = new _bignumber2.default(update.max_market_fee || 0).times(quotePrecision).toString();
          _context4.next = 5;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch([core_exchange_rate.quote.asset_id]));

        case 5:
          cr_quote_asset = _context4.sent[0];
          cr_quote_precision = _utils3.default.get_asset_precision(cr_quote_asset.precision);
          _context4.next = 9;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch([core_exchange_rate.base.asset_id]));

        case 9:
          cr_base_asset = _context4.sent[0];
          cr_base_precision = _utils3.default.get_asset_precision(cr_base_asset.precision);
          cr_quote_amount = new _bignumber2.default(core_exchange_rate.quote.amount).times(cr_quote_precision).toString();
          cr_base_amount = new _bignumber2.default(core_exchange_rate.base.amount).times(cr_base_precision).toString();

          if (!(core_exchange_rate.base.amount > 1000 || core_exchange_rate.quote.amount > 1000)) {
            _context4.next = 15;
            break;
          }

          return _context4.abrupt('return', { code: 171, message: "The amount of fee exchange rate assets should not exceed 1000" });

        case 15:
          if (!(_helper2.default.getDecimals(cr_base_amount) > cr_base_precision || _helper2.default.getDecimals(cr_quote_amount) > cr_quote_precision)) {
            _context4.next = 17;
            break;
          }

          return _context4.abrupt('return', { code: 172, message: "precision overflow of fee exchange rate assets" });

        case 17:
          updateObject = {
            fee: {
              amount: 0,
              asset_id: 0
            },
            asset_to_update: asset.get("id"),
            extensions: asset.get("extensions"),
            issuer: issuer,
            new_issuer: new_issuer,
            new_options: {
              max_supply: update.max_supply,
              max_market_fee: max_market_fee,
              market_fee_percent: update.market_fee_percent * 100,
              description: description,
              issuer_permissions: permissions,
              flags: flags,
              // whitelist_authorities: auths.whitelist_authorities.toJS(),
              // blacklist_authorities: auths.blacklist_authorities.toJS(),
              // whitelist_markets: auths.whitelist_markets.toJSUnited Labs of BCTech.(),
              // blacklist_markets: auths.blacklist_markets.toJS(),
              extensions: asset.getIn(["options", "extensions"]),
              core_exchange_rate: {
                quote: {
                  amount: cr_quote_amount,
                  asset_id: core_exchange_rate.quote.asset_id
                },
                base: {
                  amount: cr_base_amount,
                  asset_id: core_exchange_rate.base.asset_id
                }
              }
            }
          };

          if (issuer === new_issuer || !new_issuer) {
            delete updateObject.new_issuer;
          }

          return _context4.abrupt('return', dispatch('transactions/_transactionOperations', {
            operations: [{
              op_type: 9,
              type: "asset_update",
              params: updateObject
            }],
            onlyGetFee: onlyGetFee
          }, { root: true }));

        case 20:
        case 'end':
          return _context4.stop();
      }
    }
  }, null, undefined);
};

var _updateAsset = exports._updateAsset = function _callee5(_ref7, params) {
  var dispatch = _ref7.dispatch,
      rootGetters = _ref7.rootGetters;

  var assetId, maxSupply, newIssuer, coreExchangeRate, whiteList, transferRestricted, chargeMarketFee, description, _params$onlyGetFee, onlyGetFee, u_asset, isBitAsset, flagBooleans, flags, _params;

  return _regenerator2.default.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          assetId = params.assetId, maxSupply = params.maxSupply, newIssuer = params.newIssuer, coreExchangeRate = params.coreExchangeRate, whiteList = params.whiteList, transferRestricted = params.transferRestricted, chargeMarketFee = params.chargeMarketFee, description = params.description, _params$onlyGetFee = params.onlyGetFee, onlyGetFee = _params$onlyGetFee === undefined ? false : _params$onlyGetFee;

          if (assetId) {
            _context5.next = 3;
            break;
          }

          return _context5.abrupt('return', { code: 101, message: "Parameter 'assetId' is missing" });

        case 3:
          if (!newIssuer) {
            _context5.next = 10;
            break;
          }

          _context5.next = 6;
          return _regenerator2.default.awrap(_api2.default.Account.getUser(newIssuer, true));

        case 6:
          newIssuer = _context5.sent;

          if (!(newIssuer.code != 1)) {
            _context5.next = 9;
            break;
          }

          return _context5.abrupt('return', newIssuer);

        case 9:
          newIssuer = newIssuer.data.account.id;

        case 10:
          _context5.next = 12;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(assetId));

        case 12:
          u_asset = _context5.sent;

          if (!(u_asset.code != 1)) {
            _context5.next = 15;
            break;
          }

          return _context5.abrupt('return', { code: 162, message: u_asset.message });

        case 15:
          u_asset = u_asset.data;

          isBitAsset = u_asset.bitasset_data_id !== undefined;
          flagBooleans = _asset_utils2.default.getFlagBooleans(0, isBitAsset);
          // if(chargeMarketFee)
          // flagBooleans["charge_market_fee"]=chargeMarketFee;

          // let permissionBooleans = assetUtils.getFlagBooleans("all",isBitAsset);

          u_asset = _immutable2.default.fromJS(u_asset);

          flagBooleans.witness_fed_asset = false;
          flagBooleans.committee_fed_asset = false;
          flags = void 0;

          if (whiteList != undefined || transferRestricted != undefined) {
            if (whiteList != undefined) flagBooleans.white_list = whiteList;
            if (transferRestricted != undefined) flagBooleans.transfer_restricted = transferRestricted;

            // console.info("flagBooleans",flagBooleans,isBitAsset);
            flags = _asset_utils2.default.getFlags(flagBooleans, isBitAsset);
          } else {
            flags = u_asset.getIn(["options", "issuer_permissions"]);
          }

          // let permissions = assetUtils.getPermissions(
          //   permissionBooleans,
          //   isBitAssetisBitAsset
          // );

          // let auths = {
          //   whitelist_authorities: u_asset.getIn(["options","whitelist_authorities"]),
          //   blacklist_authorities: u_asset.getIn(["options","blacklist_authorities"]),
          //   whitelist_markets: u_asset.getIn(["options","whitelist_markets"]),
          //   blacklist_markets:u_asset.getIn(["options","blacklist_markets"]),
          // };

          _params = {
            issuer: rootGetters["account/getAccountUserId"],
            new_issuer: newIssuer,
            update: {
              symbol: assetId,
              // precision,
              max_supply: u_asset.getIn(["options", "max_supply"]),
              market_fee_percent: u_asset.getIn(["options", "market_fee_percent"]),
              max_market_fee: u_asset.getIn(["options", "max_market_fee"])
            },
            core_exchange_rate: u_asset.getIn(["options", "core_exchange_rate"]).toJS(),
            asset: u_asset,
            flags: flags, //u_asset.getIn(["options","flags"]),
            permissions: u_asset.getIn(["options", "issuer_permissions"]),
            isBitAsset: isBitAsset,
            bitasset_opts: {
              feed_lifetime_sec: 60 * 60 * 24,
              minimum_feeds: 1,
              force_settlement_delay_sec: 60 * 60 * 24,
              force_settlement_offset_percent: 1 * _asset_constants2.default.GRAPHENE_1_PERCENT,
              maximum_force_settlement_volume: 20 * _asset_constants2.default.GRAPHENE_1_PERCENT,
              short_backing_asset: "1.3.0"
            }, //u_asset.get("bitasset_data"),
            original_bitasset_opts: null,
            description: u_asset.getIn(["options", "description"]),
            // auths,
            feedProducers: null,
            originalFeedProducers: null,
            assetChanged: true,
            onlyGetFee: onlyGetFee
          };

          if (maxSupply) {
            _params.update.max_supply = maxSupply * Math.pow(10, u_asset.get("precision"));
          }

          if (description) {
            _params.description = (0, _stringify2.default)({ main: description, short_name: "", market: "" });
          }

          if (coreExchangeRate) {
            _params.core_exchange_rate.quote.amount = coreExchangeRate.quoteAmount || 1;
            _params.core_exchange_rate.base.amount = coreExchangeRate.baseAmount || 1;
          }

          if (chargeMarketFee) {
            _params.update.market_fee_percent = chargeMarketFee.marketFeePercent || 0;
            _params.update.max_market_fee = chargeMarketFee.maxMarketFee || 0;
          }

          return _context5.abrupt('return', dispatch("updateAsset", _params));

        case 29:
        case 'end':
          return _context5.stop();
      }
    }
  }, null, undefined);
};

var assetClaimFees = exports.assetClaimFees = function _callee6(_ref8, _ref9) {
  var commit = _ref8.commit,
      dispatch = _ref8.dispatch;
  var assetId = _ref9.assetId,
      amount = _ref9.amount,
      account = _ref9.account,
      _ref9$onlyGetFee = _ref9.onlyGetFee,
      onlyGetFee = _ref9$onlyGetFee === undefined ? false : _ref9$onlyGetFee;

  var asset, _asset$data, id, precision, amount_res;

  return _regenerator2.default.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.next = 2;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(assetId));

        case 2:
          asset = _context6.sent;

          if (!(asset.code !== 1)) {
            _context6.next = 5;
            break;
          }

          return _context6.abrupt('return', asset);

        case 5:
          _asset$data = asset.data, id = _asset$data.id, precision = _asset$data.precision;
          _context6.next = 8;
          return _regenerator2.default.awrap(_helper2.default.toOpAmount(amount, asset.data));

        case 8:
          amount_res = _context6.sent;

          if (amount_res.success) {
            _context6.next = 11;
            break;
          }

          return _context6.abrupt('return', amount_res);

        case 11:
          return _context6.abrupt('return', dispatch('transactions/_transactionOperations', {
            operations: [{
              op_type: 39,
              type: "asset_claim_fees",
              params: {
                issuer: account.id,
                amount_to_claim: amount_res.data
              }
            }],
            onlyGetFee: onlyGetFee
          }, { root: true }));

        case 12:
        case 'end':
          return _context6.stop();
      }
    }
  }, null, undefined);
};

/********Capital injection fee pool START*/
var assetFundFeePool = exports.assetFundFeePool = function _callee7(_ref10, _ref11) {
  var commit = _ref10.commit,
      dispatch = _ref10.dispatch;
  var assetId = _ref11.assetId,
      amount = _ref11.amount,
      account = _ref11.account,
      _ref11$onlyGetFee = _ref11.onlyGetFee,
      onlyGetFee = _ref11$onlyGetFee === undefined ? false : _ref11$onlyGetFee;
  var asset, core_asset, amount_res;
  return _regenerator2.default.async(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.next = 2;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(assetId));

        case 2:
          asset = _context7.sent;

          if (!(asset.code !== 1)) {
            _context7.next = 5;
            break;
          }

          return _context7.abrupt('return', asset);

        case 5:
          _context7.next = 7;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one("1.3.0"));

        case 7:
          core_asset = _context7.sent;

          if (!(core_asset.code !== 1)) {
            _context7.next = 10;
            break;
          }

          return _context7.abrupt('return', core_asset);

        case 10:
          _context7.next = 12;
          return _regenerator2.default.awrap(_helper2.default.toOpAmount(amount, core_asset.data));

        case 12:
          amount_res = _context7.sent;

          if (amount_res.success) {
            _context7.next = 15;
            break;
          }

          return _context7.abrupt('return', amount_res);

        case 15:
          return _context7.abrupt('return', dispatch('transactions/_transactionOperations', {
            operations: [{
              op_type: 15,
              type: "asset_fund_fee_pool",
              params: {
                asset_id: asset.data.id,
                amount: amount_res.data.amount,
                from_account: account.id
              }
            }],
            onlyGetFee: onlyGetFee
          }, { root: true }));

        case 16:
        case 'end':
          return _context7.stop();
      }
    }
  }, null, undefined);
};
/********Capital injection fee pool END*/

var reserveAsset = exports.reserveAsset = function _callee8(_ref12, _ref13) {
  var commit = _ref12.commit,
      dispatch = _ref12.dispatch;
  var assetId = _ref13.assetId,
      amount = _ref13.amount,
      account = _ref13.account,
      _ref13$onlyGetFee = _ref13.onlyGetFee,
      onlyGetFee = _ref13$onlyGetFee === undefined ? false : _ref13$onlyGetFee;
  var asset, amount_res;
  return _regenerator2.default.async(function _callee8$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _context8.next = 2;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(assetId));

        case 2:
          asset = _context8.sent;

          if (!(asset.code !== 1)) {
            _context8.next = 5;
            break;
          }

          return _context8.abrupt('return', asset);

        case 5:
          _context8.next = 7;
          return _regenerator2.default.awrap(_helper2.default.toOpAmount(amount, asset.data));

        case 7:
          amount_res = _context8.sent;

          if (amount_res.success) {
            _context8.next = 10;
            break;
          }

          return _context8.abrupt('return', amount_res);

        case 10:
          return _context8.abrupt('return', dispatch('transactions/_transactionOperations', {
            operations: [{
              op_type: 14,
              type: "asset_reserve",
              params: {
                amount_to_reserve: amount_res.data,
                payer: account.id,
                extensions: []
              }
            }],
            onlyGetFee: onlyGetFee
          }, { root: true }));

        case 11:
        case 'end':
          return _context8.stop();
      }
    }
  }, null, undefined);
};

var createAsset = exports.createAsset = function _callee9(_ref14, _ref15) {
  var commit = _ref14.commit,
      dispatch = _ref14.dispatch;
  var account_id = _ref15.account_id,
      createObject = _ref15.createObject,
      flags = _ref15.flags,
      permissions = _ref15.permissions,
      cer = _ref15.cer,
      isBitAsset = _ref15.isBitAsset,
      is_prediction_market = _ref15.is_prediction_market,
      bitasset_opts = _ref15.bitasset_opts,
      description = _ref15.description,
      onlyGetFee = _ref15.onlyGetFee,
      callback = _ref15.callback;
  var precision, max_supply, max_market_fee, coreAsset, corePrecision, operationJSON;
  return _regenerator2.default.async(function _callee9$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          // Create asset action here...
          //  console.log(
          //   "create asset:",
          //   createObject,
          //   "flags:",
          //    flags,
          //   "isBitAsset:",
          //   isBitAsset,
          //   United Labs of BCTech.,
          //   "bitasset_opts:",
          //   bitasset_opts
          // );
          precision = _utils3.default.get_asset_precision(createObject.precision);


          _bignumber2.default.config({ DECIMAL_PLACES: Number(createObject.precision) });
          max_supply = new _bignumber2.default(createObject.max_supply).times(precision).toString();
          max_market_fee = new _bignumber2.default(createObject.max_market_fee || 0).times(precision).toString();
          // console.log("max_supply:", max_supply);
          // console.log("max_market_fee:", max_market_fee);

          _context9.next = 6;
          return _regenerator2.default.awrap(dispatch("assets/fetchAssets", { assets: ["1.3.0"], isOne: true }, { root: true }));

        case 6:
          coreAsset = _context9.sent;
          corePrecision = _utils3.default.get_asset_precision(coreAsset.precision);

          if (!(cer.base.amount > 1000 || cer.quote.amount > 1000)) {
            _context9.next = 10;
            break;
          }

          return _context9.abrupt('return', { code: 171, message: "The amount of fee exchange rate assets should not exceed 1000" });

        case 10:
          if (!(_helper2.default.getDecimals(cer.base.amount) > 8 || _helper2.default.getDecimals(cer.quote.amount) > 8)) {
            _context9.next = 12;
            break;
          }

          return _context9.abrupt('return', { code: 172, message: "precision overflow of fee exchange rate assets" });

        case 12:
          operationJSON = {
            fee: {
              amount: 0,
              asset_id: 0
            },
            issuer: account_id,
            symbol: createObject.symbol,
            precision: parseInt(createObject.precision, 10),
            common_options: {
              max_supply: max_supply,
              market_fee_percent: createObject.market_fee_percent * 100 || 0,
              max_market_fee: max_market_fee,
              issuer_permissions: permissions,
              flags: flags,
              core_exchange_rate: {
                base: {
                  amount: cer.base.amount * precision,
                  asset_id: "1.3.1"
                },
                quote: {
                  amount: cer.quote.amount * corePrecision,
                  asset_id: cer.quote.asset_id
                }
              },
              // whitelist_authorities: [],
              // blacklist_authorities: [],
              // whitelist_markets: [],
              // blacklist_markets: [],
              description: description,
              extensions: null
            },
            // is_prediction_market: is_prediction_market,
            extensions: null
          };


          if (isBitAsset) {
            operationJSON.bitasset_opts = bitasset_opts;
          }

          return _context9.abrupt('return', dispatch('transactions/_transactionOperations', {
            operations: [{
              op_type: 8,
              type: "asset_create",
              params: operationJSON
            }],
            onlyGetFee: onlyGetFee
          }, { root: true }));

        case 15:
        case 'end':
          return _context9.stop();
      }
    }
  }, null, undefined);
};

var _createAsset = exports._createAsset = function _callee10(_ref16, params) {
  var dispatch = _ref16.dispatch,
      rootGetters = _ref16.rootGetters;

  var _params$isBitAsset, isBitAsset, _params$is_prediction, is_prediction_market, assetId, _params$maxSupply, maxSupply, _params$precision, precision, coreExchangeRate, chargeMarketFee, description, _params$onlyGetFee2, onlyGetFee, c_asset, flagBooleans, permissionBooleans, flags, permissions, _params;

  return _regenerator2.default.async(function _callee10$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          if (_helper2.default.trimParams(params, { description: "" })) {
            _context10.next = 2;
            break;
          }

          return _context10.abrupt('return', { code: 101, message: "Parameter is missing" });

        case 2:
          _params$isBitAsset = params.isBitAsset, isBitAsset = _params$isBitAsset === undefined ? false : _params$isBitAsset, _params$is_prediction = params.is_prediction_market, is_prediction_market = _params$is_prediction === undefined ? false : _params$is_prediction, assetId = params.assetId, _params$maxSupply = params.maxSupply, maxSupply = _params$maxSupply === undefined ? 100000 : _params$maxSupply, _params$precision = params.precision, precision = _params$precision === undefined ? 8 : _params$precision, coreExchangeRate = params.coreExchangeRate, chargeMarketFee = params.chargeMarketFee, description = params.description, _params$onlyGetFee2 = params.onlyGetFee, onlyGetFee = _params$onlyGetFee2 === undefined ? false : _params$onlyGetFee2;
          _context10.next = 5;
          return _regenerator2.default.awrap(dispatch("assets/fetchAssets", { assets: [assetId], isOne: true }, { root: true }));

        case 5:
          c_asset = _context10.sent;

          if (!c_asset) {
            _context10.next = 8;
            break;
          }

          return _context10.abrupt('return', { code: 162, message: "The asset already exists" });

        case 8:
          flagBooleans = _asset_utils2.default.getFlagBooleans(0, isBitAsset);

          flagBooleans["charge_market_fee"] = chargeMarketFee;

          permissionBooleans = _asset_utils2.default.getFlagBooleans("all", isBitAsset);
          flags = _asset_utils2.default.getFlags(flagBooleans, isBitAsset);
          permissions = _asset_utils2.default.getPermissions(permissionBooleans, isBitAsset);
          _params = {
            account_id: rootGetters["account/getAccountUserId"],
            createObject: {
              symbol: assetId,
              precision: precision,
              max_supply: maxSupply,
              market_fee_percent: 0,
              max_market_fee: 0
            },
            flags: flags,
            permissions: permissions,
            cer: {
              // quote: {
              //     asset_id: null,
              //     amount: 1
              // },
              // base: {
              //     asset_id: "1.3.0",
              //     amount: 1
              // }
              quote: {
                asset_id: "1.3.0",
                amount: 1
              },
              base: {
                asset_id: null,
                amount: 1
              }
            },
            isBitAsset: isBitAsset,
            is_prediction_market: is_prediction_market,
            bitasset_opts: {
              feed_lifetime_sec: 60 * 60 * 24,
              minimum_feeds: 1,
              force_settlement_delay_sec: 60 * 60 * 24,
              force_settlement_offset_percent: 1 * _asset_constants2.default.GRAPHENE_1_PERCENT,
              maximum_force_settlement_volume: 20 * _asset_constants2.default.GRAPHENE_1_PERCENT,
              short_backing_asset: "1.3.0"
            },
            description: (0, _stringify2.default)({ main: description, short_name: "", market: "" }),
            onlyGetFee: onlyGetFee
          };

          if (coreExchangeRate) {
            _params.cer.quote.amount = coreExchangeRate.quoteAmount || 1;
            _params.cer.base.amount = coreExchangeRate.baseAmount || 1;
          }

          if (chargeMarketFee) {
            _params.createObject.market_fee_percent = chargeMarketFee.marketFeePercent || 0;
            _params.createObject.max_market_fee = chargeMarketFee.maxMarketFee || 0;
          }

          return _context10.abrupt('return', dispatch("createAsset", _params));

        case 17:
        case 'end':
          return _context10.stop();
      }
    }
  }, null, undefined);
};

var issueAsset = exports.issueAsset = function issueAsset(_ref17, params) {
  var dispatch = _ref17.dispatch;

  if (!_helper2.default.trimParams(params, { memo: "" })) {
    return { code: 101, message: "Parameter is missing" };
  }
  var toAccount = params.toAccount,
      amount = params.amount,
      memo = params.memo,
      _params$assetId = params.assetId,
      assetId = _params$assetId === undefined ? "" : _params$assetId,
      onlyGetFee = params.onlyGetFee;

  assetId = assetId.toUpperCase();
  return dispatch('transactions/_transactionOperations', {
    operations: [{
      op_type: 13,
      type: "asset_issue",
      params: {
        to: toAccount,
        amount: amount,
        asset_id: assetId,
        memo: memo
      }
    }],
    onlyGetFee: onlyGetFee
  }, { root: true });
};

var assetUpdateRestricted = exports.assetUpdateRestricted = function _callee12(_ref18, params) {
  var dispatch = _ref18.dispatch,
      rootGetters = _ref18.rootGetters;

  var _params$assetId2, assetId, _params$isadd, isadd, _params$restrictedTyp, restrictedType, _params$restrictedLis, restrictedList, _params$onlyGetFee3, onlyGetFee, asset_res;

  return _regenerator2.default.async(function _callee12$(_context12) {
    while (1) {
      switch (_context12.prev = _context12.next) {
        case 0:
          if (_helper2.default.trimParams(params, { memo: "" })) {
            _context12.next = 2;
            break;
          }

          return _context12.abrupt('return', { code: 101, message: "Parameter is missing" });

        case 2:
          _params$assetId2 = params.assetId, assetId = _params$assetId2 === undefined ? "1.3.0" : _params$assetId2, _params$isadd = params.isadd, isadd = _params$isadd === undefined ? true : _params$isadd, _params$restrictedTyp = params.restrictedType, restrictedType = _params$restrictedTyp === undefined ? 0 : _params$restrictedTyp, _params$restrictedLis = params.restrictedList, restrictedList = _params$restrictedLis === undefined ? [] : _params$restrictedLis, _params$onlyGetFee3 = params.onlyGetFee, onlyGetFee = _params$onlyGetFee3 === undefined ? false : _params$onlyGetFee3;

          restrictedType = Number(restrictedType);

          if (!isNaN(restrictedType)) {
            _context12.next = 6;
            break;
          }

          return _context12.abrupt('return', { code: 173, message: "restrictedType must be a number" });

        case 6:
          if (restrictedList instanceof Array) {
            _context12.next = 8;
            break;
          }

          return _context12.abrupt('return', { code: 174, message: "restricted_list must be a array" });

        case 8:

          assetId = assetId.toUpperCase();
          _context12.next = 11;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(assetId));

        case 11:
          asset_res = _context12.sent;

          if (!(asset_res.code !== 1)) {
            _context12.next = 14;
            break;
          }

          return _context12.abrupt('return', asset_res);

        case 14:
          _context12.next = 16;
          return _regenerator2.default.awrap(_promise2.default.all(restrictedList.map(function _callee11(id) {
            var acc_res, _asset_res;

            return _regenerator2.default.async(function _callee11$(_context11) {
              while (1) {
                switch (_context11.prev = _context11.next) {
                  case 0:
                    if (!(restrictedType == 1 || restrictedType == 2)) {
                      _context11.next = 10;
                      break;
                    }

                    if (!/^1.2.\d+$/.test(id)) {
                      _context11.next = 3;
                      break;
                    }

                    return _context11.abrupt('return', id);

                  case 3:
                    _context11.next = 5;
                    return _regenerator2.default.awrap(_api2.default.Account.getUser(id, true));

                  case 5:
                    acc_res = _context11.sent;

                    if (!(acc_res.code == 1)) {
                      _context11.next = 8;
                      break;
                    }

                    return _context11.abrupt('return', acc_res.data.account.id);

                  case 8:
                    _context11.next = 18;
                    break;

                  case 10:
                    if (!(restrictedType == 3 || restrictedType == 4)) {
                      _context11.next = 18;
                      break;
                    }

                    if (!/^1.3.\d+$/.test(id)) {
                      _context11.next = 13;
                      break;
                    }

                    return _context11.abrupt('return', id);

                  case 13:
                    _context11.next = 15;
                    return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(id));

                  case 15:
                    _asset_res = _context11.sent;

                    if (!(_asset_res.code == 1)) {
                      _context11.next = 18;
                      break;
                    }

                    return _context11.abrupt('return', _asset_res.data.id);

                  case 18:
                    return _context11.abrupt('return', "");

                  case 19:
                  case 'end':
                    return _context11.stop();
                }
              }
            }, null, undefined);
          })));

        case 16:
          restrictedList = _context12.sent;

          restrictedList = restrictedList.filter(function (id) {
            return id != "";
          });

          if (restrictedList.length) {
            _context12.next = 20;
            break;
          }

          return _context12.abrupt('return', { code: 175, message: "Please check the parameter restrictedList" });

        case 20:
          return _context12.abrupt('return', dispatch('transactions/_transactionOperations', {
            operations: [{
              op_type: 10,
              type: "asset_update_restricted",
              params: {
                payer: rootGetters['account/getAccountUserId'],
                target_asset: asset_res.data.id,
                isadd: !!isadd,
                restricted_type: restrictedType,
                restricted_list: restrictedList,
                extensions: []
              }
            }],
            onlyGetFee: onlyGetFee
          }, { root: true }));

        case 21:
        case 'end':
          return _context12.stop();
      }
    }
  }, null, undefined);
};

var queryAssets = exports.queryAssets = function _callee13(_ref19, _ref20) {
  var dispatch = _ref19.dispatch,
      state = _ref19.state,
      commit = _ref19.commit;
  var _ref20$symbol = _ref20.symbol,
      symbol = _ref20$symbol === undefined ? "" : _ref20$symbol,
      _ref20$assetId = _ref20.assetId,
      assetId = _ref20$assetId === undefined ? "" : _ref20$assetId,
      _ref20$simple = _ref20.simple,
      simple = _ref20$simple === undefined ? true : _ref20$simple;
  var assets, lastAsset, r_assets;
  return _regenerator2.default.async(function _callee13$(_context13) {
    while (1) {
      switch (_context13.prev = _context13.next) {
        case 0:
          assets = state.assets;
          lastAsset = assets.sort(function (a, b) {
            if (a.symbol > b.symbol) {
              return 1;
            } else if (a.symbol < b.symbol) {
              return -1;
            } else {
              return 0;
            }
          }).last();


          symbol = symbol || assetId;

          if (!symbol) {
            _context13.next = 10;
            break;
          }

          symbol = symbol.trim();
          _context13.next = 7;
          return _regenerator2.default.awrap(dispatch("onGetAssetList", { start: symbol, count: 1 }));

        case 7:
          state.assetsFetched = state.assetsFetched + 99;
          _context13.next = 20;
          break;

        case 10:
          if (!(assets.size === 0)) {
            _context13.next = 16;
            break;
          }

          _context13.next = 13;
          return _regenerator2.default.awrap(dispatch("onGetAssetList", { start: "A", count: 100 }));

        case 13:
          state.assetsFetched = 100;
          _context13.next = 20;
          break;

        case 16:
          if (!(assets.size >= state.assetsFetched)) {
            _context13.next = 20;
            break;
          }

          _context13.next = 19;
          return _regenerator2.default.awrap(dispatch("onGetAssetList", { start: lastAsset.symbol, count: 100 }));

        case 19:
          state.assetsFetched = state.assetsFetched + 99;

        case 20:

          if (assets.size > state.totalAssets) {
            accountStorage.set("totalAssets", assets.size);
          }

          if (!(state.assetsFetched >= state.totalAssets - 100)) {
            _context13.next = 23;
            break;
          }

          return _context13.abrupt('return', { code: 1, data: state.assets.toJS() });

        case 23:
          if (!(assets.size < state.assetsFetched)) {
            _context13.next = 34;
            break;
          }

          _context13.next = 26;
          return _regenerator2.default.awrap(dispatch("formatAssets", {
            assets: state.assets_arr,
            simple: simple
          }));

        case 26:
          r_assets = _context13.sent;


          commit(types.FETCH_ASSETS_COMPLETE, { assets: (0, _utils.arrayToObject)(r_assets) });

          state.assetsFetched = 0;
          state.assets_arr = [];
          state.assets = _immutable2.default.fromJS([]);
          return _context13.abrupt('return', { code: 1, data: r_assets });

        case 34:
          dispatch("queryAssets", { symbol: "" });

        case 35:
        case 'end':
          return _context13.stop();
      }
    }
  }, null, undefined);
};

var formatAssets = exports.formatAssets = function _callee14(_ref21, _ref22) {
  var dispatch = _ref21.dispatch;
  var assets = _ref22.assets,
      _ref22$simple = _ref22.simple,
      simple = _ref22$simple === undefined ? false : _ref22$simple;

  var r_assets, issuer_res, i, _assets$i, issuer, dynamic, precision, id, symbol, options, bitasset_data_id, dynamic_asset_data_id, core_exchange_rate, description, market_fee_percent, max_market_fee, max_supply, flags, issuer_permissions, whitelist_authorities, whitelist_markets, blacklist_authorities, blacklist_markets, core_asset, base, quote, base_asset, quote_asset, asset_item, _asset_item, permissionBooleans;

  return _regenerator2.default.async(function _callee14$(_context14) {
    while (1) {
      switch (_context14.prev = _context14.next) {
        case 0:
          r_assets = [];
          issuer_res = void 0;

          assets = assets.sort(function (a, b) {
            a = a.id.split(".")[2];
            b = b.id.split(".")[2];
            if (a > b) {
              return 1;
            } else if (a < b) {
              return -1;
            } else {
              return 0;
            }
          });
          //  assets=assets.toJS();
          i = 0;

        case 4:
          if (!(i < assets.length)) {
            _context14.next = 31;
            break;
          }

          _assets$i = assets[i], issuer = _assets$i.issuer, dynamic = _assets$i.dynamic, precision = _assets$i.precision, id = _assets$i.id, symbol = _assets$i.symbol, options = _assets$i.options, bitasset_data_id = _assets$i.bitasset_data_id, dynamic_asset_data_id = _assets$i.dynamic_asset_data_id;
          core_exchange_rate = options.core_exchange_rate, description = options.description, market_fee_percent = options.market_fee_percent, max_market_fee = options.max_market_fee, max_supply = options.max_supply, flags = options.flags, issuer_permissions = options.issuer_permissions, whitelist_authorities = options.whitelist_authorities, whitelist_markets = options.whitelist_markets, blacklist_authorities = options.blacklist_authorities, blacklist_markets = options.blacklist_markets;
          _context14.next = 9;
          return _regenerator2.default.awrap(dispatch("user/getUserInfo", { account: issuer, isCache: true }, { root: true }));

        case 9:
          issuer_res = _context14.sent;
          _context14.next = 12;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch(["1.3.0"], true));

        case 12:
          core_asset = _context14.sent;
          base = core_exchange_rate.base, quote = core_exchange_rate.quote;
          _context14.next = 16;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(base.asset_id));

        case 16:
          base_asset = _context14.sent.data;
          _context14.next = 19;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(quote.asset_id));

        case 19:
          quote_asset = _context14.sent.data;


          // let base_precision=(await API.Assets.fetch_asset_one(base.asset_id)).data.precision;
          // let quote_precision=(await API.Assets.fetch_asset_one(United Labs of BCTech.quote.asset_id)).data.precision;

          core_exchange_rate.text = (_helper2.default.formatAmount(quote.amount, quote_asset.precision) || 1) / _helper2.default.formatAmount(base.amount, base_asset.precision) + " " + quote_asset.symbol + "/" + base_asset.symbol;
          asset_item = void 0;

          _bcxjsCores.ChainStore.getAsset(id);
          _bcxjsCores.ChainStore.getObject(dynamic_asset_data_id);

          flags = _asset_utils2.default.getFlagBooleans(flags, !!bitasset_data_id //whether it's a smart asset
          );
          if (simple) {
            asset_item = {
              id: id,
              issuer: issuer,
              issuer_name: issuer_res.code == 1 && issuer_res.data ? issuer_res.data.account.name : "",
              precision: precision,
              symbol: symbol,
              dynamic: {
                current_supply: _helper2.default.formatAmount(dynamic.current_supply, precision),
                fee_pool: _helper2.default.formatAmount(dynamic.fee_pool, core_asset.precision),
                fee_pool_symbol: core_asset.symbol,
                accumulated_fees: _helper2.default.formatAmount(dynamic.accumulated_fees, precision)
              },
              options: {
                core_exchange_rate: core_exchange_rate,
                flags: flags,
                // flags:{
                //   transfer_restricted:flags.transfer_restricted,
                //   white_list:flags.white_list
                // },
                max_supply: _helper2.default.formatAmount(max_supply, precision)
              }
            };
          } else {
            //  console.info('assets[i]',assets[i]);
            permissionBooleans = _asset_utils2.default.getFlagBooleans(issuer_permissions, !!bitasset_data_id //whether it's a smart asset
            );
            // console.info('permissionBooleans',permissionBooleans);

            asset_item = (_asset_item = {
              bitasset_data: assets[i].bitasset_data,
              bitasset_data_id: bitasset_data_id,
              dynamic: {
                current_supply: _helper2.default.formatAmount(dynamic.current_supply, precision),
                fee_pool: _helper2.default.formatAmount(dynamic.fee_pool, precision),
                fee_pool_symbol: core_asset.symbol,
                accumulated_fees: _helper2.default.formatAmount(dynamic.accumulated_fees, precision)
              },
              id: id
            }, (0, _defineProperty3.default)(_asset_item, 'bitasset_data_id', bitasset_data_id), (0, _defineProperty3.default)(_asset_item, 'issuer', issuer), (0, _defineProperty3.default)(_asset_item, 'issuer_name', issuer_res.data.account.name), (0, _defineProperty3.default)(_asset_item, 'options', {
              core_exchange_rate: core_exchange_rate,
              description: "",
              flags: _asset_utils2.default.getFlagBooleans(flags, !!bitasset_data_id //whether it's a smart asset
              ),
              permissionBooleans: permissionBooleans,
              market_fee_percent: market_fee_percent / 100,
              max_market_fee: _helper2.default.formatAmount(max_market_fee, precision),
              max_supply: _helper2.default.formatAmount(max_supply, precision)
              // whitelist_authorities,
              // whitelist_markets,
              // blacklist_authorities,
              // blacklist_markets
            }), (0, _defineProperty3.default)(_asset_item, 'precision', precision), (0, _defineProperty3.default)(_asset_item, 'symbol', symbol), _asset_item);
          }

          try {
            if (description) asset_item.description = JSON.parse(description).main;
          } catch (e) {}

          r_assets.push(asset_item);

        case 28:
          i++;
          _context14.next = 4;
          break;

        case 31:
          return _context14.abrupt('return', JSON.parse((0, _stringify2.default)(r_assets)));

        case 32:
        case 'end':
          return _context14.stop();
      }
    }
  }, null, undefined);
};

var onGetAssetList = exports.onGetAssetList = function _callee15(_ref23, _ref24) {
  var dispatch = _ref23.dispatch,
      state = _ref23.state;
  var start = _ref24.start,
      count = _ref24.count;
  var payload;
  return _regenerator2.default.async(function _callee15$(_context15) {
    while (1) {
      switch (_context15.prev = _context15.next) {
        case 0:
          _context15.next = 2;
          return _regenerator2.default.awrap(_api2.default.Assets.getAssetList(start, count));

        case 2:
          payload = _context15.sent;

          if (payload) {
            _context15.next = 5;
            break;
          }

          return _context15.abrupt('return', false);

        case 5:
          // this.assetsLoading = payload.loading;
          if (payload.assets) {
            payload.assets.forEach(function (asset) {
              for (var i = 0; i < payload.dynamic.length; i++) {
                if (payload.dynamic[i].id === asset.dynamic_asset_data_id) {
                  asset.dynamic = payload.dynamic[i];
                  break;
                }
              }

              if (asset.bitasset_data_id) {
                asset.market_asset = true;

                for (var i = 0; i < payload.bitasset_data.length; i++) {
                  if (payload.bitasset_data[i].id === asset.bitasset_data_id) {
                    asset.bitasset_data = payload.bitasset_data[i];
                    break;
                  }
                }
              } else {
                asset.market_asset = false;
              }

              state.assets = state.assets.set(asset.id, asset);
              state.assets_arr.push(asset);
              state.asset_symbol_to_id[asset.symbol] = asset.id;
            });
          }

        case 6:
        case 'end':
          return _context15.stop();
      }
    }
  }, null, undefined);
};

var queryAssetRestricted = exports.queryAssetRestricted = function _callee17(_ref25, _ref26) {
  var dispatch = _ref25.dispatch;
  var assetId = _ref26.assetId,
      restrictedType = _ref26.restrictedType;
  var asset_res, res;
  return _regenerator2.default.async(function _callee17$(_context17) {
    while (1) {
      switch (_context17.prev = _context17.next) {
        case 0:
          assetId = assetId.toUpperCase();
          _context17.next = 3;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(assetId));

        case 3:
          asset_res = _context17.sent;

          if (!(asset_res.code !== 1)) {
            _context17.next = 6;
            break;
          }

          return _context17.abrupt('return', asset_res);

        case 6:
          _context17.next = 8;
          return _regenerator2.default.awrap(_api2.default.Assets.list_asset_restricted_objects(asset_res.data.id, restrictedType));

        case 8:
          res = _context17.sent;

          if (!(res.code == 1)) {
            _context17.next = 13;
            break;
          }

          _context17.next = 12;
          return _regenerator2.default.awrap(_promise2.default.all(res.data.map(function _callee16(item) {
            var r_id, _data$account, _id, name, _data, _id2, _symbol;

            return _regenerator2.default.async(function _callee16$(_context16) {
              while (1) {
                switch (_context16.prev = _context16.next) {
                  case 0:
                    // item.symbol=asset_res.data.symbol;
                    r_id = item.restricted_id;

                    if (!/^1.2.\d+$/.test(r_id)) {
                      _context16.next = 11;
                      break;
                    }

                    _context16.next = 4;
                    return _regenerator2.default.awrap(_api2.default.Account.getAccount(r_id));

                  case 4:
                    _data$account = _context16.sent.data.account;
                    _id = _data$account.id;
                    name = _data$account.name;

                    item.restricted_account_id = _id;
                    item.restricted_account_name = name;
                    _context16.next = 19;
                    break;

                  case 11:
                    if (!/^1.3.\d+/.test(r_id)) {
                      _context16.next = 19;
                      break;
                    }

                    _context16.next = 14;
                    return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(r_id));

                  case 14:
                    _data = _context16.sent.data;
                    _id2 = _data.id;
                    _symbol = _data.symbol;

                    item.restricted_asset_id = _id2;
                    item.restricted_asset_symbol = _symbol;

                  case 19:
                    return _context16.abrupt('return', item);

                  case 20:
                  case 'end':
                    return _context16.stop();
                }
              }
            }, null, undefined);
          })));

        case 12:
          res.data = _context17.sent;

        case 13:
          return _context17.abrupt('return', res);

        case 14:
        case 'end':
          return _context17.stop();
      }
    }
  }, null, undefined);
};

var assetPublishFeed = exports.assetPublishFeed = function _callee18(_ref27, params) {
  var dispatch = _ref27.dispatch,
      rootGetters = _ref27.rootGetters;

  var assetId, price, maintenanceCollateralRatio, maximumShortSqueezeRatio, coreExchangeRate, onlyGetFee, asset_res, _asset_res$data, id, precision, options, core_exchange_rate, cr_base_asset, cr_base_precision, cr_quote_asset, cr_quote_precision, price_feed;

  return _regenerator2.default.async(function _callee18$(_context18) {
    while (1) {
      switch (_context18.prev = _context18.next) {
        case 0:
          if (_helper2.default.trimParams(params)) {
            _context18.next = 2;
            break;
          }

          return _context18.abrupt('return', { code: 101, message: "Parameter is missing" });

        case 2:
          assetId = params.assetId, price = params.price, maintenanceCollateralRatio = params.maintenanceCollateralRatio, maximumShortSqueezeRatio = params.maximumShortSqueezeRatio, coreExchangeRate = params.coreExchangeRate, onlyGetFee = params.onlyGetFee;


          assetId = assetId.toUpperCase();
          _context18.next = 6;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(assetId));

        case 6:
          asset_res = _context18.sent;

          if (!(asset_res.code !== 1)) {
            _context18.next = 9;
            break;
          }

          return _context18.abrupt('return', asset_res);

        case 9:
          _asset_res$data = asset_res.data, id = _asset_res$data.id, precision = _asset_res$data.precision, options = _asset_res$data.options;
          // options.core_exchange_rate.quote.amount= options.core_exchange_rate.quote.amount*10;

          core_exchange_rate = options.core_exchange_rate;

          if (!coreExchangeRate.baseAmount) {
            _context18.next = 17;
            break;
          }

          _context18.next = 14;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch([core_exchange_rate.base.asset_id]));

        case 14:
          cr_base_asset = _context18.sent[0];
          cr_base_precision = _utils3.default.get_asset_precision(cr_base_asset.precision);

          core_exchange_rate.base.amount = new _bignumber2.default(coreExchangeRate.baseAmount).times(cr_base_precision).toString();

        case 17:
          if (!coreExchangeRate.quoteAmount) {
            _context18.next = 23;
            break;
          }

          _context18.next = 20;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch([core_exchange_rate.quote.asset_id]));

        case 20:
          cr_quote_asset = _context18.sent[0];
          cr_quote_precision = _utils3.default.get_asset_precision(cr_quote_asset.precision);

          core_exchange_rate.quote.amount = new _bignumber2.default(coreExchangeRate.quoteAmount).times(cr_quote_precision).toString();

        case 23:
          _context18.t0 = {
            amount: _helper2.default.getFullNum(1 * Math.pow(10, precision)),
            asset_id: id
          };
          _context18.next = 26;
          return _regenerator2.default.awrap(_helper2.default.toOpAmount(price, "1.3.0"));

        case 26:
          _context18.t1 = _context18.sent.data;
          _context18.t2 = {
            base: _context18.t0,
            quote: _context18.t1
          };
          _context18.t3 = Number((maintenanceCollateralRatio * 1000).toFixed(0));
          _context18.t4 = Number((maximumShortSqueezeRatio * 1000).toFixed(0));
          _context18.t5 = core_exchange_rate;
          price_feed = {
            settlement_price: _context18.t2,
            maintenance_collateral_ratio: _context18.t3,
            maximum_short_squeeze_ratio: _context18.t4,
            core_exchange_rate: _context18.t5
          };
          return _context18.abrupt('return', dispatch('transactions/_transactionOperations', {
            operations: [{
              op_type: 18,
              type: "asset_publish_feed",
              params: {
                publisher: rootGetters['account/getAccountUserId'],
                asset_id: id,
                feed: price_feed,
                extensions: []
              }
            }],
            onlyGetFee: onlyGetFee
          }, { root: true }));

        case 33:
        case 'end':
          return _context18.stop();
      }
    }
  }, null, undefined);
};

var assetUpdateFeedProducers = exports.assetUpdateFeedProducers = function _callee19(_ref28, _ref29) {
  var dispatch = _ref28.dispatch,
      rootGetters = _ref28.rootGetters;
  var assetId = _ref29.assetId,
      newFeedProducers = _ref29.newFeedProducers,
      onlyGetFee = _ref29.onlyGetFee;
  var asset_res;
  return _regenerator2.default.async(function _callee19$(_context19) {
    while (1) {
      switch (_context19.prev = _context19.next) {
        case 0:
          assetId = assetId.toUpperCase();
          _context19.next = 3;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(assetId));

        case 3:
          asset_res = _context19.sent;

          if (!(asset_res.code !== 1)) {
            _context19.next = 6;
            break;
          }

          return _context19.abrupt('return', asset_res);

        case 6:
          return _context19.abrupt('return', dispatch('transactions/_transactionOperations', {
            operations: [{
              op_type: 12,
              type: "asset_update_feed_producers",
              params: {
                issuer: rootGetters['account/getAccountUserId'],
                asset_to_update: asset_res.data.id,
                new_feed_producers: newFeedProducers,
                extensions: []
              }
            }],
            onlyGetFee: onlyGetFee
          }, { root: true }));

        case 7:
        case 'end':
          return _context19.stop();
      }
    }
  }, null, undefined);
};

var assetGlobalSettle = exports.assetGlobalSettle = function _callee20(_ref30, params) {
  var dispatch = _ref30.dispatch,
      rootGetters = _ref30.rootGetters;

  var assetId, price, onlyGetFee, asset_res, _asset_res$data2, id, precision;

  return _regenerator2.default.async(function _callee20$(_context20) {
    while (1) {
      switch (_context20.prev = _context20.next) {
        case 0:
          if (_helper2.default.trimParams(params)) {
            _context20.next = 2;
            break;
          }

          return _context20.abrupt('return', { code: 101, message: "Parameter is missing" });

        case 2:
          assetId = params.assetId, price = params.price, onlyGetFee = params.onlyGetFee;

          if (!isNaN(Number(price))) {
            _context20.next = 5;
            break;
          }

          return _context20.abrupt('return', { code: 135, message: "Please check parameter data type" });

        case 5:
          assetId = assetId.toUpperCase();
          _context20.next = 8;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(assetId));

        case 8:
          asset_res = _context20.sent;

          if (!(asset_res.code !== 1)) {
            _context20.next = 11;
            break;
          }

          return _context20.abrupt('return', asset_res);

        case 11:
          _asset_res$data2 = asset_res.data, id = _asset_res$data2.id, precision = _asset_res$data2.precision;
          _context20.t0 = dispatch;
          _context20.t1 = rootGetters['account/getAccountUserId'];
          _context20.t2 = id;
          _context20.t3 = {
            amount: 1 * Math.pow(10, precision),
            asset_id: id
          };
          _context20.t4 = price;
          _context20.t5 = Math;
          _context20.next = 20;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one("1.3.0"));

        case 20:
          _context20.t6 = _context20.sent.data.precision;
          _context20.t7 = _context20.t5.pow.call(_context20.t5, 10, _context20.t6);
          _context20.t8 = _context20.t4 * _context20.t7;
          _context20.t9 = {
            amount: _context20.t8,
            asset_id: "1.3.0"
          };
          _context20.t10 = {
            base: _context20.t3,
            quote: _context20.t9
          };
          _context20.t11 = [];
          _context20.t12 = {
            issuer: _context20.t1,
            asset_to_settle: _context20.t2,
            settle_price: _context20.t10,
            extensions: _context20.t11
          };
          _context20.t13 = {
            op_type: 17,
            type: "asset_global_settle",
            params: _context20.t12
          };
          _context20.t14 = [_context20.t13];
          _context20.t15 = onlyGetFee;
          _context20.t16 = {
            operations: _context20.t14,
            onlyGetFee: _context20.t15
          };
          _context20.t17 = { root: true };
          return _context20.abrupt('return', (0, _context20.t0)('transactions/_transactionOperations', _context20.t16, _context20.t17));

        case 33:
        case 'end':
          return _context20.stop();
      }
    }
  }, null, undefined);
};

var assetSettle = exports.assetSettle = function _callee21(_ref31, params) {
  var dispatch = _ref31.dispatch,
      rootGetters = _ref31.rootGetters;
  var assetId, amount, onlyGetFee, asset_res;
  return _regenerator2.default.async(function _callee21$(_context21) {
    while (1) {
      switch (_context21.prev = _context21.next) {
        case 0:
          if (_helper2.default.trimParams(params)) {
            _context21.next = 2;
            break;
          }

          return _context21.abrupt('return', { code: 101, message: "Parameter is missing" });

        case 2:
          assetId = params.assetId, amount = params.amount, onlyGetFee = params.onlyGetFee;

          if (!isNaN(Number(amount))) {
            _context21.next = 5;
            break;
          }

          return _context21.abrupt('return', { code: 135, message: "Please check parameter data type" });

        case 5:
          assetId = assetId.toUpperCase();
          _context21.next = 8;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(assetId));

        case 8:
          asset_res = _context21.sent;

          if (!(asset_res.code !== 1)) {
            _context21.next = 11;
            break;
          }

          return _context21.abrupt('return', asset_res);

        case 11:
          _context21.t0 = dispatch;
          _context21.t1 = rootGetters['account/getAccountUserId'];
          _context21.next = 15;
          return _regenerator2.default.awrap(_helper2.default.toOpAmount(price, asset_res.data));

        case 15:
          _context21.t2 = _context21.sent.data;
          _context21.t3 = [];
          _context21.t4 = {
            account: _context21.t1,
            amount: _context21.t2,
            extensions: _context21.t3
          };
          _context21.t5 = {
            op_type: 16,
            type: "asset_settle",
            params: _context21.t4
          };
          _context21.t6 = [_context21.t5];
          _context21.t7 = onlyGetFee;
          _context21.t8 = {
            operations: _context21.t6,
            onlyGetFee: _context21.t7
          };
          _context21.t9 = { root: true };
          return _context21.abrupt('return', (0, _context21.t0)('transactions/_transactionOperations', _context21.t8, _context21.t9));

        case 24:
        case 'end':
          return _context21.stop();
      }
    }
  }, null, undefined);
};