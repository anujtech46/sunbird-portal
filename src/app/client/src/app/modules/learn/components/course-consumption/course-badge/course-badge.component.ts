/**
 * @name: course-badge.component.ts
 * @author: Anuj Gupta
 * @description: This component is use to show badge inside course
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '@sunbird/core';
import { IUserData, ServerResponse } from '@sunbird/shared';
 import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { CourseBadgeService, CourseConsumptionService, CourseCertificateService } from '../../../services';
import * as crypto from 'crypto-js';
import { ISubscription } from 'rxjs/Subscription';
 @Component({
  selector: 'app-course-badge',
  templateUrl: './course-badge.component.html',
  styleUrls: ['./course-badge.component.css']
})
export class CourseBadgeComponent implements OnInit, OnDestroy {
   /**
   * userProfile: Current user profile
   */
  private userProfile: any;
   /**
   * ccBadgeId: Course completion batch id
   */
  private ccBadgeId: string;
   /**
   * userBadges: List of user badges
   */
  public userBadges: any;
   /**
   * Course id
   */
  public courseId: string;
   /**
   * Course data
   */
  public courseData: any;
   /**
   * Add to digilocker ID
   */
  private addToDigiLockerId: string;
   /**
   * Certificate file url
   */
  private fileUrl: string;
   /**
   * Digilocker update time stamp interval
   */
  private digiLockerValueUpdateInterval = 1200000;
   /**
   * Interval time to clear when we destroy component
   */
  private digiLockerValueUpdateSetInterval: any;
   userDataUnsubscribe: ISubscription;
   /**
   * @param  {UserService} public userService
   */

  isDigiLockerEnabled: boolean;
  constructor(public userService: UserService, public courseBadgeService: CourseBadgeService,
    public activatedRoute: ActivatedRoute, public courseConsumptionService: CourseConsumptionService,
    public courseCertificateService: CourseCertificateService) {
      this.isDigiLockerEnabled =
      (<HTMLInputElement>document.getElementById('isDigiLockerEnabled')).value === 'false' ? false : true;
  }
   /**
   * On init:
   * get the course complete batch id
   * Get the user profile
   * Call get course badge
   */
  ngOnInit() {
    this.ccBadgeId = (<HTMLInputElement>document.getElementById('courseCompletionBadgeId')).value;
    this.userProfile = this.userService.userProfile;
    this.getCourseBadge();
    this.activatedRoute.params.subscribe(params => {
      this.courseId = params.courseId;
      this.courseConsumptionService.getCourseHierarchy(this.courseId).subscribe((resp) => {
      this.courseData = resp;
      this.download();
      });
    });
  }
   /**
   * getCourseBadge()
   * This function is used to get course badge from profile.
   * First check the badge data inside the user profile, If not available called the get user profile
   */
  getCourseBadge = () => {
    const badgeDetail: any = _.find(this.userProfile.badgeAssertions, { 'badgeId': this.ccBadgeId });
    console.log('Checked badge, if not get from user profile :: ', badgeDetail);
    if (badgeDetail && badgeDetail.issuerId) {
      this.userBadges = badgeDetail;
      if (!this.userBadges.issuerName) {
        this.getIssuerName();
      }
  } else {
    console.log('Get profile api called to get badge detail :: ');
      this.userService.getUserProfile();
      this.userDataUnsubscribe = this.userService.userData$.subscribe((user: IUserData) => {
        if (user && !user.err) {
          if (this.userDataUnsubscribe) {
            this.userDataUnsubscribe.unsubscribe();
          }
          const badge = _.find(user.userProfile.badgeAssertions, { 'badgeId': this.ccBadgeId });
          console.log('We got badge info :: ', badge);
          this.userBadges = badge;
          if (this.userBadges && this.userBadges.issuerName) {
            this.getIssuerName();
          }
        }
      });
    }
  }
   /**
   * Ths function is used to get the issuer name.
   */
  getIssuerName = () => {
    const issuerList = this.courseBadgeService.getIssuerListDetail() || [];
    let issuer: any = _.find(issuerList, { 'issuerId': this.userBadges && this.userBadges.issuerId });
    if (issuer) {
      this.userBadges.issuerName = issuer.name;
    } else {
      this.courseBadgeService.getIssuerList().subscribe((resp) => {
        if (resp && resp.responseCode === 'OK') {
          issuer = _.find(resp.result.issuers,
            { 'issuerId': this.userBadges.issuerId });
          if (issuer) {
            this.userBadges.issuerName = issuer.name;
            issuerList.push(issuer);
            this.courseBadgeService.storeIssuerListDetail(issuerList);
          }
        }
      }, (err) => {
        console.log('Unable to get user issue list');
      });
    }
  }
   /**
   * Download certificate
   */
  download = () => {
    this.fileUrl = this.courseCertificateService.certificateUrl;
    if (!this.fileUrl) {
      this.courseCertificateService.download(this.userProfile, this.courseData).subscribe((response) => {
        if (response && response.responseCode === 'OK') {
          this.fileUrl = response.result && response.result.fileUrl;
          this.courseCertificateService.certificateUrl = this.fileUrl;
          this.loadDigiLockerScript();
        } else {
          this.loadDigiLockerScript();
        }
      }, (err) => {
        console.log('err', err);
      });
    } else {
      this.loadDigiLockerScript();
    }
  }
   /**
   * Load digilocker script
   * Load the script file and update time after 20 min,
   */
  loadDigiLockerScript = () => {
    this.addToDigiLockerId = String(Date.now());
    const digiLockerScript = document.createElement('script');
    let timeStamp = Date.now();
    const appId = (<HTMLInputElement>document.getElementById('addToDigiLockerAppID')).value;
    const appKey = (<HTMLInputElement>document.getElementById('addToDigiLockerAppKey')).value;
    const url = (<HTMLInputElement>document.getElementById('addToDigiLockerUrl')).value;
    let hash = crypto.SHA256(appId + appKey + timeStamp).toString();
    digiLockerScript.setAttribute('type', 'text/javascript');
    digiLockerScript.setAttribute('src', url);
    digiLockerScript.setAttribute('id', 'dlshare');
    digiLockerScript.setAttribute('data-app-id', appId);
    digiLockerScript.setAttribute('data-app-hash', hash);
    digiLockerScript.setAttribute('time-stamp', String(timeStamp));
    document.head.appendChild(digiLockerScript);
     if (!this.digiLockerValueUpdateSetInterval) {
      this.digiLockerValueUpdateSetInterval = setInterval(() => {
        timeStamp = Date.now();
        hash = crypto.SHA256(appId + appKey + timeStamp).toString();
        digiLockerScript.setAttribute('data-app-hash', hash);
        digiLockerScript.setAttribute('time-stamp', String(timeStamp));
      }, this.digiLockerValueUpdateInterval);
    }
  }
   /**
   * Called when destroy component
   * clear digilocker update time set interval once destroy the component
   */
  ngOnDestroy() {
    if (this.digiLockerValueUpdateSetInterval) {
      clearInterval(this.digiLockerValueUpdateSetInterval);
    }
    if (this.userDataUnsubscribe) {
      this.userDataUnsubscribe.unsubscribe();
    }
  }
}