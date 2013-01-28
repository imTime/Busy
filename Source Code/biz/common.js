//var _fix = require("./fixData");
/*
 * 枚举
 * 警告：枚举值1表示操作成功，1以下的枚举值有特殊用途，不能使用
 */
if(!im){
	var im = {};
}

//==deploy==
im.e = {
	VersionTooLower: -9999,		//API版本太低，必需升级
	ServerStop: -9998,				//服务器暂时不能提醒服务
	DataIncorrect: -10,			//用户提交了不正确数据，不能通过数据校验
	NotFound: -2,						//用户访问了某个不存在的资源
	Forbidden: -1,						//禁止访问，由于用户无权限
	Success: 1,							//成功执行某个操作
	//TODO Stuct这个实现的方式不对
	Pagination:{					//分页信息
		PageIndex: 1,				//页索引
		PageSize: 10,				//页大小
		PageCount: 0,				//页总数
		RowCount: 0					//记录总数
	},
	ForgotPasswordResult: {
		MailNotExist: 2,				//邮件不存在
		MailIncorrect: 3				//密码不正确
	},SignUpResult: {				//用户注册的结果
		MailIncorrect: 2,					//邮箱不正确
		PasswordIncorrect: 3,			//密码不符合要求
		MailExist: 4							//邮箱已经存在
	},SignInResult: {						//用户登陆的结果
		Incorrect: 2,			//登陆信息无效，也包括邮箱无效
		Locked: 3,					//帐号被锁定
		NotActivated: 4			//帐号未被激活
	},foundPasswordResult: {			//找回密码校验token的结果
		MailIncorrect: 2,		//邮箱格式不合法
		MailNotExist: 3,		//邮箱不存在
		TokenExpired: 4,		//token已经过期
		TokenInvalid: 5			//token无效
	},SaveCalendar: {
		CalendarLimit: 2,					//日历超出最大数量限制
		CalendarNotExist: 3				//日历不存在，一般是更新日历的时候，不能更新别人的日历
	},DeleteCalendar: {
		CalendarNotExist: 2				//日历不存在
	},ActivityLocal:{					//本地化活动
		//公历
		Solar: 2,
		//中国农历
		ChineseLunar: 3
	},ActivityType: {				//活动类型
		Birthday: 3,				//生日
		Normal: 2,					//标准
		Todo: 4,						//to do
		Unknown: 255
	}	,ActivityRepeat: {				//活动的重复类型
		NoRepeat: 99,				//不重复，默认
		Yearly: 2,					//按年重复
		Quarterly: 3,				//按季度重复
		Monthly: 4,					//按月重复
		Weekly: 5,					//按周重复
		Daily: 6						//按天重复
	},SaveActivity: {
		CalendarNotExist: 2,				//没有找到可以更新的活动
		OverLimit: 3,						//活动超出限制
		ActivityNotExist: 4					//活动没有找到（仅对修改）
	},GetActivity: {							//获取日历
		CalendarNotExists: 2				//获取日历下的所有活动，但没有找到日历（可能是没有权限）
	}, SaveStatus: {
		StatusExists: 2,							//状态已经存在
		StatusLimit: 3,							//用户的状态数量超出限制
		StatusNotFound: 4					//状态找不到，可能被删除，一般是更新的时候
	}, ReminderBy: {
		Popup: 2,
		Mail: 3,								//邮件提醒
		PushToMobile: 4,				//推送到用户手机上
		SMS: 5,									//短信通知
		Unknown: 255					 //未知提醒方式
	}, MemberStatus:{				//用户的状态
		Signed: 2,						//用户已经登陆
		UnSigned: 3						//未登陆
	}, SaveReminder: {
		ReminderNotFound: 2,			//没有找到活动，可能是没有权限，也可能是被删除
		ReminderLimit: 3,					//超出限制
		ActivityNotFound: 4,				//找不到活动
		MailNoSet: 5							//提醒没有设置邮箱
	}, DeleteStatus:{
		ActivityExist: 2,				//状态下存在活动
		StatusNotExist: 3				//状态不存在
	}	,method: {									//提交的方式
		PUT: "PUT",
		POST: "POST",
		DELETE: "DELETE",
		GET: "GET"
	},
	module: {									//模块列表
		token: "token",					//获取用户的token
		calendar: "calendar",
		member: "member",
		status: "status",
		activity: "activity",
		reminder: "reminder",
		signIn: "signIn",
		signUp: "signUp",
		signOut: "signOut"
	},
	httpStatus: {
		OK: 200,				//请求OK
		Created: 201,		//创建成功
		Unauthorized: 401,		//未授权，用户没有登陆
		Forbidden: 403,				//被禁止，用户已经登陆，但被请求的源没有权限
		NotFound: 404					//找不到资源
	},
	//客户端的类型
	Client: {
		Unknown: 1,					//未知
		WebSite: 2,					//来源于官方网站（imTime.com）
		Pad: 3,							//大于7寸的Pad网站
		Phone: 4,						//小于7寸的智能手机网站
		iPad: 11,			//iPad版本，指App，非网站
		iPhone: 12,		//iPhone的版本，指App，非网站
		WindowsPhone: 13,			//WP的版本
		Android: 14,
		Metro: 20,							//Windows 8上的Metro版本
		Mac: 21,								//运行在Mac上的版本
		Air: 22,								//Air客户端
		Chrome: 201,					//imTime.com的Chrome插件
		Safari: 202,					//Safari插件
		ChromeApp: 203,				//和Chrome一样，不过打开方式和检索方式不一样
		Baidu: 401,						//百度应用
		Facebook: 402,					//Facebook的应用
		iOS: 1000,						//运行于imbox内的，包括iPad/iPhone
		Mobile: 10001				//用于移动设备网站上的，兼容Pad和Phone
	}
};

//配置
im.config = {
	//永不停止的时间戳，即9999/12/31
	maxDateTime: 253402183800000,
	//密码最小长度
	minPasswordLength: 6,
	//忘记密码token的有效时间
	forgotPasswordTokenExpired: "+1d",
	//用户默认可以创建最多的日历，-1表示不限制，vip用户根据用户设置
	maxCalendarPerMember: 1024,
	//默认每个活动最多可以创建的提醒数量
	maxReminderPerActivity: 5,
	//每个日历可以创建多少个日历
	maxActivityPerCalendar: 300,
	//用户最多可以创建多少个状态
	maxStatusPerMember: 7,
	//token的过期时间，以分钟为单位，525600=1年
	tokenExpired: 525600,
	//各种字段的长度
	fieldLength: {
		calendar:{
			title: 100,
			summary: 500,
			tag: 10
		},activity:{
			title: 100,
			tag: 10,
			summary: 500
		},status:{
			status: 15
		}
	}
};

//各种日期格式化
im.i18n = im.i18n || {};

im.i18n.dateFormat = [
	{
		yMd: "yyyy-MM-dd",
		yM: "yyyy-MM",
		yMdhm: "yyyy-MM-dd hh:mm",
		Mdhm: "MM-dd hh:mm",
		Md: "MM-dd",
		hm: "hh:mm"
	},{
		yMd: "dd MMM, yyyy",
		yM: "MMM, yyyy",
		yMdhm: "dd MMM, yyyy hh:mm",
		Mdhm: "dd MMM hh:mm",
		Md: "dd MMM",
		hm: "hh:mm"
	},{
		yMd: "MMM dd, yyyy",
		yM: "MMM, yyyy",
		yMdhm: "MMM dd, yyyy hh:mm",
		Mdhm: "MMM dd hh:mm",
		Md: "MMM dd",
		hm: "hh:mm"
	},{
		yMd: "yyyy年M月d日",
		yM: "yyyy年M月",
		yMdhm: "yyyy年M月d日 hh:mm",
		Mdhm: "M月d日 hh:mm",
		Md: "M月d日",
		hm: "hh:mm",
		language: ["zh-cn"]			//指定语言有效
	}
];
//==deploy==

/*
//与当前用户相关的
exports.current = {
	//成员相关
	member:{
		//TODO MemberID测试采用常量
		memberId: null,					//当前用户的id
		screenName: null,			//屏显名称
		mail: null						//用户的邮件
	},env: {						//环境相关
		isApiServer: false,			//是否为API服务器
		authorization: null,			//API的用户认证
		host: null,
		//默认返回的内容类型
		"content-type": "application/json",
		//字符集
		charset: "utf-8",
		//api的版本，只对api，默认版本为1，即旧版本
		version: 1,
		client: im.e.Client.WebSite,
		//语言
		language: "en-us"
	}
};
*/

//用于发送邮件的SMTP服务器
exports.smtpServer = {
	host: "localhost",
	port: 2013,
	authorization: "YUhSMGNDVXpRUzh2Ym1WM0xtbHRkR2x0WlM1amIyMHZZbUZ6WlRZMA=="
};

exports.config = im.config;
exports.enumeration = im.e;
exports.im = im;
