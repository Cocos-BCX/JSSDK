import * as types from '../mutations';
import API from '../services/api';
import helper from '../lib/common/helper';
import {ChainStore} from "bcxjs-cores";


const initialState = {
    //ex_global_object:null
    last_current_aslot:0
};

// let _last_current_aslot=0;
let _last_date_now=0;
const actions={
    getDataByIds:(store,{ids})=>{
      return API.Explorer.getDataByIds(ids);
    },
    queryTransaction:async (store,{transactionId=""})=>{
        if(/^[a-zA-Z\d]{64}$/.test(transactionId)){
           let result=await API.Explorer.getTransactionById(transactionId);
           if(result.code!=1){
             return result;
           }
           let transaction=result.data;
           let {operations,block_num,operation_results}=transaction;
           let parse_ops=operations.map((op,op_index)=>{
                          return {
                            op,
                            block_num,
                            result:operation_results[op_index]
                          }
                      });
            parse_ops=await API.Operations.parseOperations({ operations: parse_ops,store });
            transaction.parse_ops=parse_ops.operations;
            transaction.trx_id=transactionId;
            transaction.expiration=new Date(transaction.expiration+"Z").format("yyyy/MM/dd HH:mm:ss");
            delete transaction.operations;
            delete transaction.operation_results;

            return {
               code:1,
               data:transaction
            };
        }else{
          return {code:1011,message:"Parameter error"};
        }
      },
      queryBlock:async (store,params)=>{
        let {block="",isReqTrx=true,isParseTrx=true,maxOpCount=1000000,block_res=null}=params;
        if(isParseTrx==undefined){
          isParseTrx=true;
        }
        if(block&&typeof block=="string")
           block=block.trim();
        
        if(!(/^\d+$/.test(block))){
          return {
            code:1011,
            message:"Parameter error"
          }
        }
        
        const result=block_res&&!isReqTrx?block_res:await API.Operations.getBlock(block);
      
        if(result.code==1){

          if(block_res&&!isReqTrx){
            let {head_block_id,time,current_witness,current_transaction_count}=result.data;
            result.data={
              block_num:block,
              block_height:block,
              block_id:head_block_id,
              witness:current_witness,
              timestamp:time,
              trx_count:current_transaction_count,
              op_count:current_transaction_count
            }
          }

          let blockInfo=result.data;
          blockInfo.time=new Date(blockInfo.timestamp+"Z").format("yyyy/MM/dd HH:mm:ss");
          blockInfo.block_height=block;
          blockInfo.witness_name=await API.Explorer.getWitnessName(blockInfo.witness);

          if(isReqTrx){
            let transactions=blockInfo.transactions;
            let parse_ops;
            let transaction;
            let filter_transactions=[];
            let trx_ops_count=0;
            blockInfo.op_count=0;
            for(let i=0;i<transactions.length;i++){
              transaction=transactions[i][1];
              trx_ops_count=transaction.operations.length;
              blockInfo.op_count+=trx_ops_count;
              if(!block_res&&blockInfo.op_count<maxOpCount&&isParseTrx){
                parse_ops=transaction.operations.map((op,op_index)=>{
                    return {
                      op,
                      block_num:block,
                      result:transaction.operation_results[op_index]
                    }
                });
                parse_ops=await API.Operations.parseOperations({ operations: parse_ops,store });
                transaction.parse_ops=parse_ops.operations;
                transaction.parse_ops= transaction.parse_ops.map(item=>{
                    item.date= blockInfo.time;
                    return item;
                });
                delete transaction.operations;
                delete transaction.operation_results;
              }else{
                parse_ops=transaction.operations
              }
             
              transaction.trx_id=transactions[i][0];
              filter_transactions.push(transaction);
            }
            blockInfo.transactions=filter_transactions;
            blockInfo.trx_count=transactions.length;
          }
        }
        return result;
    },
    set_last_current_aslot:({commit})=>{
      commit(types.SET_LAST_CURRENT_ASLOT,0);
    },
    getDynGlobalObject:(store)=>{
      return API.Explorer.getDynGlobalObject(true,true);
    },
    getExplorerWitnesses:async (store)=>{
        let {dispatch,rootGetters,state,commit}=store;

        let _last_current_aslot=state.last_current_aslot;
        let globalObject=rootGetters["vote/globalObject"];
        if(!globalObject){
          globalObject=await API.Explorer.getGlobalObject();
          if(globalObject.code!=1){
            return globalObject;
          }
          globalObject=globalObject.data;
        }else{
          globalObject=JSON.parse(JSON.stringify(globalObject));
        }
        
        let dynGlobalObject =await API.Explorer.getDynGlobalObject(true,true);

        if(dynGlobalObject.code!=1){
          return dynGlobalObject;
        }
        dynGlobalObject=dynGlobalObject.data;
        let {active_witnesses,parameters}=globalObject;
        let {current_witness,current_witness_name,participation,
          witness_budget,next_maintenance_time,current_aslot}=dynGlobalObject;
        let coreAsset=await dispatch("assets/fetchAssets",{assets:["1.3.0"],isOne:true},{root:true});
        let pow_precision=Math.pow(10,coreAsset.precision);
        //  let all_witness=
        return new Promise(resolve=>{
            dispatch("vote/getVoteObjects",{type:"witnesses",isExplorer:true,callback:function(res){
              if(res.code==1){
                let date_now;
                let witnesses=res.data.filter(item=>{
                    return (","+active_witnesses.join(",")+",").indexOf(","+item.witness_id+",")>=0;
                });
                 witnesses=witnesses.map(item=>{
                    if(_last_current_aslot!=current_aslot){
                       commit(types.SET_LAST_CURRENT_ASLOT,current_aslot);
                       date_now=Date.now();
                       _last_date_now=date_now;
                    }else{
                       date_now=_last_date_now;
                    }
                    item.last_aslot_time=new Date(
                      date_now -(current_aslot - item.last_aslot) * parameters.block_interval * 1000
                     ).format("yyyy/MM/dd HH:mm:ss");

                    return item;
                });

                participation=participation||100;
                resolve({
                  code:1,
                  data:{
                    current_witness,
                    current_witness_name,
                    active_witnesses,
                    participation,
                    witness_pay_per_block:helper.getFullNum(parameters.witness_pay_per_block/pow_precision),
                    witness_budget:helper.getFullNum(witness_budget/pow_precision),
                    next_maintenance_time:new Date(next_maintenance_time+"Z").format("yyyy/MM/dd HH:mm:ss"),
                    witnesses,
                    core_asset_symbol:coreAsset.symbol
                  }
                });
              }else{
                resolve(res);
              }
            }},{root:true})
        })
    }
}

const mutations = {
//  [types.SET_EX_GLOBAL_OBJECT]:(state,ex_g_o)=>{
//     state.ex_global_object=ex_g_o;
//  }
    [types.SET_LAST_CURRENT_ASLOT]:(state,aslot)=>{
      state.last_current_aslot=aslot;
    }
};

export default {
  state: initialState,
  actions,
  // getters,
  mutations,
  namespaced: true
};
