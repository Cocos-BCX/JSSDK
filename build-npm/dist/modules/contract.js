'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _api = require('../services/api');

var _api2 = _interopRequireDefault(_api);

var _bcxjsCores = require('bcxjs-cores');

var _helper = require('../lib/common/helper');

var _helper2 = _interopRequireDefault(_helper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var initialState = {
    contract_cache: {}
};

var _lua_types = {
    0: "init",
    1: "number",
    2: "string",
    3: "boolean",
    4: "table",
    5: "function",
    6: "memo_data",
    7: "asset"
};

var toTable = function toTable(obj) {
    var result = [];
    for (var key in obj) {
        var keyObj = {},
            valueObj = {},
            v = obj[key];

        keyObj.dataType = typeof key === 'undefined' ? 'undefined' : (0, _typeof3.default)(key);
        keyObj.value = key;
        if (key % 1 === 0) keyObj.dataType = "int";

        valueObj.dataType = typeof v === 'undefined' ? 'undefined' : (0, _typeof3.default)(v);
        if (valueObj.dataType == "object") {
            valueObj.dataType = "table";
            valueObj.value = toTable(v);
        } else {
            valueObj.value = v;
        }

        if (v != "" && v % 1 === 0) valueObj.dataType = "int";

        result.push([{ key: keyObj }, valueObj]);
    }

    return result;
};

var formatValueList = function formatValueList(valueList) {
    var _valueList = [],
        valueItem = void 0,
        v = void 0,
        dataType = "";
    for (var i = 0; i < valueList.length; i++) {
        try {
            v = valueList[i];
            dataType = typeof v === 'undefined' ? 'undefined' : (0, _typeof3.default)(v);

            if (dataType == "number" && v % 1 === 0) {
                dataType = "int";
            }

            if (dataType == "object") {
                dataType = "table"; //JSON.stringify(v);
                v = toTable(v);
                // console.info("v",v);
            }

            valueItem = {
                value: v,
                dataType: dataType
            };

            _valueList.push(valueItem);
        } catch (e) {
            return { code: 0, message: e.message };
        }
    }

    return _valueList;
};

var formatTableWithStructs = function formatTableWithStructs(table) {
    var result = [];
    table.forEach(function (item) {
        var key = item[0].key[1].v;
        var key_type = _lua_types[item[0].key[0]];
        var value = item[1][1].v;
        var lua_type = item[1][0];
        // console.info("ChainTypes.lua_type",ChainTypes.lua_type);
        var obj = { key_type: key_type, key: key, value_type: _lua_types[lua_type] };
        switch (lua_type) {
            case 4:
                obj.value = formatTableWithStructs(value);
                //   result[key].value=formatTableWithStructs(value);
                break;
            case 0:
            case 1:
                obj.value = Number(value);
                break;
            default:
                obj.value = value;
        }
        result.push(obj);
    });
    return result;
};

var actions = {
    queryAccountContractData: function queryAccountContractData(_ref, params) {
        var dispatch = _ref.dispatch;

        _helper2.default.trimParams(params);

        var account = params.account,
            contractNameOrId = params.contractNameOrId,
            callback = params.callback;

        var p_getUserInfo = dispatch("user/getUserInfo", { account: account, isCache: true }, { root: true });
        var p_getContract = dispatch("getContract", { nameOrId: contractNameOrId, isCache: true });

        var res = void 0;
        return _promise2.default.all([p_getUserInfo, p_getContract]).then(function (results) {
            var paramsOk = results.every(function (item) {
                if (item.code != 1) {
                    res = item;
                }
                return item.code == 1;
            });
            if (paramsOk) {
                return dispatch("getAccountContractData", {
                    account: results[0].data.account.id,
                    contractNameOrId: results[1].data.id
                });
            } else {
                return res;
            }
        });
    },
    createContract: function createContract(_ref2, params) {
        var dispatch = _ref2.dispatch;

        if (!_helper2.default.trimParams(params, { authority: "" })) {
            return { code: 101, message: "Parameter is missing" };
        }
        var name = params.name,
            data = params.data,
            authority = params.authority,
            onlyGetFee = params.onlyGetFee;

        if (!/^contract\.([a-z0-9\.-]){5,54}/.test(name)) {
            return { code: 130, message: "Please enter the correct contract name(/^contract.[a-z]([a-z0-9\.-]){15,63}/)" };
        }
        return dispatch('transactions/_transactionOperations', {
            operations: [{
                type: "contract_create",
                params: {
                    name: name,
                    data: data,
                    authority: authority
                }
            }],
            onlyGetFee: onlyGetFee
        }, { root: true });
    },
    updateContract: function updateContract(_ref3, params) {
        var dispatch = _ref3.dispatch;
        var nameOrId, data, onlyGetFee, contract_res;
        return _regenerator2.default.async(function updateContract$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        if (_helper2.default.trimParams(params)) {
                            _context.next = 2;
                            break;
                        }

                        return _context.abrupt('return', { code: 101, message: "Parameter is missing" });

                    case 2:
                        nameOrId = params.nameOrId, data = params.data, onlyGetFee = params.onlyGetFee;
                        _context.next = 5;
                        return _regenerator2.default.awrap(dispatch("getContract", { nameOrId: nameOrId }));

                    case 5:
                        contract_res = _context.sent;

                        if (!(contract_res.code != 1)) {
                            _context.next = 8;
                            break;
                        }

                        return _context.abrupt('return', contract_res);

                    case 8:
                        return _context.abrupt('return', dispatch('transactions/_transactionOperations', {
                            operations: [{
                                type: "revise_contract",
                                params: {
                                    contract_id: contract_res.data.id,
                                    data: data
                                }
                            }],
                            onlyGetFee: onlyGetFee
                        }, { root: true }));

                    case 9:
                    case 'end':
                        return _context.stop();
                }
            }
        }, null, undefined);
    },
    getContract: function getContract(_ref4, _ref5) {
        var dispatch = _ref4.dispatch,
            state = _ref4.state;
        var _ref5$nameOrId = _ref5.nameOrId,
            nameOrId = _ref5$nameOrId === undefined ? "" : _ref5$nameOrId,
            _ref5$isCache = _ref5.isCache,
            isCache = _ref5$isCache === undefined ? false : _ref5$isCache;

        var res, _res$data, name, owner, contract_ABI, contract_data, check_contract_authority, creation_date, id, contract_authority, previous_version, lua_code, current_version, acc_res, abi_actions, data;

        return _regenerator2.default.async(function getContract$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        if (nameOrId) {
                            _context2.next = 2;
                            break;
                        }

                        return _context2.abrupt('return', { code: 0, message: 'Parameter "nameOrId" can not be empty' });

                    case 2:
                        nameOrId = nameOrId.trim();

                        _context2.next = 5;
                        return _regenerator2.default.awrap(_api2.default.Contract.getContract(nameOrId, isCache));

                    case 5:
                        res = _context2.sent;

                        if (!(res.code != 1)) {
                            _context2.next = 8;
                            break;
                        }

                        return _context2.abrupt('return', res);

                    case 8:
                        _res$data = res.data, name = _res$data.name, owner = _res$data.owner, contract_ABI = _res$data.contract_ABI, contract_data = _res$data.contract_data, check_contract_authority = _res$data.check_contract_authority, creation_date = _res$data.creation_date, id = _res$data.id, contract_authority = _res$data.contract_authority, previous_version = _res$data.previous_version, lua_code = _res$data.lua_code, current_version = _res$data.current_version;
                        _context2.next = 11;
                        return _regenerator2.default.awrap(dispatch("user/getUserInfo", { account: owner, isCache: true }, { root: true }));

                    case 11:
                        acc_res = _context2.sent;

                        if (!(acc_res.code != 1)) {
                            _context2.next = 14;
                            break;
                        }

                        return _context2.abrupt('return', acc_res);

                    case 14:
                        abi_actions = [];

                        contract_ABI.forEach(function (item) {
                            abi_actions.push({
                                name: item[0].key[1].v,
                                arglist: item[1][1].arglist
                            });
                        });

                        data = {
                            check_contract_authority: check_contract_authority,
                            abi_actions: abi_actions,
                            contract_authority: contract_authority,
                            contract_data: _helper2.default.formatTable(contract_data),
                            contract_data_type: formatTableWithStructs(contract_data),
                            create_date: new Date(creation_date + "Z").bcxformat("yyyy/MM/dd HH:mm:ss"),
                            current_version: current_version,
                            id: id,
                            lua_code: lua_code,
                            contract_name: name,
                            owner_account_name: acc_res.data.account.name
                        };


                        res.data = data;
                        return _context2.abrupt('return', res);

                    case 19:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, null, undefined);
    },
    getAccountContractData: function getAccountContractData(_ref6, _ref7) {
        var dispatch = _ref6.dispatch;
        var account = _ref7.account,
            contractNameOrId = _ref7.contractNameOrId;

        var get_c_res, res, _res$data2, contract_data, owner, acc_res;

        return _regenerator2.default.async(function getAccountContractData$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        _context3.next = 2;
                        return _regenerator2.default.awrap(_api2.default.Contract.getContract(contractNameOrId));

                    case 2:
                        get_c_res = _context3.sent;

                        if (!(get_c_res.code != 1)) {
                            _context3.next = 5;
                            break;
                        }

                        return _context3.abrupt('return', get_c_res);

                    case 5:
                        _context3.next = 7;
                        return _regenerator2.default.awrap(_api2.default.Contract.getAccountContractData(account, contractNameOrId));

                    case 7:
                        res = _context3.sent;

                        if (!(res.code != 1)) {
                            _context3.next = 10;
                            break;
                        }

                        return _context3.abrupt('return', res);

                    case 10:
                        _res$data2 = res.data, contract_data = _res$data2.contract_data, owner = _res$data2.owner;


                        res.data.contract_data = _helper2.default.formatTable(contract_data);
                        res.data.contract_data_type = formatTableWithStructs(contract_data);

                        res.data.contract_name = get_c_res.data.name;

                        _context3.next = 16;
                        return _regenerator2.default.awrap(dispatch("user/getUserInfo", { account: owner, isCache: true }, { root: true }));

                    case 16:
                        acc_res = _context3.sent;

                        if (!(acc_res.code != 1)) {
                            _context3.next = 19;
                            break;
                        }

                        return _context3.abrupt('return', acc_res);

                    case 19:
                        res.data.owner_account_name = acc_res.data.account.name;
                        return _context3.abrupt('return', res);

                    case 21:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, null, undefined);
    },
    callContractFunction: function callContractFunction(_ref8, params) {
        var dispatch = _ref8.dispatch;

        var nameOrId, functionName, valueList, onlyGetFee, contract_res, _valueList;

        return _regenerator2.default.async(function callContractFunction$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        if (_helper2.default.trimParams(params)) {
                            _context4.next = 2;
                            break;
                        }

                        return _context4.abrupt('return', { code: 101, message: "Parameter is missing" });

                    case 2:
                        nameOrId = params.nameOrId, functionName = params.functionName, valueList = params.valueList, onlyGetFee = params.onlyGetFee;

                        if (Array.isArray(valueList)) {
                            _context4.next = 5;
                            break;
                        }

                        return _context4.abrupt('return', { code: 135, message: "Please check parameter data type" });

                    case 5:
                        if (/1\.\d+\.\d+\./.test(nameOrId)) {
                            _context4.next = 18;
                            break;
                        }

                        _context4.next = 8;
                        return _regenerator2.default.awrap(dispatch("getContract", { nameOrId: nameOrId }));

                    case 8:
                        contract_res = _context4.sent;

                        if (!(contract_res.code == 1)) {
                            _context4.next = 17;
                            break;
                        }

                        nameOrId = contract_res.data.id;
                        _valueList = formatValueList(valueList);

                        if (!("code" in _valueList)) {
                            _context4.next = 14;
                            break;
                        }

                        return _context4.abrupt('return', _valueList);

                    case 14:
                        return _context4.abrupt('return', dispatch('transactions/_transactionOperations', {
                            operations: [{
                                type: "call_contract_function",
                                params: {
                                    contractId: nameOrId,
                                    functionName: functionName,
                                    valueList: _valueList
                                }
                            }],
                            onlyGetFee: onlyGetFee
                        }, { root: true }));

                    case 17:
                        return _context4.abrupt('return', contract_res);

                    case 18:
                    case 'end':
                        return _context4.stop();
                }
            }
        }, null, undefined);
    },
    parseContractAffecteds: function parseContractAffecteds(_ref9, contract_affecteds) {
        var dispatch = _ref9.dispatch;
    }
};

exports.default = {
    state: initialState,
    actions: actions,
    //getters,
    namespaced: true
};