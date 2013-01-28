/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/11/12
 * Time: 1:44 下午
 * 国际化
 */
(function(){
	im.i18n["default"] = {
		date: {
			weekName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
			monthName: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
			shortWeekName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
			shortMonthName: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
			calendarWeekName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
			am: "AM",
			pm: "PM",
			h: "Hour",
			y: "Year",
			M: "Month",
			m: "Minute",
			s: "Second",
			year: "year",
			month: "month",
			week: "week",
			day: "day",
			years: "years",
			months: "months",
			weeks: "weeks",
			days: "days",
			hours: "hours",
			minutes: "minutes",
			hour: "hour",
			minute: "minute",
			monthly: "Monthly",
			yearly: "Yearly",
			weekly: "Weekly",
			daily: "Daily",
			today: "Today",
			yesterday: "Yesterday",
			tomorrow: "Tomorrow",
			before: "{0} {1} ago",
			after: "After {0} {1}"
		},
		//对枚举的本地化，_枚举值作键，如_4:""
		e: {
			ActivityRepeat: {
				caption: "Repeat",
				_99: "No Repeat",
				_2: "Yearly",
				_4: "Monthly",
				_5: "Weekly",
				_6: "Daily"
			},
			ReminderBy: {
				"caption": "Reminder",
				"_2": "Pop up",
				"_3": "Mail",								//邮件提醒
				"_4": "Push To Mobile",				//推送到用户手机上
				"_5": "SMS",									//短信通知
				"_255": "Unknown"					 //未知提醒方式
			},
			ActivityType: {
				"_2": "Activity",
				"_3": "Birthday",
				"_4": "Todo",
				"_255": "Unknown"
			}
		},
		reminders: {
			before: "Before",
			after: "After",
			minutes: "Minutes",
			hours: "Hours",
			days: "Days",
			custom: "Custom",
			reminderBy: "By {0}"
		},
		dateFormat: 2,
		warning: "Warning",
		error: "Error",
		signIn: "Log In",
		signOut: "Log Out",
		profile: "Mine",
		enableLocal: false,
		sign: {
			signInTitle: "Sign In",
			signUpTitle: "Sign Up",
			incorrect: "The password you entered is incorrect, Please try again.",
			locked: "Your account has been locked.",
			active: "Your account is not active, please check your mail box or junk mail box.",
			mailError: "Please enter a valid email address.",
			pwdError: "The password you entered is incorrect(6 - 20 characters).",
			pwdNotSame: "Passwords do not match.",
			mailExists: "E-mail has already existed, please check again."
		},
		//服务器错误　
		serverError: {
			err_10: "Data incorrect.",
			err_9999: "Please update your software.",
			err_9998: "Server Error.",
			err401: "Authentication failed. please login again.",
			err404: "Failed to access server, please check the network.",
			err500: "Server error, please try later.",
			err403: "your visit is forbidden. Please contact with us.",
			unknown: "Unknown error，please try later.",
			timeout: "Server response timeout, please try later."
		},
		button: {
			go: "Go",
			done: "Done",
			back: "Back",
			edit: "Edit",
			save: "Save",
			add: "Add"
		},
		//活动中的本地化字符
		activity: {
			title: {
				selectCalendar: "Select Calendar",
				editReminder: "Edit Reminder",
				normal: "Edit Activity",
				birthday: "Edit Birthday",
				todo: "Edit TODO",
				reminder: "Reminder Setting",
				repeat: "Repeat Setting"
			},
			birthday: "{0}'s birthday",
			birth: "Birth",
			age: "{0} years",
			allDay: "All Day",
			neverStop: "Never Stop",
			noTitle: "No Title",
			from: "From",
			until: "Until",
			duration: "Duration",
			begin: "Begin",
			repeat: "Repeat",
			counter: "Counter",
			reminderLink: "[{0}] Reminder",
			remindersLink: "[{0}] Reminders",
			noReminder: "No Reminder",
			repeatType: {
				_99: "No Repeat",
				_2: "Yearly",
				_4: "Monthly",
				_5: "Weekly",
				_6: "Daily"
			},message: {
				//提醒超出限制
				reminderOverLimit: "you can add {1} reminders at most. {1} reminders are already created.",
				mailNoSet: "you haven't set mail address for reminding, so you can't receive reminder mail."
			}
		},
		expressEditor: {
			multiLine: "Multi-line",
			type: "Type",
			title: "Title",
			repeat: "Repeat",
			from: "From",
			to: "To",
			reminder: "Reminder"
		},
		//日历
		calendarEditor: {
			editorTitle: "Edit Calendar",
			leftButton: "Back",
			rightButton: "Save",
			message: {
				limit: "you can add {0} calendar(s) at most. {1} calendar(s) are already created.",
				notExists: "The calendar you're modifying doesn't exist. "
			}
		},
		defaultTitle: {
			calendar: "Default",
			birthday: "Somebody",
			activity: "Unknown",
			todo: "Something",
			statuses: ["Busy", "Free", "Normal"]
		},
		//持续时间
		duration: function(data){
			var result = "";
			var unit = {
				y: "year",
				M: "month",
				d: "day",
				h: "hour",
				m: "minute",
				s: "second"
			};

			for(var key in data){
				var value = data[key];
				if(value){
					var u = unit[key];
					if(value > 1) u += "s";
					result += " {0} {1}".format(value, $.i18n("date." + u));
				}
			};
			/*

			if(data.y) result += data.y + " Years";
			if(data.M) result += data.M + " Months";
			if(data.d) result += data.d + " Days";
			if(data.h) result += data.h + " Hours";
			if(data.m) result += data.m + " Minutes";
			if(data.s) result += data.s + " Seconds";
			*/

			return result;
		},
		/*
		 * 获取提醒的本地化
		 */
		getReminderText: function(delay, reminderBy){
			var prefix = "", duration = "";
			if(delay != 0){
				prefix = delay > 0 ? "After" : "Before";

				delay = Math.abs(delay) * 60;
				var data = delay.secondConverter();
				duration = $.i18n("duration", [data]);
			};

			//提醒方式
			var rmdType = im.i18n.getLocalEnum("ReminderBy", reminderBy);
			return "{0}{1} by {2}".format(prefix, duration, rmdType);
		}
	};
})();
