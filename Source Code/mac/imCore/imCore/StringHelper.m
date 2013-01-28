//
//  StringHelper.m
//  imCore
//
//  Created by yi conis on 5/16/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "StringHelper.h"

@implementation StringHelper
//安全截取字符
+(NSString *) substring: (NSString *) text length: (NSInteger) length
{
  if(text == nil) return text;
  return [text length] > length ? [text substringToIndex: length] : text;
}

#pragma -
#pragma mark 类方法，Javascript与Cocoa之间的转换
//字符串转换为Bool值
+(BOOL) javascript2CocoaBool:(NSString *)value
{
  return [value isEqualToString:@"true"] || [value isEqualToString: @"1"];
}

//字符串转换为Bool值
+(NSString *) cocoa2JavascriptBool:(BOOL)value
{
  return value ? @"true" : @"false";
}

//替换成为可以通过js传递的字符
+(NSString *) formatJavascriptText:(NSString *)text
{
  if(text == nil) return @"";
  //替换掉"
  text =[text stringByReplacingOccurrencesOfString:
         @"\"" withString:@"\\\""];
  //替换掉换行
  return [text stringByReplacingOccurrencesOfString:
          @"\n" withString:@"\\n"];
}

//将纯文本转换为基本的HTML格式，主要处理换行符和空格，HTML标签
+(NSString *) text2Html: (NSString *) text
{
  if (text == nil) return @"";
  //处理引号
  text = [text stringByReplacingOccurrencesOfString:
          @"\"" withString:@"\\\""];
  //处理空格
  text = [text stringByReplacingOccurrencesOfString:
          @" " withString:@"&nbsp;"];
  //处理尖括号
  text = [text stringByReplacingOccurrencesOfString:
          @"<" withString:@"&lt;"];
  text = [text stringByReplacingOccurrencesOfString:
          @">" withString:@"&gt;"];
  //处理换行
  text = [text stringByReplacingOccurrencesOfString:
          @"\n" withString:@"<br />"];
  return text;
}

//如果字符是nil，则转换为@""
+(NSString *) replaceNil: (NSString *) text
{
  if(text == nil) text = @"";
  return  text;
}

//替换掉html标签
+(NSString *) replaceHtmlTag:(NSString *)html
{
  if(html == nil) return html;
  NSString *replaceTo = @"";
  NSString *pattern = @"<.+?>";
  html = [html stringByReplacingOccurrencesOfRegex:pattern withString: replaceTo];
  pattern = @"</.+?>";
  html = [html stringByReplacingOccurrencesOfRegex:pattern withString: replaceTo];
  return html;
}

//提取邮件中的用户名，如果不符合邮件格式，则返回原有的字符
+(NSString *) extractMailUser: (NSString *) email
{
  NSString *pattern = @"^(.+)@.+$";
  if([email isMatchedByRegex:pattern]){
    return [email stringByMatching:pattern capture:1L];
  }else{
    return email;
  }
}
@end
