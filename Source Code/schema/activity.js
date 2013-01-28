var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

//==deploy==
//活动
var schema = {
	memberId: {type: ObjectId, index: true},					//所属用户id，冗余，用于查询和权限管理
	calendarId: {type: ObjectId, index: true},					//对应日历的id
	statusId: {type: ObjectId},							//用户状态，对应status表
	color: {type: String},									//为了兼容以前的版本，新版本不再使用color
	title: {type: String},									//标题
	tags: {type: [String]},
	location:{type: String},									//位置
	//生日/to do/普通活动/
	type: {type: Number},										//类型
	begin: {type: Number, index: true},			//开始时间
	end: {type: Number},		//结束时间
	local: {type: Number},			//本地化日历，非本地化/中国农历/其它
	allDay: {type: Boolean},		//是否为全天事件
	repeat: {type: Number, index: true},		//重复类型，按年/月/天/周/不重复
	repeatStop: {type: Number, index: true},			//重复的停止时间
	summary: {type: String},		//摘要描述
	reminder:{type: Number}, 			//提醒总数量，添加提醒的时候统计，冗余
	priority: {type: Number},		//优先级，一共10级
	finishedDate:  {type: Number},			//完成时间
	finishedRate: {type: Number},			//完成度，1表示全部完成
	//createTime: {type: Number, default: new Date().getTime()},		//创建时间
	lastUpdate: {type: Number},		//最后更新
	version: {type: Number}				//版本，
}
//==deploy==

var tableName = "activity";

exports.tableInfo = {
	tableName: tableName,
	schema: schema
};

mongoose.model(tableName, new Schema(schema, {collection: tableName}));