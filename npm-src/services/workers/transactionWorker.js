import { PrivateKey,TransactionBuilder } from 'bcxjs-cores';
import { ChainConfig,Apis } from 'bcxjs-ws';
import helper from "../../lib/common/helper";


onmessage = function(event) { try {
    console.log("transactionWorkers start");
    var _event_data= event.data
    var {opObjects,propose_options,core_asset,onlyGetOPFee,url,networks,fromId} = event.data;
    ChainConfig.networks=networks;
    Apis.instance(url, true,4000,undefined,()=>{
        console.log("transactionWorker rpc close");
        // postMessage({ success: false, error:{message:"The network is busy, please check your network connection"},code:102});
    })
    .init_promise.then(async () => {
        Apis.setAutoReconnect(false);
        const transaction = new TransactionBuilder();
        let res=await transactionOp(transaction);
        postMessage(res);

        Apis.setRpcConnectionStatusCallback(null);
        Apis.close();

    }).catch(error => {
        console.info("error:::::",error);
        postMessage({ success: false, error:{message:"The network is busy, please check your network connection"},code:102});
    });

    const transactionOp=async (transaction)=>{
        opObjects.forEach(op=>{
          transaction.add_type_operation(op.type, op.opObject); 
        });
      
        if(propose_options){
          await transaction.set_required_fees();
           propose_options.fee_paying_account=fromId;
           await  transaction.update_head_block()  
           transaction.propose(propose_options)
        }
      
        if(transaction.success==false){
          return transaction;
        }
        return  process_transaction(transaction);
    }

    const process_transaction=(transaction)=>{
        return new Promise((resolve) => {
            const broadcastTimeout = setTimeout(() => {
              resolve({ success: false, error: {message:'Expiry of the transaction'},code:119});
            }, ChainConfig.expire_in_secs * 2000);
              
              buildOperationsAndBroadcast(transaction).then(transactionResData=>{
                clearTimeout(broadcastTimeout);
                resolve({ success: true,data:transactionResData,code:1});
              }).catch(error=>{
                console.info("error",error);
                doError(error);
              });


            const doError=(error)=>{
                var _error={
                    message:error
                  }
                  try{
                     error=error.message.match(/@@.*@@/)[0].replace(/@@/g,"");
                    _error=JSON.parse(error);

                  }catch (e){
                    _error={
                      message:error.message
                    };
                  }
                  clearTimeout(broadcastTimeout);
                  resolve({ success: false, error:_error,code:0});
            }
          });
      }

      const buildOperationsAndBroadcast = async (transaction) => {
        await signTransaction(transaction);
        await transaction.update_head_block();
        await transaction.set_required_fees();

        if(onlyGetOPFee){
          let feeObj=transaction.operations[0][1].fee;
          let feeAsset = await Apis.instance().db_api().exec('get_objects',[[feeObj.asset_id]]);
          feeAsset=feeAsset[0];
          return {
            fee_amount:helper.getFullNum(feeObj.amount/Math.pow(10,feeAsset.precision)),
            fee_symbol:feeAsset.symbol
          }
        }
        const res=await transaction.broadcast();
        return res;
     }
      

     const signTransaction = async (transaction) => {
        let {pubkeys, addys}= await transaction.get_potential_signatures();
        let my_pubkeys =PrivateKeyStore.getPubkeys_having_PrivateKey(pubkeys, addys); 
        let required_pubkeys=await transaction.get_required_signatures(my_pubkeys);
        for(let pubkey_string of required_pubkeys) {
      
           let private_key=WalletDb.getPrivateKey(pubkey_string);
           if(!private_key){
              throw new Error("Missing signing key for " + pubkey_string)
           }

           transaction.add_signer(private_key, pubkey_string)
        }
        //contract authentication. United Labs of BCTech.
        try{
          let app_keys=_event_data.app_keys;
          app_keys.forEach(app_key=>{
            app_key= PrivateKey.fromWif(app_key);
            transaction.add_signer(app_key, app_key.toPublicKey().toPublicKeyString())
          });
        }catch(e){}
      };


      const PrivateKeyStore={
        getPubkeys_having_PrivateKey:(pubkeys, addys = null)=>{
            let _pubkeys = [];
            if(pubkeys) {
                for(let pubkey of pubkeys) {
                    if(_event_data.keys[pubkey]) {
                        _pubkeys.push(pubkey);
                    }
                }
            }
            return _pubkeys;
         },
         getTcomb_byPubkey:(public_key)=>{
            return public_key => {
                if(! public_key) return null;
                if(public_key.Q)
                    public_key = public_key.toPublicKeyString();
                return _event_data.keys[public_key];
            };
         }
      }

      const WalletDb={
        getPrivateKey(public_key){
            let _passwordKey=_event_data._passwordKey; 
            if (_passwordKey) return PrivateKey.fromWif(_passwordKey[public_key]);
            if(! public_key) return null
            if(public_key.Q) public_key = public_key.toPublicKeyString()
            let private_key_tcomb =PrivateKeyStore.getTcomb_byPubkey(public_key);
            if(!private_key_tcomb) return null;
            return this.decryptTcomb_PrivateKey(private_key_tcomb)
        },
        decryptTcomb_PrivateKey:(private_key_tcomb)=>{
            let {aes_private,_passwordKey}=_event_data; 
            if( ! private_key_tcomb) return null
            // if(getters.isLocked) return "";//throw new Error("wallet locked")
            if (_passwordKey && _passwordKey[private_key_tcomb.pubkey]) {
                return _passwordKey[private_key_tcomb.pubkey];
            }
            let private_key_hex = aes_private.decryptHex(private_key_tcomb.encrypted_key)
            return PrivateKey.fromBuffer(new Buffer(private_key_hex, 'hex'))
        }
      }

} catch( e ) { console.error("transactionWorkers", e) } }