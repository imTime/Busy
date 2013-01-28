require("../../../hummer/extend");
var XRegExp = require('xregexp').XRegExp;
var im = require("../../common").im;
var smart = require("../../smartest");

/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 9/25/12
 * Time: 4:35 下午
 * 智能识别的中文部分，包括简体中文和繁体中文
 */

(function(){
	var i18n = {
		basicNumber: '〇一二三四五六七八九十零壹贰叁肆伍陆柒捌玖拾',
		extendNumber: '廿卅元正',
		//时间的正则
		timePattern: {
			y: '((?<y>{{number}})年)',
			M: '((?<M>{{number}})月)',
			d: '((?<d>{{number}})[日|号]?)',
			day: '((?<day>[昨今明后後])天)',
			w: '((星期|周)(?<w>[一二三四五六七日]))',
			ampm: '((?<ampm> (上午)|(下午)|(凌晨)|(晚上)))',
			h: '((?<h>{{number}})[时|点])',
			m: '((?<m> {{number}})分?)',
			half: '(?<half>半)',
			quarter: '((?<quarter>[一二三四两])刻)',
			_: '(\\s+)',
			number: '[\\d〇一二三四五六七八九十]+'
		},
		basicNumberConverter: function(c){
			var index = this.basicNumber.indexOf(c);
			return (index > 10) ? index - 11 : index;
		},
		/*
		 * 转换中文的数字
		 */
		numberConverter: function(text, castOnly){
			if(typeof(text) == "number") return text;
			//本来就全部是数字，不用转换，直接走
			if(text.isNumber()) return parseInt(text);
			var that = this;
			//将一十，二十这类转换
			if(!castOnly){
				var reg = new RegExp('([{0}])([十拾])([{0}])?'.format(this.basicNumber), "g");
				text = text.replace(reg, function(a, b, c, d){
					var ten = that.basicNumberConverter(b);
					var unit = d ? d : '0';
					return ten + unit;
				});
			};

			var reg = new RegExp('[\d{0}{1}]'.format(this.basicNumber, this.extendNumber), "g");
			var matches = text.match(reg);
			var list = [];
			matches.forEach(function(item){
				var number;
				switch(item){
					case "廿":
						number = 20;
						break;
					case "卅":
						number = 30;
						break;
					case "元":
					case "正":
						number = 1;
						break;
					default:
						//本来就是数字，直接
						if(item.isNumber()){
							number = parseInt(item);
						}else{
							number = that.basicNumberConverter(item);
						};
						break;
				};
				list.push(number);
			});

			//仅仅转换为阿拉伯数字
			var result = list.join('');
			if(!castOnly) result = parseInt(result);
			return result;
		},
		/*
		 * 获取活动类型的正则列表，匹配中文简繁体
		 */
		replaceLocalType: function(text){
			if(text){
				var pattern = XRegExp('\\#((生日)|(待办)|(待辦)|(活动)|(活動)(\s+)?)', 'xi');
				text = XRegExp.replace(text, pattern, function(match){
					match = match.substr(1, match.length - 1);
					return "#" + ({
						"生日": "b",
						"待办": "t",
						"待辦": "t",
						"活动": "a",
						"活動": "a"
					}[match] || "a") + " ";
				});
			};
			return text;
		},
		//替换重复
		replaceRepeat: function(text){
			if(text){
				var pattern = XRegExp('\\^(每(([天周週月年])|(星期))(\s+)?)');
				text = XRegExp.replace(text, pattern, function(match){
					match = match.substr(1, match.length - 1);
					match = {
						"天": "d",
						"周": "w",
						"週": "w",
						"月": "m",
						"年": "y",
						"星期": "w"
					}[match];
					return match ? ("^" + match + " ") : '';
				});
			};
			return text;
		},/*
		 * 替换本地单位
		 */
		replaceLocalUnit: function(text){
			if(!text) return false;

			var mapping = {
				"小时": "h",
				"时": "h",
				"分钟": "m",
				"天": "d",
				"日": "d",
				"号": "d",
				"分": "m",
				"年": "y",
				"月": "M",
				"星期": "w",
				"周": "w",
				"下午": "pm",
				"上午": "am",
				"時": "h",
				"小時": "h",
				"刻": "quarter",
				"半": "half"
			};

			var that = this;
			var pattern = '[{0}]|(小时)|(小時)|(分钟)|([上下]午)|(星期)|天|日|年|週|周|時|刻|半|号';
			pattern = pattern.format(this.basicNumber, this.extendNumber);
			pattern = XRegExp(pattern, "xi");
			return XRegExp.replace(text, pattern, function(match){
				var result = mapping[match];
				if(!result) result = that.numberConverter(match);
				return result;
			}, 'all');
		},
		/*
		 * 将持续时间中的英文转换为英文
		 */
		durationConverter: function(text){
			var replace = {
				"小时": "h",
				"时": "h",
				"分钟": "m",
				"天": "d",
				"日": "d",
				"分": "m"
			};

			var pattern = '[{0}]|(小时)|(分钟)|天|日'.format(this.basicNumber);
			pattern = XRegExp(pattern, "xi");
			return XRegExp.replace(text, pattern, function(match){
				var mapping = replace[match];
				if(!mapping) mapping = numberConverter(match);
				return mapping;
			}, 'all');
		},
		/*
		 * 提取开始时间
		 * @params {String} duration 如果type为生日，则duration可能是年龄，否则无效
		 */
		extractBegin: function(begin, year){
			//识别时间
			var result = this.extractChineseTime(begin);
			if(!result) return false;				//识别不成功
			var t = new Date().extract();
			t.M ++;
			//减去生日的时间
			if(year){
				result.y = t.y - year;
			}else{
				result.y = result.y || t.y;
			};

			result.M = result.M || t.M;
			result.d = result.d || t.d;
			result.h = result.h || 0;
			result.m = result.m || 0;
			//result.M --;

			var date = new Date(result.y, result.M, result.d, result.h, result.m);
			if(result.allDay) date = date.start("d");
			return {
				date: date,
				allDay: result.allDay
			};
		},
		/*
		 * 识别结束时间
		 */
		extractEnd: function(begin, end, duration){
			//持续时间优先
			if(duration){
				duration = this.durationConverter(duration);
				return begin.dateAdd(duration);
			};

			//结束时间
			if(end) end = this.extractChineseTime(end);
			if(!end) return begin.clone();
			var t = begin.extract();
			t.M ++;

			end.y = end.y || t.y;
			end.M = end.M || t.M;
			end.d = end.d || t.d;
			return new Date(end.y, end.M, end.d, end.h, end.m);
		},
		/*
		 * 提取本地化的时间，用至表示开始结束时间，生日可以用@8月18[20]，方括号内表示周岁数
		 * 支持：
		 * @农历时间，如九月初八，完全汉字被识别为农历时间
		 * “@开始至结束”或者"@开始"
		 * 生日可以采用@月日[周岁]，如@八月初八[22]或者@8月16[21]
		 */
		extractTime: function(text, type){
			var lib = {
				begin: '(?<begin>[^\\s]+)',
				to: '(?<to>[^\\s]+)',
				end: '[\\s\\^!@\\#]'
			};

			var begin, end, duration;
			var patterns = [
				'@{{begin}}[至到~]{{to}}{{end}}',
				'@{{begin}}\\[(?<duration>.+)\\]',
				'@{{begin}}'
			];

			//匹配多个
			var matched;
			patterns.forEach(function(item){
				var pattern = XRegExp.build(item, lib);
				var result = XRegExp.exec(text, XRegExp(pattern));
				if(result){
					matched = item;
					begin = result.begin;
					end = result.end;
					duration = result.duration;
					return true;
				};
			});

			//是否成功匹配到了begin
			if(begin){
				//识别begin
				var year = 0;
				var isBirthday = type == im.e.ActivityType.Birthday;
				//生日，提取年
				if(isBirthday && duration){
					year = duration.replace(/[\D]/g, "");
					year = parseInt(year);
					if(isNaN(year)) year = 0;
				};

				var result = this.extractBegin(begin, year);
				//成功识别开始时间，继续识别结束时间。
				if(result){
					//生日不用识别结束，全天事件
					begin = result.date;
					allDay = result.allDay;
					if(!isBirthday){
						end = this.extractEnd(begin, end, duration);
					}else{
						begin = begin.start("d");
						allDay = true;
						end = begin.clone();
					};


					//替换掉文本中的内容
					var pattern = XRegExp.build(matched, lib);
					text = XRegExp.replace(text, XRegExp(pattern), '');

					return {
						allDay: allDay,
						begin: begin,
						end: end,
						text: text
					};
				};

			};
			return false;
		},
		/*
		 * 将分析的结果组合为日期（开始/结束/是否重复/是否全天事件/事件的内容）
		 */
		analyseResult: function(result){
			var data = {allDay: true};
			var ar = im.e.ActivityRepeat;
			var yMd = {}, t = new Date().extract();

			//检查是否存在着重复的情况
			if(result.repeat){
				data.repeat = {
					"天": ar.Daily,
					"周": ar.Weekly,
					"週": ar.Weekly,
					"月": ar.Monthly,
					"年": ar.Yearly,
					"星期": ar.Weekly
				}[result.repeat];

				//重复
				if(data.repeat){
					yMd.y = t.y;
					var number = result.number;
					console.log(number);
					if(number !== undefined) number = this.numberConverter(number);
					//需要取月的天
					switch(data.repeat){
						case ar.Yearly:
							yMd.M = this.numberConverter(result.M) - 1;
							yMd.d = number;
							break;
						case ar.Monthly:
							yMd.M = t.M;
							yMd.d = number;
							break;
						case ar.Weekly:
							number = number || t.w;
							var date = smart.weekToDate(number);
							yMd = date.extract();
							break;
						default:
							yMd.M = t.M;
							yMd.d = t.d;			//每天，即用当天时间
							break;
					};
				}
			};

			//============取得日期=========
			if(result.d){
				yMd = result;
				if(yMd.M) yMd.M --;
			}else if(result.w){
				var week = this.numberConverter(result.w);
				var date = smart.weekToDate(week);
				yMd = date.extract();
			}else if(result.day){			//今天/明天/后天
				var incDay = {
					"昨": -1,
					"今": 0,
					"明": 1,
					"后": 2,
					"後": 2
				}[result.day];
				//在当天的基础上累加时间
				if(incDay){
					var date = new Date();
					yMd = date.dateAdd(incDay + "d").extract();
				};
			};

			//匹配到了日期，最少要有一个天
			if(yMd && yMd.d){
				if(yMd.y) yMd.y = this.numberConverter(yMd.y);
				if(yMd.M) yMd.M = this.numberConverter(yMd.M);
				data.y = yMd.y || t.y;
				data.M = yMd.M || t.M;
				data.d = this.numberConverter(yMd.d);
			};

			//==========取得时间===========
			var isPM = result.ampm == "下午" || result.ampm == "晚上";
			//取小时
			var h = t.h;
			if(result.h){
				h = this.numberConverter(result.h);
				h = h.to24Hour(isPM);
				data.allDay = false;
			};

			//半小时，优先
			var m = t.m;
			if(result.half){
				m = 30;
				data.allDay = false;
			}else if(result.quarter){		//刻钟
				m = this.numberConverter(result.quarter) * 15;
				data.allDay = false;
			}else if(result.m){
				m = this.numberConverter(result.m);
				data.allDay = false;
			}else{
				m = 0;
			}

			//获取时间
			if(!data.allDay){
				data.h = h;
				data.m = m;
			};

			return data;
		},
		/*
		 * 智能识别包括重复的类内容，例如：每周
		 */
		smartestRepeat: function(text){
			var pattern = '(每(?<repeat>[天周週月年]|(星期)))_';
			pattern += '(?<M>{{number}}月)?_(?<number>{{number}})?[号|日]?';
			pattern += '{{ampm}}?_{{h}}?_({{half}}|{{quarter}}|{{m}})?_';
			pattern = this.datePatternConverter(pattern);
			var result = XRegExp.exec(text, pattern);
			if(!result) return false;
			//识别成功
			//替换掉被识别成功的内容
			result = this.analyseResult(result);
			result.text = XRegExp.replace(text, pattern, "");
			return result;
		},
		/*
		 * 转换日期的正则
		 */
		datePatternConverter: function(pattern){
			//转换_为空格
			pattern = pattern.replace(/_/g, '(\\s*)?');
			var tp = this.timePattern;
			//第一次替换
			pattern = XRegExp.build(pattern, tp, "x");
			//二次替换，替换number
			return XRegExp.build(pattern, tp, "x");
		},
		/*
		 * 提取中文时间完整时间
		 * @params {Boolean} hashExtract 分散识别，如果未能识别完整的时间，则将时间打散再识别
		 */
		extractChineseTime: function(text, hashExtract){
			var pattern = '(({{y}}?_{{M}}?_{{d}}_)';			//yMd
			pattern += '| {{day}} | {{w}})?_{{ampm}}?_';
			pattern += '{{h}}?({{half}}|{{quarter}}|{{m}})?_';
			pattern = pattern.replace(/_/g, '(\\s+)?');

			pattern = this.datePatternConverter(pattern);
			var result = XRegExp.exec(text, pattern);
			//没有找到匹配
			if(!result) return false;
			text = XRegExp.replace(text, pattern, "");
			result = this.analyseResult(result);
			result.text = text;
			return result;
		},
		/*
		 * 智能识别
		 */
		smartest: function(text, type, repeat){
			var result,that = this;
			if(!repeat || repeat == im.e.ActivityRepeat.NoRepeat){
				//优先识别是否为重复活动，检测是否包括重复
				result = that.smartestRepeat(text);
			};

			//没有重复的活动，识别日期
			if(!result){
				//提取中文的时间，如果还是找不到，则采用打散查找的方式
				result = that.extractChineseTime(text, true);
			};

			//识别失败
			if(!result) return false;

			var t = new Date().extract();
			t.y = result.y || t.y;
			t.M = result.M || t.M;
			t.d = result.d || t.d;
			t.m = result.m || 0;
			t.h = result.h || 0;

			var begin = new Date(t.y, t.M, t.d, t.h, t.m);
			return {
				repeat: result.repeat,
				begin: begin,
				end: begin,
				allDay: result.allDay,
				text: result.text
			};
		}
	};

	//兼容客户端
	if (typeof exports !== "undefined") {
		exports.i18n = i18n;
	}else{
		smart.i18n["zh-cn"] = smart.i18n["zh-tw"] = i18n;
	}
})();

