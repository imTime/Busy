//
//  ImageHelper.h
//  imCore
//
//  Created by yi conis on 5/10/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

//图片自理类

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "CoreGeneral.h"

@interface GraphicHelper : NSObject

+(UIColor *) mateColor: (UIColor *) color offset: (CGFloat) offset;
+(UIColor *) lineGradient: (UIColor *) from to: (UIColor *) to;
+(NSString *) color2Hex:(UIColor *)color;
+(UIColor *) hex2Color:(NSString *)hex;
+(NSString *) color2Rgba: (UIColor *) color;
+(void) extractRgba: (NSString *) color  red: (CGFloat *) red green: (CGFloat *) green blue: (CGFloat *) blue alpha: (CGFloat *) alpha;
+(UIColor *) rgba2Color: (CGFloat) red green: (CGFloat) g blue:(CGFloat) b alpha: (CGFloat) a;
+(UIColor *) rgb2Color: (CGFloat) red green: (CGFloat) g blue:(CGFloat) b;
+(UIColor *) rgba2Color: (NSString *) color;
+(void) color2rgba: (UIColor *) color red: (CGFloat *) red green: (CGFloat *) green blue: (CGFloat *) blue alpha: (CGFloat *) alpha;
+(UIColor *) colorFromImagePath: (NSString *) imagePath;
+(UIColor *) colorFromImage: (UIImage *) image;
+(UIColor *) transparentBlackColor: (CGFloat) alpha;
+(UIColor *) transparentWhiteColor: (CGFloat) alpha;
+(UIImage*) getGrayImage:(UIImage*)sourceImage;
//将图片等比缩放至指定大小以内
+(UIImage *) maxSizeImage: (UIImage *) image maxSize: (CGSize) maxSize;
+(UIImage *) scaleImage: (UIImage *) image scale: (CGFloat) scale;
+(UIImage *) newSizeImage: (UIImage *) image newSize: (CGSize) newSize;
+(BOOL) saveImage: (UIImage *) image savePath: (NSString *) savePath;
@end
