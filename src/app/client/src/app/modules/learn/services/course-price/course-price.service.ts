import { Injectable } from '@angular/core';
import { DataService } from '@sunbird/core';
import { ConfigService, CreatePriceI, UpdatePriceI } from '@sunbird/shared';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class CoursePriceService extends DataService {

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
    this.baseUrl = this.config.urlConFig.URLS.PRICE_PREFIX;
  }

  createPrice(data: CreatePriceI) {
    const option = {
      url: this.config.urlConFig.URLS.PRICE.CREATE,
      data: {
        'request': data
      }
    };
    return this.post(option);
  }

  updatePrice(data) {
    const option = {
      url: this.config.urlConFig.URLS.PRICE.UPDATE,
      data: {
        'request': data
      }
    };
    return this.patch(option);
  }

  readPrice(priceId) {
    const option = {
      url: this.config.urlConFig.URLS.PRICE.Read + '/' + priceId,
    };
    return this.get(option);
  }

  searchPrice(data: any) {
    const option = {
      url: this.config.urlConFig.URLS.PRICE.SEARCH,
      data: {
        'request': data
      }
    };
    return this.post(option);
  }

}
