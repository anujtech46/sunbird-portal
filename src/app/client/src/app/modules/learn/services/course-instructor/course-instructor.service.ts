import { Injectable } from '@angular/core';
import { DataService } from '@sunbird/core';
import { ConfigService } from '@sunbird/shared';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class CourseInstructorService extends DataService {

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
  /**
   * Constructor - default method of CourseInstructorService class
   *
   * @param {ConfigService} config ConfigService reference
   * @param {HttpClient} http HttpClient reference
   */
  constructor(config: ConfigService, http: HttpClient) {
    super(http);
    this.config = config;
    this.baseUrl = this.config.urlConFig.URLS.INSTRUCTOR_PREFIX;
  }

  createInstructor(data: any) {
    const option = {
      url: this.config.urlConFig.URLS.INSTRUCTOR.CREATE,
      data: {
        'request': data
      }
    };
    return this.post(option);
  }

  updateInstructor(data) {
    const option = {
      url: this.config.urlConFig.URLS.INSTRUCTOR.UPDATE,
      data: {
        'request': data
      }
    };
    return this.patch(option);
  }

  readInstructor(instructorId) {
    const option = {
      url: this.config.urlConFig.URLS.INSTRUCTOR.READ + '/' + instructorId,
    };
    return this.get(option);
  }
}
