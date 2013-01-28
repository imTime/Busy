/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 9/4/12
 * Time: 6:51 PM
 * To change this template use File | Settings | File Templates.
 */
var im = require("./index").im;

//==deploy==
im.storage.calendar = {
	/*
	 * 对数据的合法性进行处理；对tag处理为[]；检查color，如果不合法处理为null
	 * @param {Object} data 要处理的数据
	 * @return {Object} data 返回处理过后的数据
	 */
	fixCalendar: function(data){
		var fix = im.storage.fix;
		var fieldLength = im.config.fieldLength.calendar;
		data.title = fix.fixString(data.title, true, fieldLength.title);
		data.title = data.title || "Default";
		data.color = fix.fixColor(data.color);
		data.tags = fix.fixTag(data.tags);
		data.timeZone = fix.fixTimeZone(data.timeZone);
		data.summary = fix.fixString(data.summary, true, fieldLength.summary);
		return data;
	},
	/*
	 * 根据日历的id获取整个日历，包括活动，不检查权限
	 */
	getCalendarWithId: function(options, fields, callback){
		var cond = {
			memberId: options.memberId,
			_id: options._id
		};

		//获取日历
		im.storage.findOne(this.store, cond, fields, function(err, calendar){
			if(err) return callback(err);
			if(!calendar) return callback(null, false);

			//console.log(calendar._id.getTimestamp());
			var pag = im.e.Pagination;
			pag.pageIndex = 1;
			pag.pageSize = 9999;

			var cond = {
				memberId: options.memberId,
				calendarId: options._id
			};

			//获取活动列表
			im.storage.activity.searchActivity(pag, cond, fields,
				function(err, pag, activities){
					if(err) return callback(err);
					callback(null, pag, calendar, activities);
				});			//end searchActivity
		});				//end findOne
	},
	/*
	 * 根据日历ID，获取该日历，以及下面的的活动
	 */
	get: function(options, callback){
		//不返回用户的ID
		var fields = {
			memberId: 0
		};

		//只取索引
		if(options.index){
			fields = {
				version: 1,
				_id: 1,
				lastUpdate: 1
			};
		}

		//获取
		var s = im.storage;
		if(options._id){
			return this.getCalendarWithId(options, fields,
				function(err, pag, calendar, activities){
					if(err) return callback(err);
					//没有数据
					if(!pag) return callback(null, s.getResult(false, im.e.NotFound));
					//客户端的没有toObject方法
					if(calendar.toObject){
						calendar = calendar.toObject();
					}
					calendar.activities = activities;
					var data = {
						//pagination: pag,
						calendar: calendar
					};
					var result = s.getResult(true, null, data);
					callback(null, result);
				});
		};

		//获取当前用户所有的日历，但不包括日历下的活动
		this.getCalendarsWithMember(options, fields, function(err, result){
			if(err) return callback(err);
			callback(null, result);
		});
	},
	/*
	 * 获取某个用户的所有日历，可以指定只获取某些字段
	 * @params {ObjectId} memberId 用户的id
	 * @params {Object} field 要返回的字段
	 * @params {Function} callback 回调函数，callback(err, docs);
	 */
	getCalendarsWithMember: function(options, fields, callback){
		var cond = {
			memberId: options.memberId
		};

		im.storage.find(this.store, cond, fields, function(err, docs){
			if(err) return callback(err);
			callback(null, im.storage.getResult(true, null, docs));
		});
	},
	/*
	 * 检测某个成员的日历数量是否超过限制
	 * @params {ObjectId} memberId 成员的id
	 * @params {Function} callback 回调函数
	 * 	示例：callback(err, count{当前用户的日历数}, memberMax{最大允许的日历数量} )
	 */
	checkCalendarLimit: function(memberId, callback){
		im.storage.count(this.store, {memberId: memberId}, function(err, count){
			if(err) return callback(err);
			//用户默认最大数量
			var memberMax = im.config.maxCalendarPerMember;
			//TODO 对服务器端，需要添加针对特定用户群组的日历限制
			callback(null, count, memberMax);
		});
	},
	/*
	 * 根据会员id和日历id删除某个日历，不做权限校验
	 * @params {ObjectId} memberId 可选，如果为null则只根据日历id删除
	 * @params {ObjectId} calendarId 日历id
	 * @callback 回调 callback(err, result{Number});
	 */
	remove: function(memberId, calendarId, callback){
		var cond = {_id: calendarId};
		if(memberId) cond.memberId = memberId;

		//TODO 先删除日历下的活动
		//删除一个日历
		var that = this, s = im.storage;
		s.getDocument(this.store, cond, function(err, doc){
			if(err) return callback(err);
			if(!doc){
				var result = s.getResult(false, im.e.NotFound);
				return callback(null, result);
			};

			//删除文档
			s.remove(doc, function(err){
				if(err) return callback(err);
				var result = s.getResult(true);
				return callback(null, result);
			});		//end remove
		});
	},
	/*
	 * 插入日历
	 */
	insert: function(data, callback){
		var s = im.storage;
		data = this.fixCalendar(data);			//修复数据
		//检测用户的日历数是否超过总数量
		this.checkCalendarLimit(data.memberId,
			function(err, currentCount, maxCount){
				if(err) return callback(err);
				//日历的数量超出允许的范围
				if(currentCount >= maxCount){
					var code = im.e.SaveCalendar.CalendarLimit;
					var result = im.storage.getResult(false, code,{
						maxCalendarPerMember: maxCount,
						currentCalendarCount: currentCount
					});
					return callback(null, result);
				};

				//保存日历
				var doc = new s.calendar.store();
				//doc.lastUpdate = new Date().getUTC();
				doc.version = s.incVersion();
				doc.counter = 0;
				doc = s.merge(doc, data);
				//保存
				s.save(doc, function(err, _id){
					var result = s.getResult(!err, null, {
						_id: _id,
						version: doc.version
					});
					callback(err, result);
				});		//end save
			});
	},
	/*
	 * 更新日历
	 */
	update: function(data, callback){
		data = this.fixCalendar(data);			//修复数据
		//查找并更新，如果没有找到，则插入
		var cond = {
			_id: data._id,
			memberId: data.memberId
		};

		//查找
		var s = im.storage;
		s.getDocument(this.store, cond, function(err, doc){
			if(err) return callback(err);
			//找到这个日历，报错
			if(!doc) return callback(null, s.getResult(false, im.e.NotFound));

			delete data._id;
			delete data.memberId;
			doc = s.merge(doc, data);
			//doc.lastUpdate = new Date().getUTC();
			doc.version = s.incVersion(doc.version);
			//保存
			s.save(doc, function(err){
				if(err) return callback(err);
				var result = s.getResult(!err, null, {
					version: doc.version
				});
				callback(err, result);
			});		//end save
		});				//end findOne
	}
};
//==deploy==

im.storage.calendar.store = require("../schema").calendar;
exports.storage = im.storage.calendar;