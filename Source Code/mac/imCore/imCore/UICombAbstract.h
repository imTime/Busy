//
//  UIComb.h
//  imCore
//
//  Created by yi conis on 5/10/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "CoreGeneral.h"

/*
 由UIView+UIScrollView+UIPageControl组成，UIScrollView内由若干Cell组成，Cell根据参数按行列排列
 特点：
 有一屏或者多屏
 每屏有固定大小与数量的子控件
 抽象类，必需有子类继承
 Cell平均分配位置
 
 本类所做的工作
 1.处理ScrollView的滚动
 2.处理UIPageControl
 3.处理每一个Cell的位置
*/
@interface UICombAbstract : UIView<UIScrollViewDelegate>
{
  CGFloat colCount_;      //每屏的列总数
  CGFloat rowCount_;      //每屏的行总数
  CGFloat cellWidth_;     //cell的宽度
  CGFloat cellHeight_;    //cell的高度
  CGFloat horizontalSpace_;     //水平的间隔
  CGFloat verticalSpace_;       //垂直的间隔
  UIScrollView *svMain;     //滚动view
  UIPageControl *pcMain;   //页面控制器
  CGFloat cellCount_;     //cell的总量
  NSInteger cellBeginTag_;
  CGPosition margin_;     //
}

@property (nonatomic) NSInteger cellBeginTag;
@property (nonatomic) CGFloat cellCount;
@property (nonatomic)  CGFloat horizontalSpace;
@property (nonatomic)  CGFloat verticalSpace;
@property (nonatomic)  CGFloat colCount;
@property (nonatomic)  CGFloat rowCount;
@property (nonatomic)  CGFloat cellHeight;
@property (nonatomic)  CGFloat cellWidth;

//根据总数渲染
-(void) render: (NSInteger) count;
//重新布局
-(void) reLayout: (BOOL) animated;
-(UIPageControl *) getPcMain;
-(UIScrollView *) getSvMain;
-(UIView *) createCell: (NSInteger) index frame: (CGRect) frame;
-(void) createComponent;
-(NSInteger) getTagWith: (NSInteger) index;
@end
