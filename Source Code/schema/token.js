var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

/*
 保存用户的Token
 */
var schema = {
	token: {type: String, index: true},
	memberId: {type: ObjectId},		//所属于的用户
	type: {type: Number},					//类型
	expired: {type: Number}				//过期时间
}

var tableName = "token";

exports.tableInfo = {
	tableName: tableName,
	schema: schema
};

mongoose.model(tableName, new Schema(schema,  {collection: tableName}));