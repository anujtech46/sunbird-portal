import { Injectable } from '@angular/core';
import { DataService } from '../data/data.service';
import { ConfigService } from '@sunbird/shared';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class PaymentService extends DataService {

    /**
   * base Url for announcement api
   */
  baseUrl: string;
  /**
   * reference of config service.
   */
  public config: ConfigService;
  /**
   * reference of lerner service.
   */
  public http: HttpClient;
  /**
   * Constructor - default method of CoursePriceService class
   *
   * @param {ConfigService} config ConfigService reference
   * @param {HttpClient} http HttpClient reference
   */
  constructor(config: ConfigService, http: HttpClient) {
    super(http);
    this.config = config;
    this.baseUrl = this.config.urlConFig.URLS.PAYMENT_PREFIX;
  }

  startPayment() {
    const option = {
      url: this.config.urlConFig.URLS.PAYMENT.START
    };
    return this.get(option);
  }

  createPayment(data) {
    const option = {
      url: this.config.urlConFig.URLS.PAYMENT.CREATE,
      data: {
        'request': data
      }
    };
    return this.post(option);
  }

  submitPayment(data) {
    const option = {
      url: this.config.urlConFig.URLS.PAYMENT.SUBMIT,
      data: {
        'request': data
      }
    };
    return this.patch(option);
  }

  paymentStatus(data) {
    const option = {
      url: this.config.urlConFig.URLS.PAYMENT.STATUS,
      data: {
        'request': data
      }
    };
    return this.post(option);
  }

  sendPayment = (data) => {
    const option = {
      url: this.config.urlConFig.URLS.PAYMENT.SEND,
      data: {
        'request': data
      }
    };
    return this.post(option);
  }

}
