//
//  WebViewModal.m
//  imCore
//
//  Created by conis on 11-12-24.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//


#import "WebViewDialog.h"
static CGFloat kTransitionDuration = 0.3;

@interface WebViewDialog(Private)
- (void) createComponent;
- (void)postDismissCleanup;
- (void)dismiss:(BOOL)animated;
- (CGAffineTransform) transformForOrientation;
@end

@implementation WebViewDialog
@synthesize closeImage;

//创建组件
-(void) createComponent
{
  //创建验证的View
  _OAuthView = [[UIView alloc] initWithFrame: CGRectZero];  
  _OAuthView.backgroundColor = [UIColor grayColor];
  _OAuthView.autoresizesSubviews = YES;
  _OAuthView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  _OAuthView.contentMode = UIViewContentModeRedraw;
  
  //创建UIWebView
  _webView = [[UIWebView alloc] initWithFrame:CGRectMake(0, 0, 480, 480)];
  _webView.delegate = self;
  [[_webView layer] setCornerRadius: 10];
  [_webView setClipsToBounds:YES];
  _webView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [_OAuthView addSubview:_webView];
  [_webView release];
  
  //创建关闭的按钮
  _closeButton = [[UIButton buttonWithType:UIButtonTypeCustom] retain];
  [_closeButton setImage: self.closeImage forState:UIControlStateNormal];
  [_closeButton setTitleColor: [GraphicHelper rgb2Color:167 green:184 blue:216] forState:UIControlStateNormal];
  [_closeButton setTitleColor:[UIColor whiteColor] forState:UIControlStateHighlighted];
  [_closeButton addTarget:self action:@selector(cancel:)
         forControlEvents:UIControlEventTouchUpInside];
  _closeButton.titleLabel.font = [UIFont boldSystemFontOfSize:12];
  _closeButton.showsTouchWhenHighlighted = YES;
  _closeButton.autoresizingMask = UIViewAutoresizingFlexibleRightMargin | UIViewAutoresizingFlexibleBottomMargin;
  [_OAuthView addSubview:_closeButton];
};

- (CGAffineTransform)transformForOrientation {
  UIInterfaceOrientation orientation = [UIApplication sharedApplication].statusBarOrientation;
  if (orientation == UIInterfaceOrientationLandscapeLeft) {
    return CGAffineTransformMakeRotation(M_PI*1.5);
  } else if (orientation == UIInterfaceOrientationLandscapeRight) {
    return CGAffineTransformMakeRotation(M_PI/2);
  } else if (orientation == UIInterfaceOrientationPortraitUpsideDown) {
    return CGAffineTransformMakeRotation(-M_PI);
  } else {
    return CGAffineTransformIdentity;
  }
}

//点击取消
-(void) cancel:(id)sender
{
  [CoreGeneral hideLoadingView];
  [self dismiss:YES];
}

//关闭模态窗口
- (void)dismiss:(BOOL) animated {  
  if (animated) {
    [UIView beginAnimations:nil context:nil];
    [UIView setAnimationDuration:kTransitionDuration];
    [UIView setAnimationDelegate:self];
    [UIView setAnimationDidStopSelector:@selector(postDismissCleanup)];
    _OAuthView.alpha = 0;
    [UIView commitAnimations];
  } else {
    [self postDismissCleanup];
  }
}

//关闭模态窗口后的清理工作
- (void)postDismissCleanup {
  [_OAuthView removeFromSuperview];
  
  _webView.delegate = nil;
  [_webView release];
  [_closeButton release];
}

#pragma -
#pragma mark Public Method
-(void) show:(NSURL *)url
{
  [self createComponent];
  
  NSURLRequest* request = [NSURLRequest requestWithURL:url];
  [_webView loadRequest:request];
  
  _OAuthView.frame = [CoreGeneral deviceBounds];
  _webView.frame = CGRectMake(10, 30, 300, 440);
  _closeButton.frame = CGRectMake(2, 20, 29, 29);
  [_closeButton sizeToFit];
  
  UIWindow* window = [CoreGeneral currentWindow];
  [window addSubview: _OAuthView];
  
  _OAuthView.transform = CGAffineTransformScale([self transformForOrientation], 0.001, 0.001);
  [UIView beginAnimations:nil context:nil];
  [UIView setAnimationDuration: kTransitionDuration / 1.5];
  [UIView setAnimationDelegate:self];
  [UIView setAnimationDidStopSelector:@selector(bounce1AnimationStopped)];
  _OAuthView.transform = CGAffineTransformScale([self transformForOrientation], 1, 1);
  [UIView commitAnimations];
  
  [CoreGeneral showLoadingView:NO alpha:0];     //显示加载中
}

#pragma -
#pragma mark WebView Delegate
-(void) webViewDidFinishLoad:(UIWebView *)webView
{
  [CoreGeneral hideLoadingView];
}

//加载错误
-(void) webView:(UIWebView *)webView didFailLoadWithError:(NSError *)error
{
  [CoreGeneral hideLoadingView];
}
@end
