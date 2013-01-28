/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 10/28/12
 * Time: 8:51 上午
 * To change this template use File | Settings | File Templates.
 */

(function(){
	var _ele;
	im.page.sign = {
		inited: false,
		/*
		 * 初始化
		 */
		init: function(){
			//避免重复初始化
			if(this.inited) return;
			this.inited = true;
			var o = $("#pnlSign");
			_ele = {
				container: o,
				signInMail: $("#txtSignInMail"),
				signInPwd: $("#txtSignInPwd"),
				signUpMail: $("#txtSignUpMail"),
				signUpPwd: $("#txtSignUpPwd"),
				signUpRePwd: $("#txtSignUpRePwd"),
				btnSignIn: $("#btnSignIn"),
				btnSignUp: $("#btnSignUp"),
				signUpLink: $("#lnkSignUp"),
				signInLink: $("#lnkSignIn"),
				forgotPwdLink: $("#lnkForgotPwd"),
				signInPanel: o.find(">ul.signIn"),
				signUpPanel: o.find(">ul.signUp")
			};

			//用于Phone版本，onShow和onHide
			o.bind("onShow", function(){
				o.show();
			}).bind("onHide", function(){
					o.hide();
				});

			var that = this;
			$.tap(_ele.signUpLink, this.toggle);
			$.tap(_ele.signInLink, function(){
				that.toggle(true);
			});

			//点击按钮
			$.tap(_ele.btnSignIn, function(){
				$.releaseFocus();
				var data = {
					mail: _ele.signInMail.val(),
					password: _ele.signInPwd.val()
				};

				//登陆
				that.signIn(data, false, that.onSignIn);				// end signIn
			});

			//注册
			$.tap(_ele.btnSignUp, function(){
				$.releaseFocus();
				var data = {
					mail: _ele.signUpMail.val(),
					password: _ele.signUpPwd.val(),
					rePassword: _ele.signUpRePwd.val()
				};
				that.signUp(data);
			});
		},
		//切换注册与登陆
		toggle: function(){
			var isSignIn = arguments[0] === true;
			_ele.btnSignIn.display(isSignIn);
			_ele.btnSignUp.display(!isSignIn);
			_ele.signInPanel.display(isSignIn);
			_ele.signUpPanel.display(!isSignIn);
			_ele.signInLink.display(!isSignIn);
			_ele.signUpLink.display(isSignIn);
			_ele.forgotPwdLink.display(isSignIn);

			//非手机版设置标题
			if(!$.env.isPhone){
				var title = isSignIn ? "signInTitle" : "signUpTitle";
				title = $.i18n("sign." + title);
				im.page.fullscreen.title(title);
			}
		},
		/*
		 * 显示登陆窗口
		 */
		show: function(isSign){
			im.page.modal(_ele.container);
			this.toggle(isSign);
		},
		hide: function(){
			im.page.modal(_ele.container, true);
		},
		/*
		 * 前台校验用户帐号
		 */
		validator: function(data, signUp){
			//前台校验
			if(!data.mail || !data.mail.isMail()){
				im.page.msgbox($.i18n("sign.mailError"));
				return false;
			};

			//密码输错
			if(!data.password){
				im.page.msgbox($.i18n("sign.incorrect"));
				return false;
			};

			if(signUp){
				//密码少于指定长度
				if(data.password.length < im.config.minPasswordLength){
					im.page.msgbox($.i18n("sign.pwdError"));
					return false;
				};

				if(data.password != data.rePassword){
					//两次密码不一样
					im.page.msgbox($.i18n("sign.pwdNotSame"));
					return false;
				}
			}

			return true;
		},
		/*
		 * 注册成功后
		 */
		onSignUp: function(data){
			var that = this;
			//为用户登陆
			this.signIn(data, true, function(){
				//初始化用户资料
				that.memberSetup(that.onSignIn);			//end memberSetup
			});
		},
		//登陆成功后
		onSignIn: function(){
			var $loadData = function(){
				//加载用户的数据
				im.interface.loadMemberData(function(){
					im.page.modal(_ele.container, true);
					im.page.loadMemberData();
					/*
					//TODO 这类逻辑要改
					if($.env.isPhone){
						im.page.fullscreen.hide();
					};
					*/
				});			//end loadMemberData
			};

			//如果是使用了sqlite，并且用户的最后同步时间为空(未同步)，则先启动同步
			if($.env.useSqlite && !im.member.lastSyncPull){
				/*
				if($.env.isPhone){
					im.page.fullscreen.show();
				};
				*/
				//同步完数据再加载本地数据
				im.page.msgbox("Syncing");
				return im.sync.syncAll($loadData);
			};
			$loadData();
		},
		//用户注销
		signOut: function(){
			var options = {
				onSuccess: function(res){
					//跳转到主页
					location.href = "/";
				}
			};
			im.interface.passed(im.e.module.signOut, im.e.method.GET, options);
		},
		/*
		 * 用户注册
		 */
		signUp: function(data){
			if(!im.page.sign.validator(data, true)) return;

			/*
			if($.env.isPhone){
				im.page.fullscreen.show();
			};
			*/

			var options = {
				data: data,
				onSuccess: function(res){
					var sr = im.e.SignUpResult;
					var code = res.command.code;
					/*
					if(code != im.e.Success && $.env.isPhone){
						im.page.fullscreen.hide();
					};
					*/
					//注册成功
					switch(code){
						case sr.MailIncorrect:
							//提示用户名或者密码错误
							im.page.msgbox($.i18n("sign.mailError"));
							break;
						case sr.PasswordIncorrect:
							im.page.msgbox($.i18n("sign.pwdError"));
							break;
						case sr.MailExist:
							im.page.msgbox($.i18n("sign.mailExists"));
							break;
						default:
							im.page.sign.onSignUp(data);
							break;
					};			//end switch
				}
			};			//end options;

			im.interface.passed(im.e.module.signUp, im.e.method.POST, options);
		},
		/*
		 * 用户登陆
		 * @newMember 是否为新用户s
		 */
		signIn: function(data, newMember, callback){
			//校验数据
			if(!im.page.sign.validator(data)) return;

			/*
			if($.env.isPhone){
				im.page.fullscreen.show();
			}
		*/

			var incorrect = $.i18n("sign.incorrect");
			var module = im.e.module.signIn;
			//如果本地是使用了Sqlite，则向服务器请求token
			if($.env.useSqlite){
				module = im.e.module.token;
			};

			var options = {
				data: data,
				onSuccess: function(res){
					/*
					if($.env.isPhone){
						im.page.fullscreen.hide();
					}
					*/

					//alert(response);
					var sr = im.e.SignInResult;
					var code = res.command.code;
					//登陆成功
					switch(res.command.code){
						case sr.Incorrect:
							//提示用户名或者密码错误
							im.page.msgbox(incorrect);
							break;
						case sr.Locked:
							im.page.msgbox($.i18n("sign.locked"));
							break;
						default:
							//登陆成功
							im.member.isSigned = true;
							if(code == sr.NotActivated){
								//提示用户没有激活
							};
							$.callEvent(callback);
							break;
					};			//end switch
				}					//end onSuccess
			};					//end option

			//用户登陆
			im.interface.passed(module, im.e.method.POST, options);
		},
		/*
		 * 为用户创建基本的数据，包括默认日历，三个默认的状态(Busy/Free/Normal)
		 */
		memberSetup: function(callback){
			var statuses = ["#DB13F3", "#C6D705", "#7DC9FE"];
			var index = 0;
			var $insertSatus = function(){
				if(index >= statuses.length) return $.callEvent(callback);
				//保存状态
				var data = {
					color: statuses[index],
					status:$.i18n("defaultTitle.statuses")[index]
				};

				//保存
				im.page.status.save(data, function(){
					index ++;
					$insertSatus(index);
				});
			};

			//保存日历
			var data = {
				title:$.i18n("defaultTitle.calendar"),
				color: "#E802AF"
			};

			//创建新的日历
			im.page.calendar.save(data, $insertSatus);		//end save.calendar
		}
	};
})();