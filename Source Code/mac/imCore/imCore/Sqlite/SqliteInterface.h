//
//  SqliteInterface.h
//  ColorDocument
//
//  Created by conis on 11-12-3.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "FMDatabase.h"
#import "FMDatabaseAdditions.h"
#import "imCore/CoreGeneral.h"

@class FMDatabase;


@interface SqliteInterface : NSObject {
  NSString *dbRealPath;
  FMDatabase *dbo;
}

@property (nonatomic, retain) NSString *dbRealPath;
@property (nonatomic, retain) FMDatabase *dbo;

+ (SqliteInterface *)sharedSqliteInterface;
- (void) connectDB;
- (void) closeDB;
- (void) setupDB : (NSString *)dbFileName;
@end