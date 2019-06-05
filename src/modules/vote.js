import * as types from '../mutations';
import API from '../services/api';

const initialState = {
  all_witnesses:[],
  all_committee:[],
  all_type:"witnesses",
  globalObject:null,
  votes_state:null,
  getVoteObjects_callback:null,
  vote_ids_obj:null,
  vote_ids:[],
  queryAccount:"",
  isExplorer:false
};

const getters={
  alls:state=>{
    let {all_witnesses,all_committee}=state;
    return {all_witnesses,all_committee}
  },
  all_type:state=>state.all_type,
  globalObject:state=>state.globalObject,
  getVotesState:state=>state.votes_state,
  vote_ids_obj:state=>state.vote_ids_obj,
  vote_ids:state=>state.vote_ids,
  queryAccount:state=>state.queryAccount,
  isExplorer:state=>state.isExplorer
}

const actions={
  getVoteObjects:(store,{type = "witnesses",callback,queryAccount="",isExplorer=false}) => {
     let {dispatch,rootGetters,commit,state}=store;
     commit(types.SET_ALL_TYPE,type);
     commit(types.set_getVoteObjects_callback,callback);
     commit(types.SET_QUERY_ACCOUNT,queryAccount);
     state.isExplorer=isExplorer;
     API.Vote._getVoteObjects(store,type);
  },
  publishVotes:async (store,{witnesses_ids=null,committee_ids=null,new_proxy_id,onlyGetFee=false,callback,feeAssetId})=>{
      let {commit,getters,dispatch}=store;

      dispatch("getVoteObjects",{type:"witnesses",callback:(res)=>{
        
               if(res.code!=1){
                 callback&&callback(res);
                 return;
               }

              let {witnesses,committee,proxy_account_id}=getters.getVotesState;
              if(!witnesses_ids){
                witnesses_ids=witnesses.toArray();
              }
              if(!committee_ids){
                committee_ids=committee.toArray();
              }

              if(new_proxy_id){
                 dispatch("user/getUserInfo",{account:new_proxy_id,isCache:true},{root:true}).then(proxy_acc_res=>{
                    if(proxy_acc_res.code==1){
                      new_proxy_id=proxy_acc_res.data.account.id;
                      API.Vote.publishVotes(store,witnesses_ids,committee_ids,new_proxy_id,callback,onlyGetFee,feeAssetId);
                    }else{
                      callback&&callback(proxy_acc_res);
                      return;
                    }
                });
              }else{
                API.Vote.publishVotes(store,witnesses_ids,committee_ids,new_proxy_id,callback,onlyGetFee,feeAssetId);
              }
      }})
  },
  setGlobalObject:({commit},GB)=>{
    commit(types.SET_GLOBAL_OBJECT,GB);
  }
}


const mutations = {
  [types.SET_ALL_WITNESSES_COMMITTEE]: (state,params) => {
    state.all_witnesses=params.all_witnesses
    state.all_committee=params.all_committee
  },
  [types.SET_ALL_TYPE]: (state,type) => {
    state.all_type=type
  },
  [types.SET_GLOBAL_OBJECT]:(state,globalObject)=>{
    state.globalObject=globalObject;
  },
  [types.SET_VOTES_STATE]: (state,votes_state) => {
    state.votes_state = votes_state;
  },
  [types.set_getVoteObjects_callback]:(state,callback)=>{
    state.getVoteObjects_callback=callback;
  },
  [types.set_publishVotes_callback]:(state,callback)=>{
    state.publishVotes_callback=callback;
  },
  [types.SET_VOTE_IDS_OBJ]:(state,vote_ids_obj)=>{
    state.vote_ids_obj=vote_ids_obj;
  },
  [types.SET_VOTE_IDS]:(state,ids)=>{
    state.vote_ids=ids;
  },
  [types.SET_QUERY_ACCOUNT]:(state,account)=>{
    state.queryAccount=account;
  }
};

export default {
  state: initialState,
  actions,
  mutations,
  getters,
  namespaced: true
};
