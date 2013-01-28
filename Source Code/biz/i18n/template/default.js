/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 9/19/12
 * Time: 10:36 上午
 * To change this template use File | Settings | File Templates.
 */
//通用的语言
(function(){
	var _i18n = {
		//通用部分
		_: {
			slogan: "Anywhere, Anytime, Anyway",
			language: "default",
			title: "Welcome to i'm Time",
			description: "",
			keyword: "",
			footer: ""
		},
		noActivity: "No event, You can add an activity, todo or somebody's birthday.",
		newActivity: "New a activity",
		calendar: "Calendar",
		calendars: {
			title: "My Calendars",
			newCalendar: "Create new calendar"
		},
		option: {
			menu: {
				account: "Account",
				setting: "Setting"
			},setting: {
				notification: "Enable notification",
				badge: "Use badge",
				autoHide: "Minimize on Startup"
			}
		},
		menu: {
			create: "Create",
			get: "Get",
			sync: "Sync",
			signIn: "Log in",
			signOut: "Log out",
			option: "Option"
		},
		sign: {
			memo: "Use the account of imTime.com, you can sync your data to cloud server.",
			signIn: {
				mail: "E-mail",
				mailPlaceholder: "Your e-mail",
				password: "Password",
				passwordPlaceholder: "Your password",
				signUp: "Join free now!",
				forgotPwd: "Forgot your password?"
			},
			signUp: {
				mail: "E-mail",
				mailPlaceholder: "Your e-mail",
				password: "Password",
				passwordPlaceholder: "Your password",
				signIn: "Sign in here",
				confirmPasswordPlaceholder: "Re-enter your password",
				confirmPassword: "Repeat Password"
			},
			button: {
				signIn: "Sign In",
				signUp: "Sign Up"
			}
		},
		//日历编辑器
		calEditor: {
			titleTips: "Named your calendar",
			title: "Title",
			color: "Color",
			tags: "Tags",
			button: {
				save: "Save"
			}
		},
		birthdayEditor: {
			calendar: "Calendar",
			who: "Who",
			reminders: "Reminders",
			birthday: "Birthday",
			local: "Local"
		},
		expressEditor: {
			title: "What do you mean?",
			mask: "e.g. Have meeting at 4pm every Friday.",
			save: "Save"
		},
		//与活动编辑器重复，兼顾到mapping.js
		todoEditor: {
			calendar: "Calendar",
			title: "What",
			begin: "Begin",
			reminders: "Reminders"
		},
		actEditor: {
			calendar: "Calendar",
			allDay: "All Day",
			time: "Time",
			title: "What",
			begin: "When",
			end: "To",
			repeat: "Repeat",
			reminders: "Reminders",
			location: "Where",
			noReminders: "No reminder yet, you can add a new one.",
			noMailReminder: "Mail Reminder coming soon.",
			button: {
				todo: "Todo",
				birthday: "Birthday",
				normal: "Activity",
				save: "Save",
				del: "Delete"
			}
		},
		//重复
		repeat:{
			title: "Select Repeat",
			end: "Until",
			neverStop: "Never Stop"
		},
		status: {
			title: "Add new status"
		},
		popup: {
			today: "Today",
			option: "Option",
			go: "Go",
			more: "More"
		},
		timepicker: {
			allDay: "All Day",
			hours: "Hours",
			minutes: "Minutes",
			memo: "Monitor"
		}
	};

	if(typeof exports === 'object'){
		exports.index = _i18n;
	}else{
		im.i18n["default"].template = _i18n;
	}
})();