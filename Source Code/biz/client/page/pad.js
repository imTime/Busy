/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 11/1/12
 * Time: 8:10 下午
 * To change this template use File | Settings | File Templates.
 */
(function(){
	/*
	 * 运行于Pad上
	 */
	im.page.pad = {
		init: function(delayInit){
			//初始化页面元素，大屏下的初始化都是一样的
			//im.page.initElement();
			im.page.sign.init();
			im.page.fullscreen.init();
			if($.env.inBox){
				im.page.option.init();
			};

			if(!delayInit) this.delayInit();
		},
		delayInit: function(){

		}
	};
})();