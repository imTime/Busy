//
//  ConvertHelper.m
//  imCore
//
//  Created by yi conis on 5/10/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "ConvertHelper.h"

@implementation ConvertHelper
#define kLongDateFormat @"yyyy-MM-dd HH:mm:ss"
#pragma -
#pragma mark 日期与时间
//用标准的格式转换日期
+(NSDate *)stringToDate:(NSString *) text
{
	return [self stringToDateWith:text text:kLongDateFormat];
}

//根据指定格式转换日期
+(NSDate *)stringToDateWith:(NSString *)format text:(NSString *)aText
{
	NSDateFormatter *formate = [[NSDateFormatter alloc] init];
	[formate setTimeZone:[NSTimeZone defaultTimeZone]];
	[formate setDateFormat:format];
	NSDate *willdate = [formate dateFromString:aText];//这样就可以获取到了
	[formate release];
	return willdate;
}

//根据指定
+(NSString *)dateToStringWith: (NSDate *) date format: (NSString *) fmt
{
	NSDateFormatter *formate = [[NSDateFormatter alloc] init];
	[formate setTimeZone:[NSTimeZone defaultTimeZone]];
	[formate setDateFormat:fmt];
  NSString *result =[formate stringFromDate: date];
	[formate release];
	return result;
}

+(NSString *)dateToString: (NSDate *) date
{
  return [self dateToStringWith:date format:kLongDateFormat];
}


//将Number转换为日期
+(NSDate *) numberToDate: (NSNumber *) number
{
  if (number == 0) {
    return nil;
  };
  
  return [NSDate dateWithTimeIntervalSince1970: [number doubleValue]];
}

//将日期转换为Number
+(NSNumber *) dateToNumber:(NSDate *)date
{
  NSTimeInterval timer = 0.0f;
  if(date != nil){
    timer = [date timeIntervalSince1970];
  };
  return [NSNumber numberWithDouble: timer];
}

@end
