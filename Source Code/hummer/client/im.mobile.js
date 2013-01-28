/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/5/12
 * Time: 3:11 下午
 * 用于移动设备，注意：不要和imbox扯上关系
 */
(function(){
	im.mobile = {
		//大于等于7寸的叫Pad，小于这个尺寸叫Phone，两者界面不一样
		env: {
			device:{
				//可用屏幕的宽度
				width: 320,
				height: 460
			}
		},
		disableTouchMove: function(){
			//禁止全局级的touchmove事件
			document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
		},
		//列表中行的事件
		rowEvent: function(targets){
			targets.each(function(){
				var obj = $(this);
				var type = obj.attr("data-type");
				var klass = "pressed";
				//如果是input，则给里面的input添加blur的事件
				if(type == "input"){
					obj.find("input").bind("blur", function(){
						obj.removeClass(klass);
					}).bind("focus", function(){
							obj.addClass(klass);
						});
				};

				//点击的事件
				$.tap(obj, function(){
					//触发事件
					var flag = obj.attr("data-row");
					switch(type){
						case "checkbox":
							obj.find(">div.checkbox").trigger("onCheck");
							break;
						case "input":
							obj.find("input").focus();
							break;
					};
					obj.trigger("onRowEnter", [flag, obj]);
				});
			});
		},
		activeSlideup: null
	};
})();
