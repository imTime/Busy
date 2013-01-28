//
//  WebViewModal.h
//  imCore
//
//  Created by conis on 11-12-24.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "CoreGeneral.h"

//显示WebView的模态窗口
@interface WebViewDialog : NSObject<UIWebViewDelegate>{
  UIButton* _closeButton;
  UIWebView* _webView;
  UIView *_OAuthView;
  UIInterfaceOrientation _orientation;
  UIImage *closeImage;
}

@property (nonatomic, retain) UIImage *closeImage;
-(void) show: (NSURL *) url;
- (void) cancel: (id) sender;
@end
