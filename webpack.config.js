let path = require('path');
var webpack=require('webpack');

var root_dir = path.resolve(__dirname);

module.exports = {
    entry: "./src/main.js",
    output: {
        path:path.resolve(__dirname,'build/assets'),
        filename: 'bcx.js',
        publicPath: '/assets/',
        globalObject: "this"// 关键在此项配置，需要配置为 "this", 默认为 "window"
    },
    devServer: {
        host: "0.0.0.0",
        port: 1086,
        disableHostCheck:true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: [/node_modules/],
                use:{
                    loader: "babel-loader",
                    options: {
                        presets:['es2015'],
                        plugins:['transform-runtime',"babel-plugin-transform-regenerator","transform-object-rest-spread"]
                    }
                }
                
            }
        ]
    },
    mode:"development",
    optimization: {
		minimize: false
    }
};