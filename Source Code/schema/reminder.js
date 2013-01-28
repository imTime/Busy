var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

//==deploy==
/*
 * 保存用户的提醒记录
 */
var schema = {
	delay: {type: Number},			//提醒延时，负数表示在过去提醒，正数则在未来提醒(全天事件需要)，以秒为单位
	memberId: {type: ObjectId, index: true},		//所属于的用户，冗余
	activityId: {type: ObjectId},				//对应的活动id
	reminderBy: {type: Number},		//提醒的方式
	start: {type: Number},				//提醒的开始生效时间，用于搜索
	stop: {type: Number},					//提醒的停止时间，用于搜索
	repeat: {type: Number},				//重复类型，用于reminder Queue
	calendarId: {type: ObjectId},	//冗余，用于客户端检索
	//createTime: {type: Number, default: new Date().getTime()},		//用户创建时间
	lastUpdate: {type: Number}, 		//最后更时间
	version: {type: Number}		//版本
}
//==deploy==

var tableName = "reminder";

exports.tableInfo = {
	tableName: tableName,
	schema: schema
};

mongoose.model(tableName, new Schema(schema,  {collection: tableName}));