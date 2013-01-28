/*
 Safari扩展，依赖于im.desktop
 */

(function(){
	im.desktop.opera = {
		setBadge: function(badge){
			safari.extension.toolbarItems[0].badge = badge
		},
		/*
		 * 关闭popup窗口
		 */
		hidePopup: function(){
			//im.desktop.safari.getPopover().hide();
		},
		/*
		 * 用户数据被成功加载，通知main
		 */
		memberDataLoaded: function(){
			//im.desktop.safari.proxy.onDataTranser();
		},
		//根据url查找一个tab
		findTab: function(url){

		},
		/*
		 * 打开模块
		 */
		openModule: function(module, action, params){

		},
		/*
		 * 点击了浏览器上的按钮
		 */
		clickBrowserButton: function(){
			//从后台同步数据
			var popover = im.desktop.safari.getPopover();
			popover.contentWindow.im.desktop.loadPopupData();
		},
		/*
		 * 从应用层中同步数据
		 */
		syncBackground: function(module, callback){
			var ms = im.desktop.modules;
			//popup页也是应用层，坑爹呢
			if(module == ms.popup){
				//延时处理，因为background有时候会后加载，这里用PostMessage是比较合理的
				window.setTimeout(function(){
					var bg = safari.extension.globalPage.contentWindow;
					$.env = bg.$.env;
					im.member = bg.im.member;
					im.interface = bg.im.interface;
					callback();
				}, 500);
				return;
			};

			//初始化interface
			im.interface.init();
			im.interface.passed = this.proxy.passed;
			im.interface.ir = this.proxy.ir;
			//im.sqlite.executeSql = this.proxy.executeSql;
			//监听来自应用层的事件
			safari.self.addEventListener("message", this.proxy.receiveMessage,false);
			this.proxy.syncBackground(callback);
		},
		/*
		 * 添加Toolbar上的按钮
		 */
		addToolbar: function(){

		},
		/*
		 *ac 初始化全局页面
		 */
		initBackground: function(){
			//创建button
			var theButton;
			var ToolbarUIItemProperties = {
				disabled: false,
				title: 'Busy',
				icon: 'images/icons/19.png',
				popup: {
					href: 'popup.html',
					width: 300,
					height: 420
				}
			}
			theButton = opera.contexts.toolbar.createItem(ToolbarUIItemProperties);
			opera.contexts.toolbar.addItem(theButton);
		},
		/*
		 * 打开
		 */
		showMainModule: function(action, params){
			this.openModule(im.desktop.modules.main, action, params);
		},
		//桌面通知
		msgbox: function(title, body, tag, callback){
			//如果没有Notification，直接用Alert的方式提醒
			if(!window.Notification){
				return alert(title + "\n" + body);
			};

			var permission = Notification.permissionLevel();
			var that = this;
			var params = Array.prototype.slice.call(arguments);
			//根据权限判断
			switch(permission){
				case 'default':			//还没有获取权限
					Notification.requestPermission(function(){
						that.msgbox.apply(that, params);
					});
					break;
				case "granted":
					var n = new Notification(
						title,
						{
							body: body,
							tag : tag,
							onclick: function(){
								//打开主界面，并加载活动编辑窗口
								params =  Array.prototype.slice.call(params, 0, params.length - 1);
								$.callEvent(callback, params);
							}
						}
					);

					break;
				case "denied":		//没有权限，直接弹出提示
					alert(title + "\n" + body);
					break;
			};
		},
		/*
		 * 通知，必需要10.8才可以提交到通知中心去
		 */
		popupReminder: function(params){
			var $notify = function() {
				//没有notification

				//TODO 如果没有Notification，应该用其它方式向用户提醒
				if(!window.Notification) return;
				var permission = Notification.permissionLevel();

				//根据权限判断
				switch(permission){
					case 'default':			//还没有获取权限
						Notification.requestPermission($notify);
						break;
					case "granted":
						var data = im.desktop.getNotification(params);
						if(!data) return;
						var counter = data.age || data.counter;
						if(counter){
							counter = " [{0}] ".format(counter);
						}else{
							counter = "";
						};

						var body = "{0}{1} {2} ".format(data.when, counter, data.duration || "");
						var n = new Notification(
							data.title,
							{
								body: body,
								// prevent duplicate notifications
								tag : data.guid,
								onclose: function() {
									//忽略关闭
								},
								onclick: function(){
									//打开主界面，并加载活动编辑窗口
								}
							}
						);

						break;
					case "denied":		//无权限
						im.log("No permission")
						break;
				};
			};

			$notify();
		}
	};
})();
