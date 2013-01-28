var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

/*
用户的架构，这个表客户端软件是不需要创建的
 */
var schema = {
	mail: {type: String},			//用户邮件，必需有，而且要唯一
	password: {type: String},		//用户的密码
	createTime: {type: Number},		//用户创建时间
	loginCounter: {type: Number},		//用户登陆的记数，可以判断用户的活跃度
	lastLogin: {type: Number},				//最后登陆的时间
	screenName: {type: String},		//用户的屏显名称，昵称
	registerBy: {type: Number},				//注册的方式
	/*
	 找回密码，用户请求的时候，输入邮箱地址，生成一个guid
	 然后生成链接发到用户的邮箱，链接中包括这个guid
	 用户需要输入邮箱才成找回密码，一旦成功找回密码或者过期，则需要重新申请
	 */
	foundPassword: {
		token: {type: ObjectId},				//唯一的字符串
		expired: {type: Number}			//过期时间
	},
	activation: ObjectId			//激活的信息，如果已经激活，则此项为null
};

var tableName = "member";

exports.tableInfo = {
	tableName: tableName,
	schema: schema
};

mongoose.model(tableName, new Schema(schema,  {collection: tableName}));