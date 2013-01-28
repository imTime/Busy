/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 10/9/12
 * Time: 8:23 下午
 * To change this template use File | Settings | File Templates.
 */
/*
 * 将模板文件的语言，影射到html文件当中，一般用于
 */
(function(){
	//表达式
	var _expr = {
		caption: "#{0}>li.{1}>label.caption",
		timeViewCap: "#pnlTimeView>li.{0}>label.caption",
		calEditorCap: "#pnlCalendarEditor>ul.mf_editor>li.{0}>label.caption",
		signCap: "#pnlSign>ul.{0}>li.{1}>label",
		menu: "#toolbar>div.menu>a.{0} label",
		editorCap: "#pnl{0}Editor>li.{1}>label.caption",
		//actButton: "#pnlActivityEditor>footer button[flag='{0}']",
		ov: "{0}>option[value='{1}']",
		optCap: "#pnlOptSetting>li.{0}>label.caption"
	};

	//映射
	var _i18n = {
		/*
		_: {
			title: {expr: "head>title"}
		},
		*/
		noActivity: {expr: "#pnlNoActivity>p"},
		newActivity: {expr: "#btnNewActivity"},
		calendars: {
			title: {expr: "#hCalendar"},
			newCalendar: {expr: "#lnkNewCalendar"}
		},
		menu: {
			sync: {expr: ["sync"], source: "menu"},
			create: {expr: ["create"], source: "menu"},
			//get: {expr: ["download"], source: "menu"},
			option: {expr: ["option"], source: "menu"}
			//signOut: {expr: ["download"], source: "menu"}
		},
		sign: {
			memo: {expr: "#pnlSign>footer>p.memo"},
			signIn: {
				mail: {expr: ["signIn", "mail"], source: "signCap"},
				password: {expr: ["signIn", "password"], source: "signCap"},
				signUp: {expr: "#lnkSignUp"},
				forgotPwd: {expr: "#lnkForgotPwd"}
			},
			signUp: {
				mail: {expr: ["signUp", "mail"], source: "signCap"},
				password: {expr: ["signUp", "password"], source: "signCap"},
				confirmPassword: {expr: ["signUp", "confirmPassword"], source: "signCap"},
				signIn: {expr: "#lnkSignIn"}
			},
			button: {
				signIn: {expr: "#btnSignIn"},
				signUp: {expr: "#btnSignUp"}
			}
		},
		//日历编辑器
		calEditor: {
			titleTips: {expr: "#txtCalTitle", type:"attr", attr:"placeholder"},
			title: {expr: ["title"], source: "calEditorCap"},
			color: {expr: ["color"], source: "calEditorCap"},
			//tags: {expr: ["tags"], source: "calEditorCap"},
			button: {
				save: {expr: "#btnSaveCalendar"}
			}
		},birthdayEditor: {
			who: {expr: ["Birthday", "title"], source: "editorCap"},
			birthday: {expr: ["Birthday", "when"], source: "editorCap"},
			reminders: {expr: ["Birthday", "reminders"], source: "editorCap"},
			calendar: {expr: ["Birthday", "calendar"], source: "editorCap"},
			local: {expr: ["Birthday", "local"], source: "editorCap"}
		},
		expressEditor: {
			title: {expr: "#pnlExpressEditor>header>span"},
			mask: {expr: "#txtQuick", type:"attr", attr:"placeholder"},
			save: {expr: "#btnSaveExpressEditor"}
		},
		todoEditor: {
			title: {expr: ["Todo", "title"], source: "editorCap"},
			begin: {expr: ["Todo", "begin"], source: "editorCap"},
			reminders: {expr: ["Todo", "reminders"], source: "editorCap"},
			calendar: {expr: ["Todo", "calendar"], source: "editorCap"}
		},
		actEditor: {
			noMailReminder: {expr: "#tipsNoMailReminder"},
			noReminders: {expr: "#tipsNoReminders"},
			title: {expr: ["Normal", "title"], source: "editorCap"},
			begin: {expr: ["Normal", "begin"], source: "editorCap"},
			end: {expr: ["Normal", "end"], source: "editorCap"},
			repeat: {expr: ["Normal", "repeat"], source: "editorCap"},
			reminders: {expr: ["Normal", "reminders"], source: "editorCap"},
			calendar: {expr: ["Normal", "calendar"], source: "editorCap"},
			button:{
				save: {expr: "#btnSaveActivity"}
			}
			//location: {expr: ["normal", "location"], source: "actEditorCap"},
			/*
			button: {
				todo: {expr: ["4"], source: "actButton"},
				birthday: {expr: ["3"], source: "actButton"},
				normal: {expr: ["2"], source: "actButton"},
				save: {expr: ["save"], source: "actButton"}
			}
			*/
		},
		//重复
		repeat:{
			neverStop: {expr: ["pnlRepeatStop", "neverStop"], source: "caption"},
			local: {expr: ["pnlRepeatStop", "local"], source: "caption"},
			end: {expr: ["pnlRepeatStop", "end"], source: "caption"}
			//title: {expr: "#pnlRepeat>h3"},
			//end: {expr: "#capRepeatEnd"}
		},
		status: {
			//title: {expr: "#capStatusTitle"}
		},
		option: {
			menu: {
				account: {expr: "#pnlOptionMenu>li.sign"},
				setting: {expr: "#pnlOptionMenu>li.setting"}
			},setting: {
				notification: {expr: "notification", source: "optCap"},
				badge: {expr: "badge", source: "optCap"},
				autoHide: {expr: "autoHide", source: "optCap"}
			}
		},
		reminders: {
			title: {expr: "#pnlReminders>h3"},
			before: {expr: ["#selReminderSymbol", "-"], source: "ov"},
			after: {expr: ["#selReminderSymbol", "+"], source: "ov"},
			minutes: {expr: ["#selReminderUnit", "m"], source: "ov"},
			hours: {expr: ["#selReminderUnit", "h"], source: "ov"},
			days: {expr: ["#selReminderUnit", "d"], source: "ov"},
			custom: {expr: ["#selReminderUnit", "-1"], source: "ov"},
			popup: {expr: ["#selReminderBy", "2"], source: "ov"},
			mail: {expr: ["#selReminderBy", "3"], source: "ov"}
		}
	};

	var _module = {
		main: _i18n,
		phone: {
			_: _i18n._,
			noActivity: _i18n.noActivity,
			sign: {
				signIn: {
					mailPlaceholder: {expr: "#txtSignInMail", type:"attr", attr:"placeholder"},
					passwordPlaceholder: {expr: "#txtSignInPwd", type:"attr", attr:"placeholder"},
					signUp: _i18n.sign.signIn.signUp,
					forgotPwd:  _i18n.sign.signIn.forgotPwd
				},
				signUp: {
					mailPlaceholder: {expr: "#txtSignUpMail", type:"attr", attr:"placeholder"},
					passwordPlaceholder: {expr: "#txtSignUpPwd", type:"attr", attr:"placeholder"},
					confirmPasswordPlaceholder: {expr: "#txtSignUpRePwd", type:"attr", attr:"placeholder"},
					signIn: _i18n.sign.signUp.signIn
				},
				button: _i18n.sign.button
			},
			timepicker:{
				allDay: {expr: "allDay", source: "timeViewCap"},
				hours: {expr: "hours", source: "timeViewCap"},
				minutes: {expr: "minutes", source: "timeViewCap"},
				memo: {expr: "memo", source: "timeViewCap"}
			},
			reminders: _i18n.reminders,
			repeat: _i18n.repeat,
			actEditor: _i18n.actEditor,
			todoEditor: _i18n.todoEditor,
			birthdayEditor: _i18n.birthdayEditor
		},
		//chrome的弹出窗口
		popup: {
			_: _i18n._,
			expressEditor: _i18n.expressEditor,
			noActivity: _i18n.noActivity,
			newActivity: _i18n.newActivity,
			popup: {
				go: {expr: "#btnGo"},
				more: {expr: "#btnMore"}
			}
		}
	};

	var setNode = function(node, value){
		var expr = node.expr;
		if(node.source) {
			var source = $.xPath(_expr, node.source);
			if(!source) return im.log("expression not found.", node);
			expr = source.format(expr);
		};

		var obj = $(expr);
		if(obj.length == 0) {
			return im.log(expr + " not found.");
		};

		//配置css样式
		if(node.css) obj.css(node.css);

		switch (node.type) {
			case "html":
				obj.html(value);
				break;
			case "attr":
				obj.attr(node.attr, value);
				break;
			case "val":
				obj.val(value);
				break;
			default:
				obj.text(value);
				break;
		}
	};

	//设置元素的语言
	var setElement = function(mapping, language){
		//任何一个数据不正常，都没法玩下去了
		if(!mapping || !language) return;
		//遍历影射
		for(var key in mapping){
			var map = mapping[key];
			var lang = language[key];
			//语言的节点为文本型节点，处理数据
			if(typeof lang === 'string'){
				setNode(map, lang);
			}else{
				setElement(map, lang);
			}
		};
	};

	//处理element节点
	im.i18n.mapping = function(module){
		var lang = $.env.language;
		//本身的语言就是英文的，不用设置
		if(/default/i.test(lang)) return;
		//查找模板的语言文件
		lang = $.xPath(im.i18n, lang + ".template");
		//没有找到语言的文件，用默认语言
		if(!lang) return;
		setElement(_module[module], lang);
	};
})();

