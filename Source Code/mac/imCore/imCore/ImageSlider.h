//
//  ImageSlider.h
//  imCore
//
//  Created by conis on 11-12-31.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "CoreGeneral.h"
/*
 全屏添加一个Slider，一般用于帮助，What's New，或者广告
*/
@protocol ImageSliderDelegate <NSObject>
-(void) didImageSliderPlay;
@end

@interface ImageSlider : UIView<UIScrollViewDelegate>{
  //NSArray *images;
  UIPageControl *pageControl;
  UIScrollView *svImageView;
  id<ImageSliderDelegate> delegate;
  BOOL isClosed;
  NSInteger imageCount_;
}

@property (nonatomic, retain) id<ImageSliderDelegate> delegate;

-(void) addImages: (NSArray *) images;
-(void) addHeaderImage: (UIImage *) image frame: (CGRect) rect;
@end
