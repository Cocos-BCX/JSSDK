import {ChainStore, PrivateKey, key, Aes} from "bcxjs-cores";

export const generateKeyFromPassword=(accountName, role, password)=>{
    let seed = accountName + role + password;
    let privKey = PrivateKey.fromSeed(seed);
    let pubKey = privKey.toPublicKey().toString();

    return {privKey, pubKey};
}


  