import iDB from "./idb-instance";
import {compress, decompress} from "bcxjs-lzma";
import {PrivateKey, PublicKey, Aes, key} from "bcxjs-cores";


export function backup(backup_pubkey) {
    return new Promise( resolve => {
        resolve(createWalletObject().then( wallet_object => {
            let compression = 1;
            return createWalletBackup(backup_pubkey, wallet_object, compression);
        }));
    });
}

export function createWalletObject() {
    return iDB.backup();
}


export function createWalletBackup(
    backup_pubkey, wallet_object, compression_mode, entropy) {
    return new Promise( resolve => {
        let public_key = PublicKey.fromPublicKeyString(backup_pubkey);
        let onetime_private_key = key.get_random_key(entropy);
        let walletString = JSON.stringify(wallet_object, null, 0);
        compress(walletString, compression_mode, compressedWalletBytes => {
            let backup_buffer =
                Aes.encrypt_with_checksum(onetime_private_key, public_key,
                    null/*nonce*/, compressedWalletBytes);

            let onetime_public_key = onetime_private_key.toPublicKey();
            let backup = Buffer.concat([ onetime_public_key.toBuffer(), backup_buffer ]);
            resolve(backup);
        });
    });
}

export function decryptWalletBackup(backup_wif, backup_buffer) {
    return new Promise( (resolve, reject) => {
        if( ! Buffer.isBuffer(backup_buffer))
            backup_buffer = new Buffer(backup_buffer, "binary");

        let private_key = PrivateKey.fromWif(backup_wif);
        let public_key;
        try {
            public_key = PublicKey.fromBuffer(backup_buffer.slice(0, 33));
        } catch(e) {
            console.error(e, e.stack);
            throw new Error("Invalid backup file");
        }

        backup_buffer = backup_buffer.slice(33);
        try {
            backup_buffer = Aes.decrypt_with_checksum(
                private_key, public_key, null/*nonce*/, backup_buffer);
        } catch(error) {
            // console.log("Error decrypting wallet", error, error.stack);
            reject("invalid_decryption_key");
            return;
        }

        try {
            decompress(backup_buffer, wallet_string => {
                try {
                    let wallet_object = JSON.parse(wallet_string);
                    resolve(wallet_object);
                } catch(error) {
                    if( ! wallet_string) wallet_string = "";
                    console.error("Error parsing wallet json",
                        wallet_string.substring(0,10)+ "...");
                    reject("Error parsing wallet json");
                }
            });
        } catch(error) {
            console.log("Error decompressing wallet", error, error.stack);
            reject("Error decompressing wallet");
            return;
        }
    });
}