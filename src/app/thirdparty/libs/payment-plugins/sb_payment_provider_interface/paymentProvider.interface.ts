/**
 * @name: paymentProvider.interface.ts
 * @desc: Export interface for payment provider. If any provider want to use that, They have to implement these methods.
 * @author: Anuj Gupta
 */

/**
 * @interface: ErrorResponseI
 * @desc: This interface is used to send an error response
 * @param {errCode}: Error code
 * @param {errMsg}: Error message
 */
export interface ErrorResponseI {
  errCode?: string
  errMsg?: string
}

/**
* @interface: StartPaymentRequestI
* @desc: When Payment plugin call startPayment method, then request should be defined request
* @param {sunbirdOrderId}: order id <unique id> generate for each request to track the order
*/
export interface StartPaymentRequestI {
  sunbirdOrderId: string 
}

/**
 * @interface: StartPaymentResponseI
 * @desc: When Payment plugin call startPayment method, then response should be defined response
 * @param { sdkUrl }: client sdk url
 * @param { providerOrderId }: order id <unique id> generate for each request to track the order
 * @param { apiKey }: api key, It depend on client sdk, if required we have to pass
 * @param { config }: Any other config required to client sdk
 */
export interface StartPaymentResponseI {
  sdkUrl: string,
  providerOrderId: string,
  apiKey?: string,
  config?: object
}

/**
 * @interface: CollectUpiPaymentRequestI
 * @desc: When Payment plugin call collectUpiPayment method, then request should be defined request
 * @param { amountInPaise }: How much amount has to collect
 * @param { orderId }: Order id <unique id>
 * @param { paymentAddress}: Payment address <upi id>
 */
export interface CollectUpiPaymentRequestI {
  amountInPaise: number
  orderId: string
  paymentAddress?: string
}

/**
 * @interface CollectPaymentResponseI
 * @param { providerOrderId }: Payment provider order Id
 * @param { status }: Payment status
 * @param { createdDate }: Order created date
 * @param { paymentId }: Payment Id
 * @param { orderId }: Order id, (Sunbird provider order id)
 */
export interface CollectPaymentResponseI {
  providerOrderId: string
  status: string
  createdDate: string
  paymentId: string
  orderId: string
}
/**
 *
 * @export
 * @interface PaymentStatusRequestI
 * @param { paymentId }: Payment Id
 */
export interface PaymentStatusRequestI {
  paymentId: string
}

/**
 * @export
 * @interface PaymentStatusResponseI
 * @param { paymentId }: Payment Id
 * @param { status }: Payment status
 * @param { amount }: Amount in paisa
 * @param { orderId }: Order Id
 * @param { createddate }: Created date
 */
export interface PaymentStatusResponseI {
  paymentId: string
  status: string
  amount: number,
  orderId: string,
  createddate: string
}

/**
 * @export
 * @interface OrderStatusRequestI
 * @param { providerOrderId }: Provider order id
 */
export interface OrderStatusRequestI {
  providerOrderId: string
}


/**
 * @export
 * @interface GetOrderStatusResponseI
 * @param { providerOrderId }: provider Order Id
 * @param { status }: Payment status
 * @param { createddate }: Created date
 * @param { paymentId }: Payment id
 * @param { orderId }: order Id
 */
export interface GetOrderStatusResponseI {
  providerOrderId: string
  status: string
  createdDate: string
  paymentId: string
  orderId: string
}


/**
 * @export
 * @interface SendPaymentRequestI
 * @param { refundAmountInPaise }: Amount which we want to refund
 * @param { collectedAmountInPaise }: Amount which we collected 
 * @param { orderId }: order Id
 * @param { paymentId }: Payment id
 * @param { payment Address }: Payment address (Upi id)
 */
export interface SendPaymentRequestI {
  refundAmountInPaise: number
  collectedAmountInPaise?: number
  orderId: string
  paymentId: string
  paymentAddress?: string
}

/**
 * @export
 * @interface SendPaymentResponseI
 * @param { providerOrderId }: Provide order id
 * @param { status }: Payment status
 * @param { amount }: Amount in paisa
 * @param { orderId }: Order Id
 * @param { createddate }: Created date
 * 
 */
export interface SendPaymentResponseI {
  providerOrderId: string
  status: string
  createdDate: string
  paymentId: string
  sunbirdOrderId: string
}


/**
 * @export
 * @interface PaymentCollectorI
 * @desc: These interface method is used to collect payment. If any provider want to use payment plugin then 
 * that provider have to implement these method.
 */
export interface PaymentCollectorI {
  startPayment(req: StartPaymentRequestI): Promise<StartPaymentResponseI | ErrorResponseI>
  getPaymentStatus(req: PaymentStatusRequestI): Promise<PaymentStatusResponseI | ErrorResponseI>
  getOrderStatus(req: OrderStatusRequestI): Promise<GetOrderStatusResponseI | ErrorResponseI>
  collectUpiPayment(req: CollectUpiPaymentRequestI): Promise<CollectPaymentResponseI | ErrorResponseI>
  collectUpiPaymentCallback(reqBody: object, reqHeader: object): Promise<CollectPaymentResponseI | ErrorResponseI>
}


/**
 * @export
 * @interface PaymentSenderI
 * @desc If we want to send money back or for scholarship, then we have to implement this interface.
 */
export interface PaymentSenderI {
  sendPayment(req: SendPaymentRequestI): Promise<SendPaymentResponseI | ErrorResponseI>
  sendPaymentCallback(reqBody: object, reqHeader: object): Promise<SendPaymentResponseI | ErrorResponseI>
  getPaymentStatus(providerOrderId: string): Promise<PaymentStatusResponseI | ErrorResponseI>
}
