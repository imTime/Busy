/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 9/4/12
 * Time: 8:02 PM
 * To change this template use File | Settings | File Templates.
 */

var im = require("./index").im;
im.schema.activity = require("../schema/activity").tableInfo.schema;
//==deploy==
im.storage.activity = {
	/*
	 * 修复活动的数据
	 */
	fixActivity: function(data, isUpdate){
		var fix = im.storage.fix;
		var fieldLen = im.config.fieldLength.activity;
		var solar = im.e.ActivityLocal.Solar;
		var repeat = im.e.ActivityRepeat;
		var type = im.e.ActivityType;
		var now = new Date().getUTC();

		var rules = {
			type: [type.Normal, true, type.Normal, type.Todo],
			title: [true, fieldLen.title],
			repeat: [repeat.NoRepeat, true, repeat.Yearly, repeat.Daily],
			summary: [true, fieldLen.summary],
			local: [solar, true],
			finishedRate: [0, false, 0, 1],
			finishedDate: {type: Date},
			begin: {type: Date},
			end: {type: Date},
			repeatStop: {type: Date},
			tags: {type: "tag"},
			color: {type: "color"},
			priority: [0, true, 0, 10],
			calendarId: {skip: true},
			statusId: {skip: true}
		};

		data = fix.fix(data, rules, im.schema.activity, isUpdate);
		if(!isUpdate){
			data.begin = data.begin || now;
			data.end = data.end || data.begin;
			//结束时间不能小时于开始时间
			if(data.end < data.begin) data.end = data.begin;

			//重复活动，重复结束不能小于结束时间
			if(data.repeat != repeat.NoRepeat){
				data.repeatStop = data.repeatStop || data.end;
				if(data.repeatStop < data.end) data.repeatStop = data.end;
			}else{
				data.repeatStop = null;
			};
		};

		//如果包括完成度，则完成时间不能为空
		if(data.finishedRate == 1){
			data.finishedDate = data.finishedDate || now;
		}

		return data;
		/*
		//非更新
		if(!isUpdate){
			data.type = fix.fixNumber(data.type, type.Normal, true, type.Normal, type.Todo);
		};

		data.title = fix.fixString(data.title, true, fieldLen.title);
		if(data.tags == undefined){
			delete data.tags;
		}else{
			data.tags = fix.fixTag(data.tags);
		};

		data.begin = fix.fixDate(data.begin);
		data.end = fix.fixDate(data.end);

		if(!isUpdate || data.allDay) data.allDay = fix.fixBoolean(data.allDay);
		if(!isUpdate || data.repeat){
			data.repeat = fix.fixNumber(data.repeat, repeat.NoRepeat,
				true, repeat.Yearly, repeat.Daily);
		};

		data.repeatStop = fix.fixDate(data.repeatStop);
		data.summary = fix.fixString(data.summary, true, fieldLen.summary);

		//新建活动，开始与结束时间必需不为空
		if(!isUpdate){
			data.begin = data.begin || now;
			data.end = data.end || data.begin;
			//结束时间不能小时于开始时间
			if(data.end < data.begin) data.end = data.begin;
		};

		if(data.local !== undefined){
			data.local = fix.fixNumber(data.local, solar, true);
		};

		//完成日期
		if(data.finishedDate != undefined){
			data.finishedDate = fix.fixDate(data.finishedDate);
		};

		//完成度
		if(data.finishedRate != undefined){
			data.finishedRate = fix.fixNumber(data.finishedRate, 0, false, 0, 1);
			data.finishedDate = data.finishedDate || now;
		};

		//重复活动，重复结束不能小于结束时间
		if(data.repeat && data.repeat != repeat.NoRepeat){
			data.repeatStop = data.repeatStop || data.end;
			if(data.repeatStop < data.end) data.repeatStop = data.end;
		}else{
			data.repeatStop = null;
		};

		console.log(data);
		*/
		return data;
	},
	/*
	 * 检查是否有编辑的权限
	 */
	checkEditPermission: function(memberId, activityId, callback){
		var cond = {
			_id: activityId,
			memberId: memberId
		};

		//如果数量大于1，则表示该用户拥有这个活动
		im.storage.count(this.store, cond, function(err, count){
			if(err) callback(err);
			callback(null, count > 0);
		});
	},
	/*
	 * 获取指定用户，指定状态下活动的数量
	 */
	countWithStatus: function (memberId, statusId, callback){
		var cond = {
			statusId: statusId,
			memberId: memberId
		};

		//统计
		im.storage.count(this.store, cond, callback);
	},
	/*
	 * 插入活动，不校验用户权限，但会校验单个日历最大允许的话动数量
	 */
	insert: function(data, callback){
		//检查日历下的活动是否超出数量限制
		var cond = {calendarId: data.calendarId};
		var s = im.storage;
		s.count(this.store, cond, function(err, count){
			if(err) return callback(err);
			//该日历下的活动数量已经超出范围
			var maxCount = im.config.maxActivityPerCalendar;
			if(count >= maxCount){
				var code = im.e.SaveActivity.OverLimit;
				var resData = {
					maxActivityPerCalendar: maxCount,
					currentActivityCount: count
				};
				var result = s.getResult(false, code, resData);
				return callback(null, result);
			};

			data = s.activity.fixActivity(data, false);
			//插入数据
			var doc = new s.activity.store();
			doc = s.merge(doc, data);
			doc.version = s.incVersion();
			delete doc.statusId;
			//doc.createTime = new Date().getUTC();
			//doc.lastUpdate = new Date().getUTC();
			//console.log(doc);
			s.save(doc, function(err, _id){
				if(err) return callback(err);
				var result = s.getResult(true, null, {
					_id: _id,
					version: doc.version
				});
				callback(null, result);
			});		//end save
		});			//end count
	},
	/*
	 * 更新单条活动
	 * @params {Object} data 要保存的数据
	 * @params {Function} callback(err, result);
	 */
	update: function(data, callback){
		var memberId = data.memberId;
		var cond = {
			_id: data._id,
			memberId: memberId
		};

		var s = im.storage;
		data = s.activity.fixActivity(data, true);
		//更新活动
		s.getDocument(this.store, cond, function(err, doc){
			if(err) return callback(err);
			//没有找到活动，返回错误
			if(!doc){
				var result = s.getResult(false, im.e.NotFound);
				return callback(null, result);
			};		//end if

			/*
			//判断日期与重复是否有改变动
			var changed = doc.begin != data.begin ||
				doc.end != data.end ||
				doc.repeat != data.repeat ||
				doc.repeatStop != data.repeatStop ||
				doc.local != data.local;
			*/

			var changed = false;
			delete data._id;
			delete data.memberId;
			//保存数据
			doc.version = s.incVersion(doc.version);
			//doc.lastUpdate = new Date().getUTC();
			doc = s.merge(doc, data);
			//始终要保持结束日期大于开始日期
			if(doc.begin > doc.end) doc.end = doc.begin;

			s.save(doc, function(err){
				if(err) callback(err);
				var result = im.storage.getResult(true, null, {
					dateChanged: changed,
					version: doc.version
				});
				callback(null, result);

				//如果日期被改动，则更新reminder
				//不用等待，一般不会错，万一错了，影响也不大
				if(!changed) return;
				s.reminder.updateWithActivityId(
					doc._id, doc.begin, doc.repeatStop || doc.end, memberId, function(){});
			});		//end save
		});					//end findOne
	},
	/*
	 * 删除指定用户的活动，不需要提供日历ID，仅提供活动ID和用户ID就足够权限验证
	 */
	remove: function(memberId, activityId, callback){
		var cond = {
			memberId: memberId,
			_id: activityId
		};

		//查找到这个文档
		var s = im.storage;
		s.getDocument(this.store, cond, function(err, doc){
			if(err) return callback(err);
			if(!doc){
				//资源不存在，也可能是这个资源不是用户的
				var result = s.getResult(false, im.e.NotFound);
				return callback(null, result);
			};



			//TODO 1.删除提醒，2.删除reminderQueue，3.删除mailQueue
			//删除提醒，不回调，直接删除处理
			s.reminder.removeWithActivityId(doc._id, memberId, function(){});

			//删除活动
			s.remove(doc, function(err){
				if(err) return callback(err);
				callback(null, s.getResult(true));
			});		//end remove
		});			//end findOne;
	},
	/*
	 * 搜索活动
	 * @pagination 分页信息
	 * @condition 查询条件
	 *  condition = {
	 *   member_id: null,			//必选，目前只能查询用户自己的活动
	 *   calendar_id: null,		//可选，指定某个日历进行查询
	 *   keyword: null,				//可选，搜索title中包含某个关键字的内容
	 *   from: null,					//可选，指定开始时间
	 *   until: null,					//可选，指定结束时间
	 *  }
	 * @params {Function} callback(err, docs, pagination}
	 */
	searchActivity: function(pagination, cond, fields, callback){
		var pag = pagination;
		var s = im.storage;
		var fix = s.fix;
		pag.PageIndex = fix.fixNumber(pag.PageIndex, 1, true, 1, 99999);
		//限制每页最多获取50条记录
		pag.PageSize = fix.fixNumber(pag.PageSize, 10, true, 1, 50);

		var option = {
			limit: pag.PageSize
		};

		if(pag.PageIndex > 1){
			option.skip = pag.PageIndex * pag.PageSize;
		};

		//获取总记录数
		s.count(this.store, cond, function(err, count){
			if(err) return callback(err);
			pag.RowCount = count;
			pag.PageCount = Math.ceil(count / pag.PageSize);
			//查询
			s.find(s.activity.store, cond, fields, option,
				function(err, docs){
					if(err) return callback(err);
					callback(err, pag, docs);
				});		//end find
		});		//end count
	},
	/*
	 * 根据id获取文档
	 */
	getWithId: function(activityId, memberId, callback){
		var s = im.storage;
		var cond = {
			_id: activityId,
			memberId: memberId
		};

		s.findOne(s.activity.store, cond, null, callback);
	}
};
//==deploy==

im.storage.activity.store = require("../schema").activity;
exports.storage = im.storage.activity;