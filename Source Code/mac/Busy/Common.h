//
//  Collection.h
//  ColorDocument
//
//  Created by conis on 11-12-12.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#define kAppleIdForPhone 0      //
#define kAppleIdForPad 1

#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>
#import "imCore/CoreGeneral.h"
#import "imCore/ImageSlider.h"
#import "imCore/AppInfo.h"
#import "imCore/UIDataTable.h"
#import "imCore/UIColorPicker.h"


@interface Common : NSObject<ImageSliderDelegate, RateReminderDelegate>{
  ImageSlider *imageSlider;
}

+ (Common *)sharedManager;
+ (NSString *) getOptionConfigFile;
//获取Resources目录下的图片
+(UIImage *) getResourcesImage: (NSString *) imageName inRoot: (BOOL) inRoot;
+(UIImage *) getResourcesImage:(NSString *)imageName inRoot: (BOOL) inRoot ext: (NSString *) ext;
+(UIImage *) getImage: (NSString *) imageName;
+(UIColor *) getImageColor: (NSString *) imageName;
+(NSDate *) minDate;

+(void) viewSwitch: (UIView *) fromView toView: (UIView *) to;
-(void) showGuide: (NSInteger) imageCount;
+(void) openTrackItemEditor: (NSInteger) itemId;
@end
