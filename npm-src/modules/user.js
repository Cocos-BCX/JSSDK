import * as types from '../mutations';
import * as actions from '../actions/user';
import * as getters from '../getters/user';

const initialState = {
  account: null,
  allAccount:null,
  balances: [],
  fetching: false,
  error: false
};

const mutations = {
  [types.FETCH_USER_REQUEST](state) {
    state.fetching = true;
    state.error = false;
  },
  [types.FETCH_USER_COMPLETE](state, result) {
    state.account = result.account;
    state.balances = result.balances;
    state.allAccount=result;
    state.fetching = false;
  },
  [types.FETCH_USER_ERROR](state) {
    state.fetching = false;
    state.error = true;
  },
  [types.CLEAR_ACCOUNT](state) {
    state.account = null;
    state.balances = [];
  },
};

export default {
  state: initialState,
  actions,
  getters,
  mutations,
  namespaced: true
};
