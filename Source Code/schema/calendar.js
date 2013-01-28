var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

//==deploy==
var schema = {
	//时区，8表示+8区，-8表示-8时区
	timeZone: {type: Number},
	//日历的标题
	title: {type: String},
	//日历的颜色
	color: {type: String},
	tags: {type: [String]},			//标签
	memberId: {type: ObjectId, index: true},		//日历所有者，对应dao_member
	minDate: {type: Number},
	maxDate: {type: Number},
	//createTime: {type: Number, default: new Date().getTime()},
	lastUpdate: {type: Number},
	counter: {type: Number},			//计数器，统计活动有多少个
	summary: {type: String},				//描述
	version: {type: Number}		//版本
}
//==deploy==

var tableName = "calendar";

exports.tableInfo = {
	tableName: tableName,
	schema: schema
};

mongoose.model(tableName, new Schema(schema,  {collection: tableName}));