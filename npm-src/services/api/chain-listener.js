
import { Apis } from 'bcxjs-ws';
import {ChainStore} from "bcxjs-cores";
import API from '../api';

/**
 * Subscribe to updates from bcxjs-ws
 */

class ChainListener {
  constructor() {
    this._subscribers = [];
    this._enabled = false;
    this.isCallbackOk=true
    this.exist_block_num=0;
    this.sub_max_ops=13;
    this.real_sub=true;
  }
  async enable() {
    ChainStore.setCustomSubscribeCallback(this._mainCallback.bind(this));
    this._enabled = true;
  }
  disable() {
    return Apis.instance().db_api().exec('cancel_all_subscriptions', []).then(() => {
      this._enabled = false;
    });
  }

  addSubscription(subscription) { 
    let userId="";
    if(subscription.type=="userOperation"){
      userId=subscription._userId;
    }
    this._deleteSubscription(subscription.type,userId);

    this._subscribers.push(subscription);
    return true;
  }
  _deleteSubscription(type,userId){
    if(!type){
      this._subscribers=[];
      return {code:1}
    }
    this._subscribers=this._subscribers.filter(item=>{
        if(userId){
          return item._userId!=userId;
        }else{
          return item.type!=type;
        }
    })
    return {code:1};
  }

  
  _mainCallback(data) {
    if(this.real_sub){
        data[0].forEach(operation => {
          this._subscribers.forEach((subscriber) => {
            if(subscriber.type=="BlocksOp"&&operation.id=="2.1.0"){
              operation.block_num=operation.block_height=operation.head_block_number;
              operation.block_id=operation.head_block_id;
              subscriber.notify(operation,false);
            }
            subscriber.notify(operation);
          });
        });
        return;
      }
      if(!this._subscribers.length) return;
      data[0].forEach(operation => {

          if(operation&&operation.id=="2.1.0"){
            let {head_block_number}=operation;

            if(head_block_number<=this.exist_block_num) return;

            this.exist_block_num=head_block_number;
            //If the subscription has only one subscription block and does not request a transaction
            if(this._subscribers.length==1&&this._subscribers[0].type=="BlocksOp"&&!this._subscribers[0].isReqTrx){
                this._subscribers[0].notify(operation,false)
                return;
            }

            API.Operations.getBlock(head_block_number)
            .then(res=>{
             if(res.code==1){
                res.data.block_num=head_block_number
                res.data.block_id=operation.head_block_id;
                this._subscribers.forEach((subscriber) => {
                  subscriber.notify(JSON.parse(JSON.stringify(res.data)),true);
                });

                let opCount=0;//op counts
                //Traversing trx
                res.data.transactions.some((trx,trx_index)=>{  
                    opCount+=trx[1].operations.length;
                    if(opCount>this.sub_max_ops){
                      trx[1].operations.length=this.sub_max_ops;
                    }
                    //Traversing OP Account record
                    trx[1].operations.forEach((op,op_index)=>{
                      this._subscribers.forEach(subscriber => {
                          subscriber.notify({
                            block_num:head_block_number,
                            id:head_block_number+"."+trx_index+"."+op_index,
                            op,
                            result:trx[1].operation_results[op_index]
                          });
                      });
                    })
                    if(opCount>this.sub_max_ops){
                      return true;
                    }
                })
             }
            // subscriber.notify(operation);
          })
        }
      });
      //this.isCallbackOk=true;
  }
}


export default new ChainListener();


