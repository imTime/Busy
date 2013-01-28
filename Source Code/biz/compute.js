/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/6/12
 * Time: 9:10 下午
 * To change this template use File | Settings | File Templates.
 */

/*
 * 日历算法的核心内容
 * 1.计算指定时间内的每一天有多少活动，仅需要数量，用于日历上的显示
 * 2.按时间段返回活动列表
 * 3.添加/删除某个日历
 * 4.添加/删除/修改某个活动
 * 流程：
 * 1.请求用户的日历列表，将日历批量保存
 * 2.串行（或者并行？）请求每个日历下的活动，将活动保存
 * 3.所有日历全部请求完毕，计算上一个月，当月，下一个月每一天有多少活动
 * 	并将活动索引(日期/日历id/活动id)存入数据对象
 * 4.请求某个时间段的数据，先看已经计算的是否存在，没有再计算。
 * 5.已计算的暂时不要删除，先查询缓存中有多少记录，多的话才删除
 * 6.删除活动不用重新计算，只需要删除就可以了。如果是删除重复的活动
 * 	要考虑已经计算的是否要重清调整，但不用重新计算
 * 7.编辑活动的时候，如果没有对日期及重复进行改变，不用处理。
 * 8.新建活动，如果不在计算日期范围内，不用处理
 *
 * 如何计算哪些活动发生在哪一天
 * 1.根据日历的最小时间和最大时间来判断是否需要循环
 * 2.循环日历下的所有活动，循环时间在from-stop时间内的，否则放弃
 * 3.时间内的活动，非重复的直接处理。
 * 4.非阳历的活动，回调处理
*/

/*
	注意：
		日期都保存为int型，即new Date().getTime()，便于日期大小的计算
 */
(function(){
	var _checkerRunning = false;
	var _data = {
		//弹出提醒列表，不包括Mail或者其它方式的提醒，只包含指定范围的提醒（一般是24小时）
		popupReminders: []
	};
	//用户的状态数据，转换为key-value，以_id为key，方便查找，不用每次都foreach
	var _statuses = {};
	/*
	 计算当天要提醒用户的活动列表
	 {
	 	 start: null,				//活动的开始时间
		 reminderTime: null,			//提醒的时间
		 calendar: 1,						//日历的索引
		 activity: 2						//活动的索引
	 }
	*/
	var _reminders = [
	];
	/*
		所有日历的数据
		示例：
		var calendars = [
			{
				title: "",
				color: "",
				_id: "",
				//活动列表
				activities: [
					{
						title: "",
						status: ""
						....
					}
				]
			}...
		]
	*/
	var _calendars = [];
	/*
		缓存索引
		var caches = {
			"2012-10-11": [
				{
					calendar: 1,				//日历的索引
					activity: 1,				//活动的索引
					counter: 0,					//如果是重复活动，重复的总次数，非重复活动无此参数
					start: null,				//活动的开始时间，非重复日历不用记录，直接去calendars中找就是了
					end: null						//活动的结束时间，同开始时间
				},{}
			],
		}
	 */
	var _caches = {};

	/*
		用户的状态列表，直接从数据库中读取
	 var _status = [
	 {
	 name: "",			//状态的名称
	 color: "",			//状态颜色
	 _id: ""					//状态的ID
	 }
	 ];
	 */
	var _status = [];

	/*
		用户的标签列表
	 var _tags = [
	 name: "",
	 count: 10
	 _id: ""
	 ];
	*/
	var _tags = [];

	var compute = function(min, max){
		var now = new Date().getTime();
		this.startTime = min || now.dateAdd("-1M");			//开始时间
		this.endTime = max || now.dateAdd("3M");				//结束时间
		/*
			提醒的事件 this.onReminder = function(activity, event_time)
		 activity: 活动的数据，event_time：本次活动的发生时间
		 */
		this.onReminder = null;
		//配置文件
		this.config = {
			reminderInterval: 1000 * 3,
			//缓存中每天的日期格式化表达式
			formatKey: "yyyyMMdd",
			//最大计算重复
			maxComputeRepeat: 100
		};
	};

	compute.prototype = {
		/*
		 * 1.获取每天活动的状态情况，在指定时期内，对状态进行分组。
		 * 2.在获取之前，该日期的缓存必需被计算出来
		 * 3.取出来的数据用于每天状态的饼图分析
		 * @params {Date} date 要获取的日期
		 * @return {Object}
		 * [
		 * 	{
		 * 		color: "",	//状态的颜色
		 * 		value: "",	//此状态下共战胙有多少分钟
		 * ]
		 */
		analyseStatusWithDate: function(date){
			var result = {};
			var key = date.format(this.config.formatKey);
			var cache = _caches[key];
			if(!cache) return [];			//没有找到数据，返回

			var statuses = {};
			//循环该日期下的所有活动索引
			cache.forEach(function(item){
				//找到活动
				var activity = this.activityWithIndex(item.calendar, item.activity);
				//开始时间与结束时间一样的活动
				if(activity.begin == activity.end) return;
				//重新计算开始时间与结束，有时候活动可能是跨天的
				var start = new Date(activity.begin);
				var end = new Date(activity.end);
				//开始时间比要获取的时间少，表示这个活动是在这个时间以前发生的，过去的不计入
				if(start.dateDiff("d", date) < 0) start = date.start("d");
				//该日期最后的时间，如果这个时间超出当天最后时间，则取最后时间
				var dateOfEnd = date.end("d");
				if(dateOfEnd < end) end = dateOfEnd;

				//根据状态的的id找到对应的状态
				var status = _statuses[activity.statusId];
				//未知状态用__作为key，否用则状态的id作为key；未知状态用灰色表示
				var statusKey = "__", color = "#CCC";
				if(status) {
					statusKey = activity.statusId;
					color = status.color;
				}

				//计算状态的时长，以分钟计算
				var duration = end.dateDiff("m", start);

				//将计算出来的时间添加到结果集中
				var data = result[statusKey];
				if(!data) data = {color: color, value: 0};
				data.value += duration;
				result[statusKey] = data;
			}, this);

			//将数据压入数组
			var arr = [];
			for(var item in result){
				arr.push(result[item]);
			};
			return arr;
		},
		//清除缓存
		clearCache: function(clearAll){
			if(clearAll) _caches = [];
			if(_caches.length == 0) return;
			//清除范围内的cache
		},
		/*
		 * 计算某个日历下的活动是否在区间内
		 * @params {Date} max 日期区间的最小时间
		 * @params {Date} min 日期区间的最大时间
		 * @params {String} calendarId 日历的id，如果不指定，则计算所有日历
		 */
		computing: function(min, max, calendarId){
			this.startTime = min = min || this.startTime;
			this.endTime = max || this.endTime;

			if(calendarId){
				var index = this.getCalendarIndex(calendarId);
				if(index == -1) return;
				this.pushActivitesToCache(index, min, max);
			}else{
				_calendars.forEach(function(calendar, index){
					this.pushActivitesToCache(index, min, max);
				}, this);
			};			// end if
			//console.log(_caches);
		},
		reset: function(){
			_calendars = [];
			_reminders = [];
			_statuses = {};
			_caches = [];
			_data.popupReminders = [];
		},
		//添加多个日历
		addCalendars: function(calendars, clear){
			if(clear) _calendars = [];
			var that = this;
			calendars.forEach(function(calendar){
				that.addCalendar(calendar);
			}, this);
		},
		//添加日历
		addCalendar: function(calendar){
			_calendars = _calendars || [];
			//检查日历是否存在
			var index = this.getCalendarIndex(calendar._id);
			if(index != -1) return;
			_calendars.push(calendar);
		},
		//根据日历ID获取日历在_calendars中的索引
		getCalendarIndex: function(calendarId){
			for(var i = 0; i < _calendars.length; i ++){
				var calendar = _calendars[i];
				if(calendarId == calendar._id) return i;
			};
			return -1;			//没有找到
		},
		//根据日历获取日历的ID
		getCalendarWithId: function(calendarId){
			var index = this.getCalendarIndex(calendarId);
			if(index !== false) return  _calendars[index];
			return false;
		},
		//根据活动的ID以及日历的索引，找到活动的索引
		getActivityIndex: function(calendarIndex, activityId){
			var activities = _calendars[calendarIndex].activities;
			for(var i = 0; i < activities.length; i ++){
				var activity = activities[i];
				if(activity._id == activityId) return i;
			};
			return -1;
		},
		/*
		//添加批量的活动到某个日历下
		addActivities: function(calendarId, activities){
			//找到日历的索引
			var index = this.getCalendarIndex(calendarId);
			if(index === false) return false;
			_calendars[index].activities = activities;
			return true;
		},
		*/
		//添加单个活动
		addActivity: function(activity, calendarIndex){
			/*
			var calendarIndex = this.getCalendarIndex(activity.calendar_id);
			if(!calendarIndex) return false;
			*/

			//添加活动到日历中，要考虑activities可能未赋值
			var calendar = _calendars[calendarIndex];
			calendar.activities = calendar.activities || [];
			calendar.activities.push(activity);
		},
		/*
		 * 更新活动
		 */
		updateActivity: function(activity){
			var calendarIndex = this.getCalendarIndex(activity.calendarId);
			if(calendarIndex == -1) return false;

			var calendar = _calendars[calendarIndex];
			//查找活动的index
			var activityIndex = this.getActivityIndex(calendarIndex, activity._id);
			//没有找到活动，push新的
			if(activityIndex == -1){
				calendar.activities = calendar.activities || [];
				calendar.activities.push(activity);
			}else{
				$.extend(calendar.activities[activityIndex], activity);
			};
		},
		/*
		 * 删除某个活动
		 */
		removeActivity: function(calendarId, activityId){
			var index = this.findActivityIndex(calendarId, activityId);
			if(!index) return false;

			var calendar = _calendars[index.calendarIndex];
			calendar.activities.removeAt(index.activityIndex);
			return true;
		},
		findActivity: function(calendarId, activityId){
			var index = this.findActivityIndex(calendarId, activityId);
			if(!index) return false;
			return this.activityWithIndex(index.calendarIndex, index.activityIndex);
		},
		/*
		 * 通过日历的ID和活动的ID，找到对应的索引
		 */
		findActivityIndex: function(calendarId, activityId){
			var calendarIndex = this.getCalendarIndex(calendarId);
			if(calendarIndex == -1) return false;

			//找到活动的id
			var activityIndex = this.getActivityIndex(calendarIndex, activityId);
			if(activityIndex == -1) return false;

			return {
				calendarIndex: calendarIndex,
				activityIndex: activityIndex
			};
		},
		//findActivityWithId:
		//编辑某个活动d
		editActivity: function(calendarId, activityId){

		},
		/*
		 * 根据时间获取缓存对应的key
		 * @params {Date} date 日期
		 * @return ｛String｝返回格式化的key
		 */
		getActivityCacheKey: function(date){
			//获取当天对应的key
			var key = date;
			var type = typeof(date);
			if(type != "string"){
				key = date.format(this.config.formatKey);
			};
			return key;
		},
		getSetCache: function(date, cache){
			var monthKey = date.format("_yyyyMM");
			var dateKey = date.format("_dd");
			var monthCache = _caches[monthKey];

			//获取Cache
			if(!cache){
				//没有找到月份的cache，返回空
				return monthCache ? monthCache[dateKey] || [] : [];
			};

			//设置Cache
			if(!monthCache){
				monthCache = _caches[monthKey] = {};
			};

			var dateCache = monthCache[dateKey];
			if(!dateCache){
				dateCache = monthCache[dateKey] = [];
			};

			dateCache.push(cache);
		},
		//获取某一天的活动列表
		activitiesWithDate: function(date){
			var key = this.getActivityCacheKey(date);
			var cache = _caches[key];
			//console.log(_caches, key);
			if(!cache) return [];
			return cache;
		},
		//获取某天的活动总数量
		activityCountWithDate: function(date){
			return this.activitiesWithDate(date).length;
		},
		//根据日历和活动的索引获取某个活动
		activityWithIndex: function(calendarIndex, activityIndex){
			var calendar = _calendars[calendarIndex];
			if(!calendar) return false;
			return calendar.activities[activityIndex];
		},
		//获取活动的时间是否在区间内
		activityInRange: function(from, to, min, max){
			var result = from.inRange(min, max);
			if (!result) {
				result = to.inRange(min, max);
			}
			return result;
		},
		/*
		 * 计算某个日历下面的所有活动是否在某个范围内，如果在范围内则压入缓存
		*/
		pushActivitesToCache: function(calendarIndex){
			var activities = _calendars[calendarIndex].activities;
			if(!activities) return;
			var that = this;
			var gen = new eventGenerator(this.startTime, this.endTime);

			activities.forEach(function(activity, index){
				var duration = activity.end - activity.begin;
				//获取区间内有多少次重复
				var events = gen.run(activity.begin, duration, activity.repeat,
					activity.repeatStop, activity.local);

				//将结果压入缓存
				events.forEach(function(item){
					that.pushCacheWithDate(calendarIndex, index, item.event, item.counter);
				});
			}, this);
		},
		/*
			计算某个活动是否在某天内，如果在区间以内，则压入缓存，否则退出
			不重复的活动，只需要计算开始及结束时间在某天就可以，重复交由其它函数计算
			@params {Object} activity 要计算的活动对象
			@params {Date,Number} someDay 要计算的某一天
			@params {Number}
		*/
		pushActivityToCache: function(activity, min, max, calendarIndex, activityIndex){
			/*
			var repeat = activity.repeat;
			var _bizEnum = im.e.ActivityRepeat;
			var start = new Date(activity.begin);
			var stop = new Date(activity.repeatStop || activity.end);
			//开始时间大于区间最大时间（未发生），停止时间小于区间最大时间（无需响应）
			if(stop < min || start > max) return;
			if(repeat && repeat != _bizEnum.NoRepeat){
				return this.pushRepeatActivityToCache(calendarIndex, activityIndex, activity, min, max);
			}

			//非重复活动，判断起止时间在区间内即可
			var inRange = this.activityInRange(start, stop, min, max);
			if(inRange){
				this.pushCacheWithDate(calendarIndex, activityIndex, start);
			};				//end if
			*/
		},
		//将活动压入缓存
		pushCacheWithDate: function(calendarIndex, activityIndex, start, counter){
			var cache = {
				calendar: calendarIndex,
				activity: activityIndex,
				counter: counter,
				start: start
			};			//end cache

			var key = new Date(start).format(this.config.formatKey);
			var dayCache = _caches[key];
			if(!dayCache) dayCache = [];
			dayCache.push(cache);
			_caches[key] = dayCache;
		},
		/*
		 * 将在某个范围的重复的活动压入缓存
		 * @params {Number} calendarIndex 日历索引
		 * @params {Number} activityIndex 活动索引
		 * @params {Date} activity 活动的对像
		 * @params {Date} min 区间的最小时间
		 * @params {Date} max 区间的最大时间
		 */
		pushRepeatActivityToCache: function(calendarIndex, activityIndex, activity, min, max){
			/*
			var from = new Date(activity.begin),
				until = new Date(activity.end);

			var duration = until.dateDiff("ms", from);
			//默认开始时间就是本次重复的时间
			var start = from.clone();
			var _bizEnum = im.e.ActivityRepeat;
			var expr = {
				"_2": "y",
				//"3": "q",
				"_4": "M",
				"_5": "w",
				"_6": "d"
			}["_" + activity.repeat];
			if(!expr) return;			//重复的方式不在允许的方式以内

			//计算最小时间到活动开始时间的间隔单位(根据重复类型)时间
			var span = min.dateDiff(expr, start);
			span = Math.max(0, span);
			//计算最后一次重复时间
			if(span > 0){
				start = start.dateAdd(span + expr);
			};

			//已经重复了多少次
			var counter = 0, index = 0, execNext = false;
			//开始计算重复
			do {
				//计算第n次重复
				counter = start.dateDiff(expr, from);
				counter ++;
				this.pushCacheWithDate(calendarIndex, activityIndex, start, counter);

				//继续下一轮
				start = start.dateAdd("1" + expr);
				index++;

				//是否继续循环
				execNext = this.isContinueRepeat(index, start, duration, min, max);
			} while (execNext)
			*/
		},
		/*
		 * 判断是否还需要继续计算循环
		 *
		 */
		isContinueRepeat: function(index, start, duration, min, max) {
			/*
			if(index > this.config.maxComputeRepeat) return false;
			var result = start.inRange(min, max);
			//如果持续时间大于0秒，并且execNext    判断为False，则再判断结束时间是否在许可时间内
			if (!result) {
				result = start.dateAdd(duration + "ms").inRange(min, max);
			};
			return result;
			*/
		},
		/*
		 * 获取所有的日历
		 */
		getCalendars: function(){
			return _calendars;
		},
		/*
		 * 获取所有状态的数组
		 */
		getStatuses: function(){
			var result = [];
			for(var k in _statuses){
				result.push({
					_id: k,
					status: _statuses[k].status,
					color: _statuses[k].color
				});
			};
			return result;
		},
		/*
		 * 更新状态
		 */
		updateStatus: function(statusId, color, status){
			var find = _statuses[statusId];
			find = find || {};
			find.color = color;
			find.status = status;
			_statuses[statusId] = find;
		},
		//添加用户的状态
		addStatuses: function(statuses){
			statuses.forEach(function(item){
				_statuses[item._id] = {
					color: item.color,
					status: item.status
				};
			});			//end forEach
		},
		//根据状态的id获取状态
		getStatusWithId: function(statusId){
			if(!statusId) return false;
			return _statuses[statusId] || false;
		},
		getFreeTimeSlice: function(free, start, end){
			//从空闲时间中减去时间
			var index = 0, stop = false, loop = 0;
			do{
				loop ++;
				var slice = free[index];
				//取出空闲时间的开始与结束时间
				var freeStart = slice[0], freeEnd = slice[1];

				//如果活动开始时间大于时间片的结束时间，表示这个时间片没有关系
				if(start > freeEnd){
					index ++;
					continue;
				}
				//用-表示空闲，用+表示忙
				//第一种情况，活动的时间在空闲时间片以外，即+++----+++
				//删除数组这个元素
				if(start <= freeStart && end >= freeEnd){
					//console.log("1");
					//删除数组
					free.remove(index);
					continue;
				};

				//第二种情况，活动时间全部在空闲时间片以内，即---+++---
				//将数组分隔为两个数组，修改当前的数据元素值，再插入新的值
				if(start > freeStart && end < freeEnd){
					//console.log("2");
					var value1 = [slice[0], start];
					var value2 = [end + 1, slice[1]];
					free[index] = value1;
					free.splice(index + 1, 0, value2);
					index ++;
					break;
				};


				//第三种情况，活动开始时间在空闲时间片以外，但结束时间没有，即+++-----
				//切掉活动与空闲时间片之间的差值
				if(start <= freeStart && end <= freeEnd && end >= freeStart){
					//console.log("3", start, end);
					free[index] = [end + 1, slice[1]];
					break;
				};

				//第四种情况，活动开始时间在空间时间片内，但结束时间在空间以外
				//分隔空闲时间，然后将活动开始时间向后移，继续循环
				if(start >= freeStart && end > freeEnd){
					//console.log("4");
					free[index] = [freeStart, start];
					start = slice[1];
					index ++;
					continue;
				}

				//以上情况都不是，不循环了
				break;
			}while(loop < 1440 || free.length > index);
			im.log(loop, start, end);
			//循环次数大于1440表示限入了死循环，因为每天只有1440分钟，不可能分隔比这个更细
			return free;
		},
		/*
		 * 计算某一天的空闲时间，这一天的活动必需是经过计算圧入缓存的
		 * 算法
		 * 循环活动，将活动的开始与结束时间换算为每天的第N分钟-第N分钟
		 * 假定每天的1440分钟为一唯数组，如果活动的时间在片段中就抛除这个数组，否则重新计算数据的开始与结束时间
		 * 可以这么理解，每天的时间为一个连续的物体，被占用之后就剪掉这个时间片
		 * 忽略全天事件?
		 * 时间数组全部被剪完即退出，表示没有任何空闲
		 * @params {Date} date 查计算的时间
		 * @params {Function} callback(activity, cache) 如果返回为true，则不计算这个活动
		 */
		getFreeTimeWithDate: function(date, callback){
			var minuteCountOfDate = 1440;
			var free = [[0, minuteCountOfDate]];			//这里是有空时间的二维数组
			//获取这一天已经计算好的缓存
			var caches = this.activitiesWithDate(date);

			//将要查询的时间置为当天的开始时间
			date = date.start("d").getTime();
			caches.forEach(function(item){
				//已经没有空余时间了，不再计算
				if(free.length == 0) return false;
				var activity = this.activityWithIndex(item.calendar, item.activity);
				//开始时间也结束时间一样，不用计算，没有意义
				if(activity.begin == activity.end) return;
				im.log(activity);
				//计算全天事件没有意义
				if(activity.allDay) return;
				//回调函数要求不计算这个活动
				if(callback && callback(activity, cache)) return;

				var start = item.start;
				var duration = activity.end - activity.begin;
				var end = start.dateAdd(duration + "ms");
				//如果结束时间与开始时间不是同一天，则结束时间为当天最后的时间
				if(end.dateDiff("d", start)){
					end = end.end("d");
				};

				//开始与结束时间之差超过一天的时间，全天事件不计入空闲时间
				if(end.dateDiff("m", start) >= minuteCountOfDate) return;
				//将开始时间换算为分钟
				var startM = start.minuteOfDate();
				var endM = end.minuteOfDate();

				free = this.getFreeTimeSlice(free, startM, endM);
			}, this);

			im.log(free);
			return free;
		},
		//在本地搜索个人活动，目前只搜索标题，以后要支持搜索标签，支持限定日期搜索
		search: function(keyword, max){
			var result = [];
			if(!keyword) return result;
			_calendars.forEach(function(calendar, calendarIndex){
				if(result.length >= max) return true;
				calendar.activities.forEach(function(activity, activityIndex){
					if(activity.title.indexOf(keyword) >= 0){
						result.push({
							calendar: calendarIndex,
							activity: activityIndex
						});			//end push
					};		//end if

					//超过数量，退出
					if(result.length >= max) return true;
				});			//end activities forEach
			});				//end _calendars forEach
			return result;
		},
		//===============================提醒相关===================
		/*
		 * 这里只添加24小时内要提醒用户的数据
		 * @params {Array|Object} reminders 要添加的提醒
		 * @params {Boolean} clear 是否清除旧的
		 * @params {Boolean} run 是否即时启动提醒轮询
		 */
		//添加提醒
		addReminders: function(reminders, clear){
			if(clear) _data.popupReminders = [];
			_data.popupReminders = _data.popupReminders.concat(reminders);
		},
		/*
		 * 计算时间范围内的提醒
		 */
		makeReminder: function(min, max){
			var that = this;
			//默认计算10分钟前和24小时内的提醒保存到缓存
			min = min || new Date().dateAdd("-10m").getTime();
			max = max || new Date().dateAdd("24h").getTime();

			var gen = new eventGenerator(min, max);
			var reminders = _data.popupReminders;
			_reminders = [];
			//循环每一个提醒，检查提醒是否在范围内
			reminders.forEach(function(reminder){
				//只提醒popup方式的
				if(reminder.reminderBy !== im.e.ReminderBy.Popup) return;
				var index = that.findActivityIndex(reminder.calendarId, reminder.activityId);
				//没有找到活动的索引
				if(!index) return;
				var activity = that.activityWithIndex(index.calendarIndex, index.activityIndex);

				//检测提醒的时间
				var begin = activity.begin.dateAdd(reminder.delay + "s");
				var events = gen.run(begin, 0, activity.repeat, activity.repeatStop, activity.local);
				events.forEach(function(item){
					_reminders.push({
						event: item.event,
						counter: item.counter,
						calendarIndex: index.calendarIndex,
						activityIndex: index.activityIndex
					});			//end push
				});				//end foreach
			});
		},
		/*
		 * 启动提醒检测器
		 */
		startReminderTimer: function(){
			if(_checkerRunning) return;
			_checkerRunning = true;
			var that = this;
			//定时检查
			this.reminderChecker();
			//每隔10秒检查一次
			window.setInterval(function(){
				that.reminderChecker();
			}, 10 * 1000);
		},
		/*
		 * 循环当前要提醒的事件，提醒时间在指定时间以内的则调用提醒
		*/
		reminderChecker: function(){
			//循环所有的提醒，如果有提醒则调用提醒事件

			//提醒区间的开始时间，前三秒和后三秒
			var inteval = this.config.reminderInterval;
			var start = new Date().getTime() - inteval;
			var end = start + inteval * 2;

			var that = this
				, loop = _reminders.length
				, index = 0;

			while(loop > 0){
				loop --;
				var reminder = _reminders[index];
				//发生时间已经过去，删除
				if(reminder.event < start){
					_reminders.removeAt(index);
					continue;
				};

				//提醒的时间在区间内则提醒用户
				if(reminder.event.inRange(start, end)){
					//延时毫秒级执行
					window.setTimeout(function(){
						$.callEvent(this.onReminder,
							[reminder.calendarIndex, reminder.activityIndex, reminder.event, reminder.counter]);
					}, 0);

					//删除这个提醒
					_reminders.removeAt(index);
				}else{
					index ++;
				}			//end if;
			};			//end looop

			//TODO 结束循环后检查reminderStart是否需要重新设置
			//this.setReminderTime();
		}
	};

	window.compute = compute;
})();
