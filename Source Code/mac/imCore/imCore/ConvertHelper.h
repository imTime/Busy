//
//  ConvertHelper.h
//  imCore
//
//  Created by yi conis on 5/10/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "CoreGeneral.h"
//转换相关的类，例如日期转换，
@interface ConvertHelper : NSObject

+(NSDate *) numberToDate: (NSNumber *) number;
+(NSNumber *) dateToNumber:(NSDate *)date;
+(NSString *)dateToString: (NSDate *) date;
+(NSDate *)stringToDate:(NSString *) text;
+(NSString *)dateToStringWith: (NSDate *) date format: (NSString *) fmt;
+(NSDate *)stringToDateWith: (NSString *) format text: (NSString *) aText;

@end
