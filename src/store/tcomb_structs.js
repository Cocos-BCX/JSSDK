import t from "tcomb";

let Asset = t.struct({
    bitasset_data_id: t.maybe(t.Str),
    bitasset_data: t.maybe(t.Obj),
    dynamic_asset_data_id: t.Str,
    dynamic_data: t.maybe(t.Obj),
    id: t.Str,
    issuer: t.Str,
    market_asset: t.Bool,
    options: t.Obj,
    precision: t.Num,
    symbol: t.Str
}, "Asset");

let Block = t.struct({
    extensions: t.Arr,
    id: t.Num,
    previous: t.Str,
    timestamp: t.Dat,
    transactions: t.Arr,
    transaction_merkle_root: t.Str,
    witness: t.Str,
    witness_signature: t.Str
}, "Block");

let WalletTcomb = t.struct({
    public_name: t.Str,
    created: t.Dat,
    last_modified: t.Dat,
    backup_date: t.maybe(t.Dat),
    password_pubkey: t.Str,
    encryption_key: t.Str,
    encrypted_brainkey: t.maybe(t.Str),
    brainkey_pubkey: t.Str,
    brainkey_sequence: t.Num,
    brainkey_backup_date: t.maybe(t.Dat),
    deposit_keys: t.maybe(t.Obj),
    // password_checksum: t.Str,
    chain_id: t.Str
}, "WalletTcomb");

let PrivateKeyTcomb = t.struct({
    id: t.maybe(t.Num),
    pubkey: t.Str,
    label: t.maybe(t.Str),
    import_account_names: t.maybe(t.Arr),
    brainkey_sequence: t.maybe(t.Num),
    encrypted_key: t.Str
}, "PrivateKeyTcomb");

//let PublicKeyTcomb = t.struct({
//    id: t.maybe(t.Num),
//    pubkey: t.Str,
//    United Labs of BCTech.
//    key_id: t.maybe(t.Str)
//}, "PublicKeyTcomb");

let LimitOrder = t.struct({
    expiration: t.Dat,
    for_sale: t.Num,
    id: t.Str,
    sell_price: t.Obj,
    seller: t.Str
}, "LimitOrder");

let SettleOrder = t.struct({
    settlement_date: t.Dat,
    balance: t.Obj,
    owner: t.Str
}, "SettleOrder");

let ShortOrder = t.struct({
    expiration: t.Dat,
    for_sale: t.Num,
    id: t.Str,
    sell_price: t.Obj,
    seller: t.Str
}, "ShortOrder");

let CallOrder = t.struct({
    borrower: t.Str,
    call_price: t.Obj,
    collateral: t.Num,
    debt: t.Num,
    id: t.Str
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
