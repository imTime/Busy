
/**
 * Module dependencies.
 */

var express = require('express')
	, routes = require('./router')
	, http = require('http')
	, path = require('path')
	, mongoStore = require("connect-session-mongo");

var app = express();

app.configure(function(){
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	//app.use("/static", express.static(__dirname + '/static'));
	//app.use("/static", express.static(path.join(__dirname, '/static')));
	app.use(express.cookieParser());
	app.use(express.session({ secret: "keyboard cat", store: new mongoStore() }));
	app.use(function(req, res, next){
		res.setHeader('X-Powered-By', 'imTime');
		next();
	});
	app.use(app.router);
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

app.configure("production", function(){

});

routes(app);

http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});
