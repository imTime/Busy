//
//  SysHash.m
//  imCore
//
//  Created by yi conis on 3/14/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "SysHash.h"
#import "CoreGeneral.h"
#import "ModelSysHash.h"

@implementation SysHash

//保存key/value，如果受unique约束，则更新
-(void) save:(NSString *)key value:(NSString *)value unique:(BOOL)unique
{
  BOOL isUpdate = NO;
  NSInteger hashId = -1;
  if(unique){
    ModelSysHash *model = [[ModelSysHash alloc] init];
    NSString *cond = [NSString stringWithFormat: @" AND %@ = ?", [ModelSysHash FieldKey]];
    NSArray *params = [NSArray arrayWithObjects: key, value, nil];
    if([model getOne:cond parameters: params order:nil]){
      isUpdate = YES;
      hashId = model.ID;
    };
    [model release];
  };
  
  //更新
  if(isUpdate){
    [self update:hashId key:key value: value];
  }else{
    [self insert: key value: value];
  }
}

//插入
-(void) insert:(NSString *)key value:(NSString *)value
{
  ModelSysHash *model = [[ModelSysHash alloc] init];
  model.key = key;
  model.value = value;
  [model insert];
  [model release];
}

//更新
-(void) update:(NSInteger)hashId key:(NSString *)key value:(NSString *)value
{
  ModelSysHash *model = [[ModelSysHash alloc] init];
  if([model getWithPrimaryId: hashId]){
    model.key = key;
    model.value = value;
    [model update];
  };
  [model release];
}

//根据关键字获取值
-(NSString *) getWithKey:(NSString *)key
{
  NSString *value = nil;
  ModelSysHash *model = [[ModelSysHash alloc] init];
  NSString *cond = [NSString stringWithFormat: @" AND %@ = ?", [ModelSysHash FieldKey]];
  NSArray *params = [NSArray arrayWithObjects: key, nil];
  if([model getOne:cond parameters: params order:nil]){
    value = model.value;
  };
  [model release];
  return value;
}

-(NSArray *) getArrayWithKey:(NSString *)key
{
  return nil;
}
@end
