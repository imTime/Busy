//
//  ImageHelper.m
//  imCore
//
//  Created by yi conis on 5/10/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "GraphicHelper.h"

@implementation GraphicHelper

//根据偏移量获取
+(UIColor*) mateColor:(UIColor *)color offset:(CGFloat)offset
{
  CGFloat r, g, b, a;
  [self color2rgba:color red:&r green: &g blue: &b alpha: &a];
  
  CGFloat dOffset = offset * 2;
  r += offset;
  if(r > 255) r += -dOffset;
  if(r < 0) r += dOffset;
  
  g += offset;
  if(g > 255) g += -dOffset;
  if(g < 0) g += dOffset;
  
  b += offset;
  if(b > 255) g += -dOffset;
  if(b < 0) g += dOffset;
  
  return [self rgba2Color:r green:g blue:b alpha:a];
}

//根据开始及结束的颜色，获取标准50/50的渐变色
+(UIColor*) lineGradient:(UIColor *)from to:(UIColor *)to
{
  
  CGContextRef bitmapContext = CGBitmapContextCreate(NULL, 320, 480, 8, 4 * 320, CGColorSpaceCreateDeviceRGB(), kCGImageAlphaNoneSkipFirst);
  
  CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();

  CGFloat locations[] = { 0.0, 1.0 };
  NSArray *colors = [NSArray arrayWithObjects:(id)from, (id)to, nil];
  
  CGGradientRef gradient = CGGradientCreateWithColors(colorSpace, 
                                                      (CFArrayRef) colors, locations);

  
  // Draw Gradient Here
  CGContextDrawLinearGradient(bitmapContext, gradient, CGPointMake(0.0f, 0.0f), CGPointMake(100.f, 100.f), 0);
  
  // Create a CGImage from context
  
  CGImageRef cgImage = CGBitmapContextCreateImage(bitmapContext);
  
  // Create a UIImage from CGImage
  
  UIImage *uiImage = [UIImage imageWithCGImage:cgImage];
  
  // Release the CGImage
  
  CGImageRelease(cgImage);
  
  // Release the bitmap context
  
  CGContextRelease(bitmapContext);
  
  // Create the patterned UIColor and set as background color
  
  return [UIColor colorWithPatternImage: uiImage];
}


#pragma -
#pragma mark 类方法，对颜色的处理

//转换grb为color
+(UIColor *) rgb2Color:(CGFloat)red green:(CGFloat)g blue:(CGFloat)b
{
  return [self rgba2Color:red green:g blue:b alpha:1];
}

//转换grba为color
+(UIColor *) rgba2Color:(CGFloat)red green:(CGFloat)g blue:(CGFloat)b alpha:(CGFloat)a
{
  return [UIColor colorWithRed:red/255.f green:g/255.f blue:b/255.f alpha:a];
}

//获取一个指定透明度的黑色
+(UIColor *) transparentBlackColor: (CGFloat) alpha
{
  return [self rgba2Color:0 green:0 blue:0 alpha: alpha];
}

//获取一个指定透明度的白色
+(UIColor *) transparentWhiteColor: (CGFloat) alpha
{
  return [self rgba2Color:255 green:255 blue:255 alpha: alpha];
}

+(void) color2rgba: (UIColor *) color red: (CGFloat *) red green: (CGFloat *) green blue: (CGFloat *) blue alpha: (CGFloat *) alpha
{
  *red = 0, *green = 0, *blue = 0, *alpha = 0;
  if(color == [UIColor clearColor] || color == nil) return;
  
  const CGFloat* components = CGColorGetComponents(color.CGColor);
  CGFloat r = components[0], g = components[1], b = components[2];
  if(CGColorGetNumberOfComponents(color.CGColor) == 2)
  {
    //assuming it is grayscale - copy the first value
    b = g = r;
  }
  
  *red = r * 255.0f;
  *green = g * 255.0f;
  *blue = b * 255.0f;
  *alpha = CGColorGetAlpha(color.CGColor);
}

//15213165468
//将颜色转换为rgba的值
+(NSString *) color2Rgba: (UIColor *) color
{
  /*
   if(color == [UIColor clearColor]) return @"";
   const CGFloat* components = CGColorGetComponents(color.CGColor);
   CGFloat r = components[0], g = components[1], b = components[2];
   if(CGColorGetNumberOfComponents(color.CGColor) == 2)
   {
   //assuming it is grayscale - copy the first value
   b = g = r;
   }
   */
  CGFloat r = 0, g = 0, b = 0, a = 0;
  [self color2rgba:color red: &r green: &g blue: &b alpha: &a];
  return [NSString stringWithFormat: @"rgba(%.f,%.f,%.f,%.f)", r, g ,b, a];
}

//46250002

//从字符颜色rgba(0,0,0,1)中分别释放出rgba的值
+(void) extractRgba:(NSString *)color red:(CGFloat *)red green:(CGFloat *)green blue:(CGFloat *)blue alpha:(CGFloat *)alpha
{
  //替换空格
  color = [color stringByReplacingOccurrencesOfRegex:@" " withString:@""];
  *red = 0, *green = 0, *blue = 0, *alpha = 0;
  NSString *pattern = @"rgba\\((\\d+),(\\d+),(\\d+)(,(\\d|(\\d\\.\\d)))?\\)";
  //根据正则判断是是否符合rgb颜色
  if([color isMatchedByRegex: pattern]){
    *alpha = 1;
    *red = [[color stringByMatching:pattern capture:1L] floatValue];
    *green = [[color stringByMatching:pattern capture:2L] floatValue];
    *blue = [[color stringByMatching:pattern capture:3L] floatValue];
    NSString *al = [color stringByMatching:pattern capture:5L];
    if(al != nil) *alpha = [al floatValue];    
  };
}

//将字符串的rgba转换为颜色
+(UIColor *) rgba2Color: (NSString *) color
{
  CGFloat r = 0, g = 0, b = 0, a = 0;
  [self extractRgba:color red: &r green: &g blue: &b alpha: &a];
  return  [self rgba2Color:r green:g blue:b alpha:a];
}

//通过图片路径获取颜色
+(UIColor *) colorFromImagePath: (NSString *) imagePath
{
  return [UIColor colorWithPatternImage:[UIImage imageNamed: imagePath]];
}

//从图片中获取颜色
+(UIColor *) colorFromImage: (UIImage *) image
{
  return [UIColor colorWithPatternImage: image];
}

//转换为16进制的颜色
+(NSString *) color2Hex:(UIColor *)color
{  
  CGColorSpaceRef rgbColorSpace = CGColorSpaceCreateDeviceRGB();
  unsigned char resultingPixel[4];
  CGContextRef context = CGBitmapContextCreate(&resultingPixel,
                                               1,
                                               1,
                                               8,
                                               4,
                                               rgbColorSpace,
                                               kCGImageAlphaNoneSkipLast);
  CGContextSetFillColorWithColor(context, [color CGColor]);
  CGContextFillRect(context, CGRectMake(0, 0, 1, 1));
  CGContextRelease(context);
  CGColorSpaceRelease(rgbColorSpace);
  
  // Convert to hex string between 0x00 and 0xFF  
	return [NSString stringWithFormat:@"#%02X%02X%02X",  
          (int)(resultingPixel[0] / 255.0f * 255), (int)(resultingPixel[1] / 255.0f * 255), (int)(resultingPixel[2] / 255.0f * 255)]; 
}

//把16进制的颜色转换为objective的颜色
+(UIColor *) hex2Color:(NSString *)hex
{
  NSString *cleanString = [hex stringByReplacingOccurrencesOfString:@"#" withString:@""];
  if([cleanString length] == 3) {
    cleanString = [NSString stringWithFormat:@"%@%@%@%@%@%@", 
                   [cleanString substringWithRange:NSMakeRange(0, 1)],[cleanString substringWithRange:NSMakeRange(0, 1)],
                   [cleanString substringWithRange:NSMakeRange(1, 1)],[cleanString substringWithRange:NSMakeRange(1, 1)],
                   [cleanString substringWithRange:NSMakeRange(2, 1)],[cleanString substringWithRange:NSMakeRange(2, 1)]];
  }
  
  if([cleanString length] == 6) {
    cleanString = [cleanString stringByAppendingString:@"ff"];
  }
  
  unsigned int baseValue;
  [[NSScanner scannerWithString:cleanString] scanHexInt:&baseValue];
  
  int red = ((baseValue >> 24) & 0xFF)/255.0f;
  int green = ((baseValue >> 16) & 0xFF)/255.0f;
  int blue = ((baseValue >> 8) & 0xFF)/255.0f;
  int alpha = ((baseValue >> 0) & 0xFF)/255.0f;
  return [UIColor colorWithRed:red green:green blue:blue alpha:alpha];
}



//获取灰度图片
+(UIImage*) getGrayImage:(UIImage*) image
{
  const NSInteger ALPHA = 0;
  const NSInteger BLUE = 1;
  const NSInteger GREEN = 2;
  const NSInteger RED = 3;
  
  CGSize size = [image size];
  int width = size.width;
  int height = size.height;
	
  // the pixels will be painted to this array
  uint32_t *pixels = (uint32_t *) malloc(width * height * sizeof(uint32_t));
	
  // clear the pixels so any transparency is preserved
  memset(pixels, 0, width * height * sizeof(uint32_t));
	
  CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
	
  // create a context with RGBA pixels
  CGContextRef context = CGBitmapContextCreate(pixels, width, height, 8, width * sizeof(uint32_t), colorSpace, 
                                               kCGBitmapByteOrder32Little | kCGImageAlphaPremultipliedLast);
	
  // paint the bitmap to our context which will fill in the pixels array
  CGContextDrawImage(context, CGRectMake(0, 0, width, height), [image CGImage]);
	
  for(int y = 0; y < height; y++) {
    for(int x = 0; x < width; x++) {
      uint8_t *rgbaPixel = (uint8_t *) &pixels[y * width + x];
			
      // convert to grayscale using recommended method: http://en.wikipedia.org/wiki/Grayscale#Converting_color_to_grayscale
      uint32_t gray = 0.3 * rgbaPixel[RED] + 0.59 * rgbaPixel[GREEN] + 0.11 * rgbaPixel[BLUE];
			
      // set the pixels to gray
      rgbaPixel[RED] = gray;
      rgbaPixel[GREEN] = gray;
      rgbaPixel[BLUE] = gray;
    }
  }
	
  // create a new CGImageRef from our context with the modified pixels
  CGImageRef imageRef = CGBitmapContextCreateImage(context);
	
  // we're done with the context, color space, and pixels
  CGContextRelease(context);
  CGColorSpaceRelease(colorSpace);
  free(pixels);
	
  // make a new UIImage to return
  UIImage *resultUIImage = [UIImage imageWithCGImage:imageRef];
	
  // we're done with image now too
  CGImageRelease(imageRef);
	
  return resultUIImage;
}


//缩小图片，限制最大大小
+(UIImage *) maxSizeImage:(UIImage *)image maxSize:(CGSize)maxSize
{
  CGSize size = image.size;
  if(size.width < maxSize.width && size.height < maxSize.height) return image;
  CGFloat wScale = maxSize.width / size.width;
  CGFloat hScale = maxSize.height / size.height;
  CGFloat scale = MAX(wScale, hScale);
  return  [GraphicHelper scaleImage:image scale:scale];
}

//缩小至指定大小
+(UIImage *) newSizeImage:(UIImage *)image newSize:(CGSize)newSize
{
  UIGraphicsBeginImageContextWithOptions(newSize, YES, 0.0);
  CGRect imageRect = {{0.0, 0.0}, newSize};
  [image drawInRect:imageRect];
  UIImage *scaledImage = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  return scaledImage;
}

//按比例缩小
+(UIImage *) scaleImage:(UIImage *)image scale:(CGFloat)scale
{
  CGSize size = image.size;
  size.width = size.width * scale;
  size.height = size.height * scale;
  return [GraphicHelper newSizeImage: image newSize:size];
}

//保存图片
+(BOOL) saveImage:(UIImage *)image savePath:(NSString *)savePath
{
  NSData *data = UIImageJPEGRepresentation(image, 0.8);
  NSFileManager *fileManager = [NSFileManager defaultManager];
  [fileManager createFileAtPath:savePath contents:data attributes:nil];
  return YES;
}

//添加图片水印
+(UIImage *) textWatherMark: (UIImage *) image text: (NSString *) text frame: (CGRect) frame
{
  int w = image.size.width;
  int h = image.size.height;
  CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
  CGContextRef context = CGBitmapContextCreate(NULL, w, h, 8, 4 * w, colorSpace, kCGImageAlphaPremultipliedFirst);
  CGContextDrawImage(context, CGRectMake(0, 0, w, h), image.CGImage);
  
  char* someText= (char *)[text cStringUsingEncoding:NSASCIIStringEncoding];
  CGContextSelectFont(context, "Arial",20, kCGEncodingMacRoman);
  CGContextSetTextDrawingMode(context, kCGTextFill);
  CGContextSetRGBFillColor(context, 0, 0, 0, 1);
  CGContextShowTextAtPoint(context,10,10,someText, strlen(someText));
  CGImageRef imgCombined = CGBitmapContextCreateImage(context);
  
  CGContextRelease(context);
  CGColorSpaceRelease(colorSpace);
  
  UIImage *retImage = [UIImage imageWithCGImage:imgCombined];
  CGImageRelease(imgCombined);
  return  retImage;
}

@end
