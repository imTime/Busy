/*
 * 应用于Chrome/Safari/Firefox等浏览器插件以及AIR
 * 注意：
 * 1.窗口模块之间互不调用，如果一定要调用，必需通过background
 * 2.所有数据都从background走，创建窗口模块时，把相关方法数据从background传递给窗口对象
 *
 * background叫应用层，其它页面叫内容层，Popover页面也是应用层(这个很讨厌)
 * 1.应用层直接init
 * 2.内容层先syncbackground，然后再init
 */
//禁止右键
document.oncontextmenu = function() { return false; };
(function(){
	var _i;
	/*
	 * 客户端
	 */
	im.desktop = {
		/*
		//用户的配置
		settings: {
			//undefined在safari中表示需要请求桌面通知的权限
			notification: undefined,
			//用户设置的语言，默认情况为自动选择
			language: undefined,
			badge: true,
			autoHide: false,
			mail: null
		},
		*/
		/*
		 * 获取interface
		 */
		i: function(){
			return _i;
		},
		/*
		 * 用户数据加载完成
		 */
		memberDataLoaded: function(){
			$.callEvent(_i.memberDataLoaded);
		},
		hidePopup: function(){
			if(_i.hidePopup) return $.callEvent(_i.hidePopup);
		},
		/*
		 * 给图标上添加数字
		 */
		setBadge: function(){
			var number = 0;
			//不使用badge
			var setting = im.member.setting || {};
			if(!setting.badge) return _i.setBadge(number);

			//计算badge
		},
		windows: {},
		/*
		 * 保存窗口列表，用于air或者其它需要
		 */
		modules: {
			background: "background",
			popup: "popup",
			main: "main",
			notification: "notification"
		},
		//设置ir服务器地址
		getIRServer: function(){
			//提取ir服务器，每个客户端分配一个域名，以后用从调度服务器获取
			var client = im.page.reflectionEnum(im.e.Client, $.env.client);
			var domain = "ir";
			if(client){
				domain += "-" + client;
			};

			//return "http://localhost:3000/ir/";
			return "http://{0}.imtime.com/".format(domain);
		},
		//根据url提取模块名称
		getModule: function(){
			if(/(\w+)\.html/i.test(location.href)) return  RegExp.$1.toLowerCase();
			return false;
		},
		//从背景页中同步数据到当前页
		syncBackground: function(module){
			//如果已经含同步方法，调用各接口的同步方法
			if(_i.syncBackground){
				return _i.syncBackground(module, function(){
					im.desktop.init(module);
				});
			};

			//否则用背景页中的同步方法
			var bg = _i.getBackground();
			if(!bg) return im.log("Background page uninitialized.");
			im.interface = bg.im.interface;
			$.env = bg.$.env;
			im.member = bg.im.member;
			im.desktop.init(module);
		},
		/*
		 * 打开模块
		 */
		openModule: function(module, action, params){
			var c = this.modules;
			switch(module){
				case c.main:
					_i.showMainModule();
					break;
			}
		},
		/*
		 * 播放音乐，必需由Background发起
		 */
		playSound: function(file){
			//重载playSound
			if(_i.playSound) return _i.playSound(file);

			//默认的播放方式
			var sound = document.getElementById("playSound");
			sound.src = file;
			sound.play();
		},
		/*
		 * 弹出提醒，并播放音效
		 */
		popupReminder: function(calendar, activity, event, counter){
			//TODO 根据配置确定响哪种铃
			var sound = "images/desktop/ring.mp3";
			this.playSound(sound);

			var params = {
				calendar: calendar,
				activity: activity,
				event: event,
				counter: counter
			};

			$.callEvent(_i.popupReminder, [params]);
		},
		/*
		 * 加载主模块的数据
		 */
		loadMainData: function(){
			//加载用户数据
			im.page.loadMemberData();
		},
		//=========================初始化内容层====================
		//初始化主要页面
		initMain: function(){
			im.page.initElement();
			im.page.option.init();
			//用户没有登陆，
			if(!im.member.token){
				im.page.option.show();
			}else{
				this.loadMainData();
			};
		},
		/*
		 * 初始化弹出窗口
		 */
		initPopup: function(){
			im.page.expressEditor.init();
			im.page.timeline.init();
			im.page.initClipCalendar();

			//初始化日历
			var month = $("#pnlMonth");
			im.page.initDate(month, true);
			month.bind("mouseleave", function(){
				month.fadeOut();
			}).bind("onSelectedDate", function(event, date){
					month.fadeOut();
					im.page.loadTimeLine(date);
				});

			//点击tabs下的按钮
			$.tap($("#pnlTabs>button"), function(){
				var flag = $(this).attr("flag");
				if(flag == "go"){
					month.fadeIn();
					return;
				};

				if(flag == "more"){
					//这里要关闭Popup窗口
					im.desktop.hidePopup();
					im.desktop.openModule(im.desktop.modules.main);
					return;
				};
			});

			//Safari需要从后台页面传输消息，异步处理
			if($.env.client != im.e.Client.Safari){
				im.desktop.loadPopupData();
			};
			//im.page.initDate($("#tabs>button[flag='today']"));
		},
		/*
		 * popup窗口加载数据，当popup窗口打开的时候
		 */
		loadPopupData: function(){
			//加载日历列表
			im.page.loadCalendars();
			//alert('d');
			//加载今天的活动
			im.page.timeline.load(new Date().start("d"));
		},
		/*
		 * 检测客户端类型，所有模块都会用到，不只是background
		 */
		detectClient: function(){
			//客户端环境是air，目前只判断chrome扩展和air，未来如果增加更多的环境，需要再判断
			//注意，air的专属文件在其它环境不要引入，否则会造成误判
			//TODO api服务器和ir服务器，应该从服务器上加载可用服务列表并保存。自动判断哪个服务器最快。
			var client = im.e.Client;
			var d = im.desktop;

			//判断环境有air，其它客户端是不会引入air环境的
			if(window.air && air.Capabilities){
				$.env.client = client.Air;
				_i = d.air;
			}else if(window.chrome && chrome.extension){
				$.env.client = client.Chrome;
				_i = d.chrome;
			}else if(window.safari && safari.extension){
				$.env.client = client.Safari;
				_i = d.safari;
			}else if(window.imbox){
				//在imbox内，判断iPad/iPhone/WP7/Mac
			};
		},
		/*
		 * 初始化背景页
		 */
		initBackground: function(){
			var d = im.desktop;
			//支持跨域名
			jQuery.support.cors = true;
			$.env.useSqlite = true;
			$.env.apiServer = "http://api1.imtime.com/";
			$.env.enableLocal = $.i18n("enableLocal");
			im.member.dateFormat = $.i18n("dateFormat");
			$.env.irServer = this.getIRServer();
			//调用重载的initBackground
			$.callEvent(_i.initBackground);

			//实现弹出提醒
			var options = {
				onReminder: this.popupReminder
			};

			//初始化接口
			im.interface.init(options, function(){
				//同步数据
				//TODO 这里的业务逻辑要理一下，先要把数据处理好，才能弹出主面面，但如果主页面等很久也不好
				im.sync.syncAll(function(){
					im.log('sync done.');
				});

				//air的情况下，如果配置没有自动隐藏，打开主窗口
				if($.env.client == im.e.Client.Air && !im.member.setting.autoHide){
					d.openModule(d.modules.main);
				}else{
					//还没有申请到token，表示用户还没有注册或者登陆，打开主模块
					if(!im.member.token){
						//如果没有Token，只在启动的时候显示三次
						var setting = im.member.setting;
						setting.showMain = (setting.showMain || 0) + 1;
						if(setting.showMain < 4){
							//更新用户配置到数据库
							im.storage.updateMember();
							d.openModule(d.modules.main);
						};
					};
				}

				//在后台页面中，加载用户数据
				im.interface.loadMemberData(function(){
					//通知数据加载完毕
					d.memberDataLoaded();
					//打开
					//im.desktop.openModule(im.desktop.modules.main);
					//临时代码
					//d.popupReminder(0, 1, new Date().getTime(), 1);
				});			//end loadMemberData
			});				//end interface.init
		},
		/*
		 * 获取提醒
		 */
		getNotification: function(params){
			var cp = im.interface.getCompute();
			var activity = cp.activityWithIndex(params.calendar, params.activity);

			if(!activity) return false;

			var result = {
				type: activity.type,
				repeat: activity.repeat,
				title: activity.title,
				guid: activity._id
			};

			//多少岁了
			if(activity.type == im.e.ActivityType.Birthday){
				result.age = $.i18n("activity.age").format(params.counter);
			};

			var begin = new Date(activity.begin);
			var when = im.i18n.format(begin, "yMd");
			if($.i18n("enableLocal")){
				var local = $.i18n("getLocalDate", [begin, "Md"]);
				when += "({0})".format(local);
			};

			//非全天事件，加上时间
			if(!activity.allDay){
				when += begin.format(" hh:mm");
			};
			result.when = when;

			//持续时间
			if(activity.begin != activity.end){
				result.duration = "持续N分钟";
			};

			return result;
		},
		/*
		 * 初始化提醒
		 */
		initNotification: function(){
			var params = $.getQuery();
			var data = im.desktop.getNotification(params);
			if(!data){
				return window.close();
			};

			var objTitle = $("body>h3.title");
			objTitle.find(">span.content").text(data.title);

			var o = $("#notification");
			o.find(">li.when").text(data.when);
			o.find(">li.age").display(data.age).text(data.age);
			o.find(">li.duration").display(data.duration).text(data.duration);

			//点击按钮的事件
			$("#btnView").bind("click", function(){
				im.chrome.openModule(im.chrome.module.main);
			});

			//推迟某个提个醒
			$("#btnWait").bind("click", function(){
				//im.page.delayReminder(reminderId, "5m");
			});
		},
		/*
		 * 模块调用，除background主动调用外，其它模块被动调用
		 * 主要是为了兼容air，air在创建模块的时候调用
		 */
		init: function(module){
			var d = im.desktop;
			var ms = d.modules;

			//截获取msgbox
			//401和404只提醒一次
			var notify401, notify404;
			im.sync.msgbox = function(message, code){
				var callback = null;
				var status = im.e.httpStatus;
				switch(code){
					case status.Unauthorized:
						if(notify401) return;			//已经提醒过了
						notify401 = true;
						//点击后的处理事件，打开主页面的选项功能
						callback = function(){
							//打开主页面，的登陆界面
							d.openModule(ms.main, "signIn");
						};
						break;
					case status.NotFound:
						if(notify404) return;
						notify404 = true;
						break;
				};

				_i.msgbox($.i18n("warning"), message, null, callback);
			};

			//非background，需要处理语言和从背景页中同步数据
			if(module != ms.background){
				//重新加载语言
				im.i18n.mapping(module);
			}else{
				//给背景窗口赋值
				this.windows[module] = window;
			};

			switch(module){
				case ms.background:
					d.initBackground();
					break;
				case ms.main:
					d.initMain();
					break;
				case ms.popup:
					d.initPopup();
					break;
				case ms.notification:
					d.initNotification();
					break;
			};
		}
	};
})();

$(document).ready(function(){
	var d = im.desktop;
	var module = d.getModule();
	d.detectClient();			//探测客户端的类型
	//在Air环境下，只有背景页才主动调用init，其它模块并不主动调用init
	//因为其它模块需要等待createWindow函数将background.window赋值。
	//$(document).ready的事件比createWindow的onCompleted事件优先级要高
	var isAir = $.env.client == im.e.Client.Air;
	if(module == d.modules.background){
		//只有background模块才主动调用init
		d.init(module);
	}else{
		//非Air的环境，主动同步背景数据，Air需要处理完Loader才同步环境数据
		if(!isAir) d.syncBackground(module);
	}
});

