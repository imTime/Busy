/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 10/24/12
 * Time: 7:50 下午
 * 实现imbox与javascript
 * 一是实现从js到imbox的通信queue，采用fifo，因为url请求不能并行
 * 二是实现请求方法并且实现回调
 */
(function(){
	//fifo列表
	var _fifo = [];
	//回调列表
	var _callbacks = {};
	//参数列表
	var _params = {};

	//执行某个Queue
	var _doQueue = function(){
		if(_fifo.length == 0) return;
		var item = _fifo[0];
		var url = "imbox:{0}?guid={1}".format(item.method, item.guid);
		location.href = url;
	};

	/*
		1.快递公司
		2.和榕基九城
	 * imbox收到请求后的回应，弹出fifo的第一个，继续下一个队列
	 */
	window.onReplyInstruct = function(){
		//imbox已经收到回应，从fifo中删除队列，执行下一个队列
		_fifo.shift();
		//继续执行队列
		_doQueue();
	};

	/*
	 * 从imbox中接收数据
	 */
	window.onReceiveMessage = function(guid, data){
		var event = _callbacks[guid];
		if(event) $.callEvent(event, [data]);
		delete _callbacks[guid];
	};

	/*
	 * 获取参数
	 */
	window.onGetParams = function(guid){
		return _params[guid];
	};

	/*
	 * 实现与imbox的代理
	 */
	im.mobile.proxy = {
		method: {
			//调用imBox的方法枚举
			ready: 999,
			loaded: 998,
			//updateReady: 997,			//更新本地数据成功
			setBadge: 1,
			setNetwork: 2,
			richEditor: 3,			//显示富文本编辑器
			twitter: 4,				//调用系统发送Twitter
			log: 5,
			sendMail: 6,
			purchaseIAP: 7,		//购买IAP
			getEnvironment: 8,
			checkIAPPurchase: 9,			//检查指定的iap是否购买
			msgbox: 10,
			restart: 11,
			vibrate: 12,
			addNotification: 13,
			cancelNotification: 14,
			cancelAllNotification: 15,
			playVedio: 16,
			displayLoading: 17,
			cancelSelection: 20,
			copyToClipboard: 22,
			executeSql: 30,
			querySql: 31
		},
		/*
		 * 请求imbox，将数据扔到fifo中，然后执行队列
		 * @params {Object} data 符合W3C规范的数据，传输至imbox
		 */
		request: function(method, params, callback){
			var guid = $.uniqueText("proxy_");
			if(typeof params == "function"){
				callback = params;
				params = null;
			};

			if(params) _params[guid] = params;
			if(callback) _callbacks[guid] = callback;

			_fifo.push({
				guid: guid,
				method: method
			});

			_doQueue();
		},
		/*
		 * 向imbox发送日志
		 */
		log: function(log){
			this.request(this.method.log, log);
		},
		/*
		 * 打开发邮件
		 */
		sendMail: function(title, body, mailTo){
			var params = $.extractParams(arguments);
			this.request(this.method.sendMail, params);
		},
		/*
		 * 设置图标上的数字
		 */
		setBadge: function(number){
			var params = $.extractParams(arguments);
			this.request(this.method.setBadge, params);
		}
	};
})();

(function(){
	/*
	 * 将sqlite转交至imbox存储
	 */
	im.mobile.sqlite = {
		query: function(sql, callback){
			var proxy = im.mobile.proxy;
			proxy.request(proxy.method.querySql, sql, function(res){
				callback(res.error, res.data);
			});
		},
		//执行一条或者一批Sql语句
		executeSql: function(sqlList, callback) {
			var index = 0, count, sql;
			if(typeof sqlList == "string") sqlList = [sqlList];

			var $exec = function(){
				sql = sqlList[index];
				var proxy = im.mobile.proxy;
				proxy.request(proxy.method.executeSql, sql, function(res){
					//返回结果
					callback(res.error, res.data);
					if(index < count - 1){
						index ++;
						$exec();
					};		//end if
				});			//end request
			};				//end exec

			$exec();
		}
	};
})();