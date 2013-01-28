//
//  UIRating.h
//  imCore
//
//  Created by conis on 12-1-24.
//  Copyright (c) 2012年 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "CoreGeneral.h"

typedef enum{
  //标题模式，一次打一分
  UIRatingModelNormal = 1,
  //可以打半星
  UIRatingModelHalf = 2,
  //实际多少就算多少
  UIRatingModelReal = 3
} UIRatingModel;


@protocol UIRatingDelegate <NSObject>
@optional
-(BOOL) willChangeRatingValue: (CGFloat) value;
@end

@interface UIRating : UIView{
  UIImage *noramlImage;
  UIImage *highlightImage;
  NSInteger ratingCount;
  CGFloat space;
  UIView *viewHighlight;
  CGFloat value;
  UIRatingModel ratingModel;
  id <UIRatingDelegate> delegate;
}

@property (nonatomic, assign) id <UIRatingDelegate> delegate;
@property (nonatomic, retain) UIImage *noramlImage;
@property (nonatomic, retain) UIImage *highlightImage;

@property NSInteger ratingCount;
@property CGFloat space;
@property CGFloat value;
@property UIRatingModel ratingModel;   //评分的步长，允许大于0且小于等于1，通常用1或者0.5

-(void) render;
-(void) setRating:(CGFloat)newRating;
@end
