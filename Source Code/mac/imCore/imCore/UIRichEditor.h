//
//  RichEditor.h
//  imCore
//
//  Created by conis on 12-1-20.
//  Copyright (c) 2012年 __MyCompanyName__. All rights reserved.
//

#import "UIBrowser.h"
#import "UIFormatToolbar.h"
#import "UILabelEx.h"

@protocol UIRichEditorDelegate <NSObject>
-(void) onRichEditorLoaded;
//退出编辑器
-(void) onQuitRichEditor: (BOOL) isChanged;
//改变了页面设置的内容
-(void) onChangedPageSetting: (NSInteger) documentId style: (NSString *) style;
//页面内容发生的改变，包括样式或者文字发生了改变。
//html: 改变后的html，text:改变后的纯文本，用于检索和截取摘要
-(void) onChangedContent: (NSInteger) documentId html: (NSString*) html text: (NSString *) text;
//获取临近的存档内容
-(BOOL) onGetSiblingArchive: (NSInteger) documentId content: (NSString **) content isNext: (BOOL) isNext;
//富文本编辑器的其它动作，子类扩展，一般是点击按钮等操作，避免交叉引用等问题
-(void) onRichEditorAction: (NSInteger) documentId flag: (NSInteger) flag;
//当发现文本是空文档时的处理
-(void) onEmptyDocument: (NSInteger) documentId;
//打开文本编辑器
-(void) onShowTextEditor;
//无可用的格式化模式
-(void) onInvalidFormat;
//关闭页面设置
-(void) onClosePageSetting;
//其它动作的事件
-(void) onFormatAction: (MFFormatAction) action;

@end


@interface UIRichEditor : UIBrowser<UIFormatToolbarDelegate>
{
  UIFormatToolbar *toolbarSetting;
  int editingDocumentId;      //当前编辑的文档ID
  NSString *editingTitle;     //当前编辑的文档标题
  NSString *editingStyle;     //当前编辑的样式
  id<UIRichEditorDelegate> delegate;
  UIFormatToolbar *toolbarFloat;
  UIView *viewMask;           //遮罩
  UIView *viewSetting;        //页面设置
  UISlider *sldPageMargin;    //页边距
  UILabelEx *lblPageSample;     //页面设置的示例文字
  UIButton *btnPageSave;      //保存页面设置
  UIButton *btnPageCancel;    //取消页面设置
  NSInteger pageSmapleY;      //页面设置示例文字y轴的位置
  BOOL isEmptyDocument;       //是否为空白文档
  BOOL isChanged;             //内容是否被改变
  NSString *resources_;
  BOOL pageSettingChanged_;   //页面设置的内容被改变
}

@property (nonatomic)  CGRect formatToolbarLimitFrame;
@property BOOL isChanged;
@property(nonatomic, retain) id<UIRichEditorDelegate> delegate;
@property(nonatomic, retain) NSString *resources;
@property int editingDocumentId;
//是否空文档，如果是一个空文档，则直接将加载内容到编辑器中
@property BOOL isEmptyDocument;
@property(nonatomic, retain) NSString *editingTitle;
@property(nonatomic, retain) NSString *editingStyle;
-(void) loadDocument: (NSString *) title content: (NSString *) content style: (NSString *) style documentId: (NSInteger) documentId;
-(void) showPageSetting;
-(void) displayScreenMask: (BOOL) isShow;
//创建一个push面板
-(UIView *) createPushPanel: (CGRect) frame title: (NSString *) title subView:(UIView *) subView pushAction:(SEL) pushAction;
//创建一个从上到下的Push的界面，可以指定target
-(UIView *) createPushPanel: (id) target frame: (CGRect) frame title: (NSString *) title subView:(UIView *) subView pushAction:(SEL) pushAction;
//显示或者隐藏面板
-(void) displayPushPanel: (UIView *) panel offset: (CGPoint) offset display: (BOOL) display;
//-(void) setUndoRedoBadge:(NSInteger)undoBadge redoBadge:(NSInteger)redoBadge;
-(void) setBadge: (MFFormatAction) action badge: (NSInteger) badge;
-(NSString *) getHtmlContent;
-(NSString *) getTextContent;
-(BOOL) textChanging:(NSInteger)location length:(NSInteger)length text:(NSString *)text;
-(void) textSelection:(NSInteger)location length:(NSInteger)length;
-(void) textEdited: (NSString *) text;
-(void) executeCommand:(NSString *)command value:(NSString *)value nonstring: (BOOL) nonstring;
- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation;
-(void) didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation;
-(void) changeEditorSize;
-(void) changeEditorSize: (CGFloat) w height: (CGFloat) h;
-(void) loadDocument: (NSString *) content;
-(void) resetFormatToolbarPosition;
-(void) displayFormatButton:(NSArray *)buttons isHide:(BOOL) isHide;
@end
