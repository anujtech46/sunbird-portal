
import {combineLatest as observableCombineLatest,  Subscription ,  Observable ,  Subject } from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import { PageApiService, CoursesService, ICourses, ISort, PlayerService } from '@sunbird/core';
import { Component, OnInit } from '@angular/core';
import {
  ResourceService, ServerResponse, ToasterService, ICaraouselData, ConfigService,
  UtilService, INoResultMessage
} from '@sunbird/shared';
import * as _ from 'lodash';
import { Router, ActivatedRoute } from '@angular/router';
import { IImpressionEventInput } from '@sunbird/telemetry';

@Component({
  selector: 'app-landing-page',
  templateUrl: './500k-landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {

 telemetryImpression: IImpressionEventInput;

 /**
  * To show toaster(error, success etc) after any API calls
  */
 private toasterService: ToasterService;
 /**
  * To call resource service which helps to use language constant
  */
 public resourceService: ResourceService;

 /**
 * To call get course data.
 */
 pageSectionService: PageApiService;
 /**
  * To get enrolled courses details.
  */
 coursesService: CoursesService;
 /**
 * Contains result object returned from enrolled course API.
 */
 enrolledCourses: Array<ICourses>;
 /**
  * This variable hepls to show and hide page loader.
  * It is kept true by default as at first when we comes
  * to a page the loader should be displayed before showing
  * any data
  */
 showLoader = true;
 /**
  * no result  message
 */
 noResultMessage: INoResultMessage;
 /**
   * To show / hide no result message when no result found
  */
 noResult = false;
 /**
* Contains config service reference
*/
 public configService: ConfigService;
 /**
 * Contains result object returned from getPageData API.
 */
 caraouselData: Array<ICaraouselData> = [];
 private router: Router;
 public filterType: string;
 public redirectUrl: string;
 public filters: any;
 public queryParams: any = {};
 sortingOptions: Array<ISort>;
 content: any;
 public unsubscribe = new Subject<void>();
 courseDataSubscription: Subscription;
 /**
  * Constructor to create injected service(s) object
  * @param {ResourceService} resourceService Reference of ResourceService
  * @param {ToasterService} toasterService Reference of ToasterService
  * @param {PageApiService} pageSectionService Reference of pageSectionService.
  * @param {CoursesService} courseService  Reference of courseService.
  */
 constructor(pageSectionService: PageApiService, coursesService: CoursesService,
   toasterService: ToasterService, resourceService: ResourceService, router: Router, private playerService: PlayerService,
   private activatedRoute: ActivatedRoute, configService: ConfigService, public utilService: UtilService) {
   this.pageSectionService = pageSectionService;
   this.coursesService = coursesService;
   this.toasterService = toasterService;
   this.resourceService = resourceService;
   this.configService = configService;
   this.router = router;
   this.router.onSameUrlNavigation = 'reload';
   this.sortingOptions = this.configService.dropDownConfig.FILTER.RESOURCES.sortingOptions;
 }

  ngOnInit() {
    this.populatePageData();
  }

  populatePageData() {
    this.noResult = false;
    const option = {
      source: 'web',
      name: 'Course',
      filters: _.pickBy(this.filters, value => value.length > 0),
      sort_by: { [this.queryParams.sort_by]: this.queryParams.sortType }
    };
    this.pageSectionService.getPageData(option).pipe(
    takeUntil(this.unsubscribe))
    .subscribe(
      (apiResponse) => {
        this.noResultMessage = {
          'message': this.resourceService.messages.stmsg.m0007,
          'messageText': this.resourceService.messages.stmsg.m0006
        };
        let noResultCounter = 0;
        if (apiResponse && apiResponse.sections) {
          this.showLoader = false;
          const sections = this.processActionObject(apiResponse.sections);
          this.caraouselData = this.caraouselData.concat(sections);
          if (this.caraouselData.length > 0) {
            _.forIn(this.caraouselData, (value, key) => {
              if (this.caraouselData[key].contents === null || this.caraouselData[key].contents === undefined
                || (this.caraouselData[key].name && this.caraouselData[key].name === 'My Courses')) {
                noResultCounter++;
              }
            });
          }
          if (noResultCounter === this.caraouselData.length) {
            this.noResult = true;
          }
        } else {
          this.noResult = true;
          this.showLoader = false;
        }

      },
      err => {
        this.noResult = true;
        this.noResultMessage = {
          'message': this.resourceService.messages.stmsg.m0007,
          'messageText': this.resourceService.messages.stmsg.m0006
        };
        this.showLoader = false;
        this.toasterService.error(this.resourceService.messages.fmsg.m0002);
      }
    );
  }

    /**
   * This method process the action object.
   */
  processActionObject(sections) {
    _.forEach(sections, (value, index) => {
      sections[index].pageType = 'landingPage';
      _.forEach(sections[index].contents, (value2, index2) => {
          const constantData = this.configService.appConfig.Course.otherCourse.constantData;
          const metaData = this.configService.appConfig.Course.otherCourse.metaData;
          const dynamicFields = {};
          sections[index].contents[index2] = this.utilService.processContent(sections[index].contents[index2],
            constantData, dynamicFields, metaData);
      });
    });
    return sections;
  }

  playContent(event) {
    window.location.href = '/learn/course/' + event.data.metaData.identifier;
  }

}
