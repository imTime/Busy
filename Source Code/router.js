/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/1/12
 * Time: 7:24 下午
 * To change this template use File | Settings | File Templates.
 */

var _module = {
	member: require("./biz/member"),
	calendar: require("./biz/calendar"),
	status: require("./biz/status"),
	activity: require("./biz/activity"),
	reminder: require("./biz/reminder")
};

var fs = require("fs");
var _path = require("path");
var _url = require('url');
var _common = require("./biz/common");
var zlib = require('zlib');
var _hummer = require('./hummer/server');
var _smartest = require("./biz/smartest");
var im = _common.im;

/*
function readStaticFile(req, res){
	var url = _url.parse(req.url);
	var path = url.pathname;
	path = __dirname + path;
	//res.end(path);
	//return;
	//path = path.substr(1, path.length);
	var ext = _path.extname(path);
	ext = ext.substr(1, ext.length);
	var types  = {
		"css": "text/css",
		"gif": "image/gif",
		"html": "text/html",
		"ico": "image/x-icon",
		"jpeg": "image/jpeg",
		"jpg": "image/jpeg",
		"js": "text/javascript",
		"json": "application/json",
		"pdf": "application/pdf",
		"png": "image/png",
		"svg": "image/svg+xml",
		"swf": "application/x-shockwave-flash",
		"tiff": "image/tiff",
		"txt": "text/plain",
		"wav": "audio/x-wav",
		"wma": "audio/x-ms-wma",
		"wmv": "video/x-ms-wmv",
		"xml": "text/xml"
	};

	fs.exists(path, function(exists){
		//文件不存在
		if(!exists){
			return _hummer.response404(res, "File not found: " + path);
		};

		//读取文件
		fs.readFile(path, "binary", function(err, file) {
			res.charset = "UTF-8";
			res.writeHead(200, {'Content-Type': types[ext]});
			res.write(file, "binary");
			res.end();
		});			//end readFile
	});				//end exists
};
*/


/*
 * 从accept字符中取出版本来
 * TODO 要限制字符长度，避免恶意攻击
 */
/*
function analyseHeaders(req){
	//console.log(JSON.stringify(req.headers));
	//获取accept的版本的字符等内容
	var accept = req.headers["accept"];

	if(!accept || accept.length > 200) return false;

	var arr = accept.split(";");
	var env = _common.current.env;

	//循环
	arr.forEach(function(item){
		item = item.split("=");
		//避免恶意出现过长的headerapplication/json
		if(item.length == 2){
			var key = item[0].trim().overlong(10);
			var value = item[1].trim().overlong(20);
			if(env[key]) env[key] = value;
		};
	});

	env.language  = req.headers["accept-language"];
	env.host = req.headers["host"];
	env.authorization = req.headers["authorization"];
	env.isApiServer = env.host == "api.imtime.com";
	env.isApiServer = Boolean(env.authorization);
	env.client = _fix.fixNumber(env.client, im.e.Client.WebSite, true);
	_common.current.env = env;
	return true;
}
*/

/*
 * 是否为API服务器
 */

//跳转到模块
function jumpToModule(module, method, req, res, next){
	var member = _hummer.getMember(req);
	//其它处理方法
	var findModule = _module[module];
	//找到这个模块，且这个模块有这个方法
	if(findModule && findModule[method]){
		//下面的方法，全部要求用户已经登陆，如果没有登陆，则返回401的状态码
		if(!member.memberId){
			//用户没有登陆
			return _hummer.response401(res);
		};
		return findModule[method](req, res, next);
	};

	next();
};

//是否为生产环境
function isProduction(){
	return process.env.NODE_ENV == "production";
}

/*
 * 在生产环境下，静态文件的读取用nignx处理
 */
module.exports =  function(app){
	//分析用户的头部协议
	app.all("*", function(req, res, next){
		req.session.cookie.expires = false;
		next();
	});

	//非产品环境，实时渲染
	if(!isProduction()){
		var _deploy = require("./deploy");
		app.get("/", _deploy.render);
		app.get(/\/(\w+)\.(html)/i, _deploy.render);
		app.get(/css\/(\w+)\.(css)/i, _deploy.render);
		app.get(/javascript\/(\w+)\.(js)/i, _deploy.render);
		app.get(/javascript\/i18n\/(.+)\.(js)/i, _deploy.i18n);
		app.get(/images\/(.+)\.(jpeg|png|gif|jpg|zip)/i, _deploy.readImageFile);
		app.get(/deploy/i, _deploy.run);
		app.all(/ir/i, _smartest.analyse);
	};

	//app.all(/^\/(\w+)(\/(\w+))?$/ig, function(req, res, next){
	app.all("/:module/:id?", function(req, res, next){
		//处理参数名
		/*
		req.params.module = req.params[0];
		if(req.params.length > 1){
			req.params.id = req.params[1];
		};

		console.log(req.params.module);
		*/

		var method = _common.enumeration.method;
		var module = _common.enumeration.module;
		var pModule = req.params.module;
		var pMethod = req.method.toUpperCase();

		if(module.signOut == pModule && pMethod == method.GET){
			return _module.member[pModule](req, res, next);
		}

		//取得token
		if(pModule == module.token && pMethod == method.POST){
			return _module.member[pModule](req, res, next);
		};

		//三个特殊的方法
		if((pModule == module.signIn || pModule == module.signUp) &&
			pMethod == method.POST){
			return _module.member[pModule](req, res, next);
		};

		var action = method[pMethod];
		//非指定的方法，不再继续，避免构造特殊的方法出现错误
		if(!action) return next();

		//API服务器，通过Token获取用户id
		//console.log(req.headers["authorization"]);
		var env = _hummer.analyseHeaders(req);

		if(env.isApiServer){
			//没有授权的token
			if(!env.authorization){
				return _hummer.response401(res);
			};
			//根据token获取用户的id
			return _module.member.getMemberIdWithToken(env.authorization, env.client,
				function(err, memberId){
					if(err) return next(err);
					//没有与token匹配的memberId
					if(!memberId) return _hummer.response401(res);
					req.session.memberId = memberId;
					jumpToModule(pModule, action, req, res, next);
				});
		};

		//正常的模块
		jumpToModule(pModule, action, req, res, next);
	});

	//非生产环境的情况下，才允许调用静态文件的代码和生成js的代码
	/*
	if(!isProduction()){
		app.get("/upgrade", _update.index);
		app.all("*", readStaticFile);
	};
	*/
}