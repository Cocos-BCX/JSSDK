'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _bcxjsCores = require('bcxjs-cores');

var _api = require('../api');

var _api2 = _interopRequireDefault(_api);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint no-underscore-dangle: 0 */
/* eslint camelcase: 0 */

var object_type = _bcxjsCores.ChainTypes.object_type;


var limit_order = parseInt(object_type.limit_order, 10);
var history = parseInt(object_type.operation_history, 10);
var order_prefix = '1.' + limit_order + '.';
var history_prefix = '1.' + history + '.';

var Subscription = function () {
  function Subscription(type) {
    (0, _classCallCheck3.default)(this, Subscription);

    this.type = type;
    this._callback = function () {};
  }

  (0, _createClass3.default)(Subscription, [{
    key: 'setCallback',
    value: function setCallback(callback) {
      this._callback = callback;
    }
  }, {
    key: 'getType',
    value: function getType() {
      return this.type;
    }
  }, {
    key: 'notify',
    value: function notify(operation) {
      this._callback(operation);
    }
  }]);
  return Subscription;
}();

var Markets = function (_Subscription) {
  (0, _inherits3.default)(Markets, _Subscription);

  function Markets(_ref) {
    var callback = _ref.callback;
    (0, _classCallCheck3.default)(this, Markets);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Markets.__proto__ || (0, _getPrototypeOf2.default)(Markets)).call(this, 'markets'));

    _this._callback = callback;
    return _this;
  }

  (0, _createClass3.default)(Markets, [{
    key: 'notify',
    value: function notify(obj) {
      if (_bcxjsCores.ChainValidation.is_object_id(obj)) {
        if (obj.search(order_prefix) === 0) {
          this._callback('deleteOrder', obj);
        }
      } else {
        if (obj.id && obj.id.startsWith(history_prefix)) {
          var _obj$op = (0, _slicedToArray3.default)(obj.op, 1),
              type = _obj$op[0];

          if (type === _bcxjsCores.ChainTypes.operations.fill_order) {
            this._callback('fillOrder', obj);
          }
        }

        if (obj.id && obj.id.startsWith(order_prefix)) {
          this._callback('newOrder', obj);
        }
      }
    }
  }]);
  return Markets;
}(Subscription);

var UserOperations = function (_Subscription2) {
  (0, _inherits3.default)(UserOperations, _Subscription2);

  function UserOperations(_ref2) {
    var userId = _ref2.userId,
        callback = _ref2.callback;
    (0, _classCallCheck3.default)(this, UserOperations);

    var _this2 = (0, _possibleConstructorReturn3.default)(this, (UserOperations.__proto__ || (0, _getPrototypeOf2.default)(UserOperations)).call(this, 'userOperation'));

    _this2._userId = userId;
    _this2._callback = callback;

    _this2._operationTypes = {};
    (0, _keys2.default)(_bcxjsCores.ChainTypes.operations).forEach(function (name) {
      var code = _bcxjsCores.ChainTypes.operations[name];
      _this2._operationTypes[code] = name;
    });

    _this2._userFields = {
      transfer: 'from',
      fill_order: 'account_id',
      limit_order_create: 'seller',
      limit_order_cancel: 'fee_paying_account',
      contract_create: 'owner',
      call_contract_function: 'caller',
      transfer_nh_asset: "from",
      creat_nh_asset_order: "seller",
      account_update: "account",

      account_create: "registrar",
      vesting_balance_withdraw: "owner",
      asset_create: "issuer",
      asset_update: "issuer",
      asset_issue: "issuer",
      asset_claim_fees: "issuer",
      asset_reserve: "payer",
      asset_fund_fee_pool: "from_account",
      revise_contract: "reviser"

      //,
      // creat_world_view: 'fee_paying_account',
      // register_nh_asset_creator_operation:"fee_paying_account",
      // propose_relate_world_view_operation:"fee_paying_account",
      // creat_nh_asset_operation:"fee_paying_account"
    };
    return _this2;
  }

  (0, _createClass3.default)(UserOperations, [{
    key: '_getOperationUserIds',
    value: function _getOperationUserIds(operation) {
      var _operation$op = (0, _slicedToArray3.default)(operation.op, 2),
          typeCode = _operation$op[0],
          payload = _operation$op[1];

      var operationType = this._operationTypes[typeCode];
      var pathToUserId = this._userFields[operationType];
      if (!pathToUserId) pathToUserId = "fee_paying_account";
      var usersIds = [payload[pathToUserId]];
      // if (operationType === 'transfer') usersIds.push(payload.from);
      if (operationType === 'transfer') usersIds.push(payload.to);
      if (operationType === 'transfer_nh_asset') usersIds.push(payload.to);
      if (operationType === 'propose_relate_world_view') usersIds.push(payload.version_owner);
      if (operationType === 'fill_nh_asset_order') usersIds.push(payload.seller);

      if (operationType == "creat_nh_asset") usersIds.push(payload.owner);
      if (operationType == "asset_issue") usersIds.push(payload.issue_to_account);

      return usersIds;
    }
  }, {
    key: 'notify',
    value: function notify(operation) {
      if (operation && operation.op) {
        var _userOperationsCodes = [0, 1, 2, 3, 4, 5, 6, 8, 10, 11, 14, 15, 16, 21, 22, 42, 44, 47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 63];
        var _opCode = operation.op[0];
        if (_userOperationsCodes.indexOf(_opCode) > -1) {
          var usersIds = this._getOperationUserIds(operation);
          if (usersIds.indexOf(this._userId) > -1) {
            this._callback(operation);
          }
        }
      }
    }
  }]);
  return UserOperations;
}(Subscription);

var AllOperations = function (_Subscription3) {
  (0, _inherits3.default)(AllOperations, _Subscription3);

  function AllOperations(_ref3) {
    var callback = _ref3.callback;
    (0, _classCallCheck3.default)(this, AllOperations);

    var _this3 = (0, _possibleConstructorReturn3.default)(this, (AllOperations.__proto__ || (0, _getPrototypeOf2.default)(AllOperations)).call(this, 'allOperation'));

    _this3._callback = callback;
    return _this3;
  }

  (0, _createClass3.default)(AllOperations, [{
    key: 'notify',
    value: function notify(operation) {
      if (operation && operation.op) {
        var _userOperationsCodes = [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 13, 14, 15, 21, 22, 32, 39, 43, 44, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 60, 300, 301, 303, 3010, 3011, 3012];
        var _opCode = operation.op[0];
        if (_userOperationsCodes.indexOf(_opCode) > -1) {
          this._callback(operation);
        }
      }
    }
  }]);
  return AllOperations;
}(Subscription);

var BlocksOp = function (_Subscription4) {
  (0, _inherits3.default)(BlocksOp, _Subscription4);

  function BlocksOp(_ref4) {
    var callback = _ref4.callback,
        isReqTrx = _ref4.isReqTrx;
    (0, _classCallCheck3.default)(this, BlocksOp);

    var _this4 = (0, _possibleConstructorReturn3.default)(this, (BlocksOp.__proto__ || (0, _getPrototypeOf2.default)(BlocksOp)).call(this, 'BlocksOp'));

    _this4._callback = callback;
    _this4.isReqTrx = isReqTrx;
    return _this4;
  }

  (0, _createClass3.default)(BlocksOp, [{
    key: 'notify',
    value: function notify(data) {
      if (arguments.length == 2) {
        this._callback(data, arguments[1]);
      }
    }
  }]);
  return BlocksOp;
}(Subscription);

var Subscriptions = {
  Markets: Markets,
  UserOperations: UserOperations,
  AllOperations: AllOperations,
  BlocksOp: BlocksOp
};

exports.default = Subscriptions;