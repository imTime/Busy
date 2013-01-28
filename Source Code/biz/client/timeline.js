/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/9/12
 * Time: 10:23 下午
 * 实现显示活动的时间线，结构如下
 * <div memo="所有活动的容器">
 * 	<div memo="每一天的容器" date="天，如20111011" id="__date">
 * 	  <ul>
 * 	    <li>显示每天的圆形控制按钮</li>
 * 	    <li>显示关联一天活动的关联线</li>
 * 	    <li>这一天的活动列表<ul>...</ul></li>
 * 	  </ul>
 * 	</div>
 * </div>
 */
(function(){

	var _ele = {};
	var _ops = {
		formatKey: "yyyyMMdd",
		formatTime: "mmss"
	};

	/*
	 * 用二分查找法在序列元素中查找最接近条件的元素
	 * @params {Array} targets 要进行二分查找的数组
	 * @params {Function} callback(targets, half, next)，ele1和ele2分别是从中间取出的相邻的两个元素
	 */
	var binarySearch = function(targets, callback){
		var count = targets.length;
		//只有两个元素，返回第一个(和返回第二个没有区别，两个都接近)
		if(count == 1){
			return targets[0];
		};

		var half = Math.floor(count / 2);
		var next = half, halfIndex = half - 1;
		//返回最接近的那一个
		var result = callback(targets, halfIndex, next);
		//查找前半部分
		if(result == targets[halfIndex]){
			targets = targets.slice(0, half);
		}else{
			targets = targets.slice(next);
		};
		return binarySearch(targets, callback);
	};

	//创建一个饼图
	var createPieChart = function(container, datas){
		//重新排序并统计总数
		var count = datas.sum(function(item){
			return item.value;
		});

		//重新排序
		datas = datas.sort(function(a, b){
			return a.value > b.value ? -1 : 1;
		});

		//最大的作为背景色
		var html = '';
		//创建pie
		var startDeg = 0, pieHtml = '';     //开始的角度
		datas.forEach(function(item, index){
			var bg = item.color.replaceRGBA({a: 0.8}, false, true);
			var background =  "-moz-radial-gradient({0}, {1})".format(item.color, bg);
			if(index == 0){
				pieHtml += '<div class="background" style="background: {0}"></div>'.format(background);
				return;
			};
			//所占百分比
			var percent = item.value / count;
			var deg = percent * 360;
			pieHtml += '<div style="-moz-transform:rotate({0}deg);" class="hold"><div class="pie" ';
			pieHtml += 'style="background:{1}; -moz-transform:rotate({2}deg);">';
			pieHtml += '</div></div>';
			pieHtml = pieHtml.format(startDeg, background, deg);
			startDeg += deg;
		});

		html += pieHtml;
		container.append(html);
	};

	//创建某一天的bandge
	var createDateBadge = function(date){
		var ymd = date.format(im.i18n.getFormat().yMd, $.i18n("date.shortMonthName"));
		var html = '<div class="line1">{0}</div>'.format(ymd);
		var week = $.i18n("date.weekName")[date.getDay()];
		html += '<div class="line2"><span class="week">{0}</span>'.format(week);
		if($.env.enableLocal){
			html += '<span class="local">{0}</span>'.format($.i18n("getLocalDate", [date, "Md"]));
		};
		html += '<span class="prettyDate">{0}</span>'.format(im.page.prettyDate(date));
		html += '</div>';
		/*
		var html = '<div class="dateBadge"><div class="yearMonth">{0}</div>';
		html += '<div class="box"><div class="date">{1}</div><div class="day">';
		html += '{2}</div></div><div class="chart"></div><div class="mask"></div></div>';

		//年月
		var ym = date.format(dateFormat.format[1].yM, i18n.date.shortMonthName);
		//周几
		var week = i18n.date.shortWeekName[date.getDay()];
		html = html.format(ym, date.getDate(), week);
		*/
		return html;
	};

	/*
	 * 根据活动所在容器，如果活动不存在，则创建
	 */
	var findElementWithTime = function(activity, start){
		var dayKey = start.format(_ops.formatKey);
		var _i18n = $.i18n().activity;
		//唯一id是活动的id+日期，因为同一个活动可能会重复
		var id = "__" + dayKey + activity._id;

		//查找该活动对应的ID是否存在
		var activityKey = "#" + id;
		var objActivity = $(activityKey);
		if(objActivity.length > 0) return objActivity;

		//不存在则创建该活动
		var objDate = findElementWithDate(start, true);
		var objActivities = $(">li.activities", objDate);
		var strEle = '<div id="{0}" class="activity" time="{1}">';
		strEle += '<div class="statusBox"><div class="mask" /></div><ul>';
		//格式化
		strEle = strEle.format(id, start.format(_ops.formatTime));
		//添加第一行
		strEle += '<li class="header"><label class="time head" /><h2 class="title" /></li>';
		//添加开始
		strEle += '<li class="date"><div class="start"><label class="head">' + _i18n.from;
		strEle += '</label><span class="content" /></div>';
		//添加结束
		strEle += '<div class="until"><label>' + _i18n.until + '</label><span class="content" /></div>';
		//添加持续时间
		strEle += '<div class="duration"><label>' + _i18n.duration + '</label>';
		strEle += '<span class="content" /></div></li>';
		//添加循环信息
		strEle += '<li class="repeat"><div class="from"><label class="head">' + _i18n.begin + '</label>';
		strEle += '<span class="content" /></span><span class="repeat" /><div class="counter">';
		strEle += '<label>' + _i18n.counter + '</label><span class="content" /></span></div></li>';
		//添加提醒信息
		strEle += '<li class="reminder" />';
		//结束
		strEle += '</ul></div>';
		objActivity = $(strEle);

		//存在下级元素，找到最近的下级元素
		var children = $(">div", objActivities);
		if(children.length == 0){
			//没有下级元素，直接添加
			objActivities.append(objActivity);
		}else{
			//创建辅助数组
			var helps = [];
			for(var i = 0; i < children.length; i ++){
				helps.push(i);
			};

			//则用二分法搜索最近的节点
			var closely = binarySearch(helps, function(last, next){
				var lastTime = $(children[helps[last]]).attr("time");
				var nextTime = $(children[helps[next]]).attr("time");
				lastTime = parseInt(lastTime)
				nextTime = parseInt(nextTime);
				return lastTime < nextTime ? last : next;
			});
		}

		//在最近的节点插入
		var objClosely = $(children[closely]);
		var closelyTime = parseInt(objClosely.attr("time"));
		var time = parseInt(start.format(_ops.formatTime));
		//最接近的时间比新的日期大，则在前面插入元素
		if(closelyTime > time){
			objActivity.insertAfter(objClosely);
		}else{
			objActivity.insertAfter(objClosely);
		};
		return objActivity;
	};
	/*
	 * 创建每天的html内容，直接插入container
	 * @params {Date} date 创建内容的日期
	 * @return {DOM} 返回已经生成的对象
	 */
	var findElementWithDate = function(date, autoCreate){
		var key = date.format(_ops.formatKey);
		var objId = "__" + key;
		var objDate = $("#" + objId);
		//没有找到对像
		if(objDate.length != 0){
			return objDate;
		};

		//非自动创建，且找不到
		if(!autoCreate) return null;

		var strEle = '<ul id="{0}" class="date" date="{1}"><li class="everyDay">';
		strEle += createDateBadge(date);
		//<li class="relation"><div></div></li>
		strEle += '</li><li class="activities">';
		strEle += '<ul class="todo" /><ul class="birthday" /><ul class="normal" /></li></ul>';
		strEle = strEle.format(objId, key);
		objDate = $(strEle);

		var children = $(">div", _ele.container);
		//没有下级元素，直接添加
		if(children.length == 0){
			_ele.container.append(objDate);
		}else{
			//用2分法找到最接近此日期的元素
			//创建辅助数组
			var helps = [];
			for(var i = 0; i < children.length; i ++){
				helps.push(i);
			};

			//查找最接近的元素
			var closely = binarySearch(helps, function(helps, last, next){
				var lastDate = $(children[helps[last]]).attr("date");
				var nextDate = $(children[helps[next]]).attr("date");
				lastDate = lastDate.toDate(_ops.formatKey);
				nextDate = nextDate.toDate(_ops.formatKey);
				var lastDay = Math.abs(lastDate.dateDiff("d", date));
				var nextDay = Math.abs(nextDate.dateDiff("d", date));
				return (lastDay < nextDay) ? last : next;
			});		//end callback

			var objClosely = $(children[closely]);
			var closelyDate = objClosely.attr("date").toDate(_ops.formatKey);
			//最接近的时间比新的日期大，则在前面插入元素
			//TODO 把insertBefore加到Core中去
			if(closelyDate > date){
				_ele.container[0].insertBefore(objDate[0], objClosely[0]);
			}else{
				//在当前结点的下一个兄弟结点插入
				_ele.container[0].insertBefore(objDate[0], objClosely[0].nextSibling);
			};
		};
		return objDate;
	};

	var findContainer = function(start, type){
		var at = im.e.ActivityType;
		var className;
		for(var key in at){
			if(at[key] == type) className = key.toLowerCase();
		};

		var objDate = findElementWithDate(new Date(start), true);
		return objDate.find(">li.activities>ul.{0}".format(className));
	};

	//更新todo到每天的todo区域
	//var updateTodo = function(obj, data, color){
		/*
		var start = new Date(data.begin);
		//找到容器
		var o = findContainer(start, data.type);
		var objFinish;
		//查找是否存在这一行
		var obj = o.find(">li[_id='{0}']".format(data._id));
		if(obj.length == 0){
			var html = '<li _id="{0}"><div class="checkbox" />'.format(data._id);
			html += '<span class="mf_colorbox" /><span class="time" /><span class="title" /></li>';
			obj = $(html);
			objFinish = obj.find(">div.checkbox")
				.checkbox()
				.bind("onChanged", function(event, checked, isClick){
					//更改完成todo
				});

			o.append(obj);
		};
		*/
/*
		//完成度
		var rate = data.finished_rate || 0;
		var finished = rate == 1;
		objFinish.trigger("onCheck", [finished]);
		obj.toggleClass("finished", finished)

		var time = new Date(data.begin).format("hh:mm");
		obj.find(">span.time").text(time);
		obj.find(">span.title").text(data.title);
	};
	*/
	//更新生日
	//var updateBirthday = function(obj, data, color, start, counter){
		/*
		//找到容器
		var o = findContainer(start, data.type);
		//查找是否存在这一行
		var obj = o.find(">li[_id='{0}']".format(data._id));
		if(obj.length == 0){
			var html = '<li _id="{0}"><span class="mf_colorbox" />'.format(data._id);
			html += '<span class="age" /> <span class="title" /></li>';
			obj = $(html);
			o.append(obj);
		};

		*/
/*
		counter = 10;
		if(counter == 0){
			//counter = $.i18n("activity.birth");
		}else{
			counter = $.i18n("activity.age").format(counter);
		};

		obj.find(">span.age").text(counter);
		obj.find(">span.title").text(data.title);
	};
*/

	/*
	 * 更新标准的活动
	 */
	var updateNormal = function(data, color, start, counter){
		/*
		//找到容器
		var o = findContainer(start, data.type);
		//查找是否存在这一行
		var obj = o.find(">li[_id='{0}']".format(data._id));
		if(obj.length == 0){
			var html = '<li _id="{0}"><span class="mf_colorbox" />'.format(data._id);
			html += '<span class="age" /> <span class="title" /></li>';
			obj = $(html);
			o.append(obj);
		};

		obj.find(">span.age").text(counter);
		obj.find(">span.title").text(data.title);
		*/

	};

	var updateActivity = function(data, color, start, counter){
		var at = im.e.ActivityType;
		//查找容器
		var o = findContainer(start, data.type);
		//查找是否存
		var obj = o.find(">a[_id='{0}']".format(data._id));
		//不存在，创建
		if(obj.length == 0){
			var html = '<a _id="{0}" calendarId="{1}">'.format(data._id, data.calendarId);
			html += '<span class="mf_colorbox" />';
			if(data.type == at.Todo) html += '<div class="checkbox" />';
			if(data.type != at.Birthday) html += '<span class="time" />';
			if(data.type == at.Birthday) html += '<span class="age" />';
			html += '<span class="title" /><button class="delete" /><button class="edit" /></a>';
			obj = $(html);
			o.append(obj);

			//设置checkbox
			if(data.type == at.Todo){
				obj.find(">div.checkbox")
					.checkbox()
					.bind("onChanged", function(event, checked, isClick){
						if(!isClick) return;
						obj.toggleClass("finished", checked);
						_ele.container.trigger("onFinish", [obj, data.calendarId, data._id, checked]);
					});
			};

			//设置点击的动作
			$.tap(obj, function(e){
				var evt = "onSelected";
				if(/button/i.test(e.target.nodeName)){
					e.stopPropagation();
					evt = $(e.target).hasClass("delete") ? "onRemove" : "onEdit";
				};
				_ele.container.trigger(evt, [obj, data.calendarId, data._id]);
			});
		};

		var title = data.title;
		if(title){
			title = title.decodeHtml();
			title = title.overlong(30, "...");
		};

		switch(data.type){
			case at.Todo:
				objFinish = obj.find(">div.checkbox");
				//完成度
				var rate = data.finishedRate || 0;
				var finished = rate == 1;
				objFinish.trigger("onCheck", [finished]);
				obj.toggleClass("finished", finished);
				break;
			case at.Birthday:
				title = $.i18n("activity.birthday").format(title);
				if(counter == 0){
					counter = $.i18n("activity.birth");
				}else{
					counter = $.i18n("activity.age").format(counter);
				};
				obj.find(">span.age").text(counter);
				break;
		};

		//生日不用处理时间，生日肯定是全天事件
		if(data.type != at.Birthday){
			var time;
			if(!data.allDay){
				time = new Date(data.begin).format("hh:mm");
			}else{
				time = $.i18n("activity.allDay");
			}
			obj.find(">span.time").text(time);
		};

		//移动设备没必要使用这个属性
		if(!$.env.isMobile) obj.attr("title", title);

		obj.find(">span.title").text(title);
		var objColor = obj.find("span.mf_colorbox");
		objColor.display(color);
		if(color) objColor.css("background-color", color);

		/*
		switch(data.type){
			case at.Todo:
				updateTodo(obj, data, color);
				break;
			case at.Birthday:
				updateBirthday(obj, data, color, start, counter);
				break;
		};
		*/
	};

	/*
	 * 添加活动，此方法已经废弃
	 */
	/*
	var updateActivity = function(activity, color, start, counter){
		var objActivity = findElementWithTime(activity, start);
		var objRepeat = $("li.repeat", objActivity);
		var objDate = $("li.date", objActivity);
		var objDuration = $(">div.duration", objDate);		//持续时间
		var objReminder = $("li.reminder", objActivity);

		var time = activity.allDay ? "全天" : start.format("hh:mm");
		var repeat = activity.repeat;

		$("li.header>h2", objActivity).text(activity.title);
		$("li.header>label.time", objActivity).text(time);

		//颜色
		var objColor = $(">div.statusBox", objActivity);
		var background = $.lineGradient(color, -30);
		objColor.css({background: background});

		//提醒
		objReminder.display(activity.reminder);
		//开始与结束时间一样，不显示
		if(activity.begin == activity.end){
			objDate.hide();
			objDuration.hide();
		}else{
			objDate.show();
			objDuration.show();

			var duration = activity.end - activity.begin;
			var until = start.dateAdd(duration + "ms");
			var expr = getFormatExpression(start, until);
			var strStart = start.format(expr);
			var strUntil = until.format(expr);
			$(">div.start>span.content", objDate).text(strStart);
			$(">div.until>span.content", objDate).text(strUntil);

			//console.log(start, until);
			$(">span.content", objDuration).text(im.i18n.duration(until.dateDiffEx(start)));
		};

		//没有重复，隐藏重复行
		if(repeat == im.e.ActivityRepeat.NoRepeat){
			objRepeat.hide();
		}else{
			//更新重复
			updateActivityRepeat(objRepeat, activity.begin, repeat, counter);
		};
	};
	*/


	/*
		获取格式化的表达式，根据开始与结束时间
		如果是全天事件，显示年月日
		如果在同一年，则显示月日时分
		如果在同一天，显示时分
	 	否则显示年月日时分秒
	 */
	var getFormatExpression = function(from, until, allDay){
		if(allDay) return "yyyy-MM-dd";
		//同一天，显示时分
		if(from.equal(until, "yMd")) return "hh:mm";
		//同一个年或者同一月，显示到月
		if(from.equal(until, "y")) return "MM-dd hh:mm";
		//都不是，则显示全日期格式
		return "yyyy-MM-dd hh:mm";
	};

	//更新活动的重复
	var updateActivityRepeat = function(obj, from, repeat, counter){
		var fmt = im.i18n.getFormat().yMdhm;
		var strFrom = new Date(from).format(fmt, $.i18n().date.monthName);
		$("div.from>span.content", obj).text(strFrom);
		$("div.counter>span.content", obj).text(counter);
	};

	//更新每天badge上的状态饼图
	var updateBadgeStatus = function(date, statues){
		return;
		var objDate = findElementWithDate(date, false);
		if(!objDate) return;
		var objChart = $(">li.everyDay>div.dateBadge>div.chart", objDate);
		createPieChart(objChart, statues);
	};

	//更新关系线的高度
	var updateRalation = function(date){
		//找到这一天的
		var objDate = findElementWithDate(date, false);
		if(!objDate) return;

		//获取活动的高度
		var objActivities = $(">li.activities", objDate);
		var h = objActivities.outerHeight();

		//如果只有一个活动，则高度是这个活动的80%
		var children = $(">div.activity", objActivities);
		if(children.length <= 1){
			h = $(">ul", children).outerHeight();
			h = h * 0.5;
		}else{
			//将高度减去第一个和最后一个的一半
			h -= $(children[0]).height() / 2;
			h -= $(children[children.length - 1]).height() / 2;
		}
		//取第一个活动和最后一个活动的高度

		var objRelation = $(">li.relation>div", objDate);
		objRelation.height(h);
	};


	//实际timeline
	$.fn.timeline = function(){
		var action = arguments[0];
		if(!action){
			_ele.container = this;
			return this;
		};

		var args = [];
		for(var i = 1; i < arguments.length; i ++){
			args.push(arguments[i]);
		};

		switch(action){
			case "updateActivity":
				updateActivity.apply(this, args);
				break;
			case "updateBadgeStatus":
				//updateBadgeStatus.apply(this, args);
				break;
			case "updateRalation":
				//updateRalation.apply(this, args);
				break;
		}
	};

})();