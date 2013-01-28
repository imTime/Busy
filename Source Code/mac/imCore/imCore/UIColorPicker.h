//
//  ColorPicker.h
//  imBoxV3
//
//  Created by conis on 11-11-1.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

/*
 2012-01-17: 添加颜色收藏的功能
 */

#import <UIKit/UIKit.h>
#import "CoreGeneral.h"
#import "CoreGeneral.h"

@protocol UIColorPickerDelegate <NSObject>
@optional
-(void) onChangeColor: (UIColor *) color;
@end

@interface UIColorPicker : UIView{
  UIView *viewMask;
  UIView *contrastColor;
  UIView *defineColor;
  UIButton *btnDeleting;
  UIButton *btnNewColor;
  UIButton *btnCurrentColor;
  UIButton *btnWhiteColor;
  UIButton *btnBlackColor;
  UIButton *btnNoneColor;
  UIImage *colorMap;
  id <UIColorPickerDelegate> delegate;
  NSString *imagePath;
  UIScrollView *svFavorite;
  BOOL moveFavorite;
  NSInteger movingFavoriteTag;
  CGPoint lastTouch;
  NSInteger maxFavoriteCount;
  NSInteger mapPixelCount;
}

@property (nonatomic, assign) id <UIColorPickerDelegate> delegate;
@property (nonatomic, retain) NSString* imagePath;
@property BOOL moveFavorite;
@property CGPoint lastTouch;
@property NSInteger movingFavoriteTag;
@property NSInteger maxFavoriteCount;
-(void) setCurrentColor: (UIColor *) color;
+(void) setFavoriteColor: (NSArray *) colors;
+(void) setFavoriteColorWithDefault;
-(id)initWithFrame:(CGRect)frame resources: (NSString *) resources;
@end
