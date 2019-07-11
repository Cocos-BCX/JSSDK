import {
    FetchChain,
    PrivateKey,
    Aes,
    TransactionHelper,
    ChainTypes,
    ops
} from "bcxjs-cores";
import {Price, Asset} from "./MarketClasses";
const {operations} = ChainTypes;

function estimateFeeAsync(type, options = null, data = {}) {
    return new Promise((res, rej) => {
        FetchChain("getObject", "2.0.0")
            .then(obj => {
                res(estimateFee(type, options, obj, data));
            })
            .catch(rej);
    });
}

function checkFeePoolAsync({
    assetID,
    type = "transfer",
    options = null,
    data
} = {}) {
    return new Promise(res => {
        if (assetID === "1.3.0") {
            res(true);
        } else {
            Promise.all([
                estimateFeeAsync(type, options, data),
                FetchChain("getAsset", assetID)
            ]).then(result => {
                const [fee, feeAsset] = result;
                FetchChain(
                    "getObject",
                    feeAsset.get("dynamic_asset_data_id")
                ).then(dynamicObject => {
                    res(parseInt(dynamicObject.get("fee_pool"), 10) >= fee);
                });
            });
        }
    });
}

let asyncCache = {};
const feeStatusTTL = 60000; // 1 minute

function checkFeeStatusAsync({
    accountID,
    feeID = "1.3.0",
    type = "transfer",
    options = null,
    data
} = {}) {
    let key =
        accountID +
        feeID +
        type +
        JSON.stringify(options) +
        JSON.stringify(data);
    if (asyncCache[key]) {
        if (asyncCache[key].result) {
            return Promise.resolve(asyncCache[key].result);
        }
        return new Promise((res, rej) => {
            asyncCache[key].queue.push({res, rej});
        });
    }

    return new Promise((res, rej) => {
        asyncCache[key] = {queue: [{res, rej}], result: null};
        Promise.all([
            estimateFeeAsync(type, options, data),
            checkFeePoolAsync({assetID: feeID, type, options, data}),
            FetchChain("getAccount", accountID),
            FetchChain("getAsset", "1.3.0"),
            feeID !== "1.3.0" ? FetchChain("getAsset", feeID) : null
        ])
            .then(result => {
                let [
                    coreFee,
                    hasPoolBalance,
                    account,
                    coreAsset,
                    feeAsset
                ] = result;
                let hasBalance = false;
                if (feeID === "1.3.0") feeAsset = coreAsset;
                let coreBalanceID = account.getIn(["balances", "1.3.0"]),
                    feeBalanceID = account.getIn(["balances", feeID]);

                if (feeID === "1.3.0" && !coreBalanceID)
                    return res({
                        fee: new Asset({amount: coreFee}),
                        hasBalance,
                        hasPoolBalance
                    });

                Promise.all([
                    coreBalanceID
                        ? FetchChain("getObject", coreBalanceID)
                        : null,
                    feeBalanceID ? FetchChain("getObject", feeBalanceID) : null
                ]).then(balances => {
                    let [coreBalance, feeBalance] = balances;
                    let fee = new Asset({amount: coreFee});
                    let hasValidCER = true;

                    /*
                ** If the fee is to be paid in a non-core asset, check the fee
                ** pool and convert the amount using the CER
                */
                    if (feeID !== "1.3.0") {
                        // Convert the amount using the CER
                        let cer = feeAsset.getIn([
                            "options",
                            "core_exchange_rate"
                        ]);
                        let b = cer.get("base").toJS();
                        b.precision =
                            b.asset_id === feeID
                                ? feeAsset.get("precision")
                                : coreAsset.get("precision");
                        let base = new Asset(b);

                        let q = cer.get("quote").toJS();
                        q.precision =
                            q.asset_id === feeID
                                ? feeAsset.get("precision")
                                : coreAsset.get("precision");
                        let quote = new Asset(q);

                        /*
                    ** If the CER is incorrectly configured, the multiplication
                    ** will fail, so catch the error and default to core
                    */
                        try {
                            let price = new Price({base, quote});
                            fee = fee.times(price, true);
                        } catch (err) {
                            feeBalance = coreBalance;
                            hasValidCER = false;
                            hasPoolBalance = false;
                        }
                    }

                    if (
                        feeBalance &&
                        feeBalance.get("balance") >= fee.getAmount()
                    )
                        hasBalance = true;
                    asyncCache[key].queue.forEach(promise => {
                        promise.res({
                            fee,
                            hasBalance,
                            hasPoolBalance,
                            hasValidCER
                        });
                    });
                    asyncCache[key] = {
                        result: {fee, hasBalance, hasPoolBalance, hasValidCER}
                    };
                    setTimeout(() => {
                        delete asyncCache[key];
                    }, feeStatusTTL);
                });
            })
            .catch(() => {
                asyncCache[key].forEach(promise => {
                    promise.rej();
                });
            });
    });
}

const privKey = "5KikQ23YhcM7jdfHbFBQg1G7Do5y6SgD9sdBZq7BqQWXmNH7gqo";
const nonce = TransactionHelper.unique_nonce_uint64();
let _privKey;
let _cachedMessage, _prevContent;

let _feeCache = {};
function estimateFee(op_type, options, globalObject, data = {}) {
    // console.time("estimateFee");
    /*
    * The actual content doesn't matter, only the length of it, so we use a
    * string of equal length to improve caching
    */
    if (!!data.content)
        data.content = new Array(data.content.length + 1).join("a");
    if (!globalObject) return 0;
    const cacheKey = op_type + JSON.stringify(options) + JSON.stringify(data);
    if (_feeCache[cacheKey]) {
        // console.timeEnd("estimateFee");
        return _feeCache[cacheKey];
    }
    let op_code = operations[op_type];
    let currentFees = globalObject
        .getIn(["parameters", "current_fees", "parameters", op_code, 1])
        .toJS();

    let fee = 0;
    if (currentFees.fee) {
        fee += currentFees.fee;
    }

    if (options) {
        for (let option of options) {
            const optionFee = currentFees[option];

            if (option === "price_per_kbyte") {
                if (data.type === "memo" && !!data.content) {
                    /* Dummy priv key */
                    let pKey = _privKey || PrivateKey.fromWif(privKey);
                    if (_privKey) _privKey = pKey;
                    let memoFromKey =
                        "COCOS6B1taKXkDojuC1qECjvC7g186d8AdeGtz8wnqWAsoRGC6RY8Rp";

                    // Memos are optional, but if you have one you need to encrypt it
                    let memoToKey =
                        "COCOS8eLeqSZZtB1YHdw7KjQxRSRmaKAseCxhUSqaLxUdqvdGpp6nck";

                    /* Encryption is very expensive so we cache the result for reuse */
                    let message;
                    if (data.content === _prevContent && _cachedMessage) {
                        message = _cachedMessage;
                    } else {
                        message = _cachedMessage = Aes.encrypt_with_checksum(
                            pKey,
                            memoToKey,
                            nonce,
                            data.content
                        );
                    }

                    let memo_object = {
                        from: memoFromKey,
                        to: memoToKey,
                        nonce,
                        message
                    };

                    let serialized = ops.memo_data.fromObject(memo_object);
                    const stringified = JSON.stringify(
                        ops.memo_data.toHex(serialized)
                    );
                    const byteLength = Buffer.byteLength(stringified, "hex");
                    fee += optionFee * byteLength / 1024;

                    _prevContent = data.content;
                }
            } else if (optionFee) {
                fee += optionFee;
            }
        }
    }
    // console.timeEnd("estimateFee");
    fee =
        fee *
        globalObject.getIn(["parameters", "current_fees", "scale"]) /
        10000;
    _feeCache[cacheKey] = fee;
    setTimeout(() => {
        delete _feeCache[cacheKey];
    }, 1000 * 60 * 5); // Five minute cache clear timeout
    return fee;
}

function checkBalance(amount, sendAsset, feeAmount, balance) {
    if (!amount) return null;
    if (typeof amount === "string")
        amount = parseFloat(String.prototype.replace.call(amount, /,/g, ""));

    if (!balance || balance.get("balance") === 0) return false;

    let sendAmount = new Asset({
        asset_id: sendAsset.get("id"),
        precision: sendAsset.get("precision"),
        real: amount
    });
    let balanceAmount = sendAmount.clone(balance.get("balance"));

    /* Insufficient balance */
    if (balanceAmount.lt(sendAmount)) {
        return false;
    }

    /* Check if enough remains to pay the fee */
    if (sendAmount.asset_id === feeAmount.asset_id) {
        sendAmount.plus(feeAmount);
        if (balanceAmount.lt(sendAmount)) {
            return false;
        }
    }

    return true;
}

function shouldPayFeeWithAssetAsync(fromAccount, feeAmount) {
    if (fromAccount && feeAmount && feeAmount.asset_id === "1.3.0") {
        const balanceID = fromAccount.getIn(["balances", feeAmount.asset_id]);
        return FetchChain("getObject", balanceID).then(balanceObject => {
            const balance = balanceObject.get("balance");
            if (balance <= feeAmount.amount) return true;
        });
    }
    return new Promise(resolve => resolve(false));
}

export {
    estimateFee,
    estimateFeeAsync,
    checkFeePoolAsync,
    checkFeeStatusAsync,
    checkBalance,
    shouldPayFeeWithAssetAsync
};
