import * as types from '../mutations';
import API from '../services/api';
import {arrayToObject } from '../utils';
import utils from "../lib/common/utils";
import helper from "../lib/common/helper";
import assetConstants from "../lib/chain/asset_constants";

import assetUtils from "../lib/common/asset_utils";
import {ChainStore} from "bcxjs-cores";
import Immutable from "immutable";
import big from "bignumber.js";


export const fetchAssets = async (store, {assets,isOne=false,isCache=true}) => {
  const { commit, getters,rootGetters } = store;
  let composedResult=[];

  const currentAssetsIds = Object.keys(getters.getAssets);
  const filteredAssets = assets.filter(id => {//Get the collection of requested assets not in cache.
    if(currentAssetsIds.indexOf(id)>=0){//if current asset is in cache.
      composedResult.push(getters.getAssets[id])
    }else{
      return true; //Requested asset didn't exists in cache.
    }
  });

  if(isCache&&filteredAssets.length==0){//All the requested assets are existing in cache.
      composedResult = arrayToObject(composedResult);
      if(isOne) return composedResult[assets[0]]
      return composedResult;
  }

  commit(types.FETCH_ASSETS_REQUEST);
 //If it is a cache request, only requests the assets didn't exist in cache
  const result = await API.Assets.fetch(isCache?filteredAssets:assets);
  if (result&&result.length) {
      //If it is a cache request, then merge request assets into cached assets, else return the requested asset.
      composedResult =isCache?result.concat(composedResult):result;
  }

  if(composedResult.length){
    composedResult=arrayToObject(composedResult)
    commit(types.FETCH_ASSETS_COMPLETE, { assets: composedResult });
    if(isOne) return composedResult[assets[0]]||null;
    return composedResult;
  }


  commit(types.FETCH_ASSETS_ERROR);
  return null;
};


export const fetchDefaultAssets = async (store) => {
  const { commit,rootGetters } = store;
  const { defaultAssetsNames } = rootGetters["setting/g_settingsAPIs"];
  const assets = await fetchAssets(store, { assets: defaultAssetsNames });
  if (assets) {
    const ids = Object.keys(assets);
    commit(types.SAVE_DEFAULT_ASSETS_IDS, { ids });
  }

  return assets;
};

export const set_assets=({commit},assets)=>{
  commit(types.SET_ASSETS,assets);
}

export const getTransactionBaseFee=async ({dispatch},{transactionType,feeAssetId="1.3.0",isCache=true})=>{
  if(!transactionType){
    return {code:128,message:"Parameter 'transactionType' can not be empty"};
  }
  let globalObject =await API.Explorer.getGlobalObject();
  if(globalObject.code!=1){
    return globalObject;
  }
  globalObject=globalObject.data;
  try{
    const feeAsset=await dispatch("fetchAssets",{assets:[feeAssetId],isOne:true,isCache});
    const coreAsset=await dispatch("fetchAssets",{assets:["1.3.0"],isOne:true});

    // let fee =helper.getFullNum(utils.estimateFee(transactionType, null, globalObject)/Math.pow(10,coreAsset.precision));
    // console.info('globalObject',globalObject);
    let fee=helper.getFullNum(utils.getFee(transactionType,feeAsset,coreAsset,globalObject).getAmount({real:true}));
    return {code:1,data:{
      fee_amount:fee,
      fee_symbol:feeAsset.symbol
    }};
  }catch(e){
    return {code:0,message:e.message};
  }
}

export const updateAsset=async ({dispatch},{issuer,
  new_issuer,
  update,
  core_exchange_rate,
  asset,
  flags,
  permissions,
  isBitAsset,
  bitasset_opts,
  original_bitasset_opts,
  description,
  // auths,
  feedProducers,
  originalFeedProducers,
  onlyGetFee,
  callback,
  assetChanged})=>{
    let quotePrecision = utils.get_asset_precision(
       asset.get("precision")
     );
     
    big.config({DECIMAL_PLACES: asset.get("precision")});
    // let max_supply = new big(update.max_supply)
    //     .times(quotePrecision)
    //     .toString();
    let max_market_fee = new big(update.max_market_fee || 0)
        .times(quotePrecision)
        .toString();

    let cr_quote_asset =(await API.Assets.fetch([core_exchange_rate.quote.asset_id]))[0];
    let cr_quote_precision = utils.get_asset_precision(
        cr_quote_asset.precision
    );
    let cr_base_asset =(await API.Assets.fetch([core_exchange_rate.base.asset_id]))[0]
    let cr_base_precision = utils.get_asset_precision(
        cr_base_asset.precision
    );

    let cr_quote_amount  = new big(core_exchange_rate.quote.amount)
        .times(cr_quote_precision)
        .toString();
    let cr_base_amount = new big(core_exchange_rate.base.amount)
        .times(cr_base_precision)
        .toString();

    if(core_exchange_rate.base.amount>1000||core_exchange_rate.quote.amount>1000){
      return {code:171,message:"The amount of fee exchange rate assets should not exceed 1000"}
    }
    
    if(helper.getDecimals(cr_base_amount)>cr_base_precision||helper.getDecimals(cr_quote_amount)>cr_quote_precision){
      return {code:172,message:"precision overflow of fee exchange rate assets"}
    }

    let updateObject = {
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

    return dispatch('transactions/_transactionOperations', {
        operations:[{
            op_type:9,
            type:"asset_update",
            params:updateObject
        }],
        onlyGetFee,
    },{root:true});  
}

export const _updateAsset=async ({dispatch,rootGetters},params)=>{
  let { 
        assetId,
        maxSupply,
        newIssuer,        
        coreExchangeRate,
        whiteList,
        transferRestricted,
        chargeMarketFee,
        description,
        onlyGetFee=false,
      }=params;

  if(!assetId){
    return {code:101,message:"Parameter 'assetId' is missing"};
  }

  if(newIssuer){
    newIssuer=await API.Account.getUser(newIssuer,true); 
    if(newIssuer.code!=1){
      return newIssuer;
    }
    newIssuer=newIssuer.data.account.id;
  }
  let u_asset=await API.Assets.fetch_asset_one(assetId);
  if(u_asset.code!=1){
    return {code:162,message:u_asset.message};
  }
  u_asset=u_asset.data;

  let isBitAsset = u_asset.bitasset_data_id !== undefined;

  let flagBooleans = assetUtils.getFlagBooleans(0, isBitAsset);
  // if(chargeMarketFee)
  // flagBooleans["charge_market_fee"]=chargeMarketFee;
  
  // let permissionBooleans = assetUtils.getFlagBooleans("all",isBitAsset);

  u_asset=Immutable.fromJS(u_asset);

  flagBooleans.witness_fed_asset=false;
  flagBooleans.committee_fed_asset=false;
  let flags;
  if(whiteList!=undefined||transferRestricted!=undefined){
    if(whiteList!=undefined) flagBooleans.white_list=whiteList;
    if(transferRestricted!=undefined) flagBooleans.transfer_restricted=transferRestricted;

    // console.info("flagBooleans",flagBooleans,isBitAsset);
    flags = assetUtils.getFlags(flagBooleans, isBitAsset);
    
  }else{
    flags=u_asset.getIn(["options","issuer_permissions"])
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

  let _params={
    issuer:rootGetters["account/getAccountUserId"],
    new_issuer:newIssuer,
    update:{
      symbol:assetId,
      // precision,
      max_supply:u_asset.getIn(["options","max_supply"]),
      market_fee_percent:u_asset.getIn(["options","market_fee_percent"]),
      max_market_fee:u_asset.getIn(["options","max_market_fee"])
    },
    core_exchange_rate:(u_asset.getIn(["options","core_exchange_rate"])).toJS(),
    asset:u_asset,
    flags:flags,//u_asset.getIn(["options","flags"]),
    permissions:u_asset.getIn(["options","issuer_permissions"]),
    isBitAsset,
    bitasset_opts:{
      feed_lifetime_sec: 60 * 60 * 24,
      minimum_feeds: 1,
      force_settlement_delay_sec: 60 * 60 * 24,
      force_settlement_offset_percent:
          1 * assetConstants.GRAPHENE_1_PERCENT,
      maximum_force_settlement_volume:
          20 * assetConstants.GRAPHENE_1_PERCENT,
      short_backing_asset: "1.3.0"
    },//u_asset.get("bitasset_data"),
    original_bitasset_opts:null,
    description:u_asset.getIn(["options","description"]),
    // auths,
    feedProducers:null,
    originalFeedProducers:null,
    assetChanged:true,
    onlyGetFee,
  }
  if(maxSupply){
    _params.update.max_supply=maxSupply*Math.pow(10,u_asset.get("precision"));
  }

  if(description){
    _params.description=JSON.stringify({main:description,short_name:"",market:""});
  }

  if(coreExchangeRate){
    _params.core_exchange_rate.quote.amount=coreExchangeRate.quoteAmount||1;
    _params.core_exchange_rate.base.amount=coreExchangeRate.baseAmount||1;
  }

  if(chargeMarketFee){
    _params.update.market_fee_percent=chargeMarketFee.marketFeePercent||0;
    _params.update.max_market_fee=chargeMarketFee.maxMarketFee||0;
  }

  return dispatch("updateAsset",_params);
}

export const assetClaimFees=async ({commit,dispatch},{assetId,amount,account,onlyGetFee=false})=>{
  let asset=await API.Assets.fetch_asset_one(assetId);
  if(asset.code!==1){
    return asset;
  }
  let {id,precision}=asset.data;
  let amount_res=await helper.toOpAmount(amount,asset.data);
  if(!amount_res.success){
    return amount_res;
  }
  return  dispatch('transactions/_transactionOperations',{
      operations:[{
          op_type:39,
          type:"asset_claim_fees",
          params:{
            issuer:account.id,
            amount_to_claim:amount_res.data
         }
      }],
      onlyGetFee
  },{root:true});
}

/********Capital injection fee pool START*/
export const assetFundFeePool=async ({commit,dispatch},{assetId,amount,account,onlyGetFee=false})=>{
  let asset=await API.Assets.fetch_asset_one(assetId);
  if(asset.code!==1){
    return asset;
  }

  let core_asset=await API.Assets.fetch_asset_one("1.3.0");
  if(core_asset.code!==1){
    return core_asset;
  }

  let amount_res=await helper.toOpAmount(amount,core_asset.data);
  if(!amount_res.success){
    return amount_res;
  }
  return  dispatch('transactions/_transactionOperations',{
      operations:[{
          op_type:15,
          type:"asset_fund_fee_pool",
          params:{
            asset_id: asset.data.id,
            amount:amount_res.data.amount,
            from_account:account.id
         }
      }],
      onlyGetFee
  },{root:true});
}
/********Capital injection fee pool END*/

export const reserveAsset=async ({commit,dispatch},{assetId,amount,account,onlyGetFee=false})=>{
  let asset=await API.Assets.fetch_asset_one(assetId);
  if(asset.code!==1){
    return asset;
  }

  let amount_res=await helper.toOpAmount(amount,asset.data);
  if(!amount_res.success){
    return amount_res;
  }
  return  dispatch('transactions/_transactionOperations',{
      operations:[{
          op_type:14,
          type:"asset_reserve",
          params:{
            amount_to_reserve:amount_res.data,
            payer:account.id,
            extensions: []
         }
      }],
      onlyGetFee
  },{root:true});
}

export const createAsset=async ({commit,dispatch},{account_id,
  createObject,
  flags,
  permissions,
  cer,
  isBitAsset,
  is_prediction_market,
  bitasset_opts,
  description,
  onlyGetFee,
  callback})=>{
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
    let precision = utils.get_asset_precision(createObject.precision);

    big.config({DECIMAL_PLACES: Number(createObject.precision)});
    let max_supply = new big(createObject.max_supply)
        .times(precision)
        .toString();
    let max_market_fee = new big(createObject.max_market_fee || 0)
        .times(precision)
        .toString();
    // console.log("max_supply:", max_supply);
    // console.log("max_market_fee:", max_market_fee);
    let coreAsset=await dispatch("assets/fetchAssets",{assets:["1.3.0"],isOne:true},{root:true});
    let corePrecision = utils.get_asset_precision(coreAsset.precision);
   
    if(cer.base.amount>1000|| cer.quote.amount>1000){
      return {code:171,message:"The amount of fee exchange rate assets should not exceed 1000"}
    }
    if(helper.getDecimals(cer.base.amount)>8||helper.getDecimals(cer.quote.amount)>8){
      return {code:172,message:"precision overflow of fee exchange rate assets"}
    }

    let operationJSON = {
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

    return dispatch('transactions/_transactionOperations', {
        operations:[{
            op_type:8,
            type:"asset_create",
            params:operationJSON
        }],
        onlyGetFee
    },{root:true});  
}

export const _createAsset=async ({dispatch,rootGetters},params)=>{
  if(!helper.trimParams(params,{description:""})){
    return {code:101,message:"Parameter is missing"};
  }
  let { isBitAsset=false,
        is_prediction_market=false,
        assetId,
        maxSupply=100000,
        precision=8,
        coreExchangeRate,
        chargeMarketFee,
        description,
        onlyGetFee=false,
      }=params;

  let c_asset=await dispatch("assets/fetchAssets",{assets:[assetId],isOne:true},{root:true});
  if(c_asset){
    return {code:162,message:"The asset already exists"};
  }

  let flagBooleans = assetUtils.getFlagBooleans(0, isBitAsset);
  flagBooleans["charge_market_fee"]=chargeMarketFee;
  
  let permissionBooleans = assetUtils.getFlagBooleans("all",isBitAsset);

  let flags = assetUtils.getFlags(flagBooleans, isBitAsset);
  let permissions = assetUtils.getPermissions(
    permissionBooleans,
    isBitAsset
  );

  let _params={
    account_id:rootGetters["account/getAccountUserId"],
    createObject:{
      symbol:assetId,
      precision,
      max_supply:maxSupply,
      market_fee_percent:0,
      max_market_fee:0
    },
    flags,
    permissions,
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
          asset_id:null,
          amount: 1
      }
    },
    isBitAsset,
    is_prediction_market,
    bitasset_opts: {
      feed_lifetime_sec: 60 * 60 * 24,
      minimum_feeds:1,
      force_settlement_delay_sec: 60 * 60 * 24,
      force_settlement_offset_percent:
          1 * assetConstants.GRAPHENE_1_PERCENT,
      maximum_force_settlement_volume:
          20 * assetConstants.GRAPHENE_1_PERCENT,
      short_backing_asset: "1.3.0"
    },
    description: JSON.stringify({main:description,short_name:"",market:""}),
    onlyGetFee
  }
  if(coreExchangeRate){
    _params.cer.quote.amount=coreExchangeRate.quoteAmount||1;
    _params.cer.base.amount=coreExchangeRate.baseAmount||1;
  }

  if(chargeMarketFee){
    _params.createObject.market_fee_percent=chargeMarketFee.marketFeePercent||0;
    _params.createObject.max_market_fee=chargeMarketFee.maxMarketFee||0;
  }

  return dispatch("createAsset",_params);
}

export const issueAsset=({dispatch},params)=>{
  if(!helper.trimParams(params,{memo:""})){
    return {code:101,message:"Parameter is missing"};
  }
  let {toAccount,amount,memo,assetId="",onlyGetFee}=params;
  assetId=assetId.toUpperCase();
  return dispatch('transactions/_transactionOperations', {
    operations:[{
      op_type:13,
      type:"asset_issue",
      params:{
        to:toAccount,
        amount,
        asset_id:assetId,
        memo
      }
    }],
    onlyGetFee
  },{root:true});
}

export const assetUpdateRestricted=async ({dispatch,rootGetters},params)=>{
  if(!helper.trimParams(params,{memo:""})){
    return {code:101,message:"Parameter is missing"};
  }
  let {assetId="1.3.0",isadd=true,restrictedType=0,restrictedList=[],onlyGetFee=false}=params;
  restrictedType=Number(restrictedType);
  if(isNaN(restrictedType)){
    return {code:173,message:"restrictedType must be a number"};
  }
  if(!(restrictedList instanceof Array)){
    return {code:174,message:"restricted_list must be a array"};
  }

  assetId=assetId.toUpperCase();
  let asset_res=await API.Assets.fetch_asset_one(assetId);
  if(asset_res.code!==1){
    return asset_res;
  }

  restrictedList=await Promise.all(restrictedList.map(async id=>{ 
      if(restrictedType==1||restrictedType==2){
        if(/^1.2.\d+$/.test(id)){
            return id;
        }
        let acc_res=await API.Account.getUser(id,true);
        if(acc_res.code==1){
          return acc_res.data.account.id;
        }
      }else if(restrictedType==3||restrictedType==4){
        if(/^1.3.\d+$/.test(id)){
            return id;
        }
        let asset_res=await API.Assets.fetch_asset_one(id);
        if(asset_res.code==1){
          return asset_res.data.id;
        }
      }
      return "";
  }));
  restrictedList=restrictedList.filter(id=>id!="");
  if(!restrictedList.length){
    return {code:175,message:"Please check the parameter restrictedList"};
  }

  return dispatch('transactions/_transactionOperations', {
    operations:[{
      op_type:10,
      type:"asset_update_restricted",
      params:{
        payer:rootGetters['account/getAccountUserId'],
        target_asset:asset_res.data.id,
        isadd:!!isadd,
        restricted_type:restrictedType,
        restricted_list:restrictedList,
        extensions: []
      }
    }],
    onlyGetFee
  },{root:true});
}

export const queryAssets=async ({dispatch,state,commit},{symbol="",assetId="",simple=true})=>{
  let assets=state.assets;
  let lastAsset = assets
      .sort((a, b) => {
          if (a.symbol > b.symbol) {
              return 1;
          } else if (a.symbol < b.symbol) {
              return -1;
          } else {
              return 0;
          }
      }).last();

  symbol=symbol||assetId;
  if(symbol){
    symbol=symbol.trim();
    await dispatch("onGetAssetList",{start:symbol,count:1});
    state.assetsFetched=state.assetsFetched + 99;
  }else{
    if (assets.size === 0) {
        await dispatch("onGetAssetList",{start:"A",count:100});
        state.assetsFetched=100;
    } else if (assets.size >= state.assetsFetched) {
        await dispatch("onGetAssetList",{start:lastAsset.symbol,count:100});
        state.assetsFetched=state.assetsFetched + 99;
    }
  }
  
  if (assets.size > state.totalAssets) {
      accountStorage.set("totalAssets", assets.size);
  }

  if (state.assetsFetched >= state.totalAssets - 100) {
      return {code:1,data:state.assets.toJS()}
  }
  if(assets.size<state.assetsFetched){
    let r_assets=await dispatch("formatAssets",{
      assets:state.assets_arr,
      simple
    });

    commit(types.FETCH_ASSETS_COMPLETE, { assets: arrayToObject(r_assets)});

    state.assetsFetched=0;
    state.assets_arr=[];
    state.assets=Immutable.fromJS([]);
    return {code:1,data:r_assets}
  }else{
    dispatch("queryAssets",{symbol:""});
  }
}

export const formatAssets=async ({dispatch},{assets,simple=false})=>{
  let r_assets=[];
  let issuer_res;
  assets=assets.sort((a, b) => {
    a=a.id.split(".")[2];
    b=b.id.split(".")[2];
    if (a > b) {
        return 1;
    } else if (a < b) {
        return -1;
    } else {
        return 0;
    }
 }); 
//  assets=assets.toJS();
  for(let i=0;i<assets.length;i++){
      let {issuer,dynamic,precision,id,symbol,options,bitasset_data_id,dynamic_asset_data_id}=assets[i];
      let {core_exchange_rate,description,market_fee_percent,max_market_fee,
        max_supply,flags,issuer_permissions,whitelist_authorities,whitelist_markets,
        blacklist_authorities,blacklist_markets}=options;
        
      issuer_res=await dispatch("user/getUserInfo",{account:issuer,isCache:true},{root:true});
      let core_asset=await API.Assets.fetch(["1.3.0"],true);
      let {base,quote}=core_exchange_rate;

      let base_asset=(await API.Assets.fetch_asset_one(base.asset_id)).data;
      let quote_asset=(await API.Assets.fetch_asset_one(quote.asset_id)).data;

      // let base_precision=(await API.Assets.fetch_asset_one(base.asset_id)).data.precision;
      // let quote_precision=(await API.Assets.fetch_asset_one(United Labs of BCTech.quote.asset_id)).data.precision;

      core_exchange_rate.text=(helper.formatAmount(quote.amount,quote_asset.precision)||1)/
                            helper.formatAmount(base.amount,base_asset.precision)
                           +" "+ quote_asset.symbol+"/"+base_asset.symbol;
      let asset_item;
      ChainStore.getAsset(id);
      ChainStore.getObject(dynamic_asset_data_id)

      flags=assetUtils.getFlagBooleans(
        flags,
        !!bitasset_data_id//whether it's a smart asset
      );
      if(simple){
        asset_item={
          id,
          issuer,
          issuer_name:issuer_res.code==1&&issuer_res.data?issuer_res.data.account.name:"",
          precision,
          symbol,
          dynamic:{
            current_supply:helper.formatAmount(dynamic.current_supply,precision),
            fee_pool:helper.formatAmount(dynamic.fee_pool,core_asset.precision),
            fee_pool_symbol:core_asset.symbol,
            accumulated_fees:helper.formatAmount(dynamic.accumulated_fees,precision)
          },
          options:{
            core_exchange_rate,
            flags,
            // flags:{
            //   transfer_restricted:flags.transfer_restricted,
            //   white_list:flags.white_list
            // },
            max_supply:helper.formatAmount(max_supply,precision)
          }
        }
      }else{
        //  console.info('assets[i]',assets[i]);
        let permissionBooleans = assetUtils.getFlagBooleans(
          issuer_permissions,
          !!bitasset_data_id//whether it's a smart asset
        );
        // console.info('permissionBooleans',permissionBooleans);
        asset_item={
          bitasset_data:assets[i].bitasset_data,
          bitasset_data_id,
          dynamic:{
            current_supply:helper.formatAmount(dynamic.current_supply,precision),
            fee_pool:helper.formatAmount(dynamic.fee_pool,precision),
            fee_pool_symbol:core_asset.symbol,
            accumulated_fees:helper.formatAmount(dynamic.accumulated_fees,precision)
          },
          id,
          bitasset_data_id,
          issuer,
          issuer_name:issuer_res.data.account.name,
          options:{
            core_exchange_rate,
            description:"",
            flags:assetUtils.getFlagBooleans(
              flags,
              !!bitasset_data_id//whether it's a smart asset
            ),
            permissionBooleans,
            market_fee_percent:market_fee_percent/100,
            max_market_fee:helper.formatAmount(max_market_fee,precision),
            max_supply:helper.formatAmount(max_supply,precision),
            // whitelist_authorities,
            // whitelist_markets,
            // blacklist_authorities,
            // blacklist_markets
          },
          precision,
          symbol,
          //charge_market_fee
        }
      }

      try{
        if(description)
        asset_item.description=JSON.parse(description).main;
      }catch(e){ }

      r_assets.push(asset_item);
    }

  return JSON.parse(JSON.stringify(r_assets));
}

export const onGetAssetList=async ({dispatch,state},{start,count})=>{
      let payload=await API.Assets.getAssetList(start,count);

      if (!payload) {
          return false;
      }
      // this.assetsLoading = payload.loading;
      if (payload.assets) {
          payload.assets.forEach(asset => {
              for (var i = 0; i < payload.dynamic.length; i++) {
                  if (payload.dynamic[i].id === asset.dynamic_asset_data_id) {
                      asset.dynamic = payload.dynamic[i];
                      break;
                  }
              }

              if (asset.bitasset_data_id) {
                  asset.market_asset = true;

                  for (var i = 0; i < payload.bitasset_data.length; i++) {
                      if (
                          payload.bitasset_data[i].id ===
                          asset.bitasset_data_id
                      ) {
                          asset.bitasset_data = payload.bitasset_data[i];
                          break;
                      }
                  }
              } else {
                  asset.market_asset = false;
              }

              state.assets=state.assets.set(asset.id, asset);
              state.assets_arr.push(asset);
              state.asset_symbol_to_id[asset.symbol] = asset.id;
          });
      }
}

export const queryAssetRestricted=async ({dispatch},{assetId,restrictedType})=>{
  assetId=assetId.toUpperCase();
  let asset_res=await API.Assets.fetch_asset_one(assetId);
  if(asset_res.code!==1){
    return asset_res;
  }
  let res=await API.Assets.list_asset_restricted_objects(asset_res.data.id,restrictedType);
  if(res.code==1){
    res.data=await Promise.all(res.data.map(async item=>{
        // item.symbol=asset_res.data.symbol;
        let r_id=item.restricted_id;
        if(/^1.2.\d+$/.test(r_id)){
          let {id,name}=(await API.Account.getAccount(r_id)).data.account;
          item.restricted_account_id=id;
          item.restricted_account_name=name;
        }else if(/^1.3.\d+/.test(r_id)){
          let {id,symbol}=(await API.Assets.fetch_asset_one(r_id)).data;
          item.restricted_asset_id=id;
          item.restricted_asset_symbol=symbol;
        }
        return item;
    }))
  }

  return res;
}


export const assetPublishFeed=async ({dispatch,rootGetters},params)=>{
  if(!helper.trimParams(params)) return {code:101,message:"Parameter is missing"};
  let {assetId,price,maintenanceCollateralRatio,maximumShortSqueezeRatio,coreExchangeRate,onlyGetFee}=params;

  assetId=assetId.toUpperCase();
  let asset_res=await API.Assets.fetch_asset_one(assetId);
  if(asset_res.code!==1) return asset_res;

  let {id,precision,options}=asset_res.data;
  // options.core_exchange_rate.quote.amount= options.core_exchange_rate.quote.amount*10;
  let core_exchange_rate=options.core_exchange_rate;

  
  if(coreExchangeRate.baseAmount){
    let cr_base_asset =(await API.Assets.fetch([core_exchange_rate.base.asset_id]))[0]
    let cr_base_precision = utils.get_asset_precision(
        cr_base_asset.precision
    );
    core_exchange_rate.base.amount = new big(coreExchangeRate.baseAmount)
    .times(cr_base_precision)
    .toString();

  } 

  if(coreExchangeRate.quoteAmount){
    let cr_quote_asset =(await API.Assets.fetch([core_exchange_rate.quote.asset_id]))[0];
    let cr_quote_precision = utils.get_asset_precision(
        cr_quote_asset.precision
    );
    core_exchange_rate.quote.amount=new big(coreExchangeRate.quoteAmount)
    .times(cr_quote_precision)
    .toString();
  } 

  let price_feed={
    settlement_price:{
       base:{
          amount:helper.getFullNum(1*Math.pow(10,precision)),
          asset_id:id
       },
       quote:(await helper.toOpAmount(price,"1.3.0")).data
    },
    maintenance_collateral_ratio:Number((maintenanceCollateralRatio*1000).toFixed(0)),
    maximum_short_squeeze_ratio:Number((maximumShortSqueezeRatio*1000).toFixed(0)),
    core_exchange_rate
  }
  return dispatch('transactions/_transactionOperations', {
    operations:[{
      op_type:18,
      type:"asset_publish_feed",
      params:{
        publisher:rootGetters['account/getAccountUserId'],
        asset_id:id,
        feed:price_feed,
        extensions:[]
      }
    }],
    onlyGetFee
  },{root:true});
}

export const assetUpdateFeedProducers=async ({dispatch,rootGetters},{assetId,newFeedProducers,onlyGetFee})=>{
  assetId=assetId.toUpperCase();
  let asset_res=await API.Assets.fetch_asset_one(assetId);
  if(asset_res.code!==1) return asset_res;

  return dispatch('transactions/_transactionOperations', {
    operations:[{
      op_type:12,
      type:"asset_update_feed_producers",
      params:{
        issuer:rootGetters['account/getAccountUserId'],
        asset_to_update:asset_res.data.id,
        new_feed_producers:newFeedProducers,
        extensions:[]
      }
    }],
    onlyGetFee
  },{root:true});
}

export const assetGlobalSettle=async ({dispatch,rootGetters},params)=>{
   if(!helper.trimParams(params)) return {code:101,message:"Parameter is missing"};
   let {assetId,price,onlyGetFee}=params;
    if(isNaN(Number(price))){
      return {code:135,message:"Please check parameter data type"};
    }
    assetId=assetId.toUpperCase();
    let asset_res=await API.Assets.fetch_asset_one(assetId);
    if(asset_res.code!==1) return asset_res;
    let {id,precision}=asset_res.data;
    return dispatch('transactions/_transactionOperations', {
      operations:[{
        op_type:17,
        type:"asset_global_settle",
        params:{
          issuer:rootGetters['account/getAccountUserId'],
          asset_to_settle:id,
          settle_price:{
            base:{
               amount:1*Math.pow(10,precision),
               asset_id:id
            },
            quote:{
               amount:price*Math.pow(10,(await API.Assets.fetch_asset_one("1.3.0")).data.precision),
               asset_id:"1.3.0"
            }
          },
          extensions:[]
        }
      }],
      onlyGetFee
    },{root:true});
}

export const assetSettle=async ({dispatch,rootGetters},params)=>{
   if(!helper.trimParams(params)) return {code:101,message:"Parameter is missing"};
   let {assetId,amount,onlyGetFee}=params;
   if(isNaN(Number(amount))){
     return {code:135,message:"Please check parameter data type"};
   }
   assetId=assetId.toUpperCase();
   let asset_res=await API.Assets.fetch_asset_one(assetId);
   if(asset_res.code!==1) return asset_res;

   return dispatch('transactions/_transactionOperations', {
     operations:[{
       op_type:16,
       type:"asset_settle",
       params:{
         account:rootGetters['account/getAccountUserId'],
         amount:(await helper.toOpAmount(price,asset_res.data)).data,
         extensions:[]
       }
     }],
     onlyGetFee
   },{root:true});
}