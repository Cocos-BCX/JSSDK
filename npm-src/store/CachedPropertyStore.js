import * as types from '../mutations';
import iDB from "../services/api/wallet/idb-instance";
import Immutable from "immutable";


const initialState = {
    props: Immutable.Map()
};

const getters={
}

const actions={
    reset:({state})=>{
        state.props=Immutable.Map();
    },
    Set:({state},{ name, value })=>{
        if(state.props.get(name) === value) return
        var props = state.props.set(name, value)
        state.props = props
        iDB.setCachedProperty(name, value).then(()=>{
            //state.props = props
        })
    }
}




const mutations = {
};

export default {
  state: initialState,
  actions,
  mutations,
  getters,
  namespaced: true
};
