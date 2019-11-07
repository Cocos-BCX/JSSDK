import { key } from 'bcxjs-cores';
import { Apis } from 'bcxjs-ws';
// import  fetch  from 'node-fetch';
// var fetch = require('node-fetch');
export const suggestBrainkey = (dictionary) => {
  return key.suggest_brain_key(dictionary);
};

let _accs={};
export const clear_accs=()=>{
  _accs={};
}

export const getAccount = async (id,isCache=false) => {
  if(isCache){
    if(id in _accs){
        if(_accs[id]){
          return {code:1,data:_accs[id],success:true}
        }
        // else{
        //   return {code:0,success:false};
        // }
    }
  }
  _accs[id]="";
  try {
    const response = await Apis.instance().db_api().exec('get_objects', [[id]]);
    if (response && response[0]) {
      const user ={
        account: response[0]
      };


      if(isCache){
        _accs[response[0].id]=user;
        _accs[response[0].name]=user;
      }
      return {
        code:1,
        data:user,
        success:true
     };;
    }
    return {
      code:104,
      message:nameOrId+' Account not found',
      error:{message: nameOrId+' Account not found'},
      success: false
    };
  } catch (error) {
    // console.log(error);
    return {
      code:0,
      message:error.message,
      error,
      success: false
    };
  }
};


export const getUser = async (nameOrId,isCache=false,isSubscribe=false) => {
  // console.info('isCache',isCache,isCache&&nameOrId in _accs,nameOrId,JSON.parse(JSON.stringify(_accs)))
  if(isCache&&_accs[nameOrId]){
    return {code:1,data: _accs[nameOrId],success: true}
  }
  if(!Apis.instance().db_api()){
    return {
      success: false,
      code:102,
      message:"The network is busy, please check your network connection",
      error:{
        message:"The network is busy, please check your network connection"
      }
    };
  }
  try {
    const response = await Apis.instance().db_api().exec('get_full_accounts', [[nameOrId], isSubscribe]);
    if (response && response[0]) {
      const user = response[0][1];

      if(isCache){
        _accs[user.account.id]=user;
        _accs[user.account.name]=user;
      }

      return {
        code:1,
        data: user,
        success: true
      };
    }
    return {
      code:104,
      message:nameOrId+' Account not found',
      error:{message: nameOrId+' Account not found'},
      success: false
    };
  } catch (error) {
    // console.log(error);
    return {
      code:0,
      message:error.message,
      error,
      success: false
    };
  }
};

export const getAccountIdByOwnerPubkey = async ownerPubkey => {
  const res = await Apis.instance().db_api().exec('get_key_references', [[ownerPubkey]]);
  return res ? res[0] : null;
};

export const getAccountRefsOfAccount = async account_id => {
  const res = await Apis.instance().db_api().exec('get_account_references', [account_id]);
  return res;
};

export const createAccount = async ({ name, ownerPubkey, activePubkey, referrer },faucetUrl) => {
  try {
    const response = await fetch(faucetUrl + '/api/v1/accounts', {
      method: 'post',
      mode: 'cors',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
        Authorization:"YnVmZW5nQDIwMThidWZlbmc="
        // Origin:"United Labs of BCTech."
        //'Content-type': 'application/x-www-form-urlencoded'
      },
      body: JSON.stringify({
        account: {
          name,
          owner_key:ownerPubkey,
          active_key: activePubkey,
          memo_key: activePubkey,
          refcode: null,
          referrer
        }
      })
    });
    const result = await response.json();
    if(result&&"code" in result){
        let {code,data,msg}=result;
        let res={
            success:code==200,
            data,
            msg
        }
        if(code!=200){
          res.error=msg;
        }
        return res;
    }
    if (!result || (result && result.error)) {
      let error=result.error;
      if("base" in error){
        error=error.base[0]
      }else if("name" in error){
        error=error.name[0];
      }else if("remote_ip" in error){
        error=error.remote_ip[0];
      }
      return {
        success: false,
        error: error
      };
    }
    return {
      success: true,
      data:result,
      code:1
    };
  } catch (error) {
    return {
      success: false,
      error:error.message, //'Account creation error'
      error_obj:error
    };
  }
};

export const getVestingBalances = async account_id => {
  const res = await Apis.instance().db_api().exec('get_vesting_balances', [account_id]);
  return res ? res : null;
};

export default {
  suggestBrainkey,getAccount, getUser, getAccountIdByOwnerPubkey,
  getAccountRefsOfAccount,createAccount,getVestingBalances,clear_accs
};
