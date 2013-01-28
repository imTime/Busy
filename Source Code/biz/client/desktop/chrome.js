(function(){
	im.desktop.chrome = {
		setBadge: function(badge){
			im.chrome.setBadge(badge || "");
		},
		msgbox: function(title, body, tag, callback){
			im.chrome.msgbox(title, body);
		},
		/*
		 * 初始化背景页
		 */
		initBackground: function(){
			var details = chrome.app.getDetails();
			$.env.clientVersion = details.version;
			$.env.language = details.current_locale.toLowerCase();
			$.env.language = $.env.language.replace("_", "-");
			im.desktop.chrome.initOmnibox();
		},
		//获取背景页
		getBackground: function(){
			return chrome.extension.getBackgroundPage();
		},
		/*
		 * 弹出提醒
		 */
		popupReminder: function(params){
			params = params = $.param(params);
			var url = 'notification.html?' + params;
			var notification = webkitNotifications.createHTMLNotification(url);
			notification.show();
		},
		/*
		 * 实现Chrome的多功能框
		 */
		initOmnibox: function(){
			//用户输入改变
			chrome.omnibox.onInputChanged.addListener(function(text, suggest){
				var result = [
					{
						content: "输入",
						description: "<url>这是</ulr><match>测试</match><dim>哈哈</dim>"
					}
				];
				suggest(result);
			});

			//用户接受了建议
			chrome.omnibox.onInputEntered.addListener(function(text){
			});
		},
		/*
		 * 打开主模块
		 */
		showMainModule: function(){
			im.chrome.openModule(im.desktop.modules.main);
		}
	};
})();
