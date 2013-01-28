//输入为fix.js，目前主要是用于ir
exports.fix = {
	target: null,
	source: [
		{
			dir: "storage",
			files: ["fix.js"]
		}
	]
};

/*
 * 整个文件夹输出
 */
exports.dir = {
	source: [
		{
			dir: "storage/",
			ignore: /client/i
		}
	]
};

/*
 * 用于客户端的JS输出，输出为storage.js
 * 主要用于ios/air/chrome等浏览器
 */
exports.client = {
	target: "storage.js",
	complex: true,
	source: [
		/*
		{
			//客户端打包，必需把这两个文件打包在前面，所以不能
			complex: true,
			dir: "storage/client/",
			files: ["storage.js", "sync.js"]
		},
		*/
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