//
//  UIRibbon.m
//  imCore
//
//  Created by yi conis on 5/9/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "UIRibbon.h"

@interface UIRibbon(Private)
-(UIColor *) getColorWith: (NSInteger) index;
-(void) clickedCell: (UIButton *) sender;
@end

@implementation UIRibbon
@synthesize baseColor = baseColor_, extendCount = extendCount_, delegate = delegate_;


-(void) createComponent
{
  [super createComponent];
  self.extendCount = 5;
  self.baseColor = [NSArray arrayWithObjects: 
                    @"rgba(49,49,49)",@"rgba(216,0,1)",
                    @"rgba(106,0,115)",@"rgba(22,111,2)",
                    @"rgba(126,51,1)",@"rgba(1,116,126)",
                    @"rgba(0,4,163)",@"rgba(127,120,1)", nil];
}

//渲染
-(void) render
{
  NSInteger count = self.baseColor.count * self.extendCount;
  [super render: count];
}

//创建Cell
-(UIView *) createCell:(NSInteger)index frame:(CGRect)frame
{
  UIColor *color = [self getColorWith: index];
  //创建单元格
  UIButton *cell = [UIButton buttonWithType: UIButtonTypeCustom];
  cell.frame = frame;
  cell.backgroundColor = color;
  cell.layer.cornerRadius = 4;
  cell.showsTouchWhenHighlighted = YES;
  [cell addTarget: self action: @selector(clickedCell:) forControlEvents:UIControlStateNormal];
  return cell;
}

//根据颜色获取索引
-(UIColor *) getColorWith:(NSInteger) index
{
  //获取基准色是哪一个
  NSInteger baseIndex = ceil(index / self.extendCount);
  NSString *strColor = [self.baseColor objectAtIndex: baseIndex];
  
  //获取是基准色延升的第几个色
  NSInteger extendIndex = index - (baseIndex * self.extendCount);
  
  //获取基准色的rgba
  CGFloat r = 0, g = 0, b = 0, a = 1;
  [GraphicHelper extractRgba: strColor red: &r green: &g blue: &b alpha: &a];
  
  //计算出延长的步长
  CGFloat step = 40 * extendIndex;
  r += step;
  g += step;
  b += step;
  /*
  r = r + (255 - r) / self.extendCount * extendIndex;
  g = g + (255 - g) / self.extendCount * extendIndex;
  b = b + (255 - b) / self.extendCount * extendIndex;
  */
  
  //NSLog(@"r: %.f, g: %.f, b: %.f", r, g, b);
  return [GraphicHelper rgba2Color:r green:g blue:b alpha:a];
}

//点击按钮
-(void) clickedCell:(UIButton *)sender
{
  [self.delegate onClickedRibbon: sender.backgroundColor];
  NSLog(@"clicked: %d", sender.tag);
}

@end
