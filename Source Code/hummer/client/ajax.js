/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/5/12
 * Time: 3:11 下午
 * To change this template use File | Settings | File Templates.
 */

/*
 * AJAX的操作
 * 依赖项：main.less
 */
(function($){

	var _ajax = function(options){
		this.options = {
			method: "GET",
			type: "html",
			timeout: 10 * 1000
		};

		$.extend(options, this.options);
		this.options.type = this.options.type.toLowerCase();
		this.req = null;
		this.timer = $.unique("mf_timer_");
		this.init();
	};

	_ajax.prototype = {
		init: function(){
			var that = this, ops = that.options;
			var req = that.req = new XMLHttpRequest();
			req.open(ops.method, ops.url, true);
			req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			req.onreadystatechange = function() {
				switch (req.readyState) {
					case 4:
						var isStop = $.callEvent(ops.onReady, [req], null, false);
						if(!isStop) that._ready();
						break;
				}
			};

			var param = $.getParam(ops.data);
			req.send(param);
			//超时，终止
			$.timer[this.timer] = setTimeout(function(){
				that.req.abort();
			}, ops.timeout);
		},
		//已经准备好了
		_ready: function(){
			clearTimeout($.timer[this.timer]);
			delete $.timer[this.timer];
			var that = this, ops = that.options, req = that.req;
			switch(req.status) {
				case 200:
					$.callEvent(ops.onSuccess, [that._getContent(req, ops)]);
					break;
				case 0:
					$.callEvent(ops.onTimeout);
					break;
				default:
					$.callEvent(ops.onError, [req, req.status]);
					break;
			}
		},
		_getContent: function(req, ops){
			var content;
			if (ops.type == "xml") {
				content = req.responseXml;
			}else{
				content = req.responseText;
				//console.log(content);
				if (ops.type == "json") content = JSON.parse(content);
			}
			return content;
		}
	};

	$.extend({
		ajax: function(options){
			new _ajax(options);
		}
	}, MF);		//end extend
})(MF);

//流动布局
(function($){
	/*
	 对批量元素进行流动布局，要求所有元素必需是position = "absolute";
	 将元素数组动态放置到一个虚拟的盒子内，每个元素称之为leaf，而虚拟容器则被称之为box
	 */
	var _flowLayout = function(options, elements){
		this.options = {
			//容器的位置，left,top,width,height
			boxRect: [0,  0, 320, 480],
			//每行显示多少个
			cols: 1,
			//每列显示多少个
			rows: -1,
			//leaf绘制的方向
			direction: "horizontal",	//vertical, horizontal
			//叶子的高度，高度和宽度如果为0的话，将获取元素的高、宽度
			leafHeight: 0,
			//叶子的宽度
			leftWidth: 0,
			//列的间距
			colSpace: 0,
			//行的间距
			rowSpace: 0,
			//页与页之间的宽度
			pageSpace: 0,
			//最终的位置是随机(random)还是队列(queue)
			position: "queue",
			//动画间隔时间，random(随机)/fixed(固定)/increase(递增加)
			duration: "random",
			//与duration配合使用，random时值为数组，表示随机范围；fixed值为string，表示固定的时间；increase时为数组，第一维表示初始值，[0]表示初始值，[1]表示递增值
			durationValue: [400, 3000],
			//动画的类型，指定或者随机，默认为线性
			timingFunction: "linear",
			//附带的数据，传递给事件
			data: null
		};

		this.info = {
			lastX: 0,
			lastY: 0
		};
		//要操作的元素
		this.elements = elements;
		$.extend(options, this.options);
	};

	_flowLayout.prototype = {
		//获取一个元素应该的x,y
		getPosition: function(index, obj){
			var colIndex, rowIndex, ops = this.options, result = {x: 0, y: 0};
			//从options的回调中获取位置
			var getPos = $.callEvent(ops.onGetPosition, [index, obj, ops.boxRect], this, false);
			if(getPos !== false)  return getPos;

			var lw = ops.leafWidth, lh = ops.leafHeight, pageSpace;
			var l =  ops. boxRect[0], t =  ops. boxRect[1], w =  ops.boxRect[2], h =  ops.boxRect[3];
			//队列
			if(ops.position == "queue"){
				//index与列数取余得到列的位置，乘以叶子的宽度，再加上间隔和左边的距离
				if(ops.direction == "horizontal"){
					colIndex = index % ops.cols;
					result.x = (colIndex + 1) * lw + (colIndex * ops.colSpace) + l;

					rowIndex = Math.floor(index / ops.cols);
					result.y = (rowIndex + 1 ) *  lh + rowIndex * ops.rowSpace + t;
				}else{
					rowIndex = index % ops.rows;
					result.y = (rowIndex + 1) * lh + (rowIndex * ops.rowSpace) + t;

					colIndex = Math.floor(index / ops.rows);
					result.x = (colIndex + 1 ) *  lw + colIndex * ops.colSpace + l;

					result.x += colIndex * ops.pageSpace;
					result.x += (colIndex % ops.cols == 1) ? 0 : ops.pageSpace;
					//console.log((colIndex % ops.cols == 1) ? 0 : ops.pageSpace);
				}
				return result;
			};

			//随机
			result.x = $.random(l + lw, w - lw);
			result.y = $.random(t + lh, h - lh);
			return result;
		},
		//获取动画的延时
		getDuration: function(index, obj){
			var ops = this.options, duration  = ops.duration, durValue = ops.durationValue;
			var result = $.callEvent(ops.onGetDuration, [index, obj, duration, durValue], this, false);
			if(result) return result;
			switch(duration){
				case "random":
					result = $.random(durValue[0], durValue[1]);
					break;
				case "fixed":
					return durValue;
				case "increase":
					result = index * durValue[1] + durValue[0];
					break;
			};
			return result + "ms";
		},
		getTimingFunction: function(index){
			var ops = this.options;
			var timeFn = $.callEvent(ops.onGetTimingFunction, [index], this, false);
			if(timeFn !== false) return timeFn;

			//目前直接获取，以后增加随机或者顺序的方式
			return ops.timingFunction;
		},
		run: function(options){
			$.extend(options, this.options);
			var ops = this.options, el = this.elements, that = this;
			var duration, pos, timingFn, skip;
			el.each(function(i){
				var obj = $(this);
				duration = that.getDuration(i, obj);
				pos = that.getPosition(i, obj);										//获取位置
				//设置动画之前的动作
				skip = $.callEvent(ops.onLeafBefore, [obj, i, pos, duration], that, false);
				if(skip) return false;
				//设置动画
				obj.animaStyle({
					x: pos.x,
					y: pos.y,
					duration: duration,
					timingFunction: that.getTimingFunction(i, obj)
				});

				//调用动画之后，但并不是动画结束之后
				$.callEvent(ops.onLeafAfter, [obj, i, pos, duration], that);
			});
		}
	};

	$.fn.flowLayout = function(options){
		return new _flowLayout(options, this);
	};
})(MF);