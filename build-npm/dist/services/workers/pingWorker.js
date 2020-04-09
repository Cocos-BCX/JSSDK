"use strict";

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _nodesManager = require("./nodes-manager");

var _nodesManager2 = _interopRequireDefault(_nodesManager);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

onmessage = function onmessage(event) {
    try {
        console.log("pingWorker start");
        var _event_data = event.data;
        var nodes = event.data.nodes;

        nodes = JSON.parse((0, _stringify2.default)(nodes));

        var ws_node_list = {};
        nodes.forEach(function (node) {
            ws_node_list[node.url] = { location: node.name };
        });

        console.info("nodes", nodes, "forEach" in nodes, ws_node_list);

        // let testNodes =await (new NodesManager({
        //     nodes:ws_node_list,
        //     defaultNode:""
        //  }).testNodesPings());

        new _nodesManager2.default({
            nodes: ws_node_list,
            defaultNode: ""
        }).testNodesPings().then(function (testNodes) {
            testNodes = (0, _keys2.default)(testNodes).map(function (key) {
                var _testNodes$key = testNodes[key],
                    location = _testNodes$key.location,
                    ping = _testNodes$key.ping;

                return {
                    url: key,
                    name: location,
                    ping: ping
                };
            });
            postMessage(testNodes);
        });
    } catch (e) {
        console.error("pingWorker", e);
    }
};