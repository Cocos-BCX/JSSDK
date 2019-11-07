import { Apis } from 'bcxjs-ws';
import {ChainStore} from "bcxjs-cores";
import API from '../api';


export const getGlobalObject= async (isCache=false) => {
    try{
        let response= ChainStore.getObject("2.0.0");
        if(response&&isCache){
           response=response.toJS();
        }else{
            response=await Apis.instance().db_api().exec('get_objects',[["2.0.0"]]);
            if(response.length)
            response=response[0];
        }
        if(response){
            return {
                code:1,
                data:response
            }
        }
        return {
            code:102,
            message:"Getting 'GlobalObject' failed，The network is busy, please check your network connection"
        }
    }catch(e){
        return {
            code:0,
            message:e.message
        }
    }
};

export const getDynGlobalObject = async (isExec=false,isReqWitness=false) => {
   try{
         //let response=await Apis.instance().db_api().exec('get_objects',[["2.1.0"]])
         let response= ChainStore.getObject("2.1.0",false,true,false,false);
         if(response){   
            try{ response=response.toJS(); }
            catch(e){}
         }

         if(!response||isExec){
            response=await Apis.instance().db_api().exec('get_objects',[["2.1.0"]]);
            response=response[0];
            response.chainTimeOffset=ChainStore.getEstimatedChainTimeOffset();
        }

        if(isReqWitness){
            response.current_witness_name=await getWitnessName(response.current_witness);
        }
        return {code:1,data:response}
   }catch(e){
       return {
           code:0,
           message:e.message
       }
   }
};

export const getWitnessName=async (witness_id)=>{
    let current=ChainStore.getObject(witness_id);
    let witness_account="";
    if(current){
        witness_account=current.get("witness_account");
    }else{
        current=await Apis.instance().db_api().exec('get_objects',[[witness_id]]); 
        if(current&&current[0]){
            witness_account=current[0].witness_account;
        }
    }
    if (witness_account) {
        let bp_acc_res=await API.Account.getAccount(witness_account,true);
    
        if(bp_acc_res.code==1){
            return bp_acc_res.data.account.name
        }
    }
    return witness_id;
}

export const getDataByIds=async (ids)=>{
    try{
        let response=await Apis.instance().db_api().exec('get_objects',[ids]);
        if(response){
            response=response.filter(res=>{
                return res!=null;
            })
        }else{
            response=[];
        }   
        return {code:1,data:response};
    }catch(error){
        return {
            code: 0,
            message:error.message,
            error
        };
    }
}

export const getTransactionById=async trx_id=>{
    try {
        let response = await Apis.instance().db_api().exec('get_transaction_by_id', [trx_id]);
        if (!!response) {
          const block=await Apis.instance().db_api().exec("get_transaction_in_block_info",[trx_id]);
          response.block_num=block.block_num;
          return {
              code:1,
              data:response
          }
        }
        return {
            code: 104,
            message:trx_id+' not found'
        };
      } catch (error) {
        let message=error.message;
        return {
          code: 0,
          message,
          error
        };
    }
}

export default {
    getGlobalObject,
    getDynGlobalObject,
    getTransactionById,
    getWitnessName,
    getDataByIds
};