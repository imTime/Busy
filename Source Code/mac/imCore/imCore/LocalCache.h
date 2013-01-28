//
//  localCache.h
//  imBoxV2
//
//  Created by  on 11-9-30.
//  Copyright 2011年 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "CoreGeneral.h"

@interface LocalCache : NSURLCache{
  NSMutableDictionary *package;
  NSDictionary *dictMapping;
}

+ (id)sharedManager;
@end
