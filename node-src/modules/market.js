import Vue from 'vue';
import * as types from '../mutations';
import API from '../services/api';
import Market from '../services/api/market';

import Immutable from "immutable";
import market_utils from "../lib/common/market_utils";
import utils from "../lib/common/utils";

import {Asset, Price, LimitOrderCreate} from "../lib/common/MarketClasses";
import {ChainStore} from "bcxjs-cores";


// const GphMarket = API.Market['1.3.0'];
import listener from '../services/api/chain-listener';
import Subscriptions from '../services/api/subscriptions';
import { Apis } from 'bcxjs-ws';
import helper from '../lib/common/helper';


const actions = {
  cancelLimitOrder:({dispatch},{orderId,feeAssetId="1.3.0"})=>{
    if(!orderId){
      return {code:136,message:"Parameter 'orderId' can not be empty"};
    }
    return dispatch('transactions/_transactionOperations', {
            operations:[{
                op_type:2,
                type:"limit_order_cancel",
                params:{
                  orderId,
                  fee_asset_id:feeAssetId
                }
            }]
          },{root:true});
  },
  queryDebt:async ({rootGetters,dispatch},params)=>{
     let {account_id,debtAssetId,collateralAssetId}=params;
     let debt_asset=await API.Assets.fetch_asset_one(debtAssetId);
     if(debt_asset.code!=1) return debt_asset;
     debtAssetId=debt_asset.data.id
     let user_result=await dispatch("user/fetchUser",account_id,{root:true})
     if(user_result.success){
        let currentPosition=user_result.data.call_orders.filter(item=>!!item).find(item=>{
            return item.call_price.quote.asset_id===debtAssetId;
        });
        if(currentPosition){
            let base_asset=await API.Assets.fetch_asset_one(currentPosition.call_price.base.asset_id);
            let base_asset_precision=base_asset.data.precision;

            currentPosition.call_price_text=utils.format_price(
                currentPosition.call_price.quote.amount,
                debt_asset.data,
                currentPosition.call_price.base.amount,
                base_asset.data,
                false,
                true,
                false
            );

            // currentPosition.call_price_text=(helper.getFullNum(currentPosition.call_price.base.amount,
            //     base_asset_precision)/helper.getFullNum(currentPosition.call_price.quote.amount,
            //         debt_asset.data.precision)).toFixed(base_asset_precision)+" "+base_asset.data.symbol+"/"+debt_asset.data.symbol;
            //Call Price
            currentPosition.collateral_value=helper.getFullNum(currentPosition.collateral,base_asset_precision)
            currentPosition.debt_value=helper.getFullNum(currentPosition.debt,debt_asset.data.precision);
            currentPosition.collateral_symbol=base_asset.data.symbol;
            currentPosition.debt_symbol=debt_asset.data.symbol;
          }else{
            if(!collateralAssetId){
                return {code:178,message:"collateralAssetId Can not be empty"}
            }
            let base_asset=await API.Assets.fetch_asset_one(collateralAssetId);
            // console.info("collateralAssetId",collateralAssetId,base_asset);
            currentPosition={
                call_price_text:"无",
                collateral_value:0,
                debt_value:0,
                collateral_symbol:base_asset.data.symbol,
                debt_symbol:debt_asset.data.symbol
            }
          }
       
            let smart_asset_res=await dispatch("assets/queryAssets",{assetId:debt_asset.data.symbol},{root:true});
            if(smart_asset_res.code!=1){
                return smart_asset_res;
            }
            let {format_feed_price,format_feed_price_text,current_feed}=smart_asset_res.data[0].bitasset_data;
            currentPosition.format_feed_price=format_feed_price;
            currentPosition.format_feed_price_text=format_feed_price_text;
            currentPosition.maintenance_collateral_ratio=current_feed.maintenance_collateral_ratio/1000;
            return {code:1,data:currentPosition};
        // }else{
        //     return {code:178,message:"No debt"};
        // }
      
      }else{
          return user_result;
      }
  },
  callOrderUpdate:async ({commit,rootGetters,dispatch},params)=>{
    if(!helper.trimParams(params)||!params.collateralAmount||!params.debtAmount){
        return {code:101,message:"Parameter is missing"};
      }
      let {collateralAmount,collateralAssetId,debtAmount,debtAssetId,account}=params;
      collateralAmount=Number(collateralAmount);
      debtAmount=Number(debtAmount);
      collateralAmount=isNaN(collateralAmount)?0:collateralAmount;
      debtAmount=isNaN(debtAmount)?0:debtAmount;

      let collateral_asset=await API.Assets.fetch_asset_one(collateralAssetId);
      let debt_asset=await API.Assets.fetch_asset_one(debtAssetId);
      if(collateral_asset.code!=1)   return collateral_asset;      
      if(debt_asset.code!=1) return debt_asset;
      
      let delta_collateral=(await helper.toOpAmount(collateralAmount,collateral_asset.data)).data;
      let delta_debt=(await helper.toOpAmount(debtAmount,debt_asset.data)).data;
      
      let user_result=await dispatch("user/fetchUser",account.id,{root:true})
      let currentPosition={
        collateral: null,
        debt: null
      }
      if(user_result.success){
        let _currentPosition=user_result.data.call_orders.filter(item=>!!item).find(item=>{
            return item.call_price.quote.asset_id===debtAssetId;
        });
        if(_currentPosition) currentPosition=_currentPosition;
      }else{
          return user_result;
      }


      delta_collateral.amount=parseInt(delta_collateral.amount-currentPosition.collateral,10);
      delta_debt.amount=parseInt(delta_debt.amount-currentPosition.debt,10)
      

      return dispatch('transactions/_transactionOperations', {
        operations:[{
            op_type:3,
            type:"call_order_update",
            params:{
              funding_account:rootGetters["account/getAccountUserId"],
              delta_collateral,
              delta_debt
            }
        }]
       },{root:true});
       
  },
  createLimitOrder:async ({dispatch,rootGetters},{price,amount,transactionPair,type=0,callback,isAsk=true,onlyGetFee=false})=>{

    transactionPair=transactionPair.split("_");
    let quoteAsset=await dispatch("assets/fetchAssets",{assets:[transactionPair[0]],isOne:true},{root:true})
    let baseAsset=await dispatch("assets/fetchAssets",{assets:[transactionPair[1]],isOne:true},{root:true})
    let coreAsset=await dispatch("assets/fetchAssets",{assets:["1.3.0"],isOne:true},{root:true})
   
    let currentAccount=rootGetters["user/getAllAccountObject"];
    // let {
    //   sellFeeAsset,
    //   sellFeeAssets,
    //   sellFee
    //  } = getFeeAssets(quoteAsset, baseAsset, coreAsset,currentAccount);

    let _amount = new Asset({
        asset_id: quoteAsset.id,
        precision: quoteAsset.precision
    })

    let turnover = new Asset({
      asset_id: baseAsset.id,
      precision: baseAsset.precision
    });

    price = new Price({
      base: isAsk ? _amount : turnover,
      quote: isAsk ? turnover : _amount,
      real: parseFloat(price) || 0
    });
  
    let a = parseFloat(amount) || 0;
    let val = price.toReal() * a;

    amount=_amount;
    amount.setAmount({real: a || 0});
    turnover.setAmount({real: val || 0});

    let current={
      orderType:0,
      price,
      amount,
      turnover,
    //   chargefee:sellFee
    }
    let accountBalance = currentAccount.balances;
    let quoteBalance,baseBalance,coreBalance;
    if (accountBalance) {
        for (let id in accountBalance) {
            if (id === quoteAsset.id) {
                quoteBalance = accountBalance[id].balance;
            }
            if (id === baseAsset.id) {
                baseBalance = accountBalance[id].balance;
            }
            if (id === "1.3.0") {
                coreBalance = accountBalance[id].balance;
            }
        }
    }
    quoteBalance = current.amount.clone(quoteBalance ? parseInt(quoteBalance, 10): 0);
    coreBalance = new Asset({
        amount: coreBalance ? parseInt(coreBalance, 10) : 0
    });

    // let fee = utils.getFee("limit_order_create",sellFeeAsset,coreAsset);

    // let feeID = verifyFee(fee, current.amount.getAmount(), quoteBalance.getAmount(), coreBalance.getAmount());
    // if(!feeID){
    //   return {code:1,message:"Insufficient funds to pay fees"};
    // }
    type=Number(type);
    let order = new LimitOrderCreate({
        for_sale:type?current.turnover:current.amount,
        to_receive:type?current.amount:current.turnover,
        seller: currentAccount.account.id,
        // fee: {
        //     asset_id: feeID,
        //     amount: 0
        // }
    });

    order.setExpiration();
    order = order.toObject();
    return dispatch('transactions/_transactionOperations', {
          operations:[{
              op_type:1,
              type:"limit_order_create",
              params:order
          }],
          onlyGetFee
        },{root:true});
  },
  queryPriceHistory:async ({dispatch},{trxSymbol,step,page=1,pageSize})=>{
    let _trxSymbols=trxSymbol.split("_");
    let trxAssets=await dispatch("assets/fetchAssets",{assets:_trxSymbols,isCache:true},{root:true});
    let base=trxAssets[_trxSymbols[1]];
    let quote=trxAssets[_trxSymbols[0]];
    if(!base||!quote){
        return {
            code:185,
            message:"Transaction pair does not exist"
        }
    }
    let endDate=new Date();
    const _startDate = new Date(endDate - (step*1000*pageSize*page));
    const _endDate = new Date(endDate - (step*1000*pageSize*(page-1)));
    const startDateISO = _startDate.toISOString().slice(0, -5);
    const endDateISO = _endDate.toISOString().slice(0, -5);
    const history = await Apis.instance().history_api().exec(
      'get_market_history',
      [base.id, quote.id, step, startDateISO, endDateISO]
    );
    let prices=_priceChart(history,Immutable.fromJS(base),Immutable.fromJS(quote),step);
    return {code:1,data:prices};
  },
  getMarketStats:async ({dispatch,state,getters},params)=>{
      state.getMarketStatsParams=params&&params.subscribe?params:null;

      if(params.subscribe&&!getters.isSubscribed){
          dispatch("subscribeToMarket")
      }
      
      let {quoteAssets,baseAsset,days=2,assetCache=true,callback}=params;
      
      quoteAssets=await dispatch("assets/fetchAssets",{assets:[baseAsset,...quoteAssets],isCache:assetCache},{root:true});
      let quoteAssetsIds=[];
      let baseAssetId="1.3.0";

      Object.keys(quoteAssets).forEach(asset_id=>{
        if(/1.3.\d+/.test(asset_id)){
          let asset=quoteAssets[asset_id];          
          if(asset.symbol!=baseAsset){
            quoteAssetsIds.push(asset_id);
          }else{
            baseAssetId=asset_id;
          }
        }
      });
      return  dispatch("market/fetchMarketHistory_v1",{
          assetsIds:quoteAssetsIds,
          baseId:baseAssetId,
          days
        },{root:true}).then(data=>{
          callback&&callback({code:1,data});
          return {code:1,data};
        }).catch(error=>{
          callback&&callback({code:0,message:error.message,error});
          return {code:0,message:error.message,error}
        });
  },
  fetchMarketHistory_v1: (store, { assetsIds, baseId, days=2 }) => {
    const { dispatch,commit, rootGetters } = store;
    const assets = rootGetters['assets/getAssets'];
    const baseAsset = assets[baseId];
    commit(types.FETCH_MARKET_HISTORY_REQUEST, { baseId, days });
    return Promise.all(assetsIds.map(async (assetId) => {
        // const prices = await API.Assets.fetchPriceHistory(baseAsset, assets[assetId], days);
        // console.info("prices",prices);
        let quote=assets[assetId];
        let result= await API.Assets.fetchPriceHistory(baseAsset, assets[assetId], days);
        if (!result) throw new Error('error market history');
        let marketStats={
          history: result[0],
          last: result[1], 
          market: quote.symbol + "_" + baseAsset.symbol,
          base:baseAsset, 
          quote
        }
        // console.info("result",result,marketStats);

        let stats = _calcMarketStats(marketStats.history, marketStats.base, marketStats.quote, marketStats.last);
        let price = utils.convertPrice(Immutable.fromJS(marketStats.quote), Immutable.fromJS(marketStats.base));

        stats.latestPrice= stats && stats.latestPrice ?
        stats.latestPrice :
        stats && stats.close && (stats.close.quote.amount && stats.close.base.amount) ?
            utils.get_asset_price(stats.close.quote.amount, marketStats.quote, stats.close.base.amount, marketStats.base, true) :
            utils.get_asset_price(price.base.amount, marketStats.base, price.quote.amount, marketStats.quote);
       
        stats.latest_price=stats.latestPrice.toFixed(baseAsset.precision);

        delete stats.latestPrice;

        stats.base_symbol=baseAsset.symbol;
        stats.quote_symbol=quote.symbol;

        stats.volume_base=stats.volumeBase;
        stats.volume_quote=stats.volumeQuote;
        delete stats.volumeBase
        delete stats.volumeQuote


        return stats; 
      })).then(results=>{
        return results.map(item=>{
          delete item.close;
          return item;
        })
      }).catch(() => {
        commit(types.FETCH_MARKET_HISTORY_ERROR);
      });
  },
  fetchMarketHistory: (store, { assetsIds, baseId, days }) => {
    const { commit, rootGetters } = store;
    const assets = rootGetters['assets/getAssets'];
    const baseAsset = assets[baseId];

    commit(types.FETCH_MARKET_HISTORY_REQUEST, { baseId, days });
    Promise.all(assetsIds.map(async (assetId) => {
      const prices = await API.Assets.fetchPriceHistory(baseAsset, assets[assetId], days);
      if (!prices) throw new Error('error market history');
      return {
        assetId,
        prices
      };
    })).then((pricesObjects) => {
      const prices = pricesObjects.reduce((result, obj) => {
        result[obj.assetId] = obj.prices;
        return result;
      }, {});
      commit(types.FETCH_MARKET_HISTORY_COMPLETE, { prices });
    }).catch(() => {
      commit(types.FETCH_MARKET_HISTORY_ERROR);
    });
  },
  getTransactionPairData:async (store,params)=>{
    const { commit,state,dispatch,rootGetters,getters } = store;
    state.getTrxPairDataParams=params.subscribe?params:null;
    let  { transactionPair,hasMyTradeHistory=false,callback }=params;
    let currentAccount=rootGetters["user/getAllAccountObject"];
    if(params.subscribe&&!getters.isSubscribed){
      dispatch("subscribeToMarket")
    }
    return  new Market().subscribeToExchangeRate(transactionPair, currentAccount,hasMyTradeHistory,(marketsDataRes,id, amount) => {
      callback&&callback(marketsDataRes);
    }).then(() => {
       console.log('subscribed to market successfully');
    });
  },
  subscribeToMarket({ commit,state,dispatch }) {
    const marketsSubscription = new Subscriptions.Markets({
      callback:(type,object)=>{
        clearTimeout(state.marketUpdateTimer);
        state.marketUpdateTimer=setTimeout(() => {
          let {getTrxPairDataParams,getMarketStatsParams}=state;
          if(getTrxPairDataParams){
            dispatch("getTransactionPairData",getTrxPairDataParams);
          }
          if(getMarketStatsParams){
            dispatch("getMarketStats",getMarketStatsParams);
          }
        }, 500);     
      }
    });
    listener.addSubscription(marketsSubscription);
    commit(types.SUB_TO_MARKET_COMPLETE);

  },

  unsubscribeFromMarket(store, { balances }) {
    const { commit } = store;
    const assetsIds = Object.keys(balances);
    GphMarket.unsubscribeFromMarkets();
    Promise.all(assetsIds.map(id => {
      console.log('unsubscribing: ', id);
      return GphMarket.unsubscribeFromExchangeRate(id);
    })).then(() => {
      commit(types.UNSUB_FROM_MARKET_COMPLETE);
      console.log('unsubscribed from market');
    });
  },

  updateMarketPrice:async (store, { assetId, price,GphMarket})=>{
    const { commit } = store;
    commit(types.UPDATE_MARKET_PRICE, { assetId, price });
    let orders=await store.dispatch('transactions/createOrdersFromDistribution', GphMarket, { root: true });
    return orders
  },

  setMarketStats({commit},payload){
    commit(types.SET_MARKET_STATS,payload);
  }
};

const getFeeAssets=(quote, base, coreAsset,currentAccount)=>{
  quote=Immutable.fromJS(quote);
  base=Immutable.fromJS(base)
  currentAccount=Immutable.fromJS(currentAccount);
  function addMissingAsset(target, asset) {
      if (target.indexOf(asset) === -1) {
          target.push(asset);
      }
  }

  let sellFeeAssets = [coreAsset, quote === coreAsset ? base : quote];
  addMissingAsset(sellFeeAssets, quote);
  addMissingAsset(sellFeeAssets, base);
  let sellFeeAsset;

  let balances = {};

  currentAccount.get("balances", []).filter((balance, id) => {
      return (["1.3.0", quote.get("id"), base.get("id")].indexOf(id) >= 0);
  }).forEach((balance, id) => {
      let balanceObject = balance;
      balances[id] = {
          balance: balanceObject ? parseInt(balanceObject.get("balance"), 10) : 0,
          fee: utils.getFee("limit_order_create",ChainStore.getAsset(id))
      };
  });

  // await Promise.all(currentAccount.get("balances", []).filter((balance, id) => {
  //     return (["1.3.0", quote.get("id"), base.get("id")].indexOf(id) >= 0);
  // }).map(async (balance, id) => {
  //     let balanceObject = balance;
  //     let coreAsset=(await API.Assets.fetch_asset_one(id)).data;
  //     console.info('coreAsset',coreAsset,id);

  //     balances[id] = {
  //         balance: balanceObject ? parseInt(balanceObject.get("balance"), 10) : 0,
  //         fee: utils.getFee("limit_order_create",coreAsset)
  //     };
  // }))

  sellFeeAssets = sellFeeAssets.filter(a => {
      if (!balances[a.id]) {
          return false;
      }
      return balances[a.id].balance > balances[a.id].fee.getAmount();
  });

  if (!sellFeeAssets.length) {
      sellFeeAsset = coreAsset;
      sellFeeAssets.push(coreAsset);
  } else {
      sellFeeAsset = sellFeeAssets[Math.min(sellFeeAssets.length - 1, 0)];//sellFeeAssetIdx
  }

//   let sellFee = utils.getFee("limit_order_create",sellFeeAsset);

  return {
      sellFeeAsset,
      sellFeeAssets,
      //sellFee
  };
}


const verifyFee=(fee, sellAmount, sellBalance, coreBalance)=>{
  let coreFee = utils.getFee("limit_order_create");

  let sellSum = fee.getAmount() + sellAmount;
  if (fee.asset_id === "1.3.0") {
      if (coreFee.getAmount() <= coreBalance) {
          return "1.3.0";
      } else {
          return null;
      }
  } else {
      
      if (sellSum <= sellBalance) { // sufficient funds
          return fee.asset_id;
      } else if (coreFee.getAmount() <= coreBalance && fee.asset_id !== "1.3.0") { // sufficient core assets for fee cost
          return "1.3.0";
      } else {
          return null; // insufficient funds
      }
  }
}




const getters = {
  getPriceById: state => {
    return (assetId) => {
      if (assetId === state.baseId) return 1;
      return state.prices[assetId] || 0;
    };
  },
  getBaseAssetId: state => state.baseAssetId,
  getAssetMultiplier: state => {
    return (assetId) => {
      if (!state.history[assetId]) {
        return {
          first: 0,
          last: 0
        };
      }
      return {
        first: 1 / state.history[assetId].first,
        last: 1 / state.history[assetId].last
      };
    };
  },
  getMarketHistory: state => state.history,
  isFetching: state => state.pending,
  isError: state => state.error,
  isSubscribed: state => state.subscribed,
  getAllMarketStats:state=>state.allMarketStats
};

const initialState = {
  history: {},
  days: 7,
  pending: false,
  error: false,
  baseAssetId: null,
  subscribed: false,
  prices: {},
  allMarketStats:{},
  markets:{},
  getMarketStatsParams:null,
  getTrxPairDataParams:null,
  marketUpdateTimer:0
};

const mutations = {
  [types.FETCH_MARKET_HISTORY_REQUEST](state, { baseId, days }) {
    state.fetching = true;
    state.baseAssetId = baseId;
    state.days = days;
  },
  [types.FETCH_MARKET_HISTORY_COMPLETE](state, { prices }) {
    state.fetching = false;
    Object.keys(prices).forEach(assetId => {
      Vue.set(state.history, assetId, prices[assetId]);
    });
  },
  [types.FETCH_MARKET_HISTORY_ERROR](state) {
    state.fetching = false;
    state.error = true;
  },
  [types.UPDATE_MARKET_PRICE](state, { assetId, price }) {
    if (!state.history[assetId]) Vue.set(state.history, assetId, {});
    Vue.set(state.history[assetId], 'last', price);
  },
  [types.SUB_TO_MARKET_COMPLETE](state) {
    state.subscribed = true;
  },
  [types.UNSUB_FROM_MARKET_COMPLETE](state) {
    state.subscribed = false;
  },
  [types.SET_MARKET_STATS](state,payload) {
    if (payload) {
        let stats = _calcMarketStats(payload.history, payload.base, payload.quote, payload.last);
        Vue.set(state.allMarketStats,payload.market,stats)
    }
  }
};

const _calcMarketStats=(history, baseAsset, quoteAsset, recent)=>{
      let yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      // console.info("yesterday",yesterday.bcxformat("yyyy/MM:dd HH:mm:ss"))

      yesterday = yesterday.getTime();
      let volumeBase = 0,
          volumeQuote = 0,
          change = 0,
          last = {close_quote: null, close_base: null},
          invert,
          latestPrice,
          noTrades = true;

          baseAsset=Immutable.fromJS(baseAsset);
          quoteAsset=Immutable.fromJS(quoteAsset);

      if (history.length) {
          let first;
          history.forEach((bucket, i) => {
              let date = new Date(bucket.key.open + "+00:00").getTime();
              if (date > yesterday) {
                  noTrades = false;
                  if (!first) {
                      first = history[i > 0 ? i - 1 : i];
                      invert = first.key.base === baseAsset.get("id");
                  }
                  if (invert) {
                      volumeBase += parseInt(bucket.base_volume, 10);
                      volumeQuote += parseInt(bucket.quote_volume, 10);
                  } else {
                      volumeQuote += parseInt(bucket.base_volume, 10);
                      volumeBase += parseInt(bucket.quote_volume, 10);
                  }
              }
          });
          if (!first) {
              first = history[0];
          }
          last = history[history.length -1];
          let open, close;
          if (invert) {
              open = utils.get_asset_price(first.open_quote, quoteAsset, first.open_base, baseAsset, invert);
              close = utils.get_asset_price(last.close_quote, quoteAsset, last.close_base, baseAsset, invert);
          } else {
              open = utils.get_asset_price(first.open_quote, baseAsset, first.open_base, quoteAsset, invert);//Opening price
              close = utils.get_asset_price(last.close_quote, baseAsset, last.close_base, quoteAsset, invert);//Closing price
          }
          change = noTrades ? 0 : Math.round(10000 * (close - open) / open) / 100;
      }

      if (recent && recent.length && recent.length > 1) {
          let order = recent[1].op;
          let paysAsset, receivesAsset, isAsk = false;

          if (order.pays.asset_id === baseAsset.get("id")) {
              paysAsset = baseAsset;
              receivesAsset = quoteAsset;
              isAsk = true;
          } else {
              paysAsset = quoteAsset;
              receivesAsset = baseAsset;
          }
          let flipped = baseAsset.get("id").split(".")[2] > quoteAsset.get("id").split(".")[2];
          latestPrice = market_utils.parse_order_history(order, paysAsset, receivesAsset, isAsk, flipped).full;
      }

      let close = last.close_base && last.close_quote ? {
          quote: {
              amount: invert ? last.close_quote : last.close_base,
              asset_id: invert ? last.key.quote : last.key.base
          },
          base: {
              amount: invert ? last.close_base : last.close_quote,
              asset_id: invert ? last.key.base : last.key.quote
          }
      } : null;

      return {
          change: change.toFixed(2),
          volumeBase: utils.get_asset_amount(volumeBase, baseAsset),
          volumeQuote: utils.get_asset_amount(volumeQuote, quoteAsset),
          close: close,
          latestPrice
      };
}

const _priceChart=(priceHistory,baseAsset,quoteAsset,bucketSize)=>{
  let volumeData = [];
  let prices = [];

  let open, high, low, close, volume;

  let addTime = (time, i, bucketSize) => {
      return new Date(time.getTime() + i * bucketSize * 1000);
  };

  for (let i = 0; i < priceHistory.length; i++) {
      let current = priceHistory[i];
      if (!/Z$/.test(current.key.open)) {
          current.key.open += "Z";
      }
      let date = new Date(current.key.open);

      if (quoteAsset.get("id") === current.key.quote) {
          high = utils.get_asset_price(
              current.high_base,
              baseAsset,
              current.high_quote,
              quoteAsset
          );
          low = utils.get_asset_price(
              current.low_base,
              baseAsset,
              current.low_quote,
              quoteAsset
          );
          open = utils.get_asset_price(
              current.open_base,
              baseAsset,
              current.open_quote,
              quoteAsset
          );
          close = utils.get_asset_price(
              current.close_base,
              baseAsset,
              current.close_quote,
              quoteAsset
          );
          volume = utils.get_asset_amount(
              current.quote_volume,
              quoteAsset
          );
      } else {
          low = utils.get_asset_price(
              current.high_quote,
              baseAsset,
              current.high_base,
              quoteAsset
          );
          high = utils.get_asset_price(
              current.low_quote,
              baseAsset,
              current.low_base,
              quoteAsset
          );
          open = utils.get_asset_price(
              current.open_quote,
              baseAsset,
              current.open_base,
              quoteAsset
          );
          close = utils.get_asset_price(
              current.close_quote,
              baseAsset,
              current.close_base,
              quoteAsset
          );
          volume = utils.get_asset_amount(
              current.base_volume,
              quoteAsset
          );
      }

      function findMax(a, b) {
          if (a !== Infinity && b !== Infinity) {
              return Math.max(a, b);
          } else if (a === Infinity) {
              return b;
          } else {
              return a;
          }
      }

      function findMin(a, b) {
          if (a !== 0 && b !== 0) {
              return Math.min(a, b);
          } else if (a === 0) {
              return b;
          } else {
              return a;
          }
      }

      if (low === 0) {
          low = findMin(open, close);
      }

      if (isNaN(high) || high === Infinity) {
          high = findMax(open, close);
      }

      if (close === Infinity || close === 0) {
          close = open;
      }

      if (open === Infinity || open === 0) {
          open = close;
      }

      if (high > 1.3 * ((open + close) / 2)) {
          high = findMax(open, close);
      }

      if (low < 0.7 * ((open + close) / 2)) {
          low = findMin(open, close);
      }

      prices.push({date, open, high, low, close, volume});
      volumeData.push([date, volume]);
  }

  // max buckets returned is 200, if we get less, fill in the gaps starting at the first data point
  let priceLength = prices.length;
  if (priceLength > 0 && priceLength < 200) {
      let now = new Date().getTime();
      // let firstDate = prices[0].date;
      // United Labs of BCTech.
      // ensure there's a final entry close to the current time
      let i = 1;
      while (
          addTime(prices[0].date, i, bucketSize).getTime() < now
      ) {
          i++;
      }
      let finalDate = addTime(prices[0].date, i - 1, bucketSize);
      if (prices[priceLength - 1].date !== finalDate) {
          if (priceLength === 1) {
              prices.push({
                  date: addTime(finalDate, -1, bucketSize),
                  open: prices[0].close,
                  high: prices[0].close,
                  low: prices[0].close,
                  close: prices[0].close,
                  volume: 0
              });
              prices.push({
                  date: finalDate,
                  open: prices[0].close,
                  high: prices[0].close,
                  low: prices[0].close,
                  close: prices[0].close,
                  volume: 0
              });
              volumeData.push([
                  addTime(finalDate, -1, bucketSize),
                  0
              ]);
          } else {
              prices.push({
                  date: finalDate,
                  open: prices[priceLength - 1].close,
                  high: prices[priceLength - 1].close,
                  low: prices[priceLength - 1].close,
                  close: prices[priceLength - 1].close,
                  volume: 0
              });
          }
          volumeData.push([finalDate, 0]);
      }

      // Loop over the data and fill in any blank time periods
      for (let ii = 0; ii < prices.length - 1; ii++) {
          // If next date is beyond one bucket up
          if (
              prices[ii + 1].date.getTime() !==
              addTime(prices[ii].date, 1, bucketSize).getTime()
          ) {
              // Break if next date is beyond now
              if (
                  addTime(prices[ii].date, 1, bucketSize).getTime() >
                  now
              ) {
                  break;
              }

              prices.splice(ii + 1, 0, {
                  date: addTime(prices[ii].date, 1, bucketSize),
                  open: prices[ii].close,
                  high: prices[ii].close,
                  low: prices[ii].close,
                  close: prices[ii].close,
                  volume: 0
              });
              volumeData.splice(ii + 1, 0, [
                  addTime(prices[ii].date, 1, bucketSize),
                  0
              ]);
          }
      }
  }
  return prices;
}
export default {
  state: initialState,
  actions,
  getters,
  mutations,
  namespaced: true
};
