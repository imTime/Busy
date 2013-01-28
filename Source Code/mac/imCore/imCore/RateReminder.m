//
//  RateAlertView.m
//  imCore
//
//  Created by conis on 12-1-23.
//  Copyright (c) 2012年 __MyCompanyName__. All rights reserved.
//

#import "RateReminder.h"
@interface RateReminder(Private)
//跳转到App Store前的提示
-(void) rateOnAppStore;
@end

@implementation RateReminder
@synthesize noramlImage, highlightImage, rating, delegate;
const NSInteger ratingAlertTag = 1;
const NSInteger goToAppStoreTag = 2;

-(void) dealloc
{
  [super dealloc];
}


//显示
-(void) show
{
  UIAlertView *alert = [[UIAlertView alloc] initWithTitle: NSLocalizedString(@"pub_rate_rating_title", nil) message:@"\n\n\n" delegate:self cancelButtonTitle: NSLocalizedString(@"pub_rate_btn_rating_no", nil) otherButtonTitles: NSLocalizedString(@"pub_rate_btn_rating_yes", nil), nil];
  alert.tag = ratingAlertTag;
  UIRating *ratingView = [[UIRating alloc] initWithFrame:CGRectMake(12.0, 50.0, 260.0, 25.0)];
  ratingView.backgroundColor = [UIColor clearColor];
  ratingView.ratingCount = 5;
  ratingView.noramlImage = self.noramlImage;
  ratingView.highlightImage = self.highlightImage;
  ratingView.space = 5;
  ratingView.delegate = self;
  [alert addSubview:ratingView];
  [ratingView release];
  
  for(UIView *view in alert.subviews) {
    if(view.tag == 2 && [view isKindOfClass:[UIButton class]]){
      btnOK = (UIButton *)view;
      btnOK.enabled = NO;
      break;
    };
  }

  [alert show];
  [alert release];
}

//在哪个按钮关闭
-(void) alertView:(UIAlertView *)alertView willDismissWithButtonIndex:(NSInteger)buttonIndex
{
  BOOL isCancel = buttonIndex == 0;
  //点击取消，则评分为0
  if(isCancel) self.rating = 0;
  
  if(alertView.tag == goToAppStoreTag){
    //跳转到App Store上进行评分
    if(!isCancel){
      [CoreGeneral openAppOnAppStore: [CoreGeneral sharedManager].appleId];
    };
    
    [self.delegate onReminderClosed: self.rating rateOnAppStore: !isCancel];
  };
  
  //超过4分的，跳到App Store的评价系统
  if(self.rating >= 4){
    [self rateOnAppStore];
  }else{
    if(!isCancel) [CoreGeneral sendFeedBackWithLowRating: self.rating];
    //交给委托协议处理
    [self.delegate onReminderClosed: self.rating rateOnAppStore:NO];
  }
}

//将要改变评价的值
-(BOOL) willChangeRatingValue:(CGFloat)value
{
  self.rating = value;
  btnOK.enabled = self.rating > 0;
  return YES;
}

//跳转到App Store上去评分
-(void) rateOnAppStore
{
  UIAlertView *alert = [[UIAlertView alloc] initWithTitle: NSLocalizedString(@"pub_rate_store_title", nil) message: NSLocalizedString(@"pub_rate_store_message", nil)delegate:self cancelButtonTitle: NSLocalizedString(@"pub_rate_btn_store_no", nil) otherButtonTitles: NSLocalizedString(@"pub_rate_btn_store_yes", nil), nil];
  alert.tag = goToAppStoreTag;
  [alert show];
  [alert release];
}
@end
