//
//  ContextMenu.h
//  imCore
//
//  Created by conis on 12-1-21.
//  Copyright (c) 2012年 __MyCompanyName__. All rights reserved.
//

/*
  创建上下文菜单
*/

@protocol UIContextMenuDelegate <NSObject>
//点击某个上下文菜单
-(void) onClickedContextMenuItem: (NSInteger) tag;
@end

#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>
#import "CoreGeneral.h"


@interface UIContextMenu : UIView{
  int menuItemCount;
  BOOL contextMenuShowing;
  id<UIContextMenuDelegate> delegate;
  CGRect maxFrame;
}

@property int menuItemCount;
@property(nonatomic, retain) id<UIContextMenuDelegate> delegate;
@property BOOL contextMenuShowing;
@property CGRect maxFrame;

-(void) appendMenuItem: (NSString *) title tag: (NSInteger) tag icon: (UIImage *) icon;
-(UIButton *) menuItemWithTag: (NSInteger) tag;
-(void) hideMenuItem: (NSInteger) tag;
-(void) showContextMenu: (CGPoint) point;
-(void) hideContextMenu;
@end
