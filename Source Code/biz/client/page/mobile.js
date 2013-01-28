/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 11/1/12
 * Time: 8:04 下午
 * 移动设置上的入口，针对Pad和Phone，而Pad和Phone又分为imbox内和移动网站
 * 不再分Windows Phone、Android、iOS，一起兼容，仅匹配Pad和Phone
 * 7寸及以上用Pad的版本，以下用Phone的版本
 */
(function(){
	/*
	 * 兼容Pad和Phone上的，更主要是针对Phone，因为Pad和桌面版的基本差不多
	 */
	im.page.mobile = {
		/*
		 * 弹出提醒，用于imbox环境
		 */
		popupReminder: function(){

		},
		/*
		 * 加载用户的数据
		 */
		/*
		loadMemberData: function(){
			im.interface.loadMemberData(function(){
				//如果是在imbox内，则通知加载完成
				if($.env.inBox){
					var proxy = im.mobile.proxy;
					proxy.request(proxy.method.loaded);
					im.log("加载共用时 %s", new Date().getTime() - $.env.startTime);
				};
			});			//end loadMemberData
		},
		*/
		//初始化移动模块
		init: function(){
			var options = {
				onReminder: this.popupReminder
			};

			//初始化Pad/Phone的页面，仅初始化基础部分
			var mobileInterface = $.env.isPad ? im.page.pad : im.page.phone;
			mobileInterface.init(true);
			var signModel = ($.env.isPad && $.env.inBox) ? im.page.option : im.page.sign;
			im.logTimer("初始化");

			//如果是在imbox内，先通知加载完成，切换到uiwebview
			if($.env.inBox){
				//预先显示sign界面，如果用户已经登陆，则隐藏
				signModel.show(true);
				var proxy = im.mobile.proxy;
				proxy.request(proxy.method.loaded);
			};

			//初始化延时部分
			mobileInterface.delayInit();
			//初始化页面
			im.page.init(options, function(){
				//在imbox内，并且已经取得取token，取消用户登陆
				if($.env.inBox && im.member.token){
					signModel.hide();
				}else{
					//im.page.sign.focusSignIn();
				};


				//im.page.activity.show();
				//如果用到了sqlite，则同步数据
				im.logTimer("page初始化完成");
				if($.env.useSqlite){
					im.sync.syncAll(function(){
						im.logTimer('同部完成.');
					});
				};

				/*
				// 如果用户已经登陆，则加载用户的资料
				// 如果在imbox内，用户肯定已经登陆
				im.log("加载共用时 %s", new Date().getTime() - $.env.startTime);
				//如果是在imbox内，则通知加载完成
				if(!$.env.inBox) return;
				//通知imbox加载完成
				var proxy = im.mobile.proxy;
				proxy.request(proxy.method.loaded);
				/*
				if(im.member.isSigned){
					im.page.mobile.loadMemberData();
				}else{
					//用户没有登陆，获取用户
					im.page.isSigned();
				};
				*/
			});
		}
	};


	//页面准备好
	$(document).ready(function(){
		//如果imbox被引入，则初始化imbox。移动网站是不会引入imbox的。
		//当然这里应该可以有更准确的判断，就是先由imbox调用，再处理
		//要考虑Android和WP等
		var enumClient = im.e.Client;
		//使用延时初始化
		//$.env.lazyInit = true;
		if(im.mobile.imbox){
			im.sync.msgbox = im.page.msgbox;
			//初始化imbox，通知imbox并获取环境
			im.mobile.imbox.init(function(){
				//imbox需要用sqlite，api服务器也不一样，移动网站不用
				$.env.useSqlite = true;
				//只有在imbox环境下才需要指定api server
				$.env.apiServer = im.page.apiServer;
				//判断客户端的类型
				// TODO 要根据imbox的环境，来判断client类型，imbox可能会在android和win8等环境
				$.env.client = $.env.isPad ? enumClient.iPad : enumClient.iPhone;
				im.page.mobile.init();
			});				//end init
		}else{
			//判断当前环境，根据域名来判断是pad还是phone
			//只考虑Phone或者Pad，其它情况imbox处理
			$.env.isPad = $("body").attr("client") == enumClient.Pad;
			$.env.isPhone = !$.env.isPad;
			$.env.client = $.env.isPad ? enumClient.Pad : enumClient.Phone;
			im.page.mobile.init();
		};				//end if
	});					//end ready
})();