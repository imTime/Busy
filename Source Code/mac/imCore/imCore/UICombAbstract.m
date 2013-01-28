//
//  UIComb.m
//  imCore
//
//  Created by yi conis on 5/10/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "UICombAbstract.h"

@interface UICombAbstract(Private)
-(CGRect) getCellFrame: (NSInteger) index;
-(void) reContentSize;
@end

@implementation UICombAbstract
@synthesize rowCount = rowCount_, colCount = colCount_, cellBeginTag = cellBeginTag_,
cellWidth = cellWidth_, cellHeight = cellHeight_, cellCount = cellCount_,
horizontalSpace = horizontalSpace_, verticalSpace = verticalSpace_;

-(void) dealloc
{
  [svMain release];
  [pcMain release];
  [super dealloc];
}

- (id)initWithFrame:(CGRect)frame
{
    self = [super initWithFrame:frame];
    if (self) {
        // Initialization code
      self.cellBeginTag = 1000;
      [self createComponent];
    }
    return self;
}

//创建组件
-(void) createComponent
{
  //创建UIScrollView
  svMain = [[UIScrollView alloc] initWithFrame: self.bounds];
  [self addSubview: svMain];
  svMain.pagingEnabled = YES;
  //svMain.scrollEnabled = NO;
  svMain.showsHorizontalScrollIndicator = NO;
  svMain.showsVerticalScrollIndicator = NO;
  svMain.delegate = self;
  svMain.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  [svMain release];
  
  //创建PageControl
  CGRect rect = CGRectMake(0, self.frame.size.height - verticalSpace_, self.frame.size.width, verticalSpace_);
  //rect = CGRectMake(0, 0, 320, 300);
  pcMain = [[UIPageControl alloc] initWithFrame: rect];
  pcMain.backgroundColor = [GraphicHelper transparentBlackColor: .5];
  pcMain.autoresizingMask = UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleBottomMargin; 
  [pcMain addTarget:self action:@selector(changePage: ) forControlEvents:UIControlEventValueChanged];
  //[[pageControl layer] setCornerRadius: 5];
  [self addSubview: pcMain];
  [pcMain release];
}


//更改页
-(void) changePage: (id) sender
{
  CGFloat x = pcMain.currentPage * svMain.frame.size.width;
  CGPoint pt = svMain.contentOffset;
  pt.x = x;
  [svMain setContentOffset: pt animated: YES];
}


//滚动完成
-(void) scrollViewDidEndDecelerating:(UIScrollView *)scrollView
{
  CGFloat x = scrollView.contentOffset.x;
  NSInteger index = ceil(x / scrollView.frame.size.width);
  if(pcMain.currentPage != index){
    pcMain.currentPage = index;
  };
}

//获取Cell的Frame
-(CGRect) getCellFrame: (NSInteger) index
{
  index ++;
  //每屏有多少个Cell
  CGFloat countOfScreen = colCount_ * rowCount_;
  NSInteger indexOfScreen = ceil(index / countOfScreen) - 1;
  
  //取最后一屏有多少个
  NSInteger lastScreenCount = index % (NSInteger)countOfScreen;
  if(lastScreenCount == 0) lastScreenCount = countOfScreen;
  
  //取在第几列
  NSInteger colOfScreen;
  colOfScreen = lastScreenCount % (NSInteger)colCount_;
  colOfScreen --;
  if(colOfScreen < 0) colOfScreen = colCount_ - 1; 
  
  //colOfScreen = colOfScreen == 0 ? 1 : 0;
  
  //取在屏的第几行
  NSInteger rowOfScreen = ceil(lastScreenCount / colCount_) - 1;
  
  //计算x的位置
  CGFloat x =  (indexOfScreen * svMain.frame.size.width) +  horizontalSpace_ + (colOfScreen * (cellWidth_ + horizontalSpace_));
  //计算y的位置
  CGFloat y = verticalSpace_ + (rowOfScreen * (cellHeight_ + verticalSpace_));
  CGRect rect = CGRectMake(x, y, cellWidth_, cellHeight_);
  return  rect;
}

//渲染
-(void) render:(NSInteger)count
{
  /*
  CGRect rect = [self getCellFrame:5];
  NSLog(@"x: %.f, y: %.f, w: %.f, h: %.f", rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
  return;
  */
  
  self.cellCount = count;
  for(int i = 0; i < count; i++){
    CGRect rect = [self getCellFrame:i];
    //NSLog(@"x: %.f, y: %.f, w: %.f, h: %.f", rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
    UIView *cell = [self createCell:i frame:rect];
    cell.tag = [self getTagWith: i];
    [svMain addSubview: cell];
    //[cell release];
  };
  [self reContentSize];
}

//创建cell，由子类重载，将Cell加入到ScrollView，并且为Cell设置Tag
-(UIView *) createCell:(NSInteger)index frame:(CGRect)frame
{
  return nil;
}

//重新布局
-(void) reLayout:(BOOL)animated
{
  NSInteger tag;
  for(int i = 0; i < cellCount_; i ++){
    tag = [self getTagWith: i];
    CGRect frame = [self getCellFrame: i];
    //NSLog(@"i: %d, x: %.f, y: %.f, w: %.f, h: %.f", i, frame.origin.x, frame.origin.y, frame.size.width, frame.size.height);
    UIView *cell = [svMain viewWithTag: tag];
    if(cell == nil) continue;
    if(animated){
      [CoreGeneral viewSizeAnimation:cell duration:.4 frame:frame];
    }else{
      cell.frame = frame;
    };    //end if
  }       //end for
  [self reContentSize];
}

//重置scrollView的ContentSize，设置页总数
-(void) reContentSize
{
  NSInteger screenCount = (NSInteger)ceil(cellCount_ / (rowCount_ * colCount_));
  pcMain.numberOfPages = screenCount;
  pcMain.hidden = screenCount == 1;
  CGFloat w = svMain.frame.size.width * screenCount;
  CGSize size = CGSizeMake(w, svMain.frame.size.height);
  [svMain setContentSize: size];
}

-(NSInteger) getTagWith:(NSInteger)index
{
  return self.cellBeginTag + index;
}
@end
