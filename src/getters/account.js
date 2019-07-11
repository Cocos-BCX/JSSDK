import { PrivateKey, key } from 'bcxjs-cores';
import * as WalletDb from '../store/WalletDb';

const ACTIVE_KEY_INDEX = 0;
const OWNER_KEY_INDEX = 1;

export const getBrainkey = state => {
  if (!state.aesPrivate) return null;
  return state.aesPrivate.decryptHexToText(state.encryptedBrainkey);
};

export const getKeys = state => {
  const brainkey = getBrainkey(state);
  return null;
  if (!brainkey) return null;
  // return {
  //   active: key.get_brainPrivateKey(brainkey, ACTIVE_KEY_INDEX),
  //   owner: key.get_brainPrivateKey(brainkey, OWNER_KEY_INDEX)
  // };
  let keys=state.keys;
  if(keys&&keys[_passwordKey]){
      return keys._passwordKey;
  }else{
      return null;
  }
};

export const isValidPassword = state => {
  return password => {
    const passwordPrivate = PrivateKey.fromSeed(password);
    const passwordPubkey = passwordPrivate.toPublicKey().toPublicKeyString();
    return passwordPubkey === state.passwordPubkey;
  };
  
};

// export const isLocked = state => {
//   return state.aesPrivate == null;
// };

export const getAccountError = state => {
  return state.error;
};

export const getAccountUserId = state => {
  return state.userId;
};

export const getAccountPendingState = state => {
  return state.pending;
};

export const getWallet = state => {
  return {
    passwordPubkey:state.passwordPubkey,
    encryptedBrainkey:state.encryptedBrainkey,
    encryptionKey:state.encryptionKey,
    encrypted_key:state.encrypted_key
  }
};

