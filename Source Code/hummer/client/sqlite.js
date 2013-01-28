/**
 * Created with JetBrains WebStorm.
 * User: conis
 * Date: 8/5/12
 * Time: 3:08 下午
 * To change this template use File | Settings | File Templates.
 */
/*
 * sqlite操作数据库
 * 表schema格式的要求
 var schema = {
 	fields: {
 	},name: "member"
 }
*/

//****************Sqlite************************
(function(){
	/*
	var getSql = function(schema){
		var sql = 'CREATE TABLE {0}(_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ';
		sql += 'syncId TEXT, remove Boolean, ';			//向远程同步的ID和标识移除字段
		sql = sql.format(schema.name);
		for(var field in schema.fields){
			var s = schema.fields[field];
			var type = s.type;
			var sqlType = "TEXT";
			if(type == Number){
				sqlType = "REAL";
			}else if (type == Boolean){
				sqlType = "Boolean"
			};

			sql += '{0} {1}, '.format(field, sqlType);
		};
		sql = sql.substring(0, sql.length - 2);
		sql += ");";
		//console.log(sql);
		return sql;
	};
	*/

	im.sqlite = {
		db: null,
		schemas: [],
		/*
		 * 初始化数据库
		 */
		init: function(option, callback) {
			var ops = {
				maxSize: 5,
				dbName: "main", 					//表的名称，必需有
				createTable: []						//创建表结构{tableName: "", sql: ""}...
			};

			$.extend(ops, option);
			ops.maxSize = 1024 * 1024 * ops.maxSize; // 以M为单位
			try{
				if (!window.openDatabase) {
					callback(null, false);
				} else {
					var version = '1.0';
					this.db = openDatabase(ops.dbName, version, ops.dbName, ops.maxSize);
					this.initDatabase(ops.createTable, function(newDatabase){
						callback(null, true, newDatabase);
					});
				};
			} catch (e) {
				callback(e, false);
			};
		},
		/*
		 * 初始化数据库，如果数据库不存在，则创建
		 */
		initDatabase: function(schemas, callback){
			var s = this, index = 0, newDatabase = false;
			var tables = [];
			for(var key in schemas){
				tables.push(schemas[key]);
			};

			var $create = function(){
				if(index >= tables.length){
					return callback(newDatabase);
				};

				//检查表是否存在
				var table = tables[index];
				s.tableExists(table.tableName, function(exists){
					newDatabase = exists;
					if(!exists){
						//不存在，创建
						s.executeSql(table.sql, function(){
							index ++;
							$create();
						});		//end executeSql
					}else{
						index ++;
						$create();
					}		//end if
				});		//end tableExists
			};

			$create();
		},
		//计算分页
		pagination: function(pag){
			pag.pageSize = pag.pageSize || 10;
			pag.pageIndex = pag.pageIndex  || 1;
			pag.pageCount = pag.recordCount / pag.pageSize;
			pag.pageCount = Math.ceil(pag.pageCount);

			//PageIndex不能小于等于0
			if (pag.pageIndex <= 0) pag.pageIndex = 1;

			//PageIndex不能大于PageICount
			if (pag.pageIndex > pag.pageCount) pag.pageIndex = pag.pageCount;

			//获取startIndex和endIndex
			pag.startIndex = pag.pageIndex <= 1 ? 0 : pag.pageIndex * pag.pageSize - pag.pageSize;
			pag.endIndex = pag.pageSize;
			return pag;
		},
		//这里的sql应该从字段后面开始，如select * from table，到这里的sql应该是" from table"，提取*作为field
		querySegment: function(fields, subSql, order, pag, callback){
			var sql, getLimit = false;
			var pagIsObj = typeof(pag) == "object";
			getLimit = !pag || !pagIsObj;

			//pag是数字，非分页，直接获取数量
			if(getLimit){
				sql = "SELECT {0} {1}".format(fields, subSql);
				if(order) sql += order;
				if(pag) sql += " LIMIT " + pag;
				//console.log(sql);
				return this.query(this.db, sql, callback);
			};

			//读取分页的数据
			sql = "SELECT COUNT(*) stats {0}".format(subSql);
			var s = this;
			//取总
			s.query(sql, function(data) {
				pag.recordCount = data.length > 0 ? data[0].stats : 0;
				pag = s.pagination(pag);
				sql = "SELECT {0} {1}".format(fields, subSql);
				if(order) sql += order;
				sql = "{0} LIMIT {1},{2}".format(sql, pag.startIndex, pag.endIndex);

				//console.log(sql);
				s.query(sql,
					function(err, data) {
						callback(err, data, pag);
					}, formatItem);
			});		//end query
		},
		/*
		 查询数据，并返回数据列表
		 formatItem：对循环每条的数据进行格式化处理（如果需要的话）
		 */
		query: function(sql, callback) {
			var data = [], row, that = this;
			this.executeSql(sql, function(err, result) {
				//console.log(err, results, results.rows.length);
				var rows = result.rows || result.data;			//air是用result.data
				if (!err && rows && rows.length > 0) {
					for (var i = 0; i < rows.length; i++) {
						//air和一般的sqlite取数据的方式不一样
						row = rows.item ? rows.item(i) : rows[i];
						data.push(row);
					}
				}
				callback(err, data);
			});
		},
		//根据条件对某个表进行统计，并返回统计结果
		count: function(tableName, condition, callback) {
			var sql = "SELECT COUNT(*) stats FROM {0} WHERE 1 = 1 {1}"
				.format(tableName, condition || "");
			this.query(sql, function(err, data) {
				var stats = 0;
				if(!err && data) stats = data[0].stats;
				callback(err, stats);
			});
		},
		//清除一个表
		clearTable: function(tableName, condition, callback) {
			var sql = "DELETE FROM {0} {1}".format(tableName, condition);
			this.executeSql(db, sql, function(err) {
				callback(err);
			});
		},
		//执行完Sql才回调
		executeSqlOnce: function(sqlList, callback){
			if(typeof(sqlList) == "string"){
				sqlList = [sqlList];
			}
			var index = 1, count = sqlList.length;
			this.executeSql(this.db, sqlList, function(){
				if(index == count){
					$.callEvent(callback);
				}else{
					index ++;
				}
			});
		},
		//执行一条或者一批Sql语句
		executeSql: function(sqlList, callback) {
			var index = 0, count, sql;
			if(typeof sqlList == "string") sqlList = [sqlList];

			var tmpExec = function(trans){
				sql = sqlList[index];
				trans.executeSql(sql, [], function(trans1, result){
					//返回结果
					callback(null, result);
					if(index < count - 1){
						index ++;
						tmpExec(trans);
					};
				}, function(trans, err){
					callback(err);			//出错
				});			//end executeSql
			};

			im.sqlite.db.transaction(function(trans) {
				tmpExec(trans);
			}); 		//end transaction
		},
		//检查表是否存在
		tableExists: function(tableName, callback){
			var cond = " AND type = 'table' AND tbl_name = '{0}'".format(tableName);
			this.count("sqlite_master", cond, function(err, count){
				callback(count > 0);
			});
		},
		/*
		 * 保存单表数据
		 */
		save: function(schema, callback){
			var isUpdate = (schema._id !== undefined);
			var sql = this.createSql(schema, isUpdate);
			if(isUpdate){
				sql += " WHERE _id = ";
				sql += schema._id;
			};
			//INSERT INTO activity(memberId,syncId,version,priority,location,color,calendarId,lastUpdate,finishedDate,finishedRate,summary,repeatStop,repeat,allDay,local,begin,end,title,type,__v,tags,statusId) VALUES ('1','5087567a6667bb0000000001','1','0',NULL,NULL,'1','1351046778935',NULL,'0',NULL,NULL,'99','1','2','1351008000000','1351008000000','测试','4','0',NULL,NULL)
			//__v

			/*
			if(!isUpdate){
				alert(sql);
				alert(schema.__v);
			}
			*/

			//return;
			//执行Sql
			this.executeSql(sql, function(err, result){
				var _id = undefined;
				if(!isUpdate && result){
					//Air的Sqlite采用lastInsertRowID
					_id = result.insertId || result.lastInsertRowID;
				};
				if(callback) callback(err, _id);
			});
		},
		//通过条件修改某个表的数据
		update: function(schema, cond, callback){
			var sql = this.createSql(schema);
			sql += " WHERE 1 = 1";
			sql += cond || "";
			this.executeSql(sql, callback);
		},
		//删除，如果cond为数字，则直接根据id删除
		remove: function(schema, cond, callback){
			var sql = "DELETE FROM {0} WHERE 1 = 1".format(schema.tableName);
			sql += cond || "";
			this.executeSql(sql, callback);
		},
		//获取数据，如果cond为空，则获取所有数据
		get: function(schema, cond, order, limit, callback, formatItem){
			var sql = 'SELECT * FROM {0} WHERE 1 = 1 {1} {2}';
			sql = sql.format(schema.tableName, cond || "", order || "");
			if(limit && limit > 0){
				sql += " LIMIT " + limit;
			};

			this.query(sql, callback, formatItem);
		},
		/*
		 * 根据数据生成插入或者更新的Sql语句，如果id为空，则生成插入的Sql，反之更新
		 */
		createSql: function(schema, isUpdate){
			var that = this;
			var leftSql = "", sql = "", rightSql = "";
			var value, field;
			//生成左边和右边的Sql
			for(var key in schema){
				if(key == "tableName" || key == "_id" || key == "__v") continue;
				value = that.sqlSegment(schema[key], isUpdate ? key : null);
				//没有定义值，sqlSegment返回false，跳过
				if(value === false) continue;
				//更新只是field = 'value'
				if(isUpdate){
					leftSql += value;
				}else{
					leftSql += key + ",";
					rightSql += value;
				};		//end if

				/*
				if(key == "reminder" && !isUpdate){
					alert(leftSql);
					alert(schema[key]);
					alert(rightSql);
				}
				*/

			};


			//去掉最后一个分号
			if(leftSql){
				leftSql = leftSql.substr(0, leftSql.length - 1);
			};

			if(rightSql){
				rightSql = rightSql.substr(0, rightSql.length - 1);
			};

			//重组sql
			if(isUpdate){
				sql = "UPDATE {0} SET {1}";
			}else{
				sql = "INSERT INTO {0}({1}) VALUES ({2})";
			};
			return sql.format(schema.tableName, leftSql, rightSql);
		},
		/*
		 * 格式化Sql的值,只接受datetime/boolean/number/string/json类型的数据
		 */
		formatValue: function(value){
			var result = "";
			switch(typeof(value)){
				case "string": return value.toSqlValue();
				case "boolean": return Number(value);
				case "number": return String(value);
				default:
					//日期类型的数据，转换为Number
					if(value instanceof Date){
						return value.getTime();
					}else{
						//转换为JSON数据，并替换掉单引号
						return JSON.stringify(value).toSqlValue();
					};
					break;
			}
			return value;
		},
		/*
		 * 获取sql语句的片断
		 */
		sqlSegment: function(value, field){
			var val = "";
			//没有这项数据
			if(value === undefined){
				return false;
			}else if(value === null){
				val = "NULL";
			}else{
				val = "'{0}'".format(this.formatValue(value));
			};

			return ((field) ? '{0}={1},' : '{1},').format(field, val);
		}
	};
})();
