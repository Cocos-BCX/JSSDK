import { Apis } from 'bcxjs-ws';
import * as utils from '../../utils';
import listener from './chain-listener';
import Subscriptions from './subscriptions';
import Immutable from "immutable";

import {LimitOrder, CallOrder, FeedPrice, SettleOrder, Asset,
  didOrdersChange} from "../../lib/common/MarketClasses";
  
import {ChainStore,ChainTypes} from "bcxjs-cores";

import _utils from "../../lib/common/utils";
import market_utils from "../../lib/common/market_utils";

import API from '../api';

const {operations} = ChainTypes;
const nullPrice = {
  getPrice: () => {return 0;},
  sellPrice: () => {return 0;},
};

const findOrder = (orderId) => {
  return (order) => orderId === order.id;
};

const calcOrderRate = (order) => {
  const {
    sell_price: {
      quote: {
        amount: quoteAmount
      },
      base: {
        amount: baseAmount
      }
    }
  } = order;
  return baseAmount / quoteAmount;
};

const loadLimitOrders = async (baseId, quoteId, limit = 500) => {
  const orders = await Apis.instance().db_api().exec(
    'get_limit_orders',
    [baseId, quoteId, limit]
  );
  const buyOrders = [];
  const sellOrders = [];
  orders.forEach((order) => {
    if (order.sell_price.base.asset_id === baseId) {
      buyOrders.push(order);
    } else {
      sellOrders.push(order);
    }
  });
  return { buyOrders, sellOrders };
};

let _marketAddSubscription=false;
class Market {
  constructor(base="1.3.0") {
    this.base = base;
    this.markets = {};
    this.fee = 578;
    this.marketData={};
    this.marketLimitOrders=Immutable.Map();
    this.marketCallOrders = Immutable.Map();
    this.activeMarketHistory = Immutable.OrderedSet();

    // const marketsSubscription = new Subscriptions.Markets({
    //   callback: this.onMarketUpdate.bind(this)
    // });
    // console.info("marketsSubscription",marketsSubscription);
    // listener.addSubscription(marketsSubscription);
  }

  getFee() {
    return this.fee;
  }

  getCallback(pays, receives) {
    if (pays === this.base) {
      if (this.isSubscribed(receives)) {
        return this.markets[receives].callback;
      }
    }
    if (receives === this.base) {
      if (this.isSubscribed(pays)) {
        return this.markets[pays].callback;
      }
    }
    return false;
  }

  getOrdersArray(pays, receives) {
    if (pays === this.base) {
      if (this.isSubscribed(receives)) {
        return this.markets[receives].orders.buy;
      }
    }
    if (receives === this.base) {
      if (this.isSubscribed(pays)) {
        return this.markets[pays].orders.sell;
      }
    }
    return false;
  }

  onMarketUpdate(type, object) {
    let assetId=this.quoteAsset.get("id");
    clearTimeout(this.marketUpdateTimer);
    this.marketUpdateTimer=setTimeout(() => {
      this.subscribeToMarket(assetId)
    }, 300);
  }

  onOrderDelete(notification) {
    Object.keys(this.markets).forEach((market) => {
      Object.keys(this.markets[market].orders).forEach((type) => {
        const idx = this.markets[market].orders[type].findIndex(findOrder(notification));
        if (idx >= 0) {
          this.markets[market].orders[type].splice(idx, 1);
          this.markets[market].callback('DELETE ORDER');
        }
      });
    });
  }

  onNewLimitOrder(order) {
    const {
      base: {
        asset_id: pays
      },
      quote: {
        asset_id: receives
      }
    } = order.sell_price;

    const orders = this.getOrdersArray(pays, receives);

    if (orders) {
      orders.push(order);
      const callback = this.getCallback(pays, receives);
      callback('ADD ORDER');
    }
  }

  onOrderFill(data) {
    const {
      order_id: orderId,
      pays: { amount, asset_id: pays },
      receives: { asset_id: receives }
    } = data.op[1];

    const orders = this.getOrdersArray(pays, receives);

    if (orders) {
      const idx = orders.findIndex(findOrder(orderId));
      if (idx !== -1) {
        orders[idx].for_sale -= amount;
        const callback = this.getCallback(pays, receives);
        callback('FILL ORDER');
      }
    }
  }

  isSubscribed(assetId) {
    return (this.markets[assetId] !== undefined);
  }

  setDefaultObjects(assetId) {
    if (!this.markets[assetId]) {
      this.markets[assetId] = {
        orders: {
          buy: [], sell: []
        },
        callback: () => {}
      };
    }
  }

  async subscribeToMarket(assetId, callback) {
    if (assetId === this.base) return;
    const { buyOrders, sellOrders } = await loadLimitOrders(this.base, assetId);
    
    if(!this.markets[assetId]){
      this.setDefaultObjects(assetId);
      this.markets[assetId].callback = callback;
    }

    // console.log('setting default: ' + assetId + ' : ', this.markets[assetId]);
    this.markets[assetId].orders.buy = buyOrders;
    this.markets[assetId].orders.sell = sellOrders;
  

    this.marketData=this.markets[assetId];
    this.marketData.limits=buyOrders.concat(sellOrders);
    this.marketData.history=await Apis.instance().history_api().exec("get_fill_order_history", [this.base, assetId, 200]);
    if(this.hasMyTradeHistory&&this.currentAccount){
      let history=await Apis.instance().history_api().exec(
        'get_account_history',
        [this.currentAccount.account.id, '1.11.0', 100, '1.11.0']
      );
      
      this.currentAccount.history=await Promise.all(history.map(async item=>{
        let block_res=await API.Operations.get_block_header(item.block_num);
        if(block_res.code==1){
          item.block_time=new Date(block_res.data.timestamp+"Z").bcxformat("yyyy/MM/dd HH:mm:ss");
        }
        return item;
      }))
    }
   
    this.marketData.history.forEach(order => {
        order.op.time = order.time;
        this.activeMarketHistory = this.activeMarketHistory.add(
            order.op
        );
    });
    const assets = {
      [this.quoteAsset.get("id")]: {precision: this.quoteAsset.get("precision")},
      [this.baseAsset.get("id")]: {precision: this.baseAsset.get("precision")}
    };
    this.marketLimitOrders=Immutable.Map();
    this._marketLimitOrders=Immutable.Map();
    this.marketData.limits.forEach(order => {
        ChainStore._updateObject(order, false, false);
        if (typeof order.for_sale !== "number") {
            order.for_sale = parseInt(order.for_sale, 10);
        }
        order.expiration = new Date(order.expiration);
        this.marketLimitOrders = this.marketLimitOrders.set(
            order.id,
            new LimitOrder(order, assets, assetId)
        );
        this._marketLimitOrders = this._marketLimitOrders.set(
          order.id,
          new LimitOrder(order, assets, assetId)
      );
    });
    this._orderBook();
    this.markets[assetId].callback&&this.markets[assetId].callback();
  }

   _orderBook(limitsChanged = true, callsChanged = false) {
    // Loop over limit orders and return array containing bids
    let constructBids = (orderArray) => {
        let bids = orderArray.filter(a => {
            return a.isBid();
        }).sort((a, b) => {
            return a.getPrice() - b.getPrice();
        }).map(order => {
            return order;
        }).toArray();
  
        // Sum bids at same price
        if (bids.length > 1) {
            for (let i = bids.length - 2; i >= 0; i--) {
                if (bids[i].getPrice() === bids[i + 1].getPrice()) {
                    bids[i].sum(bids[i + 1]);
                    bids.splice(i + 1, 1);
                }
            }
        }
        return bids;
    };
    // Loop over limit orders and return array containing asks
    let constructAsks = (orderArray) => {
        let asks = orderArray.filter(a => {
            return !a.isBid();
        }).sort((a, b) => {
            return a.getPrice() - b.getPrice();
        }).map(order => {
            return order;
        }).toArray();
        // Sum asks at same price
        if (asks.length > 1) {
            for (let i = asks.length - 2; i >= 0; i--) {
                if (asks[i].getPrice() === asks[i + 1].getPrice()) {
                    asks[i].sum(asks[i + 1]);
                    asks.splice(i + 1, 1);
                }
            }
        }
        return asks;
    };
  
    // Assign to store variables
    if (limitsChanged) {
        // console.time("Construct limit orders " + this.activeMarket);
        this.marketData.bids = constructBids(this.marketLimitOrders);
        this.marketData.asks = constructAsks(this.marketLimitOrders);
        if (!callsChanged) {
            this._combineOrders();
        }
        // console.timeEnd("Construct limit orders " + this.activeMarket);
    }
  
    if (callsChanged) {
        // console.time("Construct calls " + this.activeMarket);
        this.marketData.calls = this.constructCalls(this.marketCallOrders);
        this._combineOrders();
        // console.timeEnd("Construct calls " + this.activeMarket);
    }
    // console.log("time to construct orderbook:", new Date() - orderBookStart, "ms");
  }
  
  constructCalls (callsArray) {
      let calls = [];
      if (callsArray.size) {
          calls = callsArray
          .sort((a, b) => {
              return a.getPrice() - b.getPrice();
          }).map(order => {
              if (this.invertedCalls) {
                  this.lowestCallPrice = !this.lowestCallPrice ? order.getPrice(false) : Math.max(this.lowestCallPrice, order.getPrice(false));
              } else {
                  this.lowestCallPrice = !this.lowestCallPrice ? order.getPrice(false) : Math.min(this.lowestCallPrice, order.getPrice(false));
              }

              return order;
          }).toArray();

          // Sum calls at same price
          if (calls.length > 1) {
              for (let i = calls.length - 2; i >= 0; i--) {
                  calls[i] = calls[i].sum(calls[i + 1]);
                  calls.splice(i + 1, 1);
              }
          }
      }
      return calls;
  }
  unsubscribeFromMarket(assetId) {
    if (this.isSubscribed(assetId)) {
      delete this.markets[assetId];
    }
  }

  unsubscribeFromExchangeRate(assetId) {
    this.unsubscribeFromMarket(assetId);
  }

  unsubscribeFromMarkets() {
    this.markets = {};
  }

  async subscribeToExchangeRate(trxPair, currentAccount,hasMyTradeHistory,callback) {
    this.currentAccount=currentAccount;
    this.hasMyTradeHistory=hasMyTradeHistory;
    trxPair=trxPair.split("_");
    var asset_ress=await Promise.all(trxPair.map((asset,index)=>{
        return API.Assets.fetch_asset_one(asset);
    }))
    if(asset_ress[0].code!=1){
      callback&&callback(asset_ress[0]);
      return 
    }
    if(asset_ress[1].code!=1){
      callback&&callback(asset_ress[1]);
      return;
    }
    this.quoteAsset=Immutable.fromJS(asset_ress[0].data);
    this.baseAsset=Immutable.fromJS(asset_ress[1].data);
    this.base=this.baseAsset.get("id");
    let assetId=this.quoteAsset.get("id");
    

    this.amount=(currentAccount&&currentAccount.balances[assetId])?currentAccount.balances[assetId].balance:0;

    let canReceiveInBasePrev = 0;
    this.firstCallSub=true;
    const wrappedCallback = () => {
      const canReceiveInBase = this.calcExchangeRate(assetId, 'sell', this.amount);
      if (canReceiveInBase !== canReceiveInBasePrev && canReceiveInBase > 0) {
        canReceiveInBasePrev = canReceiveInBase;
      }

      let {combinedBids,combinedAsks}=this.marketData;
      let _marketsData={
        orders:{
          buy:this.ordersToObject(combinedBids),
          sell:this.ordersToObject(combinedAsks)
        },
        my_orders:this.currentAccount?this.getMyOrders():[],
        last_trade_history:this.getTradeHistory()
      }
      //_marketsData.my_last_trade_history=
      this.getMyHistory().then(data=>{
        _marketsData.my_last_trade_history=data;
        callback({code:1,data:_marketsData},assetId, canReceiveInBase,this.firstCallSub);
        this.firstCallSub=false;
      })
    };

    await this.subscribeToMarket(assetId, wrappedCallback);
  }
  async getMyHistory(){
    if(!this.hasMyTradeHistory||!this.currentAccount){
      return [];
    }
    let keyIndex = -1;
    let flipped = this.baseAsset.get("id").split(".")[2] > this.quoteAsset.get("id").split(".")[2];
  
    const ApiObject =[(await API.Explorer.getGlobalObject()).data];
    const ApiObjectDyn =[(await API.Explorer.getDynGlobalObject(false)).data];
 
    return Promise.all(Immutable.fromJS(this.currentAccount.history).filter(a => {
              let opType = a.getIn(["op", 0]);
              return (opType === operations.fill_order);
          }).filter(a => {
              let quoteID = this.quoteAsset.get("id");
              let baseID = this.baseAsset.get("id");
              let pays = a.getIn(["op", 1, "pays", "asset_id"]);
              let receives = a.getIn(["op", 1, "receives", "asset_id"]);
              let hasQuote = quoteID === pays || quoteID === receives;
              let hasBase = baseID === pays || baseID === receives;
              return hasQuote && hasBase;
          }).sort((a, b) => {
            return a.get("block_num") - a.get("block_num");
          })
          .map(async trx => {
              let order = trx.toJS().op[1];
              //console.debug('order',trx.toJS());
              keyIndex++;
              let paysAsset, receivesAsset, isAsk = false;
              if (order.pays.asset_id === this.baseAsset.get("id")) {
                  paysAsset = this.baseAsset;
                  receivesAsset = this.quoteAsset;
                  isAsk = true;

              } else {
                  paysAsset = this.quoteAsset;
                  receivesAsset = this.baseAsset;
              }

              let parsed_order = market_utils.parse_order_history(order, paysAsset, receivesAsset, isAsk, flipped);

              const block_num = trx.get("block_num");
              let price=parsed_order.int+".";

                price+=parsed_order.dec||"";
                price+=parsed_order.trailing||"";

              let date="";
              let block_res=await API.Operations.get_block_header(block_num);
              if(block_res.code==1){
                date=new Date(block_res.data.timestamp+"Z").bcxformat("yyyy/MM/dd HH:mm:ss");
              }else{
                 date = API.Operations._getOperationDate(trx.toJS(), ApiObject, ApiObjectDyn);
              }

              return {
                price,
                price_unit:this.baseAsset.get("symbol"),
                amount:_utils.formatNumber(parsed_order.receives, 4),
                amount_unit:this.quoteAsset.get("symbol"),
                turnover:_utils.formatNumber(parsed_order.pays, 4),
                turnover_unit:this.baseAsset.get("symbol"),
                block_num,
                block_time:date,//trx.get("block_time"),
                type:parsed_order.className=="orderHistoryBid"?"buy":"sell"
              }
          }).toArray());
  }
  getTradeHistory(){
    let index = 0;
    let keyIndex = -1;
    let flipped = this.baseAsset.get("id").split(".")[2] > this.quoteAsset.get("id").split(".")[2];

   return this.activeMarketHistory
        .filter(a => {
            index++;
            return index % 2 === 0;
        })
        .take(100)
        .map(order => {
          //console.debug('order:',order)
          keyIndex++;
          let paysAsset, receivesAsset, isAsk = false;
          if (order.pays.asset_id === this.baseAsset.get("id")) {
              paysAsset = this.baseAsset;
              receivesAsset =  this.quoteAsset;
              isAsk = true;

          } else {
              paysAsset =  this.quoteAsset;
              receivesAsset = this.baseAsset;
          }

          let parsed_order = market_utils.parse_order_history(order, paysAsset, receivesAsset, isAsk, flipped);
          // let time = parsed_order.time.split(':');
          // if (time.length > 2) {
          //     time = time[0].substr(2) + ':' + time[1];
          // }

          let price=parsed_order.int+".";

          //if(formattedPrice.full >= 1){
            price+=parsed_order.dec||"";
            price+=parsed_order.trailing||"";
          //}
          return {
            price,
            price_unit:this.baseAsset.get("symbol")+"/"+this.quoteAsset.get("symbol"),
            amount:_utils.formatNumber(parsed_order.receives, 4),
            amount_unit:this.quoteAsset.get("symbol"),
            turnover:_utils.formatNumber(parsed_order.pays, 4),
            turnover_unit:this.baseAsset.get("symbol"),
            block_time:parsed_order.time,
            type:parsed_order.className=="orderHistoryBid"?"buy":"sell"
          }
      }).toArray();
  }
  getMyOrders(){
    var buyOrders=this._marketLimitOrders.filter(a=>{
      return (a.seller === this.currentAccount.account.id && a.sell_price.quote.asset_id !== this.baseAsset.get("id"));
    }).sort((a, b) => {
      let {price: a_price} = market_utils.parseOrder(a, this.baseAsset, this.quoteAsset);
      let {price: b_price} = market_utils.parseOrder(b, this.baseAsset, this.quoteAsset);

      return b_price.full - a_price.full;
   }).toArray().map(item=>{
     item.type="buy";
     return item;
   });

   var sellOrders=this._marketLimitOrders.filter(a=>{
      return (a.seller === this.currentAccount.account.id && a.sell_price.quote.asset_id === this.baseAsset.get("id"));
    }).sort((a, b) => {
      let {price: a_price} = market_utils.parseOrder(a, this.baseAsset, this.quoteAsset);
      let {price: b_price} = market_utils.parseOrder(b, this.baseAsset, this.quoteAsset);

      return a_price.full - b_price.full;
    }).toArray().map(item=>{
      item.type="sell";
      return item;
    });
   
    return this.ordersToObject(buyOrders.concat(sellOrders));
  }
  ordersToObject(orders){
    return orders.map(order=>{
      const isBid = order.isBid();
      let {price} = market_utils.parseOrder(order, this.baseAsset, this.quoteAsset);

      let item={
        order_id:order.id,
        price:_utils.format_number(price.full, this.baseAsset.get("precision")),
        price_unit:this.baseAsset.get("symbol"),
        amount:_utils.format_number(order[isBid ? "amountToReceive" : "amountForSale"]().getAmount({real: true}), this.quoteAsset.get("precision")),
        amount_unit:this.quoteAsset.get("symbol"),
        turnover:_utils.format_number(order[isBid ? "amountForSale" : "amountToReceive"]().getAmount({real: true}),  this.baseAsset.get("precision")),
        turnover_unit:this.baseAsset.get("symbol"),
        expiration:new Date(order.expiration+"Z").bcxformat("yyyy/MM/dd HH:mm:ss")
      }
      if(order.type){
        item.type=order.type;
      }
      return item;
    })
  }
  calcExchangeRate(assetId, weWantTo, amount) {
    let totalPay = amount;
    let totalReceive = 0;

    const requiredType = (weWantTo === 'sell') ? 'buy' : 'sell';
    // console.log('cakc exchange rate for ' + assetId + ': ', this.markets[assetId]);
    const orders = [...this.markets[assetId].orders[requiredType]].sort((a, b) =>
      calcOrderRate(b) - calcOrderRate(a));
    for (let i = 0; i < orders.length; i += 1) {
      const { for_sale: saleAmount, sell_price: price } = orders[i];
      const orderPrice = price.base.amount / price.quote.amount;
      const weCanPayHere = saleAmount / orderPrice;

      if (totalPay > weCanPayHere) {
        totalReceive += saleAmount;
        totalPay -= weCanPayHere;
      } else {
        totalReceive += totalPay * orderPrice;
        break;
      }
    }
    return Math.floor(totalReceive);
  }

  generateOrders({ update, balances, baseBalances, userId }) {
    const calculated = utils.getValuesToUpdate(balances, baseBalances, update);
    const sellOrders = [];
    const buyOrders = [];

    Object.keys(calculated.sell).forEach((assetId) => {
      const toSell = calculated.sell[assetId];
      // if (!toSell) return;
      let toReceive = this.calcExchangeRate(assetId, 'sell', toSell);
      const fee = this.getFee(assetId);
      if (toReceive > fee) {
        toReceive -= fee;
        const orderObject = {
          sell: {
            asset_id: assetId,
            amount: toSell
          },
          receive: {
            asset_id: this.base,
            amount: toReceive
          },
          userId,
          fillOrKill: true
        };
        const order = utils.createOrder(orderObject);

        sellOrders.push(order);
      }
    });


    Object.keys(calculated.buy).forEach((assetId) => {
      let toSellBase = calculated.buy[assetId];
      const fee = this.getFee(assetId);
      if (toSellBase > fee) {
        toSellBase -= fee;
        const toReceive = this.calcExchangeRate(assetId, 'buy', toSellBase);
        if (!toReceive) return;
        const orderObject = {
          sell: {
            asset_id: this.base,
            amount: toSellBase
          },
          receive: {
            asset_id: assetId,
            amount: toReceive
          },
          userId
        };
        const order = utils.createOrder(orderObject);
        buyOrders.push(order);
      }
    });

    return {
      sellOrders,
      buyOrders
    };
  }

  _combineOrders() {
      const hasCalls = !!this.marketCallOrders.size;
      const isBid = hasCalls && this.marketCallOrders.first().isBid();
      if (isBid) {
          this.marketData.combinedBids = this.marketData.bids.concat(this.marketData.calls);
          this.marketData.combinedAsks = this.marketData.asks.concat([]);
      } else {
          this.marketData.combinedBids = this.marketData.bids.concat([]);
          this.marketData.combinedAsks = this.marketData.asks.concat(this.marketData.calls||[]);
      }

      let totalToReceive = new Asset({
          asset_id: this.quoteAsset.get("id"),
          precision: this.quoteAsset.get("precision")
      });

      let totalForSale = new Asset({
          asset_id: this.baseAsset.get("id"),
          precision: this.baseAsset.get("precision")
      });
      this.marketData.combinedBids.sort((a, b) => {
          return b.getPrice() - a.getPrice();
      }).forEach(a => {
          totalToReceive.plus(a.amountToReceive(false));
          totalForSale.plus(a.amountForSale());

          a.setTotalForSale(totalForSale.clone());
          a.setTotalToReceive(totalToReceive.clone());
      });

      totalToReceive = new Asset({
          asset_id: this.baseAsset.get("id"),
          precision: this.baseAsset.get("precision")
      });

      totalForSale = new Asset({
          asset_id: this.quoteAsset.get("id"),
          precision: this.quoteAsset.get("precision")
      });

      this.marketData.combinedAsks.sort((a, b) => {
          return b.getPrice()-a.getPrice();
      }).forEach(a => {
          totalForSale.plus(a.amountForSale());
          totalToReceive.plus(a.amountToReceive(true));
          a.setTotalForSale(totalForSale.clone());
          a.setTotalToReceive(totalToReceive.clone());
      });

      this.marketData.lowestAsk = !this.marketData.combinedAsks.length ? nullPrice :
          this.marketData.combinedAsks[0];

      this.marketData.highestBid = !this.marketData.combinedBids.length ? nullPrice :
          this.marketData.combinedBids[0];
  }
}


export default Market;
