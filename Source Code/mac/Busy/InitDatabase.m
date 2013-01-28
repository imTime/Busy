//
//  InitDatabase.m
//  ColorDocument
//
//  Created by conis on 11-12-2.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#import "InitDatabase.h"
#import "imCore/Sqlite/SqliteInterface.h"

@interface InitDatabase(Private)
-(SqliteInterface *) sqlite;
-(void) insertSampleData;
-(void) updateDatabase;
@end

@implementation InitDatabase

//获取Sqlite对象
-(SqliteInterface *) sqlite
{
  return [SqliteInterface sharedSqliteInterface];
}

//初始化表
-(void) createTable
{
  //只需要设置好数据库就可以了，其实交给javascript处理
  [[self sqlite] setupDB: [CoreGeneral getDocumentDirectory: @"data/main.sqlite"]];
  [[self sqlite] connectDB];
}

@end
