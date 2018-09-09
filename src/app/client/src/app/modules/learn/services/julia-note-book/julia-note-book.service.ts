import { Injectable } from '@angular/core';
import { ConfigService, ServerResponse } from '@sunbird/shared';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';
import { JuliaBoxService } from '@sunbird/core';

@Injectable()
export class JuliaNoteBookService {
  private _issueList: any;

  constructor(public config: ConfigService, public juliaBoxService: JuliaBoxService) { }

  getPing(): Observable<ServerResponse> {
    const option = {
      url: this.config.urlConFig.URLS.JULIA_BOX.PING
    };
    return this.juliaBoxService.get(option);
  }

  ssoPing(data): Observable<ServerResponse> {
    const option = {
      url: this.config.urlConFig.URLS.JULIA_BOX.SSO,
      data: data
    };
    return this.juliaBoxService.post(option);
  }

}
