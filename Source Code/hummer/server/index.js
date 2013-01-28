require("../extend");
var mongoose = require("mongoose");
var _common = require("../../biz/common");
var zlib = require('zlib');
var _http = require('http');
var _fix = require("../../storage/fix").fix;
var im = _common.im;
/*
 * 根据客户端要求响应为JSON/JSONP/XML
 */
function response(req, res, code, data){
	if(typeof(code) == "object"){
		data = code;
	}else{
		data = data || {};
		if(code) data.code = code;
	}

	var content = "";
	content = JSON.stringify(data, null, "\t");
	//console.log(content);
	//res.charset = "UTF-8";
	/*
	res.writeHead(200, {
		"Content-Type": "application/json",
		"Content-Length": content.length,
		"charset": "UTF-8"
	});
	*/
	res.statusCode = 200;
	res.contentType('application/json; charset=UTF-8');
	//res.writeHead(200, {'Content-Type': 'application/json; charset=UTF-8'});
	res.end(content);

	/*
	zlib.deflate(content, function(err, buffer) {
		if (!err) {
			res.charset = 'UTF-8';
			res.writeHead(200, {"Content-Type": "application/json", "Content-Encoding": "gZip"});
			res.end(buffer.toString("utf-8"));
		}
	});
	*/

	//res.json(data);
};


function responseHead(res, code, params, content){
	var head = {
		'Content-Type': "text/plain; charset=UTF-8"
	};

	for(var k in params){
		head[k] = params[k];
	};


	res.writeHead(code, head);
	res.end("");
};

//获取objectId
function getObjectId(){
	var bson = mongoose.mongo.BSONPure;
	return new bson.ObjectID();
};

/*
 * 合并两个对你，将target并入source
 * TODO 这个函数最终要合并到Object.extend
 */
function merge(source, target){
	for(var item in target){
		source[item] = target[item];
	};
	return source;
};

//将日期转换为Number的时间
exports.getTime = function(date){
	date = date || new Date();
	return date.getTime();
};

exports.merge = merge;
exports.getObjectId = getObjectId;
exports.response = response;

//请求远端数据
exports.request = function(options){
	var ops = {
		host: options.host,
		port: options.port || 80,
		method: options.method || "GET",
		path: options.path || "/",
		headers: options.headers || null
	};

	var req = _http.request(ops, function(res){
		if(options.callback){
			res.setEncoding('utf8');
			console.log(res.statusCode);
			res.on("data", function(chunk){
				console.log(chunk);
			});
		}
	});

	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	req.end();
	return;
	var ops = {
		host: options.host,
		POST: options.port || 80,
		method: options.method || "GET",
		path: options.path || "/",
		headers: options.headers || null
	};

	var req = _http.request(ops, function(res) {
		console.log('STATUS: ' + res.statusCode);
		console.log('HEADERS: ' + JSON.stringify(res.headers));
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			console.log('BODY: ' + chunk);
		});
	});

	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	req.end();
};
/*
 * 输出数据错误，通常是提交的数据被篡改过，比如说id不合法，或者必需的id没有，也有些时候是被漏掉的。
 */
exports.responseDataIncorrect = function(req, res){
	response(req, res, _common.enumeration.DataIncorrect);
};

//返回404
exports.response404 = function(res){
	responseHead(res, 404);
};

exports.response401 = function(res){
	responseHead(res, 401);
}

//返回完成的状态码
exports.response201 = function(res, resource){
	responseHead(res, 201, {
		Location: resource
	});
};

exports.isUUID = function(uuid, allowEmpty){
	if(allowEmpty && !uuid) return true;	//空的uuid
	return uuid && uuid.test(/^\w{24}$/ig);
};

/*
 * 移除文档，主要是为了兼容客户端代码，客户端再覆盖此代码即可
 */
exports.removeDocument = function(doc, callback){
	doc.remove(callback);
};

exports.saveDocument = function(doc, callback){
	doc.save(callback);
};

//提升版本号，主要是为了兼容客户端
exports.incVersion = function(version){
	return version ++;
};

exports.getResult = function(result, code, data){
	var json = {
		command: {
			result: result
		}
	};
	if(code) json.command.code = code;
	if(data) json.content = data;
	return json;
};

//分析header的内容
exports.analyseHeaders = function(req){
	//获取accept的版本的字符等内容
	var accept = req.headers["accept"];
	var result = {
		isApiServer: false,			//是否为API服务器
		authorization: null,			//API的用户认证
		host: null,
		//默认返回的内容类型
		"content-type": "application/json",
		//字符集
		charset: "utf-8",
		//api的版本
		apiVersion: 2,
		//客户端类型
		client: im.e.Client.WebSite,
		//客户端的版本
		clientVersion: 1,
		//语言
		language: "en-us"
	};

	if(!accept || accept.length > 200) return result;

	var arr = accept.split(";");
	//循环
	arr.forEach(function(item){
		item = item.split("=");
		//避免恶意出现过长的headerapplication/json
		if(item.length == 2){
			var key = item[0].trim().overlong(10);
			var value = item[1].trim().overlong(20);
			if(result[key]) result[key] = value;
		};
	});

	result.language  = req.headers["accept-language"];
	result.host = req.headers["host"];
	result.authorization = req.headers["authorization"];
	result.isApiServer = result.host == "api1.imtime.com";
	result.isApiServer = Boolean(result.authorization);
	result.client = _fix.fixNumber(result.client, im.e.Client.WebSite, true);
	return result;
}

exports.getMember = function(req){
	return {
		memberId: req.session.memberId,
		screenName: req.cookies.screenName,
		mail: req.cookies.mail
	}
};