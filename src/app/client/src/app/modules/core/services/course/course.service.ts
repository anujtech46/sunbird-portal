import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { LearnerService } from './../learner/learner.service';
import { UserService } from './../user/user.service';
import { ConfigService, ServerResponse } from '@sunbird/shared';
import { IEnrolledCourses } from './../../interfaces';
import { ContentService } from '../content/content.service';
import * as _ from 'lodash';
import { SearchParam } from '@sunbird/core';
/**
 *  Service for course API calls.
 */
@Injectable()
export class CoursesService {
  /**
   * To get details about user profile.
   */
  private userService: UserService;
  /**
   *  To do learner service api call.
   */
  private learnerService: LearnerService;
  /**
   *  To get url, app configs.
   */
  private contentService: ContentService;
  /**
   *  To get url, app configs.
   */
  private config: ConfigService;
  /**
   * user id
   */
  userid: string;
  /**
   * BehaviorSubject Containing enrolled courses.
   */
  private _enrolledCourseData$ = new BehaviorSubject<IEnrolledCourses>(undefined);
  /**
   * Read only observable Containing enrolled courses.
   */
  public readonly enrolledCourseData$: Observable<IEnrolledCourses> = this._enrolledCourseData$.asObservable();
  /**
  * the "constructor"
  *
  * @param {LearnerService} learnerService Reference of LearnerService.
  * @param {UserService} userService Reference of UserService.
  * @param {ConfigService} config Reference of ConfigService
  */
  constructor(userService: UserService, learnerService: LearnerService,
    config: ConfigService, contentService: ContentService) {
    this.config = config;
    this.userService = userService;
    this.learnerService = learnerService;
    this.userid = this.userService.userid;
    this.contentService = contentService;
  }
  /**
   *  api call for enrolled courses.
   */
  public getEnrolledCourses() {
    const option = {
      url: this.config.urlConFig.URLS.COURSE.GET_ENROLLED_COURSES + '/' + this.userid
    };
    return this.learnerService.get(option).map(
      (apiResponse: ServerResponse) => {
        this.getEnrolledCourseWithBatchName(apiResponse.result.courses, (enrolledCourses) => {
          this._enrolledCourseData$.next({ err: null, enrolledCourses: enrolledCourses });
          return apiResponse;
        });
      }).catch((err) => {
        this._enrolledCourseData$.next({ err: err, enrolledCourses: undefined });
        return err;
      }
    );
  }

  getEnrolledCourseWithBatchName = (enrolledCourses, cb) => {
    const courseIds = _.map(enrolledCourses, 'courseId');
    const req = {
      filters: {
        courseId: courseIds
      }
    };
    this.batchSearch(req).subscribe((data: ServerResponse) => {
      if (data.result.response.content && data.result.response.content.length > 0) {
          enrolledCourses = _.map(enrolledCourses, (course) => {
            const batchData: any = _.find(data.result.response.content, {identifier: course.batchId});
            course['batchName'] = batchData && batchData.name;
            return course;
          });
          cb(enrolledCourses);
        } else {
        cb(enrolledCourses);
      }
    },
    (err: ServerResponse) => {
      cb(enrolledCourses);
    });
  }

  batchSearch(requestParam: SearchParam): Observable<ServerResponse> {
    const option = {
      url: this.config.urlConFig.URLS.BATCH.GET_BATCHS,
      data: {
        request: {
          filters: requestParam.filters,
          limit: requestParam.limit,
          sort_by: requestParam.sort_by
        }
      }
    };
    return this.learnerService.post(option);
  }
  /**
   *  call enroll course api and subscribe. Behavior subject will emit enrolled course data
  */
  public initialize() {
    this.getEnrolledCourses().subscribe((date) => {
    });
  }
}

