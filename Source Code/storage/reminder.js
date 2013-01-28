/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 9/5/12
 * Time: 9:31 PM
 * 对状态进行操作，兼容Sqlite和Mongoose
 */

var _reminder = require("../schema").reminder,
	im = require("../storage").im,
	_hummer = require("../hummer/server");

//==deploy==
im.storage.reminder = {
	fixReminderBy: function(reminderBy){
		var fix = im.storage.fix;
		var rb = im.e.ReminderBy;
		return fix.fixNumber(reminderBy, rb.Popup, true, rb.Popup, rb.Mail);
	},
	/*
	 * 修复提醒的数据
	 */
	fixReminder: function(data){
		var fix = im.storage.fix;
		data.reminderBy = this.fixReminderBy(data.reminderBy);
		data.delay = fix.fixNumber(data.delay, 0, true);
		return data;
	},
	/*
	 * 检查活动下的提醒是否已经超出数量
	 */
	checkReminderLimit: function(memberId, activityId, callback){
		var cond = {
			activityId: activityId,
			memberId: memberId
		};

		im.storage.count(_reminder, cond, function(err, count){
			if(err) return callback(err);
			callback(null, count, im.config.maxReminderPerActivity);
		});
	},
	/*
	 * 保存提醒
	 */
	saveDocument: function(doc, callback){
		var s = im.storage;
		s.activity.getWithId(doc.activityId, doc.memberId, function(err, act){
			if(err || !act) return callback(err, false);
			var offset = doc.delay + "m";
			doc.start = act.begin.dateAdd(offset);
			doc.stop = (act.repeatStop || act.end).dateAdd(offset);
			doc.repeat = act.repeat;
			doc.calendarId = act.calendarId;
			s.save(doc, callback);
		});
	},
	/*
	 * 插入数据
	 */
	insert: function(data, callback){
		var s = im.storage;
		//检查用户是否有权限
		s.activity.checkEditPermission(data.memberId, data.activityId, function(err, allow){
			if(err) return callback(err);
			//没有权限
			if(!allow) return callback(null, s.getResult(false, im.e.Forbidden));

			//检查用户是否超出活动的限制
			s.reminder.checkReminderLimit(data.memberId, data.activityId, function(err, count, maxCount){
				if(err) return callback(err);
				//超出添加活动的限制
				if(count >= maxCount){
					//用户添加的提醒超出限制
					var resData = {
						currentReminderCount: count,
						maxReminderCount: maxCount
					};
					var result = s.getResult(false, im.e.SaveReminder.ReminderLimit, resData);
					return  callback(null, result);
				};

				data = s.reminder.fixReminder(data);
				//插入数据
				var doc = new s.reminder.store();
				doc = s.merge(doc, data);
				doc.version = s.incVersion();

				//保存文档
				s.reminder.saveDocument(doc, function(err, _id){
					if(err) callback(err);
					var result = s.getResult(true, null, {
						_id: _id,
						version: doc.version
					});
					callback(null, result);
				});		//end saveDocument
			});			//end checkReminderLimit
		});		//end checkEditPermission
	},
	//更新数据
	update: function(data, callback){
		var cond = {
			memberId: data.memberId,
			_id: data._id
		};

		//查找文档
		var s = im.storage;
		s.getDocument(s.reminder.store, cond, function(err, doc){
			if(err) return next(err);
			if(!doc) return callback(null, s.getResult(false, im.e.NotFound));

			data = s.reminder.fixReminder(data);
			doc = s.merge(doc, data);
			doc.version = s.incVersion(doc.version);
			doc.lastUpdate = new Date().getTime();

			//保存文档
			s.reminder.saveDocument(doc, function(err){
				if(err) callback(err);
				var result = s.getResult(true, null, {
					version: doc.version
				});
				callback(null, result);
			});		//end saveDocument
		});			//end findOne
	},
	/*
	 * 根据提醒id删除用户的提醒
	 */
	remove: function(memberId, reminderId, callback){
		var cond = {
			_id: reminderId,
			memberId: memberId
		};

		//查找这条记录
		var s = im.storage;
		s.getDocument(s.reminder.store, cond, function(err, doc){
			if(err) return callback(err);
			//没有这条记录，返回找不到资源
			if(!doc) return callback(null, s.getResult(false, im.e.NotFound));

			s.remove(doc, function(err){
				if(err) return callback(err);
				callback(null, s.getResult(true));
			});		//end remove;
		});			//end findOne;
	},
	/*
	 * 根据某个活动下的更新所有提醒的stop和start
	 * @params {Number} begin 活动的开始时间
	 * @params {Number} stop 活动的停止时间（重复活动的停止时间不等于结束时间）
	 * @params {ObjectId} activityId 活动的ID
	 * @params {ObjectId} memberId 会员的ID
	 */
	updateWithActivityId: function(activityId, begin, stop, memberId, callback){
		var cond = {
			memberId: memberId,
			activityId: activityId
		};

		var s = im.storage;
		var $update = function(doc, callback){
			//delay存的是分钟，要转换为毫秒
			var offset = doc.delay + "m";
			doc.start = begin.dateAdd(offset);
			doc.stop = stop.dateAdd(offset);
			//TODO 要不要更新版本？可能会造成死循环？
			//doc.version = s.incVersion(doc.version);

			//保存
			s.save(doc, callback);
		};

		//查找所有符合条件的
		s.reminder.find(cond, function(err, docs){
			if(err) return callback(err, false);
			if(docs.length == 0) return callback(null, true);
			var index = 0;
			//依次更新每一条数据
			$update(docs[index], function(err){
				index ++;
				if(err || index >= docs.length) return callback(err, Boolean(err));
				$update(docs[index], arguments.callee);
			});
		});
	},
	/*
	 * 根据活动的ID删除所有提醒
	 */
	removeWithActivityId: function(activityId, memberId, callback){
		var cond = {
			memberId: memberId,
			activityId: activityId
		};

		var s = im.storage;
		s.removeWithCondition(s.reminder.store, cond, callback);
	},
	/*
	 * 根据条件获取提醒列表
	 */
	get: function(options, callback){
		var fix = im.storage.fix;
		var cond = {
			memberId: options.memberId
		};

		//指定活动
		if(options.activityId) cond.activityId = options.activityId;
		//指定提醒方式
		if(options.reminderBy){
			cond.reminderBy = this.fixReminderBy(options.reminderBy);
		}

		//指定开始时间
		if(options.start){
			options.start = fix.fixDate(options.start);
			if(options.start) cond.start = {$gte: options.start};
		}

		//指定结束时间
		if(options.stop){
			options.stop = fix.fixDate(options.stop);
			if(options.stop) cond.stop = {$lte: options.stop};
		}

		var fields = {
			memberId: 0
		};

		//只取索引
		if(fix.fixBoolean(options.index)){
			fields = {
				version: 1,
				lastUpdate: 1,
				_id: 1
			};
		};

		//获取
		var s = im.storage;
		s.find(s.reminder.store, cond, fields, function(err, docs){
			if(err) return callback(err);
			callback(null, s.getResult(true, null, docs));
		});
	}
};
//==deploy==

im.storage.reminder.store = require("../schema").reminder;
exports.storage = im.storage.reminder;