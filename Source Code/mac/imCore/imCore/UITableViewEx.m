//
//  MenuTableView.m
//  imCore
//
//  Created by conis on 11-12-23.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#import "UITableViewEx.h"
const int kPullElementIcon = 1;
const int kPullElementStatus = 2;
const int kPullElementActivity = 3;

@implementation UIPullToReloadView
@synthesize releaseMessage, direction, normalMessage, loadingMessage, iconPath, takeEffectHeight, status, padding, hideMySelf;

- (id)initWithFrame:(CGRect)frame
{
  self = [super initWithFrame:frame];
  if (self) {
    self.hideMySelf = YES;
    self.takeEffectHeight = 80;
    self.padding = 10;
    self.direction = kPullToReloadDirectionBottom;
    [self createComponent];
    // Initialization code
  }
  return self;
}

-(void) createComponent
{
  self.backgroundColor = [UIColor clearColor];
  [self layer].opacity = 0;
  //self.backgroundColor = [UIColor redColor];
  CGRect viewFrame = self.frame;
  //创建图片
  UIImage *img = [UIImage imageNamed: self.iconPath];
  CGSize imgSize = img.size;
  CGFloat top = viewFrame.size.height - (top * 2) - imgSize.height;
  if(top < 0) top = 0;
  //NSLog(@"top: %.f", top);
  CGRect rect = CGRectMake(self.padding, top, imgSize.width, imgSize.height);
  
  UILabel *lblImage = [[UILabel alloc] initWithFrame: rect];
  lblImage.backgroundColor = [GraphicHelper colorFromImage: img];
  lblImage.tag = kPullElementIcon;
  [self addSubview: lblImage];
  [lblImage release];
  
  CGFloat statusX = self.padding + imgSize.width + 10;
  rect = CGRectMake(statusX, 0, viewFrame.size.width - statusX - self.padding, viewFrame.size.height);
  //创建状态描述
  UILabel *lblStatus = [[UILabel alloc] initWithFrame:rect];
  lblStatus.text = self.normalMessage;
  lblStatus.backgroundColor = [UIColor clearColor];
  lblStatus.tag = kPullElementStatus;
  lblStatus.font = [UIFont systemFontOfSize: 14];
  [self addSubview: lblStatus];
  [lblStatus release];  
  
  //添加转轮
  UIActivityIndicatorView *activityView = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle: UIActivityIndicatorViewStyleGray];
  activityView.frame = CGRectMake(self.padding, (viewFrame.size.height - 20.0f) / 2, 20.0f, 20.0f);
  activityView.hidesWhenStopped = YES;
  activityView.tag = kPullElementActivity;
  [self addSubview: activityView];
  [activityView release];
}

//状态发生改变
-(void) statusChanged: (PullToReloadStatus) pullStatus
{
  if(self.status == pullStatus) return;     //状态一样
  UILabel *lblStatus = (UILabel*)[self viewWithTag: kPullElementStatus];
  UILabel *lblImage = (UILabel*)[self viewWithTag: kPullElementIcon];
  UIActivityIndicatorView *activityView = (UIActivityIndicatorView *) [self viewWithTag: kPullElementActivity];
  CGFloat angle = 2;
  self.status = pullStatus;
  BOOL showMe = YES;
  
  switch (self.status) {
    case kPullToReloadStatusRelease:
      lblStatus.text = self.releaseMessage;
      angle = 1;
      break;
    case kPullToReloadStatusLoading:
      lblStatus.text = self.loadingMessage;
      break;
    case kPullToReloadStatusHide:
      showMe = NO;
      break;
    default:
      angle = 2;
      lblStatus.text = self.normalMessage;
      break;
  };
  
  if(self.hideMySelf == showMe){
    self.hideMySelf = !showMe;
    [CoreGeneral displayView:self duration:.4 show: showMe];
  }
  
  //是否加载
  if(self.status == kPullToReloadStatusLoading){
    lblImage.hidden = YES;
    [activityView startAnimating];
  }else{
    lblImage.hidden = NO;
    [activityView stopAnimating];
  }
}
@end


@interface UITableViewEx(Private)
-(void) createSideView;
-(void) addSwipeViewTo:(UITableViewCell *)cell direction:(UISwipeGestureRecognizerDirection)direction;
-(void) swipe:(UISwipeGestureRecognizer *)recognizer;
-(CGFloat) getScrollOffset: (UIScrollView *) scrollView;
@end

@implementation UITableViewEx
@synthesize sideSwipeView, sideSwipeCell, sideSwipeDirection, animatingSideSwipe, pushAnimation, rightOffset, tableExDelegate, pullView, pullViewHeight, checkPullView;

-(void) dealloc
{
  tableExDelegate = nil;
  [pullView release];
  [sideSwipeView release];
  [super dealloc];
}

-(id) initWithFrame:(CGRect)frame
{
  self = [super initWithFrame:frame];
  if (self) {
    self.rightOffset = 10;
    self.pullViewHeight = 60;
    self.checkPullView = NO;
    [self createSideView];
  }
  return self;
}

#pragma -
#pragma mark 重载ScrollView
//scroll相关的方法，需要由调用者提交
//开始滚动条
-(void)scrollViewWillBeginDragging:(UIScrollView *) scrollView
{
  [self removeSideSwipeView:YES];
  if(self.pullView == nil) return;
  if(![self.tableExDelegate tableView:self willDisplayPullView:self.pullView]){
    self.pullView.hidden = YES;
    self.checkPullView = NO;
    return;
  }
  //正在加载中，不用处理
  if(pullView.status == kPullToReloadStatusLoading) return;
  
  int offset = 5;
  self.checkPullView = YES;
  pullView.hidden = NO;
  //判断puffView应该在上面还是在下面
  CGRect rect = pullView.frame;
  [pullView statusChanged: kPullToReloadStatusHold];
  if(pullView.direction == kPullToReloadDirectionTop){
    rect.origin.y = -rect.size.height - offset;
  }else{
    rect.origin.y = scrollView.contentSize.height + offset;
  };
  
  pullView.frame = rect;
}

//滚动中
-(void) scrollViewDidScroll:(UIScrollView *)scrollView
{
  if(!self.checkPullView) return;
  if(pullView.status == kPullToReloadStatusLoading || pullView.status == kPullToReloadStatusHide) return;
  //判断状态的改变，根据状态改变文字
  
  CGFloat offset = [self getScrollOffset: scrollView];
  PullToReloadStatus status = kPullToReloadStatusHold;
  if(offset >= pullView.takeEffectHeight) status = kPullToReloadStatusRelease;
  [pullView statusChanged:status];
}

//滚动松开
-(void) scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate
{
  if(!self.checkPullView) return;
  CGFloat offset = [self getScrollOffset: scrollView];
  
  //触发重新加载
  if(pullView.status == kPullToReloadStatusRelease && offset >= pullView.takeEffectHeight){
    [pullView statusChanged: kPullToReloadStatusLoading];
    //NSLog(@"status:%d", pullView.status);
    CGSize scrollSize = [scrollView contentSize];
    scrollSize.height += pullView.frame.size.height;
    [scrollView setContentSize: scrollSize];
    //如果是在上方，则需要将内容向下移s
    if(pullView.direction == kPullToReloadDirectionTop){
      scrollView.contentInset = UIEdgeInsetsMake(pullView.frame.size.height, 0 , 0, 0);
    };
    
    [self.tableExDelegate tableView:self didScrollReload:scrollView];
  }else{
    [pullView statusChanged: kPullToReloadStatusHide];
  }
}

-(CGFloat) getScrollOffset: (UIScrollView *) scrollView
{
  CGFloat offset = 0;
  if(pullView.direction == kPullToReloadDirectionTop){
    offset = abs(scrollView.contentOffset.y);
  }else{
    offset = scrollView.contentOffset.y + scrollView.frame.size.height - scrollView.contentSize.height;
  };
  return offset;
}

#pragma -
#pragma mark 重载TableView
-(NSIndexPath *) tableView:(UITableView *)tableView willSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
  [self removeSideSwipeView:YES];
  return indexPath;
}

//滚动条到顶
- (BOOL)scrollViewShouldScrollToTop:(UIScrollView *)scrollView
{
  [self removeSideSwipeView:YES];
  return YES;
}

//动画完成
- (void)animationDidStopAddingSwipeView:(NSString *)animationID finished:(NSNumber *)finished context:(void *)context
{
  self.animatingSideSwipe = NO;
  //NSLog(@"animation is end");
}

- (void)animationDidStopOne:(NSString *)animationID finished:(NSNumber *)finished context:(void *)context
{
  [UIView beginAnimations:nil context:nil];
  [UIView setAnimationDuration:0.2];
  if (sideSwipeDirection == UISwipeGestureRecognizerDirectionRight)
  {
    if (self.pushAnimation)
      sideSwipeView.frame = CGRectMake(-sideSwipeView.frame.size.width, sideSwipeView.frame.origin.y,sideSwipeView.frame.size.width, sideSwipeView.frame.size.height);
    sideSwipeCell.frame = CGRectMake(0, sideSwipeCell.frame.origin.y, sideSwipeCell.frame.size.width, sideSwipeCell.frame.size.height);
  }else{
    if (self.pushAnimation)
      sideSwipeView.frame = CGRectMake(sideSwipeView.frame.size.width ,sideSwipeView.frame.origin.y,sideSwipeView.frame.size.width, sideSwipeView.frame.size.height);
    sideSwipeCell.frame = CGRectMake(0, sideSwipeCell.frame.origin.y, sideSwipeCell.frame.size.width, sideSwipeCell.frame.size.height);
  }
  [UIView setAnimationDelegate:self];
  [UIView setAnimationDidStopSelector:@selector(animationDidStopTwo:finished:context:)];
  [UIView setAnimationCurve:UIViewAnimationCurveLinear];
  [UIView commitAnimations];
}

// The final step in a bounce animation is to move the side swipe completely offscreen
- (void)animationDidStopTwo:(NSString *)animationID finished:(NSNumber *)finished context:(void *)context
{
  [UIView commitAnimations];
  [UIView beginAnimations:nil context:nil];
  [UIView setAnimationDuration:0.2];
  if (sideSwipeDirection == UISwipeGestureRecognizerDirectionRight)
  {
    if (self.pushAnimation)
      sideSwipeView.frame = CGRectMake(-sideSwipeView.frame.size.width ,sideSwipeView.frame.origin.y,sideSwipeView.frame.size.width, sideSwipeView.frame.size.height);
    sideSwipeCell.frame = CGRectMake(0, sideSwipeCell.frame.origin.y, sideSwipeCell.frame.size.width, sideSwipeCell.frame.size.height);
  }
  else
  {
    if (self.pushAnimation)
      sideSwipeView.frame = CGRectMake(sideSwipeView.frame.size.width ,sideSwipeView.frame.origin.y,sideSwipeView.frame.size.width, sideSwipeView.frame.size.height);
    sideSwipeCell.frame = CGRectMake(0, sideSwipeCell.frame.origin.y, sideSwipeCell.frame.size.width, sideSwipeCell.frame.size.height);
  }
  [UIView setAnimationDelegate:self];
  [UIView setAnimationDidStopSelector:@selector(animationDidStopThree:finished:context:)];
  [UIView setAnimationCurve:UIViewAnimationCurveLinear];
  [UIView commitAnimations];
}

// When the bounce animation is completed, remove the side swipe view and reset some state
- (void)animationDidStopThree:(NSString *)animationID finished:(NSNumber *)finished context:(void *)context
{
  animatingSideSwipe = NO;
  self.sideSwipeCell = nil;
  [sideSwipeView removeFromSuperview];
}

#pragma -
#pragma mark Public Method

-(void) appendPullView:(UIPullToReloadView *)view
{
  view.hidden = YES;
  self.pullView = view;
  [self addSubview: self.pullView];
}

-(void) resetPullView
{
  //重新计算pullView的位置
  if(self.pullView == nil) return;
  if(pullView.status != kPullToReloadStatusLoading) return;
  //加载完成，改变状态
  [pullView statusChanged: kPullToReloadStatusHide];
  self.checkPullView = YES;
  
  //重置位置
  if(pullView.direction == kPullToReloadDirectionTop){
    [self setContentInset: UIEdgeInsetsMake(0, 0, 0, 0)];
  };
  
  /*
  //如果是显示在下部，则要更改contentSize
  CGSize scrollSize = self.contentSize;
  scrollSize.height -= pullView.frame.size.height;
  [self setContentSize: scrollSize];
  */
}
//删除菜单
-(void) removeSideSwipeView:(BOOL)animated
{
  //NSLog(@"step 1, %@, %i", sideSwipeCell, animatingSideSwipe);
  // Make sure we have a cell where the side swipe view appears and that we aren't in the middle of animating
  if (!sideSwipeCell || animatingSideSwipe) return;
  //NSLog(@"step 2");

  if (animated)
  {
    // The first step in a bounce animation is to move the side swipe view a bit offscreen
    [UIView beginAnimations:nil context:nil];
    [UIView setAnimationDuration:0.2];
    if (sideSwipeDirection == UISwipeGestureRecognizerDirectionRight)
    {
      if (self.pushAnimation)
        sideSwipeView.frame = CGRectMake(-sideSwipeView.frame.size.width ,sideSwipeView.frame.origin.y,sideSwipeView.frame.size.width, sideSwipeView.frame.size.height);
      sideSwipeCell.frame = CGRectMake(0, sideSwipeCell.frame.origin.y, sideSwipeCell.frame.size.width, sideSwipeCell.frame.size.height);
    }else{
      if (self.pushAnimation)
        sideSwipeView.frame = CGRectMake(sideSwipeView.frame.size.width,sideSwipeView.frame.origin.y,sideSwipeView.frame.size.width, sideSwipeView.frame.size.height);
      sideSwipeCell.frame = CGRectMake(0, sideSwipeCell.frame.origin.y, sideSwipeCell.frame.size.width, sideSwipeCell.frame.size.height);
    }
    self.animatingSideSwipe = YES;
    [UIView setAnimationDelegate:self];
    [UIView setAnimationDidStopSelector:@selector(animationDidStopOne:finished:context:)];
    
    [UIView commitAnimations];
  }else{
    self.animatingSideSwipe = NO;
    [sideSwipeView removeFromSuperview];
    sideSwipeCell.frame = CGRectMake(0,sideSwipeCell.frame.origin.y,sideSwipeCell.frame.size.width, sideSwipeCell.frame.size.height);
    self.sideSwipeCell = nil;
  }
}

//重新加载数据
-(void) reloadData{
  [self resetPullView];
  [super reloadData];
}

#pragma -
#pragma mark Private Method

//隐藏下接刷新的部分
-(void) hidePullView
{
  
}

/*
//向上或者向下拉刷新
-(void) initPufllView
{
  CGRect rect = CGRectMake(0, -50, self.frame.size.width, self.pullViewHeight);
  pullView = [[UIView alloc] initWithFrame: rect];
  pullView.backgroundColor = [UIColor grayColor];
  
  //添加图片
  UILabel *lblImage = [[UILabel alloc] initWithFrame:rect];
  //rect = CGRectMake(0, 
  UILabel *lbl = [[UILabel alloc] initWithFrame:rect];
  [self addSubview: pullView];
  [pullView release];
}
*/

//创建菜单和手势
-(void) createSideView
{
  //创建cell的菜单
  self.sideSwipeView = [[UIView alloc] initWithFrame:CGRectZero];
  self.sideSwipeView.backgroundColor = [UIColor whiteColor];
  
  //添加手势
  // Setup a right swipe gesture recognizer
  UISwipeGestureRecognizer* rightSwipeGestureRecognizer = [[[UISwipeGestureRecognizer alloc] initWithTarget:self action:@selector(swipe:)] autorelease];
  rightSwipeGestureRecognizer.direction = UISwipeGestureRecognizerDirectionRight;
  [self addGestureRecognizer:rightSwipeGestureRecognizer];
  
  // Setup a left swipe gesture recognizer
  UISwipeGestureRecognizer* leftSwipeGestureRecognizer = [[[UISwipeGestureRecognizer alloc] initWithTarget:self action:@selector(swipe:)] autorelease];
  leftSwipeGestureRecognizer.direction = UISwipeGestureRecognizerDirectionLeft;
  [self addGestureRecognizer:leftSwipeGestureRecognizer];
  [self.sideSwipeView release];
}


//添加菜单到Cell当中
-(void) addSwipeViewTo:(UITableViewCell *)cell direction:(UISwipeGestureRecognizerDirection)direction
{
  //NSLog(@"addSwipeViewTo");
  // Change the frame of the side swipe view to match the cell
  self.sideSwipeView.frame = cell.frame;
  
  // Add the side swipe view to the table below the cell
  [self insertSubview: self.sideSwipeView belowSubview:cell];
  [self.sideSwipeView.superview sendSubviewToBack: self.sideSwipeView];
  
  // Remember which cell the side swipe view is displayed on and the swipe direction
  self.sideSwipeCell = cell;
  sideSwipeDirection = direction;
  
  CGRect cellFrame = cell.frame;
  if (self.pushAnimation)
  {
    // Move the side swipe view offscreen either to the left or the right depending on the swipe direction
    sideSwipeView.frame = CGRectMake(direction == UISwipeGestureRecognizerDirectionRight ? -cellFrame.size.width : cellFrame.size.width, cellFrame.origin.y, cellFrame.size.width, cellFrame.size.height);
  }else{
    // Move the side swipe view to offset 0
    sideSwipeView.frame = CGRectMake(0, cellFrame.origin.y, cellFrame.size.width, cellFrame.size.height);
  }
  
  // Animate in the side swipe view
  animatingSideSwipe = YES;
  [UIView beginAnimations:nil context:nil];
  [UIView setAnimationDuration:0.2];
  [UIView setAnimationDelegate:self];
  [UIView setAnimationDidStopSelector:@selector(animationDidStopAddingSwipeView:finished:context:)];
  if (self.pushAnimation)
  {
    // Move the side swipe view to offset 0
    // While simultaneously moving the cell's frame offscreen
    // The net effect is that the side swipe view is pushing the cell offscreen
    sideSwipeView.frame = CGRectMake(0, cellFrame.origin.y, cellFrame.size.width, cellFrame.size.height);
  }
  cell.frame = CGRectMake(direction == UISwipeGestureRecognizerDirectionRight ? cellFrame.size.width - self.rightOffset : -cellFrame.size.width + self.rightOffset, cellFrame.origin.y, cellFrame.size.width, cellFrame.size.height);
  [UIView commitAnimations];
}

//根据手势处理菜单
-(void) swipe:(UISwipeGestureRecognizer *)recognizer
{
  //通过手势在到对应的Cell
  if(!recognizer && recognizer.state != UIGestureRecognizerStateEnded) return;
  CGPoint location = [recognizer locationInView: self];
  NSIndexPath *indexPath = [self indexPathForRowAtPoint:location];
  UITableViewCell *cell = [self cellForRowAtIndexPath: indexPath];
  //是否允许显示菜单
  if(![self.tableExDelegate tableView:self willDisplaySideMenu:cell forRowAtIndexPath:indexPath sideSwipView: self.sideSwipeView]) return;
  // If we are already showing the swipe view, remove it
  if (cell.frame.origin.x != 0)
  {
    [self removeSideSwipeView:YES];
    return;
  }
  
  // Make sure we are starting out with the side swipe view and cell in the proper location
  [self removeSideSwipeView:NO];
  
  // If this isn't the cell that already has thew side swipe view and we aren't in the middle of animating
  // then start animating in the the side swipe view
  if (cell!= self.sideSwipeCell && !animatingSideSwipe){
    [self addSwipeViewTo:cell direction: recognizer.direction];
  }
}

@end
