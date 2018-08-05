export interface CollectUpiPaymentRequestI {
  amountInPaise: number
  paymentAddress: string
  sunbirdOrderId: string
  current?: string
}
export interface PaymentResponseI {
  errCode? : string
  errMsg? : string
  statusCode: number
  result?: any
}
export interface StartPaymentRequestI {
  sunbirdOrderId: string
}
export interface StartPaymentResultI {
  sdkUrl: string,
  sunbirdOrderId: string,
  providerOrderId: string,
  config: object
}
export interface StartPaymentSuccessResponseI extends PaymentResponseI{
  result: StartPaymentResultI
}

export interface CollectUpiPaymentRequestI {
  providerOrderId?: string
}
export interface CollectUpiPaymentResultI {
  providerOrderId: string,
  status: string
}
export interface CollectUpiPaymentSuccessResponseI extends PaymentResponseI{
  result: CollectUpiPaymentResultI
}
export interface AddOrderPaymentStatusRequestI {
  providerOrderId: string
  status: string
}

export interface OrderPaymentSuccessRequestI {
  providerOrderId: string
  paymentId: string
}

export interface PaymentPluginInterface {
  startPayment(StartPaymentRequestI): Promise<StartPaymentSuccessResponseI | PaymentResponseI>
  collectUpiPayment(req: CollectUpiPaymentRequestI): Promise<CollectUpiPaymentSuccessResponseI | PaymentResponseI>
  addOrderPaymentStatus(req: AddOrderPaymentStatusRequestI): Promise<PaymentResponseI>
  getLastOrderPaymentStatus(sunbirdOrderId: string): Promise<PaymentResponseI>
  orderPaymentSuccess(req: OrderPaymentSuccessRequestI): Promise<PaymentResponseI>
  getOrderPaymentStatus(sunbirdOrderId: string): Promise<PaymentResponseI>
}

