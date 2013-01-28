//
//  UILabelEx.h
//  test1
//
//  Created by conis on 12-2-1.
//  Copyright (c) 2012年 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <CoreText/CoreText.h>

typedef enum VerticalAlignment {
  VerticalAlignmentTop,
  VerticalAlignmentMiddle,
  VerticalAlignmentBottom,
} VerticalAlignment;


@interface UILabelEx : UILabel{
@private
  BOOL isUnderline_;
  BOOL isBold_;
  BOOL isItalic_;
  VerticalAlignment verticalAlignment_;
}

@property (nonatomic, assign) VerticalAlignment verticalAlignment;
@property (nonatomic, assign) BOOL isUnderline;
@property (nonatomic, assign) BOOL isBold;
@property (nonatomic, assign) BOOL isItalic;

@end
