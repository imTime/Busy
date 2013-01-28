//
//  TextEditor.h
//  imCore
//
//  Created by conis on 12-1-21.
//  Copyright (c) 2012年 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "CoreGeneral.h"
@protocol UITextEditorDelegate <NSObject>
-(BOOL) onTextChanging: (NSInteger) location length:(NSInteger) length text:(NSString *) text;
-(void) onTextSelection: (NSInteger) location length:(NSInteger) length;
-(void) onAutoReportText: (NSString *) text;
@end

@interface UITextEditor : UIView<UITextViewDelegate>{
  id<UITextEditorDelegate> delegate;
  UITextView* myTextView;
  NSInteger lastLocation;
  NSTimer *autoTimer;
}

@property (nonatomic, retain) id<UITextEditorDelegate> delegate;
@property NSInteger lastLocation;
//获取文本内容
-(NSString *) getText;
-(void) setText: (NSString *) text;
-(UITextView *) textView;
-(void) blur;
-(void) focus;
-(void) startAutoReport: (CGFloat) interval;
-(void) stopAutoReport;
@end
