//
//  AppDelegate.m
//  imBoxV3
//
//  Created by conis on 11-10-28.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#import "AppDelegate.h"
#import <math.h>

@interface AppDelegate(Private)

@end

@implementation AppDelegate

#pragma -
#pragma Mark 重载方法

- (void)dealloc
{
  [super dealloc];
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [super application: application didFinishLaunchingWithOptions: launchOptions];
  [Common sharedManager];     //初始化Common
  
  //初始化数据库
  InitDatabase *initDB = [[InitDatabase alloc] init];
  [initDB createTable];
  [initDB release];
  
  //处理解缓存
  [NSURLCache setSharedURLCache: [LocalCache sharedManager]];
  
  //创建window
  self.window = [[[UIWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]] autorelease];
  
  self.window.backgroundColor = [UIColor whiteColor];
  RootController *root = [[RootController alloc] initWithNibName:nil bundle:nil];
  self.window.rootViewController = root;
  [CoreGeneral sharedManager].rootViewController = root;
  [root release];
  [self.window makeKeyAndVisible];
  
  //[[Common sharedManager] showGuide];
  return YES;
}
@end
