/**
 * Returns object with all assets
 */
export function getAssets({ cache_assets }) {
  return cache_assets || {};
}

export function getAssetsArr({ cache_assets }) {
    let assets=[];
    for(let key in cache_assets){
        if(/^1.3.(\d+)$/.test(key)){
            assets.push(cache_assets[key]);
        }
    }
    return assets;
}

/**
 * Returns array with default assets ids
 */
export function getDefaultAssetsIds({ defaultAssetsIds }) {
  return defaultAssetsIds;
}

/**
 * Returns function to get asset by id
 */
export function getAssetById(state) {
  let {cache_assets}=state;
  return (id) => {
    return ((cache_assets && cache_assets[id]) ? cache_assets[id] :null);
  }
}
