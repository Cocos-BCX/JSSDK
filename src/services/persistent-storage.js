import Cookies from 'js-cookie';

let _host=(process.browser?window.location.host:"GPH")+"_"+"1.4";
// Persistent Storage for data cache management
const PersistentStorage = {
  saveUserData: ({ id, encrypted_key, encryptionKey, passwordPubkey,activePubkey }) => {
    Cookies.set(_host+'GPH_USER_ID', id, { expires: 365 });
    Cookies.set(_host+'GPH_USER_ENCRYPTED_KEY', encrypted_key, { expires: 365 });
    Cookies.set(_host+'GPH_ENCRYPTION_KEY', encryptionKey, { expires: 365 });
    Cookies.set(_host+'GPH_PASSWORD_PUBKEY', passwordPubkey, { expires: 365 });
    Cookies.set(_host+'GPH_ACTIVE_PUBKEY', activePubkey, { expires: 365 });
  },
  getSavedUserData: () => {
    const userId = Cookies.get(_host+'GPH_USER_ID');
    const encrypted_key = Cookies.get(_host+'GPH_USER_ENCRYPTED_KEY');
    const encryptionKey = Cookies.get(_host+'GPH_ENCRYPTION_KEY');
    const backupDate = Cookies.get(_host+'BACKUP_DATE');
    const passwordPubkey = Cookies.get(_host+'GPH_PASSWORD_PUBKEY');
    const activePubkey = Cookies.get(_host+'GPH_ACTIVE_PUBKEY');
    if (!userId || !encrypted_key || !encryptionKey || !passwordPubkey) return null;
    if (typeof (userId) !== 'string') return null;
    return {
      userId,
      encrypted_key,
      encryptionKey,
      backupDate,
      passwordPubkey,
      activePubkey
    };
  },
  clearUserData:()=>{
    Cookies.remove(_host+'GPH_USER_ID');
    Cookies.remove(_host+'GPH_USER_ENCRYPTED_KEY');
    Cookies.remove(_host+'GPH_ENCRYPTION_KEY');
    Cookies.remove(_host+'BACKUP_DATE');
    Cookies.remove(_host+'GPH_PASSWORD_PUBKEY');
    Cookies.remove(_host+'GPH_ACTIVE_PUBKEY');
  },
  clearNodesData:()=>{
    Cookies.remove(_host+'GPH_NODES');
  },
  saveNodesData: ({ data }) => {
    Cookies.set(_host+'GPH_NODES', data);
  },
  getSavedNodesData: () => {
    const cachedData = Cookies.getJSON(_host+'GPH_NODES');
    if (typeof (cachedData) === 'object' && cachedData !== null) {
      return cachedData;
    }
    return {};
  },
  saveBackupDate: ({ date, userId }) => {
    let backupDateArray = Cookies.get(_host+'BACKUP_DATE');
    if (backupDateArray === undefined) {
      backupDateArray = [{ userId, date }];
    } else {
      try {
        const backupDateFromString = JSON.parse(backupDateArray);
        const foundObj = backupDateFromString.some(item => item.userId === userId);
        if (!foundObj) {
          backupDateFromString.push({ userId, date });
          backupDateArray = JSON.stringify(backupDateFromString);
        }
      } catch (ex) {
        backupDateArray = [{ userId, date }];
      }
    }
    Cookies.set(_host+'BACKUP_DATE', backupDateArray, { expires: 365 });
  }
};

export default PersistentStorage;
