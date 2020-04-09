'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _localStorageImpl = require('./localStorageImpl');

var _localStorageImpl2 = _interopRequireDefault(_localStorageImpl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// if (null === ls) throw "localStorage is required but isn't available on this platform";

exports.default = function (key) {
    var STORAGE_KEY = key;
    if (null === _localStorageImpl2.default) {
        return null;
    }
    return {
        get: function get(key) {
            var dv = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            var rv = void 0;
            if ((0, _localStorageImpl.ls_key_exists)(STORAGE_KEY + key, _localStorageImpl2.default)) {
                rv = JSON.parse(_localStorageImpl2.default.getItem(STORAGE_KEY + key));
            }
            return rv ? rv : dv;
        },
        set: function set(key, object) {
            if (object && object.toJS) {
                object = object.toJS();
            }
            _localStorageImpl2.default.setItem(STORAGE_KEY + key, (0, _stringify2.default)(object));
        },
        remove: function remove(key) {
            _localStorageImpl2.default.removeItem(STORAGE_KEY + key);
        },
        has: function has(key) {
            return (0, _localStorageImpl.ls_key_exists)(STORAGE_KEY + key, _localStorageImpl2.default);
        }
    };
};