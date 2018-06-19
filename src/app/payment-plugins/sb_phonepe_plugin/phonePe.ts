import { PaymentCollectorI, PaymentSenderI, PaymentRequestI, PaymentResponseI } from 'sb_payment_interface';

export class PaymentProvider implements PaymentCollectorI, PaymentSenderI {

  public collectPayment = (data: PaymentRequestI, callback) => {
    callback() //Callback with err or success response
  }

  public collectPaymentCallback = (reqBody: object, reqHeader: object, callback) => {
    callback() //Callback with err or success response
  }

  public sendPayment = (data: PaymentRequestI, callback) => {
    callback() //Callback with err or success response
  }

  public sendPaymentCallback = (reqBody: object, reqHeader: object, callback) => {
    callback() //Callback with err or success response
  }
}