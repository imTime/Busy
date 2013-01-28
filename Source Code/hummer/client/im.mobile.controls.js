/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 11/1/12
 * Time: 11:41 上午
 * To change this template use File | Settings | File Templates.
 */

/*
 * 适用于手机上的控件
 */
(function(){
	im.mobile.controls = {

	};
})();

/*
 * 构造一个slide，slide由一个header和一个content组成
 * header分为左右两个按钮，中间一个caption
 * content设置为可滚动
 */
(function(){
	//初始化
	var _init = function(obj, options){
		var h = im.mobile.env.device.height;
		obj.css({top: -h, height: h});
		var scroller, ele = {
			header: obj.find(">header.main"),
			content: obj.find(">div.content")
		};
		ele.header.slideupHeader();

		ele.header.bind("onClickLeftButton", function(){
			//点击左边的按钮关闭
			if(options.closeWhenLeftButton === true){
				obj.trigger("onHide");
			};

			$.callEvent(options.onClickLeftButton);
		}).bind("onClickRightButton", function(){
				//点击左边的按钮关闭
				if(options.closeWhenRightButton === true){
					obj.trigger("onHide");
				};
				$.callEvent(options.onClickRightButton);
			});

		if(options.leftText || options.rightText || options.caption){
			ele.header.trigger("onHeaderText",
				[options.caption, options.leftText, options.rightText]);
		}

		//设置content的高度和滚动条
		if(options.scroll){
			var id = ele.content[0].id;
			//设置高度
			var h = im.mobile.env.height - 44;
			ele.content.height(h);

			//设置了id，则设置垂直滚动
			if(id){
				scroller = new iScroll(id);
			};
		};

		obj.bind("onShow", function(){
			_display(obj, true);
		}).bind("onHide", function(){
				_display(obj, false);
			}).bind("onText", function(){
				ele.header.trigger("onHeaderText",
					Array.prototype.slice.call(arguments, 1));
			}).bind("onRefresh", function(){
				if(scroller) scroller.refresh();
			});
	};

	//显示/隐藏slide
	var _display = function(o, display){
		$.releaseFocus();
		var y = display ? im.mobile.env.device.height : 0;
		o.moveTo({y: y}, 600);
	};

	//实现一个listview
	$.fn.slideupView = function(options){
		_init(this, options);
		return this;
	};
})();

/*
 * 构造一个header
 */
(function(){
	$.fn.slideupHeader = function(options){
		var that = this;
		var ele = {
			leftButton: this.find("button.left"),
			rightButton: this.find("button.right"),
			caption: this.find("div.caption")
		}


		$.tap(ele.leftButton, function(){
			that.trigger("onClickLeftButton");
		});

		$.tap(ele.rightButton, function(){
			that.trigger("onClickRightButton");
		});

		return this.bind("onHeaderText", function(event, caption, left, right){
			if(left !== undefined){
				if(left) ele.leftButton.text(left);
				ele.leftButton.display(left !== false);
			}

			if(right !== undefined){
				if(right) ele.rightButton.text(right);
				ele.rightButton.display(right !== false);
			}
			ele.caption.text(caption);
			var w = im.mobile.env.device.width;
			if(ele.leftButton.is(":visible")) w -= ele.leftButton.outerWidth();
			if(ele.rightButton.is(":visible")) w -= ele.rightButton.outerWidth();
			w -= 25;
			ele.caption.width(w);
		});
	};
})();

//构造一个datepicker的slideup
(function(){
	im.mobile.controls.datepickSlideup = {
		init: function(o){
			o.slideupView({
				leftText: null,
				caption: "Select Date",
				rightText: "Done"
			});


		}
	};
})();

/*
 * 列表，右边按钮为返回，左边按钮为编辑
 */
(function(){
	var ele = {}, _editModel = false;
	$.fn.slideupListView = function(options){
		var that = this;
		//构造一个slideup
		this.slideupView({
			closeWhenLeftButton: true,
			scroll: true,
			onClickRightButton: function(){
				//启用或者禁止编辑模式
				_editModel = !_editModel;
				var text = _editModel ? options.editText : options.doneText;
				that.trigger("onText", [null, text, null]);
				options.listview.toggleClass("edit", _editModel);
			}
		});

		//设置文字
		that.trigger("onText", [null, options.backText, options.editText]);
		//初始化listview
		options.listview.listView([], {
			idKey: "value",
			textKey: "text"
		}).bind("onSelected", function(event, obj, value, clicked, item){
				if(!clicked) return;
				//编辑模式，触发编辑事件
				if(_editModel){
					event.stopPropagation();
					return that.trigger("onEdit", [obj, value]);
				};
				//非编辑模式
			}).bind("onControl", function(event, obj, value, item){
				//点击了控制按钮
				if(!_editModel) return;
				//编辑模式下，删除
				that.trigger("onRemove", [obj, value, item]);
			});

		//绑定设置数据的事件
		return this.bind("onData", function(event, data){
			var el = options.listview;
			el.trigger("onRemove");

			//添加数据
			data.forEach(function(item){
				el.trigger("onUpdate", item);
			});

			that.trigger("onRefresh");
		}).bind("onChangeStyle", function(event, isIcon){
				//设置列表风格是否为icon
				options.listview.toggleClass("icon", isIcon);
			});
	};
})();

/*
 * slider
 */
(function(){
	var _cacheName = "mf_slider";
	var _slider = function(options, container){
		this.element = {
			container: container
		}
		this.options = options;
		this.info = {
			width: options.width,
			min: options.min,
			max: options.max,
			value: options.value,
			left: options.left
		};


		this._init();
		this.setSlider();
	};

	_slider.prototype = {
		setSlider: function(){
			var el = this.element, info = this.info, ops = this.options;
			el.rightHandler.display(ops.range);
			info.handlerWidth = 20;
			info.width = ops.width - info.handlerWidth / 2;
			//计算粒度
			info.scale = info.width / (ops.max - ops.min);
			this.setPosition(info.value);
		},
		//设置位置
		setPosition: function(point, userTrigger){
			var el = this.element, info = this.info, ops = this.options;
			var x, duration = "0ms";
			//info.sliderPosition = el.slider.offsetPosition();
			//alert(info.sliderPosition.left);

			if(ops.disabled) return;
			if(typeof(point) == "number"){
				x = point * info.scale;
				info.value = point;
			}else{
				x = point.x - ops.left;
				info.value = Math.floor(x / info.scale);
				info.value = info.value.withinRange(ops.min, ops.max);
			};

			x = x.withinRange(-10, info.width);

			if(ops.range){

			}else{
				el.leftHandler.animaStyle({x: x, duration: duration});
				el.leftMask.animaStyle({x: 0, duration: duration,  css:{width: x + info.handlerWidth / 2}});
				el.container.trigger("onChanged", [info.value, userTrigger]);
				//$.callEvent(ops.onChange, [info.value], el);
			};
		},
		//初始化slide
		_init: function(container, ops){
			var el = this.element, info = this.info, ops = this.options, that = this;
			var html = '<div class="mf_slider"><div class="mf_line"></div>';
			html += '<div class="mf_mask" flag="left"></div>';
			html += '<span class="mf_handler" flag="left"></span>';
			html += '<span class="mf_handler" flag="right"></span></div>';

			el.container.html(html);
			el.slider = $("div.mf_slider", el.container).css("width", ops.width);
			el.leftHandler = $("span[flag='left']", el.container);
			el.rightHandler = $("span[flag='right']", el.container);
			el.leftMask = $("div.mf_mask[flag='left']", el.container);
			//el.leftHandler.css({"margin-left": -ops.width - 10});

			el.slider.touch({
				pressed: false,
				startEvent: function(e, point){
					that.setPosition(point, true);
					el.leftHandler.addClass("active");
				},
				moveEvent: function(e, sPoint, ePoint){
					that.setPosition(ePoint, true);
				},
				stopEvent: function(){
					that.setPosition(that.info.value, true);
					el.leftHandler.removeClass("active");
				}
			});
		}
	};


	$.fn.slider = function(){
		var arg0 = arguments[0];
		if(typeof(arg0) == "string"){
			var cache = this.data(_cacheName);
			switch(arg0){
				case "set":
					cache.setPosition(arguments[1]);
					return this;
					break;
				case "get":
					return cache.info.value;
					break;
				case "option":
					var override = arguments[1] || {};
					$.extend(cache.options, override);
					return cache.options;
				case "disabled":
					cache.options.disabled = arguments[1];
					this.toggleClass("mf_disabled", arguments[1]);
					break;
			};
			return;
		};

		//创建新的slider
		var ops = {
			min: 0,
			max: 100,
			value: 0,
			values: null,
			range: false,
			width: 200,
			left: 0
		};

		$.extend(ops, arg0);
		return this.each(function(){
			var that = $(this);
			that.data(_cacheName, new _slider(ops, that));
		});
	};
})();