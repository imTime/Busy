//
//  MenuTableView.h
//  imCore
//
//  Created by conis on 11-12-23.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "CoreGeneral.h"
#import <math.h>

typedef enum {
	kPullToReloadStatusRelease = 0,
	kPullToReloadStatusLoading	= 1,
	kPullToReloadStatusHold = 2,
  kPullToReloadStatusHide = 3
} PullToReloadStatus;

typedef enum {
  kPullToReloadDirectionTop = 0,
  kPullToReloadDirectionBottom = 1
} PullToReloadDirection;

//拖拽重新加载的的view
@interface UIPullToReloadView: UIView{
  NSString *normalMessage;
  NSString *releaseMessage;
  NSString *loadingMessage;
  NSString *iconPath;
  PullToReloadDirection direction;      //是否向下推重新加载
  NSInteger takeEffectHeight;                 //hold到释放生效的高度
  PullToReloadStatus status;
  CGFloat padding;        //边距
  BOOL hideMySelf;        //隐藏
}

@property (nonatomic, retain) NSString *normalMessage;
@property (nonatomic, retain) NSString *releaseMessage;
@property (nonatomic, retain) NSString *loadingMessage;
@property (nonatomic, retain) NSString *iconPath;
@property (nonatomic) PullToReloadDirection direction;
@property (nonatomic) PullToReloadStatus status;
@property (nonatomic) NSInteger takeEffectHeight;
@property (nonatomic) CGFloat padding;
@property (nonatomic) BOOL hideMySelf;

-(void) createComponent;
-(void) statusChanged: (PullToReloadStatus) pullStatus;
@end

@protocol UITableViewExDelegate <NSObject>
-(BOOL) tableView:(UITableView *)tableView willDisplaySideMenu: (UITableViewCell *) cell forRowAtIndexPath:(NSIndexPath *)indexPath sideSwipView: (UIView *) sideView;
//滚动重新加载数据
-(void) tableView:(UITableView *)tableView didScrollReload: (UIScrollView *) scrollView;
//
-(BOOL) tableView:(UITableView *)tableView willDisplayPullView: (UIPullToReloadView *) pullView;
@end

//TableViewEx
@interface UITableViewEx: UITableView<UITableViewDelegate, UITableViewDataSource>{
  UIView *sideSwipeView;
  UITableViewCell *sideSwipeCell;
  BOOL animatingSideSwipe;
  UISwipeGestureRecognizerDirection sideSwipeDirection;
  BOOL pushAnimation;
  CGFloat rightOffset;      //在右边的偏移量
  id<UITableViewExDelegate> tableExDelegate;
  UIPullToReloadView *pullView;
  BOOL checkPullView;
}

@property (nonatomic, retain) UIPullToReloadView *pullView;
@property (nonatomic, retain) UIView *sideSwipeView;
@property (nonatomic) BOOL animatingSideSwipe;
@property (nonatomic) BOOL pushAnimation;
@property (nonatomic) CGFloat rightOffset;
@property (nonatomic) CGFloat pullViewHeight;
@property (nonatomic, retain) UITableViewCell* sideSwipeCell;
@property (nonatomic) UISwipeGestureRecognizerDirection sideSwipeDirection;
@property (nonatomic, retain) id<UITableViewExDelegate> tableExDelegate;
@property (nonatomic) BOOL checkPullView;

-(void) hidePullView;
-(void) removeSideSwipeView: (BOOL) animated;
-(void)scrollViewWillBeginDragging:(UIScrollView *) scrollView;
-(void) scrollViewDidScroll:(UIScrollView *)scrollView;
-(void) scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate;
-(void) appendPullView: (UIPullToReloadView *) view;
@end

