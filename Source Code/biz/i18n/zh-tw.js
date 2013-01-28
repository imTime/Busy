/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/11/12
 * Time: 1:44 下午
 * 國際化
 */
(function(){
	im.i18n["zh-cn"] = {
		date: {
			weekName: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
			monthName: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
			shortMonthName: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
			shortWeekName: ["週日", "週一", "週二", "週三", "週四", "週五", "週六"],
//日曆週的名稱
			calendarWeekName: ["日", "一", "二", "三", "四", "五", "六"],
			am: "上午",
			pm: "下午",
			h: "小時",
			y: "年",
			M: "月",
			m: "分",
			s: "秒",
			year: "年",
			month: "月",
			week: "週",
			day: "天",
			years: "年",
			months: "月",
			weeks: "週",
			days: "天",
			hours: "小時",
			minutes: "分鐘",
			hour: "小時",
			minute: "分鐘",
			monthly: "每月",
			yearly: "每年",
			weekly: "每週",
			daily: "每天",
			today: "今天",
			yesterday: "昨天",
			tomorrow: "明天",
			before: "{0}{1}前",
			after: "{0}{1}後"
		},
//對枚舉的本地化，_枚舉值作鍵，如_4:""
		e: {
			ActivityRepeat: {
				caption: "重複",
				_99: "不重複",
				_2: "每年",
				_4: "每月",
				_5: "每週",
				_6: "每天"
			},
			ActivityType: {
				"_2": "活動",
				"_3": "生日",
				"_4": "待辦",
				"_255": "未知"
			},
			ReminderBy: {
				"caption": "提醒",
				"_2": "彈出",
				"_3": "郵件", //郵件提醒
				"_4": "推送到手機", //推送到用戶手機上
				"_5": "短信", //短信通知
				"_255": "未知" //未知提醒方式
			}
		},
		reminders: {
			before: "提前",
			after: "延後",
			minutes: "分鐘",
			hours: "小時",
			days: "天",
			custom: "自定義",
			reminderBy: "{0}提醒"
		},
		dateFormat: 3,
		warning: "警告",
		error: "錯誤",
		local: im.e.ActivityLocal.ChineseLunar,
//是否啟用本地日曆
		enableLocal: true,
		localText: "農曆",
		signIn: "登錄",
		signOut: "註銷",
		profile: "帳戶",
		sign: {
			signInTitle: "用戶登陸",
			signUpTitle: "用戶註冊",
			incorrect: "您輸入的密碼不正確，請重新輸入！",
			locked: "您的帳號已經被鎖定！",
			active: "您的帳號還有被激活，請注意查收激活郵件(郵件有可能被送往垃圾箱)",
			mailError: "請輸入正確的郵箱地址！",
			pwdError: "您的密碼輸入不正確(6-20個字符)！",
			pwdNotSame: "您兩次輸入的密碼不一致，請重新輸入！",
			mailExists: "郵箱已經存在，您是否忘記密碼？"
		},
//服務器錯誤　
		serverError: {
			err_10: "您提交的數據不正確，請與我們聯繫。",
			err_9999: "您的軟件版本太低，請及時更新軟件。",
			err_9998: "服務器出現故障，請稍候再試。",
			err401: "認證失敗，請重新登陸。",
			err404: "訪問服務器失敗，請檢查網絡是否正常。",
			err500: "服務器異常，請稍後再試！",
			err403: "您的訪問被禁止，請與我們聯繫！",
			unknown: "未知錯誤，請稍候再試",
			timeout: "服務器響應超時，請稍候再試！"
		},
		button: {
			go: "轉到",
			done: "完成",
			back: "返回",
			edit: "編輯",
			save: "保存",
			add: "新建"
		},
//活動中的本地化字符
		activity: {
			title: {
				selectCalendar: "選擇日曆",
				editReminder: "編輯提醒",
				normal: "編輯活動",
				birthday: "編輯生日",
				todo: "編輯待辦事項",
				reminder: "設置提醒",
				repeat: "設置重複"
			},
			editorTitle: "編輯活動",
			birthday: "{0}的生日",
			birth: "出生",
			age: "{0}歲",
			allDay: "全天",
			neverStop: "永不停止",
			noTitle: "無標題",
			begin: "開始",
			end: "結束",
			duration: "持續",
			start: "始於",
			repeat: "重複",
			counter: "重複次數",
			reminderLink: "[{0}]個提醒",
			noReminder: "無提醒",
			repeatType: {
				_99: "不重複",
				_2: "每年重複",
				_4: "每月重複",
				_5: "每週重複",
				_6: "每天重複"
			},
			message: {
//提醒超出限制
				reminderOverLimit: "您最多可以創建{0}個提醒，已經創建{1}個",
				mailNoSet: "您必需先設置提醒郵箱才能使用郵件提醒功能。"
			}
//remindersLink: null, //複數的提醒
		},
		expressEditor: {
			multiLine: "開啟多行模式",
			type: "類型",
			title: "標題",
			repeat: "重複",
			from: "開始",
			to: "結束",
			reminder: "提醒"
		},
//日曆
		calendarEditor: {
			editorTitle: "編輯日曆",
			leftButton: "返回",
			rightButton: "保存",
			message: {
				limit: "您最多只能創建{0}個日曆，已經創建{1}個日曆",
				notExists: "您編輯的日曆不存在"
			}
		},
		defaultTitle: {
			birthday: "某人",
			activity: "無標題",
			todo: "某事",
			calendar: "默認日曆",
			statuses: ["忙碌", "空閒", "正常"]
		}
	};
})();