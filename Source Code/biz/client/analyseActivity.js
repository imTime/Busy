/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/14/12
 * Time: 9:35 上午
 * 对活动进行分析，1.将每天的活动状态显示在一天的时间线上。2，可以分析一天什么时候是空闲的
 */

(function(){
	var _ops = {

	};

	var _ele = {
		container: null
	}

	/*
		将状态钉到地图上
	*/
	var pinStatusToMap = function(){

	};

	/*
	 * 创建基本的元素
	 */
	var createElement = function(){

	};

	//分析这个活动
	$.fn.analyseStatus = function(options){

		_ele.container = this;
		$.extend(_ops, options);			//合并选项
		return this;
	};
})();