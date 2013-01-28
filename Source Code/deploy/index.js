/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 9/6/12
 * Time: 10:58 PM
 * To change this template use File | Settings | File Templates.
 */
var _config = require("./config");
var im = require("../biz/common").im;
var _path = require("path");
var _fs = require("fs");
var rimraf = require("rimraf");
var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;
var wrench = require('wrench');
var less = require('less');
var jade = require("jade");
var util = require('util');
var _hummer = require("../hummer/server");
var _compress = false;
var _production = false;
var mkdirp = require('mkdirp');
var makeFile = require('./makeFile');
var _global = _config.global;
var _client = im.e.Client.Unknown;
/*
 * 部署
 * 1.创建文件夹在当前运行的上层目录publish
 * 2.创建static文件夹，用于放置客户端javascript/css/html/images
 * 3.合并及压缩客户端javascript文件，复制最小化的jquery文件
 * 4.用less生成css文件，并压缩css文件
 * 5.将html中的引用文件改写，英文直接用static.imtime.com，中文用阿里的s3
 */
/*
 * 检查文件夹是否存在，如果不存在，则创建
 * @params {Boolean} removeExists 是否删除已经存在的
 */
function checkDir(dir, removeExists){
	var exits = _fs.existsSync(dir);
	//删除已经存在的目录
	if(removeExists && exits){
		rimraf.sync(dir);
	};


	var current = "/";
	dir.split("/").forEach(function(item){
		current = _path.join(current, item);
		if(!_fs.existsSync(current)){
			_fs.mkdirSync(current, 0777);
		};
	});
	return exits;

	//文件夹不存在
	if(!_fs.existsSync(dir)){
		//_fs.mkdirSync(dir, 0777);

		mkdirp(dir);
	};

	return true;
};

//复制文件，不检查目录是否存在
function copyFile(source, target){
	var spawn = require('child_process').spawn;
	cp  = spawn('cp', [source, target]);
	/*
	var is = _fs.createReadStream(source)
	var os = _fs.createWriteStream(target);

	util.pump(is, os, function() {
		_fs.unlinkSync(source);
	});
	*/
};

/*
 * 读取文件
 * @params {String} file 文件的绝对路径
 * @params {Boolean} extract 是否提取<!--deploy-->中间的内容
 */
function readFile(file, extract, closure, closureBefore){
	if(_path.basename(file).indexOf(".") < 0){
		console.log("目录[%s]无法读取！", file);
		return "";
	};

	if(!_path.existsSync(file)){
		throw "文件不存在: [{0}]".format(file);
	};

	var text = _fs.readFileSync(file, "utf-8");
	if(extract){
		var pattern = /\/\/==deploy==([\s\S]*)\/\/==deploy==/m;
		if(new RegExp(pattern).test(text)){
			text = RegExp.$1
		};
	};

	if(closureBefore){
		var fileName = _path.basename(file, ".js");
		text = closureBefore(fileName, text);
	};

	//添加闭包
	if(closure){
		text =  "(function(){\n" + text + "\n})();\n";
	};

	return text;
};

/*
 * 将内容写入到文件
 */
function writeFile(content, file){
	var fd = _fs.openSync(file,'w', 0777);
	_fs.writeSync(fd,content);
	_fs.closeSync(fd);
};

/*
 * 渲染多国语言的模板
 */
function templateRender(targetDir, template, multiLang, target){
	var module = _path.basename(template, ".jade");
	var content = readFile(template);

	var options = {
		module: module
	};

	var targetFile;
	if(multiLang){
		_config.supportLanguages.forEach(function(language){
			options.language = language;
			targetFile = _path.join(targetDir, language, module);
			targetFile += ".html";
			//检查目录是否存在
			checkDir(_path.dirname(targetFile));
			//生成最终文件
			jadeRender(content, targetFile, options);
		});
	}else{
		//targetFile = _path.join(targetDir, target || module);
		if(_client == im.e.Client.iOS || _config.isDesktop(_client)){
			targetFile = targetDir + module + ".html";
		}else{
			targetFile = targetDir + ".html";
		}

		console.log(targetFile);
		jadeRender(content, targetFile, options);
	};
}
/*
 * 保存jade
 */
function jadeRender(content, target, options, callback){
	//如果是client为iOS，则判断为phone还是Pad
	//console.log(target);
	var client = _client;

	if(typeof(target) == "string"){
		if(target.indexOf("pad") >= 0){
			client = _client == im.e.Client.iOS ? im.e.Client.iPad : im.e.Client.Pad;
		}else if(target.indexOf("phone") >= 0){
			client = _client == im.e.Client.iOS ? im.e.Client.iPhone : im.e.Client.Phone;
		};
	}


	/*
	if(client == im.e.Client.iOS){
		var fileName = _path.basename(target, ".html");
		client = (fileName == "pad") ? im.e.Client.iPad : im.e.Client.iPhone;
	};
	*/

	var language = options.language || "default";
	var lang = require("../biz/i18n/template/{0}".format(language));
	var static = _config.staticServer(_production, language, client);

	var jadeDir = "../static/template";
	var footer =  _path.join(jadeDir, "moduleFooter.jade");
	footer = _path.resolve(__dirname, footer);
	var chromeStatic = _production ? "/" : "https://api.imtime.com/";

	var ops = {
		filename: [footer],
		host: "new.imtime.com/",
		pretty: true,
		static: static,
		e: im.e,
		chromeStatic: chromeStatic,
		language: language,
		lang: lang.index,
		production: _production,
		module: options.module,
		clientType: client,
		inImbox: _config.inImbox(client),
		isDesktop: _config.isDesktop(client),
		isPad: _config.isPad(client),
		isPhone: _config.isPhone(client),
		isMobile: _config.isMobile(client)
	};

	//渲染
	jade.render(content, ops, function(err, html){
		if(err) return console.log(err.message);

		if(target === true){
			callback(html);
		}else{
			//写入静态文件
			writeFile(html, target);
		}
	});
};

/*
 保存css文件，根据配置确定是否压缩
 */
function lessRender(content, file, callback){
	/*
	var filename = '../static/css/core.less';
	filename = _path.join(__dirname, filename);
	var parser = new(less.Parser)({
		paths: [_path.dirname(filename)],
		filename : filename
	});
	*/

	var parser = new(less.Parser)({
		paths: [_path.join(__dirname, "../static/css")]
	});

	parser.parse(content, function (err, tree) {
		if (err) { return console.error(err) };
		content = tree.toCSS({ compress: _compress }); // Minify CSS output
		if(file === true){
			callback(content);
		}else{
			//保存
			writeFile(content, file);
		}
	});

	/*
	var parser = new(less.Parser);
	parser.parse(content, function (err, tree) {
		if (err) { return console.error(err) };
		content = tree.toCSS({compress: _compress});
		if(file === true){
			callback(content);
		}else{
			//保存
			writeFile(content, file);
		}
	});
	*/
};
/*
 * 渲染Javascript文件，可以选择保存
 * @params {String|Boolean} file 要保存的文件，如果为true，则回调返回结果
 * @params {Function} callback，当file===true时，用callback回调
 */
function jsRender(content, file, callback){
	//对于main.js，需要判断是否debug
	if(_production && /main\.js/i.test(file)){
		content = content.replace("$.env.isDebug = true;", "$.env.isDebug = false;");
	};

	//是否需要压缩文件
	if(_compress){
		var ast = jsp.parse(content); // parse code and get the initial AST
		ast = pro.ast_mangle(ast); // get a new AST with mangled names
		ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
		content = pro.gen_code(ast, {
			ascii_only: true
		}); // compressed code here
	};

	if(file === true){
		callback(content);
	}else{
		writeFile(content, file);
	}
}

/*
 * 读取多个文件
 */
function readMultiFile(dir, files){
	var content = "";
	files.forEach(function(file){
		file = _path.join(dir, file);
		content += readFile(file, false);
	});

	return content;
}

/*
 * 合并多个文件
 * @params {Object} node 要处理的节点
 * @params {String} targetDir 目标目录，
 */
function complexFile(node, targetDir, callback){
	var content = "";
	//读取并合并文件
	node.source.forEach(function(item){
		//没有指定文件列表，则合并整个目录
		if(!item.files){
			var sourceDir = _path.join("../", item.dir);
			sourceDir = _path.resolve(__dirname, sourceDir);
			content = complexDirectory(sourceDir, content,
				item.ignore, item.extract, item.closure, item.closureBefore);
			return;
		};

		item.files.forEach(function(file){
			//获取文件的绝对路径
			file = _path.join("../", item.dir, file);
			file = _path.resolve(__dirname, file);

			//文件没有扩展名，可能是jade和js
			if(_path.extname(file) == ""){
				if(node.less) file += ".less";
				if(node.jade) file += ".jade";
			};

			content += readFile(file, item.extract, item.closure, item.closureBefore);
		});
	});

	var ext = _path.extname(node.target);
	var target = targetDir;
	//指定目标，输出
	if(targetDir !== true) target = _path.join(targetDir, node.target);

	//用用Less处理css
	if(node.less || ext == ".less"){
		lessRender(content, target, callback)
	}else if(ext == ".js"){			//处理js
		jsRender(content, target, callback);
	}else if(node.jade){			//处理jade
		jadeRender(content, target);
	};
};

/*
 * 合并目录下的所有文件，可以根据正则表达式忽略某些文件
 */
function complexDirectory(parent, content, igrone, extract, closure, closureBefore){
	var files = _fs.readdirSync(parent);
	files.forEach(function(fileName){
		if(_global.ignore.test(fileName) ||
			(igrone && igrone.test(fileName))) return;
		var ext = _path.extname(fileName);
		//仅处理js和less的文件
		if(!(/^\.(js|less)$/i.test(ext))) return;
		var file = _path.join(parent, fileName);
		content += readFile(file, extract, closure, closureBefore);
	});
	return content;
}

/*
 *移动单个文件，根据文件类型进行处理
 */
function moveFile(source, target){
	var ext = _path.extname(source);
	//根据文件的扩展名来判断要进行的操作，下列文件需要读取文件
	if(ext == ".js" || ext == ".less" || ext == ".jade"){
		var content = readFile(source, false, false);
		if(ext == ".js"){
			jsRender(content, target);
		}else if(ext == ".jade"){
			//是否要生成多语言

			jadeRender(content, target);
		}else{
			lessRender(content, target);
		};
	}else{
		//复制文件到新目录
		copyFile(source, target);
	};
};

/*
 * 复制目录，只针对一层目录，对于JS/css/jade分别进行处理
 */
function moveDirectory(parent, targetDir, igrone){
	var files = _fs.readdirSync(parent);
	files.forEach(function(fileName){
		//全局要求忽略，或者节点上要求忽略，跳过
		if(_global.ignore.test(fileName) ||
			(igrone && igrone.test(fileName))) return;
		var file = _path.join(parent, fileName);
		var stat = _fs.statSync(file);
		//处理文件夹
		if(stat.isDirectory()){
			var newDir = _path.join(targetDir, _path.basename(file));
			checkDir(newDir);
			moveDirectory(file, newDir, igrone);
			return;
		};

		var fileName = _path.basename(file);
		var newFile = _path.join(targetDir, fileName);
		moveFile(file, newFile);
	});
};

/*
 * 复制文件，可能需要压缩
 * @params {Object} node 配置文件的节点
 * @params {String} dir 上级目录
 */
function copyNode(node, parentDir, targetDir){
	var target = node.target;
	//目标是文件夹，检查文件夹是否存在，目标文件不能包括{，
	if(target && _path.extname(target) == "") {
		targetDir = _path.join(targetDir, target);
		checkDir(targetDir);
	};

	node.source.forEach(function(item){
		//没有指定文件，处理文件夹
		if(!item.files){
			var dir = item.dir || parentDir;
			dir = _path.join("../", dir);
			dir = _path.resolve(__dirname, dir);

			//仅复制文件，执行深度拷贝
			if(node.copyOnly){
				wrench.copyDirSyncRecursive(dir, targetDir);
			}else{
				moveDirectory(dir, targetDir, item.ignore);
			};
			return;
		};


		//处理文件
		item.files.forEach(function(fileName){
			var file = _path.join("../", item.dir || parentDir, fileName);
			file = _path.resolve(__dirname, file);
			//console.log(file);
			//处理jade
			if(node.jade){
				templateRender(targetDir, file, node.multiLang, node.target);
				return;
			};

			//检查是否为目录
			var ext = _path.extname(fileName);

			//获取新的文件名
			var newFile = node.target;
			if(!newFile || !_path.extname(newFile)){
				newFile = fileName;
			};
			newFile = _path.join(targetDir, newFile);
			var path = _path.dirname(newFile);
			checkDir(path);

			if(ext){
				moveFile(file, newFile);
			}else{
				checkDir(newFile);
				moveDirectory(file, newFile, item.ignore);
			};
		});
	});
};

//处理模块依赖，如果不存在则复制
function moduleDepend(modules){

};

function deployed(deployProj){
	//console.log(deployProj);
	if(deployProj != 'ios') return;
	var source = _path.resolve(__dirname, _global.target);
	source = _path.join(source, "ios/");

	//目标目录
	var target = _path.resolve(__dirname, "../mac/content/");
	//console.log(source, target);

	//延时一样，因为css渲染需要一些时间
	setTimeout(function(){
		makeFile.copyDir(source, target);
	}, 500);
};

function preDeploy(deployProj){
	var target = _path.resolve(__dirname, _global.target);
	//删除原目录，并创建新的目录
	checkDir(target);

	var node = _config.preDeploy()[deployProj];
	var folder = _path.join(target, node.name || deployProj);
	checkDir(folder);

	//模块依赖
	moduleDepend(node.dependencies);
	//删除没有被忽略的文件
	var files = _fs.readdirSync(folder);
	files.forEach(function(file){
		var ignore = node.ignore;
		if(ignore && ignore.test(file)) return;
		file = _path.join(folder, file);
		rimraf.sync(file);
	});

	//预先部署文件夹
	if(node.dirs){
		node.dirs.forEach(function(dir){
			dir = _path.resolve(__dirname, _global.target, deployProj, dir);
			checkDir(dir);
		});
	};
};

//部署一个项目
function deploy(projName){
	var projFn = projName + "Project";

	if(!_config[projFn]){
		console.log("Can't found method [%s]", projFn);
		return;
	};

	var client = projName;
	if(client == "ios"){
		client = "iOS"
	}else{
		client = client.substr(0, 1).toUpperCase() + projName.substr(1, projName.length);
	};

	client = im.e.Client[client];
	if(!client) client = im.e.Client.WebSite;
	_client = client;

	//预部署
	preDeploy(projName);
	//根目录
	var dirRoot = _path.resolve(__dirname, _global.target);
	var project = _config[projFn]();

	//不同子项目，网站/静态文件/chrome/ios等
	var dirProj = _path.join(dirRoot, project.name || projName);
	//第一层目录
	for(var firstDir in project.config){
		//建立第一级目录
		var dir = _path.join(dirProj, firstDir);
		checkDir(dir);

		//复制或者合并文件
		project.config[firstDir].forEach(function(item){
			//合并文件
			if(item.complex){
				complexFile(item, dir);
			}else{
				//复制文件
				copyNode(item, firstDir, dir);
			}
		});
	};

	deployed(projName);
};

/*
function jadeConverter(file){
	var file = _path.resolve(__dirname, "../static/index.jade");
	var content = readFile(file);
	jade.render(content, {
		locals: {
			static: "http://static.imtime.com/"
		}
	}, function(err, html){
		console.log(html);
	});
};
*/

function getMIME(ext){
	ext = ext || "html";
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
	return types[ext];
};

function response(res, ext, content){
	res.writeHead(200, {'Content-Type': getMIME(ext) + '; charset=UTF-8'});
	res.end(content);
};

//返回语言文件
exports.i18n = function(req, res, next){
	var fileName = req.params[0];
	var file = _path.join("../biz/i18n/", fileName + ".js");
	file = _path.resolve(__dirname, file);
	var content = readFile(file, false, false);

	if(fileName == "zh-cn" || fileName == "zh-tw"){
		["biz/i18n/zh", "hummer/chineseNumber", "hummer/chineseLunar"].forEach(
			function(item){
				file = _path.join("..", item + ".js");
				file = _path.resolve(__dirname, file);
				content += readFile(file, false, false);
			}
		);
	};
	/*
	file = _path.join("../biz/i18n/smartest",  "zh.js");
	file = _path.resolve(__dirname, file);
	content += readFile(file, false, false);
	*/
	response(res, "js", content);
}

//读取图片文件
exports.readImageFile = function(req, res, next){
	var file = req.params[0];
	var ext = req.params[1];
	var path = _path.join("../static", "images", file + "." + ext);
	path = _path.resolve(__dirname, path);

	//读取文件
	_fs.exists(path, function(exists){
		//文件不存在
		if(!exists){
			return _hummer.response404(res, "File not found: " + path);
		};

		//读取文件
		_fs.readFile(path, "binary", function(err, file) {
			res.charset = "UTF-8";
			res.writeHead(200, {'Content-Type': getMIME(ext)});
			res.write(file, "binary");
			res.end();
		});			//end readFile
	});				//end exists
};
/*
 * 实时渲染
 */
exports.render = function(req, res, next){
	var file = req.params[0];
	var ext = req.params[1];
	var lang = req.query.lang || "default";
	var client = req.query.client;
	var cEnum = im.e.Client;
	var module = file;
	_compress = false;
	_client = im.e.Client.WebSite;
	//根目录，渲染jade文件
	if(!file || ext == "html"){
		var dir = _path.resolve(__dirname, "../static/template/");
		if(file == "pad" || file == "phone"){
			module = "index";
			dir = _path.join(dir, "mobile");
			_client = file == "pad" ? im.e.Client.Pad : im.e.Client.Phone;
		};

		file = file || "index";
		file += ".jade";
		file = _path.join(dir, file);
		var content = readFile(file);
		//console.log(content);
		jadeRender(content, true, {
			language: lang,
			module: module || "index"
		}, function(html){
			response(res, ext, html);
		});
	}else{
		var node;
		if(ext == "css"){
			if(_config.isDesktop(client)){
				file = "desktop";
			}else if(_config.isPad(client)){
				file = "pad";
			}else if(_config.isPhone(client)){
				file = "phone";
			}else if(file == "main"){
				file = "website";
			};

			node = _config.less_css(file);
		}else{
			var fnName = file + "_" + ext;
			var func = fnName.toLowerCase();
			func = _config[func];
			if(!func) return console.log("Module %s not found", file);

			if(/main_js/i.test(fnName)){
				node = func(client);
			}else if(/i18n/i.test(fnName)){
				node = func(null, true);
			}else{
				node = func();
			};
			if(!node) return _hummer.response404(res);
		}

		complexFile(node, true, function(content){
			response(res, ext, content);
		});
	};
};


exports.run = function(req, res, next){
	_compress = req.query.compress == "1";
	_production = req.query.production == "1";

	//多个Node
	var nodes = req.query.nodes || "air|chrome|application|static|ir|ios";
	var nodes = nodes.split("|");
	nodes.forEach(function(project){
		deploy(project);
	});
	res.charset = "utf-8";
	res.end("Finished");
};