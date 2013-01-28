/*
 * 快速编辑器
 */
(function(){
	var _ele, _lines = [], _out, _isDisplay = false, _lineCount;
	im.page.expressEditor = {
		global: {
			//是否启用多行模式
			multiLine: false,
			//活动的类型
			type: im.e.ActivityType.Unknown,
			//重复类型
			repeat: im.e.ActivityRepeat.NoRepeat
		},
		//选择一个日历
		selectedCalendar: function(calendarId){
			im.page.selectedCalendar(_ele.calendarLink, calendarId);
		},
		clear: function(){
			_lines = [];
			_lineCount = 0;
			_ele.editor.enable(true).val("").blur();
			_ele.monitor.empty();
			_ele.saveButton.enable(true);
			this.displayEditor(false);
		},
		//更新实时监控
		updateMonitor: function(index){
			var line = _lines[index];
			var act = line.activity;
			var obj = _ele.monitor.find("li[index='{0}']".format(index));

			//没有这一行，创建新的行
			if(obj.length == 0){
				var html = '<li index="{0}"><div class="type">{type}<span /></div>';
				html += '<div class="title">{title}<span /></div>';
				html += '<div class="event">{from}';
				html += '<div class="content"><span class="begin" /><span class="end" /></div></div>';
				html += '<div class="repeat">{repeat}<span /></div>';
				html += '<div class="reminder">{reminder}<div /></div>';
				html += '</li>';
				html = html.replace(/\{(\w+)\}/g,
					function(m, i) {
						if(i == "0") return index;
						return "<label>" + $.i18n("expressEditor." + i) + "</label>";
					});
				obj = $(html);
				_ele.monitor.append(obj);
			};

			var isSame = act.begin == act.end;
			var fmt = "yMd";
			var begin = new Date(act.begin);
			if(!act.allDay){
				fmt = begin.equal(new Date(), "y") ? "Mdhm" : "yMdhm";
			};
			begin = im.i18n.format(begin, fmt);
			var end = isSame ? "" : im.i18n.format(new Date(act.end), fmt);
			obj.find(">div.type>span").text(im.i18n.getLocalEnum("ActivityType", act.type));
			obj.find(">div.title>span").text(act.title);
			obj.find(">div.event>div>span.begin").text(begin);
			obj.find(">div.event>div>span.end").text(end).display(!isSame);
			obj.find(">div.repeat>span").text(im.page.getRepeatText(act.repeat));

			//处理提醒
			var rmdText = '';
			if(act.reminders instanceof Array){
				act.reminders.forEach(function(item){
					var rmdBy = item.reminderBy;
					if(!rmdBy || rmdBy == im.e.ReminderBy.Unknown) rmdBy = im.e.ReminderBy.Popup;
					var text = $.i18n("getReminderText", [item.delay, rmdBy]);
					text = '<span>{0}</span>'.format(text);
					rmdText += text;
				});
			}else{
				rmdText = '<span>{0}</span>'.format($.i18n("activity.noReminder"));
			};
			obj.find(">div.reminder>div").html(rmdText);
		},
		/*
		 * 智能识别
		 */
		ir: function(text, callback){
			/*
			var that = this;
			//提交到服务器识别
			var options = {
				data: {
					lang:$.env.language,
					content: text,
					type: this.global.type
				},
				dataType: "JSON",
				onSuccess: function(res){
					var act = res.content;
					act.type = act.type || im.e.ActivityType.Normal;
					act.repeat = act.repeat || im.e.ActivityRepeat.NoRepeat;

					$.callEvent(callback, [act]);
				}
			};

			//提交到ajax处理
			im.page.i().doAction($.env.irServer, im.e.method.get, options);
			*/
			im.interface.ir(this.global.type, text, callback);
		},
		/*
		 * 保存数据
		 */
		save: function(text, callback){
			//先智能识别，再保存
			this.ir(text, function(activity){
				activity.calendarId = _ele.calendarLink.attr("value");
				var reminders = activity.reminders;
				im.page.activity.save(activity, reminders, callback);
			});
		},
		/*
		 * 设置默认的日历
		 */
		setDefaultCalendar: function(calendarId){

		},
		//分析每一行
		analyseLine: function(text, index){
			var line, that = this;
			if(index < _lines.length){
				line = _lines[index];
				//历史的数据一样，跳过
				if(line.text == text) return;
				line.text = text;
				_lines[index] = line;
			}else{
				_lines.push({text: text});
			};

			//智能识别并处理
			this.ir(text, function(activity){
				var line = _lines[index];
				line.activity = activity;
				_lines[index] = line;
				that.updateMonitor(index);
			});
		},
		/*
		 分析用户输入的数据
		 */
		analyse: function(text, isSave){
			var that = this, lines = [];
			//单行模式
			if(!this.global.multiLine){
				text = text.overlong(255);
				lines.push(text);
			}else{
				//分隔为多行
				var matches = text.split(/\n+/g);
				matches.forEach(function(line){
					line = line.trim().overlong(255);
					if(!line) return;
					lines.push(line);
				});
			};

			//要保存数据
			if(isSave){
				var index = 0;
				return that.save(lines[index], function(){
					index ++;
					if(index >= lines.length){
						//退出编辑状态
						that.clear();
						//更新timeline和calendar
						im.page.update(true, true);
					}else{
						that.save(lines[index], arguments.callee);
					};
				});
			};

			//处理每一行的数据
			lines.forEach(function(line, index){
				that.analyseLine(line, index);
			});
		},
		//显示或隐藏编辑器
		displayEditor: function(display){
			_isDisplay = display;
			_ele.editor.height(display ? 100 : 60);
			_ele.tips.display(display);
			_ele.footer.display(display);
			_ele.monitor.display(display);
			_ele.learning.display(display);
		},
		/*
		 * 初始化编辑器
		 */
		initEditor: function(){
			var e = _ele.editor;

			//隐藏
			var $hide = function(){
				e.blur();
				im.page.expressEditor.displayEditor(false);
				$(document).unbind("click", $click);
			};

			//点击了任意位置
			var $click = function(e){
				if($(e.target).closest("#pnlExpressEditor").length == 0){
					$hide();
				};
			};

			e.bind("focus", function(){
				if(_isDisplay) return;
				//绑定全局事件
				$(document).bind("click", $click);
				im.page.expressEditor.displayEditor(true);
			}).bind("blur", function(){
					//im.page.expressEditor.displayEditor(false);
				}).bind("keydown", function(evt){
					var keyCode = evt.which ? evt.which : evt.keyCode;
					//同时按了Ctrl + S，或者Ctrl + Enter，保存
					if((evt.metaKey || evt.ctrlKey) && (keyCode == 83 || keyCode == 13)){
						return _ele.saveButton.trigger("onTap", e);
					};

					//取消
					if(evt.which == 27){
						return $hide();
					};
				}).bind("keyup", function(evt){
					//自动分析，延时执行
					if(_out) clearTimeout(_out);
					_out = window.setTimeout(function(){
						var text = e.val().trim();
						if(!text) return;
						im.page.expressEditor.analyse(text);
					}, 500);
				});

			/*
			 this.displayEditor(true);
			 this.analyseLine("下午三点在会议室开会", 0);
			 this.analyseLine("每星期六晚上九点回家吃饭 ![-2h30m by mail][-2h10m by pop]", 1);
			 this.analyseLine("周四给张三打电话 !-5h", 2);
			 this.analyseLine("易晓峰 #生日 @十二月十六[30]", 3);
			 */
		},
		/*
		 初始化
		 */
		init: function(){
			var o = $("#pnlExpressEditor");
			_ele = {
				container: o,
				multiLine: $("#chkMultiLine"),
				monitor: $("#pnlIRMonitor"),
				editor: $('#txtQuick'),
				footer:o.find(">footer"),
				tips:o.find(">p.tips"),
				learning:o.find(">section.learning"),
				saveButton: $("#btnSaveExpressEditor"),
				slideButton: $("#btnSlideExpressEditor"),
				calendarLink: $("#lnkQECalendars")
			};

			var that = this;
			this.initEditor();
			_ele.multiLine.checkbox($.i18n("expressEditor.multiLine"))
				.bind("onChanged", function(event, checked){
					that.global.multiLine = checked;
				}).trigger("onCheck", [true]);

			$.tap(_ele.calendarLink, function(){
				if(im.member.calendarCount <= 1) return;
				im.page.displayClipCalendars(_ele.calendarLink, "right");
			}).bind("onSelected", function(event, obj, value){

				});

			//保存
			$.tap(_ele.saveButton, function(){
				var text = _ele.editor.val().trim();
				if(!text) return;
				_ele.editor.enable(false);
				_ele.saveButton.enable(false);
				that.analyse(text, true);
			});

			//收缩
			$.tap(_ele.slideButton, function(){
				im.page.expressEditor.displayEditor(false);
			});
		}
	};
})();