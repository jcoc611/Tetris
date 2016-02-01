var path = require("path");
var webpack = require("webpack");
var BowerWebpackPlugin = require("bower-webpack-plugin");

module.exports = {
	context: path.resolve(__dirname, "./src"),
	entry: "./index.jsx",
	output: {
		path: path.resolve(__dirname, "./dist"),
		filename: "tetris.pack.js"
	},
	module: {
		loaders: [
			{
				test: /\.jsx?$/,
				exclude: /(node_modules|bower_components)/,
				loader: 'babel', // 'babel-loader' is also a legal name to reference
				query: {
					presets: ['es2015']
				}
			},
			{
				test: /\.scss$/,
				loaders: ["style", "css", "sass"]
			}
		]
	},
	sassLoader: {
		//includePaths: [path.resolve(__dirname, "./styles")]
	},
	plugins: [
		new webpack.optimize.UglifyJsPlugin({minimize: true}),
		new BowerWebpackPlugin(),
		new webpack.ProvidePlugin({
			$: "jquery"
		})
	]
};