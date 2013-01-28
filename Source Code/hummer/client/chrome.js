/*
 * 与Chrome相关，和程序无关
 */

(function(){
	//监控安装事件
	chrome.runtime.onInstalled.addListener(function(details){

	});

	im.chrome = {
		msgbox: function(title, message){
			var notification = webkitNotifications.createNotification(
				'images/icons/48.png',  // 图标URL，可以是相对路径
				title,  // 通知标题
				message  // 通知正文文本
			);
			notification.show();
		},
		/*
		 * 设置badge
		 */
		setBadge: function(badge, color){
			chrome.browserAction.setBadgeText({
				text: badge.toString()
			});

			if(!color) return;
			chrome.browserAction.setBadgeBackgroundColor({
				color: color
			});
		},
		/*
		 * 打开新的tab
		 */
		openTab: function(url, reload) {
			var found = false;
			var baseUrl = chrome.extension.getURL(url);
			chrome.windows.getCurrent(function(current) {
				chrome.tabs.getAllInWindow(current.id, function(allTabs) {
					for (var i = 0; i < allTabs.length; i++) {
						var aTab = allTabs[i];
						if (aTab.url.toLowerCase() == baseUrl.toLowerCase()) {
							found = true;
							chrome.tabs.update(aTab.id, { "url": baseUrl, "selected": true });
							break;
						}
					}

					//找不到，并且不是重截页面的情况下，才打开新页
					if (!found && !reload) {
						found = true;
						chrome.tabs.create({ "url": url, "selected": true });
					}		//end if
				});			//end getAllInWindow
			});				//end getCurrent
		},
		/*
		 * 打开某个模块，如果没有.html，则加扩展名
		 */
		openModule: function(module){
			var url = module;
			if(url.indexOf(".") < 0) url += ".html";
			this.openTab(url);
		}
	}
})();