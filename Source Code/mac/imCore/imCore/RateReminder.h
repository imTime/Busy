//
//  RateAlertView.h
//  imCore
//
//  Created by conis on 12-1-23.
//  Copyright (c) 2012年 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "CoreGeneral.h"
#import "UIRating.h"

/*
 评论提醒
 1.弹出一个评分提示的AlertView，用户可以评分，如果评分小于4，则让用户写邮件反馈。否则跳转到App Store让用户评价
*/
@protocol RateReminderDelegate <NSObject>
@required
-(void) onReminderClosed: (CGFloat) rating rateOnAppStore: (BOOL) rateOnAppStore;
@end

@interface RateReminder : NSObject<UIRatingDelegate, UIAlertViewDelegate>{
  UIImage *noramlImage;
  UIImage *highlightImage;
  CGFloat rating;
  UIButton *btnOK;
  id<RateReminderDelegate> delegate;
}

@property CGFloat rating;
@property (nonatomic, assign) id<RateReminderDelegate> delegate;
@property (nonatomic, retain) UIImage *noramlImage;
@property (nonatomic, retain) UIImage *highlightImage;
-(void) show;
@end
