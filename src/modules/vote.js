import * as types from '../mutations';
import API from '../services/api';
import Immutable from "immutable";

const initialState = {
  all_witnesses: Immutable.List(),
  all_committee: Immutable.List(),
  all_type:"witnesses",
  globalObject:null,
  votes_state:null,
  getVoteObjects_callback:null,
  vote_ids_obj:{},
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
  isExplorer:state=>state.isExplorer,
  
}

const actions={
  getVoteObjects:(store,{type = "witnesses",callback,queryAccount="",isExplorer=false,isCache=false}) => {
     let {dispatch,rootGetters,commit,state}=store;
     store.state.all_witnesses=Immutable.List();
     store.state.all_committee=Immutable.List();
     commit(types.SET_ALL_TYPE,type);
     commit(types.set_getVoteObjects_callback,callback);
     commit(types.SET_QUERY_ACCOUNT,queryAccount);
     state.isExplorer=isExplorer;
     isCache=isCache||false;
     API.Vote._getVoteObjects(store,type,null,isCache);
  },

  publishVotes:async (store,{vote_ids,votes,type="witnesses",callback})=>{
    API.Vote.publishVotes(store,vote_ids,votes,type,callback);
  },
  setGlobalObject:({commit},GB)=>{
    commit(types.SET_GLOBAL_OBJECT,GB);
  },
  witnessCreate:({dispatch},{url="",blockSigningKey,account})=>{
      if(!blockSigningKey){
          return {code:179,message:"blockSigningKey can not be empty"};
      }
      url=url||"";
      return dispatch('transactions/_transactionOperations', {
        operations:[{
          op_type:18,
          type:"witness_create",
          params:{
            witness_account:account.id,
            url,
            block_signing_key:blockSigningKey
          }
        }]
     },{root:true});
  },
  committeeMemberCreate:({dispatch},{url="",account})=>{
      url=url||"";
      return dispatch('transactions/_transactionOperations', {
          operations:[{
            op_type:23,
            type:"committee_member_create",
            params:{
              committee_member_account:account.id,
              url
            }
          }]
      },{root:true});
  },
  witnessUpdate:async ({dispatch},params)=>{
    let {account}=params;
    if(account.witness_status){
          let witness_id=account.witness_status[0];
          let witness_res=await dispatch("explorer/getDataByIds",{ids:[witness_id]},{root:true});
          if(witness_res.code!=1) return witness_res;
          let {url,signing_key,work_status}=witness_res.data[0];
          if(params.newUrl!=undefined) url=params.newUrl;
          if(params.newSigningKey!=undefined&&params.newSigningKey!="") signing_key=params.newSigningKey;
          if(params.workStatus!=undefined) work_status=!!params.workStatus;
          return dispatch('transactions/_transactionOperations', {
            operations:[{
              op_type:19,
              type:"witness_update",
              params:{
                witness:witness_id,
                witness_account:account.id,
                new_url:url,
                new_signing_key:signing_key,
                work_status
              }
            }]
          },{root:true});
    }else{
      return {
        code:180,message:"Not a witness"
      }
    }
  },
  committeeMemberUpdate:async ({dispatch},params)=>{
    let {account}=params;
    if(account.committee_status){
          let committee_id=account.committee_status[0];
          let committee_res=await dispatch("explorer/getDataByIds",{ids:[committee_id]},{root:true});
          if(committee_res.code!=1) return committee_res;

          let {url,work_status}=committee_res.data[0];
          if(params.newUrl!=undefined) url=params.newUrl;
          if(params.workStatus!=undefined) work_status=!!params.workStatus;
          return dispatch('transactions/_transactionOperations', {
            operations:[{
              op_type:24,
              type:"committee_member_update",
              params:{
                committee_member:committee_id,
                committee_member_account:account.id,
                new_url:url,
                work_status
              }
            }]
          },{root:true});
    }else{
      return {
        code:180,message:"Not a committee"
      }
    }
  }
}


const mutations = {
  [types.SET_ALL_WITNESSES_COMMITTEE]: (state,params) => {
    state.all_witnesses=state.all_witnesses.merge(params.all_witnesses);
    state.all_committee=state.all_committee.merge(params.all_committee);
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
    for(let key in vote_ids_obj){
        if(vote_ids_obj[key]){
          state.vote_ids_obj[key]=vote_ids_obj[key]
        }
    }
    // state.vote_ids_obj=vote_ids_obj;
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
