//
//  UIModel.m
//  imCore
//
//  Created by yi conis on 5/27/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "UIModelViewController.h"

@interface UIModelViewController (Private)

@end

@implementation UIModelViewController
static NSInteger kLeftButtonTag = 0;
static NSInteger kRightButtonTag = 1;
static NSInteger kButtonWidth = 51;
static NSInteger kButtonHeight = 25;
static NSInteger kSideMargin = 5;

@synthesize headerHeight = headerHeight_,
  leftTitle = leftTitle_, 
  rightTitle = rightTitle_,
  hideLeftButton = hideLeftButton_,
  hideRightButton = hideRightButton_,
  headerTitle = headerTitle_,
  dismissWhenClickedLeft = dismissWhenClickedLeft_;

-(void) dealloc
{
  [btnLeft release];
  [btnRight release];
  [lblTitle release];
  [toolbar release];
  [super dealloc];
}

-(id) init{
  self = [super init];
  if(self){
    dismissWhenClickedLeft_ = YES;
    hideLeftButton_ = NO;
    hideRightButton_ = NO;
    headerHeight_ = 44;
    self.view.backgroundColor = [UIColor whiteColor];
    [self createComponent];
  };
  return self;
}

//创建按钮
-(UIButton *) createButton:(NSString *)title tag:(NSInteger)tag buttonType:(UIButtonType)buttonType action:(SEL)action
{
  CGFloat buttonY = (headerHeight_ - kButtonHeight) / 2;
  CGRect rect;
  if(tag == kLeftButtonTag){
    rect = CGRectMake(kSideMargin, buttonY, kButtonWidth, kButtonHeight);
  }else{
    rect = CGRectMake(self.view.bounds.size.width - kButtonWidth - kSideMargin, buttonY, kButtonWidth, kButtonHeight);
  }
  
  UIButton *btn = [UIButton buttonWithType: buttonType];
  [btn setTitle: title  forState:UIControlStateNormal];
  //[btn setTitleColor:[UIColor grayColor] forState:UIControlStateHighlighted];
  [btn setTitleColor: [UIColor whiteColor] forState:UIControlStateNormal];
  btn.showsTouchWhenHighlighted = YES;
  [btn addTarget:self action: action forControlEvents:UIControlEventTouchUpInside];
  btn.frame = rect;
  btn.titleLabel.font = [UIFont boldSystemFontOfSize: 14];
  return btn;
}

//创建按钮
-(void) createComponent
{
  CGFloat buttonWidth = 51, buttonHeight = 25, sideMargin = 5;
  CGFloat buttonY = (headerHeight_ - buttonHeight) / 2;
  //创建菜单
  CGRect rect = self.view.frame;
  CGFloat menuWidth = rect.size.width;
  rect = CGRectMake(0, 0, rect.size.width, headerHeight_);
  /*
   viewHeader = [[UIView alloc] initWithFrame:rect];
   viewHeader.autoresizingMask = UIViewAutoresizingFlexibleWidth;
   viewHeader.backgroundColor = [UIColor colorWithPatternImage: [Common getResourcesImage: @"bg-header"]];
   [self.view addSubview: viewHeader];
   viewHeader.hidden = YES;
   */
  
  toolbar = [[UIToolbar alloc] initWithFrame: rect];
  [self.view addSubview: toolbar];
  toolbar.tintColor = [GraphicHelper rgb2Color:7 green:26 blue:65];
  toolbar.autoresizingMask = UIViewAutoresizingFlexibleWidth;
  
  //创建Left
  rect = CGRectMake(sideMargin, buttonY, buttonWidth, buttonHeight);
  btnLeft = [self createButton: leftTitle_ tag: kLeftButtonTag buttonType: UIButtonTypeCustom action:@selector(clickedLeftButton: )];
  btnLeft.hidden = hideLeftButton_;
  [toolbar addSubview: btnLeft];
  
  //创建Right
  rect = CGRectMake(menuWidth - buttonWidth - sideMargin, buttonY, buttonWidth, buttonHeight);
  btnRight = [self createButton: rightTitle_ tag: kRightButtonTag buttonType: UIButtonTypeCustom  action:@selector(clickedRightButton: )];
  btnRight.autoresizingMask = UIViewAutoresizingFlexibleLeftMargin;
  btnRight.hidden = hideRightButton_;
  [toolbar addSubview: btnRight];
  
  //创建Title
  CGFloat x = hideLeftButton_ ? sideMargin : buttonWidth + sideMargin;
  CGFloat w = menuWidth;
  if(!hideLeftButton_) w -= buttonWidth + sideMargin;
  if(!hideRightButton_) w -= buttonWidth + sideMargin;
  rect = CGRectMake(x, 0, w, headerHeight_);
  
  lblTitle = [[UILabel alloc] initWithFrame:rect];
  lblTitle.font = [UIFont boldSystemFontOfSize: 16];
  lblTitle.textColor = [UIColor whiteColor];
  lblTitle.backgroundColor = [UIColor clearColor];
  lblTitle.textAlignment = UITextAlignmentCenter;
  lblTitle.text = headerTitle_;
  lblTitle.autoresizingMask = UIViewAutoresizingFlexibleWidth;
  [toolbar addSubview: lblTitle];
  [lblTitle release];
  
  [toolbar release];
}

//点击右键
-(void)clickedRightButton:(UIButton *)sender
{

}

//点击左边的按钮
-(void) clickedLeftButton:(UIButton *)sender
{
  if(!dismissWhenClickedLeft_) return;
  
  if ([self respondsToSelector:@selector(presentingViewController)]) {
    [self.presentingViewController dismissModalViewControllerAnimated:YES]; 
  }else{
    [self.parentViewController dismissModalViewControllerAnimated: YES];
  }
}

//获取可用的Frame
-(CGRect) getAvailFrame
{
  CGRect rect = self.view.bounds;
  rect.origin.y += self.headerHeight;
  rect.size.height -= rect.origin.y;
  return rect;
}
@end
