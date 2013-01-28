//
//  UIModel.h
//  imCore
//
//  Created by yi conis on 5/27/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "CoreGeneral.h"

@interface UIModelViewController : UIViewController
{
  UIButton *btnLeft;
  UIButton *btnRight;
  UILabel *lblTitle;
  UIToolbar *toolbar;
  NSInteger headerHeight_;
  NSString *leftTitle_;
  NSString *rightTitle_;
  NSString *headerTitle_;
  BOOL hideLeftButton_;
  BOOL hideRightButton_;
  BOOL dismissWhenClickedLeft_;
}


//header的高度，默认为44
@property NSInteger headerHeight;
//是否隐藏右边按钮
@property BOOL hideLeftButton;
//是否隐藏右边按钮
@property BOOL hideRightButton;
//点击右边的按钮是否关闭Mode窗口
@property BOOL dismissWhenClickedLeft;
//左边按钮的标题
@property (nonatomic, retain) NSString *leftTitle;
//标题
@property (nonatomic, retain) NSString *headerTitle;
//右边按钮的标题
@property (nonatomic, retain) NSString *rightTitle;

//创建组件
-(void) createComponent;
//点击右边按钮
-(void) clickedRightButton:(UIButton *) sender;
//点击左边按钮
-(void) clickedLeftButton:(UIButton *)sender;
//获取可用的区域
-(CGRect) getAvailFrame;

//创建按钮
-(UIButton*) createButton: (NSString *) title tag: (NSInteger) tag buttonType: (UIButtonType) buttonType action: (SEL) action;
@end
