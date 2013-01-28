//
//  RootController.m
//  TimeTracker
//
//  Created by yi conis on 4/27/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "RootController.h"
#import "imCore/UIRibbon.h"

@interface RootController ()
-(void) createComponent;
@end

@implementation RootController

-(void) dealloc
{
  //dealloc
  [super dealloc];
}

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
      [self createComponent];
    }
  
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
	// Do any additional setup after loading the view.
}

- (void)viewDidUnload
{
    [super viewDidUnload];
    // Release any retained subviews of the main view.
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
  BOOL isPad = [CoreGeneral sharedManager].isPad;
  if(isPad){
    [mainView shouldAutorotateToInterfaceOrientation: interfaceOrientation];
  }
  
  return isPad;
}

-(void) didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation
{
  //
}

#pragma -
#pragma mark 私有方法
//创建组件
-(void) createComponent
{
  //self.view.backgroundColor = [UIColor redColor];
  //return;
  CGRect rect = self.view.bounds;
  //rect.origin.x = 10;
  //rect.origin.y = 20;
  mainView = [[MainView alloc] initWithFrame: rect];
  mainView.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
  [self.view addSubview: mainView];
  //判断使用哪个首页
  NSString *index = @"phone";
  if([CoreGeneral sharedManager].isPad){
    index = @"pad";
  };
  
  [mainView loadSplash];
  mainView.homePage = [NSString stringWithFormat: @"http://api1.imtime.com/%@.html", index];
  //mainView.homePage = [NSString stringWithFormat: @"http://localhost:3000/phone.html"];
  [mainView loadHomePage];
  [mainView release];
}

@end
