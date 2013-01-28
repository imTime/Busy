/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/11/12
 * Time: 1:44 下午
 * 国际化
 */
(function(){
	im.i18n["zh-cn"] = {
		date: {
			weekName: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
			monthName: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
			shortMonthName: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
			shortWeekName: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
			//日历周的名称
			calendarWeekName: ["日", "一", "二", "三", "四", "五", "六"],
			am: "上午",
			pm: "下午",
			h: "小时",
			y: "年",
			M: "月",
			m: "分",
			s: "秒",
			year: "年",
			month: "月",
			week: "周",
			day: "天",
			years: "年",
			months: "月",
			weeks: "周",
			days: "天",
			hours: "小时",
			minutes: "分钟",
			hour: "小时",
			minute: "分钟",
			monthly: "每月",
			yearly: "每年",
			weekly: "每周",
			daily: "每天",
			today: "今天",
			yesterday: "昨天",
			tomorrow: "明天",
			before: "{0}{1}前",
			after: "{0}{1}后"
		},
		//对枚举的本地化，_枚举值作键，如_4:""
		e: {
			ActivityRepeat: {
				caption: "重复",
				_99: "不重复",
				_2: "每年",
				_4: "每月",
				_5: "每周",
				_6: "每天"
			},
			ActivityType: {
				"_2": "活动",
				"_3": "生日",
				"_4": "待办",
				"_255": "未知"
			},
			ReminderBy: {
				"caption": "提醒",
				"_2": "弹出",
				"_3": "邮件",								//邮件提醒
				"_4": "推送到手机",				//推送到用户手机上
				"_5": "短信",									//短信通知
				"_255": "未知"					 //未知提醒方式
			}
		},
		reminders: {
			before: "提前",
			after: "延后",
			minutes: "分钟",
			hours: "小时",
			days: "天",
			custom: "自定义",
			reminderBy: "{0}提醒"
		},
		dateFormat: 3,
		warning: "警告",
		error: "错误",
		local: im.e.ActivityLocal.ChineseLunar,
		//是否启用本地日历
		enableLocal: true,
		localText: "农历",
		signIn: "登录",
		signOut: "注销",
		profile: "帐户",
		sign: {
			signInTitle: "用户登陆",
			signUpTitle: "用户注册",
			incorrect: "您输入的密码不正确，请重新输入！",
			locked: "您的帐号已经被锁定！",
			active: "您的帐号还有被激活，请注意查收激活邮件(邮件有可能被送往垃圾箱)",
			mailError: "请输入正确的邮箱地址！",
			pwdError: "您的密码输入不正确(6-20个字符)！",
			pwdNotSame: "您两次输入的密码不一致，请重新输入！",
			mailExists: "邮箱已经存在，您是否忘记密码？"
		},
		//服务器错误　
		serverError: {
			err_10: "您提交的数据不正确，请与我们联系。",
			err_9999: "您的软件版本太低，请及时更新软件。",
			err_9998: "服务器出现故障，请稍候再试。",
			err401: "认证失败，请重新登陆。",
			err404: "访问服务器失败，请检查网络是否正常。",
			err500: "服务器异常，请稍后再试！",
			err403: "您的访问被禁止，请与我们联系！",
			unknown: "未知错误，请稍候再试",
			timeout: "服务器响应超时，请稍候再试！"
		},
		button: {
			go: "转到",
			done: "完成",
			back: "返回",
			edit: "编辑",
			save: "保存",
			add: "新建"
		},
		//活动中的本地化字符
		activity: {
			title: {
				selectCalendar: "选择日历",
				editReminder: "编辑提醒",
				normal: "编辑活动",
				birthday: "编辑生日",
				todo: "编辑待办事项",
				reminder: "设置提醒",
				repeat: "设置重复"
			},
			editorTitle: "编辑活动",
			birthday: "{0}的生日",
			birth: "出生",
			age: "{0}岁",
			allDay: "全天",
			neverStop: "永不停止",
			noTitle: "无标题",
			begin: "开始",
			end: "结束",
			duration: "持续",
			start: "始于",
			repeat: "重复",
			counter: "重复次数",
			reminderLink: "[{0}]个提醒",
			noReminder: "无提醒",
			repeatType: {
				_99: "不重复",
				_2: "每年重复",
				_4: "每月重复",
				_5: "每周重复",
				_6: "每天重复"
			},
			message: {
				//提醒超出限制
				reminderOverLimit: "您最多可以创建{0}个提醒，已经创建{1}个",
				mailNoSet: "您必需先设置提醒邮箱才能使用邮件提醒功能。"
			}
			//remindersLink: null,			//复数的提醒
		},
		expressEditor: {
			multiLine: "开启多行模式",
			type: "类型",
			title: "标题",
			repeat: "重复",
			from: "开始",
			to: "结束",
			reminder: "提醒"
		},
		//日历
		calendarEditor: {
			editorTitle: "编辑日历",
			leftButton: "返回",
			rightButton: "保存",
			message: {
				limit: "您最多只能创建{0}个日历，已经创建{1}个日历",
				notExists: "您编辑的日历不存在"
			}
		},
		defaultTitle: {
			birthday: "某人",
			activity: "无标题",
			todo: "某事",
			calendar: "默认日历",
			statuses: ["忙碌", "空闲", "正常"]
		}
	};
})();
