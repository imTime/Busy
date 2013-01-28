/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 9/5/12
 * Time: 9:31 PM
 * 对状态进行操作，兼容Sqlite和Mongoose
 */
var im = require("./index").im;

//==deploy==
im.storage.status = {
	fixStatus: function (data){
		var fix = im.storage.fix;
		data.color = fix.fixColor(data.color);
		data.status = fix.fixString(data.status, true, im.config.fieldLength.status.status);
		return data;
	},
	/*
	 * 检查状态是否存在
	 */
	checkStatusExists: function(memberId, status, statusId, callback){
		var cond = {
			memberId: memberId,
			status: status
		};

		//如果statusId存在，则忽略这个状态
		if(statusId){
			cond._id = {$ne: statusId};
		};

		//检查该状态是否存在
		im.storage.count(this.store, cond, function(err, count){
			callback(err, count > 0);
		});
	},
	/*
	 * 更新状态计数器
	 * @params {ObjectId} memberId 会员的id
	 * @params {ObjectId} statusId 状态的id
	 * @params {Number} count 该状态下有活动总量
	 * @params {Function} callback(err, result{Boolean});
	 */
	counter: function (memberId, statusId, count, callback){
		var cond = {
			memberId: memberId,
			_id: statusId
		};

		//找到状态
		var s = im.storage;
		s.findOne(this.store, cond, function(err, doc){
			if(err) return callback(err);
			if(!doc) return callback(null, false);

			//保存
			doc.counter = count;
			doc.save(function(err){
				if(err) return callback(err);
				callback(null, true);
			});			//end save
		});				//end findOne;
	},
	/*
	 * 检查会员创建状态是否超出范围
	 */
	checkStatusLimit: function (memberId, callback){
		var cond = {memberId: memberId};
		im.storage.count(this.store, cond, function(err, count){
			if(err) callback(err);
			callback(null, count >= im.config.maxStatusPerMember);
		});
	},
	/*
	 * 插入状态数据
	 */
	insert: function(data, callback){
		var s = im.storage;
		var e = im.e.SaveStatus;
		data = this.fixStatus(data);
		//颜色不符合标准或者状态没填写，返回数据不合法
		if(!data.color || !data.status){
			return callback(null, s.getResult(false, im.e.DataIncorrect));
		};

		//检查同名的状态是否存在
		this.checkStatusExists(data.memberId, data.status, null, function(err, exists){
			if(err) return callback(err);
			if(exists){
				return callback(null, s.getResult(false, e.StatusExists));
			};

			//检查是否超出数量
			s.status.checkStatusLimit(data.memberId, function(err, overlimit){
				if(err) return callback(err);
				if(overlimit){
					return callback(null, s.getResult(false, e.StatusLimit));
				};

				//保存
				var doc = new s.status.store();
				doc = s.merge(doc, data);
				doc.version = s.incVersion();
				s.save(doc, function(err, _id){
					if(err) return callback(err);
					var result = s.getResult(true, null, {
						_id: _id,
						version: doc.version
					});
					callback(null, result);
				});			//end save
			});					//end checkStatusLimit
		});				//end checkStatusExists
	},
	/*
	 * 更新状态
	 */
	update: function(data, callback){
		var s = im.storage;
		var e = im.e.SaveStatus;
		data = this.fixStatus(data);
		//颜色不符合标准或者状态没填写，返回数据不合法
		if(!data.color || !data.status){
			return callback(null, s.getResult(false, im.e.DataIncorrect));
		};

		//检查同名的状态是否存在
		this.checkStatusExists(data.memberId, data.status, data._id, function(err, exists){
			if(err) return callback(err);
			if(exists){
				return callback(null, s.getResult(false, e.StatusExists));
			};

			var cond = {
				_id: data._id,
				memberId: data.memberId
			};

			s.getDocument(s.store, cond, function(err, doc){
				if(err) return callback(err);
				//没有找到状态
				if(!doc){
					return callback(null, s.getResult(false, e.StatusNotFound));
				};

				delete data._id;
				delete data.memberId;

				doc = s.merge(doc, data);
				doc.lastUpdate = new Date().getUTC();
				doc.version = s.incVersion(doc.version);
				s.save(doc, function(err){
					if(err) return callback(err);
					var result = s.getResult(true, null, {
						version: doc.version
					});
					callback(null, result);
				});			//end save
			});				//end findOne;
		});					//end checkStatusExists
	},
	/*
	 * 删除状态
	 */
	remove: function(memberId, statusId, callback){
		var e = im.e.DeleteStatus;
		var s = im.storage;
		console.log(this.store);
		//检查有多少
		s.activity.countWithStatus(memberId, statusId, function(err, count){
			if(err) return callback(err);
			if(count > 0) return callback(null, s.getResult(false, e.ActivityExist));

			//找到这个文档
			var cond = {
				memberId: memberId,
				_id: statusId
			};

			s.getDocument(s.status.store, cond, function(err, doc){
				if(err) return callback(err);
				if(!doc) return callback(null, s.getResult(false, e.StatusNotExist));

				//删除
				s.remove(doc, function(err){
					if(err) return callback(err);
					callback(null, s.getResult(true));
				});		//end remove
			});		//end findOne
		});			//end countActivityWithStatus
	},
	/*
	 * 根据用户的ID获取用户所有的状态，不检查权限
	 */
	get: function(options, callback){
		var cond = {
			memberId: options.memberId
		};

		var fields = {
			memberId: 0
		};

		if(options.index){
			fields = {
				_id: 1,
				version: 1,
				lastUpdate: 1
			};
		};

		//搜索数据
		im.storage.find(this.store, cond, fields, function(err, docs){
			var result;
			if(!err){
				result  = im.storage.getResult(true, null, docs);
			};
			callback(err, result);
		});
	}
};
//==deploy==

im.storage.status.store = require("../schema").status;
exports.storage = im.storage.status;