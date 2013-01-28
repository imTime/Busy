/*
	对日期的扩展
*/

/*
 用于日历
 根据一个时间，获取这个时间的完全月份，如果1号不是星期天，就向前延伸，获得星期天为开始时间
 如果当月最后一天不是星期六，则向后扩展获取星期六作为结束时间
 weeks：固定取多少周
 precision: 是否精确最后时间，取到最后一秒，即取最后时间的23:59:59
 */
Date.prototype.getWholeMonth = function(precision, weeks){
	var last, first = this.start("M"), day = first.getDay();
	if(day != 0) first = first.dateAdd("-{0}d".format(day));

	if(weeks){
		last = first.dateAdd((weeks * 7 - 1) + "d");
		if(precision) last = last.end("d");
	}else{
		last = this.end("M", precision);
		day = last.getDay();
		if(day != 6){
			last = last.dateAdd("{0}d".format(6 - day));
		}
	};

	return {
		first: first,
		last: last
	}
};

Date.prototype.set = function(ops){
	var date = this.clone();
	var k = { 'y': 'FullYear', 'q': 'Month', 'M': 'Month', 'w': 'Date',
		'd': 'Date', 'h': 'Hours', 'm': 'Minutes', 's': 'Seconds', 'ms': 'Milliseconds'
	};
	for(var key in k){
		if(ops[key] !== undefined){
			date["set" + k[key]](ops[key]);
		}
	};
	return date;
};

//判断两个日期是否相等，可以根据表达式来判断是否同一个月份
Date.prototype.equal = function(date, expr){
	//临时用，以后要再改
	var yEqual = this.getFullYear() == date.getFullYear();
	var mEqual = this.getMonth() == date.getMonth();
	var dEqual = this.getDate() == date.getDate();

	switch(expr){
		case "yM": return yEqual && mEqual;
		case "y": return yEqual;
		case "M": return mEqual;
		case "yMd": return yEqual && mEqual && dEqual;
		default: return this == date;
	};
};

//将日期释放为年月日时分秒毫秒
Date.prototype.extract = function(){
	return {
		y: this.getFullYear(),
		M: this.getMonth(),
		d: this.getDate(),
		h: this.getHours(),
		m: this.getMinutes(),
		s: this.getSeconds(),
		w: this.getDay(),
		ms: this.getMilliseconds()
	};
};

//重新整理日期，将maxUnit以下的全部置为0
Date.prototype.start = function(expr, holdMinor) {
	var t = this.extract();
	var h = t.h, m = t.m, s = t.s, ms = t.ms;
	switch (expr){
		//获取年的第一天
		case "y":
			t.M = 0;
			t.d = 1;
			h = m = s = ms = 0;
			break;
		//获取每月的第一天
		case "M":
			t.d = 1;
			h = m = s = ms = 0;
			break;
		case "w":
			//如果不是第一天，获取这周的第一天
			if(t.w != 0){
				var date = this.dateAdd(-t.w + "d");
				t = date.extract();
			};
			t.h = h = m = s = ms = 0;
			break;
		case "d":
			t.h = h = m = s = ms = 0;
			break;
		case "h":
			t.m = s = ms = 0;
			break;
		case "m":
			t.s = s = ms = 0;
			break;
		case "s":
			t.ms = 0;
			break;
	}

	if(holdMinor){
		return new Date(t.y, t.M, t.d, t.h, t.m, t.s, t.ms);
	}else{
		return new Date(t.y, t.M, t.d, h, m, s, ms);
	};
}

/*
 * 获取一个时间的最后时间，比如某天的结束时间(23:59:59)，某月/某年的结束
 * @params {"y,M,d,h,m"} expr
 * @params {Boolean} holdMinor 是否保存比expr小的时间
 * 如expr为M且holdMinor=true，表示获取这个月的最后一天，同时保留小时和分钟毫秒
 */
//TODO 获取日期最后时间的算法要改，太多重复的代码了
Date.prototype.end = function(expr, holdMinor){
	var t = this.extract();

	switch (expr){
		//获取当前最后一天
		case "y":
			if(holdMinor){
				return new Date(t.y, 12, 31, t.h, t.m, t.s, t.ms);
			}else{
				return new Date(t.y, 12, 31);
			};
		//获取当月最后一天
		case "M":
			//1.加上一个月，获取下一个月的时间；
			//2.将时间更新为下一个月1号并减1毫秒，即时这个月的最后一天
			//3.如果要保留更小日期再处理

			var date = this.dateAdd("1M");
			date = date.start("M").dateAdd("-1ms");
			t.y = date.getFullYear();
			t.M = date.getMonth();
			if(holdMinor){
				t.d = date.getDate();
				//加上时分秒
				date = new Date(t.y, t.M, t.d, t.h, t.m , t.s, t.ms);
			};
			return date;
		case "d":
			//获取当天最后的时间
			t.h = 23;
			if(!holdMinor){
				t.m = t.s = 59;
				t.ms = 999;
			};
			break;
		case "h":
			t.m = 59;
			if(!holdMinor){
				t.s = 59;
				t.ms = 999;
			};
			break;
		case "m":
			t.s = 59;
			if(!holdMinor){
				t.ms = 999;
			};
			break;
		case "s":
			t.ms = 999;
	};
	return new Date(t.y, t.M, t.d, t.h, t.m, t.s, t.ms);
};

//检测一个日期是否在日期范围以内
Date.prototype.inRange = function(min, max) {
	if(!min && !max) return true;
	if(min && max) return this >= min && this <= max;
	if(min) return this >= min;
	if(max) return this <= max;
}
//把日期从UTC转换为本地时间
Date.prototype.utcToLocal = function(offset) {
	offset = offset || new Date().getTimezoneOffset();
	return this.dateAdd(offset + "m");
}

//把日期从本地时间转换为Utc
Date.prototype.localToUtc = function(offset) {
	return this.dateAdd(-offset + "m");
}

//将一个本地时间转换为utc时间
Date.prototype.getUTC = function(){
	return Date.UTC(this.getUTCFullYear(),
		this.getUTCMonth(),
		this.getUTCDate(),
		this.getUTCHours(),
		this.getUTCMinutes(),
		this.getUTCSeconds(),
		this.getUTCMilliseconds());
};

/*
//获取周/年/月/的第一天
Date.prototype.firstDate = function(expr){
	switch(expr){
		case "m": return new Date(this.getFullYear(), this.getMonth(), 1);
		case "y": return new Date(this.getFullYear(), 0, 1);
		case "w": return this.dateAdd("-{0}d".format(this.getDay()));
	};
	return this;
};

//获取周/年/月/日的最后时间，precision：是否精确到最后时间
Date.prototype.lastDate = function(expr, precision){
	var result = this;
	switch(expr){
		//当月的第一天，加上一个月，减一天
		case "month":
			result = new Date(this.getFullYear(), this.getMonth(), 1).dateAdd(["1M", "-1d"]);
			break;
		case "year":
			result = new Date(this.getFullYear(), 11, 31);
			break;
		case "week":
			result = this.dateAdd("{0}d".format(7 - this.getDay()));
			break;
		case "day":
			result = this.start();
			break;
	};

	//加1天再减一秒，得到当天最后的时间
	if(precision){
		result = result.dateAdd(["1d", "-1s"]);
	};

	return result;
};
*/

//增加日期的format方法
Date.prototype.format = function(format, months) {
	var t = this.extract();
	//快速处理
	if(format == 'yyyyMMdd') return t.y +
		(t.M + 1).zeroize(2, true) +
		t.d.zeroize(2, true);

	var o = [
		{ k: "M+", v:t.M + 1 }, //month
		{k: "d+", v:t.d },    //day
		{k: "h+", v:t.h },   //hour
		{k: "m+", v:t.m }, //minute
		{k: "s+", v:t.s }, //second
		{k: "w+", v:t.w },     //week
		{k: "W+", v: this.weekOfYear().week },    //当前周是一年的第几周
		{k: "q+", v: Math.floor((t.M + 3) / 3) }, //quarter
		{k: "S", v:t.ms} //millisecond
	];

	if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
		(this.getFullYear() + "").substr(4 - RegExp.$1.length));

	//年
	if (/(MMM)/.test(format)) {
		format = format.replace(RegExp.$1, '{0}');
	}

	var value, tmp;
	for (var i = 0; i < o.length; i++) {
		value = o[i];
		if (new RegExp("(" + value.k + ")").test(format)) {
			tmp = value.v;
			if(RegExp.$1.length == 1 && tmp.length == 1){
				tmp = ("00" + tmp).substr(("" + tmp).length);
			}
			format = format.replace(RegExp.$1, tmp);
		}
	}

	format = format.format(months ? months[this.getMonth()] : "");
	return format;
}

//获取一个日期是在这个月的第几个周
Date.prototype.weekOfMonth = function() {
	var date = this.clone().start();
	var weekNo = date.getDay();       //获取日期是星期几
	//当月的第一天
	var firstDate = this.start("M");
	var firstWeekNo = firstDate.getDay();     //当月一号是星期几

	return Math.ceil((this.getDate() - weekNo) / 7) + (firstWeekNo <= weekNo ? 1 : 0);
}

//获取一个日期在这一年是第几周
Date.prototype.weekOfYear = function() {
	var newDate, firstDay, thisDay, week = 0, result, year;
	newDate = this.start("M"), year = this.getFullYear();
	var firstDay = newDate.getDay();
	if (firstDay < 3) week++;
	week += (this.dateDiff("d", newDate) - (7 - firstDay)) / 7;
	result = Math.ceil(week);
	if (week == 0) {
		year--;
		week = 1;
	} else if (week != result) {
		year++;
		week = 52;
	} else {
		week = result;
	}

	return {
		year: year,
		week: week
	};
}

//日期克隆
Date.prototype.clone = function() {
	var t = this.extract();
	return new Date(t.y, t.M, t.d, t.h, t.m, t.s, t.ms);
}

//日期相减
//reckon为true的时候，表示采用比较粗放的算法，比如说2010-
Date.prototype.dateDiff = function(interval, date, reckon) {
	var left = this, right = date;
	if (reckon) {
		switch (interval) {
			case "d":
				left = new Date(left.getFullYear(), left.getMonth(), left.getDate(), 23, 59, 59);
				right = new Date(right.getFullYear(), right.getMonth(), right.getDate());
				break;
		}
	}
	var span = left.getTime() - right.getTime(); //相差毫秒
	switch (interval) {
		case "y": return parseInt(left.getFullYear() - right.getFullYear());
		case "M": return parseInt((left.getFullYear() - right.getFullYear()) * 12 + (left.getMonth() - right.getMonth()));
		case "d": return Math.ceil(span / 1000 / 60 / 60 / 24);
		case "w": return Math.floor(span / 1000 / 60 / 60 / 24 / 7);
		case "h": return Math.floor(span / 1000 / 60 / 60);
		case "m": return Math.floor(span / 1000 / 60);
		case "s": return Math.floor(span / 1000);
		case "ms": return parseInt(span);
	}
}

/*
 * 计算两个时间的差值，返回一个对象，包括年月日时分秒
*/

Date.prototype.dateDiffEx = function(date) {
	//console.log(this, date);
	var result = {};
	var left = this.clone();
	var ms = {
		s: 1000,
		m: 1000 * 60,
		h: 1000 * 60 * 60,
		d: 1000 * 60 * 60 * 24
	};

	"yMdhms".split("").forEach(function(expr){
		var value = 0;
		if(expr == "y"){
			value = left.getFullYear() - date.getFullYear();
		}else if(expr == "M"){
			var mInterval = left.getMonth() - date.getMonth();
			var dInterval = left.getDate() - date.getDate();
			if((mInterval > 0 && dInterval >= 0) ||
				(mInterval < 0 && dInterval <= 0)){
				value = mInterval;
			};
		}else{
			var duration = left.getTime() - date.getTime();
			if(duration >= ms[expr]){
				value = Math.floor(duration / ms[expr]);
				left = left.dateAdd(-value + expr);
			}
		};

		if(value != 0){
			left = left.dateAdd(-value + expr);
		};
		result[expr] = value;
	});

	return result;
}

//日期相加
Date.prototype.dateAdd = function(exprArr, donotClone) {
	if(typeof(exprArr) == "string"){
		exprArr = exprArr.match(/[+-]?\d+([yqMwdhms]|ms)/ig);
	};

	var k = { 'y': 'FullYear', 'q': 'Month', 'M': 'Month', 'w': 'Date',
		'd': 'Date', 'h': 'Hours', 'm': 'Minutes', 's': 'Seconds', 'ms': 'Milliseconds'
	};
	var offset = { 'q': 3, 'w': 7 };
	//可以有多个表达式
	var tmpDate = donotClone ? this : this.clone();
	for(var i = 0; i < exprArr.length; i ++){
		var expr = exprArr[i];
		var data = expr.dateExpression();

		if (data != null && data.number != 0){
			var getFun = 'get' + k[data.interval];
			tmpDate['set' + k[data.interval]](tmpDate[getFun]() + ((offset[data.interval] || 1) * data.number));
		}
	}

	return tmpDate;
}

Date.prototype.toJSON = function(){
	return this.format("yyyy-MM-dd hh:mm:ss");
}

//计算分钟是该天的第N分钟
Date.prototype.minuteOfDate = function()
{
	var t = this.extract();
	return t.h * 60 + t.m + Math.round(t.s / 60);
}