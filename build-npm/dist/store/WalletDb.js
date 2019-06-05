"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.generateKeyFromPassword = undefined;

var _bcxjsCores = require("bcxjs-cores");

var generateKeyFromPassword = exports.generateKeyFromPassword = function generateKeyFromPassword(accountName, role, password) {
    var seed = accountName + role + password;
    var privKey = _bcxjsCores.PrivateKey.fromSeed(seed);
    var pubKey = privKey.toPublicKey().toString();

    return { privKey: privKey, pubKey: pubKey };
};