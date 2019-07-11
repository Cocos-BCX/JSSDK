/**
 * Returns current user's name string
 */
export function getUserName({ account }) {
  return account && account.name;
}

/**
 * Returns current user's account object
 */
export function getAccountObject({ account }) {
  return account;
}

export function getAllAccountObject({ allAccount }) {
  return allAccount;
}


export const getCurrentUserBalances = state => {
  return (state.allAccount && state.allAccount.balances) || {};
};
/**
 * Returns current users's balances object
 */
export function getBalances({ balances }) {
  return balances;
}

/**
 * User fetching in progress indicator
 */
export function isFetching(state) {
  return state.fetching;
}

export function getAccountExtensions(state) {
  return state.account.options.extensions;
}


export function proxy_account_id({account}){
  let proxyId=account.options.voting_account;
  let proxy_account_id=proxyId === "1.2.5" ? "" : proxyId;
  return proxy_account_id;
}