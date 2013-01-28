//
//  FormatToolbar.h
//  imCore
//
//  Created by conis on 12-1-19.
//  Copyright (c) 2012年 __MyCompanyName__. All rights reserved.
//
/*
 Update on 2012-01-19 by Conis
 从富文本编辑独立出来的格式化工具栏，可以设置工具栏的宽度，按钮可选大号和小号
*/
#import <UIKit/UIKit.h>
#import "CoreGeneral.h"
#import "UIColorPicker.h"
#import "UIFontPicker.h"

//定义按钮样式，可以选小号及大号
typedef enum {
  MFFormatToolbarStyleSmall = 1,
  MFFormatToolbarStyleLarge = 2
} MFFormatToolbarStyle;

typedef enum {
  MFFormatActionBold = 1,
  MFFormatActionItalic = 2,
  MFFormatActionUnderline = 3,
  MFFormatActionFont = 4,
  MFFormatActionColor = 5,
  MFFormatActionBackground = 6,
  MFFormatActionCase = 8,
  MFFormatActionStrikethrough = 7,
  MFFormatActionSuper = 9,
  MFFormatActionSub = 10,
  MFFormatActionUndo = 11,
  MFFormatActionRedo = 12,
  MFFormatActionFontSize = 13,
  MFFormatActionLink = 14,
  MFFormatActionAttachment = 15
} MFFormatAction;

//协议预定义
@protocol UIFormatToolbarDelegate;

@interface UIFormatToolbar : UIView<UIScrollViewDelegate, UIColorPickerDelegate, UIFontPickerDelegate>{
  MFFormatToolbarStyle toolbarStyle;
  UIButton *btnDrag;
  NSString *imagePath;
  UIScrollView *svToolbar;
  UIView *viewPointer;        //格式化工具栏的指针，提示当前点击的是哪个按钮
  UIView *viewLeftArrow;      //左箭头
  UIView *viewRightArrow;     //右箭头
  UIView *formatView;
  UILabel *lblRedoBadge;
  UILabel *lblUndoBadge;
  UIColorPicker *colorPicker;   //颜色选择器
  UIFontPicker *fontPicker;     //字体选择器
  
  NSInteger redoCount;       //可以重做的步骤数量
  NSInteger undoCount;       //可以后退的步骤数量
  NSInteger toolbarButtonCount;
  
  //各种宽度高度参数
  NSInteger additionalPanelHeight;    //附加工具栏的高度
  NSInteger toolbarHeight;        //工具栏的高度
  NSInteger formatButtonWidth;    //格式化按钮的宽度
  NSInteger formatButtonSpace;    //格式化按钮之间的距离
  NSInteger formatButtonHeight;   //格式化按钮的高度
  NSInteger dragButtonWidth;      //拖拽按钮的宽度
  NSInteger lastClickButton;      //最后点击的按钮
  NSInteger toolbarTopPadding;    //工具栏顶部距离
  NSInteger formatViewHeight;     //view的总高度
  CGPoint beginDragPoint;         //开始拖拽的位置
  BOOL additionalPanelOpened;     //附加面板是否打开
  id<UIFormatToolbarDelegate> delegate;
  
  CGRect snapFrame;                   //frame的快照
  CGPoint snapContentOffset;          //toolbar的contentOffset
  NSInteger snapLastClickButton;      //最后点击的按钮
  BOOL snapAdditionalPanelOpened;     //附加面板是否已经打开
}

@property BOOL additionalPanelOpened;
@property NSInteger additionalPanelHeight;
@property NSInteger undoCount;
@property NSInteger redoCount;
@property NSInteger lastClickButton;      //最后点击的按钮
@property NSInteger toolbarHeight;
@property MFFormatToolbarStyle toolbarStyle;
@property (nonatomic, retain) NSString *imagePath;
@property (nonatomic, retain) id<UIFormatToolbarDelegate> delegate;

-(id) initWithFrame:(CGRect)frame toolbarStyle: (MFFormatToolbarStyle) style resources: (NSString *) resources;
-(void) displayFormatButton:(NSArray *)buttons isHide:(BOOL) isHide;
//-(void) setUndoRedoBadge:(NSInteger)undoBadge redoBadge:(NSInteger)redoBadge;
-(void) setCurrentColor: (UIColor *) color;
-(void) setCurrentFontSize: (CGFloat) fontSize;
-(void) setCurrentFont: (UIFont *) font;
-(void) setToolbarBackgroundColor: (UIColor *) color;
-(void) displayDragHandle: (BOOL) isHide;
-(void) saveSnapshot;      
-(void) restoreSnapshot;
-(void) displayAdditionalPanel: (BOOL) isOpen;
-(void) setBadge: (MFFormatAction) action badge: (NSInteger) badge;
@end

//定义协议
@protocol UIFormatToolbarDelegate<NSObject>
//格式化动作
-(void) onFormatAction: (UIFormatToolbar*) toolbar action: (MFFormatAction) action value: (id) value;
//将要找开附加面板
-(void) willOpenAdditionalPanel: (UIFormatToolbar*) toolbar action: (MFFormatAction) action;
//显示隐藏附加面板
-(void) onDisplayAdditionalPanel: (UIFormatToolbar*) toolbar isOpened: (BOOL) isOpened;
//将要移动工具栏
-(BOOL) willMoveFormatToolbar:(UIFormatToolbar*) toolbar point:(CGPoint *) point;
//移动工具栏完成
-(BOOL) didMoveFormatToolbar: (UIFormatToolbar*) toolbar point:(CGPoint *) point;
@end
