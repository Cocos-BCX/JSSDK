// require('babel-polyfill');
if(process.browser){
  require('indexeddbshim');
}

import Vue from 'vue'
import Vuex from 'vuex';

import setting from './modules/setting.js';
import account from './modules/account.js';
import connection from './modules/connection.js';
import transactions from './modules/transactions.js';
import user from './modules/user.js';
import assets from './modules/assets.js';
import market from './modules/market.js';
import operations from './modules/operations.js';
import PrivateKeyStore from './modules/PrivateKeyStore.js';
import WalletDb from './modules/WalletDb.js';
import contract from './modules/contract.js';
import history from './modules/history.js';
import vote from './modules/vote.js';
import NHAssets from './modules/NHAssets.js';
import proposals from './modules/proposals.js';
import explorer from './modules/explorer.js';

import AddressIndex from './store/AddressIndex.js';
import AccountRefsStore from './store/AccountRefsStore.js';
import WalletManagerStore from './store/WalletManagerStore.js';
import CachedPropertyStore from './store/CachedPropertyStore.js';
import BackupStore from './store/BackupStore.js';
import AccountStore from './store/AccountStore.js';

import * as utils from './utils/index';

var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self
  : Function('return this')();

  class BCX {
      constructor(params){      
          //Vuex.Storeinitialization
          Vue.use(Vuex);
          this.api = new Vuex.Store({
              modules: {
                setting,
                account,
                transactions,
                connection,
                user,
                assets,
                setting,
                market,
                history,
                operations,
                PrivateKeyStore,
                WalletDb,
                contract,
                vote,
                NHAssets,
                proposals,
                explorer,
                AddressIndex,
                AccountRefsStore,
                WalletManagerStore,
                CachedPropertyStore,
                BackupStore,
                AccountStore
              }
          });

          this.apiMethodsInt();

          this.apiConfig(params,false);
      }
      
      getApiConfig(){
        return this.api.getters["setting/getApiConfig"];
      }
      apiConfig(params,isSwitchNode=true){        
        //API parameters initialization
        if(isSwitchNode){
          return this.api.dispatch("setting/setSettingsAPIS",params).then(res=>{
               return this.switchAPINode({
                   url:this.api.getters["setting/g_settingsAPIs"].select_ws_node,
                   callback:params.callback
               });
          });  
         }else{
           return this.api.dispatch("setting/setSettingsAPIS",params);
         }
      }

      //initialization and connect websocket. Can be called without initialization, API will automatic initialization if not initialized.
      init(params){
        if(params&&(params.callback||typeof params=="function")){
           this.api.dispatch("connection/initConnection",params);
        }else{
          return new Promise(resolve=>{
             //using params.callback, to compatible with API.
             if(typeof params!="object") params={};
             params.callback=res=>resolve(res);
             this.api.dispatch("connection/initConnection",params);
          })
        }
      }
      //abstractable methods initialization
      apiMethodsInt(){
          const apiMethods={
              queryAccountInfo:"user/getUserInfo", //query user info 
              queryAccountBalances:"user/getAccountBalances",//query account's specified asset
              queryAccountAllBalances:"user/getUserAllBalance", //query account's owned assets
              queryTransactionBaseFee:"assets/getTransactionBaseFee",//get transaction base fee
              queryFees:"assets/queryFees",
              createAccountWithPassword:"account/createAccountWithPassword",
              createAccountWithPublicKey:"account/createAccountWithPublicKey",
              passwordLogin:"account/passwordLogin",
              logout:"account/_logout",
              createAccountWithWallet:"account/createAccountWithWallet",
              backupDownload:"WalletDb/backupDownload",//backup wallet file and download
              loadWalletFile:"BackupStore/incommingWebFile",//load wallet file
              restoreWallet:"BackupStore/onRestore",//restore wallet with wallet file
              deleteWallet:"WalletManagerStore/deleteWallet",
              importPrivateKey:"account/importPrivateKey",
              lockAccount:"WalletDb/lockWallet",
              queryContract:"contract/getContract",
              queryAccountContractData:"contract/queryAccountContractData",//query account's contract info
              queryNHAssetOrders:"NHAssets/queryNHAssetOrders",
              queryNHAssets:"NHAssets/lookupNHAssets",//query NHA's info
              queryWorldViews:"NHAssets/lookupWorldViews",
              queryBlock:"explorer/queryBlock",
              queryTransaction:"explorer/queryTransaction",
              lookupWitnessesForExplorer:"explorer/getExplorerWitnesses",//query blocks production info
              lookupWSNodeList:"connection/lookupWSNodeList",//get API server list
              deleteAPINode:"connection/deleteAPINode",//delete an API server address
              addAPINode:"setting/addAPINode",//add an API server address
              queryAssets:"assets/queryAssets",
              queryDynGlobalObject:"explorer/getDynGlobalObject",
              unsubscribe:"operations/unsubscribe",
              queryDataByIds:"explorer/getDataByIds",
              queryPriceHistory:"market/queryPriceHistory",
              queryAssetRestricted:"assets/queryAssetRestricted",
              queryGas:"assets/estimationGas"
          }
          const use_accountOpt_methods={
            getPrivateKey:"account/_getPrivateKey", 
            changePassword:"account/changePassword",
            upgradeAccount:"account/upgradeAccount",

            witnessCreate:"vote/witnessCreate",
            committeeMemberCreate:"vote/committeeMemberCreate",
            witnessUpdate:"vote/witnessUpdate",
            committeeMemberUpdate:"vote/committeeMemberUpdate",
            
            registerCreator:"NHAssets/registerCreator",
            creatWorldView:"NHAssets/creatWorldView",
            creatNHAsset:"NHAssets/creatNHAsset",
            deleteNHAsset:"NHAssets/deleteNHAsset",
            cancelNHAssetOrder:"NHAssets/cancelNHAssetOrder",
            fillNHAssetOrder:"NHAssets/fillNHAssetOrder",//Order matching
            approvalProposal:"proposals/submitProposal",
            relateNHAsset:"NHAssets/relateNHAsset",//Compose NHAs

            createAsset:"assets/_createAsset",
            issueAsset:"assets/issueAsset",
            updateAsset:"assets/_updateAsset",
            reserveAsset:"assets/reserveAsset",
            assetFundFeePool:"assets/assetFundFeePool",
            assetClaimFees:"assets/assetClaimFees",
            assetUpdateRestricted:"assets/assetUpdateRestricted",
            assetPublishFeed:"assets/assetPublishFeed",
            assetUpdateFeedProducers:"assets/assetUpdateFeedProducers",
            assetGlobalSettle:"assets/assetGlobalSettle",
            assetSettle:"assets/assetSettle",

            createLimitOrder:"market/createLimitOrder",
            cancelLimitOrder:"market/cancelLimitOrder",
            callOrderUpdate:"market/callOrderUpdate",

            createContract:"contract/createContract",
            updateContract:"contract/updateContract",
            callContractFunction:"contract/callContractFunction",

            transferAsset:"transactions/transferAsset",
            setCurrentAccount:"AccountStore/setCurrentAccount",
            proposeRelateWorldView:"NHAssets/proposeRelateWorldView",
            updateCollateralForGas:"assets/updateCollateralForGas",
            claimVestingBalance:"account/claimVestingBalance"
          }
          
          const use_validateAccount_methods={
            queryUserOperations:"operations/queryUserOperations",//query account history
            queryAccountOperations:"operations/queryUserOperations",
            queryNHCreator:"NHAssets/queryNHCreator",//query a developer and its worldviews
            queryAccountNHAssets:"NHAssets/queryAccountNHAssets",
            queryAccountNHAssetOrders:"NHAssets/queryAccountNHAssetOrders",
            queryNHAssetsByCreator:"NHAssets/queryNHAssetsByCreator",
            getAccountProposals:"proposals/loadAccountProposals",
            queryDebt:"market/queryDebt",
            queryVestingBalance:"account/queryVestingBalance"
          }

          for(let key in apiMethods){
            this[key]=params=>{
              return this.promiseCompatible(apiMethods[key],params);
            }
          }
          
          for(let key in use_accountOpt_methods){
            this[key]=params=>{
              return this.promiseCompatible('account/_accountOpt',{
                method:use_accountOpt_methods[key],
                params,
                callback:params?params.callback:null
              });
            }
          }

          for(let key in use_validateAccount_methods){
            this[key]=params=>{
                if(!params) params={};
                return this.promiseCompatible('account/_validateAccount',{
                  method:use_validateAccount_methods[key],
                  params,
                  account:params.account||this.getAccountInfo().account_id,
                  callback:params.callback
                });
            }
          }
      }

      //return promise when callback isnot income
      promiseCompatible(methodPath,params){ 
        let initPromise;
        if(this.api.getters["connection/isWsConnected"]){
          initPromise=this.api.dispatch(methodPath,params);
        }else{
          initPromise= this.init().then(
            init_res=>init_res.code==1?this.api.dispatch(methodPath,params):init_res
          );
        }
        if(!params||!params.callback) return initPromise;
        initPromise.then(res=>{ params.callback(res); });
      }

      /*************Interfaces need Special Parameters processing***start****/

      transferNHAsset(params){
        let {toAccount,callback}=params;
            return this.promiseCompatible("account/_validateAccount",{
                method:"NHAssets/transferNHAsset",
                params,
                account:toAccount,
                accountFieldName:"to_account_id",
                callback
            })
      }

      creatNHAssetOrder(params){
        return this.promiseCompatible("account/_validateAccount",{
          method:"NHAssets/creatNHAssetOrder",
          params,
          account:params.otcAccount,
          accountFieldName:"otc_account_id",
          callback:params.callback
        })
      }

      disconnect(params){
        if(typeof params=="function"){
          params={callback:params};
        }
        return this.promiseCompatible("connection/disconnect",params);
      }

      privateKeyLogin(params){
        let {privateKey,password=""}=params;
        return this.promiseCompatible("account/keyLogin",{
          wif:privateKey,
          password,
          callback:params.callback
        });
      }

      unlockAccount(params){
        let userInfo=this.getAccountInfo();
        if(userInfo.mode=="account"){
          params.account=userInfo.account_name;
        }else if(userInfo.mode=="wallet"){
          params.unlock=true;
        }

        let callback=params.callback;
        delete params.callback;
        return this.promiseCompatible("WalletDb/validatePassword",params)
              .then(res=>{
                  if(res.code==1)  res.message="The Account has been unlocked";
                  delete res.cloudMode;
                  delete res.success;
                  callback&&callback(res);
                  callback=null;
                  return res;
              })
      }
      /*********Interfaces need Special Parameters processing***end****/



      getWsConnected(){
        return this.api.getters['connection/isWsConnected']
      }

      getAccountInfo(){
        let getters=this.api.getters;
        let accountObject=this.api.getters["user/getAccountObject"];
        let res={
          account_id:getters["account/getAccountUserId"]||"",
          locked:getters["WalletDb/isLocked"]
        } 
        res.account_name=accountObject?accountObject.name:"";
        res.mode=this.api.getters["WalletDb/wallet"]?"wallet":"account";
        return res;
      }

      getAccounts(params){
        if(params&&params.callback){
          this.init().then(init_res=>{
              params.callback(init_res.code==1?{
                code:1,
                data:{
                  accounts:this.api.getters["WalletDb/wallet"]?this.api.getters["AccountStore/linkedAccounts"].toJS():[],
                  current_account:this.getAccountInfo()
                }
              }:init_res)
          });
        }
        return {
          accounts:this.api.getters["WalletDb/wallet"]?this.api.getters["AccountStore/linkedAccounts"].toJS():[],
          current_account:this.getAccountInfo()
        }
      }
      //decrypt memo
      decodeMemo(memo){
        if(this.getAccountInfo().isLocked){
          return {code:114,message:"Account is locked or not logged in"};
        }
        if(memo){
          return {code:1,data:this.api.getters["PrivateKeyStore/decodeMemo"](memo,this.api)};
        }else{
          return {code:129,message:"Parameter 'memo' can not be empty"};
        }
      }

      generateKeys(){
        let random_key=utils.getRandomKey();
        return {
          private_key:random_key.toWif(),
          public_key:random_key.toPublicKey().toString()
        }
      }

      subscribeToUserOperations(params){   
        this.subscribeInitCheck("account/_validateAccount",{
           method:"operations/subscribeToUserOperations",
           params,
           accountFieldName:"userId",
           account:params.account||"",
           callback:params.callback
         });
      }

      subscribeToAccountOperations(params){
        this.subscribeToUserOperations(params)
      }

      subscribeToChainTranscation(params){
        this.subscribeInitCheck("operations/subscribeToAllOperations",params);
      }

      subscribeToBlocks(params){
        this.subscribeInitCheck("operations/subscribeBlocks",params);
      }

      subscribeToRpcConnectionStatus(params){
        if(typeof params!="object"&&typeof params=="function"){
          params={callback:params};
        }
        this.api.dispatch("connection/setSubscribeToRpcConnectionStatusCallback",params);
      }

      queryTransactionPair(params){
        this.subscribeInitCheck("market/getTransactionPairData",params);
      }

      queryMarketStats(params){
        this.subscribeInitCheck("market/getMarketStats",params);
      }

      subscribeInitCheck(method,params){
        this.init().then(init_res=>{
            if(init_res.code==1){
              this.api.dispatch(method,params);
            }else{
              params.callback&&params.callback(init_res);
            }
        })
      }

      /**********Interfaces cannot return value, callbacks only **start** */
      queryVotes(params){
        let initPromise=new Promise((resolve)=>{
            this.init().then(init_res=>{
              if(init_res.code==1){
                let {type = "witnesses",queryAccount="",isExplorer=false}=params;
                this.api.dispatch("vote/getVoteObjects",{
                  type,queryAccount,isExplorer,
                  callback:res=>{ resolve(res); }
                });
              }else{
                resolve(init_res);
              }
            })
        });

        if(!params.callback) return initPromise;
        initPromise.then(res=>{ params.callback(res);})
    }

    publishVotes(params){
        let initPromise=new Promise((resolve)=>{
            this.init(init_res=>{
              if(init_res.code==1){
                let {vote_ids,votes,type}=params;
                this.api.dispatch("account/accountOpt",{
                  method:"vote/publishVotes",
                  params:{
                    vote_ids,
                    votes,
                    type,
                    callback:res=>{ resolve(res) }
                  }
                })
              }else{
                resolve(init_res);
              }
            })
        });
        if(!params.callback) return initPromise;
        initPromise.then(res=>{ params.callback(res);})
    }

    switchAPINode(params){
      //donot send to promiseCompatible Interface, and donot check RPC connection
      let initPromise=new Promise((resolve)=>{
          this.init(init_res=>{
            if(init_res.code==1){
              this.api.dispatch("connection/switchNode",{
                 url:params.url,
                 callback:res=>{ resolve(res); }
              });
            }else{
              resolve(init_res);
            }
         })
      });
      if(!params.callback) return initPromise;
      initPromise.then(res=>{ params.callback(res);})
    }
    /**********Interfaces cannot return value, callbacks only **end** United Labs of BCTech.*/
  }

  // export default BCX;
  global.BCX=BCX;

 