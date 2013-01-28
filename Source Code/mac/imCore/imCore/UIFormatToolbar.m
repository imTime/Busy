//
//  FormatToolbar.m
//  imCore
//
//  Created by conis on 12-1-19.
//  Copyright (c) 2012年 __MyCompanyName__. All rights reserved.
//

#import "UIFormatToolbar.h"

@interface UIFormatToolbar(Private)
-(void) createComponent;
-(void) createFormatButton;
-(UIButton *) createDragButton;
-(UIImage *) getImage:(NSString *)imageName fileType:(NSString *)fileType;
-(UIImage *)getImage:(NSString *)imageName;
-(UIButton *) createButton:(NSString *)title frame:(CGRect)frame image:(NSString *) image;
-(NSInteger) getFormatButtonX: (NSInteger) index;
-(void) resetToolbarContentSize;
-(void) clickedFormatButton: (UIButton *) sender;
-(NSDictionary *) readFormatToolbarConfig;
-(void) setFormatToolbarFromConfig;
-(void) saveFormatToolbarContentOffset: (CGPoint) point;
-(void) saveFormatToolbarPosition: (CGPoint) point;
-(void) saveFormatToolbarConfig: (NSDictionary *) dict;
-(void) movePointer: (NSInteger) tag;
-(NSArray *) getWebSafeFonts;
-(NSArray *) getAllFonts;
@end

@implementation UIFormatToolbar
@synthesize toolbarStyle, imagePath, redoCount, undoCount, delegate, lastClickButton, toolbarHeight, additionalPanelHeight, additionalPanelOpened;

const NSInteger smallFormatButtonWidth = 44;
const NSInteger largeFormatButtonWidth = 64;
const NSInteger smallToolbarHeight = 63;
const NSInteger largeToolbarHeight = 83;
const NSInteger smallDragButtonWidth = 25;
const NSInteger largeDragButtonWidth = 33;
const NSInteger smallFormatButtonSpace = 3;
const NSInteger largeFormatButtonSpace = 14;
const NSInteger kBadgeTag = -2;
const NSInteger pointerTag = -1;
NSString * const kFormatToolbarConfigKeyName = @"formatToolbarConfig";
NSString * const kFormatToolbarX = @"pointX";
NSString * const kFormatToolbarY = @"pointY";
NSString * const kFormatToolbarOffsetX = @"offsetX";

-(void) dealloc
{
  [lblRedoBadge release];
  [lblUndoBadge release];
  [viewPointer release];
  [viewLeftArrow release];
  [viewRightArrow release];
  [svToolbar release];
  [formatView release];
  [btnDrag release];
  [colorPicker release];
  [fontPicker release];
  [super dealloc];
}


#pragma -
#pragma mark 配置文件相关
-(void) setFormatToolbarFromConfig
{
  NSDictionary *dict = [self readFormatToolbarConfig];
  NSNumber *xPosition, *yPosition;
  if(dict == nil){
    CGRect screenRect = [CoreGeneral deviceBounds];
    CGFloat x = (screenRect.size.width - self.frame.size.width) / 2;
    CGFloat y = (screenRect.size.height - self.frame.size.height) / 2;
    xPosition = [NSNumber numberWithFloat: x];
    yPosition = [NSNumber numberWithFloat: y];
  }else{
    xPosition = [dict objectForKey: kFormatToolbarX];
    yPosition = [dict objectForKey: kFormatToolbarY];
  }
  
  NSNumber *xOffset = [dict objectForKey: kFormatToolbarOffsetX];
  
  //设置frame的位置
  CGPoint pt = CGPointMake(xPosition == nil ? 5 : [xPosition intValue], yPosition == nil ? 30 : [yPosition intValue]);
  //[self.delegate didMoveFormatToolbar:self point: &pt];
  
  CGRect rect = self.frame;
  rect.origin.x = pt.x;
  rect.origin.y = pt.y;
  self.frame = rect;
  
  //设置contentOffset
  CGPoint offset = svToolbar.contentOffset;
  offset.x = [xOffset intValue];
  svToolbar.contentOffset = offset;
}

//重排格式化按钮的位置
-(NSDictionary *) readFormatToolbarConfig
{
  NSUserDefaults  *defaults = [NSUserDefaults standardUserDefaults];
  NSDictionary *dict = [defaults objectForKey: kFormatToolbarConfigKeyName];
  return dict;
}

//保存格式化按钮的位置
-(void) saveFormatToolbarConfig: (NSDictionary *) dict
{
  NSUserDefaults  *defaults = [NSUserDefaults standardUserDefaults];
  [defaults setObject:dict forKey:kFormatToolbarConfigKeyName];
  [defaults synchronize];
}

//保存格式化按钮的位置
-(void) saveFormatToolbarPosition: (CGPoint) point
{
  NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithDictionary: [self readFormatToolbarConfig]];
  [dict setValue:[NSNumber numberWithFloat: point.x] forKey: kFormatToolbarX];
  [dict setValue:[NSNumber numberWithFloat: point.y] forKey: kFormatToolbarY];
  [self saveFormatToolbarConfig: dict];
}

//保存格式化按钮的位置
-(void) saveFormatToolbarContentOffset: (CGPoint) point
{
  NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithDictionary: [self readFormatToolbarConfig]];
  [dict setValue:[NSNumber numberWithFloat: point.x] forKey: kFormatToolbarOffsetX];
  [self saveFormatToolbarConfig: dict];
}

#pragma -
#pragma mark Private Methods
//获取网络安全的字体
-(NSArray *) getWebSafeFonts
{
  return [NSArray arrayWithObjects: @"ArialMT", @"Helvetica", @"TimesNewRomanPSMT", @"Courier", @"Palatino",  @"Verdana", @"Georgia",  nil];
}

//获取所有字体
-(NSArray *) getAllFonts
{
  NSMutableArray *fonts = [[NSMutableArray alloc] init];
  NSArray *familyNames = [UIFont familyNames];
  for( NSString *familyName in familyNames ){
    [fonts addObject: familyName];
    continue;
    //printf( "Family: %s \n", [familyName UTF8String] );
    NSArray *fontNames = [UIFont fontNamesForFamilyName:familyName];
    for( NSString *fontName in fontNames ){
      if(![fontName isMatchedByRegex: @".+(\Bold)|(\Italic)"])
        [fonts addObject: fontName];
        //printf( "\tFont: %s \n", [fontName UTF8String] );
    }   //end for
  }     //end for
  
  NSArray *result = [NSArray arrayWithArray: fonts];
  [fonts release];
  return  result;
}

//获取指定格式的图片
-(UIImage *) getImage:(NSString *)imageName fileType:(NSString *)fileType
{
  return [UIImage imageNamed: [NSString stringWithFormat:@"%@%@.%@", self.imagePath, imageName, fileType]];
}

//获取PNG的图片
-(UIImage *)getImage:(NSString *)imageName
{
  return [self getImage:imageName fileType:@"png"];
}

//获取格式化按钮x的位置
-(NSInteger) getFormatButtonX:(NSInteger)index
{
  return index * (formatButtonWidth + formatButtonSpace);
}

//重设工具栏的contentSize
-(void) resetToolbarContentSize
{
  CGSize size = svToolbar.contentSize;
  size.width = toolbarButtonCount * (formatButtonSpace + formatButtonWidth);
  [svToolbar setContentSize: size];
  
  CGPoint pt = svToolbar.contentOffset;
  [svToolbar setContentOffset: pt];
  //是否显示左边的箭头
  viewRightArrow.hidden = size.width < svToolbar.frame.size.width;
}


//点击格式化按钮
-(void) clickedFormatButton: (UIButton *) sender
{
  NSInteger tag = sender.tag;
  BOOL openView = NO, trigger = YES;
  
  if(tag == MFFormatActionFont){
    trigger = NO;
    openView = fontPicker.hidden;
  }else if(tag == MFFormatActionColor || tag == MFFormatActionBackground){
    trigger = NO;
    openView = !self.additionalPanelOpened || self.lastClickButton != tag;
  };

  //undo和redo必需要可操作步骤数大于0
  if((tag == MFFormatActionUndo && self.undoCount <= 0) || (tag == MFFormatActionRedo && self.redoCount <= 0)) trigger = NO;
     
  //移动提示指针
  [self movePointer: tag];
  //确定最后点击的按钮
  self.lastClickButton = tag;
  //触发格式化动作
  if(trigger) {
    [self.delegate onFormatAction:self action:tag value: nil];
  };
  
  //显示或者隐藏附加面板
  [self displayAdditionalPanel: openView];
  
  //解发显示隐藏附加面板的事件
  if(!trigger || self.additionalPanelOpened || openView){
    [self.delegate onDisplayAdditionalPanel: self isOpened: openView];
  }
}

//显示或者隐藏附加面版
-(void) displayAdditionalPanel:(BOOL)isOpen
{
  if(isOpen){
    [self.delegate willOpenAdditionalPanel: self action: self.lastClickButton];
  };
  
  //已经打开或者关闭
  fontPicker.hidden = YES;
  colorPicker.hidden = YES;
  CGRect rect = self.frame;
  if(isOpen){
    rect.size.height = formatViewHeight;
    //显示哪一个附加面板
    if(self.lastClickButton == MFFormatActionFont){
      fontPicker.hidden = NO;
    }else{
      colorPicker.hidden = NO;
    }
  }else{
    rect.size.height = toolbarHeight;
  };
  
  self.frame = rect;
  self.additionalPanelOpened = isOpen;
}

//移动指针
-(void) movePointer: (NSInteger) tag
{
  //将箭头移到当前点击的按钮下面
  viewPointer.hidden = NO;
  CGRect rect = viewPointer.frame;
  
  //根据tag来判断索引
  NSInteger index = 0;
  for(UIView *btn in svToolbar.subviews){
    if(btn.hidden == YES) continue;
    if(btn.tag == tag) break;
    index ++;
  }
  
  rect.origin.x = index * (formatButtonWidth + formatButtonSpace) - formatButtonSpace * 2 - formatButtonWidth / 2; 
  [CoreGeneral viewSizeAnimation: viewPointer duration:.4 frame:rect];
}

#pragma -
#pragma mark Public Methods
- (id)initWithFrame:(CGRect)frame toolbarStyle:(MFFormatToolbarStyle)style resources:(NSString *)resources
{
  self = [super initWithFrame:frame];
  if (self) {
    self.toolbarStyle = style;
    self.imagePath = resources;
    self.additionalPanelOpened = NO;
    
    if(style == MFFormatToolbarStyleSmall){
      toolbarHeight = smallToolbarHeight;
      formatButtonHeight = smallFormatButtonWidth;
      formatButtonWidth = smallFormatButtonWidth;
      formatButtonSpace = smallFormatButtonSpace;
      dragButtonWidth = smallDragButtonWidth;
    }else{
      toolbarHeight = largeToolbarHeight;
      formatButtonHeight = largeFormatButtonWidth;
      formatButtonWidth = largeFormatButtonWidth;
      formatButtonSpace = largeFormatButtonSpace;
      dragButtonWidth = largeDragButtonWidth;
    };
    
    [self createComponent];
  }
  return self;
}

/*
//设置Undo和Redo的Badge
-(void) setUndoRedoBadge:(NSInteger)undoBadge redoBadge:(NSInteger)redoBadge
{
  lblRedoBadge.text = [NSString stringWithFormat: @"%d", redoBadge];
  lblUndoBadge.text = [NSString stringWithFormat: @"%d", undoBadge];
  self.redoCount = redoBadge;
  self.undoCount = undoBadge;
}
*/

//设置Badge
-(void) setBadge:(MFFormatAction)action badge:(NSInteger)badge
{
  UIView *view = [svToolbar viewWithTag: action];
  if(view == nil) return;
  
  UILabel *lbl = (UILabel*)[view viewWithTag: kBadgeTag];
  if(lbl == nil) return;
  lbl.text = [NSString stringWithFormat: @"%d", badge];
  
}
//显示或者隐藏按钮
-(void) displayFormatButton:(NSArray *)buttons isHide:(BOOL) isHide
{
  BOOL found;
  NSInteger index = 0;
  CGRect rect;
  toolbarButtonCount = isHide ? 0 : buttons.count;
  
  //重新设定ContentOffset
  CGPoint pt = svToolbar.contentOffset;
  pt.x = 0;
  [svToolbar setContentOffset: pt];
  
  //确定哪些按钮要隐藏
  for (UIView *view in svToolbar.subviews) {
    if(view.tag == pointerTag) continue;
    found = NO;
    for (NSNumber *item in buttons) {
      found = [item intValue] == view.tag;
      if(found) break;
    };    //for buttons
    view.hidden = isHide == found;
    
    //如果找到了，重新排序
    if(found != isHide){
      rect = view.frame;
      rect.origin.x = [self getFormatButtonX: index];
      view.frame = rect;
      if(isHide) toolbarButtonCount ++;
      index ++;
    };
  };      //font svToolbar
  
  //重排按钮的位置
  [self resetToolbarContentSize];
}

//显示拖拽把手
-(void) displayDragHandle:(BOOL) isHide
{
  btnDrag.hidden = isHide;
  CGFloat dragW = btnDrag.frame.size.width;
  CGRect rect = svToolbar.frame;
  rect.origin.x +=  isHide ? -dragW : dragW;
  rect.size.width += isHide ? dragW : -dragW;
  svToolbar.frame = rect;
  
  rect = viewLeftArrow.frame;
  rect.origin.x = isHide ? 0 : dragButtonWidth;
  viewLeftArrow.frame = rect;
  [self resetToolbarContentSize];
}

//设置ColorPicker的颜色
-(void) setCurrentColor:(UIColor *)color
{
  [colorPicker setCurrentColor: color];
}

//设置Font Picker的字体大小
-(void) setCurrentFontSize: (CGFloat) fontSize
{
  [fontPicker setCurrentFontSize: fontSize];
}

//设置Font Picker的字体
-(void) setCurrentFont: (UIFont *) font
{
  [fontPicker setCurrentFont: font];
}

//设置工具栏的背景
-(void) setToolbarBackgroundColor:(UIColor *)backgroundColor
{
  formatView.backgroundColor = backgroundColor;
}

/*
 保存快照
 1.保存位置
 2.保存点击的最后一个按钮
 3.contentOffset
*/
-(void) saveSnapshot
{
  snapFrame = self.frame;
  snapContentOffset = svToolbar.contentOffset;
  snapLastClickButton = self.lastClickButton;
  snapAdditionalPanelOpened = self.additionalPanelOpened;
}

//恢复快照
-(void) restoreSnapshot
{
  self.frame = snapFrame;
  svToolbar.contentOffset = snapContentOffset;
  self.lastClickButton = snapLastClickButton;
  //self.additionalPanelOpened = snapAdditionalPanelOpened;
  [self displayAdditionalPanel: snapAdditionalPanelOpened];
}
#pragma -
#pragma mark 创建组件相关
-(void) createComponent
{
  //左右的按钮
  UIImage *imgLeftArrow = [self getImage : @"left-arrow"];
  UIImage *imgRightArrow = [self getImage: @"right-arrow"];
  UIImage *imgPointer = [self getImage: @"pointer"];
  CGSize imageSize = imgLeftArrow.size;
  
  CGRect rect = CGRectMake(0, 0, self.frame.size.width, toolbarHeight);
  formatView = [[UIView alloc] initWithFrame: rect];
  formatView.autoresizingMask = UIViewAutoresizingFlexibleWidth;
  formatView.backgroundColor = [UIColor colorWithPatternImage: [self getImage: @"bg-format"]];
  formatView.opaque = NO;
  [self addSubview: formatView];
  
  //创建拖拽按钮
  btnDrag = [self createDragButton];
  [formatView addSubview: btnDrag];
  
  //创建scrollview
  NSInteger y = (toolbarHeight - formatButtonHeight) / 2;
  NSInteger x = dragButtonWidth + imageSize.width;
  NSInteger w = self.frame.size.width - x - imageSize.width * 2;
  rect = CGRectMake(x, 0, w, toolbarHeight);
  svToolbar = [[UIScrollView alloc] initWithFrame: rect];
  svToolbar.autoresizingMask = UIViewAutoresizingFlexibleWidth;
  [formatView addSubview: svToolbar];
  svToolbar.delegate = self;
  svToolbar.pagingEnabled = NO;//值是YES,会自动滚动到subview的边界,默认是NO
  svToolbar.backgroundColor = [UIColor clearColor];
  svToolbar.showsVerticalScrollIndicator = NO;//滚动时,是否显示垂直滚动条
  svToolbar.showsHorizontalScrollIndicator = NO;//滚动时,是否显示水平滚动条
  
  //创建指示器
  rect = CGRectMake(0, 0, 13, toolbarHeight);
  viewPointer = [[UIView alloc] initWithFrame: rect];
  viewPointer.tag = pointerTag;
  viewPointer.backgroundColor = [UIColor colorWithPatternImage: imgPointer];
  viewPointer.opaque = NO;
  viewPointer.hidden = YES;
  [svToolbar addSubview: viewPointer];
  [viewPointer release];
  
  //创建左方向的箭头
  x = dragButtonWidth;
  y = (toolbarHeight - imageSize.height) / 2;
  rect = CGRectMake(x, y, imageSize.width, imageSize.height);
  
  viewLeftArrow = [[UIView alloc] initWithFrame:rect];
  viewLeftArrow.backgroundColor = [UIColor colorWithPatternImage: imgLeftArrow];
  viewLeftArrow.opaque = NO;
  viewLeftArrow.hidden = YES;
  [formatView addSubview: viewLeftArrow];
  [viewLeftArrow release];
  
  //创建右方向的箭头
  rect.origin.x += svToolbar.frame.size.width + rect.size.width + 2;
  viewRightArrow = [[UIView alloc] initWithFrame:rect];
  viewRightArrow.backgroundColor = [UIColor colorWithPatternImage: imgRightArrow];
  viewRightArrow.opaque = NO;
  viewRightArrow.autoresizingMask = UIViewAutoresizingFlexibleLeftMargin;
  [formatView addSubview: viewRightArrow];
  viewRightArrow.hidden = YES;
  [viewRightArrow release];
  [imgRightArrow release];
  
  //创建Color Picker
  rect = CGRectMake(0, toolbarHeight, self.frame.size.width, 0);
  colorPicker = [[UIColorPicker alloc] initWithFrame:rect resources: self.imagePath];
  colorPicker.backgroundColor = [UIColor whiteColor];
  [self addSubview: colorPicker];
  colorPicker.delegate = self;
  colorPicker.hidden = YES;
  self.additionalPanelHeight = colorPicker.frame.size.height;
  
  //创建Font Picker
  rect.size.height = self.additionalPanelHeight;
  fontPicker = [[UIFontPicker alloc] initWithFrame:rect resources: self.imagePath];
  fontPicker.backgroundColor = [UIColor whiteColor];
  fontPicker.autoresizingMask = UIViewAutoresizingFlexibleWidth;
  fontPicker.safeFonts = [self getWebSafeFonts]; 
  fontPicker.allFonts = [self getAllFonts];
  //[[NSArray alloc] initWithArray: [UIFont familyNames]]
  fontPicker.delegate = self;
  fontPicker.hidden = YES;
  [self addSubview: fontPicker];

  //创建按钮
  [self createFormatButton];
  //获取格式工具栏的最高度
  formatViewHeight = colorPicker.frame.size.height + toolbarHeight;

  [colorPicker release];
  [fontPicker release];
  [svToolbar release];
  [formatView release];
  
  //view的高度和Toolbar是一样的
  rect = self.frame;
  rect.size.height = toolbarHeight;
  self.frame = rect;
  
  //根据配置文件设定位置
  [self setFormatToolbarFromConfig];
}

//创建按钮
-(UIButton *) createButton:(NSString *)title frame:(CGRect)frame image:(NSString *) image
{
  UIButton *btn = [UIButton buttonWithType:UIButtonTypeCustom];
  //btn.autoresizingMask = UIViewAutoresizingFlexibleLeftMargin;
  btn.autoresizesSubviews = NO;
  [btn setFrame: frame];
  [btn setImage:[self getImage: image] forState: UIControlStateNormal];
  btn.showsTouchWhenHighlighted = YES;
  return btn;
}

//创建拖动的按钮
-(UIButton *) createDragButton {
  UIButton *btn = [self createButton:nil frame:CGRectMake(0, 0, dragButtonWidth, toolbarHeight)  image: @"drag"];
  btn.showsTouchWhenHighlighted = NO;
  //添加事件
  [btn addTarget:self action:@selector(dragHandleBegan:withEvent: )
forControlEvents: UIControlEventTouchDown];
  [btn addTarget:self action:@selector(dragHandleMoving:withEvent: )
forControlEvents: UIControlEventTouchDragInside];
  [btn addTarget:self action:@selector(dragHandleEnded:withEvent: )
forControlEvents: UIControlEventTouchUpInside |
   UIControlEventTouchUpOutside];
  return btn;
}

//创建格式化的工具条
-(void) createFormatButton
{
  //创建Toolbar的数据
  NSArray *datas = [[NSArray alloc] initWithObjects:
                    [NSDictionary dictionaryWithObjectsAndKeys: @"bold", @"image", [NSNumber numberWithInt: MFFormatActionBold], @"tag", nil],
                    [NSDictionary dictionaryWithObjectsAndKeys: @"italic", @"image", [NSNumber numberWithInt: MFFormatActionItalic], @"tag", nil],
                    [NSDictionary dictionaryWithObjectsAndKeys: @"underline", @"image", [NSNumber numberWithInt: MFFormatActionUnderline], @"tag", nil],
                    [NSDictionary dictionaryWithObjectsAndKeys: @"font", @"image", [NSNumber numberWithInt: MFFormatActionFont], @"tag", nil],
                    [NSDictionary dictionaryWithObjectsAndKeys: @"color", @"image", [NSNumber numberWithInt: MFFormatActionColor], @"tag", nil],
                    [NSDictionary dictionaryWithObjectsAndKeys: @"background", @"image", [NSNumber numberWithInt: MFFormatActionBackground], @"tag", nil],
                    [NSDictionary dictionaryWithObjectsAndKeys: @"attachment", @"image", [NSNumber numberWithInt: MFFormatActionAttachment], @"tag", nil],
                    [NSDictionary dictionaryWithObjectsAndKeys: @"strikethrough", @"image", [NSNumber numberWithInt: MFFormatActionStrikethrough], @"tag", nil],
                    [NSDictionary dictionaryWithObjectsAndKeys: @"case", @"image", [NSNumber numberWithInt: MFFormatActionCase], @"tag", nil],
                    [NSDictionary dictionaryWithObjectsAndKeys: @"super", @"image", [NSNumber numberWithInt: MFFormatActionSuper], @"tag", nil],
                    [NSDictionary dictionaryWithObjectsAndKeys: @"sub", @"image", [NSNumber numberWithInt: MFFormatActionSub], @"tag", nil],
                    [NSDictionary dictionaryWithObjectsAndKeys: @"undo", @"image", [NSNumber numberWithInt: MFFormatActionUndo], @"tag", nil],
                    [NSDictionary dictionaryWithObjectsAndKeys: @"redo", @"image", [NSNumber numberWithInt: MFFormatActionRedo], @"tag", nil],
                    nil];
  
  toolbarButtonCount = datas.count;
  
  //循环列出按钮
  CGFloat badgeWidth = 31, badgeHeight = 20, badgeY = formatButtonHeight - badgeHeight;
  CGFloat y = (toolbarHeight - formatButtonHeight) / 2;
  CGRect rect;
  for(int i = 0; i < toolbarButtonCount; i ++){
    NSDictionary *data = [datas objectAtIndex: i];
    rect = CGRectMake([self getFormatButtonX: i], y, formatButtonHeight, formatButtonWidth);
    UIButton *btn = [self createButton:nil frame: rect image: [data objectForKey: @"image"]];
    [btn addTarget:self action:@selector(clickedFormatButton:) forControlEvents:UIControlEventTouchUpInside];
    btn.tag = [[data objectForKey: @"tag"] intValue];
    
    //为undo和redo添加badge
    if(btn.tag == MFFormatActionUndo || btn.tag == MFFormatActionRedo || btn.tag == MFFormatActionAttachment){
      UIImageView *imgView = [[UIImageView alloc] initWithImage:[self getImage: @"badge_red"]];
      CGFloat x = formatButtonWidth - badgeWidth;
      //if(btn.tag == MFFormatActionUndo) x = 0;
      rect = CGRectMake(x, badgeY, badgeWidth, badgeHeight);
      [imgView setFrame: rect];
      imgView.tag = 0;
      [btn addSubview: imgView];
      
      //添加标签中的内容
      UILabel *lbl = [[UILabel alloc] init];
      rect.origin.y -= 2;
      [lbl setFrame: rect];
      lbl.backgroundColor = [UIColor clearColor];
      lbl.tag = kBadgeTag;
      lbl.font = [UIFont boldSystemFontOfSize:14];
      lbl.textColor = [UIColor whiteColor];
      lbl.textAlignment = UITextAlignmentCenter;
      lbl.text = @"0";
      [btn addSubview: lbl];
      
      /*
      if(btn.tag == MFFormatActionRedo){
        lblRedoBadge = lbl;
      }else{
        lblUndoBadge = lbl;
      };
      */
      
      [lbl release];
      [imgView release];
    };
    [svToolbar addSubview:btn];
  };
  [datas release];
  
  [self resetToolbarContentSize];
}

#pragma -
#pragma mark 拖拽相关
//针对FormatView的滚动，在滚动条滚动的时候，显示或隐藏相应的箭头
-(void) scrollViewDidScroll:(UIScrollView *)scrollView
{
  [self saveFormatToolbarContentOffset: scrollView.contentOffset];
  viewLeftArrow.hidden = scrollView.contentOffset.x <= 0;
  viewRightArrow.hidden = scrollView.contentOffset.x >= scrollView.contentSize.width - scrollView.frame.size.width;
}

//根据拖拽按钮的位置获取FormatCnter的位置
-(void) dragFormatView:(UIControl *)ctrl withEvent:(UIEvent *)ev dragEnded:(BOOL)isEnd
{
  UITouch *touch = [[ev allTouches] anyObject];
  CGPoint pt = [touch locationInView:self];
  pt.x = pt.x - beginDragPoint.x + self.frame.origin.x;
  pt.y = pt.y - beginDragPoint.y + self.frame.origin.y;
  
  //调用协议，判断是否可以继续
  if(isEnd){
    if(![self.delegate didMoveFormatToolbar:self point: &pt]) return;
  }else{
    if(![self.delegate willMoveFormatToolbar:self point: &pt]) return;
  }
  CGRect rect = self.frame;
  rect.origin.x = pt.x;
  rect.origin.y = pt.y;
  
  if(isEnd){
    [CoreGeneral viewSizeAnimation:self duration:.2f frame:rect];
    [self saveFormatToolbarPosition: pt];
  }else{
    self.frame = rect;
  }
}

//开始拖拽
- (void) dragHandleBegan: (UIControl *) c withEvent:ev
{
  UITouch *touch = [[ev allTouches] anyObject];
  CGPoint pt = [touch locationInView: c];
  beginDragPoint = pt;
}

//结束拖拽
- (void) dragHandleEnded: (UIControl *) c withEvent:ev
{
  [self dragFormatView:c withEvent:ev dragEnded:YES];
}

//移动中
- (void) dragHandleMoving: (UIControl *) c withEvent:ev
{
  [self dragFormatView:c withEvent:ev dragEnded:NO];
}

#pragma -
#pragma mark 实现ColorPicker和FontPicker的协议
//改变字体
-(void) onChangeFont:(UIFont *)font
{
  [self.delegate onFormatAction: self action:MFFormatActionFont value: font];
}

//改变颜色
-(void) onChangeColor:(UIColor *)color
{
  [self.delegate onFormatAction: self action: self.lastClickButton value:color];
}

//改变字体大小
-(void) onChangeFontSize:(NSInteger)fontSize
{
  [self.delegate onFormatAction:self action:MFFormatActionFontSize value: [NSNumber numberWithInteger: fontSize]];
}

@end
