//
//  BaseView.h
//  imBoxV2
//
//  Created by  on 11-10-2.
//  Copyright 2011年 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "CoreGeneral.h"
#import <mach/mach.h>
@interface BaseView : UIView{
  CGFloat height;
  CGFloat width;
  CGFloat statusHeight;
  CGFloat keyboardHeight;
  BOOL keyboardIsShow;
  UIViewController *parentViewController;
}

@property CGFloat width;
@property CGFloat height;
@property CGFloat statusHeight;
@property BOOL keyboardIsShow;
@property CGFloat keyboardHeight;
@property (nonatomic, retain) UIViewController *parentViewController;
-(void) createComponent;
-(void)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation;
-(void) didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation;
-(void) onKeyboardDisplay:(BOOL)isHide keyboardHeight:(CGFloat)kbHeight notification:(NSNotification *)aNotification;
@end
