(function(){
	var _ele;
	im.page.birthdayEditor = {
		init: function(){
			_ele = {
				reminderLink: $("#lnkBirthReminder"),
				who: $("#txtWhoBirth"),
				birthday: $("#txtBirthday"),
				local: $("#chkBirthLocal"),
				localRow: $("#rowBirthLocal")
			};

			im.page.initDateInput(_ele.birthday);

			/*
			_ele.birthday.bind("onDisplayLocal", function(event){
				_ele.local.trigger("onCheck", [true]);
			});
			*/

			//启用本地日历，则显示农历
			if($.env.enableLocal){
				_ele.local.checkbox($.i18n("localText"));
				//手机版本才需要判断是否显示localrow
				if($.env.isPhone) _ele.localRow.show();
			};

			//非手机
			if(!$.env.isPhone){
				$.tap(_ele.reminderLink, function(){
					im.page.activity.showReminder();
				});
			}
		},
		/*
		 * 更新提醒上的文字
		 */
		updateReminderText: function(text){
			_ele.reminderLink.text(text);
		},
		/*
		 * 填充
		 */
		fill: function(activity){
			_ele.who.val(activity.title);
			this.fillDate(new Date(activity.begin));
			//启用了本地日历
			if($.env.enableLocal){
				var isLocal = activity.local == $.i18n("local");
				_ele.local.trigger("onCheck", [isLocal]);
			};
			//_ele.
		},
		//填充日期
		fillDate: function(date){
			im.page.dateInput(_ele.birthday, date, true);
		},
		//清除
		reset: function(){
			_ele.who.val("");
		},
		//收集数据
		collection: function(){
			var data = {
				allDay: true,
				title: _ele.who.val().trim(),
				begin: im.page.dateInput(_ele.birthday).start("d").getTime(),
				repeat: im.e.ActivityRepeat.Yearly
			};


			if($.env.enableLocal && _ele.local.checkbox("get")){
				data.local = $.i18n("local");
			};

			//生日永不停止
			data.repeatStop = im.config.maxDateTime;
			data.title = data.title || $.i18n("defaultTitle.birthday");
			data.end = data.begin;
			return data;
		}
	};
})();