var _hummer = require("../hummer/server");
var _fix = require("../storage/fix").fix;
var _common = require("./common");
var XRegExp = require('xregexp').XRegExp;
/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 9/14/12
 * Time: 8:43 下午
 * To change this template use File | Settings | File Templates.
 * 智能识别一段文本，从中提取出活动
 * 标准格式：#活动 @3:15pm !+8m by mail 上班
 * 智能分析的步骤
 * 1.用户输入，提取输入的全部文字
 * 2.将文字的中的类型/时间/提醒和内容等识别出来，并保存，如果是多行记录要保存多条
 * 3.Chrome和网站，将时间提交到服务器识别，iOS和WP程序，本地识别。如果数据和上次一样，则不交到服务器识别
 * 4.如果是邮件这类直接交到服务器识别，回调即可
 * 5.将识别结果转货为格式化数据显示给用户
 *
 * 基本上就是两步识别过程，第一步识别各段；第二部分识别时间与提醒
 */

var im = _common.im;

//==deploy==
function smart(options){
	this.options = options || {};
	return this;
};

//==========================静态方法==================
/*
 * 匹配一组正则，如果匹配成功，则将字符用这个正则替换掉。
 * @return 返回匹配成功并被替换的字符，或者返回false
 */
smart.matchAndReplace = function(patterns, text){
	var find = false;
	patterns.forEach(function(item){
		find = item.test(text);
		if(find){
			text = text.replace(item, "");
			return true;
		};
	});

	return find ? text : find;
};

/*
 * 将数字份转换为4位数的年
 */
smart.getYear = function(year){
	year = parseInt(year);
	if(year > 0 && year < 50){
		return 2000 + year;
	}else if (year > 50 && year <= 100){
		return 1900 + year;
	}else if(year > 1900 && year < 9999){
		return year;
	}else{
		return new Date().getFullYear();
	};
};

/*
 * 根据年、月，天获取一个合理的日期，如果获取的日期在当前日期后，则向推
 */
smart.getDate = function(year, month, date){
	var t = new Date().extract();
	var y = t.y, M = t.M, d = date;
	if(year) y = this.getYear(year);
	//处理月
	if(month){
		month = parseInt(month);
		M = month.withinRange(1, 12);
		M --;
	};

	//没有年和月，则检查天是否小于当前天
	if(!year && !month && date < t.d){
		M ++;
	};
	return new Date(y, M, d);
};

/*
 * 将周转换为日期，以当前日期为基准
 */
smart.weekToDate = function(week){
	var now = new Date().start("d");
	//今天是周几
	var thisWeek = now.getDay();
	if(thisWeek <= week){
		week = week - thisWeek;
	}else{
		//下周
		week = 7 - thisWeek + week;
	};
	return now.dateAdd(week + "d");
}

smart.prototype = {
	callLocal: function(node, params){
		//检查是否有本地正则
		var local = smart.i18n[this.options.language];
		if(!local) return false;
		var fn = local[node];
		if(fn) return fn.apply(local, params);
		return false;
	},
	/*
	 * 智能模糊匹配，不需要特殊的标识符，可以匹配一段话
	 */
	smartest: function(text, type){
		var result = this.callLocal("smartest", [text, type]);
		if(result) return result;
	},
	/*
	 * 提取活动的类型，默认为一般活动
	 */
	extractType: function(text){
		var at = im.e.ActivityType;
		//找到不活动类型的标识，无法识别
		if(text.indexOf("#") == -1) {
			return {
				type: at.Unknown,
				text: text
			};
		};

		//替换本地化的类型
		var result = this.callLocal("replaceLocalType", [text]);
		if(result) text = result;

		//检测类型
		var exprs = [
			{
				patterns: [/(#birthday)|(#b)/i],
				type: at.Birthday
			},{
				patterns: [/((#todo)|(#t))\s*/i],
				type: at.Todo
			},{
				patterns: [/(#activity)|(#a)/i],
				type: at.Normal
			}
		];

		var find, type = at.Unknown;
		exprs.forEach(function(item){
			find = smart.matchAndReplace(item.patterns, text);
			//如果没有找到，返回false（找到可能返回空字符）
			if(find !== false){
				type = item.type;
				text = find;
				return true;
			};
		});

		//识别正确
		return {
			type: type,
			text: text.trim()
		};
	},
	/*
	 * 提取持续的时间，返回结束时间
	 */
	extractDuration: function(start, duration){
		var end = start.clone();
		if(!duration) return end;
		//替换所有空格
		duration = duration.replaceSpace();
		if(duration) end = end.dateAdd(duration);
		return end;
	},
	/*
	 * 提取重复
	 */
	extractRepeat: function(text){
		//没有^的标识
		if(text.indexOf("^") == -1) return false;

		//替换本地化的重复
		var result = this.callLocal("replaceRepeat");
		if(result) text = result;

		var ar = im.e.ActivityRepeat;
		var exprs = [
			{
				patterns: [/(\^daily)|(\^d)/i],
				repeat: ar.Daily
			},{
				patterns: [/(\^weekly)|(\^w)/i],
				repeat: ar.Weekly
			},{
				patterns: [/(\^monthly)|(\^m)/i],
				repeat: ar.Monthly
			},{
				patterns: [/(\^yearly)|(\^y)/i],
				repeat: ar.Yearly
			}
		];

		var find = false, repeat = ar.NoRepeat;
		exprs.forEach(function(item){
			find = smart.matchAndReplace(item.patterns, text);
			if(find){
				repeat = item.repeat;
				text = find.trim();
			};		//end if;
		});			//end forEach

		return {
			repeat: repeat,
			text: text
		};
	},
	/*
	 * 将5d3m这种格式转换为秒，不转换月及以上的，因为月的时间不固定
	 */
	toSecond: function(text){
		var second = 0;
		XRegExp.forEach(text, XRegExp('\\d+[wdhms]'), function(match){
			var result = XRegExp.exec(match, XRegExp('(?<number>\\d+)(?<unit>[wdhms])'));
			var tick = {
				s: 1,
				m: 60
			};
			tick.h = 60 * tick.m;
			tick.d = tick.h * 24;
			tick.w = 7 * tick.d;

			second += result.number * tick[result.unit];
		});
		return second;
	},
	/*
	 * 提取提醒，不处理多个提醒
	 * @params {Boolean} isSingle 是否为单个提醒，即不是[][]模式
	 */
	extractReminder: function(text, isSingle){
		//替换hours/minutes/days
		var replacePattern = XRegExp('(\\s*hours?)|(\\s*minutes?)|(\\s*minutes?)', 'i');
		text = XRegExp.replace(text, replacePattern, function(match){
			var replaceTo = {
				hours: "h",
				minutes: "m",
				days: "d"
			};
			match = match.trim();
			var result = replaceTo[match];
			if(!result) result = replaceTo[match + "s"];
			return result;
		});

		//提取提醒方式的正则
		var p_prefix = '(?<prefix>[+-])?';
		var p_time = '(?<time>(\\d+[dhm]){1,3})';
		var p_type = '(\\s+by\\s+(?<type>(mail)|(pop)))?';
		var rmdPattern = '{0}{1}{2}'.format(p_prefix, p_time, p_type);
		if(isSingle) rmdPattern = '!{0}\\s*'.format(rmdPattern);
		var pattern = XRegExp(rmdPattern);
		var result = XRegExp.exec(text, pattern);
		if(!result) return false;
		//获取提醒
		var reminder = {};
		//提醒时间
		var minutes = this.toSecond(result.time) / 60;
		if(result.prefix == "-") minutes = -minutes;
		reminder.delay = minutes;
		//提醒方式
		var rb = im.e.ReminderBy;
		if(result.type){
			reminder.reminderBy = {
				mail: rb.Mail,
				pop: rb.Popup
			}[result.type];
		};
		reminder.reminderBy = reminder.reminderBy || rb.Unknown;
		//替换掉text
		if(isSingle){
			text = XRegExp.replace(text, pattern, "");
		};

		return {
			reminder: reminder,
			text: text
		};
	},
	/*
	 * 提取提醒，以!为标识的，示例
	 * ![+-](\d+) by mail/pop //默认以pop的方式提醒，by xxx可选
	 * !5 hours by mail
	 * 多个提醒用![][]的方式，如![5d by mail][3h][5m by pop]
	 */
	extractReminders: function(text){
		if(text.indexOf("!") == -1) return false;

		var that = this;
		//识别多个提醒，最多添加5个提醒
		var maxReminder = 5, reminders = [];
		var multiPattern = XRegExp('!(\\[.+\\]{1,' + maxReminder + '})');
		var matches = XRegExp.matchChain(text,
			[multiPattern,/\[(.+?)\]/ig], 'all');

		//匹配多个提醒
		if(matches.length != 0){
			text = XRegExp.replace(text, multiPattern, '');
			matches.forEach(function(item){
				var result = that.extractReminder(item);
				if(result) reminders.push(result.reminder);
			});
		}else{
			//匹配单个提醒
			var result = that.extractReminder(text, true);
			if(result){
				reminders.push(result.reminder);
				text = result.text;
			};
		}

		return {
			reminders: reminders,
			text: text.trim()
		};
	},
	/*
	 * 提取时间，以@开始~结束或者@开始
	 */
	extractTime: function(text){
		//没有可以匹配的时间
		if(text.indexOf("@") == -1) return false;
		//优先匹配本地
		var result = this.callLocal("extractTime", [text, this.options.type]);
		if(result) return result;

		//匹配英文的日期
	},
	/*
	 * 分析活动
	 * @params {String} text 要提取的字符，字符的长度一般不应该超过255个字符
	 * @params {Number} type 全局活动的类型
	 */
	analyse: function(text){
		var data = {};
		var atEnum = im.e.ActivityType;
		var rptEnum = im.e.ActivityRepeat;
		var ut = atEnum.Unknown;
		data.type = this.options.type || ut;
		//识别类型
		var et = this.extractType(text);
		if(et){
			data.type = et.type;
			text = et.text;
		};

		//生日
		var isBirthday = data.type == atEnum.Birthday;
		if(isBirthday) data.repeat = rptEnum.Yearly;

		//生日与todo不用重复，todo没重复，生日固定为每周重复一次
		if(data.type != atEnum.Todo && !isBirthday){
			//识别重复类型
			var ar = this.extractRepeat(text);
			if(ar){
				data.repeat = ar.repeat;
				text = ar.text;
			};
		};

		//识别提醒
		var rmd = this.extractReminders(text);
		//正确识别了提醒
		if(rmd){
			data.reminders = rmd.reminders;
			text = rmd.text;
		};

		//识别时间
		var event = this.extractTime(text, data.type);
		//正确识别了时间
		if(event){
			data.begin = event.begin;
			data.end = event.end;
			data.allDay = event.allDay;
			text = event.text;
		};

		//如果未识别时间，则进行全局性识别
		if(!data.begin){
			var ticket = this.smartest(text, data.type, data.repeat);
			//识别正确
			if(ticket){
				data.begin = ticket.begin;
				data.end = ticket.end;
				data.allDay = ticket.allDay;
				text = ticket.text;
				if(!data.repeat || data.repeat == im.e.ActivityRepeat.NoRepeat){
					data.repeat = ticket.repeat;
				};
			};
		};

		/*
		 * 检查是否正确识别了时间，如果没有识别，则：
		 * 识别为全天事件，开始与结束时间为当前时间
		 */
		if(!data.begin){
			data.begin = new Date().start("d");
			data.end = data.begin.clone();
			data.allDay = true;
		};

		if(!this.options.directDate){
			data.begin = data.begin.getUTC();
			data.end = data.end.getUTC();
		};


		//如果没有指定类型，识别为todo
		if(data.type == ut) data.type = im.e.ActivityType.Todo;
		//活动的标题
		if(text) text = text.trim().overlong(im.config.fieldLength.activity.title);
		data.title = text;
		return data;
	}
};

//==deploy==

smart.i18n = require("./i18n/smartest");
/*
 * 智能识别
 */
exports.analyse = function(req, res, next){
	var content = req.param('content', null),
		type = req.param('type', null),
		lang = req.param('lang', "default");
	var result;

	if(content){
		//超过长度截断
		content = content.overlong(255);
	};

	if(lang) lang = lang.replace(/\W/g, "_");

	if(!content){
		result = _hummer.getResult(false, null, {});
		return res.json(result);
	};

	var options = {
		language: lang,
		directDate: req.query.directDate == "1",
		type: 3
	};

	var ir = new smart(options);
	var result = ir.analyse(content);
	result = _hummer.getResult(true, null, result);
	res.jsonp(200, result);
};

exports.weekToDate = smart.weekToDate;