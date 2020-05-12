import { PrivateKey,TransactionBuilder, Signature } from 'bcxjs-cores';
import { ChainConfig,Apis } from 'bcxjs-ws';
import { getUser } from './account';
import { encryptMemo } from '../../utils';
import helper from "../../lib/common/helper";
import accountUtils from "../../lib/common/account_utils";
import API from '../api';
import Immutable from "immutable";


// 2020-03-05  xulin_add  签名
const signString = async (transaction, store, signContent) => {
  let pubkey = transaction.account.active.key_auths[0][0]

  let private_key = await store.dispatch("WalletDb/getPrivateKey",pubkey,{root:true})
  let signBuffer = new Buffer(signContent)
  let signArray = Array.from(signBuffer)
  signArray.unshift(signContent.length)
  let signArr = new ArrayBuffer(signArray.length);
  let signUint8Array = new Uint8Array(signArr);
  signUint8Array.set(signArray, 0)
  let signre = Signature.signBuffer(signUint8Array, private_key)
  return {
    code:1,
    data:{
      message: signContent,
      signature: signre.toHex(),
    }
  }
}

// 2020-03-05  xulin_add  解签
const checkingSignString = async (checkingSignParams) => {
  let { checkingSignContent, signContent } = checkingSignParams
  // 解签
  let signre = ''
  try {
    signre = Signature.fromHex(checkingSignContent)
  } catch (error) {
    return{
      success:false,
      error: "Incorrect information",
      code: 0
    }
  }
  let signBuffer = new Buffer(signContent)
  let signArray = Array.from(signBuffer)
  signArray.unshift(signContent.length)
  let signArr = new ArrayBuffer(signArray.length);
  let signUint8Array = new Uint8Array(signArr);
  signUint8Array.set(signArray, 0)
  let signature_obj = new Signature(signre.r, signre.s, signre.i)
  let mypubkey = signature_obj.recoverPublicKeyFromBuffer(signUint8Array)
  let userId = await API.Account.getAccountIdByOwnerPubkey(mypubkey.toPublicKeyString())

  if (userId.length == 0) {
    return{
      success:false,
      error: "Incorrect information",
      code: 0
    }
  } else {
    return{ success: true,data:userId,code:1}
  }
}


const signTransaction = async (transaction,store) => {
  let {pubkeys, addys}= await transaction.get_potential_signatures();
  let my_pubkeys =store.rootGetters["PrivateKeyStore/getPubkeys_having_PrivateKey"](pubkeys, addys); 
  let required_pubkeys=await transaction.get_required_signatures(my_pubkeys);
  for(let pubkey_string of required_pubkeys) {
     let private_key=await store.dispatch("WalletDb/getPrivateKey",pubkey_string,{root:true});
     if(!private_key){
        throw new Error("Missing signing key for " + pubkey_string)
     }
     transaction.add_signer(private_key, pubkey_string)
  }
  //Contract authentication
  try{
    let app_keys=store.rootGetters["PrivateKeyStore/app_keys"];
    if(app_keys.length&&transaction.operations[0][0]==35)//app_keys只作用于合约调用
    app_keys.forEach(app_key=>{
      app_key= PrivateKey.fromWif(app_key);
      transaction.add_signer(app_key, app_key.toPublicKey().toPublicKeyString())
    });
  }catch(e){}
};


const buildOperationsAndBroadcast = async (transaction,store,opObjects) => {
  await signTransaction(transaction,store);
  await transaction.update_head_block();
 
  const res=await transaction.broadcast();
  return res;
};



const process_transaction=(transaction,store,opObjects)=>{
  return new Promise(async (resolve) => {
      const broadcastTimeout = setTimeout(() => {
        resolve({ success: false, error: {message:'Expiry of the transaction'},code:119});
      }, ChainConfig.expire_in_secs * 2000);

      try {
        let transactionResData=await buildOperationsAndBroadcast(transaction,store,opObjects);
        clearTimeout(broadcastTimeout);
        resolve({ success: true,data:transactionResData,code:1});

      } catch (error) {
        var _error={
          message:error
        }
        try{
           error=error.message.match(/@@.*@@/)[0].replace(/@@/g,"");
          _error=JSON.parse(error);
          // if(_error.message.indexOf(' -delta: Insufficient Balance: ')>=0){
          //   let {a,b,r}=_error.data.stack[0].data;
          //   _error.message="Insufficient Balance for the fee of "+r+;//balance after current operation: "+b+",
          // }
        }catch (e){
          _error={
            message:error.message
          };
        }
        clearTimeout(broadcastTimeout);
        resolve({ success: false, error:_error,code:0});
      }
    });
}

const transactionOpWorker = async (fromId,operations,fromAccount,propose_options,store) => {
  if(process.browser){
      const opObjects=await buildOPObjects(operations,fromId,fromAccount,store);
      if(opObjects.success==false){
        return opObjects;
      }
      let keys=store.rootGetters["PrivateKeyStore/keys"];
      let aes_private=store.rootGetters["WalletDb/aes_private"];
      let _passwordKey=store.rootGetters["WalletDb/_passwordKey"]
      let app_keys=store.rootGetters["PrivateKeyStore/app_keys"];

      let core_asset=await API.Assets.fetch(["1.3.0"],true);;
      
      let $passwordKey={};
      if(_passwordKey){
        Object.keys(_passwordKey).forEach(pubkeyStr=>{
          $passwordKey[pubkeyStr]= _passwordKey[pubkeyStr].toWif();
        })
      }else {
        var getPrivateKeyPromises=[];
        Object.keys(keys).forEach(pubkeyStr=>{
          getPrivateKeyPromises.push(store.dispatch("WalletDb/getPrivateKey",pubkeyStr,{root:true}));
        })

        let privateKeys=await Promise.all(getPrivateKeyPromises);
        privateKeys.forEach(key=>{
          $passwordKey[key.toPublicKey().toString()]=key.toWif();
        })
      }
 
      return  new Promise((resolve)=>{
        var transactionWorker = require("bcl-worker-loader?name=bcxWorker.js!../workers/transactionWorker.js")
        var worker = new transactionWorker;
        // console.info("opObjects",opObjects);
        worker.postMessage({
          opObjects,
          propose_options,
          core_asset,
          onlyGetOPFee:store.rootGetters["transactions/onlyGetOPFee"],
          url:store.rootGetters["setting/SELECT_WS_NODE_URL"],
          keys,
          aes_private,
          _passwordKey:$passwordKey,
          app_keys,
          networks:store.rootGetters["setting/networks"],
          fromId
        });
        worker.onmessage = event => {
          var res = event.data;
          resolve(res);
        }
      })
    }
};

const transactionOp = async (fromId,operations,fromAccount,proposeAccountId="",store) => {
  const opObjects=await buildOPObjects(operations,proposeAccountId||fromId,fromAccount,store);
  if(opObjects.code&&opObjects.code!=1){
    return opObjects;
  }
  
  const transaction = new TransactionBuilder();
  // console.info("opObjects",opObjects);
  opObjects.forEach(op=>{
    transaction.add_type_operation(op.type, op.opObject); 
  });

  // let {crontab}=store.rootState.crontab;
  
  // if(crontab){
  //   await transaction.set_required_fees();
  //   await  transaction.update_head_block();
  //   let {startTime,executeInterval,executeTimes}=crontab;

  //   if(startTime==undefined||executeInterval==undefined||executeTimes==undefined){
  //     return {code:101,message:"Crontab parameter is missing"};
  //   }
  //   startTime=parseInt(startTime);
  //   executeInterval=parseInt(executeInterval);
  //   executeTimes=parseInt(executeTimes);
  //   if(isNaN(startTime)||isNaN(executeInterval)||isNaN(executeTimes)){
  //     return {code:1011,message:"Parameter error"};
  //   }

  //   if(startTime<=0||executeInterval<=0||executeTimes<=0){
  //       return {code:176,message:"Crontab must have parameters greater than 0"}
  //   }

  //   let res=await Apis.instance().db_api().exec("get_objects", [["2.1.0"]]);
  //   let now_time=new Date(res[0].time+"Z").getTime();
  //   let crontab_options={
  //     crontab_creator:fromId,
  //     start_time:Math.floor((now_time+startTime)/1000),//+Number(startTime),
  //     execute_interval:executeInterval,
  //     scheduled_execute_times:executeTimes
  //   }
  //   transaction.crontab(crontab_options)   
  // }

  if(proposeAccountId){
     await  transaction.update_head_block();
     let propose_options={
      fee_paying_account:fromId
     }  
     transaction.propose(propose_options)
  }
  // console.info("transaction",transaction);
  return  process_transaction(transaction,store,opObjects);
};

const buildOPObjects=async (operations,fromId,fromAccount,store)=>{
  let opObjects=[];
  let opObject,opItem;
  for(let i=0;i<operations.length;i++){
      opObject=null;
      opItem=operations[i];
      try{
        let opParams=opItem.params;
        let {asset_id="1.3.0",fee_asset_id="1.3.0"}=opParams;

        let assetObj=await API.Assets.fetch_asset_one(asset_id);
        if(assetObj.code!=1) return assetObj;
        assetObj=assetObj.data;

        switch(opItem.type){
          case "account_update":
            if("action" in opParams){
              opObject=getUpdateAccountObject(opParams,fromAccount.account);
            }else{
              opObject=opParams.updateObject;
            }   
            break;  
          case "contract_create":
            let {name,data,authority}=opParams;
            opObject = {
              owner: fromId,
              name,
              data,
              contract_authority:authority,
              extensions:[]
            };   
            break;  
            case "revise_contract":
              opObject = {
                reviser: fromId,
                ...opParams,
                extensions:[]
              };   
            break; 
          case "call_contract_function":
            let {contractId,functionName,valueList,runTime}=opParams;
            opObject = {
              caller:fromId,
              contract_id:contractId,
              function_name:functionName,
              value_list:valueList,
              extensions:[]
            };   
            break; 
          case "create_nh_asset_order":
            let {pending_orders_fee,price,priceAssetId="1.3.0"}=opParams;

            pending_orders_fee=await helper.toOpAmount(pending_orders_fee,assetObj);
            if(!pending_orders_fee.success){
              return pending_orders_fee;
            }
            opParams.pending_orders_fee=pending_orders_fee.data;

            let price_amount_res=await helper.toOpAmount(price,priceAssetId);
            if(!price_amount_res.success){
              return price_amount_res;
            }
            opParams.price=price_amount_res.data;

            opObject = {
              seller: fromId,
              ...opParams
            };
            break;
          case "limit_order_cancel":
            opObject={
              fee_paying_account:fromId,
              order:opParams.orderId
            }
            break;
          case "vesting_balance_withdraw":
            opObject={
              owner:fromId,
              ...opParams
            }
            break
        }

        let {op_type}=opItem;

        if(typeof op_type!="undefined"){
          if((op_type>=37&&op_type<=45)&&op_type!=43){
              if("asset_id" in opParams)  opParams.asset_id=assetObj.symbol;
              
              opObject=opParams;
              switch (op_type){
                case 42:opObject.from=fromId;
                      break;
                case 39:opObject.related_account=fromId;
                      break;
                  default:opObject.fee_paying_account=fromId;
              }

          }else if(op_type==0||op_type==13){
              let {to,amount=0,memo,isEncryption}=opParams;

              let toAccount =await getUser(to);
              if (!toAccount.success)  return { success: false, error: 'Account receivable does not exist',code:116 };
              
              let amount_res=await helper.toOpAmount(amount,assetObj);
              if(!amount_res.success) return amount_res;
              amount=amount_res.data;

              opObject = { };
              if(op_type==0){
                opObject.from=fromId;
                opObject.to=toAccount.data.account.id;
                opObject.amount=amount
              }else if(op_type==13){
                opObject.issuer=fromId;
                opObject.issue_to_account=toAccount.data.account.id;
                opObject.asset_to_issue=amount;
              }
              if (memo) {
                if(isEncryption){
                  let memo_key=toAccount.data.account.options.memo_key;
                  let memo_from_privkey =await store.dispatch("WalletDb/getPrivateKey",fromAccount.account.options.memo_key,{root:true})
                  memo=encryptMemo(new Buffer(memo, "utf-8"), memo_from_privkey, memo_key);
                }
                
                try {
                  opObject.memo =[isEncryption?1:0,memo];//
                } catch (error) {
                  return { success: false, error: 'Encrypt memo failed',code:118 };
                }
              }
          }else if(!opObject){
            opObject=opParams;
          } 
        }

        opObjects.push({
            type:opItem.type,
            opObject
        });
      }catch(e){
        console.info("e",e);
        return {
          success:false,
          error:e.message,
          code:0
        }
      }
  }

  return opObjects;
}

const getUpdateAccountObject=(params,fromAccount)=>{
      let updated_account=fromAccount;
      let updateObject = {account: updated_account.id};
      let new_options =JSON.parse(JSON.stringify(updated_account.options));
    
      let {action,activePubkey,ownerPubkey}=params;
      if(action=="changePassword"){
        let active=JSON.parse(JSON.stringify(updated_account.active));
        let owner=JSON.parse(JSON.stringify(updated_account.owner));
        active.key_auths[0]=[activePubkey,1];
        owner.key_auths[0]=[ownerPubkey,1];

        updateObject.active=active;
        updateObject.owner=owner;
        new_options.memo_key=activePubkey;
      }
      updateObject.new_options = new_options;
      return updateObject;
}


export default { transactionOp,transactionOpWorker, signString, checkingSignString  };
