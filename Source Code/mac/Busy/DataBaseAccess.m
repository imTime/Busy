//
//  DataBaseAccess.m
//  ColorDocument
//
//  Created by conis on 11-12-16.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#import "DataBaseAccess.h"

@interface DataBaseAccess(Private)

@end


@implementation DataBaseAccess

/*
 获取结果
*/
+(NSArray *) query:(NSString *)sql
{
  ModelSqlite *model = [[ModelSqlite alloc] init];
  NSArray *result = [model get:sql parameters:nil];
  [model release];
  return result;
}

//执行一条Sql语句
+(void) executeSql:(NSString *)sql
{
  ModelSqlite *model = [[ModelSqlite alloc] init];
  [model executeUpdate:sql parameters:nil];
  [model release];
}

//插入一条数据
+(NSInteger) insert:(NSString *)sql
{
  ModelSqlite *model = [[ModelSqlite alloc] init];
  NSInteger insertId = [model insert: sql parameters:nil];
  [model release];
  return insertId;
}
@end

