'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _vue = require('vue');

var _vue2 = _interopRequireDefault(_vue);

var _vuex = require('vuex');

var _vuex2 = _interopRequireDefault(_vuex);

var _setting = require('./modules/setting.js');

var _setting2 = _interopRequireDefault(_setting);

var _account = require('./modules/account.js');

var _account2 = _interopRequireDefault(_account);

var _connection = require('./modules/connection.js');

var _connection2 = _interopRequireDefault(_connection);

var _transactions = require('./modules/transactions.js');

var _transactions2 = _interopRequireDefault(_transactions);

var _user = require('./modules/user.js');

var _user2 = _interopRequireDefault(_user);

var _assets = require('./modules/assets.js');

var _assets2 = _interopRequireDefault(_assets);

var _market = require('./modules/market.js');

var _market2 = _interopRequireDefault(_market);

var _operations = require('./modules/operations.js');

var _operations2 = _interopRequireDefault(_operations);

var _PrivateKeyStore = require('./modules/PrivateKeyStore.js');

var _PrivateKeyStore2 = _interopRequireDefault(_PrivateKeyStore);

var _WalletDb = require('./modules/WalletDb.js');

var _WalletDb2 = _interopRequireDefault(_WalletDb);

var _contract = require('./modules/contract.js');

var _contract2 = _interopRequireDefault(_contract);

var _history = require('./modules/history.js');

var _history2 = _interopRequireDefault(_history);

var _vote = require('./modules/vote.js');

var _vote2 = _interopRequireDefault(_vote);

var _NHAssets = require('./modules/NHAssets.js');

var _NHAssets2 = _interopRequireDefault(_NHAssets);

var _proposals = require('./modules/proposals.js');

var _proposals2 = _interopRequireDefault(_proposals);

var _explorer = require('./modules/explorer.js');

var _explorer2 = _interopRequireDefault(_explorer);

var _AddressIndex = require('./store/AddressIndex.js');

var _AddressIndex2 = _interopRequireDefault(_AddressIndex);

var _AccountRefsStore = require('./store/AccountRefsStore.js');

var _AccountRefsStore2 = _interopRequireDefault(_AccountRefsStore);

var _WalletManagerStore = require('./store/WalletManagerStore.js');

var _WalletManagerStore2 = _interopRequireDefault(_WalletManagerStore);

var _CachedPropertyStore = require('./store/CachedPropertyStore.js');

var _CachedPropertyStore2 = _interopRequireDefault(_CachedPropertyStore);

var _BackupStore = require('./store/BackupStore.js');

var _BackupStore2 = _interopRequireDefault(_BackupStore);

var _AccountStore = require('./store/AccountStore.js');

var _AccountStore2 = _interopRequireDefault(_AccountStore);

var _index = require('./utils/index');

var utils = _interopRequireWildcard(_index);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// require('babel-polyfill');
require('bcxjs-indexeddbshim');

var BCX = function () {
  function BCX(params) {
    var _modules;

    (0, _classCallCheck3.default)(this, BCX);

    //Vuex.Storeinitialization
    _vue2.default.use(_vuex2.default);
    this.api = new _vuex2.default.Store({
      modules: (_modules = {
        setting: _setting2.default,
        account: _account2.default,
        transactions: _transactions2.default,
        connection: _connection2.default,
        user: _user2.default,
        assets: _assets2.default
      }, (0, _defineProperty3.default)(_modules, 'setting', _setting2.default), (0, _defineProperty3.default)(_modules, 'market', _market2.default), (0, _defineProperty3.default)(_modules, 'history', _history2.default), (0, _defineProperty3.default)(_modules, 'operations', _operations2.default), (0, _defineProperty3.default)(_modules, 'PrivateKeyStore', _PrivateKeyStore2.default), (0, _defineProperty3.default)(_modules, 'WalletDb', _WalletDb2.default), (0, _defineProperty3.default)(_modules, 'contract', _contract2.default), (0, _defineProperty3.default)(_modules, 'vote', _vote2.default), (0, _defineProperty3.default)(_modules, 'NHAssets', _NHAssets2.default), (0, _defineProperty3.default)(_modules, 'proposals', _proposals2.default), (0, _defineProperty3.default)(_modules, 'explorer', _explorer2.default), (0, _defineProperty3.default)(_modules, 'AddressIndex', _AddressIndex2.default), (0, _defineProperty3.default)(_modules, 'AccountRefsStore', _AccountRefsStore2.default), (0, _defineProperty3.default)(_modules, 'WalletManagerStore', _WalletManagerStore2.default), (0, _defineProperty3.default)(_modules, 'CachedPropertyStore', _CachedPropertyStore2.default), (0, _defineProperty3.default)(_modules, 'BackupStore', _BackupStore2.default), (0, _defineProperty3.default)(_modules, 'AccountStore', _AccountStore2.default), _modules)
    });

    this.apiMethodsInt();

    this.apiConfig(params, false);
  }

  (0, _createClass3.default)(BCX, [{
    key: 'getApiConfig',
    value: function getApiConfig() {
      return this.api.getters["setting/getApiConfig"];
    }
  }, {
    key: 'apiConfig',
    value: function apiConfig(params) {
      var _this = this;

      var isSwitchNode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      //API parameters initialization
      if (isSwitchNode) {
        return this.api.dispatch("setting/setSettingsAPIS", params).then(function (res) {
          return _this.switchAPINode({
            url: _this.api.getters["setting/g_settingsAPIs"].select_ws_node,
            callback: params.callback
          });
        });
      } else {
        return this.api.dispatch("setting/setSettingsAPIS", params);
      }
    }

    //initialization and connect websocket. Can be called without initialization, API will automatic initialization if not initialized.

  }, {
    key: 'init',
    value: function init(params) {
      var _this2 = this;

      if (params && (params.callback || typeof params == "function")) {
        this.api.dispatch("connection/initConnection", params);
      } else {
        return new _promise2.default(function (resolve) {
          //using params.callback, to compatible with API.
          if ((typeof params === 'undefined' ? 'undefined' : (0, _typeof3.default)(params)) != "object") params = {};
          params.callback = function (res) {
            return resolve(res);
          };
          _this2.api.dispatch("connection/initConnection", params);
        });
      }
    }
    //abstractable methods initialization

  }, {
    key: 'apiMethodsInt',
    value: function apiMethodsInt() {
      var _this3 = this;

      var apiMethods = {
        queryAccountInfo: "user/getUserInfo", //query user info 
        queryAccountBalances: "user/getAccountBalances", //query account's specified asset
        queryAccountAllBalances: "user/getUserAllBalance", //query account's owned assets
        queryTransactionBaseFee: "assets/getTransactionBaseFee", //get transaction base fee
        createAccountWithPassword: "account/createAccountWithPassword",
        createAccountWithPublicKey: "account/createAccountWithPublicKey",
        passwordLogin: "account/passwordLogin",
        logout: "account/_logout",
        createAccountWithWallet: "account/createAccountWithWallet",
        backupDownload: "WalletDb/backupDownload", //backup wallet file and download
        loadWalletFile: "BackupStore/incommingWebFile", //load wallet file
        restoreWallet: "BackupStore/onRestore", //restore wallet with wallet file
        deleteWallet: "WalletManagerStore/deleteWallet",
        importPrivateKey: "account/importPrivateKey",
        lockAccount: "WalletDb/lockWallet",
        queryContract: "contract/getContract",
        queryAccountContractData: "contract/queryAccountContractData", //query account's contract info
        queryNHAssetOrders: "NHAssets/queryNHAssetOrders",
        queryNHAssets: "NHAssets/lookupNHAssets", //query NHA's info
        queryWorldViews: "NHAssets/lookupWorldViews",
        queryBlock: "explorer/queryBlock",
        queryTransaction: "explorer/queryTransaction",
        lookupWitnessesForExplorer: "explorer/getExplorerWitnesses", //query blocks production info
        claimVestingBalance: "account/claimVestingBalance",
        lookupWSNodeList: "connection/lookupWSNodeList", //get API server list
        deleteAPINode: "connection/deleteAPINode", //delete an API server address
        addAPINode: "setting/addAPINode", //add an API server address
        queryAssets: "assets/queryAssets",
        queryDynGlobalObject: "explorer/getDynGlobalObject",
        unsubscribe: "operations/unsubscribe",
        queryDataByIds: "explorer/getDataByIds",
        queryPriceHistory: "market/queryPriceHistory",
        queryAssetRestricted: "assets/queryAssetRestricted"
      };
      var use_accountOpt_methods = {
        getPrivateKey: "account/_getPrivateKey",
        changePassword: "account/changePassword",
        upgradeAccount: "account/upgradeAccount",
        lookupBlockRewards: "account/getVestingBalances",

        registerCreator: "NHAssets/registerCreator",
        creatWorldView: "NHAssets/creatWorldView",
        creatNHAsset: "NHAssets/creatNHAsset",
        deleteNHAsset: "NHAssets/deleteNHAsset",
        cancelNHAssetOrder: "NHAssets/cancelNHAssetOrder",
        fillNHAssetOrder: "NHAssets/fillNHAssetOrder", //Order matching
        approvalProposal: "proposals/submitProposal",
        relateNHAsset: "NHAssets/relateNHAsset", //Compose NHAs

        createAsset: "assets/_createAsset",
        issueAsset: "assets/issueAsset",
        updateAsset: "assets/_updateAsset",
        reserveAsset: "assets/reserveAsset",
        assetFundFeePool: "assets/assetFundFeePool",
        assetClaimFees: "assets/assetClaimFees",
        assetUpdateRestricted: "assets/assetUpdateRestricted",
        assetPublishFeed: "assets/assetPublishFeed",
        assetUpdateFeedProducers: "assets/assetUpdateFeedProducers",
        assetGlobalSettle: "assets/assetGlobalSettle",
        assetSettle: "assets/assetSettle",

        createLimitOrder: "market/createLimitOrder",
        cancelLimitOrder: "market/cancelLimitOrder",

        createContract: "contract/createContract",
        updateContract: "contract/updateContract",
        callContractFunction: "contract/callContractFunction",

        transferAsset: "transactions/transferAsset",
        setCurrentAccount: "AccountStore/setCurrentAccount",
        proposeRelateWorldView: "NHAssets/proposeRelateWorldView"
      };

      var use_validateAccount_methods = {
        queryUserOperations: "operations/queryUserOperations", //query account history
        queryAccountOperations: "operations/queryUserOperations",
        queryNHCreator: "NHAssets/queryNHCreator", //query a developer and its worldviews
        queryAccountNHAssets: "NHAssets/queryAccountNHAssets",
        queryAccountNHAssetOrders: "NHAssets/queryAccountNHAssetOrders",
        queryNHAssetsByCreator: "NHAssets/queryNHAssetsByCreator",
        getAccountProposals: "proposals/loadAccountProposals"
      };

      var _loop = function _loop(key) {
        _this3[key] = function (params) {
          return _this3.promiseCompatible(apiMethods[key], params);
        };
      };

      for (var key in apiMethods) {
        _loop(key);
      }

      var _loop2 = function _loop2(key) {
        _this3[key] = function (params) {
          return _this3.promiseCompatible('account/_accountOpt', {
            method: use_accountOpt_methods[key],
            params: params,
            callback: params ? params.callback : null
          });
        };
      };

      for (var key in use_accountOpt_methods) {
        _loop2(key);
      }

      var _loop3 = function _loop3(key) {
        _this3[key] = function (params) {
          if (!params) params = {};
          return _this3.promiseCompatible('account/_validateAccount', {
            method: use_validateAccount_methods[key],
            params: params,
            account: params.account || _this3.getAccountInfo().account_id,
            callback: params.callback
          });
        };
      };

      for (var key in use_validateAccount_methods) {
        _loop3(key);
      }
    }

    //return promise when callback isnot income

  }, {
    key: 'promiseCompatible',
    value: function promiseCompatible(methodPath, params) {
      var _this4 = this;

      var initPromise = void 0;
      if (this.api.getters["connection/isWsConnected"]) {
        initPromise = this.api.dispatch(methodPath, params);
      } else {
        initPromise = this.init().then(function (init_res) {
          return init_res.code == 1 ? _this4.api.dispatch(methodPath, params) : init_res;
        });
      }

      if (!params || !params.callback) return initPromise;
      initPromise.then(function (res) {
        params.callback(res);
      });
    }

    /*************Interfaces need Special Parameters processing***start****/

  }, {
    key: 'transferNHAsset',
    value: function transferNHAsset(params) {
      var toAccount = params.toAccount,
          callback = params.callback;

      return this.promiseCompatible("account/_validateAccount", {
        method: "NHAssets/transferNHAsset",
        params: params,
        account: toAccount,
        accountFieldName: "to_account_id",
        callback: callback
      });
    }
  }, {
    key: 'creatNHAssetOrder',
    value: function creatNHAssetOrder(params) {
      return this.promiseCompatible("account/_validateAccount", {
        method: "NHAssets/creatNHAssetOrder",
        params: params,
        account: params.otcAccount,
        accountFieldName: "otc_account_id",
        callback: params.callback
      });
    }
  }, {
    key: 'disconnect',
    value: function disconnect(params) {
      if (typeof params == "function") {
        params = { callback: params };
      }
      return this.promiseCompatible("connection/disconnect", params);
    }
  }, {
    key: 'privateKeyLogin',
    value: function privateKeyLogin(params) {
      var privateKey = params.privateKey,
          _params$password = params.password,
          password = _params$password === undefined ? "" : _params$password;

      return this.promiseCompatible("account/keyLogin", {
        wif: privateKey,
        password: password,
        callback: params.callback
      });
    }
  }, {
    key: 'unlockAccount',
    value: function unlockAccount(params) {
      var userInfo = this.getAccountInfo();
      if (userInfo.mode == "account") {
        params.account = userInfo.account_name;
      } else if (userInfo.mode == "wallet") {
        params.unlock = true;
      }

      var callback = params.callback;
      delete params.callback;
      return this.promiseCompatible("WalletDb/validatePassword", params).then(function (res) {
        if (res.code == 1) res.message = "The Account has been unlocked";
        delete res.cloudMode;
        delete res.success;
        callback && callback(res);
        callback = null;
        return res;
      });
    }
    /*********Interfaces need Special Parameters processing***end****/

  }, {
    key: 'getWsConnected',
    value: function getWsConnected() {
      return this.api.getters['connection/isWsConnected'];
    }
  }, {
    key: 'getAccountInfo',
    value: function getAccountInfo() {
      var getters = this.api.getters;
      var accountObject = this.api.getters["user/getAccountObject"];
      var res = {
        account_id: getters["account/getAccountUserId"] || "",
        locked: getters["WalletDb/isLocked"]
      };
      res.account_name = accountObject ? accountObject.name : "";
      res.mode = this.api.getters["WalletDb/wallet"] ? "wallet" : "account";
      return res;
    }
  }, {
    key: 'getAccounts',
    value: function getAccounts(params) {
      var _this5 = this;

      if (params && params.callback) {
        this.init().then(function (init_res) {
          params.callback(init_res.code == 1 ? {
            code: 1,
            data: {
              accounts: _this5.api.getters["WalletDb/wallet"] ? _this5.api.getters["AccountStore/linkedAccounts"].toJS() : [],
              current_account: _this5.getAccountInfo()
            }
          } : init_res);
        });
      }
      return {
        accounts: this.api.getters["WalletDb/wallet"] ? this.api.getters["AccountStore/linkedAccounts"].toJS() : [],
        current_account: this.getAccountInfo()
      };
    }
    //decrypt memo

  }, {
    key: 'decodeMemo',
    value: function decodeMemo(memo) {
      if (this.getAccountInfo().isLocked) {
        return { code: 114, message: "Account is locked or not logged in" };
      }
      if (memo) {
        return { code: 1, data: this.api.getters["PrivateKeyStore/decodeMemo"](memo, this.api) };
      } else {
        return { code: 129, message: "Parameter 'memo' can not be empty" };
      }
    }
  }, {
    key: 'generateKeys',
    value: function generateKeys() {
      var random_key = utils.getRandomKey();
      return {
        private_key: random_key.toWif(),
        public_key: random_key.toPublicKey().toString()
      };
    }
  }, {
    key: 'subscribeToUserOperations',
    value: function subscribeToUserOperations(params) {
      this.subscribeInitCheck("account/_validateAccount", {
        method: "operations/subscribeToUserOperations",
        params: params,
        accountFieldName: "userId",
        account: params.account || "",
        callback: params.callback
      });
    }
  }, {
    key: 'subscribeToAccountOperations',
    value: function subscribeToAccountOperations(params) {
      this.subscribeToUserOperations(params);
    }
  }, {
    key: 'subscribeToChainTranscation',
    value: function subscribeToChainTranscation(params) {
      this.subscribeInitCheck("operations/subscribeToAllOperations", params);
    }
  }, {
    key: 'subscribeToBlocks',
    value: function subscribeToBlocks(params) {
      this.subscribeInitCheck("operations/subscribeBlocks", params);
    }
  }, {
    key: 'subscribeToRpcConnectionStatus',
    value: function subscribeToRpcConnectionStatus(params) {
      if ((typeof params === 'undefined' ? 'undefined' : (0, _typeof3.default)(params)) != "object" && typeof params == "function") {
        params = { callback: params };
      }
      this.api.dispatch("connection/setSubscribeToRpcConnectionStatusCallback", params);
    }
  }, {
    key: 'queryTransactionPair',
    value: function queryTransactionPair(params) {
      this.subscribeInitCheck("market/getTransactionPairData", params);
    }
  }, {
    key: 'queryMarketStats',
    value: function queryMarketStats(params) {
      this.subscribeInitCheck("market/getMarketStats", params);
    }
  }, {
    key: 'subscribeInitCheck',
    value: function subscribeInitCheck(method, params) {
      var _this6 = this;

      this.init().then(function (init_res) {
        if (init_res.code == 1) {
          _this6.api.dispatch(method, params);
        } else {
          params.callback && params.callback(init_res);
        }
      });
    }

    /**********Interfaces cannot return value, callbacks only **start** */

  }, {
    key: 'queryVotes',
    value: function queryVotes(params) {
      var _this7 = this;

      var initPromise = new _promise2.default(function (resolve) {
        _this7.init().then(function (init_res) {
          if (init_res.code == 1) {
            var _params$type = params.type,
                type = _params$type === undefined ? "witnesses" : _params$type,
                _params$queryAccount = params.queryAccount,
                queryAccount = _params$queryAccount === undefined ? "" : _params$queryAccount,
                _params$isExplorer = params.isExplorer,
                isExplorer = _params$isExplorer === undefined ? false : _params$isExplorer;

            _this7.api.dispatch("vote/getVoteObjects", {
              type: type, queryAccount: queryAccount, isExplorer: isExplorer,
              callback: function callback(res) {
                resolve(res);
              }
            });
          } else {
            resolve(init_res);
          }
        });
      });

      if (!params.callback) return initPromise;
      initPromise.then(function (res) {
        params.callback(res);
      });
    }
  }, {
    key: 'publishVotes',
    value: function publishVotes(params) {
      var _this8 = this;

      var initPromise = new _promise2.default(function (resolve) {
        _this8.init(function (init_res) {
          if (init_res.code == 1) {
            params.new_proxy_id = params.proxyAccount || "";
            params.witnesses_ids = params.witnessesIds;

            var witnesses_ids = params.witnesses_ids,
                committee_ids = params.committee_ids,
                new_proxy_id = params.new_proxy_id,
                onlyGetFee = params.onlyGetFee;

            _this8.api.dispatch("account/accountOpt", {
              method: "vote/publishVotes",
              params: {
                witnesses_ids: witnesses_ids,
                committee_ids: committee_ids,
                new_proxy_id: new_proxy_id,
                onlyGetFee: onlyGetFee,
                // feeAssetId,
                callback: function callback(res) {
                  resolve(res);
                }
              }
            });
          } else {
            resolve(init_res);
          }
        });
      });
      if (!params.callback) return initPromise;
      initPromise.then(function (res) {
        params.callback(res);
      });
    }
  }, {
    key: 'switchAPINode',
    value: function switchAPINode(params) {
      var _this9 = this;

      //donot send to promiseCompatible Interface, and donot check RPC connection
      var initPromise = new _promise2.default(function (resolve) {
        _this9.init(function (init_res) {
          if (init_res.code == 1) {
            _this9.api.dispatch("connection/switchNode", {
              url: params.url,
              callback: function callback(res) {
                resolve(res);
              }
            });
          } else {
            resolve(init_res);
          }
        });
      });
      if (!params.callback) return initPromise;
      initPromise.then(function (res) {
        params.callback(res);
      });
    }
    /**********Interfaces cannot return value, callbacks only **end** United Labs of BCTech.*/

  }]);
  return BCX;
}();

exports.default = BCX;