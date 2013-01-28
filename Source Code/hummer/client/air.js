/*
 * 用于Air的桌面程序，与程序无关
 */
(function(){
	var _loadTrayMenu = function(menus){
		var app = air.NativeApplication.nativeApplication;
		var iconMenu = new air.NativeMenu();
		this.addMenu(iconMenu, menus);
		app.icon.menu = iconMenu;
	};

	_loadTrayMenu.prototype = {
		/*
		 * 添加菜单的叶子
		 */
		addLeafMenu: function(parent, data){
			//分隔符号
			if(!data){
				return parent.addItem(new air.NativeMenuItem("-", true));
			};

			//创建菜单
			var menu = parent.addItem(new air.NativeMenuItem(data.caption));
			menu.data = data.data;
			if (data.checked !== undefined) {
				menu.checked = data.checked;
			};
			if (!data.action) return menu;

			//执行动作
			menu.addEventListener(air.Event.SELECT, function(event) {
				if (typeof (data.action) == "string") {
					im.air.openBrowser(data.action);
				} else {
					$.callEvent(data.action, [event]);
				}
			});
			return menu;
		},
		/*
		 * 添加菜单
		 */
		addMenu: function(parent, menus) {
			//如果是数组，则循环
			var subMenu, that = this;
			menus.forEach(function(menu, index){
				if(menu.menus){
					var subMenu = new air.NativeMenu();
					parent.addSubmenu(subMenu, menu.caption);
					that.addMenu(subMenu, menu.menus);
				}else{
					that.addLeafMenu(parent, menu);
				};
			});
		},
		/*
		 * 选择一组菜单中的一个，并取消其它的选择
		 */
		checkedMenu: function(parentIndex, current) {
			//设置其它的菜单为未选中状况
			var menuList = app.icon.menu.getItemAt(parentIndex).submenu.items;
			for (var i = 0; i < menuList.length; i++) {
				menuList[i].checked = false;
			}
			current.checked = true;
		}
	};

	im.air = {
		sandbox: null,
		appInfo: {
			version: 0
		},
		/*
		 * 环境
		 */
		env: {
			version: 0,
			language: "en-us",
			platform: "WIN"
		},
		/*
		 显示badge，用于mac
		 */
		setBadge: function(number){
			im.log("set badge");
		},
		/*
		 * 用于重载的ajax
		 */
		ajax: function(options){
			//air.trace("访问ajax: {0}".format(options.url));
			var request = new air.URLRequest(options.url);
			//添加header
			if(options.headers){
				var headers = [];
				for(var key in options.headers){
					headers.push(new air.URLRequestHeader(key, options.headers[key]));
				};
				request.requestHeaders = headers;
			};

			//request.userAgent =  "conis";
			request.data = $.param(options.data || {});
			request.method = options.type;

			if($.env.isDebug){
				air.trace("请求URL：" + options.url);
				//air.trace("AJax请求数据：" + JSON.stringify(options.data));
			};

			//创建一个loader
			var loader = new air.URLLoader();
			//加载完成
			loader.addEventListener(air.Event.COMPLETE, function(event){
				var data = event.target.data;
				//转换为JSON数据
				if(options.dataType == "JSON" || options.dataType == "JSONP"){
					data = JSON.parse(data);
				};

				if($.env.isDebug){
					air.trace("Ajax获取数据成功" + JSON.stringify(event.target.data));
				};

				$.callEvent(options.success, [data]);
			});


			//出现错误
			loader.addEventListener(air.IOErrorEvent.IO_ERROR, function(event){
				air.trace("IO_ERROR");
			});

			//根据状态操作
			loader.addEventListener(air.HTTPStatusEvent.HTTP_STATUS, function(event){
				var status = event.status;
				if(status == 200) return;
				//非200，可能是发生了某个错误
				if(options.statusCode){
					$.callEvent(options.statusCode[status], [event]);
				};

				//跟踪调试用
				if($.env.isDebug){
					air.trace("请AJAX出错。")
				};

				$.callEvent(options.onError, [status, event]);
			});

			loader.load(request);
			/*
			try {
				loader.load(request);
			} catch (error) {
				//alert("Error connecting to login server.");
			}
			*/
		},
		/*
		 * 获取或者设置加密保存的数据，一般用于保存用户帐号和密码
		 */
		store: function(key, value){
			var storedValue;
			//读取
			if(value === undefined){
				storedValue = air.EncryptedLocalStore.getItem(key);
				if (storedValue) {
					value = storedValue.readUTFBytes(storedValue.length);
				}
				return value || "";
			};

			//写入
			var bytes = new air.ByteArray();
			bytes.writeUTFBytes(value);
			air.EncryptedLocalStore.setItem(key, bytes);
		},
		/*
		 * 初始化
		 */
		init: function(checkUpdate){
			var $readNode = function(root, name){
				var node = root.getElementsByTagName(name);
				if(node.length > 0){
					return node[0].firstChild.data;
				}
			};

			var xmlString = air.NativeApplication.nativeApplication.applicationDescriptor;
			var appXml = new DOMParser();
			var xmlObject = appXml.parseFromString(xmlString, "text/xml");
			var root = xmlObject.getElementsByTagName('application')[0];
			this.appInfo.name = $readNode(root, "name");
			$.env.clientVersion = $readNode(root, "version");
			$.env.language = air.Capabilities.language.toLowerCase();
			$.env.isDebug = air.Capabilities.isDebugger;
			//重载
			//处理ajax
			if($)$.ajax = this.ajax;
			//打开sqlite
			window.openDatabase = im.air.sqlite.openDatabase;
			//执行Sql语句
			im.sqlite.executeSql = im.air.sqlite.executeSql;
			//重载查找到table
			im.sqlite.tableExists = im.air.sqlite.tableExists;

			//检查更新
			if(checkUpdate) this.checkUpdate();
		},
		//检查窗口是否存在
		windowExist:function(win) {
			return (win && win.nativeWindow && !win.nativeWindow.closed);
		},
		/*
		 * 创建一个窗口
		 */
		createWindow: function(module, options, onComplete) {
			var ops = {
				transparent: false,
				systemChrome: air.NativeWindowSystemChrome.STANDARD,
				resizable: false,
				maximizable: false,
				type: air.NativeWindowType.NORMAL
			}
			$.extend(ops, options.windowOption);
			var windowOps = new air.NativeWindowInitOptions();
			for (var key in ops) {
				windowOps[key] = ops[key];
			};

			//如果没有扩展名，则加上html
			var url = module;
			if(url.indexOf(".") < 0) url += ".html";
			//判断加上查询参数
			if(options.params) url += "?" + options.params;

			var loader = air.HTMLLoader.createRootWindow(false, windowOps, options.scrollBarsVisible);
			//loader.userAgent = this.appInfo.appID;
			var nat = loader.stage.nativeWindow;
			nat.alwaysInFront = options.alwaysInFront;
			loader.load(new air.URLRequest(url));
			//加载完成的事件
			loader.addEventListener(air.Event.COMPLETE, function() {
				if (im.air.windowExist(loader.window)){
					$.callEvent(onComplete, [loader]);
				}
			});
		},
		/*
		 * 调用外部浏览器，打开网址
		 */
		openBrowser: function(url) {
			var urlReq = new air.URLRequest(url);
			air.navigateToURL(urlReq);
		},
		/*
		 * 播放声音
		 */
		playSound: function(file) {
			var rep = new air.URLRequest(file);
			var context = new air.SoundLoaderContext(0, true);
			var s = new air.Sound(rep, context);
			s.play();
		},
		/*
		 * 退出程序
		 */
		exit: function() {
			var app = air.NativeApplication.nativeApplication;
			app.icon.bitmaps = [];
			app.exit();
		},
		/*
		 * 加载托盘图标
		 */
		loadTray: function(icon16, icon128, onClickTray) {
			var app = air.NativeApplication.nativeApplication;
			var $completed = function(event) {
				app.icon.bitmaps = [event.target.content.bitmapData];
			};

			app.autoExit = true;
			var iconLoad = new air.Loader();
			//支持状态栏，Windows系统
			if (air.NativeApplication.supportsSystemTrayIcon) {
				app.autoExit = false;
				iconLoad.contentLoaderInfo.addEventListener(air.Event.COMPLETE, $completed);
				iconLoad.load(new air.URLRequest(icon16));
			}

			//支持停靠，Mac系统
			if (air.NativeApplication.supportsDockIcon) {
				iconLoad.contentLoaderInfo.addEventListener(air.Event.COMPLETE, $completed);
				iconLoad.load(new air.URLRequest(icon128));
			};

			this.loadTrayMenu(app.icon);
			app.icon.addEventListener("click", onClickTray);
		},
		/*
		 * 加载托盘右键菜单
		 */
		loadTrayMenu: function(menus) {
			new _loadTrayMenu(menus);
		},
		/*
		 * 设置窗口的位置
		 */
		setWindowPosition: function(nat, options) {
			var ops = {
				position: "center", 	//位置，可选center, rightBottom
				offset: {				//x与y的偏移量
					x: 0,
					y: 0
				}
			};

			$.extend(ops, options);
			//如果没有设置高宽，则为nativeWindow的高宽
			ops.width = ops.width || nat.width;
			ops.height = ops.height || nat.height;

			var x = 0, y = 0;
			var screenWidth = air.Screen.mainScreen.visibleBounds.width;
			var screenHeight = air.Screen.mainScreen.visibleBounds.height;

			//根据位置计算xy
			switch (ops.position) {
				case "center":
					x = (screenWidth - ops.width) / 2;
					y = (screenHeight - ops.height) / 2;
					break;
				case "rightBottom":
					x = screenWidth - ops.width;
					y = screenHeight - ops.height;
					break;
			};

			//加上偏移量
			x += ops.offset.x;
			y += ops.offset.y;
			//设置窗口的位置
			nat.x = x;
			nat.y = y;
		},
		/*
		 * 普通的桌面通知
		 */
		notification: function(title, body, flag, callback){

		},
		/*
		 * 检查更新
		 */
		checkUpdate: function(){
			var appUpdater = new runtime.air.update.ApplicationUpdaterUI();
			appUpdater.configurationFile = new air.File("app:/update.xml");
			appUpdater.addEventListener(runtime.air.update.events.UpdateEvent.INITIALIZED, function(){appUpdater.checkNow();});
			/*
			appUpdater.addEventListener(runtime.air.update.events.StatusFileUpdateErrorEvent, function(e){alert(e)});
			appUpdater.addEventListener(runtime.air.update.events.StatusUpdateErrorEvent.UPDATE_ERROR, function(e){alert(e)});
			appUpdater.addEventListener(runtime.air.update.events.DownloadErrorEvent.DOWNLOAD_ERROR, function(e){alert(e)});
			appUpdater.addEventListener(runtime.air.update.events.UpdateEvent.DOWNLOAD_COMPLETE, function(e){alert(e)});
			*/
			appUpdater.isCheckForUpdateVisible = false;
			appUpdater.isFileUpdateVisible = false;
			appUpdater.isInstallUpdateVisible = false;
			appUpdater.initialize();
		}
	};

	im.air.sqlite = {
		/*
		 * 重载：检查表是否存在
		 */
		tableExists: function(tableName, callback){
			var conn = im.sqlite.db;
			//在没有任何表的时候，loadSchema会出错，所以要用try
			try{
				conn.loadSchema(air.SQLTableSchema, tableName);
				var schema = conn.getSchemaResult();
				callback(schema && schema.tables.length > 0)
				//air.trace("结果：", JSON.stringify(schema.tables[0].name), tableName)
			}catch(e){
				callback(false);
			};
		},
		/*
		 * 重载打开数据
		 */
		openDatabase: function(dbName, version, dbName, maxSize){
			var conn = new air.SQLConnection();
			var dbFile = air.File.applicationStorageDirectory.resolvePath(dbName);
			try
			{
				conn.open(dbFile);
				//输出数据库的路径
				im.log(dbFile.nativePath);
				//alert(conn.loadSchema())
				return conn;
			}catch (error){
				//打开失败
				im.log("Error message:", error.message);
				im.log("Details:", error.details);
			}
		},
		/*
		 * 执行一条或者一批Sql语句
		 */
		executeSql: function(sqlList, callback) {
			var index = 0, count;
			if(typeof sqlList == "string") sqlList = [sqlList];

			var $exec = function(){
				var statement = new air.SQLStatement();
				statement.sqlConnection = im.sqlite.db;
				statement.text = sqlList[index];
				if($.env.isDebug){
					air.trace(sqlList[index]);
				}

				//air.trace(im.sqlite.db.loadSchema());
				//异步处理
				statement.addEventListener(air.SQLEvent.RESULT, function(event){
					//返回结果
					callback(null, statement.getResult());
					if(index < count - 1){
						index ++;
						$exec();
					};
				});

				statement.addEventListener(air.SQLErrorEvent.ERROR, function(event){
					$.callEvent(event.error);
					air.trace("Error message:", event.error.message);
					air.trace("Details:", event.error.details);
				});
				statement.execute();
			};
			$exec();
		}
	};
})();