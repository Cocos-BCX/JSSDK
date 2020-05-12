import * as types from '../mutations';
import * as actions from '../actions/transactions';

const initialState = {
  pending: false,
  error: null,
  callback:null,
  orderData:null,
  trxData:null,
  callbacks:new Set(),
  onlyGetOPFee:false
};
const getters={
  onlyGetOPFee:state=>{
      return state.onlyGetOPFee;
  }
}
const mutations = {
  [types.SET_ONLY_GET_OP_FEE](state,b) {
    state.onlyGetOPFee = b;
  },
  [types.TRANSFER_ASSET_REQUEST](state) {
    state.pending = true;
  },
  [types.TRANSFER_ASSET_ERROR](state, {error,callback,code}) {
    if(typeof error=="string"){
      error={
        message:error
      }
    }
    
    state.pending = false;
    let message=error.message;

    if(typeof error.message=="string"){
      if(error.message.indexOf("o.issuer == a.issuer")!=-1){
        code=160;
        message="You are not the creator of assets"
      }
    }

    callback&&callback({
      code,
      message,
      error
    })
  },
  [types.TRANSFER_ASSET_COMPLETE](state,{callback,trxData,data=null}) {
    state.pending = false;
    let res={code:1};
    if(data){
      res.data=data;
    }
    if(trxData){
      res.trxData=JSON.parse(JSON.stringify(trxData));
      let {result_id,result_ids}=trxData;
      if(result_ids&&result_ids.length&&result_ids[0]){
          res.data={
            result_id,
            result_ids
          }
      }
    }
    callback&&callback(res)
  },
  [types.SET_OP_CALLBACK](state,{callback,type}) {
    if(type=="+"){
      state.callbacks.add(callback);
    }else if(type=="-"){
      if (state.callbacks.has(callback)){
        state.callbacks.delete(callback);
      }
    }
  },
  [types.SET_ORDER_DATA](state,orderData) {
    state.orderData = orderData;
  },
  [types.SET_TRX_DATA](state,trxData) {
    state.trxData = trxData;
  }
};

export default {
  state: initialState,
  getters,
  actions,
  mutations,
  namespaced: true
};
