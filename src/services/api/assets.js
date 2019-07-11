import { Apis } from 'bcxjs-ws';
import * as utils from '../../utils';
import {ChainStore} from "bcxjs-cores";

let inProgress = {};
let _assets={};
/**
 * Fetches array of assets from bcxjs-ws
 */
const fetch = async (assets,cacheAndOne=false) => {
  if(!assets||!assets[0]){
    return null;
  }
  if(cacheAndOne){
      if(_assets[assets[0]])  return  _assets[assets[0]];
  }
  
  try {
    let result = await Apis.instance().db_api().exec('lookup_asset_symbols', [assets]);
    result=result.filter(item=>item!=null)

    if(cacheAndOne){
        if(result.length){
          _assets[result[0].id]=result[0];
          return result[0];
        }
        return null;
    }
    
    return result;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const fetch_asset_one = async (asset_id) => {
    if(_assets[asset_id]){
        return {code:1,data:_assets[asset_id]};
    }
    try {
      let result = await Apis.instance().db_api().exec('lookup_asset_symbols', [[asset_id]]);
      if(!result[0]){
        return {code:115,message: "There is no asset "+asset_id+" on block chain", error: "There is no asset "+asset_id+" on block chain"};
      }
     _assets[result[0].id]=result[0];
     return {code:1,data:result[0]};
    } catch (error) {
      console.log(error);
      return null;
    }
  };


  const fetch_asset_by_cache=(asset_id)=>{
    return _assets[asset_id];
  }

  const fetch_all_assets=()=>{
    return _assets;
  }
/**
 * Returns prices bistory between base and quote assets from the last specified number of days
 * @param {Object} base - base asset object
 * @param {Object} quote - quote asset object
 * @param {number} days - number of days
 */
const fetchPriceHistory = async (base, quote, days) => {
  try {
    const bucketSize = 3600*24;
    let endDate = new Date();
    const startDate = new Date(endDate - (1000 * 60 * 60 * 24 * days));
    const endDateISO = endDate.toISOString().slice(0, -5);
    const startDateISO = startDate.toISOString().slice(0, -5);

    endDate.setDate(endDate.getDate() + 1);
    const history = await Apis.instance().history_api().exec(
      'get_market_history',
      [base.id, quote.id, bucketSize, startDateISO, endDateISO]
    );
    const prices = utils.formatPrices(utils.getPrices(history), base, quote);
    return [
      history, 
      await Apis.instance().history_api().exec("get_fill_order_history", [base.id, quote.id, 1])
    ];
    // const prices = utils.formatPrices(utils.getPrices(history), base, quote);
    // return prices;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const getAssetList=(start,count)=>{
   let id = start + "_" + count;
     if (!inProgress[id]) {
      inProgress[id] = true;
      return Apis.instance()
          .db_api()
          .exec("list_assets", [start, count])
          .then(assets => {
              let bitAssetIDS = [];
              let dynamicIDS = [];

              assets.forEach(asset => {
                  ChainStore._updateObject(asset, false);
                  dynamicIDS.push(asset.dynamic_asset_data_id);

                  if (asset.bitasset_data_id) {
                      bitAssetIDS.push(asset.bitasset_data_id);
                  }
              });

              let dynamicPromise = Apis.instance()
                  .db_api()
                  .exec("get_objects", [dynamicIDS]);

              let bitAssetPromise =
                  bitAssetIDS.length > 0
                      ? Apis.instance()
                            .db_api()
                            .exec("get_objects", [bitAssetIDS])
                      : null;

              return Promise.all([dynamicPromise, bitAssetPromise]).then(
                  results => {
                      delete inProgress[id];
                    //   console.info("dispatch assets",{
                    //       assets: assets,
                    //       dynamic: results[0],
                    //       bitasset_data: results[1],
                    //       loading: false
                    //   })
                      return {
                        assets: assets,
                        dynamic: results[0],
                        bitasset_data: results[1],
                        //loading: false
                     }
                      //return assets && assets.length;
                  }
              );
          })
          .catch(error => {
              console.log(
                  "Error in AssetActions.getAssetList: ",
                  error
              );
              delete inProgress[id];
              return {code:161,message:"Error in AssetActions.getAssetList",error};
          });
    }
}

const list_asset_restricted_objects=async (asset_id,restricted_type)=>{
  try{
      const response=await Apis.instance().db_api().exec('list_asset_restricted_objects', [asset_id,restricted_type]);
      if(response){
          return {code:1,data:response};
      }
      return {
          code: 104,
          message:'not found'
      };
  } catch(error){
      return {
          code:0,
          message:error.message,
          error
      }
  }
}
export default {
  fetch,
  fetch_asset_one,
  fetch_asset_by_cache,
  fetch_all_assets,
  list_asset_restricted_objects,
  fetchPriceHistory,
  getAssetList
};
