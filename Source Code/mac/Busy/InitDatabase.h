//
//  InitDatabase.h
//  ColorDocument
//
//  Created by conis on 11-12-2.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "Common.h"
#import "imCore/Sqlite/FMDatabase.h"
#import "imCore/Sqlite/FMDatabaseAdditions.h"
#import "imCore/Sqlite/ModelSqlite.h"
#import "imCore/Sqlite/SysHash.h"

@class FMDatabase;
@interface InitDatabase : NSObject {

}

-(void) createTable;

@end