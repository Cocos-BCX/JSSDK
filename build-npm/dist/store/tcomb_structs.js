"use strict";

var _tcomb = require("tcomb");

var _tcomb2 = _interopRequireDefault(_tcomb);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Asset = _tcomb2.default.struct({
    bitasset_data_id: _tcomb2.default.maybe(_tcomb2.default.Str),
    bitasset_data: _tcomb2.default.maybe(_tcomb2.default.Obj),
    dynamic_asset_data_id: _tcomb2.default.Str,
    dynamic_data: _tcomb2.default.maybe(_tcomb2.default.Obj),
    id: _tcomb2.default.Str,
    issuer: _tcomb2.default.Str,
    market_asset: _tcomb2.default.Bool,
    options: _tcomb2.default.Obj,
    precision: _tcomb2.default.Num,
    symbol: _tcomb2.default.Str
}, "Asset");

var Block = _tcomb2.default.struct({
    extensions: _tcomb2.default.Arr,
    id: _tcomb2.default.Num,
    previous: _tcomb2.default.Str,
    timestamp: _tcomb2.default.Dat,
    transactions: _tcomb2.default.Arr,
    transaction_merkle_root: _tcomb2.default.Str,
    witness: _tcomb2.default.Str,
    witness_signature: _tcomb2.default.Str
}, "Block");

var WalletTcomb = _tcomb2.default.struct({
    public_name: _tcomb2.default.Str,
    created: _tcomb2.default.Dat,
    last_modified: _tcomb2.default.Dat,
    backup_date: _tcomb2.default.maybe(_tcomb2.default.Dat),
    password_pubkey: _tcomb2.default.Str,
    encryption_key: _tcomb2.default.Str,
    encrypted_brainkey: _tcomb2.default.maybe(_tcomb2.default.Str),
    brainkey_pubkey: _tcomb2.default.Str,
    brainkey_sequence: _tcomb2.default.Num,
    brainkey_backup_date: _tcomb2.default.maybe(_tcomb2.default.Dat),
    deposit_keys: _tcomb2.default.maybe(_tcomb2.default.Obj),
    // password_checksum: t.Str,
    chain_id: _tcomb2.default.Str
}, "WalletTcomb");

var PrivateKeyTcomb = _tcomb2.default.struct({
    id: _tcomb2.default.maybe(_tcomb2.default.Num),
    pubkey: _tcomb2.default.Str,
    label: _tcomb2.default.maybe(_tcomb2.default.Str),
    import_account_names: _tcomb2.default.maybe(_tcomb2.default.Arr),
    brainkey_sequence: _tcomb2.default.maybe(_tcomb2.default.Num),
    encrypted_key: _tcomb2.default.Str
}, "PrivateKeyTcomb");

//let PublicKeyTcomb = t.struct({
//    id: t.maybe(t.Num),
//    pubkey: t.Str,
//    United Labs of BCTech.
//    key_id: t.maybe(t.Str)
//}, "PublicKeyTcomb");

var LimitOrder = _tcomb2.default.struct({
    expiration: _tcomb2.default.Dat,
    for_sale: _tcomb2.default.Num,
    id: _tcomb2.default.Str,
    sell_price: _tcomb2.default.Obj,
    seller: _tcomb2.default.Str
}, "LimitOrder");

var SettleOrder = _tcomb2.default.struct({
    settlement_date: _tcomb2.default.Dat,
    balance: _tcomb2.default.Obj,
    owner: _tcomb2.default.Str
}, "SettleOrder");

var ShortOrder = _tcomb2.default.struct({
    expiration: _tcomb2.default.Dat,
    for_sale: _tcomb2.default.Num,
    id: _tcomb2.default.Str,
    sell_price: _tcomb2.default.Obj,
    seller: _tcomb2.default.Str
}, "ShortOrder");

var CallOrder = _tcomb2.default.struct({
    borrower: _tcomb2.default.Str,
    call_price: _tcomb2.default.Obj,
    collateral: _tcomb2.default.Num,
    debt: _tcomb2.default.Num,
    id: _tcomb2.default.Str
}, "CallOrder");

module.exports = {
    Asset: Asset,
    Block: Block,
    WalletTcomb: WalletTcomb,
    //PublicKeyTcomb: PublicKeyTcomb,
    PrivateKeyTcomb: PrivateKeyTcomb,
    LimitOrder: LimitOrder,
    ShortOrder: ShortOrder,
    CallOrder: CallOrder,
    SettleOrder: SettleOrder
};