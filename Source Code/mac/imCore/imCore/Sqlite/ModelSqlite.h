//
//  ModelSqlite.h
//  imCore
//
//  Created by conis on 11-12-4.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "SqliteInterface.h"
#import <math.h>
typedef struct
{
  CGFloat pageSize;
  CGFloat pageIndex;
  CGFloat pageCount;
  CGFloat recordCount;
  CGFloat startIndex;
  CGFloat endIndex;
} Pagination;

typedef void (^FetchedRowsHandler)(FMResultSet *rs);

@interface ModelSqlite : NSObject{
  NSString *tableName;
  NSString *fields;
}

@property(nonatomic, retain) NSString *tableName;
@property(nonatomic, retain) NSString *fields;

//根据主键删除数据
-(BOOL) deleteWithPrimary: (NSInteger) primaryId;
//保存当前实列的数据
-(int) insert;
//更新当前实例的数据
-(BOOL) update;
-(id) getScalar: (NSString *) sql parameters: (NSArray *) params;
//根据主键获取当前的实例
-(BOOL) getWithPrimaryId: (NSInteger) primaryId;
//根据条件和排序，获取一条记录
-(BOOL) getOne: (NSString *) condition parameters: (NSArray *) params order:(NSString *) sort;
-(BOOL) getOne: (FMResultSet *) rs;
//检索数据库
-(NSArray *) get: (Pagination *) pagination fields: (NSString *) aFields subSql: (NSString *) sub parameters: (NSArray *) params order: (NSString *) sort; 
-(NSArray *) get: (Pagination *) pagination condition: (NSString *) cond parameters: (NSArray *) params order: (NSString *) sort;
-(NSArray *)get:(Pagination *)pagination fields: (NSString *) aFields condition:(NSString *)cond parameters:(NSArray *)params order:(NSString *)order;
-(NSArray *) get: (NSString *) sql parameters: (NSArray *) params;
//获取所有数据，可以分页
-(NSArray *) getAll: (Pagination *) pagination order: (NSString *) sort;
//获取所有数据
-(NSArray *) getAll: (NSString *)order;
//获取数据库的实例
-(FMDatabase *) getDatabase;
//计算总数
-(NSInteger)count: (NSString *) condition parameters: (NSArray*) params;
//根据条件计算当前表
-(NSInteger) countWithCondition:(NSString *)sql parameters:(NSArray *)params;
-(NSInteger) insert: (NSString *) sql parameters: (NSArray *) params;
-(BOOL) deleteWithCondition: (NSString *) condition parameters: (NSArray *) params;
-(NSArray *)getParameters;
-(BOOL) executeUpdate: (NSString *) sql parameters: (NSArray *) params;
-(NSDictionary *) getDirectionary: (NSInteger) primaryId;
+(NSString *) getString: (id) value;
+(BOOL) isDBNull: (id) value;
+(NSString *) getTableName;
+(NSString *) getFields;
-(void) evalPagination: (Pagination *) pagination query: (NSString *) sql parameters:(NSArray *)params;
+(NSDate *) valueToDate: (id) value;
+(NSString *) valueToDateString: (id) value;
@end
