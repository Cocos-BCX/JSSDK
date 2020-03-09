'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _mutations;

var _mutations2 = require('../mutations');

var types = _interopRequireWildcard(_mutations2);

var _api = require('../services/api');

var _api2 = _interopRequireDefault(_api);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var initialState = {
  all_witnesses: [],
  all_committee: [],
  all_type: "witnesses",
  globalObject: null,
  votes_state: null,
  getVoteObjects_callback: null,
  vote_ids_obj: null,
  vote_ids: [],
  queryAccount: "",
  isExplorer: false
};

var getters = {
  alls: function alls(state) {
    var all_witnesses = state.all_witnesses,
        all_committee = state.all_committee;

    return { all_witnesses: all_witnesses, all_committee: all_committee };
  },
  all_type: function all_type(state) {
    return state.all_type;
  },
  globalObject: function globalObject(state) {
    return state.globalObject;
  },
  getVotesState: function getVotesState(state) {
    return state.votes_state;
  },
  vote_ids_obj: function vote_ids_obj(state) {
    return state.vote_ids_obj;
  },
  vote_ids: function vote_ids(state) {
    return state.vote_ids;
  },
  queryAccount: function queryAccount(state) {
    return state.queryAccount;
  },
  isExplorer: function isExplorer(state) {
    return state.isExplorer;
  }

};

var actions = {
  getVoteObjects: function getVoteObjects(store, _ref) {
    var _ref$type = _ref.type,
        type = _ref$type === undefined ? "witnesses" : _ref$type,
        callback = _ref.callback,
        _ref$queryAccount = _ref.queryAccount,
        queryAccount = _ref$queryAccount === undefined ? "" : _ref$queryAccount,
        _ref$isExplorer = _ref.isExplorer,
        isExplorer = _ref$isExplorer === undefined ? false : _ref$isExplorer,
        _ref$isCache = _ref.isCache,
        isCache = _ref$isCache === undefined ? false : _ref$isCache;
    var dispatch = store.dispatch,
        rootGetters = store.rootGetters,
        commit = store.commit,
        state = store.state;

    commit(types.SET_ALL_TYPE, type);
    commit(types.set_getVoteObjects_callback, callback);
    commit(types.SET_QUERY_ACCOUNT, queryAccount);
    state.isExplorer = isExplorer;
    isCache = isCache || false;
    _api2.default.Vote._getVoteObjects(store, type, null, isCache);
  },
  // publishVotes:async (store,{witnesses_ids=null,committee_ids=null,votes,callback})=>{
  //     let {commit,getters,dispatch}=store;
  //     dispatch("getVoteObjects",{type:"witnesses",callback:(res)=>{
  //             if(res.code!=1){
  //               callback&&callback(res);
  //               return;
  //             }
  //             let {witnesses,committee,proxy_account_id}=getters.getVotesState;
  //             if(!witnesses_ids){
  //               witnesses_ids=witnesses.toArray();
  //             }
  //             if(!committee_ids){
  //               committee_ids=committee.toArray();
  //             }
  //             API.Vote.publishVotes(store,witnesses_ids,committee_ids,votes,callback);
  //     }})
  // },

  publishVotes: function publishVotes(store, _ref2) {
    var vote_ids = _ref2.vote_ids,
        votes = _ref2.votes,
        _ref2$type = _ref2.type,
        type = _ref2$type === undefined ? "witnesses" : _ref2$type,
        callback = _ref2.callback;
    return _regenerator2.default.async(function publishVotes$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _api2.default.Vote.publishVotes(store, vote_ids, votes, type, callback);

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, null, undefined);
  },
  setGlobalObject: function setGlobalObject(_ref3, GB) {
    var commit = _ref3.commit;

    commit(types.SET_GLOBAL_OBJECT, GB);
  },
  witnessCreate: function witnessCreate(_ref4, _ref5) {
    var dispatch = _ref4.dispatch;
    var _ref5$url = _ref5.url,
        url = _ref5$url === undefined ? "" : _ref5$url,
        blockSigningKey = _ref5.blockSigningKey,
        account = _ref5.account;

    if (!blockSigningKey) {
      return { code: 179, message: "blockSigningKey can not be empty" };
    }
    url = url || "";
    return dispatch('transactions/_transactionOperations', {
      operations: [{
        op_type: 18,
        type: "witness_create",
        params: {
          witness_account: account.id,
          url: url,
          block_signing_key: blockSigningKey
        }
      }]
    }, { root: true });
  },
  committeeMemberCreate: function committeeMemberCreate(_ref6, _ref7) {
    var dispatch = _ref6.dispatch;
    var _ref7$url = _ref7.url,
        url = _ref7$url === undefined ? "" : _ref7$url,
        account = _ref7.account;

    url = url || "";
    return dispatch('transactions/_transactionOperations', {
      operations: [{
        op_type: 23,
        type: "committee_member_create",
        params: {
          committee_member_account: account.id,
          url: url
        }
      }]
    }, { root: true });
  },
  witnessUpdate: function witnessUpdate(_ref8, params) {
    var dispatch = _ref8.dispatch;

    var account, witness_id, witness_res, _witness_res$data$, url, signing_key, work_status;

    return _regenerator2.default.async(function witnessUpdate$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            account = params.account;

            if (!account.witness_status) {
              _context2.next = 15;
              break;
            }

            witness_id = account.witness_status[0];
            _context2.next = 5;
            return _regenerator2.default.awrap(dispatch("explorer/getDataByIds", { ids: [witness_id] }, { root: true }));

          case 5:
            witness_res = _context2.sent;

            if (!(witness_res.code != 1)) {
              _context2.next = 8;
              break;
            }

            return _context2.abrupt('return', witness_res);

          case 8:
            _witness_res$data$ = witness_res.data[0], url = _witness_res$data$.url, signing_key = _witness_res$data$.signing_key, work_status = _witness_res$data$.work_status;

            if (params.newUrl != undefined) url = params.newUrl;
            if (params.newSigningKey != undefined && params.newSigningKey != "") signing_key = params.newSigningKey;
            if (params.workStatus != undefined) work_status = !!params.workStatus;
            return _context2.abrupt('return', dispatch('transactions/_transactionOperations', {
              operations: [{
                op_type: 19,
                type: "witness_update",
                params: {
                  witness: witness_id,
                  witness_account: account.id,
                  new_url: url,
                  new_signing_key: signing_key,
                  work_status: work_status
                }
              }]
            }, { root: true }));

          case 15:
            return _context2.abrupt('return', {
              code: 180, message: "Not a witness"
            });

          case 16:
          case 'end':
            return _context2.stop();
        }
      }
    }, null, undefined);
  },
  committeeMemberUpdate: function committeeMemberUpdate(_ref9, params) {
    var dispatch = _ref9.dispatch;

    var account, committee_id, committee_res, _committee_res$data$, url, work_status;

    return _regenerator2.default.async(function committeeMemberUpdate$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            account = params.account;

            if (!account.committee_status) {
              _context3.next = 14;
              break;
            }

            committee_id = account.committee_status[0];
            _context3.next = 5;
            return _regenerator2.default.awrap(dispatch("explorer/getDataByIds", { ids: [committee_id] }, { root: true }));

          case 5:
            committee_res = _context3.sent;

            if (!(committee_res.code != 1)) {
              _context3.next = 8;
              break;
            }

            return _context3.abrupt('return', committee_res);

          case 8:
            _committee_res$data$ = committee_res.data[0], url = _committee_res$data$.url, work_status = _committee_res$data$.work_status;

            if (params.newUrl != undefined) url = params.newUrl;
            if (params.workStatus != undefined) work_status = !!params.workStatus;
            return _context3.abrupt('return', dispatch('transactions/_transactionOperations', {
              operations: [{
                op_type: 24,
                type: "committee_member_update",
                params: {
                  committee_member: committee_id,
                  committee_member_account: account.id,
                  new_url: url,
                  work_status: work_status
                }
              }]
            }, { root: true }));

          case 14:
            return _context3.abrupt('return', {
              code: 180, message: "Not a committee"
            });

          case 15:
          case 'end':
            return _context3.stop();
        }
      }
    }, null, undefined);
  }
};

var mutations = (_mutations = {}, (0, _defineProperty3.default)(_mutations, types.SET_ALL_WITNESSES_COMMITTEE, function (state, params) {
  state.all_witnesses = params.all_witnesses;
  state.all_committee = params.all_committee;
}), (0, _defineProperty3.default)(_mutations, types.SET_ALL_TYPE, function (state, type) {
  state.all_type = type;
}), (0, _defineProperty3.default)(_mutations, types.SET_GLOBAL_OBJECT, function (state, globalObject) {
  state.globalObject = globalObject;
}), (0, _defineProperty3.default)(_mutations, types.SET_VOTES_STATE, function (state, votes_state) {
  state.votes_state = votes_state;
}), (0, _defineProperty3.default)(_mutations, types.set_getVoteObjects_callback, function (state, callback) {
  state.getVoteObjects_callback = callback;
}), (0, _defineProperty3.default)(_mutations, types.set_publishVotes_callback, function (state, callback) {
  state.publishVotes_callback = callback;
}), (0, _defineProperty3.default)(_mutations, types.SET_VOTE_IDS_OBJ, function (state, vote_ids_obj) {
  state.vote_ids_obj = vote_ids_obj;
}), (0, _defineProperty3.default)(_mutations, types.SET_VOTE_IDS, function (state, ids) {
  state.vote_ids = ids;
}), (0, _defineProperty3.default)(_mutations, types.SET_QUERY_ACCOUNT, function (state, account) {
  state.queryAccount = account;
}), _mutations);

exports.default = {
  state: initialState,
  actions: actions,
  mutations: mutations,
  getters: getters,
  namespaced: true
};