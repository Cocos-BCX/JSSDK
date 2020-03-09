'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _mutations;

var _vue = require('vue');

var _vue2 = _interopRequireDefault(_vue);

var _mutations2 = require('../mutations');

var types = _interopRequireWildcard(_mutations2);

var _api = require('../services/api');

var _api2 = _interopRequireDefault(_api);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var actions = {
  fetch: function fetch(store, _ref) {
    var assetsIds = _ref.assetsIds,
        baseId = _ref.baseId,
        days = _ref.days;
    var commit = store.commit,
        rootGetters = store.rootGetters;

    var assets = rootGetters['assets/getAssets'];
    var baseAsset = assets[baseId];

    commit(types.FETCH_PRICES_HISTORY_REQUEST, { baseId: baseId });
    _promise2.default.all(assetsIds.map(function _callee(assetId) {
      var prices;
      return _regenerator2.default.async(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return _regenerator2.default.awrap(_api2.default.Assets.fetchPriceHistory(baseAsset, assets[assetId], days));

            case 2:
              prices = _context.sent;

              if (prices) {
                _context.next = 5;
                break;
              }

              throw new Error('error market history');

            case 5:
              return _context.abrupt('return', {
                assetId: assetId,
                prices: prices
              });

            case 6:
            case 'end':
              return _context.stop();
          }
        }
      }, null, undefined);
    })).then(function (pricesObjects) {
      var prices = pricesObjects.reduce(function (result, obj) {
        result[obj.assetId] = obj.prices;
        return result;
      }, {});
      // console.info('prices',prices);
      commit(types.FETCH_PRICES_HISTORY_COMPLETE, { days: days, prices: prices });
    }).catch(function (err) {
      commit(types.FETCH_PRICES_HISTORY_ERROR);
      console.log(err);
    });
  }
};

var getters = {
  getByDay: function getByDay(state) {
    return function (days) {
      return state.days[days] || {};
    };
  },
  isFetching: function isFetching(state) {
    return state.fetching;
  },
  getAssetHistoryByDay: function getAssetHistoryByDay(state) {
    return function (id, day) {
      if (!state.days[day]) return { first: 0, last: 0 };
      return state.days[day][id] || { first: 0, last: 0 };
    };
  },
  getHistoryAssetMultiplier: function getHistoryAssetMultiplier(state) {
    return function (days, assetId) {
      if (!state.days[days] || !state.days[days][assetId]) {
        return {
          first: 0,
          last: 0
        };
      }
      return {
        first: 1 / state.days[days][assetId].first,
        last: 1 / state.days[days][assetId].last
      };
    };
  }
};

var initialState = {
  days: {},
  fetching: false,
  error: false,
  baseId: ''
};

var mutations = (_mutations = {}, (0, _defineProperty3.default)(_mutations, types.FETCH_PRICES_HISTORY_REQUEST, function (state, _ref2) {
  var baseId = _ref2.baseId;

  state.fetching = true;
  state.baseAssetId = baseId;
}), (0, _defineProperty3.default)(_mutations, types.FETCH_PRICES_HISTORY_COMPLETE, function (state, _ref3) {
  var prices = _ref3.prices,
      days = _ref3.days;

  state.fetching = false;
  _vue2.default.set(state.days, days, prices);
}), (0, _defineProperty3.default)(_mutations, types.FETCH_PRICES_HISTORY_ERROR, function (state) {
  state.fetching = false;
  state.error = true;
}), _mutations);

exports.default = {
  state: initialState,
  actions: actions,
  getters: getters,
  mutations: mutations,
  namespaced: true
};