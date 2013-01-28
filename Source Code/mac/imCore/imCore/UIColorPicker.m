//
//  ColorPicker.m
//  imBoxV3
//
//  Created by conis on 11-11-1.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#import "UIColorPicker.h"
#import <QuartzCore/QuartzCore.h>

@interface UIColorPicker(Private)
-(UIImage *) getImage:(NSString *)imageName fileType:(NSString *)aFileType;
-(UIImage *) getImage:(NSString *)imageName;
-(void) createComponent;
-(UIColor*)getRGBPixelColorAtPoint:(CGPoint)point;
-(void) moveColorMap: (NSSet *)touches withEvent:(UIEvent *)event animated: (BOOL) aAnimated;
-(void) createDefineColor;
-(void) createContrastColor;
-(void) createColorFavorite;
-(void) clickedDefinedColor: (UIButton *) sender;
-(void) clickedColor: (UIButton *) sender;
-(UIButton *) createContrastButton: (CGRect) frame tag: (int) tag;
-(CGContextRef) createARGBBitmapContextFromImage:(CGImageRef)inImage;
-(void) longPressMenuButton:(UILongPressGestureRecognizer *)recognizer;
-(void) getFavoriteColor;
-(void) setFavoriteColor;
-(NSInteger) getFavoriteButtonX: (NSInteger) index;
-(UIButton *) createFavoriteButton:(NSInteger)index color:(UIColor *)color tag: (NSInteger) tag;
-(void) resetFavorite;
-(void) addNewColorToFavorite: (UIColor *) color;
-(void) resizeFavorite: (BOOL) moveOffset;
-(void) deleteFavoriteColor;
-(void) setNewColor: (UIColor *) color;
-(NSInteger) getPixelCount: (CGImageRef) inImage;
@end

@implementation UIColorPicker
@synthesize delegate, imagePath, moveFavorite, movingFavoriteTag, lastTouch, maxFavoriteCount; 

const NSInteger kFavTagTransparent = -1;
const NSInteger kFavTagAdd = -2;

const NSInteger kFavTagCurrent = -3;
const NSInteger kFavTagNew = -4;

const NSInteger kFavButtonWidth = 33;
const NSInteger kFavButtonSpace = 10;
const NSInteger kFavFixedButtonCount = 2;
const NSInteger kFavBarTopMargin = 10;
NSString * const kFavoriteUserDefaultName = @"color_picker_favorite";

const NSInteger kColorMapWidth = 221;
const NSInteger kColorMapHeight = 176;

#pragma -
#pragma mark Public Method

- (id)initWithFrame:(CGRect)frame resources: (NSString *) resources
{
  self = [super initWithFrame:frame];
  if (self) {
    self.maxFavoriteCount = 20;
    self.imagePath = resources;
    [self createComponent];
    [self getFavoriteColor];
  };
  return self;
}

//设置颜色
-(void) setCurrentColor:(UIColor *)color
{
  if(color == [UIColor clearColor]) color = btnNoneColor.backgroundColor;
  btnNewColor.backgroundColor = color;
  btnCurrentColor.backgroundColor = color;
}

#pragma -
#pragma mark 重载父类方法
-(void) dealloc
{
  [btnNewColor release];
  [btnCurrentColor release];
  [viewMask release];
  [btnWhiteColor release];
  [btnBlackColor release];
  [btnNoneColor release];
  [super dealloc];
}

#pragma  -
#pragma mark 收藏颜色和对比色相关方法

//设置新颜色
-(void) setNewColor:(UIColor *)color
{
  NSString *imageName = @"contrast_mask";
  //透明色
  if(color == [UIColor clearColor]) imageName = @"transparent";  
  [btnNewColor setImage:[self getImage: imageName] forState:UIControlStateNormal];
  btnNewColor.backgroundColor = color;
  //[self.delegate onChangeColor: color];
}

//点击收藏色和对比色
-(void) clickedColor:(UIButton *)sender
{
  //点击当前色
  switch (sender.tag) {
    case kFavTagCurrent:
      [self setNewColor: btnCurrentColor.backgroundColor];
      [self.delegate onChangeColor: btnCurrentColor.backgroundColor];
      break;
    case kFavTagNew:
      break;
    case kFavTagAdd:{
      UIColor *color = btnNewColor.backgroundColor;
      if(color == [UIColor clearColor]) return;
      [self addNewColorToFavorite: color];
    };
      break;
    case kFavTagTransparent:
      [self setNewColor: [UIColor clearColor]];
      [self.delegate onChangeColor: [UIColor clearColor]];
      break;
    default:{
      if(self.moveFavorite) return;
      [self setNewColor: sender.backgroundColor];
      [self.delegate onChangeColor: sender.backgroundColor];
    };
      break;
  }
}

//从用户配置中读取收藏的颜色
-(void) getFavoriteColor
{
  NSUserDefaults  *defaults = [NSUserDefaults standardUserDefaults];
  NSString *json = [defaults objectForKey: kFavoriteUserDefaultName];
  NSArray *colors = [CoreGeneral JSONObjectWithString: json];
  //如果没有这个配置文件，则写入
  if(colors != nil){
    NSInteger count = [colors count];
    //添加button
    for (int i = 0; i < count; i++) {
      UIColor *color = [GraphicHelper rgba2Color: [colors objectAtIndex:i]];
      [svFavorite addSubview: [self createFavoriteButton:i color:color tag: i + 1]];
    };
    
    [self resizeFavorite: NO];
  };
}

//保存收藏的颜色
-(void) setFavoriteColor
{
  NSMutableArray *colors = [[NSMutableArray alloc] init];
  //添加颜色
  for(UIButton *btnColor in svFavorite.subviews){
    if(btnColor.tag == kFavTagAdd) continue;
    [colors addObject: [GraphicHelper color2Rgba: btnColor.backgroundColor]];
  };
  NSArray *arr = [NSArray arrayWithArray: colors];
  [colors release];
  [UIColorPicker setFavoriteColor: arr];
}

//删除收藏的颜色
-(void) deleteFavoriteColor
{
  if(!self.moveFavorite) return;
  UIView *view = [svFavorite viewWithTag: self.movingFavoriteTag];
  //NSLog(@"moving: %d", self.movingFavoriteTag);
  if(view != nil){
    [self setFavoriteColor];
    [view removeFromSuperview];
    [self resetFavorite];
    [self resizeFavorite: NO];
  };
  self.moveFavorite = NO;
}

//将新颜色添加到收藏中
-(void) addNewColorToFavorite: (UIColor *) color
{
  NSInteger count = [svFavorite subviews].count;
  if(count >= self.maxFavoriteCount){
    [svFavorite viewWithTag: kFavTagAdd].hidden = YES;
    return;
  };
  [svFavorite addSubview: [self createFavoriteButton: count color:color tag:count + 1]];
  [self resizeFavorite: YES];    //重新计算位置
}

//重新计算收藏的contentSize和
-(void) resizeFavorite:(BOOL)moveOffset
{
  NSInteger count = [svFavorite subviews].count;
  /*
   //重新调整add Button的位置
   UIButton *btnAdd = (UIButton*)[svFavorite viewWithTag: kFavTagAdd];
   CGRect rect = btnAdd.frame;
   rect.origin.x = count * (kFavButtonSpace + kFavButtonWidth);
   btnAdd.frame = rect;
   */
  //重新调整contentSize的大小
  CGSize size = svFavorite.contentSize;
  size.width = count * (kFavButtonSpace + kFavButtonWidth) - kFavButtonSpace;
  [svFavorite setContentSize: size];
  
  if(moveOffset){
    CGPoint pt = svFavorite.contentOffset;
    pt.x = MAX(size.width - svFavorite.frame.size.width, 0);
    [svFavorite setContentOffset: pt animated:YES];
  }
}


//设置收藏颜色的指定颜色
+(void) setFavoriteColor: (NSArray *) colors
{
  NSString *json = [CoreGeneral JSONStringWithObject: colors];
  NSUserDefaults  *defaults = [NSUserDefaults standardUserDefaults];
  [defaults setObject: json forKey: kFavoriteUserDefaultName];
  [defaults synchronize];
}

//设置默认的收藏色
+(void) setFavoriteColorWithDefault
{
  NSUserDefaults  *defaults = [NSUserDefaults standardUserDefaults];
  //已经存在默认收藏色，则退出
  if([defaults objectForKey: kFavoriteUserDefaultName] != nil) return;
  
  NSArray *colors = [NSArray arrayWithObjects:
                     //@"rgba(0,0,0)",
                     //@"rgba(204,204,204)",
                     @"rgba(148,45,188)",
                     @"rgba(88,44,191)",
                     @"rgba(45,59,194)",
                     @"rgba(46,124,199)",
                     @"rgba(45,198,203)",
                     @"rgba(46,206,134)",
                     @"rgba(80,205,43)",
                     @"rgba(158,215,44)",
                     @"rgba(219,191,45)",
                     @"rgba(222,115,45)",
                     @"rgba(227,44,46)",
                     nil];
  [UIColorPicker setFavoriteColor: colors];
}

//获取收藏颜色按钮X的位置
-(NSInteger) getFavoriteButtonX:(NSInteger)index
{
  return index * (kFavButtonWidth + kFavButtonSpace);
}

//创建收藏颜色的按钮
-(UIButton *) createFavoriteButton:(NSInteger)index color:(UIColor *)color tag: (NSInteger) tag
{
  NSString *imageName;
  CGRect rect = CGRectMake([self getFavoriteButtonX: index], 0, kFavButtonWidth, kFavButtonWidth);
  UIButton *btn = [UIButton buttonWithType:UIButtonTypeCustom];
  [[btn layer] setCornerRadius: 5];
  [btn setFrame: rect];
  
  if(tag == kFavTagAdd){
    imageName = @"favorite";
  }else if(tag == kFavTagTransparent){
    imageName = @"favorite_locked";
  }else{
    imageName = @"favorite_mask";
    //拖拽的手势
    UILongPressGestureRecognizer *longPress = [[UILongPressGestureRecognizer alloc] initWithTarget:self action:@selector(longPressMenuButton:)]; 
    longPress.minimumPressDuration = 1.f;
    //longPress.cancelsTouchesInView = YES;
    [btn addGestureRecognizer: longPress];
    [longPress release];
  };
  
  [btn setImage:[self getImage: imageName] forState:UIControlStateNormal];
  btn.tag = tag;
  btn.backgroundColor = color;
  btn.showsTouchWhenHighlighted = YES;
  [btn addTarget:self action:@selector(clickedColor:) forControlEvents:UIControlEventTouchUpInside];
  return btn;
}

//重新布局位置
-(void) resetFavorite
{
  NSInteger index = 0;
  CGRect rect;
  for(UIButton *btn in [svFavorite subviews]){
    NSInteger tag = btn.tag;
    btn.tag = index + 1;
    if(tag != self.movingFavoriteTag) index ++;
    if(tag < self.movingFavoriteTag) continue;
    rect = btn.frame;
    rect.origin.x = [self getFavoriteButtonX: index - 1];
    [CoreGeneral viewSizeAnimation:btn duration:.4f frame:rect];
  };
}

//创建颜色收藏
-(void) createColorFavorite
{
  CGFloat viewWidth = self.frame.size.width - 10;
  //添加View
  CGRect rect = CGRectMake(5, kColorMapHeight + kFavBarTopMargin, viewWidth, kFavButtonWidth);
  UIView *view = [[UIView alloc] initWithFrame:rect];
  [self addSubview: view];
  
  //添加收藏
  CGFloat x = (kFavButtonWidth + kFavButtonSpace) * kFavFixedButtonCount;
  rect = CGRectMake(x, 0, viewWidth - x, kFavButtonWidth);
  svFavorite = [[UIScrollView alloc] initWithFrame: rect];
  svFavorite.pagingEnabled = NO;                    //值是YES,会自动滚动到subview的边界,默认是NO
  svFavorite.showsVerticalScrollIndicator = NO;     //滚动时,是否显示垂直滚动条
  svFavorite.showsHorizontalScrollIndicator = NO;   //滚动时,是否显示水平滚动条
  [view addSubview: svFavorite];
  
  //添加add button
  [view addSubview: [self createFavoriteButton:0 color:[UIColor clearColor] tag: kFavTagAdd]];
  //创建收藏颜色的Button
  [view addSubview: [self createFavoriteButton:1 color: [UIColor clearColor] tag: kFavTagTransparent]];
  [svFavorite release];
  [view release];
  
  btnDeleting = [self createFavoriteButton:0 color:[UIColor greenColor] tag:0];
  btnDeleting.hidden = YES;
  [self addSubview: btnDeleting];
}

//创建颜色选择按钮
-(UIButton *) createContrastButton:(CGRect)frame tag:(int)tag
{
  UIButton *btn = [UIButton buttonWithType:UIButtonTypeCustom];
  btn.frame = frame;
  btn.tag = tag;
  [btn addTarget:self action:@selector(clickedColor:) forControlEvents:UIControlEventTouchDown];
  [[btn layer] setCornerRadius: 5];
  btn.showsTouchWhenHighlighted = YES;
  [btn setImage:[self getImage:@"contrast_mask"] forState:UIControlStateNormal];
  return btn;
}

//创建比较色部分
-(void) createContrastColor
{
  CGFloat margin = 6;
  CGFloat w, h = 64, x = kColorMapWidth + margin;
  w = self.frame.size.width - x - margin;
  
  //添加Current的Label
  CGRect rect = CGRectMake(x, 2, w, 16);
  UILabel *lblCurrent = [[UILabel alloc] initWithFrame: rect];
  lblCurrent.font = [UIFont boldSystemFontOfSize:14];
  lblCurrent.text = NSLocalizedString(@"color_picker_current", nil);
  [self addSubview: lblCurrent];
  [lblCurrent release];
  
  //添加New的Label
  rect.origin.y += rect.size.height + h + 10;
  UILabel *lblNew = [[UILabel alloc] initWithFrame:rect];
  lblNew.font = [UIFont boldSystemFontOfSize:14];
  lblNew.text = NSLocalizedString(@"color_picker_new", nil);;
  [self addSubview: lblNew];
  [lblNew release];
  
  //添加旧颜色
  rect = CGRectMake(x, 20, w, h);
  btnCurrentColor = [self createContrastButton:rect tag:kFavTagCurrent];
  [self addSubview: btnCurrentColor];
  btnCurrentColor.backgroundColor = [UIColor whiteColor];
  
  //添加新颜色
  rect = CGRectMake(x, 46 + h, w, h);
  btnNewColor = [self createContrastButton:rect tag:kFavTagNew];
  [self addSubview: btnNewColor];
  btnNewColor.backgroundColor = [UIColor whiteColor];
}


#pragma -
#pragma mark Private Method
//获取指定格式的图片
-(UIImage *) getImage:(NSString *)imageName fileType:(NSString *)aFileType
{
  return [UIImage imageNamed: [NSString stringWithFormat:@"%@%@.%@", self.imagePath, imageName, aFileType]];
}

//获取PNG的图片
-(UIImage *)getImage:(NSString *)imageName
{
  return [self getImage:imageName fileType:@"png"];
}

#pragma -
#pragma mark 创建元素相关
//创建组件
-(void)createComponent
{
  //创建颜色地图
  CGRect rect = CGRectMake(0, 0, kColorMapWidth, kColorMapHeight);
  UIView *viewColorMap = [[UIView alloc] initWithFrame: rect];
  UIImage *mapImage = [self getImage:@"colorMap" fileType: @"jpg"];
  viewColorMap.backgroundColor = [UIColor colorWithPatternImage: mapImage];
  mapPixelCount = [self getPixelCount: mapImage.CGImage];
  [self addSubview: viewColorMap];
  [viewColorMap release];
  
  //创建Mask
  viewMask = [[UIView alloc] initWithFrame:CGRectMake(100, 100, 20, 20)];
  viewMask.backgroundColor = [UIColor colorWithPatternImage:[self getImage:@"colorMask"]];
  viewMask.opaque = NO;
  [self addSubview: viewMask];
  [viewMask release];
  
  [self createContrastColor];
  [self createColorFavorite];
  
  rect = self.frame;
  rect.size.height = kColorMapHeight + kFavBarTopMargin + kFavButtonWidth + kFavBarTopMargin;
  self.frame = rect;
}

//移动颜色地图
-(void) moveColorMap:(NSSet *)touches withEvent:(UIEvent *)event animated: (BOOL) aAnimated
{
  UITouch *touch = [touches anyObject];
  CGPoint pt = [touch locationInView:self];
  self.lastTouch = pt;
  
  //已经移动
  if(self.moveFavorite){
    btnDeleting.center = self.lastTouch;
    return;
  }
  
  if(pt.x < 0 || pt.x > kColorMapWidth || pt.y < 0 || pt.y > kColorMapHeight) return;
  
  CGRect rect = viewMask.frame;
  rect.origin.x = pt.x - rect.size.width / 2;
  rect.origin.y = pt.y - rect.size.height / 2;
  
  if(aAnimated){
    [CoreGeneral viewSizeAnimation:viewMask duration:.4 frame:rect];
  }else{
    viewMask.frame = rect;
  }
  
  UIColor *color = [self getRGBPixelColorAtPoint: pt];
  if(color != nil) [self setNewColor: color];
  //[color release];
}

#pragma -
#pragma mark 重载移动事件（ColorMap）
//移动
-(void) touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event
{
  [self moveColorMap:touches withEvent:event animated: NO];
}

//开始触摸
- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event
{
  //点击的时候创建图片
  colorMap = [self getImage:@"colorMap" fileType: @"jpg"];
  [self moveColorMap:touches withEvent:event animated: YES];
}

//移动结束
-(void) touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event
{
  [colorMap release];
  colorMap = nil;
  [self.delegate onChangeColor: btnNewColor.backgroundColor];
}

//取消
-(void)touchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event
{
  [colorMap release];
  colorMap = nil;
  [self.delegate onChangeColor: btnNewColor.backgroundColor];
}

#pragma -
#pragma mark Private Method
-(void) longPressMenuButton:(UILongPressGestureRecognizer *)recognizer
{
  if(recognizer.state == UIGestureRecognizerStateBegan){
    recognizer.view.hidden = YES;
    NSInteger tag = recognizer.view.tag;
    if(tag < 0) return;
    btnDeleting.backgroundColor = recognizer.view.backgroundColor;
    self.moveFavorite = YES;
    self.movingFavoriteTag = tag;
    [self deleteFavoriteColor];
  };
}

-(NSInteger) getPixelCount: (CGImageRef) inImage
{
  // Get image width, height. We'll use the entire image.
	size_t pixelsWide = CGImageGetWidth(inImage);
	size_t pixelsHigh = CGImageGetHeight(inImage);
	
	// Declare the number of bytes per row. Each pixel in the bitmap in this
	// example is represented by 4 bytes; 8 bits each of red, green, blue, and
	// alpha.
	int bitmapBytesPerRow   = (pixelsWide * 4);
	return  bitmapBytesPerRow * pixelsHigh;
}

//创建颜色地图
- (CGContextRef) createARGBBitmapContextFromImage:(CGImageRef) inImage {
	
	CGContextRef    context = NULL;
	CGColorSpaceRef colorSpace;
	void *          bitmapData;
	int             bitmapByteCount;
	int             bitmapBytesPerRow;
	
	// Get image width, height. We'll use the entire image.
	size_t pixelsWide = CGImageGetWidth(inImage);
	size_t pixelsHigh = CGImageGetHeight(inImage);
	
	// Declare the number of bytes per row. Each pixel in the bitmap in this
	// example is represented by 4 bytes; 8 bits each of red, green, blue, and
	// alpha.
	bitmapBytesPerRow   = (pixelsWide * 4);
	bitmapByteCount     = (bitmapBytesPerRow * pixelsHigh);
	
	// Use the generic RGB color space.
	colorSpace = CGColorSpaceCreateDeviceRGB();
  
	if (colorSpace == NULL)
	{
		fprintf(stderr, "Error allocating color space\n");
		return NULL;
	}
	
	// Allocate memory for image data. This is the destination in memory
	// where any drawing to the bitmap context will be rendered.
	bitmapData = malloc( bitmapByteCount );
	if (bitmapData == NULL) 
	{
		fprintf (stderr, "Memory not allocated!");
		CGColorSpaceRelease( colorSpace );
		return NULL;
	}
	
	// Create the bitmap context. We want pre-multiplied ARGB, 8-bits 
	// per component. Regardless of what the source image format is 
	// (CMYK, Grayscale, and so on) it will be converted over to the format
	// specified here by CGBitmapContextCreate.
	context = CGBitmapContextCreate (bitmapData,
                                   pixelsWide,
                                   pixelsHigh,
                                   8,      // bits per component
                                   bitmapBytesPerRow,
                                   colorSpace,
                                   kCGImageAlphaPremultipliedFirst);
	if (context == NULL)
	{
		free (bitmapData);
		fprintf (stderr, "Context not created!");
	}
	
	// Make sure and release colorspace before returning
	CGColorSpaceRelease( colorSpace );
	
	return context;
}

//获取颜色
- (UIColor*)getRGBPixelColorAtPoint:(CGPoint)point
{
  //NSLog(@"x:%.f, y:%.f", point.x, point.y);
  UIColor* color = nil;
	CGImageRef inImage = colorMap.CGImage;
	// Create off screen bitmap context to draw the image into. Format ARGB is 4 bytes for each pixel: Alpa, Red, Green, Blue
	CGContextRef cgctx = [self createARGBBitmapContextFromImage:inImage];
	if (cgctx == NULL) { return nil; /* error */ }
	
  size_t w = CGImageGetWidth(inImage);
	size_t h = CGImageGetHeight(inImage);
	CGRect rect = {{0,0},{w,h}}; 
	
	// Draw the image to the bitmap context. Once we draw, the memory 
	// allocated for the context for rendering will then contain the 
	// raw image data in the specified color space.
	CGContextDrawImage(cgctx, rect, inImage); 
	
	// Now we can get a pointer to the image data associated with the bitmap
	// context.
	unsigned char* data = CGBitmapContextGetData (cgctx);
  //int dataLen = [self getPixelCount: inImage];
	if (data != NULL) {
    //offset locates the pixel in the data from x,y. 
    //4 for 4 bytes of data per pixel, w is width of one row of data.
    int offset = 4*((w*round(point.y))+round(point.x));
    //NSLog(@"count: %d, offset: %d", dataLen, offset);
    if(offset + 3 < mapPixelCount){
      int alpha =  data[offset]; 
      int red = data[offset+1]; 
      int green = data[offset+2]; 
      int blue = data[offset+3]; 
      //NSLog(@"offset: %i colors: RGB A %i %i %i  %i",offset,red,green,blue,alpha);
      color = [UIColor colorWithRed:(red/255.0f) green:(green/255.0f) blue:(blue/255.0f) alpha:(alpha/255.0f)];
    }
	}
	
	// When finished, release the context
	CGContextRelease(cgctx); 
	// Free image data memory for the context
	if (data) { free(data); }
	
	return color;
}


@end
