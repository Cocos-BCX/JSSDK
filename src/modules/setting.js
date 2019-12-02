import Vue from 'vue';
import * as types from '../mutations';
import helper from '../lib/common/helper';
import API from '../services/api';
import { ChainConfig } from 'bcxjs-ws';
import PersistentStorage from '../services/persistent-storage';

const initialState = {
    versions:"2.1.6",
    ops_limit:100,
    autoReconnect:true,
    defaultSettings:{
        locale: "zh",
        unit:"1.3.0",
        showSettles: false,
        showAssetPercent: false,
        walletLockTimeout: 60 * 10
    },
    settingsAPIs:{
        default_ws_node:"",
        select_ws_node:"",
        ws_node_list:{
        },
        networks:[],
        default_faucet:"",
        //defaultAssetsNames: ['COCOS'],
        referrer: '',
        check_cached_account_data:true,
        check_cached_nodes_data:false,
        sub_max_ops:13,
        real_sub:true
    },
    trx_results:["error_result", "void_result", "object_id_result", "asset_result", "contract_result", "logger_result"]
};
const getters={
    trx_results:state=>state.trx_results,
    SELECT_WS_NODE_URL:state=>state.settingsAPIs.select_ws_node,
    default_ws_node:state=>state.settingsAPIs.default_ws_node,
    networks:state=>state.settingsAPIs.networks,
    worker:state=>state.settingsAPIs.worker,
    g_settingsAPIs:state=>state.settingsAPIs,
    defaultSettings:state=>state.defaultSettings,
    ws_node_list:state=>{
        let nodes=state.settingsAPIs.ws_node_list;
        return Object.keys(nodes).map(key=>{
            let {location,ping}=nodes[key];
            return {
                url:key,
                name:location,
                ping
            }
        })
    },
    ops_limit:state=>state.ops_limit,
    autoReconnect:state=>state.autoReconnect,
    getApiConfig:state=>{
        let {settingsAPIs,ops_limit,autoReconnect,defaultSettings,versions}=state;
        let _settingsAPIs=JSON.parse(JSON.stringify(settingsAPIs));
        delete _settingsAPIs.referrer;

        
        return JSON.parse(JSON.stringify({
            ..._settingsAPIs,
            versions,
            ops_limit,
            auto_reconnect:autoReconnect,
            locale:defaultSettings.locale,
            unit:defaultSettings.unit
        }));
    }
}
const actions={
    setAutoReconnect:({commit},b)=>{
        commit(types.SET_AUTO_RECONNECT,b);
    },
    setSettingsAPIS:({commit,dispatch},params)=>{
        let {app_keys,check_cached_account_data}=params;
        //contract authorization app_keys configuration
        if(app_keys&&Array.isArray(app_keys)) 
          dispatch("PrivateKeyStore/setAppkeys",app_keys,{root:true});
       
       //whether check and use the local cache of accounts info
       if(check_cached_account_data) dispatch("account/checkCachedUserData",null,{root:true});

        commit(types.SET_SETTINGS_APIS,params);
        return {code:1};
    },
    set_SELECT_WS_NODE:({commit},url)=>{
        commit(types.SET_SELECT_WS_NODE,url);
    },
    addAPINode:async ({commit,dispatch,state},node)=>{
        if(!helper.trimParams(node)){
            return {code:101,message:"Parameter is missing"};
        }
        let {url}=node;
        if(!(/^ws{1,2}:\/\/./.test(url))){
            return {code:139,message:"Node address must start with ws:// or wss://"};
        }
        let nodes=state.settingsAPIs.ws_node_list;
        if(!!Object.keys(nodes).find(n_url => n_url === url)){
            return {code:140,message:"API server node address already exists"};
        }
        commit(types.ADD_API_NODE,node);//referring here may cause ping missing

        await dispatch("connection/addAPINode",node,{root:true});
        return {code:1,data:JSON.parse(JSON.stringify(nodes))}
    },
    deleteAPINode:({commit,dispatch},url)=>{
        commit(types.DELETE_API_NODE,url);
        dispatch("connection/deleteAPINode",url,{root:true});
    }
}

const mutations = {
     [types.SET_AUTO_RECONNECT]:(state,b)=>{
        state.autoReconnect=b;
     },
     [types.SET_SETTINGS_APIS]:(state,params)=>{
         let {default_ws_node,faucet_url,unit,ws_node_list,networks,
         check_cached_account_data,check_cached_nodes_data,worker,auto_reconnect,
         sub_max_ops,app_keys,real_sub,locale}=params;

         let settingsAPIs=state.settingsAPIs;
         
         if(default_ws_node!=undefined) settingsAPIs.default_ws_node=default_ws_node;
         
         if(faucet_url!=undefined) settingsAPIs.default_faucet=faucet_url;
         
         if(unit!=undefined)  state.defaultSettings.unit=unit;
        
         if(sub_max_ops) API.ChainListener.sub_max_ops=sub_max_ops;

        //chain config
        if(networks){
            ChainConfig.networks=networks;
            settingsAPIs.networks=networks;
            console.log(`bcxjs version：${state.versions}`);
        }
        
        if(check_cached_account_data!=undefined) 
            settingsAPIs.check_cached_account_data=!!check_cached_account_data;
        if(check_cached_nodes_data!=undefined) {
            settingsAPIs.check_cached_nodes_data=!!check_cached_nodes_data;
            !check_cached_nodes_data&&PersistentStorage.clearNodesData();
        }
        let cached_nodes_data=PersistentStorage.getSavedNodesData();
        if(settingsAPIs.check_cached_nodes_data&&Object.keys(cached_nodes_data).length){
            settingsAPIs.ws_node_list = PersistentStorage.getSavedNodesData();
        }else if(ws_node_list){
            ws_node_list.forEach(node=>{
                settingsAPIs.ws_node_list[node.url]={location:node.name};
            });
            API.Connection.setAPINode(settingsAPIs.ws_node_list);
        }
   
        if(worker!=undefined) settingsAPIs.worker=!!worker;
        if(auto_reconnect!=undefined) state.autoReconnect=!!auto_reconnect;

        if(real_sub!=undefined){
            API.ChainListener.real_sub=real_sub;
            settingsAPIs.real_sub=real_sub;
        }

        if(locale!=undefined){
            state.defaultSettings.locale=locale;
        }

     },
     [types.SET_SELECT_WS_NODE]:(state,url)=>{
         state.settingsAPIs.select_ws_node=url;
     },
     [types.ADD_API_NODE](state, { name,url }) {
        Vue.set(state.settingsAPIs.ws_node_list, url,{location:name});
     },   
     [types.DELETE_API_NODE](state, url) {
        Vue.delete(state.settingsAPIs.ws_node_list, url);
     }
};

export default {
  state: initialState,
  actions,
  mutations,
  getters,
  namespaced: true
};
