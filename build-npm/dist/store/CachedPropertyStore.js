"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _mutations = require("../mutations");

var types = _interopRequireWildcard(_mutations);

var _idbInstance = require("../services/api/wallet/idb-instance");

var _idbInstance2 = _interopRequireDefault(_idbInstance);

var _immutable = require("immutable");

var _immutable2 = _interopRequireDefault(_immutable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var initialState = {
    props: _immutable2.default.Map()
};

var getters = {};

var actions = {
    reset: function reset(_ref) {
        var state = _ref.state;

        state.props = _immutable2.default.Map();
    },
    Set: function Set(_ref2, _ref3) {
        var state = _ref2.state;
        var name = _ref3.name,
            value = _ref3.value;

        if (state.props.get(name) === value) return;
        var props = state.props.set(name, value);
        state.props = props;
        _idbInstance2.default.setCachedProperty(name, value).then(function () {
            //state.props = props
        });
    }
};

var mutations = {};

exports.default = {
    state: initialState,
    actions: actions,
    mutations: mutations,
    getters: getters,
    namespaced: true
};