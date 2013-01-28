//
//  FontPicker.h
//  imCore
//
//  Created by conis on 12-1-19.
//  Copyright (c) 2012年 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>
#import "CoreGeneral.h"

@protocol UIFontPickerDelegate <NSObject>
-(void) onChangeFont: (UIFont *) font;
-(void) onChangeFontSize: (NSInteger) fontSize;
@end

@interface UIFontPicker : UIView<UITableViewDelegate, UITableViewDataSource>{
  BOOL showFontSizeSlider;
  BOOL onlySafeFont;
  NSArray *allFonts;
  NSArray *safeFonts;
  UITableView *tvFonts;
  UISlider *sldFontSize;
  UILabel *lblSimple;
  UILabel *lblFontSize;
  NSString *imagePath;
  id<UIFontPickerDelegate> delegate;
}

@property BOOL onlySafeFont;
@property BOOL showFontSizeSlider;
@property (nonatomic, retain) NSArray *safeFonts;
@property (nonatomic, retain) NSArray *allFonts;
@property (nonatomic, retain) NSString *imagePath;
@property (nonatomic, retain) id<UIFontPickerDelegate> delegate;

- (id)initWithFrame:(CGRect)frame resources: (NSString *) resources;
-(void) reloadData;
-(void) setFontSizeRange: (NSRange) range;
-(void) setCurrentFontSize: (CGFloat) fontSize;
-(void) setCurrentFont: (UIFont *) font;
@end
