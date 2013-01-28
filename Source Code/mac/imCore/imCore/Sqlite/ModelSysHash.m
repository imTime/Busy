#import "ModelSysHash.h"
@implementation ModelSysHash
@synthesize ID, key, value, flag;

-(id)init{
  tableName = @"mf_sys_hash";
  fields = @"id, key, value, flag";
  self.ID = NSIntegerMax;
  return [super init];
}

-(NSArray *)getParameters{
  return [NSArray arrayWithObjects:
          self.key == nil ? [NSNull null] : self.key,
          self.value == nil ? [NSNull null] : self.value,
          [NSNumber numberWithInt: self.flag],
          [NSNumber numberWithInt: self.ID],
          nil];
}

-(int)insert{
  NSString *sql = @"INSERT INTO mf_sys_hash(%@) VALUES (%@)";
  NSString *insertFields = @"key, value, flag";
  NSString *insertValues = @"?,?,?";
  if(ID != NSIntegerMax){
    insertFields = [insertFields stringByAppendingString: @", id"];
    insertValues = [insertValues stringByAppendingString: @", ?"];
  }
  sql = [NSString stringWithFormat: sql, insertFields, insertValues];
  return [self insert:sql parameters:[self getParameters]];
}


-(BOOL)update{
  FMDatabase *dbo = [self getDatabase];
  NSString *sql = @"UPDATE mf_sys_hash SET key = ?, value = ?, flag = ? WHERE id = ?";
  [dbo open];
  [dbo executeUpdate:sql withArgumentsInArray: [self getParameters]];
  [dbo close];
  return YES;
}

-(BOOL) getOne: (FMResultSet *) rs{
  BOOL haveResult = NO;
  while([rs next])
  {
    if(haveResult) break;
    haveResult = YES;
    self.ID = [rs intForColumn:@"id"];
    self.key = [rs stringForColumn:@"key"];
    self.value = [rs stringForColumn:@"value"];
    self.flag = [rs intForColumn:@"flag"];
  }
  return haveResult;
}

+(NSString*) getTableName{
  return @"mf_sys_hash";
};

+(NSString*) getFields{
  return @"id, key, value, flag";
};


+(NSString*)FieldID{
  return @"id";
}

+(NSString*)FieldKey{
  return @"key";
}

+(NSString*)FieldValue{
  return @"value";
}

+(NSString*)FieldFlag{
  return @"flag";
}

@end