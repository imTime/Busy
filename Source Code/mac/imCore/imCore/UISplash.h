//
//  UISplash.h
//  imCore
//
//  Created by Conis on 11/19/12.
//
//

#import <UIKit/UIKit.h>
#import "CoreGeneral.h"

@interface UISplash : UIView{
  UIImageView *imgView;
  UIView *viewTransparent;
}

@property (nonatomic, retain) NSString *image;
-(void) render;
@end
