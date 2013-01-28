/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/11/12
 * Time: 9:22 下午
 * To change this template use File | Settings | File Templates.
 */
(function(){
	im.ajax = {
		init: function(callback){
			$.callEvent(callback);
		},
		/*
		 * 向服务器提交数据
		 * @params {String} module 模块名称
		 * @params {String} method 方法
		 * @params {Object} options 更多请求ajax的选项，通常要包括onSuccess的处理和data
		 * @params {String}{Optional} id method为Put或者Delete时必选，需要与id组合成url
		 */
		request: function(module, method, options, id){
			var url = $.env.apiServer + module;
			if(id) url += '/' + id;
			//重新处理onSuccess
			var callback = options.onSuccess;
			options.onSuccess = function(data){
				if(data && data.code < 0){
					$.callEvent(options.onError, [data.code]);
					im.log(data);
					return;
				};
				$.callEvent(callback, [data]);
			};

			$.doAction(url, method, options);
		}
	};
})();


(function(){
	//s = storage;
	var _cp, _s;
	/*
	 * 数据通过接口获取提交或者获取，展示不用考虑数据源是服务器还是本地Sqlite或者其它方式
	 * 1.提交/获取数据 2.计算并处理数据
	 */
	im.interface = {
		activitiesLoaded: false,
		/*
		 * 初始化，根据是否启用Sqlite初始化本地存储或ajax
		 */
		init: function(options, callback){
			var that = this;
			this.options = options || {};
			$.env.apiVersion = 2.0;

			//加载完毕后，计算三个月内的活动缓存
			var now = new Date();
			var min = now.dateAdd("-1M").start("M").getTime();
			var max = now.dateAdd("10M").end("M").getTime();
			_cp = new compute(min, max);
			_cp.onReminder = function(activity, event, counter){
				$.callEvent(that.options.onReminder, [activity, event, counter]);
			};

			//选择存储方式，本地存储还是直接存储到服务器
			if($.env.useSqlite){
				_s = im.storage;
			}else{
				_s = im.ajax;
			};

			_s.init(callback);
		},
		//中转数据
		passed: function(module, method, options, id){
			_s.request(module, method, options, id);
		},
		/*
		 * 智能识别
		 */
		ir: function(type, text, callback){
			var isChrome = $.env.client == im.e.Client.Chrome;
			//提交到服务器识别
			var options = {
				data: {
					lang:$.env.language,
					content: text,
					type: type,
					tz:$.env.timeZone
				},
				//chrome不能使用JSONP，JSON需要https
				dataType: isChrome ? "JSON" : "JSONP",
				onSuccess: function(res){
					var act = res.content;
					act.type = act.type || im.e.ActivityType.Normal;
					act.repeat = act.repeat || im.e.ActivityRepeat.NoRepeat;
					$.callEvent(callback, [act]);
				}
			};

			//提交到ajax处理
			var method = im.e.method[isChrome ? "POST" : "GET"];
			$.doAction($.env.irServer, method, options);
		},
		/*
		 * 加载用户的所有状态
		 */
		loadStatus: function(callback){
			//回调
			var options = {
				onSuccess: function(response){
					//console.log("read");
					var data = response.content;
					_cp.addStatuses(data);
					$.callEvent(callback, [data]);
				}
			};

			//请求数据
			im.interface.passed(im.e.module.status, im.e.method.GET, options);
		},
		/*
		 * 串行加载会员的数据
		 */
		loadMemberData: function(callback){
			//im.log(new Date());
			//重置Compute的数据
			var cp = im.interface.getCompute();
			cp.reset();

			var that = this;
			this.loadStatus(function(data){
				//加载日历
				that.loadCalendars(callback);
			});

			//加载桌面提醒
			this.loadPopupReminder();
		},
		/*
		 * 加载popup方式的提醒，提醒时间为24小时内，以当前时间，向前推一个小时，向后推24小时
		 */
		loadPopupReminder: function(){
			var now = new Date().getUTC();
			var data = {
				start: now.dateAdd("-1d"),
				stop: now.dateAdd("1d"),
				reminderBy: im.e.ReminderBy.Popup
			};

			var options = {
				data: data,
				onSuccess: function(res){
					if(res.command.result){
						var cp = im.interface.getCompute();
						cp.addReminders(res.content, true, true);
					};
				}
			};

			im.interface.passed(im.e.module.reminder, im.e.method.GET, options);
		},
		/*
		 * 加载用户的所有日历
		 * @params {Function} callback 回调
		 */
		loadCalendars: function(callback){
			var index = 0, calendars = [];
			//串行加载活动
			var $loadActivities = function(){
				//加载完成
				if(index >= calendars.length){
					im.interface.activitiesLoaded = true;
					_cp.computing();
					_cp.makeReminder();
					_cp.startReminderTimer();
					//回调
					$.callEvent(callback);
					return;
				};

				var calendarId = calendars[index]._id;
				index ++;
				im.interface.loadActivities(calendarId, $loadActivities);
			};

			var options = {
				onSuccess: function(response){
					calendars = response.content;
					$loadActivities();
				}					//end onSuccess
			};

			im.interface.passed(im.e.module.calendar, im.e.method.GET, options);
		},
		/*
		 * 加载指定日历下的所有活动
		 * @params {String} calendarId 日历的id
		 * @params {Function} callback() 加载成功后的调函数
		 */
		loadActivities: function(calendarId, callback){
			var options = {
				onSuccess: function(response){
					var data = response.content;
					//alert(data.calendar.activities.length);
					//将活动加入到compute实例中
					_cp.addCalendar(data.calendar);
					callback();
				}
			};

			//读取某个日历下的所有活动
			im.interface.passed(im.e.module.calendar, im.e.method.GET, options, calendarId);
		},
		/*
		 * 搜索本地活动
		 * @params {String} keyword 搜索的关键字
		 */
		searchActivity: function(keyword){
			return _cp.search(keyword);
		},
		//获取compute的实例
		getCompute: function(){
			return _cp;
		}
	};
})();