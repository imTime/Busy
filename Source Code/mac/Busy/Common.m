//
//  Collection.m
//  ColorDocument
//
//  Created by conis on 11-12-12.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#import "Common.h"
static NSString *kSlideAnimation = @"imageSlider";
static Common *commonManager = nil;

@interface Common(Private)
-(void) initialize;
@end

@implementation Common

#pragma mark -
#pragma mark 单例模式的方法

+ (Common *)sharedManager 
{
	@synchronized(self) 
	{
		if (commonManager == nil){
			[[self alloc] init];
    }
	}
	return commonManager;
}

+ (id)allocWithZone:(NSZone *)zone
{
	@synchronized(self) {
		if (commonManager == nil) 
		{
			commonManager = [super allocWithZone:zone];
      [commonManager initialize];
			return commonManager; 
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
#pragma mark Private Method

-(void) initialize
{
  
  //从配置文件中读取
  NSString *plist = [Common getOptionConfigFile];
  NSDictionary *data = [[NSDictionary alloc] initWithContentsOfFile: plist];
  //提取option的默认值
  /*
  UIDataTable *table = [[UIDataTable alloc] init];
  id powerBy = [table getValueWithGuid:data section:1 guid: OptionRowGuidAppendPowerBy];
  id tips = [table getValueWithGuid:data section:1 guid: OptionRowGuidIntelligentTip];
  id doubleClick = [table getValueWithGuid: data section:1 guid: OptionRowGuidDoubleClick];
  [table release];
  */
  
  
  //设置默认的收藏色
  //[UIColorPicker setFavoriteColorWithDefault];    //保存默认的收藏颜色
}

//获取Option的文件，如果没有在document中，则从bundle中复制过去
+(NSString *) getOptionConfigFile
{
  NSString *file = [CoreGeneral getDocumentDirectory: @"data/option.plist"];
  NSFileManager *fm = [NSFileManager defaultManager];
  //如果文件不存在，则将MainBundle中的文件复制过去
  if(![fm fileExistsAtPath: file]){
    NSString *sourceFile = [[NSBundle mainBundle] pathForResource:@"option" ofType:@"plist"];
    [fm copyItemAtPath:sourceFile toPath:file error:nil];
  }
  return file;
}

#pragma -
#pragma mark 获取资源文件相关
//获取资源文件
+(UIImage *) getResourcesImage:(NSString *)imageName inRoot:(BOOL)inRoot ext:(NSString *)ext
{
  NSString *dir = @"";
  if(!inRoot){
    if([CoreGeneral sharedManager].isPad){
      dir = @"pad/";
    }else{
      dir = @"phone/";
    }
  }
  
  return [UIImage imageNamed: [NSString stringWithFormat:@"res/%@%@.%@", dir, imageName, ext]];
}

//获取资源中的图片
+(UIImage *) getResourcesImage:(NSString *)imageName inRoot: (BOOL) inRoot
{
  return [self getResourcesImage: imageName inRoot: inRoot ext: @"png"];
}

#pragma -
#pragma mark 导航相关
//显示导航
-(void) showGuide
{
  //检查是否要显示Guide
  NSString *guideKey = @"showGuideVersion";
  CGFloat guideVer = [[CoreGeneral getUserDefaults: guideKey] intValue];
  CGFloat curVersion = [CoreGeneral sharedManager].productVersion;
  if(guideVer == curVersion) return;
  
  //需要显示Guide
  [CoreGeneral setUserDefaults: guideKey value: [NSNumber numberWithFloat: curVersion]];
  
  /*
  CGRect rect = [CoreGeneral deviceBounds];
  imageSlider = [[ImageSlider alloc] initWithFrame: rect];
  imageSlider.backgroundColor = [GraphicHelper rgba2Color:76 green:76 blue:76 alpha:1];
  imageSlider.delegate = self;
  
  NSArray *images = [[NSArray alloc] initWithObjects: [Common getGuideImage: @"guide1"], [Common getGuideImage: @"guide2"], [Common getGuideImage: @"guide3"], [Common getGuideImage: @"guide4"], nil];
  [imageSlider addImages: images];
  
  UIImage *tipsImage = [Common getResourcesImage: @"guide-flag"];
  rect = CGRectMake(rect.size.width - tipsImage.size.width, 0, tipsImage.size.width, tipsImage.size.height);
  [imageSlider addHeaderImage:tipsImage frame:rect];
  [imageSlider layer].opacity = 0;
  [images release];

  if([CoreGeneral sharedManager].isPad){
    UIView *superView = [CoreGeneral sharedManager].rootViewController.view;
    [superView addSubview: imageSlider];
  }else{
    UIWindow *window = [CoreGeneral currentWindow];
    [window addSubview: imageSlider];
  };
  [CoreGeneral displayView:imageSlider duration:0.4 show:YES];
  //[window bringSubviewToFront:imageSlider];
  
  [imageSlider release];
  */
}

//完成SlideShow;
-(void) didImageSliderPlay
{
  [UIView beginAnimations: kSlideAnimation context:nil];
  [UIView setAnimationDelegate:self];
  [UIView setAnimationDidStopSelector:@selector(imageSliderAnimationStop:finished:context:)];
  [UIView setAnimationCurve:UIViewAnimationCurveEaseInOut];
  [UIView setAnimationDuration:0.5f]; //动画持续的时间
  [imageSlider layer].opacity = 0;
  [UIView commitAnimations];
}

//完成SliderShow隐藏的动画
-(void)imageSliderAnimationStop:(NSString *)animationID finished:(NSNumber *)finished context:(void *)context
{
  if ([finished boolValue] && [animationID isEqualToString: kSlideAnimation] ) {
    [imageSlider removeFromSuperview];
    [imageSlider release];
  };
}
  
#pragma -
#pragma mark 项目特有的方法
  
@end
