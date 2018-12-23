import { Injectable } from '@angular/core';
import { ConfigService, ServerResponse } from '@sunbird/shared';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';
import { LearnerService } from '@sunbird/core';

@Injectable()
export class CourseBadgeService {

  private _issueList: any;

  constructor(public config: ConfigService, public learnerService: LearnerService) { }

  getIssuerListDetail = () => {
    return this._issueList;
  }

  storeIssuerListDetail = (data) => {
    this._issueList = data;
  }

  getIssuerList(): Observable<ServerResponse> {
    const option = {
      url: this.config.urlConFig.URLS.BADGE.GET_ISSUER_LIST
    };
    return this.learnerService.get(option);
  }

}
