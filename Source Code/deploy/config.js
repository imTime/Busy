/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 9/6/12
 * Time: 10:54 PM
 * To change this template use File | Settings | File Templates.
 */
/*
 * 全并多个文件为一个，
 * 如果没有特别说明，凡事扩展名为js的，都会压缩，扩展名为less都会经过less处理并压缩
 * jade如果被标注multiLang，则生成多国语言，路径为：dir/lang/file.html。
 * 未标注multi则生成英语，路径为：dir/file.html
 */
var _hummer = require("../hummer/server");
var im = require("../biz/common").im;
var _dirTemplate = "static/template/";
//支持的语言
var _languages = ["zh-cn", "default", "zh-tw"];

function cloneObject(obj){
	var objClone;
	if (obj.constructor == Object ){
		//数组
		if(obj instanceof Array){
			return [].concat(obj);
		};
		objClone = new obj.constructor();
	}else{
		objClone = new obj.constructor(obj.valueOf());
	};

	for ( var key in obj )
	{
		if ( objClone[key] != obj[key] )
		{
			if ( typeof(obj[key]) == 'object' )
			{
				objClone[key] = cloneObject(obj[key]);
			}
			else
			{
				objClone[key] = obj[key];
			}
		}
	};

	objClone.toString = obj.toString;
	objClone.valueOf = obj.valueOf;
	return objClone;
}

/*
 * 是否为移动设备
 */
function isMobile(client){
	return isPad(client) || isPhone(client) || client == im.e.Client.iOS;
}
/*
 * 是否运行在Pad上
 */
function isPad(client){
	return client == im.e.Client.iPad || client == im.e.Client.Pad;
};

/*
 * 是否运行在Phone上
 */
function isPhone(client){
	return client == im.e.Client.iPhone || client == im.e.Client.Phone;
};

/*
 * 是否运行在imbox内
 */
function inImbox(client){
	return client == im.e.Client.iPhone ||
		client == im.e.Client.iPad ||
		client == im.e.Client.WindowsPhone ||
		client == im.e.Client.Metro ||
		client == im.e.Client.iOS;
};
/*
 * 是否为桌面版
 */
function isDesktop(client){
	return client == im.e.Client.Air ||
		client == im.e.Client.Safari ||
		client == im.e.Client.Chrome;
};


/*
 * 获取模块的名称
 */
function getModule(name){
	return {
		//仅复制
		copyOnly: true,
		target: name,
		source: [
			{
				dir: "node_modules/{0}/".format(name)
			}
		]
	};
};

/*
 * 用户客户端的main.js
 * @params {Number} client 根据客户不同内容会有差异。如果未设置，则引入所有可能的js
 */
function main_js(client, target){
	var c = im.e.Client;
	var dirPage = "biz/client/page/";
	var desktop = "desktop/{0}";
	var pageFile = ["page.js", "sign.js", "activity.js", "birthdayEditor.js",
		"calendar.js", "normalEditor.js", "reminder.js", "repeat.js", "status.js",
		"timeline.js", "todoEditor.js"];
	//桌面

	var _isDesktop = isDesktop(client);
	var _inImBox = inImbox(client);
	//移动网网站
	var _isMobile = isMobile(client);
	var _isPhone = isPhone(client);

	//hummer client
	var hummer_files = [
		"core.js",
		//"jquery.dropkick.js",
		"datepicker.js"
	];

	var bizClientFiles = [
		"main.js",
		"timeline.js"
	];

	if(_inImBox || _isMobile){
		pageFile.push("mobile.js");
		hummer_files.push("im.mobile.js");
		hummer_files.push("iscroll.js");
	}else{
		pageFile.push("expressEditor.js");
	};

	if(_isPhone || client == c.iOS){
		hummer_files.push("im.mobile.controls.js");
	}

	//添加Pad
	if(_inImBox || client == c.Pad){
		pageFile.push("pad.js");
	};

	if(_inImBox || client == c.Phone){
		pageFile.push("phone.js");
	};


	if(_inImBox){
		hummer_files.push("im.mobile.imbox.js");
		hummer_files.push("im.mobile.proxy.js");
		//bizClientFiles.push(desktop.format("imbox.js"));
	};

	if(_isDesktop || _inImBox){
		pageFile.push("option.js");
		hummer_files.push("sqlite.js");
	};

	if(_isDesktop){
		if(!_inImBox){
			bizClientFiles.push(desktop.format("desktop.js"));
		}
	};

	if(client == c.Chrome){
		var chromeJS = "chrome.js";
		hummer_files.push(chromeJS);
		bizClientFiles.push(desktop.format(chromeJS));
	};

	if(client == c.Air){
		var airJS = "air.js";
		hummer_files.push(airJS);
		bizClientFiles.push(desktop.format(airJS));
	};

	if(client == c.Safari){
		bizClientFiles.push(desktop.format("safari.js"));
	};

	if(client == c.WebSite){
		pageFile.push("website.js");
	};

	return {
		target: (target || "main") + ".js",
		complex: true,
		//要合并的源文件
		source: [
			{
				dir: "hummer/client/",
				files: hummer_files
			},{
				dir: "biz/",
				//从<!--deploy-->节点中提取
				extract: true,
				files: [
					"common.js", "eventGenerator.js"
				]
			},{
				dir: "biz/client/",
				files: bizClientFiles
			},{
				//page.js必需在其它文件的前面，所要先拿出来
				dir: dirPage,
				files: pageFile
			},{
				dir: "biz/",
				files: [
					"compute.js"
				]
			}
		]				//end source
	};
};

function less_css(file, target){
	target = target || "main";
	file = file || "website"
	return {
		//需要经过less处理
		less: true,
		target: target + ".css",
		source: [{
			dir: "static/css/",
			//不指定文件，复制所有文件
			files: [file + ".less"]
		}]
	};
};

/*
 * 获取本地化语言，如果是桌面程序，获取全部的语言(ios除外)
 * 如果包含中文，则要加下zh.js，农历数字，以及农历的处理
 */
function i18n_js(language, isClient){
	var i18nDir = "biz/i18n/";
	var i18n_js_files, target = "i18n.js";
	//指定一种语言
	if(language){
		target = "i18n/{0}.js".format(language);
		i18n_js_files = [language + ".js"];
	}else{
		i18n_js_files = ["zh-cn.js", "default.js"];
	};

	var mapping = {
		dir: i18nDir,
		files: ["mapping.js"]
	};

	//i18n根目录的文件
	var i18nRoot = {
		dir: i18nDir,
		files: i18n_js_files.slice(0)
	};

	var result = {
		target: target,
		complex: true,
		//要合并的源文件
		source: []
	};

	result.source.push(i18nRoot);
	//添加中文字符
	if(!language || language == "zh-cn" || language == "zh-tw"){
		result.source.push({
			dir: "hummer/",
			files: ["chineseLunar.js", "chineseNumber.js"]
		});

		i18nRoot.files.push("zh.js");
	};

	//需要获取模板的语言，一般用于客户端，只有客户端才需要映射
	if(isClient){
		result.source.push({
			dir: "biz/i18n/template/",
			files: i18n_js_files
		});

		result.source.push(mapping);
	};

	//console.log(JSON.stringify(result));
	return result;
};


function jquery_js(){
	return {
		//把jQuery和插件合并到一起
		target: "jQuery.js",
		complex: true,
		source: [
			{
				dir: "hummer/client/",
				files:[
					"jQuery.js"
				]
			}
		]
	};
};

function prototype_js(){
	return {
		//合并目标
		target: "prototype.js",
		//需要合并
		complex: true,
		//要合并的源文件
		source: [
			{
				ignore: /index/i,
				dir: "hummer/extend/"
			}
		]
	};
};

/*
 * 用户客户端的storage.js
 */
function storage_js(){
	return {
		target: "storage.js",
		complex: true,
		source: [
			 {
			 //客户端打包，必需把这两个文件打包在前面，所以不能
			 complex: true,
			 dir: "storage/client/",
			 files: ["storage.js", "sync.js"]
			 },
			{
				closure: true,
				ignore: /member|index/i,
				dir: "storage/",
				extract: true
			}, {
				ignore: /member|index|mailQueue|token/i,
				closure: true,
				dir: "schema/",
				extract: true,
				//每读取一个文件的回调，闭包前
				closureBefore: function(file, content){
					var result = '\tvar ObjectId = String;\n';
					result += content + "\n";
					result += '\tim.schema.' + file + ' = schema;\n';
					result += '\tim.storage.' + file;
					result += '.store = im.storage.appendSchema(schema, "' + file + '");';
					return result;
				}
			}
		]
	};
};

//用于服务器端的Hummer
function hummer_server_js(){
	return [
		{
			target: "extend/",
			source: [
				{
					dir: "hummer/extend/"
				}
			]
		},{
			target: "server/",
			source: [
				{
					dir: "hummer/server/"
				}
			]
		},{
			target: "index.js",
			source: [
				{
					dir: "hummer/",
					files: ["index.js"]
				}
			]
		}
	];
};

/*
 * 生成用于Chrome的项目
 */
function clientProject(client){
	var c = im.e.Client;
	var dir;
	if(client == c.Safari) dir = "safari.safariextension";
	//移动设置，包括iphone/ipad/kindle/android
	var _isMobile = isMobile(client);
	var _isPhone = isPhone(client);

	/*
	switch(client){
		case c.Chrome:
			dir = "chrome";
			break;
		case c.Safari:
			dir = "safari.safariextension";
			break;
		case c.Air:
			dir = "air";
			break;
	};
	*/

	var jadeFiles = ["background.jade", "main.jade", "popup.jade", "notification.jade"];
	if(_isMobile) jadeFiles = ["pad.jade", "phone.jade"];
	var root = [
		{
			jade: true,
			source: [
				{
					dir: _dirTemplate + (_isMobile ? "mobile" : "desktop/"),
					files: jadeFiles
				}
			]
		}
	];

	//return {"/": root};
	var moreJS = [];
	//加入各客户端独有的文件
	switch(client){
		case c.Chrome:
			root.push({
				copyOnly: true,
				source: [
					{
						dir: "chrome/",
						files: ["manifest.json", "_locales"]
					}
				]
			});
			break;
		case c.ChromeApp:
			root.push({
				copyOnly: true,
				source: [
					{
						dir: "chrome/",
						files: ["_locales"]
					}
				]
			},{
				copyOnly: true,
				target: "manifest.json",
				source: [
					{
						dir: "chrome/",
						files: ["app_manifest.json"]
					}
				]
			});
			break;
		case c.Safari:
			root.push({
				copyOnly: true,
				source: [
					{
						dir: "safari/",
						files: ["info.plist"]
					}
				]
			});
			break;
		case c.Air:
			moreJS.push({
				source: [
					{
						dir: "air/javascript/",
						files: ["AIRAliases.js", "AIRIntrospector.js"]
					}
				]
			});

			root.push({
				copyOnly: true,
				source: [
					{
						dir: "air/",
						files: ["application.xml", "update.xml"]
					}
				]
			});
			break;
	};

	//这里的css要么是桌面版本，要么就是imbox内的phone和pad
	var cssNode;
	if(_isMobile){
		cssNode = [
			less_css("pad", "pad"),
			less_css("phone", "phone")
		];
	}else{
		cssNode = [less_css("desktop", "main")];
	}

	var result = {
		css: cssNode,
		images: [
			{
				//仅复制
				copyOnly: true,
				source: [
					{
						dir: "static/images/"
					}
				]
			}
		],javascript: [
			prototype_js()
			, jquery_js()
			, storage_js()
			, main_js(client)
			, i18n_js(null, true)			//取所有语言和模板语言
		],
		"/": root
	};

	result.javascript = result.javascript.concat(moreJS);
	return {name: dir, config: result}; 			//{javascript: moreJS};
}

/*
 * 生成用于air的项目
 */
exports.airProject = function(){
	return clientProject(im.e.Client.Air);
}

/*
 * 用于Chrome的项目
 */
exports.chromeProject = function(){
	return clientProject(im.e.Client.Chrome);
};

exports.chromeAppProject = function(){
	return clientProject(im.e.Client.ChromeApp);
}

exports.safariProject = function(){
	return clientProject(im.e.Client.Safari);
};

exports.iosProject = function(){
	return clientProject(im.e.Client.iOS);
};

exports.applicationProject = function(){
	var config = {
		biz: [
			{
				source: [
					{
						dir: "biz/",
						ignore: /client/i
					}
				]
			}
		]
		,hummer: [
			{
				target: "extend/",
				source: [
					{
						dir: "hummer/extend/"
					}
				]
			},{
				target: "server/",
				source: [
					{
						dir: "hummer/server/"
					}
				]
			},{
				target: "index.js",
				source: [
					{
						dir: "hummer/",
						files: ["index.js"]
					}
				]
			}
		],
		schema:[
			{
				source: [
					{
						dir: "schema/"
					}
				]
			}
		],
		storage: [
			{
				source: [
					{
						dir: "storage/",
						ignore: /client/i
					}
				]
			}
		],
		"/":[
			{
				source: [
					{
						dir: "",
						files: ["app.js", "router.js"]
					}
				]
			}
		]
	};

	return {name: "application", config: config}
}

/*
 生成用于air的项目
 */
exports.irProject = function(){
	var config = {
		biz: [
			{
				source: [
					{
						files: ["i18n/smartest/", "common.js", "smartest.js"]
					}
				]
			}
		],storage: [
		{
			source: [
				{
					files: ["fix.js"]
				}
			]
		}
	],
		hummer: hummer_server_js(),
		"/":[
		{
			complex: true,
			target: "app.js",
			source: [
				{
					files: ["ir.js"]
				}
			]
		}]
	};

	return {name: "ir", config: config};
}

/*
 * 生成用于静态目录的项目
 */
exports.staticProject = function(){
	var jsFolder = [
		prototype_js(),
		jquery_js(),
		main_js(im.e.Client.WebSite),
		main_js(im.e.Client.Phone, "phone"),
		main_js(im.e.Client.Pad, "pad")
	];

	jsFolder.push(i18n_js(null, true));
	_languages.forEach(function(lang){
		jsFolder.push(i18n_js(lang, false));
	});

	var config = {
		javascript:jsFolder
		,css:[
			less_css("website", "main"),
			less_css("extend", "extend"),
			less_css("phone", "phone"),
			less_css("pad", "pad")
		],"/": [
			{
				jade: true,
				multiLang: true,			//支持多语言
				source: [{
					dir: _dirTemplate,
					files: ["index.jade", "download.jade"]
				}]
			},{
				jade: true,
				target: "/phone/index",
				source: [{
					dir: _dirTemplate + "mobile/",
					files: ["phone.jade"]
				}]
			},{
				jade: true,
				target: "/pad/index",
				source: [{
					dir: _dirTemplate + "mobile/",
					files: ["pad.jade"]
				}]
			}
		], "/phone": [

		]};

	return {name: "static", config: config};
};

/*
 * 代码生成完成后
 */
exports.deployed = function(){
	return {
		imbox: {
			copy: {
				source: "{publish}imbox/",
				target: "{source}/mac/Busy/main/"
			}
		}
	};
};
/*
 * 预部署
 */
exports.preDeploy = function(){
	return {
		//运行于imbox内的，包括ipad/iphone/wp
		ios: {
			ignore: /images/i
		},
		safari: {
			name: "safari.safariextension",
			ignore: /images|Info\.plist/i
		},
		air: {
			ignore: /images/i
		},
		ir:{
			//删除时被忽略的文件
			ignore: /node_modules/i,
			dependencies: ["express", "mongoose", "xregexp"]
		},
		static:{
			ignore: /images/i,
			//预先创建好的文件夹
			dirs: ["javascript/i18n/"]
		},
		application: {},
		chrome: {
			ignore: /images|_locales/i
		}
	};
};

/*
 * 全局的配置
 */
var global = function(){
	return {
		//发布总的文件夹
		target: "../../publish",
		//静态文件的服务器，用于网站的js调用
		staticServer: {
			//default: "http://static.imtime.com/",
			//"default": "http://imtime.storage.aliyun.com/"
			default:"/"
		},
		ignore: /(\.DS_Store)|(\.svn)/i
	};
};

exports.global = global();
/*
 * 获取静态服务器的路径，根据是否产品环境和语言决定
 */
exports.staticServer = function(isProduction, language, client){
	var c = im.e.Client;
	//非产品环境，safari使用localhost的静态文件，便于调试
	if(!isProduction && client == c.Safari) return "http://localhost:3000/";
	//非网站的情况，不能提醒根目录路径，safari会出错
	if(client != c.WebSite) return "";
	if(!isProduction) return "/";
	var server = "http://static.imtime.com/";
	//中文环境，用阿里云的服务器
	if(language == "zh-cn"){
		server = "http://imtime.storage.aliyun.com/"
	};
	return server;
};

/*
 * 获取部署的配置文件
 */
exports.deploy = function(){
	var dir = _path.resolve(__dirname, global.target);
	dir = 'cd "{0}"'.format(dir) + '/{0}/';

	var irCmd = dir.format("ir");
	/*
	var result = {
		ir: [
			{cmd: }
		]
	};
	*/
};

exports.isMobile = isMobile;
exports.isPad = isPad;
exports.isPhone = isPhone;
exports.inImbox = inImbox;
exports.isDesktop = isDesktop;
exports.supportLanguages = _languages;
//用于单独文件请求，一般是用于网站上，或者客户端调度时使用
exports.jquery_js = jquery_js;
exports.prototype_js = prototype_js;
exports.main_js = main_js;
exports.pad_js = main_js;
exports.phone_js = main_js;
exports.less_css = less_css;
exports.i18n_js = i18n_js;
exports.storage_js = storage_js;