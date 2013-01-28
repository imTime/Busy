//*************************************对String进行扩展**********************************
//用正则检测一个当前字符串，如果expr是字符，则用new RegExp检查
String.prototype.test = function(expr, modifiers){
	if(typeof(expr) == "string"){
		return new RegExp(expr, modifiers).test(this);
	}else{
		return expr.test(this);
	}
};

//去除字符两边的空白
if(!String.prototype.trim){
	String.prototype.trim = function(){
		return this.replace(/^\s+/, "" ).replace( /\s+$/, "" );
	};
};

/*
 * 替换空白字符串，可选替换为具体的字符
 */
String.prototype.replaceSpace = function(replaceTo){
	replaceTo = replaceTo || "";
	return this.replace(/\s/g, replaceTo);
};

//转换全角为半角
String.prototype.dbc2sbc = function ()
{
	return this.replace(/[\uff01-\uff5e]/g,function(a){
		return String.fromCharCode(a.charCodeAt(0)-65248);
		}).replace(/\u3000/g," ");
}

//判断一个字符是否超出指定长度，如果超出，则截断，并根据suffix是否在截断的后面加上后缀，如...
String.prototype.overlong = function(maxLen, suffix){
	if(suffix === true){
		suffix = "...";
	}else{
		suffix = suffix || "";
	};

	if(this.length > maxLen){
		return this.substr(0, maxLen - suffix.length) + suffix;
	}else{
		return this.toString();
	};
};

//获取相近的颜色
String.prototype.mateColor = function(offset){
	offset = offset || -10;
	var rgba = this.extractRGBA();
	var max = Math.max(Math.max(rgba.r, rgba.g), rgba.b);
	var igrone = false, v;
	"rgb".split("").forEach(function(element){
		v = parseInt(rgba[element]);
		if(!igrone || v != max){
			v = v + offset;
			if(v > 255) {
				v += -(offset * 2);
			}else if(v < 0){
				v = v + (-offset * 2);
			}
			rgba[element] = parseInt(v);
		}
	});
	return "rgba({0}, {1}, {2}, {3})".format(rgba.r, rgba.g, rgba.b, rgba.a);
};

//将一个颜色的rgba进行替换，values={r: 5, g: 9, b: 10, a: 0.5};，sum为true的时候累加
String.prototype.replaceRGBA = function(values, sum, getString){
	var rgba = this.extractRGBA();
	for(var k in values){
		var v = values[k];
		rgba[k] = sum ? rgba[k] + v : v;
	};

	//返回字符的颜色值
	if(getString){
		return  "rgba({0}, {1}, {2}, {3})"
			.format(rgba.r, rgba.g, rgba.b, rgba.a);
	};
	return rgba;
};

//从一个颜色值中提取出来rgba，支持hex的和rgba的；getString=true，返回字符串的rgba颜色值
String.prototype.extractRGBA = function(getString){
	var rgb = this;
	if(/#\w{6}/ig.test(rgb)){
		rgb = rgb.hex2rgb();
	}
	rgb = rgb.replace(/(\s?)/ig, "");
	var result = false;
	if(/^rgba?\((\d+),(\d+),(\d+)(,([0-9.]+))?\)$/.test(rgb)){
		result = {
			r: RegExp.$1,
			g: RegExp.$2,
			b: RegExp.$3,
			a: 1
		};
		if(RegExp.$5){
			result.a = RegExp.$5;
		}
	};

	if(getString && result !== false){
		result = "rgba({0}, {1}, {2}, {3})"
			.format(result.r, result.g, result.b, result.a);
	}

	return result;
};

//将rgb转换为hex的颜色
String.prototype.rgb2hex = function() {
	//如果本身已经是hex则直接返回
	if (this == "transparent") {
		return "";
	};

	if (!this ||
		/^#(([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})|([0-9a-f])([0-9a-f])([0-9a-f]))$/i.test(this)) {
		return this;
	};

	var rgb = this.match(/\d+/g);
	var hexDigits = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F");
	//generates the hex-digits for a colour.
	hex = function(x) {
		return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
	};
	return "#" + hex(rgb[0]) + hex(rgb[1]) + hex(rgb[2]);
};

//十六进制的颜色转换为rgb
String.prototype.hex2rgb = function() {
	var fmt = 'rgb({0},{1},{2})';
	var c, o = [], k = 0, m = this.match(
		/^#(([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})|([0-9a-f])([0-9a-f])([0-9a-f]))$/i);

	if (!m) return fmt.format(0, 0, 0);
	for (var i = 2, s = m.length; i < s; i++) {
		if (undefined === m[i]) continue;
		c = parseInt(m[i], 16);
		o[k++] = c + (i > 4 ? c * 16 : 0);
	}
	return fmt.format(o[0], o[1], o[2]);
};

//取颜色的反色，返回hex的颜色
String.prototype.invertColor = function(rOffset, gOffset, bOffset) {
	//判断是否为16进进颜色，如果是16进制的，转换为rgb
	rOffset = rOffset || 0;
	gOffset = gOffset || rOffset;
	bOffset = bOffset || rOffset;
	var color = this;
	var isHex = /^#[0-9a-f]{6}$/.test(color.toLowerCase());
	if (isHex) {
		color = $.hex2rgb(color);
	}
	//获取反色
	var result = 'rgb({0},{1},{2})', r, g, b;
	if (new RegExp(/(\d+),(\d+),(\d+)/g).test(color)) {
		r = 255 - parseInt(RegExp.$1) + rOffset;
		g = 255 - parseInt(RegExp.$2) + gOffset;
		b = 255 - parseInt(RegExp.$3) + bOffset;

		r = Math.min(Math.max(0, r), 255);
		g = Math.min(Math.max(0, g), 255);
		b = Math.min(Math.max(0, b), 255);
		color = result.format(r, g, b);
		//如果原始是16进制，则转换为16进制返回
		if (isHex) {
			color = color.rgb2hex();
		}
		return color;
	};
	return color;
};

String.prototype.format = function() {
	var args = arguments;
	//如果第一个参数是数组，则直接使用这个数组
	if(args[0] instanceof Array){
		args = args[0];
	};
	return this.replace(/\{(\d+)\}/g,
		function(m, i) {
			var value = args[i];
			if(value === undefined) value = m;
			return value;
		});
};

String.prototype.formatEx = function(fn, expr) {
	expr = expr || /\{(.+)\}/g;
	return this.replace(expr,
		function(m, i) {
			return fn(i);
		});
};

//分隔标签
String.prototype.splitTag = function(separator){
	separator = separator || ",";

}
//==================================判断字符串===========================
//判断是否为Int型
String.prototype.isInt = function(symbol) {
	if(!this) return false;
	var Reg = /^-?[0-9]{1,10}$/;
	return /[+\-]\d/.test(this);
};

/*
 * 是否为全部数字
 */
String.prototype.isNumber = function(){
	return !/\D/.test(this);
};

//判断是否为数字
String.prototype.isNumeric = function() {
	if(!this) return false;
	return !/[^+\-\d\.]/.test(this);
};

//检测是否为英文和字母组成
String.prototype.LetterAndNumeric = function() {
	if(!this) return true;
	var Reg = /^[A-Za-z0-9]+$/;
	return Reg.test(this);
};

//转换为Sql用的值
String.prototype.toSqlValue = function(){
	return this.replace(/'/ig, "''");
};

//过滤html数据
String.prototype.encodeHtml = function(){
	return this.replace(/&/, "&amp;").replace(/</ig, "&lt;")
		.replace(/>/ig, "&gt;").replace(/\s/ig, "&nbsp;")
};

//解码html数据
String.prototype.decodeHtml = function(){
	return this.replace(/&lt;/ig, "<").replace(/&gt;/ig, ">")
		.replace(/&nbsp;/ig, " ").replace(/&amp;/, "&")
};

//计算字符的长度，宽字符按两个字节算
String.prototype.lengthEx = function() {
	return this.replace(/[^\x00-\xff]/g, "**").length;
};

//获取分析后的日期偏移量数据
String.prototype.dateExpression = function() {
	var pattern = "^([+-]*)(\\d+)([yMdhmsw]|(ms))$";
	var reg = new RegExp(pattern);
	if (RegExp(pattern).test(this)) {
		return {
			interval: RegExp.$3,
			number: parseInt((RegExp.$1 == "" || RegExp.$1 == "+") ? RegExp.$2 : -RegExp.$2)
		}
	}
	else {
		return null;
	}
};

//字符串转为日期，但不需要表达式
String.prototype.toDateEx = function(getData) {
	var data = { y: 0, M: 0, d: 0, h: 0, m: 0, s: 0, ms: 0 };
	var cn = { "年": "y", "月": "M", "日": "d", "时": "h", "分": "m", "秒": "s", "毫秒": "ms" };
	var result = this.match(/\d+((ms)|[yMdhms年月日时分秒]|(毫秒))/ig);
	for (var i = 0; i < result.length; i++) {
		RegExp(/(\d+)([yMdhms年月日时分秒]|(毫秒))/).test(result[i]);
		if (data[RegExp.$2] == undefined) {
			//alert(cn[RegExp.$2]);
			data[cn[RegExp.$2]] = parseInt(RegExp.$1);
		}
		else {
			data[RegExp.$2] = parseInt(RegExp.$1);
		}
	};

	if(getData) return data;
	return new Date(data.y, data.M - 1, data.d, data.h, data.m, data.s, data.ms);
};

//通过偏移量及格式化表达式获取Utc时间
String.prototype.toUtcDate = function(format, offset) {
	return this.toDate(format).localToUtc(offset);
};

//将字符串转换为日期
String.prototype.toDate = function(format, isUTC) {
	var pattern = format.replace(/(yyyy)/g, "([0-9]{4})")
		.replace(/(yy)|(MM)|(dd)|(hh)|(mm)|(ss)/g, "([0-9]{2})")
		.replace(/[Mdhms]/g, "([0-9]{1,2})");

	//获取子表达式的索引
	var getIndex = function(expr1, expr2) {
		var index = format.indexOf(expr1);
		if (index == -1) index = format.indexOf(expr2);
		return index;
	}

	var today = new Date();
	var returnDate;
	if (new RegExp(pattern).test(this)) {
		var yPos = getIndex("yyyy", "yy");
		var mPos = getIndex("MM", "M");
		var dPos = getIndex("dd", "d");
		var hPos = getIndex("hh", "h");
		var miPos = getIndex("mm", "m");
		var sPos = getIndex("ss", "s");
		var data = { y: 0, m: 0, d: 0, h: 0, mi: 0, s: 0 };
		//对索引进行排序
		var pos = new Array(yPos + ",y", mPos + ",m", dPos + ",d", hPos + ",h", miPos + ",mi", sPos + ",s").sort(
			function(a, b) {
				a = parseInt(a.split(",")[0]);
				b = parseInt(b.split(",")[0]);
				return a > b;
			}
		);

		//删除索引为-1的数组
		var tmpIndex = 0;
		var newPos = new Array();
		for (var i = 0; i < pos.length; i++) {
			if (parseInt(pos[i].split(",")[0]) != -1) {
				newPos[tmpIndex] = pos[i];
				tmpIndex++;
			}
		}

		//与当前文本进行匹配
		var m = this.match(pattern);
		for (var i = 1; i < m.length; i++) {

			if (i == 0) return;
			var flag = newPos[i - 1].split(',')[1];
			data[flag] = m[i];
		};

		data.y = data.y || today.getFullYear();             //年如果为空，则取当前年
		data.d = data.d || today.getDate();                 //天如果为空，则取今天
		//月不需要处理，因为月的0月是1月

		//如果年是yy格式，则加上20
		if (data.y.toString().length == 2) data.y = parseInt("20" + data.y);
		data.m -= 1;
		if(isUTC){
			returnDate = new Date(Date.UTC(data.y, data.m,
				data.d, data.h, data.mi, data.s));
		}else{
			returnDate = new Date(data.y, data.m, data.d, data.h, data.mi, data.s);
		}
	}
	returnDate = returnDate || today;
	return returnDate;
};


//检查是否为邮件
String.prototype.isMail = function() {
	return this.test(/^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/);
};

//判断是否为网址
String.prototype.isUrl = function() {
	return this.test(/^(?:(?:ht|f)tp(?:s?)\:\/\/|~\/|\/)?(?:\w+:\w+@)?(localhost|(?:(?:[-\w\d{1-3}]+\.)+(?:com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|edu|co\.uk|ac\.uk|it|fr|tv|museum|asia|local|travel|[a-z]{2}))|((\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)(\.(\b25[0-5]\b|\b[2][0-4][0-9]\b|\b[0-1]?[0-9]?[0-9]\b)){3}))(?::[\d]{1,5})?(?:(?:(?:\/(?:[-\w~!$+|.,="'\(\)_\*]|%[a-f\d]{2})+)+|\/)+|\?|#)?(?:(?:\?(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)(?:&(?:[-\w~!$+|.,*:]|%[a-f\d{2}])+=?(?:[-\w~!$+|.,*:=]|%[a-f\d]{2})*)*)*(?:#(?:[-\w~!$ |\/.,*:;=]|%[a-f\d]{2})*)?$/i) || str.length > 2083;
};

//是否为基础字符
String.prototype.isAlpha = function() {
	return this.test(/^[a-zA-Z]+$/);
};

//26个字母加数字
String.prototype.isAlphanumeric = function() {
	return this.test(/^[a-zA-Z0-9]+$/);
};


String.prototype.isLowercase = function() {
	return this.test(/^[a-z0-9]+$/);
};

//是否为小写字母
String.prototype.isUppercase = function() {
	return this.test(/^[A-Z0-9]+$/);
};

//是否为decimal
String.prototype.isDecimal = function() {
	return this !== '' && this.test(/^(?:-?(?:[0-9]+))?(?:\.[0-9]*)?(?:[eE][\+\-]?(?:[0-9]+))?$/);
};

//是否为空
String.prototype.isNull = function() {
	return this === '';
};

//不包含任何空字符
String.prototype.notEmpty = function() {
	return !this.test(/^[\s\t\r\n]*$/);
};

//不包含elem
String.prototype.contains = function(elem) {
	return this.indexOf(elem) >= 0;
};

String.prototype.notContains = function(str, elem) {
	return !validators.contains(str, elem);
};

String.prototype.len = function(min, max) {
	return this.length >= min && (max === undefined || this.length <= max);
};

//判断是否为uuid
String.prototype.isUUID = function(version) {
	var pattern;
	if (version == 3 || version == 'v3') {
		pattern = /^[0-9A-F]{8}-[0-9A-F]{4}-3[0-9A-F]{3}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
	} else if (version == 4 || version == 'v4') {
		pattern = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
	} else {
		pattern = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
	}
	return this.test(pattern);
};

//判断是否为日期
String.prototype.isDate = function() {
	var intDate = Date.parse(this);
	return !isNaN(intDate);
};

//判断一个字符是否为颜色值，支持rgb,rgba和hex，不能包括任何空格
String.prototype.isColor = function(){
	var hexPattern = /^#\w{6}$/ig,
		rgbaPattern = /^rgba?\((\d+),(\d+),(\d+)(,([0-9.]+))?\)$/;
	return this.match(hexPattern) || this.match(rgbaPattern);
}