"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

var _jsCookie = require("js-cookie");

var _jsCookie2 = _interopRequireDefault(_jsCookie);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _host = (true ? window.location.host : "GPH") + "_" + "1.4";
// Persistent Storage for data cache management
var PersistentStorage = {
  saveUserData: function saveUserData(_ref) {
    var id = _ref.id,
        encrypted_key = _ref.encrypted_key,
        encryptionKey = _ref.encryptionKey,
        passwordPubkey = _ref.passwordPubkey,
        activePubkey = _ref.activePubkey;

    _jsCookie2.default.set(_host + 'GPH_USER_ID', id, { expires: 365 });
    _jsCookie2.default.set(_host + 'GPH_USER_ENCRYPTED_KEY', encrypted_key, { expires: 365 });
    _jsCookie2.default.set(_host + 'GPH_ENCRYPTION_KEY', encryptionKey, { expires: 365 });
    _jsCookie2.default.set(_host + 'GPH_PASSWORD_PUBKEY', passwordPubkey, { expires: 365 });
    _jsCookie2.default.set(_host + 'GPH_ACTIVE_PUBKEY', activePubkey, { expires: 365 });
  },
  getSavedUserData: function getSavedUserData() {
    var userId = _jsCookie2.default.get(_host + 'GPH_USER_ID');
    var encrypted_key = _jsCookie2.default.get(_host + 'GPH_USER_ENCRYPTED_KEY');
    var encryptionKey = _jsCookie2.default.get(_host + 'GPH_ENCRYPTION_KEY');
    var backupDate = _jsCookie2.default.get(_host + 'BACKUP_DATE');
    var passwordPubkey = _jsCookie2.default.get(_host + 'GPH_PASSWORD_PUBKEY');
    var activePubkey = _jsCookie2.default.get(_host + 'GPH_ACTIVE_PUBKEY');
    if (!userId || !encrypted_key || !encryptionKey || !passwordPubkey) return null;
    if (typeof userId !== 'string') return null;
    return {
      userId: userId,
      encrypted_key: encrypted_key,
      encryptionKey: encryptionKey,
      backupDate: backupDate,
      passwordPubkey: passwordPubkey,
      activePubkey: activePubkey
    };
  },
  clearUserData: function clearUserData() {
    _jsCookie2.default.remove(_host + 'GPH_USER_ID');
    _jsCookie2.default.remove(_host + 'GPH_USER_ENCRYPTED_KEY');
    _jsCookie2.default.remove(_host + 'GPH_ENCRYPTION_KEY');
    _jsCookie2.default.remove(_host + 'BACKUP_DATE');
    _jsCookie2.default.remove(_host + 'GPH_PASSWORD_PUBKEY');
    _jsCookie2.default.remove(_host + 'GPH_ACTIVE_PUBKEY');
  },
  clearNodesData: function clearNodesData() {
    _jsCookie2.default.remove(_host + 'GPH_NODES');
  },
  saveNodesData: function saveNodesData(_ref2) {
    var data = _ref2.data;

    _jsCookie2.default.set(_host + 'GPH_NODES', data);
  },
  getSavedNodesData: function getSavedNodesData() {
    var cachedData = _jsCookie2.default.getJSON(_host + 'GPH_NODES');
    if ((typeof cachedData === "undefined" ? "undefined" : (0, _typeof3.default)(cachedData)) === 'object' && cachedData !== null) {
      return cachedData;
    }
    return {};
  },
  saveBackupDate: function saveBackupDate(_ref3) {
    var date = _ref3.date,
        userId = _ref3.userId;

    var backupDateArray = _jsCookie2.default.get(_host + 'BACKUP_DATE');
    if (backupDateArray === undefined) {
      backupDateArray = [{ userId: userId, date: date }];
    } else {
      try {
        var backupDateFromString = JSON.parse(backupDateArray);
        var foundObj = backupDateFromString.some(function (item) {
          return item.userId === userId;
        });
        if (!foundObj) {
          backupDateFromString.push({ userId: userId, date: date });
          backupDateArray = (0, _stringify2.default)(backupDateFromString);
        }
      } catch (ex) {
        backupDateArray = [{ userId: userId, date: date }];
      }
    }
    _jsCookie2.default.set(_host + 'BACKUP_DATE', backupDateArray, { expires: 365 });
  }
};

exports.default = PersistentStorage;