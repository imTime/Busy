(function(){
	var _ele, _cacheKey = $.uniqueText("__cache_");
	im.page.timeline = {
		init: function(){
			_ele = {
				timeline: $("#timeline"),
				noActivity: $("#pnlNoActivity"),
				newActivity: $("#btnNewActivity")
			};

			//点击新建活动
			$.tap(_ele.newActivity, function(){
				var date = im.page.cache(_cacheKey).min || new Date();
				im.page.activity.createNew(null, date);
			});

			//实例化timeline
			_ele.timeline.timeline()
				.bind("onRemove", function(e, obj, calendarId, activityId){
					//隐藏
					obj.hide("slow");
					//删除活动
					im.page.activity.remove(calendarId, activityId, function(){
						im.page.update(true, true);
						obj.remove();
					});
				}).bind("onEdit", function(e, obj, calendarId, activityId){
					//编辑某个活动
					im.page.activity.edit(calendarId, activityId);
				}).bind("onFinish", function(e, obj, calendarId, activityId, checked){
					var rate = Number(checked);
					//修改完成度
					im.page.activity.changeFinishedRate(
						calendarId, activityId, rate, null, function(){

					});
				}).bind("onSelected", function(e, obj, calendarId, activityId){
					//在手机上如果选择某项，则打开编辑器
					if(!$.env.isPhone) return;
					//console.log(calendarId, activityId);
					im.page.activity.edit(calendarId, activityId);
				});
		},
		/*
		 * 加载列表
		 */
		load: function(min, max){
			var cp = im.interface.getCompute();
			var tl = _ele.timeline;
			//取日期
			min = min || im.page.cache(_cacheKey).min || new Date().start("d");
			tl.cache({
				min: min
			});

			//取指定日期的活动
			var caches = cp.activitiesWithDate(min);
			_ele.noActivity.display(caches.length == 0);
			_ele.noActivity.find("label.caption").text(im.i18n.format(min, 'yMd'));
			tl.empty().display(caches.length > 0);

			//加载列表
			caches.forEach(function(cache){
				var activity = cp.activityWithIndex(cache.calendar, cache.activity);
				var status = cp.getStatusWithId(activity.statusId);
				var color = status ? status.color : activity.color;
				tl.timeline("updateActivity", activity, color, cache.start, cache.counter);
			});
		}
	};
})();