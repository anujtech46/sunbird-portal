import { Component, Output, EventEmitter, Input } from '@angular/core';
import { SearchService, ContentService, SearchParam } from '@sunbird/core';
import { Observable } from 'rxjs/Observable';
import { ServerResponse, ConfigService } from '@sunbird/shared';
import * as _ from 'lodash';

@Component({
  selector: 'app-org-dropdown',
  templateUrl: './org-dropdown.component.html',
  styleUrls: ['./org-dropdown.component.css']
})
export class OrgDropdownComponent {

  private searchService: SearchService;
  orgData: any;
  @Output() selectedOrg = new EventEmitter<Array<object>>();
  @Input() queryParams: any;
  selectedOrganization: any;

  constructor(searchService: SearchService, public content: ContentService,
    public config: ConfigService) {
    this.searchService = searchService;
    this.getOrgList();
  }

  /**
   * Org Search without offset.
  */
 orgSearch(): Observable<ServerResponse> {
  const option = {
    url: this.config.urlConFig.URLS.ADMIN.ORG_SEARCH,
    data: {
      request: {
        filters: {},
        sort_by: {orgName: 'asc'}
      }
    }
  };
  return this.content.post(option);
}

onChange(event) {
  const data = _.filter(this.orgData, (p) =>  _.includes(event, p.id));
  this.selectedOrg.emit(data);
}

  getOrgList() {
    this.orgSearch().subscribe((resp) => {
      this.orgData = resp.result && resp.result.response && resp.result.response.content || [];
      this.orgData = _.map(this.orgData, (obj) => {
        return { 'id': obj.id, 'orgName': obj.orgName };
      });
      this.selectedOrganization = this.queryParams.Organization;
      this.selectedOrg.emit(_.filter(this.orgData, (p) =>  _.includes(this.queryParams.Organization, p.id)));
    });

  }

}
