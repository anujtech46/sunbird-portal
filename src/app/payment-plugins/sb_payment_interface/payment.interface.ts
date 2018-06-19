export interface PaymentResponseI {
  errCode? : string,
  errMsg? : string,
  statusCode: number,
  responseCode: string,
  result: any
}

export interface PaymentRequestI {
  txnId: string,
  amount: string,
  from?: string,
  currency?: string,
  to?: string,
  paymentType: string
}

export interface PaymentCollectorI {
  collectPayment(req: PaymentRequestI, callback: (err?: ResponseI, res?: ResponseI) => {})
  collectPaymentCallback(reqBody: any, reqHeader: any, callback: (err?: ResponseI, res?: ResponseI) => {})
}

export interface PaymentSenderI {
  sendPayment(req: PaymentRequestI, callback: (err?: ResponseI, res?: ResponseI) => {})
  sendPaymentCallback(reqBody: any, reqHeader: any, callback: (err?: ResponseI, res?: ResponseI) => {})
}
