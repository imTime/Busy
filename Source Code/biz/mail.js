/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 9/20/12
 * Time: 5:38 下午
 * 专门用于发送邮件的
 */
var _hummer = require("../hummer/server");
var _common = require("./common");

/*
 * 发送邮件
 * @params {String} guid 邮件的唯一key，主要是用于删除
 * @params {String} mailto 收件人
 * @params {String} subject 主题
 * @params {Number} template 邮件所用模板，和SMTP Mail Queue Server上的设置一一对应
 * @params {Object|String} 用于格式化模板的数据
 */
function sendMail(guid, mailto, subject, template, data){
	if(typeof(data) == "string") data = JSON.stringify(data);
	var reqData = {
		guid: guid,
		mailto: mailto,
		subject: subject,
		data: data,
		template: template,
		language: _common.current.env.language
	};

	var smtp = _common.smtpServer;
	var options = {
		port: smtp.port,
		method: "POST",
		host: smtp.host,
		path: "/",
		headers: {
			Authorization: smtp.authorization
		}
	};
	_hummer.request(options);
};

/*
 * 发送激活码邮件
 */
function activationMail(mailto, key){
	//sendMail(null, mailto, )
};

exports.activationMail = activationMail;
exports.sendMail = sendMail;
