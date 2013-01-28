
/*
 * 负责处理本地与服务器之间的同步
 * 同步数据分两种情况
 * 1.实时同步，即用户创建/删除/更新数据的时候，先保存到数据库，然后向服务器同步
 * 	prePush->pushOne
 * 2.定时同步，一般在用户启动软件，或者指时时间后启动，整个流程为串行执行，流程如下：
 * 	a. 先依次同步需要删除/创建/更新的数据，表的同步顺序按主/子表同步 (syncPush)
 * 	b. 将同步状态改为同步中
 * 	c. 按主/从表依次获取数据(以后要考虑最后更新时间)，每同步一条数据，将状态改为已同步
 * 	d. 同步完成后，删除状态为同步中的数据(表示服务器已删除)
 */
(function(){
	im.sync = {
		//模块的处理顺序很重要，因为依赖关系
		modules: ["status", "calendar", "activity", "reminder"],
		//通常需要调用者重新接管
		msgbox: function(message, code){
			im.log("Message: %s, Level: %s", message, code);
		},
		//提交给ajax处理，但会截获501/404/401等系统级错误统一处理
		ajax: function(module, method, options, id){
			var $statusErr = function(status){
				var statusText = status.toString().replace("-", "_");
				//服务器网关错误，也是500错误
				if(status == 502) statusText = 500;
				if(status == 0) statusText = 404;
				var error = "serverError.err" + statusText;
				error = $.i18n(error);
				im.sync.msgbox(error, status);
			};
			//原来没有对401进行处理的
			options.onError = options.onError || $statusErr;
			im.ajax.request(module, method, options, id);
		},
		/*
		 * 同步所有数据
		 * 1.先向服务器push数据
		 * 2.再从服务器pull数据
		 */
		syncAll: function(callback){
			//用户没有登陆
			if(!im.member.token) return callback(false);

			//return this.syncPush("POST", callback);
			var that = this, m = im.e.method;
			that.syncPush(m.DELETE, function(){
				that.syncPush(m.POST, function(){
					that.syncPush(m.PUT, function(){
						that.syncPull(callback);
					});		//end put
				});			//end post
			});				//end remove
		},
		/*
		 * 向服务器推送单条数据
		 * @params {String} module 模块名称，与表名同名
		 * @params {Object} doc 要提交的数据
		 */
		pushOne: function(module, method, doc, callback){
			var m = im.e.method, id = doc._id, that = this;
			var syncId = doc.syncId;

			//删除不需要提交doc到服务器
			if(method == m.DELETE){
				doc = null;
			}else{
				//删除不需要提交到服务器的数据
				delete doc._id;
				delete doc.remove;
				delete doc.lastUpdate;
				delete doc.memberId;
				if(method == m.POST) syncId = null;
			};

			var options = {
				data: doc,
				onSuccess: function(res){
					if(!res) return callback(null, false);
					if(!res.command.result &&
						method != m.DELETE &&
						res.command.code != im.e.NotFound){
						return callback(null, false);
					}
					//没有同步成功
					var s = im.storage;
					//数据同步成功
					switch(method){
						case m.POST:
							syncId = res.content._id;
							return s.updateSync(module, id, syncId, res.content.version, callback);
						case m.DELETE:
							return s.removeWithId(module, id, callback);
						case m.PUT:
							return s.updateSync(module, id, null, res.content.version, callback);
					};		//end switch
				}				//end onSuccess
			};

			//向服务器提交请求
			this.ajax(module, method, options, syncId);
		},
		/*
		 处理所有表的Remove/Put/Post之一，即向服务器Push数据的
		 * @params {String} cond remove/put/post的sql条件不一样
		 * @params {Function} onSyncRecord(module, doc, callback) 处理每一条数据的回调
		 * @params {Function} onCompleted 处理完所有数据
		 */
		syncPush: function(method, callback){
			var ms = im.sync.modules;
			var m = im.e.method;
			var cond = "";
			//根据不同方法取数据库查询条件
			switch(method){
				case m.POST:
					//版本号小于1，需要插入
					cond = ' AND version < 1';
					break;
				case m.DELETE:
					//remove标识，删除
					cond = " AND remove = 1";
					break;
				default:
					//版本号不是整数，即为需要put的数据
					cond = " AND round(version) != version";
					break;
			};

			//读取table
			var $syncTable = function(tbIndex){
				//操作完成
				if(tbIndex >= ms.length) return callback();
				var module = ms[tbIndex];
				var sql = "SELECT * FROM {0} WHERE 1 = 1 {1}".format(module, cond);
				//读取数据列表
				im.sqlite.query(sql, function(err, rows){
					//没有数据，同步下一个表
					if(rows.length == 0) {
						return $syncTable(tbIndex + 1);
					};

					var index = 0;
					//顺序处理数据
					im.sync.prePush(module, method, rows[index], function(){
						index ++;
						if(index >= rows.length) return $syncTable(tbIndex + 1);
						//继续处理
						im.sync.prePush(module, method, rows[index], arguments.callee);
					});
				});		//end query
			};

			$syncTable(0);
		},
		/*
		 * 完整同步整个模块的数据，直接从服务器中拉数据
		 * @params {String} syncId 同步ID，仅针对完全同步日历的活动，此处为日历的ID
		 */
		syncPullModule: function(module, syncId, callback){
			var options = {
				onSuccess: function(res){
					if(!res.command.result) return callback(null, false);
					var content = res.content, rows = content;
					//获取整张日历，实际上是更新所有活动
					if(module == im.e.module.calendar && syncId){
						rows = content.calendar.activities;
						module = im.e.module.activity;
					};

					im.storage.batchUpdate(module, rows, callback);
				}
			};

			this.ajax(module, im.e.method.GET, options, syncId);
		},
		/*
		 * 从服务器同步活动，首先应该保证日历和状态已经被成功同步了
		 * 1.
		 */
		syncPullActivity: function(callback){
			var that = this;
			var sql = "SELECT _id, syncId FROM calendar";
			im.sqlite.query(sql, function(err, rows){
				var index = 0;
				//同步
				var $sync = function(){
					if(index >= rows.length) return callback();
					var syncId = rows[index].syncId;
					that.syncPullModule(im.e.module.calendar, syncId, function(){
						index ++;
						$sync();
					});
				};		//end $sync

				$sync();
			});
		},
		/*
		 * 从服务器拉下数据再同步到本地
		 * 1.按status/calendar/activity/reminder顺序同步
		 * 2.如果任何表没有如果，取所有数据，否只则取索引
		 * 3.将本地数据状态标识为Syncing
		 * 4.如果是取索引，则将数据进行比对，将服务器有而本地没有的数据插入，将状态标识为Finished
		 * 5.全部同步完成，删除标识为Syncing的(服务器上无数据)
		 */
		syncPull: function(callback){
			var ms = im.sync.modules;
			var m = im.e.method;
			var mIndex = 0;

			//同步的函数
			var $sync = function(){
				if(mIndex >= ms.length){
					//保存最后从服务器上拉数据的时间
					im.member.setting.lastSyncPull = new Date().getTime();
					im.storage.updateMember();
					return callback();
				};
				var module = ms[mIndex];
				//同步所有日历
				if(module == im.e.module.activity){
					im.sync.syncPullActivity(function(){
						mIndex ++;
						$sync();
					});
				}else{
					im.sync.syncPullModule(module, null, function(){
						mIndex ++;
						$sync();
					});		//end syncPullModule;
				};				//end if
			};				//end $sync;

			$sync();
		},
		/*
		 杜老师，我觉得我很不适合这份工作，并不是因为我在意学生的看法，而是我觉得我自己做不好这份工作。
		 工作这段时间以来，我每天晚上都没有休息好，但我的身体情况要求我必需好好休息。
		 就我自已的性格来说，我无法做到无所谓，我希望我的工作做好，否则会非常难受。
		 考虑再三，还是向您申请辞职，毕竟现在还是试用期，双方有自由选择的余地。
		 祝咱们学校生源红火，教学顺利，再次感谢。
		 * 准备Push活动，因为活动是子表关系，所以要特殊操作
		 * 只针对put/post处理，remove不需要管calendar
		 */
		prePushActivity: function(method, doc, callback){
			var that = this, module = im.e.module.activity;
			//删除提醒，不需要日历的ID和状态ID
			if(method == im.e.method.DELETE){
				return that.pushOne(module, method, doc, callback);
			};

			//查找状态ID和日历的ID
			im.storage.findCalendarAndStatus(doc.calendarId, doc.statusId, true,
				function(calendarId, statusId){
					//日历还没有同步ID，放弃处理，等待统一同步
					if(!calendarId) return callback(null, false);
					//提取日历的SyncID
					doc.calendarId = calendarId;
					doc.statusId = statusId;
					im.log(doc);
					that.pushOne(module, method, doc, callback);
				});
		},
		/*
		 * 准备同步提醒，需要提取活动的syncId
		 */
		prePushReminder: function(method, doc, callback){
			var module = im.e.module.reminder;
			//删除，不需要查找活动的ID
			if(method == im.e.method.DELETE){
				return this.pushOne(module, method, doc, callback);
			};

			var that = this;
			//查找活动的ID
			im.storage.findRelatedId(im.e.module.activity, doc.activityId, true,
				function(err, syncId){
					if(err) return callback(err);
					//没有活动的同步ID
					if(!syncId) return callback(err, false);
					doc.activityId = syncId;
					that.pushOne(module, method, doc, callback);
				});
		},
		/*
		 * 向服务器预提交数据，数据先保存到本地Sqlite，然后交到预提交数据
		 * 用于实时同步，用户将数据CURD完成后，即交给此函数处理
		 * @params {String} module 模块
		 * @params {String} method 方法
		 * @params {Number} id 本地ID
		 * @params {Function} callback 处理完成的回调
		 */
		prePushWithId: function(module, method, id, callback){
			//TODO 判断同步功能是否正常，不正常则判断上一次同步时间
			var m = im.e.method, that = this;
			var s = im.storage;
			//从数据库读取本地数据
			s.getWithId(module, id, function(err, doc){
				if(err) return callback(err);
				if(!doc) return callback(err, false);
				var version = doc.version;
				var remove = doc.remove;
				var syncId = doc.syncId;
				var method = m.PUT;

				//需要删除此条数据
				if(!syncId){
					if(remove) return s.removeWithId(module, id, callback);
					//非删除的情况，肯定是新建数据
					method = m.POST;
				};

				//如果是版本是整数，表示本地没有经过修改，所以不需要更新
				if(version.isInt() && method == m.PUT){
					return callback(null, true);
				};

				that.prePush(module, method, doc, callback);
			});			//end getWithId
		},
		/*
		 * 对文档进行预处理
		 */
		prePush: function(module, method, doc, callback){
			doc = $.extend({}, doc);
			var ms = im.e.module;
			//根据模块不同，判断是否要预处理
			switch(module){
				case ms.activity:
					this.prePushActivity(method, doc, callback);
					break;
				case ms.reminder:
					this.prePushReminder(method, doc, callback);
					break;
				default:
					this.pushOne(module, method, doc, callback);
					break;
			};		//end switch
		}
		/*
		 * 向服务器同步数据
		 * @params {String} module 模块名称，与表名同名
		 * @params {Object} data 要提交的数据
		 * @params {Number} id 本地ID
		 * @params {String} syncId 服务器的同步ID
		 */
		/*
		 sync: function(module, method, doc, callback){
		 var m = im.e.method, id = doc._id, that = this;
		 var syncId = doc.syncId;

		 if(method == m.delete){
		 doc = null;
		 }else{
		 //删除不需要提交到服务器的数据
		 delete doc._id;
		 delete doc.remove;
		 delete doc.lastUpdate;
		 delete doc.memberId;

		 if(method == m.post) syncId = null;
		 };

		 var options = {
		 data: doc,
		 onSuccess: function(res){
		 //没有同步成功
		 if(!res || !res.command.result){
		 return callback(null, false);
		 };

		 //更新版本
		 var version = -1;
		 if(method != m.delete){
		 version = res.content.version;
		 };

		 //数据同步成功
		 switch(method){
		 case m.post:
		 syncId = res.content._id;
		 return that.updateSync(module, id, syncId, version, callback);
		 case m.delete:
		 return that.removeWithId(module, id, callback);
		 case m.put:
		 return that.updateSync(module, id, null, version, callback);
		 };		//end switch
		 }				//end onSuccess
		 };

		 //向服务器提交请求
		 im.ajax.request(module, method, options, syncId);
		 },
		 */
	};
})();
