//
//  WebAppView.h
//  imBoxV3
//
//  Created by conis on 11-10-28.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#import "BaseView.h"
#import "RegexKitLite.h"
#import "UISplash.h"
/*
@protocol WebAppViewDelegate <NSObject>
//当页面加载完成
-(void) onWebViewLoaded;
@end
*/

@interface UIBrowser: BaseView<UIWebViewDelegate, UIScrollViewDelegate>{
  UIWebView *myWebView;
  NSString *homePage;
  NSString *initParameters;
  UISplash *viewSplash;
}

@property(nonatomic, assign) NSString *homePage;
@property(nonatomic, assign) NSString *initParameters;

-(void) loadHomePage;
-(NSString *) callWebView: (NSString*) javascript;
-(BOOL) doAction: (int)method guid:(NSString*) guid;
-(NSString *)getParams:(NSString *)guid;
-(void) callWebView: (NSString * ) guid data: (NSString *) data;
-(NSString *) getParam:(NSString *)guid;
-(void) cacnelSelection;
//当页面加载完成
-(void) onWebViewLoaded;
-(void) loadSplash;
@end

