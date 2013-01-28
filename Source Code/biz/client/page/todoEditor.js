/*
 * todo编辑器
 */
(function(){
	var _ele;
	im.page.todoEditor = {
		init: function(){
			_ele = {
				title: $("#txtTodoTitle"),
				date: $("#txtTodoDate"),
				time: $("#txtTodoTime"),
				allDay: $("#chkTodoAllDay"),
				reminderLink: $("#lnkTodoReminder"),
				rowTodoTime: $("#rowTodoTime")
			};

			im.page.initDateInput(_ele.date);

			if(!$.env.isPhone){
				_ele.time.smartTime()
					.trigger("onSetValue", new Date());

				$.tap(_ele.reminderLink, function(){
					im.page.activity.showReminder();
				});

				//全天
				_ele.allDay.checkbox($.i18n("activity.allDay"))
					.bind("onChanged", function(event, checked){
						_ele.time.enable(!checked);
						//_ele.rowTodoTime.display(!checked);
					}).trigger("onCheck", [true]);
			};
		},
		//重置编辑器
		reset: function(){
			_ele.title.val("");
		},
		//填充日期
		fillDate: function(date, end, allDay){
			im.page.dateInput(_ele.date, date, allDay);
		},
		/*
		 * 填充数据
		 */
		fill: function(activity){
			_ele.title.val(activity.title);
			this.fillDate(new Date(activity.begin));
		},
		/*
		 * 更新提醒上的文字
		 */
		updateReminderText: function(text){
			_ele.reminderLink.text(text);
		},
		/*
		 * 收集数据
		 */
		collection: function(){
			var data = {
				title: _ele.title.val().trim()
			};

			//取日期，非全天todo要取时间
			var begin = im.page.dateInput(_ele.date);
			var activity = im.page.activity.cache().activity;
			//手机版用户不需要通过输入框设置时间
			if(!activity.allDay && !$.env.isPhone){
				begin = begin.start("d").set(_ele.time.smartTime("get"));
			};
			data.end = data.begin = begin.getTime();
			data.repeat = im.e.ActivityRepeat.NoRepeat;
			data.title = data.title || $.i18n("defaultTitle.todo");
			return data;
		}
	};
})();