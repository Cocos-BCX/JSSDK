import {ChainStore} from "bcxjs-cores";
import utils from "./utils";
// import counterpart from "counterpart";
import {estimateFee} from "./trxHelper";
import API from '../../services/api';
import Immutable from "immutable";
import { Apis } from 'bcxjs-ws';

export default class AccountUtils {
    /**
     *  takes asset as immutable object or id, fee as integer amount
     *  @return undefined if asset is undefined
     *  @return false if fee pool has insufficient balance
     *  @return true if the fee pool has sufficient balance
     */
    static async checkFeePool(asset, fee) {
        asset = asset.toJS ? asset : ChainStore.getAsset(asset);
        if (!asset) return undefined;

        let dynamicObject = ChainStore.getObject(
            asset.get("dynamic_asset_data_id")
        );
        if(!dynamicObject){
            // dynamicObject=ChainStore.getObject(
            //     asset.get("dynamic_token_data_id")
            // );
            dynamicObject= await Apis.instance().db_api().exec('get_objects',[[asset.get("dynamic_asset_data_id")]]);
            if(dynamicObject&&dynamicObject[0]){
                dynamicObject=dynamicObject[0];
            }
        }
        if (!dynamicObject) return undefined;
        let feePool = parseInt(dynamicObject.toJS?dynamicObject.get("fee_pool"):dynamicObject.fee_pool, 10);
        return feePool >= fee;
    }

    static async getPossibleFees(account, operation) {
        let core = Immutable.fromJS(await API.Assets.fetch(["1.3.0"],true));
        account = !account || account.toJS ? account : ChainStore.getAccount(account);

        if (!account || !core) {
            return {assets: ["1.3.0"], fees: {"1.3.0": 0}};
        }

        let assets = [],
            fees = {};

        let globalObject = ChainStore.getObject("2.0.0");

        let fee = estimateFee(operation, null, globalObject);

        let accountBalances = account.get("balances");
        if (!accountBalances) {
            return {assets: ["1.3.0"], fees: {"1.3.0": 0}};
        }
        await Promise.all(accountBalances.toArray().map(async (balanceID) => {//balanceID
            let assetID =balanceID.get("asset_type")
            let balanceObject =balanceID; //ChainStore.getObject(balanceID);
            let balance = balanceObject
                ? parseInt(balanceObject.get("balance"), 10)
                : 0;
            let hasBalance = false,
                eqFee;
            if (assetID === "1.3.0" && balance >= fee) {
                hasBalance = true;
            } else if (balance) {
                let asset = await API.Assets.fetch([assetID],true);
                if(asset){
                    asset=Immutable.fromJS(asset)
                    let price = utils.convertPrice(
                        core,
                        asset,
                        null,
                        asset.get("id")
                    );
                    eqFee = parseInt(
                        utils.convertValue(price, fee, core, asset),
                        10
                    );
                    if (parseInt(eqFee, 10) !== eqFee) {
                        eqFee += 1; // Add 1 to round up;
                    }
                    if (balance >= eqFee &&await this.checkFeePool(asset, fee)) {
                        hasBalance = true;
                    }
                } 
            }
            
            if (hasBalance) {
                assets.push(assetID);
                fees[assetID] = eqFee ? eqFee : fee;
            }
        }));

        return {assets, fees};
    }

    static async getFinalFeeAsset(account, operation, fee_asset_id = "1.3.0") {
        let {assets: feeAssets} =await this.getPossibleFees(account, operation);
        if (feeAssets.length === 1) {
            fee_asset_id = feeAssets[0];
            return fee_asset_id;
        } else if (
            feeAssets.length > 0 &&
            feeAssets.indexOf(fee_asset_id) !== -1
        ) {
           return fee_asset_id;
        }
        
        return "1.3.0"
    }
}
