#import <Foundation/Foundation.h>
#import "ModelSqlite.h"
#import "CoreGeneral.h"

/*
 SQL:
 CREATE TABLE if not exists mf_sys_hash(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, key TEXT, value TEXT, flag INTEGER)
 */

@interface ModelSysHash : ModelSqlite{
  NSInteger ID;
  NSString *key;
  NSString *value;
  NSInteger flag;
}


@property NSInteger ID;
@property(nonatomic, retain) NSString *key;
@property(nonatomic, retain) NSString *value;
@property NSInteger flag;

//字段名称
+(NSString *)FieldID;
+(NSString *)FieldKey;
+(NSString *)FieldValue;
+(NSString *)FieldFlag;

@end