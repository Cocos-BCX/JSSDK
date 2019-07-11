'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.formatVotes = exports._getVoteObjects = exports.publishVotes = undefined;

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _bcxjsWs = require('bcxjs-ws');

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

var _mutations = require('../../mutations');

var types = _interopRequireWildcard(_mutations);

var _api = require('../api');

var _api2 = _interopRequireDefault(_api);

var _helper = require('../../lib/common/helper');

var _helper2 = _interopRequireDefault(_helper);

var _bcxjsCores = require('bcxjs-cores');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _state = {
    all_witnesses: _immutable2.default.List(),
    all_committee: _immutable2.default.List()
};

var publishVotes = exports.publishVotes = function publishVotes(store, witnesses_ids, committee_ids, new_proxy_id, callback, onlyGetFee, feeAssetId) {
    var rootGetters = store.rootGetters,
        getters = store.getters,
        dispatch = store.dispatch;

    var updated_account = rootGetters["user/getAccountObject"];
    var updateObject = { account: updated_account.id };
    var new_options = { memo_key: updated_account.options.memo_key };

    var vote_ids = getters.getVotesState.vote_ids;


    new_options.voting_account = new_proxy_id ? new_proxy_id : "1.2.2";
    new_options.num_witness = witnesses_ids.length;
    new_options.num_committee = committee_ids.length;

    updateObject.new_options = new_options;
    // Set fee asset
    updateObject.fee = {
        amount: 0,
        asset_id: "1.3.0"
    };

    // Submit votes
    (0, _bcxjsCores.FetchChainObjects)(_bcxjsCores.ChainStore.getWitnessById, witnesses_ids,
    //witnesses.toArray(),
    4000).then(function (res) {
        var witnesses_vote_ids = res.map(function (o) {
            return o.get("vote_id");
        });
        return _promise2.default.all([_promise2.default.resolve(witnesses_vote_ids), (0, _bcxjsCores.FetchChainObjects)(_bcxjsCores.ChainStore.getCommitteeMemberById, committee_ids, 4000)]);
    }).then(function (res) {
        updateObject.new_options.votes = res[0].concat(res[1].map(function (o) {
            return o.get("vote_id");
        })).concat(vote_ids.toArray().filter(function (id) {
            return id.split(":")[0] === "2";
        })).sort(function (a, b) {
            var a_split = a.split(":");
            var b_split = b.split(":");

            return parseInt(a_split[1], 10) - parseInt(b_split[1], 10);
        });

        dispatch("transactions/_transactionOperations", {
            operations: [{
                type: "account_update",
                params: {
                    updateObject: updateObject,
                    fee_asset_id: feeAssetId
                }
            }],
            callback: callback,
            onlyGetFee: onlyGetFee
        }, { root: true }).then(function (res) {
            callback && callback(res);
        });
    });
};

var _getVoteObjects = exports._getVoteObjects = function _callee(store) {
    var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "witnesses";
    var vote_ids = arguments[2];
    var current, isWitness, lastIdx, globalObject, getVoteObjects_callback, active, lastActive, i;
    return _regenerator2.default.async(function _callee$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    current = _state['all_' + type] = _immutable2.default.List();
                    isWitness = type === "witnesses";
                    lastIdx = void 0;

                    if (vote_ids) {
                        _context.next = 23;
                        break;
                    }

                    vote_ids = [];
                    globalObject = store.rootGetters["vote/globalObject"];

                    if (globalObject) {
                        _context.next = 15;
                        break;
                    }

                    _context.next = 9;
                    return _regenerator2.default.awrap(_api2.default.Explorer.getGlobalObject());

                case 9:
                    globalObject = _context.sent;

                    if (!(globalObject.code != 1)) {
                        _context.next = 14;
                        break;
                    }

                    getVoteObjects_callback = store.state.getVoteObjects_callback;

                    getVoteObjects_callback && getVoteObjects_callback(globalObject);
                    return _context.abrupt('return');

                case 14:
                    globalObject = globalObject.data;

                case 15:

                    globalObject = _immutable2.default.fromJS(globalObject);
                    store.commit(types.SET_GLOBAL_OBJECT, globalObject);
                    active = globalObject.get(isWitness ? "active_witnesses" : "active_committee_members").sort(function (a, b) {
                        return parseInt(a.split(".")[2], 10) - parseInt(b.split(".")[2], 10);
                    });
                    lastActive = active.last() || '1.' + (isWitness ? "6" : "5") + '.1';


                    lastIdx = parseInt(lastActive.split(".")[2], 10);
                    for (i = isWitness ? 1 : 0; i <= lastIdx + 10; i++) {
                        vote_ids.push('1.' + (isWitness ? "6" : "5") + '.' + i);
                    }
                    _context.next = 24;
                    break;

                case 23:
                    lastIdx = parseInt(vote_ids[vote_ids.length - 1].split(".")[2], 10);

                case 24:
                    (0, _bcxjsCores.FetchChainObjects)(_bcxjsCores.ChainStore.getObject, vote_ids, 5000, {}).then(function (vote_objs) {
                        var vote_ids_obj = {};
                        vote_objs = vote_objs.filter(function (a) {
                            if (!!a) {
                                vote_ids.push(a.id);
                                return true;
                            }
                        });
                        if (vote_objs.length) {
                            store.commit(types.SET_VOTE_IDS, vote_ids);
                            _state['all_' + type] = current.concat(_immutable2.default.List(vote_objs.map(function (a) {
                                var acc_id = a.get(isWitness ? "witness_account" : "committee_member_account");
                                vote_ids_obj[acc_id] = a;
                                return acc_id;
                            })));

                            store.commit(types.SET_VOTE_IDS_OBJ, vote_ids_obj);
                            store.commit(types.SET_ALL_WITNESSES_COMMITTEE, _state);
                        }

                        // store.dispatch("formatVotes",type);
                        if (!!vote_objs[vote_objs.length - 1]) {
                            // there are more valid vote objs, fetch 10 more
                            vote_ids = [];
                            for (var i = lastIdx + 11; i <= lastIdx + 20; i++) {
                                vote_ids.push('1.' + (isWitness ? "6" : "5") + '.' + i);
                            }
                            return _getVoteObjects(store, type, vote_ids);
                        } else {
                            updateAccountData(store, type);
                        }
                    });

                case 25:
                case 'end':
                    return _context.stop();
            }
        }
    }, null, undefined);
};

var updateAccountData = function _callee2(store, type) {
    var commit, rootGetters, query_account, loginUserName, account, proxyId, proxy_account_id, proxy, options, proxyOptions, current_proxy_input, votes, reg, vote_ids, vids, proxyPromise, proxy_vids, hasProxy, proxy_votes, proxy_vote_ids;
    return _regenerator2.default.async(function _callee2$(_context2) {
        while (1) {
            switch (_context2.prev = _context2.next) {
                case 0:
                    commit = store.commit, rootGetters = store.rootGetters;
                    query_account = rootGetters["vote/queryAccount"];
                    loginUserName = rootGetters["user/getUserName"];

                    if (!(!loginUserName && !query_account || rootGetters["vote/isExplorer"])) {
                        _context2.next = 6;
                        break;
                    }

                    formatVotes(store, "");
                    return _context2.abrupt('return');

                case 6:
                    _context2.next = 8;
                    return _regenerator2.default.awrap(_api2.default.Account.getUser(query_account ? query_account : loginUserName, false));

                case 8:
                    account = _context2.sent;

                    if (!(account.code != 1)) {
                        _context2.next = 12;
                        break;
                    }

                    store.state.getVoteObjects_callback && store.state.getVoteObjects_callback(account);
                    return _context2.abrupt('return');

                case 12:

                    account = account.data.account;
                    account = _immutable2.default.fromJS(account);
                    proxyId = account.getIn(["options", "voting_account"]);
                    proxy_account_id = proxyId === "1.2.2" ? "" : proxyId;
                    proxy = null;

                    if (!proxy_account_id) {
                        _context2.next = 23;
                        break;
                    }

                    _context2.next = 20;
                    return _regenerator2.default.awrap(_api2.default.Account.getUser(proxy_account_id, false));

                case 20:
                    proxy = _context2.sent;

                    if (proxy.success) {
                        proxy = proxy.data.account;
                    }
                    if (proxy) {
                        proxy = _immutable2.default.fromJS(proxy);
                    }

                case 23:
                    options = account.get("options");
                    proxyOptions = proxy ? proxy.get("options") : null;
                    current_proxy_input = proxy ? proxy.get("name") : "";


                    if (proxy_account_id === "1.2.2") {
                        proxy_account_id = "";
                        current_proxy_input = "";
                    }

                    votes = options.get("votes");
                    reg = new RegExp(type == "witnesses" ? /^1:\d+$/ : /^0:\d+$/);
                    vote_ids = votes.toArray().filter(function (vote_id) {
                        return vote_id.match(reg);
                    });
                    vids = _immutable2.default.Set(vote_ids);
                    proxyPromise = null, proxy_vids = _immutable2.default.Set([]);
                    hasProxy = proxy_account_id !== "1.2.2";

                    if (hasProxy && proxyOptions) {
                        proxy_votes = proxyOptions.get("votes");
                        proxy_vote_ids = proxy_votes.toArray();

                        proxy_vids = _immutable2.default.Set(proxy_vote_ids);
                        _bcxjsCores.ChainStore.getObjectsByVoteIds(proxy_vote_ids);
                        proxyPromise = (0, _bcxjsCores.FetchChainObjects)(_bcxjsCores.ChainStore.getObjectByVoteID, proxy_vote_ids, 10000);
                    } else {
                        _bcxjsCores.ChainStore.getObjectsByVoteIds(vote_ids);
                    }

                    _promise2.default.all([(0, _bcxjsCores.FetchChainObjects)(_bcxjsCores.ChainStore.getObjectByVoteID, vote_ids, 10000)]
                    // proxyPromise
                    ).then(function (res) {
                        var _res = (0, _slicedToArray3.default)(res, 2),
                            vote_objs = _res[0],
                            proxy_vote_objs = _res[1];

                        function sortVoteObjects(objects) {
                            var witnesses = new _immutable2.default.List();
                            var committee = new _immutable2.default.List();
                            var workers = new _immutable2.default.Set();
                            objects.forEach(function (obj) {
                                var account_id = obj.get("committee_member_account");
                                if (account_id) {
                                    committee = committee.push(account_id);
                                } else if (account_id = obj.get("worker_account")) {
                                    // console.log( "worker: ", obj );
                                    //     workers = workers.add(obj.get("id"));
                                } else if (account_id = obj.get("witness_account")) {
                                    witnesses = witnesses.push(account_id);
                                }
                            });

                            return { witnesses: witnesses, committee: committee, workers: workers };
                        }

                        var _sortVoteObjects = sortVoteObjects(vote_objs),
                            witnesses = _sortVoteObjects.witnesses,
                            committee = _sortVoteObjects.committee,
                            workers = _sortVoteObjects.workers;

                        var _sortVoteObjects2 = sortVoteObjects(proxy_vote_objs || []),
                            proxy_witnesses = _sortVoteObjects2.witnesses,
                            proxy_committee = _sortVoteObjects2.committee,
                            proxy_workers = _sortVoteObjects2.workers;

                        var state = {
                            proxy_account_id: proxy_account_id,
                            current_proxy_input: current_proxy_input,
                            witnesses: witnesses,
                            committee: committee,
                            workers: workers,
                            proxy_witnesses: proxy_witnesses,
                            proxy_committee: proxy_committee,
                            proxy_workers: proxy_workers,
                            vote_ids: vids,
                            proxy_vote_ids: proxy_vids,
                            prev_witnesses: witnesses,
                            prev_committee: committee,
                            prev_workers: workers,
                            prev_vote_ids: vids
                        };
                        commit(types.SET_VOTES_STATE, state);

                        formatVotes(store, proxy_account_id);
                    }).catch(function (e) {
                        var getVoteObjects_callback = store.state.getVoteObjects_callback;

                        getVoteObjects_callback && getVoteObjects_callback({ code: 148, message: "Request timeout, please try to unlock the account or login the account" });
                    });

                case 35:
                case 'end':
                    return _context2.stop();
            }
        }
    }, null, undefined);
};

//process formatted voting data
var formatVotes = exports.formatVotes = function _callee3(store, proxy_account_id) {
    var state, rootGetters, getters, dispatch, core_asset, type, items;
    return _regenerator2.default.async(function _callee3$(_context3) {
        while (1) {
            switch (_context3.prev = _context3.next) {
                case 0:
                    state = store.state, rootGetters = store.rootGetters, getters = store.getters, dispatch = store.dispatch;
                    _context3.next = 3;
                    return _regenerator2.default.awrap(dispatch("assets/fetchAssets", { assets: ["1.3.0"], isOne: true }, { root: true }));

                case 3:
                    core_asset = _context3.sent;
                    type = getters["all_type"];
                    items = getters["alls"]["all_" + type].filter(function (i) {
                        if (!i) return false;
                        //if (this.state.item_name_input) return i.get("name").indexOf(this.state.item_name_input) !== -1;
                        return true;
                    });

                    items = items.map(function (account) {
                        return store.dispatch("user/getUserInfo", { account: account, isCache: true }, { root: true });
                    });
                    _promise2.default.all(items).then(function (respDataArr) {

                        respDataArr = respDataArr.filter(function (acc_res) {
                            return acc_res.code == 1;
                        });
                        respDataArr = respDataArr.map(function (acc_res) {
                            return acc_res.data.account;
                        });

                        items = _immutable2.default.fromJS(respDataArr);
                        var vote_ids_obj = getters["vote_ids_obj"];
                        items = items.sort(function (a, b) {
                            var _getWitnessOrCommitte = getWitnessOrCommittee(type, a),
                                a_votes = _getWitnessOrCommitte.votes;

                            var _getWitnessOrCommitte2 = getWitnessOrCommittee(type, b),
                                b_votes = _getWitnessOrCommitte2.votes;

                            if (a_votes !== b_votes) {
                                return parseInt(b_votes, 10) - parseInt(a_votes, 10);
                            } else if (a.get("name") > b.get("name")) {
                                return 1;
                            } else if (a.get("name") < b.get("name")) {
                                return -1;
                            } else {
                                return 0;
                            }
                        }).map(function (account, idx) {
                            var supporteds = getters["getVotesState"] ? getters["getVotesState"][(proxy_account_id ? "proxy_" : "") + type] : null;
                            var action = supporteds && supporteds.includes(account.get("id"));
                            // ? "remove"
                            // : "add";

                            var _getWitnessOrCommitte3 = getWitnessOrCommittee(type, account),
                                url = _getWitnessOrCommitte3.url,
                                votes = _getWitnessOrCommitte3.votes,
                                id = _getWitnessOrCommitte3.id;

                            var link = url && url.length > 0 && url.indexOf("http") === -1 ? "http://" + url : url;
                            var isActive = getters["globalObject"].get("active_" + type + (type == "committee" ? "_members" : "")).includes(id);

                            votes = _helper2.default.getFullNum(votes / Math.pow(10, core_asset.precision));
                            votes = votes.toFixed(3);

                            var account_id = account.get("id");

                            var vote_obj = vote_ids_obj[account_id];

                            var _vote_obj$toJS = vote_obj.toJS(),
                                vote_id = _vote_obj$toJS.vote_id,
                                total_missed = _vote_obj$toJS.total_missed,
                                last_confirmed_block_num = _vote_obj$toJS.last_confirmed_block_num,
                                last_aslot = _vote_obj$toJS.last_aslot;

                            var vote_account = {
                                account_name: account.get("name"),
                                url: url,
                                votes: votes,
                                active: isActive,
                                supported: !!action,
                                account_id: account_id,
                                type: type,
                                vote_id: vote_id
                            };
                            if (type == "witnesses") {
                                vote_account.total_missed = total_missed;
                                vote_account.last_confirmed_block_num = last_confirmed_block_num;
                                vote_account.last_aslot = last_aslot;
                                vote_account.witness_id = vote_obj.get("id");
                            } else if (type == "committee") {
                                vote_account.committee_id = vote_obj.get("id");
                            }
                            return vote_account;
                        });

                        var getVoteObjects_callback = store.state.getVoteObjects_callback;


                        getVoteObjects_callback && getVoteObjects_callback({ code: 1, data: items.toJS() });
                    });

                case 8:
                case 'end':
                    return _context3.stop();
            }
        }
    }, null, undefined);
};

function getWitnessOrCommittee(type, acct) {
    var url = "",
        votes = 0,
        account = void 0;
    if (type === "witnesses") {
        account = _bcxjsCores.ChainStore.getWitnessById(acct.get("id"));
    } else if (type === "committee") {
        account = _bcxjsCores.ChainStore.getCommitteeMemberById(acct.get("id"));
    }
    url = account ? account.get("url") : url;
    votes = account ? account.get("total_votes") : votes;
    return {
        url: url,
        votes: votes,
        id: account.get("id")
    };
}

exports.default = {
    _getVoteObjects: _getVoteObjects,
    formatVotes: formatVotes,
    publishVotes: publishVotes
};