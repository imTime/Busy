//
//  UIDataTable.m
//  imCore
//
//  Created by conis on 2/9/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "UIDataTable.h"

@interface UIDataTable(Private)
-(NSDictionary *) getRowData: (NSDictionary *) data section: (NSInteger) section row: (NSInteger) row;
-(void) drawCell: (UITableViewCell *) cell data: (NSDictionary *) data;
-(void) drawCellSignleLine: (UITableViewCell *) cell data: (NSDictionary *) data;
-(void) drawCellCaptionContent: (UITableViewCell *) cell data: (NSDictionary *) data;
-(void) drawCellSwitch: (UITableViewCell *) cell data: (NSDictionary *) data;
-(void) drawCellRating: (UITableViewCell *) cell data: (NSDictionary *) data;
-(void) clickedSwitch: (UISwitch *) sender;
-(UILabel *) addLabel:(UITableViewCell *)cell frame:(CGRect)frame text:(NSString *)text align:(NSNumber *)align style: (NSString *) style;
-(void) setLabelStyle: (UILabel *) label style: (NSString *) style;
-(CGRect) getCellFrame: (UITableViewCell *) cell;
-(NSArray *) getSectionAllRowDatas: (NSDictionary *) data section: (NSInteger) section;
//获取caption的宽度
-(NSInteger) getCaptionWidth: (NSDictionary *) data;
-(NSDictionary *) getConfigData;
-(void) saveData: (NSDictionary *) rowData section: (NSInteger) section row: (NSInteger) row;
@end

@implementation UIDataTable
@synthesize dataSource = dataSource_, delegate = delegate_, dataPath = dataPath_;
//定义常量
static NSString *keyConfig = @"config";
static NSString *keySectionHeader = @"title";
static NSString *keySectionItems = @"items";
static NSString *keyRowLeftMargin = @"leftMargin";
static NSString *keyRowRightMargin = @"rightMargin";
static NSString *keyRowType = @"type";
static NSString *keyRowGuid = @"guid";
static NSString *keyRowContent = @"content";
static NSString *keyRowCaption = @"caption";
static NSString *keyRowHeight = @"height";
static NSString *keyRowAlign = @"align";
static NSString *keyRowValue = @"value";
static NSString *keyCaptionAlign = @"captionAlign";
static NSString *keyContentAlign = @"contentAlign";
static NSString *keyRowStyle = @"style";
static NSInteger kRightMargin = 15;

- (id)initWithFrame:(CGRect)frame style:(UITableViewStyle)style
{
    self = [super initWithFrame:frame];
    if (self) {
      tbMain = [[UITableView alloc] initWithFrame:frame style: style];
      tbMain.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
      tbMain.backgroundColor = [UIColor clearColor];
      tbMain.dataSource = self;
      tbMain.delegate = self;
      [self addSubview: tbMain];
      [tbMain release];
    }
    return self;
}

-(void) setDataSource:(NSDictionary *)dataSource
{
  dataSource_ = [dataSource retain];
  NSDictionary *config = [self getConfigData];
  cellLeftPadding_ = [[config objectForKey: @"leftPadding"] intValue];
  cellRightPadding_ = [[config objectForKey: @"rightPadding"] intValue]; 
  rowHeight_ = [[config objectForKey: @"rowHeight"] intValue];
  captionWidth_ = [[config objectForKey: @"captionWidth"] intValue];
}
#pragma -
#pragma mark Private
//获取每一行的数据
-(NSDictionary *) getRowData:(NSDictionary *)data section:(NSInteger)section row:(NSInteger)row
{
  NSArray *items = [self getSectionAllRowDatas: data section: section];
  if(items == nil || row >= items.count) return nil;
  return [items objectAtIndex: row];
}

//绘制单元格
-(void) drawCell:(UITableViewCell *)cell data:(NSDictionary *)data
{
  NSNumber *guid = [data objectForKey: keyRowGuid];
  if(self.delegate &&
     [self.delegate respondsToSelector: @selector(onDisplayDataRow:)] && 
     guid != nil &&
     ![self.delegate onDisplayDataRow: [guid intValue]]){
    return;
  }
  
  if(guid == nil) cell.accessoryType = UITableViewCellAccessoryNone;
  //获取行的类型
  NSInteger rowType = [[data objectForKey: keyRowType] intValue];
  switch (rowType) {
    case DataTableRowSignleLineText:
      [self drawCellSignleLine:cell data:data];
      break;
    case DataTableRowCaptionContent:
      [self drawCellCaptionContent:cell data:data];
      break;
    case DataTableRowRating:
      [self drawCellRating:cell data:data];
      break;
    case DataTableRowSwitch:
      [self drawCellSwitch:cell data:data];
      break;
  }
}

//绘制单行的文本
-(void) drawCellSignleLine:(UITableViewCell *)cell data:(NSDictionary *)data
{
  CGRect rect = [self getCellFrame: cell];
  NSNumber *align = [data objectForKey: keyRowAlign];
  NSString *style = [data objectForKey: keyRowStyle];
  [self addLabel:cell frame:rect text:[data objectForKey: keyRowContent] align:align style: style];
}

//绘制开关
-(void) drawCellSwitch:(UITableViewCell *)cell data:(NSDictionary *)data
{
  CGRect cellRect = cell.frame;
  UISwitch *sw = [[UISwitch alloc] init];
  [sw addTarget:self action:@selector(clickedSwitch: ) forControlEvents:UIControlEventValueChanged];
  //重新设置位置
  CGRect swRect = sw.frame;
  swRect.origin.y = (cellRect.size.height - swRect.size.height) / 2;
  swRect.origin.x = cellRect.size.width - swRect.size.width - 10;
  sw.frame = swRect;
  sw.autoresizingMask = UIViewAutoresizingFlexibleLeftMargin;
  sw.on = [[data objectForKey: keyRowValue] boolValue];
  [cell.contentView addSubview: sw];
  
  //绘制Label
  CGRect rect = [self getCellFrame: cell];
  rect.size.width = swRect.origin.x;
  [self addLabel:cell frame:rect text:[data objectForKey: keyRowCaption] align: UITextAlignmentLeft style:nil];
}

//绘制标题与内容的行
-(void) drawCellCaptionContent:(UITableViewCell *)cell data:(NSDictionary *)data
{  
  //创建label
  CGRect rect = [self getCellFrame: cell];
  rect.size.width -= kRightMargin;
  CGFloat cellWidth = rect.size.width;
  rect.size.width = [self getCaptionWidth: data];
  [self addLabel:cell frame:rect text:[data objectForKey: keyRowCaption] align:[data objectForKey: keyCaptionAlign] style:nil];
  //获取content的值
  //判断是否有宏
  NSString *macro = [data objectForKey: @"macro"];
  NSInteger guid = [[data objectForKey: keyRowGuid] intValue];
  NSString *content;
  if(self.delegate &&
     [self.delegate respondsToSelector: @selector(onGetMacro:macro:guid:)] &&
     macro != nil){
    content = [self.delegate onGetMacro:DataTableRowCaptionContent macro:macro guid:guid];
  }else{
    content = [data objectForKey: keyRowContent];
  }
  rect.origin.x = rect.size.width;
  rect.size.width = cellWidth - rect.size.width;
  [self addLabel:cell frame:rect text: content align:[data objectForKey: keyContentAlign] style: nil];
}

//绘制评分的单元格
-(void) drawCellRating:(UITableViewCell *)cell data:(NSDictionary *)data
{
  
  UIImage *normalImage = [UIImage imageNamed: [data objectForKey: @"noramlImage"]];
  UIImage *highlightImage = [UIImage imageNamed: [data objectForKey: @"highlightImage"]];
  NSInteger ratingCount =  [[data objectForKey: @"rating"] intValue];
  NSInteger space = 5;
  
  CGRect cellRect = [self getCellFrame: cell];
  CGFloat ratingWidth = (space + normalImage.size.width) * ratingCount;
  CGFloat ratingX = cellRect.size.width - ratingWidth;
  CGFloat ratingY = (cellRect.size.height - normalImage.size.width) / 2;
  CGRect ratingRect = CGRectMake(ratingX, ratingY, ratingWidth, normalImage.size.height);
  //添加Rating
  UIRating *rating = [[UIRating alloc] initWithFrame:ratingRect];
  rating.ratingCount = ratingCount;
  rating.noramlImage = normalImage;
  rating.highlightImage = highlightImage;
  [cell.contentView addSubview: rating];
  
  //绘制Caption
  cellRect.size.width = [self getCaptionWidth: data];
  [self addLabel:cell frame:cellRect text:[data objectForKey: keyRowCaption] align:[data objectForKey: keyCaptionAlign] style:nil];
}

//添加Label
-(UILabel *) addLabel:(UITableViewCell *)cell frame:(CGRect)frame text:(NSString *)text align:(NSNumber *)align style: (NSString *) style
{
  UILabel *lbl = [[UILabel alloc] initWithFrame:frame];
  lbl.autoresizingMask = UIViewAutoresizingFlexibleWidth;
  lbl.text = NSLocalizedString(text, nil);
  if(align != nil) lbl.textAlignment = [align intValue];
  lbl.backgroundColor = [UIColor clearColor];
  [cell.contentView addSubview: lbl];
  [self setLabelStyle: lbl style:style];
  [lbl release];
  return lbl;
}

//设置Label的样式
-(void) setLabelStyle:(UILabel *)label style:(NSString *)style
{
  if(style == nil) return;
  NSDictionary *dictStyle = [CoreGeneral JSONObjectWithString: style];
  if(dictStyle == nil) return;
  //设置颜色
  NSString *strColor = [dictStyle objectForKey: @"color"];
  if(strColor != nil){
    label.textColor = [GraphicHelper rgba2Color: strColor];
  };
  
  //设置字体
  NSString *strFont = [dictStyle objectForKey: @"font"];
  if(strFont != nil){
    UIFont *font = label.font;
    label.font = [UIFont fontWithName:strFont size:font.pointSize];
  };
  
  //设置字体大小
  NSNumber *fSize = [dictStyle objectForKey: @"font-size"];
  if(fSize != nil){
    UIFont *font = label.font;
    label.font = [UIFont fontWithName:font.fontName size: [fSize intValue]];
  };
}

//获取cell的实际大小
-(CGRect) getCellFrame:(UITableViewCell *)cell
{
  CGRect rect = cell.frame;
  rect.size.width -= 20;
  rect.origin.x = 5;
  rect.size.height -= 5;
  return rect;
}

//获取配置的数据
-(NSDictionary *) getConfigData
{
  return [dataSource_ objectForKey: keyConfig];
}

//获取section下的所有行数据
-(NSArray *) getSectionAllRowDatas:(NSDictionary *)data section:(NSInteger)section
{
  //获取数据
  NSArray *datas = [data objectForKey: keySectionItems];
  //获取某个节点的数据
  NSDictionary *dict = [datas objectAtIndex: section];
  //获取行数据
  return [dict objectForKey: keySectionItems];
}

-(NSInteger) getCaptionWidth:(NSDictionary *)data
{
  static NSString *kCaptionWidth = @"captionWidth";
  NSNumber *captionW = [data  objectForKey: kCaptionWidth];
  if(captionW == nil) return captionWidth_;
  return [captionW intValue];
}
#pragma -
#pragma mark 事件处理
-(void) saveData:(NSDictionary *)rowData section:(NSInteger)section row:(NSInteger)row
{
  NSMutableDictionary *optionData = [[NSMutableDictionary alloc] initWithContentsOfFile: self.dataPath];
  //修改items/item[section]/items/item[row]
  NSMutableArray *sectionItems = [NSMutableArray arrayWithArray: [self getSectionAllRowDatas: optionData section: section]];
  [sectionItems replaceObjectAtIndex: row withObject: [NSDictionary dictionaryWithDictionary:rowData]];
  
  //修改items/item[section]
  NSMutableArray *items = [NSMutableArray arrayWithArray: [optionData objectForKey: keySectionItems]];
  
  //修改items/item[section]/items
  NSMutableDictionary *sectionDict = [NSMutableDictionary dictionaryWithDictionary: [items objectAtIndex: section]];
  [sectionDict setValue: sectionItems forKey:keySectionItems];
  [items replaceObjectAtIndex: section withObject: sectionDict];
  
  //修改items
  [optionData setValue: items forKey: keySectionItems];
  
  [optionData writeToFile: self.dataPath atomically: YES];
  [optionData release];
}
//switch事件的改变
-(void) clickedSwitch:(UISwitch *)sender
{
  UITableViewCell *cell = (UITableViewCell *)sender.superview.superview;
  NSIndexPath *indexPath = [tbMain indexPathForCell: cell];
  NSInteger row = [indexPath row];
  NSInteger section = [indexPath section];
  
  //修改items/item[section]/items/item[row]
  NSMutableDictionary *rowData = [NSMutableDictionary dictionaryWithDictionary: [self getRowData: dataSource_ section: section row:row]];
  [rowData setValue:[NSNumber numberWithBool: sender.on] forKey: keyRowValue];
  [self saveData: rowData section:section row: row];
  
  NSNumber *guid = [rowData objectForKey: keyRowGuid];
  if(self.delegate &&
     [self.delegate respondsToSelector: @selector(onChangeSwitchValue:value:)]){
    [self.delegate onChangeSwitchValue: [guid intValue] value: sender.on];
  }
}
#pragma -
#pragma mark 实现Table的协议
-(NSInteger) numberOfSectionsInTableView:(UITableView *)tableView
{
  NSArray *items = [dataSource_ objectForKey: keySectionItems];
  return items.count;
}

//选择某行
-(void) tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
  [tableView deselectRowAtIndexPath: indexPath animated:YES];
  NSDictionary *data = [self getRowData: dataSource_ section: [indexPath section] row: [indexPath row]];
  NSNumber *guid = [data objectForKey: keyRowGuid];
  if(guid == nil) return;   //必需有一个guid才响应事件
  if(self.delegate &&
     [self.delegate respondsToSelector: @selector(onSelectDataTableRow:data:)]){
    [self.delegate onSelectDataTableRow:[guid intValue] data: data];
  }
}

//获取section的标题
-(NSString *) tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section
{
  NSArray *items = [dataSource_ objectForKey: keySectionItems];
  NSDictionary *dict = [items objectAtIndex: section];
  return [dict objectForKey: keySectionHeader];
}

//获取行数据
-(NSInteger) tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
  return [self getSectionAllRowDatas: dataSource_ section: section].count;
}

//获取高度
-(CGFloat) tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
  NSInteger section = [indexPath section];
  NSInteger row = [indexPath row];
  NSDictionary *dictRow = [self getRowData: dataSource_ section:section row:row];
  
  //判断是否要隐藏
  NSNumber *guid = [dictRow objectForKey: keyRowGuid];
  //NSLog(@"%d, %@", [guid intValue],  dictRow);
  if(self.delegate &&
     [self.delegate respondsToSelector: @selector(onDisplayDataRow:)] &&
     guid != nil &&
     ![self.delegate onDisplayDataRow: [guid intValue]]){
    return 0;
  };
  
  NSNumber *rowHeight = [dictRow objectForKey: keyRowHeight];
  
  //获取到正确的值返回
  if(rowHeight != nil) return [rowHeight intValue];
  
  //没有行高，查找默认的高度
  NSDictionary *dictSection = [dataSource_ objectForKey: keyConfig];
  rowHeight = [dictSection objectForKey: keyRowHeight];
  //如果有默认值，则使用
  if (rowHeight != nil) return [rowHeight intValue];
  return 40;
}

//获取每一行的数据
-(UITableViewCell *) tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
  NSInteger row = [indexPath row];
  static NSString *kCellID = @"cellID";
	UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:kCellID];
	if (cell == nil)
	{
		cell = [[[UITableViewCell alloc] initWithFrame:CGRectZero] autorelease];
    cell.accessoryType = UITableViewCellAccessoryDisclosureIndicator;
    cell.selectionStyle = UITableViewCellSelectionStyleGray;
    [self drawCell: cell data: [self getRowData: dataSource_ section:[indexPath section] row:row]];
  }
  return  cell;
}

#pragma -
#pragma mark Public Method
-(void) reloadData
{
  [tbMain reloadData];
}

//读取指定行的值
-(id) getRowValue: (NSDictionary *) data section: (NSInteger) section row: (NSInteger) row
{
  NSDictionary *rowData = [self getRowData: data section:section row:row];
  if(rowData != nil){
    return [rowData objectForKey: keyRowValue];
  }else{
    return nil;
  }
}

//根据guid获取值
-(id) getValueWithGuid:(NSDictionary *)data section:(NSInteger)section guid:(NSInteger)guid
{
  NSArray *items = [self getSectionAllRowDatas:data section:section];
  id result = nil;
  for(int i = 0; i < items.count; i ++){
    NSDictionary *dict = [items objectAtIndex: i];
    if([[dict objectForKey: keyRowGuid] intValue] == guid){
      //NSLog(@"%@", dict);
      result = [dict objectForKey: keyRowValue];
      break;
    }
  }
  return  result;
}
@end
