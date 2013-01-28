//
//  SystemInfo.m
//  imCore
//
//  Created by conis on 12-1-2.
//  Copyright (c) 2012年 __MyCompanyName__. All rights reserved.
//

#import "AppInfo.h"
static AppInfo *appInfoManager = nil;
@interface AppInfo(Private)
-(void)readUserDefaultInfo;
-(BOOL) needRateTips;
-(BOOL) ratedOnAppStore;
-(BOOL) rated;
-(void) saveRateTipsDate: (BOOL) isMaxDate;
-(NSDate *) getTipsFutureDate: (BOOL) isMaxDate;
@end

@implementation AppInfo
@synthesize lastRun, productVersion, runCount, installDate, rateTipsDate, rateVersion, showedGuideVersion, rateOnAppStoreVersion, rating = rating_, currentVersionRunCount,
    isNewInstall, isNewUpdate;
//用户配置文件的Key
#define kUserDefaultKey @"mf_app_info"
const NSString *kLastRunKey = @"lastRun";
const NSString *kProductVersionKey = @"productVersion";
const NSString *kRunCountKey = @"runCount";
const NSString *kInstallDateKey = @"installDate";
const NSString *kRateTipsDateKey = @"rateTipsDate";
const NSString *kRateVersionKey = @"rateVersion";
const NSString *kRatingKey = @"rating";
const NSString *kRateOnAppStoreVersionKey = @"rateOnAppStoreVersion";
const NSString *kShowedGuideVersionKey = @"showedGuideVersion";
const NSString *kCurrentVersionRunCount = @"currentVersionRunCount";
static NSInteger kMinRating = 4;
#pragma mark -
#pragma mark 单例模式的方法

+ (AppInfo *)sharedManager 
{
	@synchronized(self) 
	{
		if (appInfoManager == nil){
			[[self alloc] init];
    }
	}
	return appInfoManager;
}

+ (id)allocWithZone:(NSZone *)zone
{
	@synchronized(self) {
		if (appInfoManager == nil) 
		{
			appInfoManager = [super allocWithZone:zone];
      [appInfoManager readUserDefaultInfo];
			return appInfoManager; 
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

#pragma mark -
#pragma mark Private Method

//设置提醒的时间，可以根据配置文件中来确定
-(void) saveRateTipsDate: (BOOL) isMaxDate
{
  self.rateTipsDate = [self getTipsFutureDate: isMaxDate];
  [self save];
}

//获取未来提示的时间
-(NSDate *) getTipsFutureDate: (BOOL) isMaxDate
{
  NSInteger days = isMaxDate ? 1024 : [CoreGeneral sharedManager].rateTipsInterval;
  NSTimeInterval timer = days * 24 * 60 * 60;
  NSDate *date = [NSDate dateWithTimeIntervalSinceNow: timer];
  return date;
}

//读取用户的配置文件
-(void)readUserDefaultInfo
{
  CoreGeneral *core = [CoreGeneral sharedManager];
  NSUserDefaults  *defaults = [NSUserDefaults standardUserDefaults];
  NSDictionary *dict = [defaults objectForKey: kUserDefaultKey];
  //如果没有这个配置文件，则写入
  if(dict == nil){
    self.installDate = [NSDate date];
    self.runCount = 0;
    self.productVersion = 0;
    self.rateVersion = 0;
    self.rating = 0;
    self.showedGuideVersion = 0;
    self.rateOnAppStoreVersion = 0;
    //提示时间
    self.rateTipsDate = [self getTipsFutureDate: NO]; 
    self.currentVersionRunCount = 0;
    self.isNewInstall = YES;
    self.isNewUpdate = NO;
  }else{
    self.rating = [[dict objectForKey: kRatingKey] intValue];
    self.rateOnAppStoreVersion = [[dict objectForKey: kRateOnAppStoreVersionKey] floatValue];
    self.installDate = [ConvertHelper numberToDate: [dict objectForKey: kInstallDateKey]];
    self.lastRun = [ConvertHelper numberToDate: [dict objectForKey: kLastRunKey]];
    self.runCount = [[dict objectForKey: kRunCountKey] intValue];
    self.productVersion = [[dict objectForKey: kProductVersionKey] floatValue];
    self.rateVersion = [[dict objectForKey: kRateVersionKey] floatValue];
    self.rateTipsDate = [ConvertHelper numberToDate: [dict objectForKey: kRateTipsDateKey]];
    self.showedGuideVersion = [[dict objectForKey: kShowedGuideVersionKey] floatValue];
    self.currentVersionRunCount = [[dict objectForKey: kCurrentVersionRunCount] intValue];
    self.isNewInstall = NO;
    //保存的版本和软件的版本不一致，说明是软件更新
    self.isNewUpdate = self.productVersion != core.productVersion;
    
    //第一次更新
    if(self.isNewUpdate){
      self.currentVersionRunCount = 0;
      //如果当前版本要求要提示评价，则将评价日期重置
      if(core.rateTipsCurrentVersion){
        self.rateTipsDate = [self getTipsFutureDate: NO];
      }
    };
  };
  
  //是否需要对运行时间进行计数
  if([self needCountRun]){
    //当前版本运行次数
    self.currentVersionRunCount ++;
    //总运行次数
    self.runCount ++;
    //最后运行时间
    self.lastRun = [NSDate date];
  };
  
  [self save];
}

//约定的评价时间是否在未来
-(BOOL) needRateTips
{
  //提示日期在未来
  BOOL dateInFuture = self.rateTipsDate != nil && self.rateTipsDate > [NSDate date];
  //运行时间不够
  CoreGeneral *core = [CoreGeneral sharedManager];
  BOOL runCountLimit = (core.rateTipsCurrentVersion ? self.currentVersionRunCount : self.runCount) < core.rateTipsRunCount;
  return runCountLimit || dateInFuture;
}

#pragma -
#pragma mark Public Method
//保存到用户配置中
-(void) save
{
  NSUserDefaults  *defaults = [NSUserDefaults standardUserDefaults];
  NSDictionary *dict = [[NSDictionary alloc] initWithObjectsAndKeys: 
      [ConvertHelper dateToNumber: self.installDate], kInstallDateKey,
      [ConvertHelper dateToNumber: self.lastRun], kLastRunKey,
      [NSNumber numberWithInt: self.rating], kRatingKey,
      [NSNumber numberWithFloat: self.rateOnAppStoreVersion], kRateOnAppStoreVersionKey,
      [NSNumber numberWithInt: self.runCount], kRunCountKey, 
      [NSNumber numberWithFloat: self.productVersion], kProductVersionKey,
      [NSNumber numberWithFloat: self.rateVersion], kRateVersionKey,
      [ConvertHelper dateToNumber: self.rateTipsDate], kRateTipsDateKey,
      [NSNumber numberWithFloat: self.showedGuideVersion], kShowedGuideVersionKey,
      [NSNumber numberWithInt: self.currentVersionRunCount], kCurrentVersionRunCount,
      nil];
  
  [defaults setObject: dict  forKey:kUserDefaultKey];
  [defaults synchronize];
  [dict release];
  dict = nil;
}

/*
//检测
-(BOOL) currentVersionRated
{
  return self.rateVersion == [CoreGeneral sharedManager].productVersion;
}
*/

//是否已经评分
-(BOOL) rated
{
  //只要有一个大于0的版本，就表示用户已经评分过了
  if([CoreGeneral sharedManager].rateTipsCurrentVersion){
    return self.rateVersion > 0;
  }else{
    return self.rateVersion == [CoreGeneral sharedManager].productVersion;
  }
}

//是否已经在App Store上评论
-(BOOL) ratedOnAppStore
{
  if([CoreGeneral sharedManager].rateTipsCurrentVersion){
    return self.rateOnAppStoreVersion > 0;
  }else{
    return self.rateOnAppStoreVersion == [CoreGeneral sharedManager].productVersion;
  }
}

//检查保存的版本和当前的版本是否一致
-(BOOL) isUpdate
{
  return self.productVersion != [CoreGeneral sharedManager].productVersion;
}

/*
//显示评价提示，如果用户已经提示过了，则不会提示
-(void) showRate
{
  //用户已经评价过了或者约定的评价日期在未来
  if([self rated] || [self rateTipsDateInFuture]) return;
}
*/

//显示当前版本的评价提示，一般用这个
-(void) checkRateTips: (UIImage *) highlightImage noramlImage: (UIImage *) noramlImage
{
  //如果用户已经评分，检查是否在App Store上评分
  if([self rated]){
    //评星超过最小评分，但没有到App Store上评价，则提示用户去App Store上评价
    if(self.rating >= kMinRating && (![self ratedOnAppStore])){
      //提示用户到App Store上评价
      return;
    };
    
    //评星小于最小评分，且没有写反馈的，提示用户写反馈意见
    return;
  };
  
  //不需要提示，可能是因为提示的时间还在未来，也可能是运行的次数不够
  if (![self needRateTips]) return;
  [self showRate: highlightImage noramlImage: noramlImage];
}

//显示提示
-(void) showRate:(UIImage *)highlightImage noramlImage:(UIImage *)noramlImage
{
  //用户还没有评价，提示用户评价
  reminder = [[RateReminder alloc] init];
  reminder.highlightImage = highlightImage;
  reminder.noramlImage = noramlImage;
  reminder.delegate = self;
  [reminder show];
}

//提示窗口关闭
-(void) onReminderClosed:(CGFloat)rating rateOnAppStore:(BOOL)rateOnAppStore
{
  [reminder release];
  reminder = nil;
  
  //如果没有评分的话，把时间提醒改到未来的时间
  if(rating == 0){
    [self saveRateTipsDate: NO];
    return;
  };
  
  CGFloat ver = [CoreGeneral sharedManager].productVersion;
  self.rating = rating;
  self.rateVersion = ver;
  
  //已经点击了到App Store上评价
  if(rateOnAppStore){
    self.rateOnAppStoreVersion = ver;
  };
  
  //如果用户评分超过最低分，且没有到App Store上评分，在下一个间隔时间提示用户
  BOOL neverTips = rating < kMinRating || (rateOnAppStore && rating >= kMinRating);
  self.rateTipsDate = [self getTipsFutureDate: neverTips];
  
  [self save];
}

//是否需要对运行次数进行计数，主要是判断最后运行时间和现在的时间差 
-(BOOL) needCountRun
{
  CGFloat maxInterval = 60*60;      //1小时内容不重复统计
  //没有设置最后运行时间(第一次运行)，或者上次统计运行时间超过一小时，则计算统计信息
  return (self.lastRun == nil || [self.lastRun timeIntervalSinceNow] > maxInterval);
}
@end
