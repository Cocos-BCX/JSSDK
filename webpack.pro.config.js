let path = require('path');
var webpack=require('webpack');

var root_dir = path.resolve(__dirname);

module.exports = {
    entry:"./src/main.js",
    output: {
        path: path.resolve(root_dir, 'build/assets'),
        filename: 'bcx.min.js',
        publicPath: './'
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
    // target:'node'
    // plugins:[
    // ]
};