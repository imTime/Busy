/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/2/12
 * Time: 11:11 上午
 * To change this template use File | Settings | File Templates.
 */
var
	_member = require("../schema").member,
	_token = require("../schema").token,
	_common = require("./common"),
	_enum = _common.enumeration,
	_config = _common.config,
	_hummer = require("../hummer/server"),
	_utils = require('connect').utils,
	im = _common.im;
	//,_current = _common.current.member;

//================================Private Methods========================
/*
 * 对一段文本进行md5加密
 * @params {String} text 要加密的文本
 */
function md5(text, encoding){
	return _utils.md5(text).toUpperCase();
};

/*
 * 检查找回密码的Token是否正确
 * @params {String} mailQueue 邮箱
 * @params {String} token 对应的token
 * @params {Function} callback(err, result)
 */
function foundPasswordWithToken(mail, token, callback){
	var enumResult = _enum.foundPasswordResult;

	//检查邮箱是否正确
	if(!mailValidator(mail)){
		return callback(null, enumResult.MailIncorrect);
	};

	//根据邮箱查找用户
	_member.findOne({mail: mail}, function(err, doc){
		if(err) return callback(err);

		//邮件不存在
		if(!doc){
			return callback(null, enumResult.MailNotExist);
		};

		//校验token及过期时间
		var foundPwd = doc.foundPassword;
		if(!foundPwd || foundPwd.token != token){
			return callback(null, enumResult.TokenInvalid);
		};

		//是否过期
		if(foundPwd.expired < new Date().getTime()){
			return callback(null, enumResult.TokenExpired);
		};

		//正确，返回doc文档
		callback(null, _enum.Success, doc);
	});
};

/*
 * 检查密码正确，密码必需有并且大于指定长度
 * @params {String} password 要检查的密码
 * @return {Boolean} 返回检查结果
 */
function passwordValidator(password){
	return password && password.length >= _config.minPasswordLength;
};

/*
 * 检查邮箱是否正常，邮箱必需符合邮箱的规则
 * @params {String} mailQueue 要检查的邮箱
 * @return {Boolean} 返回检查结果
 */
function mailValidator(mail){
	return mail && mail.isMail();
};

/*
 * 根据邮箱，密码判断用户是否登陆，登陆成功返回用户的文档，否则返回false
 * @params {String} mailQueue 用户的邮箱
 * @params {String} password 密码
 * @params {Function} callback(err, result);
 * callback(err, code, doc);		code: 登陆结果(枚举)； doc：该用户的文档
 */
function signInWithMail(mail, password, callback){
	var enumResult = _enum.SignInResult,
		code = enumResult.Incorrect;

	//如果邮箱错误或者密码为空，直接返回错误
	if(!mailValidator(mail)){
		return callback(null, code);
	};

	//在数据库中查找密码是否存在
	_member.findOne({mail: mail}, function (err, doc) {
		if(err) return callback(err);

		//没有找到用户或者密码不一致
		if(!doc || md5(password) != doc.password){
			return callback(null, code);
		};

		//用户没有激活
		if(doc.activation){
			code = enumResult.NotActivated;
		}else{
			code = _enum.Success;
		};

		//验证成功，返回
		callback(null, code, doc);

		//更新用户登陆信息
		doc.lastLogin = _hummer.getTime();
		doc.loginCounter ++;
		//保存，不需要考虑是否成功，这个结果不重要
		doc.save();
	});
};

/*
 * 设置用户的默认信息
 */
function memberSetup(memberId){
	//创建用户的默认日历

	//创建用户的默认状态
};

/*
 * 根据用户的邮箱注册
 * @params {String} mailQueue 要注册的邮箱
 * @params {String} password 用户的密码
 * @params {Function} callback(err, result);
 */
function signUpWithMail(mail, password, registerBy, callback){
	var enumResult = _enum.SignUpResult;
	var code = enumResult.Incorrect;

	//检查用户邮箱是否正确
	if(!mailValidator(mail)){
		return callback(null, enumResult.MailIncorrect);
	};

	//检查用户密码是否符合要求
	if(!passwordValidator(password)){
		return callback(null, enumResult.PasswordIncorrect);
	};

	//查找用户是否存在
	_member.count({mail: mail}, function(err, count){
		if(err) return callback(err);
		//邮箱已经存在，响应客户端
		if(count > 0){
			return callback(null, enumResult.MailExist);
		};


		//校验正确，响应到客户端，保存用户帐号
		var member = new _member();
		member.mail = mail;
		member.password = md5(password);
		member.loginCounter = 0;
		member.lastLogin = new Date().getTime();
		//TODO 这里需要对client进行校验，一定要是数字
		member.registerBy = registerBy;
		//member.createTime = _hummer.getTime();
		member.activation = _hummer.getObjectId();
		member._id = _hummer.getObjectId();
		//保存数据
		member.save(function(err){
			if(err) return callback(err);
			//TODO 需要激活，提交邮件队列发送
			memberSetup(member._id);
			callback(null, _enum.Success);
		});
	});
};
//================================Public Methods========================
/*
 * 用户注册
 */
function signUp(req, res, next){
	var mail = req.body.mail,
		password = req.body.password;
	var env = _hummer.analyseHeaders(req);

	signUpWithMail(mail, password, env.client, function(err, code){
		if(err) return next(err);
		var result = _hummer.getResult(code == im.e.Success, code);
		_hummer.response(req, res, result);
	});
};

/*
 * 用户登陆
 */
function signIn(req, res, next){
	var mail = req.body.mail,
		password = req.body.password;
	//登陆
	signInWithMail(mail, password, function(err, code, doc){
		if(err) return next(err);
		//登陆成功，写入Session，记录用户登陆信息
		var result = code == _enum.Success || code == _enum.SignInResult.NotActivated;
		if(result){
			//TODO 写入Session和cookiese
			req.session.memberId =  doc._id;
			req.cookies.mail =  doc.mail;
			req.cookies.screenName = doc.screenName;
		};
		var resData = _hummer.getResult(true, code);
		_hummer.response(req, res, resData);
	});		//end _signin;
};

/*
 * 忘记密码，提交用户密码，将密码发送到用户邮箱
 */
function forgotPassword(req, res, next){
	var mail = req.body.mail;
	var enumResult = _enum.ForgotPasswordResult;

	if(!mailValidator(mail)){
		return _hummer.response(req, res, {code: enumResult.MailIncorrect});
	};

	//检查邮件是否存在
	_member.findOne({mail: mail}, function(err, doc){
		if(err) return next(err);
		if(!doc) return _hummer.response(req, res, {code: enumResult.MailNotExist});

		//TODO 需要检查用户同一天内是否多次申请找回密码

		//如果邮件存在，则生成一个guid，并发邮件给用户
		var expired = new Date().dateAdd(_config.forgotPasswordTokenExpired);
		var token = md5(_hummer.getObjectId());
		doc.foundPassword = {
			token: token,
			expired: _hummer.getTime(expired)
		};

		//更新，如果成功能向用户发一个邮件
		doc.save(function(err){
			if(err) next(err);

			//TODO 向用户发送找回密码的邮件

			//响应到客户端
			_hummer.response(req, res, {code: _enum.Success, token: token});
		});			//end save
	});				//end find one
};

/*
 * 重置密码，用户提供旧密码和新密码，旧密码正确可以找回新密码
 */
function changePassword(req, res, next){
	var mInfo = _hummer.getMember(req);
	var oldPassword = req.body.oldPassword,
		newPassword = req.body.newPasswowrd,
		mail = mInfo.mail,
		enumResult = _enum.SignInResult;

	//校验新密码是合法
	if(!passwordValidator(password)){
		return _hummer.response(req, res, {code: enumResult.PasswordIncorrect});
	}

	//先校验用户
	signInWithMail(mail, oldPassword, function(err, code, doc){
		if(err) return next(err);
		//旧密码不正确
		if(code != _enum.Success){
			return _hummer.response(req, res, {code: code});
		};

		//验证正确，修改密码
		doc.password = md5(newPassword);
		doc.save(function(err){
			if(err) return next(err);
			return _hummer.response(req, res, {code: enumResult.Success});
		});			//end save
	});				//end _signin
};

/*
 功能：根据token和mail找回密码
 方法：Post
 字段：邮箱，token，密码
 已登入：否
 */
function changePasswordWithToken(req, res, next){
	var password = req.body.password,
		mail = req.body.mail,
		token = req.body.token,
		enumResult = _enum.foundPasswordResult;;

	//检测密码
	if(!passwordValidator(password)){
		return _hummer.response(req, res, {code: enumResult.PasswordIncorrect});
	}

	//检测邮箱及token
	foundPasswordWithToken(mail, token, function(err, code, doc){
		if(err) return next(err);
		//不正确，直接返回
		if(code != _enum.Success){
			return _hummer.response(req, res, {code: code});
		};

		//校验正确，修改用户密码，并将found_password字段清空，
		doc.password = md5(password);
		doc.foundPassword = null;
		doc.save(function(err){
			if(err) return next(err);
			return _hummer.response(req, res, {code: code});
		});
	});
};

/*
 功能：检查token的合法性
 方法：get
 字段：token, mailQueue
 已登入：否
 */
function checkFoundPasswordToken(req, res, next){
	var mail = req.body.mail,
		token = req.body.token,
		enumResult = _enum.foundPasswordResult;

	foundPasswordWithToken(mail, token, function(err, code, doc){
		if(err) return next(err);
		_hummer.response(req, res, {code: code});
	});
};

/*
 * 判断用户是否已经登陆
 * 如果登陆，向客户端返回用户mail/screen name
 */
function getMember(req, res, next){
	var mInfo = _hummer.getMember(req);
	var result = {
		mail: mInfo.mail,
		screenName: mInfo.screenName
	};

	_hummer.response(req, res, result);
}

/*
 * 用户退出，用户点击退出，清除mail和screenName
 */
function signOut(req, res, next){
	req.session.memberId  = null;
	req.cookies.mail = null;
	req.cookies.screenName  = null;
	_hummer.response(req, res, {code: _enum.Success});
};

/*
 * 为用户生成一个token，并且把相同的token删除
 */
function generateToken(mail, memberId, type, expired, callback){
	var cond = {
		memberId: memberId,
		type: type
	};

	//移除用户的旧token
	_token.remove(cond, function(err){
		if(err) return callback(err);

		var tokenId = _hummer.getObjectId();
		var token = mail + tokenId.toString() + memberId.toString();
		token =	new Buffer(md5(token)).toString('base64');

		//插入数据
		var t = new _token();
		t._id = tokenId;
		t.token = token;
		t.memberId = memberId;
		t.type = type;
		t.expired  = expired;

		//保存token
		t.save(function(err){
			if(err) return callback(err);

			callback(null, token);
		});		//end save
	});			//end remove
};

/*
 * 请求token
 */
function requestToken(req, res, next){
	var mail = req.body.mail,
		password = req.body.password,
		env = _hummer.analyseHeaders(req);

	signInWithMail(mail, password, function(err, code, doc){
		if(err) return next(err);
		//登陆成功
		if(code == _enum.Success || code == _enum.SignInResult.NotActivated){
			var expired = new Date().dateAdd(_config.tokenExpired + "m").getUTC();
			generateToken(mail, doc._id, env.client, expired, function(err, token){
				if(err) return next(err);
				var result = _hummer.getResult(true, null, {
					token: token,
					expired: expired
				});
				//返回token
				_hummer.response(req, res, result);
			});
		}else{
			var result = _hummer.getResult(false, code);
			_hummer.response(req, res, result);
		}
	});
};

/*
 * 根据token来获取用户的ID，获取失败(不存在，过期)返回false
 */
function getMemberIdWithToken(token, type, callback){
	if(!token) return callback(null, false);
	//查找结果
	var cond = {
		token: token,
		type: type
	};

	_token.findOne(cond, function(err, doc){
		if(err) return callback(err);
		var memberId = false;
		if(!doc) return callback(null, memberId);
		var expired = doc.expired;
		if(expired > new Date().getTime()) memberId = doc.memberId;
		callback(null, memberId);
	});
};

exports.checkFoundPasswordToken = checkFoundPasswordToken;
exports.changePasswordWithToken = changePasswordWithToken;
exports.forgotPassword = forgotPassword;
exports.changePassword = changePassword;
exports.getMemberIdWithToken = getMemberIdWithToken;

//====================对route公开的方法=============
exports.token = requestToken;
exports.signOut = signOut;
exports.signIn = signIn;
exports.signUp = signUp;
exports.GET = getMember;

