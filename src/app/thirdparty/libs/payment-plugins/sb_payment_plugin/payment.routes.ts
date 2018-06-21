import { PaymentController } from './payment.controller'
import * as bodyParser from 'body-parser'

export class PaymentRoutes {

  private config: any
  private paymentController: PaymentController

  //Set the collect callback url
  private collectPaymentCallBack: string = 'payment/v1/collect/callback'
  private sendPaymentCallBack: string = 'payment/v1/sent/callback'

  constructor() {
    this.paymentController = new PaymentController()
  }

  public init = (app: any) => {

    //Get configuration for provider
    const collectPaymentProvider = config.SUNBIRD_COLLECT_PAYMENT_PROVIDER_PLUGIN
    const sendPaymentProvider = config.SUNBIRD_SEND_PAYMENT_PROVIDER_PLUGIN

    //Add callback url in config 
    this.config.SUNBIRD_COLLECT_PAYMENT_CALLBACK_URL = this.collectPaymentCallBack
    this.config.SUNBIRD_SEND_PAYMENT_CALLBACK_URL = this.sendPaymentCallBack

    //Add body parser to parse the request body
    app.use(bodyParser.json({ limit: '10mb' }))

    //If collect payment provider is set, init collect payment routes
    if (collectPaymentProvider) {
      this.initCollectPaymentRoute(app)
    }

    //If send payment provider is set, init collect payment routes
    if (sendPaymentProvider) {
      this.initSendPaymentRoute(app)
    }

    //Init payment status routes
    this.initPaymentStatusRoute(app)

    this.paymentController.setConfig(this.config)
  }

  /**
   * @method: Initialize collect payment routes
   */
  private initCollectPaymentRoute = (app) => {
    app.post('payment/v1/collect', this.paymentController.collectPayment)
    app.post(this.config.SUNBIRD_COLLECT_PAYMENT_CALLBACK_URL, this.paymentController.collectPaymentCallback)
  }

  /**
   * @method: Initialize send payment routes
   */
  private initSendPaymentRoute = (app) => {
    app.post('payment/v1/send', this.paymentController.sendPayment)
    app.post(this.config.SUNBIRD_COLLECT_PAYMENT_CALLBACK_URL, this.paymentController.sendPaymentCallback)
  }

  /**
   * @method: Initialize payment status routes
   */
  private initPaymentStatusRoute = (app) => {
    app.post('payment/v1/status/:txnId', this.paymentController.getPaymentStatus)
  }
}