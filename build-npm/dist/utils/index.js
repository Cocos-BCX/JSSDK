'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.get_translation_parts = exports.getRandomKey = exports.balancesToObject = exports.decryptMemo = exports.encryptMemo = exports.calcPortfolioData = exports.calcPercentChange = exports.formatPrices = exports.getPrices = exports.myTrim = exports.arrayToObject = exports.testNodesPings = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bcxjsCores = require('bcxjs-cores');

var _nodesManager = require('../services/api/nodes-manager');

var _nodesManager2 = _interopRequireDefault(_nodesManager);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var testNodesPings = exports.testNodesPings = function _callee(nodes) {
  var ws_node_list, testNodes;
  return _regenerator2.default.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:

          // return new Promise(resolve=>{
          //     var pingWorker = require("bcl-worker-loader?name=pingWorker.js!../services/workers/pingWorker.js")
          //     var worker = new pingWorker;
          //     worker.postMessage({
          //       nodes
          //     });

          //     worker.onmessage = event => {
          //       var res = event.data;
          //       console.info("res",res);
          //       resolve(res);
          //     }
          // })
          // nodes=nodes.filter(item=>item.url!=selectedNode.url)
          ws_node_list = {};

          nodes.forEach(function (node) {
            ws_node_list[node.url] = { location: node.name };
          });

          _context.next = 4;
          return _regenerator2.default.awrap(new _nodesManager2.default({
            nodes: ws_node_list,
            defaultNode: ""
          }).testNodesPings());

        case 4:
          testNodes = _context.sent;
          return _context.abrupt('return', testNodes);

        case 6:
        case 'end':
          return _context.stop();
      }
    }
  }, null, undefined);
};
/**
 * Return object with keys = id of each element of array (element.id)
 * @param {Array} array - array of data elements
 */
var arrayToObject = exports.arrayToObject = function arrayToObject(array) {
  var obj = {};
  array.forEach(function (item) {
    obj[item.id] = item;
    obj[item.symbol] = item;
  });
  return obj;
};

var myTrim = exports.myTrim = function myTrim(str) {
  return x.replace(/^\s+|\s+$/gm, '');
};

/**
 * Returns array containing first and last history prices of asset.
 * @param {Array} history - array with asset's history data
 */
var getPrices = exports.getPrices = function getPrices(history) {
  if (!history.length) return { first: 0, last: 0 };
  var startElem = history[0];
  var endElem = history[history.length - 1];
  var startPrice = startElem.open_base / startElem.open_quote;
  var endPrice = endElem.close_base / endElem.close_quote;
  return { first: startPrice, last: endPrice };
};

/**
 * Returns formatted prices for array calculated taking precision of assets into account
 * @param {Object} prices - object with asset's history prices
 * @param {number} prices.first - first price of asset history
 * @param {number} prices.last - last price of asset history (current)
 * @param {Object} base - base asset object
 * @param {Object} quote - quote asset object
 */
var formatPrices = exports.formatPrices = function formatPrices(prices, base, quote) {
  var precisionDiff = base.precision - quote.precision;
  if (precisionDiff > 0) {
    // prices.first /= (precisionDiff * 10);
    // prices.last /= (precisionDiff * 10);
    prices.first /= Math.pow(10, precisionDiff);
    prices.last /= Math.pow(10, precisionDiff);

    // prices.last /= (precisionDiff * 10);
  } else if (precisionDiff < 0) {
    // prices.first = prices.first * 10 * precisionDiff;
    // prices.last = prices.last * 10 * precisionDiff;
    prices.first = prices.first * Math.pow(10, precisionDiff);
    prices.last = prices.last * Math.pow(10, precisionDiff);
  }

  prices.change = Math.floor(prices.last / prices.first * 100 - 100);
  prices.first = Math.abs(prices.first);
  prices.last = Math.abs(prices.last);
  return prices;
};

/**
 * Returns amount of change by percent, calculated by prices history and exchange multiplier
 * @param {Object} object.prices - object with asset's history prices
 * @param {number} object.prices.first - first price of asset history
 * @param {number} object.prices.last - last price of asset history (current)
 * @param {Object} object.multiplier - object with base -> fiat exchange rates
 * @param {number} object.multiplier.first - multiplier for first history price
 * @param {number} object.multiplier.last - multiplier for last history price (current)
 */
var calcPercentChange = exports.calcPercentChange = function calcPercentChange(prices, multiplier) {
  return prices.first * multiplier.first / (prices.last * multiplier.last) * 100 - 100;
};

/**
 * Returns object with balance in base currency, balance in fiat currency
  and change by percent
 * @param {Object} object - object containing data for calculation
 * @param {number} object.balance - balance of asset
 * @param {Object} object.assetPrices - object with asset's history prices
 * @param {number} object.assetPrices.first - first price of asset history
 * @param {number} object.assetPrices.last - last price of asset history (current)
 * @param {Object} object.fiatMultiplier - object with base -> fiat exchange rates
 * @param {number} object.fiatMultiplier.first - multiplier for first history price
 * @param {number} object.fiatMultiplier.last - multiplier for last history price (current)
 * @param {Boolean} object.isBase - the asset for calculation is base asset
 * @param {Boolean} object.isFiat - the asset for calculation is fiat asset
 */
var calcPortfolioData = exports.calcPortfolioData = function calcPortfolioData(_ref) {
  var balance = _ref.balance,
      assetPrices = _ref.assetPrices,
      fiatMultiplier = _ref.fiatMultiplier,
      isBase = _ref.isBase,
      isFiat = _ref.isFiat;

  var multiplier = fiatMultiplier;
  var prices = assetPrices;
  if (isFiat) multiplier = { first: 1, last: 1 };
  if (isBase) prices = { first: 1, last: 1 };
  var balanceBase = balance * prices.last;
  var balanceFiat = balanceBase * multiplier.last;
  var change = calcPercentChange(prices, multiplier);
  if (prices.last === prices.first && !isBase) change = 0;
  return { balanceBase: balanceBase, balanceFiat: balanceFiat, change: change };
};

var encryptMemo = exports.encryptMemo = function encryptMemo(memo, fromKey, toPubkey) {
  var nonce = _bcxjsCores.TransactionHelper.unique_nonce_uint64();
  var activePubkey = fromKey.toPublicKey().toPublicKeyString();

  var message = _bcxjsCores.Aes.encrypt_with_checksum(fromKey, toPubkey, nonce, memo);

  return {
    from: activePubkey,
    to: toPubkey,
    nonce: nonce,
    message: message
  };
};

var decryptMemo = exports.decryptMemo = function decryptMemo(memo, privateKey) {
  return _bcxjsCores.Aes.decrypt_with_checksum(privateKey, memo.from, memo.nonce, memo.message).toString('utf-8');
};

var balancesToObject = exports.balancesToObject = function balancesToObject(balancesArr) {
  var obj = {};
  balancesArr.forEach(function (item) {
    obj[item.asset_type] = item;
  });
  return obj;
};

var getRandomKey = exports.getRandomKey = function getRandomKey() {
  return _bcxjsCores.key.get_random_key();
};

var get_translation_parts = exports.get_translation_parts = function get_translation_parts(str) {
  var result = [];
  var toReplace = {};
  var re = /\((.*?)\)/g;
  var interpolators = str.split(re);
  return str.split(re);
};

Date.prototype.format = function (format) {
  if (!format) return "";
  var o = {
    "M+": this.getMonth() + 1, // month
    "d+": this.getDate(), // day
    "H+": this.getHours(), // hour
    "m+": this.getMinutes(), // minute
    "s+": this.getSeconds(), // second
    "q+": Math.floor((this.getMonth() + 3) / 3), // quarter
    "S": this.getMilliseconds()
    // millisecond
  };
  if (/(y+)/.test(format)) format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o) {
    if (new RegExp("(" + k + ")").test(format)) format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
  }return format;
};