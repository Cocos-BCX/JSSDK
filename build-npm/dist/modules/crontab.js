'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _api = require('../services/api');

var _api2 = _interopRequireDefault(_api);

var _mutations2 = require('../mutations');

var types = _interopRequireWildcard(_mutations2);

var _helper = require('../lib/common/helper');

var _helper2 = _interopRequireDefault(_helper);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var initialState = {
    crontab: null
};

var actions = {
    setCrontab: function setCrontab(_ref, params) {
        var commit = _ref.commit;

        commit(types.SET_CRONTAB, params);
    },
    queryCrontabs: function queryCrontabs(store, params) {
        params.includeNormal = !!params.includeNormal;
        params.includeFail = !!params.includeFail;
        return _api2.default.Other.listAccountCrontabs(params, store);
    },
    cancelCrontabs: function cancelCrontabs(_ref2, params) {
        var dispatch = _ref2.dispatch;

        var account, crontabId, _params$onlyGetFee, onlyGetFee, c_res;

        return _regenerator2.default.async(function cancelCrontabs$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _helper2.default.trimParams(params);

                        if (params) {
                            _context.next = 3;
                            break;
                        }

                        return _context.abrupt('return', { code: 101, message: "Crontab parameter is missing" });

                    case 3:
                        account = params.account, crontabId = params.crontabId, _params$onlyGetFee = params.onlyGetFee, onlyGetFee = _params$onlyGetFee === undefined ? false : _params$onlyGetFee;
                        _context.next = 6;
                        return _regenerator2.default.awrap(_api2.default.Explorer.getDataByIds([crontabId]));

                    case 6:
                        c_res = _context.sent;

                        if (c_res.length) {
                            _context.next = 9;
                            break;
                        }

                        return _context.abrupt('return', { code: 177, message: 'crontabId [' + crontabId + '] not found' });

                    case 9:
                        return _context.abrupt('return', dispatch('transactions/_transactionOperations', {
                            operations: [{
                                op_type: 61,
                                type: "crontab_cancel",
                                params: {
                                    fee_paying_account: account.id,
                                    task: crontabId
                                }
                            }],
                            onlyGetFee: onlyGetFee
                        }, { root: true }));

                    case 10:
                    case 'end':
                        return _context.stop();
                }
            }
        }, null, undefined);
    },
    crontabRecover: function crontabRecover(_ref3, params) {
        var dispatch = _ref3.dispatch;

        var account, crontabId, restartTime, _params$onlyGetFee2, onlyGetFee, c_res, time;

        return _regenerator2.default.async(function crontabRecover$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        _helper2.default.trimParams(params);

                        if (params) {
                            _context2.next = 3;
                            break;
                        }

                        return _context2.abrupt('return', { code: 101, message: "Crontab parameter is missing" });

                    case 3:
                        account = params.account, crontabId = params.crontabId, restartTime = params.restartTime, _params$onlyGetFee2 = params.onlyGetFee, onlyGetFee = _params$onlyGetFee2 === undefined ? false : _params$onlyGetFee2;
                        _context2.next = 6;
                        return _regenerator2.default.awrap(_api2.default.Explorer.getDataByIds([crontabId]));

                    case 6:
                        c_res = _context2.sent;

                        if (c_res.length) {
                            _context2.next = 9;
                            break;
                        }

                        return _context2.abrupt('return', { code: 177, message: 'crontabId [' + crontabId + '] not found' });

                    case 9:
                        if (!(restartTime == undefined)) {
                            _context2.next = 11;
                            break;
                        }

                        return _context2.abrupt('return', { code: 101, message: "Crontab parameter is missing" });

                    case 11:
                        restartTime = parseInt(restartTime);

                        if (!isNaN(restartTime)) {
                            _context2.next = 14;
                            break;
                        }

                        return _context2.abrupt('return', { code: 1011, message: "Parameter error" });

                    case 14:
                        if (!(restartTime <= 0)) {
                            _context2.next = 16;
                            break;
                        }

                        return _context2.abrupt('return', { code: 176, message: "Crontab must have parameters greater than 0" });

                    case 16:
                        _context2.next = 18;
                        return _regenerator2.default.awrap(_api2.default.Explorer.getDynGlobalObject(false));

                    case 18:
                        time = _context2.sent.data.time;

                        restartTime = Math.floor((new Date(time + "Z").getTime() + restartTime) / 1000);
                        return _context2.abrupt('return', dispatch('transactions/_transactionOperations', {
                            operations: [{
                                op_type: 62,
                                type: "crontab_recover",
                                params: {
                                    crontab_owner: account.id,
                                    crontab: crontabId,
                                    restart_time: restartTime
                                }
                            }],
                            onlyGetFee: onlyGetFee
                        }, { root: true }));

                    case 21:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, null, undefined);
    }
};

var mutations = (0, _defineProperty3.default)({}, types.SET_CRONTAB, function (state, params) {
    state.crontab = params;
});
exports.default = {
    state: initialState,
    actions: actions,
    //getters,
    mutations: mutations,
    namespaced: true
};