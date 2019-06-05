"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _bcxjsCores = require("bcxjs-cores");

var _immutable = require("immutable");

var _immutable2 = _interopRequireDefault(_immutable);

var _api = require("../../services/api");

var _api2 = _interopRequireDefault(_api);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var KeyAuth = function KeyAuth(auth) {
    var _this = this;

    this.id = auth.toJS ? auth.get(0) : auth[0];
    this.weight = auth.toJS ? auth.get(1) : auth[1];

    this.isAvailable = function (auths) {
        return auths.includes ? auths.includes(_this.id) : auths.indexOf(_this) !== -1;
    };
};

var permissionUtils = {

    AccountPermission: function AccountPermission(account, weight, type) {
        var _this2 = this;

        this.id = account.get("id");
        this.account_name = account.get("name");
        this.weight = weight;
        this.threshold = account.getIn([type, "weight_threshold"]);
        // console.info("account",type,JSON.parse(JSON.stringify(account)));
        this.accounts = [];
        this.keys = account.getIn([type, "key_auths"]).map(function (auth) {
            return new KeyAuth(auth);
        }).toArray();
        this.isAvailable = function (auths) {
            return auths.includes ? auths.includes(_this2.id) : auths.indexOf(_this2) !== -1;
        };

        this._sumWeights = function (auths) {

            if (!_this2.isNested() && !_this2.isMultiSig()) {
                return _this2.isAvailable(auths) ? _this2.weight : 0;
            } else {
                var sum = _this2.accounts.reduce(function (status, account) {
                    return status + (account._sumWeights(auths) ? account.weight : 0);
                }, 0);
                return Math.floor(sum / _this2.threshold);
            }
        };
        this.getStatus = function (auths, keyAuths) {
            if (!_this2.isNested()) {
                var sum = _this2._sumWeights(auths);

                if (_this2.isMultiSig()) {
                    sum += _this2.sumKeys(keyAuths);
                }
                return sum;
            } else {
                var _sum = _this2.accounts.reduce(function (status, account) {
                    return status + account._sumWeights(auths);
                }, 0);

                if (_this2.keys.length) {
                    _sum += _this2.sumKeys(keyAuths);
                }

                return _sum;
            }
        };

        this.sumKeys = function (keyAuths) {
            var keySum = _this2.keys.reduce(function (s, key) {
                return s + (key.isAvailable(keyAuths) ? key.weight : 0);
            }, 0);
            return keySum;
        };

        this.isNested = function () {
            return _this2.accounts.length > 0;
        };

        this.isMultiSig = function () {
            return _this2.keys.reduce(function (final, key) {
                return final || key.weight < _this2.threshold;
            }, false);
        };

        this.getMissingSigs = function (auths) {
            var missing = [];
            var nested = [];
            if (_this2.isNested()) {
                nested = _this2.accounts.reduce(function (a, account) {
                    return a.concat(account.getMissingSigs(auths));
                }, []);
            } else if (!_this2.isAvailable(auths)) {
                missing.push(_this2.id);
            }

            return missing.concat(nested);
        };

        this.getMissingKeys = function (auths) {
            var missing = [];
            var nested = [];
            if (_this2.keys.length && (_this2.isNested() || _this2.isMultiSig())) {
                _this2.keys.forEach(function (key) {
                    if (!key.isAvailable(auths)) {
                        missing.push(key.id);
                    }
                });
            }

            if (_this2.isNested()) {
                nested = _this2.accounts.reduce(function (a, account) {
                    return a.concat(account.getMissingKeys(auths));
                }, []);
            };

            return missing.concat(nested);
        };
    },

    listToIDs: function listToIDs(accountList) {
        var allAccounts = [];
        accountList.forEach(function (account) {
            if (account) {
                allAccounts.push(account.id ? account.id : account);
            }
        });

        return allAccounts;
    },

    unravel: function unravel(accountPermission, type) {
        var _this3 = this;

        var recursive_count = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        var account;
        return _regenerator2.default.async(function unravel$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        if (!(recursive_count < 3)) {
                            _context2.next = 9;
                            break;
                        }

                        _context2.t0 = _immutable2.default;
                        _context2.next = 4;
                        return _regenerator2.default.awrap(_api2.default.Account.getAccount(accountPermission.id, false));

                    case 4:
                        _context2.t1 = _context2.sent.data.account;
                        account = _context2.t0.fromJS.call(_context2.t0, _context2.t1);

                        if (!(account && account.getIn([type, "account_auths"]).size)) {
                            _context2.next = 9;
                            break;
                        }

                        _context2.next = 9;
                        return _regenerator2.default.awrap(_promise2.default.all(account.getIn([type, "account_auths"]).map(function _callee(auth) {
                            var nestedAccount;
                            return _regenerator2.default.async(function _callee$(_context) {
                                while (1) {
                                    switch (_context.prev = _context.next) {
                                        case 0:
                                            _context.next = 2;
                                            return _regenerator2.default.awrap(_api2.default.Account.getAccount(auth.get(0), false));

                                        case 2:
                                            nestedAccount = _context.sent.data.account;

                                            if (!nestedAccount) {
                                                _context.next = 9;
                                                break;
                                            }

                                            _context.t0 = accountPermission.accounts;
                                            _context.next = 7;
                                            return _regenerator2.default.awrap(_this3.unravel(new _this3.AccountPermission(_immutable2.default.fromJS(nestedAccount), auth.get(1), type), type, recursive_count + 1));

                                        case 7:
                                            _context.t1 = _context.sent;

                                            _context.t0.push.call(_context.t0, _context.t1);

                                        case 9:
                                            return _context.abrupt("return", true);

                                        case 10:
                                        case "end":
                                            return _context.stop();
                                    }
                                }
                            }, null, _this3);
                        })));

                    case 9:
                        return _context2.abrupt("return", accountPermission);

                    case 10:
                    case "end":
                        return _context2.stop();
                }
            }
        }, null, this);
    },


    unnest: function unnest(accounts, type) {
        var _this4 = this;

        return _promise2.default.all(accounts.map(function _callee2(id) {
            var fullAccount, currentPermission;
            return _regenerator2.default.async(function _callee2$(_context3) {
                while (1) {
                    switch (_context3.prev = _context3.next) {
                        case 0:
                            _context3.next = 2;
                            return _regenerator2.default.awrap(_api2.default.Account.getAccount(id, false));

                        case 2:
                            fullAccount = _context3.sent.data.account;
                            _context3.next = 5;
                            return _regenerator2.default.awrap(_this4.unravel(new _this4.AccountPermission(_immutable2.default.fromJS(fullAccount), null, type), type));

                        case 5:
                            currentPermission = _context3.sent;
                            return _context3.abrupt("return", currentPermission);

                        case 7:
                        case "end":
                            return _context3.stop();
                    }
                }
            }, null, _this4);
        }));
    },

    flatten_auths: function flatten_auths(auths) {
        var existingAuths = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _immutable2.default.List();

        if (!auths.size) {
            return existingAuths;
        }

        auths.forEach(function (owner) {
            if (!existingAuths.includes(owner.get(0))) {
                existingAuths = existingAuths.push(owner.get(0));
            }
        });
        return existingAuths;
    }
};

exports.default = permissionUtils;