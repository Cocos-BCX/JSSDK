import API from '../services/api';
import { ChainTypes } from 'bcxjs-cores';
import helper from "../lib/common/helper";

const initialState = {
    contract_cache:{

    }
};

const _lua_types={
    0:"init",
    1:"number",
    2:"string",
    3:"boolean",
    4:"table",
    5:"function",
    6:"memo_data",
    7:"asset"
}


const toTable=obj=>{
    var result = [];
    for(let key in obj){
        let keyObj={},
            valueObj={},
            v= obj[key];

            keyObj.dataType=typeof key;
            keyObj.value=key;
            if(key%1 === 0)
                keyObj.dataType="int";

            valueObj.dataType=typeof v;
            if(valueObj.dataType=="object"){
                valueObj.dataType="table";
                valueObj.value=toTable(v);
            }else{
                valueObj.value=v;
            }

            if(v!=""&&v%1 === 0)
                valueObj.dataType="int";

            result.push([{key:keyObj},valueObj]);
    }

    return result;
}

const formatValueList=valueList=>{
    let _valueList=[],valueItem,v,dataType="";
    for(let i=0;i<valueList.length;i++){
        try{
            v=valueList[i];
            dataType=typeof v;
           
            if(dataType=="number"&&v%1 === 0){
                dataType="int";
            }
            
            if(dataType=="object"){
                dataType="table"//JSON.stringify(v);
                v=toTable(v);
                // console.info("v",v);
            }
            
            valueItem={
                value:v,
                dataType
            }

            _valueList.push(valueItem);
        }catch(e){
            return {code:0,message:e.message};
        }
    }

    return _valueList;
}

const formatTableWithStructs=(table)=>{
    var result = [];
    table.forEach(item=>{
        let key=item[0].key[1].v;
        let key_type=_lua_types[item[0].key[0]];
        let value=item[1][1].v;
        let lua_type=item[1][0];
        // console.info("ChainTypes.lua_type",ChainTypes.lua_type);
        let obj={key_type,key,value_type:_lua_types[lua_type]}
        switch(lua_type){
            case 4:
              obj.value=formatTableWithStructs(value);
            //   result[key].value=formatTableWithStructs(value);
              break;
            case 0: 
            case 1:obj.value=Number(value);
                break;
            default:obj.value=value;    
        }
        result.push(obj);
    })
    return result;
}

const actions={
    queryAccountContractData:({dispatch},params)=>{
        helper.trimParams(params);

        let {account,contractNameOrId,callback}=params;
        let p_getUserInfo=dispatch("user/getUserInfo",{account,isCache:true},{root:true});
        let p_getContract=dispatch("getContract",{nameOrId:contractNameOrId,isCache:true});
 
        let res;
        return Promise.all([p_getUserInfo,p_getContract]).then(results=>{
           let paramsOk=results.every(item=>{
                 if(item.code!=1){
                   res=item;
                 }
                 return item.code==1
               })
             if(paramsOk){
               return dispatch("getAccountContractData",{
                 account:results[0].data.account.id,
                 contractNameOrId:results[1].data.id
               })
             }else{
               return res;
             }
        })
    },
    createContract:({dispatch},params)=>{
        if(!helper.trimParams(params,{authority:""})){
            return {code:101,message:"Parameter is missing"};
        }
        let {name,data,authority,onlyGetFee}=params;
        if(!(/^[a-z]([a-z0-9\.-]){4,63}/.test(name))){
          return {code:130,message:"Please enter the correct contract name(/^[a-z]([a-z0-9\.-]){4,63}/)"};
        }
        return dispatch('transactions/_transactionOperations', {
            operations:[{
              type:"contract_create",
              params:{
                name,
                data,
                authority
              }
            }],
            onlyGetFee
         },{root:true});
    },
    updateContract:async ({dispatch},params)=>{
        if(!helper.trimParams(params)){
            return {code:101,message:"Parameter is missing"};
        }
        let {nameOrId,data,onlyGetFee}=params;

        let contract_res=await dispatch("getContract",{nameOrId:nameOrId});
        if(contract_res.code!=1){
            return contract_res;
        }

        return dispatch('transactions/_transactionOperations', {
            operations:[{
              type:"revise_contract",
              params:{
                contract_id:contract_res.data.id,
                data
              }
            }],
            onlyGetFee
         },{root:true});
    },
    getContract:async ({dispatch,state},{nameOrId="",isCache=false}) => {
        if(!nameOrId){
            return {code:0,message:'Parameter "nameOrId" can not be empty'}
        }
        nameOrId=nameOrId.trim();
           
        let res=await API.Contract.getContract(nameOrId,isCache);
        if(res.code!=1){
            return res;
        }
        let {name,owner,contract_ABI,contract_data,check_contract_authority,
            creation_date,id,contract_authority,previous_version,lua_code,current_version}=res.data;

        let acc_res=await dispatch("user/getUserInfo",{account:owner,isCache:true},{root:true});
        if(acc_res.code!=1){
            return acc_res;
        }
       
        let abi_actions=[];
        contract_ABI.forEach(item => {
            abi_actions.push({
                name:item[0].key[1].v,
                arglist:item[1][1].arglist
            })
        });

        let data={
            check_contract_authority:check_contract_authority,
            abi_actions,
            contract_authority,
            contract_data:helper.formatTable(contract_data),
            contract_data_type:formatTableWithStructs(contract_data),
            create_date:new Date(creation_date+"Z").format("yyyy/MM/dd HH:mm:ss"),
            current_version,
            id,
            lua_code,
            contract_name:name,
            owner_account_name:acc_res.data.account.name
        }

        res.data=data;
        return res;
    },
    getAccountContractData:async ({dispatch},{account,contractNameOrId}) => {
        let get_c_res=await API.Contract.getContract(contractNameOrId);
        if(get_c_res.code!=1){
            return get_c_res;
        }

        let res=await API.Contract.getAccountContractData(account,contractNameOrId);

        if(res.code!=1){
            return res;
        }
        let {contract_data,owner}=res.data;
      
        res.data.contract_data=helper.formatTable(contract_data);
        res.data.contract_data_type=formatTableWithStructs(contract_data);

        res.data.contract_name=get_c_res.data.name;

        let acc_res=await dispatch("user/getUserInfo",{account:owner,isCache:true},{root:true});
        if(acc_res.code!=1){
            return acc_res;
        }
        res.data.owner_account_name=acc_res.data.account.name;
        return res;
    },
    callContractFunction:async ({dispatch},params)=>{
        if(!helper.trimParams(params)){
            return {code:101,message:"Parameter is missing"};
        }
        let {nameOrId,functionName,valueList,onlyGetFee}=params;

        if(!(Array.isArray(valueList))){
            return {code:135,message:"Please check parameter data type"};
        }

        if(!(/1\.\d+\.\d+\./.test(nameOrId))){
          let contract_res=await dispatch("getContract",{nameOrId:nameOrId});
          if(contract_res.code==1){
                nameOrId=contract_res.data.id;
                let _valueList=formatValueList(valueList);
                if("code" in _valueList){
                    return _valueList;
                }
                // console.info("_valueList",_valueList);
                //nameOrId=>Contract name or ID  valueList=>contract functions' parameter lists
                return dispatch('transactions/_transactionOperations', {
                  operations:[{
                    type:"call_contract_function",
                    params:{
                      contractId:nameOrId,
                      functionName,
                      valueList:_valueList
                    }
                  }],
                  onlyGetFee
                },{root:true});
          }else{
           return contract_res;
          }
        }  
    },
    parseContractAffecteds:({dispatch},contract_affecteds)=>{
        
    }
}

export default {
  state: initialState,
  actions,
  //getters,
  namespaced: true
};
