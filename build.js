var webpack = require("webpack");
var config = require("./webpack.config.js");

webpack(config, function(err, stats){
	if(err){
		console.error(err);
	}else{
		// console.log(stats);
		console.log("==============================================")
		console.log(stats.compilation.errors);
		// if(stats.errors) console.error(stats.errors);
	}
});