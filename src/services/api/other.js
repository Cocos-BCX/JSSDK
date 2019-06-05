import { Apis } from 'bcxjs-ws';
import API from '../api';

const formatCrontabs=async (items,store)=>{
    let list=[];
    let item;
    for(let i=0;i<items.length;i++){
        item=items[i];
        let {task_owner,timed_transaction,last_execte_time}=item;
        item.task_owner_name=(await API.Account.getAccount(task_owner,true)).data.account.name;
      
        item.task_parse_ops=await API.Operations.parseOperations({
            operations: [{op:timed_transaction.operations[0]}],
            userId:task_owner,
            store
        });
        item.task_parse_ops=item.task_parse_ops.operations[0];
        delete item.task_parse_ops.block_num;
        delete item.task_parse_ops.date;
        item.expiration_time=new Date(item.expiration_time+"Z").format("yyyy/MM/dd HH:mm:ss");
        last_execte_time=new Date(last_execte_time+"Z");
        if(last_execte_time.getTime()){
            item.last_execte_time=last_execte_time.format("yyyy/MM/dd HH:mm:ss");
        }else{
            item.last_execte_time="未执行"
        }
        // item.last_execte_time=new Date(item.last_execte_time+"Z").format("yyyy/MM/dd HH:mm:ss");
        item.next_execte_time=new Date(item.next_execte_time+"Z").format("yyyy/MM/dd HH:mm:ss");
    }
    return {
        code:1,
        data:items
    };
}

const listAccountCrontabs=async ({account_id,includeNormal=true,includeFail=false},store)=>{
    try {
        const response = await Apis.instance().db_api().exec('list_account_crontab', [account_id,includeNormal,includeFail]);
        if (response) {
          return await formatCrontabs(response,store);
        }
      } catch (error) {
        let message=error.message;
        return {
          code: 0,
          message,
          error
        };
      }
}

export default {
    listAccountCrontabs
}