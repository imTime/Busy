//
//  UIRating.m
//  imCore
//
//  Created by conis on 12-1-24.
//  Copyright (c) 2012年 __MyCompanyName__. All rights reserved.
//

#import "UIRating.h"
#import <math.h>

@interface UIRating(Private)
-(UIImage *) getWholeImage: (UIImage *) image;  
-(void) createButton: (NSInteger) index;
-(void) clickedRating: (UIButton *) sender;
-(void) moveFinger: (NSSet *)touches withEvent:(UIEvent *)event;
@end

@implementation UIRating
@synthesize noramlImage, highlightImage, ratingCount, space, ratingModel, value, delegate;

- (id)initWithFrame:(CGRect)frame
{
  self = [super initWithFrame:frame];
  if (self) {
    self.space = 5;
    self.ratingModel = UIRatingModelNormal;
  }
  return self;
}

-(void) dealloc
{
  [self.noramlImage release];
  [self.highlightImage release];
  [super dealloc];
}

-(void) willMoveToSuperview:(UIView *)newSuperview
{
  [self render];
}

//获取一张完整的图片，将图片根据评分的数量，重复生成一张图片
-(UIImage *) getWholeImage:(UIImage *)image
{
  CGSize originSize = image.size;
  CGFloat signleWidth = originSize.width + self.space;
  CGSize newSize = CGSizeMake(self.ratingCount * signleWidth, originSize.height);
  UIGraphicsBeginImageContext(newSize);
  CGContextRef ctx = UIGraphicsGetCurrentContext();
  CGContextTranslateCTM(ctx, 0, newSize.height);  //画布的高度
  CGContextScaleCTM(ctx, 1.0, -1.0);
  for (int i = 0; i < self.ratingCount; i ++) {
    CGFloat x = i * signleWidth;
    CGRect rect = CGRectMake(x, 0, originSize.width, originSize.height);
    CGContextDrawImage(ctx, rect, [image CGImage]); 
  };
  UIImage *newImage = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  return newImage;
}

//渲染
-(void) render
{
  UIImage *imgNoraml = [self getWholeImage: self.noramlImage];
  UIImage *imgHighlight = [self getWholeImage: self.highlightImage];
  
  //self.ratingSize = imgNoraml.size;
  self.frame = CGRectMake(self.frame.origin.x, self.frame.origin.y, imgNoraml.size.width, imgNoraml.size.height);
  /*
  //添加一个
  UIImageView *imgView = [[UIImageView alloc] initWithImage: imgNoraml];
  [self addSubview: imgView];
  [imgView release];
  */
  
  self.backgroundColor = [GraphicHelper colorFromImage: imgNoraml];
  self.opaque = NO;
  
  //添加高亮的view
  viewHighlight = [[UIView alloc] initWithFrame: CGRectZero];
  viewHighlight.backgroundColor = [GraphicHelper colorFromImage: imgHighlight];
  viewHighlight.opaque = NO;
  [self addSubview: viewHighlight];
  [viewHighlight release];
}

//设置评级
-(void) setRating:(CGFloat)newRating
{
  BOOL continueRating = YES;
  //判断协议是否实现
  if([self.delegate respondsToSelector: @selector(willChangeRatingValue:)]){
    continueRating = [self.delegate  willChangeRatingValue: newRating];
  };  
  if(!continueRating) return;
  self.value = newRating;
  CGRect rect = [CoreGeneral zeroRect: self.frame];
  rect.size.width = newRating * (self.highlightImage.size.width + self.space);
  //NSLog(@"x: %.f, y: %.f, w: %.f,h: %.f", rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
  viewHighlight.frame = rect;
}

//移动手指
-(void) moveFinger :(NSSet *)touches withEvent:(UIEvent *)event
{
  UITouch *touch = [[event allTouches] anyObject];
  CGPoint pt = [touch locationInView:self];
  
  CGFloat newRating = pt.x / self.highlightImage.size.width;
  newRating = MAX(newRating, 0);
  newRating = MIN(newRating, self.ratingCount);
  
  switch (self.ratingModel) {
    case UIRatingModelHalf:
      newRating = [CoreGeneral roundToHalf: newRating];
      break;
    case UIRatingModelNormal:
      newRating = round(newRating);
      break;
  }
  
  if(newRating == self.value) return;
  [self setRating: newRating];
}

#pragma -
#pragma mark  触摸事件
-(void) touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event
{
  [self moveFinger:touches withEvent:event];
}

-(void) touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event
{
  [self moveFinger:touches withEvent:event];
}

-(void) touchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event
{
  [self moveFinger:touches withEvent:event];
}

-(void) touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event
{
  [self moveFinger:touches withEvent:event];
}
@end
