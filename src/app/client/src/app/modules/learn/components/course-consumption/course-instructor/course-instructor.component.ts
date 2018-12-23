import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { PermissionService, UserService, SearchService } from '@sunbird/core';
import { ServerResponse, ResourceService, ConfigService, ToasterService } from '@sunbird/shared';
import { CourseBatchService } from '../../../services';
import * as _ from 'lodash';
import { takeUntil, mergeMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
@Component({
  selector: 'app-course-instructor',
  templateUrl: './course-instructor.component.html',
  styleUrls: ['./course-instructor.component.css']
})
export class CourseInstructorComponent implements OnInit, OnDestroy {

  courseMentor = false;
  @Input() courseId: string;
  @Input() instructorsList: any;
  userProfile: any;
  rootOrgId: string;
  mentorList: any;
  public unsubscribe = new Subject<void>();
  showAddModal: boolean;
  selectedMentors: any;

  constructor(
    public permissionService: PermissionService,
    public user: UserService,
    public searchService: SearchService,
    public toasterService: ToasterService,
    public resourceService: ResourceService,
    public courseBatchService: CourseBatchService
  ) { }

  ngOnInit() {
    if (this.permissionService.checkRolesPermissions(['COURSE_MENTOR'])) {
      this.courseMentor = true;
    } else {
      this.courseMentor = false;
    }
    this.populateUserSearch();
  }


  /**
 * This method sets the make an api call to get all search data with page No and offset
 */
  populateUserSearch() {
    const searchParams = {
      filters: {
        'objectType': ['user'],
        'rootOrgId': this.rootOrgId,
        'organisations.roles': ['COURSE_MENTOR'],
        identifier: this.instructorsList
      }
    };
    this.courseBatchService.getUserList(searchParams).pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        console.log('User search', res);
        this.selectedMentors = res.result.response.content;
      },
        (err) => {
          if (err.error && err.error.params.errmsg) {
            this.toasterService.error(err.error.params.errmsg);
          } else {
            this.toasterService.error(this.resourceService.messages.fmsg.m0056);
          }
        });
  }

  ngOnDestroy() {
    // if (this.createBatchModel && this.createBatchModel.deny) {
    //   this.createBatchModel.deny();
    // }
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
