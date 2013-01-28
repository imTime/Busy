//
//  localCache.m
//  imBoxV2
//
//  Created by  on 11-9-30.
//  Copyright 2011年 __MyCompanyName__. All rights reserved.
//

#import "LocalCache.h"
#import "RegexKitLite.h"
#import "zip/ZipArchive.h"

static LocalCache *localCacheManager = nil;
//解压缩的密码
#define kUnZipPassword @"kls*&s;0sKsK&lx=-)"

@interface LocalCache(Private)
- (NSString *) findCachePath:(NSString *)url ;
- (NSString *) getMimeType:(NSString *)url;
-(void) unZipCacheFile;
-(BOOL) isMapping: (NSString *) path;
@end

@implementation LocalCache

#pragma mark -
#pragma mark 单例模式的方法

+ (id)sharedManager 
{
	@synchronized(self) 
	{
		if (localCacheManager == nil){
			[[self alloc] init]; 
    }
	}
	return localCacheManager;
}

+ (id)allocWithZone:(NSZone *)zone
{
	@synchronized(self) {
		if (localCacheManager == nil) 
		{
			localCacheManager = [super allocWithZone:zone];
			return localCacheManager; 
		}
	}
	return nil;
}

- (id)copyWithZone:(NSZone *)zone
{
	return self;
}
- (id)retain
{
	return self;
}

- (unsigned)retainCount
{
	return UINT_MAX;  //denotes an object that cannot be released
}

- (void)release
{
	// never release
}

- (id)autorelease
{
	return self;
}

/*
 * 根据映射表，检测是否区域映射
 */
-(BOOL) isMapping:(NSString *)path
{
  NSArray *rules = dictMapping[@"rules"];
  //循环匹配
  for(int i = 0; i < rules.count; i ++){
    NSString *rule = rules[i];
    if([path isMatchedByRegex:rule]) return YES;
  };
  return NO;
}

//查找本地缓存的位置
- (NSString *) findCachePath:(NSString *)path
{
  NSString *rootDir = [[NSBundle mainBundle] bundlePath];
  NSString *localFile = [NSString stringWithFormat:@"%@/content%@", rootDir , path];
  
  //检测本地文件是否存在
  if([CoreGeneral fileExists: localFile]) return localFile;
  if([CoreGeneral sharedManager].isDebug){
    NSLog(@"找不到本地文件：%@", localFile);
  };
  return NO;
}

//通过文件的扩展名，或者对应的MIME类型，注意， url应该是本地文件名
-(NSString *) getMimeType:(NSString *)url
{
	//获取文件扩展名
	NSString *ext = [url pathExtension];
	NSString *mime;
	//暂时用if，以后应该改为字典，这个可能有问题
	if([ext isEqualToString: @"html"] || [ext isEqualToString: @"css"]|| [ext isEqualToString: @"xml"]){
		mime = [NSString stringWithFormat: @"text/%@", ext];
	}else if([ext isEqualToString: @"js"]){
		mime = @"application/x-javascript";
	}else if([ext isEqualToString: @"png"] || [ext isEqualToString: @"gif"] || [ext isEqualToString: @"jpg"]){
		mime = [NSString stringWithFormat: @"image/%@", ext];
  }else{
		mime = @"";
	}
	return mime;
}


//读取zip包到内存中
-(void) unZipCacheFile
{
  //读取压缩文件
  package = [[NSMutableDictionary alloc] init ];
  ZipArchive* zip = [[ZipArchive alloc] init];
  NSString* path = [[NSBundle mainBundle] pathForResource:@"main" ofType:nil];
  //读取zip文件
	if( [zip UnzipOpenFile:path Password: kUnZipPassword])
	{
		NSArray *files = [zip UnzipFileToData];
    NSDictionary *dictFile;
    if(files != nil){
      for(int i = 0; i < [files count]; i ++){
        dictFile = [files objectAtIndex:i];
        NSString *fileName = [dictFile objectForKey:@"filename"];
        fileName = [CoreGeneral MD5:fileName];
        //NSLog(fileName);
        [package setObject:[dictFile objectForKey:@"data"] 
                         forKey:fileName];
      }     
    }
		[zip UnzipCloseFile];
	}
  
	[zip release];
}

//请求缓存
/*
 警告，使用缓存的时候要注意策略，特别是AJAX不要使用缓存，否则会导致旧数据的情况
 这里的业务逻辑还要深化，可以根据策略选择哪些可以缓存，对于html/image/css/js类进行缓存
 其它直接向服务器请求，不需要缓存的，不要用[super cachedResponseForRequest:request];
*/
- (NSCachedURLResponse *)cachedResponseForRequest:(NSURLRequest *)request
{
  BOOL isDebug = [CoreGeneral sharedManager].isDebug;
  if(isDebug){
    NSLog(@"开始映射：%@", [[request URL] path]);
  }
  
  NSString *host = [[request URL] host];
  NSString *path = [[request URL] path];        //取路径
	NSString *ext = [path pathExtension];

  //目前的情况，没有扩展名的都是JSON数据
  if([ext length] == 0){
    if(isDebug){
      NSLog(@"JSON数据，直接请求服务器：%@", path);
    };
    
    return nil;
  };
  
  //解开压缩包中的缓存文件
  if(![CoreGeneral sharedManager].isDebug && package == nil){
    [self unZipCacheFile];
  };
  
  //读取影射文件
  if(dictMapping == nil){
     NSString *mpFile = [[NSBundle mainBundle] pathForResource:@"mapping" ofType:@"plist"];
    dictMapping = [[NSDictionary dictionaryWithContentsOfFile: mpFile] retain];
  };


  NSString *compreHost = dictMapping[@"host"];
  //只有host为mobile.imtime.com的情况下，才需要缓存
  if (![host compare:compreHost options:NSCaseInsensitiveSearch] == NSOrderedSame) {
    if(isDebug){
      NSLog(@"未匹配的host：%@", path);
    };
    return [super cachedResponseForRequest:request];
  };
  
  
  //检查是否需要映射
  if(![self isMapping: path]){
      return [super cachedResponseForRequest:request];
  };
  
  NSData *data = nil;

  //查找是否在zip文件内，目前只有hummer中的css和js文件在zip内
  if([package count] > 0){
    //将路径转换为md5作为key
    NSString *fileName = [path substringFromIndex:1];
    NSString *key = [CoreGeneral MD5: fileName];
    //NSLog(fileName);
    NSMutableData *mData = [package valueForKey:key];
    //找到key
    if(mData != nil) data = [NSData dataWithData:mData];
  };
  
  //从package中找不到，则从本地缓存找
  if(data == nil){
    //查找本地缓存
    NSString *localPath = [self findCachePath:path];
    //没有找到本缓存，直接调用超类的方法
    if(localPath == nil){
      return [super cachedResponseForRequest:request];
    }else{
      data = [NSData dataWithContentsOfFile:localPath];
    }
  };
  
  //NSLog([[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]);
  
  NSString *mime = [self getMimeType:path];
	//创建缓存响应，并写入到缓存中
	NSURLResponse *response =
	[[[NSURLResponse alloc]
	  initWithURL:[request URL]
	  MIMEType: mime
	  expectedContentLength:[data length]
	  textEncodingName:nil] autorelease];
  
  if(isDebug){
    NSLog(@"成功影射文件：%@，MEIE：%@", path, mime);
  };
  //NSLog(@"OK %@", path);
  return [[[NSCachedURLResponse alloc] initWithResponse:response data:data] autorelease];
}

- (void)dealloc {
  [package release];
  package = nil;
	[super dealloc];
}


@end
