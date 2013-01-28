//
//  CoreGeneral.m
//  imCore
//
//  Created by conis on 11-11-29.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#import "CoreGeneral.h"
#include <sys/socket.h> // Per msqr
#include <sys/sysctl.h>
#include <net/if.h>
#include <net/if_dl.h>

@interface CoreGeneral(Private)
-(void)initialize;
@end
//硬件类型
static int device = -1;
static CoreGeneral *coreGeneralManager = nil;
static UIView *loadingModalView = nil;
//网络活动计数器
static int networkActivityCounter = 0;
@implementation CoreGeneral
@synthesize isDebug, appleId, productName, productVersion, bundleId, rootDir;
@synthesize rateTipsCurrentVersion, isPad, uniqueIdentifier,
  supportDevice, rootViewController, rateTipsInterval, rateTipsRunCount;

#pragma mark -
#pragma mark 单例模式的方法

+ (CoreGeneral *)sharedManager 
{
	@synchronized(self) 
	{
		if (coreGeneralManager == nil){
			[[self alloc] init];
    }
	}
	return coreGeneralManager;
}

+ (id)allocWithZone:(NSZone *)zone
{
	@synchronized(self) {
		if (coreGeneralManager == nil) 
		{
			coreGeneralManager = [super allocWithZone:zone];
      [coreGeneralManager initialize];
			return coreGeneralManager; 
		}
	}
	return nil;
}

- (id)copyWithZone:(NSZone *)zone
{
	return self;
}
- (id)retain
{
	return self;
}

- (unsigned)retainCount
{
	return UINT_MAX;  //denotes an object that cannot be released
}

-(void) release
{
	// never release
}

- (id)autorelease
{
	return self;
}

#pragma -
#pragma mark 邮件，Twitter，播放视频
//打开内置的Twitter，如果不支持内置Twitter，则返回False
+(BOOL)twitter:(NSString *)tweet
{
  //确定是否支持twitter
  Class twClass = (NSClassFromString(@"TWTweetComposeViewController"));
  if (twClass==nil) return NO;
  
  //打开发送Twitter的窗口
  TWTweetComposeViewController *twCtrl = [[TWTweetComposeViewController alloc] init];
  [twCtrl setInitialText: tweet];
  [[CoreGeneral sharedManager].rootViewController presentViewController:twCtrl animated:YES completion:nil];
  
  //twitter窗口关闭
  twCtrl.completionHandler = ^(TWTweetComposeViewControllerResult res) {
    [[CoreGeneral sharedManager].rootViewController dismissModalViewControllerAnimated:YES];
  };
  return YES;
}

//在Twitter分享正在使用的App
+(void) shareAppWithTwitter;
{
  NSString *body = [NSString stringWithFormat: NSLocalizedString(@"pub_share_twitter", nil), [CoreGeneral sharedManager].productName];
  //加上App Store的链接
  body = [body stringByAppendingString: [CoreGeneral sharedManager].appStoreLink];
  [CoreGeneral twitter:body];
}

//让用户在App Store上评分
+(void) reviewOnAppStore
{
  NSString *url = @"itms-apps://ax.itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?type=Purple+Software&id=%d";
  url = [NSString stringWithFormat: url, [CoreGeneral sharedManager].appleId];
  [CoreGeneral openLink: url];
}

//发送邮件
-(void) sendMail:(NSString *)body subject:(NSString *)title toRecipients:(NSArray *)mailTo
{  
  //NSLog(@"%@", rootViewController);
	MFMailComposeViewController *picker = [[MFMailComposeViewController alloc] init];
  picker.mailComposeDelegate = self;
	[picker setSubject:title];
	[picker setMessageBody:body isHTML:YES];
  if(mailTo != nil && [mailTo count] > 0){
    [picker setToRecipients:mailTo];
  };
  
	[self.rootViewController presentModalViewController:picker animated:YES];
	[picker release];
}

//关闭邮件发送窗口
-(void)mailComposeController:(MFMailComposeViewController *)controller
         didFinishWithResult:(MFMailComposeResult)result error:(NSError *)error
{
  NSDictionary *userInfo = [NSDictionary dictionaryWithObject: [NSNumber numberWithInt: result] forKey: @"result"];
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
  [nc postNotificationName: kSendMailNotification
                         object: nil 
                       userInfo: userInfo];
  
  [self.rootViewController dismissModalViewControllerAnimated:YES];
}

//播放视频
+ (void)playMovie:(NSString*) path
{
  NSURL *url = [NSURL fileURLWithPath:path];
  if ([CoreGeneral iOSVersion] >= 3.2) {
    MPMoviePlayerViewController *mp = [[MPMoviePlayerViewController alloc] initWithContentURL:url];
    if (mp)
    {
      [[CoreGeneral sharedManager].rootViewController presentMoviePlayerViewControllerAnimated:mp];
      mp.moviePlayer.movieSourceType = MPMovieSourceTypeFile;
      [mp.moviePlayer play];
      [mp release];
    }
  } else if ([CoreGeneral iOSVersion] < 3.2) {
    MPMoviePlayerController* theMovie = [[MPMoviePlayerController alloc] initWithContentURL: url];
    theMovie.scalingMode = MPMovieScalingModeAspectFill;
    // Register for the playback finished notification
    [[NSNotificationCenter defaultCenter] addObserver: coreGeneralManager selector: @selector(movieFinishedCallback:) name: MPMoviePlayerPlaybackDidFinishNotification object: theMovie];
    // Movie playback is asynchronous, so this method returns immediately.
    [theMovie play];
  }
}

//点击完成
+ (void) movieFinishedCallback:(NSNotification*) aNotification {
  MPMoviePlayerController *player = [aNotification object]; 
  [[NSNotificationCenter defaultCenter] removeObserver:self name:MPMoviePlayerPlaybackDidFinishNotification object:player]; 
  [player stop]; 
  [[player view] removeFromSuperview];
  [player release]; 
}


//显示loading的视图
+(void) showLoadingView:(BOOL)disInteractive alpha:(CGFloat)a
{
  NSInteger loadingTag = 1;
  CGFloat sideLength = 100;
  //创建View
  if(loadingModalView == nil){
    loadingModalView = [[UIView alloc] initWithFrame: CGRectZero];
    UIWindow *window = [self currentWindow];
    [window addSubview: loadingModalView];
    
    UIView *loadingView = [[[UIView alloc] initWithFrame: CGRectZero] autorelease];
    loadingView.backgroundColor = [GraphicHelper rgba2Color:0 green:0 blue:0 alpha:0.8];
    [[loadingView layer] setCornerRadius: 8];
    loadingView.tag = loadingTag;
    [loadingModalView addSubview: loadingView];
    
    //添加菊花
    UIActivityIndicatorView *act = [[[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge] autorelease];
    CGRect actRect = act.frame;
    actRect = CGRectMake((sideLength - actRect.size.width) / 2, (sideLength - actRect.size.height) / 2, actRect.size.width, actRect.size.height);
    act.frame = actRect;
    act.autoresizingMask = UIViewAutoresizingNone;
    [act startAnimating];
    [loadingView addSubview: act];
    
    [loadingModalView release];
  };
  
  UIView *loadingView = [loadingModalView viewWithTag: loadingTag];
  CGRect rect = [self deviceBounds];
  CGRect loadingRect = CGRectMake((rect.size.width - sideLength) / 2, (rect.size.height - sideLength) / 2, sideLength, sideLength);
  
  if(disInteractive){
    loadingModalView.frame = rect;
    loadingView.frame = loadingRect;
  }else{
    loadingModalView.frame = loadingRect;
    loadingView.frame = CGRectMake(0, 0, sideLength, sideLength);
  }
  
  loadingModalView.backgroundColor = [GraphicHelper rgba2Color:0 green:0 blue:0 alpha:a];
}

//隐藏加载的View
+(void) hideLoadingView
{
  if(loadingModalView != nil){
    [loadingModalView removeFromSuperview];
    loadingModalView = nil;
  }
}

//低评分时发送的反馈意见
+(void) sendFeedBackWithLowRating: (NSInteger) rating
{
  NSString *body = NSLocalizedString(@"pub_feedback_rating_body", nil);
  body = [body stringByAppendingFormat: @"Rating: %d<br />", rating];
  [self sendFeedback: body];
}

//发送反馈
+(void) sendFeedback
{
  [self sendFeedback: NSLocalizedString(@"pub_feedback_body", nil)];
}

//发送反馈信息
+(void) sendFeedback:(NSString *)body
{
  CoreGeneral *gen = [CoreGeneral sharedManager];
  NSString *subject = NSLocalizedString(@"pub_feedback_subject", nil);
  NSArray *recipients = [NSArray arrayWithObjects:@"feedback@imTime.com", nil];
  subject = [NSString stringWithFormat:subject, gen.productName];
  
  //device.u
  body = [body stringByAppendingString: [CoreGeneral getEnvironment]];
  [gen sendMail:body subject:subject toRecipients:recipients];
}
#pragma mark -
#pragma mark 设备与环境

//获取硬件的矩行
+(CGRect) deviceBounds
{
  return [self deviceBounds: NO];
}

//获取硬件的矩形区域，可以设置是否包含状态栏
+(CGRect) deviceBounds:(BOOL)includeStatus
{
  //获取屏幕的宽度
  CGRect rect=[[UIScreen mainScreen] applicationFrame];
  
  //宽度与高度要互换
  if([CoreGeneral deviceIsLandscape]){
    CGFloat h = rect.size.height;
    rect.size.height = rect.size.width;
    rect.size.width = h;
  };
  
  if(includeStatus) {
    CGRect statusRect = [[UIApplication sharedApplication] statusBarFrame];
    rect.size.height += statusRect.size.height;
  };
  return rect;
}

//硬件是否为横屏模式
+(BOOL) deviceIsLandscape
{
  UIDeviceOrientation orientation = [CoreGeneral deviceOrientation];
  return orientation == UIDeviceOrientationLandscapeLeft || 
  orientation == UIDeviceOrientationLandscapeRight;
}

//获取硬件方向
+(UIDeviceOrientation) deviceOrientation
{
  return [[UIDevice currentDevice]orientation];
}

//是否越狱
- (BOOL)isJailbroken {
  BOOL jailbroken = NO;
  NSString *cydiaPath = @"/Applications/Cydia.app";
  NSString *aptPath = @"/private/var/lib/apt/";
  if ([[NSFileManager defaultManager] fileExistsAtPath:cydiaPath]) {
    jailbroken = YES;
  }
  
  if ([[NSFileManager defaultManager] fileExistsAtPath:aptPath]) {
    jailbroken = YES;
  }
  return jailbroken;
};

//检查硬件类型
+ (int) detectDevice {
  if(device != -1) return  device;
  NSString *model= [[UIDevice currentDevice] model];
  // Some iPod Touch return "iPod Touch", others just "iPod"
  
  NSString *iPodTouch = [[NSString alloc] initWithString: @"iPod Touch"];
  NSString *iPodTouchLowerCase = [[NSString alloc] initWithString:@"iPod touch"];
  NSString *iPodTouchShort = [[NSString alloc] initWithString:@"iPod"];
  NSString *iPad = [[NSString alloc] initWithString:@"iPad"];
  NSString *iPhoneSimulator = [[NSString alloc] initWithString:@"iPhone Simulator"];
  NSString *iPadSimulator = [[NSString alloc] initWithString:@"iPad Simulator"];
  
  if ([model compare:iPhoneSimulator] == NSOrderedSame) {
    // iPhone simulator
    device = kDevice_iPhone_Simulator;
  } else if ([model compare:iPadSimulator] == NSOrderedSame){
    device = kDevice_iPad_Simulator;
  } else if ([model compare:iPad] == NSOrderedSame) {
    // iPad
    device = kDevice_iPad;
  } else if ([model compare:iPodTouch] == NSOrderedSame) {
    // iPod Touch
    device = kDevice_iPod_Touch;
  } else if ([model compare:iPodTouchLowerCase] == NSOrderedSame) {
    // iPod Touch
    device = kDevice_iPod_Touch;
  } else if ([model compare:iPodTouchShort] == NSOrderedSame) {
    // iPod Touch
    device = kDevice_iPod_Touch;
  } else {
    // Could be an iPhone V1 or iPhone 3G (model should be "iPhone")
    struct utsname u;
    
    // u.machine could be "i386" for the simulator, "iPod1,1" on iPod Touch, "iPhone1,1" on iPhone V1 & "iPhone1,2" on iPhone3G
    
    uname(&u);
    
    if (!strcmp(u.machine, "iPhone1,1")) {
      device = kDevice_iPhone;
    } else {
      device = kDevice_iPhone_3G;
    }
  };
  
  [iPodTouch release];
  [iPad release];
  [iPhoneSimulator release];
  [iPadSimulator release];
  [iPodTouchLowerCase release];
  [iPodTouchShort release];
  return device;
}

//硬件是否为iPad
+(BOOL) deviceIsPad
{
  int type = [CoreGeneral detectDevice];
  return type == kDevice_iPad_Simulator || type == kDevice_iPad ;
}

//判断是否为retina屏
+(BOOL) deviceIsRetina{
  return [UIScreen mainScreen].scale == 2.f;
}

//判断是否为4寸设备，4寸设备都是retina屏
+(BOOL) deviceIs568{
  return [UIScreen mainScreen].bounds.size.height == 568.0f;
}

//获取当前的Window
+(UIWindow *) currentWindow
{
  UIWindow* window = [UIApplication sharedApplication].keyWindow;
  if (!window) {
    window = [[UIApplication sharedApplication].windows objectAtIndex:0];
  };
  return window;
}

//添加网络活动计数器
+(void) incrementNetworkActivity
{
  networkActivityCounter ++;
  [UIApplication sharedApplication].networkActivityIndicatorVisible = YES;
}

//减掉一个网络活动计数器
+(void) decrementNetworkActivity
{
  networkActivityCounter --;
  if(networkActivityCounter < 1){
    [UIApplication sharedApplication].networkActivityIndicatorVisible = NO;
  }
}

//设置图标上的badge
+(void) setBadge:(NSInteger)counter
{
  [UIApplication sharedApplication].applicationIconBadgeNumber = counter;
}

//获取当前iOS的版本
+(CGFloat) iOSVersion
{
  return [[[UIDevice currentDevice] systemVersion] floatValue];
}
#pragma mark -
#pragma mark 动画相关

//改变view的大小或者位置，中入动画
+(void) viewSizeAnimation:(UIView *)view duration:(CGFloat)aDuration frame:(CGRect)aFrame
{
  [UIView beginAnimations:nil context:NULL];
  [UIView setAnimationDuration: aDuration];
  [view setFrame: aFrame];
  [UIView commitAnimations];
}

//隐藏或者显示一个view
+(void)displayView:(UIView *)view duration:(float) aDuration show:(BOOL) aShow
{
  [CoreGeneral displayView:view duration:aDuration opacity:aShow ? 1 : 0];
}

//设置View的透明度动画
+(void)displayView:(UIView *)view duration:(float)aDuration opacity:(CGFloat)transparent
{
  [UIView beginAnimations:NULL context:nil];
  [UIView setAnimationDuration:aDuration];
  [UIView setAnimationCurve:UIViewAnimationCurveEaseInOut];
  view.layer.opacity = transparent;
  [UIView commitAnimations];
}


//平移一个层
+(void) translationLayer: (CALayer *) layer duration: (CGFloat) aTimer leftToRight: (BOOL) l2r
{
  CATransition *animation = [CATransition animation];
  [animation setType: kCATransitionPush];
  [animation setDuration: aTimer];
  [animation setSubtype: l2r ? kCATransitionFromLeft : kCATransitionFromRight];
  [animation setTimingFunction: [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionLinear]];
  [layer addAnimation:animation forKey:@"animation"];
}

#pragma mark -
#pragma mark 文件处理
//获取文档目录
+(NSString *) getDocumentDirectory
{
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  NSString *path = [paths objectAtIndex:0];
  path = [path stringByAppendingString:@"/"];
  return path;
}

//获取文档目录并且加上具体文件的路径
+(NSString *) getDocumentDirectory:(NSString *)file
{
  return [[self getDocumentDirectory] stringByAppendingString: file];
}

//获取Library的目录
+(NSString *) getLibraryDirectory
{
  NSArray *libraryPaths = NSSearchPathForDirectoriesInDomains(NSLibraryDirectory, NSUserDomainMask, YES);
  NSString *path = [libraryPaths objectAtIndex:0];
  path = [path stringByAppendingString:@"/"];
  return  path;
}

//检查文件夹是否存在，如果不存在则创建
+(BOOL) directoryExists:(NSString *)path
{
  NSFileManager *fm = [NSFileManager defaultManager];
  BOOL result = [fm fileExistsAtPath:path];
  if(!result){
    [fm createDirectoryAtPath:path withIntermediateDirectories:YES attributes:nil error:nil]; 
  };
  return result;
}

//文件是否存在
+(BOOL) fileExists:(NSString *)file
{
  NSFileManager *fm = [NSFileManager defaultManager];
  return [fm fileExistsAtPath:file];
}
//保存字符串为文件
+(BOOL) stringToFile:(NSString *)text fileName:(NSString *)file
{
  NSData* data= [text dataUsingEncoding:NSUTF8StringEncoding];
  BOOL result = [data writeToFile:file atomically:YES];
  //[data release];
  data = nil;
  return result;
}

#pragma mark -
#pragma mark 其它方法

//Md5一个字符
+(NSString *)MD5:(NSString *)str {
	const char *cStr = [str UTF8String];
  unsigned char result[16];
  CC_MD5( cStr, strlen(cStr), result );
  return [NSString stringWithFormat:
          @"%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X%02X",
          result[0], result[1], result[2], result[3], 
          result[4], result[5], result[6], result[7],
          result[8], result[9], result[10], result[11],
          result[12], result[13], result[14], result[15]
          ];	
}

//生成一个随机的GUID
+(NSString *) GUID
{
  CFUUIDRef    uuidObj = CFUUIDCreate(nil);//create a new UUID
  //get the string representation of the UUID
  NSString    *uuidString = (NSString*)CFUUIDCreateString(nil, uuidObj);
  CFRelease(uuidObj);
  return [uuidString autorelease];
}


+(void) layerShadow: (CALayer *) layer offset: (CGSize) aOffset opacity: (CGFloat) aOpacity color: (CGColorRef) aColor radius: (CGFloat) aRadius{
  [layer setShadowOffset: aOffset];
  [layer setShadowRadius: aRadius];
  [layer setShadowOpacity:aOpacity];
  [layer setShadowColor: aColor];
}

//设置层的阴影
+(void) layerShadow:(CALayer *)layer{
  [CoreGeneral layerShadow: layer offset:CGSizeMake(3, 3) opacity:0.5 color:[UIColor blackColor].CGColor radius:6];
}


//发送一个消息
+(void) postNotification:(NSString *) notificationName userInfo: (NSDictionary *) ui
{
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
  [nc postNotificationName: notificationName object:nil userInfo:ui];
}

+(void) postNotification:(NSString *) notificationName key: (NSString *) aKey value: (id) aValue
{
  NSDictionary *ui = [NSDictionary dictionaryWithObjectsAndKeys:aValue, aKey, nil];
  [self postNotification:notificationName userInfo:ui];
  //[ui release];
}



//获取环境信息
+(NSString *) getEnvironment
{
  CoreGeneral *gen = [CoreGeneral sharedManager];
  NSLocale * locale = [NSLocale currentLocale];
  UIDevice *device = [UIDevice currentDevice];
  return [NSString stringWithFormat: @"Product Name: %@<br />Bundle ID: %@<br />Product Version: %.1f<br />Language: %@<br />Country: %@<br />Device Version: %@<br />System Name: %@<br /></p>", gen.productName, gen.bundleId, gen.productVersion, [locale objectForKey: NSLocaleLanguageCode], [locale objectForKey: NSLocaleCountryCode], device.systemVersion, device.systemName];
}

//打开一个链接
+(void) openLink:(NSString *)url
{
  [[UIApplication sharedApplication] openURL: [NSURL URLWithString:url]];
}

//获取应用在App Store上的链接
+(NSString *) appStoreLink: (NSInteger) appleId;
{
  return [NSString stringWithFormat:@"http://itunes.apple.com/WebObjects/MZStore.woa/wa/viewSoftware?id=%d", appleId];
}

//在App Store上打开指定ID的程序
+(void) openAppOnAppStore:(NSInteger)appleId
{
  [self openLink: [self appStoreLink:appleId]];
}

//将Rect的x和y设置为0并返回 
+(CGRect) zeroRect:(CGRect)rect
{
  return  CGRectMake(0, 0, rect.size.width, rect.size.height);
}

+(CGPoint) pointInCenter: (CGSize) size outerSize: (CGSize) outerSize
{
  CGPoint point = CGPointMake((outerSize.width - size.width) / 2, (outerSize.height - size.height) / 2);
  return  point;
}

+(CGFloat) yWithRect:(CGRect)rect
{
  return rect.size.height + rect.origin.y;
}

//根据0.5进制获取
+(CGFloat) roundToHalf:(CGFloat)value
{
  NSInteger intValue = (NSInteger) value;
  CGFloat decimal = value - intValue;
  decimal = round(decimal * 10);
  if (decimal == 5) {
    return (intValue + 0.5);
  };
  
  if ( (decimal < 3) || (decimal > 7) ) {
    //NSLog(@"o: %.2f, n: %.2f",  value, round(value));
    return round(value);
  } else {
    return (intValue + 0.5);
  } 
}

//获取当前程序在App Store上的链接
-(NSString *) appStoreLink
{
  return [CoreGeneral appStoreLink: self.appleId]; 
}

//打开当前程序在App Store上的链接                   
-(void) openAppOnAppStore
{
  [CoreGeneral openAppOnAppStore: self.appleId]; 
}

//将JSON字符串转换为Object
+(id) JSONObjectWithString: (NSString *) json
{
  NSData *data = [json dataUsingEncoding: NSUTF8StringEncoding];
  return [self JSONObjectWithData: data];
}

//将Data转换为Object
+(id) JSONObjectWithData: (NSData *) data
{
  return [data objectFromJSONData]; //JSONKit
  /*
  //ios版本低于5，用JSONKit转换
  if (!NSClassFromString(@"NSJSONSerialization")) {
    return [data objectFromJSONData]; //JSONKit
  }else {
    NSError *err = nil;
    id jsonObject = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:&err];
    return jsonObject;
  }
  */
  return nil;
}

//将Object转换为JSON字符串，object只能接受NSDictionary, NSArray以及NSString
+(NSString *) JSONStringWithObject: (id) object
{
  /*
  if([object isKindOfClass:[NSDictionary class]]){
    return [((NSDictionary *) object) JSONString];
  }else if ([object isKindOfClass:[NSArray class]]){
    return [((NSArray *) object) JSONString];
  }else if ([object isKindOfClass:[NSString class]]){
    return [((NSString *) object) JSONString];
  };
  */
  //*
  if (!NSClassFromString(@"NSJSONSerialization")) {
    if([object isKindOfClass:[NSDictionary class]]){
      return [((NSDictionary *) object) JSONString];
    }else if ([object isKindOfClass:[NSArray class]]){
      return [((NSArray *) object) JSONString];
    }else if ([object isKindOfClass:[NSString class]]){
      return [((NSString *) object) JSONString];
    };
  }else{
    NSError *err = nil;
    NSData *data = [NSJSONSerialization dataWithJSONObject: object options:NSJSONWritingPrettyPrinted error: &err];
    return  [[NSString alloc] initWithData:data encoding: NSUTF8StringEncoding];
  }
  //*/
  return nil;
}

#pragma mark -
#pragma mark 私有方法
-(NSString *) getMacAddress
{
  
  int                 mib[6];
  size_t              len;
  char                *buf;
  unsigned char       *ptr;
  struct if_msghdr    *ifm;
  struct sockaddr_dl  *sdl;
  
  mib[0] = CTL_NET;
  mib[1] = AF_ROUTE;
  mib[2] = 0;
  mib[3] = AF_LINK;
  mib[4] = NET_RT_IFLIST;
  
  if ((mib[5] = if_nametoindex("en0")) == 0) {
    printf("Error: if_nametoindex error\n");
    return NULL;
  }
  
  if (sysctl(mib, 6, NULL, &len, NULL, 0) < 0) {
    printf("Error: sysctl, take 1\n");
    return NULL;
  }
  
  if ((buf = malloc(len)) == NULL) {
    printf("Could not allocate memory. error!\n");
    return NULL;
  }
  
  if (sysctl(mib, 6, buf, &len, NULL, 0) < 0) {
    printf("Error: sysctl, take 2");
    free(buf);
    return NULL;
  }
  
  ifm = (struct if_msghdr *)buf;
  sdl = (struct sockaddr_dl *)(ifm + 1);
  ptr = (unsigned char *)LLADDR(sdl);
  NSString *outstring = [NSString stringWithFormat:@"%02X:%02X:%02X:%02X:%02X:%02X", 
                         *ptr, *(ptr+1), *(ptr+2), *(ptr+3), *(ptr+4), *(ptr+5)];
  free(buf);
  
  return outstring;
}

//读取配置文件
-(void) initialize
{
  //获取根控制器
  //rootViewController = [CoreGeneral rootViewController];
  //获取配置文件
  NSBundle *bd = [NSBundle mainBundle];
  //取唯一的编号，按Mac地址取，不能直接取uuid
  self.uniqueIdentifier = [CoreGeneral MD5: [self getMacAddress]];
  //是否在debug模式
  self.isDebug = [[bd objectForInfoDictionaryKey:@"Debug"] boolValue];
  //Apple Id，用于推荐和评分等
  self.appleId = [[bd objectForInfoDictionaryKey:@"AppleId"] intValue];
  //提示要求运行多少次后
  self.rateTipsRunCount = [[bd objectForInfoDictionaryKey:@"RateTipsRunCount"] intValue];
  //提示打分间隔时间（从第一次安装或者从版本更新时算起），以天为单位
  self.rateTipsInterval = [[bd objectForInfoDictionaryKey:@"RateTipsInterval"] intValue];
  //是否要提示给当前版本打分
  self.rateTipsCurrentVersion = [[bd objectForInfoDictionaryKey:@"RateTipsCurrentVersion"] boolValue];
  
  //产品版本
  self.productVersion = [[bd objectForInfoDictionaryKey:@"CFBundleShortVersionString"] floatValue];
  //产品名称
  self.productName = [bd objectForInfoDictionaryKey:@"ProductName"];
  //唯一的ID
  self.bundleId = [bd objectForInfoDictionaryKey:@"CFBundleIdentifier"];
  //是否支持富文本编辑器
  //self.enabledRichEditor = [[bd objectForInfoDictionaryKey:@"SupportRichEditor"] boolValue];
  //支持设备的类型
  NSString *sd = [bd objectForInfoDictionaryKey:@"SupportDevice"];
  if ([sd isEqualToString: @"iPhone"]) {
    self.supportDevice = MFSupportDeviceIphone;
  }else if ([sd isEqualToString: @"iPad"]){
    self.supportDevice = MFSupportDeviceIpad;
  }else{
    self.supportDevice = MFSupportDeviceUniversal;
  }
  
  //探测物理硬件类型
  NSInteger device = [CoreGeneral detectDevice];
  //判断是否为ipad，支持的设备类型为iPad，或者是both，并且硬件设备是iPad
  self.isPad = self.supportDevice == MFSupportDeviceIpad || (self.supportDevice == MFSupportDeviceUniversal && (device == kDevice_iPad || device == kDevice_iPad_Simulator));
}

//设置用户的默认配置
+(void) setUserDefaults:(NSString *)key value:(id)value
{
  NSUserDefaults  *defaults = [NSUserDefaults standardUserDefaults];
  [defaults setObject: value forKey: key];
  [defaults synchronize];
}

//根据字典设置值
+(void) setUserDefaults:(NSDictionary *)dict
{
  NSUserDefaults  *defaults = [NSUserDefaults standardUserDefaults];
  NSArray *keys = [dict allKeys];
  
  for(int i = 0; i < keys.count; i ++){
    NSString *key = [keys objectAtIndex: i];
    [defaults setObject: [dict objectForKey: key] forKey: key];
  }
  [defaults synchronize];
}

//读取用户的默认配置
+(id) getUserDefaults:(NSString *)key
{
  NSUserDefaults  *defaults = [NSUserDefaults standardUserDefaults];
  return [defaults objectForKey: key];
}

//获取Res中的imCore下的图片，如果还包括子文件夹，则在imageName中要包括文件夹的名称
+(UIImage *) getCoreImage:(NSString *)imageName
{
  NSString *path = [NSString stringWithFormat: @"Res/imCore/%@.png", imageName];
  if([CoreGeneral fileExists: path]){
    NSLog(@"abc");
  }
  return [UIImage imageNamed: path];
}

//弹出一个提示框，其它什么也不做
+(void) msgbox:(NSString *)title message:(NSString *)message buttonTitle:(NSString *)buttonTitle
{
  UIAlertView *alert = [[UIAlertView alloc] initWithTitle:title message:message delegate:nil cancelButtonTitle:buttonTitle otherButtonTitles:nil, nil];
  [alert show];
  [alert release];
}
@end
