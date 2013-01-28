//
//  WebAppView.m
//  imBoxV3
//
//  Created by conis on 11-10-28.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#import "UIBrowser.h"

//私有方法
@interface UIBrowser(Private)
-(void) showTextView:(NSString *) params;
-(void) ready:(NSString *) guid;
-(void) playMovie: (NSString*) params;
-(void) sendMail:(NSString *) params;
-(void) cancelNotification: (NSString *) params;
-(void) cancelAllNotification: (NSString *) params;
-(void) addNotification: (NSString *) params;
-(void) restart:(NSString *) params;
-(void) setBadge:(NSString *)guid;
-(void) setNetwork:(NSString *)params;
-(void) getEnvironment:(NSString *) params;
-(void) msgbox:(NSString *) guid;
-(void) copyToClipboard:(NSString *) guid;
-(void) initView;
-(void) twitter: (NSString *) guid;
-(void) log: (NSString *) guid;
-(void) setKeyboard;
-(void) changeKeyboard:(BOOL)isHide notification:(NSNotification *)aNotification;
- (void)keyboardWillHide:(NSNotification *)aNotification;
- (void)keyboardWillShow:(NSNotification *)aNotification;
- (void)hideNavButton;
@end

@implementation UIBrowser
@synthesize homePage, initParameters;

//加载首页
- (void) loadHomePage
{
  //NSLog(self.homePage);
  NSString *url = [NSString stringWithFormat:@"%@?timestamp=%f", self.homePage,[[NSDate date] timeIntervalSince1970]];
  if([CoreGeneral sharedManager].isDebug){
    NSLog(@"当前加载的URL：%@", url);
  };
  
  NSURLRequest *requestObj = [NSURLRequest requestWithURL:[NSURL URLWithString:url]];
  [myWebView loadRequest:requestObj];
}

//==================对javascript的处动作理==============
-(BOOL) doAction:(int) method guid:(NSString *)guid
{
  BOOL result = YES;
  switch (method) {
    case 1001:
      //[self goNewVersion: params];
    case 1000:
      //[self updateFromLocal: params];
      break;
    case 999:
      [self ready:guid];
      break;
    case 998:
      //webView全部加载完成，要执行的动作
      [self onWebViewLoaded];
      break;
    case 1:
      [self setBadge: guid];
      break;
    case 2:
      [self setNetwork:guid];
      break;
    case 4:
      [self twitter: guid];
      break;
    case 5:
      [self log:guid];
      //NSLog([NSString stringWithFormat:@"JsLog:%@",guid], nil);
      break;
    case 6:
      [self sendMail:guid];
      break;
    case 8:
      [self getEnvironment: guid];
      break;
    case 10:
      [self msgbox: guid];
      break;
    case 11:
      [self restart: guid];
      break;
    case 12:
      //AudioServicesPlaySystemSound(kSystemSoundID_Vibrate); 
      break;
    case 13:
      [self addNotification: guid];
      break;
    case 14:
      [self cancelNotification:guid];
      break;
    case 15:
      [self cancelAllNotification:guid];
      break;
      //播放Guide
    case 16:
      [self playMovie: guid];
      break;
    case 20:
      [self cacnelSelection];
      break;
    case 22:
      [self copyToClipboard: guid];
      break;
    default:
      result = NO;
      break;
  };
  
  return result;
}

//==========================重载======================

-(void)dealloc
{
  myWebView.delegate = nil;
  [super dealloc];
}

//创建元素
-(void) createComponent
{
  CGRect rect = self.frame;
  rect.origin.x = 0;
  rect.origin.y = 0;
  myWebView = [[UIWebView alloc] init];
  [myWebView setFrame: rect];
  myWebView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  myWebView.delegate = self;
  //设置webview
  /*
  [myWebView setScalesPageToFit:TRUE];
  myWebView.backgroundColor = [UIColor whiteColor];
  myWebView.opaque = NO;
  myWebView.dataDetectorTypes = UIDataDetectorTypeNone;
  
  //禁止键盘弹出的时候会向上收缩
  UIScrollView* v = (UIScrollView *)[[myWebView subviews] objectAtIndex:0];
  [v setBounces:NO];
  v.delegate = self;
  */
  
  [self addSubview:myWebView];
  self.backgroundColor = [UIColor redColor];
  [myWebView release];
  
  [self setKeyboard];
}

//将要进行横屏切换
-(void)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
  if(viewSplash != nil){
    [viewSplash render];
  };
  
  [super shouldAutorotateToInterfaceOrientation:interfaceOrientation];
  //给所有活动的view发送屏幕切换消息
  NSString* js = [NSString stringWithFormat:@"window.orientation = %d; window.onOrientationChange(%d);", interfaceOrientation, interfaceOrientation];
  [self callWebView:js];
}


//模屏切换完成
-(void) didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation
{
  [super didRotateFromInterfaceOrientation:fromInterfaceOrientation];
  UIDeviceOrientation orientation = [[UIDevice currentDevice]orientation];
  NSString* js = [NSString stringWithFormat:@"window.onOrientationDidChange(%d, %d);", fromInterfaceOrientation, orientation];
  [self callWebView:js];
}

- (void)webView:(UIWebView *)webView didFailLoadWithError:(NSError *)error{
  if([CoreGeneral sharedManager].isDebug){
    NSLog(@"！！！严重错误警告：%@", error);
  };
}

//截取uiWebView的链接，可以对链接进行处理
- (BOOL)webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)
request navigationType:(UIWebViewNavigationType)navigationType {
  //BOOL imbox = [[[request URL] scheme] lowercaseString];
  NSString *target = [[request URL] absoluteString];
  //打开外部链接
  if (navigationType == UIWebViewNavigationTypeLinkClicked ||
      [target rangeOfString:@"itms-apps"].location != NSNotFound
      ) {
    [[UIApplication sharedApplication] openURL:[request URL]];
    return NO;
  }
  
  NSRange range = NSMakeRange(0, [target length]);
  //用正则截取方法和参数
  NSString *pattern = @"^imbox:(\\d+)\\?guid=(.+)$";
  //无匹配的方法
  if(![target isMatchedByRegex:pattern options:RKLCaseless inRange:range error:NULL]){
    if([CoreGeneral sharedManager].isDebug){
      NSLog(@"加载常规URL：%@", target);
    }
    return YES;
  };
  
  //提取方法
  NSString *method = [target stringByMatching:pattern options:RKLCaseless inRange:range capture:1L error: NULL];
  //提取guid
  NSString *guid = [target stringByMatching:pattern options:RKLCaseless inRange:range capture:2L error: NULL];
  
  //通知已经收到指令
  [self callWebView: @"window.onReplyInstruct();"];
  
  [self doAction: [method intValue] guid: guid];
  
  if([CoreGeneral sharedManager].isDebug){
    NSLog(@"方法：%@；GUID：%@", method, guid);
  }
  return NO;
}

//==================接受浏览器传过来的方法==============

//调用用户的帐号发送Twitter信息
-(void) twitter:(NSString *) guid
{
  //确定是否支持twitter
  Class twClass = (NSClassFromString(@"TWTweetComposeViewController"));
  if (twClass == nil) return;

  //获取要发送的Twitter
  NSString *text = [self getParams: guid];
  
  [CoreGeneral twitter:text];
}

//取消选择
-(void)cacnelSelection
{
  myWebView.userInteractionEnabled = NO;
  myWebView.userInteractionEnabled = YES;
}

//复制文本
-(void)copyToClipboard: (NSString *) guid
{
  NSString *text = [self getParams: guid];
  UIPasteboard *paste = [UIPasteboard generalPasteboard];
  [paste setString:text];
}

//html页面已经准备好了
-(void)ready:(NSString *) guid{
  UIDevice *device = [UIDevice currentDevice];
  CoreGeneral *core = [CoreGeneral sharedManager];
  CGSize size = [CoreGeneral deviceBounds].size;
  //硬件信息
  NSDictionary *dictDevice = @{
  @"deviceId": core.uniqueIdentifier,
  @"orientation": [NSNumber numberWithInt: [device orientation]],
  @"systemVersion": [device systemVersion],
  @"systemName": [device systemName],
  @"isPad": [NSNumber numberWithBool: core.isPad],
  @"deviceModel": [NSNumber numberWithInt:[CoreGeneral detectDevice]],
  @"width": [NSNumber numberWithFloat: size.width],
  @"height": [NSNumber numberWithFloat: size.height]
  };
  
  //产品信息
  NSDictionary *dictProduct = @{
  @"productName": core.productName,
  @"version": [NSNumber numberWithFloat: core.productVersion],
  @"bundleId": core.bundleId,
  @"appleId": [NSNumber numberWithInt: core.appleId]
  };
  
  NSLocale * locale = [NSLocale currentLocale];
  NSDictionary *dictLocale = @{
  @"currency": [locale objectForKey: NSLocaleCurrencySymbol],
  @"languageCode": [locale objectForKey: NSLocaleLanguageCode],
  @"countryCode": [locale objectForKey: NSLocaleCountryCode]
  };
  
  NSDictionary *dict = @{
  @"device": dictDevice,
  @"product": dictProduct,
  @"locale": dictLocale
  };
  
  NSString *data = [CoreGeneral JSONStringWithObject: dict];
  [self callWebView:guid data: data];
}

//记录日志，仅限于debug
-(void)log:(NSString *)guid{
  if(![CoreGeneral sharedManager].isDebug) return;
  NSString *text = [self getParams: guid];
  NSLog(@"日志输出：%@", text);
}

//弹出一个提示框
-(void)msgbox:(NSString *) guid
{
  NSString *data = [self getParams: guid];
  NSDictionary *dict = [CoreGeneral JSONObjectWithString: data];
  NSString *title = [dict valueForKey:@"title"];
  NSString *message = [dict valueForKey:@"message"];
  NSString *button = [dict valueForKey:@"button"];
  
	UIAlertView *alert = [[UIAlertView alloc]
                        initWithTitle: title
                        message:message
                        delegate:nil
                        cancelButtonTitle:button
                        otherButtonTitles: nil];
	[alert show];
	[alert release];
}


//播放视频
- (void)playMovie:(NSString*) guid
{
  NSString *data = [self getParams: guid];
  NSDictionary *dict = [CoreGeneral JSONObjectWithString: data];
  
  NSString *fileName = [dict valueForKey:@"fileName"];
  NSString *ext = [dict valueForKey:@"ext"];
  NSString *path = [[NSBundle mainBundle] pathForResource:fileName ofType: ext];
  [CoreGeneral playMovie: path];
}

//发送邮件
-(void)sendMail:(NSString *) guid{
	NSString *data = [self getParams: guid];
  NSDictionary *dict = [CoreGeneral JSONObjectWithString: data];
  
	//获取邮件相关信息的函数
	NSString *body = [dict valueForKey:@"body"];
  NSString *mailTo = [dict valueForKey:@"mailTo"];
  NSString *subject = [dict valueForKey:@"subject"];
	NSArray *toRecipients = [mailTo componentsSeparatedByString:@";"]; 
	
  /*
  //获取抄送地址列表
  NSString *ccList = [self callWebView:[NSString stringWithFormat:@"%@('%@','ccRecipients', '%@')", getContent, flag, myId]];;
  NSArray * ccRecipients = [ccList componentsSeparatedByString:@";"]; 
  
  //获取抄送地址列表
  NSString *bccList = [self callWebView:[NSString stringWithFormat:@"%@('%@','bccRecipients', '%@')", getContent, flag, myId]];;
  NSArray *bccRecipients = [bccList componentsSeparatedByString:@";"]; 
  */
  
	[[CoreGeneral sharedManager] sendMail:body subject:subject toRecipients:toRecipients];
}

//取消某个本地通知
-(void)cancelNotification: (NSString *) guid{
  Class cls = NSClassFromString(@"UILocalNotification");
  if (cls == nil) return;
  
  NSString *cancelId = [self getParam: guid];
  UILocalNotification *notificationToCancel = nil;
  for(UILocalNotification *aNotif in [[UIApplication sharedApplication] scheduledLocalNotifications]) {
    if([[aNotif.userInfo objectForKey:@"key"] isEqualToString:cancelId]) {
      notificationToCancel=aNotif;
      break;
    }
  };
  
  [[UIApplication sharedApplication] cancelLocalNotification:notificationToCancel];
}

//删除所有本地通知
-(void)cancelAllNotification: (NSString *) guid{
  Class cls = NSClassFromString(@"UILocalNotification");
  if (cls == nil) return;
  [[UIApplication sharedApplication] cancelAllLocalNotifications];
}

//添加本地通知
-(void)addNotification: (NSString *) guid{
  Class cls = NSClassFromString(@"UILocalNotification");
  if (cls == nil) return;
  
  NSString *data = [self getParams: guid];
  NSDictionary *dict = [CoreGeneral JSONObjectWithString: data];
  NSString *message = [dict valueForKey: @"message"];
  NSString *date = [dict valueForKey: @"date"];
  NSString *key = [dict valueForKey: @"key"];
  NSDate *fireDate = [ConvertHelper stringToDate:date];
  
  //本地化通知
  UILocalNotification *notify = [[UILocalNotification alloc] init];
  notify.timeZone = [NSTimeZone defaultTimeZone];
  notify.repeatInterval = NSDayCalendarUnit;
  notify.hasAction = NO;
  notify.fireDate = fireDate;
  notify.alertBody = message;
  [notify setSoundName:UILocalNotificationDefaultSoundName];
  
  NSDictionary *dictUserInfo = @{@"key": key};
  [notify setUserInfo:dictUserInfo];
  [[UIApplication sharedApplication] scheduleLocalNotification:notify];
}

//转换到splash，并重新加载当前页
-(void)restart:(NSString *) guid{

}


//处理完成，继承这个类需要处理这个方法，一般交由代理处理
-(void) onWebViewLoaded{
  if(!viewSplash) return;
  [UIView animateWithDuration:0.6f
                        delay:0.0
                      options:UIViewAnimationCurveEaseInOut //设置动画类型
                   animations:^{
                     viewSplash.alpha = 0;
                   }
                   completion:^(BOOL finished){
                     if(finished && self.superview) [viewSplash removeFromSuperview];
                   }];
}

//加载splash
-(void) loadSplash{
  if(viewSplash == nil){
    viewSplash = [[UISplash alloc] initWithFrame: self.bounds];
    viewSplash.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    viewSplash.backgroundColor = [UIColor whiteColor];
    //[viewSplash render];
    [self addSubview: viewSplash];
    [viewSplash release];
  };
  viewSplash.hidden = NO;
}

//设置程序图标上的数字
-(void)setBadge:(NSString *)guid{
  //提取
	NSInteger counter = [[self getParams: guid] intValue];
  [CoreGeneral setBadge: counter];
}

/*
//设置网络是否可用
- (void)setNetwork:(NSString *)guid{
  BOOL connected = [[self getParams: guid] boolValue];
	[CoreGeneral setNetwork: connected];
}
*/

//获取环境信处
-(void)getEnvironment:(NSString *) guid{
  UIDevice *device = [UIDevice currentDevice];
  //硬件信息
  NSDictionary *dictDevice = @{
      @"deviceId": [device uniqueIdentifier],
      @"systemVersion": [device systemVersion],
      @"systemName": [device systemName],
      @"deviceModel": [NSNumber numberWithInt:[CoreGeneral detectDevice]]
  };
  
  CoreGeneral *core = [CoreGeneral sharedManager];
  NSDictionary *dictProduct = @{
    @"productName": core.productName,
    @"version": [NSNumber numberWithFloat: core.productVersion],
    @"bundleId": core.bundleId,
    @"appleId": [NSNumber numberWithInt: core.appleId]
  };
  
  NSLocale * locale = [NSLocale currentLocale];
  NSDictionary *dictLocale = @{
    @"currency": [locale objectForKey: NSLocaleCurrencySymbol],
    @"languageCode": [locale objectForKey: NSLocaleLanguageCode],
    @"countryCode": [locale objectForKey: NSLocaleCountryCode]
  };
  
  NSDictionary *dict = @{
    @"device": dictDevice,
    @"product": dictProduct,
    @"locale": dictLocale
  };
  
  NSString *result = [CoreGeneral JSONStringWithObject: dict];
  [self callWebView:guid data: result];
}

//========================自定义方法====================
//根据guid从浏览器中传过来的参数
- (NSString *)getParams:(NSString *)guid{
  return [self callWebView: [NSString stringWithFormat: @"window.onGetParams('%@')", guid]];
}

/*
//获取单个的参数
-(NSString *) getParam:(NSString *)guid{
	NSRange check = [params rangeOfString:@"="];
	//没有找到?，表示没有参数，直接取方法名
	if(check.location == NSNotFound )
	{
		return params;
	}else{
		return [params substringWithRange: NSMakeRange(check.location + 1,params.length - check.location - 1)];
	}
}
*/

//回调webview，给出一个guid和要返回的数据，data必需为JSON值 
- (void) callWebView: (NSString * ) guid data: (NSString *) data
{
  NSString *javascript = @"window.onReceiveMessage('%@', %@);";
  javascript = [NSString stringWithFormat: javascript, guid, data];
  if([CoreGeneral sharedManager].isDebug){
     NSLog(javascript, nil);
  }
  [self callWebView: javascript];
}

//调用Javascript
- (NSString *) callWebView: (NSString*) javascript
{
  return [myWebView stringByEvaluatingJavaScriptFromString: javascript];
}


//处理键盘的委托
-(void) setKeyboard
{
  [[NSNotificationCenter defaultCenter] addObserver:
   self selector:@selector(keyboardWillShow:)name:UIKeyboardWillShowNotification object:nil];
  
  [[NSNotificationCenter defaultCenter] addObserver:
   self selector:@selector(keyboardWillHide:) name:UIKeyboardWillHideNotification object:nil];
}

-(void) changeKeyboard:(BOOL)isHide notification:(NSNotification *)aNotification
{
  //获取键盘的高度，并通知相关的view
  NSDictionary* info = [aNotification userInfo];
  //CGRect rectBegin = [[info objectForKey:UIKeyboardFrameBeginUserInfoKey] CGRectValue];
  CGRect rectEnd = [[info objectForKey:UIKeyboardFrameEndUserInfoKey] CGRectValue];
  CGRect bounds = [[info objectForKey:UIKeyboardBoundsUserInfoKey] CGRectValue];
  CGFloat kbHeight = bounds.size.height;
  
}

//键盘关闭的事件
- (void)keyboardWillHide:(NSNotification *)aNotification {
  [self changeKeyboard:YES notification:aNotification];
}

//显示键盘的处理
- (void)keyboardWillShow:(NSNotification *)aNotification {
  [self performSelector:@selector(hideNavButton) withObject:nil afterDelay:0];
  [self changeKeyboard:NO notification:aNotification];
}

//隐藏键盘上的的导航按钮next/pre
- (void)hideNavButton {
  BOOL find = NO;
  for (UIWindow *keyboardWindow in [[UIApplication sharedApplication] windows]){
    if(find) break;
    for (UIView *view1 in [keyboardWindow subviews]){
      if(find) break;
      //NSLog([view1 description], nil);
      for (UIView *view2 in [view1 subviews]){
        if(find) break;
        //NSLog([view2 description], nil);
        if([[view2 description] hasPrefix:@"<UIWebFormAccessory"] == YES){
          //NSLog([view2 description]);
          for (UIView *keyboard in [view2 subviews]){
            if(find) break;
            //NSLog([keyboard description], nil);
            if([[keyboard description] hasPrefix:@"<UISegmentedControl"] == YES){
              [keyboard removeFromSuperview];
              find = YES;
              break;
            }
          }     //end keyboard
        }     //end view2 if
      }       //end view2
    }         //end view1
  };      //end keyboardWindow
}


@end
