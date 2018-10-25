import { Component, OnInit} from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {  ConfigService, ResourceService, ServerResponse, ToasterService } from '@sunbird/shared';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { SignupService } from '../../../../modules/public/services/signup.service';
import { SearchService, ContentService, SearchParam, PermissionService, RolesAndPermissions } from '@sunbird/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'app-user-registered',
  templateUrl: './user-registered.component.html',
  styleUrls: ['./user-registered.component.css']
})
export class UserRegisteredComponent implements OnInit {
  allRoles: any[];
  userReg: FormGroup;
  showModal = false;
  languages: Array<string>;
  orgs: any;
  showLoader = false;
  public unsubscribe$ = new Subject<void>();
  showcommonerror = false;

  constructor(public activatedRoute: ActivatedRoute, public config: ConfigService, public signupService: SignupService,
    public content: ContentService, public resourceService: ResourceService, public permissionService: PermissionService, 
    public toasterService: ToasterService, public router: Router) {
    this.languages = this.config.dropDownConfig.COMMON.languages;
    console.log('lang', this.languages);
    this.getOrgList();
    this.getRoles();
  }

  ngOnInit() {
    this.userReg = new FormGroup({
      userName: new FormControl(null, [Validators.required, Validators.pattern('^[A-Za-z0-9- ]+$')]),
      password: new FormControl(null, [Validators.required, Validators.pattern('^[^(?! )][0-9]*[A-Za-z\\s@#!$?*^&0-9]*(?<! )$')]),
      firstName: new FormControl(null, [Validators.required, Validators.pattern('^[A-Za-z0-9- ]+$')]),
      lastName: new FormControl(null),
      phone: new FormControl(null, [Validators.pattern('^\\d{10}$')]),
      email: new FormControl(null, [Validators.pattern(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,4}$/)]),
      roles: new FormControl(null, [Validators.required]),
      organization: new FormControl(null, [Validators.required])
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
    this.userReg.reset();
    this.showcommonerror = false;
  }

  getRoles() {
    this.permissionService.permissionAvailable$.subscribe(params => {
      if (params === 'success') {
        this.allRoles = this.permissionService.allRoles;
      }
      this.allRoles = _.filter(this.allRoles, (role) => {
        return role.role !== 'SYSTEM_ADMINISTRATION' && role.role !== 'ADMIN' && role.role !== 'COURSE_CREATOR';
        // return role.role !== 'ORG_ADMIN' && role.role !== 'SYSTEM_ADMINISTRATION' && role.role !== 'ADMIN';
      });

    //   this.allRoles = _.map(this.allRoles, (obj) => {
    //     return { 'id': obj.id, 'name': obj.name };
    // });
      console.log(this.allRoles);
    });
  }

  onSubmitForm() {
    if (!this.userReg.value.phone && !this.userReg.value.email) {
      this.showcommonerror = true;
    } else {
      this.showcommonerror = false;
      this.showLoader = true;
      this.showModal = false;
      this.signupService.signup(this.userReg.value).pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(res => {
        this.showLoader = false;
        this.userReg.reset();
        this.toasterService.success(this.resourceService.messages.smsg.m0046);
        this.router.navigate(['/profile']);
      },
      err => {
        this.showLoader = false;
        this.toasterService.error(err.error.params.errmsg);
      });
    }
  }
}
