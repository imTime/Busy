/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 11/1/12
 * Time: 8:37 下午
 * To change this template use File | Settings | File Templates.
 */
(function(){
	var _ele = {}, _slideupEvent = {};
	var _timeCacheKey = $.uniqueText("__time_");
	im.page.phone = {
		//初始化行的事件
		initRowEvent: function(){
			var suffix = ">li:not(.input)";
			var expr = "#pnlNormalEditor" + suffix;
			expr += ",#pnlTodoEditor" + suffix;
			expr += ",#pnlBirthdayEditor" + suffix;
			expr += ",#pnlTimeView" + suffix;
			expr += ",#pnlRepeatStop" + suffix;
			im.mobile.rowEvent($(expr));
		},
		//显示slideup view
		showSlideupView: function(options){
			//处理事件
			_slideupEvent.onRemove = options.onRemove;
			_slideupEvent.onEdit = options.onEdit;
			_slideupEvent.onSelected = options.onSelected;
			_slideupEvent.onDrawItem = options.onDrawItem;

			var el = _ele.slideupListView;
			var allowEdit = options.allowEdit;
			el.trigger("onText", [options.caption, null, allowEdit]);
			el.trigger("onShow");
			if(options.selected){
				_ele.listview.trigger("onSelect", [options.selected]);
			};
			_ele.slideupListView.trigger("onData", [options.data]);
			_ele.listview.toggleClass("image", options.image);
		},
		//初始化一个listview
		initSlideupListView: function(){
			_ele.listview = $("#lstListview");
			var el = _ele.slideupListView = $("#sldListView");
			el.slideupListView({
				listview: _ele.listview,
				doneText:$.i18n("button.done"),
				editText: $.i18n("button.edit"),
				backText: $.i18n("button.back")
			}).bind("onRemove", function(event, obj, value, data){
					var $callback = function(result){
						if(!result) return;
						//删除数据后，进行删除
						obj.remove();
						_ele.slideupListView.trigger("onRefresh");
					};
					$.callEvent(_slideupEvent.onRemove, [value, data, $callback]);
				}).bind("onEdit", function(event, value, data){
					//编辑
					$.callEvent(_slideupEvent.onEdit, [value, data]);
				}).bind("onSelected", function(event, obj, value, clicked, item){
					if(!clicked) return;
					el.trigger("onHide");
					$.callEvent(_slideupEvent.onSelected, [value, item]);
				}).bind("onDrawItem", function(event, obj, data){
					$.callEvent(_slideupEvent.onDrawItem, [event, obj, data]);
				});
		},
		/*
		 * 关闭slideup view
		 */
		hideSlideupView: function(){
			_ele.slideupListView.trigger("onHide");
			//unbind事件
			//_ele.listview.unbind("")
		},
		//选择重复类型
		calendarSelector: function(){
			/*
			var data = im.page.enumToArray(im.e.ActivityRepeat, function(item){
				item.text = item.key;
				delete item.key;
				return item;
			});

			this.showSlideupView({
				caption: "选择日历",
				allowEdit: false,
				data: data,
				onDrawItem: function(event, obj){

				}
			});
			*/
		},
		//切换页面
		switchPage: function(toEditor){
			$.releaseFocus();
			var x = toEditor ? -im.mobile.env.device.width : 0;
			//_ele.content.css({"left": x, "position": "absolute"});
			_ele.content.moveTo({x: x});
		},
		displayReminder: function(display){
			this.displaySlideup(_ele.slideupReminders, display);
		},
		//显示或者隐藏重复
		displayRepeat: function(display){
			this.displaySlideup(_ele.slideupRepeat, display);
		},
		//显示隐藏提醒编辑
		displayReminderEditor: function(display){
			this.displaySlideup(_ele.slideupReminderEditor, display);
		},
		slideupReminder: function(display){
			this.displaySlideup(_ele.slideupReminder, display);
		},
		displaySlideup: function(obj, display){
			var evt = display ? "onShow" : "onHide";
			obj.trigger(evt);
		},
		//显示日历选择框
		displayCalendar: function(){
			var act = im.page.activity.cache().activity;
			this.showSlideupView({
				selected: act.calendarId,
				data: im.page.getCalendars(),
				onSelected: function(value, data){
					var cache = im.page.activity.cache().activity;
					cache.calendarId = value;
					//设置文本
					im.page.selectedCalendar(_ele.editorCalendars, value);
				},
				onDrawItem: function(event, obj, data){
					obj.find("span").css("background-color", "#FF00FF");
				},
				image: true,
				caption:$.i18n("activity.title.selectCalendar"),
				allowEdit: false
			});
		},
		//初始化提醒编辑器
		initSlideupReminderEditor: function(){
			//初始化提醒
			_ele.slideupReminderEditor = $("#sldReminderEditor");
			_ele.slideupReminderEditor.slideupView({
				leftText: $.i18n("button.back"),
				rightText:$.i18n("button.save"),
				caption: $.i18n("activity.title.editReminder"),
				closeWhenLeftButton: true
			});


			_ele.slideupReminderEditor.bind("onClickRightButton", function(){
					if(im.page.reminder.saveEditor()){
						im.page.phone.displayReminderEditor();
					};
				});
		},
		//初始化提醒
		initSlideupReminder: function(){
			_ele.slideupReminders = $("#sldReminders").slideupView({
				leftText: $.i18n("button.back"),
				rightText:$.i18n("button.add"),
				caption: $.i18n("activity.title.editReminder"),
				closeWhenLeftButton: true
			}).bind("onClickRightButton", function(){
					im.page.phone.displayReminderEditor(true);
				});
		},
		selectedDate: function(type, date, allDay){
			var act = im.page.activity.cache().activity;
			act[type] = date.getTime();
			var text = im.page.formatDatetime(date, allDay, true);

			if(type == "repeatStop"){
				return $("#txtRepeatStop").val(text);
			};

			act.allDay = allDay;
			var expr = "#txtBegin, #txtTodoDate, #txtBirthday";
			if(type == "end") expr = "#txtEnd";
			$(expr).val(text);
		},
		//点击行的事件
		rowEvent: function(module, guid){
			var that = this;
			switch(guid){
				case "calendar":
					return im.page.phone.displayCalendar();
				case "repeat":
					return this.displayRepeat(true);
				case "reminders":
					return this.displayReminder(true);
				case "begin":
				case "end":
				case "repeatStop":
					var activity = im.page.activity.cache().activity;
					var date = activity[guid];
					if(!date){
						date = new Date();
					}else{
						date = new Date(date);
					};

					var options = {
						date: date,
						onSelectedDate: function(date, allDay){
							that.selectedDate(guid, date, allDay);
						},
						allDay: activity.allDay,
						showTime: module != "birthdayEditor" && guid != "repeatStop"
					};

					this.showDatepicker(options);
					break;
			}
			if(module == "normalAct"){
				//this.activityEditorRowEvent(guid);
			}
		},
		//初始化大小
		initBounds: function(){
			var device = im.mobile.env.device;
			var dw = device.width;
			var dh = device.height;
			var width = dw * 2;
			var height = dh - 44;

			_ele.frame = $("#pnlFrame");
			_ele.content = $("#pnlContent");

			_ele.content.css({
				width: width,
				height: dh
			});

			//具体
			$("#pnlContent>section, #pnlFrame").css({
				width: dw,
				height: dh
			});

			//$("#pnlContent>section
			$("body").bind("onRowEnter", function(e, data, obj){
					if(!data) return;
					im.page.phone.rowEvent.apply(im.page.phone, data.split("."));
				});

			/*
			var expr = "#pnlFrame>section.content";
			$(expr).css({width: width});
			$(expr + ">section").css({width: dw, height: height});
			*/
		},

		//初始化page的header
		initPageHeader: function(){
			var that = this;
			//初始化编辑器和timeline的标题
			var timelineText = [
				"Timeline",
				$.i18n("button.go"),
				$.i18n("button.add")];
			_ele.timeLineHeader = $("#pnlTimeline>header");
			_ele.timeLineHeader.slideupHeader()
				.trigger("onHeaderText", timelineText)
				.bind("onClickRightButton", function(){
					_ele.goPanel.hide();
					im.page.activity.createNew();
				}).bind("onClickLeftButton", function(){
					//显示日历
					_ele.goPanel.toggle();
				});

			var editorText = [
				$.i18n("activity.title.normal"),
				$.i18n("button.back"),
				$.i18n("button.save")];

			_ele.editorHeader = $("#pnlActivityEditor>header");
			_ele.editorHeader.slideupHeader()
				.trigger("onHeaderText", editorText)
				.bind("onClickRightButton", function(){
					var result = im.page.activity.saveEditor();
					if(result) that.switchPage();
				}).bind('onClickLeftButton', function(){
					that.switchPage();
				});
		},
		/*
		 * 初始化日历
		 */
		initDatepicker: function(){
			var that = this;
			_ele.datepicker = $("#pnlDatepicker");
			_ele.allDay = $("#chkAllDay").checkbox()
				.bind("onChanged", function(e, checked, clicked){
					im.page.cache(_timeCacheKey, {allDay: checked}, true);
					_ele.timepicker.hours.slider("disabled", checked);
					_ele.timepicker.minutes.slider("disabled", checked);
					that.updateTimeMonitor();
				});
			_ele.timeView = $("#pnlTimeView");

			im.page.initDate(_ele.datepicker)
				.bind("onSelectedDate", function(event, date){
					im.page.cache(_timeCacheKey, {date: date}, true);
					that.updateTimeMonitor();
				});

			_ele.datepickerSlideupView = $("#sldDatepicker").slideupView({
				leftText: $.i18n("button.back"),
				rightText:$.i18n("button.done"),
				closeWhenRightButton: true,
				closeWhenLeftButton: true
			});

			//时间的缓存
			im.page.cache(_timeCacheKey, {
				showTime: false,
				date: new Date(),
				allDay: true
			});
		},
		/*
		getDateTime: function(useTime){
			var date = _ele.datepicker.datepicker("get").start("d");
			//没有使用时间
			if(!useTime) return {date: date, allDay: true};
			//不显示时间的肯定是全天事件
			var allDay = _ele.allDay.checkbox("get");
			if(!allDay){
				var h = _ele.timepicker.hour.slider("get");
				var m = _ele.timepicker.minutes.slider("get");
				date = date.set({h:h, m:m});
			};
			return {date: date, allDay: allDay};
		},
		*/
		/*
		 * 显示日历选择器
		 */
		showDatepicker: function(options){
			options.caption = options.caption || "Select Date";
			im.page.cache(_timeCacheKey, {
				date: options.date,
				allDay: options.allDay,
				showTime: options.showTime
			});


			_ele.datepickerSlideupView.one("onClickRightButton", function(){
				var cache = im.page.cache(_timeCacheKey);
				var allDay = cache.allDay;
				if(!cache.showTime) allDay = true;
				$.callEvent(options.onSelectedDate, [cache.date, allDay]);
			}).trigger("onShow").trigger("onText", [options.caption]);
			_ele.timeView.display(options.showTime);

			if(options.showTime){
				_ele.allDay.trigger("onCheck", [options.allDay]);
				_ele.timepicker.hours.slider("set", options.date.getHours());
				_ele.timepicker.minutes.slider("set", options.date.getMinutes());
			};
		},
		//数据全部加载完成的操作
		dataLoaded: function(){
			im.page.selectedCalendar(_ele.editorCalendars);
		},
		//更新时间监控
		updateTimeMonitor: function(){
			var cache = im.page.cache(_timeCacheKey);
			//console.log(cache.allDay, cache.showTime);
			var fmt = "yyyy-MM-dd";
			if(cache.showTime && !cache.allDay) fmt += " hh:mm";
			var text = cache.date.format(fmt);
			_ele.datepickerSlideupView.trigger("onText", [text, null, null]);
			//_ele.timepicker.memo.val(text);
		},
		initTimepicker: function(){
			_ele.timepicker = {
				minutes: $("#sliderMinutes"),
				hours: $("#sliderHour")
				//,memo: $("#txtTime")
			};


			var sliderWidth = 190;
			var sliderLeft = 110;
			var that = this;
			_ele.timepicker.hours.slider({
				value: 5,
				width: sliderWidth,
				left: sliderLeft,
				min: 0,
				max: 23
			}).bind("onChanged", function(e, value, userTrigger){
					var date = im.page.cache(_timeCacheKey).date.set({h: value});
					im.page.cache(_timeCacheKey, {date: date}, true);
					that.updateTimeMonitor();
				});

			_ele.timepicker.minutes.slider({
				value: 30,
				width: sliderWidth,
				left: sliderLeft,
				min: 0,
				max: 59
			}).bind("onChanged", function(e, value){
					var date = im.page.cache(_timeCacheKey).date.set({m: value});
					im.page.cache(_timeCacheKey, {date: date}, true);
					that.updateTimeMonitor();
				});
		},
		/*
		 * 延时初始化，一般用于imbox，用户需要尽快看到界面
		 */
		delayInit: function(){
			var expr = ">span.content";
			expr = "#textBirthCalendar, #textTodoCalendar, #textNormalCalendar";
			_ele.editorCalendars = $(expr);

			_ele.goPanel = $("#pnlGo");
			_ele.goPanel.bind("onSelectedDate", function(event, date){
				_ele.goPanel.hide();
			});

			//初始化重复
			_ele.slideupRepeat = $("#sldRepeat").slideupView({
				rightText: $.i18n("button.done"),
				leftText:false,
				caption: $.i18n("activity.title.repeat"),
				closeWhenRightButton: true
			});

			this.initSlideupReminderEditor();
			this.initSlideupReminder();
			this.initDatepicker();
			this.initTimepicker();
			this.initSlideupListView();
			this.initRowEvent();
		},
		//初始化
		init: function(delayInit){
			/*
			_ele.fullscreen = $("#fullscreen");
			_ele.fullscreenMemo = $("#fullscreen>memo");

			_ele.fullscreen.css({
				height: im.mobile.env.device.height,
				width: im.mobile.env.device.width
			});
			*/

			im.page.sign.init();
			this.initBounds();
			this.initPageHeader();
			im.i18n.mapping("phone");
			if(!delayInit) this.delayInit();
			//im.page.sign.show(true);
		}
	};
})();