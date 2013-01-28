//
//  SysHash.h
//  imCore
//
//  Created by yi conis on 3/14/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface SysHash : NSObject

-(void) save: (NSString *) key value: (NSString *) value unique: (BOOL) unique;
-(NSString *) getWithKey: (NSString *) key;
-(NSArray *) getArrayWithKey: (NSString *) key;
-(void) insert: (NSString *) key value: (NSString *) value;
-(void) update: (NSInteger) hashId key: (NSString *) key value: (NSString *) value;
@end
