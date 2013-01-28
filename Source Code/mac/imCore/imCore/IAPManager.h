//
//  IAPManager.h
//  imBoxV3
//
//  Created by conis on 11-11-20.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <StoreKit/StoreKit.h>

@protocol IAPManagerDelegate <NSObject>
@optional
//加载产品之后回调
-(void) loadIAPProducts: (NSArray *)products;
-(void) iapPurchaseFinished: (BOOL) successfull code: (NSInteger) aCode productId: (NSString *) prodId;
@end


@interface IAPManager : NSObject<SKProductsRequestDelegate, SKPaymentTransactionObserver>
{
  //SKProduct *proUpgradeProduct;
  SKProductsRequest *productsRequest;
  NSArray *products;
  id<IAPManagerDelegate> delegate;
}

@property (nonatomic, retain) NSArray *products;
@property (nonatomic, assign) id <IAPManagerDelegate> delegate;

- (void)loadStore;
- (BOOL)canMakePurchases;
- (void)purchase: (NSString *) productId;
@end
