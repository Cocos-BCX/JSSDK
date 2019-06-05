'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _api = require('../services/api');

var _api2 = _interopRequireDefault(_api);

var _helper = require('../lib/common/helper');

var _helper2 = _interopRequireDefault(_helper);

var _permission_utils = require('../lib/common/permission_utils');

var _permission_utils2 = _interopRequireDefault(_permission_utils);

var _utils = require('../lib/common/utils');

var _utils2 = _interopRequireDefault(_utils);

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var initialState = {};

var actions = {
    loadAccountProposals: function loadAccountProposals(store, _ref) {
        var account_id = _ref.account_id;

        var rootGetters, dispatch, userId, acc_res, proposals, acc_proposals, acc_proposal, _loop, i, time;

        return _regenerator2.default.async(function loadAccountProposals$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        rootGetters = store.rootGetters, dispatch = store.dispatch;
                        _context2.prev = 1;
                        userId = account_id || rootGetters["account/getAccountUserId"];

                        if (userId) {
                            _context2.next = 5;
                            break;
                        }

                        return _context2.abrupt('return', { code: 170, message: "Missing parameter account or login first" });

                    case 5:
                        _context2.next = 7;
                        return _regenerator2.default.awrap(dispatch("user/getUserInfo", { account: userId }, { root: true }));

                    case 7:
                        acc_res = _context2.sent;
                        proposals = [];
                        acc_proposals = acc_res.data.proposals;
                        acc_proposal = void 0;

                        _loop = function _callee(i) {
                            var operation, _acc_proposal, id, expiration_time, required_active_approvals, permissions_type, required, available, availableKeys, requiredPermissions, status, pushStatusItem, _operations$, parse_operations, parse_operations_text, raw_data, type, type_name;

                            return _regenerator2.default.async(function _callee$(_context) {
                                while (1) {
                                    switch (_context.prev = _context.next) {
                                        case 0:
                                            acc_proposal = acc_proposals[i];
                                            operation = acc_proposal.proposed_transaction.operations[0];
                                            _acc_proposal = acc_proposal, id = _acc_proposal.id, expiration_time = _acc_proposal.expiration_time, required_active_approvals = _acc_proposal.required_active_approvals;
                                            permissions_type = required_active_approvals.length ? "active" : "owner";
                                            required = acc_proposal['required_' + permissions_type + '_approvals'];
                                            available = acc_proposal['available_' + permissions_type + '_approvals'];
                                            availableKeys = acc_proposal["available_key_approvals"];


                                            required = _permission_utils2.default.listToIDs(required);
                                            _context.next = 10;
                                            return _regenerator2.default.awrap(_permission_utils2.default.unnest(_immutable2.default.fromJS(required), permissions_type));

                                        case 10:
                                            requiredPermissions = _context.sent;
                                            status = [];

                                            pushStatusItem = function pushStatusItem(permission, threshold) {
                                                // permission.threshold=requiredPermissions.threshold;
                                                var id = permission.id,
                                                    account_name = permission.account_name,
                                                    weight = permission.weight;

                                                var isNested = permission.isNested();
                                                var isMultiSig = permission.isMultiSig();

                                                var notNestedWeight = threshold && threshold > 10 ? _utils2.default.get_percentage(permission.weight, threshold) : permission.weight;

                                                var nestedWeight = permission && permission.threshold > 10 ? '' + _utils2.default.get_percentage(permission.getStatus(available, availableKeys), permission.threshold) : permission.getStatus(available, availableKeys) + ' / ' + permission.threshold;

                                                if (weight) status.push({
                                                    id: id,
                                                    account_name: account_name,
                                                    weight: weight,
                                                    weight_percentage: !isNested && notNestedWeight ? notNestedWeight : nestedWeight, //permission.weight/requiredPermissions[0].threshold,
                                                    isAgree: permission.isAvailable(available)
                                                });

                                                if (isNested || isMultiSig) {
                                                    permission.accounts.forEach(function (subAccount) {
                                                        pushStatusItem(subAccount, permission.threshold * 2);
                                                    });
                                                }
                                            };

                                            requiredPermissions.forEach(function (permission) {
                                                pushStatusItem(permission);
                                            });

                                            _context.next = 16;
                                            return _regenerator2.default.awrap(_api2.default.Operations.parseOperations({
                                                operations: [{ op: operation }],
                                                userId: userId,
                                                store: store
                                            }));

                                        case 16:
                                            _operations$ = _context.sent.operations[0];
                                            parse_operations = _operations$.parse_operations;
                                            parse_operations_text = _operations$.parse_operations_text;
                                            raw_data = _operations$.raw_data;
                                            type = _operations$.type;
                                            type_name = _operations$.type_name;

                                            proposals.push({
                                                id: id,
                                                expiration: new Date(expiration_time + "Z").format("yyyy/MM/dd HH:mm:ss"),
                                                parse_operations: parse_operations,
                                                parse_operations_text: parse_operations_text,
                                                raw_data: raw_data,
                                                type: type,
                                                type_name: type_name,
                                                status: status
                                            });

                                        case 23:
                                        case 'end':
                                            return _context.stop();
                                    }
                                }
                            }, null, undefined);
                        };

                        i = 0;

                    case 13:
                        if (!(i < acc_proposals.length)) {
                            _context2.next = 19;
                            break;
                        }

                        _context2.next = 16;
                        return _regenerator2.default.awrap(_loop(i));

                    case 16:
                        i++;
                        _context2.next = 13;
                        break;

                    case 19:
                        time = void 0;

                        proposals = proposals.sort(function (a, b) {
                            return Number(b.id.split(".")[2]) - Number(a.id.split(".")[2]);
                        });
                        return _context2.abrupt('return', { code: 1, data: proposals });

                    case 24:
                        _context2.prev = 24;
                        _context2.t0 = _context2['catch'](1);
                        return _context2.abrupt('return', { code: 0, message: _context2.t0.message, error: _context2.t0 });

                    case 27:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, null, undefined, [[1, 24]]);
    },
    submitProposal: function submitProposal(_ref2, _ref3) {
        var dispatch = _ref2.dispatch,
            rootGetters = _ref2.rootGetters;
        var proposalId = _ref3.proposalId,
            _ref3$onlyGetFee = _ref3.onlyGetFee,
            onlyGetFee = _ref3$onlyGetFee === undefined ? false : _ref3$onlyGetFee;
        var account_id, proposal;
        return _regenerator2.default.async(function submitProposal$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        account_id = rootGetters["account/getAccountUserId"];
                        proposal = {
                            fee_paying_account: account_id,
                            proposal: proposalId,
                            active_approvals_to_add: [account_id],
                            active_approvals_to_remove: [],
                            owner_approvals_to_add: [],
                            owner_approvals_to_remove: [],
                            key_approvals_to_add: [],
                            key_approvals_to_remove: []
                        };
                        return _context3.abrupt('return', dispatch('transactions/_transactionOperations', {
                            operations: [{
                                op_type: 22,
                                type: "proposal_update",
                                params: proposal
                            }],
                            onlyGetFee: onlyGetFee
                        }, { root: true }));

                    case 3:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, null, undefined);
    }
};

var mutations = {};

exports.default = {
    state: initialState,
    actions: actions,
    //getters,
    mutations: mutations,
    namespaced: true
};