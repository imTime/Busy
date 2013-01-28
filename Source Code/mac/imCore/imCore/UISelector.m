//
//  UISelectorViewController.m
//  imCore
//
//  Created by conis yi on 7/22/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "UISelector.h"
/*
@implementation UISelectorSection
@synthesize items = items_;

@end
*/

@interface UISelector ()
-(void) createComponent;
@end

@implementation UISelector
@synthesize delegate = delegate_, data = data_, multiSelect = multiSelect_,
rowHeight = rowHeight_;

static NSInteger kTagChecked = 1;

-(void) dealloc
{
  
  [super dealloc];
}

- (id)initWithFrame:(CGRect)frame
{
  self = [super initWithFrame:frame];
  if (self) {
    self.rowHeight = 40;
    self.multiSelect = 1;
    [self createComponent];
  }
  return self;
}

#pragma -
#pragma mark Private Methods
-(void) createComponent
{
  tbSelector = [[UITableView alloc] initWithFrame: self.bounds];
  tbSelector.delegate = self;
  tbSelector.dataSource = self;
  [self addSubview: tbSelector];
  [tbSelector release];
}

#pragma -
#pragma mark Public Methods
-(void) render:(NSArray *)data
{
  selectedCount = 0;
  self.data = data;
  [tbSelector reloadData];
}

//当前选择的索引，只取一个
-(NSInteger) selectedIndex
{
  for(int i = 0; i < [tbSelector numberOfRowsInSection: 0]; i ++){
    NSIndexPath *path = [NSIndexPath indexPathForRow:i inSection: 0];
    UITableViewCell *cell = [tbSelector cellForRowAtIndexPath: path];
    if(cell.accessoryType == UITableViewCellAccessoryCheckmark) return i;
  };
  return -1;
}

//根据值选中某项
-(void) selectedItemWithValue:(id)value
{
  NSInteger index = -1;
  //找到值对应的索引
  for(int i = 0; i < self.data.count; i ++){
    if([[self.data objectAtIndex: i] isEqual: value]){
      index = i;
      break;
    };
  };
  
  if(index != -1) [self selectedItem: index];
}

//选择某项
-(void) selectedItem:(NSInteger)index
{
  for(int i = 0; i < [tbSelector numberOfRowsInSection: 0]; i ++){
    NSIndexPath *path = [NSIndexPath indexPathForRow:i inSection: 0];
    UITableViewCell *cell = [tbSelector cellForRowAtIndexPath: path];
    //if(cell.accessoryType == UITableViewCellAccessoryCheckmark) continue;
    if(i == index && cell.accessoryType == UITableViewCellAccessoryCheckmark) continue;
    
    if(i == index && cell.accessoryType != UITableViewCellAccessoryCheckmark){
      cell.accessoryType = UITableViewCellAccessoryCheckmark;
    }else{
      cell.accessoryType = UITableViewCellAccessoryNone;
    };
  };
  
  
  /*
  //多选[self.multiSelect > 1]，且已选的已经等于最大允许选择的数量，只允许取消
  if(self.multiSelect > 1 && selectedCount >= self.multiSelect){
    NSIndexPath *path = [NSIndexPath indexPathForRow:index inSection: 0];
    UITableViewCell *cell = [tbSelector cellForRowAtIndexPath: path];
    UIView *imgView = [cell.contentView viewWithTag: kTagChecked];
    if(!imgView.hidden){
      imgView.hidden = YES;
      selectedCount --;
    };
    return;
  };
  
  //正常的选择
  for(int i = 0; i < [tbSelector numberOfRowsInSection: 0]; i ++){
    NSIndexPath *path = [NSIndexPath indexPathForRow:i inSection: 0];
    UITableViewCell *cell = [tbSelector cellForRowAtIndexPath: path];
    UIView *imgView = [cell.contentView viewWithTag: kTagChecked];
    imgView.hidden = i != index;
  };
  */
}

//选中
-(void) selectedItems:(NSArray *)indexes
{
  for(int i = 0; i < [tbSelector numberOfRowsInSection: 0]; i ++){
    NSIndexPath *path = [NSIndexPath indexPathForRow:i inSection: 0];
    UITableViewCell *cell = [tbSelector cellForRowAtIndexPath: path];
    UIView *imgView = [cell.contentView viewWithTag: kTagChecked];
    for (int j = 0; j < indexes.count; j++) {
      if(j == [[indexes objectAtIndex: j] intValue]){
        imgView.hidden = NO;
        continue;
      };
      imgView.hidden = YES;
    };
  };
}

#pragma -
#pragma mark TableView的委托

//选择某行
-(void) tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
  NSInteger row = [indexPath row];
  [tableView deselectRowAtIndexPath: indexPath animated: NO];
  [self selectedItem: row];
  
  //调用委托
  if(!self.delegate ||! [self.delegate respondsToSelector: @selector(onSelectedItem:value:)]) return;
  UITableViewCell *cell = [tableView cellForRowAtIndexPath: indexPath];
  if(cell.accessoryType == UITableViewCellAccessoryCheckmark){
    id value = [self.data objectAtIndex: row];
    [self.delegate onSelectedItem:row value: value];
  }
}

//获取行数据
-(NSInteger) tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
  NSInteger count = self.data ? self.data.count : 0;
  return count;
}

//获取高度
-(CGFloat) tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
  return self.rowHeight;
}

//获取每一行的数据
-(UITableViewCell *) tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
  /*
   显示颜色，标题，总跟踪时间，当前状态
   */
  
  NSInteger row = [indexPath row];
  static NSString *kCellID = @"cellID";
	UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:kCellID];
	if (cell == nil)
	{
    cell = [[[UITableViewCell alloc] initWithFrame:CGRectZero] autorelease];
    cell.accessoryType = UITableViewCellAccessoryNone;
    cell.selectionStyle = UITableViewCellSelectionStyleNone;
    
    
    /*
    //添加选中的图片
    UIImage *imgChecked = [CoreGeneral getCoreImage: @"UISelector_Checked"];
    UIImageView *imgView = [[UIImageView alloc] initWithImage:imgChecked];
    CGFloat y = (cell.bounds.size.height - imgChecked.size.height) / 2;
    CGRect rect = CGRectMake(margin, y, imgChecked.size.width, imgChecked.size.height);
    imgView.frame = rect;
    imgView.hidden = YES;
    imgView.tag = kTagChecked;
    [cell.contentView addSubview: imgView];
    //[imgChecked release];
    //[imgView release];
    */
    
    id value = [self.data objectAtIndex: row];
    //包括委托函数，则直接交给委托函数处理
    if(self.delegate && [self.delegate respondsToSelector: @selector(createSelectorItem:index:value:)]){
      [self.delegate createSelectorItem:cell index: row value: value];
      return  cell;
    };
    cell.textLabel.text = [NSString stringWithFormat: @"%@", value];
    
    /*
    //自行处理，添加一个Label
    CGFloat x = rect.origin.x + rect.size.width + margin;
    CGFloat w = cell.bounds.size.width - x - margin;
    
    rect = CGRectMake(x, 0, w, cell.bounds.size.height);
    UILabel *lbl = [[UILabel alloc] initWithFrame: rect];
    lbl.backgroundColor = [UIColor clearColor];
    lbl.text = [NSString stringWithFormat: @"%@", value];
    [cell.contentView addSubview: lbl];
    [lbl release];
    */
  }
  
  return cell;
}

@end
