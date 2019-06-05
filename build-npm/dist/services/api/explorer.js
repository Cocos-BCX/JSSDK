'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getTransactionById = exports.getDataByIds = exports.getWitnessName = exports.getDynGlobalObject = exports.getGlobalObject = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bcxjsWs = require('bcxjs-ws');

var _bcxjsCores = require('bcxjs-cores');

var _api = require('../api');

var _api2 = _interopRequireDefault(_api);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getGlobalObject = exports.getGlobalObject = function _callee() {
    var response;
    return _regenerator2.default.async(function _callee$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    _context.prev = 0;
                    response = _bcxjsCores.ChainStore.getObject("2.0.0");

                    if (!response) {
                        _context.next = 6;
                        break;
                    }

                    response = response.toJS();
                    _context.next = 10;
                    break;

                case 6:
                    _context.next = 8;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('get_objects', [["2.0.0"]]));

                case 8:
                    response = _context.sent;

                    if (response.length) response = response[0];

                case 10:
                    if (!response) {
                        _context.next = 12;
                        break;
                    }

                    return _context.abrupt('return', {
                        code: 1,
                        data: response
                    });

                case 12:
                    return _context.abrupt('return', {
                        code: 102,
                        message: "Getting 'GlobalObject' failed，The network is busy, please check your network connection"
                    });

                case 15:
                    _context.prev = 15;
                    _context.t0 = _context['catch'](0);
                    return _context.abrupt('return', {
                        code: 0,
                        message: _context.t0.message
                    });

                case 18:
                case 'end':
                    return _context.stop();
            }
        }
    }, null, undefined, [[0, 15]]);
};

var getDynGlobalObject = exports.getDynGlobalObject = function _callee2() {
    var isExec = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    var isReqWitness = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var response;
    return _regenerator2.default.async(function _callee2$(_context2) {
        while (1) {
            switch (_context2.prev = _context2.next) {
                case 0:
                    _context2.prev = 0;

                    //let response=await Apis.instance().db_api().exec('get_objects',[["2.1.0"]])
                    response = _bcxjsCores.ChainStore.getObject("2.1.0", false, true, false, false);

                    if (response) {
                        try {
                            response = response.toJS();
                        } catch (e) {}
                    }

                    if (!(!response || isExec)) {
                        _context2.next = 9;
                        break;
                    }

                    _context2.next = 6;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('get_objects', [["2.1.0"]]));

                case 6:
                    response = _context2.sent;

                    response = response[0];
                    response.chainTimeOffset = _bcxjsCores.ChainStore.getEstimatedChainTimeOffset();

                case 9:
                    if (!isReqWitness) {
                        _context2.next = 13;
                        break;
                    }

                    _context2.next = 12;
                    return _regenerator2.default.awrap(getWitnessName(response.current_witness));

                case 12:
                    response.current_witness_name = _context2.sent;

                case 13:
                    return _context2.abrupt('return', { code: 1, data: response });

                case 16:
                    _context2.prev = 16;
                    _context2.t0 = _context2['catch'](0);
                    return _context2.abrupt('return', {
                        code: 0,
                        message: _context2.t0.message
                    });

                case 19:
                case 'end':
                    return _context2.stop();
            }
        }
    }, null, undefined, [[0, 16]]);
};

var getWitnessName = exports.getWitnessName = function _callee3(witness_id) {
    var current, witness_account, bp_acc_res;
    return _regenerator2.default.async(function _callee3$(_context3) {
        while (1) {
            switch (_context3.prev = _context3.next) {
                case 0:
                    current = _bcxjsCores.ChainStore.getObject(witness_id);
                    witness_account = "";

                    if (!current) {
                        _context3.next = 6;
                        break;
                    }

                    witness_account = current.get("witness_account");
                    _context3.next = 10;
                    break;

                case 6:
                    _context3.next = 8;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('get_objects', [[witness_id]]));

                case 8:
                    current = _context3.sent;

                    if (current && current[0]) {
                        witness_account = current[0].witness_account;
                    }

                case 10:
                    if (!witness_account) {
                        _context3.next = 16;
                        break;
                    }

                    _context3.next = 13;
                    return _regenerator2.default.awrap(_api2.default.Account.getAccount(witness_account, true));

                case 13:
                    bp_acc_res = _context3.sent;

                    if (!(bp_acc_res.code == 1)) {
                        _context3.next = 16;
                        break;
                    }

                    return _context3.abrupt('return', bp_acc_res.data.account.name);

                case 16:
                    return _context3.abrupt('return', witness_id);

                case 17:
                case 'end':
                    return _context3.stop();
            }
        }
    }, null, undefined);
};

var getDataByIds = exports.getDataByIds = function _callee4(ids) {
    var response;
    return _regenerator2.default.async(function _callee4$(_context4) {
        while (1) {
            switch (_context4.prev = _context4.next) {
                case 0:
                    _context4.prev = 0;
                    _context4.next = 3;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('get_objects', [ids]));

                case 3:
                    response = _context4.sent;

                    if (response) {
                        response = response.filter(function (res) {
                            return res != null;
                        });
                    } else {
                        response = [];
                    }
                    return _context4.abrupt('return', { code: 1, data: response });

                case 8:
                    _context4.prev = 8;
                    _context4.t0 = _context4['catch'](0);
                    return _context4.abrupt('return', {
                        code: 0,
                        message: _context4.t0.message,
                        error: _context4.t0
                    });

                case 11:
                case 'end':
                    return _context4.stop();
            }
        }
    }, null, undefined, [[0, 8]]);
};

var getTransactionById = exports.getTransactionById = function _callee5(trx_id) {
    var response, block, message;
    return _regenerator2.default.async(function _callee5$(_context5) {
        while (1) {
            switch (_context5.prev = _context5.next) {
                case 0:
                    _context5.prev = 0;
                    _context5.next = 3;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('get_transaction_by_id', [trx_id]));

                case 3:
                    response = _context5.sent;

                    if (!response) {
                        _context5.next = 10;
                        break;
                    }

                    _context5.next = 7;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec("get_transaction_in_block_info", [trx_id]));

                case 7:
                    block = _context5.sent;

                    response.block_num = block.block_num;
                    return _context5.abrupt('return', {
                        code: 1,
                        data: response
                    });

                case 10:
                    return _context5.abrupt('return', {
                        code: 104,
                        message: trx_id + ' not found'
                    });

                case 13:
                    _context5.prev = 13;
                    _context5.t0 = _context5['catch'](0);
                    message = _context5.t0.message;
                    return _context5.abrupt('return', {
                        code: 0,
                        message: message,
                        error: _context5.t0
                    });

                case 17:
                case 'end':
                    return _context5.stop();
            }
        }
    }, null, undefined, [[0, 13]]);
};

exports.default = {
    getGlobalObject: getGlobalObject,
    getDynGlobalObject: getDynGlobalObject,
    getTransactionById: getTransactionById,
    getWitnessName: getWitnessName,
    getDataByIds: getDataByIds
};