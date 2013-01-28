/*
 活动相关
 */
(function(){
	var _ele, _cacheKey = $.uniqueText("__cache_");
	var _at = im.e.ActivityType;
	im.page.activity = {
		cache: function(value, append){
			return im.page.cache(_cacheKey, value, append);
		},
		//选择日历
		calendarSelector: function(){
			//手机版本弹出slideup
			if($.env.isPhone){

			}else{
				im.page.displayClipCalendars(_ele.calendarLink, "right");
			}
		},
		/*
		 * 初始化编辑器
		 */
		init: function(){
			var that = this;
			var o = $("#pnlActivityEditor");
			_ele = {
				container: o,
				//日历的链接
				calendarLink: $("#lnkActCalendar"),
				birthdayEditor:o.find("#pnlBirthdayEditor"),
				todoEditor:o.find("#pnlTodoEditor"),
				normalEditor:o.find("#pnlNormalEditor"),
				tabs:$("#pnlActivityTabs"),
				deleteButton: $("#btnDeleteActivity"),
				saveButton: $("#btnSaveActivity")
			};

			im.page.keypress(o);
			o.bind("onCtrlS", this.saveEditor);

			//点击保存按钮
			$.tap(_ele.saveButton, that.saveEditor);

			var atEnum = im.e.ActivityType;
			var tabsData = im.page.enumToArray(atEnum, function(item){
				if(item.value == atEnum.Unknown) return false;
				item.text = $.i18n("e.ActivityType._" + item.value);
				delete item.key;
				return item;
			});

			//多tab切换
			_ele.tabs.listView(tabsData)
				.bind("onSelected", function(e, obj, value, clicked, data){
					that.switchEditor(value);
					//用户点击的，则设置时间
					if(clicked){
						var activity = im.page.cache(_cacheKey).activity;
						var begin = activity.begin;
						var end = activity.end || begin;
						if(!begin) return;


						begin = new Date(begin);
						end = new Date(end);
						that.editorEntityWithType(value).fillDate(begin, end, activity.allDay);
					};
				});

			//删除某个活动
			$.tap(_ele.deleteButton, function(){
				//删除后清除，并返回timeline，重新加载timeline
				var activity = that.cache().activity;
				//console.log(activity);
				that.remove(activity.calendarId, activity._id, function(){
					that.reset();
					im.page.update(true, true);
					im.page.phone.switchPage(false);
				});
			});

			//点击或移至日历的链接
			$.tap(_ele.calendarLink, function(){
				if(im.member.calendarCount <= 1) return;
				//选择日历
				im.page.activity.calendarSelector();
				//_ele.calendars.toggle();
			});

			if(!$.env.isTouch){
				_ele.calendarLink.bind("hover", function(){
					if(im.member.calendarCount <= 1) return;
					//_ele.calendars.fadeIn();
				});
			};

			//初始化提醒
			im.page.reminder.init({
				//提醒发生改变，返回数量
				onUpdate: function(reminderId, delay, reminderBy){
					that.updateReminder(reminderId, delay, reminderBy);
				}, onRemove: function(reminderId){
					that.updateReminder(reminderId, true);
				}
			});


			im.page.todoEditor.init();
			im.page.normalEditor.init();
			im.page.birthdayEditor.init();

			//设置默认的cache
			im.page.cache(_cacheKey, {activity: {}});
		},
		/*
		 * 选择日历
		 */
		selectedCalendar: function(calendarId){
			if(!_ele) return;			//兼容popup
			im.page.selectedCalendar(_ele.calendarLink, calendarId);
		},
		/*
		 * 更新重复
		 */
		updateRepeat: function(repeat, stop, local){
			var act = im.page.cache(_cacheKey).activity;
			//如果没有设置值，则不更新
			if(repeat !== undefined) act.repeat = repeat;
			if(stop !== undefined) act.stop = stop;
			if(local !== undefined) act.local = local;

			im.page.normalEditor.updateRepeatText();
		},
		/*
		 * 显示重复
		 */
		showRepeat: function(){
			var o = _ele.container;
			var activity = im.page.cache(_cacheKey).activity;
			im.page.repeat.show(o.height(),
				activity.repeat, activity.stop, activity.local);
		},
		/*
		 * 显示提醒
		 */
		showReminder: function(){
			var o = _ele.container;
			var cache = im.page.cache(_cacheKey);
			im.page.reminder.load(cache.reminders || []);
			im.page.reminder.show(o.height(), cache.activity._id);
		},
		/*
		//加载日历列表
		loadCalendars: function(calendars){
			var html = '';
			calendars.forEach(function(item, index){
				var temp = '<a value="{0}" title="{2}"><span ';
				temp += 'style="background-color: {1}"></span>{2}</a>';
				temp = temp.format(item._id, item.color, item.title);
				html += temp;
			});
			_ele.calendars.html(html);

			im.page.listView(_ele.calendars, ">a", function(obj, value){
				var activity = _ele.container.cache();
				activity.calendarId = value;
				_ele.container.cache({
					activity: activity
				});			//end cache;
				_ele.calendars.fadeOut();
				_ele.calendarLink.html(obj.html());
			});				//end listview

			//多个日历
			if(calendars.length > 0){
				_ele.calendars.find(">a")[0].click();
			};
		},
		*/
		/*
		 * 更新提醒
		 * @params {ObjectId} arguments[0] 要操作提醒id
		 * @params {Number, Boolean} delay 延时；注意：如果为true会删除提醒
		 * @params {Number} reminderBy 提醒方式，如果delay为true，则不需要此参数
		 */
		updateReminder: function(reminderId, delay, reminderBy){
			var reminders = im.page.cache(_cacheKey).reminders || [];
			//查找reminder
			var find = -1;
			reminders.forEach(function(item, index){
				//找到停止重复
				if(reminderId == item._id){
					find = index;
					return true
				};		//end if
			});			//end for each

			//需要删除此提醒
			if(delay === true){
				if(find != -1) reminders.removeAt(find);
			}else{
				//找到，更新
				var item = {
					_id: reminderId,
					reminderBy: reminderBy,
					delay: delay
				};

				if(find == -1){
					reminders.push(item);
				}else{
					reminders[find] = item;
				};
			};

			//写入缓存
			im.page.cache(_cacheKey, {
				reminders: reminders
			}, true);
			//更新显示
			im.page.activity.updateReminderText();
		},
		/*
		 * 更新提醒上的文字
		 */
		updateReminderText: function(){
			var reminders = im.page.cache(_cacheKey).reminders || [];
			var text = $.i18n("activity.reminderLink");
			var count = reminders.length;
			//复数
			if(count > 1){
				text = $.i18n("activity.remindersLink") || text;
			}else if(count == 0){
				text = $.i18n("activity.noReminder") || text;
			};
			text = text.format(count);

			//更新不同编辑器上的提醒文字
			im.page.normalEditor.updateReminderText(text);
			im.page.todoEditor.updateReminderText(text);
			im.page.birthdayEditor.updateReminderText(text);
		},
		/*
		//将编辑器订到中间
		pinToCenter: function(key){
			var o = _ele.container;
			//将编辑器显示到中间
			im.page.fullscreen.show({
				title:$.i18n("activity.title." + key),
				onClose: function(){
					im.page.activity.reset();
					o.fadeOut();
				}
			});
			//将编辑器显示到剧中位置
			im.page.pinToCenter(o).fadeIn();
		},
		*/
		//清除
		reset: function(){
			//只需要清除标题、ID、提醒就可以了，用户有可能需要创建一个类似的活动
			var cache = im.page.cache(_cacheKey);
			var act = cache.activity;
			if(act.allDay === undefined) act.allDay = true;

			delete act._id;
			delete act.title;
			delete cache.reminders;

			//如果上次保存的是生日，则删除重复类型，生日保存的时候会自动添加活动的类型
			if(act.type == im.e.ActivityType.Birthday) delete act.repeat;
			//清除编辑器
			im.page.normalEditor.reset();
			im.page.todoEditor.reset();
			im.page.birthdayEditor.reset();
			this.updateReminderText();
		},
		/*
		 * 删除活动
		 */
		remove: function(calendarId, activityId, callback){
			var options = {
				onSuccess: function(res){
					if(res.command.result){
						//更新computing
						var cp = im.interface.getCompute();
						cp.removeActivity(calendarId, activityId);
						$.callEvent(callback);
					};
				}
			};
			im.interface.passed(im.e.module.activity, im.e.method.DELETE, options, activityId);
		},
		/*
		 * 检查是否可以编辑(创建)，用户需要已经登陆，并且日历已经创建
		 */
		canEdit: function(isEdit, hookCallback){
			//如果用户没有登陆，提醒用户登陆
			if(!im.member.isSigned){
				//登陆成功后，再调用此函数
				im.page.hook.signed = hookCallback;
				im.page.sign.show(true);
				return false;
			};

			//日历的数量为0，需要创建日历
			if(im.member.calendarCount == 0){
				im.page.calendar.show();
				return false;
			};

			_ele.tabs.display(!isEdit);
			//手机版本有删除的按钮
			if($.env.isPhone){
				_ele.deleteButton.display(isEdit);
			};

			return true;
		},
		//根据日历和活动所在的索引进行编辑
		edit: function(calendarIndex, activityIndex){
			if(!this.canEdit(true, arguments.callee)) return;

			//找到活动
			var cp = im.interface.getCompute();
			var activity = cp.findActivity(calendarIndex, activityIndex);

			//没有找到，创建新的
			if(!activity) return this.createNew();

			//复制活动
			activity = $.extend({}, activity);
			var type = activity.type;
			this.editorEntityWithType(type).fill(activity);

			//更新提醒的数量
			//this.updateReminderText();
			//将活动写入缓存
			im.page.cache(_cacheKey, {activity: activity}, true);
			//显示编辑器
			this.show(type);
		},
		//根据类型返回不同的编辑器实体
		editorEntityWithType: function(type){
			var key = im.page.reflectionEnum(im.e.ActivityType, type).toLowerCase();
			return im.page[key + "Editor"];
		},
		//创建新的活动
		createNew: function(type, date){
			if(!this.canEdit(false, arguments.callee)) return;

			//如果编辑活动没有保存，则重置编辑器
			var activity = im.page.cache(_cacheKey).activity;
			//alert(activity && activity._id);
			if(activity && activity._id) this.reset();

			//没有type，则根据现存的type
			//只有新建来需要考虑type的问题
			if(!type){
				if(activity && activity.type) type = activity.type
				type = type	|| im.e.ActivityType.Normal;
			};

			//如果设定了时间，则重设编辑器的时间
			if(date){
				var end = date.clone();
				activity.end = activity.begin = date.getTime();
				this.editorEntityWithType(type).fillDate(date, end, true);
			};

			this.show(type);
		},
		/*
		 * 显示活动，业务逻辑
		 * 1.第一个参数可先为活动实体/时间(可选)，如果第一个参数为时间，则第二个参数可为类型
		 * 2.没有参数的时候，默认日期为当天
		 * 3.如果用户没有点保存，数据不清除，就算用户退出编辑(要求加载数据后要初始编辑器的数据)
		 */
		show: function(type){
			//手机用切换page，其它版本用modal
			if($.env.isPhone){
				im.page.phone.switchPage(true);
			}else{
				//关闭clip日历
				im.page.displayClipCalendars();
				im.page.modal(_ele.container);
			};

			//加载提醒
			im.page.reminder.load();
			//调整
			im.page.normalEditor.updateRepeatText();
			//切换编辑器
			_ele.tabs.trigger("onSelect", [type]);
		},
		/*
		 * 切换编辑器
		 */
		switchEditor: function(type){
			//设置类型
			var act = im.page.cache(_cacheKey).activity || {};
			act.type = type;
			im.page.cache(_cacheKey, {activity: act}, true);

			//console.log(type);
			_ele.birthdayEditor.display(type == _at.Birthday);
			_ele.todoEditor.display(type == _at.Todo);
			_ele.normalEditor.display(type == _at.Normal);
			//im.page.normalEditor.displayStatusBox(type == _at.Normal);

			//设置标题
			if(!$.env.isPhone){
				var key = im.page.reflectionEnum(_at, type).toLowerCase();
				im.page.fullscreen.title($.i18n("activity.title." + key));
			};
		},
		/*
		 * 更新完成度
		 */
		changeFinishedRate: function(calendarId, activityId, rate, finishedDate, callback){
			var data = {
				_id: activityId,
				finishedRate: rate,
				finishedDate: finishedDate
			};

			this.save(data, null, function(){
				//更新数据
				var cp = im.interface.getCompute();
				var activity = cp.findActivity(calendarId, activityId);
				if(activity){
					activity.finishedRate = rate;
				};

				$.callEvent(callback);
			});
		},
		//保存
		saveEditor: function(){
			var o = _ele.container;
			var cache = im.page.cache(_cacheKey);
			var act = cache.activity;
			var type = im.page.reflectionEnum(_at, act.type).toLowerCase();
			var data = im.page[type + "Editor"].collection();
			if(!data) return false;

			act.calendarId = _ele.calendarLink.attr("value");
			$.extend(act, data);

			//return console.log(act, new Date(act.begin));
			//return;
			//保存活动
			im.page.activity.save(act, cache.reminders, function(){
				//手机版本切换页面
				if($.env.isPhone){
					im.page.phone.switchPage(false);
				}else{
					//隐藏
					im.page.modal(_ele.container, true);
				};
				im.page.activity.reset();
				im.page.update(true, true);
			});
			return true;
		},
		/*
		 * 保存活动数据
		 */
		save: function(data, reminders, callback){
			var isPut = Boolean(data._id);
			var method = isPut ? im.e.method.PUT : im.e.method.POST;
			//data.title = data.title || $.i18n("defaultTitle.activity");
			//如果没有日历，则选择默认日历，这个逻辑要不要？
			data.calendarId = data.calendarId || im.page.getDefaultCalendar(true);
			console.log(data);
			var options = {
				data: data,
				onSuccess: function(res){
					//保存不成功，根据提醒进行处理
					//im.log(res);
					//alert("save" + res)
					//保存成功，1.关闭编辑器，2.更新日历，3.更新活动，并跳到这个活动
					var activityId = res.content._id;
					if(!isPut){
						data._id = activityId;
					};


					//更新到compute
					var cp = im.interface.getCompute();
					cp.updateActivity($.extend({}, data));
					//新建活动，保存提醒
					if(!isPut && reminders){
						im.page.reminder.batchPost(reminders, activityId);
					};

					$.callEvent(callback, [true, activityId]);
				}
			};

			//存储数据
			im.interface.passed(im.e.module.activity, method, options, data._id);
		}
	};
})();