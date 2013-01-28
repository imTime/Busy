/*
 * 事件发生器，可以计算在指定范围内，某个活动被重复多少次，返回重复列表
 * var _gen = new eventGenerator(min, max);
 * var events = _gen.run(begin, end, repeat, stop, local);
 */
var chineseLunar = require("../hummer/chineseLunar").chineseLunar;
/*
 var gen = new eventGenerator(new Date(2011, 0, 1).getTime(), new Date(2013, 0,1).getTime());
 gen.run(new Date(1983, 0, 29).getTime(), 0, new Date(9999, 0, 1).getTime(), 2, 3);
 */
//==deploy==
(function(){
	var _gen = function(min, max, maxLoop){
		this.minDate = min;
		this.maxDate = max;
		this.maxLoop = maxLoop || 100;
	};

	_gen.prototype = {
		/*
		 * 检测一个开始及结束时间是否在范围内
		 */
		inRange: function(start, stop){
			var result = start.inRange(this.minDate, this.maxDate);
			if (!result) {
				result = stop.inRange(this.minDate, this.maxDate);
			}
			return result;
		},
		/*
		 * 计算重复，返回此范围内的事件列表
		 * 日期在计算的时候，一般都是用Number，只要在做日期运算的时候，才转换为Date
		 * returns
		 * [{
		 *	event: 0,			//事件发生的时间
		 *  counter: 0		//第N次重复
		 * }]
		 */
		run: function(begin, duration, repeat, stop, local){
			var result = [];
			var arEnum = im.e.ActivityRepeat;
			var noRepeat = !repeat || repeat == arEnum.NoRepeat;
			var start = begin, end = begin + duration;
			stop = (noRepeat ? end : stop || end) || start;

			//开始时间大于区间最大时间（未发生），停止时间小于区间最大时间（无需响应）
			if(stop < this.minDate || start > this.maxDate) return result;

			//没有重复
			if(noRepeat){
				//非重复活动，判断起止时间在区间内即可
				if(this.inRange(start, stop)){
					result.push({
						event: start,
						counter: 0
					});
				};				//end if
				return result;
			};

			return this.runRepeat(begin, duration, stop, repeat, local);
		},
		/*
		 * 计算重复
		 */
		runRepeat: function(begin, duration, stop, repeat, local){
			var arEnum = im.e.ActivityRepeat;
			var result = [];

			//中国农历的处理
			if(local == im.e.ActivityLocal.ChineseLunar){
				var options = {
					begin: begin,
					duration: duration,
					repeat: repeat,
					minDate: this.minDate,
					maxDate: this.maxDate,
					maxLoop: this.maxLoop
				};

				return this.i18n.zh.localRepeat(options, this.isExecNext);
			};

			//默认开始时间就是本次重复的时间
			var start = new Date(begin)
				, event = new Date(begin)
				, min = new Date(this.minDate)
				, max = new Date(this.maxDate);

			var expr = {
				"_2": "y",
				//"3": "q",
				"_4": "M",
				"_5": "w",
				"_6": "d"
			}["_" + repeat];

			//重复的方式不在允许的方式以内
			if(!expr) return result;

			//计算最小时间到活动开始时间的间隔单位(根据重复类型)时间
			var span = min.dateDiff(expr, event);
			span = Math.max(0, span);
			//计算最后一次重复时间
			if(span > 0){
				event = event.dateAdd(span + expr);
			};

			//已经重复了多少次
			var counter = 0, index = 0, execNext = false;
			//开始计算重复
			do {
				//计算第n次重复
				counter = event.dateDiff(expr, start);
				result.push({
					event: event.getTime(),
					counter: counter
				});

				//继续下一轮
				event = event.dateAdd("1" + expr);
				index++;
				counter ++;
				//是否继续循环
				execNext = this.isExecNext(index, event.getTime(), duration);
			} while (execNext);
			return result;
		},
		/*
		 * 判断是否还需要继续计算循环
		 *
		 */
		isExecNext: function(index, event, duration, minDate, maxDate, maxLoop) {
			//超过总的允许循环次数
			minDate = minDate || this.minDate;
			maxDate = maxDate || this.maxDate;
			maxLoop = maxLoop || this.maxLoop;
			if(index > maxLoop) return false;
			var result = event.inRange(minDate, maxDate);
			//如果持续时间大于0秒，并且execNext    判断为False，则再判断结束时间是否在许可时间内
			if (!result) {
				result = (event + duration).inRange(minDate, maxDate);
			};
			return result;
		}
	};

	//本地化检查
	_gen.prototype.i18n = {
		zh: {
			/*
			 * 计算中文的本地重复
			 * maxRepeat: 最大重复次数
			 */
			localRepeat: function(options, isExecNext) {
				var result = [], index = 0, execNext, maxLoop = 50;
				var cl = window.chineseLunar;
				//没有加载中国农历的库，返回空。有时候客户端可能没有加载中文库
				if(!cl) return result;
				var interval = options.interval || 1;
				var arEnum = im.e.ActivityRepeat;
				var begin = new Date(options.begin)
					, min = new Date(options.minDate)
					, max = new Date(options.maxDate)

				//根据重复类型执行不同的操作
				switch (options.repeat) {
					case arEnum.Yearly:
						var year = Math.ceil(min.dateDiff("y", begin));
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
								event: curDate.getTime(),
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
										event: curDate.getTime(),
										counter: counter
									});
								};
							};

							//累加计算下一次的日期
							index++;
							curLunar = cl.dateAdd(curLunar, interval + "y");
							//农历超出了范围
							if (!curLunar) break;
							curDate = cl.lunarToSolar(curLunar);
							//是否需要执行一下次
							execNext = isExecNext(index, curDate.getTime(), options.duration,
								options.minDate, options.maxDate, options.maxLoop);
						} while (execNext);
						break;
					case arEnum.Monthly:
						var current = {};
						//计算从最大时间，到活动的第一次，共有多少个农历月
						var sLunar = cl.solarToLunar(begin);
						var eLunar = cl.solarToLunar(min);
						var count = cl.dateDiff(sLunar, eLunar, "m");          //活动开始的第一次，到现在共有多少个月了
						count = Math.max(0, count);
						for(var k in sLunar){
							current[k] = sLunar[k];
						};

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
							var solar = cl.lunarToSolar(current).getTime();
							result.push({ event: solar, counter: repeatCount + index });
							execNext = isExecNext(index, solar,options.duration,
								options.minDate, options.maxDate, options.maxLoop);
						} while (execNext);
						break;
				}
				return result;
			}
		}
	};

	if(typeof exports === 'object'){
		exports.eventGenerator = _gen;
	}else{
		window.eventGenerator = _gen;
	};
})();
//==deploy==