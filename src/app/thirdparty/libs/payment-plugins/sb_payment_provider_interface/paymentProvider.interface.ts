export interface CollectUpiPaymentRequestI {
  amount: number
  orderId: string
  currency?: string
  upiId?: string
}

export interface PaymentResponseI {
  errCode? : string
  errMsg? : string
  statusCode: number
  responseCode: string
  result: any
}

export interface PaymentStatusRequestI {
  paymentId: string
}

export interface OrderStatusRequestI {
  providerOrderId: string
}

export interface CollectPaymentResultI {
  cpTxnId: string
  cpStatus: string
  cpCreatedDate: string
  paymentId: string
  orderId: string
}

export interface SendPaymentResultI {
  spTxnId: string
  spStatus: string
  spCreatedDate: string
  paymentId: string
  orderId: string
}

export interface CollectPaymentResponseI extends PaymentResponseI {
  result: CollectPaymentResultI
}

export interface SendPaymentResponseI extends PaymentResponseI {
  result: SendPaymentResultI
}

export interface SenderPaymentRequestI {
  refundAmount: number
  collectedAmount?: number
  orderId: string
  paymentId: string
  upiId?: string
}

export interface PaymentCollectorI {
  startPayment(): Promise<PaymentResponseI>
  getPaymentStatus(req: PaymentStatusRequestI): Promise<PaymentResponseI>
  getOrderStatus(req: OrderStatusRequestI): Promise<PaymentResponseI>
  collectUpiPayment(req: CollectUpiPaymentRequestI): Promise<CollectPaymentResponseI>
  collectUpiPaymentCallback(reqBody: object, reqHeader: object): Promise<CollectPaymentResponseI>
}

export interface PaymentSenderI {
  sendPayment(req: SenderPaymentRequestI): Promise<SendPaymentResponseI>
  sendPaymentCallback(reqBody: object, reqHeader: object): Promise<SendPaymentResponseI>
}
