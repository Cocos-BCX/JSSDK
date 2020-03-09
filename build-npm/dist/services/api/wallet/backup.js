"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

exports.backup = backup;
exports.createWalletObject = createWalletObject;
exports.createWalletBackup = createWalletBackup;
exports.decryptWalletBackup = decryptWalletBackup;

var _idbInstance = require("./idb-instance");

var _idbInstance2 = _interopRequireDefault(_idbInstance);

var _bcxjsLzma = require("bcxjs-lzma");

var _bcxjsCores = require("bcxjs-cores");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function backup(backup_pubkey) {
    return new _promise2.default(function (resolve) {
        resolve(createWalletObject().then(function (wallet_object) {
            var compression = 1;
            return createWalletBackup(backup_pubkey, wallet_object, compression);
        }));
    });
}

function createWalletObject() {
    return _idbInstance2.default.backup();
}

function createWalletBackup(backup_pubkey, wallet_object, compression_mode, entropy) {
    return new _promise2.default(function (resolve) {
        var public_key = _bcxjsCores.PublicKey.fromPublicKeyString(backup_pubkey);
        var onetime_private_key = _bcxjsCores.key.get_random_key(entropy);
        var walletString = (0, _stringify2.default)(wallet_object, null, 0);
        (0, _bcxjsLzma.compress)(walletString, compression_mode, function (compressedWalletBytes) {
            var backup_buffer = _bcxjsCores.Aes.encrypt_with_checksum(onetime_private_key, public_key, null /*nonce*/, compressedWalletBytes);

            var onetime_public_key = onetime_private_key.toPublicKey();
            var backup = Buffer.concat([onetime_public_key.toBuffer(), backup_buffer]);
            resolve(backup);
        });
    });
}

function decryptWalletBackup(backup_wif, backup_buffer) {
    return new _promise2.default(function (resolve, reject) {
        if (!Buffer.isBuffer(backup_buffer)) backup_buffer = new Buffer(backup_buffer, "binary");

        var private_key = _bcxjsCores.PrivateKey.fromWif(backup_wif);
        var public_key = void 0;
        try {
            public_key = _bcxjsCores.PublicKey.fromBuffer(backup_buffer.slice(0, 33));
        } catch (e) {
            console.error(e, e.stack);
            throw new Error("Invalid backup file");
        }

        backup_buffer = backup_buffer.slice(33);
        try {
            backup_buffer = _bcxjsCores.Aes.decrypt_with_checksum(private_key, public_key, null /*nonce*/, backup_buffer);
        } catch (error) {
            // console.log("Error decrypting wallet", error, error.stack);
            reject("invalid_decryption_key");
            return;
        }

        try {
            (0, _bcxjsLzma.decompress)(backup_buffer, function (wallet_string) {
                try {
                    var wallet_object = JSON.parse(wallet_string);
                    resolve(wallet_object);
                } catch (error) {
                    if (!wallet_string) wallet_string = "";
                    console.error("Error parsing wallet json", wallet_string.substring(0, 10) + "...");
                    reject("Error parsing wallet json");
                }
            });
        } catch (error) {
            console.log("Error decompressing wallet", error, error.stack);
            reject("Error decompressing wallet");
            return;
        }
    });
}