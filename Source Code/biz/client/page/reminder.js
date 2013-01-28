/*
 * 提醒相关
 */
(function(){
	var _ele = {}, _cacheKey = $.uniqueText("__cache_");
	im.page.reminder = {
		initSymbol: function(){
			//初始化listview
			var data = [
				{text:$.i18n("reminders.before"), value: "-"},
				{text: $.i18n("reminders.after"), value: "+"}
			];

			_ele.symbol.listView(data, {selected: "-"});
		},
		//初始化单位
		initUnit: function(){
			var data = [
				{text: $.i18n("reminders.days"), value: "d"},
				{text: $.i18n("reminders.hours"), value: "h"},
				{text: $.i18n("reminders.minutes"), value: "m"}
				//{text: $.i18n("reminders.custom"), value: "-1"}
			];
			_ele.unit.listView(data, {selected: "h"});
		},
		//提醒类型
		initReminderBy: function(){
			var rbEnum = im.e.ReminderBy;
			var text = $.i18n("reminders.reminderBy");
			var data = im.page.enumToArray(rbEnum, function(item){
				if(item.value != rbEnum.Popup && item.value != rbEnum.Mail) return false;
				item.text = text.format($.i18n("e.ReminderBy._" + item.value));
				delete item.key;
				return item;
			});

			_ele.reminderBy.listView(data, {selected: rbEnum.Popup});
		},
		//初始化列表
		initListView: function(){
			_ele.listview.listView()
				.bind("onDrawItem", function(event, obj, data){
					//检测首次提醒是否在过去的时间
					var act = im.page.activity.cache().activity;
					if(act.begin && act.repeat == im.e.ActivityRepeat.NoRepeat){
						//转换为毫秒
						var start = act.begin + data.delay * 60 * 1000;
						obj.toggleClass("past", start <= new Date().getTime());
					};

					obj.attr("delay", data.delay);
					obj.attr("reminderBy", data.reminderBy);
				}).bind("onSelected", function(e, obj, value, clicked, data){
					if(!clicked) return;
					im.page.reminder.edit(data.delay, data.reminderBy, data.value);
				}).bind("onControl", function(e, obj, value, data){
					obj.hide("slow");
					im.page.reminder.remove(data.value, function(){
						obj.remove();
					});
				});
		},
		//初始化提醒
		init: function(options){
			//回调
			this.options = options || {};
			//TODO 提醒的输入框应该可以5d3h这样的格式
			//当用户输入这种格式后，单位会自动选择为自定义，如果用户单位选择为自定义没有输入格式，则默认分钟
			var o = $("#pnlReminders");
			_ele = {
				container: o,
				noReminders: $("#tipsNoReminders"),
				listview:$("#lstReminders"),
				symbol: $("#lstReminderSymbol"),
				value: $("#txtReminderValue"),
				unit: $("#lstReminderUnit"),
				reminderBy: $("#lstReminderBy"),
				editButton:o.find("#btnEditReminder")
			};

			//非手机版本特有的操作
			if(!$.env.isPhone){
				//失去焦点
				_ele.value.bind('blur', function(){
					var value = _ele.value.val() || "0";
					//数字不处理
					if(value.isNumber()) return;
					//自动处理+5d6h这类格式
				}).bind("onEnter", function(){
						_ele.value.trigger("blur");
					});
				im.page.keypress(_ele.value);
				//点击保存按钮
				$.tap(_ele.editButton, this.saveEditor);
			}

			this.initListView();
			this.initSymbol();
			this.initUnit();
			this.initReminderBy();
		},
		/*
		 * 是否显示提醒
		 */
		displayTips: function(){
			var count = (im.page.activity.cache().reminders || []).length;
			//如果没有提醒，则显示提醒
			_ele.noReminders.display(count == 0);
			_ele.editButton.display(count < im.config.maxReminderPerActivity);
			_ele.listview.display(count > 0);
		},
		/*
		 * 加载活动的提醒，将活动的提醒加载到容器的缓存中
		 * 如果提醒已经存在，则不从服务器中加载
		 * @params {Array, ObjectId} 提醒的数据(已经加载过数据，避免多次加载)，或者活动的ID(从服务器加载数据)
		 * @params {Function} callback 从服务器中加载数据后，回调
		 */
		load: function(){
			var $pushData = function(datas){
				//将数据加入到提醒编辑器中去
				datas.forEach(function(item, index){
					im.page.reminder.update(item.delay, item.reminderBy, item._id);
				});
				im.page.reminder.displayTips();
				//更新提醒显示的文字
				im.page.activity.updateReminderText();
			};

			var cache = im.page.activity.cache();
			var actCache = cache.activity;
			var rmdCache = cache.reminders;
			_ele.listview.empty();
			//检查数据是否存在

			//数组对象，不需要
			if(rmdCache || !actCache._id){
				return $pushData(rmdCache || []);
			};

			//读取活动下面提醒
			var options = {
				data: {
					activityId: actCache._id
				},
				//成功加载数据
				onSuccess: function(res){
					var datas = res.content;
					$pushData(datas);
					rmdCache = datas;
				}
			};

			//获取数据
			im.interface.passed(im.e.module.reminder, im.e.method.GET, options);
		},
		/*
		 * 编辑提醒，将数据填充到提醒编辑器中去
		 * @params {Number} delay 提醒的延时
		 * @params {Number} reminderBy 提醒的方式
		 * @params {ObjectId} reminderId 提醒ID
		 */
		edit: function(delay, reminderBy, reminderId){
			var symbol = delay >= 0 ? "+" : "-";
			var delay = Math.abs(delay);
			var unit = '-1', value;
			var m = 1, h = m * 60, d = h * 24;

			//TODO 可以简化下列代码
			if(delay % d == 0){				//整天
				unit = "d";
				value = delay / d;
			}else if(delay % h == 0){			//整小时
				unit = "h";
				value = delay / h;
			}else{
				unit = "m";
				value = delay / m;
			};

			_ele.value.val(value);
			_ele.unit.trigger("onSelect", [unit]);
			_ele.reminderBy.trigger("onSelect", [reminderBy]);

			//把正在编辑的提醒ID写到缓存中
			im.page.cache(_cacheKey, {
				reminderId: reminderId
			}, true);

			//手机版本
			if($.env.isPhone){
				im.page.phone.displayReminderEditor(true);
			}else{
				this.setEditButton(true);
			};
		},
		//设置编辑按钮
		setEditButton: function(isEdit){
			_ele.editButton.toggleClass("edit", isEdit);
			var y = isEdit ? 180 : 0;
			_ele.editButton.moveTo({y: y});
		},
		/*
		 * 删除提醒
		 */
		remove: function(reminderId, callback){
			var cache = im.page.cache(_cacheKey);
			var $removed = function(){
				im.page.activity.updateReminder(reminderId, true);
				//当前删除的正在编辑，清空
				if(cache.reminderId == reminderId){
					im.page.reminder.clear();
				}else{
					im.page.reminder.displayTips();
				};
				$.callEvent(callback);
			};

			//没有保存，所以没有activityId
			var act = im.page.activity.cache().activity;
			//还没有保存到数据库，直接删除
			if(!act._id){
				return $removed();
			};

			//到数据库删除
			var options = {
				onSuccess: function(res){
					// TODO 根据返回原因操作
					if(!res.result){
						//删除不成功，提醒操作
						return;
					};
					$removed();
				}
			};

			im.interface.passed(im.e.module.reminder, im.e.method.DELETE, options, reminderId);
		},
		/*
		 * 更新提醒，如果不存在，在后面添加，存在则更新
		 */
		update: function(delay, reminderBy, reminderId){
			var text = $.i18n("getReminderText", [delay, reminderBy]);
			//检查reminderId是否存在
			_ele.listview.trigger("onUpdate", {
				value: reminderId,
				text: text,
				delay: delay,
				reminderBy: reminderBy
			});

			im.page.activity.updateReminder(reminderId, delay, reminderBy);
			im.page.reminder.displayTips();
		},
		/*
		 * 批量新建提醒，用于新建活动
		 */
		batchPost: function(reminders, activityId, callback){
			var index = 0;
			var $post = function(){
				if(index >= reminders.length) return $.callEvent(callback);
				var data = reminders[index];
				data.activityId = activityId;
				var options = {
					data: data,
					onSuccess: function(res){
						//保存失败
						if(!res.result){

							return $.callEvent(callback);
						};
						index++;
						$post();
					}		//end onSuccess
				};

				//post提醒
				im.interface.passed(im.e.module.reminder, im.e.method.POST, options);
			};

			$post();
		},
		/*
		 * 向interface push数据
		 */
		push: function(reminderId, data, callback){
			var method = reminderId ? im.e.method.PUT : im.e.method.POST;
			var options = {
				data: data,
				onSuccess: function(res){
					//超出最大允许创建的提醒数量
					var content = res.content;
					if(res.command.code == im.e.SaveReminder.ReminderLimit){
						var error = $.i18n("activity.message.reminderOverLimit");
						error = error.format(content.maxReminderCount, content.currentReminderCount);
						return im.page.msgbox(error);
					};

					//保存成功
					var reminderId = content._id;
					var r = im.page.reminder;
					r.update(data.delay, data.reminderBy, reminderId);
					r.clear();
				}
			};

			//保存提醒
			im.interface.passed(im.e.module.reminder, method, options, reminderId);
		},
		//保存编辑器中的内容
		saveEditor: function(){
			var value = parseFloat(_ele.value.val());
			if(value <= 0) return false;
			var cache = im.page.activity.cache();
			var symbol = _ele.symbol.listView("get");
			var unit = _ele.unit.listView("get");
			var reminderBy = _ele.reminderBy.listView("get");
			var activityId = cache.activity._id;

			var tick = {
				d: 1440,
				h: 60,
				m: 1
			};

			//转换为分钟
			value = value * tick[unit];
			value = symbol + value;

			var data = {
				delay: value,
				reminderBy: reminderBy,
				activityId: activityId
			};

			im.page.reminder.save(data, function(){

			});
			return true;
		},
		/*
		 * 保存提醒
		 */
		save: function(data, callback){
			var reminderId = im.page.cache(_cacheKey).reminderId;
			//已保存的活动，直接保存
			if(data.activityId){
				im.page.reminder.push(reminderId, data);
			}else{
				//没有提醒的ID，则先产生一个随机的ID
				reminderId = reminderId || $.uniqueText("__reminder_");
				//未保存的活动，先提交到缓存
				im.page.reminder.update(data.delay, data.reminderBy, reminderId);
				im.page.reminder.clear();
			};
		},
		/*
		 * 清除提醒编辑器
		 */
		clear: function(){
			im.page.cache(_cacheKey, null);
			//_ele.value.val(0);
			//手机版本不需要后续的动作
			if($.env.isPhone) return;
			this.setEditButton(false);
			this.displayTips();
		},
		/*
		 * 显示提醒
		 */
		show: function(){
			var o = _ele.container;
			if($.env.isPhone){
				im.page.phone.displayReminder(true);
			}else{
				//设置二级标题
				var f = im.page.fullscreen;
				f.showBack(function(){
					o.fadeOut();
					return true;
				}, $.i18n("activity.title.reminder"));
				_ele.container.fadeIn();
			};
		}
	};
})();