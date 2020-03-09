"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _asset_constants = require("../chain/asset_constants.js");

var _asset_constants2 = _interopRequireDefault(_asset_constants);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var AssetUtils = function () {
    function AssetUtils() {
        (0, _classCallCheck3.default)(this, AssetUtils);
    }

    (0, _createClass3.default)(AssetUtils, null, [{
        key: "getFlagBooleans",
        value: function getFlagBooleans(mask) {
            var isBitAsset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            var booleans = {
                charge_market_fee: false,
                white_list: false,
                override_authority: false,
                transfer_restricted: false,
                disable_force_settle: false,
                global_settle: false,
                disable_issuer: true,
                // disable_confidential: false,
                witness_fed_asset: false,
                committee_fed_asset: false
            };

            if (mask === "all") {
                for (var flag in booleans) {
                    if (!isBitAsset && _asset_constants2.default.uia_permission_mask.indexOf(flag) === -1) {
                        delete booleans[flag];
                    } else {
                        booleans[flag] = true;
                    }
                }
                return booleans;
            }

            for (var _flag in booleans) {
                if (!isBitAsset && _asset_constants2.default.uia_permission_mask.indexOf(_flag) === -1) {
                    delete booleans[_flag];
                } else {
                    // console.info("mask",mask,assetConstants.permission_flags[flag],mask & assetConstants.permission_flags[flag])
                    if (mask & _asset_constants2.default.permission_flags[_flag]) {
                        booleans[_flag] = true;
                    }
                }
            }

            return booleans;
        }
    }, {
        key: "getFlags",
        value: function getFlags(flagBooleans) {
            var keys = (0, _keys2.default)(_asset_constants2.default.permission_flags);

            var flags = 0;

            keys.forEach(function (key) {
                if (flagBooleans[key] && key !== "global_settle") {
                    flags += _asset_constants2.default.permission_flags[key];
                }
            });

            return flags;
        }
    }, {
        key: "getPermissions",
        value: function getPermissions(flagBooleans) {
            var isBitAsset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

            var permissions = isBitAsset ? (0, _keys2.default)(_asset_constants2.default.permission_flags) : _asset_constants2.default.uia_permission_mask;
            var flags = 0;
            permissions.forEach(function (permission) {
                if (flagBooleans[permission] && permission !== "global_settle") {
                    flags += _asset_constants2.default.permission_flags[permission];
                }
            });

            if (isBitAsset) {
                flags += _asset_constants2.default.permission_flags["global_settle"];
            }

            return flags;
        }
    }, {
        key: "parseDescription",
        value: function parseDescription(description) {
            var parsed = void 0;
            try {
                parsed = JSON.parse(description);
            } catch (error) {}

            return parsed ? parsed : { main: description };
        }
    }]);
    return AssetUtils;
}();

exports.default = AssetUtils;