//
//  IAPManager.m
//  imBoxV3
//
//  Created by conis on 11-11-20.
//  Copyright (c) 2011年 __MyCompanyName__. All rights reserved.
//

#import "IAPManager.h"
//#define kInAppPurchaseProUpgradeProductId @"com.imTime.colorMail.pro"
#define kInAppPurchaseManagerProductsFetchedNotification @"kInAppPurchaseManagerProductsFetchedNotification"
#define kInAppPurchaseManagerTransactionFailedNotification @"kInAppPurchaseManagerTransactionFailedNotification"
#define kInAppPurchaseManagerTransactionSucceededNotification @"kInAppPurchaseManagerTransactionSucceededNotification"

@implementation IAPManager
@synthesize products, delegate;

-(id) init
{
  return [super init];
}

- (void)requestProUpgradeProductData
{
  NSSet *productIdentifiers = [NSSet setWithArray:products];
  productsRequest = [[SKProductsRequest alloc] initWithProductIdentifiers:productIdentifiers];
  productsRequest.delegate = self;
  [productsRequest start];
  
  // we will release the request object in the delegate callback
}

#pragma mark -
#pragma mark SKProductsRequestDelegate methods

- (void)productsRequest:(SKProductsRequest *)request didReceiveResponse:(SKProductsResponse *)response
{
  /*
  NSArray *products = response.products;
  proUpgradeProduct = [products count] == 1 ? [[products firstObject] retain] : nil;
  if (proUpgradeProduct)
  {
    NSLog(@"Product title: %@" , proUpgradeProduct.localizedTitle);
    NSLog(@"Product description: %@" , proUpgradeProduct.localizedDescription);
    NSLog(@"Product price: %@" , proUpgradeProduct.price);
    NSLog(@"Product id: %@" , proUpgradeProduct.productIdentifier);
  }
  
  for(int i = 0; i < [products count]; i ++){
    SKProduct *prod = [products objectAtIndex:i];
    NSLog(@"Product title: %@" , prod.localizedTitle);
    NSLog(@"Product description: %@" , prod.localizedDescription);
    NSLog(@"Product price: %@" , prod.price);
    NSLog(@"Product id: %@" , prod.productIdentifier);
  };
  */
  
  //回调产品的详细信息
  [self.delegate loadIAPProducts:response.products];
  for (NSString *invalidProductId in response.invalidProductIdentifiers)
  {
    NSLog(@"Invalid product id: %@" , invalidProductId);
  }
  
  // finally release the reqest we alloc/init’ed in requestProUpgradeProductData
  [productsRequest release];
  [self.products release];
  [[NSNotificationCenter defaultCenter] postNotificationName:kInAppPurchaseManagerProductsFetchedNotification object:self userInfo:nil];
}

#pragma -
#pragma Public methods

//
// call this method once on startup
// 从App Store服务器加载升级信息
- (void)loadStore
{
  // restarts any purchases if they were interrupted last time the app was open
  [[SKPaymentQueue defaultQueue] addTransactionObserver:self];
  
  // get the product description (defined in early sections)
  [self requestProUpgradeProductData];
}

// 是否可以购买，用户可能已经关闭购买
- (BOOL)canMakePurchases
{
  return [SKPaymentQueue canMakePayments];
}

// 根据产品id购买产品
- (void)purchase: (NSString *) productId
{
  SKPayment *payment = [SKPayment paymentWithProductIdentifier:productId];
  [[SKPaymentQueue defaultQueue] addPayment:payment];
}

#pragma -
#pragma Purchase helpers

//
// saves a record of the transaction by storing the receipt to disk
// 保存交用信息
//
- (void)recordTransaction:(SKPaymentTransaction *)transaction
{
  /*
  if ([transaction.payment.productIdentifier isEqualToString:kInAppPurchaseProUpgradeProductId])
  {
    // save the transaction receipt to disk
    [[NSUserDefaults standardUserDefaults] setValue:transaction.transactionReceipt forKey:@"proUpgradeTransactionReceipt" ];
    [[NSUserDefaults standardUserDefaults] synchronize];
  }
  */
  
}

//
// enable pro features
// 已经购买
- (void)provideContent:(NSString *)productId
{
  [self.delegate iapPurchaseFinished: YES code: 1 productId: productId];
}

//
// removes the transaction from the queue and posts a notification with the transaction result
// 交易完成
- (void)finishTransaction:(SKPaymentTransaction *)transaction wasSuccessful:(BOOL)wasSuccessful
{
  // remove the transaction from the payment queue.
  [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
  
  NSDictionary *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:transaction, @"transaction" , nil];
  if (wasSuccessful)
  {
    // send out a notification that we’ve finished the transaction
    [[NSNotificationCenter defaultCenter] postNotificationName:kInAppPurchaseManagerTransactionSucceededNotification object:self userInfo:userInfo];
  }
  else
  {
    // send out a notification for the failed transaction
    [[NSNotificationCenter defaultCenter] postNotificationName:kInAppPurchaseManagerTransactionFailedNotification object:self userInfo:userInfo];
  }
}

//
// called when the transaction was successful
// 交易成功
- (void)completeTransaction:(SKPaymentTransaction *)transaction
{
  [self recordTransaction:transaction];
  [self provideContent:transaction.payment.productIdentifier];
  [self finishTransaction:transaction wasSuccessful:YES];
}

//
// called when a transaction has been restored and and successfully completed
//
- (void)restoreTransaction:(SKPaymentTransaction *)transaction
{
  [self recordTransaction:transaction.originalTransaction];
  [self provideContent:transaction.originalTransaction.payment.productIdentifier];
  [self finishTransaction:transaction wasSuccessful:YES];
}

//
// called when a transaction has failed
//
- (void)failedTransaction:(SKPaymentTransaction *)transaction
{
  if (transaction.error.code != SKErrorPaymentCancelled)
  {
    // error!
    [self finishTransaction:transaction wasSuccessful:NO];
  }
  else
  {
    // this is fine, the user just cancelled, so don’t notify
    [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
    [self.delegate iapPurchaseFinished:NO code: 2 productId: @""];
  }
}

#pragma mark -
#pragma mark SKPaymentTransactionObserver methods

//
// called when the transaction status is updated
//
- (void)paymentQueue:(SKPaymentQueue *)queue updatedTransactions:(NSArray *)transactions
{
  for (SKPaymentTransaction *transaction in transactions)
  {
    switch (transaction.transactionState)
    {
      case SKPaymentTransactionStatePurchased:
        [self completeTransaction:transaction];
        break;
      case SKPaymentTransactionStateFailed:
        [self failedTransaction:transaction];
        break;
      case SKPaymentTransactionStateRestored:
        [self restoreTransaction:transaction];
        break;
      default:
        break;
    }
  }
}

@end
