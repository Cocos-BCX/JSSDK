import * as types from '../mutations';
import API from '../services/api';
import * as _utils from '../utils/index';
import PersistentStorage from '../services/persistent-storage'
import Immutable from "immutable";
import utils from "../lib/common/utils";
import helper from "../lib/common/helper";


const CORE_ASSET_ID = "1.3.0";

/**
 * Function to convert array of balances to object with keys as assets ids United Labs of BCTech.
 * @param {Array} balancesArr - array of balance objects
 */
const balancesToObject = (balancesArr) => {
  const obj = {};
  balancesArr.forEach(item => {
    obj[item.asset_type] = item;
  });
  return obj;
};

/**
 * Fetches users objects from bcxjs-ws
 * @param {string} username - name of user to fetch
 */
export const fetchUser = async ({ commit,dispatch }, nameOrId) => {
  commit(types.FETCH_USER_REQUEST);
  const result = await API.Account.getUser(nameOrId);
  if (result.success) {
    const user = result.data;
    user.balances = balancesToObject(user.balances);
    commit(types.FETCH_USER_COMPLETE, user);
    // dispatch("account/updateAccountData",user,{root:true}United Labs of BCTech.);
  } else {
    commit(types.FETCH_USER_ERROR);
  }

  return result;
};

export const fetchUserForIsSave= async ({ commit,dispatch },{nameOrId,isSave=false,pubkey}) => {
    if(isSave)
      commit(types.FETCH_USER_REQUEST);

      const result = await API.Account.getUser(nameOrId);

      if(isSave){
        if (result.success) {
          const user = result.data;    
          if(pubkey&&user.account.active.key_auths[0]!=pubkey){
            return;
          }
          dispatch("account/setAccountUserId",user.account.id,{root:true});
          user.balances = balancesToObject(user.balances);
          commit(types.FETCH_USER_COMPLETE, user);
        } else {
          commit(types.FETCH_USER_ERROR);
        }
     }

     return result;
};


export const getUserNameByUserId= async ({ commit },nameOrId) => {
  const result = await API.Account.getUser(nameOrId);
  if(result.success){
    return result.data.account.name
  }
  return "";
};



export const getAccountBalances = async (store,params) => {
  let {dispatch,rootGetters}=store;
  helper.trimParams(params)
  let {assetId_or_symbol="",assetId="",account="",callback=null}=params;
  assetId_or_symbol=assetId_or_symbol||assetId;
  if(!account){
    return {code:123,message:'Parameter "account" can not be empty'};
  }
  let result=await getBalances(account,store); //
  if(result.code==1){
      let accountBalances=JSON.parse(JSON.stringify(result.data));
      result.data={};
      if(assetId_or_symbol){
        assetId_or_symbol=assetId_or_symbol.toUpperCase();
      }
      let assetIds=assetId_or_symbol?[assetId_or_symbol]:Object.keys(accountBalances);
      if(assetIds.length){
        let reqBalances=await dispatch("assets/fetchAssets",{assets:assetIds},{root:true});//queried assets info
        if(reqBalances){
          let reqBalanceItem,accountBalanceItem;
          for(let asset_id in accountBalances){
            reqBalanceItem=reqBalances[asset_id];
            if(!reqBalanceItem){
              continue;
            }
            accountBalanceItem=accountBalances[asset_id];
            result.data[reqBalanceItem.symbol]=helper.getFullNum(accountBalanceItem.balance/Math.pow(10,reqBalanceItem.precision));
          }   
          if(!Object.keys(result.data).length){
            result.code=125;
            result.message="Users do not own "+(assetId_or_symbol||"")+"assets";
          }
        }else{
          result.code=115;
          result.message="There is no asset "+assetId_or_symbol+" in the block chain";
        }
      } 
  }
  return result;
};

const getBalances=async (account,store)=>{
  let {rootGetters}=store;
  let result={
    code:1
  }
  let accountBalances=null; //
  let userId=rootGetters['account/getAccountUserId'];
  if(!account&&userId){
    account=userId;
  }
  let full_account;
  if(account){
      let account_res=await API.Account.getUser(account);
      if(account_res.success){
         full_account=account_res.data;
         accountBalances=_utils.balancesToObject(full_account.balances);
        // if(account.data.account.contract_asset_locked)
        //    result.contract_asset_locked=format_contract_asset_locked(account.data.account.contract_asset_locked);
      }else{
        result.code=account_res.code;
        result.message=account_res.error.message;
      }
  }else if(rootGetters['user/getAccountObject']){
       full_account=rootGetters['user/getAccountObject'];
      accountBalances=rootGetters['user/getBalances']
  }else{
      result.code=111;
      result.message="Please login first";
  }
  if(result.code==1){
    result.data=accountBalances;
    result.asset_locked=await format_asset_locked(full_account,store);
  }
  return result;
}

const format_asset_locked=async (full_account,store)=>{
  let {locked_total,witness_freeze,vote_for_witness,contract_lock_details}=full_account.account.asset_locked;

  let {precision,symbol}=await API.Assets.fetch(["1.3.0"],true);
  let _witness_freeze={
    amount:0,
    symbol
  }
  let vote_freeze={
    amount:0,
    symbol,
    details:[]
  }
  let contract_freeze={
    amount:0,
    symbol,
    details:[],
    contracts:[]
  };

  if(witness_freeze) _witness_freeze.amount=helper.getFullNum(witness_freeze.amount,precision);
  if(vote_for_witness) {
    vote_freeze.amount=helper.getFullNum(vote_for_witness.amount,precision);
    vote_freeze.details=await Promise.all(full_account.votes.map(async vote=>{
        let vote_acc_name=vote.witness_account;
        let acc_res=await API.Account.getAccount(vote_acc_name,true);
        if(acc_res.success){
          vote_acc_name=acc_res.data.account.name
        }
        return vote_acc_name
    }))
  }

  let _locked_total={};
  let locked_total_assets=locked_total.map(item=>item[0]);
  if(locked_total_assets.length){
     let assets=await store.dispatch("assets/fetchAssets",{
        assets:locked_total_assets,
        isCache:true
      },{root:true});
      locked_total.forEach(item=>{
        _locked_total[item[0]]=helper.getFullNum(item[1],assets[item[0]].precision);
      });

      let contract_name="";
      if(contract_lock_details){
        await Promise.all(
          contract_lock_details.map(async item=>{
              contract_name=item[0];
              let c_res=await API.Contract.getContract(item[0],true);
              if(c_res.code==1) contract_name=c_res.data.name;
              contract_freeze.contracts.push(contract_name)
               item[1].forEach(asset=>{
                 let amount=helper.getFullNum(asset[1],precision);
                 if(asset[0]=="1.3.0") contract_freeze.amount+=amount;
                 contract_freeze.details.push({
                  contract_name,
                  amount,
                  symbol:assets[asset[0]].symbol
                 })
              })
             
              return item;
          })
        )

      }
  }

   return {
    locked_total:_locked_total,
    lock_details:{
      vote_freeze,
      contract_freeze,
      witness_freeze:_witness_freeze
    }
   }
}

const format_contract_asset_locked=({locked_total,lock_details})=>{
    let _locked_total={};
    locked_total.forEach(item=>{
      _locked_total[item[0]]=item[1];
    });
    let _lock_details={};
    for(let i=0;i<lock_details.length;i++){
        let [contract_id,contract_assets_locked]=lock_details[i];
        for(let j=0;j<contract_assets_locked.length;j++){
          let [asset_id,amount]=contract_assets_locked[j];
          if(_lock_details[asset_id]){
            _lock_details[asset_id][contract_id]=amount;
          }else{
            _lock_details[asset_id]={
              [contract_id]:amount
            }
          }
        }
    }

    return {
      _locked_total,
      _lock_details
    }
}

export const getUserAllBalance=async (store,params)=>{
    let {dispatch,rootGetters}=store;
    helper.trimParams(params)
    let {account,unit}=params;
    if(!account){
      return {code:123,message:'Parameter "account" can not be empty'};
    }

    let contract_asset_locked;
    let asset_locked;
    let accountBalances=await getBalances(account,store);
    if(accountBalances.code==1){
      // if(accountBalances.contract_asset_locked)
      //   contract_asset_locked=JSON.parse(JSON.stringify(accountBalances.contract_asset_locked));
        if(accountBalances.asset_locked) asset_locked=JSON.parse(JSON.stringify(accountBalances.asset_locked));

        accountBalances=JSON.parse(JSON.stringify(accountBalances.data));
    }else{
      return accountBalances;
    }

    let toAsset_symbol=unit||rootGetters["setting/defaultSettings"].unit;
    let toAssets=await dispatch("assets/fetchAssets",{assets:[toAsset_symbol],isOne:false},{root:true});
    if(!toAssets){
      return {code:126,message:"There is no asset "+toAsset_symbol+" in the block chain"};
    }

    if(/1.3.\d+/.test(toAsset_symbol)){//transformation when incoming unit is an asset ID
      toAsset_symbol=toAssets[toAsset_symbol].symbol;
    }
   
  
    let toAsset;
    for(let assetId in toAssets){ 
      if(toAssets[assetId].symbol==toAsset_symbol){
          toAsset=toAssets[assetId];
      }
    }

    let assetsIds=Object.keys(accountBalances)
    if(!accountBalances.toAssetId)  assetsIds.push(toAsset.id);
    let reqBalances=await dispatch("assets/fetchAssets",{assets:assetsIds},{root:true});//queried assets info
    let quoteAssets=Object.keys(reqBalances).filter(key=>/^[a-zA-Z]+$/.test(key))
    reqBalances=Immutable.fromJS(reqBalances);

    //get queried assets' market info
    let marketStats={};

    (await dispatch("market/getMarketStats",{
      baseAsset:toAsset_symbol,
      quoteAssets,
    },{root:true})).data.forEach(asset=>{
      marketStats[asset.quote_symbol]=asset;
    })

    // console.info("marketStats",marketStats);
    let balances=[];
    let amount=0;
    let fromAsset;
  
    for(let id in accountBalances){
        amount=accountBalances[id].balance;
        fromAsset=reqBalances.get(id);

        let eqValue=amount;
        let fromSymbol = fromAsset.get("symbol");
        if(fromSymbol!=toAsset.symbol){
          console.log("=======")
          console.log(marketStats)
          console.log(fromSymbol)
          console.log(eqValue)
          console.log(marketStats.hasOwnProperty(fromSymbol))
          let price=marketStats[fromSymbol].latest_price;
          eqValue =eqValue*price;
        }
        let fromAssetPrecision=fromAsset.get("precision");
        let locked_total=asset_locked.locked_total[id]||0;
        let balance=helper.getFullNum(amount,fromAssetPrecision);
        // let locked_total=asset_locked._locked_total;
        // if(id in locked_total){
          
        // }
        // let lock_details;
        // if(contract_asset_locked){
        //    lock_details=contract_asset_locked._lock_details[id]||{};
        //   for(let key in lock_details){
        //     lock_details[key]=helper.getFullNum(lock_details[key],fromAssetPrecision);
        //   }
        // }
        
        balances.push({
          id,
          balance,
          available_balance:Number((balance-locked_total).toFixed(fromAssetPrecision)),
          symbol:fromSymbol,
          precision:fromAssetPrecision,
          eq_value:id!="1.3.1"?helper.getFullNum(eqValue,fromAssetPrecision):0,
          eq_unit:toAsset.symbol,
          eq_precision:toAsset.precision,
          locked_total
          //locked_total:contract_asset_locked?helper.getFullNum(contract_asset_locked._locked_total[id]||0,fromAssetPrecision):0,
          //lock_details:lock_details||{}
        })
    }

    if(!balances.length){
      let core_asset=await API.Assets.fetch(["1.3.0"],true);
      if(core_asset){
        let {symbol,precision}=core_asset;
        balances=[{
            id:"1.3.0",
            balance:0,
            available_balance:0,
            symbol,
            precision,
            eq_value:0,
            eq_unit:toAsset_symbol,
            eq_precision:toAsset.precision,
            locked_total:0//,
            //lock_details:{}
        }];
      }
    }
    return {code:1,data:balances,asset_locked}
}



export const clearAccountCache=({commit})=>{
   API.Account.clear_accs();
   commit(types.CLEAR_ACCOUNT);
}

export const getUserInfo=async ({dispatch},{account="",isCache=false,isSubscribe=false})=>{
  account=account.trim();
  if(!account){
    account=PersistentStorage.getSavedUserData();
    if(account){
      account=account.userId
    }else{
      return {code:123,message:"Parameter account can not be empty"}
    }
  }

  let acc = await API.Account.getUser(account,isCache,isSubscribe);
  if(acc.success){
    return {code:1,data:acc.data}
  }else{
    let {error}=acc;
    return {code:acc.code,message:error.message,error}
  }
}

