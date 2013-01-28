/*
 * 重复的处理
 */
(function(){
	var _ele, _arEnum = im.e.ActivityRepeat;
	im.page.repeat = {
		//初始化列表
		initListview: function(){
			var that = this;
			//listview的数据
			var datas = im.page.enumToArray(_arEnum, function(item){
				//忽略季度
				if(item.value == _arEnum.Quarterly) return false;
				item.text = $.i18n("activity.repeatType._" + item.value);
				return item;
			});

			//实现listview
			_ele.listview.listView(datas)
				.bind("onSelected", function(event, obj, value, clicked){
					if(!clicked) return;
					value = parseInt(value);
					var stop = undefined, local = undefined;
					if(value == _arEnum.NoRepeat) {
						stop = null;
						local = null;
						that.hide();
					};
					im.page.activity.updateRepeat(value, stop, local);
				});
		},
		//隐藏
		hide: function(){
			if($.env.isPhone){
				im.page.phone.displayRepeat(false);
			}else{
				_ele.container.fadeOut();
			};
		},
		init: function(){
			var o = $("#pnlRepeat");
			_ele = {
				container: o,
				listview: $("#lstRepeat"),
				stopBy: $("#txtRepeatStop"),
				neverStop: $("#chkNeverStop"),
				rowLocal: $("#rowLocalRepeat"),
				local: $("#chkLocalRepeat")
			};

			this.initListview();
			//是否显示本地重复
			_ele.rowLocal.display($.env.enableLocal);
			//永不重复
			_ele.neverStop.checkbox($.i18n("activity.neverStop"))
				.bind("onChanged", function(event, checked){
					_ele.stopBy.enable(!checked);
					im.page.activity.updateRepeat(undefined, checked);
				});

			//启用本地日历
			if($.env.enableLocal){
				_ele.local.checkbox($.i18n("localText"))
					.bind("onChanged", function(event, checked){
						var enumLocal = im.e.ActivityLocal;
						//TODO 要考虑多种本地日历，目前只支持中国日历
						var local = checked ? enumLocal.ChineseLunar : enumLocal.Solar;
						im.page.activity.updateRepeat(undefined, undefined, local);
					});
			};

			im.page.initDateInput(_ele.stopBy);
			//停止时间
			_ele.stopBy.bind("onSelectedDate", function(event, date){
				im.page.activity.updateRepeat(date.getTime(), undefined, undefined);
			});
		},
		/*
		 * 显示
		 */
		show: function(){
			var that = this;
			if($.env.isPhone){
				im.page.phone.displayRepeat(true);
			}else{
				var f = im.page.fullscreen;
				f.showBack(function(){
					_ele.container.fadeOut();
					return true;
				}, $.i18n("activity.title.repeat"));
				_ele.container.fadeIn();
			};

			var act = im.page.activity.cache().activity;
			_ele.stopBy.trigger("onChangeDate", [act.stop]);
			_ele.neverStop.trigger("onCheck", [act.stop == im.config.maxDateTime]);
			_ele.listview.trigger("onSelect", [act.repeat]);
			_ele.local.trigger("onCheck", [act.local != im.e.ActivityLocal.Solar]);
		},
		//隐藏
		hide: function(){
			if($.env.isPhone){
				im.page.phone.displayRepeat();
			}else{
				im.page.fullscreen.showClose();
			}
		}
	}
})();
