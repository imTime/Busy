/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/4/12
 * Time: 8:42 上午
 * Description: 对数据进行修正
 * 2012-08-04
 */
//兼容客户端
var im = {storage: {}};

//==deploy==
im.storage.fix = {
	/*
	 * 修复标签
	 * @params {String} tag:  字符串化的标签，以逗号为分隔
	 * @return {null, Object} 不符合规则返回nul，否则返回处理过的数组
	 */
	fixTag: function(tag, maxLen, count){
		var result = null;
		//默认最多5个标签
		count = count || 5;
		if(tag){
			result = [];
			tag.split(",").forEach(function(item, index){
				//超出允许最大的标签数量
				if(result.length >= count) return true;
				result[index] = fixString(item, true, maxLen);
			});		//end split
		};
		return result;
	},
	/*
	 * 修复颜色，如果不是颜色值，返回null
	 * @params {String} color 颜色值
	 * @return {null, String}
	 */
	fixColor: function(color){
		if(!color || !color.isColor()) {
			color = null;
		};
		return color;
	},
	/*
	 * 修复时区，如果不是合法的时区，返回0；反之返回转换为int型的时区
	 * @params {String} color 颜色值
	 * @return {Int}
	 */
	fixTimeZone: function(tz){
	//判断时区是否正确
		if(tz){
			tz = parseInt(tz);
			//时区超出范围
			if(!tz.inRange(-12, 12)){
				tz = 0;
			}
		}else{
			tz = 0;
		};
		return tz;
	},
	/*
	 * 修复字符串，如果过长则截断
	 * @params {String} text 要修复的文本
	 * @params {Boolean} isTrim 是否需要去除首毛的空白
	 * @params {Number} 允许字符最长是多少
	 * @return {Int}
	 */
	fixString: function(text, isTrim, maxLen){
		if(text){
			if(isTrim) text = text.trim();
			if(maxLen) text = text.overlong(maxLen);
			text = text.encodeHtml();
		};
		return text || null;
	},
	/*
	 * 修复日期，如果非正确的日期格式，则返回null，日期格式必需是完整的日期格式
	 */
	fixDate: function(date){
		if(!date) return null;
		//本身就是数字
		if(typeof(date) == "number"){
			return date.validDate() ? date : null;
		};

		//字符串化数字
		if(date.isNumber()){
			date = parseInt(date);
			return date.validDate() ? date : null;
			return date;
		}

		if(date.isDate()){
			return Date.parse(date);
		}else{
			return null;
		}
	},
	/*
	 * 修复int型
	 * @input {String, Number} 要修复的字符
	 * @def {Number} 转换失败，或者设置了min和max，但值不在这个区间的时候，返回默认值
	 * @forceInt {Boolean} 是否强制要求int型
	 * @min {Number} 最小值
	 * @max {Number} 最大值
	 */
	fixNumber: function(input, def, forceInt, min, max){
		//本身已经是数字
		var number = input;
		//传入的是字符
		if(typeof(input) == "string"){
			if(!input.isNumeric()) return def;
			number = parseFloat(input);
		};

		//是否要强制为int型
		if(forceInt){
			number = parseInt(number);
		};

		if(isNaN(number)) return def;
		//是否在区域内
		if(min !== undefined && max != undefined &&
			!number.inRange(min, max)) number = def;
		return number;
	},
	/*
	 * 修复Boolean值，true和1标记为true，其它为false
	 */
	fixBoolean: function (input){
		return input == "true" || input == "1";
	},
	/*
	 rules = [
			{
				field: "title",
				type: Boolean,

			}
	 ]
	 */
	fix: function(data, rules, schema, removeUndefined){
		for(var field in schema){
			//获取规则
			var rule = rules[field];
			//跳过系统字段
			var skip = false;
			if(rule && rule.skip) continue;
			["lastUpdate", "version", "_id", "memberId"].forEach(function(item){
				if(field == item){
					skip = true;
					return true;
				};
			});
			if(skip) continue;

			var value = data[field];
			//值未定义，删除
			if(removeUndefined && value === undefined){
				delete data[field];
				continue;
			};

			//没有赋值，使用默认值
			var def = schema[field]["default"];
			if(value == undefined && def !== undefined){
				data[field] = def;
				continue;
			};

			var type = schema[field].type;

			var params = [];
			if(rule) {
				if(rule instanceof Array){
					params = rule;
				}else{
					type = rule.type || type;
					params = rule.params || [];
				};
			};
			params.unshift(value);

			//根据字段类型调用不同的修正函数
			var fn = "fixString";
			switch(type){
				case Date:
					fn = "fixDate";
					break;
				case Number:
					fn = "fixNumber";
					break;
				case "timeZone":
					fn = "fixTimeZone";
					break;
				case "color":
					fn = "fixColor";
					break;
				case "tag":
					fn = "fixTag";
					break;
				case Boolean:
					fn = "fixBoolean";
					break;
				case String:
					fn = "fixString";
					break;
				default:
					continue;
					break;
			};

			data[field] = this[fn].apply(this, params);
		};
		return data;
	}
};
//==deploy==

exports.fix = im.storage.fix;