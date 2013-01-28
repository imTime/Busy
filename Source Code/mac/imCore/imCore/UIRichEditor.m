//
//  RichEditor.m
//  imCore
//
//  Created by conis on 12-1-20.
//  Copyright (c) 2012年 __MyCompanyName__. All rights reserved.
//

#import "UIRichEditor.h"

@interface UIRichEditor(Private)
-(void) setCurrentColor:(NSString *) params;
-(void) setCurrentFont:(NSString *) params;
-(void) setCurrentFontSize:(NSString *) params;
-(BOOL) isSettingModel;
-(void) createPageSetting;
-(void) createMask;
-(void) clickedCloseSetting: (UIButton *) sender;
-(CGFloat) getPageSettingHeight;
-(void) formatChanged;
-(void) restoreArchives: (MFFormatAction) action;
-(void) formatToolbarShadow: (BOOL) useShadow;
-(UIImage *) getImage: (NSString *) imageName;
-(CGPoint) getFormatToolbarPosition: (CGPoint) point;
-(UIButton *) createSettingButton: (NSString *) title imageName: (NSString *) imageName tag: (NSInteger) tag frame: (CGRect) frame;
//设置页面设置的示例信息
-(void) setPageSettingSample;
@end

@implementation UIRichEditor
@synthesize delegate, editingTitle, editingDocumentId, editingStyle, isEmptyDocument, isChanged, formatToolbarLimitFrame;
@synthesize resources = resources_;
//formattoolbar的tag类型
enum{
  kFormatToolbarNoraml = 0,
  kFormatToolbarSetting
};

enum{
  kPushPanelContent = 1,      //内容的Tag
  kPushPanelCloseButton       //关闭按钮的Tag
};

const NSInteger kSettingToolbarY = 50;
const NSInteger kSettingButtonSave = 1;
const NSInteger kSettingButtonCancel = 2;
static NSInteger kPushButtonHeight = 30;
static NSInteger kPushHeaderHeight = 30;

NSString * const kRichEditorResources = @"resource/RichEditor/";
NSString * const kCommandFontFamily = @"font-family";
NSString * const kCommandMargin = @"margin";
NSString * const kCommandFontSize = @"font-size";
NSString * const kCommandColor = @"color";
NSString * const kCommandBackgroundColor = @"background-color";
NSString * const kCommandBold = @"font-weight";
NSString * const kCommandUnderline = @"text-decoration";
NSString * const kCommandItalic = @"font-style";
NSString * const kCommandBody = @"body";

NSString * const kValueItalic = @"italic";
NSString * const kValueBold = @"bold";
NSString * const kValueUnderline = @"underline";

//获取文档的函数
NSString * const kFunctionGetDocument = @"window.onGetDocument('%@')";
NSString * const kFunctionLoadDocument = @"window.onLoadDocument(%d, \"%@\")";
NSString * const kFunctionExecuteCommmand = @"window.onExecuteCommand('%@', %@)";

-(void) dealloc
{
  [toolbarSetting release];
  [viewMask release];
  [lblPageSample release];
  [viewSetting release];
  [btnPageSave release];
  [btnPageCancel release];
  self.delegate = nil;
  [toolbarFloat release];
  [super dealloc];
}

#pragma -
#pragma mark 重载WebApp的方法
-(BOOL) doAction:(int)method params:(NSString *)aParams
{
  BOOL result = [super doAction:method params:aParams];
  if(result) return result;
  switch (method) {
    case 200:
      [self.delegate onShowTextEditor];
      break;
    case 201:
      NSLog([self callWebView:@"window.onGetMacro()"], nil);
      break;
    case 202:
      [self setCurrentFont: aParams];
      break;
    case 203:
      [self setCurrentFontSize: aParams];
      break;
    case 204:
    case 205:
      [self setCurrentColor: aParams];
      break;
    case 206:
      //格式被改变
      [self formatChanged];
      break;
    case 207:
      [self.delegate onInvalidFormat];
      break;
  };
  
  //执行editor的action
  return result;
}

//webApp加载完成
-(void) onWebViewLoaded
{
  //重新调整编辑器的大小
  [self changeEditorSize];
  [self.delegate onRichEditorLoaded];
}

#pragma -
#pragma mark 创建元素
-(void) createSettingCaption: (CGRect) rect text: (NSString *) text
{
  UILabel *lbl = [[UILabel alloc] initWithFrame: rect];
  lbl.text = text;
  [viewSetting addSubview: lbl];
  lbl.font = [UIFont boldSystemFontOfSize: 14];
  [lbl release];
}


//创建Mask层
-(void) createMask
{
  CGRect rect = [CoreGeneral zeroRect: self.frame];
  rect.origin.x = -10;
  rect.origin.y = -10;
  rect.size.width += 50;
  rect.size.height += 50;
  //创建Mask
  viewMask = [[UIView alloc] initWithFrame: rect];
  viewMask.layer.opacity = 0;
  viewMask.backgroundColor = [GraphicHelper transparentBlackColor: 0.7];
  viewMask.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
  [self addSubview: viewMask];
  [viewMask release];
}

//创建页面设置的组件
-(void) createPageSetting
{
  int w = 320, padding = 5, h = [CoreGeneral sharedManager].isPad ? 460 : 300 - 44;
  CGRect rect = CGRectMake(0, 0, w, h - kPushHeaderHeight - kPushButtonHeight);
  UIScrollView *setting = [[UIScrollView alloc] initWithFrame:rect];
  setting.backgroundColor = [UIColor whiteColor];
  setting.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  setting.contentSize = CGSizeMake(w, 400);
  //setting.showsVerticalScrollIndicator = NO;
  setting.showsHorizontalScrollIndicator = NO;
 
  //添加示例文字
  CGFloat sampleWidth = w - padding * 2;
  rect = CGRectMake(padding, padding * 2, sampleWidth, 80);
    
  //添加Sample
  lblPageSample = [[UILabelEx alloc] initWithFrame: rect];
  lblPageSample.verticalAlignment = VerticalAlignmentMiddle;
  lblPageSample.textAlignment = UITextAlignmentCenter;
  lblPageSample.autoresizingMask = UIViewAutoresizingFlexibleWidth;
  [setting addSubview: lblPageSample];
  [lblPageSample release];
  
  //创建FormatToolbar
  rect = CGRectMake(2, 0, w - 2, 0);
  MFFormatToolbarStyle ftStyle = [CoreGeneral sharedManager].isPad ? MFFormatToolbarStyleLarge : MFFormatToolbarStyleSmall;
  toolbarSetting = [[UIFormatToolbar alloc] initWithFrame:rect toolbarStyle:ftStyle resources: resources_];
  toolbarSetting.tag = kFormatToolbarSetting;
  toolbarSetting.autoresizingMask = UIViewAutoresizingFlexibleWidth;
  toolbarSetting.delegate = self;
  [toolbarSetting displayDragHandle: YES];
  [toolbarSetting setToolbarBackgroundColor: [UIColor clearColor]];

  rect = toolbarSetting.frame;
  rect.origin.x = 0;
  rect.origin.y = lblPageSample.frame.origin.y + lblPageSample.frame.size.height;
  rect.size.width = w - padding * 2;
  toolbarSetting.frame = rect;
  
  //显示指定按钮
  NSArray *hides = [NSArray arrayWithObjects:
                    [NSNumber numberWithInt: MFFormatActionBold],
                    [NSNumber numberWithInt: MFFormatActionItalic],
                    [NSNumber numberWithInt: MFFormatActionUnderline],
                    [NSNumber numberWithInt:MFFormatActionFont],
                    [NSNumber numberWithInt:MFFormatActionColor],
                    [NSNumber numberWithInt:MFFormatActionBackground],
                    nil];
  
  [toolbarSetting displayFormatButton: hides isHide: NO];
  
  [setting addSubview: toolbarSetting];
  [toolbarSetting release];

  
  
  rect = CGRectMake(0, -h, w, h);
  NSString *title = NSLocalizedString(@"rich_editor_page_title", nil);;
  viewSetting = [self createPushPanel:rect title: title subView:setting pushAction: @selector(clickedCloseSetting:)];
}

//创建一个从上到下的Push的界面
-(UIView *) createPushPanel:(CGRect)frame title:(NSString *)title subView:(UIView *)subView pushAction:(SEL)pushAction
{
  return [self createPushPanel:self frame:frame title: title subView:subView pushAction:pushAction]; 
}

//创建一个从上到下的Push的界面，可以指定target
-(UIView *) createPushPanel:(id)target frame:(CGRect)frame title:(NSString *)title subView:(UIView *)subView pushAction:(SEL)pushAction
{
  UIView *view = [[UIView alloc] initWithFrame:frame];
  view.backgroundColor = [UIColor blackColor];
  view.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleRightMargin;
  subView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  CGRect rect = subView.frame;
  rect.origin.y = kPushHeaderHeight;
  subView.frame = rect;
  [view addSubview: subView];
  subView.tag = kPushPanelContent;
  [subView release];
  
  //添加标题栏
  rect = CGRectMake(5, 0, frame.size.width - 10, kPushHeaderHeight);
  UILabel *lblTitle = [[UILabel alloc] initWithFrame: rect];
  lblTitle.textColor = [UIColor whiteColor];
  lblTitle.font = [UIFont boldSystemFontOfSize: 20];
  lblTitle.text = title;
  lblTitle.backgroundColor = [UIColor clearColor];
  [view addSubview: lblTitle];
  [lblTitle release];
  //添加按钮
  rect = CGRectMake(0, frame.size.height - kPushButtonHeight, frame.size.width, kPushButtonHeight);
  UIButton *btn = [[UIButton alloc] initWithFrame: rect];
  btn.autoresizingMask = UIViewAutoresizingFlexibleWidth;
  [btn setImage: [self getImage :@"push-arrow"] forState:UIControlStateNormal];
  [btn addTarget:target action: pushAction forControlEvents:UIControlEventTouchUpInside];
  btn.tag = kPushPanelCloseButton;
  [view addSubview: btn];
  
  [self addSubview: view];
  [view release];
  return view;
}


//显示或者隐藏面板
-(void) displayPushPanel: (UIView *) panel offset: (CGPoint) offset display: (BOOL) display
{
  [self endEditing: YES];
  //将Mask提到前面到
  [self displayScreenMask: display];
  //将布板提到最前
  [self bringSubviewToFront: panel];
  
  CGRect rect = panel.frame;
  if(display){
    rect.origin.y = 0 + offset.y;
  }else{
    rect.origin.y = -rect.size.height + offset.y;
  };
  
  [CoreGeneral viewSizeAnimation:panel duration:.4 frame: rect];
}

//创建元素
-(void) createComponent
{
  BOOL isPad = [CoreGeneral sharedManager].isPad;
  [super createComponent];
  //创建格式化按钮
  CGRect rect = CGRectMake(5, 200, isPad ? 413 : 310, 0);     //根据iPad和iPhone的不一样，主要是宽度不一样
  MFFormatToolbarStyle style = isPad ? MFFormatToolbarStyleLarge : MFFormatToolbarStyleSmall; 
  toolbarFloat = [[UIFormatToolbar alloc] initWithFrame:rect toolbarStyle:style resources: resources_];
  toolbarFloat.tag = kFormatToolbarNoraml;
  toolbarFloat.delegate = self;
  toolbarFloat.opaque = NO;
  [self addSubview: toolbarFloat];
  
  //给formatToolbar设置阴影
  CALayer *layer = [toolbarFloat layer];
  [layer setShadowOffset:CGSizeMake(3, 3)];
  [layer setShadowRadius:8];
  layer.cornerRadius = 8;
  [layer setShadowOpacity:0.8];
  [layer setShadowColor:[UIColor blackColor].CGColor];
  [toolbarFloat release];
  
  [self createMask];
  [self createPageSetting];
  //加载页面
  //self.initParameters = [NSString stringWithFormat: @"{initDatabase: true}"];   //需要初始化
  self.homePage = @"http://mobile.imtime.com/editor.html";
}

#pragma -
#pragma mark 实现FormatToolbar的协议
//将要打开附加面板
-(void)willOpenAdditionalPanel:(UIFormatToolbar *)toolbar action:(MFFormatAction)action
{
  if(toolbar.tag == kFormatToolbarNoraml) return;
  
  switch (action) {
    case MFFormatActionBackground:
      [toolbar setCurrentColor: lblPageSample.backgroundColor];
      break;
    case MFFormatActionColor:
      [toolbar setCurrentColor: lblPageSample.textColor];
      break;
    case MFFormatActionFont:
      [toolbar setCurrentFontSize: lblPageSample.font.pointSize];
      [toolbar setCurrentFont: lblPageSample.font];
      break;
  };
}

//将要移动Toolbar
-(BOOL) willMoveFormatToolbar:(UIFormatToolbar *)toolbar point:(CGPoint *)point
{
  return YES;
}

//移动FormatToolbar
-(BOOL) didMoveFormatToolbar:(UIFormatToolbar *)toolbar point:(CGPoint *)point
{
  *point = [self getFormatToolbarPosition: *point];
  /*
  CGRect rect = self.formatToolbarLimitFrame;
  point->x = MAX(point->x, rect.origin.x);
  point->y = MAX(point->y, rect.origin.y);
  point->x = MIN(point->x, rect.size.width);
  point->y = MIN(point->y, rect.size.height);
  */
  return YES;
}

//Toolbar显示扩展面板
-(void) onDisplayAdditionalPanel:(UIFormatToolbar *)toolbar isOpened:(BOOL)isOpened
{
  /*
  if(!self.pageSettingShowing) return;
  CGRect rect = lblPageSample.frame;
  rect.origin.y = pageSmapleY;
  if(isOpened) rect.origin.y += formatToolbar.additionalPanelHeight;
  lblPageSample.frame = rect;
  
  rect = viewSetting.frame;
  rect.size.height =  [self getPageSettingHeight];
  viewSetting.frame = rect;
  */
}

//执行动作
-(void) onFormatAction:(UIFormatToolbar *)toolbar action:(MFFormatAction)action value:(id)value
{
  //页面设置
  if(toolbar.tag == kFormatToolbarSetting){
    pageSettingChanged_ = YES;    //页面设置发生改变
    UIFont *font = lblPageSample.font;;
    switch (action) {
      case MFFormatActionFont:
        lblPageSample.font = [UIFont fontWithName:((UIFont *)value).fontName size:font.pointSize];
        break;
      case MFFormatActionFontSize:
        lblPageSample.font = [UIFont fontWithName:font.fontName size:[value floatValue]];
        break;
      case MFFormatActionColor:
        lblPageSample.textColor = (UIColor *) value;
        break;
      case MFFormatActionBackground:
        lblPageSample.backgroundColor = (UIColor *) value;
        break;
      case MFFormatActionBold:
        lblPageSample.isBold = !lblPageSample.isBold;
        break;
      case MFFormatActionItalic:
        lblPageSample.isItalic = !lblPageSample.isItalic;
        break;
      case MFFormatActionUnderline:
        lblPageSample.isUnderline = !lblPageSample.isUnderline;
        break;
    };
    return;
  };
  
  NSString *command = nil, *cmdValue = @""; 
  BOOL executeCmd = YES;
  switch (action) {
    case MFFormatActionAttachment: //交由代理处理
      executeCmd = NO;
      [self.delegate onFormatAction: MFFormatActionAttachment];
      break;
    case MFFormatActionBold:
      command = kCommandBold;
      cmdValue = kValueBold;
      break;
    case MFFormatActionUnderline:
      command = kCommandUnderline;
      cmdValue = kValueUnderline;
      break;
    case MFFormatActionItalic:
      command = kCommandItalic;
      cmdValue = kValueItalic;
      break;
    case MFFormatActionFont:
      command = kCommandFontFamily;
      cmdValue = [NSString stringWithFormat: @"%@", ((UIFont *)value).fontName];
      break;
    case MFFormatActionFontSize:
      command = kCommandFontSize;
      cmdValue = [NSString stringWithFormat: @"%@px", value];
      break;
    case MFFormatActionColor:
      command = kCommandColor;
      cmdValue = [GraphicHelper color2Rgba: (UIColor *)value];
      break;
    case MFFormatActionBackground:
      command = kCommandBackgroundColor;
      cmdValue = [GraphicHelper color2Rgba: value];
      break;
    case MFFormatActionStrikethrough:
      command = @"text-decoration";
      cmdValue = @"line-through";
      break;
    case MFFormatActionCase:
      command = @"case";
      break;
    case MFFormatActionSuper:
      command = @"vertical-align";
      cmdValue = @"super";
      break;
    case MFFormatActionSub:
      command = @"vertical-align";
      cmdValue = @"sub";
      break;
    case MFFormatActionRedo:
    case MFFormatActionUndo:
      [self restoreArchives: action];
      return;
    case MFFormatActionLink:
      command = @"link";
      cmdValue = value;
      break;
  };
  
  if(executeCmd){
    [self executeCommand:command value:cmdValue nonstring:NO];
  }
}

#pragma -
#pragma mark Private Methods
-(CGPoint) getFormatToolbarPosition: (CGPoint) point
{
  CGRect rect = self.formatToolbarLimitFrame;
  /*
  point->x = MAX(point->x, rect.origin.x);
  point->y = MAX(point->y, rect.origin.y);
  point->x = MIN(point->x, rect.size.width);
  point->y = MIN(point->y, rect.size.height);
  */

  point.x = MAX(point.x, rect.origin.x);
  point.y = MAX(point.y, rect.origin.y);
  point.x = MIN(point.x, rect.size.width);
  point.y = MIN(point.y, rect.size.height);
  return point;
}

//获取图片
-(UIImage *) getImage: (NSString *) imageName
{
  return [UIImage imageNamed: [NSString stringWithFormat: @"%@%@.png", resources_, imageName]];
}

-(void) formatToolbarShadow:(BOOL)useShadow
{
  CALayer *layer = [toolbarFloat layer];
  //给uiview设置阴影
  CGSize size = useShadow ? CGSizeMake(3, 3) : CGSizeZero;
  [layer setShadowOffset: size];
  [layer setShadowRadius:useShadow ? 8 : 0];
}


//关闭页面设置
-(void) clickedCloseSetting:(UIButton *)sender
{
  //隐藏PagetSetting
  [self displayPushPanel:viewSetting offset: CGPointZero display: NO];
  
  if(pageSettingChanged_){
    //保存页面设置的数据
    NSString *empty = @"";
    NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
    [dict setValue:[GraphicHelper color2Rgba: lblPageSample.backgroundColor] forKey:kCommandBackgroundColor];
    [dict setValue:[GraphicHelper color2Rgba: lblPageSample.textColor] forKey:kCommandColor];
    [dict setValue: [NSNumber numberWithFloat: lblPageSample.font.pointSize] forKey:kCommandFontSize];
    [dict setValue: lblPageSample.font.fontName forKey:kCommandFontFamily];
    [dict setValue: lblPageSample.isUnderline ? kValueUnderline : empty forKey:kCommandUnderline];
    [dict setValue: lblPageSample.isBold ? kValueBold : empty forKey:kCommandBold];
    [dict setValue: lblPageSample.isItalic ? kValueItalic : empty forKey:kCommandItalic];
    self.editingStyle = [CoreGeneral JSONStringWithObject:dict];
    [dict release];
    
    [self.delegate onChangedPageSetting: self.editingDocumentId style:self.editingStyle];
    [self executeCommand: kCommandBody value: self.editingStyle nonstring:YES];
  }
  
  [self.delegate onClosePageSetting];
}

//获取页面设置的高度
-(CGFloat) getPageSettingHeight
{
  //返回最后元素的高度
  return lblPageSample.frame.size.height + lblPageSample.frame.origin.y + 20;
}

//是否为设置模式
-(BOOL) isSettingModel
{
  return !viewSetting.hidden;
}

//调用webApp，执行指定命令
-(void) executeCommand:(NSString *)command value:(NSString *)value nonstring:(BOOL)nonstring
{
  NSString *strValue = value;
  if(value == nil) strValue = nonstring ? @"null" : @"";
  if(!nonstring) strValue = [NSString stringWithFormat: @"'%@'", strValue];
  NSString *js = [NSString stringWithFormat: kFunctionExecuteCommmand, command, strValue];
  [self callWebView: js];
}

//设置当前的颜色
-(void) setCurrentColor:(NSString *) params
{
  NSString *rgba = [self getParam: params];
  UIColor *color = [GraphicHelper rgba2Color: rgba];
  [toolbarFloat setCurrentColor: color];
}

//设置字体
-(void) setCurrentFont:(NSString *) params
{
  NSString *fontName = [self getParam: params];
  UIFont *font = [UIFont fontWithName:fontName size: 18];
  [toolbarFloat setCurrentFont: font];
}

//设置字体大小
-(void) setDefaultFontSize:(NSString *) params
{
  NSString *size = [self getParam: params];
  [toolbarFloat setCurrentFontSize: [size floatValue]];
}

//格式被改变
-(void) formatChanged
{
  self.isChanged = YES;
  [self.delegate onChangedContent:self.editingDocumentId html:[self getHtmlContent] text: [self getTextContent]];
}

//恢复存档
-(void) restoreArchives:(MFFormatAction)action
{
  NSString *content;
  BOOL isNext = action == MFFormatActionRedo;
  //获取临近的存档
  if(![self.delegate onGetSiblingArchive: self.editingDocumentId content: &content isNext: isNext]) return;
  
  //找到存档，恢复
  content = [StringHelper formatJavascriptText:content];
  [self loadDocument: content];
}

//加载文档
-(void) loadDocument:(NSString *)content
{
  content = [StringHelper replaceNil: content];
  NSString *js = [NSString stringWithFormat:kFunctionLoadDocument, self.editingDocumentId,content];
  [self callWebView: js];
}
#pragma -
#pragma mark Public Methods

-(void) displayFormatButton:(NSArray *)buttons isHide:(BOOL) isHide
{
  [toolbarFloat displayFormatButton: buttons isHide: isHide];
}

//改变了webview的大小，重新向webview报告
-(void) changeEditorSize
{
  [self changeEditorSize:myWebView.frame.size.width height:myWebView.frame.size.height];
}

-(void) changeEditorSize:(CGFloat)w height:(CGFloat)h
{
  static NSString *function = @"window.onChangeSize(%.f, %.f)";
  [self callWebView: [NSString stringWithFormat: function, w, h]];
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
  [self changeEditorSize];
  return YES;
}

//完成方向的改变
-(void) didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation
{
  [self changeEditorSize];
  [self resetFormatToolbarPosition];
}

//重置formattoolbar的位置
-(void) resetFormatToolbarPosition
{
  //重新计算FormatBar的位置
  CGPoint pt = toolbarFloat.frame.origin;
  pt = [self getFormatToolbarPosition: pt];
  CGRect rect = toolbarFloat.frame;
  rect.origin = pt;
  toolbarFloat.frame = rect;
}
//加载文档
-(void) loadDocument:(NSString *)title content:(NSString *)content style:(NSString *)style documentId:(NSInteger)documentId
{
  self.editingTitle = title;
  self.editingDocumentId = documentId;
  self.editingStyle = style;
  content = [StringHelper formatJavascriptText:content];
  [self loadDocument: content];
  [self setPageSettingSample];
  [self executeCommand: kCommandBody value: self.editingStyle nonstring:YES];
  if(content == nil || content.length == 0) [self.delegate onEmptyDocument:self.editingDocumentId];
}

//设置页面示例的文字
-(void) setPageSettingSample
{
  //NSLog(@"%@", [self callWebView: @"$(\"body\").html()"]);
  NSDictionary *dict = [CoreGeneral JSONObjectWithString: self.editingStyle];
  NSString *sample = NSLocalizedString(@"rich_editor_page_sample", nil);
  
  //包括粗体
  lblPageSample.isBold = [[dict objectForKey: kCommandBold] isEqual: kValueBold];
  lblPageSample.isItalic = [[dict objectForKey: kCommandItalic] isEqual: kValueItalic];
  lblPageSample.isUnderline = [[dict objectForKey: kCommandUnderline] isEqual: kValueUnderline];
  
  CGFloat fontSize = [[dict objectForKey: kCommandFontSize] floatValue];
  UIFont *font = [UIFont fontWithName: [dict objectForKey: kCommandFontFamily] size: fontSize];
  if(font == nil) font = [UIFont systemFontOfSize: fontSize];
  
  NSString *strTextColor = [dict objectForKey: kCommandColor];
  UIColor *textColor = [UIColor blackColor];
  if(strTextColor != nil) textColor = [GraphicHelper rgba2Color: strTextColor];
  
  lblPageSample.textColor = textColor;
  lblPageSample.backgroundColor = [GraphicHelper rgba2Color: [dict objectForKey: kCommandBackgroundColor]];
  lblPageSample.font = font;
  [lblPageSample setText: sample];
}

//显示页面设置
-(void) showPageSetting
{
  pageSettingChanged_ = NO;
  [self displayPushPanel:viewSetting offset: CGPointZero display: YES];
}

//显示屏幕遮罩
-(void) displayScreenMask: (BOOL) isShow
{
  [self bringSubviewToFront: viewMask];
  [CoreGeneral displayView:viewMask duration: .4 show: isShow];
}

//设置badge
-(void) setBadge:(MFFormatAction)action badge:(NSInteger)badge
{
  [toolbarFloat setBadge:action badge:badge];
}

//从编辑器中获取html的内容
-(NSString *) getHtmlContent
{
  return [self callWebView: [NSString stringWithFormat: kFunctionGetDocument, @"html"]];
}

//从编辑器中获取text的内容
-(NSString *) getTextContent
{
  return [self callWebView: [NSString stringWithFormat: kFunctionGetDocument, @"text"]];
}

//文本编辑器的位置发生改变，当用户选取的时候
-(void) textSelection:(NSInteger)location length:(NSInteger)length
{
  if(self.isEmptyDocument) return;
  NSString *js = [NSString stringWithFormat: @"window.onTextSelection(%d, %d)", location, length];
  [self callWebView:js];
}

//文本内容改变
-(BOOL) textChanging:(NSInteger)location length:(NSInteger)length text:(NSString *)text
{
  self.isChanged = YES;
  if(self.isEmptyDocument) return YES;
  NSString *js = [NSString stringWithFormat: @"window.onTextChanging(%d, %d, \"%@\")", location, length, [StringHelper formatJavascriptText: text]];
  [self callWebView:js];
  return YES;
}

//文本编辑器完成编辑器
-(void) textEdited: (NSString *) text
{
  if(!self.isEmptyDocument) return;
  //将文档转换为基本的HTML格式，并加载文档
  NSString *html = [StringHelper text2Html: text];
  [self.delegate onChangedContent:self.editingDocumentId html:html text:text];
  [self loadDocument: html];
}
@end
