'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateCollateralForGas = exports.assetSettle = exports.assetGlobalSettle = exports.assetUpdateFeedProducers = exports.assetPublishFeed = exports.queryAssetRestricted = exports.onGetAssetList = exports.formatAssets = exports.queryAssets = exports.assetUpdateRestricted = exports.issueAsset = exports._createAsset = exports.createAsset = exports.reserveAsset = exports.assetFundFeePool = exports.assetClaimFees = exports._updateAsset = exports.updateAsset = exports.queryFees = exports.getTransactionBaseFee = exports.set_assets = exports.fetchDefaultAssets = exports.fetchAssets = exports.estimationGas = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _mutations = require('../mutations');

var types = _interopRequireWildcard(_mutations);

var _bcxjsWs = require('bcxjs-ws');

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

var estimationGas = exports.estimationGas = function _callee(store, _ref) {
  var amount = _ref.amount;
  var commit, getters, rootGetters, core_asset, res, gas, gas_asset;
  return _regenerator2.default.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          commit = store.commit, getters = store.getters, rootGetters = store.rootGetters;

          if (!isNaN(Number(amount))) {
            _context.next = 3;
            break;
          }

          return _context.abrupt('return', { code: 135, message: "Please check parameter data type" });

        case 3:
          _context.next = 5;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch(["1.3.0"], true));

        case 5:
          core_asset = _context.sent;
          _context.t0 = _regenerator2.default;
          _context.t1 = _api2.default.Assets;
          _context.next = 10;
          return _regenerator2.default.awrap(_helper2.default.toOpAmount(amount, core_asset));

        case 10:
          _context.t2 = _context.sent.data;
          _context.t3 = _context.t1.estimation_gas.call(_context.t1, _context.t2);
          _context.next = 14;
          return _context.t0.awrap.call(_context.t0, _context.t3);

        case 14:
          res = _context.sent;

          if (!(res.code != 1)) {
            _context.next = 17;
            break;
          }

          return _context.abrupt('return', res);

        case 17:
          gas = res.data;
          _context.next = 20;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch([gas.asset_id], true));

        case 20:
          gas_asset = _context.sent;


          gas.amount = _helper2.default.getFullNum(gas.amount, gas_asset.precision);
          gas.amount_symbol = gas_asset.symbol;
          return _context.abrupt('return', { code: 1, data: gas });

        case 24:
        case 'end':
          return _context.stop();
      }
    }
  }, null, undefined);
};

var fetchAssets = exports.fetchAssets = function _callee2(store, _ref2) {
  var assets = _ref2.assets,
      _ref2$isOne = _ref2.isOne,
      isOne = _ref2$isOne === undefined ? false : _ref2$isOne,
      _ref2$isCache = _ref2.isCache,
      isCache = _ref2$isCache === undefined ? true : _ref2$isCache;
  var commit, getters, rootGetters, composedResult, currentAssetsIds, filteredAssets, result;
  return _regenerator2.default.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
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
            _context2.next = 9;
            break;
          }

          //All the requested assets are existing in cache.
          composedResult = (0, _utils.arrayToObject)(composedResult);

          if (!isOne) {
            _context2.next = 8;
            break;
          }

          return _context2.abrupt('return', composedResult[assets[0]]);

        case 8:
          return _context2.abrupt('return', composedResult);

        case 9:

          commit(types.FETCH_ASSETS_REQUEST);
          //If it is a cache request, only requests the assets didn't exist in cache
          _context2.next = 12;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch(isCache ? filteredAssets : assets));

        case 12:
          result = _context2.sent;

          if (result && result.length) {
            //If it is a cache request, then merge request assets into cached assets, else return the requested asset.
            composedResult = isCache ? result.concat(composedResult) : result;
          }

          if (!composedResult.length) {
            _context2.next = 20;
            break;
          }

          composedResult = (0, _utils.arrayToObject)(composedResult);
          commit(types.FETCH_ASSETS_COMPLETE, { assets: composedResult });

          if (!isOne) {
            _context2.next = 19;
            break;
          }

          return _context2.abrupt('return', composedResult[assets[0]] || null);

        case 19:
          return _context2.abrupt('return', composedResult);

        case 20:

          commit(types.FETCH_ASSETS_ERROR);
          return _context2.abrupt('return', null);

        case 22:
        case 'end':
          return _context2.stop();
      }
    }
  }, null, undefined);
};

var fetchDefaultAssets = exports.fetchDefaultAssets = function _callee3(store) {
  var commit, rootGetters, defaultAssetsNames, assets, ids;
  return _regenerator2.default.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          commit = store.commit, rootGetters = store.rootGetters;
          defaultAssetsNames = rootGetters["setting/g_settingsAPIs"].defaultAssetsNames;
          _context3.next = 4;
          return _regenerator2.default.awrap(fetchAssets(store, { assets: defaultAssetsNames }));

        case 4:
          assets = _context3.sent;

          if (assets) {
            ids = (0, _keys2.default)(assets);

            commit(types.SAVE_DEFAULT_ASSETS_IDS, { ids: ids });
          }

          return _context3.abrupt('return', assets);

        case 7:
        case 'end':
          return _context3.stop();
      }
    }
  }, null, undefined);
};

var set_assets = exports.set_assets = function set_assets(_ref3, assets) {
  var commit = _ref3.commit;

  commit(types.SET_ASSETS, assets);
};

var getTransactionBaseFee = exports.getTransactionBaseFee = function _callee4(_ref4, _ref5) {
  var dispatch = _ref4.dispatch;
  var transactionType = _ref5.transactionType,
      _ref5$feeAssetId = _ref5.feeAssetId,
      feeAssetId = _ref5$feeAssetId === undefined ? "1.3.0" : _ref5$feeAssetId,
      _ref5$isCache = _ref5.isCache,
      isCache = _ref5$isCache === undefined ? true : _ref5$isCache;
  var globalObject, feeAsset, coreAsset, fee;
  return _regenerator2.default.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          if (transactionType) {
            _context4.next = 2;
            break;
          }

          return _context4.abrupt('return', { code: 128, message: "Parameter 'transactionType' can not be empty" });

        case 2:
          _context4.next = 4;
          return _regenerator2.default.awrap(_api2.default.Explorer.getGlobalObject());

        case 4:
          globalObject = _context4.sent;

          if (!(globalObject.code != 1)) {
            _context4.next = 7;
            break;
          }

          return _context4.abrupt('return', globalObject);

        case 7:
          globalObject = globalObject.data;
          _context4.prev = 8;
          _context4.next = 11;
          return _regenerator2.default.awrap(dispatch("fetchAssets", { assets: [feeAssetId], isOne: true, isCache: isCache }));

        case 11:
          feeAsset = _context4.sent;
          _context4.next = 14;
          return _regenerator2.default.awrap(dispatch("fetchAssets", { assets: ["1.3.0"], isOne: true }));

        case 14:
          coreAsset = _context4.sent;


          // let fee =helper.getFullNum(utils.estimateFee(transactionType, null, globalObject)/Math.pow(10,coreAsset.precision));
          fee = _helper2.default.getFullNum(_utils3.default.getFee(transactionType, feeAsset, coreAsset, globalObject).getAmount({ real: true }));
          return _context4.abrupt('return', { code: 1, data: {
              fee_amount: fee,
              fee_symbol: feeAsset.symbol
            } });

        case 19:
          _context4.prev = 19;
          _context4.t0 = _context4['catch'](8);
          return _context4.abrupt('return', { code: 0, message: _context4.t0.message });

        case 22:
        case 'end':
          return _context4.stop();
      }
    }
  }, null, undefined, [[8, 19]]);
};

var queryFees = exports.queryFees = function _callee5(_ref6) {
  var dispatch = _ref6.dispatch;

  var _operationTypes, fee_grouping, globalObject, current_fees_parameters, _ref7, precision, symbol, _fee_grouping, _loop, groupName;

  return _regenerator2.default.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _operationTypes = {};

          (0, _keys2.default)(_bcxjsCores.ChainTypes.operations).forEach(function (name) {
            var code = _bcxjsCores.ChainTypes.operations[name];
            _operationTypes[code] = name;
          });

          fee_grouping = {
            general: [0, 27],
            contract: [34, 35, 50],
            nh_asset: [37, 40, 41, 42, 43, 44, 45],
            asset: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
            market: [1, 2, 3, 4, 16, 17],
            account: [5, 6, 7],
            business: [18, 19, 20, 21, 22, 23, 24, 25]
          };
          _context5.next = 5;
          return _regenerator2.default.awrap(_api2.default.Explorer.getGlobalObject());

        case 5:
          globalObject = _context5.sent;

          if (!(globalObject.code != 1)) {
            _context5.next = 8;
            break;
          }

          return _context5.abrupt('return', globalObject);

        case 8:
          globalObject = globalObject.data;
          current_fees_parameters = globalObject.parameters.current_fees.parameters;
          _context5.next = 12;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch(["1.3.0"], true));

        case 12:
          _ref7 = _context5.sent;
          precision = _ref7.precision;
          symbol = _ref7.symbol;
          _fee_grouping = {};

          _loop = function _loop(groupName) {
            var feeIds = fee_grouping[groupName];
            // console.info('feeIds',feeIds);
            feeIds.forEach(function (code) {
              var fees = current_fees_parameters[code][1];
              for (var key in fees) {
                fees[key] = _helper2.default.getFullNum(fees[key], precision) + " " + symbol;
              }
              if (!_fee_grouping[groupName]) _fee_grouping[groupName] = [];
              _fee_grouping[groupName].push({
                type: _operationTypes[code],
                fees: fees
              });
            });
          };

          for (groupName in fee_grouping) {
            _loop(groupName);
          }

          return _context5.abrupt('return', { code: 1, data: _fee_grouping });

        case 19:
        case 'end':
          return _context5.stop();
      }
    }
  }, null, undefined);
};

var updateAsset = exports.updateAsset = function _callee6(_ref8, _ref9) {
  var dispatch = _ref8.dispatch;
  var issuer = _ref9.issuer,
      new_issuer = _ref9.new_issuer,
      update = _ref9.update,
      core_exchange_rate = _ref9.core_exchange_rate,
      asset = _ref9.asset,
      flags = _ref9.flags,
      permissions = _ref9.permissions,
      isBitAsset = _ref9.isBitAsset,
      bitasset_opts = _ref9.bitasset_opts,
      original_bitasset_opts = _ref9.original_bitasset_opts,
      description = _ref9.description,
      feedProducers = _ref9.feedProducers,
      originalFeedProducers = _ref9.originalFeedProducers,
      callback = _ref9.callback,
      assetChanged = _ref9.assetChanged;
  var quotePrecision, max_market_fee, cr_quote_amount, cr_base_amount, cr_quote_asset, cr_quote_precision, cr_base_asset, cr_base_precision, updateObject, operations, bitAssetUpdateObject;
  return _regenerator2.default.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          quotePrecision = _utils3.default.get_asset_precision(asset.get("precision"));


          _bignumber2.default.config({ DECIMAL_PLACES: asset.get("precision") });
          // let max_supply = new big(update.max_supply)
          //     .times(quotePrecision)
          //     .toString();
          max_market_fee = new _bignumber2.default(update.max_market_fee || 0).times(quotePrecision).toString();
          cr_quote_amount = void 0, cr_base_amount = void 0;

          if (!core_exchange_rate) {
            _context6.next = 19;
            break;
          }

          _context6.next = 7;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch([core_exchange_rate.quote.asset_id]));

        case 7:
          cr_quote_asset = _context6.sent[0];
          cr_quote_precision = _utils3.default.get_asset_precision(cr_quote_asset.precision);
          _context6.next = 11;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch([core_exchange_rate.base.asset_id]));

        case 11:
          cr_base_asset = _context6.sent[0];
          cr_base_precision = _utils3.default.get_asset_precision(cr_base_asset.precision);


          cr_quote_amount = new _bignumber2.default(core_exchange_rate.quote.amount).times(cr_quote_precision).toString();
          cr_base_amount = new _bignumber2.default(core_exchange_rate.base.amount).times(cr_base_precision).toString();

          if (!(core_exchange_rate.base.amount > 1000 || core_exchange_rate.quote.amount > 1000)) {
            _context6.next = 17;
            break;
          }

          return _context6.abrupt('return', { code: 171, message: "The amount of fee exchange rate assets should not exceed 1000" });

        case 17:
          if (!(_helper2.default.getDecimals(cr_base_amount) > cr_base_precision || _helper2.default.getDecimals(cr_quote_amount) > cr_quote_precision)) {
            _context6.next = 19;
            break;
          }

          return _context6.abrupt('return', { code: 172, message: "precision overflow of fee exchange rate assets" });

        case 19:
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
              extensions: asset.getIn(["options", "extensions"])
            }
          };

          if (core_exchange_rate) {
            updateObject.new_options.core_exchange_rate = {
              quote: {
                amount: cr_quote_amount,
                asset_id: core_exchange_rate.quote.asset_id
              },
              base: {
                amount: cr_base_amount,
                asset_id: core_exchange_rate.base.asset_id
              }
            };
          }

          if (issuer === new_issuer || !new_issuer) {
            delete updateObject.new_issuer;
          }
          // console.info("updateObject",updateObject);
          operations = [{
            op_type: 9,
            type: "asset_update",
            params: updateObject
          }];

          if (isBitAsset && original_bitasset_opts && (bitasset_opts.feed_lifetime_sec !== original_bitasset_opts.feed_lifetime_sec || bitasset_opts.minimum_feeds !== original_bitasset_opts.minimum_feeds || bitasset_opts.force_settlement_delay_sec !== original_bitasset_opts.force_settlement_delay_sec || bitasset_opts.force_settlement_offset_percent !== original_bitasset_opts.force_settlement_offset_percent || bitasset_opts.maximum_force_settlement_volume !== original_bitasset_opts.maximum_force_settlement_volume || bitasset_opts.short_backing_asset !== original_bitasset_opts.short_backing_asset)) {
            bitAssetUpdateObject = {
              fee: {
                amount: 0,
                asset_id: 0
              },
              asset_to_update: asset.get("id"),
              issuer: issuer,
              new_options: bitasset_opts
            };


            operations.push({
              op_type: 11,
              type: "asset_update_bitasset",
              params: bitAssetUpdateObject
            });

            // console.info("operations",operations);
          }

          return _context6.abrupt('return', dispatch('transactions/_transactionOperations', {
            operations: operations
          }, { root: true }));

        case 25:
        case 'end':
          return _context6.stop();
      }
    }
  }, null, undefined);
};

var _updateAsset = exports._updateAsset = function _callee7(_ref10, params) {
  var dispatch = _ref10.dispatch,
      rootGetters = _ref10.rootGetters;

  var assetId, maxSupply, newIssuer, coreExchangeRate, whiteList, transferRestricted, chargeMarketFee, description, bitassetOpts, _params$onlyGetFee, onlyGetFee, u_asset, isBitAsset, flagBooleans, flags, _params, bitasset_data_id, bitassetData, _bitasset_opts, feedLifetimeSec, minimumFeeds, forceSettlementDelaySec, forceSettlementOffsetPercent, maximumForceSettlementVolume, shortBackingAsset, bitasset_options, minimum_feeds, feed_lifetime_sec, force_settlement_delay_sec, force_settlement_offset_percent, maximum_force_settlement_volume;

  return _regenerator2.default.async(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          assetId = params.assetId, maxSupply = params.maxSupply, newIssuer = params.newIssuer, coreExchangeRate = params.coreExchangeRate, whiteList = params.whiteList, transferRestricted = params.transferRestricted, chargeMarketFee = params.chargeMarketFee, description = params.description, bitassetOpts = params.bitassetOpts, _params$onlyGetFee = params.onlyGetFee, onlyGetFee = _params$onlyGetFee === undefined ? false : _params$onlyGetFee;

          if (assetId) {
            _context7.next = 3;
            break;
          }

          return _context7.abrupt('return', { code: 101, message: "Parameter 'assetId' is missing" });

        case 3:
          if (!newIssuer) {
            _context7.next = 10;
            break;
          }

          _context7.next = 6;
          return _regenerator2.default.awrap(_api2.default.Account.getUser(newIssuer, true));

        case 6:
          newIssuer = _context7.sent;

          if (!(newIssuer.code != 1)) {
            _context7.next = 9;
            break;
          }

          return _context7.abrupt('return', newIssuer);

        case 9:
          newIssuer = newIssuer.data.account.id;

        case 10:
          _context7.next = 12;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(assetId));

        case 12:
          u_asset = _context7.sent;

          if (!(u_asset.code != 1)) {
            _context7.next = 15;
            break;
          }

          return _context7.abrupt('return', { code: 162, message: u_asset.message });

        case 15:
          u_asset = u_asset.data;

          isBitAsset = u_asset.bitasset_data_id !== undefined;
          flagBooleans = _asset_utils2.default.getFlagBooleans(0, isBitAsset);
          // console.info("flagBooleans0000",JSON.parse(JSON.stringify(flagBooleans)));

          if (chargeMarketFee) flagBooleans["charge_market_fee"] = true;

          // let permissionBooleans = assetUtils.getFlagBooleans("all",isBitAsset);

          u_asset = _immutable2.default.fromJS(u_asset);

          flagBooleans.witness_fed_asset = false;
          flagBooleans.committee_fed_asset = false;

          if (whiteList != undefined) flagBooleans.white_list = whiteList;
          if (transferRestricted != undefined) flagBooleans.transfer_restricted = transferRestricted;

          // console.info("flagBooleans1111",flagBooleans);
          flags = _asset_utils2.default.getFlags(flagBooleans, isBitAsset);
          // console.info("flags",flags);
          // if(whiteList!=undefined||transferRestricted!=undefined){
          //   if(whiteList!=undefined) flagBooleans.white_list=whiteList;
          //   if(transferRestricted!=undefined) flagBooleans.transfer_restricted=transferRestricted;
          //   // console.info("flagBooleans",flagBooleans,isBitAsset);
          //   flags = assetUtils.getFlags(flagBooleans, isBitAsset);
          // }else{
          //   flags=u_asset.getIn(["options","issuer_permissions"])
          // }

          // let permissions = assetUtils.getPermissions(
          //   permissionBooleans,
          //   isBitAssetisBitAsset
          // );

          _params = {
            issuer: rootGetters["account/getAccountUserId"],
            new_issuer: newIssuer,
            update: {
              symbol: assetId,
              // precision,
              max_supply: u_asset.getIn(["options", "max_supply"]),
              market_fee_percent: Number(u_asset.getIn(["options", "market_fee_percent"])),
              max_market_fee: Number(u_asset.getIn(["options", "max_market_fee"]))
            },
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


          if (u_asset.getIn(["options", "core_exchange_rate"])) {
            _params.core_exchange_rate = u_asset.getIn(["options", "core_exchange_rate"]).toJS();
            // console.info("_params.core_exchange_rate",_params.core_exchange_rate);
            if (coreExchangeRate) {
              //&&u_asset.get("id")=="1.3.1"
              _params.core_exchange_rate.quote.amount = coreExchangeRate.quoteAmount || 1;
              _params.core_exchange_rate.base.amount = coreExchangeRate.baseAmount || 1;
            }
          }

          if (maxSupply) {
            _params.update.max_supply = maxSupply * Math.pow(10, u_asset.get("precision"));
          }

          if (description) {
            _params.description = (0, _stringify2.default)({ main: description, short_name: "", market: "" });
          }

          if (chargeMarketFee) {
            _params.update.market_fee_percent = chargeMarketFee.marketFeePercent || 0;
            _params.update.max_market_fee = chargeMarketFee.maxMarketFee || 0;
          }

          // console.info("u_asset",u_asset);
          bitasset_data_id = u_asset.get("bitasset_data_id");

          if (!(bitasset_data_id && bitassetOpts)) {
            _context7.next = 53;
            break;
          }

          _context7.next = 34;
          return _regenerator2.default.awrap(dispatch("explorer/getDataByIds", { ids: [bitasset_data_id] }, { root: true }));

        case 34:
          bitassetData = _context7.sent;
          ;

          if (!(bitassetData.code != 1)) {
            _context7.next = 38;
            break;
          }

          return _context7.abrupt('return', bitassetData);

        case 38:
          if (!bitassetData.data.length) {
            _context7.next = 53;
            break;
          }

          _bitasset_opts = bitassetData.data[0];
          feedLifetimeSec = bitassetOpts.feedLifetimeSec, minimumFeeds = bitassetOpts.minimumFeeds, forceSettlementDelaySec = bitassetOpts.forceSettlementDelaySec, forceSettlementOffsetPercent = bitassetOpts.forceSettlementOffsetPercent, maximumForceSettlementVolume = bitassetOpts.maximumForceSettlementVolume, shortBackingAsset = bitassetOpts.shortBackingAsset;
          bitasset_options = JSON.parse((0, _stringify2.default)(_bitasset_opts.options));

          if (minimumFeeds) bitasset_options.minimum_feeds = Number(minimumFeeds);
          if (feedLifetimeSec) bitasset_options.feed_lifetime_sec = Number(feedLifetimeSec) * 60;
          if (forceSettlementDelaySec) bitasset_options.force_settlement_delay_sec = Number(forceSettlementDelaySec) * 60;
          if (forceSettlementOffsetPercent) bitasset_options.force_settlement_offset_percent = Number(forceSettlementOffsetPercent) * _asset_constants2.default.GRAPHENE_1_PERCENT;
          if (maximumForceSettlementVolume) bitasset_options.maximum_force_settlement_volume = Number(maximumForceSettlementVolume) * _asset_constants2.default.GRAPHENE_1_PERCENT;
          if (shortBackingAsset) bitasset_options.short_backing_asset = shortBackingAsset;

          minimum_feeds = bitasset_options.minimum_feeds, feed_lifetime_sec = bitasset_options.feed_lifetime_sec, force_settlement_delay_sec = bitasset_options.force_settlement_delay_sec, force_settlement_offset_percent = bitasset_options.force_settlement_offset_percent, maximum_force_settlement_volume = bitasset_options.maximum_force_settlement_volume;

          if (!(isNaN(minimum_feeds) || isNaN(feed_lifetime_sec) || isNaN(force_settlement_delay_sec) || isNaN(force_settlement_offset_percent) || isNaN(maximum_force_settlement_volume))) {
            _context7.next = 51;
            break;
          }

          return _context7.abrupt('return', { code: 135, message: "Please check parameter data type" });

        case 51:
          //  console.info("_params.bitasset_opts",bitasset_options,_bitasset_opts);
          _params.bitasset_opts = bitasset_options;
          _params.original_bitasset_opts = _bitasset_opts.options;

        case 53:
          return _context7.abrupt('return', dispatch("updateAsset", _params));

        case 54:
        case 'end':
          return _context7.stop();
      }
    }
  }, null, undefined);
};

var assetClaimFees = exports.assetClaimFees = function _callee8(_ref11, _ref12) {
  var commit = _ref11.commit,
      dispatch = _ref11.dispatch;
  var assetId = _ref12.assetId,
      amount = _ref12.amount,
      account = _ref12.account,
      _ref12$onlyGetFee = _ref12.onlyGetFee,
      onlyGetFee = _ref12$onlyGetFee === undefined ? false : _ref12$onlyGetFee;

  var asset, _asset$data, id, precision, amount_res;

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
          _asset$data = asset.data, id = _asset$data.id, precision = _asset$data.precision;
          _context8.next = 8;
          return _regenerator2.default.awrap(_helper2.default.toOpAmount(amount, asset.data));

        case 8:
          amount_res = _context8.sent;

          if (amount_res.success) {
            _context8.next = 11;
            break;
          }

          return _context8.abrupt('return', amount_res);

        case 11:
          return _context8.abrupt('return', dispatch('transactions/_transactionOperations', {
            operations: [{
              op_type: 31,
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
          return _context8.stop();
      }
    }
  }, null, undefined);
};

/********Capital injection fee pool START*/
var assetFundFeePool = exports.assetFundFeePool = function _callee9(_ref13, _ref14) {
  var commit = _ref13.commit,
      dispatch = _ref13.dispatch;
  var assetId = _ref14.assetId,
      amount = _ref14.amount,
      account = _ref14.account,
      _ref14$onlyGetFee = _ref14.onlyGetFee,
      onlyGetFee = _ref14$onlyGetFee === undefined ? false : _ref14$onlyGetFee;
  var asset, core_asset, amount_res;
  return _regenerator2.default.async(function _callee9$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          _context9.next = 2;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(assetId));

        case 2:
          asset = _context9.sent;

          if (!(asset.code !== 1)) {
            _context9.next = 5;
            break;
          }

          return _context9.abrupt('return', asset);

        case 5:
          _context9.next = 7;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one("1.3.0"));

        case 7:
          core_asset = _context9.sent;

          if (!(core_asset.code !== 1)) {
            _context9.next = 10;
            break;
          }

          return _context9.abrupt('return', core_asset);

        case 10:
          _context9.next = 12;
          return _regenerator2.default.awrap(_helper2.default.toOpAmount(amount, core_asset.data));

        case 12:
          amount_res = _context9.sent;

          if (amount_res.success) {
            _context9.next = 15;
            break;
          }

          return _context9.abrupt('return', amount_res);

        case 15:
          return _context9.abrupt('return', dispatch('transactions/_transactionOperations', {
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
          return _context9.stop();
      }
    }
  }, null, undefined);
};
/********Capital injection fee pool END*/

var reserveAsset = exports.reserveAsset = function _callee10(_ref15, _ref16) {
  var commit = _ref15.commit,
      dispatch = _ref15.dispatch;
  var assetId = _ref16.assetId,
      amount = _ref16.amount,
      account = _ref16.account,
      _ref16$onlyGetFee = _ref16.onlyGetFee,
      onlyGetFee = _ref16$onlyGetFee === undefined ? false : _ref16$onlyGetFee;
  var asset, amount_res;
  return _regenerator2.default.async(function _callee10$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          _context10.next = 2;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(assetId));

        case 2:
          asset = _context10.sent;

          if (!(asset.code !== 1)) {
            _context10.next = 5;
            break;
          }

          return _context10.abrupt('return', asset);

        case 5:
          _context10.next = 7;
          return _regenerator2.default.awrap(_helper2.default.toOpAmount(amount, asset.data));

        case 7:
          amount_res = _context10.sent;

          if (amount_res.success) {
            _context10.next = 10;
            break;
          }

          return _context10.abrupt('return', amount_res);

        case 10:
          return _context10.abrupt('return', dispatch('transactions/_transactionOperations', {
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
          return _context10.stop();
      }
    }
  }, null, undefined);
};

var createAsset = exports.createAsset = function _callee11(_ref17, _ref18) {
  var commit = _ref17.commit,
      dispatch = _ref17.dispatch;
  var account_id = _ref18.account_id,
      createObject = _ref18.createObject,
      flags = _ref18.flags,
      permissions = _ref18.permissions,
      cer = _ref18.cer,
      isBitAsset = _ref18.isBitAsset,
      bitasset_opts = _ref18.bitasset_opts,
      description = _ref18.description;
  var precision, max_supply, max_market_fee, coreAsset, corePrecision, operationJSON;
  return _regenerator2.default.async(function _callee11$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          // Create asset action here...
          //  console.log(
          //   "create asset:",
          //   createObject,
          //   "flags:",
          //    flags,
          //   "isBitAsset:",
          //   isBitAsset,
          //   "bitasset_opts:",
          //   bitasset_opts
          // );
          precision = _utils3.default.get_asset_precision(createObject.precision);


          _bignumber2.default.config({ DECIMAL_PLACES: Number(createObject.precision) });
          max_supply = new _bignumber2.default(createObject.max_supply).times(precision).toString();
          max_market_fee = new _bignumber2.default(createObject.max_market_fee || 0).times(precision).toString();
          // console.log("max_supply:", max_supply);
          // console.log("max_market_fee:", max_market_fee);

          _context11.next = 6;
          return _regenerator2.default.awrap(dispatch("assets/fetchAssets", { assets: ["1.3.0"], isOne: true }, { root: true }));

        case 6:
          coreAsset = _context11.sent;
          corePrecision = _utils3.default.get_asset_precision(coreAsset.precision);

          // if(cer.base.amount>1000|| cer.quote.amount>1000){
          //   return {code:171,message:"The amount of fee exchange rate assets should not exceed 1000"}
          // }
          // if(helper.getDecimals(cer.base.amount)>8||helper.getDecimals(cer.quote.amount)>8){
          //   return {code:172,message:"precision overflow of fee exchange rate assets"}
          // }

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
              description: description,
              extensions: null
            },
            extensions: null
          };


          if (isBitAsset) {
            operationJSON.bitasset_opts = bitasset_opts;
          }

          return _context11.abrupt('return', dispatch('transactions/_transactionOperations', {
            operations: [{
              op_type: 8,
              type: "asset_create",
              params: operationJSON
            }]
          }, { root: true }));

        case 11:
        case 'end':
          return _context11.stop();
      }
    }
  }, null, undefined);
};

var _createAsset = exports._createAsset = function _callee12(_ref19, params) {
  var dispatch = _ref19.dispatch,
      rootGetters = _ref19.rootGetters;

  var _params$isBitAsset, isBitAsset, assetId, _params$maxSupply, maxSupply, _params$precision, precision, coreExchangeRate, chargeMarketFee, description, bitassetOpts, c_asset, flagBooleans, permissionBooleans, flags, permissions, _params, _bitassetOpts$feedLif, feedLifetimeSec, _bitassetOpts$minimum, minimumFeeds, _bitassetOpts$forceSe, forceSettlementDelaySec, _bitassetOpts$forceSe2, forceSettlementOffsetPercent, _bitassetOpts$maximum, maximumForceSettlementVolume, _bitassetOpts$shortBa, shortBackingAsset;

  return _regenerator2.default.async(function _callee12$(_context12) {
    while (1) {
      switch (_context12.prev = _context12.next) {
        case 0:
          if (_helper2.default.trimParams(params, { description: "" })) {
            _context12.next = 2;
            break;
          }

          return _context12.abrupt('return', { code: 101, message: "Parameter is missing" });

        case 2:
          _params$isBitAsset = params.isBitAsset, isBitAsset = _params$isBitAsset === undefined ? false : _params$isBitAsset, assetId = params.assetId, _params$maxSupply = params.maxSupply, maxSupply = _params$maxSupply === undefined ? 100000 : _params$maxSupply, _params$precision = params.precision, precision = _params$precision === undefined ? 5 : _params$precision, coreExchangeRate = params.coreExchangeRate, chargeMarketFee = params.chargeMarketFee, description = params.description, bitassetOpts = params.bitassetOpts;
          _context12.next = 5;
          return _regenerator2.default.awrap(dispatch("assets/fetchAssets", { assets: [assetId], isOne: true }, { root: true }));

        case 5:
          c_asset = _context12.sent;

          if (!c_asset) {
            _context12.next = 8;
            break;
          }

          return _context12.abrupt('return', { code: 162, message: "The asset already exists" });

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
            // cer: {
            //   quote: {
            //     asset_id: "1.3.0",
            //     amount: 1
            //   },
            //   base: {
            //       asset_id:null,
            //       amount: 1
            //   }
            // },
            isBitAsset: isBitAsset,
            bitasset_opts: {
              feed_lifetime_sec: 60 * 60 * 24,
              minimum_feeds: 1,
              force_settlement_delay_sec: 60 * 60 * 24,
              force_settlement_offset_percent: 1 * _asset_constants2.default.GRAPHENE_1_PERCENT,
              maximum_force_settlement_volume: 20 * _asset_constants2.default.GRAPHENE_1_PERCENT,
              short_backing_asset: "1.3.0"
            },
            description: (0, _stringify2.default)({ main: description, short_name: "", market: "" })
            // if(coreExchangeRate){
            //   _params.cer.quote.amount=coreExchangeRate.quoteAmount||1;
            //   _params.cer.base.amount=coreExchangeRate.baseAmount||1;
            // }

          };
          if (chargeMarketFee) {
            _params.createObject.market_fee_percent = chargeMarketFee.marketFeePercent || 0;
            _params.createObject.max_market_fee = chargeMarketFee.maxMarketFee || 0;
          }

          if (!(bitassetOpts && isBitAsset)) {
            _context12.next = 20;
            break;
          }

          _bitassetOpts$feedLif = bitassetOpts.feedLifetimeSec, feedLifetimeSec = _bitassetOpts$feedLif === undefined ? 60 * 60 * 24 : _bitassetOpts$feedLif, _bitassetOpts$minimum = bitassetOpts.minimumFeeds, minimumFeeds = _bitassetOpts$minimum === undefined ? 1 : _bitassetOpts$minimum, _bitassetOpts$forceSe = bitassetOpts.forceSettlementDelaySec, forceSettlementDelaySec = _bitassetOpts$forceSe === undefined ? 60 * 60 * 24 : _bitassetOpts$forceSe, _bitassetOpts$forceSe2 = bitassetOpts.forceSettlementOffsetPercent, forceSettlementOffsetPercent = _bitassetOpts$forceSe2 === undefined ? 1 * _asset_constants2.default.GRAPHENE_1_PERCENT : _bitassetOpts$forceSe2, _bitassetOpts$maximum = bitassetOpts.maximumForceSettlementVolume, maximumForceSettlementVolume = _bitassetOpts$maximum === undefined ? 20 * _asset_constants2.default.GRAPHENE_1_PERCENT : _bitassetOpts$maximum, _bitassetOpts$shortBa = bitassetOpts.shortBackingAsset, shortBackingAsset = _bitassetOpts$shortBa === undefined ? "1.3.0" : _bitassetOpts$shortBa;

          if (!(!feedLifetimeSec || !minimumFeeds || !forceSettlementDelaySec || !forceSettlementOffsetPercent || !maximumForceSettlementVolume || !shortBackingAsset)) {
            _context12.next = 19;
            break;
          }

          return _context12.abrupt('return', { code: 101, message: "Parameter is missing" });

        case 19:
          _params.bitasset_opts = {
            feed_lifetime_sec: feedLifetimeSec,
            minimum_feeds: minimumFeeds,
            force_settlement_delay_sec: forceSettlementDelaySec,
            force_settlement_offset_percent: forceSettlementOffsetPercent * _asset_constants2.default.GRAPHENE_1_PERCENT,
            maximum_force_settlement_volume: maximumForceSettlementVolume * _asset_constants2.default.GRAPHENE_1_PERCENT,
            short_backing_asset: shortBackingAsset
          };

        case 20:
          return _context12.abrupt('return', dispatch("createAsset", _params));

        case 21:
        case 'end':
          return _context12.stop();
      }
    }
  }, null, undefined);
};

var issueAsset = exports.issueAsset = function issueAsset(_ref20, params) {
  var dispatch = _ref20.dispatch;

  if (!_helper2.default.trimParams(params, { memo: "" })) {
    return { code: 101, message: "Parameter is missing" };
  }
  var toAccount = params.toAccount,
      amount = params.amount,
      memo = params.memo,
      _params$assetId = params.assetId,
      assetId = _params$assetId === undefined ? "" : _params$assetId,
      _params$isEncryption = params.isEncryption,
      isEncryption = _params$isEncryption === undefined ? true : _params$isEncryption;

  assetId = assetId.toUpperCase();
  return dispatch('transactions/_transactionOperations', {
    operations: [{
      op_type: 13,
      type: "asset_issue",
      params: {
        to: toAccount,
        amount: amount,
        asset_id: assetId,
        memo: memo,
        isEncryption: isEncryption
      }
    }]
  }, { root: true });
};

var assetUpdateRestricted = exports.assetUpdateRestricted = function _callee14(_ref21, params) {
  var dispatch = _ref21.dispatch,
      rootGetters = _ref21.rootGetters;

  var _params$assetId2, assetId, _params$isadd, isadd, _params$restrictedTyp, restrictedType, _params$restrictedLis, restrictedList, _params$onlyGetFee2, onlyGetFee, asset_res;

  return _regenerator2.default.async(function _callee14$(_context14) {
    while (1) {
      switch (_context14.prev = _context14.next) {
        case 0:
          if (_helper2.default.trimParams(params, { memo: "" })) {
            _context14.next = 2;
            break;
          }

          return _context14.abrupt('return', { code: 101, message: "Parameter is missing" });

        case 2:
          _params$assetId2 = params.assetId, assetId = _params$assetId2 === undefined ? "1.3.0" : _params$assetId2, _params$isadd = params.isadd, isadd = _params$isadd === undefined ? true : _params$isadd, _params$restrictedTyp = params.restrictedType, restrictedType = _params$restrictedTyp === undefined ? 0 : _params$restrictedTyp, _params$restrictedLis = params.restrictedList, restrictedList = _params$restrictedLis === undefined ? [] : _params$restrictedLis, _params$onlyGetFee2 = params.onlyGetFee, onlyGetFee = _params$onlyGetFee2 === undefined ? false : _params$onlyGetFee2;

          restrictedType = Number(restrictedType);

          if (!isNaN(restrictedType)) {
            _context14.next = 6;
            break;
          }

          return _context14.abrupt('return', { code: 173, message: "restrictedType must be a number" });

        case 6:
          if (Array.isArray(restrictedList)) {
            _context14.next = 8;
            break;
          }

          return _context14.abrupt('return', { code: 174, message: "restricted_list must be a array" });

        case 8:

          assetId = assetId.toUpperCase();
          _context14.next = 11;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(assetId));

        case 11:
          asset_res = _context14.sent;

          if (!(asset_res.code !== 1)) {
            _context14.next = 14;
            break;
          }

          return _context14.abrupt('return', asset_res);

        case 14:
          _context14.next = 16;
          return _regenerator2.default.awrap(_promise2.default.all(restrictedList.map(function _callee13(id) {
            var acc_res, _asset_res;

            return _regenerator2.default.async(function _callee13$(_context13) {
              while (1) {
                switch (_context13.prev = _context13.next) {
                  case 0:
                    if (!(restrictedType == 1 || restrictedType == 2)) {
                      _context13.next = 10;
                      break;
                    }

                    if (!/^1.2.\d+$/.test(id)) {
                      _context13.next = 3;
                      break;
                    }

                    return _context13.abrupt('return', id);

                  case 3:
                    _context13.next = 5;
                    return _regenerator2.default.awrap(_api2.default.Account.getUser(id, true));

                  case 5:
                    acc_res = _context13.sent;

                    if (!(acc_res.code == 1)) {
                      _context13.next = 8;
                      break;
                    }

                    return _context13.abrupt('return', acc_res.data.account.id);

                  case 8:
                    _context13.next = 18;
                    break;

                  case 10:
                    if (!(restrictedType == 3 || restrictedType == 4)) {
                      _context13.next = 18;
                      break;
                    }

                    if (!/^1.3.\d+$/.test(id)) {
                      _context13.next = 13;
                      break;
                    }

                    return _context13.abrupt('return', id);

                  case 13:
                    _context13.next = 15;
                    return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(id));

                  case 15:
                    _asset_res = _context13.sent;

                    if (!(_asset_res.code == 1)) {
                      _context13.next = 18;
                      break;
                    }

                    return _context13.abrupt('return', _asset_res.data.id);

                  case 18:
                    return _context13.abrupt('return', "");

                  case 19:
                  case 'end':
                    return _context13.stop();
                }
              }
            }, null, undefined);
          })));

        case 16:
          restrictedList = _context14.sent;

          restrictedList = restrictedList.filter(function (id) {
            return id != "";
          });

          if (restrictedList.length) {
            _context14.next = 20;
            break;
          }

          return _context14.abrupt('return', { code: 175, message: "Please check the parameter restrictedList" });

        case 20:
          return _context14.abrupt('return', dispatch('transactions/_transactionOperations', {
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
          return _context14.stop();
      }
    }
  }, null, undefined);
};

var queryAssets = exports.queryAssets = function _callee15(_ref22, _ref23) {
  var dispatch = _ref22.dispatch,
      state = _ref22.state,
      commit = _ref22.commit;
  var _ref23$symbol = _ref23.symbol,
      symbol = _ref23$symbol === undefined ? "" : _ref23$symbol,
      _ref23$assetId = _ref23.assetId,
      assetId = _ref23$assetId === undefined ? "" : _ref23$assetId,
      _ref23$simple = _ref23.simple,
      simple = _ref23$simple === undefined ? false : _ref23$simple;
  var assets, lastAsset, symbolRes, r_assets;
  return _regenerator2.default.async(function _callee15$(_context15) {
    while (1) {
      switch (_context15.prev = _context15.next) {
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
            _context15.next = 15;
            break;
          }

          symbol = symbol.trim();
          _context15.next = 7;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(symbol));

        case 7:
          symbolRes = _context15.sent;

          if (!(symbolRes.code != 1)) {
            _context15.next = 10;
            break;
          }

          return _context15.abrupt('return', symbolRes);

        case 10:
          _context15.next = 12;
          return _regenerator2.default.awrap(dispatch("onGetAssetList", { start: symbolRes.data.symbol, count: 1 }));

        case 12:
          state.assetsFetched = state.assetsFetched + 99;
          _context15.next = 25;
          break;

        case 15:
          if (!(assets.size === 0)) {
            _context15.next = 21;
            break;
          }

          _context15.next = 18;
          return _regenerator2.default.awrap(dispatch("onGetAssetList", { start: "A", count: 100 }));

        case 18:
          state.assetsFetched = 100;
          _context15.next = 25;
          break;

        case 21:
          if (!(assets.size >= state.assetsFetched)) {
            _context15.next = 25;
            break;
          }

          _context15.next = 24;
          return _regenerator2.default.awrap(dispatch("onGetAssetList", { start: lastAsset.symbol, count: 100 }));

        case 24:
          state.assetsFetched = state.assetsFetched + 99;

        case 25:

          if (assets.size > state.totalAssets) {
            accountStorage.set("totalAssets", assets.size);
          }

          if (!(state.assetsFetched >= state.totalAssets - 100)) {
            _context15.next = 28;
            break;
          }

          return _context15.abrupt('return', { code: 1, data: state.assets.toJS() });

        case 28:
          if (!(assets.size < state.assetsFetched)) {
            _context15.next = 39;
            break;
          }

          _context15.next = 31;
          return _regenerator2.default.awrap(dispatch("formatAssets", {
            assets: state.assets_arr,
            simple: simple
          }));

        case 31:
          r_assets = _context15.sent;


          commit(types.FETCH_ASSETS_COMPLETE, { assets: (0, _utils.arrayToObject)(r_assets) });

          state.assetsFetched = 0;
          state.assets_arr = [];
          state.assets = _immutable2.default.fromJS([]);
          return _context15.abrupt('return', { code: 1, data: r_assets });

        case 39:
          dispatch("queryAssets", { symbol: "" });

        case 40:
        case 'end':
          return _context15.stop();
      }
    }
  }, null, undefined);
};

var formatAssets = exports.formatAssets = function _callee16(_ref24, _ref25) {
  var dispatch = _ref24.dispatch;
  var assets = _ref25.assets,
      _ref25$simple = _ref25.simple,
      simple = _ref25$simple === undefined ? false : _ref25$simple;

  var r_assets, issuer_res, i, _assets$i, issuer, dynamic, precision, id, symbol, options, bitasset_data_id, dynamic_asset_data_id, core_exchange_rate, description, market_fee_percent, max_market_fee, max_supply, flags, issuer_permissions, whitelist_authorities, whitelist_markets, blacklist_authorities, blacklist_markets, base, quote, base_asset, quote_asset, bitasset_data, _bitasset_data$curren, _base, _quote, _base_asset, _quote_asset, asset_item, permissionBooleans;

  return _regenerator2.default.async(function _callee16$(_context16) {
    while (1) {
      switch (_context16.prev = _context16.next) {
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
          i = 0;

        case 4:
          if (!(i < assets.length)) {
            _context16.next = 41;
            break;
          }

          _assets$i = assets[i], issuer = _assets$i.issuer, dynamic = _assets$i.dynamic, precision = _assets$i.precision, id = _assets$i.id, symbol = _assets$i.symbol, options = _assets$i.options, bitasset_data_id = _assets$i.bitasset_data_id, dynamic_asset_data_id = _assets$i.dynamic_asset_data_id;
          core_exchange_rate = options.core_exchange_rate, description = options.description, market_fee_percent = options.market_fee_percent, max_market_fee = options.max_market_fee, max_supply = options.max_supply, flags = options.flags, issuer_permissions = options.issuer_permissions, whitelist_authorities = options.whitelist_authorities, whitelist_markets = options.whitelist_markets, blacklist_authorities = options.blacklist_authorities, blacklist_markets = options.blacklist_markets;
          _context16.next = 9;
          return _regenerator2.default.awrap(dispatch("user/getUserInfo", { account: issuer, isCache: true }, { root: true }));

        case 9:
          issuer_res = _context16.sent;

          if (!core_exchange_rate) {
            _context16.next = 19;
            break;
          }

          base = core_exchange_rate.base, quote = core_exchange_rate.quote;
          _context16.next = 14;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(base.asset_id));

        case 14:
          base_asset = _context16.sent.data;
          _context16.next = 17;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(quote.asset_id));

        case 17:
          quote_asset = _context16.sent.data;


          core_exchange_rate.text = (_helper2.default.formatAmount(quote.amount, quote_asset.precision) || 1) / _helper2.default.formatAmount(base.amount, base_asset.precision) + " " + quote_asset.symbol + "/" + base_asset.symbol;

        case 19:
          bitasset_data = assets[i].bitasset_data;
          // console.info("bitasset_data",bitasset_data);

          if (!bitasset_data) {
            _context16.next = 30;
            break;
          }

          _bitasset_data$curren = bitasset_data.current_feed.settlement_price, _base = _bitasset_data$curren.base, _quote = _bitasset_data$curren.quote;
          _context16.next = 24;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(_base.asset_id));

        case 24:
          _base_asset = _context16.sent.data;
          _context16.next = 27;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(_quote.asset_id));

        case 27:
          _quote_asset = _context16.sent.data;


          assets[i].bitasset_data.format_feed_price = _utils3.default.format_price(bitasset_data.current_feed.settlement_price.quote.amount, _quote_asset, bitasset_data.current_feed.settlement_price.base.amount, _base_asset, true, true, false);
          assets[i].bitasset_data.format_feed_price_text = _utils3.default.format_price(bitasset_data.current_feed.settlement_price.quote.amount, _quote_asset, bitasset_data.current_feed.settlement_price.base.amount, _base_asset, false, true, false);

        case 30:
          asset_item = void 0;

          _bcxjsCores.ChainStore.getAsset(id);
          _bcxjsCores.ChainStore.getObject(dynamic_asset_data_id);

          flags = _asset_utils2.default.getFlagBooleans(flags, !!bitasset_data_id //whether it's a smart asset
          );
          if (simple) {
            asset_item = {
              id: id,
              dynamic_asset_data_id: dynamic_asset_data_id,
              issuer: issuer,
              issuer_name: issuer_res.code == 1 && issuer_res.data ? issuer_res.data.account.name : "",
              precision: precision,
              symbol: symbol,
              dynamic: {
                current_supply: _helper2.default.formatAmount(dynamic.current_supply, precision),
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

            asset_item = {
              bitasset_data: assets[i].bitasset_data,
              bitasset_data_id: bitasset_data_id,
              dynamic_asset_data_id: dynamic_asset_data_id,
              dynamic: {
                current_supply: _helper2.default.formatAmount(dynamic.current_supply, precision),
                accumulated_fees: _helper2.default.formatAmount(dynamic.accumulated_fees, precision)
              },
              id: id,
              issuer: issuer,
              issuer_name: issuer_res.data.account.name,
              options: {
                description: "",
                flags: flags,
                permissionBooleans: permissionBooleans,
                market_fee_percent: market_fee_percent / 100,
                max_market_fee: _helper2.default.formatAmount(max_market_fee, precision),
                max_supply: _helper2.default.formatAmount(max_supply, precision)
              },
              precision: precision,
              symbol: symbol
              //charge_market_fee
            };
          }
          if (core_exchange_rate) {
            asset_item.options.core_exchange_rate = core_exchange_rate;
          }
          try {
            if (description) asset_item.description = JSON.parse(description).main;
          } catch (e) {}

          r_assets.push(asset_item);

        case 38:
          i++;
          _context16.next = 4;
          break;

        case 41:
          return _context16.abrupt('return', JSON.parse((0, _stringify2.default)(r_assets)));

        case 42:
        case 'end':
          return _context16.stop();
      }
    }
  }, null, undefined);
};

var onGetAssetList = exports.onGetAssetList = function _callee17(_ref26, _ref27) {
  var dispatch = _ref26.dispatch,
      state = _ref26.state;
  var start = _ref27.start,
      count = _ref27.count;
  var payload;
  return _regenerator2.default.async(function _callee17$(_context17) {
    while (1) {
      switch (_context17.prev = _context17.next) {
        case 0:
          _context17.next = 2;
          return _regenerator2.default.awrap(_api2.default.Assets.getAssetList(start, count));

        case 2:
          payload = _context17.sent;

          if (payload) {
            _context17.next = 5;
            break;
          }

          return _context17.abrupt('return', false);

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
          return _context17.stop();
      }
    }
  }, null, undefined);
};

var queryAssetRestricted = exports.queryAssetRestricted = function _callee19(_ref28, _ref29) {
  var dispatch = _ref28.dispatch;
  var assetId = _ref29.assetId,
      restrictedType = _ref29.restrictedType;
  var asset_res, res;
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
          _context19.next = 8;
          return _regenerator2.default.awrap(_api2.default.Assets.list_asset_restricted_objects(asset_res.data.id, restrictedType));

        case 8:
          res = _context19.sent;

          if (!(res.code == 1)) {
            _context19.next = 13;
            break;
          }

          _context19.next = 12;
          return _regenerator2.default.awrap(_promise2.default.all(res.data.map(function _callee18(item) {
            var r_id, _data$account, _id, name, _data, _id2, _symbol;

            return _regenerator2.default.async(function _callee18$(_context18) {
              while (1) {
                switch (_context18.prev = _context18.next) {
                  case 0:
                    // item.symbol=asset_res.data.symbol;
                    r_id = item.restricted_id;

                    if (!/^1.2.\d+$/.test(r_id)) {
                      _context18.next = 11;
                      break;
                    }

                    _context18.next = 4;
                    return _regenerator2.default.awrap(_api2.default.Account.getAccount(r_id));

                  case 4:
                    _data$account = _context18.sent.data.account;
                    _id = _data$account.id;
                    name = _data$account.name;

                    item.restricted_account_id = _id;
                    item.restricted_account_name = name;
                    _context18.next = 19;
                    break;

                  case 11:
                    if (!/^1.3.\d+/.test(r_id)) {
                      _context18.next = 19;
                      break;
                    }

                    _context18.next = 14;
                    return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(r_id));

                  case 14:
                    _data = _context18.sent.data;
                    _id2 = _data.id;
                    _symbol = _data.symbol;

                    item.restricted_asset_id = _id2;
                    item.restricted_asset_symbol = _symbol;

                  case 19:
                    return _context18.abrupt('return', item);

                  case 20:
                  case 'end':
                    return _context18.stop();
                }
              }
            }, null, undefined);
          })));

        case 12:
          res.data = _context19.sent;

        case 13:
          return _context19.abrupt('return', res);

        case 14:
        case 'end':
          return _context19.stop();
      }
    }
  }, null, undefined);
};

var assetPublishFeed = exports.assetPublishFeed = function _callee20(_ref30, params) {
  var dispatch = _ref30.dispatch,
      rootGetters = _ref30.rootGetters;

  var assetId, price, maintenanceCollateralRatio, maximumShortSqueezeRatio, coreExchangeRate, onlyGetFee, asset_res, _asset_res$data, id, precision, options, price_feed;

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
          assetId = params.assetId, price = params.price, maintenanceCollateralRatio = params.maintenanceCollateralRatio, maximumShortSqueezeRatio = params.maximumShortSqueezeRatio, coreExchangeRate = params.coreExchangeRate, onlyGetFee = params.onlyGetFee;


          assetId = assetId.toUpperCase();
          _context20.next = 6;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(assetId));

        case 6:
          asset_res = _context20.sent;

          if (!(asset_res.code !== 1)) {
            _context20.next = 9;
            break;
          }

          return _context20.abrupt('return', asset_res);

        case 9:
          _asset_res$data = asset_res.data, id = _asset_res$data.id, precision = _asset_res$data.precision, options = _asset_res$data.options;

          // let core_exchange_rate=options.core_exchange_rate;
          // if(coreExchangeRate.baseAmount){
          //   let cr_base_asset =(await API.Assets.fetch([core_exchange_rate.base.asset_id]))[0]
          //   let cr_base_precision = utils.get_asset_precision(
          //       cr_base_asset.precision
          //   );
          //   core_exchange_rate.base.amount = new big(coreExchangeRate.baseAmount)
          //   .times(cr_base_precision)
          //   .toString();

          // } 
          // if(coreExchangeRate.quoteAmount){
          //   let cr_quote_asset =(await API.Assets.fetch([core_exchange_rate.quote.asset_id]))[0];
          //   let cr_quote_precision = utils.get_asset_precision(
          //       cr_quote_asset.precision
          //   );
          //   core_exchange_rate.quote.amount=new big(coreExchangeRate.quoteAmount)
          //   .times(cr_quote_precision)
          //   .toString();
          // } 

          _context20.t0 = {
            amount: _helper2.default.getFullNum(1 * Math.pow(10, precision)),
            asset_id: id
          };
          _context20.next = 13;
          return _regenerator2.default.awrap(_helper2.default.toOpAmount(price, "1.3.0"));

        case 13:
          _context20.t1 = _context20.sent.data;
          _context20.t2 = {
            base: _context20.t0,
            quote: _context20.t1
          };
          _context20.t3 = Number((maintenanceCollateralRatio * 1000).toFixed(0));
          _context20.t4 = Number((maximumShortSqueezeRatio * 1000).toFixed(0));
          price_feed = {
            settlement_price: _context20.t2,
            maintenance_collateral_ratio: _context20.t3,
            maximum_short_squeeze_ratio: _context20.t4
          };
          return _context20.abrupt('return', dispatch('transactions/_transactionOperations', {
            operations: [{
              op_type: 17,
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

        case 19:
        case 'end':
          return _context20.stop();
      }
    }
  }, null, undefined);
};

var assetUpdateFeedProducers = exports.assetUpdateFeedProducers = function _callee21(_ref31, _ref32) {
  var dispatch = _ref31.dispatch,
      rootGetters = _ref31.rootGetters;
  var assetId = _ref32.assetId,
      newFeedProducers = _ref32.newFeedProducers,
      onlyGetFee = _ref32.onlyGetFee;
  var asset_res;
  return _regenerator2.default.async(function _callee21$(_context21) {
    while (1) {
      switch (_context21.prev = _context21.next) {
        case 0:
          assetId = assetId.toUpperCase();
          _context21.next = 3;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(assetId));

        case 3:
          asset_res = _context21.sent;

          if (!(asset_res.code !== 1)) {
            _context21.next = 6;
            break;
          }

          return _context21.abrupt('return', asset_res);

        case 6:
          return _context21.abrupt('return', dispatch('transactions/_transactionOperations', {
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
          return _context21.stop();
      }
    }
  }, null, undefined);
};

var assetGlobalSettle = exports.assetGlobalSettle = function _callee22(_ref33, params) {
  var dispatch = _ref33.dispatch,
      rootGetters = _ref33.rootGetters;

  var assetId, price, onlyGetFee, asset_res, _asset_res$data2, id, precision;

  return _regenerator2.default.async(function _callee22$(_context22) {
    while (1) {
      switch (_context22.prev = _context22.next) {
        case 0:
          if (_helper2.default.trimParams(params)) {
            _context22.next = 2;
            break;
          }

          return _context22.abrupt('return', { code: 101, message: "Parameter is missing" });

        case 2:
          assetId = params.assetId, price = params.price, onlyGetFee = params.onlyGetFee;

          if (!isNaN(Number(price))) {
            _context22.next = 5;
            break;
          }

          return _context22.abrupt('return', { code: 135, message: "Please check parameter data type" });

        case 5:
          assetId = assetId.toUpperCase();
          _context22.next = 8;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(assetId));

        case 8:
          asset_res = _context22.sent;

          if (!(asset_res.code !== 1)) {
            _context22.next = 11;
            break;
          }

          return _context22.abrupt('return', asset_res);

        case 11:
          _asset_res$data2 = asset_res.data, id = _asset_res$data2.id, precision = _asset_res$data2.precision;
          _context22.t0 = dispatch;
          _context22.t1 = rootGetters['account/getAccountUserId'];
          _context22.t2 = id;
          _context22.t3 = {
            amount: 1 * Math.pow(10, precision),
            asset_id: id
          };
          _context22.t4 = price;
          _context22.t5 = Math;
          _context22.next = 20;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one("1.3.0"));

        case 20:
          _context22.t6 = _context22.sent.data.precision;
          _context22.t7 = _context22.t5.pow.call(_context22.t5, 10, _context22.t6);
          _context22.t8 = _context22.t4 * _context22.t7;
          _context22.t9 = {
            amount: _context22.t8,
            asset_id: "1.3.0"
          };
          _context22.t10 = {
            base: _context22.t3,
            quote: _context22.t9
          };
          _context22.t11 = [];
          _context22.t12 = {
            issuer: _context22.t1,
            asset_to_settle: _context22.t2,
            settle_price: _context22.t10,
            extensions: _context22.t11
          };
          _context22.t13 = {
            op_type: 17,
            type: "asset_global_settle",
            params: _context22.t12
          };
          _context22.t14 = [_context22.t13];
          _context22.t15 = onlyGetFee;
          _context22.t16 = {
            operations: _context22.t14,
            onlyGetFee: _context22.t15
          };
          _context22.t17 = { root: true };
          return _context22.abrupt('return', (0, _context22.t0)('transactions/_transactionOperations', _context22.t16, _context22.t17));

        case 33:
        case 'end':
          return _context22.stop();
      }
    }
  }, null, undefined);
};

var assetSettle = exports.assetSettle = function _callee23(_ref34, params) {
  var dispatch = _ref34.dispatch,
      rootGetters = _ref34.rootGetters;
  var assetId, amount, onlyGetFee, asset_res;
  return _regenerator2.default.async(function _callee23$(_context23) {
    while (1) {
      switch (_context23.prev = _context23.next) {
        case 0:
          if (_helper2.default.trimParams(params)) {
            _context23.next = 2;
            break;
          }

          return _context23.abrupt('return', { code: 101, message: "Parameter is missing" });

        case 2:
          assetId = params.assetId, amount = params.amount, onlyGetFee = params.onlyGetFee;

          if (!isNaN(Number(amount))) {
            _context23.next = 5;
            break;
          }

          return _context23.abrupt('return', { code: 135, message: "Please check parameter data type" });

        case 5:
          assetId = assetId.toUpperCase();
          _context23.next = 8;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch_asset_one(assetId));

        case 8:
          asset_res = _context23.sent;

          if (!(asset_res.code !== 1)) {
            _context23.next = 11;
            break;
          }

          return _context23.abrupt('return', asset_res);

        case 11:
          _context23.t0 = dispatch;
          _context23.t1 = rootGetters['account/getAccountUserId'];
          _context23.next = 15;
          return _regenerator2.default.awrap(_helper2.default.toOpAmount(amount, asset_res.data));

        case 15:
          _context23.t2 = _context23.sent.data;
          _context23.t3 = [];
          _context23.t4 = {
            account: _context23.t1,
            amount: _context23.t2,
            extensions: _context23.t3
          };
          _context23.t5 = {
            op_type: 16,
            type: "asset_settle",
            params: _context23.t4
          };
          _context23.t6 = [_context23.t5];
          _context23.t7 = onlyGetFee;
          _context23.t8 = {
            operations: _context23.t6,
            onlyGetFee: _context23.t7
          };
          _context23.t9 = { root: true };
          return _context23.abrupt('return', (0, _context23.t0)('transactions/_transactionOperations', _context23.t8, _context23.t9));

        case 24:
        case 'end':
          return _context23.stop();
      }
    }
  }, null, undefined);
};

var updateCollateralForGas = exports.updateCollateralForGas = function _callee24(_ref35, params) {
  var dispatch = _ref35.dispatch,
      rootGetters = _ref35.rootGetters;

  var mortgager, beneficiary, amount, _params$isPropose, isPropose, mortgager_res, beneficiary_res, core_asset, proposeAccount;

  return _regenerator2.default.async(function _callee24$(_context24) {
    while (1) {
      switch (_context24.prev = _context24.next) {
        case 0:
          if (_helper2.default.trimParams(params, { mortgager: "" })) {
            _context24.next = 2;
            break;
          }

          return _context24.abrupt('return', { code: 101, message: "Parameter is missing" });

        case 2:
          mortgager = params.mortgager, beneficiary = params.beneficiary, amount = params.amount, _params$isPropose = params.isPropose, isPropose = _params$isPropose === undefined ? false : _params$isPropose;

          if (mortgager) {
            _context24.next = 7;
            break;
          }

          mortgager = rootGetters["account/getAccountUserId"];
          _context24.next = 13;
          break;

        case 7:
          _context24.next = 9;
          return _regenerator2.default.awrap(dispatch("user/getUserInfo", { account: mortgager, isCache: true }, { root: true }));

        case 9:
          mortgager_res = _context24.sent;

          if (!(mortgager_res.code != 1)) {
            _context24.next = 12;
            break;
          }

          return _context24.abrupt('return', mortgager_res);

        case 12:
          mortgager = mortgager_res.data.account.id;

        case 13:
          _context24.next = 15;
          return _regenerator2.default.awrap(dispatch("user/getUserInfo", { account: beneficiary, isCache: true }, { root: true }));

        case 15:
          beneficiary_res = _context24.sent;

          if (!(beneficiary_res.code != 1)) {
            _context24.next = 18;
            break;
          }

          return _context24.abrupt('return', beneficiary_res);

        case 18:
          beneficiary = beneficiary_res.data.account.id;

          if (!isNaN(Number(amount))) {
            _context24.next = 21;
            break;
          }

          return _context24.abrupt('return', { code: 135, message: "Please check parameter data type" });

        case 21:
          _context24.next = 23;
          return _regenerator2.default.awrap(_api2.default.Assets.fetch(["1.3.0"], true));

        case 23:
          core_asset = _context24.sent;
          _context24.next = 26;
          return _regenerator2.default.awrap(_helper2.default.toOpAmount(amount, core_asset));

        case 26:
          amount = _context24.sent.data.amount;
          proposeAccount = "";

          if (isPropose) {
            proposeAccount = rootGetters["account/getAccountUserId"];
          }
          return _context24.abrupt('return', dispatch('transactions/_transactionOperations', {
            operations: [{
              op_type: 54,
              type: "update_collateral_for_gas",
              params: {
                mortgager: mortgager,
                beneficiary: beneficiary,
                collateral: amount
              }
            }],
            proposeAccount: proposeAccount
          }, { root: true }));

        case 30:
        case 'end':
          return _context24.stop();
      }
    }
  }, null, undefined);
};