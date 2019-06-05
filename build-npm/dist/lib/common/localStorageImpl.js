"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var ls_key_exists = function _ls_key_exists(key, ls) {
  return key in ls;
};
exports.ls_key_exists = ls_key_exists;
exports.default = typeof window == "undefined" || typeof window.localStorage === "undefined" ? null : localStorage;