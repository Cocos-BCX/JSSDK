import Vue from 'vue';
import * as types from '../mutations';
import API from '../services/api';

const actions = {
  fetch: (store, { assetsIds, baseId, days }) => {
    const { commit, rootGetters } = store;
    const assets = rootGetters['assets/getAssets'];
    const baseAsset = assets[baseId];

    commit(types.FETCH_PRICES_HISTORY_REQUEST, { baseId });
    Promise.all(assetsIds.map(async (assetId) => {
      // console.info('assets[assetId]',baseAsset,assetId,assets[assetId]);
      const prices = await API.Assets.fetchPriceHistory(baseAsset, assets[assetId], days);
      if (!prices) throw new Error('error market history');
      return {
        assetId,
        prices
      };
    })).then((pricesObjects) => {
      const prices = pricesObjects.reduce((result, obj) => {
        result[obj.assetId] = obj.prices;
        return result;
      }, {});
      // console.info('prices',prices);
      commit(types.FETCH_PRICES_HISTORY_COMPLETE, { days, prices });
    }).catch((err) => {
      commit(types.FETCH_PRICES_HISTORY_ERROR);
      console.log(err);
    });
  }
};

const getters = {
  getByDay: state => {
    return (days) => {
      return state.days[days] || {};
    };
  },
  isFetching: state => state.fetching,
  getAssetHistoryByDay: state => {
    return (id, day) => {
      if (!state.days[day]) return { first: 0, last: 0 };
      return state.days[day][id] || { first: 0, last: 0 };
    };
  },
  getHistoryAssetMultiplier: state => {
    return (days, assetId) => {
      if (!state.days[days] || !state.days[days][assetId]) {
        return {
          first: 0,
          last: 0
        };
      }
      return {
        first: 1 / state.days[days][assetId].first,
        last: 1 / state.days[days][assetId].last
      };
    };
  }
};

const initialState = {
  days: {},
  fetching: false,
  error: false,
  baseId: ''
};

const mutations = {
  [types.FETCH_PRICES_HISTORY_REQUEST](state, { baseId }) {
    state.fetching = true;
    state.baseAssetId = baseId;
  },
  [types.FETCH_PRICES_HISTORY_COMPLETE](state, { prices, days }) {
    state.fetching = false;
    Vue.set(state.days, days, prices);
  },
  [types.FETCH_PRICES_HISTORY_ERROR](state) {
    state.fetching = false;
    state.error = true;
  }
};

export default {
  state: initialState,
  actions,
  getters,
  mutations,
  namespaced: true
};
