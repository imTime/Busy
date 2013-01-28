//
//  SystemInfo.h
//  imCore
//
//  Created by conis on 12-1-2.
//  Copyright (c) 2012年 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>
#import "CoreGeneral.h"
#import "RateReminder.h"

/*系统信息*/
@interface AppInfo : NSObject<RateReminderDelegate>{
  BOOL isNewInstall;      //是否为新安装
  BOOL isNewUpdate;       //是否刚从旧版本更新到新版本
  RateReminder *reminder;
  CGFloat productVersion;      //当前运行的版本号(这个版本号是从保存数据中取出来的，更新的时候有用)
  NSDate *installDate;   //安装时间
  NSDate *lastRun;      //最后一次运行时间
  NSInteger runCount;   //运行次数
  NSInteger currentVersionRunCount;     //当前版本运行次数
  CGFloat showedGuideVersion;     //已经显示Guide(What's New)的版本
  CGFloat rateVersion;            //评分的版本
  NSDate *rateTipsDate;           //上一次提示评分的时间
  NSInteger rating_;               //用户的评分
  CGFloat rateOnAppStoreVersion;  //已经在App Store上评分的版本，（当用户用RateReminder评分为4星以上后，点击了OK，就假定用户已经在App Store上给当前版本评分了)
  
}

@property BOOL isNewInstall;
@property BOOL isNewUpdate;
@property CGFloat productVersion;
@property(nonatomic, retain) NSDate *installDate;
@property(nonatomic, retain) NSDate *lastRun;
@property NSInteger runCount;
@property NSInteger currentVersionRunCount;
@property CGFloat showedGuideVersion;
@property CGFloat rateVersion;
@property NSInteger rating;
@property CGFloat rateOnAppStoreVersion;
@property(nonatomic, retain) NSDate *rateTipsDate;

+ (AppInfo *)sharedManager;
//当前版本是否已经评分
//-(BOOL) currentVersionRated;
//显示当前版本的评价
-(void) showCurrentVersionRate;
//显示评价提示
-(void) showRate: (UIImage *) highlightImage noramlImage: (UIImage *) noramlImage;
-(void) checkRateTips: (UIImage *) highlightImage noramlImage: (UIImage *) noramlImage;
//保存到用户的配置文件当中
-(void) save;
//是否为更新的版本
-(BOOL) isUpdate;
-(BOOL) needCountRun;
@end
