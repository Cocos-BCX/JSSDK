import API from '../services/api';
import * as types from '../mutations';
import helper from '../lib/common/helper';

const initialState = {
    crontab:null
};

const actions={
    setCrontab:({commit},params)=>{
        commit(types.SET_CRONTAB,params);
    },
    queryCrontabs:(store,params)=>{
        params.includeNormal=!!params.includeNormal;
        params.includeFail=!!params.includeFail;
        return API.Other.listAccountCrontabs(params,store);
    },
    cancelCrontabs:async ({dispatch},params)=>{
        helper.trimParams(params);
        if(!params) return {code:101,message:"Crontab parameter is missing"};
        let {account,crontabId,onlyGetFee=false}=params;
        let c_res=await API.Explorer.getDataByIds([crontabId]);
        if(!c_res.length) return {code:177,message:`crontabId [${crontabId}] not found`}
        

        return dispatch('transactions/_transactionOperations', {
            operations:[{
                op_type:61,
                type:"crontab_cancel",
                params:{
                    fee_paying_account:account.id,
                    task:crontabId
                }
            }],
            onlyGetFee
        },{root:true});
    },
    crontabRecover:async ({dispatch},params)=>{
        helper.trimParams(params);
        if(!params) return {code:101,message:"Crontab parameter is missing"};
        
        let {account,crontabId,restartTime,onlyGetFee=false}=params;
        let c_res=await API.Explorer.getDataByIds([crontabId]);
        if(!c_res.length) return {code:177,message:`crontabId [${crontabId}] not found`}
        

        if(restartTime==undefined){
            return {code:101,message:"Crontab parameter is missing"};
        }
        restartTime=parseInt(restartTime);
        if(isNaN(restartTime)){
            return {code:1011,message:"Parameter error"};
        }
        if(restartTime<=0){
            return {code:176,message:"Crontab must have parameters greater than 0"}
        }
        let  {time} =(await API.Explorer.getDynGlobalObject(false)).data;
        restartTime=Math.floor((new Date(time+"Z").getTime()+restartTime)/1000);
        return dispatch('transactions/_transactionOperations', {
            operations:[{
                op_type:62,
                type:"crontab_recover",
                params:{
                    crontab_owner:account.id,
                    crontab:crontabId,
                    restart_time:restartTime
                }
            }],
            onlyGetFee
        },{root:true});
    }
}

const mutations = {
    [types.SET_CRONTAB](state,params) {
      state.crontab = params;
    }
}
export default {
  state: initialState,
  actions,
  //getters,
  mutations,
  namespaced: true
};
