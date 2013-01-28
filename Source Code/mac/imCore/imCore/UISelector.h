//
//  UISelectorViewController.h
//  imCore
//
//  Created by conis yi on 7/22/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "CoreGeneral.h"
/*
#pragma -
#pragma mark 选择器
@interface UISelectorSection <NSObject>
{
  NSArray *items_;
}

//分段
@property (nonatomic, retain) NSArray *items;
@end
*/

#pragma -
#pragma 协议
@protocol UISelectorDelegate <NSObject>
-(void) createSelectorItem: (UITableViewCell *) cell index: (NSInteger) index value: (id) value;
-(void) onSelectedItem: (NSInteger) index value: (id) value;
@end


//选择
@interface UISelector : UIView<UITableViewDelegate, UITableViewDataSource>
{
  id<UISelectorDelegate> delegate_;
  NSArray *data_;
  NSInteger multiSelect_;
  NSInteger rowHeight_;
  UITableView *tbSelector;
  NSInteger selectedCount;
}

//行高
@property (nonatomic) NSInteger rowHeight;
//最多可以选择多少项
@property (nonatomic) NSInteger multiSelect;
//数据项
@property (nonatomic, retain) NSArray *data;
//委托
@property (nonatomic, retain) id<UISelectorDelegate> delegate;

//渲染
-(void) render: (NSArray *) data;
//选中某段的某一列
-(void) selectedItem: (NSInteger) index;
//根据值选中某项
-(void) selectedItemWithValue: (id) value;
-(void) selectedItems: (NSArray *) indexes;
-(NSInteger) selectedIndex;
@end
