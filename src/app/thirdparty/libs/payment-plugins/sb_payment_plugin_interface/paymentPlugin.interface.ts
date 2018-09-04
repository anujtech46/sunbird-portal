
export interface CollectUpiPaymentRequestI {
  amountInPaise: number
  paymentAddress: string
  sunbirdOrderId: string
  currency?: string
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

export interface SendUpiPaymentRequestI {
  providerOrderId: string
  amountInPaise: number
  paymentAddress?: string
  collectPaymentId?: string
  currency?: string
}


export interface PaymentPluginInterface {
  startPayment(req: StartPaymentRequestI): Promise<void>
  collectUpiPayment(req: CollectUpiPaymentRequestI): Promise<void>
  addOrderPaymentStatus(req: AddOrderPaymentStatusRequestI): Promise<void>
  getOrderLastPaymentStatus(sunbirdOrderId: string): Promise<void>
  orderPaymentSuccess(req: OrderPaymentSuccessRequestI): Promise<void>
  getOrderPaymentStatus(sunbirdOrderId: string): Promise<void>
  sendUpiPayment(req: SendUpiPaymentRequestI): Promise<void>
}

