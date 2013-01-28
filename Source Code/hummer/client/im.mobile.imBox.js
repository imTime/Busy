/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 10/24/12
 * Time: 8:10 下午
 * To change this template use File | Settings | File Templates.
 */
/*
 * 用于基于imbox的mobile(iOS)
 */
(function(){
	document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
	/*
	 * 进入到后台后的操作
	 */
	window.onEnterBackground = function(){

	};

	//方向发生改变
	window.onOrientationDidChange = function(from, to){

	};

	im.mobile.imbox = {
		/*
		 * 页面加载完成，加载流程
		 * 1.页面所有资源加载完成，通知imbox
		 * 2.imbox准备好环境，通知回调函数
		 * 3.完成页面的初始化，包括初始化数据库什么的
		 * 4.通知imbox可以加载并显示页面了(loaded)
		 */
		init: function(callback){
			var proxy = im.mobile.proxy;
			//重载sqlite的execute
			im.sqlite.executeSql = im.mobile.sqlite.executeSql;
			im.sqlite.query = im.mobile.sqlite.query;
			//通知imbox已经完成准备好了
			proxy.request(proxy.method.ready, function(res){
				var env = im.mobile.env;
				if(res.locale){
					//res.locale.currency = res.locale.currency.replace(/\w/ig, "");
					$.extend(env, res);
					$.env.language = res.locale.languageCode;
				};
				$.env.isPad = res.device.isPad;
				$.env.isPhone = !$.env.isPad;
				$.env.inBox = true;			//是在imbox内
				//判断是iPad还是iPhone
				$.callEvent(callback);
			});			//end request
		}
	};
})();