/*
	Safari扩展，依赖于im.desktop
*/

(function(){
	im.desktop.safari = {
		/*
		 * 动态创建一个Popover
		 */
		createPopover: function(barItem, url, width, height, guid){
			//barItem = barItem
			width = width || 300;
			height = height || 400;
			guid = guid || $.uniqueText("popover_");
			//创建popup
			var popup = safari.extension.createPopover(
				guid, url, width, height);
			this.getToolbarItem().popover = popup;
		},
		/*
		 * 获取工具栏上的按钮
		 */
		getToolbarItem: function(index){
			var items = safari.extension.toolbarItems;
			if(items.length < 0) return false;
			//索引
			if(typeof index == "number"){
				return index < items.length ? items[index] : false;
			};

			//按id
			var find = false;
			items.forEach(function(item){
				if(item.identifier == index){
					find = item;
					return true;
				};
			});
			return find;
		},
		setBadge: function(badge){
			safari.extension.toolbarItems[0].badge = badge
		},
		/*
		 * 获取弹出窗口
		 */
		getPopover: function(){
			return safari.extension.popovers[0];
		},
		/*
		 * 关闭popup窗口
		 */
		hidePopup: function(){
			im.desktop.safari.getPopover().hide();
		},
		/*
		 * 用户数据被成功加载，通知main
		 */
		memberDataLoaded: function(){
			//im.desktop.safari.proxy.onDataTranser();
		},
		//根据url查找一个tab
		findTab: function(url){
			var find = false;
			var wins = safari.application.browserWindows;
			wins.forEach(function(win){
				win.tabs.forEach(function(tab){
					if(tab.url == url){
						find = tab;
						return true;
					};		//end if
				});			//end tabs.forEach
				if(find) return true;
			});					//end wins.forEach

			return find;
		},
		/*
		 * 打开模块
		 */
		openModule: function(module, action, params){
			var url = module;
			if(url.indexOf(".") < 0) url += ".html";
			url = safari.extension.baseURI + url;
			var tab = this.findTab(url);
			if(!tab) {
				tab = safari.application.activeBrowserWindow.openTab();
				tab.url =  url;
			}else{
				//激活页面
				tab.activate();
			};
			im.desktop.windows[module] = tab;

			//包括动作，TODO Safari要求页面执行某个动作功能还不行
			if(action){
				/*
				var content = {
					action: action,
					params: params
				};

				im.desktop.safari.proxy.postMessage(
					"onExecuteAction", content, null, null, tab.page);
				*/
			}

			return tab;
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
		 * 初始化全局页面
		 */
		initBackground: function(){
			var app = safari.application;
			var s = im.desktop.safari;

			//接收从内容层传输过来的消息
			app.addEventListener("message", s.proxy.receiveMessage,false);
			//点击按钮事件，重新加载数据
			app.addEventListener("popover", s.clickBrowserButton, false);
			//验证显示button事件
			/*
			app.addEventListener("validate", function(event){
				alert(event.target);
				event.target.badge = "10";
			}, false);
			*/
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

/*
 * 注入原来的代码
 */
(function(){
	var _events = {};
	var _msgPreifx = "msg_";
	var _eventName = {
		request: "Request",
		ir: "IR",
		executeSql: "ExecuteSql",
		dataTranser: "DataTranser",
		openModule: "OpenModule",
		receiveDataFromApp: "ReceiveDataFromApp"
	};
	/*
	 * 拉截
	 * 不用考虑doAction，因为doAction主要是两个地方使用，一个是ir，另一个是request
	 */
	im.desktop.safari.proxy = {
		/*
		 * 接收到数据，统一处理
		 */
		receiveMessage: function(event){
			//包含event.name，交由专门的函数处理
			var that = im.desktop.safari.proxy;
			var fn = that[event.name];
			var data = (event.message || {}).content;
			//交给特定的响应函数处理
			if(fn) return $.callEvent(fn, [data, event], that);

			//检查events是否存在这个guid的处理函数
			fn = _events[event.message.guid];
			$.callEvent(fn, [data, event], that);
		},
		/*
		 * 传送数据
		 * @params {Object} message 要发送的数据
		 * @params {Object} target Optional 从应用层发送到内容层的时候，会包含此参数
		 */
		postMessage: function(name, content, callback, guid, target){
			guid = guid || $.uniqueText(_msgPreifx);
			var message = {guid: guid, content: content};
			//注册响应事件
			if(callback){
				/*
				if(name == "onRequest") {
					callback = function(data){
						alert(data);
					}
				}
				*/
				this.registerEvent(guid, callback);
			};

			target = target || safari.self.tab;
			//必需要有name，如果没有就使用guid做name
			target.dispatchMessage((name || guid), message);
		},
		/*
		 * 添加接收数据时候的Event
		 */
		registerEvent: function(guid, callback){
			//响应数据
			_events[guid] = function(data){
				$.callEvent(callback, [data]);
				//删除自己
				delete _events[guid];
			};
		},
		//=========================================
		//运行于应用层，处理内容层的消息，或者从应用层发消息给内容层
		/*
		 * 执行内容层传过来的Sql语句
		 */
		onExecuteSql: function(sqlList, event){
			im.sqlite.executeSql(sqlList, function(err, result){
				var content = {
					error: err,
					result: result
				};
				var guid = event.message.guid;
				im.desktop.safari.proxy.postMessage(null, content, null, guid, event.target.page);
			});
		},
		/*
		  传输数据
			如果event被赋值，则表示发起者是内容层->应用层->内容层，否则就是应用层->内容层
		 */
		onDataTranser: function(content, event){
			var target, name, guid;
			if(event) {
				target = event.target.page;
				guid = event.message.guid;
			};

			//没有请求来源，则检查main模块是否打开
			if(!target){
				var tab = im.desktop.windows[im.desktop.modules.main];
				if(tab) target = tab.self;
				name = "onReceiveDataFromApp";
			};

			//没有发送目标
			if(!target) return;

			var cp = im.interface.getCompute();
			var content = {
				member: im.member,
				env:$.env,
				calendars: cp.getCalendars(),
				statuses: cp.getStatuses()
			};

			this.postMessage(name, content, null, guid, target);
		},
		/*
		 * 打开某个模块
		 */
		onOpenModule: function(content, event){
			im.desktop.openModule(content.module);
		},
		/*
		 * 应用层从内容层接收到ir请求
		 */
		onIR: function(content, event){
			var that = this;
			//提起ir请求
			im.interface.ir(content.type, content.text, function(activity){
				//将结果发送到内容层
				var guid = event.message.guid;
				that.postMessage(null, activity, null, guid, event.target.page);
			});
		},
		/*
		 * 应用层从内容层接收了Request
		 */
		onRequest: function(content, event){
			var message = event.message;
			var that = this;

			var options = {
				data: content.data,
				onSuccess: function(res){
					//重新加载数据
					im.interface.loadMemberData();
					that.postMessage(null, res, null, message.guid, event.target.page);
				}
			};

			im.storage.request(content.module, content.method, options, content.id);
		},
		//===============================专用用于内容层的=======================
		//要求页面执行某个动作
		onExecuteAction: function(content){
			$.callEvent(im.page.executeAction, content.action, content.params);
		},
		/*
		 * 从应用层接受到数据
		 */
		onReceiveDataFromApp: function(content){
			$.env = content.env;
			im.member = content.member;
			im.interface.activitiesLoaded = true;
			//重新将数据添加到compute中
			var cp = im.interface.getCompute();
			//添加日历
			cp.addCalendars(content.calendars, true);
			cp.addStatuses(content.statuses);
		},
		/*
		 * 向应用层请求全局数据，包括$.env
		 * 内容层->应用层
		 */
		syncBackground: function(callback){
			var that = this;
			this.postMessage("onDataTranser", null, function(data){
				//that.onReceiveDataFromApp(data);
				im.desktop.safari.proxy.onReceiveDataFromApp(data);
				$.callEvent(callback);
			});
		},
		/*
		 * 用于拦截im.storage.reqeust方法
		 * 只应用于内容层，与应用层无关
		 * 内容层->应用层
		 */
		passed: function(module, method, options, id){
			var content = {
				module: module,
				method: method,
				id: id,
				data: options.data
			};

			//向应用层发送消息
			im.desktop.safari.proxy.postMessage(
				"onRequest", content, options.onSuccess);
		},
		/*
		 * 拦截执行Sql语句
		 */
		executeSql: function(sqlList, callback) {
			//向应用层发送消息
			im.desktop.safari.proxy.postMessage("onExecuteSql", sqlList,
				function(content){
					$.callEvent(callback, [content.error, content.result]);
				});
		},
		/*
		 * 拦截内容层的ir，发送消息请求
		 * 内容层->应用层
		 */
		ir: function(type, text, callback){
			var content = {
				type: type,
				text: text
			};
			im.desktop.safari.proxy.postMessage("onIR", content, callback);
		}
	};
})();