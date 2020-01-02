import { ChainTypes,ChainStore } from 'bcxjs-cores';

import { Apis } from 'bcxjs-ws';
import API from '../api';

import zh_CN from '../../assets/lang/zh.js';
import en_US from '../../assets/lang/en.js';

import utils from "../../lib/common/utils";
import helper from "../../lib/common/helper";
import market_utils from "../../lib/common/market_utils";

const _locales={
    en:en_US,
    zh:zh_CN
}

let _store;
let _cacheBlocks={

}
let reqBlockOK=true;
// Service for dealing with operations (transactions)
const Operations = {
  _operationTypes: {
    300:"contract_affecteds_asset",
    3010:"contract_affecteds_nh_transfer_from",
    3011:"contract_affecteds_nh_transfer_to",
    3012:"contract_affecteds_nh_modifined",
    303:"contract_affecteds_log"
  },
  
  results:["error_result", "void_result", "object_id_result", "asset_result", "contract_result", "logger_result"],
  // Prepares object with code : operation's name format
  prepareOperationTypes: () => {
    Object.keys(ChainTypes.operations).forEach(name => {
      const code = ChainTypes.operations[name];
      Operations._operationTypes[code] = name;
    });
  },

  // Gets operation's data based on it's block number
  _getOperationDate: (operation, ApiObject, ApiObjectDyn) => {
    const blockInterval = ApiObject[0].parameters.block_interval;
    const headBlock = ApiObjectDyn[0].head_block_number;
    const headBlockTime = new Date(ApiObjectDyn[0].time + 'Z');
    const secondsBelow = (headBlock - operation.block_num) * blockInterval;
    const date = new Date(headBlockTime - (secondsBelow * 1000)).format("yyyy/MM/dd HH:mm:ss");
    return date;
  },

  // Used for place order and fill order operations. Determines if user is a seller or buyer
  _checkIfBidOperation: async (operation) => {
    const ApiInstance = Apis.instance();
    const blockNum = operation.block_num;
    const trxInBlock = operation.trx_in_block;
    const transaction = await ApiInstance.db_api().exec('get_transaction', [blockNum, trxInBlock]);

    const amountAssetId = transaction.operations[0][1].amount_to_sell.asset_id;
    const feeAssetId = transaction.operations[0][1].fee.asset_id;
    return amountAssetId === feeAssetId;
  },

  // User for transfer operations. Determines if user received or sent
  _getOperationOtherUserName: async (userId, payload) => {
    const otherUserId = payload.to === userId ? payload.from : payload.to;
    const userRequest = await API.Account.getAccount(otherUserId,true);
    return userRequest.success ? userRequest.data.account.name : '';
  },

  // Parses operation for improved format
  _parseOperation: async (operation, userId, ApiObject, ApiObjectDyn) => {
    const [type, payload] = operation.op;
    const operationType = Operations._operationTypes[type];
    let date = Operations._getOperationDate(operation, ApiObject, ApiObjectDyn);
    let block_res=await API.Operations.get_block_header(operation.block_num);
    if(block_res.code==1){
      date=new Date(block_res.data.timestamp+"Z").format("yyyy/MM/dd HH:mm:ss");
    }
    let isBid = false;
    let otherUserName = null;
    let res={
      block_num:operation.block_num,
      type: operationType,
      payload,
      date
    }
    let op_id=operation.id
    if(op_id){
      res.id=op_id;
    }
    // if (operationType === 'fill_order' || operationType === 'limit_order_create') {
    //   isBid = await Operations._checkIfBidOperation(operation);
    //   res.buyer=isBid;
    // }

    if (operationType === 'transfer'&&userId) {
      otherUserName = await Operations._getOperationOtherUserName(userId, payload);
      res.other_user_name=otherUserName;
    }
    if(operation.result){
      res.result=operation.result[1];
      res.result.type=_store.rootGetters["setting/trx_results"][operation.result[0]];
      if(operationType=="create_nh_asset"){
        res.payload.item_id=operation.result[1].result;
      }
      if(operationType=="create_world_view"){
        res.payload.version_id=operation.result[1];
      }
      if(operationType=="call_contract_function"){
        let _operations=operation.result[1].contract_affecteds.map(item=>{
              let op_num=item[0]+300;
              if(item[0]==1){
                op_num=op_num+""+item[1].action
              }
              return {
                block_num:operation.block_num,
                id:operation.id,
                op:[Number(op_num),item[1]]
              }
        });
        res.result.contract_affecteds=await Operations.parseOperations({
          operations:_operations,
          userId:_store.rootGetters["account/getAccountUserId"],
          store:_store,
          isContract:true
        });
        let additional_cost=res.result.additional_cost
        if(additional_cost){
          let {amount,asset_id}=additional_cost;
          res.result.additional_cost_text=await Operations.FormattedAsset(amount,asset_id,0);
        }
      }
    }
    return res
  },

  // Parses array of operations, return array of parsed operations and array of assets ids
  // that were user in it. United Labs of BCTech.
  parseOperations: async ({ operations, userId=null,store,isContract=false }) => {
    _store=store;
    const ApiInstance = Apis.instance();
    const ApiObject =[(await API.Explorer.getGlobalObject(true)).data];
    const ApiObjectDyn =[(await API.Explorer.getDynGlobalObject(false)).data];
    // console.info('operations',JSON.parse(JSON.stringify(operations)));
    const operationTypes = [0, 1, 2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,23,24,26,27,30,31,34,35,37,38,39,40,41,42,43,44,45,50,54,300,301,303,3010,3011,3012];//,53,54.55,56,57,58
    const filteredOperations = operations.filter(op => {
      return operationTypes.includes(op.op[0])
    });
    let parsedOperations=[];
    for(let j=0;j<filteredOperations.length;j++){
      parsedOperations.push(await Operations._parseOperation(filteredOperations[j], userId, ApiObject, ApiObjectDyn));
    }
    const assetsIds = Operations._getOperationsAssetsIds(parsedOperations);

    let item;
    for(let i=0;i<parsedOperations.length;i++){
      item=parsedOperations[i];

      if(isContract){
        delete item.id;
        delete item.date; 
      }
      let parseOpObj=await Operations.getParseOperations(item);
      item.parseOperationsText=parseOpObj.opText.join("");
      item.parseOperations=parseOpObj.opObj;
      item.parseOperations.fees=[];
      if(item.result){
        let fees=item.result.fees;
        if(fees){
          for(let i=0;i<fees.length;i++){
            let feeObj=fees[i];
            let feeAsset=await API.Assets.fetch([feeObj.asset_id],true);
            if(feeAsset)
              item.parseOperations.fees.push(helper.getFullNum(feeObj.amount/Math.pow(10,feeAsset.precision))+" "+feeAsset.symbol)
          }
        }
      }
      
      // let feeObj=item.payload.fee;
      // if(feeObj){
      //   let feeAsset=await API.Assets.fetch([feeObj.asset_id],true);
      //   if(feeAsset)
      //   item.parseOperations.fee=helper.getFullNum(feeObj.amount/Math.pow(10,feeAsset.precision))+" "+feeAsset.symbol;
      // }

      let trxType="trxTypes_"+item.type;
      if(trxType in  zh_CN){
        item.typeName= _locales[_store.rootGetters["setting/defaultSettings"].locale][trxType];
      }
    }
    if(isContract){
      delete parsedOperations.id;
      delete parsedOperations.date;
      return parsedOperations.map(item=>{
        item.parse_operations=item.parseOperations;
        item.parse_operations_text=item.parseOperationsText;
        item.raw_data=item.payload;
        item.type_name=item.typeName;

        delete item.parseOperations;
        delete item.parseOperationsText;
        delete item.payload;
        delete item.typeName;
        return item;
     });

      // return {
      //   contract_affecteds: parsedOperations
      // };
    }
    return {
      operations: parsedOperations.map(item=>{
          item.parse_operations=item.parseOperations;
          item.parse_operations_text=item.parseOperationsText;
          item.raw_data=item.payload;
          item.type_name=item.typeName;

          delete item.parseOperations;
          delete item.parseOperationsText;
          delete item.payload;
          delete item.typeName;
          return item;
      }),
      assetsIds
    };
  },

  getParseOperations:async (op)=>{
    let o;
    switch(op.type){
      case "transfer":
        return await Operations.getTranslateInfo(
                "operation_transfer",
                [
                    {type: "account", value: op.payload.from, arg: "from"},
                    {
                        type: "amount",
                        value: op.payload.amount,
                        arg: "amount",
                        decimalOffset: op.payload.amount.asset_id === "1.3.0" ? 0 : null
                    },
                    {type: "account", value: op.payload.to, arg: "to"}
                ]
            )
            break;
      case "account_create":
            return await Operations.getTranslateInfo(
                "operation_reg_account",
                [
                    {type: "account", value: op.payload.registrar, arg: "registrar"},
                    {type: "account", value: op.payload.name, arg: "new_account"}
                ]
            );
            break;
      case "account_update":
            return await Operations.getTranslateInfo(
                "operation_update_account",
                [{type: "account", value: op.payload.account, arg: "account"}]
            );
            break;
      case "account_upgrade":
            return await Operations.getTranslateInfo(
                op.payload.upgrade_to_lifetime_member ? "operation_lifetime_upgrade_account" : "operation_annual_upgrade_account",
                [{type: "account", value: op.payload.account_to_upgrade, arg: "account"}]
            );
            break;
      case "witness_create":
            return await Operations.getTranslateInfo(
                "operation_witness_create",
                [{type: "account", value: op.payload.witness_account, arg: "account"}]
            );
            break;
      case "committee_member_create":
            return await Operations.getTranslateInfo(
                "operation_committee_member_create",
                [{type: "account", value: op.payload.committee_member_account, arg: "account"}]
            );
            break;
      case "witness_update":
            return await Operations.getTranslateInfo(
                "operation_witness_update",
                [{type: "account", value: op.payload.witness_account, arg: "account"}]
            );
            break;
      case "committee_member_update":
            return await Operations.getTranslateInfo(
                "operation_committee_member_update",
                [{type: "account", value: op.payload.committee_member_account, arg: "account"}]
            );
            break;
      case "fill_order":
         o=op.payload;
        // let receivedAmount = o.fee.asset_id === o.receives.asset_id ? o.receives.amount - o.fee.amount : o.receives.amount;
          let base2=o.receives.asset_id;
          let quote2=o.pays.asset_id;
          const {
            first2,
            second2
          } = market_utils.getMarketName(base2, quote2);
          const isBid2 =o.pays.asset_id === second2;

          let priceBase = isBid2 ? o.receives : o.pays;
          let priceQuote = isBid2 ? o.pays : o.receives;
          let amount = isBid2 ? o.pays :  o.receives;
          let receivedAmount =amount.amount;
          // o.fee.asset_id === amount.asset_id
          //     ? amount.amount - o.fee.amount
          //     : amount.amount;
          return await Operations.getTranslateInfo(
          "operation_fill_order",
          [
              {type: "account", value: o.account_id, arg: "account"},
              {
                  type: "amount",
                  value: {amount: receivedAmount, asset_id: amount.asset_id},
                  arg: "received",
                  decimalOffset: o.receives.asset_id === "1.3.0" ? 3 : null
              },
              {type: "price", value: {base: priceBase, quote: priceQuote}, arg: "price"}
          ]
        );
        break;
      case "limit_order_create":
         o=op.payload;
        // let isAsk = market_utils.isAskOp(o);
         let base=o.min_to_receive.asset_id;
         let quote=o.amount_to_sell.asset_id;
        const {
          first,
          second
        } = market_utils.getMarketName(base, quote);
        const isBid =o.amount_to_sell.asset_id === second;
        return await Operations.getTranslateInfo(
          isBid ? "operation_limit_order_buy" : "operation_limit_order_sell",
          [
              {type: "account", value: o.seller, arg: "account"},
              {
                  type: "amount",
                  value: isBid ?o.min_to_receive:o.amount_to_sell,
                  arg: "amount"
              },
              {
                  type: "price",
                  value: {
                      base: isBid ? o.amount_to_sell:o.min_to_receive,
                      quote: isBid ?  o.min_to_receive :o.amount_to_sell
                  },
                  arg: "price"
              }
          ]
        );
        break;
     case "limit_order_cancel":
        return await Operations.getTranslateInfo(
              "operation_limit_order_cancel",
              [
                {type: "account", value:op.payload.fee_paying_account, arg: "account"},
                {type:'order',value:op.payload.order.substring(4),arg:'order'}
              ]
          );
        break;
      case "call_order_update":
        return await Operations.getTranslateInfo(
             "operation_call_order_update",
             [
               {type: "account", value:op.payload.funding_account, arg: "account"},
               {type: "asset", value: op.payload.delta_debt.asset_id, arg: "debtSymbol"},
               {type: "amount", value: op.payload.delta_debt, arg: "debt"},
               {type: "amount", value: op.payload.delta_collateral, arg: "collateral"}            ]
         );
         break;
      case "vesting_balance_withdraw":
        return await Operations.getTranslateInfo(
              "operation_vesting_balance_withdraw",
              [
                {type: "account", value: op.payload.owner, arg: "account"},
                {type: "amount", value: op.payload.amount, arg: "amount"},
                {type: "vesting_balance", value: op.payload.vesting_balance, arg: "vesting_balance_id"},
              ]
          );
        break;
      case "call_contract_function":

        let contract=(await _store.dispatch("contract/getContract",{nameOrId:op.payload.contract_id,isCache:true},{root:true})).data;
        let action=contract.abi_actions.find(item=>{
            return item.name==op.payload.function_name;
        });

        let value_list_jsons={};//use parameters as keyname and merge values into a Json string
        let v="";
        if(action){
          action.arglist.forEach((arg,index)=>{
            let v_l_item=op.payload.value_list[index];
            if(v_l_item){
              v=v_l_item[1].v;
              if(Array.isArray(v)){
                v=helper.formatTable(v)
              }
              value_list_jsons[arg]= v;
            }
          })
        }else{
          value_list_jsons=op.payload.value_list.map(item=>{
              return item[1].v;
            })
        }
        
        value_list_jsons=JSON.stringify(value_list_jsons);

        return await Operations.getTranslateInfo(
              "operation_call_contract_function",
              [
                {type: "account", value: op.payload.caller, arg: "caller"},
                {type: "contract_name", value: contract.contract_name, arg: "contract_name"},
                {type: "function_name", value: op.payload.function_name, arg: "function_name"},
                {type: "value_list", value: value_list_jsons, arg: "arg_list"}
              ]
          );
        break;
       case "contract_create":
        return await Operations.getTranslateInfo(
              "operation_contract_create",
              [
                {type: "account", value: op.payload.owner, arg: "owner"},
                {type: "contract_name", value: op.payload.name, arg: "contract_name"}
                // ,
                // {type: "contract_data", value: op.payload.data, arg: "contract_data"}
              ]
          );
        break;
      case "revise_contract":
        return await Operations.getTranslateInfo(
              "operation_revise_contract",
              [
                {type: "account", value: op.payload.reviser, arg: "reviser"},
                {type: "contract_id", value: op.payload.contract_id, arg: "contract_name"}
              ]
          );
        break;
        case "register_nh_asset_creator":
          return await Operations.getTranslateInfo(
                "operation_register_nh_asset_creator",
                [
                  {type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account"}
                ]
            );
        break;
        case "create_world_view":
          return await Operations.getTranslateInfo(
                "operation_create_world_view",
                [
                  {type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account"},
                  {type: "world_view", value: op.payload.world_view, arg: "world_view"}
                ]
            );
        break;
        case "create_nh_asset":
            let types=  [
              {type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account"},
              {type: "account", value: op.payload.owner, arg: "owner"}
            ]
            if(op.result){
              types.push({type: "nh_asset", value: op.result.result, arg: "nh_asset"});
            }
           return await Operations.getTranslateInfo(
                "operation_create_nh_asset",
                types
            );
        break;
        case "delete_nh_asset":
          return await Operations.getTranslateInfo(
                "operation_delete_nh_asset",
                [
                  {type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account"},
                  {type: "nh_asset", value: op.payload.nh_asset, arg: "nh_asset"}
                ]
            );
         break;
        case "transfer_nh_asset":
          return await Operations.getTranslateInfo(
                "operation_transfer_nh_asset",
                [
                  {type: "account", value: op.payload.from, arg: "from"},
                  {type: "account", value: op.payload.to, arg: "to"},
                  {type: "nh_asset", value: op.payload.nh_asset, arg: "nh_asset"}
                ]
            );
           break;
        case "relate_nh_asset":
          return await Operations.getTranslateInfo(
                "operation_relate_nh_asset",
                [
                  {type: "account", value: op.payload.nh_asset_creator, arg: "nh_asset_creator"},
                  {type: "relate", value: op.payload.relate?"将":"取消", arg: "relate"},
                  {type: "nh_asset", value: op.payload.parent, arg: "nh_asset"},
                  {type: "nh_asset", value: op.payload.child, arg: "nh_asset"}
                ]
            );
           break;
         
        case "create_nh_asset_order":
          return await Operations.getTranslateInfo(
                  "operation_create_nh_asset_order",
                  [
                    {type: "account", value: op.payload.seller, arg: "seller"},
                    {type: "nh_asset", value: op.payload.nh_asset, arg: "nh_asset"},
                    {
                        type: "amount",
                        value: op.payload.price,
                        arg: "amount"
                    },
                    {
                        type: "amount",
                        value: op.payload.pending_orders_fee,
                        arg: "pending_orders_fee"
                    }
                  ]
              );
          break;
        case "cancel_nh_asset_order":
          return await Operations.getTranslateInfo(
                  "operation_cancel_nh_asset_order",
                  [
                    {type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account"},
                    {type: "order", value: op.payload.order, arg: "order"}
                  ]
              );
          break;
        case "fill_nh_asset_order":
          return await Operations.getTranslateInfo(
                "operation_fill_nh_asset_order",
                [
                  {type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account"},
                  {type: "price_amount", value: op.payload.price_amount, arg: "price_amount"},
                  {type: "price_asset_symbol", value: op.payload.price_asset_symbol, arg: "price_asset_symbol"},
                  {type: "account", value: op.payload.seller, arg: "seller"},   
                  {type: "nh_asset", value: op.payload.nh_asset, arg: "nh_asset"}          
                ]
            );
         break;
        case "relate_world_view":
          return await Operations.getTranslateInfo(
                "operation_relate_world_view",
                [
                  {type: "account", value: op.payload.related_account, arg: "related_account"},
                  {type: "account", value: op.payload.view_owner, arg: "view_owner"},   
                  {type: "world_view", value: op.payload.world_view, arg: "world_view"}          
                ]
            );
          break;
        case "proposal_create":

          let proposal_create=await Operations.getTranslateInfo(
              "operation_proposal_create",
              [
                {type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account"},      
                {type: "result", value: op.result.result, arg: "result"}       
              ]
          );

          let proposalOp=op.payload.proposed_ops[0].op;
          proposalOp={
            account:op.payload.fee_paying_account,
            payload:proposalOp[1],
            type:Operations._operationTypes[proposalOp[0]]
          };

          let proposal_content=await Operations.getParseOperations(proposalOp);
          
          return {
             opText:proposal_create.opText.concat(proposal_content.opText),
             opObj:{
               ...proposal_create.opObj,
               ...proposal_content.opObj
             }
          }
          break;
        case "committee_member_update_global_parameters":
          return await Operations.getTranslateInfo(
              "operation_committee_member_update_global_parameters",
              [
                {type: "account", value: op.account, arg: "account"},
              ]
          );
           break;
        case "proposal_update":
          return await Operations.getTranslateInfo(
              "operation_proposal_update",
              [
                {type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account"},
                {type: "proposal", value: op.payload.proposal, arg: "proposal"}  
              ]
          );
        break;
        case "contract_affecteds_nh_transfer_from":
          return await Operations.getTranslateInfo(
              "contract_affecteds_nh_transfer_from",
              [
                {type: "account", value: op.payload.affected_account, arg: "affected_account"},
                {type: "affected_item", value: op.payload.affected_item, arg: "affected_item"}
              ]
          );
        break;
        case "contract_affecteds_nh_transfer_to":
          return await Operations.getTranslateInfo(
              "contract_affecteds_nh_transfer_to",
              [
                {type: "account", value: op.payload.affected_account, arg: "affected_account"},
                {type: "affected_item", value: op.payload.affected_item, arg: "affected_item"}
              ]
          );
        break;
        case "contract_affecteds_nh_modifined":
            return await Operations.getTranslateInfo(
                "contract_affecteds_nh_modifined",
                [
                  {type: "account", value: op.payload.affected_account, arg: "affected_account"},
                  {type: "affected_item", value: op.payload.affected_item, arg: "affected_item"},
                  {type: "modified", value: op.payload.modified, arg: "modified"}
                ]
            );
        break;
        case "contract_affecteds_asset":
          return await Operations.getTranslateInfo(
              "contract_affecteds_asset",
              [
                {type: "account", value: op.payload.affected_account, arg: "affected_account"},
                {
                  type: "amount",
                  value: op.payload.affected_asset,
                  arg: "aseet_amount",
                  decimalOffset: op.payload.affected_asset.asset_id === "1.3.0" ? 0 : null
                },          
              ]
          );
          break;
        case "contract_affecteds_log":
          return await Operations.getTranslateInfo(
              "contract_affecteds_log",
              [
                {type: "account", value: op.payload.affected_account, arg: "affected_account"},
                {
                  type: "message",
                  value: op.payload.message,
                  arg: "message"
                },          
              ]
          );
          break;  
        case "asset_create":
          return await Operations.getTranslateInfo(
                "operation_asset_create",
                [
                    {type: "account", value: op.payload.issuer, arg: "account"},
                    {type: "symbol", value: op.payload.symbol, arg: "asset"}
                ]
            )
           break;
        case "asset_update_bitasset":
        case "asset_update":
          return await Operations.getTranslateInfo(
                "operation_asset_update",
                [
                    {type: "account", value: op.payload.issuer, arg: "account"},
                    {type: "asset", value: op.payload.asset_to_update, arg: "asset"}
                ]
            )
           break;
        case "asset_update_restricted":
           let restricted_type_text= _locales[_store.rootGetters["setting/defaultSettings"].locale]["restricted_type_"+op.payload.restricted_type]
           return await Operations.getTranslateInfo(
                 "operation_asset_update_restricted",
                 [
                     {type: "account", value: op.payload.payer, arg: "payer"},
                     {type: "asset", value: op.payload.target_asset, arg: "target_asset"},
                     {type: "restricted_type", value: restricted_type_text, arg: "restricted_type_text"}
                 ]
             )
            break;
        case "asset_issue":
          return await Operations.getTranslateInfo(
                  "operation_asset_issue",
                  [
                      {type: "account", value: op.payload.issuer, arg: "account"},
                      {
                          type: "amount",
                          value: op.payload.asset_to_issue,
                          arg: "amount",
                          decimalOffset: op.payload.asset_to_issue.asset_id === "1.3.0" ? 0 : null
                      },
                      {type: "account", value: op.payload.issue_to_account, arg: "to"}
                  ]
              )
              break;
        case "asset_reserve":
         return await Operations.getTranslateInfo(
                  "operation_asset_reserve",
                  [
                      {type: "account", value: op.payload.payer, arg: "account"},
                      {
                          type: "amount",
                          value: op.payload.amount_to_reserve,
                          arg: "amount"
                      }
                  ]
              )
              break;
        case "asset_fund_fee_pool":
          return await Operations.getTranslateInfo(
                    "operation_asset_fund_fee_pool",
                    [
                        {type: "account", value: op.payload.from_account, arg: "account"},
                        {
                            type: "amount",
                            value: {amount:op.payload.amount,asset_id:"1.3.0"},
                            arg: "amount"
                        },
                        {type: "asset", value: op.payload.asset_id, arg: "asset"}
                    ]
                )
              break;
       case "asset_publish_feed":
          return await Operations.getTranslateInfo(
                      "operation_asset_publish_feed",
                      [
                          {type: "account", value: op.payload.publisher, arg: "account"},
                          {type: "price", value: op.payload.feed.settlement_price, arg: "price"}
                      ]
                  )
                break;
      case "asset_global_settle":
                return await Operations.getTranslateInfo(
                            "operation_asset_global_settle",
                            [
                                {type: "account", value: op.payload.issuer, arg: "account"},
                                {type: "price", value: op.payload.settle_price, arg: "price"},
                                {type: "asset", value: op.payload.asset_to_settle, arg: "asset"}
                            ]
                        )
                      break;
     case "asset_settle":
              return await Operations.getTranslateInfo(
                          "operation_asset_settle",
                          [
                            {type: "account", value: op.payload.account, arg: "account"},
                            {type: "amount", value: op.payload.amount, arg: "amount"}
                          ]
                      )
                    break;
       case "asset_settle_cancel":
              return await Operations.getTranslateInfo(
                          "operation_asset_settle_cancel",
                          [
                            {type: "account", value: op.payload.creator, arg: "account"},
                            {type: "amount", value: op.payload.amount, arg: "amount"}
                          ]
                      )
                    break;
       case "vesting_balance_create":
                return await Operations.getTranslateInfo(
                            "operation_vesting_balance_create",
                            [
                                {type: "account", value: op.payload.creator, arg: "account"},
                                {type: "amount", value: op.payload.amount, arg: "amount"}
                            ]
                        )
                      break;
        case "asset_update_feed_producers":
          return await Operations.getTranslateInfo(
                      "operation_asset_update_feed_producers",
                      [
                          {type: "account", value: op.payload.issuer, arg: "account"},
                          {type: "asset", value: op.payload.asset_to_update, arg: "asset"}
                      ]
                  )
                break;    
       case "asset_claim_fees":
          return await Operations.getTranslateInfo(
                    "operation_asset_claim_fees",
                    [
                        {type: "account", value: op.payload.issuer, arg: "account"},
                        {
                            type: "amount",
                            value: op.payload.amount_to_claim,
                            arg: "balance_amount"
                        },
                        {type: "asset", value: op.payload.amount_to_claim.asset_id, arg: "asset"}
                    ]
                )
              break;
        case "crontab_create":
              let start_time=op.payload.start_time;
              start_time=new Date(start_time+"Z").format("yyyy/MM/dd HH:mm:ss");
              if(op.type=="void_result"){
                op.result={
                  result:"void_result"
                };
              }
              if(!op.result){
                op.result={
                  result:"***"
                }
              }
              let crontab_create=await Operations.getTranslateInfo(
                  "operation_crontab_create",
                  [
                    {type: "account", value: op.payload.crontab_creator, arg: "crontab_creator"},     
                    {type: "start_time", value: start_time, arg: "start_time"},     
                    {type: "execute_interval", value: op.payload.execute_interval, arg: "execute_interval"},     
                    {type: "execute_times", value: op.payload.scheduled_execute_times, arg: "execute_times"},
                    {type: "result", value: op.result.result, arg: "result"}   
                  ]
              );
             
              let crontabOp=op.payload.crontab_ops[0].op;
              crontabOp={
                payload:crontabOp[1],
                type:Operations._operationTypes[crontabOp[0]]
              };

              let crontab_content=await Operations.getParseOperations(crontabOp);

              return {
                opText:crontab_create.opText.concat(crontab_content.opText),
                opObj:{
                  ...crontab_create.opObj,
                  ...crontab_content.opObj
                }
              }
            break;
        case "crontab_cancel":
           return await Operations.getTranslateInfo(
                    "operation_crontab_cancel",
                    [
                        {type: "account", value: op.payload.fee_paying_account, arg: "fee_paying_account"},
                        {type: "task", value: op.payload.task, arg: "task"}
                    ]
                )
            break;
        case "crontab_recover":
           let restart_time=op.payload.restart_time;
           restart_time=new Date(restart_time+"Z").format("yyyy/MM/dd HH:mm:ss");
           return await Operations.getTranslateInfo(
                    "operation_crontab_recover",
                    [
                        {type: "account", value: op.payload.crontab_owner, arg: "crontab_owner"},
                        {type: "crontab", value: op.payload.crontab, arg: "crontab"},
                        {type: "restart_time", value:restart_time, arg: "restart_time"}
                    ]
                )
            break;
        case "update_collateral_for_gas":
          return await Operations.getTranslateInfo(
                    "operation_update_collateral_for_gas",
                    [
                        {type: "account", value: op.payload.mortgager, arg: "mortgager"},
                        {type: "account", value: op.payload.beneficiary, arg: "beneficiary"},
                        {
                            type: "amount",
                            value:{
                              amount: op.payload.collateral,
                              asset_id:"1.3.0"
                            },
                            arg: "collateral"
                        }
                    ]
                )
              break;
    }
  },
  getTranslateInfo:async (localId, keys)=>{
      let lang=_store.rootGetters["setting/defaultSettings"].locale;
      let text = _locales[lang][localId];
      if(localId=="operation_create_nh_asset"&&keys.length==2){
        text=lang=='en'?'(fee_paying_account) Create NH assets with ownership account (owner)':"(fee_paying_account) 创建NH资产，所有权账户为 (owner)";
      }
      let splitText = utils.get_translation_parts(text);
      let key;
      let opObj={};
      for(let i=0;i<keys.length;i++){
          key=keys[i];
          if (splitText.indexOf(key.arg)) {
            let value=key.value;
            switch (key.type) {
                case "account":
                    if(/^1.2.\d+/.test(key.value)){
                        let acc_res=await API.Account.getAccount(key.value,true);
                        if(acc_res.success){
                          value=acc_res.data.account.name
                        }
                    }
                    break;
                case "asset":
                    let asset=await API.Assets.fetch([key.value],true);
                    if(!asset){
                      console.log("链上不存在资产"+asset_id);
                    }
                    value = asset?asset.symbol:"";
                    break;
                case "amount":
                    value =await Operations.FormattedAsset(key.value.amount,key.value.asset_id,key.decimalOffset);
                    if(localId=="contract_affecteds_asset"){
                      let amount=Number((value.split(" "))[0]);
                      if(amount>0){
                        value="+"+value;
                      }
                    }
                    break;
                case "price":
                    value =await Operations.FormattedPrice({
                      base_asset:key.value.base.asset_id,
                      base_amount:key.value.base.amount,
                      quote_asset:key.value.quote.asset_id,
                      quote_amount:key.value.quote.amount
                    })
                    break;
                case "contract_id":
                    const response = await API.Contract.getContract(key.value,true);
                    if(response.code==1){
                      value=response.data.name;
                    }else{
                       value = key.value;
                    }   
                    break;

                case "modified":
                    let item_data={};
                    value=[value];
                    value.forEach(keyValue=>{
                      item_data[keyValue[0]]=keyValue[1];
                    })
                    value=JSON.stringify(item_data); 
                    break; 
                    
                default:
                    value = key.value;
                    break;
            }

            splitText[splitText.indexOf(key.arg)] = value;
            opObj[key.arg]=value;
            if(key.type=="value_list"){
              opObj[key.arg]=JSON.parse(value);
            }
        }
      }
      return {
        opText:splitText,
        opObj
      }
      //return splitText;
  },
  FormattedPrice:async ({base_asset,base_amount,quote_asset,quote_amount})=>{
    // let marketId=quote_asset+"_"+base_asset;
    let assets=_store.rootGetters["assets/getAssets"];
    if(assets&&assets[base_asset]&&assets[quote_asset]){
      base_asset=assets[base_asset];
      quote_asset=assets[quote_asset];
    }else{
      if(API.Assets.fetch_asset_by_cache(base_asset)){
        base_asset=API.Assets.fetch_asset_by_cache(base_asset);
      }else{
        base_asset=await API.Assets.fetch([base_asset],true);
        if(!base_asset){
          base_asset={precision:8,symbol:"1.3.0"}; 
        }
      }
      if(API.Assets.fetch_asset_by_cache(quote_asset)){
        quote_asset=API.Assets.fetch_asset_by_cache(quote_asset);
      }else{
        quote_asset=await API.Assets.fetch([quote_asset],true);
        if(!quote_asset){
          quote_asset={precision:8,symbol:"1.3.0"}; 
        }
      }
    }

   
    let base_precision = utils.get_asset_precision(base_asset.precision);
    let quote_precision = utils.get_asset_precision(quote_asset.precision);
    let value = base_amount / base_precision / (quote_amount / quote_precision);
    value=Number(value.toFixed(base_asset.precision));
    return value+" "+base_asset.symbol+"/"+quote_asset.symbol;
  },
  FormattedAsset:async (amount,asset_id,decimalOffset)=>{
     let asset=await API.Assets.fetch([asset_id],true);
     if(!asset){
      asset={precision:8,symbol:"1.3.0"}; 
     }
     return helper.getFullNum(amount/Math.pow(10,asset.precision))+" "+asset.symbol;
  },
  // retrieves array of assets ids that were used in operations
  _getOperationsAssetsIds: (parsedOperations) => {
    function addNewId(array, id) {
      if (array.indexOf(id) === -1) array.push(id);
    }

    return parsedOperations.reduce((result, operation) => {
      switch (operation.type) {
        case 'transfer':
          addNewId(result, operation.payload.amount.asset_id);
          break;
        case 'fill_order':
          addNewId(result, operation.payload.pays.asset_id);
          addNewId(result, operation.payload.receives.asset_id);
          break;
        case 'limit_order_create':
          addNewId(result, operation.payload.amount_to_sell.asset_id);
          addNewId(result, operation.payload.min_to_receive.asset_id);
          break;
        default:
      }
      return result;
    }, []);
  },

  // fetches user's operations
  getUserOperations: async ({ userId,startId="1.11.0",endId="1.11.0",limit,store }) => {
    try {
      const response = await Apis.instance().history_api().exec(
        'get_account_history',
        [userId, startId, limit, endId]
      );
      if (response && typeof (response) === 'object') {
        const parsedOperations = await Operations.parseOperations({ operations: response, userId,store });
        return {
          code: 1,
          data: parsedOperations
        };
      }
      return {
        code: 120,
        message: 'Error fetching account record',
        error: 'Error fetching account record'
      };
    } catch (error) {
      return {
        code: 0,
        message:error.message,
        error
      };
    }
  },
  get_block_header:async (block_num)=>{
    try{
        if(block_num in _cacheBlocks){
          if( _cacheBlocks[block_num])  return _cacheBlocks[block_num];
          return {code:0};
        }
        _cacheBlocks[block_num]="";
        const response=await Apis.instance().db_api().exec("get_block_header", [block_num]);
        if(response&&typeof (response)==='object'){
          let res={
            code:1,
            data:response
          }
          _cacheBlocks[block_num]=res;
          return res
        }
        return {
          code: 121,
          message: 'block and transaction information cannot be found'
        };
    }catch(error){
      return {
        code: 0,
        message:error.message,
        error
      };
    }
  },
  getBlock:async (block_num)=>{
    try{
      const response=await Apis.instance().db_api().exec("get_block", [block_num]);
      if(response&&typeof (response)==='object'){
        return {
          code:1,
          data:response
        }
      }
      return {
        code: 121,
        message: 'block and transaction information cannot be found'
      };
    }catch(error){
      return {
        code: 0,
        message:error.message,
        error
      };
    }
  }
};

Operations.prepareOperationTypes();

export default Operations;
