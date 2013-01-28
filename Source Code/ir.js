var express = require('express')
	, http = require('http')
	, ir = require("./biz/smartest");

var app = express();

app.configure(function(){
	app.set('port', process.env.VCAP_APP_PORT || 2014);
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(function(req, res, next){
		res.setHeader('X-Powered-By', 'imTime');
		res.setHeader('Server', 'imTime');
		next();
	});
	app.use(app.router);
});

app.all("/", ir.analyse);

http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});
