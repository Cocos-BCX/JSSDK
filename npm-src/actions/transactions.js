import * as types from '../mutations';
import API from '../services/api';
import helper from '../lib/common/helper';

export const transferAsset = async ({ dispatch,rootGetters },params) => {
  helper.trimParams(params)

  let {fromAccount="",toAccount,amount=0,memo,assetId="1.3.0",
  onlyGetFee=false,feeAssetId="1.3.0",proposeAccount="",isPropose}=params;
  if(!toAccount){
    return {code:124,message:"Receivables account name can not be empty"}
  }

  if(isPropose){
    proposeAccount=fromAccount;
  }
  
  assetId=assetId||"1.3.0";
  assetId=assetId.toUpperCase();

  return dispatch('_transactionOperations', {
    operations:[{
      op_type:0,
      type:"transfer",
      params:{
        to:toAccount,
        amount,
        asset_id:assetId,
        memo,
        fee_asset_id:feeAssetId
      }
    }],
    proposeAccount,
    onlyGetFee
  });
};

export const setOnlyGetOPFee=({commit},b)=>{
  commit(types.SET_ONLY_GET_OP_FEE,b);
}



export const _transactionOperations = async (store, { operations,proposeAccount="",onlyGetFee=false}) => {
  let {commit, rootGetters,dispatch }=store;
  dispatch("setOnlyGetOPFee",onlyGetFee);
  commit(types.TRANSFER_ASSET_REQUEST);
  commit(types.SET_TRX_DATA,null);//clear last SET_TRX_DATA
  const fromId =rootGetters['account/getAccountUserId'];
  if(proposeAccount){
    let pAcc=await API.Account.getUser(proposeAccount,true);
    if(pAcc.code!=1){
      return pAcc;
    }
    proposeAccount=pAcc.data.account.id;
  }

  const fromAccount =  (await dispatch("user/fetchUser",fromId,{root:true})).data;

  if(rootGetters['WalletDb/isLocked']){
    return {code:114,message:"Account is locked or not logged in"};
  }

  let worker=rootGetters["setting/g_settingsAPIs"].worker;
  // console.info("worker",worker,rootGetters["setting/g_settingsAPIs"]);
  const res=await API.Transactions[worker?"transactionOpWorker":"transactionOp"](fromId,operations,fromAccount,proposeAccount,store);
  if (res.success) {

    if(onlyGetFee) return {code:1,data:res.data}
    
     let {id,block_num,trx}=res.data[0];
     let results=[];
     let op_result;
     for(let i=0;i<trx.operation_results.length;i++){
          op_result=trx.operation_results[i][1];
          if(op_result.contract_affecteds){
              let _operations=op_result.contract_affecteds.map(item=>{
                  let op_num=item[0]+300;
                  if(item[0]==1){
                    op_num=op_num+""+item[1].action
                  }
                  return {
                    block_num,
                    id:"",
                    op:[Number(op_num),item[1]]
                  }
              });
              op_result.contract_affecteds=(await API.Operations.parseOperations({
                operations:_operations,
                userId:rootGetters["account/getAccountUserId"],
                store,
                isContract:true
              })).map(item=>{
                  item.result=item.parse_operations;
                  item.result_text=item.parse_operations_text;

                  delete item.payload;
                  delete item.parse_operations;
                  delete item.parse_operations_text;

                  return item;
              }); 
          }

        if(Object.keys(op_result).length) results.push(op_result);
     }

      let params=operations[0].params;
      if("action" in params&&params.action=="changePassword"){
        dispatch("account/_logout",null,{root:true});
      }

    return {
            code:1,
            data:results,
            trx_data:{
              trx_id:id,
              block_num:block_num
           }      
          };
  } else {
    return TRANSFER_ASSET_ERROR({error:res.error,code:res.code})
  }
};

const TRANSFER_ASSET_ERROR=({error,code})=>{
  if(typeof error=="string"){
    error={
      message:error
    }
  }

  let message=error.message;
  if(typeof error.message=="string"){
    if(error.message.indexOf("o.issuer == a.issuer")!=-1){
      code=160;
      message="You are not the creator of assets"
    }
  }

  return {
    code,
    message,
    error
  }
}

export const setOrderData=({commit},params)=>{
  commit(types.SET_ORDER_DATA,params);
}

