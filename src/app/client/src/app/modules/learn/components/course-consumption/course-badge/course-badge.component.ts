/**
 * @name: course-badge.component.ts
 * @author: Anuj Gupta
 * @description: This component is use to show badge inside course
 */
import { Component, OnInit } from '@angular/core';
import { UserService } from '@sunbird/core';
import { IUserData } from '@sunbird/shared';
import { CourseBadgeService, CourseConsumptionService } from '../../../services';
import * as _ from 'lodash';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-course-badge',
  templateUrl: './course-badge.component.html',
  styleUrls: ['./course-badge.component.css']
})
export class CourseBadgeComponent implements OnInit {

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

  // Julia related code
  public courseId: string;
  public courseData: any;

  /**
   * @param  {UserService} public userService
   */
  constructor(public userService: UserService, public courseBadgeService: CourseBadgeService,
    public activatedRoute: ActivatedRoute, public courseConsumptionService: CourseConsumptionService) {
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
      });
    });
  }

  /**
   * This function is used to get course badge from profile.
   * First check the badge data inside the user profile, If not available called the get user profile
   */
  getCourseBadge = () => {
    const badgeDetail = _.find(this.userProfile.badgeAssertions, { 'badgeId': this.ccBadgeId });
    console.log('Checked badge, if not get from user profile again', badgeDetail);
    if (badgeDetail) {
      this.userBadges = badgeDetail;
      if (!this.userBadges.issuerName) {
        this.getIssuerName();
      }
    } else {
      this.userService.getUserProfile();
      const userDataUnsubscribe = this.userService.userData$.subscribe((user: IUserData) => {
        if (user && !user.err) {
          if (userDataUnsubscribe) {
            userDataUnsubscribe.unsubscribe();
            const badge = _.find(user.userProfile.badgeAssertions, { 'badgeId': this.ccBadgeId });
            this.userBadges = badge;
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
    let issuer: any = _.find(issuerList, { 'issuerId': this.userBadges.issuerId });
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
}
