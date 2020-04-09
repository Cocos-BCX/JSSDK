import Vue from 'vue';
import * as types from '../mutations';
import * as actions from '../actions/assets';
import * as getters from '../getters/assets';
import Immutable from "immutable";
import ls from "../lib/common/localStorage";

const STORAGE_KEY = "__gph__";

let accountStorage = null;
try{
  accountStorage = new ls(STORAGE_KEY)
}catch(e){
}
const initialState = {
  defaultAssetsIds: [],
  assets:Immutable.fromJS({}),
  assets_arr:[],
  asset_symbol_to_id:{},
  cache_assets:{},
  pending: false,
  assetsFetched:0,
  totalAssets:(process.browser||true)?(accountStorage&&typeof accountStorage.get("totalAssets") != "object"
      ? accountStorage.get("totalAssets")
      : 3000):300
};

const mutations = {
  [types.FETCH_ASSETS_REQUEST](state) {
    state.pending = true;
  },
  [types.FETCH_ASSETS_COMPLETE](state, { assets }) {
    Object.keys(assets).forEach(id => {
      Vue.set(state.cache_assets, id, assets[id]);
    });
    // state.pending = false;
  },
  [types.FETCH_ASSETS_ERROR](state) {
    state.pending = false;
  },
  [types.SAVE_DEFAULT_ASSETS_IDS](state, { ids }) {
    state.defaultAssetsIds = ids;
  },
  [types.SET_ASSETS](state,assets){
    state.cache_assets=assets;
  }
};

export default {
  state: initialState,
  actions,
  mutations,
  getters,
  namespaced: true
};
