"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _assign = require("babel-runtime/core-js/object/assign");

var _assign2 = _interopRequireDefault(_assign);

var _mutations = require("../mutations");

var types = _interopRequireWildcard(_mutations);

var _idbInstance = require("../services/api/wallet/idb-instance");

var _idbInstance2 = _interopRequireDefault(_idbInstance);

var _immutable = require("immutable");

var _immutable2 = _interopRequireDefault(_immutable);

var _bcxjsCores = require("bcxjs-cores");

var _fileSaver = require("file-saver");

var _backup = require("../services/api/wallet/backup");

var _bcxjsWs = require("bcxjs-ws");

var _api = require("../services/api");

var _api2 = _interopRequireDefault(_api);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _chainstore_account_ids_by_key = void 0;
var _no_account_refs = void 0;
var initialState = {
    backup: {
        name: null,
        contents: null,
        sha1: null,
        size: null,
        last_modified: null,
        public_key: null,
        wallet_object: null
    }
};
var getters = {
    backup: function backup(state) {
        return state.backup;
    }
};

var actions = {
    reset: function reset(_ref) {
        var state = _ref.state;

        state.backup = {
            name: null,
            contents: null,
            sha1: null,
            size: null,
            last_modified: null,
            public_key: null,
            wallet_object: null
        };
    },
    incommingBuffer: function incommingBuffer(_ref2, _ref3) {
        var dispatch = _ref2.dispatch,
            state = _ref2.state;
        var name = _ref3.name,
            contents = _ref3.contents,
            public_key = _ref3.public_key;

        dispatch("reset");
        var sha1 = _bcxjsCores.hash.sha1(contents).toString('hex');
        var size = contents.length;
        if (!public_key) public_key = getBackupPublicKey(contents);
        // state.backup={
        //     name,
        //     contents,
        //     sha1,
        //     size,
        //     public_key
        // }
        state.backup = (0, _assign2.default)(state.backup, {
            name: name, contents: contents, sha1: sha1, size: size, public_key: public_key
        });
        return { code: 1 };
    },
    download: function download(_ref4) {
        var getters = _ref4.getters,
            dispatch = _ref4.dispatch;

        var isFileSaverSupported = false;
        try {
            isFileSaverSupported = !!new Blob();
        } catch (e) {}
        if (!isFileSaverSupported) {
            return { code: 151, message: "File saving is not supported" };
        }
        var backup = getters.backup;
        var blob = new Blob([backup.contents], {
            type: "application/octet-stream; charset=us-ascii"
            //type: "text/plain;charset=us-ascii"
        });

        if (blob.size !== backup.size) {
            return { code: 152, message: "Invalid backup to download conversion" };
        }
        saveFile(blob, backup.name);
        dispatch("WalletDb/setBackupDate", null, { root: true });

        return { code: 1 };
    },
    incommingWebFile: function incommingWebFile(_ref5, _ref6) {
        var dispatch = _ref5.dispatch;
        var file = _ref6.file;

        return new _promise2.default(function (resolve) {
            var reader = new FileReader();
            reader.onload = function (evt) {
                var contents = new Buffer(evt.target.result, "binary");
                var name = file.name;
                var last_modified = file.lastModifiedDate.toString();

                resolve({ name: name, contents: contents, last_modified: last_modified });
            };
            reader.readAsBinaryString(file);
        }).then(function (result) {
            return dispatch("onIncommingFile", result);
        }).catch(function (error) {
            return { code: 155, message: "Your browser may not support wallet file recovery", error: error };
        });
    },
    onIncommingFile: function onIncommingFile(_ref7, _ref8) {
        var state = _ref7.state;
        var name = _ref8.name,
            contents = _ref8.contents,
            last_modified = _ref8.last_modified;

        var sha1 = _bcxjsCores.hash.sha1(contents).toString('hex');
        var size = contents.length;
        var public_key = getBackupPublicKey(contents);
        if (!public_key) {
            return { code: 173, message: "Please select the correct wallet file" };
        }
        state.backup = (0, _assign2.default)(state.backup, {
            name: name, contents: contents, sha1: sha1, size: size, last_modified: last_modified, public_key: public_key
        });
        return { code: 1, data: state.backup };
        // this.setState({ name, contents, sha1, size, last_modified, public_key })
    },

    onRestore: function onRestore(_ref9, _ref10) {
        var dispatch = _ref9.dispatch,
            state = _ref9.state,
            rootGetters = _ref9.rootGetters;
        var password = _ref10.password;
        var backup, wallet, has_current_wallet, wallet_name, private_key, contents;
        return _regenerator2.default.async(function onRestore$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        if (!rootGetters["WalletDb/wallet"]) {
                            _context.next = 4;
                            break;
                        }

                        return _context.abrupt("return", { code: 163, message: "The wallet already exists. Please try importing the private key" });

                    case 4:
                        _context.next = 6;
                        return _regenerator2.default.awrap(dispatch("account/_logout", null, { root: true }));

                    case 6:
                        backup = state.backup;
                        wallet = rootGetters["WalletManagerStore/wallet"];
                        has_current_wallet = !!wallet.current_wallet;
                        wallet_name = "";

                        if (!has_current_wallet) {
                            wallet_name = "default";
                        } else if (backup.name) {
                            wallet_name = backup.name.match(/[a-z0-9_-]*/)[0];
                        }

                        private_key = _bcxjsCores.PrivateKey.fromSeed(password || "");
                        contents = backup.contents;
                        return _context.abrupt("return", (0, _backup.decryptWalletBackup)(private_key.toWif(), contents).then(function (wallet_object) {
                            var brainkey_pubkey = wallet_object.wallet[0].brainkey_pubkey;
                            var coreAssetSymbol = brainkey_pubkey.substr(0, brainkey_pubkey.length - 50);
                            if (_bcxjsWs.ChainConfig.address_prefix != coreAssetSymbol) {
                                return { code: 158, message: 'Imported Wallet core assets can not be ' + coreAssetSymbol + ", and it should be " + _bcxjsWs.ChainConfig.address_prefix };
                            }
                            var g_wallet = rootGetters["WalletDb/wallet"];
                            if (g_wallet && wallet_object.wallet[0].brainkey_pubkey == g_wallet.brainkey_pubkey) {
                                return { code: 156, message: 'The wallet has been imported. Do not repeat import' };
                            }
                            var wallet_chain_id = wallet_object.wallet[0].chain_id;
                            if (wallet_chain_id != _bcxjsWs.ChainConfig.chain_id) {
                                return { code: 166, message: "The Wallet Chain ID does not match the current chain configuration information. The chain ID of the wallet is:" + wallet_chain_id };
                            }

                            state.backup.wallet_object = wallet_object;
                            wallet_object.private_keys.forEach(function (keyObj) {
                                dispatch("PrivateKeyStore/setKeys", keyObj, { root: true });
                            });

                            return dispatch("checkNewName", password);
                        }).catch(function (error) {
                            console.log("Error verifying wallet " + backup.name, error);
                            if (error === "invalid_decryption_key") {
                                return { code: 105, message: "wrong password" };
                            } else {
                                return { code: 0, message: error.message, error: error };
                            }
                        }));

                    case 14:
                    case "end":
                        return _context.stop();
                }
            }
        }, null, undefined);
    },
    checkNewName: function checkNewName(_ref11) {
        var dispatch = _ref11.dispatch,
            state = _ref11.state,
            rootGetters = _ref11.rootGetters;
        var has_current_wallet, backup, walletName, new_wallet, userId, acc_res;
        return _regenerator2.default.async(function checkNewName$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        has_current_wallet = !!rootGetters["WalletManagerStore/wallet"].current_wallet;
                        backup = state.backup;

                        if (has_current_wallet) {
                            _context2.next = 11;
                            break;
                        }

                        walletName = "default";

                        if (backup.name) {
                            walletName = backup.name.match(/[a-z0-9_-]*/)[0];
                        }
                        _context2.next = 7;
                        return _regenerator2.default.awrap(dispatch("WalletManagerStore/setNewWallet", walletName, { root: true }));

                    case 7:
                        // WalletActions.restore(name, this.props.backup.wallet_object);
                        state.accept = true;
                        state.new_wallet = walletName;
                        _context2.next = 11;
                        return _regenerator2.default.awrap(dispatch("WalletManagerStore/restore", { wallet_name: walletName, wallet_object: backup.wallet_object }, { root: true }));

                    case 11:

                        if (has_current_wallet && backup.name && !state.new_wallet) {
                            new_wallet = backup.name.match(/[a-z0-9_-]*/)[0];

                            if (new_wallet) state.new_wallet = new_wallet;
                        }

                        _context2.next = 14;
                        return _regenerator2.default.awrap(_api2.default.Account.getAccountIdByOwnerPubkey(backup.wallet_object.private_keys[0].pubkey));

                    case 14:
                        userId = _context2.sent;

                        userId = userId && userId[0];

                        if (userId) {
                            _context2.next = 18;
                            break;
                        }

                        return _context2.abrupt("return", { code: 165, message: "There is no account information in the wallet on the chain" });

                    case 18:
                        _context2.next = 20;
                        return _regenerator2.default.awrap(_api2.default.Account.getUser(userId, true));

                    case 20:
                        acc_res = _context2.sent;

                        if (!(acc_res.code != 1)) {
                            _context2.next = 23;
                            break;
                        }

                        return _context2.abrupt("return", acc_res);

                    case 23:

                        if (!backup.wallet_object.linked_accounts.length) {
                            backup.wallet_object.linked_accounts = [{
                                name: acc_res.data.account.name,
                                chainId: backup.wallet_object.wallet[0].chain_id
                            }];
                        }

                        _context2.next = 26;
                        return _regenerator2.default.awrap(dispatch("AccountStore/setCurrentAccount", backup.wallet_object.linked_accounts[0].name, { root: true }));

                    case 26:
                        _context2.next = 28;
                        return _regenerator2.default.awrap(dispatch("account/getAccountInfo", null, { root: true }));

                    case 28:
                        return _context2.abrupt("return", _context2.sent);

                    case 29:
                    case "end":
                        return _context2.stop();
                }
            }
        }, null, undefined);
    }

};

function saveFile(obj, name) {
    if (window.requestFileSystem !== undefined) {
        console.debug('use window.requestFileSystem');
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
            fileSystem.root.getDirectory('Download', { create: true }, function (dirTry) {
                dirTry.getFile(name, { create: true, exclusive: false }, function (entry) {
                    var fileUrl = entry.toURL();
                    entry.createWriter(function (writer) {
                        writer.onwriteend = function (evt) {
                            //console.debug("Successfully saved file to " + fileUrl);
                            NotificationActions.success("Successfully saved file to " + fileUrl);
                        };
                        // Write to the file
                        writer.write(obj);
                    }, function (error) {
                        //console.debug("Error: Could not create file writer, " + error.code);
                        NotificationActions.error("Could not create file writer, " + error.code);
                    });
                }, function (error) {
                    //console.debug("Error: Could not create file, " + error.code);
                    NotificationActions.error("Could not create file, " + error.code);
                });
            }, function (error) {
                NotificationActions.error("Could not create dir, " + error.code);
            });
        }, function (evt) {
            //console.debug("Error: Could not access file system, " + evt.target.error.code);
            NotificationActions.error("Could not access file system, " + evt.target.error.code);
        });
    } else {
        console.debug('not window.requestFileSystem');
        // console.info("saveAs",saveAs);
        (0, _fileSaver.saveAs)(obj, name);
    }
}

function getBackupPublicKey(contents) {
    try {
        return _bcxjsCores.PublicKey.fromBuffer(contents.slice(0, 33));
    } catch (e) {
        //console.error(e, e.stack);
        return false;
    }
}

exports.default = {
    state: initialState,
    actions: actions,
    getters: getters,
    namespaced: true
};