//
//  UIDataTable.h
//  imCore
//
//  Created by conis on 2/9/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

/*
 
*/
#import <UIKit/UIKit.h>
#import "BaseView.h"
#import "UIRating.h"

typedef enum {
  DataTableRowSignleLineText = 1,
  DataTableRowSwitch = 2,
  DataTableRowRating = 3,
  DataTableRowCaptionContent = 4,
  DataTableRowTextField = 5
} DataTableRowType;

/*
//每一行数据库体
@interface UIDataTableEntityRow :NSObject
{
  NSInteger rowHeight_;
  NSInteger leftPadding_;
  NSInteger rightPadding_;
  NSInteger captionWidth_;
}

@property (nonatomic) NSInteger rowHeight;
@property (nonatomic) NSInteger leftPadding;
@property (nonatomic) NSInteger rightPadding;
@property (nonatomic) NSInteger captionWidth;

@end

//数据实体
@interface UIDataTableEntity: NSObject
{
  DataTableRowType type_;
  NSString *macro_;
  UITextAlignment contentAlign;
  NSString *caption_;
  NSInteger guid_;
  NSString *content_;
  NSString *style_;
  id value_;
}
@end
*/

@protocol UIDataTableDelegate <NSObject>
-(NSString *) onGetMacro: (DataTableRowType) rowType macro: (NSString *) macro guid: (NSInteger) guid;
-(void) onSelectDataTableRow: (NSInteger) guid data: (NSDictionary *) data;
-(void) onChangeSwitchValue: (NSInteger) guid value: (BOOL) value;
-(BOOL) onDisplayDataRow: (NSInteger) guid;
@end

@interface UIDataTable : UIView<UITableViewDataSource, UITableViewDelegate>{
  NSDictionary *dataSource_;
  id<UIDataTableDelegate> delegate_;
  UITableView *tbMain;
  NSInteger cellLeftPadding_;
  NSInteger cellRightPadding_;
  NSInteger rowHeight_;
  NSInteger captionWidth_;
  NSString *dataPath_;
}

@property (nonatomic, retain) NSString *dataPath;
@property (nonatomic, retain) id<UIDataTableDelegate> delegate;
@property (nonatomic, retain) NSDictionary *dataSource;

//根据plist的路径初始化，dataPath：plist的路径
- (id)initWithFrame:(CGRect)frame style:(UITableViewStyle)style;
-(void) reloadData;
-(id) getRowValue: (NSDictionary *) data section: (NSInteger) section row: (NSInteger) row;
-(id) getValueWithGuid: (NSDictionary *) data section: (NSInteger) section guid:(NSInteger)guid;
@end
