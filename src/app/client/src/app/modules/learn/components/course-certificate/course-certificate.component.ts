import { Component, OnInit, Input } from '@angular/core';
import { UserService } from '@sunbird/core';
import { CourseCertificateService } from '../../services/course-certificate/course-certificate.service';
import { ToasterService, UpdatePriceI, CoursePriceModelI } from '@sunbird/shared';

@Component({
  selector: 'app-course-certificate',
  templateUrl: './course-certificate.component.html',
  styleUrls: ['./course-certificate.component.css']
})
export class CourseCertificateComponent implements OnInit {

  userData: any;
  @Input() courseData: any;

  constructor(userService: UserService, public courseCertificateService: CourseCertificateService,
    public toasterService: ToasterService) {
    this.userData = userService.userProfile;
   }

  ngOnInit() {
  }

  getUserTitle (gender) {
    if (gender) {
      gender = gender.toLowerCase();
      return gender === 'male' ? 'Mr.' : gender === 'female' ? 'Mrs.' : '';
    } else {
      return '';
    }
  }

  firstLetterUpperCase (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  getUserFullName (userData) {
    if (userData) {
      return this.firstLetterUpperCase(this.userData.firstName) + ' ' +
          this.firstLetterUpperCase(this.userData.lastName);
    } else {
      return '';
    }
  }

  /**
   * This function is use to download certificate
   */
  download = () => {
    const request = {
      title: this.getUserTitle(this.userData && this.userData.gender),
      name: this.getUserFullName(this.userData),
      courseName: this.courseData.name,
      userId: this.userData.userId,
      courseId: this.courseData && this.courseData.identifier,
      createdDate: new Date()
    };

    this.courseCertificateService.downloadCertificate(request).subscribe((response) => {
      if (response && response.responseCode === 'OK') {
        const fileUrl = response.result && response.result.fileUrl;
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
  }

}
