"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAssets = getAssets;
exports.getAssetsArr = getAssetsArr;
exports.getDefaultAssetsIds = getDefaultAssetsIds;
exports.getAssetById = getAssetById;
/**
 * Returns object with all assets
 */
function getAssets(_ref) {
  var cache_assets = _ref.cache_assets;

  return cache_assets || {};
}

function getAssetsArr(_ref2) {
  var cache_assets = _ref2.cache_assets;

  var assets = [];
  for (var key in cache_assets) {
    if (/^1.3.(\d+)$/.test(key)) {
      assets.push(cache_assets[key]);
    }
  }
  return assets;
}

/**
 * Returns array with default assets ids
 */
function getDefaultAssetsIds(_ref3) {
  var defaultAssetsIds = _ref3.defaultAssetsIds;

  return defaultAssetsIds;
}

/**
 * Returns function to get asset by id
 */
function getAssetById(state) {
  var cache_assets = state.cache_assets;

  return function (id) {
    return cache_assets && cache_assets[id] ? cache_assets[id] : null;
  };
}