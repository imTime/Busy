//
//  UILabelEx.m
//  test1
//
//  Created by conis on 12-2-1.
//  Copyright (c) 2012年 __MyCompanyName__. All rights reserved.
//

#import "UILabelEx.h"

@implementation UILabelEx
@synthesize  isBold = isBold_;
@synthesize isItalic = isItalic_;
@synthesize isUnderline = isUnderline_;
@synthesize verticalAlignment = verticalAlignment_;

- (id)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    self.verticalAlignment = VerticalAlignmentMiddle;
  }
  return self;
}

- (void)drawRect:(CGRect)rect {
  //self.font = [UIFont fontWithName: @"Zapfino" size: 35.f];
  if(self.text == nil){
    [super drawRect: rect];
    return;
  };
  
  NSRange range = NSMakeRange(0, self.text.length);
  //创建AttributeString
  NSMutableAttributedString *string = [[NSMutableAttributedString alloc] initWithString:self.text];
  
  //添加字体颜色
  [string addAttribute:(id)kCTForegroundColorAttributeName value:(id)self.textColor.CGColor range: range];
  
  //添加下划线
  if(self.isUnderline){
    NSNumber *underline = [NSNumber numberWithInt:kCTUnderlineStyleSingle];
    [string addAttribute:(id)kCTUnderlineStyleAttributeName value: underline  range:range];
  };
  /*
  //添加字体和粗体
  CTFontSymbolicTraits symTrait = (self.isBold ? kCTFontBoldTrait : 0) | (self.isItalic ? kCTFontItalicTrait : 0);
  NSDictionary* trait = [NSDictionary dictionaryWithObject:[NSNumber numberWithInt:symTrait] forKey:(NSString*)kCTFontSymbolicTrait];
  //添加字体
  NSDictionary* attr = [NSDictionary dictionaryWithObjectsAndKeys:
                        self.font.fontName ,kCTFontFamilyNameAttribute,
                        trait,kCTFontTraitsAttribute,nil];
  CTFontDescriptorRef desc = CTFontDescriptorCreateWithAttributes((CFDictionaryRef)attr);
  CTFontRef fontRef = CTFontCreateWithFontDescriptor(desc, self.font.pointSize, NULL);
  
  CGRect boundingBox = CTFontGetBoundingBox(fontRef);
  //添加字体属性
  [string addAttribute:(id)kCTFontAttributeName
                 value:(id)fontRef
                 range:range];
  CFRelease(fontRef);
  CFRelease(desc);
  */
  
  //正常字体
  CGFloat fSize = self.font.pointSize;
  CTFontRef normalFontRef = CTFontCreateWithName((CFStringRef)self.font.fontName, fSize, NULL);
  
  //斜体
  CTFontRef fontItalicRef = nil, fontItalicBoldRef = nil;
  if(self.isItalic){
    fontItalicRef = CTFontCreateCopyWithSymbolicTraits(normalFontRef, fSize, NULL, kCTFontItalicTrait, kCTFontItalicTrait | kCTFontItalicTrait);
  };
  
  //粗体
  if (self.isBold) {
    fontItalicBoldRef =  CTFontCreateCopyWithSymbolicTraits(fontItalicRef == nil ? normalFontRef : fontItalicRef, fSize, NULL, kCTFontBoldTrait, kCTFontBoldTrait | kCTFontBoldTrait);
  }
  
  CTFontRef fontRef = fontItalicBoldRef;
  if(fontRef == nil) fontRef = fontItalicRef;
  if(fontRef == nil) fontRef = normalFontRef;
  CGRect boundingBox = CTFontGetBoundingBox(fontRef);
	[string addAttribute:(id)kCTFontAttributeName value:(id)fontRef range: range];
  
  //创建文本对齐方式
  CTTextAlignment alignment;
  switch (self.textAlignment) {
    case UITextAlignmentCenter:
      alignment = kCTCenterTextAlignment;
      break;
    case UITextAlignmentLeft:
      alignment = kCTLeftTextAlignment;
      break;
    default:
      alignment = kCTRightTextAlignment;
      break;
  };
  
  CTParagraphStyleSetting alignmentStyle;
  alignmentStyle.spec = kCTParagraphStyleSpecifierAlignment;//指定为对齐属性
  alignmentStyle.valueSize = sizeof(alignment);
  alignmentStyle.value = &alignment;
  
  //创建文本行间距
  CGFloat lineSpace=5.0f;//间距数据
  CTParagraphStyleSetting lineSpaceStyle;
  lineSpaceStyle.spec=kCTParagraphStyleSpecifierLineSpacing;//指定为行间距属性
  lineSpaceStyle.valueSize=sizeof(lineSpace);
  lineSpaceStyle.value=&lineSpace;
  
  //创建样式数组
  CTParagraphStyleSetting settings[]={
    alignmentStyle,lineSpaceStyle
  };
  
  //设置样式
  CTParagraphStyleRef paragraphStyle = CTParagraphStyleCreate(settings, sizeof(settings));
  
  //给字符串添加样式attribute
  [string addAttribute:(id)kCTParagraphStyleAttributeName
                 value:(id)paragraphStyle
                 range:range];
  
  // layout master
  CTFramesetterRef framesetter = CTFramesetterCreateWithAttributedString((CFAttributedStringRef)string);
  
  CGFloat h = self.bounds.size.height;
  switch (self.verticalAlignment) {
    case VerticalAlignmentMiddle:
      h = (h + boundingBox.size.height) / 2;
      break;
    case VerticalAlignmentBottom:
      h = boundingBox.size.height - (boundingBox.size.height / 4);
  };
  
  CGMutablePathRef leftColumnPath = CGPathCreateMutable();
  CGPathAddRect(leftColumnPath, NULL,
                CGRectMake(0, 0,self.bounds.size.width,h));
  
  CTFrameRef leftFrame = CTFramesetterCreateFrame(framesetter,
                                                  CFRangeMake(0, 0),
                                                  leftColumnPath, NULL);
  
  // flip the coordinate system
  CGContextRef context = UIGraphicsGetCurrentContext();
  CGContextSetTextMatrix(context, CGAffineTransformIdentity);
  CGContextTranslateCTM(context, 0, self.bounds.size.height);
  CGContextScaleCTM(context, 1.0, -1.0);
  
  // draw
  CTFrameDraw(leftFrame, context);

  // cleanup
  /*
  CFRelease(fontRef);
  CFRelease(normalFontRef);
  if(fontItalicRef != nil) CFRelease(fontItalicRef);
  if(fontItalicBoldRef != nil) CFRelease(fontItalicBoldRef);
  */
  
  CGPathRelease(leftColumnPath);
  CFRelease(framesetter);
  CFRelease(leftFrame);
  CFRelease(paragraphStyle);
  [string release];
  UIGraphicsPushContext(context);
}

- (void)setVerticalAlignment:(VerticalAlignment)verticalAlignment {
  verticalAlignment_ = verticalAlignment;
  [self setNeedsDisplay];
}

- (void) setIsBold:(BOOL)isBold
{
  isBold_ = isBold;
  [self setNeedsDisplay];
}

-(void) setIsItalic:(BOOL)isItalic
{
  isItalic_ = isItalic;
  [self setNeedsDisplay];
}

-(void) setIsUnderline:(BOOL)isUnderline
{
  isUnderline_ = isUnderline;
  [self  setNeedsDisplay];
}
@end
