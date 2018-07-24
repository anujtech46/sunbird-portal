export interface CollectUpiPaymentRequestI {
  amount: number
  upiId: string
  providerOrderId: string
  current?: string
}

export interface AddPaymentOrderStatusRequestI {
  providerOrderId: string
  status: string
}

export interface PaymentResponseI {
  errCode? : string
  errMsg? : string
  statusCode: number
  responseCode: string
  result: any
}

export interface orderPaymentSuccessRequestI {
  providerOrderId: string
  paymentId: string
}

export interface PaymentPluginInterface {
  startPaymentI(orderId: string): Promise<PaymentResponseI>
  collectUpiPaymentI(req: CollectUpiPaymentRequestI): Promise<PaymentResponseI>
  addOrderPaymentStatus(req: AddPaymentOrderStatusRequestI): Promise<PaymentResponseI>
  getLastOrderPaymentStatus(orderId: string): Promise<PaymentResponseI>
  orderPaymentSuccess(req: orderPaymentSuccessRequestI): Promise<PaymentResponseI>
  getOrderStatus(orderId: string): Promise<PaymentResponseI>
}

