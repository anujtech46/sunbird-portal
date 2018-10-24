import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {  ConfigService, ResourceService , ServerResponse, ToasterService } from '@sunbird/shared';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { SearchService, ContentService, SearchParam } from '@sunbird/core';
import { ProfileService } from '../../services/profile/profile.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';
@Component({
  selector: 'app-org-registered',
  templateUrl: './org-registered.component.html',
  styleUrls: ['./org-registered.component.css']
})
export class OrgRegisteredComponent implements OnInit {
  orgReg: FormGroup;
  showModal = false;
  languages: Array<string>;
  orgs: any;
  showLoader = false;
  public unsubscribe$ = new Subject<void>();
  constructor(public activatedRoute: ActivatedRoute, public config: ConfigService, public content: ContentService,
     public resourceService: ResourceService, public toasterService: ToasterService, public router: Router,
     public profileService: ProfileService) {
    this.languages = this.config.dropDownConfig.COMMON.languages;
    console.log('lang', this.languages);
    this.getOrgList();
   }
    ngOnInit() {
      this.orgReg = new FormGroup({
      orgName: new FormControl(null, [Validators.required, Validators.pattern('^[-\\w\.\\$@\*\\!]{5,256}$')]),
      orgDesc: new FormControl(null, [Validators.required, Validators.pattern('^[^(?! )][0-9]*[A-Za-z\\s]*(?<! )$')])
      });
    }

    getOrgList() {
      this.orgSearch().subscribe((resp) => {
        this.orgs = resp.result && resp.result.response && resp.result.response.content || [];
        this.orgs = _.map(this.orgs, (obj) => {
            return { 'id': obj.id, 'orgName': obj.orgName };
        });
        console.log(this.orgs);
      });
    }

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
    openModal() {
    this.showModal = true;
    }
    closeModal() {
      this.showModal = false;
    }
    onSubmitForm () {
      this.showLoader = true;
      this.showModal = false;
      console.log (this.orgReg.value);
      const reqdata =  {
        "orgName": this.orgReg.value.orgName,
        "description": this.orgReg.value.orgDesc,
        "isRootOrg": false,
        "channel":"jaldhara"
      };
      console.log(reqdata);
      this.profileService.createOrg(this.orgReg.value).pipe(
        takeUntil(this.unsubscribe$))
        .subscribe(res => {
        this.showLoader = false;
        this.toasterService.success(this.resourceService.messages.smsg.m0045);
        this.router.navigate(['/profile']);
      },
      err => {
        this.showLoader = false;
        this.toasterService.error(err.error.params.errmsg);
      });
    }
}
