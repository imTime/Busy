/*
 活动相关
 */
(function(){
	var _ele;
	var _unknown = "unknown";
	im.page.normalEditor = {
		/*
		 * 初始化编辑器
		 */
		init: function(){
			var o = $("#actEditor");
			_ele = {
				container: o,
				title: $("#txtActTitle"),
				begin: $("#txtBegin"),
				end: $("#txtEnd"),
				beginTime: $("#txtBeginTime"),
				endTime: $("#txtEndTime"),
				chkAllDay: $("#chkAllDay"),
				//chkEnd: $("#chkEnd"),
				statusBox:o.find(">div.statusBox"),
				repeatLink: $("#lnkRepeat"),
				reminderLink: $("#lnkReminder"),
				rowEnd:$("#rowActEnd"),
				beginEndTime: $("#txtBeginTime, #txtEndTime")
			};

			var that = this;
			//初始化重复
			im.page.repeat.init();
			im.page.initDateInput(_ele.begin);
			im.page.initDateInput(_ele.end);
			/*
			_ele.chkEnd.checkbox("End")
				.bind("onChanged", function(event, checked){
					_ele.rowEnd.display(checked);
					that.dateValidator();
				});	//.trigger("onCheck", [false]);
			*/

			//非手机版本的操作
			if(!$.env.isPhone){
				//初始化状态重复
				/*
				im.page.status.init({
					//选中状态
					onSelected: im.page.activity.setStatusBox
				});
				*/

				$("#txtBegin, #txtEnd").bind("onChangedDate", function(){
					that.dateValidator(this);
				});

				_ele.beginEndTime.smartTime()
					.trigger("onSetValue", new Date())
					.bind("onChanged", function(){
						that.dateValidator(this);
					});

				//点击全天事件
				_ele.chkAllDay.checkbox($.i18n("activity.allDay"))
					.bind("onChanged", function(event, checked, clicked){
						var attr = "readonly", klass = "disabled";
						if(checked){
							_ele.beginEndTime.attr(attr, attr);
						}else{
							_ele.beginEndTime.removeAttr(attr);
						};
						_ele.beginEndTime.toggleClass(klass, checked);
						//非用户点击，不需要对缓存中的数据进行操作，因为在初始化的时候也会触发这个事件，但缓存可能还没有建立
						if(!clicked) return;
						var activity = im.page.activity.cache().activity;
						if(activity) activity.allDay = checked;
					}).trigger("onCheck", [true]);

				//点击重复链接
				$.tap(_ele.repeatLink, im.page.activity.showRepeat);
				//点击提醒的链接
				$.tap(_ele.reminderLink, im.page.activity.showReminder);
				//点击状态
				$.tap(_ele.statusBox, function(){
					//获取当前选择的状态
					var cache = o.cache().activity;
					im.page.status.show(cache.statusId, o.height());
				});
			};
		},
		displayStatusBox: function(display){
			_ele.statusBox.display(display);
		},
		//重置编辑器
		reset: function(){
			_ele.title.val("");
			//this.setStatusBox();
			//this.updateRepeatText();
		},
		//填充日期
		fillDate: function(begin, end, allDay){
			im.page.dateInput(_ele.begin, begin, allDay);
			im.page.dateInput(_ele.end, end, allDay);
		},
		/*
		 * 填充数据
		 */
		fill: function(activity){
			var begin = new Date(activity.begin);
			var end = new Date(activity.end);
			this.fillDate(begin, end, activity.allDay);

			_ele.title.val(title);
			this.updateRepeatText();
			/*
			 //处理状态
			 var cp = im.interface.getCompute();
			 var status = cp.getStatusWithId(activity.statusId) || {};
			 var color = status.color || activity.color;
			 this.setStatusBox(status._id, status.color);
			 */
		},
		/*
		 * 更新提醒上的文字
		 */
		updateReminderText: function(text){
			_ele.reminderLink.text(text);
		},
		/*
		 * 设置状态的颜色
		 */
		setStatusBox: function(statusId, color){
			var o = _ele.container;
			//未知状态（状态未知颜色不一定未知，v1版本只有颜色没有状态，兼容v1）
			var isUnknown = !color || statusId == "-1";
			//将状态的id写入容器的组成中
			var activity = im.page.activity.cache().activity;
			activity.color = color;
			activity.statusId = statusId;
			im.page.activity.cache({activity: activity}, true);

			//背景色
			var bg = color ? $.lineGradient(color) : "transparent";
			_ele.statusBox.toggleClass(_unknown, isUnknown)
				.css("background", bg);;
		},
		//更新重复上的文字
		updateRepeatText: function(){
			var activity = im.page.activity.cache().activity;
			//更改显示上面的字
			var text = im.page.getRepeatText(
				activity.repeat, activity.repeatStop, activity.local);
			_ele.repeatLink.text(text);
		},
		/*
		 * 校验时间的正确性，如果不正确，返回false，并将结束日期的class改为错误的样式
		 * 如果正确，返回开始与结束的时间
		 */
		dateValidator: function(target){
			var activity = im.page.activity.cache().activity;
			var begin = im.page.dateInput(_ele.begin);
			var end = im.page.dateInput(_ele.end);

			//非手机版本才需要获取时间
			if(!activity.allDay && !$.env.isPhone){
				begin = begin.start("d").set(_ele.beginTime.smartTime("get"));
				end = end.start("d").set(_ele.endTime.smartTime("get"));
			};

			begin = begin.getTime();
			end = end.getTime();

			//检测是否发生错误
			var dateError = end < begin;
			im.page.inputError(_ele.end, dateError);
			if(!$.env.isPhone) im.page.inputError(_ele.endTime, dateError);
			if(dateError) return false;

			return {
				begin: begin,
				end: end
			};
		},
		/*
		 * 收集数据，如果数据校验不合法，返回false
		 */
		collection: function(){
			var valid = this.dateValidator();
			if(!valid) return false;
			var data = {
				title: _ele.title.val().trim(),
				begin: valid.begin,
				allDay: valid.allDay,
				end: valid.end
			};
			data.title = data.title || $.i18n("defaultTitle.birthday");
			return data;
		}
	};
})();