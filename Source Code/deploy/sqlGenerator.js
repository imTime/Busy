/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 9/3/12
 * Time: 5:53 PM
 * To change this template use File | Settings | File Templates.
 */
var schemas = [
	require("../schema/calendar"),
	require("../schema/activity"),
	require("../schema/status"),
	require("../schema/reminder"),
	require("../schema/token")
];

function getSql(table, schema){
	var sql = 'CREATE TABLE {0}(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ';
	sql += 'syncId TEXT, ';			//向远程同步的ID
	sql = sql.format(table);
	for(var field in schema){
		var s = schema[field];
		var type = s.type;
		var sqlType = "TEXT";
		if(type == Number){
			sqlType = "INT";
		}else if (type == Boolean){
			sqlType = "Boolean"
		};

		sql += '{0} {1}, '.format(field, sqlType);
	};
	sql = sql.substring(0, sql.length - 2);
	sql += ");";
	return sql;
};

exports.run = function(){
	var list = [];
	schemas.forEach(function(item){
		list.push(getSql(item.tableInfo.tableName, item.tableInfo.schema));
		//return true;
	});
	return list.join("");
};