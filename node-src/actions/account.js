import { PrivateKey, key, Aes, brainKey,ChainValidation,FetchChain,ChainStore,FetchChainObjects } from 'bcxjs-cores';
import Immutable from "immutable";

import * as types from '../mutations';
import API from '../services/api';
import PersistentStorage from '../services/persistent-storage';
import * as WalletDbS from '../store/WalletDb';
import utils from '../lib/common/utils';
import helper from '../lib/common/helper';

let _passwordKey = null;
const OWNER_KEY_INDEX = 1;
const ACTIVE_KEY_INDEX = 0;

// helper fync
const createWallet = ({ password,wif }) => {
  const passwordAes = Aes.fromSeed(password);
  const encryptionBuffer = key.get_random_key().toBuffer();
  const encryptionKey = passwordAes.encryptToHex(encryptionBuffer);
  const aesPrivate = Aes.fromSeed(encryptionBuffer);

  const private_key = PrivateKey.fromWif(wif) //could throw and error
  const private_plainhex = private_key.toBuffer().toString('hex')

  const encrypted_key = aesPrivate.encryptHex(private_plainhex);


  const passwordPrivate = PrivateKey.fromSeed(password);
  const passwordPubkey = passwordPrivate.toPublicKey().toPublicKeyString();

  const result = {
    passwordPubkey,
    encryptionKey,
    encrypted_key,
    aesPrivate,
  };

  return result;
};

/**
 * Unlocks user's wallet via provided password
 * @param {string} password - user password
 */
export const unlockWallet = ({ commit, state }, password) => {
  const passwordAes = Aes.fromSeed(password);
  const encryptionPlainbuffer = passwordAes.decryptHexToBuffer(state.encryptionKey);
  const aesPrivate = Aes.fromSeed(encryptionPlainbuffer);
  commit(types.ACCOUNT_UNLOCK_WALLET, aesPrivate);
};

/**
 * Locks user's wallet
 */
export const lockWallet = ({ commit }) => {
  commit(types.ACCOUNT_LOCK_WALLET);
};

/**
 * Creates account & wallet for user
 * @param {string} name - user name
 * @param {string} password - user password
 * @param {string} dictionary - string to generate brainkey from
 */
export const createAccountWithPassword = async (store, params) => {
  if(!helper.trimParams(params)){
    return {code:101,message:"Parameter is missing"};
  }
  let { account, password, autoLogin=false,onlyGetFee=false}=params;
 
  if(!(/^[a-z]([a-z0-9\.-]){4,62}$/.test(account))){
    return {code:103,message:"Please enter the correct account name(/^[a-z]([a-z0-9\.-]){4,62}$/)"};
  }
  
  const { commit,dispatch,rootGetters,getters } = store;
  
  let acc_res=await dispatch("user/getUserInfo",{account,isCache:true},{root:true});
  if(acc_res.code==1){
    return {code:159,message:"Account exists"};
  }

  commit(types.ACCOUNT_SIGNUP_REQUEST);
  //generate owner and active keys
  let {privKey : owner_private} = WalletDbS.generateKeyFromPassword(account, "owner", password);
  let {privKey: active_private} = WalletDbS.generateKeyFromPassword(account, "active", password);
  // getAccountUserId
  let result;
  let exist_account_id=getters.getAccountUserId;
  
  if(exist_account_id){
      return await dispatch("application_api_create_account",{
        owner_pubkey:owner_private.toPublicKey().toPublicKeyString(),
        active_pubkey:active_private.toPublicKey().toPublicKeyString(),
        new_account_name:account,
        registrar:exist_account_id,
        referrer:exist_account_id,
        referrer_percent:0,
        onlyGetFee
     });
  }else{
    const settingsAPIs=rootGetters["setting/g_settingsAPIs"];
    //faucet account registration
    result = await API.Account.createAccount({
      name:account,
      activePubkey: active_private.toPublicKey().toPublicKeyString(),
      ownerPubkey: owner_private.toPublicKey().toPublicKeyString(),
      referrer: settingsAPIs.referrer || ''
    },settingsAPIs.default_faucet);
  }

  if (result.success) {
    return new Promise(resolve=>{
      setTimeout(()=>{
        if(autoLogin){
          resolve(dispatch("account/passwordLogin",{
            account,
            password
          },{ root: true }))
        }else{
          API.Account.getAccountIdByOwnerPubkey(result.data.account.owner_key).then(userId=>{
              let id = userId && userId[0];
              if(id) id=userId[0];
              resolve({code:1,data:{account_id:id,account_name:account}})
          });
        }
      },2000)
    })
    return  dispatch("getAccountInfo");
  }

  commit(types.ACCOUNT_SIGNUP_ERROR, { error: result.error });
  return {code:result.code,message:result.error,error:result.error};
};


export const createAccountWithPublicKey = async (store, params) => {
  if(!helper.trimParams(params)){
    return {code:101,message:"Parameter is missing"};
  }
  let { account, ownerPubkey, activePubkey}=params;
 
  if(!(/^[a-z]([a-z0-9\.-]){4,62}$/.test(account))){
    return {code:103,message:"Please enter the correct account name(/^[a-z]([a-z0-9\.-]){4,62}$/)"};
  }
  
  const { commit,dispatch,rootGetters,getters } = store;
  
  let acc_res=await dispatch("user/getUserInfo",{account,isCache:true},{root:true});
  if(acc_res.code==1){
    return {code:159,message:"Account exists"};
  }

  commit(types.ACCOUNT_SIGNUP_REQUEST);
  let result;
  let exist_account_id=getters.getAccountUserId;
  if(exist_account_id){
      return await dispatch("application_api_create_account",{
        owner_pubkey:ownerPubkey,
        active_pubkey:activePubkey,
        new_account_name:account,
        registrar:exist_account_id,
        referrer:exist_account_id,
        referrer_percent:0
     });
  }else{
    const settingsAPIs=rootGetters["setting/g_settingsAPIs"];
     //faucet account registration
    result = await API.Account.createAccount({
      name:account,
      activePubkey: activePubkey,
      ownerPubkey: ownerPubkey,
      referrer: settingsAPIs.referrer || ''
    },settingsAPIs.default_faucet);
  }

  if (result.success) {
    const userId = await API.Account.getAccountIdByOwnerPubkey(result.data.account.owner_key);
    let id = userId && userId[0];
    if(id) id=userId[0]
    // console.info("id",id,result);
    return  {code:1,data:{
      "account_id":id,
      account_name:account,
      active_public_key:activePubkey,
      owner_public_key:ownerPubkey
    }};
  }

  commit(types.ACCOUNT_SIGNUP_ERROR, { error: result.error });
  return {code:result.code,message:result.error,error:result.error};
};

export const createAccountWithWallet=async({dispatch,rootGetters},params)=>{
  if(!helper.trimParams(params)){
    return {code:101,message:"Parameter is missing"};
  }
  let {callback,account,password,onlyGetFee=false}=params;
  dispatch("transactions/setOnlyGetOPFee",onlyGetFee,{root:true});

  if(!(/^[a-z]([a-z0-9\.-]){4,62}/.test(account))){
    return {code:103,message:"Please enter the correct account name(/^[a-z]([a-z0-9\.-]){4,62}/)"}
  }

   if(!rootGetters["WalletDb/wallet"])
        await dispatch("account/_logout",null,{root:true});    

  let acc_res=await dispatch("user/getUserInfo",{account,isCache:true},{root:true});
  if(acc_res.code==1){
    return {code:159,message:"Account exists"};
  }

  if(rootGetters["WalletDb/wallet"]){
    if(rootGetters["WalletDb/isLocked"]){
      return {code:149,message:"Please unlock your wallet first"}
    }

   return dispatch("WalletDb/createAccount",{
     account_name:account,
     registrar:rootGetters["account/getAccountUserId"],
     referrer:rootGetters["account/getAccountUserId"]
    },{root:true}).then(res=>{
        if(res.code!=1){
          dispatch("WalletManagerStore/deleteWallet",null,{root:true});
        }
        return res;
    }).catch(error=>{
      return {code:0,message:error.message,error};
    })

  }else{
    return dispatch("WalletDb/createWallet",{password,account},{root:true})
  } 
}

export const application_api_create_account=({dispatch},{ owner_pubkey,
  active_pubkey,
  new_account_name,
  registrar,
  referrer,
  onlyGetFee=false,
  referrer_percent=0})=>{

        ChainValidation.required(registrar, "registrar_id")
        ChainValidation.required(referrer, "referrer_id")

        return Promise.all([
            FetchChain("getAccount", registrar),
            FetchChain("getAccount", referrer)
        ]).then((res)=> {
            let [ chain_registrar, chain_referrer ] = res;
            var ca_res=dispatch('transactions/_transactionOperations', {
              operations:[{
                  op_type:5,
                  type:"account_create",
                  params: {
                    fee: {
                        amount: 0,
                        asset_id: 0
                    },
                    "registrar": chain_registrar.get("id"),
                    // "referrer": chain_referrer.get("id"),
                    // "referrer_percent": referrer_percent,
                    "name": new_account_name,
                    "owner": {
                        "weight_threshold": 1,
                        "account_auths": [],
                        "key_auths": [[ owner_pubkey, 1 ]],
                        "address_auths": []
                    },
                    "active": {
                        "weight_threshold": 1,
                        "account_auths": [ ],
                        "key_auths": [[ active_pubkey, 1 ]],
                        "address_auths": []
                    },
                    "options": {
                        "memo_key": active_pubkey,
                        // "voting_account": "1.2.5",
                        // "num_witness": 0,
                        // "num_committee": 0,
                        "votes": [ ]
                    }
                }
              }],
              onlyGetFee
           },{root:true}); 
           return ca_res;

        })
}


export const account_signup_complete=({commit},{ wallet, userId })=>{
  commit(types.ACCOUNT_LOGIN_COMPLETE, { wallet, userId });
}

export const keyLogin=async (store,params)=>{
  if(!helper.trimParams(params)){
    return {code:101,message:"Parameter is missing"};
  }

  let {password="",wif}=params;
  if(!(/^5[HJK][1-9A-Za-z]{49}$/.test(wif))){
    return {code:109,message:"Please enter the correct private key"}
  }

  const { commit,dispatch,rootGetters } = store;

  if(rootGetters["WalletDb/wallet"]){
    await dispatch("WalletManagerStore/deleteWallet",null,{root:true});
  }

  let private_key = PrivateKey.fromWif(wif) //could throw and error
  const activePubkey = private_key.toPublicKey().toPublicKeyString();
  const userId = await API.Account.getAccountIdByOwnerPubkey(activePubkey);
  const id = userId && userId[0];
  if (id) {
    await dispatch("_logout");
    const wallet = createWallet({ password, wif });
    commit(types.ACCOUNT_LOGIN_COMPLETE, {wallet,userId:id });
    PersistentStorage.saveUserData({
      id,
      encrypted_key: wallet.encrypted_key,
      encryptionKey: wallet.encryptionKey,
      passwordPubkey: wallet.passwordPubkey,
      activePubkey
    });
 
    dispatch("PrivateKeyStore/setKeys",{
      import_account_names: [id],
      encrypted_key: wallet.encrypted_key,
      pubkey: activePubkey,
    },{root:true});
    dispatch('WalletDb/validatePassword',{ password,unlock:true},{root:true})

    await dispatch("user/fetchUser",id,{root:true});
    
    return  dispatch("getAccountInfo");
  }
  commit(types.ACCOUNT_LOGIN_ERROR, { error: 'Login error' });
  return {
    code: 110,
    message:'The private key has no account information'
  };
}

export const importPrivateKey=async ({rootGetters,state,dispatch},params)=>{
  if(!helper.trimParams(params)){
    return {code:101,message:"Parameter is missing"};
  }
  let {password="",privateKey}=params;

  let accounts=rootGetters["AccountStore/linkedAccounts"].toJS()
  if(accounts.length){
    let vp_res=await dispatch("WalletDb/validatePassword",{password,unlock:true},{root:true});
    if(vp_res.code!=1){
      return vp_res;
    }
  }

  if(!rootGetters["WalletDb/wallet"])
     await dispatch("account/_logout",null,{root:true});

  var private_key = PrivateKey.fromWif(privateKey) //could throw and error
  var private_plainhex = private_key.toBuffer().toString('hex');
  var public_key = private_key.toPublicKey() // S L O W
  var public_key_string = public_key.toPublicKeyString()
  state.imported_keys_public[public_key_string] = true;
  if(rootGetters["PrivateKeyStore/keys"][public_key_string]){
    return {code:160,message:"The private key has been imported into the wallet"}
  }
  const userId = await API.Account.getAccountIdByOwnerPubkey(public_key_string);
  const id = userId && userId[0];
  let acc_res,account_name="";
  if(id){
    acc_res=await dispatch("user/fetchUserForIsSave",{nameOrId:id,isSave:true},{root:true});

    if(acc_res.success){
      account_name=acc_res.data.account.name;
      await dispatch("AccountStore/setCurrentAccount",account_name,{root:true});
    }else{
      return acc_res;
    }
  }else{
    return {code:110,message:"The private key has no account information"};
  }

  state.keys_to_account[private_plainhex]={
    account_names:[account_name],public_key_string
  }
  if (rootGetters["WalletDb/wallet"]) {
    return dispatch("importWIFKey",{password,public_key_string});
  } else {
    // console.info('dispatch("WalletDb/createWallet",{password,isCreateAccount:false},{root:true})',dispatch("WalletDb/createWallet",{password,isCreateAccount:false},{root:true}));
    return dispatch("WalletDb/createWallet",{password,isCreateAccount:false},{root:true}).then(()=>{
          return dispatch("importWIFKey",{password,p_public_key_string:public_key_string});
      })
  }
}

export const importWIFKey=async ({rootGetters,state,dispatch},{password,p_public_key_string})=>{
  var keys =rootGetters["PrivateKeyStore/keys"];
  var dups = {};
  for (let public_key_string in state.imported_keys_public) {
      if (!keys[public_key_string]) continue
      delete state.imported_keys_public[public_key_string]
      dups[public_key_string] = true
  }
  if (Object.keys(state.imported_keys_public).length === 0) {
      return {code:149,message:"This wallet has already been imported"};
  }
  var keys_to_account = state.keys_to_account
  for (let private_plainhex of Object.keys(keys_to_account)) {
      var {account_names, public_key_string} = keys_to_account[private_plainhex]
      if (dups[public_key_string]) delete keys_to_account[private_plainhex]
  }

   return dispatch('WalletDb/validatePassword',{ password,unlock:true},{root:true}).then(res=>{
     if(res.code==1){
      return dispatch("saveImport");
     }else{
       return res;
     }
   })
}

export const saveImport=({state,dispatch,rootGetters})=>{
  var keys_to_account = state.keys_to_account
  var private_key_objs = []
  for (let private_plainhex of Object.keys(keys_to_account)) {
      var {account_names, public_key_string} = keys_to_account[private_plainhex]
      private_key_objs.push({
          private_plainhex,
          import_account_names: account_names,
          public_key_string
      })
  }
  // this.reset()
  dispatch("getInitialState")
  return dispatch("WalletDb/importKeysWorker",private_key_objs,{root:true}).then(result => {

      var import_count = private_key_objs.length;
      console.log(`Successfully imported ${import_count} keys.`)
      // this.onCancel() // back to claim balances.
      return dispatch("AccountRefsStore/checkPrivateKeyStore",null,{root:true}).then(()=>{
          return dispatch("AccountStore/onCreateAccount",{name_or_account:private_key_objs[0].import_account_names[0]},{root:true}).then(()=>{
              let names =rootGetters["AccountStore/linkedAccounts"].toArray().sort();
              return dispatch("getAccountInfo");   
          }); 
      });                 
  }).catch(error => {
      console.error("error:", error)
      var message = error
      try {
          message = error.target.error.message
      } catch (e) {
      }
      return {code:150,message:`Key import error: ${message}`,error}
  })
}

export const getInitialState=({state},keep_file_name = false)=>{
    state.keys_to_account={};
    state.no_file=true;
    state.account_keys=[];
    state.reset_file_name=keep_file_name ? this.state.reset_file_name : Date.now();
    state.reset_password=Date.now();
    state.password_checksum=null;
    state.import_file_message=null;
    state.import_password_message= null;
    state.imported_keys_public= {};
    state.key_text_message= null;
    state.validPassword=false;
    state.error_message=null;
    state.wif= "";
    state.encrypt_wif=false;
}

export const passwordLogin = async (store,params) => {
  if(!helper.trimParams(params)){
    return {code:101,message:"Parameter is missing"};
  }
  let  { account,password }=params;
 
  const { commit,rootGetters,dispatch } = store;  
  commit(types.ACCOUNT_LOGIN_REQUEST);

  
  let {privKey : ownerKey} =await dispatch("WalletDb/generateKeyFromPassword",{
    account, 
    role:"owner", 
    password
  },{root:true});

  let {privKey : activeKey} =await dispatch("WalletDb/generateKeyFromPassword",{
    account, 
    role:"active", 
    password
  },{root:true});
  const ownerPubkey = ownerKey.toPublicKey().toPublicKeyString();
  const userId = await API.Account.getAccountIdByOwnerPubkey(ownerPubkey);
  let id = userId && userId[0];
  if (id) {
    if(rootGetters["AccountStore/linkedAccounts"].size){
      await dispatch("WalletManagerStore/deleteWallet",null,{root:true});
    }else{
      await dispatch("_logout");
    }
  
    const vp_result=await dispatch("WalletDb/validatePassword",{
      password,
      unlock:true,
      account,
      roles:["active", "owner", "memo"]
    },{root:true})

    delete vp_result.cloudMode;
    delete vp_result.success;
    if(vp_result.code!=1){
      return vp_result;
    }

    id=userId[0];

    commit(types.ACCOUNT_LOGIN_COMPLETE, {userId: id});
    PersistentStorage.saveUserData({ id });

    return await dispatch("getAccountInfo")
  }else{
    commit(types.ACCOUNT_LOGIN_ERROR, { error: 'Login error' });
    return {
      code:108,
      //Please confirm that account is registered through account mode, accounts registered in wallet mode cannot login here.
      message: 'User name or password error (please confirm that your account is registered in account mode)'
    };
  }
};

export const upgradeAccount=({dispatch,getters},{onlyGetFee,feeAssetId})=>{
    return dispatch('transactions/_transactionOperations', {
            operations:[{
                op_type:7,
                type:"account_upgrade",
                params:{
                  account_to_upgrade:getters.getAccountUserId,
                  upgrade_to_lifetime_member:true,
                  fee_asset_id:feeAssetId
                }
            }],
            onlyGetFee
        },{root:true});
}

export const changePassword=async ({dispatch,rootGetters},params)=>{
  if(!helper.trimParams(params)){
    return {code:101,message:"Parameter is missing"};
  }

  let {account,oldPassword,newPassword,onlyGetFee=false}=params;

  let _passwordKey=rootGetters["WalletDb/_passwordKey"];
  let aes_private=rootGetters["WalletDb/aes_private"];
  let account_name=account.name;
  let validatePasswordParams={
    password:oldPassword,
    unlock:true,
    isChangePassword:true
  }
  if(_passwordKey){
     validatePasswordParams.account=account_name;
     validatePasswordParams.roles=["active", "owner", "memo"];
  }else if(aes_private){
    //The public key comparison cannot be derived directly from the account name and password.
    //Users may registered without password. 
    if(!rootGetters["PrivateKeyStore/getTcomb_byPubkey"](account.owner.key_auths[0][0])){
        return {code:112,message:"Must have owner permission to change the password, please confirm that you imported the ownerPrivateKey"};
    }
  }
  let vp_result=await dispatch("WalletDb/validatePassword",validatePasswordParams,{root:true})

  if(vp_result.code!=1){
    return {code:113,message:"Please enter the correct "+(_passwordKey?"original":"temporary")+" password"};
  }

  let {privKey : ownerKey} =await dispatch("WalletDb/generateKeyFromPassword",{
    account:account_name, 
    role:"owner", 
    password:newPassword
  },{root:true});

  let {privKey : activeKey} =await dispatch("WalletDb/generateKeyFromPassword",{
    account:account_name, 
    role:"active", 
    password:newPassword
  },{root:true});

  return  dispatch("transactions/_transactionOperations",{
              operations:[{
                type:"account_update",
                params:{
                  action:"changePassword",
                  activePubkey:activeKey.toPublicKey().toPublicKeyString(),
                  ownerPubkey:ownerKey.toPublicKey().toPublicKeyString()
                }
              }],
              onlyGetFee
          },{root:true})
}


export const logout = ({ commit }) => {
  commit(types.ACCOUNT_LOGOUT);
};

export const _logout=async ({commit,dispatch})=>{
  commit(types.ACCOUNT_LOGOUT);
  await dispatch("user/clearAccountCache",null,{root:true});
  await dispatch("WalletDb/clearKeys",null,{root:true});
  await dispatch("PrivateKeyStore/clearKeys",null,{root:true});

  PersistentStorage.clearUserData();
  return {code:1};
}

//cache of userId and privateKey login in account mode
export const checkCachedUserData =async ({ commit,dispatch,rootGetters }) => {
  const data = PersistentStorage.getSavedUserData();
  if (data) {
    //check RPC connection
    if(rootGetters["connection/isWsConnected"]){
      let cacheAccount=await dispatch("user/fetchUserForIsSave",{
        nameOrId:data.userId,
        isSave:true,
        activePubkey:data.activePubkey
      },{root:true});

      if(cacheAccount.code==1&&data.activePubkey&&cacheAccount.data.account.active.key_auths[0][0]==data.activePubkey){
        await dispatch("PrivateKeyStore/setKeys",{
          import_account_names: [data.userId],
          encrypted_key: data.encrypted_key,
          pubkey: data.activePubkey||"activePubkey"
        },{root:true}); 
        commit(types.ACCOUNT_LOGIN_COMPLETE, {
            userId: data.userId,
            wallet:{
              encrypted_key: data.encrypted_key,
              encryptionKey: data.encryptionKey,
              passwordPubkey: data.passwordPubkey
            }
        });
      }
    }
  }
};
/**
 * Checks username for existance
 * @param {string} username - name of user to fetch
 */
export const checkIfUsernameFree = async (state, { username }) => {
  const result = await API.Account.getUser(username);
  return !result.success;
};

export const _getPrivateKey=async ({dispatch},{account})=>{
    let result;
    let active = account.active;
    let owner = account.owner;
    // let activePublicKey = (active.key_auths && active.key_auths.length > 0) ? active.key_auths[0][0] : '';
    // let ownerPublicKey = (owner.key_auths && owner.key_auths.length > 0) ? owner.key_auths[0][0] : '';

    let activePrivateKeys=[];
    let ownerPrivateKeys=[];
    let activePrivateKey="";
    let ownerPrivateKey="";
    await Promise.all(active.key_auths.map(async item=>{
       activePrivateKey=await dispatch("WalletDb/getPrivateKey",item[0],{root:true});
       if(!!activePrivateKey) activePrivateKeys.push(activePrivateKey.toWif());
       return true;
    }))

    await Promise.all(owner.key_auths.map(async item=>{
        ownerPrivateKey=await dispatch("WalletDb/getPrivateKey",item[0],{root:true});
        if(ownerPrivateKey) ownerPrivateKeys.push(ownerPrivateKey.toWif());
        return true;
    }))
    
    if(activePrivateKeys.length||ownerPrivateKeys.length){
      return  {
        code:1,
        data:{
          active_private_keys:activePrivateKeys,
          owner_private_keys:ownerPrivateKeys
        }
      }
    }else{
      return {
        code:114,
        message:"Account is locked or not logged in"
      }
    }
}


export const accountOpt=async ({ commit, rootGetters,dispatch },{method,params})=>{
    helper.trimParams(params);

    let account=rootGetters["user/getAccountObject"];
    if(!account){
        let userId=rootGetters["account/getAccountUserId"];
        if(userId){
          let user_result=await dispatch("user/fetchUser",userId,{root:true})
          if(user_result.success)
           account=user_result.data.account;
        }
    }
    if(account){
       params.account=account;
       dispatch(method,params,{root:true});
    }else{
       params.callback&&params.callback({code:-11,message:"Please login first"})
    }
}

//accountOpt will check login status and trim params
export const _accountOpt=async ({ commit, rootGetters,dispatch },{method,params={}})=>{

  helper.trimParams(params);
  // params.crontab=params.crontab||null;
  // dispatch("crontab/setCrontab",params.crontab,{root:true});
  
  let account=rootGetters["user/getAccountObject"];
  if(!account){
      let userId=rootGetters["account/getAccountUserId"];
      if(userId){
        let user_result=await dispatch("user/fetchUser",userId,{root:true})
        if(user_result.success)
         account=user_result.data.account;
      }
  }

  if(account){
    if(!params.account) params.account=account;
     return dispatch(method,params,{root:true});
  }else{
     return {code:-11,message:"Please login first"};
  }
}

//_validateAccount will check the incoming parameters of account to determine whether the account exists.
export const _validateAccount=async ({dispatch},{method,params,account,accountFieldName="account_id"})=>{
  helper.trimParams(params);
  if(!account){
    if(accountFieldName=="to_account_id")
       return {code:133,message:"Parameter 'toAccount' can not be empty"};

    return {code:101,message:"Parameter is missing"}
  }else{
    let acc_res=await dispatch("user/getUserInfo",{account,isCache:true},{root:true});
    if(acc_res.code!=1) return acc_res;
    params[accountFieldName]=acc_res.data.account.id;
  }

  return dispatch(method,params,{root:true})
}

export const fetchCurrentUser = async (store) => {
  const { commit, getters } = store;
  const userId = getters.getAccountUserId;
  if (!userId) return;
  commit(types.FETCH_CURRENT_USER_REQUEST);
  const result = await API.Account.getUser(userId);
  if (result.success) {
    const user = result.data;
    result.data.balances = balancesToObject(user.balances);
    commit(types.FETCH_CURRENT_USER_COMPLETE, { data: user });
  } else {
    commit(types.FETCH_CURRENT_USER_ERROR);
  }
};


export const setAccountUserId=({commit},userId)=>{
  commit(types.ACCOUNT_LOGIN_COMPLETE, {userId});
}

export const queryVestingBalance=async ({dispatch,rootGetters},{account_id,type,vid,isLimit=false})=>{
  let vbs = await API.Account.getVestingBalances(account_id);
  let cvbAsset,
      vestingPeriod,
      earned,
      old_earned,
      new_earned,
      total_earned,
      past_sconds,
      coin_seconds_earned_last_update,
      secondsPerDay = 60 * 60 * 24,
      availablePercent;
  let new_vbs=[];

  for(let i=0;i<vbs.length;i++){
    let {id,balance,policy,describe}=vbs[i];
    cvbAsset=await dispatch("assets/fetchAssets",{assets:[balance.asset_id],isOne:true},{root:true});
    coin_seconds_earned_last_update=policy[1].coin_seconds_earned_last_update;
    vestingPeriod = policy[1].vesting_seconds;
    past_sconds=Math.floor((new Date()-new Date(coin_seconds_earned_last_update+"Z"))/1000);
    if(past_sconds>vestingPeriod) past_sconds=vestingPeriod;
   
    if(/^1\.6\.\d+/.test(describe)){
      describe="cashback_block"
    }
    if(vid&&vid!=id){
      continue
    }
    if(type&&type!=describe){
        continue
    }

    total_earned=vestingPeriod*balance.amount;
    new_earned=(past_sconds / vestingPeriod)*(total_earned);
    old_earned=Number(policy[1].coin_seconds_earned);

    earned=old_earned+new_earned;
    if(earned>=total_earned) earned=total_earned;

    availablePercent = (vestingPeriod === 0) ? 1 : earned / (vestingPeriod * balance.amount);

    let remaining_hours=utils.format_number(
          vestingPeriod *
              (1 - availablePercent) /
              3600 || 0,
          2
      )

      let require_coindays=utils.format_number(utils.get_asset_amount(
        balance.amount *
            vestingPeriod /
            secondsPerDay,
        cvbAsset
      ),0)
      earned=utils.format_number(utils.get_asset_amount(
                      earned / secondsPerDay,
                      cvbAsset
                  ),0);   
  
      let precision_value=Math.pow(10,cvbAsset.precision);
      let available_balance_amount= utils.format_number((availablePercent*balance.amount)/precision_value,cvbAsset.precision);    
      if(describe=="cashback_block"){
        available_balance_amount=Math.floor(available_balance_amount);
      }else{
        available_balance_amount=(Math.floor(available_balance_amount*1000))/1000;
      }           
     
      if(isLimit){
        let min_interval=10;
        // if(describe=="cashback_block") min_interval=5;
        if(Number(old_earned)>0&&past_sconds<min_interval&&describe!="cashback_block"){
          return {code:181,message:`Please try again in ${min_interval-past_sconds} seconds`};
        }
        // if(available_balance_amount<0.01){
        //   return {code:182,message:`draw quantity is less than 0.01`};
        // }
      }
      
      new_vbs.push({
        id,
        type:describe,
        return_cash:balance.amount/precision_value,
        remaining_hours,
        available_percent:utils.format_number(availablePercent * 100,2),
        available_balance:{
          amount: available_balance_amount,
          asset_id:cvbAsset.id,
          symbol:cvbAsset.symbol,
          precision:cvbAsset.precision
        }
      })
  }

  let res={code:1,data:new_vbs}
  if(!new_vbs){
    res={code:127,message:"No reward available"}
  }
  return res;
}

export const claimVestingBalance=async ({dispatch},{id,account,amount})=>{
   if(!id||!amount){
     return {code:101,message:"Parameter is missing"};
   }
   id=id.trim();
   if(isNaN(Number(amount))){
    return {code:135,message:"Please check parameter data type"};
   }
   let res=await dispatch("_validateAccount",{
              method:"account/queryVestingBalance",
              params:{ type:'',vid:id,isLimit:true },
              account:account.id
            })

    if(res.code!=1) return res;
    let rewards=res.data.filter(item=>item.id==id);
    if(rewards.length){
      let {precision,asset_id}=rewards[0].available_balance;
      let max_amount=rewards[0].available_balance.amount;
      if(amount>max_amount){
        return {code:183,message:`Up to ${max_amount}`}
      }
      amount=Math.floor(amount*Math.pow(10,precision));
      
      return  dispatch('transactions/_transactionOperations', {
            operations:[{
                op_type:27,
                type:"vesting_balance_withdraw",
                params:{
                  vesting_balance:id,
                  amount:{
                    amount,
                    asset_id
                  }
                }
            }]
       },{root:true}); 
    }else{
        return {code:127,message:"No reward available"}
    }
}


const balancesToObject = (balancesArr) => {
  const obj = {};
  balancesArr.forEach(item => {
    obj[item.asset_type] = item;
  });
  return obj;
};


export const getAccountInfo=({rootGetters})=>{
  let accountObject=rootGetters["user/getAccountObject"];
  let res={
    account_id:rootGetters["account/getAccountUserId"]||"",
    locked:rootGetters["WalletDb/isLocked"]
  } 
  res.account_name=accountObject?accountObject.name:"";
  res.mode=rootGetters["WalletDb/wallet"]?"wallet":"account";
  return {
    code:1,
    data:res
  };
}
