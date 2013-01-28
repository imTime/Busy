/*
 * 用户客户端的main.js
 * 根据客户不同内容会有差异
 */
exports.main = function(client){
	var c = im.e.Client;
	//hummer client
	var hc_files = [
		"core.js",
		"jquery.dropkick.js",
		"datepicker.js"
	];

	if(client != c.WebSite){
		hc_files.push("sqlite.js");
	};

	if(client == c.Chrome){
		hc_files.push("chrome.js");
	}else if(client == c.Air){
		hc_files.push("air.js");
	};

	return {
		target: "main.js",
			complex: true,
		//要合并的源文件
		source: [
		{
			dir: "hummer/client/",
			files: hc_files
		},{
			dir: "biz/",
			//从<!--deploy-->节点中提取
			extract: true,
			files: [
				"common.js", "eventGenerator.js"
			]
		},{
			dir: "biz/client/",
			files: [
				"main.js",
				"timeline.js"
			]
		},{
			dir: "biz/client/page/"
		},{
			dir: "biz/",
			files: [
				"compute.js"
			]
		}
	]				//end source
};