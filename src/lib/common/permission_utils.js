import {ChainStore} from "bcxjs-cores";
import Immutable from "immutable";
import API from '../../services/api';

let KeyAuth = function(auth) {
    this.id = auth.toJS ? auth.get(0) : auth[0];
    this.weight = auth.toJS ? auth.get(1) : auth[1];

    this.isAvailable = (auths) => {
        return auths.includes ? auths.includes(this.id) : auths.indexOf(this) !== -1;
    };
};

let permissionUtils = {

    AccountPermission: function(account, weight, type) {
        this.id = account.get("id");
        this.account_name=account.get("name");
        this.weight = weight;
        this.threshold = account.getIn([type, "weight_threshold"]);
        // console.info("account",type,JSON.parse(JSON.stringify(account)));
        this.accounts = [];
        this.keys = account.getIn([type, "key_auths"]).map(auth => {
            return new KeyAuth(auth);
        }).toArray();
        this.isAvailable = (auths) => {
            return auths.includes ? auths.includes(this.id) : auths.indexOf(this) !== -1;
        };

        this._sumWeights = (auths) => {

            if (!this.isNested() && !this.isMultiSig()) {
                return this.isAvailable(auths) ? this.weight : 0;
            } else {
                let sum = this.accounts.reduce((status, account) => {
                    return status + (account._sumWeights(auths) ? account.weight : 0);
                }, 0);
                return Math.floor((sum / this.threshold));
            }
        };
        this.getStatus = (auths, keyAuths) => {
            if (!this.isNested()) {
                let sum = this._sumWeights(auths);

                if (this.isMultiSig()) {
                    sum += this.sumKeys(keyAuths);
                }
                return sum;
            } else {
                let sum = this.accounts.reduce((status, account) => {
                    return status + account._sumWeights(auths);
                }, 0);

                if (this.keys.length) {
                    sum += this.sumKeys(keyAuths);
                }

                return sum;
            }
        };

        this.sumKeys = (keyAuths) => {
            let keySum = this.keys.reduce((s, key) => {
                return s + (key.isAvailable(keyAuths) ? key.weight : 0);
            }, 0);
            return keySum;
        };

        this.isNested = () => {
            return this.accounts.length > 0;
        };

        this.isMultiSig = () => {
            return this.keys.reduce((final, key) => {
                return final || key.weight < this.threshold;
            }, false);
        };

        this.getMissingSigs = (auths) => {
            let missing  = [];
            let nested = [];
            if (this.isNested()) {
                nested = this.accounts.reduce((a, account) => {
                    return a.concat(account.getMissingSigs(auths));
                }, []);
            } else if (!this.isAvailable(auths)) {
                missing.push(this.id);
            }

            return missing.concat(nested);
        };

        this.getMissingKeys = (auths) => {
            let missing = [];
            let nested = [];
            if (this.keys.length && (this.isNested() || this.isMultiSig())) {
                this.keys.forEach(key => {
                    if (!key.isAvailable(auths)) {
                        missing.push(key.id);
                    }
                });
            }

            if (this.isNested()) {
                nested = this.accounts.reduce((a, account) => {
                    return a.concat(account.getMissingKeys(auths));
                }, []);
            };

            return missing.concat(nested);
        }
    },

    listToIDs: function(accountList) {
        let allAccounts = [];
        accountList.forEach(account => {
            if (account) {
                allAccounts.push(account.id ? account.id: account);
            }
        });

        return allAccounts;
    },

    async unravel (accountPermission, type, recursive_count = 0){
        if (recursive_count < 3) {
            let account =Immutable.fromJS((await API.Account.getAccount(accountPermission.id,false)).data.account);
            if (account && account.getIn([type, "account_auths"]).size) {
                await Promise.all(account.getIn([type, "account_auths"]).map(async auth=>{
                    let nestedAccount =(await API.Account.getAccount(auth.get(0),false)).data.account;
                    if (nestedAccount) {
                        accountPermission.accounts.push(await this.unravel(new this.AccountPermission(Immutable.fromJS(nestedAccount), auth.get(1), type), type, recursive_count + 1));
                    }
                    return true;
                }))
            }
        }
        return accountPermission;
    },

    unnest: function(accounts, type) {
       return Promise.all(accounts.map(async id => {
            let fullAccount =(await API.Account.getAccount(id,false)).data.account;
            let currentPermission = await this.unravel(new this.AccountPermission(Immutable.fromJS(fullAccount), null, type), type);
            return currentPermission;
        }));
    }, 


    flatten_auths(auths, existingAuths = Immutable.List()) {
        if (!auths.size) {
            return existingAuths;
        }

        auths.forEach(owner => {
            if (!existingAuths.includes(owner.get(0))) {
                existingAuths = existingAuths.push(owner.get(0));
            }
        });
        return existingAuths;
    }
}

export default permissionUtils;
