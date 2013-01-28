//
//  ImageSlider.m
//  imCore
//
//  Created by conis on 11-12-31.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//
#import "ImageSlider.h"

@interface ImageSlider(Private)
-(void) createComponent;
-(void) setContentSize;
@end

@implementation ImageSlider
@synthesize delegate;

- (id)initWithFrame:(CGRect)frame
{
    self = [super initWithFrame:frame];
    if (self) {
      isClosed = NO;
      imageCount_ = 0;
      self.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
        // Initialization code
      [self createComponent];
      //监测方向
      [[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
      [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(orientationChanged:) name:@"UIDeviceOrientationDidChangeNotification" object:nil];
    }
    return self;
}

-(void) orientationChanged:(NSNotification *)notification
{
  //重新设置ContentSize
  [self setContentSize];
  [self changePage: nil];
}

-(void) createComponent
{
  CGRect rect = CGRectMake(0, 0, self.frame.size.width, self.frame.size.height);
  svImageView = [[UIScrollView alloc] initWithFrame: rect];
  svImageView.pagingEnabled = YES;
  svImageView.showsVerticalScrollIndicator = NO;
  svImageView.showsHorizontalScrollIndicator = NO;
  svImageView.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
  svImageView.delegate = self;
  [self addSubview: svImageView];
  [svImageView release];
  
  rect = CGRectMake(0, self.frame.size.height * 0.9, self.frame.size.width, 30);
  pageControl = [[UIPageControl alloc] initWithFrame: rect];
  pageControl.autoresizingMask = UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleBottomMargin; 
  pageControl.backgroundColor = [GraphicHelper rgba2Color:0 green:0 blue:0 alpha:0.5];
  [pageControl addTarget:self action:@selector(changePage: ) forControlEvents:UIControlEventValueChanged];
  //[[pageControl layer] setCornerRadius: 5];
  [self addSubview: pageControl];
  [pageControl release];
}

-(void) changePage: (id) sender
{
  CGFloat x = pageControl.currentPage * svImageView.frame.size.width;
  //NSLog(@"x: %.f", x);
  CGPoint pt = svImageView.contentOffset;
  pt.x = x;
  [svImageView setContentOffset: pt];
}

-(void) scrollViewDidScroll:(UIScrollView *)scrollView
{
  if(isClosed) return;
  CGFloat x = scrollView.contentOffset.x - scrollView.contentSize.width + scrollView.frame.size.width;
  if(x > 50){
    isClosed = YES;
    [self.delegate didImageSliderPlay];
  };
}

-(void) scrollViewDidEndDecelerating:(UIScrollView *)scrollView
{
  CGFloat x = scrollView.contentOffset.x;
  NSInteger index = ceil(x / scrollView.frame.size.width);
  if(pageControl.currentPage != index){
    pageControl.currentPage = index;
  }
}

-(void)dealloc
{
  [svImageView release];
  [pageControl release];
  //不能调用 super dealloc
  //[super dealloc];
  //[images release];
  //[super dealloc];
}

//创建Slider
-(void) addImages:(NSArray *)images
{
  imageCount_ = [images count];
  for(int i = 0; i < imageCount_; i ++){
    UIImageView *imgView = [[UIImageView alloc] initWithImage: [images objectAtIndex:i]];
    CGRect rect = CGRectMake(0, 0, self.frame.size.width, self.frame.size.height);
    rect.origin.x = i * (rect.size.width);
    [imgView setFrame: rect];
    imgView.contentMode = UIViewContentModeCenter;
    imgView.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleRightMargin;
    [svImageView addSubview: imgView];
    [imgView release];
  };
  
  //重新设置ContentSize以及PageControl
  [self setContentSize];
  pageControl.numberOfPages = imageCount_;
}

-(void) setContentSize
{
  CGFloat w = imageCount_ * self.frame.size.width;
  [svImageView setContentSize: CGSizeMake(w, self.frame.size.height)];
}

-(void) addHeaderImage: (UIImage *) image frame: (CGRect) rect
{
  UIImageView *imgView = [[UIImageView alloc] initWithImage: image];
  [imgView setFrame: rect];
  imgView.autoresizingMask = UIViewAutoresizingFlexibleLeftMargin;
  [self addSubview: imgView];
  [imgView release];
}
@end
