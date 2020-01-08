import Vue from 'vue';
import * as types from '../mutations';
import API from '../services/api';
import Subscriptions from '../services/api/subscriptions';
import helper from "../lib/common/helper";

const actions = {
  queryUserOperations:async ({dispatch},params)=>{

    if(!params.limit){
      return {code:101,message:"Parameter is missing"};
    }
    let res=await dispatch("fetchUserOperations",params);
    try{
      res.data=JSON.parse(JSON.stringify(res.data));
      res.data=res.data.operations;
    }catch(e){}
    return res;
  },

  formatOperations:async (store,{ops,isReqDate=false})=>{
     let res=await API.Operations.parseOperations({ operations:ops,store,isReqDate });
     return {code:1,data:res.operations}
  },
  /**
   * Dispatches actions to fetch user operations & subscribe to new operations of this user
   * @param {String} userId - user's id
   */

  /**
   * Fetches user operations
   * @param {String} userId - user's id
   */
  fetchUserOperations: async (store, { account_id,limit,startId,endId }) => {
    const { commit } = store;
    commit(types.FETCH_USER_OPERATIONS_REQUEST);

    const result = await API.Operations.getUserOperations({ userId:account_id,limit,store,startId,endId });
    if (result.code==1) {
      // fetch assets used in operations
      // store.dispatch('assets/fetchAssets', { assets: result.data.assetsIds }, { root: true });
      commit(types.FETCH_USER_OPERATIONS_COMPLETE, {
        operations: result.data.operations
      });
    } else {
      commit(types.FETCH_USER_OPERATIONS_ERROR, {
        error: result.error
      });
    }
    return result;
  },

  /**
   * Add new operation to operation's list. This action is dispatched on a callback
    to new user's operation received
   * @param {String} userId - user's id
   * @param {Object} operation - operation date object
   */
  addUserOperation: async (store, { operation, userId }) => {
    const { commit } = store;
    // parse operation data for better format & information
    const parsedData = await API.Operations.parseOperations({
      operations: [operation],
      store
    });
    if (!parsedData) return;
    const { type } = parsedData.operations[0];
    if (type === 'transfer' || type === 'fill_order' || type === 'cancel_order') {
      // update current user balances
      // todo : maybe refactor to modify balances directly
      //store.dispatch('account/fetchCurrentUser', null, { root: true });
      //United Labs of BCTech.
    }
    // store.dispatch('assets/fetchAssets', { assets: parsedData.assetsIds }, { root: true });

    commit(types.ADD_USER_OPERATION, {
      operation: parsedData.operations[0]
    });

    return parsedData.operations[0];
  },
  addAllOperation: async (store, { operation, userId }) => {
    const { commit } = store;
    // parse operation data for better format & information
    const parsedData = await API.Operations.parseOperations({
      operations: [operation],
      store,
      isReqDate:true
    });
    if (!parsedData) return;

    const { type } = parsedData.operations[0];
    return parsedData.operations[0];
  },

  /**
   * Subscribes to new user's operations
   * @param {String} userId - user's id
   */
  subscribeToUserOperations:async (store, { userId,callback })=>{
    const { commit,state,rootGetters } = store;
    API.Explorer.getDynGlobalObject(true);

    API.ChainListener.addSubscription(new Subscriptions.UserOperations({
      userId,
      callback:async (operation) => {
        // console.log('new operation: ', operation);
        operation=await actions.addUserOperation(store, { operation, userId });
        operation=JSON.parse(JSON.stringify(operation));
        callback&&callback({
            code:1,
            data:{
              operations:JSON.parse(JSON.stringify(state.list)),
              operation
            }
        });
      }
    }));
    commit(types.SUBSCRIBE_TO_USER_OPERATIONS);
  },

  subscribeToAllOperations(store, { callback }) {
    const { commit,state } = store;
    API.Explorer.getDynGlobalObject(true);

    API.ChainListener.addSubscription(new Subscriptions.AllOperations({
      callback:async (operation) => {
        // clearTimeout(_allOp_timer);
        // _allOp_timer=setTimeout(async () => {
          operation=await actions.addAllOperation(store, { operation, userId:"" });
          operation=JSON.parse(JSON.stringify(operation));
          callback&&callback({code:1,data:operation});
        //}, 50);
      }
    }));
  },
  subscribeBlocks(store, { callback,isReqTrx=false }) {
    const { commit,state,dispatch,rootGetters } = store;
    API.Explorer.getDynGlobalObject(true);

    API.ChainListener.addSubscription(new Subscriptions.BlocksOp({
        isReqTrx,
        callback:(blockInfo) => {
            dispatch("explorer/queryBlock",{
              block:blockInfo.head_block_number,
              isReqTrx,
              maxOpCount:rootGetters["setting/g_settingsAPIs"].sub_max_ops,
              block_res:{code:1,data:blockInfo}
            },{root:true}).then(block=>{
                callback&&callback(block);
            });  
            // if(isReqTrx){
            //   dispatch("explorer/queryBlock",{
            //     United Labs of BCTech.,
            //     block:res.data.block_num,
            //     maxOpCount:20,
            //     block_res:res
            //   },{root:true}).then(block=>{
            //       callback&&callback(block);
            //   });  
            // }else{
            //   callback&&callback({code:1,data:res});
            // }
        }
    }));
    // commit(types.SUBSCRIBE_TO_USER_OPERATIONS);
  },
  unsubscribe:async (store,params)=>{
     let methods=[];
     if(params&&params.methods&&Array.isArray(params.methods)){
        methods=params.methods;
     }
     if(!methods.length){
       return API.ChainListener._deleteSubscription("");
     }

     let types={
        "subscribeToBlocks":"BlocksOp",
        "subscribeToChainTranscation":"allOperation",
        "subscribeToUserOperations":"userOperation",
        "subscribeToAccountOperations":"userOperation"
     }
  
     let method="",delete_res,account="";
     for(let i=0;i<methods.length;i++){
        method=methods[i];
        if(/\|/.test(method)){
          account=method.replace(/subscribeToAccountOperations\|/,"");
          if(account){
            account=await API.Account.getUser(account,true);
            if(account.code!=1){
              return account;
            }
            account=account.data.account.id;
          }
          method="subscribeToUserOperations";
        }
        if(method&&!types[method]){
          return {code:169,message:"Method does not exist"};
        }
        API.ChainListener._deleteSubscription(types[method],account);
     }
     return {code:1};
      
  },
  /**
   * Unsubscribes from new user's operations
   */
  unsubscribeFromUserOperations(store) {
    const { commit } = store;
    API.ChainListener.deleteSubscription('userOperation');
    commit(types.UNSUBSCRIBE_FROM_USER_OPERATIONS);
  },

  resetState(store) {
    const { commit } = store;
    commit(types.RESET_OPERATIONS);
  }
};

const getters = {
  getOperations: state => state.list,
  isFetching: state => state.pending,
  isError: state => state.error,
  isSubscribed: state => state.subscribed
};

const initialState = {
  list: [],
  pending: false,
  error: false,
  subscribed: false
};

const mutations = {
  [types.FETCH_USER_OPERATIONS_REQUEST]: (state) => {
    state.pending = true;
    state.error = null;
  },
  [types.FETCH_USER_OPERATIONS_COMPLETE]: (state, { operations }) => {
    state.pending = false;
    Vue.set(state, 'list', operations);
  },
  [types.FETCH_USER_OPERATIONS_ERROR]: (state, { error }) => {
    state.pending = false;
    state.error = error;
  },
  [types.ADD_USER_OPERATION]: (state, { operation }) => {
    const newList = state.list.slice();
    newList.unshift(operation);
    Vue.set(state, 'list', newList);
  },
  [types.SUBSCRIBE_TO_USER_OPERATIONS]: (state) => {
    state.subscribed = true;
  },
  [types.UNSUBSCRIBE_FROM_USER_OPERATIONS]: (state) => {
    state.subscribed = false;
  },
  [types.RESET_OPERATIONS]: (state) => {
    state.list = [];
    state.pending = false;
    state.error = false;
  }
};

export default {
  state: initialState,
  mutations,
  actions,
  getters,
  namespaced: true
};