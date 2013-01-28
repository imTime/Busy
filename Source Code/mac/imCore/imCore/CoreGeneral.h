//
//  CoreGeneral.h
//  imCore
//
//  Created by conis on 11-11-29.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <Twitter/Twitter.h>
#import <Twitter/TWTweetComposeViewController.h>
#import <sys/utsname.h>
#import <CommonCrypto/CommonDigest.h>
#import <MediaPlayer/MPMoviePlayerController.h>
#import <MediaPlayer/MediaPlayer.h>
#import <MessageUI/MessageUI.h>
#import <MessageUI/MFMailComposeViewController.h>
#import <QuartzCore/QuartzCore.h>
#import "RegexKitLite.h"
#import "JSONKit.h"
#import "GraphicHelper.h"
#import "StringHelper.h"
#import "ConvertHelper.h"

//描述一个位置
typedef struct {
  CGFloat left;
  CGFloat right;
  CGFloat top;
  CGFloat bottom;
} CGPosition;

//枚举类型
enum {
  kDevice_iPad_Simulator = 0,
  kDevice_iPhone_Simulator = 1,
  kDevice_iPod_Touch = 2,
  kDevice_iPhone = 3,
  kDevice_iPhone_3G = 4,
  kDevice_iPad = 5
};

//支持的设备类型
typedef enum{
  MFSupportDeviceIpad = 0,
  MFSupportDeviceIphone = 1,
  MFSupportDeviceUniversal= 3
} MFSupportDevice;

@interface CoreGeneral : NSObject<MFMailComposeViewControllerDelegate>{
  //BOOL enabledRichEditor;   //是否启用富文本编辑器
  NSInteger rateTipsRunCount;
  BOOL isDebug;           //是否正在Debug模式
  BOOL isPad;            //是否是ipad
  int appleId;            //Apple ID
  BOOL rateTipsCurrentVersion;      //是否提示用户评价当前版本
  NSString* productName;  //产品的名称
  CGFloat productVersion; //产品的版本
  NSString* bundleId;       //Bundle id
  NSString* rootDir;     //根目录
  MFSupportDevice supportDevice;   //支持的硬件
  UIViewController *rootViewController;
  NSString *uniqueIdentifier;
  NSInteger rateTipsInterval;
}

#define kStyleFontFamily @"font-family"
#define kStyleMargin @"margin"
#define kStyleFontSize @"font-size"
#define kStyleColor @"color"
#define kStyleBackgroundColor = @"background-color"
#define kStyleBold @"font-weight"
#define kStyleUnderline @"text-decoration"
#define kStyleItalic @"font-style"
#define kStyleBody @"body"
//发送邮件的通知
#define kSendMailNotification @"kSendMailNotification"

@property BOOL isPad;
@property BOOL isDebug;
@property int appleId;
@property NSInteger rateTipsRunCount;
@property NSInteger rateTipsInterval;
//@property BOOL enabledRichEditor;
@property BOOL rateTipsCurrentVersion;
@property MFSupportDevice supportDevice;
@property(nonatomic, retain)NSString* productName;
@property CGFloat productVersion;
@property(nonatomic, retain)NSString* bundleId;
@property(nonatomic, retain)NSString* rootDir;
@property(nonatomic, retain) NSString *uniqueIdentifier;
@property(nonatomic, retain) UIViewController *rootViewController;

+(CoreGeneral *)sharedManager;
+(BOOL) twitter: (NSString *)tweet;
+(NSString *) GUID;
+(NSString *)MD5:(NSString *)str;
+(CGRect) deviceBounds;
+(CGRect) deviceBounds: (BOOL) includeStatus;
+(UIDeviceOrientation) deviceOrientation;
+(int) detectDevice;
- (BOOL)isJailbroken;
+(void)playMovie:(NSString*) path;
+(BOOL) deviceIsPad;
+(BOOL) deviceIsRetina;
+(BOOL) deviceIs568;
+(BOOL) deviceIsLandscape;
+(void)displayView:(UIView *)view duration:(float)aDuration opacity:(CGFloat)transparent;
+(void)displayView:(UIView *)view duration:(float) aDuration show:(BOOL) aShow;
+(void) viewSizeAnimation:(UIView *)view duration:(CGFloat)aDuration frame:(CGRect)aFrame;
+(void) incrementNetworkActivity;
+(void) decrementNetworkActivity;
+(void) setBadge: (NSInteger) counter;
+(void) translationLayer: (CALayer *) layer duration: (CGFloat) aTimer leftToRight: (BOOL) l2r;
+(CGFloat) iOSVersion;
+(void) layerShadow: (CALayer *) layer offset: (CGSize) aOffset opacity: (CGFloat) aOpacity color: (CGColorRef) aColor radius: (CGFloat) aRadius;
+(void) layerShadow:(CALayer *)layer;
+(UIWindow *) currentWindow;
+(void) showLoadingView:(BOOL)disInteractive alpha: (CGFloat) a;
+(void) hideLoadingView;
+(void) postNotification:(NSString *) notificationName key: (NSString *) aKey value: (id) aValue;
+(void) postNotification:(NSString *) notificationName userInfo: (NSDictionary *) ui;
+(NSString *) getDocumentDirectory;
+(NSString *) getDocumentDirectory: (NSString *) file;
+(NSString *) getLibraryDirectory;
//+(NSString *) getCache
+(BOOL) directoryExists: (NSString *) path;
+(BOOL) stringToFile: (NSString *) text fileName: (NSString *) file;
+(BOOL) fileExists: (NSString *) file;
+(void) sendFeedback;
+(void) sendFeedback: (NSString *) body;
+(void) sendFeedBackWithLowRating: (NSInteger) rating;
+(void) openLink: (NSString *) url;
+(void) openAppOnAppStore: (NSInteger) appleId;
+(NSString *) appStoreLink: (NSInteger) appleId;
+(CGRect) zeroRect: (CGRect) rect;
+(CGPoint) pointInCenter: (CGSize) size outerSize: (CGSize) outerSize;
+(CGFloat) yWithRect: (CGRect) rect;
+(CGFloat) roundToHalf: (CGFloat) value;
+(NSString *) getEnvironment;
//实例方法
-(void) openAppOnAppStore;
-(NSString *) appStoreLink;
+(void) shareAppWithTwitter;
-(void) sendMail: (NSString *) body subject:(NSString *)title toRecipients: (NSArray *) mailTo;
+(void) reviewOnAppStore;
+(NSString *) JSONStringWithObject: (id) object;
+(id) JSONObjectWithData: (NSData *) data;
+(id) JSONObjectWithString: (NSString *) json;
+(void) setUserDefaults: (NSString *) key value: (id) value;
+(id) getUserDefaults: (NSString *) key;
+(void) setUserDefaults: (NSDictionary *) dict;
+(UIImage *) getCoreImage: (NSString *) imageName;
+(void) msgbox: (NSString *) title message: (NSString *) message buttonTitle: (NSString *) buttonTitle;
@end
