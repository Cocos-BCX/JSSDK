import * as types from '../mutations';
import * as actions from '../actions/connection';
import * as getters from '../getters/connection';

const initialState = {
  wsConnected: false,
  rpcStatus: null,
  wsConnecting:false,
  rpcStatusCallback:null,//listener of RPC connection status callback
  reconnectCounter:0
};

const mutations = {
  [types.WS_CONNECTED](state) {
    state.wsConnected = true;
  },
  [types.WS_DISCONNECTED](state) {
    state.wsConnected = false;
  },
  [types.SET_WS_CONNECTING](state,status) {
    state.wsConnecting = status;
  },
  [types.RPC_STATUS_UPDATE](state, { status,url="" }) {
    if(state.rpcStatus==status) return;
    state.rpcStatus = status;
    let res={
      code:1,
      data:{status,url}
    };

    if(status=="error"&&url==""){
      res={
        code:168,
        message:"No available nodes or check your network."
      };
    }
    state.rpcStatusCallback&&state.rpcStatusCallback(res)
  },
  [types.SET_RPC_STATUS_CALLBACK](state,callback){
    state.rpcStatusCallback=callback;
  }
};

export default {
  state: initialState,
  getters,
  actions,
  mutations,
  namespaced: true
};
