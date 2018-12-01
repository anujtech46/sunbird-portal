import { Component, OnInit } from '@angular/core';
import { PermissionService } from '@sunbird/core';

@Component({
  selector: 'app-course-instructor',
  templateUrl: './course-instructor.component.html',
  styleUrls: ['./course-instructor.component.css']
})
export class CourseInstructorComponent implements OnInit {

  courseMentor = false;

  constructor(public permissionService: PermissionService) { }

  ngOnInit() {
    if (this.permissionService.checkRolesPermissions(['COURSE_MENTOR'])) {
      this.courseMentor = true;
    } else {
      this.courseMentor = false;
    }
  }

}
