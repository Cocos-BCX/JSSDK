import API from '../services/api';
import helper from '../lib/common/helper';
import pu from '../lib/common/permission_utils';
import utils from '../lib/common/utils';

import Immutable from "immutable";

const initialState = {

};


const actions={
    loadAccountProposals:async (store,{account_id})=>{      
        let {rootGetters,dispatch}=store;
        try{
            let userId=account_id||rootGetters["account/getAccountUserId"];
            if(!userId){
                return {code:170,message:"Missing parameter account or login first"}; 
            }
            let acc_res=await dispatch("user/getUserInfo",{account:userId},{root:true});    
            let proposals=[];
            let acc_proposals=acc_res.data.proposals;

            let acc_proposal;
            for(let i=0;i<acc_proposals.length;i++){
                acc_proposal= acc_proposals[i];
                let operation = acc_proposal.proposed_transaction.operations[0];
                let {id,expiration_time,required_active_approvals}=acc_proposal;

                let permissions_type = required_active_approvals.length ? "active" : "owner";
                let required = acc_proposal[`required_${permissions_type}_approvals`];
                let available = acc_proposal[`available_${permissions_type}_approvals`];
                let availableKeys = acc_proposal["available_key_approvals"];

                    required = pu.listToIDs(required);
                let requiredPermissions=await pu.unnest(Immutable.fromJS(required), permissions_type);
                let status=[]
                let pushStatusItem=(permission,threshold)=>{
                    // permission.threshold=requiredPermissions.threshold;
                    let {id,account_name,weight}=permission;
                    let isNested = permission.isNested();
                    let isMultiSig = permission.isMultiSig();

                    let notNestedWeight = (threshold && threshold > 10) ?
                    utils.get_percentage(permission.weight, threshold) :
                    permission.weight;

                    let nestedWeight = (permission && permission.threshold > 10) ?
                    `${utils.get_percentage(permission.getStatus(available, availableKeys), permission.threshold)}` :
                    `${permission.getStatus(available, availableKeys)} / ${permission.threshold}`;

                    if(weight)
                    status.push({
                        id,
                        account_name,
                        weight,
                        weight_percentage:!isNested && notNestedWeight?notNestedWeight:nestedWeight,//permission.weight/requiredPermissions[0].threshold,
                        isAgree:permission.isAvailable(available)
                    });

                    if (isNested || isMultiSig) {
                        permission.accounts.forEach(subAccount => {
                            pushStatusItem(subAccount,permission.threshold*2)
                        })
                    }                   
                }
               requiredPermissions.forEach(permission=>{
                    pushStatusItem(permission);
                });

                let {
                    parse_operations,
                    parse_operations_text,
                    raw_data,
                    type,
                    type_name
                } = (await API.Operations.parseOperations({
                                operations: [{op:operation}],
                                userId,
                                store
                            })
                   ).operations[0];
                proposals.push({
                    id,
                    expiration:new Date(expiration_time+"Z").format("yyyy/MM/dd HH:mm:ss"),
                    parse_operations,
                    parse_operations_text,
                    raw_data,
                    type,
                    type_name,
                    status
                })
            }
            let time;
            proposals=proposals.sort((a,b)=>{
                return Number(b.id.split(".")[2])-Number(a.id.split(".")[2]);
            })
            return {code:1,data:proposals};
        }catch(error){
            return {code:0,message:error.message,error};
        }     
    },
    submitProposal:async ({dispatch,rootGetters},{proposalId,onlyGetFee=false})=>{
        let account_id=rootGetters["account/getAccountUserId"];
        let proposal = {
            fee_paying_account:account_id,
            proposal: proposalId,
            active_approvals_to_add: [account_id],
            active_approvals_to_remove: [],
            owner_approvals_to_add: [],
            owner_approvals_to_remove: [],
            key_approvals_to_add: [],
            key_approvals_to_remove: []
        };

        return dispatch('transactions/_transactionOperations', {
            operations:[{
                op_type:22,
                type:"proposal_update",
                params:proposal
            }],
            onlyGetFee
        },{root:true}); 
    }
}


const mutations = {
};


export default {
  state: initialState,
  actions,
  //getters,
  mutations,
  namespaced: true
};
