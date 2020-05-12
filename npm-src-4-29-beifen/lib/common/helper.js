import Assets from '../../services/api/assets';

var helper={
    filterArr: function (arr, propertyName, propertyValue, type) {
        let index = -1;
        arr.some(function (item, itemIndex) {
            if(item[propertyName] == propertyValue){
                index = itemIndex;
                return;
            }
        });

        return type == "index" ? index :(index==-1?null:arr[index]);
    },
    formatAmount(amount,precision){
        return this.getFullNum(amount/Math.pow(10,precision));
    },
    toOpAmount:async (amount,assetObj)=>{  
        if(typeof assetObj=="string"){
            assetObj=await Assets.fetch_asset_one(assetObj);//assetObj -> asset id
            if(assetObj.code!=1){
                return assetObj;
            }else{
                assetObj=assetObj.data;
            }
        }
        let {precision,id}=assetObj;
        if(helper.getDecimals(amount)>precision){
             return { success: false,code:117, error: 'The current asset precision is configured as '+precision+'，and the decimal cannot exceed '+precision};
        }
        amount=parseInt((amount*Math.pow(10,precision)).toFixed(0));
        return {success:true,data:{amount,asset_id:id}};
    },
    getFullNum(num,precision){
        //deal with non-numeric
        if(isNaN(num)){return num};
        if(precision&&precision!=0)
            num=num/Math.pow(10,precision);
        //process numberics that needn't transformation
        var str = ''+num;

        if(!/e/i.test(str)){return num;};
        num=(Number(num)).toFixed(18).replace(/\.?0+$/, "");

        return num;
    },
    getDecimals(num){
        let num_str=this.getFullNum(num);
        if(typeof num_str!="string"){
            return 0;
        }
        if(num_str.indexOf(".")!=-1){
            return (num_str.split(".")[1]).length
        }
        
        return 0;
    },
    trimParams:(params,noValidates={})=>{
        let p_value;
        let requireParams=true;
        for (let key in params){
            if(key!="callback"){
              p_value=params[key];
              if(typeof p_value=="string"){
                 if(p_value){
                    params[key]=p_value.trim();
                  }
                  if(!p_value&&!(key in noValidates)){
                    requireParams=false
                  }
              }
            }  
        }
        return requireParams;
    },
    formatTable:table=>{
        var result = {};
        table.forEach(item=>{
            let key=item[0].key[1].v;
            let value=item[1][1].v;
            switch(item[1][0]){
                case 4:result[key]=helper.formatTable(value);
                  break;
                case 0: 
                case 1:result[key]=Number(value);
                    break;
                default:result[key]=value;    
            }
        })
        return result;
    }
}

export default helper;
