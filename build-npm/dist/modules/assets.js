'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _mutations;

var _vue = require('vue');

var _vue2 = _interopRequireDefault(_vue);

var _mutations2 = require('../mutations');

var types = _interopRequireWildcard(_mutations2);

var _assets = require('../actions/assets');

var actions = _interopRequireWildcard(_assets);

var _assets2 = require('../getters/assets');

var getters = _interopRequireWildcard(_assets2);

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

var _localStorage = require('../lib/common/localStorage');

var _localStorage2 = _interopRequireDefault(_localStorage);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var STORAGE_KEY = "__gph__";

var accountStorage = null;
try {
  accountStorage = new _localStorage2.default(STORAGE_KEY);
} catch (e) {}
var initialState = {
  defaultAssetsIds: [],
  assets: _immutable2.default.fromJS({}),
  assets_arr: [],
  asset_symbol_to_id: {},
  cache_assets: {},
  pending: false,
  assetsFetched: 0,
  totalAssets: process.browser || true ? accountStorage && (0, _typeof3.default)(accountStorage.get("totalAssets")) != "object" ? accountStorage.get("totalAssets") : 3000 : 300
};

var mutations = (_mutations = {}, (0, _defineProperty3.default)(_mutations, types.FETCH_ASSETS_REQUEST, function (state) {
  state.pending = true;
}), (0, _defineProperty3.default)(_mutations, types.FETCH_ASSETS_COMPLETE, function (state, _ref) {
  var assets = _ref.assets;

  (0, _keys2.default)(assets).forEach(function (id) {
    _vue2.default.set(state.cache_assets, id, assets[id]);
  });
  // state.pending = false;
}), (0, _defineProperty3.default)(_mutations, types.FETCH_ASSETS_ERROR, function (state) {
  state.pending = false;
}), (0, _defineProperty3.default)(_mutations, types.SAVE_DEFAULT_ASSETS_IDS, function (state, _ref2) {
  var ids = _ref2.ids;

  state.defaultAssetsIds = ids;
}), (0, _defineProperty3.default)(_mutations, types.SET_ASSETS, function (state, assets) {
  state.cache_assets = assets;
}), _mutations);

exports.default = {
  state: initialState,
  actions: actions,
  mutations: mutations,
  getters: getters,
  namespaced: true
};