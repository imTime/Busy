/*
 * 桌面程序
 */
(function(){
	im.desktop.air = {
		initBackground: function(){
			im.air.init(true);
		},
		//提示
		msgbox: function(title, message, code, flag, callback){
			alert(message);
		},
		/*
		 * 给badge上加上数字，针对Mac
		 */
		setBadge: function(number){
			im.air.setBadge(number);
		},
		/*
		 * 获取软件的版本
		 */
		playSound: function(file){
			im.air.playSound(file);
		},
		//获取背景页
		getBackground: function(){
			return im.desktop.windows[im.desktop.modules.background];
		},
		/*
		 * 弹出提醒
		 */
		popupReminder: function(params){
			params = params = $.param(params);
			im.desktop.air.showNotificationModule(params);
		},
		/*
		 * 创建模块，调用者一定是background，其它模块无权直接调用
		 */
		createWindow: function(module, options, singleton, callback){
			var currentModule = im.desktop.getModule();
			if(!currentModule || currentModule != im.desktop.modules.background){
				return im.log("Method createWindow caller is invalid.");
			};

			//只能创建一个
			var win = im.desktop.windows[module];
			if(singleton && im.air.windowExist(win)){
				//存在，激活
				var nat = win.nativeWindow;
				//nat.minimize();			//先最小化
				//如果已经隐藏，则重新加载数据
				if (!nat.visible) {
					nat.visible = true;
				};
				nat.activate();
				$.callEvent(callback, [win, true]);
			}else{
				//不存在，创建
				im.air.createWindow(module, options, function(loader) {
					var win = loader.window;
					im.desktop.windows[module] = win;

					//给所创建的窗口windows.background赋值，便于与background进行交互
					var bg = im.desktop.modules.background;
					win.im.desktop.windows[bg] = window;
					win.$.env = $.env;
					win.im.member = im.member;
					win.im.interface = im.interface;

					//调用创建这个窗口的init方法
					win.im.desktop.init(module);
					$.callEvent(callback, [win, false]);
				});
			};
		},
		/*
		 * 创建主窗口
		 */
		showMainModule: function(callback) {
			var options = {
				windowOption: {
					resizable: true,
					maximizable: true
				}
			};

			this.createWindow(im.desktop.modules.main, options, true,
				function(win, exists){
					var nat = win.nativeWindow;
					nat.width = 1024;
					nat.height = 760;
					nat.visible = true;
					im.air.setWindowPosition(nat,
						{
							"position": "center"
						});
					$.callEvent(callback, [win]);
				});
		},
		/*
		 * 弹出窗口，该窗口启动的时候就已经被创建，不需要重复创建
		 * Popup窗口只能用于Windows的状态栏，不能用于Mac和Linux
		 */
		showPopupModule: function(callback) {
			var options = {
				transparent: true,
				systemChrome: air.NativeWindowSystemChrome.NONE,
				type: air.NativeWindowType.LIGHTWEIGHT
			};

			var that = this;
			this.createWindow(im.desktop.modules.popup, options, true,
				function(win, exists) {
					var nat = win.nativeWindow;
					//如果是新创建的，添加事件
					if(!exists){
						//失去焦点的时候隐藏
						nat.addEventListener(air.Event.DEACTIVATE, function(e) {
							//改成关闭
							e.target.visible = false;
						});
					};

					$.callback(callback, [win]);
				});
		},
		/*
		 * 显示关于窗口
		 */
		showAboutModule: function() {
			var options = {
				transparent: true,
				systemChrome: air.NativeWindowSystemChrome.NONE,
				type: air.NativeWindowType.LIGHTWEIGHT
			};

			var that = this;
			this.createWindow(im.desktop.about, options, true,
				function(loader) {
					var nat = loader.window.nativeWindow;
					nat.width = 570;
					nat.height = 350;
					im.desktop.setWindowPosition(nat, {"position": "center" });
				});
		},
		/*
		 * 弹出提醒通知
		 */
		showNotificationModule: function(params) {
			var options = {
				alwaysInFront: true,
				windowOption:{
					//transparent: false,
					systemChrome: air.NativeWindowSystemChrome.STANDARD,
					type: air.NativeWindowType.UTILITY
				},
				params: params
			};

			//创建窗口
			this.createWindow(im.desktop.modules.notification, options, false,
				function(win, exists) {
					var nat = win.nativeWindow;
					im.air.setWindowPosition(nat,
						{
							"position": "rightBottom",
							offset: { x: -5, y: -5}
						});

					//是否自动关闭
					//TODO 根据配置确定是否自动关闭
					var duration = 3;
					if (duration) {
						window.setTimeout(function() {
							loader.window.close();
						}, duration * 1000);
					};

					//延时显示，否则会在页面上卡顿
					window.setTimeout(function(){
						nat.visible = true;
					}, 50);
				}
			);
		}
	};
})();