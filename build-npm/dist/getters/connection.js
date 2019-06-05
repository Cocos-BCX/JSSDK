"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isWsConnected = isWsConnected;
exports.wsConnecting = wsConnecting;
function isWsConnected(state) {
  return state.wsConnected;
}

function wsConnecting(state) {
  return state.wsConnecting;
}