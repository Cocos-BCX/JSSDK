'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bcxjsWs = require('bcxjs-ws');

var _api = require('../api');

var _api2 = _interopRequireDefault(_api);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var formatCrontabs = function _callee(items, store) {
    var list, item, i, _item, task_owner, timed_transaction, last_execte_time;

    return _regenerator2.default.async(function _callee$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    list = [];
                    item = void 0;
                    i = 0;

                case 3:
                    if (!(i < items.length)) {
                        _context.next = 22;
                        break;
                    }

                    item = items[i];
                    _item = item, task_owner = _item.task_owner, timed_transaction = _item.timed_transaction, last_execte_time = _item.last_execte_time;
                    _context.next = 8;
                    return _regenerator2.default.awrap(_api2.default.Account.getAccount(task_owner, true));

                case 8:
                    item.task_owner_name = _context.sent.data.account.name;
                    _context.next = 11;
                    return _regenerator2.default.awrap(_api2.default.Operations.parseOperations({
                        operations: [{ op: timed_transaction.operations[0] }],
                        userId: task_owner,
                        store: store
                    }));

                case 11:
                    item.task_parse_ops = _context.sent;

                    item.task_parse_ops = item.task_parse_ops.operations[0];
                    delete item.task_parse_ops.block_num;
                    delete item.task_parse_ops.date;
                    item.expiration_time = new Date(item.expiration_time + "Z").format("yyyy/MM/dd HH:mm:ss");
                    last_execte_time = new Date(last_execte_time + "Z");
                    if (last_execte_time.getTime()) {
                        item.last_execte_time = last_execte_time.format("yyyy/MM/dd HH:mm:ss");
                    } else {
                        item.last_execte_time = "未执行";
                    }
                    // item.last_execte_time=new Date(item.last_execte_time+"Z").format("yyyy/MM/dd HH:mm:ss");
                    item.next_execte_time = new Date(item.next_execte_time + "Z").format("yyyy/MM/dd HH:mm:ss");

                case 19:
                    i++;
                    _context.next = 3;
                    break;

                case 22:
                    return _context.abrupt('return', {
                        code: 1,
                        data: items
                    });

                case 23:
                case 'end':
                    return _context.stop();
            }
        }
    }, null, undefined);
};

var listAccountCrontabs = function _callee2(_ref, store) {
    var account_id = _ref.account_id,
        _ref$includeNormal = _ref.includeNormal,
        includeNormal = _ref$includeNormal === undefined ? true : _ref$includeNormal,
        _ref$includeFail = _ref.includeFail,
        includeFail = _ref$includeFail === undefined ? false : _ref$includeFail;
    var response, message;
    return _regenerator2.default.async(function _callee2$(_context2) {
        while (1) {
            switch (_context2.prev = _context2.next) {
                case 0:
                    _context2.prev = 0;
                    _context2.next = 3;
                    return _regenerator2.default.awrap(_bcxjsWs.Apis.instance().db_api().exec('list_account_crontab', [account_id, includeNormal, includeFail]));

                case 3:
                    response = _context2.sent;

                    if (!response) {
                        _context2.next = 8;
                        break;
                    }

                    _context2.next = 7;
                    return _regenerator2.default.awrap(formatCrontabs(response, store));

                case 7:
                    return _context2.abrupt('return', _context2.sent);

                case 8:
                    _context2.next = 14;
                    break;

                case 10:
                    _context2.prev = 10;
                    _context2.t0 = _context2['catch'](0);
                    message = _context2.t0.message;
                    return _context2.abrupt('return', {
                        code: 0,
                        message: message,
                        error: _context2.t0
                    });

                case 14:
                case 'end':
                    return _context2.stop();
            }
        }
    }, null, undefined, [[0, 10]]);
};

exports.default = {
    listAccountCrontabs: listAccountCrontabs
};