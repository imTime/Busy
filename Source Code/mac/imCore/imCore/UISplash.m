//
//  UISplash.m
//  imCore
//
//  Created by Conis on 11/19/12.
//
//

#import "UISplash.h"

@interface UISplash(Private)
-(void) createComponent;
-(void) setSplashImage: (NSString *) image;
-(NSString *) getDefaultImage;
-(void) createActivity;
@end

@implementation UISplash

- (id)initWithFrame:(CGRect)frame
{
    self = [super initWithFrame:frame];
    if (self) {
      [self createComponent];
    }
    return self;
}

-(void) createComponent
{
  imgView = [[UIImageView alloc] initWithFrame: self.bounds];
  imgView.contentMode = UIViewContentModeCenter;
  imgView.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
  [self addSubview:imgView];
  [imgView release];
  [self setSplashImage: [self getDefaultImage]];
  
  [self createActivity];
}

-(void) createActivity
{
  CGRect rect = self.bounds;
  viewTransparent = [[UIView alloc] initWithFrame: rect];
  viewTransparent.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
  [self addSubview: viewTransparent];
  
  //添加黑色的背景层
  CGSize blackSize = CGSizeMake(100, 100);
  CGPoint point = [CoreGeneral pointInCenter:blackSize outerSize: rect.size];
  CGRect rectBlack = CGRectMake(point.x, point.y, blackSize.width, blackSize.height);
  //这里要经过配置，不能写死，暂时性
  //rectBlack.origin.y += 120;
  UIView *viewBlack = [[UIView alloc]  initWithFrame: rectBlack];
  viewBlack.autoresizingMask = UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleRightMargin | UIViewAutoresizingFlexibleBottomMargin;
  [viewBlack.layer setCornerRadius: 8];
  viewBlack.backgroundColor = [GraphicHelper transparentBlackColor:0.6];
  [viewTransparent addSubview: viewBlack];
  [viewBlack release];
  
  //添加旋转进度
  UIActivityIndicatorView *activity = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
  CGRect actRect = activity.frame;
  actRect.origin.x = (rectBlack.size.width - actRect.size.width) / 2;
  actRect.origin.y = (rectBlack.size.height - actRect.size.height) / 2;
  
  activity.frame = actRect;
  activity.hidesWhenStopped = YES;
  [activity startAnimating];
  [viewBlack addSubview: activity];
  
  [activity release];
  [viewTransparent release];
}

//获取默认的图片，根据方向和当前设备类型获取图片
-(NSString *) getDefaultImage{
  BOOL isPad = [CoreGeneral sharedManager].isPad;
  BOOL isRetina = [CoreGeneral deviceIsRetina];
  BOOL isLandscape = [CoreGeneral deviceIsLandscape];
  
  NSString *image = @"Default";
  //ipad
  if(isPad){
    //Default-Portrait@2x~ipad
    NSString *suffix = isLandscape ? @"Landscape" : @"Portrait";
    image = [image stringByAppendingFormat:@"-%@", suffix];
    //高清屏
    /*
    if(isRetina){
      image = [image stringByAppendingString:@"-@2x"];
    };
    */
    image = [image stringByAppendingString:@"~ipad"];
  }else{
    //Default-568h@2x.png
    if([CoreGeneral deviceIs568]){
      image = [image stringByAppendingString:@"-568h"];
    }
    
    /*
    //高清屏
    if(isRetina){
      image = [image stringByAppendingString:@"@2x"];
    };
    */
  }
  
  return [image stringByAppendingString:@".png"];
  NSString *path = [[NSBundle mainBundle] resourcePath];
  image = [path stringByAppendingFormat:@"/%@.png", image];
  if(![CoreGeneral fileExists: image]) NSLog(@"File %@ not exists", image);
  return image;
}

//设置splash
-(void) setSplashImage:(NSString *)image{
  UIImage *img = [UIImage imageNamed: image];
  imgView.image = img;
}

-(void) render{
  [self setSplashImage: [self getDefaultImage]];
}

@end
