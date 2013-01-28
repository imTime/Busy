/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/5/12
 * Time: 3:05 下午
 * To change this template use File | Settings | File Templates.
 */

/*
 * 依赖项：Array.extend/Date.extend/Number.extend/Object.extend/String.extend/dom
 * main.less.js的代码与项目无关，兼容PC浏览器和手机浏览器，兼容主流浏览器
*/
(function(){
	var _start;
	var im = {
		//输出日志
		log: function(){
			//只有在debug环境下才输出日志
			if(!$.env.isDebug) return;
			//在imbox里面
			if($.env.inBox){
				var err = arguments[0];
				var len = arguments.length;
				if(len > 1){
					var args = Array.prototype.slice.call(arguments, 1, len);
					err = String.prototype.format.apply(err, args);
				};
				im.mobile.proxy.log(err);
				return;
			};

			var params = Array.prototype.slice.call(arguments);
			if(window.console) return console.log.apply(window.console, params);
			if(window.air) return air.trace.apply(window.air, params);
		},
		//记录加载时间
		logTimer: function(flag){
			if($.env.isDebug) return;
			var now = new Date().getTime();
			if(!_start){
				_start = now;
				return im.log("开始加载：", now);
			};

			im.log("[{0}]加载用时：{1}", flag || "", now - _start);
		},
		i18n: {
			getFormat: function(index){
				if(index === undefined) index = im.member.dateFormat;
				index = index || 0;
				return im.i18n.dateFormat[index];
			},
			format: function(date, expr, monthName){
				expr = expr || "yMdhm";
				var months = $.i18n("date")[monthName || "monthName"];
				return date.format(im.i18n.getFormat()[expr], months);
			}
		},
		member: {}
	};

	window.im = im;
})();

/*
 * 对jquery的扩展，可以采用$("expr").something()的方式调用
 */
(function($){
	$.fn.extend({
		/*
		 交换某个Class样式，可以指定间隔时间和共交换回合(显示/隐藏称之为一个回合)
		 */
		swapClass: function(className, num, interval){
			var that = this;
			var index = 1;
			interval = interval || 200;

			var $fn = function(){
				window.setTimeout(function(){
					if(index >= num * 2) return;
					that.toggleClass(className);
					index ++;
					$fn();
				}, interval);
			};

			that.toggleClass(className);
			$fn();
		},
		/*
		 根据条件，显示/隐藏某个象
		 */
		display: function(display, visible){
			if(visible){
				var v = display ? "visible" : "hidden";
				this.css("visibility", v);
				return;
			};

			if(display){
				this.show();
			}else{
				this.hide();
			}		//end if
			return this;
		},
		//是否启用某个元素，一般针对input和button
		enable: function(enable){
			var v = "disabled";
			if(!enable){
				this.attr(v, v);
			}else{
				this.removeAttr(v);
			};
			return this;
		},
		//选中checkbox
		checked: function(checked){
			var v = "checked";
			if(checked){
				this.attr(v, v);
			}else{
				this.removeAttr(v);
			};
		},
		//添加style的动画，不需要设置css样式，直接添加x,y等即可(参考$.getAnimaStyle)
		animaStyle: function(options){
			/*
			 var style = $.getAnimaStyle(options);
			 var ops = {
			 css: style,
			 onEnd: options.onEnd,
			 endCss: options.endCss,
			 remove: options.remove
			 };
			 */
			var $getCSS = function(){
				/*
				 简单动画具体的值，主要目的是统一使用translate3d硬件加速的功能
				 x: undefined,			// 变形x位置
				 y: undefined,			// 变形y的位置
				 z: undefined,			//　变形z的位置
				 rotate: undefined,		//角度
				 scale: undefined,
				 duration: undefined		//延时
				 */
				var ops = {
					timingFunction: "linear",
					duration: "400ms",
					x: 0,
					y: 0,
					z: 0
				};
				$.extend(ops, options);
				var style = "translate3d({0}px,{1}px,{2}px)";
				style = style.format(ops.x, ops.y, ops.z);
				//角度
				if(ops.rotate !== undefined){
					style += " rotate({0}deg)".format(ops.rotate);
				};
				//缩放
				if(ops.scale !== undefined){
					style += " scale({0})".format(ops.scale);
				};

				//动作函数
				//:linear;

				var css = options.css || {};			//现有的css
				css["-webkit-transform"] = style;
				css["-webkit-animation-timing-function"] = ops.timingFunction;
				if(ops.duration !== undefined){
					css["-webkit-transition-duration"] = ops.duration;
				}
				return css;
			};
			options.css = $getCSS();
			return this.animaClass(options);
		},
		animaClass: function(options) {
			var ops = {
				//cssType: "class",			//css的类型，class表示为
				remove: true
			};
			$.extend(ops, options);


			var evtName = ops.endEventName;
			var isClass = typeof(ops.css) == "string";
			var that = this;

			//包含结束事件
			if(ops.onEnd || ops.endCss || (ops.remove && isClass)){
				evtName = evtName || isClass ? "webkitAnimationEnd" : "webkitTransitionEnd";
				//添加事件
				that.one(evtName, function(){
					//是否删除样式
					if(ops.remove && isClass){
						that.removeClass(ops.css);
					};

					//添加结的style或者className
					if(ops.endCss){
						if(typeof(ops.endCss) == "string"){
							that.addClass(ops.endCss);
						}else{
							that.css(ops.endCss);
						};
					}

					$.callEvent(ops.onEnd, [that]);
				});
			};

			//添加style或者
			if(isClass){
				that.addClass(ops.css);
			}else{
				that.css(ops.css);
			};

			return this;
		},
		//实际一个动画，如果支持css3，则用css的变形动画
		moveTo: function(offset, duration, timingFunction){
			var style;
			offset.x = offset.x || 0;
			offset.y = offset.y || 0;
			duration = duration || 400;
			duration += "ms";
			timingFunction = timingFunction || "ease";

			if($.support.translate3d){
				style = "translate3d({0}px,{1}px,{2}px)";
			}else if($.support.transform){
				style = "translate({0}px, {1}px)"
			}else{
				//不支持动画，直接用jquery的动画
				return this.animate({
					left: offset.x,
					top: offset.y
				}, duration);
			};

			style = style.format(offset.x, offset.y, 0);
			var prefix = $.env.CSSPrefix;
			var css = {};
			css["{0}transition-property".format(prefix)] = "{0}transform".format(prefix);
			css["{0}transform".format(prefix)] = style;
			css["{0}animation-timing-function".format(prefix)] = timingFunction;
			css["{0}transition-duration".format(prefix)] = duration;
			return this.css(css);
		},
		/*
		 * 获取或者设置缓存，依赖于jQuery的data，不需要设置key
		 * 默认key为mf_cache_element
		 * @params {Object} cache 要设置的缓存
		 * @params {Boolean} repeace 是否替换现有缓存
		 */
		cache: function(cache, replace){
			var key = "mf_cache_element";
			var data = this.data(key) || {};
			if(cache === undefined) return data;
			//删除缓存
			if(cache === null) return this.removeData(key);

			if(replace){
				data = cache;
			}else{
				$.extend(data, cache);
			};
			return this.data(key, data);
		}
	});
})(jQuery);

/*
 * 将输入框置为智能时间输入
 */
/*
(function($){
	$.fn.smartTime = function(option) {
		option = option || {};
		var obj = this;
		var getValue = function() {
			var value = obj.val();
			//首先判断是否全部为数字
			var h, m;
			var pattern = /^\d+$/;
			if (pattern.test(value)) {
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
			} else {
				pattern = /^(\d+).+?(\d+)$/;
				if (pattern.test(value)) {
					h = RegExp.$1;
					m = RegExp.$2;
				} else {
					return option.value || new Date().format("hh:mm");
				}
			}

			h = parseFloat(h);
			m = parseFloat(m);

			if (isNaN(m)) {
				m = 0;
			} else if (m > 59) {//如果超过59，则将多余的时间计算到小时
				h += Math.floor(m / 60);
				m = m % 60;
			}

			if (h > 23) {
				h = h % 24;
			}

			h = h < 10 ? "0" + h : h;
			m = m < 10 ? "0" + m : m;
			return "{0}:{1}".format(h, m);
		};

		switch (option.action) {
			case "get":
				return getValue();
			case "set":
				this.val(option.value);
				break;
			default:
				this.bind("blur", function() {
					$(this).val(getValue());
				}).val(option.value || "")
					.bind("click", function() { this.select(); });
		}
	};
})(jQuery);
*/


//扩展listview
(function($){
	var _ops;
	$.fn.listView = function(datas, options){
		var valueKey = "value", textKey = "text";
		//获取选中的
		if(datas == "get"){
			var objSelected = this.find(">a.selected");
			if(objSelected.length == 0) return false;
			return objSelected.attr("data-value");
		};

		_ops = options || {};
		datas = datas || [];
		var that = this, selected = "selected";
		//创建一个item
		//label用于显示文本，span用于显示icon，button用于显示操作按钮，如删除
		var $appendItem = function(item){
			var value = item[valueKey];
			var html = '<a data-value="{0}"><span/>';
			html += '<label>{1}</label><button /></a>';
			html = html.format(value, item[textKey]);
			var obj = $(html);
			if(value == _ops.selected){
				obj.addClass(selected);
			};
			that.trigger("onDrawItem", [obj, item]);
			that.append(obj);

			//绑定点击事件
			$.tap(obj, function(){
				that.find(">." + selected).removeClass(selected);
				obj.addClass("selected");
				//触发选中事件
				that.trigger("onSelected", [obj, value, true, item]);
			});

			//绑定按钮事件
			$.tap(obj.find("button"), function(event){
				//阻止冒泡
				event.stopPropagation();
				//触发事件
				that.trigger("onControl", [obj, value, item]);
			});
			return obj;
		};

		datas.forEach(function(item, index){
			$appendItem(item);
		});

		//绑定选中和更新的事件
		return this.bind("onSelect", function(event, value){
			that.find(">." + selected).removeClass(selected);
			var obj = that.find('a[data-value="{0}"]'.format(value));
			if(obj.length == 1){
				obj.addClass(selected);
				that.trigger("onSelected", [obj, value, false]);
			}
		}).bind("onUpdate", function(event, data){			//更新，如果不存在则添加
				event.stopPropagation();
				var obj = that.find('>[data-value="{0}"]'.format(data[valueKey]));
				//没有找到，创建一个新的
				if(obj.length == 0){
					obj = $appendItem(data);
				};

				//更新数据
				obj.find(">label").text(data[textKey]);
			}).bind("onRemove", function(event, value){
				event.stopPropagation();
				//清空所有数据
				if(!value){
					return that.empty();
				};

				//清除某一个
				var obj = that.find('>[data-value="{0}"]'.format(value));
				obj.remove();
			});
	};
})(jQuery);

(function($){
	var _className = "mf_checked";
	//模拟checkbox，以后可以模拟正常/ios/wp/android风格
	$.fn.checkbox = function(){
		var arg0 = arguments[0];
		if(arg0 == "get"){
			return this.find(">div.mf_checkbox").hasClass(_className);
		};

		var that = this;
		var html = '<div class="mf_checkbox">';
		//TODO 自动检测客户端类型适配不同的风格
		if(false){
			html += '<label>{0}</label><div class="frame">';
			html += '<div><span class="off" /><span class="on" /></div>';
			html += '</div>';
		}else{
			html += '<span class="state" /><label>{0}</label>';
		};
		html += '</div>';
		html = html.format(arg0 || "");
		var obj = $(html);
		this.html(obj);

		//点击
		$.tap(obj, function(e){
			e.stopPropagation();
			obj.toggleClass(_className);
			that.trigger("onChanged", [obj.hasClass(_className), true]);
		});

		return this.bind("onCheck", function(event, checked){
			obj.toggleClass(_className, checked);
			that.trigger("onChanged", [obj.hasClass(_className), false]);
		});
	}
})(jQuery);

/*
 色带
 */
(function($){
	$.fn.ribbon = function(options){
		var ops = {
			icon: false,			//icon=true，则在每个色块中添加<span class="icon" />
			//种子颜色，只能接受rgba或者hex的颜色值
			seedColor: ["#313131", "#d80001","#6a0073","#166f02","#7e3301","#01747e","#0004a3","#7f7801"],
			seedInBox: 1,		//一个box(UL)中放多少种种子颜色，-1表示所有颜色都放在一个box中
			reverse: false,		//是否反向排列
			step: -50,					//颜色的步长
			gradient: true, 		//是否使用渐变背景色
			colors: null,				//自定定的颜色，为二维数组
			expandCount: 5						//每一种种子颜色延伸的数量
		};

		$.extend(ops, options);
		var rgba, color;
		var html = '<div class="mf_ribbon">';
		var seedCount = ops.seedColor.length;

		//把颜色计算到数组当中
		var iInc = 0, jInc = 0, colorArr = [];		//颜色的多维数组
		for(var i = 0; i < seedCount; i ++){
			if(i == 0 || i % ops.seedInBox == 0){
				colorArr[iInc] = [];
				jInc = 0;
				iInc ++;
			};
			rgba = ops.seedColor[i].extractRGBA();
			if(rgba === false) continue;
			//渐变色
			for(var j = 0; j < ops.expandCount; j ++){
				color = "rgba({0}, {1}, {2}, {3})".format(rgba.r, rgba.g, rgba.b, rgba.a);
				colorArr[iInc - 1][jInc] = color;
				rgba.r -= ops.step;
				rgba.g -= ops.step;
				rgba.b -= ops.step;
				jInc ++;
			};
		};

		//创建颜色盒子
		var colorBoxFn = function(colors, index, flag){
			var cell = '<li style="background:{0}" data-color="{1}">{2}</li>';
			var icon = ops.icon ? '<span class="icon" />' : '';

			var result = '<ul data-index="{0}"{1}>'.format(index,
				flag ? ' flag="{0}"'.format(flag) : "");
			var tmpHtml = '', background;
			colors.forEach(function(item, index){
				background = ops.gradient ? $.lineGradient(item) : item;		//获取背景色
				tmpHtml = (ops.reverse ? "{1}{0}" : "{0}{1}")
					.format(tmpHtml, cell.format(background, item, icon));
			});
			result += tmpHtml;
			result += '</ul>';
			return result;
		};

		//添加渐变色
		colorArr.forEach(function(item, index){
			html += colorBoxFn(item, index);
		});

		//添加自定义色
		if(ops.colors){
			html += colorBoxFn(ops.colors, colorArr.length, "custom");
		};

		html += '</div>';
		return this.html(html);
	};
})(jQuery);

//扩展客户端环境
$.extend({
	timer: {},			//用于各种计时器
	//环境
	env:{
		style: 0,								//界面风格，iOS/Android/WP/PC
		isMultiTouch: false,		//是否支持多点触摸
		isSigned: false,		//用户是否已经登陆
		useSqlite: false,		//是否使用了Sqlite数据库
		inBox: false,				//是否在imBox中运行
		browserVersion: $.browser.version,
		isTouch: false, //是否为触设备
		isDebug: false,
		apiServer: "/",
		apiVersion: 1.0,
		language: null,
		timeZone: 0,
		//特定浏览器的CSS前缀
		CSSPrefix: "",
		//是否为平板电脑
		isPad: false,
		//是否在手机中
		isPhone: false
	},
	//检查浏览器是否支持某些特性
	support: {
		//是否支持变形，用于动画
		transform: false,
		//是否支持translate3d动画，可以硬件加速
		translate3d: false
	},
	//获取地址栏的查询信息，返回为JSON数据
	//spliter默认为&，如果是#，则可以获取Hash数据
	getQuery: function(url, spliter){
		var result = {};
		spliter = spliter || "?";
		var query = url || location.href;
		//检查是否有分隔字符
		var pos = query.indexOf(spliter);
		if (pos <= 0) return result;
		query = query.slice(pos + 1, query.length).split("&");
		for (var i = 0; i < query.length; i++) {
			var value = query[i].split("=")
			if (value.length == 2) {
				result[value[0].toLowerCase()] = value[1];
			}
		};
		return result;
	},
	//释放焦点
	releaseFocus: function(){
		document.activeElement.blur();
	},
	//性能测试用
	performanceTesting: function(loopCounter, callback){
		var start = new Date().getTime();
		for(var i = 0; i < loopCounter; i ++){
			callback(i);
		};
		im.log(new Date().getTime() - start);
	},
	/*
	 * 根据query，从target中找到目标对象
	 * @params target 要查找的目标
	 * @params {String} 查询条件，格式：xx.xxx，支持数组，如xx[0].xxx
	 * @params {String} spliter 分隔符，默认为.
	 */
	xPath: function(target, query, spliter){
		spliter = spliter || ".";
		var find = target;
		query.split(spliter).forEach(function(key, index){
			//没有找
			if(!find) return true;
			if(find){
				//检测是否为数组格式
				if(/^([\w_]+)\[(\d)\]$/.test(key)){
					key = RegExp.$1;
					find = find[key];
					if(find instanceof Array){
						find = find[parseInt(RegExp.$2)];
					}else{
						//没有找到匹配的数组，返回false
						find = false;
						return true;
					}
				}else{
					find = find[key];
				}
			};
		});
		return find;
	},
	//获取本地化
	i18n: function(xPath, params){
		var root = im.i18n[$.env.language] || im.i18n["default"];
		if(!xPath) return root;

		var node = $.xPath(root, xPath);
		/*
		xPath.split(".").forEach(function(item){
			node = node[item];
			if(node === undefined) return true;
		});

		if(node === undefined) node = "";
		*/

		if(typeof(node) == "function"){
			return node.apply(node, params);
		}else{
			return node;
		};
	},
	/*
	 * 调用一个函数，这个函数的好处就是可以在函数不存在的时候返回默认值
	 * 调用者只管调用就可以了，不用判断函数是否存在。
	 * @params {Function} fn 要调用的函数
	 * @params {Array} params 要调用函数的参数
	 * @params {Object} that 调用函数时可以用this访问的对象
	 * @params {} def 函数不存在时返回默认值
	 */
	callEvent: function(fn, params, that, def){
		if (fn && typeof(fn) == "function") {
			//return fn.apply(this, params);
			return fn.apply(that || this, params);
		}
		return def;
	},
	/*
	 * 从函数中提醒参数，函数必需包含形参
	 * @params {arguments} args 必需是arguments
	 */
	extractParams: function(args){
		var result = {};
		var pattern = /function\s\((.+)\)/i;
		if(pattern.test(args.callee.toString())){
			var params = RegExp.$1;
			params.split(",").forEach(function(item, index){
				result[item.trim()] = args[index];
			});
		};
		return result;
	},
	/*
	 * 向服务器提交数据或者请求数据，封装ajax，比Ajax更简单
	 *
	 */
	doAction: function(url, method, options){
		var accept = "text/plain,application/json;charset=utf-8;";
		accept += 'version:{0};client:{1};clientVersion:{2}';
		accept = accept.format(
			$.env.apiVersion || 0,
			$.env.client || im.e.Client.Unknown,
			$.env.clientVersion || 0);
		var headers = {
			"Accept-Language":$.env.language,
			Accept: accept
		};

		if(im.member.token) headers.Authorization = im.member.token;
		$.ajax({
			statusCode: options.statusCode,
			headers: headers,
			url: url,
			data: options.data || {},
			type: method || "POST",
			dataType: options.dataType || "JSON",
			success: function(data){
				$.callEvent(options.onSuccess, [data]);
			},error: function(res){
				var fnList = {
					_403: "onForbidden",
					_401: "onUnauthorized",
					_500: "onServerError",
					_404: "onNotFound"
				};

				var fn = fnList["_" + res.status];
				$.callEvent(options[fn], [res.status, res]);
				$.callEvent(options.onError, [res.status, res]);
			}
		});
	},
	//串行执行数组
	serial: function(arr, fn, callback){
		var count = arr.length, index = 0;
		var _run = function(){
			if(index < count){
				index ++;
				fn.call(this, arr[index-1], function(){
					_run();
				});
			}else{
				$.callEvent(callback);
			}
		};

		_run();
	},
	/*
	 * 获取的时间戳
	 */
	time: function(){
		return new Date().getTime();
	},
	/*
	 * 获取随机数
	 * @params {Number} min 最小数字
	 * @params {Number} max 最大数字
	 */
	random: function(min, max) {
		return Math.ceil(Math.random() * (max - min + 1) + min);
	},
	/*
	 * 获取唯一的字符
	 */
	uniqueText: function(prefix, stuffix){
		return "{0}{1}{2}{3}".format(prefix || "",
			$.time(),
			$.random(1000, 100000),
			stuffix || "");
	},
	/*
	 * 图片预加载
	 * @params {Array} images 待加载的图片数组
	 * @params {Function} omCompleted 图片全部加载完成后的回调
	 */
	imagePreloading: function(images, omCompleted){
		if(typeof(images) == "string") images = [images];
		var index = 0, count = images.length;
		images.forEach(function(item){
			var img = new Image();
			if(omCompleted){
				img.onload = function(){
					index ++;
					if(index == count) $.callEvent(omCompleted);
				};		//end onload
			};			//end if
			img.src = item;
		});			//end forEach
	},
	/*
	 * 获取当前鼠标所在的位置，仅限于触摸设备
	 * @params {Object} e 触摸事件的对象
	 */
	mousePoint: function(e){
		var data = {x: 0, y: 0};
		if(e.touches){
			data.x = e.touches[0].pageX;
			data.y = e.touches[0].pageY;
		}else{
			data.x = e.clientX;
			data.y = e.clientY;
		};
		return data;
	},
	/*
	 * 产生一个简单的垂直线性渐变背景，只有两种颜色，根据浏览器进行判断用哪一种线性渐变
	 */
	lineGradient: function(from, to, scale){
		if(!from) return from;
		to = to || -30;
		if(typeof(to) == "number"){
			to = from.mateColor(to);
		};

		var prefix = $.env.CSSPrefix;
		var text = "linear-gradient(top,  {0} 0%, {1} 100%)";
		if($.browser.safari){
			if($.browser.version < 5.1){
				text = "gradient(linear, left top, left bottom, color-stop(0%,{0}), color-stop(100%,{1}))";
			};
		}

		var background = prefix + text;
		return background.format(from, to);
	},
	/*
	 * 与普通的click事件不一样，tap会根据客户环境不一样来确定要绑定哪个事件
	 * 如果是普通pc，就绑定click事件，如果是触摸设备，就绑定模拟click事件
	 * 这样可以达到不管在什么设备上都及时响应的目的
	 * 如果需要特殊的用法，请直接使用touch事件
	 * @params {jQuery} obj, 要绑定的对象
	 * @params {Function} event 触发的事件
	 */
	tap: function(obj, event){
		//$.env.tapCounter = ($.env.tapCounter || 1) + 1;
		//console.log($.env.tapCounter);
		if($.env.isTouch){
			obj.touch({clickEvent: event});
		}else{
			obj.bind("click", event);
		};
		//obj.bind("onTap", event);
		return obj;
	}
});


$.extend({

	//pc和手机的事件不一样，根据手机使用的事件取对应的事件，如果当前环境是手机，则直接返回
	getEventName: function(key){
		if(window.Touch) return key;

		return {
			touchstart: "mousedown",
			touchmove: "mousemove",
			mouseup: "touchend",
			touchcancel: "touchcancel"
		}[key];
	},
	//获取随机颜色
	randomColor: function(){
		var arg0 = arguments[0], arg1 = arguments[1];
		var r, g, b, a;

		if(arguments.length < 3 || typeof(arg1) == "number" ){
			r = g = b = arg0 || [0, 255];
			a = arg1 == undefined ? 1 : arg1;
		}else{
			r = arg0 || [0, 255];
			g = arg1 || [0, 255];
			b = arguments[2] || [0, 255];
			a = arguments[3] == undefined ? 1 : arguments[3];
		};

		return "rgba({0}, {1}, {2}, {3})".format(
			$.random(r[0], r[1]),
			$.random(g[0], g[1]),
			$.random(b[0], b[1]),
			a instanceof Array ? $.random(a[0] * 100, a[1] * 100) / 100 : a
		);
	}
}, jQuery);

//**********************************国际化********************
/*
 数据格式
 {
 "default":{									//必需存在default的语言（即标准英语）
 caption: "简体中文",				//语言名称
 expression:{						//通过表达式自动转换语言
 main:[
 //叶子节点，expr即表达式，可以通过$(表达式)查找找到对应的元素;
 //type:　节点的类型，默认为text, 表示直接使用$(expr).text(value); attr表示直接操作元素的attr，html表示直接使用$(expr).html(value); val表示直接使用$(expr).val(value)
 {expr: "#lblMail", value: "E-mailQueue", type: "attr/text/html/value"}
 ]
 },
 about: {				//可以无限扩展深度
 title: "Title"
 }
 调用方式:
 1.给数据赋值，指明$.i18n.data = [];
 2.指定表达式，转换表达式语言
 3.在程序中通过$.i18n.get(key, leaf)方式获取多语言
 */

/*
 * 扩展Touch事件，因为iPad/iPhone的Click事件优先级比Touch事件低，Click一般会慢到300毫秒
 * 所有的click事件都改为touch，由touch判断是click还是模拟click事件
 * touch可以实现模拟拖动，支持长按
 */
(function($){
	$.fn.bindTouchEvent = function(type, fn, capture){
		return this.each(function () {
			this.addEventListener(type, fn, capture ? true : false);
		});
	};

	//删除事件
	$.fn.unbindTouchEvent = function (type, fn, capture) {
		return this.each(function () {
			this.removeEventListener(type, fn, capture ? true : false);
		});
	};

	var _startEvt = "touchstart", _moveEvt = "touchmove",
		_endEvt = "touchend", _cancelEvt = "touchcancel";
	if(!window.Touch){
		_startEvt = "mousedown";
		_moveEvt = "mousemove";
		_endEvt = "mouseup";
	};

	//获取事件的对应的函数名
	var _getEventName = function(type){
		switch(type){
			case "onDragStart":
			case _startEvt:  return "touchstart";
			case _moveEvt: return "touchmove";
			case _endEvt: return "touchend";
			case _cancelEvt: return "touchcancel";
			default: return false;
		};
	};

	/*
	 * 1.模拟点击事件，如果是在PC浏览器环境下，则使用mousedonw/move/up代替
	 * 2.模拟长按事件
	 * 3.模拟拖拽功能
	 * 4.每个动作都可以响应回调
	 * 5.可以模拟手势事件(主要针对移动设备)，手势和移动不一样，手势是在结束才判断是否需要触发
	 */
	var touchEvent = function(el, options){
		var that = this;
		this.element = el;
		this.options = options;
		//获取一个timer，用于长按的计数器
		this.timer = $.uniqueText("mf_timer_");
		//绑定开始事件，touchstart或者mousedown
		this.element.bindTouchEvent(_startEvt, this, false);
		//是否要取消点击事件，当存在长按的时件的时候，点击事件与长按会冲突，长按优先于点击
		this.cancelClick = false;
		//是否已经移动
		this.moved = false;
	};

	//扩展方法
	touchEvent.prototype = {
		//事件处理器
		handleEvent: function(e) {
			var fn = _getEventName(e.type);
			if(fn){
				this[fn](e);
			};
		},
		proxyEvent: function(e){
			this.handleEvent(e);
		},
		//取消
		touchcancel: function(){
			var that = this, ops = that.options, el = that.element;
			var ePoint = this.endPoint, sPoint = this.startPoint;
			that.clearTimer();
			that.clean();				//清除事件

			//移动结束，回高停止事件
			$.callEvent(ops.stopEvent, [e, sPoint, ePoint, true], el);
		},
		//touch开始(或者mousedown)
		touchstart: function(e) {
			var that = this, ops = that.options;
			//禁止冒泡
			if(ops.preventDefault) e.preventDefault();

			this.moved = false;
			this.cancelClick = false;
			var el = that.element;
			this.startPoint = $.mousePoint(e);
			this.endPoint = null;

			//是否停止，如果回调函数存在的的话，一般用于拖拽
			var isStop = $.callEvent(ops.startEvent, [e, this.startPoint], el, false);
			if(isStop) return;

			//不包括移动、长按、点击和停止事件，执行下去没有意义
			if(!ops.clickEvent && !ops.longPressEvent &&
				!ops.moveEvent && !ops.stopEvent) return;

			//长按事件，需要加入计时器
			if(ops.longPressEvent){			//延时事件
				$.timer[that.timer] = window.setTimeout(function(){
					that.cancelClick = true;			//如果触发了延时事件，则需要取消click事件
					$.callEvent(ops.longPressEvent, [e], el);
				}, ops.pressDuration);
			};

			if(ops.pressed) el.addClass(ops.pressed);

			//确定响应事件的对象
			var target = ops.moveObject || el;

			//绑定取消事件/移动事件/结束事件
			var $event = function(e){
				that.handleEvent(e);
			};

			target.bindTouchEvent(_cancelEvt, this, false);
			target.bindTouchEvent(_moveEvt, this, false);
			target.bindTouchEvent(_endEvt, this, false);
		},
		//移动的事件(mousemove)
		touchmove: function(e) {
			var ops = this.options;
			//移动就不会发生长按了，所以要清除长按的计时器
			this.clearTimer();
			//已经被移动
			this.moved = true;
			//结束的位置就是当前移动的位置
			this.endPoint = $.mousePoint(e);
			//是否要删除press样式
			if(ops.pressed) this.element.removeClass(ops.pressed);
			//调用moveEvent事件
			$.callEvent(ops.moveEvent, [e, this.startPoint, this.endPoint], this.element);
		},
		//结束移动事件(mouseup)
		touchend: function(e) {
			var that = this, ops = that.options, el = that.element;
			var ePoint = this.endPoint, sPoint = this.startPoint;
			that.clearTimer();
			that.clean();				//清除事件

			//调用移动结束的事件
			$.callEvent(ops.stopEvent, [e, sPoint, ePoint, false], el);

			//判断是否要调用click事件
			var isClick = !this.cancelClick  && ops.clickEvent && (!ePoint ||
				(Math.abs(ePoint.x - sPoint.x) <= ops.clickOffset.x &&
					Math.abs(ePoint.y - sPoint.y) <= ops.clickOffset.y));
			if (isClick) $.callEvent(ops.clickEvent, [e], el);

			//=================下面的代码处理手势事件=======================
			//没有gestureEvent事件，或者没有移动，退出
			if(!ops.gestureEvent || !this.moved) return;
			//计算移动的长短
			var x1 = sPoint.x, x2 = ePoint.x, y1 = sPoint.y, y2 = ePoint.y;
			var yLen = Math.abs(y1 - y2), xLen = Math.abs(x1 - x2);
			var direction, isLeftRight = xLen > yLen;
			var offset = isLeftRight ? yLen : xLen;
			if(offset > ops.gestureOffset) return;			//划动波动太大，不触发事件

			//获取长度
			var length = ops.length;
			//计算百分比的长度
			if(typeof(ops.length) != "number"){
				var eleLen = isLeftRight ? el.outerWidth() : this.element.outerHeight();
				length = eleLen * parseFloat(length) / 100;
			}

			//$.debug(xLen, yLen, offset, length);
			//划动的长度不足以引发事件
			if((isLeftRight && xLen < length) || (!isLeftRight && yLen < length)) return;

			//判断方向
			if(isLeftRight){
				direction = x1 < x2 ? "leftRight" : "rightLeft";
			}else{
				direction = y1 < y2 ? "topBottom" : "bottomTop";
			}

			//判断方向是否可以引发事件
			if((ops.gestureType == "x" && isLeftRight) ||
				(ops.gestureType == "y" && !isLeftRight) ||
				new RegExp("^{0}$".format(ops.gestureType), "ig").test(direction)){
				$.callEvent(ops.gestureEvent, [direction, x1, x2, y1, y2]);
			}
		},
		//清除计时器
		clearTimer: function(){
			//只有长按才会使用计时器
			if(!this.options.longPressEvent) return;

			var timer = $.timer[this.timer];
			if(!timer) return;
			window.clearTimeout(timer);
			delete $.timer[this.timer];
		},
		//清除事件
		clean: function(){
			var el = this.element, ops = this.options;
			var target = ops.moveObject || el;
			//解绑事件
			target.unbindTouchEvent(_cancelEvt, this, false);
			target.unbindTouchEvent(_moveEvt, this, false);
			target.unbindTouchEvent(_endEvt, this, false);

			//如果没有移动，并且pressed样式存在的话，移除样式。如果已经移动，则在移动的时候已经移除了
			if(!this.moved && ops.pressed) el.removeClass(ops.pressed);
		}
	};

	//===============================扩展jQuery方法=================
	/*
	 option:{
	 clickEvent: null, 			//响应模拟的click事件

	 longPressEvent: null,	//长按事件
	 gestureEvent: null,		//响应手势事件
	 //响应滑动的方式，包括topBottom, leftRight, rightLeft, bottomTop, custom
	 //当选择为custom的时候，会实时将座标返回给函数
	 gestureType: "x|y",
	 length: "30%",
	 clickOffset: 5|｛x: 5, y: 5｝,
	 //touch的className，如果此项为空，则不添加。
	 //按下的时候会添加这个样式，释放/取消/移动的时候会删除这个样式
	 pressed: "pressed"
	 }
	//在手机中替代click事件，quickResponse表示快速响应，movestart之后就立即响应click事件
	 */
	$.fn.touch = function(){
			var ops = {
				preventDefault: true,			//是否阻止冒泡
				//将move事件绑定到哪个控件中，没有设置则为当前对象，一般不用设置，除非特殊用法
				moveObject: null,
				//长按延时的时长，以毫秒计，只有LongPressEvent被绑定才有效
				pressDuration: 100,
				//长按的事件
				longPressEvent: null,
				//响应停卡移动的事件
				stopEvent: null,
				//响应移动事件
				moveEvent: null,
				//响应开始移动的事件
				startEvent: null,
				//点击事件
				clickEvent: null,
				//手势的事件
				gestureEvent: null,
				//手势的类型 x|y
				gestureType: "x",
				//允许出现的偏差，因为手势不可能划直线，从movestart到moveend会存在偏差
				gestureOffset: 50,
				//响应的长度，可以是对象的百分比(加上百分号)，也可以是具体的像素
				length: "20%",
				//点击的偏移量，有时候用户点击的时候会轻微地移动，一点误差在5px左右
				clickOffset: {x: 10, y: 10},
				//touch的className，如果此项为空，则不添加。
				//按下的时候会添加这个样式，释放/取消/移动的时候会删除这个样式
				pressed: "pressed"
			};

			//如果第一个参数只是一个函数，则默认为点击事件
			if($.isFunction(arguments[0])){
				ops.clickEvent = arguments[1];
			}else{
				$.extend(ops, arguments[0]);
			};

			//调用事件
			return this.each(function(){
				var that = $(this);
				//绑定onTouch事件，可以用trigger触发
				that.bind("onTouch", ops.clickEvent);
				new touchEvent(that, ops);
			});		//end each
		};
})(jQuery);

//设置环境
(function(){
	//检查是否支持translate3d属性
	var checkTransforms3D = function(){
		if("checked" in arguments.callee){
			return arguments.callee.checked;
		}
		if('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix())
			return true;
		else{
			var css = ['perspectiveProperty', 'MozPerspective', 'OPerspective', 'msPerspective']
			for(var p in css)
				if(css[p] in document.documentElement.style)
					return true;

		}
		return false;
	};

	//检查某个属性是否支持，对大小写敏感
	var checkStyle = function(style){
		var prefix = $.env.CSSPrefix;
		prefix = prefix.replace(/\-/ig, "");
		if(prefix == "moz") prefix = "Moz";
		style = prefix + style.substr(0, 1).toUpperCase() +
			style.substr(1, style.length);

		var s = document.documentElement.style;
		return Boolean(s[style] !== undefined)
	}

	var e = $.env;
	//增加一个是否使用Sqlite的参数，插件或者iPad/iPhone客户端才使用Sqlite
	e.useSqlite = false;
	e.isTouch = Boolean(window.Touch);
	e.timeZone = -new Date().getTimezoneOffset() / 60;

	//获取本地语言
	var nav = navigator;
	var language = nav.language || nav.browserLanguage || nav.userLanguage;
	e.language = language.toLowerCase();

	//获取浏览器的前缀

	var b = $.browser;
	if(b.webkit || b.chrome){
		e.CSSPrefix = "-webkit-";
	}else if (b.opera){
		e.CSSPrefix = "-o-";
	}else if(b.msie){
		e.CSSPrefix = "-ms-";
	}else if(b.mozilla){
		e.CSSPrefix = "-moz-";
	};

	//检查本地支持
	var s = $.support;
	s.translate3d = checkTransforms3D();
	s.translate3d = false;
	s.transform = checkStyle("transform");

	$(document).ready(function(){
		im.logTimer();
		//在发布的时候，此项会被改为true
		$.env.isDebug = true;
	});
})();


