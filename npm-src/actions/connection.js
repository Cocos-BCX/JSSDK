import API from '../services/api';
import * as types from '../mutations';
import {ChainStore} from "bcxjs-cores";
import { ChainConfig } from 'bcxjs-ws';
import iDB from '../services/api/wallet/idb-instance';

let _new_node_connecting=false;//if here is new incoming node connection.
/**
 * Initializes connection to WS
 */
export const testNodesPings=(store,refresh)=>{
   return API.Connection.testNodesPings(refresh);
}

export const addAPINode=(store,node)=>{
  return API.Connection.addAPINode(node);
}

export const deleteAPINode=(store,{url})=>{
   if(!url){
    return {code:138,message:"Parameter 'url' can not be empty"};
   }
   url=url.trim();
   API.Connection.deleteAPINode(url);
   return {code:1};
}
let _startConnectTimer=0;

export const switchNode=async ({commit,dispatch,rootGetters},{url,callback})=>{
  clearTimeout(_startConnectTimer);
  if(!url){
    url=rootGetters["setting/ws_node_list"][0].url;
    //callback&&callback({code:138,message:"Parameter 'url' can not be empty"});
    //return;
  }
 //clear all the cache created by current chain to avoid a chain switch.
  dispatch("vote/setGlobalObject",null,{root:true});
  dispatch("explorer/set_last_current_aslot",null,{root:true});
  dispatch("assets/set_assets",{},{root:true});

  _new_node_connecting=true
  ChainStore.clearCache();
  ChainStore.subscribed=false;

  await API.Connection.disconnect();
  _new_node_connecting=false
  commit(types.WS_DISCONNECTED);
  dispatch("initConnection",{callback,url});
}

export const disconnect=async ({dispatch,commit})=>{
  // _callback=null;
  try{
    commit(types.SET_WS_CONNECTING,false);
    dispatch("setting/setAutoReconnect",false,{root:true});
    await API.Connection.disconnect();
    return {code:1}
  }catch(e){
    return {code:0,message:e.message};
  }
}
//Set RPC connection status change callback
export const setSubscribeToRpcConnectionStatusCallback=({commit},{callback})=>{
  commit(types.SET_RPC_STATUS_CALLBACK,callback)
}

let _callbacks=[];//Collection of callback functions to prevent functions from being called without initialization.
export const initConnection =(store,params) => {
  let {dispatch,commit, getters,rootGetters,state}=store;
  if(getters.wsConnecting) {
    //The incoming callbacks while RPC is initializing will be pushed in _callbacks
    _callbacks.push(typeof params=="function"?params:params.callback);
    return;
  };
  let connect_url=rootGetters["setting/g_settingsAPIs"].default_ws_node;
  if(params){
    //Here is the compatible with old version directly callback or object parameter.
    if(typeof params=="object"){
      let {callback,subscribeToRpcConnectionStatusCallback,autoReconnect,url}=params;
      if(callback) _callbacks=[callback];
      if(subscribeToRpcConnectionStatusCallback)  commit(types.SET_RPC_STATUS_CALLBACK,subscribeToRpcConnectionStatusCallback)
      if(autoReconnect) commit(types.SET_AUTO_RECONNECT,!!autoReconnect);
      if(url) connect_url=url;
    }else if(typeof params=="function"){
      _callbacks=[params]
    }
  }else if(!params||params.clearCallback){
    _callbacks=[];
  }

  //If the RPC connected, then execute the callback 
  if(getters.isWsConnected&&params&&!params.refresh){
    _callbacks.length&&_callbacks[0]({code:1});
    return;
  }

  
  //RPC status changed callback
  const updateConnectionStatus =async (status,selectedNodeUrl="") => {
    console.log('Connection status : ', status,selectedNodeUrl);
    commit(types.RPC_STATUS_UPDATE, { status,url:selectedNodeUrl });
    dispatch("setting/set_SELECT_WS_NODE",selectedNodeUrl,{root:true})

    let store_autoReconnect=rootGetters["setting/autoReconnect"];
    if (status === 'error' || status === 'closed') {//connection error
      commit(types.WS_DISCONNECTED);
      if(_startConnectTimer){
        clearTimeout(_startConnectTimer);
      }
      ChainStore.subscribed=false;
      if(_new_node_connecting==false&&store_autoReconnect){ 
        await API.Connection.disconnect();
        _startConnectTimer=setTimeout(() => {
          startConnect(selectedNodeUrl);
        }, 3000);
        return;
      } 
    }
    
    //RPC connected
    if (status === 'realopen') {
      commit(types.SET_WS_CONNECTING,false);
      if(process.browser){
        dispatch("IDB_INIT");
      }else{
        ChainStore.init(rootGetters["setting/g_settingsAPIs"].real_sub).then(()=>{
          state.reconnectCounter=3;
          API.ChainListener.enable();
          API.ChainListener.store=store;
          Promise.all([
            rootGetters["setting/g_settingsAPIs"].isCheckCachedUserData? dispatch("account/checkCachedUserData",null,{root:true}):true,
            API.Explorer.getGlobalObject()
          ]).then((res)=>{
             _callbacks.forEach(callback_item=>{ callback_item({code:1}); });
             _callbacks.length=1;    
          })
        }).catch(error=>{
           if(state.reconnectCounter>5){
            _callbacks.forEach(callback=>{ callback({code:300,message:"ChainStore sync error, please check your system clock"}); });
           }else{
            commit(types.WS_DISCONNECTED);
            state.reconnectCounter++
            dispatch("initConnection",{refresh:false,clearCallback:false});
           }
        })
      }
      
      // ChainStore.init().then(()=>{
      //   API.ChainListener.enable();
      //   Promise.all([
      //     rootGetters["setting/g_settingsAPIs"].check_cached_account_data? dispatch("account/checkCachedUserData",null,{root:true}):true,
      //     API.Explorer.getGlobalObject()
      //   ]).then((res)=>{
      //      _callbacks.forEach(callback_item=>{ callback_item({code:1}); });
      //      _callbacks.length=1;    
      //   })
      // }).catch(error=>{
      //   _callbacks.forEach(callback=>{ callback({code:300,message:"ChainStore sync error, please check your system clock"}); });
      // })
    }else if(!store_autoReconnect){//if auto reconnection isn't configured, execute callback
      !_new_node_connecting&&_callbacks.length&&
      _callbacks.forEach(callback=>{ callback({code:301,message:"RPC connection failed. Please check your network"}); });
    }
  };

  var startConnect=function(url="",refresh){
    commit(types.SET_WS_CONNECTING,true);
    API.Connection.connect({
      statusCallback:updateConnectionStatus,
      changeNodeUrl:refresh?"":url,
      store,
      refresh
    });
  }
  startConnect(connect_url||rootGetters["setting/g_settingsAPIs"].default_ws_node,params?!!params.refresh:false);
};


export const IDB_INIT=(store)=>{
  let {dispatch,rootGetters,commit,state}=store;
  var db;
  try {
      //install indexeddbshim 2.2.1 other version may cause problems
      db = iDB.init_instance(window.openDatabase ? (shimIndexedDB||indexedDB) : indexedDB).init_promise;
  } catch (err) {
      console.log("db init error:", err);
  }
  //Init websql
  return Promise.all([db]).then(() => {
      console.log("db init done");
      return Promise.all([
          dispatch("PrivateKeyStore/loadDbData",null,{root:true}).then(() => {
            dispatch("AccountRefsStore/loadDbData",null,{root:true})
          }),
          dispatch("WalletDb/loadDbData",null,{root:true}).then(() => {}).catch((error) => {
              console.error("----- WalletDb.willTransitionTo error ----->", error);
          }),
          dispatch("WalletManagerStore/init",null,{root:true}),
      ]).then(() => {
          let {check_cached_account_data,real_sub,select_ws_node}=rootGetters["setting/g_settingsAPIs"];

          // ChainStore.clearCache();
          // ChainStore.subscribed=false;

          ChainStore.init(!!real_sub).then(()=>{
              commit(types.WS_CONNECTED);
              state.reconnectCounter=3;
              API.ChainListener.enable();
              API.ChainListener.store=store;

             //whether check local User Info Cache and use its data
              if(check_cached_account_data) dispatch("account/checkCachedUserData",null,{root:true});
              
              dispatch("AccountStore/loadDbData",null,{root:true})
              .then(() => {
                Promise.all([
                   //API.Explorer.getGlobalObject()//,
                   dispatch("explorer/getExplorerWitnesses",null,{root:true})
                ]).then((res)=>{
                    console.log("bcxjs init ok");
                   _callbacks.forEach(callback_item=>{ callback_item({code:1,data:{selectedNodeUrl:select_ws_node}}); });
                   _callbacks.length=1;   
                   select_ws_node="";
                })
              }).catch(error => {
                  console.log("[Root.js] ----- ERROR ----->", error);
              });
          }).catch(error=>{ 
             if(state.reconnectCounter>5){
              _callbacks.forEach(callback=>{ callback({code:300,message:"ChainStore sync error, please check your system clock"}); });
             }else{
              commit(types.WS_DISCONNECTED);
              state.reconnectCounter++
              dispatch("initConnection",{refresh:false,clearCallback:false});
             }
          })
      });
  });
}

//Get API server list
export const lookupWSNodeList=async ({dispatch,rootGetters},{refresh=false})=>{
    const settingsAPIs=rootGetters["setting/g_settingsAPIs"];
    let nodes=await dispatch("testNodesPings",refresh);
    nodes=Object.keys(nodes).map(key=>{
        let {location,ping}=nodes[key];
        return {
            url:key,
            name:location,
            ping
        }
    });
    return {
      code:1,
      data:{
        nodes,
        selectedNodeUrl:settingsAPIs.select_ws_node
      }
    }
}