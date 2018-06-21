import { PaymentCollectorI, PaymentSenderI, PaymentRequestI, PaymentResponseI } from 'sb_payment_interface';

export class PaymentController  {

  private config: any
  private collectPaymentProvider: PaymentCollectorI
  private SendPaymentProvider: PaymentSenderI

  constructor () {
  }

  /**
   * @method: This function is use to set config
   * @param config 
   */
  public setConfig = (config: any) => {
    this.config = { ...this.config, ...config}

    //Initialize payment provider plugin
    this.initPaymentProviderPlugin()
  }

  /**
   * @method: This function in used to initilize the payment provider plugin 
   */
  private initPaymentProviderPlugin = () => {

    // Get the collect payment provider name from config
    const collectPaymentProvider = this.config.SUNBIRD_COLLECT_PAYMENT_PROVIDER_PLUGIN

    //Get the send payment provice name from config
    const sendPaymentProvider = this.config.SUNBIRD_SEND_PAYMENT_PROVIDER_PLUGIN

    // Initialize the plugin's
    const CollectPaymentProvider = require(collectPaymentProvider).PaymentProvider
    const SendPaymentProvider = require(sendPaymentProvider).PaymentProvider

    // Create the instance of the provider plugin
    this.collectPaymentProvider = new CollectPaymentProvider()
    this.SendPaymentProvider = new SendPaymentProvider()
  }

  /**
   * @method: This function is use to collect payment
   */
  public collectPayment = (req, res) => {
    // Parse the request
    // Create txn id
    // Stroe reqdata with txn id
    // call the provider collect payment method
      // this.collectPaymentProvider.collectPayment(paymentRequest: PaymentRequestI, function (err?: PaymentResponseI, res?: PaymentResponseI) => { })
    // handle the err or success res
    // if err return
    // else store txnId in db
    // return res
  }

  /**
   * @method: This function is used to handle collect payment callback 
   */
  public collectPaymentCallback = (req, res) => {

  }

  /**
   * @method: Get the payment status
   */
  public getPaymentStatus = (req, res) => {

  }

  public sendPayment = (req, res) => {
    //Implenent
  }

  public sendPaymentCallback = (req, res) => {
    //Implenent
  }
}