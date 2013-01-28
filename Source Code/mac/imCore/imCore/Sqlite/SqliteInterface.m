//
//  SqliteInterface.m
//  ColorDocument
//
//  Created by conis on 11-12-3.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#import "SqliteInterface.h"

@implementation SqliteInterface
@synthesize dbRealPath, dbo;

static SqliteInterface *sharedSqliteInterface;

+ (SqliteInterface *)sharedSqliteInterface
{
  if (!sharedSqliteInterface) {
    sharedSqliteInterface = [[SqliteInterface alloc] init];
  }
  return sharedSqliteInterface;
}

- (void) connectDB
{
  if (dbo == nil) {
    dbo = [[FMDatabase alloc] initWithPath:dbRealPath];
    dbo.logsErrors = [CoreGeneral sharedManager].isDebug;   //debug情况下，输出错误
    if (! [dbo open]) {
      NSLog(@"Could not open database.");
    }
  }else {
    NSLog(@"Database has already opened.");
  }
}

- (void) closeDB
{
  [dbo close];
  //BR_RELEASE(dbo);
}

- (void) setupDB:(NSString *)dbFileName
{
  if (dbFileName == nil) {
    return;
  }

  dbRealPath = dbFileName;
   
}
@end
