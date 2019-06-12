/* eslint no-underscore-dangle: 0 */
/* eslint camelcase: 0 */

import { ChainTypes, ChainValidation } from 'bcxjs-cores';
import API from '../api';

const { object_type } = ChainTypes;

const limit_order = parseInt(object_type.limit_order, 10);
const history = parseInt(object_type.operation_history, 10);
const order_prefix = '1.' + limit_order + '.';
const history_prefix = '1.' + history + '.';

class Subscription {
  constructor(type) {
    this.type = type;
    this._callback = () => {};
  }
  setCallback(callback) {
    this._callback = callback;
  }

  getType() {
    return this.type;
  }

  notify(operation) {
    this._callback(operation);
  }
}

class Markets extends Subscription {
  constructor({ callback }) {
    super('markets');
    this._callback = callback;
  }

  notify(obj) {
    if (ChainValidation.is_object_id(obj)) {
      if (obj.search(order_prefix) === 0) {
        this._callback('deleteOrder', obj);
      }
    } else {
      if (obj.id && obj.id.startsWith(history_prefix)) {
        const [type] = obj.op;
        if (type === ChainTypes.operations.fill_order) {
          this._callback('fillOrder', obj);
        }
      }

      if (obj.id && obj.id.startsWith(order_prefix)) {
        this._callback('newOrder', obj);
      }
    }
  }
}

class UserOperations extends Subscription {
  constructor({ userId, callback }) {
    super('userOperation');
    this._userId = userId;
    this._callback = callback;

    this._operationTypes = {};
    Object.keys(ChainTypes.operations).forEach(name => {
      const code = ChainTypes.operations[name];
      this._operationTypes[code] = name;
    });

    this._userFields = {
      transfer: 'from',
      fill_order: 'account_id',
      limit_order_create: 'seller',
      limit_order_cancel: 'fee_paying_account',
      contract_create:'owner',
      call_contract_function: 'caller',
      transfer_nh_asset:"from",
      creat_nh_asset_order:"seller",   
      account_update:"account",

      account_create:"registrar",
      vesting_balance_withdraw:"owner",
      asset_create:"issuer",
      asset_update:"issuer",
      asset_issue:"issuer",
      asset_claim_fees:"issuer",
      asset_reserve:"payer",
      asset_fund_fee_pool:"from_account",
      revise_contract:"reviser"

      //,
      // creat_world_view: 'fee_paying_account',
      // register_nh_asset_creator_operation:"fee_paying_account",
      // propose_relate_world_view_operation:"fee_paying_account",
      // creat_nh_asset_operation:"fee_paying_account"
    };
  }

  _getOperationUserIds(operation) {
    const [typeCode, payload] = operation.op;
    const operationType = this._operationTypes[typeCode];
    let pathToUserId = this._userFields[operationType];
    if(!pathToUserId) pathToUserId="fee_paying_account";
    const usersIds = [payload[pathToUserId]];
    // if (operationType === 'transfer') usersIds.push(payload.from);
    if (operationType === 'transfer') usersIds.push(payload.to);
    if (operationType === 'transfer_nh_asset') usersIds.push(payload.to);
    if (operationType === 'propose_relate_world_view') usersIds.push(payload.version_owner);
    if (operationType === 'fill_nh_asset_order') usersIds.push(payload.seller);

    if(operationType=="creat_nh_asset") usersIds.push(payload.owner);
    if(operationType=="asset_issue") usersIds.push(payload.issue_to_account)

    return usersIds;
  }

  notify(operation) {
    if(operation&&operation.op){
      const _userOperationsCodes =[0, 1, 2,3,4,5,6,8,10,11,14,15,16,21,22,42,44,47,49,50,51,52,53,54,55,56,57,58,59,63];
      const _opCode = operation.op[0];
      if (_userOperationsCodes.indexOf(_opCode) > -1) {
        const usersIds = this._getOperationUserIds(operation);
        if (usersIds.indexOf(this._userId) > -1) {
          this._callback(operation);
        }
      }
    }
  }
}

class AllOperations extends Subscription {
  constructor({  callback }) {
    super('allOperation');
    this._callback = callback;
  }


  notify(operation) {
    if(operation&&operation.op){
      const _userOperationsCodes =[0, 1, 2,3,4,5,6,8,9,10,11,13,14,15,21,22,32,39,43,44,46,47,48,49,50,51,52,53,54,55,60,300,301,303,3010,3011,3012];
      const _opCode = operation.op[0];
      if (_userOperationsCodes.indexOf(_opCode) > -1) {
        this._callback(operation);
      }
    }
  }
}

class BlocksOp extends Subscription {
  constructor({callback,isReqTrx}){
     super('BlocksOp');
     this._callback = callback;
     this.isReqTrx=isReqTrx;
  }
  notify(data) {
      if(arguments.length==2){
        this._callback(data,arguments[1]);
      }
  }
}

const Subscriptions = {
  Markets,
  UserOperations,
  AllOperations,
  BlocksOp
};

export default Subscriptions;
