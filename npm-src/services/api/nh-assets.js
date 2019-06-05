import { Apis } from 'bcxjs-ws';
import API from '../api';
import helper from '../../lib/common/helper';

const formatItems=async (items,total)=>{
         items=items.map(item=>{
                item.create_time=new Date(item.create_time+'Z').format("yyyy/MM/dd HH:mm:ss");
                let describe_with_contract={}
                let item_data;

                item.describe_with_contract.forEach(wv_item=>{
                    item_data={};
                    wv_item[1].forEach(prop=>{
                        if(prop)
                        item_data[prop[0]]=prop[1];
                    })
                    describe_with_contract[wv_item[0]]=item_data;
                })
                item["describe_with_contract"]=describe_with_contract;
                return item;
            });
            for(let i=0;i<items.length;i++){
                let describe_with_contracts=Object.keys(items[i].describe_with_contract);
                let c_id="";
                let contract_name="";

                let req_accounts=[
                    API.Account.getUser(items[i].nh_asset_creator,true),
                    API.Account.getUser(items[i].nh_asset_owner,true),
                ]
                if(items[i].nh_asset_active){
                    req_accounts.push(API.Account.getUser(items[i].nh_asset_active,true));
                }
                if(items[i].dealership){
                    req_accounts.push(API.Account.getUser(items[i].dealership,true));
                }
                let accounts_res=await Promise.all(req_accounts);
                for(let j=0;j<accounts_res.length;j++){
                    if(accounts_res[j].code!=1){
                        return accounts_res[j];
                    }
                }
                items[i].nh_asset_creator_name=accounts_res[0].data.account.name;
                items[i].nh_asset_owner_name=accounts_res[1].data.account.name;
                if(req_accounts.length>2){
                    items[i].nh_asset_active_name=accounts_res[2].data.account.name;
                    items[i].dealership_name=accounts_res[3].data.account.name;
                }
               
    
                for(let ii=0;ii<describe_with_contracts.length;ii++){
                    c_id=describe_with_contracts[ii];
                    contract_name=(await API.Contract.getContract(c_id,true)).data.name;
                    items[i].describe_with_contract[contract_name]=items[i].describe_with_contract[c_id];
                    delete items[i].describe_with_contract[c_id];
                }
            }
            let result={code:1,data:items};
            if(total){
                result.total=total;
            }
            return result;
}

export const listAccountNHAssets= async ({account_id,worldViews=[],account,page=1,pageSize=10}) => {
    try {
      const response = await Apis.instance().db_api().exec('list_account_nh_asset', [account_id,worldViews,pageSize,page,4]);
      if (response) {
        return await formatItems(response[0],response[1]);
      }
      return {
        code: 104,
        message:worldViews+' not found'
      };
    } catch (error) {
      let message=error.message;
      return {
        code: 0,
        message,
        error
      };
    }
};
  
export const lookupNHAssets=async (nh_asset_hash_or_ids)=>{
    try{
        let response= await Apis.instance().db_api().exec('lookup_nh_asset', [nh_asset_hash_or_ids]);
       
        if(response&&response[0]&&response.length){
            return await formatItems(response);
        }
        return {
            code:147,
            message:nh_asset_hash_or_ids+' NHAsset do not exist'
        };
    } catch(error){
        let message=error.message;
        if(message.indexOf("Invalid hex character")!=-1){
            message="请输入正确的NH资产id或hash";
        }
        
        return {
            code:0,
            message,
            error
        }
    }
}


export const listNHAssetOrders=async ({assetIds,worldViews,baseDescribe="",pageSize=10,page=1,isAscendingOrder=true})=>{
    try{
        const response= await Apis.instance().db_api().exec('list_nh_asset_order', [assetIds,worldViews,baseDescribe,Number(pageSize),Number(page),isAscendingOrder]);
        if(response){
            let orders=await fomatOrders(response[0]);
            return {
                code:1,
                data:orders,
                total:response[1]
            }
        }
    } catch(error){
        return {
            code:0,
            message:error.message,
            error
        }
    }
}


export const listAccountNHAssetOrders=async ({account_id,pageSize=10,page=1})=>{
    try{
        const response=await Apis.instance().db_api().exec('list_account_nh_asset_order', [account_id,Number(pageSize),Number(page)]);  
        if(response){
            let orders=await fomatOrders(response[0]);
            return {
                code:1,
                data:orders,
                total:response[1]
            }
        }
    } catch(error){
        return {
            code:0,
            message:error.message,
            error
        }
    }
}

export const lookupWorldViews=async (world_view_name_or_ids)=>{
    try{
        
        let response=await Apis.instance().db_api().exec('lookup_world_view',[world_view_name_or_ids]);
        if(response&&response[0]){
            let versions=[];
            for(let i=0;i<response.length;i++){
               let wv_item=response[i];
               let developers=await Apis.instance().db_api().exec('get_objects',[wv_item.related_nht_creator]); 
               for(let j=0;j<developers.length;j++){
                   let account=await API.Account.getUser(developers[j].creator,true);
                   developers[j].developer_name=account.data.account.name;
               }
               wv_item.creators=developers;
               delete wv_item.related_nht_creator;
               versions.push(wv_item);
            }
            return {code:1,data:versions};
        }

        return {code:164,message:world_view_name_or_ids+" do not exist"};
    } catch(error){
        return {
            code:0,
            message:error.message,
            error
        }
    }
}

export const getNHCreator=async (nh_asset_creator_account_id)=>{
    try{
        const response=await Apis.instance().db_api().exec('get_nh_creator', [nh_asset_creator_account_id]);
        if(response){
            response.creator_name=(await API.Account.getUser(response.creator,true)).data.account.name;
            return {
                code:1,
                data:response
            }
        }
    } catch(error){
        console.info("error",error);
        let message=error.message;    
        try{
            let item_error_index=message.indexOf('end():');
            if(item_error_index!=-1){
              message=message.substring(item_error_index+6);
            }
          }catch(e){}
        return {
            code:0,
            message,
            error
        }
    }
}

export const listNHAssetsByCreator=async ({account_id,pageSize=10,page=1})=>{
    try{
        const response=await Apis.instance().db_api().exec('list_nh_asset_by_creator', [account_id,pageSize,page]);
        if(response){
            return await formatItems(response[0],response[1]);
        }
        return {
            code: 104,
            message:'not found'
        };
    } catch(error){
        return {
            code:0,
            message:error.message,
            error
        }
    }
}


export const queryOrderDetail=async (orderId)=>{
    try{
        let order=await Apis.instance().db_api().exec('get_objects',[[orderId]]);
        if(order&&order[0]){
            order=order[0];
            let asset=await API.Assets.fetch([order.price.asset_id],true);
            if(!asset){
               console.log("链上不存在资产"+asset_id);
               asset={
                   id:"1.3.0",
                   symbol:"COCOS",
                   precision:5
               }
            }
            order.price_amount=helper.formatAmount(order.price.amount,asset.precision);
            order.price_asset_symbol=asset.symbol;
            order.price_asset_id=asset.id;

            return {
                code:1,
                data:order
            }
        }

        return {code:161,message:"Orders do not exist"};
    } catch(error){
        return {
            code:0,
            message:error.message,
            error
        }
    }
}


export default {
    listAccountNHAssets,
    lookupNHAssets,
    listNHAssetOrders,
    listAccountNHAssetOrders,
    lookupWorldViews,
    getNHCreator,
    listNHAssetsByCreator,
    queryOrderDetail
};

const fomatOrders=async (orders)=>{
    orders=orders.sort((a,b)=>{
        let a_split = a.id.split(".");
        let b_split = b.id.split(".");
        return (
             parseInt(b_split[2], 10)- parseInt(a_split[2], 10)
        );
    }).map(item=>{
        item.expiration=new Date(item.expiration+"Z").format("yyyy/MM/dd HH:mm:ss");
        return item;
    });
    if(orders.length){
        let nh_asset_ids=orders.map(order=>order.nh_asset_id);
        let items={};
        (await lookupNHAssets(nh_asset_ids)).data.forEach(item=>{
            items[item.id]=item;
        });
        orders=await Promise.all(orders.map(async (order,index)=>{
            if(items[order.nh_asset_id]&&items[order.nh_asset_id].describe_with_contract)
            order.describe_with_contract=items[order.nh_asset_id].describe_with_contract;
            let asset=await API.Assets.fetch([order.price.asset_id],true);
            if(asset){
                order.price_amount=helper.formatAmount(order.price.amount,asset.precision);
                order.price_asset_symbol=asset.symbol;
                order.price_asset_id=asset.id;
            }else{
                console.log("链上不存在资产"+asset_id);
            }
            order.seller_name=(await API.Account.getUser(order.seller,true)).data.account.name;
            return order;
        }))
    }
    return orders;
}