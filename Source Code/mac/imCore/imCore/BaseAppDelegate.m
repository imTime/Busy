//
//  AppDelegate.m
//  imBoxV3
//
//  Created by conis on 11-10-28.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#import "BaseAppDelegate.h"

@implementation BaseAppDelegate

@synthesize window = _window;


#pragma -
#pragma Mark 重载方法

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  //创建Data文件夹
  NSString *dataPath = [CoreGeneral getDocumentDirectory: @"data/"];
  if([CoreGeneral sharedManager].isDebug){
    NSLog(@"警告：当前处于Debug模式！！！");
    NSLog(@"当前数据目录： %@", dataPath);
  }
  [CoreGeneral directoryExists: dataPath];
  return YES;
}

- (void)applicationDidBecomeActive:(UIApplication *)application
{
  //运行计数器
  AppInfo *appInfo = [AppInfo sharedManager];
  if([appInfo needCountRun]){
    appInfo.lastRun = [NSDate date];
    appInfo.runCount ++;
    appInfo.currentVersionRunCount ++;
    [appInfo save];
  }
}
@end
