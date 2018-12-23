/**
 * @name: course-certificate.component.ts
 * @author: Anuj Gupta
 * @description: This component is use to handle course certificate
 */
import { Component, Input } from '@angular/core';
import { UserService } from '@sunbird/core';
import { CourseCertificateService } from '../../services/course-certificate/course-certificate.service';
import { ToasterService } from '@sunbird/shared';

@Component({
  selector: 'app-course-certificate',
  templateUrl: './course-certificate.component.html',
  styleUrls: ['./course-certificate.component.css']
})
export class CourseCertificateComponent {

  /**
   * UserData: Contains the user information
   */
  userData: any;
  /**
   * courseData: Contains the course information
   */
  @Input() courseData: any;

  /**
   *
   * @param userService UserService instance
   * @param courseCertificateService CourseCertificateService instance
   * @param toasterService ToasterService instance
   */
  constructor(userService: UserService, public courseCertificateService: CourseCertificateService,
    public toasterService: ToasterService) {
    this.userData = userService.userProfile;
   }

  /**
   * This function is use to download certificate
   * TODO: Call the download certificate api and open the url in new tab.
   */
  download = () => {
    let fileUrl = this.courseCertificateService.certificateUrl;
    if (!fileUrl) {
      this.courseCertificateService.download(this.userData, this.courseData).subscribe((response) => {
        if (response && response.responseCode === 'OK') {
          fileUrl = response.result && response.result.fileUrl;
          this.courseCertificateService.certificateUrl = fileUrl;
          const popup = window.open('', '_blank');
          popup.document.write('loading ...');
          popup.location.href = fileUrl;
        } else {
          this.toasterService.error('Unable to download file, Please try again later...');
        }
      }, (err) => {
        console.log('err', err);
        this.toasterService.error('Unable to download file, Please try again later...');
      });
    } else {
      const popup = window.open('', '_blank');
      popup.document.write('loading ...');
      popup.location.href = fileUrl;
    }
  }
}
