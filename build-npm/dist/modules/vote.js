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
        isExplorer = _ref$isExplorer === undefined ? false : _ref$isExplorer;
    var dispatch = store.dispatch,
        rootGetters = store.rootGetters,
        commit = store.commit,
        state = store.state;

    commit(types.SET_ALL_TYPE, type);
    commit(types.set_getVoteObjects_callback, callback);
    commit(types.SET_QUERY_ACCOUNT, queryAccount);
    state.isExplorer = isExplorer;
    _api2.default.Vote._getVoteObjects(store, type);
  },
  publishVotes: function publishVotes(store, _ref2) {
    var _ref2$witnesses_ids = _ref2.witnesses_ids,
        witnesses_ids = _ref2$witnesses_ids === undefined ? null : _ref2$witnesses_ids,
        _ref2$committee_ids = _ref2.committee_ids,
        committee_ids = _ref2$committee_ids === undefined ? null : _ref2$committee_ids,
        new_proxy_id = _ref2.new_proxy_id,
        _ref2$onlyGetFee = _ref2.onlyGetFee,
        onlyGetFee = _ref2$onlyGetFee === undefined ? false : _ref2$onlyGetFee,
        _callback = _ref2.callback,
        feeAssetId = _ref2.feeAssetId;
    var commit, getters, dispatch;
    return _regenerator2.default.async(function publishVotes$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            commit = store.commit, getters = store.getters, dispatch = store.dispatch;


            dispatch("getVoteObjects", { type: "witnesses", callback: function callback(res) {

                if (res.code != 1) {
                  _callback && _callback(res);
                  return;
                }

                var _getters$getVotesStat = getters.getVotesState,
                    witnesses = _getters$getVotesStat.witnesses,
                    committee = _getters$getVotesStat.committee,
                    proxy_account_id = _getters$getVotesStat.proxy_account_id;

                if (!witnesses_ids) {
                  witnesses_ids = witnesses.toArray();
                }
                if (!committee_ids) {
                  committee_ids = committee.toArray();
                }

                if (new_proxy_id) {
                  dispatch("user/getUserInfo", { account: new_proxy_id, isCache: true }, { root: true }).then(function (proxy_acc_res) {
                    if (proxy_acc_res.code == 1) {
                      new_proxy_id = proxy_acc_res.data.account.id;
                      _api2.default.Vote.publishVotes(store, witnesses_ids, committee_ids, new_proxy_id, _callback, onlyGetFee, feeAssetId);
                    } else {
                      _callback && _callback(proxy_acc_res);
                      return;
                    }
                  });
                } else {
                  _api2.default.Vote.publishVotes(store, witnesses_ids, committee_ids, new_proxy_id, _callback, onlyGetFee, feeAssetId);
                }
              } });

          case 2:
          case 'end':
            return _context.stop();
        }
      }
    }, null, undefined);
  },
  setGlobalObject: function setGlobalObject(_ref3, GB) {
    var commit = _ref3.commit;

    commit(types.SET_GLOBAL_OBJECT, GB);
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