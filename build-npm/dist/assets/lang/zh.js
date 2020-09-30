"use strict";

Object.defineProperty(exports, "__esModule", {
   value: true
});

var _defineProperty2 = require("babel-runtime/helpers/defineProperty");

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _zh_CN;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var zh_CN = (_zh_CN = {
   trxTypes_transfer: "转账",
   trxTypes_limit_order_create: "限价单",
   trxTypes_limit_order_cancel: "取消限价单",
   trxTypes_call_order_update: "更新订单",
   trxTypes_account_create: "创建账户",
   trxTypes_account_update: "更新账户",
   trxTypes_account_whitelist: "账户白名单",
   trxTypes_account_upgrade: "升级账户",
   trxTypes_account_transfer: "账户转移",
   trxTypes_asset_create: "创建资产",
   trxTypes_asset_update: "更新资产",
   trxTypes_asset_update_restricted: "更新资产受限名单",
   trxTypes_asset_update_bitasset: "更新智能币",
   trxTypes_asset_update_feed_producers: "更新资产喂价者",
   trxTypes_asset_issue: "资产发行",
   trxTypes_asset_reserve: "销毁资产",
   trxTypes_asset_fund_fee_pool: "积存资产费用池",
   trxTypes_asset_settle: "资产结算",
   trxTypes_asset_global_settle: "全局资产清算",
   trxTypes_asset_publish_feed: "发布资产喂价",
   trxTypes_committee_member_create: "创建理事会成员",
   trxTypes_witness_create: "创建见证人",
   trxTypes_witness_withdraw_pay: "领取见证人报酬",
   trxTypes_proposal_create: "创建提议",
   trxTypes_proposal_update: "更新提议",
   trxTypes_proposal_delete: "删除提案",
   trxTypes_withdraw_permission_create: "创建提取权限",
   trxTypes_withdraw_permission_update: "更新提取权限",
   trxTypes_withdraw_permission_claim: "主张提取权限",
   trxTypes_withdraw_permission_delete: "删除提取权限",
   trxTypes_fill_order: "订单撮合",
   trxTypes_delegate_update_global_parameters: "全局参数更新",
   trxTypes_vesting_balance_create: "创建冻结账目余额",
   trxTypes_vesting_balance_withdraw: "提取解冻账户余额",
   trxTypes_worker_create: "创建雇员",
   trxTypes_custom: "自定义",
   trxTypes_assert: "断言操作",
   trxTypes_balance_claim: "领取余额",
   trxTypes_override_transfer: "优先覆盖转账",
   trxTypes_witness_update: "更新见证人",
   trxTypes_committee_member_update_global_parameters: "全局参数更新",
   trxTypes_transfer_to_blind: "向隐私账户转账",
   trxTypes_blind_transfer: "隐私转账",
   trxTypes_transfer_from_blind: "从隐私账户转出",
   trxTypes_committee_member_update: "更新理事会成员",
   trxTypes_asset_claim_fees: "领取资产手续费"
}, (0, _defineProperty3.default)(_zh_CN, "trxTypes_asset_fund_fee_pool", "注资资产手续费池"), (0, _defineProperty3.default)(_zh_CN, "trxTypes_call_contract_function", "合约交易"), (0, _defineProperty3.default)(_zh_CN, "trxTypes_contract_create", "创建合约"), (0, _defineProperty3.default)(_zh_CN, "trxTypes_revise_contract", "更新合约"), (0, _defineProperty3.default)(_zh_CN, "trxTypes_register_nh_asset_creator", "注册开发者"), (0, _defineProperty3.default)(_zh_CN, "trxTypes_create_world_view", "创建世界观"), (0, _defineProperty3.default)(_zh_CN, "trxTypes_create_nh_asset", "NH资产创造"), (0, _defineProperty3.default)(_zh_CN, "trxTypes_delete_nh_asset", "NH资产删除"), (0, _defineProperty3.default)(_zh_CN, "trxTypes_transfer_nh_asset", "NH资产转移"), (0, _defineProperty3.default)(_zh_CN, "trxTypes_create_nh_asset_order", "NH资产挂卖单"), (0, _defineProperty3.default)(_zh_CN, "trxTypes_cancel_nh_asset_order", "NH资产挂卖单取消"), (0, _defineProperty3.default)(_zh_CN, "trxTypes_fill_nh_asset_order", "NH资产订单撮合"), (0, _defineProperty3.default)(_zh_CN, "trxTypes_relate_nh_asset", "NH资产关联"), (0, _defineProperty3.default)(_zh_CN, "trxTypes_relate_world_view", "关联世界观"), (0, _defineProperty3.default)(_zh_CN, "trxTypes_update_collateral_for_gas", "GAS调整质押物"), (0, _defineProperty3.default)(_zh_CN, "trxTypes_asset_settle_cancel", "资产清算取消"), (0, _defineProperty3.default)(_zh_CN, "trxTypes_contract_affecteds_asset", "资产"), (0, _defineProperty3.default)(_zh_CN, "trxTypes_contract_affecteds_nh_transfer_from", "NH资产转出"), (0, _defineProperty3.default)(_zh_CN, "trxTypes_contract_affecteds_nh_transfer_to", "NH资产转入"), (0, _defineProperty3.default)(_zh_CN, "trxTypes_contract_affecteds_nh_modifined", "NH资产数据修改"), (0, _defineProperty3.default)(_zh_CN, "trxTypes_contract_affecteds_log", "日志"), (0, _defineProperty3.default)(_zh_CN, "operation_set_proxy", "(account) 设置 (proxy) 为他的投票代理"), (0, _defineProperty3.default)(_zh_CN, "operation_annual_upgrade_account", "(account) 升级到年度会员"), (0, _defineProperty3.default)(_zh_CN, "operation_unlisted_by", "(lister) 将 (listee) 移出清单"), (0, _defineProperty3.default)(_zh_CN, "operation_whitelisted_by", "(lister) 将 (listee) 加入白名单"), (0, _defineProperty3.default)(_zh_CN, "operation_blacklisted_by", "(lister) 将 (listee) 加入黑名单"), (0, _defineProperty3.default)(_zh_CN, "operation_asset_update_feed_producers", "(account) 更新了资产 (asset) 的喂价者"), (0, _defineProperty3.default)(_zh_CN, "operation_asset_settle", "(account) 请求清算 (amount)"), (0, _defineProperty3.default)(_zh_CN, "operation_asset_global_settle", "(account) 请求以 (price) 的价格进行全局清算 (asset)"), (0, _defineProperty3.default)(_zh_CN, "operation_witness_create", "(account) 升级到见证人"), (0, _defineProperty3.default)(_zh_CN, "operation_witness_update", "(account) 更新了见证人信息"), (0, _defineProperty3.default)(_zh_CN, "operation_committee_member_create", "(account) 升级到理事会成员"), (0, _defineProperty3.default)(_zh_CN, "operation_committee_member_update", "(account) 更新了理事会成员信息"), (0, _defineProperty3.default)(_zh_CN, "operation_witness_pay", "提取见证人收入到账户"), (0, _defineProperty3.default)(_zh_CN, "operation_witness_receive", "Received witness from witness"), (0, _defineProperty3.default)(_zh_CN, "operation_worker_create", "(account) 创建了预算提案，请求每日支付 (pay)"), (0, _defineProperty3.default)(_zh_CN, "operation_committee_member_update_global_parameters", "(account) 更新了全局理事会参数"), (0, _defineProperty3.default)(_zh_CN, "operation_reg_account", "(registrar) 创建账户 (new_account)"), (0, _defineProperty3.default)(_zh_CN, "operation_transfer", "(from) 转账 (amount) 到 (to)"), (0, _defineProperty3.default)(_zh_CN, "operation_vesting_balance_withdraw", "(account) 提取了 (vesting_balance_id) 解冻金额 (amount)"), (0, _defineProperty3.default)(_zh_CN, "operation_balance_claim", "(account) 领取了余额 (amount)"), (0, _defineProperty3.default)(_zh_CN, "operation_asset_publish_feed", "(account) 发布了喂价 (price)"), (0, _defineProperty3.default)(_zh_CN, "operation_update_account", "(account) 更新了它的账户信息"), (0, _defineProperty3.default)(_zh_CN, "operation_limit_order_sell", "(account) 提交卖单，以 (price) 的价格卖出 (amount) "), (0, _defineProperty3.default)(_zh_CN, "operation_limit_order_buy", "(account) 提交买单，以 (price) 的价格买入 (amount) "), (0, _defineProperty3.default)(_zh_CN, "operation_call_order_update", "(account) 调整了 (debtSymbol) 债务 (debt) ，以及抵押 (collateral)"), (0, _defineProperty3.default)(_zh_CN, "operation_fill_order", "(account) 以 (price) 的价格购买了 (received)"), (0, _defineProperty3.default)(_zh_CN, "operation_limit_order_cancel", "(account) 取消了订单 #(order)"), (0, _defineProperty3.default)(_zh_CN, "operation_asset_issue", "(account) 发行了 (amount) 到 (to)"), (0, _defineProperty3.default)(_zh_CN, "operation_asset_create", "(account) 创建了资产 (asset)"), (0, _defineProperty3.default)(_zh_CN, "operation_asset_update", "(account) 更新了资产 (asset)"), (0, _defineProperty3.default)(_zh_CN, "operation_asset_update_restricted", "(payer) 更新资产 (target_asset) (restricted_type_text)"), (0, _defineProperty3.default)(_zh_CN, "operation_asset_reserve", "(account) 销毁了 (amount)"), (0, _defineProperty3.default)(_zh_CN, "operation_lifetime_upgrade_account", "(account) 升级到终身会员"), (0, _defineProperty3.default)(_zh_CN, "operation_asset_fund_fee_pool", "(account) 向 (asset) 手续费池注入 (amount)"), (0, _defineProperty3.default)(_zh_CN, "operation_asset_claim_fees", "(account) 从 (asset) 资产手续费池中领取 (balance_amount) 资产手续费"), (0, _defineProperty3.default)(_zh_CN, "operation_call_contract_function", "授权人: (caller) ，合约: (contract_name) ，动作: (function_name) ，数据: (arg_list)"), (0, _defineProperty3.default)(_zh_CN, "operation_contract_create", "(owner) 创建合约 (contract_name)"), (0, _defineProperty3.default)(_zh_CN, "operation_revise_contract", "(reviser) 更新合约 (contract_name)"), (0, _defineProperty3.default)(_zh_CN, "operation_register_nh_asset_creator", "(fee_paying_account) 注册成为开发者"), (0, _defineProperty3.default)(_zh_CN, "operation_create_world_view", "(fee_paying_account) 创建世界观 (world_view)"), (0, _defineProperty3.default)(_zh_CN, "operation_create_nh_asset", "(fee_paying_account) 创建NH资产 (nh_asset) ，所有权账户为 (owner)"), (0, _defineProperty3.default)(_zh_CN, "operation_delete_nh_asset", "(fee_paying_account) 删除NH资产 (nh_asset)"), (0, _defineProperty3.default)(_zh_CN, "operation_transfer_nh_asset", "(from) 的NH资产 (nh_asset) 所有权转移到 (to)"), (0, _defineProperty3.default)(_zh_CN, "operation_create_nh_asset_order", "(seller) 提交卖单，以 (amount) 的价格挂卖数据资产 (nh_asset) ，otc手续费: (pending_orders_fee)"), (0, _defineProperty3.default)(_zh_CN, "operation_cancel_nh_asset_order", "(fee_paying_account) 取消了NH资产出售单 (order)"), (0, _defineProperty3.default)(_zh_CN, "operation_fill_nh_asset_order", "(fee_paying_account) 以 (price_amount) (price_asset_symbol) 的价格购买 (seller) 的NH资产 (nh_asset)"), (0, _defineProperty3.default)(_zh_CN, "operation_proposal_create", "(fee_paying_account) 创建提议 (result) ： "), (0, _defineProperty3.default)(_zh_CN, "operation_proposal_update", "(fee_paying_account) 更新提议 (proposal)"), (0, _defineProperty3.default)(_zh_CN, "operation_proposal_delete", "(account) 删除提议"), (0, _defineProperty3.default)(_zh_CN, "operation_relate_world_view", "(related_account) 关联 (view_owner) 的世界观 (world_view)"), (0, _defineProperty3.default)(_zh_CN, "operation_relate_nh_asset", "(nh_asset_creator) (relate)父级NH资产 (nh_asset) 和子级NH资产 (nh_asset) 关联"), (0, _defineProperty3.default)(_zh_CN, "operation_update_collateral_for_gas", "(mortgager) 将 (beneficiary) 抵押物调整为 (collateral)"), (0, _defineProperty3.default)(_zh_CN, "operation_vesting_balance_create", "(account) 创建冻结账目余额 (amount)"), (0, _defineProperty3.default)(_zh_CN, "operation_asset_settle_cancel", "(account) 取消资产清算 (amount)"), (0, _defineProperty3.default)(_zh_CN, "operation_update_global_property_extensions", "(account)更新全局扩展属性"), (0, _defineProperty3.default)(_zh_CN, "contract_affecteds_nh_modifined", "(affected_account) 的NH资产 (affected_item) 修改数据 (modified)"), (0, _defineProperty3.default)(_zh_CN, "contract_affecteds_nh_transfer_to", "NH资产 (affected_item) 转入 (affected_account)"), (0, _defineProperty3.default)(_zh_CN, "contract_affecteds_nh_transfer_from", "(affected_account) 的NH资产 (affected_item) 转出"), (0, _defineProperty3.default)(_zh_CN, "contract_affecteds_asset", "(affected_account) (aseet_amount)"), (0, _defineProperty3.default)(_zh_CN, "contract_affecteds_log", "(affected_account) (message)"), (0, _defineProperty3.default)(_zh_CN, "restricted_type_1", "资产权限账户白名单"), (0, _defineProperty3.default)(_zh_CN, "restricted_type_2", "资产权限账户黑名单"), (0, _defineProperty3.default)(_zh_CN, "restricted_type_3", "市场交易资产白名单"), (0, _defineProperty3.default)(_zh_CN, "restricted_type_4", "市场交易资产黑名单"), _zh_CN);

exports.default = zh_CN;