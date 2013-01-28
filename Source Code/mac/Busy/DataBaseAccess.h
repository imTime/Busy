//
//  DataBaseAccess.h
//  ColorDocument
//
//  Created by conis on 11-12-16.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

/*
 除了特殊的类，如InitDatabase外，所有出现Sql语句的地方，都由此类实现
 如果项目对Sqlite的操作较少，则所有与Sql相关的都在些类实现。否则可以单独建
*/

#import "imCore/Sqlite/ModelSqlite.h"
#import "Common.h"

@interface DataBaseAccess: NSObject

+(NSArray *) query: (NSString *)sql;
+(void) executeSql: (NSString *)sql;
+(NSInteger) insert: (NSString *)sql;
@end
