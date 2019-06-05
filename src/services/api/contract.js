import { Apis } from 'bcxjs-ws';

let contract_cache={};
export const getContract= async (nameOrId,isCache=false) => {
    if(isCache&&contract_cache[nameOrId]){
        return JSON.parse(JSON.stringify(contract_cache[nameOrId]));
    }
    try {
      const response = await Apis.instance().db_api().exec('get_contract', [nameOrId]);
    
      if (response) {
        if(response.current_version=="0000000000000000000000000000000000000000000000000000000000000000"){
          let chainInfo=await Apis.instance().db_api().exec('get_objects',[["2.11.0"]]);
          response.lua_code=chainInfo[0].base_contract;
        }else{
          response.lua_code= (await Apis.instance().db_api().exec('get_transaction_by_id', [response.current_version])).operations[0][1].data
        }

        let result={
          code: 1,
          data: response
        };
        if(isCache){
          contract_cache[nameOrId]=result;
        }
        return JSON.parse(JSON.stringify(result));
      }
      return {
        code: 145,
        message:nameOrId+' contract not found'
      };
    } catch (error) {
      // console.log(error);
      let message=error.message;
      if(error.message.indexOf("does not exist")>=0){
        message=`The contract (${nameOrId}) does not exist`;
      }
      return {
        code: 145,
        message,
        error
      };
    }
  };
  
  export const getAccountContractData= async (accountId,contractId) => {
    try {
      const response = await Apis.instance().db_api().exec('get_account_contract_data', [accountId,contractId]);
      if (response) {
        return {
          code: 1,
          data: response
        };
      }
      return {
        code: 146,
        message:"The account does not contain information about the contract"
      };
    } catch (error) {
      // console.log(error);
      return {
        code: 0,
        message:error.message,
        error
      };
    }
  };

  export default {
    getContract,
    getAccountContractData
  };