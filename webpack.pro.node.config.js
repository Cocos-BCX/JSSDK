let path = require('path');
var webpack=require('webpack');

var root_dir = path.resolve(__dirname);

module.exports = {
    entry:"./node-src/main.js",
    output: {
        path: path.resolve(root_dir, 'build-node'),
        filename: 'bcx.node.js',
        publicPath: './',
        libraryTarget: "umd",
        globalObject: "this",
        library: "webpackNumbers"
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: [/node_modules/],
                use:{
                    loader: "babel-loader",
                    options: {
                        presets:["es2015"],
                        plugins:['transform-runtime',"babel-plugin-transform-regenerator","transform-object-rest-spread"]
                    }
                }    
            }
        ]
    },
    mode:"production",
    optimization: {
		minimize: true
    },
    target:'node'
    // plugins:[
    // ]
};