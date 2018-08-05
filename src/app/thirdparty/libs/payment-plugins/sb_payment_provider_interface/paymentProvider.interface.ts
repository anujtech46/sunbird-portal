
export interface StartPaymentResponseI {
  sdkUrl: string,
  providerOrderId: string,
  apiKey? : string,
  config? : object
}
export interface ErrorResponseI {
  errCode? : string
  errMsg? : string
}
export interface PaymentStatusRequestI {
  paymentId: string
}
export interface GetPaymentStatusResponseI {
  paymentId: string
  status: string
  amount: number,
  orderId: string,
  date: string
}
export interface OrderStatusRequestI {
  providerOrderId: string
}
export interface GetOrderStatusResponseI {
  providerOrderId: string
  status: string
  createdDate: string
  paymentId: string
  orderId: string
}
export interface CollectUpiPaymentRequestI {
  amountInPaise: number
  orderId: string
  paymentAddress?: string
}
export interface CollectPaymentResponseI {
  providerOrderId: string
  status: string
  createdDate: string
  paymentId: string
  orderId: string
}
export interface SenderPaymentRequestI {
  refundAmountInPaise: number
  collectedAmountInPaise?: number
  orderId: string
  paymentId: string
  paymentAddress?: string
}
export interface SendPaymentResponseI {
  providerOrderId: string
  status: string
  createdDate: string
  paymentId: string
  sunbirdOrderId: string
}
export interface PaymentCollectorI {
  startPayment(sunbirdOrderId: string): Promise<StartPaymentResponseI | ErrorResponseI>
  getPaymentStatus(req: PaymentStatusRequestI): Promise<GetPaymentStatusResponseI | ErrorResponseI>
  getOrderStatus(req: OrderStatusRequestI): Promise<GetOrderStatusResponseI | ErrorResponseI>
  collectUpiPayment(req: CollectUpiPaymentRequestI): Promise<CollectPaymentResponseI | ErrorResponseI>
  collectUpiPaymentCallback(reqBody: object, reqHeader: object): Promise<CollectPaymentResponseI | ErrorResponseI>
}

export interface PaymentSenderI {
  sendPayment(req: SenderPaymentRequestI): Promise<SendPaymentResponseI | ErrorResponseI>
  sendPaymentCallback(reqBody: object, reqHeader: object): Promise<SendPaymentResponseI | ErrorResponseI>
}
