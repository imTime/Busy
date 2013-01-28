var dirClient = "hummer/client/";
var dirServer = "hummer/server/";
var dirExtend = "hummer/extend/";

//服务器部分
exports.server = [
	{
		target: "extend/",
		source: [
			{
				dir: dirExtend
			}
		]
	},
	{
		target: "server/",
		source: [
			{
				dir: dirServer
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

//jQuery，打包为单独的JS
exports.jquery = {
	//把jQuery和插件合并到一起
	target: "jQuery.js",
	complex: true,
	source: [
		{
			dir: dirClient,
			files:[
				"jQuery.js"
			]
		}
	]
};

//针对原型进行扩展，打包为单独的JS
exports.prototype = {
	//合并目标
	target: "prototype.js",
	//需要合并
	complex: true,
	//要合并的源文件
	source: [
		{
			ignore: /index/i,
			dir: dirExtend
		}
	]
};

//针对客户端部分
var client = {
	dir: dirClient,
	files: [
		"core.js",
		"jquery.dropkick.js",
		"datepicker.js"
	]
};

//桌面版本都要用sqlite，也包括ios版本
var sqlite = cloneObject(client);
sqlite.files.push("sqlite.js");

/*
 *针对桌面部分，增加air/chrome等浏览器及客户端
 */
exports.air = cloneObject(sqlite).files.push("air.js");
exports.chrome = cloneObject(sqlite).files.push("chrome.js");

//网站客户端js
exports.client = client;