/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/28/12
 * Time: 3:56 下午
 * 实现大屏下的页面展示，如果有和手机融合的地方，再抽象出来
 */
/*
 * 活动相关
 */
(function(){
	/*
	 获取本地化的枚举值
	 */
	im.i18n.getLocalEnum = function(node, value){
		if(value == undefined){
			value = "caption";
		}else{
			value = "_" + value;
		};

		node = "e." + node;
		var local = $.i18n(node);
		if(local) return local[value] || "";
		return "";
	};

	var _ele = {};
	var _timerMsg = 0;
	//对页面的操作
	im.page = {
		/*
		 * 页面的全局配置
		 */
		config: {

		},
		//获取时间的别名
		prettyDate: function(date){
			var days = date.dateDiff("d", new Date());
			var key, abs = Math.abs(days);
			if(abs < 2){
				key = "today";
				if(days != 0) key = days < 0 ? "yesterday" : "tomorrow";
				return $.i18n("date." + key);
			}else{
				key = days > 0 ? "after" : "before";
				var unit = "days";
				if(abs > 999){
					unit = "years";
					abs = Math.abs(date.dateDiff("y", new Date()));
				};
				unit = $.i18n("date." + unit);
				return $.i18n("date." + key).format(abs, unit);
			};
		},
		//设置modal窗口的标题
		modalTitle: function(text){
			//手机屏自行处理
			if($.env.isPhone) return;
			im.page.fullscreen.title(text);
		},
		/*
		 * 显示模态窗口，区别手机设备大屏设备
		 */
		modal: function(o, isHide){
			//手机设备
			if($.env.isPhone){
				//用slide的方式打开，必需是已经初始化过的slideup的对象
				o.trigger(isHide ? "onHide" : "onShow");
				return o;
			};

			//===============大屏设备============
			if(isHide){
				im.page.fullscreen.hide();
				return o;
			};

			//大屏
			im.page.fullscreen.show({
				onClose: function(){
					o.fadeOut();
				}
			});

			//要设置modal窗口的margin-top，根据fullscreen的hedaer计算
			return o.fadeIn();
		},
		/*
		 * 读写缓存，这个是全局级别的缓存，把缓存写入到body中
		 */
		cache: function(key, value, append){
			var el = _ele.root = _ele.root || $("body");
			//删除缓存
			if(value === null){
				return el.removeData(key);
			};

			//读取缓存
			if(value === undefined){
				return el.data(key) || {};
			};

			//追加到现有缓存，如果存在，则替换
			if(append){
				//读取现有缓存
				var old = im.page.cache(key);
				//将新的缓存引入
				value = $.extend(old, value);
			};

			//设置缓存
			el.data(key, value);
		},
		//用于非网站的api服务器地址
		apiServer: "http://api1.imtime.com/",
		/*
		 * 执行某种操作后的钩子
		 */
		hook: {},
		/*
		 * 根据值 ，返回枚举关键字
		 */
		reflectionEnum: function(e, value){
			for(var key in e){
				if(e[key] == value) return key;
			};
			return false;
		},
		/*
		 * 将枚举转换为数组
		 */
		enumToArray: function(e, callback){
			var result = [];
			for(var key in e){
				var item = {
					key: key,
					value: e[key]
				};
				if(callback) item = callback(item);
				if(item) result.push(item);
			};
			return result;
		},
		/*
		 * 对键盘的常规操作
		 */
		keypress: function(obj){
			obj.bind("keydown", function(evt){
				var keyCode = evt.which ? evt.which : evt.keyCode;
				//同时按了Ctrl + S，或者Ctrl + Enter，保存
				if((evt.metaKey || evt.ctrlKey) && (keyCode == 83 || keyCode == 13)){
					return obj.trigger("onCtrlS", [evt]);
				};

				//按下enter键
				if(keyCode == 13){
					return obj.trigger("onEnter", [evt]);
				};

				//取消
				if(keyCode == 27){
					obj.trigger("onCancel", [evt]);
				};
			});
		},
		//弹出提示框
		msgbox: function(message, o){
			//msgbox可能没有预初始化，用的时候检测是否初始化
			if(!_ele.msgbox){
				_ele.msgbox = $("#msgbox");
				if($.env.isPhone){
					_ele.msgbox.css({width: im.mobile.env.device.width});
				};
				_ele.msgboxText = $("#msgbox .text");
				//点击关闭提醒框
				$.tap(_ele.msgbox, function(){
					_ele.msgbox.moveTo({y: 0});
				});
			};

			//清除现有的计时器
			if(_timerMsg) window.clearTimeout(_timerMsg);
			//显示到容器当中
			if(o){
				o.text(message);
			}else{
				_ele.msgboxText.text(message);
				_ele.msgbox.moveTo({y: 200});
				_timerMsg = window.setTimeout(function(){
					_ele.msgbox.moveTo({y: 0});
				}, 10000);
			};
		},
		//在一个已知的jQuery对象内查找对象
		findInObject: function(o, expr){
			var id = o[0].id;
			//如果存在id，则用id获取，效率比较高
			if(id){
				if(expr.substr(0, 1) != ">") id += " ";
				return $("#" + id + expr);
			};

			//没用id用find的方式，速度慢
			return o.find(expr);
		},
		//提示input的错误
		inputError: function(obj, err){
			var cls = "mf_error";
			obj.toggleClass(cls, err);
		},
		/*
		 * 列表
		 */
		listView: function(container, expr, onChange){
			var selected = "selected";
			$.tap(container.find(expr), function(){
				var obj = $(this);
				var value = obj.attr("value");
				var find = expr + '.' + selected;
				container.find(find).removeClass(selected);
				obj.addClass(selected);
				$.callEvent(onChange, [obj, value]);
			});
		},
		/*
		 * 搜索本地活动
		 * @params {String} keyword 搜索的关键字
		 */
		searchActivity: function(keyword){
			var result = im.interface.getCompute().search(keyword);
			var o = $("#secSearch");
			var html = '';

			//生成html
			result.forEach(function(item){
				var activity = cp.activityWithIndex(item.calendar, item.activity);
				var title = activity.title;
				//TODO 这里要生成更加详细的搜索结果，标题/开始/结束/持续时长/是否重复事件/状态
				html += '<a>' + title + '</a>';
			});
			o.html(html);
		},
		//初始化日历输入
		initDateInput: function(obj){
			//初始化日期
			this.dateInput(obj, new Date(), true);

			if(!$.env.isPhone){
				this.initDate(obj);
				return;
			};
			//手机版本选择日期，禁止用户输入
			obj.attr("readonly", "readonly");

			//手机版本弹出datepicker slide
			/*
			$.tap(obj, function(){
				im.page.phone.displayDatepicker({
					onChangedDate: function(event, date){
						im.page.dateInput(obj, date);
					}
				});
			});
			*/
		},
		/*
		 * 设置输入框，兼容Phone
		 * @params {Boolean} allDay 兼容
		 */

		dateInput: function(obj, date, allDay){
			var key = "__date_cache";
			if(date === undefined){
				return obj.data(key) || new Date();
			};
			//写入缓存
			obj.data(key, date);
			//非手机版本不用缩减显示
			var text = im.page.formatDatetime(date, allDay, $.env.isPhone);
			obj.val(text);
		},
		/*
		 * 将日期格式化为文字
		 */
		formatDatetime: function(date, allDay, shorten){
			//和当前时间同一样，不显示年
			var fmt = "Md";
			if(!shorten || !new Date().equal(date, "y")) fmt = "y" + fmt;
			if(!allDay) fmt += "hm";
			var text = im.i18n.format(date, fmt);
			//本地化日历，如果包括时间，就不加上本地日历了，太长了显示了
			if(allDay && $.env.enableLocal){
				text += $.i18n("getLocalDate", [date, " Md"]);
			};
			return text;
		},
		//初始化日期
		initDate: function(obj, loadCounter){
			//侧边的日历
			return obj.datepicker({
				view: "date",
				todayText:$.i18n("date.today"),
				showTime: false,
				autoRender: true,
				previousText: "",
				nextText: "",
				format:im.i18n.getFormat().yMd,
				calendarWeekName:$.i18n("date.calendarWeekName"),
				shortMonthName:$.i18n("date.shortMonthName"),
				onSmartDate: function(text){
					//本地化智能识别
					var result = $.i18n("smartDate", [text]);
					if(!result) return false;
					//本地日历，目前只处理中文日历
					if(result.local == im.e.ActivityLocal.ChineseLunar){
						obj.trigger("onDisplayLocal", [result.local, result.date]);
					};
					return new Date(result.date);
				},
				//绘制单元格
				onDrawCell: function(){
					//活动还没有加载完毕
					var view = arguments[0];
					//不是date视图
					if(view != "date") return;
					var html = '', date = arguments[1];
					if(im.interface.activitiesLoaded && loadCounter){
						//获取这一天有多少活动
						var count = im.interface.getCompute().activityCountWithDate(date);
						if(count == 0) count = "";
						html += '<div class="counter">{0}</div>'.format(count);
					};
					html += '<div class="date">{0}</div>'.format(date.getDate());
					if($.env.enableLocal){
						html += '<div class="local" />';
					};
					return html;
				}
			}).bind("onRendered", function(event, view, dayCells, min, max){
					if(view != "date") return;
					//没有本地日历
					if(!$.env.enableLocal) return;
					var locals = $.i18n("localCalendar", [min, max]);

					dayCells.each(function(index, obj){
						obj = $(obj);
						var key = obj.attr("date");
						var local = locals[key];
						if(local) obj.find(">div.local").text(local.day);
					});
				}).bind("onChangedDate", function(event, date){
					if(obj.is(":input")){
						im.page.dateInput(obj, date);
					};
				});

			/*
			obj.datepicker({
				previousText: "",
				nextText: "",
				view: "date",
				showTime: false,
				autoRender: true,
				format: "yyyy年MM月dd日"
			}).bind("onChangeDate", function(event, date){
					$.i18n.format(date, "yMd");
				}).bind("onRendered", function(event, view){
					console.log(view);
				});
		*/
		},
		//选中某个颜色
		selectedRibbon: function(container, color){
			var selected = "selected";
			//console.log(container.html());
			container.find(">a." + selected).removeClass(selected);
			if(typeof(color) == "number"){
				container.find(">a:eq(" + color + ")").addClass(selected);
			}else{
				container.find('>a[color="{0}"]'.format(color)).addClass(selected);
			};
		},
		/*
		 * 色带
		 */
		ribbon: function(o, onSelected, count){
			var colors = ["#e80202", "#e802af", "#da02e8", "#0243e8",
				"#02bae8", "#05bc01", "#b2e306", "#84aa02",
				"#ff96a5", "#f696ff", "#96aaff", "#93f1ff",
				"#ffa200", "#ff5400", "#000000", "#9b9a9a",
				"#f8e5a1", "#e9fd7c", "#2a8494", "#485490"];

			count = count || colors.length;
			var html = "";
			var temp = '<a style="background: {0}; background-color: {1};" color="{1}"><span class="imgMain" /></a>';

			for(var i = 0; i < count; i ++){
				var color = colors[i];
				html += temp.format($.lineGradient(color, -30), color);
			};
			o.html(html);

			//添加事件
			$.tap(o.find(">a"), function(){
				var obj = $(this);
				var color = obj.attr("color");
				im.page.selectedRibbon(o, color);
				$.callEvent(onSelected, [color]);
			});
		},
		/*
		 * 更新日历和timeline，一般是对活动进行了编辑后
		 */
		update: function (tl, calendar){
			var cp = im.interface.getCompute();
			cp.clearCache(true);
			//重新计算
			cp.computing();
			//更新timeline
			if(tl) this.loadTimeLine();

			//重新渲染侧栏的日历
			if(calendar && _ele.month){
				_ele.month.datepicker("render", true);
			};
		},
		//初始化工具栏上的操作
		initToolbar: function(){
			var o = $("#toolbar");
			_ele.toolbar = {
				container: o,
				member:o.find("a.member label")
			};

			//点击工具栏
			$.tap(o.find("a"), function(){
				var obj = $(this);
				var type = obj.attr("class");
				switch(type){
					case "member":
						if(im.member.isSigned){
							im.page.sign.signOut();
						}else{
							im.page.sign.show(true);
						};
						break;
					case "sync":
						im.page.msgbox("Coming Soon.");
						break;
					case "create":
						im.page.activity.createNew();
						break;
					case "download":
						//im.page.expressDownload();
						break;
					case "option":
						im.page.option.show();
						break;
				};
			});

			//搜索自动匹配
			$("#txtSearch").bind("keyup", function(){
				var value = $(this).val();
				im.page.searchActivity(value);
			});
		},
		/*
		 * 快速下载
		 */
		/*
		expressDownload: function(hide){
			_ele.download.moveTo({
				y: hide ? 0 : 200,
				x: 0
			});

			if(hide) return;
			im.page.fullscreen({
				onClose: function(){
					im.page.expressDownload(true);
				}
			});
		},
		*/
		/*
		 * 初始化日历列表，在手机上就是日历选择
		 */
		initCalendars: function(){
			_ele.calendars = $("#lstCalendars").listView()
				.bind("onDrawItem", function(e, obj, data){
					obj.find("span").css("background-color", data.color);
				}).bind("onSelected", function(e, obj, value, clicked, data){
					if(!clicked) return;
					//编辑状态下，打开编辑窗口
					im.page.calendar.show(data.value);
				});
		},
		//初始化贴片日历
		initClipCalendar: function(){
			_ele = _ele || {};			//兼容popup，因为popup不进行page.init
			_ele.clipCalendars = $("#pnlClipCalendars").listView()
				.bind("onDrawItem", function(e, obj, data){
					obj.find("span").css("background-color", data.color);
				}).bind("onSelected", function(e, obj, value, clicked, data){
					if(!clicked) return;
					var target = _ele.clipCalendars.cache();
					im.page.selectedCalendar(target, value);
					_ele.clipCalendars.fadeOut();
				});

			_ele.clipCalendars.bind("mouseleave", function(){
				_ele.clipCalendars.fadeOut();
			});
		},
		/*
		 * 下载
		 */
		/*
		initDownload: function(){
			_ele.download.find(">ul>li").hover(function(){
				$(this).toggleClass("active");
			});
		},
		*/
		/*
		 * 初始化元素
		 */
		initElement: function(options){
			_ele.month = $("#pnlMonth");
			im.page.initDate(_ele.month, true);
			_ele.month.bind("onSelectedDate", function(event, date){
				im.page.loadTimeLine(date);
			});

			/*
			//创建日历
			$.tap($("#calendars footer a"), function(){
				var calendarId = $(this).attr("calendarId");
				im.page.calendar.show(calendarId);
			});
			*/

			this.initModule(["fullscreen", "sign", "activity",
				"timeline", "calendar", "expressEditor"]);
			this.initCalendars();

			//非手机需要初始化的
			if(!$.env.isPhone){
				//this.initDownload();
				this.initClipCalendar();
				this.initToolbar();
				$.tap($("#lnkNewCalendar"), im.page.calendar.show);
			}
		},
		/*
		 * 初始化模块，如果模块存在，则初始化
		 */
		initModule: function(modules){
			var that = this;
			modules.forEach(function(module){
				if(that[module]) that[module].init();
			});
		},
		//将一个对象钉到屏幕的中间
		pinToCenter: function(obj){
			return obj.show();
			return;
			var screenWidth = $(window).width();
			var screenHeight = $(window).height();
			var width = obj.width();
			var height = obj.height();
			var scrollTop = $(window).scrollTop();
			var x = (screenWidth - width) / 2;
			var y = (screenHeight - height) / 2 + scrollTop;
			x = Math.max(x, 0);
			y = Math.max(y, 0);
			obj.css({top: y, left: x});
			return obj;
		},
		//加载
		loadStatus: function(){
			return;
			//加载用户状态列表
			var statuses = im.interface.getCompute().getStatuses();
			im.page.status.load(statuses);
		},
		/*
		 * 加载用户的所有数据
		 */
		loadMemberData: function(){
			if(_ele.toolbar){
				//加载用户数据，直接从Compute中加载
				_ele.toolbar.member.text($.i18n("profile"));
			};

			//加载状态
			this.loadStatus();
			//加载日历
			this.loadCalendars();
			/*
			//加载贴片上的日历
			this.loadClipCalendars(function(calendarId){
				//选择默认的日历
				im.page.expressEditor.selectedCalendar(calendarId);
				im.page.activity.selectedCalendar(calendarId);
			});
			*/
			this.update(true, true);

			//数据加载完成
			if($.env.isPhone){
				im.page.phone.dataLoaded();
			};
		},
		/*
			* 显示贴片日历
			* @params {left|right} align 对齐方式，默认为left
		 */
		displayClipCalendars: function(target, align){
			//手机不存在clipCalendars
			if($.env.isPhone) return;

			var clip = _ele.clipCalendars;
			if(target === undefined){
				return clip.hide();
			};

			//显示日历
			var offset = target.offset();
			offset.top += target.height() + 10;
			if(align == "right") offset.left -= (clip.width() - target.width());
			clip.show()
				.cache(target)
				.css({left: offset.left, top: offset.top});
		},
		/*
		 * 选择日历，但不弹出窗口
		 * 注意，calendarId不能为空，且不能是索引，因为number的索引和sqlite的calendarId冲突
		 */
		selectedCalendar: function(obj, calendarId){
			var calendars = im.interface.getCompute().getCalendars();
			var find = -1, item;
			//没有指定calendarID，则选择第一个
			if(calendarId === undefined && calendars.length > 0){
				item = calendars[0];
			}else{
				find = calendars.find(function(item, index){
					return item._id == calendarId;
				});
				if(find == -1) return;
				item = calendars[find];
			};

			var html = '<span style="background-color: {0};" /><label>{1}</label>';
			html = html.format(item.color, item.title);
			obj.html(html);
			obj.attr("value", item._id);
		},
		/*
		 * 获取默认日历，目前暂时取第一个，以后取用户最后使用的日历
		 */
		getDefaultCalendar: function(onlyID){
			var calendars = im.interface.getCompute().getCalendars();
			var data;
			if (calendars.length > 0) {
				data = calendars[0];
				if(onlyID) return data._id;
			};
			return data;
		},
		/*
		//加载用于贴片的日历
		loadClipCalendars: function(callback){
			var html = '', o = _ele.clipCalendars.empty();
			var calendars = im.interface.getCompute().getCalendars();
			calendars.forEach(function(item, index){
				var temp = '<a value="{0}" title="{2}"><span class="mf_colorbox" ';
				temp += 'style="background-color: {1}"></span>{2}</a>';
				temp = temp.format(item._id, item.color, item.title);
				html += temp;
			});
			o.html(html);

			//点击列表
			im.page.listView(o, ">a", function(obj, value){
				var target = o.cache();
				target.html(obj.html()).attr("value", value);
				target.trigger("onSelected", [obj, value]);
				o.fadeOut();
			});				//end listview

			var calendarId = calendars.length > 0 ? calendars[0]._id : false;
			$.callEvent(callback, [calendarId]);
		},
		*/
		getCalendars: function(){
			var calendars = im.interface.getCompute().getCalendars();
			var result = [];
			calendars.forEach(function(calendar){
				result.push({
					value: calendar._id,
					text: calendar.title,
					color: calendar.color
				});
			});
			return result;
		},
		/*
		 * 加载日历列表 注意：此业务逻辑要重新考虑
		 */
		loadCalendars: function(){
			var calendars = this.getCalendars();
			im.member.calendarCount = calendars.length;
			if(_ele.clipCalendars) _ele.clipCalendars.empty();
			if(_ele.calendars) _ele.calendars.empty();
			calendars.forEach(function(calendar){
				if(_ele.calendars) _ele.calendars.trigger("onUpdate", [calendar]);
				if(_ele.clipCalendars) _ele.clipCalendars.trigger("onUpdate", [calendar]);
			});

			//选择默认的日历
			if(calendars.length > 0){
				var calendarId = calendars[0].value;
				//手机版本没有expressEditor
				var ee = im.page.expressEditor;
				if(ee) ee.selectedCalendar(calendarId);
				im.page.activity.selectedCalendar(calendarId);
			};
		},
		/*
		 * 成功加载所有活动
		 */
		loadTimeLine: function(date){
			im.page.timeline.load(date);
			//im.page.calendar.show(0);
		},
		/*
		 * 成功加载日历，在页面的侧面加显示日历列表
		 *
		 */
		onLoadedCalendars: function(calendars){
			//加载日历到编辑器的日历列表中
			//im.page.activity.loadCalendar(calendars);
			//在页面上显示用户的日历列表
			var html = '';
			calendars.forEach(function(item, index){
				var temp = '<a calendarId="{0}" title="{2}"><span ';
				temp += 'style="background-color: {1}"></span>{2}[{3}]</a>';
				temp = temp.format(item._id, item.color, item.title, 5);
				html += temp;
			});
			_ele.calendars.html(html);

			$.tap(_ele.calendars.find(">a"), function(){
				im.page.calendar.show($(this).attr("calendarId"));
			});
		},
		/*
		 * 获取重复的文字，如：每年四月初五重复；每周重复，永不停止
		 */
		getRepeatText: function(repeat, stop, local){
			repeat = repeat || im.e.ActivityRepeat.NoRepeat;
			return $.i18n("activity.repeatType")["_" + repeat];
		},
		/*
		 * 判断用户是否登陆，如果登陆则加载数据，不适使用sqlite的客户端
		 */
		isSigned: function(callback){
			var $loadData = function(){
				im.interface.loadMemberData(function(){
					im.page.loadMemberData();
					$.callEvent(callback);

					//im.page.calendar.show();
					//im.page.activity.createNew(3);
					//im.page.activity.edit("508d2f552038070157000004", "50a0ee4084d252cf74000008");
				});
			}
			//如果用户已经登陆，则加载数据。使用sqlite的应用，在这里直接加载数据
			if(im.member.isSigned){
				return $loadData();
			};

			//请求用户的基本信息，如果请求成功则加载用户的数据
			var options = {
				statusCode: {
					//被拒绝访问
					401: function(){
						im.member.isSigned = false;
						//加载示例数据
					}
				},
				onSuccess: function(data){
					im.member.isSigned = true;
					$loadData();
					//im.page.activity.show(new Date(), im.e.ActivityType.Normal);
					/*im.page.reminder.show();
					*/
				}
			};
			im.interface.passed(im.e.module.member, im.e.method.GET, options);
		},
		/*
		 * 初始化主要页面（适用于网站和Pad）
		 */
		init: function(options, callback){
			//初始化interface，必需
			//$.env.irServer = "/ir/";
			//是否启用本地化日历
			$.env.enableLocal = $.i18n("enableLocal");
			//用户默认的日期格式
			im.member.dateFormat = $.i18n("dateFormat");
			//ir server在page.init之前可能已经指定
			$.env.irServer = $.env.irServer || "http://ir.imtime.com/";

			var that = this;
			//初始化完interface再初始化element
			im.interface.init(options, function(){
				that.initElement();
				that.isSigned();
				$.callEvent(callback);
			});
			/*
			im.page.expressEditor.displayEditor(true);
			im.page.expressEditor.analyse("测试");
			*/
		}
	};
})();

(function(){
	var _ele;
	var _toggleButton = function(showClose){
		_ele.closeButton.display(showClose);
		_ele.backButton.display(!showClose);
	};

	var _scroll = function(){
		scrollTo(0,0);
	};

	im.page.fullscreen = {
		inited: false,
		init: function(){
			if(this.inited) return;
			this.inited = true;
			var o = $("#fullscreen");
			_ele = {
				container: o
			};

			//手机需要设置高宽
			if($.env.isPhone){
				o.css({
					height: im.mobile.env.device.height,
					width: im.mobile.env.device.width
				});
			}else{
				_ele.closeButton = $("#btnClose");
				_ele.backButton = $("#btnBack");
				_ele.title =o.find(">header>h3");

				$.tap(_ele.closeButton, function(){
					o.trigger("onClose");
				});

				$.tap(_ele.backButton, function(){
					o.trigger("onBack");
				});
			};
		},
		/*
		 * 显示fullscreen
		 */
		show: function(option){
			var o = _ele.container;
			if($.env.isPhone){
				o.one("onClose", function(){
					o.hide();
				});
				return o.show();
			};

			//设置标题
			this.title(option.title);
			o.one("onClose", function(){
				$.fn.datepicker.hideClip();
				$.callEvent(option.onClose);
				o.fadeOut();
				$(window).unbind("scroll", _scroll);
			}).height($("body").height());

			_toggleButton(true);

			//如果支持CSS3的动画，则使用CSS3的动画
			o.fadeIn();
			//禁止滚动
			$(window).bind("scroll", _scroll);
		},
		showClose: function(){
			//_toggleButton(true);
			_ele.container.trigger("onBack");
		},
		/*
		 * 显示back按钮，并隐藏close按钮，目前只能处理两级标题，更多级的需要改造
		 */
		showBack: function(onBack, title){
			//保存现有的title
			var oldTitle = this.title();
			if(title) this.title(title);

			var o = _ele.container;
			var that = this;
			var _fn = function(){
				if($.callEvent(onBack, null, this, true)){
					that.title(oldTitle);
					_toggleButton(true);
					o.unbind("onBack", _fn);
				};
			};

			_toggleButton(false);
			o.bind("onBack", _fn);
		},
		/*
		 * 设置caption
		 */
		title: function(text){
			if(text === undefined) return _ele.title.text();
			_ele.title.text(text);
		},
		/*
		 * 隐藏fullscreen
		 */
		hide: function(){
			_ele.container.trigger("onClose");
		}
	};
})();