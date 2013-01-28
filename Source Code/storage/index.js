/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 9/4/12
 * Time: 6:49 PM
 * To change this template use File | Settings | File Templates.
 */
var _common = require("../biz/common");
var _hummer = require("../hummer/server/");

var im = {
	schema: {},
	e: _common.enumeration,
	config: _common.config,
	storage: {
		//是否为Node.js的环境
		isNode: true,
		fix: require("./fix").fix,
		getResult: _hummer.getResult,
		merge: function (source, target){
			for(var item in target){
				source[item] = target[item];
			};
			return source;
		},
		/*
		 * 获取单个文档，主要是为了兼容客户端
		 */
		getDocument: function(schema, cond, callback){
			schema.findOne(cond, callback);
		},
		//保存文档
		save: function(schema, callback){
			schema.save(function(err){
				callback(err, schema._id);
			});
		},
		/*
		 * 查找一条件记录
		 */
		findOne: function(schema, cond, fields, callback){
			schema.findOne(cond, fields, callback);
		},
		/*
		 * 查找
		 */
		find: function(schema, cond, fields, option, callback){
			schema.find(cond, fields, option, callback);
		},
		/*
		 * 更新数据
		 */
		update: function(schema, cond, update, callback){
			schema.update(cond, update, callback);
		},
		/*
		 * 升级版本号，服务器端加1，客户端加小数位
		 */
		incVersion: function(version){
			version = version || 0;
			return version + 1;
		},
		/*
		 *  移除文档
		 */
		remove: function(schema, callback){
			schema.remove(callback);
		},
		/*
		 * 根据条件删除
		 */
		removeWithCondition: function(schema, cond, callback){
			schema.find(cond, function(err, docs){
				if(err) return callback(err);
				var length = docs.length;
				if(length == 0) return callback(err, length);
				docs.remove(function(err){
					callback(err, length);
				});		//end remove
			});
		},
		/*
		 * 统计
		 */
		count: function(schema, cond, callback){
			schema.count(cond, callback);
		}
	}
};

exports.im = im;
exports.calendar = require("./calendar").storage;
exports.activity = require("./activity").storage;
exports.status = require("./status").storage;
exports.reminder = require("./reminder").storage;