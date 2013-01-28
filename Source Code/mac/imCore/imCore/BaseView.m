//
//  BaseView.m
//  imBoxV2
//
//  Created by  on 11-10-2.
//  Copyright 2011年 __MyCompanyName__. All rights reserved.
//

#import "BaseView.h"
#import <QuartzCore/QuartzCore.h>
@interface BaseView(Private)
-(void) evalScreenSize;
@end

@implementation BaseView
@synthesize height, width, statusHeight, keyboardIsShow, keyboardHeight, parentViewController;

- (id)initWithFrame:(CGRect)frame
{
  self = [super initWithFrame:frame];
  if (self) {
    self.width = frame.size.width;
    self.height = frame.size.height;
    [self createComponent];
  }
  return self;
}

-(void) createComponent
{
  
}
/*
//重置方向
-(void) resetOrientation
{
  UIInterfaceOrientation orientation = (UIInterfaceOrientation)[[UIDevice currentDevice]orientation];
  [self shouldAutorotateToInterfaceOrientation:orientation];
  [self didRotateFromInterfaceOrientation:orientation];
}
*/

//将要横竖屏切换
-(void)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
  [self evalScreenSize];
}

//横竖屏切换
-(void) didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation
{
  
}

//显示或者隐藏键盘
-(void) onKeyboardDisplay:(BOOL)isHide keyboardHeight:(CGFloat)kbHeight notification:(NSNotification *)aNotification
{
  keyboardIsShow = !isHide;
  keyboardHeight = kbHeight;
}

//计算屏幕的高度和宽度
-(void) evalScreenSize
{
  //重新获取高度和宽度
  CGRect rect=[[UIScreen mainScreen] bounds];
  
  //宽度与高度要互换
  if([CoreGeneral deviceIsLandscape]){
    CGFloat h = rect.size.height;
    rect.size.height = rect.size.width;
    rect.size.width = h;
  };
  
  self.height = rect.size.height - self.statusHeight;
  self.width = rect.size.width;
}

@end
