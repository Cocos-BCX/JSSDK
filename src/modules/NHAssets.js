import API from '../services/api';
import helper from '../lib/common/helper';

const initialState = {

};


const actions={
    relateNHAsset:async ({dispatch},params)=>{
        // let {parent,child,contract,relate,onlyGetFee=false}=params;
        // if(!helper.trimParams(params)){
        //     return {code:101,message:"Parameter is missing"};
        // }
        //  // United Labs of BCTech.
        // let contract_res=await dispatch("contract/getContract",{nameOrId:contract},{root:true});
        // if(contract_res.code!=1){
        //     return contract_res;
        // }
        // return  dispatch('transactions/_transactionOperations',{
        //           operations:[{
        //               op_type:50,
        //               type:"relate_nh_asset",
        //               params:{
        //                 parent,
        //                 child,
        //                 contract:contract_res.data.id,
        //                 relate 
        //               }
        //           }],
        //           onlyGetFee
        //         },{root:true});
    },
    registerCreator:({dispatch})=>{
      return  dispatch('transactions/_transactionOperations',{
                operations:[{
                    op_type:46,
                    type:"register_nh_asset_creator",
                    params:{}
                }]
              },{root:true});
    },
    creatWorldView:({dispatch},{worldView=""})=>{
        if(!worldView){
            return {code:131,message:"Parameter 'worldView' can not be empty"}
        }
        worldView=worldView.trim();
        return dispatch('transactions/_transactionOperations', {
            operations:[{
              op_type:47,
              type:"creat_world_view",
              params:{
                world_view:worldView
              }
            }]
          },{root:true});
    },
    lookupNHAssets:async (store,{NHAssetIds})=>{
        if(!(NHAssetIds instanceof Array)){
            return {code:141,message:"Please check the data in parameter 'NHAssetIds'"}
        }
        if(!NHAssetIds.length){
            return {code:137,message:"Parameter 'NHAssetIds' can not be empty"};
        }
        NHAssetIds=NHAssetIds.map(id=>{
            return id?id.trim():"";
        });

        return await API.NHAssets.lookupNHAssets(NHAssetIds);
    },
    queryAccountNHAssets:async ({dispatch},params) => {
        let result=await API.NHAssets.listAccountNHAssets(params);
        return result;
    },
    formatItems:async ({dispatch},result)=>{
        if(result.code==1){
            let items=result.data;
            for(let i=0;i<items.length;i++){
                let item_wv_ids=Object.keys(items[i].world_view);
                let wvs_id="";
                let contract_name="";
                for(let ii=0;ii<item_wv_ids.length;ii++){
                    wvs_id=item_wv_ids[ii];
                    contract_name=(await dispatch("contract/getContract",{nameOrId:wvs_id},{root:true})).data.contract_name;
                    items[i].world_view[contract_name]=items[i].world_view[wvs_id];
                    delete items[i].world_view[wvs_id];
                }
            }
        }
        return result;
    },
    queryNHAssetOrders:async (store,params)=>{
        let {dispatch}=store;
        
        helper.trimParams(params);
        if(!params){
            return {code:101,message:"Parameter is missing"};
        }

        // if(!assetIds){
        //     params.assetIds=[];
        // }
        // if(!worldViews){
        //     params.worldViews=[];
        // }

        return await API.NHAssets.listNHAssetOrders(params,store);
    },
    queryAccountNHAssetOrders:async (store,params)=>{
        return await API.NHAssets.listAccountNHAssetOrders(params);
    },
    queryNHCreator:({dispatch},{account_id})=>{
        return API.NHAssets.getNHCreator(account_id);
    },
    queryNHAssetsByCreator:async (store,params)=>{
        return await API.NHAssets.listNHAssetsByCreator(params)
    },
    lookupWorldViews:(store,{worldViews})=>{
        return API.NHAssets.lookupWorldViews(worldViews)
    },
    creatNHAsset:async ({dispatch,rootGetters},params)=>{
      helper.trimParams(params);
      //type:0 for single creation, 2 for batch creation
      let {assetId="",worldView="",baseDescribe="",type=0,NHAssetsCount=1,
      NHAssets=null,ownerAccount,onlyGetFee=false,proposeAccount}=params;
      let operations=[];

      if(type==0){

        let overLimit0=_isOverLimit(rootGetters,NHAssetsCount,"Create item");
        if(overLimit0.code!=1){
            return overLimit0
        }
        if(!assetId||!worldView){
            return {code:101,message:"Parameter is missing"};
        }

        if(ownerAccount){
            let acc_res=await dispatch("user/getUserInfo",{account:ownerAccount,isCache:true},{root:true});   
            if(acc_res.code==1){
                ownerAccount=acc_res.data.account.id;
            }else{
                return acc_res;
            } 
        }else{
            ownerAccount=rootGetters["account/getAccountUserId"];
        }
        let operation={
            op_type:49,
            type:"creat_nh_asset",
            params:{
                asset_id:assetId,
                world_view:worldView,
                base_describe:typeof baseDescribe=="object"?JSON.stringify(baseDescribe):baseDescribe,
                owner:ownerAccount
            }
        }

        for(let i=0;i<NHAssetsCount;i++){
            operations.push(operation);
        }


      }else if(type==1){
          if(NHAssets&&NHAssets instanceof Array&&NHAssets.length){
            let overLimit1=_isOverLimit(rootGetters,NHAssets.length,"create NHAsset");
            if(overLimit1.code!=1){
                return overLimit1;
            }

            for(let j=0;j<NHAssets.length;j++){
                if(!NHAssets[j].assetId||!NHAssets[j].worldView||!NHAssets[j].ownerAccount){
                    return {code:141,message:"Please check the data in parameter 'NHAssets'"}
                }
                let acc_res=await dispatch("user/getUserInfo",{account:NHAssets[j].ownerAccount,isCache:true},{root:true});   
                if(acc_res.code==1){
                    NHAssets[j].ownerAccount=acc_res.data.account.id;
                }else{
                    return acc_res;
                } 
                operations.push({
                    op_type:49,
                    type:"creat_nh_asset",
                    params:{
                        asset_id:NHAssets[j].assetId,
                        world_view:NHAssets[j].worldView,
                        base_describe:typeof NHAssets[j].baseDescribe=="object"?JSON.stringify(NHAssets[j].baseDescribe):NHAssets[j].baseDescribe,
                        owner:NHAssets[j].ownerAccount
                    }
                })
            }
          }else{
            return {code:142,message:"Please check the data type of parameter 'NHAssets'"}
          }
      }

     return dispatch('transactions/_transactionOperations', {
        operations,
        onlyGetFee,
        proposeAccount
      },{root:true});
    },
    deleteNHAsset:async ({dispatch,rootGetters},params) =>{
        helper.trimParams(params);
        let {callback,itemId,NHAssetIds,onlyGetFee=false}=params;
        if(!NHAssetIds){
            return{code:101,message:"Parameter is missing"}
        }
        if(!(NHAssetIds instanceof Array)){
            return {code:135,message:"Please check parameter data type	"};
        }

        let overLimit=_isOverLimit(rootGetters,NHAssetIds.length,"delete item");
        if(overLimit.code!=1){
            return overLimit;
        }

        let nhs_res=await API.NHAssets.lookupNHAssets(NHAssetIds);
        if(nhs_res.code==1){
            let operations=nhs_res.data.map(({id})=>{
                return {
                    op_type:50,
                    type:"delete_nh_asset",
                    params:{
                        nh_asset:id
                    }
                }
            })
           return dispatch('transactions/_transactionOperations', {
                    operations,
                    onlyGetFee
                  },{root:true});   
        }else{
            // return {code:143,message:"Parameter 'itemId' ["+NHAssetIds.toString()+"] does not exist"}
            return nhs_res;
        }
    },
    transferNHAsset:async ({dispatch,rootGetters},{to_account_id,NHAssetIds}) =>{

        if(!NHAssetIds){
            return {code:101,message:"Parameter is missing"}
        }  

        if(!(NHAssetIds instanceof Array)){
            return {code:135,message:"Please check parameter data type	"};
        }

        let overLimit=_isOverLimit(rootGetters,NHAssetIds.length,"transfer item");
        if(overLimit.code!=1){
            return overLimit;
        }

        let nhs_res=await API.NHAssets.lookupNHAssets(NHAssetIds);
        if(nhs_res.code==1){ 
            let operations=nhs_res.data.map(({id})=>{
                return {
                    op_type:51,
                    type:"transfer_nh_asset",
                    params:{
                        to:to_account_id,
                        nh_asset:id
                    }
                }
            })
           return dispatch('transactions/_transactionOperations', {
                operations,
            },{root:true});   

        }else{
           return nhs_res;
        }
    },
    creatNHAssetOrder:async ({dispatch},params)=>{
        helper.trimParams(params);
        let {otc_account_id,orderFee,NHAssetId,memo="",price,priceAssetId="1.3.0",expiration=3600*48,onlyGetFee=false}=params;
       
        if(!NHAssetId||!priceAssetId){
            return {code:101,message:"Parameter is missing"};
        }
        if(isNaN(Number(orderFee))||isNaN(Number(price))||isNaN(Number(expiration))){
            return {code:135,message:"Please check parameter data type"};
        }

        let  nhs_res=await API.NHAssets.lookupNHAssets([NHAssetId]);
        if(nhs_res.code==1){
            NHAssetId=nhs_res.data[0].id;
            return dispatch('transactions/_transactionOperations', {
                    operations:[{
                        op_type:52,
                        type:"creat_nh_asset_order",
                        params:{
                            otcaccount:otc_account_id,
                            pending_orders_fee:orderFee,
                            nh_asset:NHAssetId,
                            memo,
                            price,
                            priceAssetId,
                            expiration:parseInt(new Date().getTime()/1000+Number(expiration))
                        }
                    }],
                    onlyGetFee
                },{root:true});
        }else{
           return nhs_res;
        }
    },
    cancelNHAssetOrder:({dispatch},{orderId,onlyGetFee=false})=>{
        if(!orderId){
            return {code:136,message:"Parameter 'orderId' can not be empty"};
        }
        orderId=orderId.trim();
        return dispatch('transactions/_transactionOperations', {
            operations:[{
                op_type:53,
                type:"cancel_nh_asset_order",
                params:{
                    order:orderId,
                    extensions:[]
                }
            }],
            onlyGetFee
        },{root:true});
    },
    fillNHAssetOrder:async ({dispatch},{orderId,onlyGetFee=false})=>{
        if(!orderId){
            return {code:101,message:"Parameter is missing"};
        }
        orderId=orderId.trim();
        const order_res=await API.NHAssets.queryOrderDetail(orderId);
        if(order_res.code!=1){
            return order_res;
        }
        let {nh_asset_id,seller,price_amount,price_asset_id,price_asset_symbol}=order_res.data;
        return dispatch('transactions/_transactionOperations', {
            operations:[{
                op_type:54,
                type:"fill_nh_asset_order",
                params:{
                    order:orderId,
                    seller,
                    nh_asset:nh_asset_id,
                    price_amount:price_amount+"",
                    price_asset_id,
                    price_asset_symbol,
                    extensions:[]
                }
            }],
            onlyGetFee
        },{root:true});
    },
    proposeRelateWorldView:async ({dispatch,rootGetters},{worldView,onlyGetFee=false,proposeAccount=""})=>{
       let wv_detail=await API.NHAssets.lookupWorldViews([worldView]);
       if(wv_detail.code!=1){
         return wv_detail;
       }
       let view_owner_id=wv_detail.data[0].creators[0].creator;
       return dispatch('transactions/_transactionOperations', {
            operations:[{
                op_type:48,
                type:"relate_world_view",
                params:{
                    world_view:worldView,
                    view_owner:view_owner_id
                }
            }],
            proposeAccount:rootGetters["account/getAccountUserId"],
            onlyGetFee
        },{root:true});
    }
}


const mutations = {
 
};



const _isOverLimit=(rootGetters,params_count,title)=>{

    let ops_limit=rootGetters["setting/ops_limit"];
    if(params_count>ops_limit){
        return {code:144,message:"Your current batch "+title+" number is "+params_count+", and batch operations can not exceed "+ops_limit};
    }

    return {code:1};
}

export default {
  state: initialState,
  actions,
  //getters,
  mutations,
  namespaced: true
};
