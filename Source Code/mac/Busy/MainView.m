//
//  MainView.m
//  Busy
//
//  Created by Conis on 10/29/12.
//
//

#import "MainView.h"

@interface MainView(Private)
-(void) query: (NSString *) guid;
-(void) executeSql: (NSString *) guid;
@end

@implementation MainView

-(BOOL) doAction:(int)method guid:(NSString *)guid{
  BOOL result = [super doAction:method guid:guid];
  if(result) return result;
  switch (method) {
    case 31:    //执行sql
      [self query:guid];
      break;
    case 30:
      [self executeSql: guid];
  };
  
  //执行editor的action
  return result;
}

/*
 * 搜索
 */
-(void) query:(NSString *)guid
{
  NSString *sql = [self getParams:guid];
  NSArray *result = [DataBaseAccess query: sql];
  NSDictionary *res = @{
    @"data": result
  };
  NSString *data = [CoreGeneral JSONStringWithObject: res];
  
  if([CoreGeneral sharedManager].isDebug){
      NSLog(@"Sql语句：%@", sql);
  };
  
  [self callWebView: guid data: data];
}

//执行某条Sql语句
-(void) executeSql: (NSString *) guid
{
  NSString *data = @"{}";
  NSString *sql = [self getParams:guid];
  NSRange range = [sql rangeOfString:@"INSERT INTO" options: NSCaseInsensitiveSearch];
  //仅执行Sql
  if(range.location == NSNotFound){
    [DataBaseAccess executeSql:sql];
  }else{
    NSInteger insertId = [DataBaseAccess insert:sql];
    NSDictionary *dict = @{
      @"insertId": [NSNumber numberWithInt: insertId]
    };
    data = [CoreGeneral JSONStringWithObject: dict];
  };
  
  [self callWebView: guid data: data];
}

@end
