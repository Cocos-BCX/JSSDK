import * as actions from '../actions/account';
import * as types from '../mutations';
import * as getters from '../getters/account';


const initialState = {
  passwordPubkey: null,
  encryptedBrainkey: null,
  encrypted_key:null,
  brainkeyBackupDate: null,
  encryptionKey: null,
  created: null,
  aesPrivate: null,
  userId: null,
  error: null,
  pending: false,
  keys:null,
  callback:null,
  userData: null,
  userFetching: false,
  userError: false,
  imported_keys_public:{},
  keys_to_account:{}
};

const mutations = {
  [types.ACCOUNT_SIGNUP_REQUEST]: (state) => {
    state.pending = true;
  },
  [types.ACCOUNT_SIGNUP_COMPLETE]: (state, { wallet, userId }) => {
    state.pending = false;
    state.passwordPubkey = wallet.passwordPubkey;
    state.encrypted_key = wallet.encrypted_key;
    state.encryptionKey = wallet.encryptionKey;
    // state.aesPrivate = wallet.aesPrivate;
    state.brainkeyBackupDate = null;
    state.created = new Date();
    state.userId = userId;
  },
  [types.ACCOUNT_SIGNUP_ERROR]: (state, { error }) => {
    state.pending = false;
    state.error = error;
  },
  [types.ACCOUNT_LOGIN_REQUEST]: (state) => {
    state.pending = true;
  },
  [types.ACCOUNT_LOGIN_COMPLETE]: (state, { wallet, userId }) => {
    state.pending = false;
    state.userId = userId;
    if(wallet){
      state.passwordPubkey = wallet.passwordPubkey;
      state.encrypted_key = wallet.encrypted_key;
      state.encryptionKey = wallet.encryptionKey;
      // state.aesPrivate = wallet.aesPrivate;
      state.wallet=wallet;
    }
  },
  [types.ACCOUNT_LOGIN_ERROR]: (state, { error }) => {
    state.pending = false;
    state.error = error;
  },
  [types.ACCOUNT_BRAINKEY_BACKUP]: (state) => {
    state.brainkeyBackupDate = Date();
  },
  [types.ACCOUNT_LOCK_WALLET]: (state) => {
    state.aesPrivate = null;
  },
  [types.ACCOUNT_UNLOCK_WALLET]: (state, aesPrivate) => {
    state.aesPrivate = aesPrivate;
  },
  [types.SET_ACCOUNT_USER_DATA]: (state, { userId, encryptedBrainkey,
encryptionKey, backupDate, passwordPubkey }) => {
    //state.userId = userId;
    // state.encryptedBrainkey = encryptedBrainkey; 
    // state.encryptionKey = encryptionKey;
    state.brainkeyBackupDate = backupDate;
    //state.passwordPubkey = passwordPubkey;
  },
  [types.ACCOUNT_LOGOUT]: (state) => {
    state.passwordPubkey = null;
    state.encryptedBrainkey = null;
    state.brainkeyBackupDate = null;
    state.encryptionKey = null;
    state.created = null;
    state.aesPrivate = null;
    state.userId = null;
    state.error = null;
    state.pending = false;
  },
  [types.FETCH_CURRENT_USER_REQUEST]: (state) => {
    state.userFetching = true;
  },
  [types.FETCH_CURRENT_USER_COMPLETE]: (state, { data }) => {
    state.userFetching = false;
    state.userData = data;
  },
  [types.FETCH_CURRENT_USER_ERROR]: (state) => {
    state.userFetching = false;
    state.userError = false;
  },
  [types.SET_PASSWORD_LONGIN_KEY]: (state,  keys) => {
    state.keys = keys;
  },
  [types.SET_CALLBACK]: (state, callback) => {
  
    state.callback = callback;
  }
};

export default {
  state: initialState,
  mutations,
  actions,
  getters,
  namespaced: true
};
