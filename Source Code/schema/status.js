var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

//==deploy==
/*
 用户的状态列表，这个表客户端软件是不需要创建的
 同一个用户的状态不能重复
 */
var schema = {
	color: {type: String},			//颜色
	memberId: {type: ObjectId, index: true},		//所属于的用户
	status: {type: String},				//状态
	counter: {type: Number},		//该状态下的活动统计
	//createTime: {type: Number, default: new Date().getTime()},		//用户创建时间
	lastUpdate: {type: Number}, 		//最后更时间
	version: {type: Number}		//版本
}
//==deploy==

var tableName = "status";

exports.tableInfo = {
	tableName: tableName,
	schema: schema
};

mongoose.model(tableName, new Schema(schema,  {collection: tableName}));