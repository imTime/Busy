//
//  UIRibbon.h
//  imCore
//
//  Created by yi conis on 5/9/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "imCore/CoreGeneral.h"
#import "UICombAbstract.h"

@protocol UIRibbonDelegate <NSObject>
-(void) onClickedRibbon: (UIColor *) color;
@end

@interface UIRibbon : UICombAbstract{
  NSArray *baseColor_;      //基础颜色，格式：rgba(0,0,0,1)
  NSInteger extendCount_;   //基础颜色扩展的长度
  id<UIRibbonDelegate> delegate_;
}

@property (nonatomic, retain) id<UIRibbonDelegate> delegate;
@property (nonatomic,retain) NSArray* baseColor;
@property (nonatomic) NSInteger extendCount;
-(void) render;
@end
