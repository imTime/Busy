/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 9/19/12
 * Time: 10:36 上午
 * To change this template use File | Settings | File Templates.
 */
(function(){
	var _i18n = {
		_: {
			slogan: "任何地点，任何时间，任何方式",
			language: "zh-cn",
			title: "欢迎来到i'm Time",
			description: "",
			keyword: "",
			footer: ""
		},
		noActivity: "当天没有任何活动，您可以创建一个活动/待办事项/生日",
		newActivity: "创建新的活动",
		calendar: "日历",
		calendars: {
			title: "我的日历",
			newCalendar: "创建新的日历"
		},
		option: {
			menu: {
				account: "帐号",
				setting: "设置"
			},setting: {
				notification: "启用提醒功能",
				badge: "使用数字提醒",
				autoHide: "启动自动隐藏"
			}
		},
		menu: {
			create: "新建",
			get: "下载",
			sync: "同步",
			signIn: "登录",
			signOut: "注册",
			option: "选项"
		},
		sign: {
			memo: "使用imTime.com帐号，可以将数据同步到云端服务器，数据永不丢失。",
			signIn: {
				mail: "邮箱",
				mailPlaceholder: "您的邮箱地址",
				password: "密码",
				passwordPlaceholder: "请输入的密码",
				signUp: "免费注册新帐号",
				forgotPwd: "忘记密码了？"
			},
			signUp: {
				mail: "邮箱",
				mailPlaceholder: "请使用您的常用邮箱",
				password: "密码",
				passwordPlaceholder: "请输入的密码",
				confirmPassword: "重复密码",
				confirmPasswordPlaceholder: "重复输入您的密码",
				signIn: "用现有帐号登陆"
			},
			button: {
				signIn: "登录",
				signUp: "注册"
			}
		},
		//日历编辑器
		calEditor: {
			titleTips: "请给日历起个名字",
			title: "标题",
			color: "颜色",
			tags: "标签",
			button: {
				save: "保存"
			}
		},
		birthdayEditor: {
			calendar: "日历",
			local: "农历",
			who: "姓名",
			birthday: "生日",
			reminders: "提醒"
		},
		expressEditor: {
			title: "来，试试智能添加功能吧",
			mask: "例如：每周五下午三点在三楼会议室开例会",
			save: "保存",
			multiLine: "开启多行模式"
		},
		//与活动编辑器重复，兼顾到mapping.js
		todoEditor: {
			calendar: "日历",
			title: "标题",
			begin: "开始时间",
			reminders: "提醒"
		},
		actEditor: {
			calendar: "日历",
			allDay: "全天事件",
			time: "时间",
			title: "标题",
			begin: "开始时间",
			end: "结束时间",
			repeat: "重复",
			reminders: "提醒",
			location: "地点",
			noReminders: "还没有任何提醒，您可以新建一个提醒。",
			noMailReminder: "邮件提醒功能即将归来",
			button: {
				todo: "待办",
				birthday: "生日",
				normal: "活动",
				save: "保存",
				del: "删除"
			}
		},
		//重复
		repeat:{
			title: "重复类型",
			end: "重复至",
			neverStop: "永不停止",
			local: "农历"
		},
		status: {
			title: "新建状态"
		},
		popup: {
			today: "今天",
			option: "选项",
			go: "跳转",
			more: "更多"
		},
		timepicker: {
			allDay: "全天",
			hours: "小时",
			minutes: "分钟",
			memo: "您的选择"
		}
	};

	if(typeof exports === 'object'){
		exports.index = _i18n;
	}else{
		im.i18n["zh-cn"].template = _i18n;
	}
})();