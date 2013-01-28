/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/14/12
 * Time: 8:18 下午
 * 实现日期选择器，可以选择时间，也可以输入，可以在日期中添加更多的内容，支持农历
 */


/*
	实现对日历的扩展，可以显示整月的日历，可以用于datepicker，也可以用于其它地方显示，比如说大日历
	1.实现整月日历
	2.可以向前后后翻页
	3.可以跳转到指定日期
 */
(function($){
	var FORMATKEY = "yyyyMMdd";
	var _cacheName = $.uniqueText("calendar_");
	//实现日历
	var calendar = function(container, options){
		this.options = {
			//是否显示周的那一行
			showWeek: true,
			//如果指定行数，则可以实现周历，或者只显示数周的日历
			rowCount: 7,
			//是否要显示整个月份，如果显示整月份，不管开始时间从何时开始，都会把开始时间调到整月
			wholeMonth: true,
			//开始时间
			start: new Date(),
			/*
				不显示非本月的数据，因为8*7=56行数据，但实际是一个月只有30天，有时候会多出两行出来
				但不显示的结果就会造成界面时长时短
			 */
			justThisMonth: false,
			//绘制日期的回调，可以对这个单元格进行其它操作，比如增加其它元素
			onDrawDate: null,
			//自动渲染第一个
			autoRender: true
		};
		$.extend(this.options, options);
		this.element = {
			container: container
		};

		this.start = this.options.start.clone();
		this.init();
	};

	calendar.prototype = {
		//初始化
		init: function(){
			var el = this.element;
			var ops = this.options;

			var week = '<th>{0}</th>';
			var cell = '<td />';
			var i18nWeek = this.options.calendarWeekName, html = '<table class="mf_calendar">';

			//循环生成基础的html元素
			for(var i = 0; i < ops.rowCount; i++){
				html += '<tr>';
				for(var j = 0; j < 7; j++){
					if(i == 0 && ops.showWeek){
						html += week.format(i18nWeek[j] || j);
					}else{
						html += cell;
					};			//end if
				};				//end for j
				html += '</tr>';
			};					//end for i
			html += "</table>";

			//写入html
			el.container.html(html);
			el.dayCells = $("td", el.container);

			//触模屏不用hover功能
			if(!$.env.isTouch){
				el.dayCells.hover(function(){
					$(this).toggleClass("active");
				});
			};

			var lastClick = null;
			//绑定点击事件
			$.tap(el.dayCells, function(e){
				var obj = $(this);
				var date = obj.attr("date");
				var klass = "selected";
				date = date.toDate(FORMATKEY);

				obj.addClass(klass);
				if(lastClick) lastClick.removeClass(klass);
				lastClick = obj;
				//选择了某个日期，回调操作
				$.callEvent(ops.onSelectedDate, [date], obj);
				//取消冒泡(这个在触屏下好像有问题，具体什么问题忘记了)
				e.cancelBubble = true;
			});

			if(ops.autoRender) this.render();
		},
		//渲染日历
		render: function(){
			var ops = this.options, el = this.element;
			//获取整月
			var month = this.start.getWholeMonth(false, ops.rowCount);
			//如果是获取整月，则取得整月的第一天，否则获取周日的时间
			var min = ops.wholeMonth ? month.first.clone() : this.start.start("w");
			var current = min.clone();
			//第一天和最后一天
			var count = el.dayCells.length;
			var today = new Date().format(FORMATKEY);
			var thisMonth = this.start.getMonth();
			//循环每一天，设置日期
			el.dayCells.each(function(index, obj){
				obj = $(obj);
				obj.removeAttr("class").empty();
				var value = current.format(FORMATKEY);
				var text = current.getDate();		//显示日期
				obj.attr('date', value);

				//添加Class样式
				var clsName = "";
				if(today == value) clsName += "mf_today";

				if(current.getMonth() != thisMonth) clsName += " mf_notThisMonth";
				obj.addClass(clsName);

				//绘制单元格的回调，回调可以直接操作单元格，如果返回为false，则不会再往单元格中填充数据
				var result = $.callEvent(ops.onDrawCell, [current.clone(), text], obj, text);
				if(result !== false) obj.html(result || text);
				//向后顺延一天
				current.dateAdd("1d", true);
			});

			//是否需要显示非本月的部分
			if(ops.justThisMonth && ops.wholeMonth){

				//显示或者或者隐藏多余的
				var last = this.start.end("M");
				//获取这个月有多少天，包括开始日期的多余部分
				var days = last.dateDiff("d", month.first);
				var week = Math.ceil(days / 7);
				if(!ops.showWeek) week--;

				var o = this.element.container;
				//显示所有行
				$(">tr", o).show();
				$(">tr:gt({0})".format(week), o).hide();
			}

			//调用渲染完毕事件
			$.callEvent(ops.onRendered, [el.dayCells, min, current.dateAdd("-1d")]);
		},
		//上一个时间段
		next: function(){
			this.start.dateAdd("1M", true);
			this.render();
		},
		//下一个时间段
		previous: function(){
			this.start.dateAdd("-1M", true);
			this.render();
		},
		//跳到指定日期
		gotoDate: function(date){
			this.start = date;
			this.render();
		}
	};

	//实现jQuery的方法
	$.fn.calendar = function(){
		var args = arguments;
		//第一个参数为string，表示要执行某个动作
		if(typeof(args[0]) != "string"){
			var ops = args[0] || {};

			return this.each(function(){
				var obj = $(this);
				var dpObj = new calendar(obj, ops);
				obj.data(_cacheName, dpObj);
			});				//end each
		};					//end if typeof

		//可以针对多个进行操作
		this.each(function(){
			var obj = $(this);
			var dpObj = obj.data(_cacheName);
			switch(args[0]){
				case "next":			//下一个时间段
					dpObj.next();
					break;
				case "previous":			//上一个时间段
					dpObj.previous();
					break;
				case "gotoDate":				//跳到指定日期
					dpObj.gotoDate(args[1]);
					break;
			}		//end switch
		});
	};
})(jQuery);


/*
 * 日期选择器
 * 1.可以直接显示在容器中，也可以点击按钮或者input打开
 * 2.如果是通过点击方式打开，一个页面只有一个，过多没有意义。
 */
(function($){
	var CLIPID = $.uniqueText("__datepicker_");
	var TIMEFORMAT = "hh:mm";
	var DATEFORMAT = "yyyyMMdd";
	var CACHENAME = $.uniqueText("mfdp_cache_");
	var OPTION = $.uniqueText("mfdp_option_");
	var INPUTCACHE = $.uniqueText("mfdp_input_cache_");
	var _view = {
		month: "month",
		date: "date",
		time: "time",
		year: "year"
	};

	var _viewLevel = {
		date: 0,
		week: 1,
		month: 2,
		year: 3
	};

	/*
	 * 实现日历
	 */
	var datepicker = function(container, options){
		//获取当前的年
		var curYear = options.start.getFullYear();
		var ops = this.options = options;
		var selected = (ops.selected || ops.start).clone();
		this.info = {
			h: 0,
			m: 0,
			pm: false,
			currentYear: curYear,
			view: ops.view,
			selected: selected,				//当前选中的时间
			date: ops.start.clone(),
			drawed: false
		};

		this.info.minYear = curYear - Math.floor(ops.yearRowCount * ops.yearColCount / 2);
		this.element = {
			container: container,
			source: container				//默认源就是容器，但有时候可能不一样
		};
		this.init();
	};

	//日历的属性
	datepicker.prototype = {
		changeSource: function(source, options){
			this.element.source = source;
			this.options = options;
		},
		//隐藏
		showView: function(view){
			var el = this.element, ops = this.options;
			for(var key in _view){
				el[key].display(view == key);
			};

			//el.dateFooter.display(ops.showTime && view == _view.date);
			el.today.display(view == _view.date);
		},
		//设置日历的caption
		setCaption: function(){
			var ops = this.options;
			var info = this.info;
			var el = this.element;
			var caption = $.callEvent(ops.getCaption, [info.date, info.view, info.minYear]);
			if(!caption){
				var fmt =  ops.captionFormat[info.view];

				switch(info.view){
					case _view.date:
						caption = info.date.format(fmt, ops.shortMonthName);
						break;
					case _view.year:
						caption = fmt.format(info.minYear, info.maxYear);
						break;
					case _view.month:
						caption = fmt.format(info.currentYear);
						break;
				};
			};

			el.caption.html(caption);
			//this.selectedTime(info.date.getHours(), info.date.getMinutes());
		},
		//改变时间
		changeTime: function(){
			var el = this.element;
			var objAmpm = $(">div.mfdp_ampm>a.selected", el.time);
			var objHour = $(">div.mfdp_hours>a.selected", el.time);
			var objMinute = $(">div.mfdp_minutes>a.selected", el.time);

			var h = parseInt(objHour.attr("value"));
			var m = parseInt(objMinute.attr("value"));
			var ampm = objAmpm.attr("value");

			if(ampm == "pm") h = h + 12;

			//更改选择的时间
			this.setTime(h, m);
		},
		//选择某个时间
		selectedTime: function(){
			var info = this.info;
			var o = {
				"mfdp_ampm": info.pm ? "pm" : "am",
				"mfdp_hours": info.h,
				"mfdp_minutes": info.m
			};

			var cls = "selected";
			var el = this.element;
			for(var key in o){
				var expr = ">div.{0}>a.selected".format(key);
				el.time.find(expr).removeClass(cls);
				expr = '>div.{0}>a[value="{1}"]'.format(key, o[key]);
				el.time.find(expr).addClass(cls);
			};
		},
		//根据选中的日期和时间，重新组合时间
		complexDate: function(){
			var ops = this.options, info = this.info;
			/*
			if(!ops.allDay){
				info.selected.setHours(info.h.to24Hour(info.pm));
				info.selected.setMinutes(info.m);
			}
			*/
			return info.selected;
		},
		//初始化
		init: function(){
			var that = this;
			var el = that.element;
			var o = el.container;
			var ops = that.options;
			var info = that.info;

			//添加头部相关内容
			var html = '<div class="mfdp_time mfdp_container"></div>';
			html += '<table class="mfdp_header"><tr>';
			html += '<td class="mfdp_previous" flag="previous"><span>{0}</span></td>';
			html += '<td class="mfdp_caption" flag="caption"></td>';
			html += '<td class="mfdp_today" flag="today">{2}</td>';
			html += '<td class="mfdp_next" flag="next"><span>{1}</span></td>';
			html += '</tr></table>';
			html = html.format(ops.previousText, ops.nextText, ops.todayText);
			//添加day/month/year
			html += '<div class="mfdp_date mfdp_container"></div>';
			html += '<div class="mfdp_month mfdp_container"></div>';
			html += '<div class="mfdp_year mfdp_container"></div>';
			o.html(html);

			//取出各元素备用
			el.header = $(">table", o);
			el.previous = $(">table td[flag='previous']", el.header);
			el.next = $("td[flag='next']", el.header);
			el.caption = $("td[flag='caption']", el.header);
			el.today = $("td[flag='today']", el.header);
			el.date = $(">div.mfdp_date", o);
			el.month = $(">div.mfdp_month", o);
			el.year = $(">div.mfdp_year", o);
			el.time = $(">div.mfdp_time", o);

			//绑定header上的事件
			$.tap($("td", el.header), function() {
				var flag = $(this).attr("flag");
				switch (flag) {
					case "caption":
						var nextView = {
							"date": _view.month,
							"month": _view.year
						};
						that.changeView(nextView[info.view]);
						break;
					default:
						//上一页下一页
						that["{0}".format(flag)]();
						return;
				}
			});

			this.initDate();
			this.initMonth();
			this.initYear();
			this.initTime();
		},
		//初始化时间的面板
		initTime: function(){
			var html = '<div class="mfdp_ampm"><a class="close"></a>';
			html += '<a value="am" unit="ampm">{0}</a><a value="pm" unit="ampm">{1}</a></div>';
			html = html.format("AM", "PM");
			html += '<div class="mfdp_hours">';
			//小时
			for(var i = 1; i <= 12; i ++){
				html += '<a value="{0}" unit="h">{1}</a>'.format(i,  + i.zeroize(2, true));
			};
			html += '</div>';

			//分钟
			html += '<div class="mfdp_minutes">'
			for(var i = 0; i < 12; i++){
				var value = i * 5;
				html += '<a value="{0}" unit="m">{1}</a>'.format(value, value.zeroize(2, true));
			};
			html += '</div>';

			var el = this.element;
			el.time.html(html);

			//事件
			var that = this, info = this.info;
			$.tap($("a", el.time), function(){
				var obj = $(this);
				//点击关闭
				if(obj.hasClass("close")){
					el.time.hide();
					return;
				};

				var cls = "selected";
				$("a.selected", obj.parent()).removeClass(cls);
				obj.addClass(cls);

				var value = obj.attr("value");
				var unit = obj.attr("unit");
				if(unit == "ampm"){
					info.pm = value == "pm";
				}else{
					info[unit] = parseInt(value);
				};

				that.setTime();
			});

			el.time.bind("mouseleave", function(){
				//el.time.fadeOut();
			});
		},
		//初始化天
		initDate: function(){
			var el = this.element;
			var ops = this.options;
			var info = this.info;
			var that = this;
			//实现Calendar
			el.date.calendar({
				start: info.date,
				autoRender: false,
				calendarWeekName: ops.calendarWeekName,
				//渲染单元格
				onDrawCell: function(date, text){
					/*
					 * 1.实现本地化
					 * 2.获取当天活动总数
					 */
					if(ops.start.format(DATEFORMAT) == date.format(DATEFORMAT)){
						this.addClass("mf_selected");
					};
					return $.callEvent(ops.onDrawCell, [_view.date, date], this, text);
				},
				//渲染完成
				onRendered: function(dayCells, min, max){
					el.source.trigger("onRendered", [info.view, dayCells, min, max]);
				},
				//选中日期
				onSelectedDate: function(date){
					that.selectedDate(date);
					el.source.trigger("onSelectedDate", [date]);
					//el.source.trigger("onSelectedDate", [date], this);
					//$.callEvent(ops.onSelected, [date], this);
				}
			});

			/*
			//添加时间的选项
			var html = '<footer><div class="mfdp_allDay" /><input type="text" />';
			html += '<div class="mfdp_text" /></footer>';
			el.dateFooter = $(html);
			el.date.append(el.dateFooter);
			el.dateText = el.dateFooter.find('>div.mfdp_text');

			el.timeInput = $('input[type="text"]', el.dateFooter);
			el.allDay = el.dateFooter.find(">div.mfdp_allDay");
			el.allDay.checkbox(ops.allDayText);
			*/
			/*
			//绑定全天的事件
			$.tap(el.allDay, function(){
				var checked = el.allDay.is(":checked");
				el.timeInput.display(!checked);
			});
			*/

			/*
			el.allDay.bind("onChanged", function(event, checked){
				ops.allDay = checked;
				el.timeInput.display(!ops.allDay);
				if(ops.allDay) el.time.hide();
				that.setDateText(info.selected);
				el.source.trigger("onChangedDate", [info.selected, ops.allDay]);
			});

			//绑定timeInput的事件，进入焦点后，弹出time层
			var that = this;
			el.timeInput.bind("focus", function(){
				that.selectedTime();
				//显示time层
				el.time.show();
			}).smartTime(function(h, m){
					info.pm = h.hourIsPM();
					info.h = h.to12Hour();
					info.m = m;
					that.selectedTime();
					el.time.hide();
					that.complexDate();
					el.source.trigger("onSelectedDate", [info.selected, ops.allDay]);
			}).bind("keydown", function(){
					el.time.hide();
				});
			*/
		},
		//实始化月份的内容
		initMonth: function(){
			var that = this, info = that.info, ops = that.options, el = that.element;
			var index = 0, html = '<table>';
			var rowCount = Math.ceil(12 / ops.monthColCount);
			var cell = '<td flag="{0}" class="mfdp_row{1} mfdp_col{2} mfdp_cell"><div class="mfdp_date">{3}</div></td>';
			for (var i = 0; i < rowCount; i++) {
				html += '<tr>';
				for (var j = 0; j < ops.monthColCount; j++) {
					if(index < 12){
						html += cell.format(index, i , j, ops.shortMonthName[index]);
					}
					index++;
				}
				html += '</tr>';
			};

			html += '</table>';
			el.month.html(html);
			el.monthCells = $("td", el.month);

			//绑定事件
			$.tap(el.monthCells, function() {
				var obj = $(this);
				var flag = parseInt(obj.attr("flag"));
				info.date = new Date(info.currentYear, flag, 1);
				//如果最小视图是月视图，不改变视图到天视图，并且触发事件
				if(ops.minView == _view.month){
					$.callEvent(ops.selectedMonth, [info.currentYear, flag], obj);
					return;
				};
				//更改视图至天视图
				that.changeView(_view.date);
			});

			el.monthCells.hover(function(){
				$(this).toggleClass("active");
			});
		},
		//初始化年的内容
		initYear: function(){
			var that = this, info = that.info, ops = that.options, el = that.element;
			//添加月及年
			var html = '<table>', index = 0;
			var cell = '<td flag="{0}" class="mfdp_row{1} mfdp_col{2} mfdp_cell"></td>';
			for (var i = 0; i < ops.yearRowCount; i++) {
				html += '<tr>';
				for (var j = 0; j < ops.yearColCount; j++) {
					html += cell.format(index, i, j);
					index ++;
				}
				html += '</tr>';
			};

			html += '</table>';
			el.year.html(html);
			el.yearCells = $("td", el.year);

			//绑定事件
			$.tap(el.yearCells, function() {
				var obj = $(this);
				info.currentYear = parseInt(obj.attr("flag"));
				//如果量小视图是年，响应事件并退出
				if(ops.minView == _view.year){
					$.callEvent(ops.selectedYear, [info.currentYear], obj);
					return;
				}else{
					//切换到月视图
					that.changeView(_view.month);
				};		//end if
			});			//end touch
		},
		selectedDate: function(date){
			var info = this.info;
			date.setHours(info.selected.getHours());
			date.setMinutes(info.selected.getMinutes());
			info.selected = date.clone();
			this.setDateText(date);

			this.element.source.trigger("onChangedDate", [date, this.options.allDay]);
		},
		//渲染日期
		renderDate: function(){
			var el = this.element, info = this.info, ops = this.options;
			//跳转到日期
			el.date.calendar("gotoDate", info.date);
			info.h = info.date.getHours();
			info.m = info.date.getMinutes();
			info.pm = info.h > 12;
			info.h = info.h.to12Hour();
			//是否选中全天
			//el.allDay.trigger("onCheck", ops.allDay);
			this.setDateText(info.date);
			this.showView(_view.date);
			this.setCaption();
		},
		//渲染月
		renderMonth: function(){
			var that = this, info = that.info, ops = that.options, el = that.element;
			//强制重绘制月
			if(ops.forceDrawMonth){
				el.monthCells.each(function(month){
					var obj = $(this);
					var text = ops.shortMonthName[i];
					text =  $.callEvent(ops.onDrawCell, [info.view, ops.currentYear, month], obj, text);
					if(text !== false) that.html(text);
				});		//end each
			};			//end if;

			this.setCaption();
			this.showView(_view.month);
			info.drawed = true;
			this.element.source.trigger("onRendered", [info.view, el.monthCells, info.currentYear]);
			//$.callEvent(ops.onRendered, [info.view, el.monthCells, info.currentYear]);
		},
		//渲染年
		renderYear: function(){
			var that = this, info = that.info, ops = that.options, el = that.element;

			info.maxYear = info.minYear - 1;
			el.yearCells.each(function(index){
				info.maxYear ++;
				var obj = $(this);
				var value = index + info.minYear;
				var result = obj.attr("flag", value);
				var text =  $.callEvent(ops.onDrawCell, [info.view, value], obj, value);
				if(text !== false) obj.html(text || value);
			});

			this.setCaption();
			this.showView(_view.year);
			info.drawed = true;
			this.element.source.trigger("onRendered", [info.view, el.yearCells, info.minYear, info.maxYear]);
			//$.callEvent(ops.onRendered, [info.view, el.yearCells, info.minYear, info.maxYear]);
		},
		//设置当前选中的日期
		setDateText: function(date){
			/*
			var fmt = this.options.format;
			//if(!this.options.allDay) fmt += " hh:mm";
			var text = date.format(fmt);
			//this.element.dateText.text(text);
			this.setTime(date);
			*/
		},
		//跳转方向（next/previous）
		goDirection: function(direction) {
			var isNext = direction == "next";
			var ops = this.options, info = this.info;
			var yearCount = ops.yearRowCount * ops.yearColCount;
			switch (info.view) {
				case _view.year:
					info.minYear = info.minYear + (isNext ? yearCount : -yearCount);
					break;
				case _view.month:
					info.currentYear = info.currentYear + (isNext ? 1 : -1);
					info.minYear = info.currentYear - Math.ceil(yearCount / 2);
					this.setCaption();
					return;
					break;
				default:
					info.date = info.date.dateAdd(isNext ? "1M" : "-1M");
					break;
			};
			this.render();
		},
		//获取元素
		getElement: function(key){
			return this.element[key];
		},
		//==============公用方法============
		//重新绘制，但不包括表头，forceDraw：是否强行绘制，不调用onDrawing函数
		render: function(force){
			var info = this.info;
			var ops = this.options;
			//回调函数是否要阻止渲染
			var render = force || $.callEvent(ops.onRendering, [
				info.view,
				info.date,
				info.currentYear,
				info.minYear,
				info.maxYear],
				this, true);
			//alert(draw);
			if(!render) return;

			//根据当前的视图绘制
			switch(this.info.view){
				case _view.date:
					this.renderDate();
					break;
				case _view.month:
					this.renderMonth();
					break;
				case _view.year:
					this.renderYear();
					break;
			};
		},
		//变更视图
		changeView: function(view){
			//当前view已经渲染，不需要再渲染
			if(this.info.drawed && (!view || view == this.info.view)) return;
			this.info.view = view;
			this.render();
		},
		//跳转到指定的日期
		gotoDate: function(date){
			if(date){
				this.info.selected = date.clone();
				this.info.date = date;
			}

			//跳转到指定日期，view将转到最小view
			this.info.view = this.options.minView;
			this.render(true);
			this.setDateText(date);
		},
		//跳转到下一个日期段
		next: function(){
			this.goDirection("next");
		},
		//跳转到上一个日期段
		previous: function(){
			this.goDirection("previous");
		},
		//跳转到今天
		today: function(){
			var today = new Date();
			var info = this.info;
			var expr = {
				date: "yM",
				month: "y"
			};

			//判断已经绘制的时间是否和今天一致，一致则不用绘制
			if((info.view == _view.year &&
				today.getFullYear() == info.currentYear) ||
				today.equal(info.date, expr[info.view]) ) return;

			info.date = today;
			this.render();
		},
		//设置时间
		setTime: function(){
			/*
			var arg0 = arguments[0];
			var h = 0, m = 0;
			if(typeof(arg0) == "object"){
				h = arg0.getHours();
				m = arg0.getMinutes();
			}else{
				h = arg0;
				m = arguments[1];
			};
			*/
			var info = this.info, h = info.h, m = info.m;
			h = h.to24Hour(info.pm);

			var timeText = "{0}:{1}".format(h.zeroize(2, true), m.zeroize(2, true));
			this.element.timeInput.val(timeText);
		}
	};

	//显示贴片
	var showClip = function(obj){
		//重置贴片日历的源和选项
		var clip = $("#" + CLIPID);
		var dpObj = clip.data(CACHENAME);

		var options = obj.data(OPTION);
		dpObj.changeSource(obj, options);

		//根据日期重新渲染
		var date = (obj.data(INPUTCACHE) || {}).date;
		date = date || new Date();
		//切换视图并跳转到日期
		dpObj.gotoDate(date);
		//显示日历
		var offset = obj.offset();
		offset.top += obj.height();
		clip.css({left: offset.left, top: offset.top}).show();
	};

	//创建贴片日历
	var createClip = function(obj, options){
		obj.data(OPTION, options);
		setGetDate(obj, options.start);			//设置input中的值

		var clip = $("#" + CLIPID);
		//不存在，创建一个
		if(clip.length == 0){
			var html = '<div id="{0}" class="mf_datepicker mf_clipDatepicker" />';
			html = html.format(CLIPID);
			clip = $(html);
			var dpObj = new datepicker(clip, options);
			if(options.autoRender) dpObj.render();
			clip.data(CACHENAME, dpObj);
			clip.bind("mouseleave", function() {
				clip.fadeOut();
			});
			$("body").append(clip);
		};

		var useKeyboard = false;
		obj.bind("onSelectedDate", function(event){
			//用户选择了日期，即点击了日历中的天
			$.fn.datepicker.hideClip();
		}).bind("onChangedDate", function(event, date){
			//时间发生改变
				setGetDate(obj, date);
			});

		obj.bind("focus click", function(){
			this.select();
			useKeyboard = false;
			showClip(obj);
		}).bind("keydown", function(event){
				//使用键盘输入，称其贴片
				$.fn.datepicker.hideClip();
				useKeyboard = true;
				//回车
				if(event.which == 13){
					$(this).trigger("blur");
				};
			}).bind("blur", function(){
				if(!useKeyboard) return;
				var value = $(this).val();
				//解发事件
				var date = $.callEvent(options.onSmartDate, [value], null, false);
				if(!date){
					date = $.smartDate(value, "yyyy-MM-dd");
				};
				setGetDate(obj, date);
				obj.trigger("onChangedDate", [date]);
			});

		//禁用键盘
		if(!options.allowKeyboard){
			obj.attr("readonly", "readonly");
		};
	};

	//设置及或者日期
	var setGetDate = function(obj, date, allDay) {
		if (date) {
			//写到缓存中
			obj.data(CACHENAME, {
				date: date.clone()
			});

			//更改开始的时间
			var options = obj.data(OPTION);
			options.start = date.clone();
			obj.data(OPTION, options);

			//如果是input，则写入到input
			if (obj.is(":input")) {
				obj.val(date.format(options.format));
			};
		} else {
			date = (obj.data(CACHENAME) || {}).date;
			return date || new Date();
		}
	};

	//日期选择器
	$.fn.datepicker = function(){
		var arg0 = arguments[0];
		if(typeof(arg0) == "string"){
			var obj = this.length == 1 ? this : this[0];
			var dp = obj.data(CACHENAME);
			switch(arg0){
				case "get":
					return (dp.info ? dp.info.selected : dp.date).clone();
					break;
				case "next":
					dp.next();
					break;
				case "today":
					dp.today();
					break;
				case "changeView":
					dp.changeView(arguments[1]);
					break;
				case "previous":
					dp.previous();
					break;
				case "gotoDate":
					dp.gotoDate(arguments[1]);
					break;
				case "render":
					dp.render(arguments[1]);
					break;
				case "getElement":
					return dp.getElement(arguments[1]);
					break;
				case "setOption":			//更改option
					$.extend(arguments[1], dp.options);
					break;
			};
			return;
		};

		//隐藏贴片的日期选择
		$.fn.datepicker.hideClip = function(){
			$("#" + CLIPID).hide();
		};

		//创建新的日历
		var ops = {
			//准备渲染，如果返回为false，则停止渲染
			onRendering: null,
			start: new Date(),
			view: "day",
			captionFormat: {
				date: "MMM, yyyy",
				month: "{0}",
				year: "{0}-{1}"
			},
			format: "yyyy-MM-dd",
			monthName: ['January', 'February', 'March', 'April', 'May', 'June',
				'July', 'August', 'September', 'October', 'November', 'December'],
			calendarWeekName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
			shortMonthName: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
			onlyClickSelected: false,					//仅点击才响应selected事件
			forceDrawMonth: false,			//是否每次都强行绘制月份
			yearRowCount: 3,
			yearColCount: 4,
			monthColCount: 4,				//月份显示多少列
			previousText: "&lt;",
			nextText: "&gt;",
			backText: "Back",
			todayText: "Today",
			allDayText: "All day",
			//是否允许键盘，一般在触摸设备上不允许用键盘
			allowKeyboard: true,
			minDate: new Date(1900, 0, 1),
			maxDate: new Date(2100, 1, 12),
			minView: _view.date,
			allDay: true,				//是否为全天
			//是否显示时间，如果显示时间，将会在日期视图下增加一个时间的输入框
			showTime: false,
			//是否显示全天的checkbox，如果显示，表示用户可以不输入时间
			showAllDay: true,
			//是否允许用户输入时间，而不是只允许选择，建议在pc上可以允许输入，触摸设备可以只能选择
			allowInputTime: true,
			//false表示在天视图的情况下，不显示非本月的数据
			justThisMonth: false,
			//是否自动渲染
			autoRender: true
		};
		$.extend(ops, arg0);

		var that, dpObj;
		return this.each(function(){
			var obj = $(this);
			//弹出式
			if(obj.is(":input")){
				createClip(obj, ops);
				return this;
			};

			dpObj = new datepicker(obj, ops);
			obj.data(CACHENAME, dpObj);
			if(ops.autoRender) dpObj.render();
		});
	};
})(jQuery);

/*
 * 实际输入框内容自动识别
 * 1.用户输入数字，绝对值小于10，表示输入为小时，否则为分钟
 * 2.支持1d3h这种写法，如果用户直接输入10h或者10小时，表示10小时后
 * 3.支持标准格式的日期输入以及按用户的本地化日期格式输入
 * 4.支持明天(中英文)/后天/7.30 am/pm这类写法
 */
(function($){

	//将数字转换为智能日期
	/*
	 * @params {Number} number 要转化的数字，必需是数字
	 */
	var $smartNumeric = function(number){
		var now = new Date();
		//如果数字小于10，按小时处理
		if(Math.abs(number) <= 10){
			return now.dateAdd(number + "h");
		};

		return now.dateAdd(number + "m");

		//TODO 这个智能识别以后写
		var str = number.toString();
		var len = str.length;
		//判断是否为年月日这样的格式
	};

	var $smartDateTime = function(value){
		var t = new Date().start("h").extract();
		value.replace(/(\d+)(\D+)/g,
			function(m, value, unit) {
				if(unit == "d") value ++;
				if(t[unit]) t[unit] = value;
			});
		return new Date(t.y, t.m, t.d, t.h, t.m, t.s, t.ms);
	};

	$.extend({
		/*
		 * 智能日期与时间
		 */
		smartDateTime: function(value){
			var now = new Date();
			if(value.isNumeric()){
				return $smartNumeric(parseFloat(value));
			};


		},
		//智能日期
		smartDate: function(value, fmt){
			var now = new Date();
			if(!value) return now;
			value = value.dbc2sbc();			//转换全半角
			var t = now.extract();
			var y = t.y, M = t.M, d = t.d;
			//匹配在当前日期上加减日期的
			var pattern = /^([+-])?(((\d+[ymd年月日天]){1,})|(\d+))$/i;
			var symbol, data = {y: 0, M: 0, d: 0, h: 0, m: 0, s: 0};

			if(pattern.test(value)){
				symbol = RegExp.$1;			//符号
				var expr = RegExp.$2;

				if(/^\d+$/.test(expr)){
					data.d = parseInt(expr);
				}else{
					//将m替换为大写，用户一般不记得M
					expr = expr.replace(/m/, "M");
					data = expr.toDateEx(true);
				};

				//包含符号，在当天的日期基础上加减
				if(symbol){
					var isPlus = symbol == "+";
					t.y += isPlus ? data.y : -data.y;
					t.M += isPlus ? data.M : -data.M;
					t.d += isPlus ? data.d : -data.d;
				}else{
					//年
					if(data.y > 0 && data.y < 50){
						y = 2000 + data.y;
					}else if (data.y > 50 && data.y <= 100){
						y = 1900 + data.y;
					}else if(data.y > 1900 && data.y < 9999){
						y = data.y;
					};

					if(data.M > 0){
						data.M --;
						//月小于当前月，则年向后推一年
						if(data.y == 0 && data.M < t.M) y ++;
						M = data.M;
					};

					//天
					//如果日期大于31，则表示在当前日期上加上N天
					if(data.d > 31){
						var date = new Date(y, M, t.d);
						var tmp = date.dateAdd(data.d + "d").extract();
						y = tmp.y;
						M = tmp.M;
						d = tmp.d;
					}else if(data.d > 0){
						if(data.M <= t.M && data.d < t.d) M ++;
						d = data.d;
					};

					t.y = y;
					t.M = M;
					t.d = d;
				};
			}else if(/^(\d+).(\d+).(\d+)$/i.test(value)){
				y = parseInt(RegExp.$1);
				M = parseInt(RegExp.$2);
				d = parseInt(RegExp.$3);

				//交换月和天
				if(M > 12 && d <= 12){
					var tmp = M;
					M = d;
					d = tmp;
				};
				M--;
				if(M < t.M || (M == t.M && d < t.d)) t.y++;
				t.M = M;
				t.d = d;
			}else{
				//按用户设定的日期格式
				var date = value.toDate(fmt);
				t = date.extract();
			};

			//console.log(t);
			return new Date(t.y, t.M, t.d, t.h, t.m, t.s);
		},
		//智能识别分秒
		smartTime: function(value){
			var now = new Date();
			var h = now.getHours(), m = now.getMinutes();
			if(!value) return {h: h, m: m};
			//判断是否在当前的时间上增加时间
			var pattern = /^([+-])(\d+)([hm])?$/;
			//匹配增减模式
			if(pattern.test(value)){
				var isPlus = RegExp.$1 == "+";
				var number = parseInt(RegExp.$2);
				number = isPlus ? number : -number;
				var unit = RegExp.$3 || "m";
				if(unit == "h"){
					h += number;
				}else{
					m += number;
				};
			}else{
				//如果全部是数字
				if (value.isNumeric()) {
					//如果是4位，直接从中间分隔
					if (value.length == 4) {
						h = value.substr(0, 2);
						m = value.substr(2, 2);
					} else {
						//取第一位为小时，其它的为分钟
						if (parseInt(value) <= 24) {
							h = value;
							m = 0;
						} else {
							h = value.substr(0, 1);
							m = value.substr(1, value.length - 1);
						}
					}
				}else {
					//按中间的分隔号分隔
					var isPM = false;
					if (/^(\d+).+(\d+)$/i.test(value)) {
						h = RegExp.$1;
						m = RegExp.$2;
					}else if(/^(\d+)(.?(\d+))?([ap]m)?$/i.test(value)){
						h = RegExp.$1;
						m = RegExp.$3 || 0;
						isPM = /pm/i.test(RegExp.$4);
					} else {
						var now = new Date();
						return {h: now.getHours(), m: now.getMinutes()};
					}
				}

				//转换
				h = parseFloat(h);
				m = parseFloat(m);
				h = h.to24Hour(isPM);
			}

			if (isNaN(m)) {
				m = 0;
			} else if (m > 59) {//如果超过59，则将多余的时间计算到小时
				h += Math.floor(m / 60);
				m = m % 60;
			}

			//如果小时大于23，则取余，例如25点计做1点
			if (h > 23) h = h % 24;
			return {
				h: h,
				m: m
			};
		}
	});

	$.fn.smartDate = function(){

	};
})(jQuery);

/*
 * 智能时间，可以弹出窗口让用户选择
 */
(function($){
	var _CACHENAME = $.uniqueText("__time_");
	var getTimeText = function(h, m){
		return "{0}:{1}".format(h.zeroize(2, true), m.zeroize(2, true));
	};

	//设置或者获取时间
	var setGetTime = function(obj, h, m){
		if(h && m){
			obj.data(_CACHENAME, {h: h, m: m});
		}else{
			var cache = obj.data(_CACHENAME) || {h: 0, m: 0};
			return cache;
		}
	};

	//智能时间
	$.fn.smartTime = function() {
		var arg0 = arguments[0];
		//获取时间
		if(arg0 == "get"){
			return setGetTime($(this));
		};

		return this.bind("blur", function() {
			var obj = $(this);
			var hm = $.smartTime(obj.val());
			obj.val(getTimeText(hm.h, hm.m));
			setGetTime(obj, hm.h, hm.m);
			obj.trigger("onChanged", [hm.h, hm.m]);
		}).bind("click", function() {
				this.select();
			}).bind("keydown", function(event) {
				if(event.which == 13){
					$(this).trigger("blur");
				};
			}).bind("onSetValue", function(event, h, m){
				if(h instanceof Date){
					m = h.getMinutes();
					h = h.getHours();
				};

				var obj = $(this);
				obj.val(getTimeText(h, m));
				setGetTime(obj, h, m);
				obj.trigger("onChanged", [h, m]);
			});
	};
})(jQuery);