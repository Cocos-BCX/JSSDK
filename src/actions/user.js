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



export const getAccountBalances = async ({dispatch,rootGetters},params) => {
  helper.trimParams(params)
  let {assetId_or_symbol="",assetId="",account="",callback=null}=params;
  assetId_or_symbol=assetId_or_symbol||assetId;
  if(!account){
    return {code:123,message:'Parameter "account" can not be empty'};
  }
  let result=await getBalances(account,rootGetters); //
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

const getBalances=async (account,rootGetters)=>{
  let result={
    code:1
  }
  let accountBalances=null; //
  let userId=rootGetters['account/getAccountUserId'];
  if(!account&&userId){
    account=userId;
  }

  if(account){
      account=await API.Account.getUser(account);
      if(account.success){
        accountBalances=_utils.balancesToObject(account.data.balances);
        result.data=accountBalances;
        result.contract_asset_locked=format_contract_asset_locked(account.data.account.contract_asset_locked);
      }else{
        result.code=account.code;
        result.message=account.error.message;
      }
  }else if(rootGetters['user/getAccountObject']){
      accountBalances=rootGetters['user/getBalances']
      result.data=accountBalances
  }else{
      result.code=111;
      result.message="Please login first";
  }
  return result;
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

export const getUserAllBalance=async ({dispatch,rootGetters},params)=>{
    helper.trimParams(params)
    let {account,unit}=params;
    if(!account){
      return {code:123,message:'Parameter "account" can not be empty'};
    }

    let contract_asset_locked;
    let accountBalances=await getBalances(account,rootGetters);
    if(accountBalances.code==1){
      contract_asset_locked=JSON.parse(JSON.stringify(accountBalances.contract_asset_locked));
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

    let balances=[];
    let amount=0;
    let fromAsset;
  
    for(let id in accountBalances){
        amount=accountBalances[id].balance;
        fromAsset=reqBalances.get(id);

        let eqValue=amount;
        let fromSymbol = fromAsset.get("symbol");
        if(fromSymbol!=toAsset.symbol){
          let price=marketStats[fromSymbol].latest_price;
          eqValue =eqValue*price;
        }

        let fromAssetPrecision=fromAsset.get("precision");

        let lock_details=contract_asset_locked._lock_details[id]||{};
        for(let key in lock_details){
          lock_details[key]=helper.getFullNum(lock_details[key],fromAssetPrecision);
        }
        balances.push({
          id,
          balance:helper.getFullNum(amount,fromAssetPrecision),
          symbol:fromSymbol,
          precision:fromAssetPrecision,
          eq_value:helper.getFullNum(eqValue,fromAssetPrecision),
          eq_unit:toAsset.symbol,
          eq_precision:toAsset.precision,
          locked_total:helper.getFullNum(contract_asset_locked._locked_total[id]||0,fromAssetPrecision),
          lock_details
        })
    }

    if(!balances.length){
      let core_asset=await API.Assets.fetch(["1.3.0"],true);
      if(core_asset){
        let {symbol,precision}=core_asset;
        balances=[{
            id:"1.3.0",
            balance:0,
            symbol,
            precision,
            eq_value:0,
            eq_unit:toAsset_symbol,
            eq_precision:toAsset.precision,
            locked_total:0,
            lock_details:{}
        }];
      }
    }
    return {code:1,data:balances}
}



export const clearAccountCache=({commit})=>{
   API.Account.clear_accs();
   commit(types.CLEAR_ACCOUNT);
}

export const getUserInfo=async ({dispatch},{account="",isCache=false})=>{
  account=account.trim();
  if(!account){
    account=PersistentStorage.getSavedUserData();
    if(account){
      account=account.userId
    }else{
      return {code:123,message:"Parameter account can not be empty"}
    }
  }

  let acc = await API.Account.getUser(account,isCache);
  if(acc.success){
    return {code:1,data:acc.data}
  }else{
    let {error}=acc;
    return {code:acc.code,message:error.message,error}
  }
}

