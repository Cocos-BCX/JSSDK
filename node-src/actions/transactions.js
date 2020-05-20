import * as types from '../mutations';
import API from '../services/api';
import helper from '../lib/common/helper';
import { PublicKey, Aes } from "bcxjs-cores";

// 2020-03-05  xulin_add  签名
export const _signString = async (store, params) => {
  let { signContent } = params

  if(store.rootGetters['WalletDb/isLocked']){
    return {code:114,message:"Account is locked or not logged in"};
  }
  const fromId = store.rootGetters['account/getAccountUserId'];
  
  let fromAccount = (await store.dispatch("user/fetchUser",fromId,{root:true})).data;
  const result = await API.Transactions.signString(fromAccount,store, signContent);
  
  if(result){
    return result;
  }
}


// 2020-03-05  xulin_add 验签
export const _checkingSignString = async (store, checkingSignParams) => {
  if(store.rootGetters['WalletDb/isLocked']){
    return {code:114,message:"Account is locked or not logged in"};
  }
  const result = await API.Transactions.checkingSignString(checkingSignParams);
  if(result){
    return result;
  }
}

// 4-29 解码单个备注
export const _decodeOneMemo = async (store, memo_con, storeApi) => {
  let memo = memo_con

  if(store.rootGetters['WalletDb/isLocked']){
    return {code:114,message:"Account is locked or not logged in"};
  }
  const fromId = store.rootGetters['account/getAccountUserId'];
  
    let fromAccount = (await store.dispatch("user/fetchUser",fromId,{root:true})).data;
    let activepubkey = fromAccount.account.active.key_auths[0][0]
    let private_key = await store.dispatch("WalletDb/getPrivateKey",activepubkey,{root:true})
    let pubkey = memo.from == activepubkey ? memo.to : memo.from;
    let public_key = PublicKey.fromPublicKeyString(pubkey)
    let memo_text = private_key ? Aes.decrypt_with_checksum(
      private_key,
      public_key,
      memo.nonce,
      memo.message
  ).toString("utf-8") : null;
  let result = {
    code: 1,
    data: {
      text: memo_text, isMine: memo.from == activepubkey
    }
  }
  return result
}



// 2020-05-13  xulin add
export const encryptionOneMome = async ({ dispatch,rootGetters },params) => {
  helper.trimParams(params)
  console.log("encryptionOneMome.........")
  const fromId =rootGetters['account/getAccountUserId'];
  let {fromAccount="",toAccount,amount=0,memo,assetId="1.3.0",isEncryption=true,
  onlyGetFee=false,proposeAccount="",isPropose}=params;
  
  if(!toAccount){
    return {code:124,message:"Receivables account name can not be empty"}
  }

  if(isPropose){
    proposeAccount=fromAccount;
  }
  
  assetId=assetId||"1.3.0";
  assetId=assetId.toUpperCase();

  return dispatch('_encryptionOneMomeOperations', {
    operations:[{
      op_type:0,
      type:"transfer",
      params:{
        to:toAccount,
        amount,
        asset_id:assetId,
        memo,
        isEncryption
      }
    }],
    proposeAccount,
    onlyGetFee
  });
};


export const transferAsset = async ({ dispatch,rootGetters },params) => {
  helper.trimParams(params)

  let {fromAccount="",toAccount,amount=0,memo,assetId="1.3.0",isEncryption=true,
  onlyGetFee=false,proposeAccount="",isPropose}=params;
  
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
        isEncryption
      }
    }],
    proposeAccount,
    onlyGetFee
  });
};


export const transferAssets = async ({ dispatch,rootGetters },params) => {
  helper.trimParams(params)
  let {ops,onlyGetFee=false,proposeAccount="",isPropose,onlyGetBroadcastDataPacket}=params;
  let operations=[];
  for(let i=0;i<ops.length;i++){
    let {fromAccount="",toAccount,amount=0,memo,assetId="1.3.0",feeAssetId="1.3.0",isEncryption=false}=ops[i];
    if(!toAccount){
      return {code:124,message:"Receivables account name can not be empty"}
    }
    assetId=assetId||"1.3.0";
    assetId=assetId.toUpperCase();
    operations.push({
      op_type:0,
      type:"transfer",
      params:{
        to:toAccount,
        amount,
        asset_id:assetId,
        memo,
        isEncryption
      }
    })
  }
  return dispatch('_transactionOperations', {
    operations,
    proposeAccount,
    onlyGetFee,
    onlyGetBroadcastDataPacket
  });
};

export const setOnlyGetOPFee=({commit},b)=>{
  commit(types.SET_ONLY_GET_OP_FEE,b);
}





// 2020-05-13 xulin add
export const _encryptionOneMomeOperations = async (store, { operations,proposeAccount="",onlyGetFee=false}) => {
  console.log("_encryptionOneMomeOperations")
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
  console.log('fromAccount...', fromAccount)
  if(rootGetters['WalletDb/isLocked']){
    return {code:114,message:"Account is locked or not logged in"};
  }

  // let worker=rootGetters["setting/g_settingsAPIs"].worker;
  const res=await API.Transactions.oneMomeOp(fromId,operations,fromAccount,proposeAccount,store);
  console.log('res', res)
  return res
  // if (res.success) {

  //   // if(onlyGetFee) return {code:1,data:res.data}
    
  //    let {id,block_num,trx}=res.data[0];
  //    let results=[];
  //    let op_result;
  //    for(let i=0;i<trx.operation_results.length;i++){
  //         op_result=trx.operation_results[i][1];
  //         if(op_result.contract_affecteds){
  //             let _operations=op_result.contract_affecteds.map(item=>{
  //                 let op_num=item[0]+300;
  //                 if(item[0]==1){
  //                   op_num=op_num+""+item[1].action
  //                 }
  //                 return {
  //                   block_num,
  //                   id:"",
  //                   op:[Number(op_num),item[1]]
  //                 }
  //             });
  //             op_result.contract_affecteds=(await API.Operations.parseOperations({
  //               operations:_operations,
  //               store,
  //               isContract:true
  //             })).map(item=>{
  //                 item.result=item.parse_operations;
  //                 item.result_text=item.parse_operations_text;

  //                 delete item.payload;
  //                 delete item.parse_operations;
  //                 delete item.parse_operations_text;

  //                 return item;
  //             }); 
  //         }

  //       if(Object.keys(op_result).length) results.push(op_result);
  //    }

  //     let params=operations[0].params;
  //     if("action" in params&&params.action=="changePassword"){
  //       dispatch("account/_logout",null,{root:true});
  //     }

  //   return {
  //           code:1,
  //           data:results,
  //           trx_data:{
  //             trx_id:id,
  //             block_num:block_num
  //          }      
  //         };
  // } else {
  //   return TRANSFER_ASSET_ERROR({error:res.error,code:res.code})
  // }
};



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

    // if(onlyGetFee) return {code:1,data:res.data}
    
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

