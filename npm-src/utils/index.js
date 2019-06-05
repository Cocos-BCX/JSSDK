import { Aes, TransactionHelper,key } from 'bcxjs-cores';

/**
 * Return object with keys = id of each element of array (element.id)
 * @param {Array} array - array of data elements
 */
export const arrayToObject = (array) => {
  const obj = {};
  array.forEach(item => {
    obj[item.id] = item;
    obj[item.symbol]=item;
  });
  return obj;
};

export const myTrim=str=>{
  return x.replace(/^\s+|\s+$/gm,'');
}

/**
 * Returns array containing first and last history prices of asset.
 * @param {Array} history - array with asset's history data
 */
export const getPrices = (history) => {
  if (!history.length) return { first: 0, last: 0 };
  const startElem = history[0];
  const endElem = history[history.length - 1];
  const startPrice = startElem.open_base / startElem.open_quote;
  const endPrice = endElem.close_base / endElem.close_quote;
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
export const formatPrices = (prices, base, quote) => {
  const precisionDiff = base.precision - quote.precision;
  if (precisionDiff > 0) {
    // prices.first /= (precisionDiff * 10);
    // prices.last /= (precisionDiff * 10);
    prices.first /= (Math.pow(10,precisionDiff));
    prices.last /= (Math.pow(10,precisionDiff));

    // prices.last /= (precisionDiff * 10);
  } else if (precisionDiff < 0) {
    // prices.first = prices.first * 10 * precisionDiff;
    // prices.last = prices.last * 10 * precisionDiff;
    prices.first = prices.first *Math.pow(10,precisionDiff);
    prices.last = prices.last * Math.pow(10,precisionDiff);
  }

  prices.change = Math.floor(((prices.last / prices.first) * 100) - 100);
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
export const calcPercentChange = (prices, multiplier) => {
  return ((((prices.first * multiplier.first) /
      (prices.last * multiplier.last)) * 100) - 100);
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
export const calcPortfolioData = ({
  balance, assetPrices, fiatMultiplier,
  isBase, isFiat
}) => {
  let multiplier = fiatMultiplier;
  let prices = assetPrices;
  if (isFiat) multiplier = { first: 1, last: 1 };
  if (isBase) prices = { first: 1, last: 1 };
  const balanceBase = balance * prices.last;
  const balanceFiat = balanceBase * multiplier.last;
  let change = calcPercentChange(prices, multiplier);
  if (prices.last === prices.first && !isBase) change = 0;
  return { balanceBase, balanceFiat, change };
};

export const encryptMemo = (memo, fromKey, toPubkey) => {
  const nonce = TransactionHelper.unique_nonce_uint64();
  const activePubkey = fromKey.toPublicKey().toPublicKeyString();
  
  const message = Aes.encrypt_with_checksum(
    fromKey,
    toPubkey,
    nonce,
    memo
  );

  return {
    from: activePubkey,
    to: toPubkey,
    nonce,
    message
  };
};

export const decryptMemo = (memo, privateKey) => {
  return Aes.decrypt_with_checksum(
    privateKey,
    memo.from,
    memo.nonce,
    memo.message
  ).toString('utf-8');
};

export const balancesToObject = (balancesArr) => {
  const obj = {};
  balancesArr.forEach(item => {
    obj[item.asset_type] = item;
  });
  return obj;
};

export const getRandomKey=()=>{
    return key.get_random_key();
}

export const get_translation_parts=str=> {
  let result = [];
  let toReplace = {};
  let re = /\((.*?)\)/g;
  let interpolators = str.split(re);
  return str.split(re);
}


Date.prototype.format = function (format) {
  var o = {
      "M+": this.getMonth() + 1, // month
      "d+": this.getDate(), // day
      "H+": this.getHours(), // hour
      "m+": this.getMinutes(), // minute
      "s+": this.getSeconds(), // second
      "q+": Math.floor((this.getMonth() + 3) / 3), // quarter
      "S": this.getMilliseconds()
      // millisecond
  }
  if (/(y+)/.test(format))
      format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
      if (new RegExp("(" + k + ")").test(format))
          format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
  return format;
}