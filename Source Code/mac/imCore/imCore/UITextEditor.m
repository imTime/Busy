//
//  TextEditor.m
//  imCore
//
//  Created by conis on 12-1-21.
//  Copyright (c) 2012年 __MyCompanyName__. All rights reserved.
//

#import "UITextEditor.h"

@interface UITextEditor(Private) 
-(void) createComponent;
-(void) keyboardObserver;
-(void) changeKeyboard: (BOOL) isHide notification: (NSNotification *) notification;
- (void)keyboardWillHide:(NSNotification *) notification;
- (void)keyboardWillShow:(NSNotification *) notification;
@end

@implementation UITextEditor
@synthesize delegate, lastLocation;

-(void) dealloc
{
  //注销所有监控
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
  [nc removeObserver: self];
  [myTextView release];
  [super dealloc];
}

- (id)initWithFrame:(CGRect)frame
{
    self = [super initWithFrame:frame];
    if (self) {
      [self keyboardObserver];
      [self createComponent];
    }
    return self;
}

//创建组件
-(void) createComponent
{
  CGRect rect = CGRectMake(0, 0, self.frame.size.width, self.frame.size.height);
  myTextView = [[UITextView alloc] initWithFrame:rect];
  myTextView.backgroundColor = [UIColor clearColor];
  [myTextView setFont: [UIFont systemFontOfSize: 16]];
  myTextView.autocorrectionType = UITextAutocorrectionTypeNo;
  myTextView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [self addSubview: myTextView];
  myTextView.delegate = self;
  [myTextView release];
  
  //添加通知监控
}

//监控键盘
-(void) keyboardObserver
{
  [[NSNotificationCenter defaultCenter] addObserver: self selector:@selector(keyboardWillShow:)name:UIKeyboardWillShowNotification object:nil];
  
  [[NSNotificationCenter defaultCenter] addObserver: self selector:@selector(keyboardWillHide:) name:UIKeyboardWillHideNotification object:nil];
}
#pragma -
#pragma mark 实现协议

//改变选择区域
- (void)textViewDidChangeSelection:(UITextView *)textView
{
  NSRange range = [textView selectedRange];
  self.lastLocation = range.location;     //光标最后的位置
  [self.delegate onTextSelection:range.location length:range.length];
}

//输入改变
-(BOOL)textView:(UITextView *)textView shouldChangeTextInRange:(NSRange)range replacementText:(NSString *)text;{
  self.lastLocation = range.location;
  return [self.delegate onTextChanging:range.location length:range.length text:text];
}

//键盘关闭的事件
- (void)keyboardWillHide:(NSNotification *) notification {
  [self changeKeyboard:YES notification: notification];
}

//显示键盘的处理
- (void)keyboardWillShow:(NSNotification *) notification {
  [self changeKeyboard:NO notification: notification];
}

//改变键盘
-(void) changeKeyboard:(BOOL)isHide notification:(NSNotification *) notification
{
  //获取键盘的高度，并通知相关的view
  NSDictionary* info = [notification userInfo];
  CGRect bounds = [[info objectForKey:UIKeyboardBoundsUserInfoKey] CGRectValue];
  CGFloat kbHeight = bounds.size.height;
  
  CGRect rect = [CoreGeneral zeroRect: self.frame];
  if(!isHide) rect.size.height -= kbHeight;
  myTextView.frame = rect;
}

#pragma -
#pragma mark Public Methods

//获取文本
-(NSString *) getText
{
  return myTextView.text;
}

//设置文本
-(void) setText:(NSString *)text
{
  myTextView.text = text;
}

//获取TextView
-(UITextView *) textView
{
  return myTextView;
}

//使输入框获得焦点
-(void) focus
{
  [myTextView becomeFirstResponder];
}

//使输入框失去焦点
-(void) blur
{
  [myTextView resignFirstResponder];
}

//启动自动报告的计时器
-(void) startAutoReport: (CGFloat) interval
{
  if(autoTimer != nil) return;
  autoTimer = [NSTimer scheduledTimerWithTimeInterval: interval target:self selector:@selector(onTimer:) userInfo:nil repeats:YES];
}

//停止计时器
-(void) stopAutoReport
{
  if(autoTimer == nil) return;
  [autoTimer invalidate];
  autoTimer = nil;
}

//计时器被启劝
-(void)onTimer:(NSTimer*)theTimer
{
  //自动报告文本
  NSString *text = myTextView.text;
  [self.delegate onAutoReportText: text];
}

@end
