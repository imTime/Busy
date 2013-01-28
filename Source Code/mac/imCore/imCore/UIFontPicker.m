//
//  FontPicker.m
//  imCore
//
//  Created by conis on 12-1-19.
//  Copyright (c) 2012年 __MyCompanyName__. All rights reserved.
//

#import "UIFontPicker.h"

@interface UIFontPicker(Private)
-(void) createComponent;
-(NSArray *) getFonts;
@end

@implementation UIFontPicker
@synthesize showFontSizeSlider, imagePath, delegate, allFonts, safeFonts, onlySafeFont;

const NSInteger kSliderHeight = 23;
const NSInteger kSliderMagin = 5;

-(void) dealloc
{
  [allFonts release];
  [safeFonts release];
  [lblSimple release];
  [lblFontSize release];
  [tvFonts release];
  [sldFontSize release];
  [super dealloc];
}

-(void) willMoveToWindow:(UIWindow *)newWindow
{
  [tvFonts reloadData];
}

- (id)initWithFrame:(CGRect)frame resources: (NSString *) resources
{
    self = [super initWithFrame:frame];
    if (self) {
        // Initialization code
      self.onlySafeFont = NO;
      self.imagePath = resources;
      [self createComponent];
    }
    return self;
}

//创建组件
-(void) createComponent
{
  NSInteger sliderX = 0;
  NSInteger tableHeight = self.frame.size.height - kSliderHeight - kSliderMagin * 2;
  NSInteger w = self.frame.size.width;
  //创建TableView
  CGRect rect = CGRectMake(0, 0, w, tableHeight);
  tvFonts = [[UITableView alloc] initWithFrame:rect];
  tvFonts.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  tvFonts.delegate = self;
  tvFonts.dataSource = self;
  [self addSubview:tvFonts];
  [tvFonts release];
  
  /*
  //创建字体大小提示
  UILabel *lblCaption = [[UILabel alloc] init];
  lblCaption.text = @"Size";
  lblCaption.font = [UIFont systemFontOfSize: 15];
  lblCaption.frame = CGRectMake(0, tableHeight + kSliderMagin, 20, kSliderHeight);
  [self addSubview: lblCaption];
  [lblCaption sizeToFit];
  sliderX = lblCaption.frame.size.width + 10;
  [lblCaption release];
  */
  
  //创建Slide
  rect = CGRectMake(sliderX, tableHeight + kSliderMagin, w - sliderX, kSliderHeight);
  sldFontSize = [[UISlider alloc] initWithFrame: rect];
  //绑定事件
  //按下
  [sldFontSize addTarget:self action:@selector(sliderTouchBegan:) forControlEvents:UIControlEventTouchDown];
  //离开
  [sldFontSize addTarget:self action:@selector(sliderTouchEnd:) forControlEvents:UIControlEventTouchUpInside |  UIControlEventTouchUpOutside];
  sldFontSize.autoresizingMask = UIViewAutoresizingFlexibleWidth;
  //改变值
  [sldFontSize addTarget:self action:@selector(sliderChanged:) forControlEvents:UIControlEventValueChanged];
  
  sldFontSize.maximumValue = 90;
  sldFontSize.minimumValue = 6;
  sldFontSize.value = 14;
  [self addSubview: sldFontSize];
  [sldFontSize release];
  
  //创建示例文本
  rect = CGRectMake(0, 0, w, tableHeight);
  lblSimple = [[UILabel alloc] initWithFrame: rect];
  lblSimple.backgroundColor = [UIColor whiteColor];
  lblSimple.textAlignment = UITextAlignmentCenter;
  lblSimple.text = NSLocalizedString(@"font_picker_sample", nil);
  lblSimple.layer.opacity = 0;
  [self addSubview:lblSimple];
  [lblSimple release];
  
  //创建font size的提示
  UIImage *bgImage = [UIImage imageNamed:[NSString stringWithFormat:@"%@font-size.png", self.imagePath]];
  rect = CGRectMake(0, tableHeight - 48, 58, 48);
  lblFontSize = [[UILabel alloc] initWithFrame:rect];
  lblFontSize.backgroundColor = [UIColor colorWithPatternImage: bgImage];
  lblFontSize.opaque = NO;
  lblFontSize.layer.opacity = 0;
  lblFontSize.textAlignment = UITextAlignmentCenter;
  lblFontSize.font = [UIFont systemFontOfSize: 12];
  //UIEdgeInsets insets = {0, 5, 0, 5};
  [self addSubview: lblFontSize];
  [lblFontSize release];
}

-(NSArray *) getFonts
{
  return self.onlySafeFont ? self.safeFonts : self.allFonts;
}
#pragma -
#pragma mark 对TableView(Fonts)的重载及委托
//选中某行
- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
  UITableViewCell *cell = [tableView cellForRowAtIndexPath:indexPath];
  NSString *font = cell.textLabel.text;
  lblSimple.font = [UIFont fontWithName:font size:sldFontSize.value];
  [self.delegate onChangeFont: lblSimple.font];
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section //返回目标行数
{
  return [[self getFonts] count];
}

//指定高度
- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
  return 40;
}

//创建单元格
- (UITableViewCell *) tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
  
  static NSString *CellIdentifier=@"tag" ;
  UITableViewCell *cell=[tableView dequeueReusableCellWithIdentifier:CellIdentifier];
  if (cell==nil ) {
    cell=[[[ UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:CellIdentifier] autorelease];
  }
  
  NSUInteger row= [indexPath row ];
  NSString *fontName = [[self getFonts] objectAtIndex:row];
  [cell textLabel].text = fontName;
  [cell.textLabel setFont:[UIFont fontWithName:fontName size:16]];
  return cell;
}

#pragma -
#pragma mark 改变字体的事件
-(void) sliderChanged:(UISlider *) slider
{
  //设置位置
  CGRect rect = lblFontSize.frame;
  int maxWidth = self.frame.size.width - rect.size.width;
  float w = sldFontSize.frame.size.width;
  rect.origin.x = (w / (sldFontSize.maximumValue - sldFontSize.minimumValue) * sldFontSize.value) - rect.size.width + 10;
  if(rect.origin.x < 0) rect.origin.x = 0;
  if(rect.origin.x > maxWidth) rect.origin.x = maxWidth;
  lblFontSize.frame = rect;
  lblFontSize.text = [NSString stringWithFormat:@"%.fpx", slider.value];
  
  UITableViewCell *cell = [tvFonts cellForRowAtIndexPath:[tvFonts indexPathForSelectedRow]];
  NSString *fontName = lblSimple.font.familyName;
  if(cell != NULL) fontName = cell.textLabel.text;
  lblSimple.font = [UIFont fontWithName:fontName size:sldFontSize.value];
}

//开始touch slider
- (void) sliderTouchBegan: (UISlider *) slider
{
  [CoreGeneral displayView:lblFontSize duration:0.4 show: YES];
  [CoreGeneral displayView:lblSimple duration:0.4 opacity:0.9];
}

//结束Touch slider
- (void) sliderTouchEnd: (UISlider *) slider
{
  [CoreGeneral displayView:lblFontSize duration:0.4 show: NO];
  [CoreGeneral displayView:lblSimple duration:0.4 show:NO];
  //改变字体
  [self.delegate onChangeFontSize: slider.value];
}

#pragma -
#pragma mark Public Method
//设置字体大小范围
-(void) setFontSizeRange:(NSRange)range
{
  sldFontSize.minimumValue = range.location;
  sldFontSize.maximumValue = range.length;
}

//设置字体大小
-(void) setCurrentFontSize:(CGFloat)fontSize
{
  sldFontSize.value = fontSize;
}

//设置字体
-(void) setCurrentFont:(UIFont *)font
{
  lblSimple.font = font;
  NSInteger index = 0;
  //sldFontSize.value = font.pointSize;
  for(NSString *item in allFonts){
    if([item isEqualToString: font.fontName]){
      NSIndexPath *path = [NSIndexPath indexPathForRow:index inSection:0];
      [tvFonts selectRowAtIndexPath:path animated:YES scrollPosition:UITableViewScrollPositionNone];
      break;
    };
    
    index ++;
  };
}

//加载字体
-(void) reloadData
{
  [tvFonts reloadData];
}
@end
