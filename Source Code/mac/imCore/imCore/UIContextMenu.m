//
//  ContextMenu.m
//  imCore
//
//  Created by conis on 12-1-21.
//  Copyright (c) 2012年 __MyCompanyName__. All rights reserved.
//

#import "UIContextMenu.h"


@interface UIContextMenu(private)
-(void) clickedMenuItem: (UIButton *) sender;
-(void) touchDownMenuItem: (UIButton *) sender;
-(void) touchCancelMenuItem: (UIButton *) sender;
@end

@implementation UIContextMenu
@synthesize menuItemCount, delegate, contextMenuShowing, maxFrame;
const NSInteger kMenuItemHeight = 25;

- (id)initWithFrame:(CGRect)frame
{
  frame.size.height = 0;
  self = [super initWithFrame:frame];
  if (self) {
    self.maxFrame = [CoreGeneral deviceBounds];
    self.menuItemCount = 0;
    self.contextMenuShowing = NO;
    self.clipsToBounds = YES;
    self.backgroundColor = [UIColor whiteColor];

    /*
    [[self layer] setShadowOffset:CGSizeMake(3, 3)];
    [[self layer] setShadowRadius:8];
    self.layer.cornerRadius = 4;
    self.opaque = NO;
    //formatView.layer.masksToBounds = YES;
    [[self layer] setShadowOpacity:0.8];
    [[self layer] setShadowColor:[UIColor blackColor].CGColor];
    */
      // Initialization code
  }
  return self;
}

//创建按钮
-(void) appendMenuItem:(NSString *)title tag:(NSInteger)tag icon:(UIImage *)icon
{
  UIButton *btn = [UIButton buttonWithType: UIButtonTypeCustom];
  btn.titleLabel.font = [UIFont systemFontOfSize: 14];
  [btn addTarget:self action:@selector(clickedMenuItem:) forControlEvents:UIControlEventTouchUpInside];
  [btn addTarget:self action:@selector(touchDownMenuItem:) forControlEvents:UIControlEventTouchDown];
  [btn addTarget:self action:@selector(touchCancelMenuItem:) forControlEvents:UIControlEventTouchUpOutside];
  [btn setTitle:title forState:UIControlStateNormal];
  [btn setTitleColor:[UIColor darkGrayColor] forState:UIControlStateNormal];
  [btn setTitleColor:[UIColor blackColor] forState:UIControlEventTouchDown];
  [[btn layer] setBorderColor: [GraphicHelper rgb2Color:204 green:204 blue:204].CGColor];
  [[btn layer] setBorderWidth: 1.0f];
  //设置icon
  if(icon != nil){
    [btn setImage: icon forState:UIControlStateNormal];
  };
  btn.tag = tag;
  
  //计算Rect
  CGFloat y = self.menuItemCount * (kMenuItemHeight - 1);
  CGRect rect = CGRectMake(0, y, self.frame.size.width, kMenuItemHeight);
  btn.frame = rect;
  [self addSubview: btn];
  self.menuItemCount ++;
}

//根据tag值获取按钮
-(UIButton *) menuItemWithTag:(NSInteger)tag
{
  return (UIButton *)[self viewWithTag: tag];
}

#pragma -
#pragma mark Private Methods
//按下按钮
-(void) touchDownMenuItem:(UIButton *)sender
{
  [sender setBackgroundColor: [UIColor grayColor]];
}

//点击按钮
-(void) clickedMenuItem:(UIButton *)sender
{
  [sender setBackgroundColor: [UIColor clearColor]];
  [self hideContextMenu];
  [self.delegate onClickedContextMenuItem: sender.tag];
}

-(void) touchCancelMenuItem:(UIButton *)sender
{
  [sender setBackgroundColor: [UIColor clearColor]];
}

#pragma -
#pragma MAKR Public Methos
-(void) showContextMenu:(CGPoint)point
{
  //第一步，将Height设置为0, 设置xy的位置
  CGRect rect = self.frame;
  
  //重新计算Point的位置，不能超出最大的框
  point.x = MAX(point.x, self.maxFrame.origin.x);
  point.x = MIN(self.maxFrame.size.width - rect.size.width, point.x);
  point.y = MAX(point.y, self.maxFrame.origin.y);
  point.y = MIN(self.maxFrame.size.height - rect.size.height, point.y);
  //如果上下文菜单没有显示，则将大小设置为0
  if(!self.contextMenuShowing){
    rect.size.height = 0;
    rect.origin = point;
  };
  
  self.frame = rect;
  
  //第二步，计算height
  CGFloat h = self.menuItemCount * kMenuItemHeight;
  rect.size.height = h;
  if(self.contextMenuShowing){
    rect.origin = point;
  };
  
  //第三步，执行动画
  [CoreGeneral viewSizeAnimation:self duration:.2f frame:rect];
  self.contextMenuShowing = YES;
}

//隐藏上下文菜单
-(void) hideContextMenu
{
  self.contextMenuShowing = NO;
  CGRect rect = self.frame;
  rect.size.height = 0;
  //第三步，执行动画
  [CoreGeneral viewSizeAnimation:self duration:.2f frame:rect];
}
@end
