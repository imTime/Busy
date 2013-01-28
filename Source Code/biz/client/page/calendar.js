/*
 * 日历的编辑器
 */
(function(){
	var _ele, _cacheKey = $.uniqueText("__cache_");
	im.page.calendar = {
		//初始化
		init: function(){
			var o = $("#pnlCalendarEditor");
			_ele = {
				//用于手机上的slide，pc上可以不考虑速度
				slideup: $("#sldCalendarEditor"),
				container: o,
				title:$("#txtCalTitle"),
				//tags: o.find(".tags input"),
				//summary: o.find("textarea"),
				ribbon: $("#lstCalendarRibbon"),
				saveButton:$("#btnSaveCalendar")
			};

			//选中某个颜色
			im.page.ribbon(_ele.ribbon, function(color){
				im.page.cache(_cacheKey, {color: color}, true);
			}, 20);
			$.tap(_ele.saveButton, this.saveEditor);

			//==================用于用mobile部分=============
			if(!$.env.isPhone) return;			//非Phone的环境不用处理
			//初始化slide

			_ele.slideup.slideupView({
				closeWhenLeftButton: true,
				caption: $.i18n("calendarEditor.editorTitle"),
				leftText: $.i18n("calendarEditor.leftButton"),
				rightText: $.i18n("calendarEditor.rightButton")
			}).bind("onClickRightButton", this.saveEditor);
		},
		//删除某个日历
		remove: function(calendarId){
			var options = {
				onSuccess: function(res){
					if(!res.command.result){

					};

				}
			};

			im.interface.passed(im.e.module.calendar, im.e.method.DELETE, options, calendarId);
		},
		/*
		 *  保存编辑器中的日历
		 */
		saveEditor: function(){
			var cache = im.page.cache(_cacheKey);
			var data = {
				title: _ele.title.val().trim(),
				//tags: _ele.tags.val(),
				//summary: _ele.summary.val(),
				color: cache.color
			};

			//保存成功后，关闭modal
			im.page.calendar.save(data, function(){
				im.page.modal(_ele.slideup, true);
			}, cache.calendarId);
		},
		/*
		 * 保存日历
		 */
		save: function(data, callback, calendarId){
			var options = {
				data: data,
				onSuccess: function(res){
					var er = im.e.SaveCalendar;
					switch (res.command.code){
						case er.CalendarLimit:
							var msg = $.i18n("calendarEditor.message.limit");
							msg = msg.format(result.maxCalendarPerMember, result.currentCalendarCount);
							im.page.msgbox(msg);
							break;
						case er.CalendarNotExist:
							im.page.msgbox($.i18n("calendarEditor.message.notExists"));
							break;
						default:
							$.callEvent(callback, [res.command.calendarId]);
							break;
					};		//end switch
				}		//end onSuccess
			};

			var method = im.e.method[calendarId ? "PUT" : "POST"];
			im.interface.passed(im.e.module.calendar, method, options, calendarId);
		},
		//清除
		clear: function(){
			//提取旧的缓存
			var cache = im.page.cache(_cacheKey);
			var color = cache.color;
			//清除缓存
			im.page.cache(_cacheKey, null);
			_ele.title.val("");
			im.page.selectedRibbon(_ele.ribbon, color || 0);
		},
		/*
		 * 显示日历
		 */
		show: function(calendarId){
			var cp = im.interface.getCompute();

			//如果calendar存在，则查找这个日历
			var calendar;
			if(calendarId){
				calendar = cp.getCalendarWithId(calendarId);
			};

			//如果日历存在，则保存日历相关的数据
			if(calendar){
				/*
				var tags = calendar.tags ? calendar.tags.join(",") : "";
				_ele.tags.val(tags);
				*/
				_ele.title.val(calendar.title);
				im.page.selectedRibbon(_ele.ribbon, calendar.color);
				im.page.cache(_cacheKey, {calendarId: calendar._id}, true);
			}else{
				im.page.calendar.clear();
			}

			im.page.modal(_ele.container);
			im.page.modalTitle($.i18n("calendarEditor.editorTitle"));
			im.page.displayClipCalendars();
		}
	}
})();