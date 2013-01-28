var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

//==deploy==
//发送邮件队列
var schema = {
	guid: {type: String, index: true},							//全局唯一标识，用于删除
	mailto: {type: String},						//邮件接收人
	subject: {type: String},					//主题
	status: {type: Number},			//状态，发生错误时可以跳过
	template: {type: Number},					//所属用户id，冗余，用于查询和权限管理
	priority: {type: Number},					//优先级，一共10级
	timeStamp: {type: Number},				//时间戳，用于发送邮件排序
	data: {type: String}							//用于格式化模版的数据
};

//==deploy==

var tableName = "mailQueue";

exports.tableInfo = {
	tableName: tableName,
	schema: schema
};

mongoose.model(tableName, new Schema(schema, {collection: tableName}));
exports.schema =  mongoose.model(tableName);