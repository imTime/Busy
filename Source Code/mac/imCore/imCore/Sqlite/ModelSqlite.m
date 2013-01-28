//
//  ModelSqlite.m
//  imCore
//
//  Created by conis on 11-12-4.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//
#import "ModelSqlite.h"
#import "../CoreGeneral.h"

@interface ModelSqlite(Private)

@end

@implementation ModelSqlite
@synthesize tableName, fields;

//是否为数据库中的空值
+(BOOL) isDBNull:(id)value
{
  return value == [NSNull null];
}

//转换为字符
+(NSString *) getString:(id)value
{
  return [self isDBNull: value] ? @"" : value;
}

#pragma -
#pragma mark 私有方法
//计算分页信息
-(void) evalPagination:(Pagination *)pagination query: (NSString *) sql parameters:(NSArray *)params
{
  pagination->recordCount = [self count:sql parameters:params];
  pagination->pageCount =  ceil(pagination->recordCount / pagination->pageSize);
  if(pagination->pageIndex > pagination->pageCount) pagination->pageIndex = pagination->pageCount;
  //获取startIndex和endIndex
  pagination->startIndex = pagination->pageIndex <= 1 ? 0 : pagination->pageIndex * pagination->pageSize - pagination->pageSize;
  pagination->endIndex = pagination->pageSize;
}

//将数据库中的值转换为日期
+(NSDate*) valueToDate:(id)value
{
  if([self isDBNull: value]) return nil;
  return [NSDate dateWithTimeIntervalSince1970: [value doubleValue]];
}

//将数据库的值用默认格式转换为日期
+(NSString *) valueToDateString: (id) value
{
  NSDate *date = [self valueToDate: value];
  if(date == nil) return nil;
  return [ConvertHelper dateToString: date];
}

#pragma -
#pragma mark 公用方法
-(FMDatabase *) getDatabase
{
  return [SqliteInterface sharedSqliteInterface].dbo;
}

//count结果
-(NSInteger)count:(NSString *)sql parameters:(NSArray *)params
{
  return [[self getScalar:sql parameters:params] intValue];
}

//根据条件计算当前表
-(NSInteger) countWithCondition:(NSString *)condition parameters:(NSArray *)params
{
  NSString *sql = [NSString stringWithFormat: @"SELECT COUNT(*) FROM %@ WHERE 1 = 1", self.tableName];
  if(condition != nil){
    sql = [sql stringByAppendingString: condition];
  };
  return  [self count: sql parameters:params];
}

//执行更新数据，返回结果
-(BOOL) executeUpdate:(NSString *)sql parameters:(NSArray *)params
{
  FMDatabase *dbo = [self getDatabase];
  [dbo open];
  BOOL result = [dbo executeUpdate:sql withArgumentsInArray:params];
  [dbo close];
  return result;
}

//搜索所有数据，可以排序
-(NSArray *)getAll:(Pagination *)pagination order:(NSString *)sort
{
  return [self get:pagination condition:nil parameters:nil order:sort];
}

//获取所有数据
-(NSArray *) getAll:(NSString *)order
{
  Pagination pag;
  pag.pageSize = INT32_MAX;
  pag.pageIndex = 1;
  
  return [self getAll: &pag order: order];
}

//根据Sql搜索，并回调
-(NSArray *)get:(NSString *)sql parameters:(NSArray *)params{
  sql = [sql stringByReplacingOccurrencesOfString: @"~" withString: @"%%"];
  NSMutableArray *result = [[NSMutableArray alloc] init];
  FMDatabase *dbo = [self getDatabase];
  //dbo.traceExecution = YES;
  [dbo open];
  //NSLog(sql);
  //搜索数据
  FMResultSet *rs = [dbo executeQuery:sql withArgumentsInArray:params];
  while ([rs next]) {
    [result addObject: [rs resultDict]];
  };
  [rs close];
  [dbo close];
  
  NSArray *arr = [NSArray arrayWithArray: result];
  [result release];
  return arr;
}

/*
 这里的condition要包括table在内的条件
 例如一个sql语句为：select id, name from table where a = 1 and b = 2 order by id desc
 fields为：id, name
 subSql为：from table where a = 1 and b = 2
 order为：order by id desc
 原因：有些sql语句比较复杂，可以涉及到多个表，或者字段中涉及到子sql语句
*/
-(NSArray *) get:(Pagination *)pagination fields:(NSString *)aFields subSql:(NSString *)sub parameters:(NSArray *)params order:(NSString *)sort
{
  //计算总记录数，以及分页的数据
  NSString *sql = [@"SELECT COUNT(*) " stringByAppendingString: sub];
  [self evalPagination: pagination query:sql parameters:params];
  
  //查询
  sql = [NSString stringWithFormat: @"SELECT %@ %@", aFields, sub];
  if(sort != nil){
    sql = [sql stringByAppendingString: sort];
  };
  
  sql = [sql stringByAppendingFormat:@" LIMIT %.f,%.f", pagination->startIndex, pagination->endIndex];
  if([CoreGeneral sharedManager].isDebug){
    NSLog(sql);
  }
  return [self get:sql parameters:params];
}

//搜索，可以带查询条件以及排序，查询条件以必需以and开始，如：and field = value
-(NSArray *)get:(Pagination *)pagination condition:(NSString *)cond parameters:(NSArray *)params order:(NSString *)sort
{
  return  [self get:pagination fields:self.fields condition:cond parameters:params order:sort];
}

//搜索，可以带查询条件以及排序，查询条件以必需以and开始，如：and field = value
-(NSArray *)get:(Pagination *)pagination fields: (NSString *) aFields condition:(NSString *)cond parameters:(NSArray *)params order:(NSString *)order
{
  if(cond == nil) cond = @"";
  cond = [NSString stringWithFormat: @" FROM %@ WHERE 1 = 1 %@", self.tableName, cond];
  
  if(order != nil){
    order = [@" ORDER BY " stringByAppendingString: order];
  };
  
  return [self get:pagination fields:aFields subSql:cond parameters:params order:order];
}

//插入数据，并返回最后插入的ID
-(NSInteger) insert:(NSString *)sql parameters:(NSArray *)params
{
  NSInteger lastId = -1;
  FMDatabase *dbo = [self getDatabase];
  [dbo open];
  if([dbo executeUpdate:sql withArgumentsInArray:params]){
    lastId = [dbo lastInsertRowId];
  }
  [dbo close];
  return lastId;
}

//根据主键删除
-(BOOL) deleteWithPrimary:(NSInteger)primaryId
{
  NSString *condition = [NSString stringWithFormat: @" AND id = %d", primaryId];
  return [self deleteWithCondition:condition parameters:nil];
}

//获取一条记录
-(BOOL) getOne:(NSString *)condition parameters:(NSArray *)params order:(NSString *)sort
{
  NSString *sql = [NSString stringWithFormat: @"SELECT %@ FROM %@ WHERE 1 = 1", self.fields, self.tableName];;
  if(condition != nil) sql = [sql stringByAppendingString: condition];
  if(sort != nil) sql = [sql stringByAppendingFormat:@" ORDER BY %@", sort];
  sql = [sql stringByAppendingString: @" LIMIT 1"];
  
  FMDatabase *dbo = [self getDatabase];
  [dbo open];
  FMResultSet *rs = [dbo executeQuery:sql withArgumentsInArray:params];
  BOOL result = [self getOne: rs];
  [rs close];
  [dbo close];
  return result;
}

//根据主键，获取一条记录
-(BOOL)getWithPrimaryId:(NSInteger) primaryId{
  NSString *cond = [NSString stringWithFormat: @" AND id = %d", primaryId];
  return [self getOne:cond parameters:nil order:nil];
}

//根据主键查询，返回一个字典数据
-(NSDictionary *) getDirectionary: (NSInteger) primaryId
{
  NSDictionary *result = nil;
  NSString *sql = [NSString stringWithFormat: @"SELECT %@ FROM %@ WHERE id = %d", self.fields,  self.tableName, primaryId];
  FMDatabase *dbo = [self getDatabase];
  [dbo open];
  FMResultSet *rs = [dbo executeQuery:sql withArgumentsInArray:nil];
  while ([rs next]) {
    result = rs.resultDict;
    break;
  };
  [rs close];
  [dbo close];
  return result;
}

//获取第一行第一列的数据
-(id) getScalar:(NSString *)sql parameters:(NSArray *)params
{
  id result = nil;
  FMDatabase *dbo = [self getDatabase];
  [dbo open];
  FMResultSet *rs = [dbo executeQuery:sql withArgumentsInArray:params];
  while ([rs next]) {
    result = [rs objectForColumnIndex:0];
    break;
  }
  [rs close];
  [dbo close];
  return result;
}

//根据条件删除某个表的数据
-(BOOL) deleteWithCondition:(NSString *)condition parameters:(NSArray *)params
{
  NSString *sql = [NSString stringWithFormat: @"DELETE FROM %@ WHERE 1 = 1", self.tableName];
  if(condition != nil) sql = [sql stringByAppendingString: condition];
  return [self executeUpdate:sql parameters:params];
}
@end
