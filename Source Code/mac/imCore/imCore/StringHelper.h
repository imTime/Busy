//
//  StringHelper.h
//  imCore
//
//  Created by yi conis on 5/16/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "RegexKitLite.h"

/*字符处理相关辅助类*/
@interface StringHelper : NSObject
//截取字符
+(NSString *) substring: (NSString *) text length: (NSInteger) length;
//格式化为符合js标准的值，替换换行以及"
+(NSString *) formatJavascriptText:(NSString *)text;
//将文本替换为HTML，主要是替换换行和空格
+(NSString *) text2Html: (NSString *) text;
//替换Nil值为""
+(NSString *) replaceNil: (NSString *) text;
//替换掉html标签
+(NSString *) replaceHtmlTag: (NSString *) html;
//将js的Bool转换为Cocoa的Bool
+(BOOL) javascript2CocoaBool:(NSString *)value;
//将Cocoal的bool转换为js中的bool
+(NSString *) cocoa2JavascriptBool:(BOOL)value;
//提取邮件中的用户名
+(NSString *) extractMailUser: (NSString *) email;
@end
