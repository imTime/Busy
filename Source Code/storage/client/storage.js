/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 9/3/12
 * Time: 9:20 PM
 * 本地存储相关
 */
(function(){
	var filedAndValue = function(operator, field, value){

	};

	var getCondition = function(cond){
		//查询条件
		var result = "";
		for(var field in cond){
			var value = cond[field];
			//简单的等于查询
			if(typeof(value) != "object"){
				result += " AND {0} = '{1}'".format(field, value);
			}else{
				var find = false;
				var list = [
					{s: "$ne", t: '!='},
					{s: "$gte", t: '>='},
					{s: "$lte", t: '<='},
					{s: "$gt", t: '>'},
					{s: "$lt", t: '<'}
				];

				list.forEach(function(item){
					var v = value[item.s];
					if(v){
						find = true;
						result += " AND {0} {1} '{2}'".format(field, item.t, v);
						return true;
					};
				});

				if(!find){
					throw "未实现的运算符：" + JSON.stringify(value);
				};
			}		//end if typeof
		};
		//console.log(result);
		return result;
	};

	//根据schema生成sql
	var getSql = function(schema, tableName){
		var sql = 'CREATE TABLE {0}(_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ';
		sql += 'syncId TEXT, remove Boolean, ';			//向远程同步的ID和标识移除字段
		sql = sql.format(tableName);
		for(var field in schema){
			var s = schema[field];
			var type = s.type;
			var sqlType = "TEXT";
			if(type == Number){
				sqlType = "REAL";
			}else if (type == Boolean){
				sqlType = "Boolean"
			};

			sql += '{0} {1}, '.format(field, sqlType);
		};
		sql = sql.substring(0, sql.length - 2);
		sql += ");";
		//console.log(sql);
		return sql;
	};

	im.member = {
		memberId: -1
	};

	im.schema = {};
	//向服务器同步
	im.storage = {
		schemas: {},
		/*
		 * 根据ID获取一条数据
		 */
		getWithId: function(module, id, callback){
			var sql = "SELECT * FROM {0} WHERE _id = {1}".format(module, id);
			im.sqlite.query(sql, function(err, rows){
				var doc = null;
				if(!err && rows.length > 0){
					doc = rows[0];
				};
				callback(err, doc);
			});
		},
		/*
		 * 批量更新整个表的数据，一般是从服务器拉下一批数据，再更新到本地，依次插入
		 */
		batchUpdate: function(module, rows, callback){
			var index = 0;
			var $update = function(){
				//更新完成
				if(index >= rows.length) return callback();
				im.storage.updateWithSyncId(module, rows[index], function(){
					index ++;
					$update();
				});
			};
			$update();
		},
		/*
		 * 根据一个ID，查找另一个相关的ID，包括
		 * 1.根据SyncID，查找本地ID
		 * 2.根据本地ID，查找SyncID
		 */
		findRelatedId: function(module, id, getSync, callback){
			var getField = getSync ? "syncId" : "_id";
			var condField = getSync ? "_id" : "syncId";
			var sql = "SELECT {0} AS id FROM {1} WHERE {2} = '{3}'";
			sql = sql.format(getField, module, condField, id);
			//查询
			im.sqlite.query(sql, function(err, rows){
				var id = null;
				if(!err && rows.length > 0) id = rows[0].id;
				callback(err, id);
			});		//end query;
		},
		/*
		 * 根据Sync更新数据，用于已经从服务器同步了数据。如果数据不存在，则创建
		 * @params {JSON} doc 从服务器传回来的数据集，单条数据
		 */
		updateWithSyncId: function(module, doc, callback){
			var sql = "SELECT _id FROM {0} WHERE syncId = '{1}'".format(module, doc._id);
			im.sqlite.query(sql, function(err, rows){
				if(err) return callback(err);
				var isUpdate = (rows.length > 0);
				var newDoc = {};
				if(isUpdate){
					$.extend(newDoc, rows[0]);
				};
				newDoc.memberId = im.member.memberId;
				newDoc.syncId = doc._id;
				delete doc._id;
				$.extend(newDoc, doc);
				newDoc.tableName = module;

				//如果是更新活动，查找日历ID和状态ID
				if(module == im.e.module.activity){
					var s = im.storage;
					//查找日历ID
					s.findRelatedId(im.e.module.calendar, doc.calendarId, false, function(err, calendarId){
						newDoc.calendarId = calendarId;
						//没有状态ID，无状态
						if(!doc.statusId){
							newDoc.statusId = null;
							return im.sqlite.save(newDoc, callback);
						};

						//查找状态的ID
						s.findRelatedId(im.e.module.status, doc.statusId, false, function(err, statusId){
							newDoc.statusId = statusId;
							im.sqlite.save(newDoc, callback);
						});			//end findRelatedId for status
					});
				}else{
					im.sqlite.save(newDoc, callback);
				};			//end if
			});				//end query
		},
		/*
		 * 根据日历和状态的本地ID找到同步ID，或者根据同步ID找到本地ID
		 */
		findCalendarAndStatus: function(calendarId, statusId, getSync, callback){
			var ms = im.e.module;
			//查找日历的id
			this.findRelatedId(ms.calendar, calendarId, getSync, function(err, calId){
				//查找状态的ID
				if(statusId){
					this.findRelatedId(ms.status, statusId, getSync, function(err, stsId){
						callback(calId, stsId);
					});
				}else{
					callback(calId, null);
				};			//end if
			});
		},
		/*
		 * 从本地删除，删除物理数据
		 */
		removeWithId: function(module, id, callback){
			var sql = "DELETE FROM {0} WHERE _id = {1}".format(module, id);
			im.sqlite.executeSql(sql, callback);
		},
		/*
		 * 更新同步ID
		 */
		updateSync: function(module, id, syncId, version, callback){
			var sql = "UPDATE {0} SET version = {1}".format(module, version);
			if(syncId) sql += ", syncId='{0}'".format(syncId);
			sql += " WHERE _id = {0}".format(id);
			im.sqlite.executeSql(sql, callback);
		},
		//添加schema
		appendSchema: function(schema, tableName){
			var sql = getSql(schema, tableName);
			this.schemas[tableName] = {
				tableName: tableName,
				sql: sql
			};

			var fn = function(){
				this.tableName = tableName;
			};
			fn.tableName = tableName;
			return fn;
		},
		/*
		 获取返回的结果
		 */
		getResult: function(result, code, data){
			var json = {
				command: {
					result: result
				}
			};
			if(code) json.command.code = code;
			if(data) json.content = data;
			return json;
		},
		merge: function (source, target){
			for(var item in target){
				source[item] = target[item];
			};
			return source;
		},
		/*
		 * 升级版本号，服务器端加1，客户端加小数位
		 */
		incVersion: function(version){
			version = version || 0;
			return version + 0.000001;
		},
		/*
		 * 根据条件删除数据
		 */
		removeWithCondition: function(schema, cond, callback){
			cond = getCondition(cond);
			var sql = "UPDATE {0} SET remove = 1 WHERE 1 = 1 {1}";
			sql = sql.format(schema.tableName, cond);
			im.sqlite.executeSql(sql, callback);
		},
		/*
		 * 获取文档，其实就是获取一条记录，并把table的名称加上去，因为Sqlite需要用TableName
		 */
		getDocument: function(schema, cond, callback){
			this.findOne(schema, cond, function(err, doc){
				if(err) callback(err);
				if(doc){
					doc.tableName = schema.tableName;
				};
				callback(err, doc);
			});
		},
		/*
		 将本地数据标识为移除状态，并不是真正的删除
		 */
		remove: function(schema, callback){
			var sql = "UPDATE {0} SET remove = 1 WHERE _id = {1}";
			sql = sql.format(schema.tableName, schema._id);
			im.sqlite.executeSql(sql, callback);
		},
		/*
		 * 获取数据，第一个参数是schema，第二个参数是条件，第三个参数回调
		 */
		findOne: function(schema, cond, fields, option, callback){
			if(typeof fields == "function"){
				callback = fields;
				fields = null;
			}else if (typeof option == "function"){
				callback = option;
				option = null;
			};

			//查找一条数据
			this.find(schema, cond, fields, option, function(err, docs){
				var doc = null;
				if(docs.length > 0){
					doc = $.extend({}, docs[0]);
				};
				callback(null, doc);
			});
		},
		/*
		 * 查找数据
		 */
		find: function(schema, cond, fields, option, callback){
			cond = getCondition(cond);
			cond += " AND remove IS NULL";
			if(typeof fields == "function"){
				callback = fields;
			}else if (typeof option == "function"){
				callback = option;
			};

			im.sqlite.get(schema, cond, null, 0, callback);
		},
		/*
		 * 统计
		 */
		count: function(schema, cond, callback){
			cond = getCondition(cond);
			cond += " AND remove IS NULL";
			im.sqlite.count(schema.tableName, cond, callback);
		},
		/*
		 * 保存
		 */
		save: function(schema, callback){
			im.sqlite.save(schema, callback);
		},
		/*
		 * 创建会员的Schema，这个Schema和服务器的不一样
		 */
		pushMemberSchema: function(){
			var schema = {
				username: {type: String},			//本地登陆的帐号
				password: {type: String},			//本地登陆的密码
				token: {type: String},				//实现token
				setting: {type: String}				//用户保存用户设置
			};
			this.appendSchema(schema, "member");
		},
		//本地登陆
		localSignIn: function(callback){
			var sql = "SELECT * FROM member limit 1";
			im.sqlite.query(sql, function(err, rows){
				if(rows.length > 0){
					var row = rows[0];
					var meb = im.member;
					meb.memberId = row._id;
					meb.token = row.token;
					meb.isSigned = true;
					meb.setting =  JSON.parse(row.setting || null) || {};
				};	//end if;
				callback(err);
			});
		},
		/*
		 * 创建本地帐号，用户名为root
		 */
		localSignUp: function(callback){
			//检查是否存在同名帐号，没有才插入
			var s = im.sqlite;
			var sql = "SELECT * FROM member WHERE username = 'root'"
			s.query(sql, function(err, rows){
				if(err || rows.length > 0) return callback(err);
				//不存在，插入数据
				sql = "INSERT INTO member(username) VALUES ('root')";
				s.executeSql(sql, callback);
			});
		},
		/*
		 * 更新token到数据库
		 */
		updateMember: function(){
			var s = this;
			//注册，然后登陆
			s.localSignUp(function(){
				var sql = "UPDATE member SET token = '{0}', setting = '{1}'";
				sql = sql.format(im.member.token || "",
					JSON.stringify(im.member.setting));
				im.sqlite.executeSql(sql, function(){});
			});
		},
		/*
		 * 向服务器申请取Token
		 */
		applyToken: function(data, callback){
			var options = {
				data: data,
				onSuccess: function(res){
					//成功
					if(res.command.result){
						im.member.token = res.content.token;
						im.member.setting.mail = data.mail;
						//var expired = response.content.expired;
						//更新token
						im.storage.updateMember();
					};
					callback(res);
				}
			};

			im.sync.ajax(im.e.module.token, im.e.method.POST, options);
		},
		//请求数据put/post/del/get
		request: function(module, method, options, id){
			var ms = im.e.module;
			switch(module){
				case ms.token:
					//获取token
					return this.applyToken(options.data, options.onSuccess);
				case ms.signUp:
					return im.sync.ajax.apply(im.sync, Array.prototype.slice.call(arguments, 0));
			};

			var fn = {
				"POST": "insert",
				"PUT": "update",
				"DELETE": "remove",
				"GET": "get"
			}[method];
			var findModule = this[module];
			fn = findModule[fn];
			if(!fn) im.log("Method '{0}' in module '{1}' not found".format(method, module));
			var data = options.data || {};
			data.memberId = im.member.memberId;
			data.lastUpdate = new Date().getUTC();

			//回调的处理
			var callback = function(err, res){
				if(err) im.log(err);
				//处理成功，提取id，交给同步程序处理（非Get）
				if(!err && method != _m.GET && res.command.result){
					//同步
					var _id = data._id || id;
					//创建新的，会返回一个id
					if(method == _m.POST){
						_id = res.content._id;
					};

					im.sync.prePushWithId(module, method, _id, function(){});
				};
				options.onSuccess(res);
			};

			var _m = im.e.method;
			switch(method){
				case _m.POST:
				case _m.PUT:
					data._id = id;
					fn.call(findModule, data, callback);
					break;
				case _m.DELETE:
					fn.call(findModule, data.memberId, id, callback);
					break;
				case _m.GET:
					data._id = id;
					fn.call(findModule, data, callback);
					break;
			}
		},
		//初始化
		init: function(callback){
			var s = this;
			this.pushMemberSchema();

			im.sqlite.init({
				createTable: this.schemas
			}, function(err, result, newDatabase){
				//发生错误
				if(err || !result) callback(err, result);
				s.localSignUp(function(){
					s.localSignIn(callback);
				});
				/*
				//新的数据，则为用户自动创建一个本地帐号
				if(newDatabase){
					//注册，然后登陆
					s.localSignUp(function(){
						s.localSignIn(callback);
					});
				}else{
					//用本地帐号登陆
					s.localSignIn(callback);
				};	//end if;
				*/
			});		//end init;
		}
	};
})();

