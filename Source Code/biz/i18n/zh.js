(function(){
	/*
	 * 对中文处理，兼容简体和繁体中文
	 */
	im.i18n.zh = {
		/*
		 * 提醒
		 */
		getReminderText: function(delay, reminderBy){
			var prefix = "准时", duration = "";
			if(delay != 0){
				prefix = delay > 0 ? "延后" : "提前";

				delay = Math.abs(delay) * 60;
				var data = delay.secondConverter();
				duration = $.i18n("duration", [data]);
			};

			//提醒方式
			var rmdType = im.i18n.getLocalEnum("ReminderBy", reminderBy);
			return "{0}{1}{2}提醒".format(prefix, duration, rmdType);
		},
		//持续时间
		duration: function(data){
			var result = "";
			if(data.y) result += data.y + "年";
			if(data.M) result += data.M + "个月";
			if(data.d) result += data.d + "天";
			if(data.h) result += data.h + "小时";
			if(data.m) result += data.m + "分钟";
			if(data.s) result += data.s + "秒";
			return result;
		},
		/*
		 * 获取本地化时间(农历)
		 */
		getLocalDate: function(date, expr) {
			return chineseLunar.solarToLunar(date, expr);
		},
		/*
		 * 是否显示本地日历选项
		 */
		showLocal: function(repeat) {
			var rt = im.e.repeatType;
			return repeat == rt.Yearly || repeat == rt.Monthly;
		},
		/*
		 * 批量获取本地日历，由某个时间至某个时间的本地化时间，一般用于日历
		 * 此方法不用每次都计算农历，提高速度
		 * @parmas {Date} from 开始时间
		 * @parmas {Date} to 结束时间
		 */
		localSerialDate: function(from, to) {
			var cl = chineseLunar;
			var keyFmt = "yyyyMMdd";
			//获取开始时间对应的农历时间
			var dayCount = to.dateDiff("d", from) + 1;
			var lunar = cl.solarToLunar(from);
			//取开始时间的这个月农历有多少天
			var daysOfMonth = cl.daysOfMonth(
				lunar.y, lunar.m, lunar.isLeapMonth);

			var result = [], current;
			current = from.clone();
			result.push({ date: current.format(keyFmt), local: lunar });

			//循环计算农历
			for (var i = 1; i < dayCount; i++) {
				current.dateAdd("1d", true);
				lunar = $.extend({}, lunar);
				lunar.d++;
				//如果农历的天超出了这个月的总天数，说明到了下一个月，重新计算
				if (lunar.d > daysOfMonth) {
					lunar = cl.dateAdd(lunar, "1m");     //加多一个月
					lunar.d = 1;
					//重新计算这个月有多少天
					daysOfMonth = cl.daysOfMonth(lunar.y, lunar.m, lunar.isLeapMonth);
				};

				result.push({ date: current.format(keyFmt), local: lunar });
			}
			return result;
		},
		/*
		 * 本地化日历
		 */
		localCalendar: function(from, to) {
			var cl = chineseLunar;
			var lunars = im.i18n.zh.localSerialDate(from, to);
			var result = {}, lunar, day;
			for (var i = 0; i < lunars.length; i++) {
				lunar = lunars[i].local;
				day = cl.dayName(lunar.d);
				if (lunar.d == 1) {
					day = cl.monthName(lunar.m, true, lunar.isLeapMonth);
				};

				result[lunars[i].date] = {
					day: day,
					full: cl.format(lunar, 'y年md')
				};
			};     //end for
			return result;
		},
		/*
		 * 计算本地重复
		 * maxRepeat: 最大重复次数
		 */
		computeLocalRepeat: function(option, duration, continueLoop) {
			var result = [], index = 0, execNext, maxLoop = 50;
			//重复间隔，暂时为1
			var interval = 1, begin = option.begin;
			var cl = chineseLunar;
			var at = im.e.ActivityType;
			switch (option.repeat) {
				case at.Yearly:
					var year = Math.ceil(option.minDate.dateDiff("y", begin));
					year = Math.max(year, 0);
					//获取第一次农历的时间
					var firstLunar = cl.solarToLunar(begin);
					//获取当前一次的农历时间
					year -= year % interval;
					var curLunar = cl.dateAdd(firstLunar, year + "y");
					var curDate = cl.lunarToSolar(curLunar);               //取第一次要重复的公历
					var lunar, isLeap, counter;

					do {
						counter = curDate.dateDiff("y", begin);
						result.push({
							date: curDate.clone(),
							counter: counter
						});

						//如果闰月，把闰月也加上
						if (curLunar.leapMonth == curLunar.m) {
							curLunar.isLeapYear = !curLunar.isLeapYear;
							curDate = cl.lunarToSolar(curLunar);

							//天数不能超出
							var luanrDays = cl.daysOfMonth(curLunar.y, curLunar.m, curLunar.isLeapMonth);
							if (curLunar.d <= luanrDays) {
								result.push({
									date: curDate.clone(),
									counter: counter
								});
							}
						}

						//累加计算下一次的日期
						index++;
						curLunar = cl.dateAdd(curLunar, interval + "y");
						//农历超出了范围
						if (!curLunar) break;
						curDate = cl.lunarToSolar(curLunar);
						//是否需要执行一下次
						execNext = index < maxLoop && continueLoop(index, curDate, duration, option);
					} while (execNext)
					break;
				case at.Monthly:
					//计算从最大时间，到活动的第一次，共有多少个农历月
					var sLunar = cl.solarToLunar(begin);
					var eLunar = cl.solarToLunar(option.minDate);
					var count = cl.dateDiff(sLunar, eLunar, "m");          //活动开始的第一次，到现在共有多少个月了
					count = Math.max(0, count);
					var startDates = [], run = true, current = {};
					$.extend(current, sLunar);
					var inc = count % interval;           //第一次增加的月份
					var repeatCount = Math.floor(count / interval);            //已经重复了多少次

					do {
						current = cl.dateAdd(current, count + (index == 0 ? inc : interval) + "m");
						//获取这个月有多少天
						var days = cl.daysOfMonth(current);
						current.d = sLunar.d;
						/*
						 因为农历每月的天数是不固定的，这样可能造成活动的第一次是30，但第2次重复的时候没有30这一天。
						 所以需要重复最后一天，如果没有选择重复最后一天，则忽略这一次重复
						 */
						//要重复的日期比当前月总天数还多，跳过本次重复
						if (sLunar.d > days) continue;
						/*
						 //不要删除下列代码，以后会需要用到
						 if (option.repeat.value == "last") {
						 current.d = days;
						 } else if (sLunar.d > days) {               //要重复的日期比当前月总天数还多，跳过本次重复
						 continue;
						 }
						 */

						index++;
						//获取阳历的时间
						var solarDate = cl.lunarToSolar(current);
						result.push({ date: solarDate, counter: repeatCount + index });
						execNext = index < maxLoop && continueLoop(index, solarDate, duration, option);
					} while (execNext);
					break;
			}
			return result;
		},
		/*
		 * 本地化的智能时间识别，识别农历时间
		 * 月或者日，任何一个是中文都识别为农历
		 */
		smartDate: function(text){
			var cn = im.i18n.zh.chineseNumber;
			var pattern = '(([{0}\\d]+)年)?((闰)?([{0}{1}\\d]+)月)?(初?([{0}{1}\\d]+))日?';
			pattern = pattern.format(cn.basicNumber, cn.extendNumber);
			var reg = new RegExp(pattern, "i");
			if(reg.test(text)){
				var isLocal = false;
				var local = im.e.ActivityLocal.ChineseLunar;
				var isLeapMonth = Boolean(RegExp.$4);
				//闰月，农历
				if(isLeapMonth) isLocal = true;

				var year = RegExp.$2;
				var month = RegExp.$5;
				var date = RegExp.$7;

				//月不是int型，表示这是一个农历
				if(month && !month.isNumber()){
					isLocal = true;
					month = cn.numberConverter(month);
				};

				if(year && !year.isNumber()){
					isLocal = true;
					year = cn.numberConverter(year, true);
				}

				if(date && !date.isNumber()){
					isLocal = true;
					date = cn.numberConverter(date);
				}

				//处理农历
				if(isLocal){
					//处理农历，取今天的农历时间为默认时间
					var now = chineseLunar.solarToLunar(new Date());
					year = year || now.y;
					month = month || now.m;
					date = date || now.d;

					//检查月份是否正确
					if(month < 0 || month > 12) return false;
					//检查天是否超出范围
					var daysOfMonth = chineseLunar.daysOfMonth(year, month, isLeapMonth);
					if(date > daysOfMonth) date = daysOfMonth;

					var solar = chineseLunar.lunarToSolar(year, month, date, isLeapMonth);
					//没有找到这个月份，并且是闰月，可能是用户输错了，试试不用闰月
					if(solar == false && isLeapMonth){
						solar = chineseLunar.lunarToSolar(year, month, date, false);
					};

					return {
						local: local,
						date: solar.getTime()
					};
				};

				//不是农历
				var t = new Date().extract();
				year = year || t.y;
				if(month){
					month --;
				}else{
					month = t.M;
				}
				date = date || t.d;

				return {
					date: new Date(year, month, date).getTime()
				};
			};
			return false;
		}
	};

	if(im.i18n["zh-tw"]){
		$.extend(im.i18n["zh-tw"], im.i18n.zh);
	};

	if(im.i18n["zh-cn"]){
		$.extend(im.i18n["zh-cn"], im.i18n.zh);
	}
})();