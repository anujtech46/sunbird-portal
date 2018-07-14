import { Injectable } from '@angular/core';
import { DataService } from '@sunbird/core';
import { ConfigService } from '@sunbird/shared';
import { HttpClient } from '@angular/common/http';
import { ToasterService } from '../../../shared';

@Injectable()
export class CourseCertificateService extends DataService {

    /**
   * base Url for announcement api
   */
  baseUrl: string;
  /**
   * reference of config service.
   */
  public config: ConfigService;
  /**
   * reference of lerner service.
   */
  public http: HttpClient;

  private fileUrl:  string;

  /**
   * Constructor - default method of CoursePriceService class
   *
   * @param {ConfigService} config ConfigService reference
   * @param {HttpClient} http HttpClient reference
   */
  constructor(config: ConfigService, http: HttpClient, public toasterService: ToasterService) {
    super(http);
    this.config = config;
    this.baseUrl = this.config.urlConFig.URLS.CERTIFICATE_PREFIX;
  }

  /**
   * Gets certificate url
   */
  get certificateUrl() {
    return this.fileUrl;
  }

  /**
   * Sets certificate url
   */
  set certificateUrl(url) {
    this.fileUrl = url;
  }

  /**
   * Downloads certificate
   * @param data {Request data}
   * @returns observables Map
   */
  downloadCertificate(data: any) {
    const option = {
      url: this.config.urlConFig.URLS.CERTIFICATE.COURSE_CERTIFICATE,
      data: {
        'request': data
      }
    };
    return this.post(option);
  }

  /**
   * Gets user title
   * @param gender {User gender}
   * @returns {User title}
   */
  getUserTitle (gender) {
    if (gender) {
      gender = gender.toLowerCase();
      return gender === 'male' ? 'Mr.' : gender === 'female' ? 'Mrs.' : '';
    } else {
      return '';
    }
  }

  /**
   * First letter upper case
   * @param string
   * @returns string
   */
  firstLetterUpperCase (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  /**
   * Gets user full name
   * @param userData {contains user firstname lastname and gender and other information}
   * @returns string {User full name}
   */
  getUserFullName (userData) {
    if (userData) {
      return this.firstLetterUpperCase(userData.firstName) + ' ' +
          this.firstLetterUpperCase(userData.lastName);
    } else {
      return '';
    }
  }

  /**
   * This function is use to download certificate
   */
  download = (userData, courseData) => {
    const request = {
      title: this.getUserTitle(userData && userData.gender),
      name: this.getUserFullName(userData),
      courseName: courseData.name,
      userId: userData.userId,
      courseId: courseData && courseData.identifier,
      createdDate: new Date()
    };
    return this.downloadCertificate(request);
  }

}
