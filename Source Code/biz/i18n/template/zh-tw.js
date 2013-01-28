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
			slogan: "任何地點，任何時間，任何方式",
			language: "zh-cn",
			title: "歡迎來到i'm Time",
			description: "",
			keyword: "",
			footer: ""
		},
		noActivity: "當天沒有任何活動，您可以創建一個活動/待辦事項/生日",
		newActivity: "創建新的活動",
		calendar: "日曆",
		calendars: {
			title: "我的日曆",
			newCalendar: "創建新的日曆"
		},
		option: {
			menu: {
				account: "帳號",
				setting: "設置"
			},setting: {
				notification: "啟用提醒功能",
				badge: "使用數字提醒",
				autoHide: "啟動自動隱藏"
			}
		},
		menu: {
			create: "新建",
			get: "下載",
			sync: "同步",
			signIn: "登錄",
			signOut: "註冊",
			option: "選項"
		},
		sign: {
			memo: "使用imTime.com帳號，可以將數據同步到雲端服務器，數據永不丟失。",
			signIn: {
				mail: "郵箱",
				mailPlaceholder: "您的郵箱地址",
				password: "密碼",
				passwordPlaceholder: "請輸入的密碼",
				signUp: "免費註冊新帳號",
				forgotPwd: "忘記密碼了？"
			},
			signUp: {
				mail: "郵箱",
				mailPlaceholder: "請使用您的常用郵箱",
				password: "密碼",
				passwordPlaceholder: "請輸入的密碼",
				confirmPassword: "重複密碼",
				confirmPasswordPlaceholder: "重複輸入您的密碼",
				signIn: "用現有帳號登陸"
			},
			button: {
				signIn: "登錄",
				signUp: "註冊"
			}
		},
//日曆編輯器
		calEditor: {
			titleTips: "請給日曆起個名字",
			title: "標題",
			color: "顏色",
			tags: "標籤",
			button: {
				save: "保存"
			}
		},
		birthdayEditor: {
			calendar: "日曆",
			local: "農曆",
			who: "姓名",
			birthday: "生日",
			reminders: "提醒"
		},
		expressEditor: {
			title: "來，試試智能添加功能吧",
			mask: "例如：每週五下午三點在三樓會議室開例會",
			save: "保存",
			multiLine: "開啟多行模式"
		},
//與活動編輯器重複，兼顧到mapping.js
		todoEditor: {
			calendar: "日曆",
			title: "標題",
			begin: "開始時間",
			reminders: "提醒"
		},
		actEditor: {
			calendar: "日曆",
			allDay: "全天事件",
			time: "時間",
			title: "標題",
			begin: "開始時間",
			end: "結束時間",
			repeat: "重複",
			reminders: "提醒",
			location: "地點",
			noReminders: "還沒有任何提醒，您可以新建一個提醒。",
			noMailReminder: "郵件提醒功能即將歸來",
			button: {
				todo: "待辦",
				birthday: "生日",
				normal: "活動",
				save: "保存",
				del: "刪除"
			}
		},
//重複
		repeat:{
			title: "重複類型",
			end: "重複至",
			neverStop: "永不停止",
			local: "農曆"
		},
		status: {
			title: "新建狀態"
		},
		popup: {
			today: "今天",
			option: "選項",
			go: "跳轉",
			more: "更多"
		},
		timepicker: {
			allDay: "全天",
			hours: "小時",
			minutes: "分鐘",
			memo: "您的選擇"
		}
	};

	if(typeof exports === 'object'){
		exports.index = _i18n;
	}else{
		im.i18n["zh-cn"].template = _i18n;
	}
})();