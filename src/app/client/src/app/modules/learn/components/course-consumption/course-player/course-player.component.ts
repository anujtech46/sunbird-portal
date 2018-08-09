import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { ContentService, UserService, BreadcrumbsService, PaymentService, PermissionService
} from '@sunbird/core';
import { Observable } from 'rxjs/Observable';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import * as _ from 'lodash';
import {
  WindowScrollService, RouterNavigationService, ILoaderMessage, PlayerConfig, ConfigService,
  ICollectionTreeOptions, NavigationHelperService, ToasterService, ResourceService
} from '@sunbird/shared';
import { Subscription } from 'rxjs/Subscription';
import { CourseConsumptionService, CourseBatchService, JuliaNoteBookService, CourseProgressService, CoursePriceService 
} from './../../../services';
import { PopupEditorComponent, NoteCardComponent, INoteData } from '@sunbird/notes';
import { IInteractEventInput, IImpressionEventInput, IEndEventInput,
  IStartEventInput,  IInteractEventObject, IInteractEventEdata } from '@sunbird/telemetry';
import 'rxjs/add/operator/takeUntil';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'app-course-player',
  templateUrl: './course-player.component.html',
  styleUrls: ['./course-player.component.css']
})
export class CoursePlayerComponent implements OnInit, OnDestroy, AfterViewInit {

  public courseInteractObject: IInteractEventObject;

  public contentInteractObject: IInteractEventObject;

  public closeContentIntractEdata: IInteractEventEdata;

  private activatedRoute: ActivatedRoute;

  private courseId: string;

  public batchId: string;

  public enrolledCourse = false;

  public contentId: string;

  public courseStatus: string;

  private contentService: ContentService;

  public flaggedCourse = false;

  public collectionTreeNodes: any;

  public contentTitle: string;

  public playerConfig: any;

  private windowScrollService: WindowScrollService;

  private router: Router;

  public loader: Boolean = true;

  showError = false;

  private activatedRouteSubscription: Subscription;

  enableContentPlayer = false;

  courseHierarchy: any;

  readMore = false;

  createNoteData: INoteData;

  curriculum = [];

  getConfigByContentSubscription: Subscription;

  queryParamSubscription: Subscription;

  updateContentsStateSubscription: Subscription;
  /**
   * To show/hide the note popup editor
   */
  showNoteEditor = false;

  /**
	 * telemetryImpression object for course TOC page
	*/
  telemetryCourseImpression: IImpressionEventInput;

  /**
	 * telemetryImpression object for content played from within a course
	*/
  telemetryContentImpression: IImpressionEventInput;
  /**
   * telemetry course end event
   */
  telemetryCourseEndEvent: IEndEventInput;


  telemetryCourseStart: IStartEventInput;

  contentIds = [];

  contentStatus: any;

  contentDetails = [];

  enrolledBatchInfo: any;

  treeModel: any;

  nextPlaylistItem: any;

  prevPlaylistItem: any;

  noContentToPlay = 'No content to play';

  public loaderMessage: ILoaderMessage = {
    headerMessage: 'Please wait...',
    loaderMessage: 'Fetching content details!'
  };

  progress: number;
  public showOpenNoteBookModal = false;
  juliaBoxPingIntervalTime: any;

  /**
   * Time interval of pulling status
   */
  statePullingClearTimeInterval: any;
  statePullingTimeInterval = 4000;
  externalContentData: any;
  productData: any;
  orderData: any;

  /**
   * This variable is use for note book ping
   */
  private warnShown = false;

  public collectionTreeOptions: ICollectionTreeOptions;

  public unsubscribe = new Subject<void>();

  constructor(contentService: ContentService, activatedRoute: ActivatedRoute, private configService: ConfigService,
    private courseConsumptionService: CourseConsumptionService, windowScrollService: WindowScrollService,
    router: Router, public navigationHelperService: NavigationHelperService, private userService: UserService,
    private toasterService: ToasterService, private resourceService: ResourceService, public breadcrumbsService: BreadcrumbsService,
    private cdr: ChangeDetectorRef, public courseBatchService: CourseBatchService, public permissionService: PermissionService,
    public juliaNoteBookService: JuliaNoteBookService,
    public courseProgressService: CourseProgressService, public coursePriceService: CoursePriceService,
    public paymentService: PaymentService) {
    this.contentService = contentService;
    this.activatedRoute = activatedRoute;
    this.windowScrollService = windowScrollService;
    this.router = router;
    this.router.onSameUrlNavigation = 'ignore';
    (<any>window).open_notebook = this.open_notebook.bind(this);
    this.collectionTreeOptions = this.configService.appConfig.collectionTreeOptions;
  }
  ngOnInit() {
    this.activatedRouteSubscription = this.activatedRoute.params.first()
      .flatMap((params) => {
        this.courseId = params.courseId;
        this.batchId = params.batchId;
        this.courseStatus = params.courseStatus;
        this.setTelemetryCourseImpression();
        if (this.batchId) {
          return Observable.combineLatest(
            this.courseConsumptionService.getCourseHierarchy(params.courseId),
            this.courseBatchService.getEnrolledBatchDetails(this.batchId),
            (courseHierarchy, enrolledBatchDetails) => {
              return { courseHierarchy, enrolledBatchDetails };
            });
        } else {
          return this.courseConsumptionService.getCourseHierarchy(params.courseId).map((courseHierarchy) => {
            return { courseHierarchy };
          });
        }
      }).subscribe((response: any) => {
        this.courseHierarchy = response.courseHierarchy;
        this.courseInteractObject = {
          id: this.courseHierarchy.identifier,
          type: 'Course',
          ver: this.courseHierarchy.pkgVersion ? this.courseHierarchy.pkgVersion.toString() : '1.0'
        };
        if (this.courseHierarchy.status === 'Flagged') {
          this.flaggedCourse = true;
        }
        if (this.batchId) {
          this.enrolledBatchInfo = response.enrolledBatchDetails;
          this.enrolledCourse = true;
          this.setTelemetryStartEndData();
          this.parseChildContent();
          this.getPriceDetail();
          if (this.enrolledBatchInfo.status > 0 && this.contentIds.length > 0) {
            this.getContentState();
            this.subscribeToQueryParam();
          }
        } else if (this.courseStatus === 'Unlisted' || this.permissionService.checkRolesPermissions(['COURSE_MENTOR', 'CONTENT_REVIEWER'])
        || this.courseHierarchy.createdBy === this.userService.userid) {
          this.parseChildContent();
          this.subscribeToQueryParam();
        } else {
          this.parseChildContent();
        }
        this.collectionTreeNodes = { data: this.courseHierarchy };
        this.loader = false;
      }, (error) => {
        this.loader = false;
        this.toasterService.error(this.resourceService.messages.emsg.m0005); // need to change message
      });
  }
  private parseChildContent() {
    const model = new TreeModel();
    const mimeTypeCount = {};
    this.treeModel = model.parse(this.courseHierarchy);
    this.treeModel.walk((node) => {
      if (node.model.mimeType !== 'application/vnd.ekstep.content-collection') {
        if (mimeTypeCount[node.model.mimeType]) {
          mimeTypeCount[node.model.mimeType] += 1;
        } else {
          mimeTypeCount[node.model.mimeType] = 1;
        }
        this.contentDetails.push({ id: node.model.identifier, title: node.model.name });
        this.contentIds.push(node.model.identifier);
      }
    });
    _.forEach(mimeTypeCount, (value, key) => {
      this.curriculum.push({ mimeType: key, count: value });
    });
  }
  private getContentState() {
    const req = {
      userId: this.userService.userid,
      courseId: this.courseId,
      contentIds: this.contentIds,
      batchId: this.batchId
    };
    this.courseConsumptionService.getContentState(req, true)
    // .takeUntil(this.unsubscribe)
    .subscribe((res) => {
      this.contentStatus = res.content;
    }, (err) => {
      console.log(err, 'content read api failed');
    });
  }
  private subscribeToQueryParam() {
    this.queryParamSubscription = this.activatedRoute.queryParams.subscribe((queryParams) => {
      if (queryParams.contentId) {
        const content = this.findContentById(queryParams.contentId);
        if (content) {
          this.OnPlayContent({ title: _.get(content, 'model.name'), id: _.get(content, 'model.identifier') });
        } else {
          this.toasterService.error(this.resourceService.messages.emsg.m0005); // need to change message
          this.closeContentPlayer();
        }
      } else {
        this.closeContentPlayer();
      }
    });
  }
  private findContentById(id: string) {
    return this.treeModel.first((node) => {
      return node.model.identifier === id;
    });
  }
  private OnPlayContent(content: { title: string, id: string }) {
    if (content && content.id && ((this.enrolledCourse && !this.flaggedCourse &&
      this.enrolledBatchInfo.status > 0) || this.courseStatus === 'Unlisted'
      || this.permissionService.checkRolesPermissions(['COURSE_MENTOR', 'CONTENT_REVIEWER'])
      || this.courseHierarchy.createdBy === this.userService.userid)) {
      this.contentId = content.id;
      this.setTelemetryContentImpression();
      this.setContentNavigators();
      this.playContent(content);
    } else {
      console.log('content not playable');
    }
  }
  private setContentNavigators() {
    const index = _.findIndex(this.contentDetails, ['id', this.contentId]);
    this.prevPlaylistItem = this.contentDetails[index - 1];
    this.nextPlaylistItem = this.contentDetails[index + 1];
  }
  private playContent(data: any): void {
    this.enableContentPlayer = false;
    this.loader = true;
    const options: any = { courseId: this.courseId };
    if (this.batchId) {
      options.batchHashTagId = this.enrolledBatchInfo.hashTagId;
    }
    this.getConfigByContentSubscription = this.courseConsumptionService.getConfigByContent(data.id, options)
      .subscribe((config) => {
        this.setContentInteractData(config);
        this.loader = false;
        this.playerConfig = config;
        this.enableContentPlayer = true;
        this.contentTitle = data.title;
        this.breadcrumbsService.setBreadcrumbs([{ label: this.contentTitle, url: '' }]);
        this.windowScrollService.smoothScroll('app-player-collection-renderer', 500);
      }, (err) => {
        this.loader = false;
        this.toasterService.error(this.resourceService.messages.stmsg.m0009);
      });
  }
  public navigateToContent(content: { title: string, id: string }): void {
    const navigationExtras: NavigationExtras = {
      queryParams: { 'contentId': content.id },
      relativeTo: this.activatedRoute
    };
    if ((this.batchId && !this.flaggedCourse && this.enrolledBatchInfo.status > 0)
      || this.courseStatus === 'Unlisted' || this.permissionService.checkRolesPermissions(['COURSE_MENTOR', 'CONTENT_REVIEWER'])
      || this.courseHierarchy.createdBy === this.userService.userid) {
      this.router.navigate([], navigationExtras);
    }
  }
  public contentProgressEvent(event) {
    if (this.batchId && this.enrolledBatchInfo && this.enrolledBatchInfo.status === 1) {
      const eid = event.detail.telemetryData.eid;
      const request: any = {
        userId: this.userService.userid,
        contentId: this.contentId,
        courseId: this.courseId,
        batchId: this.batchId,
        status: eid === 'END' ? 2 : 1
      };
      if (this.playerConfig.metadata.mimeType !== 'application/vnd.ekstep.html-archive') {
        console.log('Update course progress for content', request);
        this.updateContentsStateSubscription = this.courseConsumptionService.updateContentsState(request).subscribe((updatedRes) => {
          this.contentStatus = updatedRes.content;
        }, (err) => {
          console.log('updating content status failed', err);
        });
      }
    }
  }
  public closeContentPlayer() {
    this.cdr.detectChanges();
    if (this.enableContentPlayer === true) {
      const navigationExtras: NavigationExtras = {
        relativeTo: this.activatedRoute
      };
      this.enableContentPlayer = false;
      this.router.navigate([], navigationExtras);
      this.startPullingContentStatus();
    }
  }

  /**
   * This function is use to start pulling content status
   */
  startPullingContentStatus = () => {
    console.log('Start pulling status, if course is not completed', this.courseHierarchy.progress);
    if (this.progress !== 100 && !this.statePullingClearTimeInterval) {
      this.statePullingClearTimeInterval = setInterval(() => {
        console.log('Time', Date.now());
        this.getContentState();
      }, this.statePullingTimeInterval);
    }
  }

  /**
   * This function is use to stop pulling content status
   */
  stopPullingContentStatus = () => {
    console.log('Stop pulling status', this.statePullingClearTimeInterval);
    clearTimeout(this.statePullingClearTimeInterval);
  }

  public createEventEmitter(data) {
    this.createNoteData = data;
  }
  ngOnDestroy() {
    if (this.activatedRouteSubscription) {
      this.activatedRouteSubscription.unsubscribe();
    }
    if (this.getConfigByContentSubscription) {
      this.getConfigByContentSubscription.unsubscribe();
    }
    if (this.queryParamSubscription) {
      this.queryParamSubscription.unsubscribe();
    }
    if (this.updateContentsStateSubscription) {
      this.updateContentsStateSubscription.unsubscribe();
    }

    if (this.statePullingClearTimeInterval) {
      this.stopPullingContentStatus();
    }
    window.open_noteBook = null;
  }

  ngAfterViewInit() {
    this.courseProgressService.courseProgressData.subscribe((courseProgressData) => {
      this.enrolledCourse = true;
      this.progress = courseProgressData.progress ? Math.round(courseProgressData.progress) :
        this.progress;
    });
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
  private setTelemetryStartEndData() {
    this.telemetryCourseStart = {
      context: {
        env: this.activatedRoute.snapshot.data.telemetry.env
      },
      object: {
        id: this.courseId,
        type: this.activatedRoute.snapshot.data.telemetry.object.type,
        ver: this.activatedRoute.snapshot.data.telemetry.object.ver,
      },
      edata: {
        type: this.activatedRoute.snapshot.data.telemetry.type,
        pageid: this.activatedRoute.snapshot.data.telemetry.pageid,
        mode: 'play'
      }
    };
    this.telemetryCourseEndEvent = {
      object: {
        id: this.courseId,
        type: this.activatedRoute.snapshot.data.telemetry.object.type,
        ver: this.activatedRoute.snapshot.data.telemetry.object.ver
      },
      context: {
        env: this.activatedRoute.snapshot.data.telemetry.env
      },
      edata: {
        type: this.activatedRoute.snapshot.data.telemetry.type,
        pageid: this.activatedRoute.snapshot.data.telemetry.pageid,
        mode: 'play'
      }
    };
  }
  private setTelemetryCourseImpression() {
    this.telemetryCourseImpression = {
      context: {
        env: this.activatedRoute.snapshot.data.telemetry.env
      },
      edata: {
        type: this.activatedRoute.snapshot.data.telemetry.type,
        pageid: this.activatedRoute.snapshot.data.telemetry.pageid,
        uri: this.router.url,
      },
      object: {
        id: this.courseId,
        type: 'course',
        ver: '1.0'
      }
    };
  }
  private setTelemetryContentImpression() {
    this.telemetryContentImpression = {
      context: {
        env: this.activatedRoute.snapshot.data.telemetry.env
      },
      edata: {
        type: this.activatedRoute.snapshot.data.telemetry.type,
        pageid: this.activatedRoute.snapshot.data.telemetry.pageid,
        uri: this.router.url,
      },
      object: {
        id: this.contentId,
        type: 'content',
        ver: '1.0',
        rollup: {
          l1: this.courseId,
          l2: this.contentId
        }
      }
    };
  }
  private setContentInteractData(config) {
    this.contentInteractObject = {
      id: config.metadata.identifier,
      type: config.metadata.contentType || config.metadata.resourceType || 'content',
      ver: config.metadata.pkgVersion ? config.metadata.pkgVersion.toString() : '1.0',
      rollup: { l1: this.courseId }
    };
    this.closeContentIntractEdata = {
      id: 'content-close',
      type: 'click',
      pageid: 'course-consumption'
    };
  }

  /**
   * This function help to get the detail to load content
   */
  loadCourseDetails () {
    const courseDetailsStr = '?courseId=' + this.courseId + '&contentId=' + this.contentId +
                             '&batchId=' + this.batchId + '&uid=' + this.userService.userid;
    return courseDetailsStr;
  }

  /**
   * This function is use to open note book in new tab
   */
  open_notebook = (url) => {
    // TODO: ssoPing should be renamed to doSSO or ssoJuliaBox or something like that
    // TODO: this method is required to be invoked only the very first time. It is not required all the time
    // TODO: We should clear ping happening through startJuliaNoteBookPing OR should not
    // call startJuliaNoteBookPing every time this is called
    // TODO: Show a loaded screen till the time window.open is called
    (<any>$('#openNoteBookModal')).modal('show');
    this.juliaNoteBookService.ssoJuliaBox({}).subscribe((r) => {
      const newUrl = url + this.loadCourseDetails();
      console.log('SSO successful :: Opening notebook :: ', newUrl);
      this.checkNotebookStatus(newUrl);
    }, (err) => {
      (<any>$('#openNoteBookModal')).modal('hide');
      this.toasterService.error('Loading notebook failed, Please try again later...');
      console.log('Failed to load notebook :: ', JSON.stringify(err));
    });
  }

/**
 * This function is use to start ping
 */
  public startJuliaNoteBookPing = () => {
    this.juliaBoxPingIntervalTime = setInterval(() => {
      this.juliaNoteBookService.getPing().subscribe((r) => {
        console.log('Ping received by server');
        const activeTime = Math.floor(Date.now() / 1000) - r['create_time'];
        const timeout = r['timeout'];
        if (activeTime > timeout - 60) {
          $('#jupyter-frame').remove();
          this.toasterService.error('Your session on notebooks has timed out. Please close notebook tab(s) ' +
            'and relanch the same.');
        } else if (activeTime > timeout - 900 && !this.warnShown) {
          this.toasterService.error('You have 15 minutes left on your notebook session. Please save your ' +
            'open notebooks to avoid losing data.');
            this.warnShown = true;
        }
      }, (err) => {
        console.log('Ping failed', JSON.stringify(err));
      });
    }, 60000);
  }

  /**
   * Get price detail
   */
  private getPriceDetail() {
    const request: any = {
      filters: {
        courseid: this.courseId,
        batchid: this.batchId
      }
    };
    this.coursePriceService.searchPrice(request).subscribe((response) => {
      if (response && response.responseCode === 'OK') {
        this.productData = response.result.response.content[0];

      } else {
        this.toasterService.error('Unable to get course price, Please try again later');
      }
    }, (err) => {
      console.log('err', err);
    });
  }

  /**
   * Open notebook
   * @param url : string
   */
  private openNoteBook(url) {
    const windowPopup = window.open(url);
    if (!windowPopup) {
      const domain = url.split('//')[1] && url.split('//')[1].split('/')[0];
      this.toasterService.impInfo('Unable to open a new tab. Please enable popups for domain ' + domain);
    }
    (<any>$('#openNoteBookModal')).modal('hide');
    if (!this.juliaBoxPingIntervalTime) {
      this.startJuliaNoteBookPing();
    }
  }

  /**
   * Check notebook status: Notebook copied or not
   * @param url : string
   * @param noteBookStatusCount : number
   */
  private checkNotebookStatus(url: string, noteBookStatusCount: number = 1) {
    this.juliaNoteBookService.checkNoteBookStatus(url).subscribe((response) => {
      if (response && response.responseCode === 'OK') {
        this.openNoteBook(url);
      }
    }, (err) => {
      if (err.error && err.error.responseCode === 'RESOURCE_NOT_FOUND') {
        console.log('Getting 404 :: checkNotebookStatus ::', noteBookStatusCount);
        if (noteBookStatusCount <= 10) {
          setTimeout(() => {
            this.checkNotebookStatus(url, noteBookStatusCount + 1);
          }, 1000);
        } else {
          (<any>$('#openNoteBookModal')).modal('hide');
          this.toasterService.error('Loading notebook failed, Please try again later...');
        }
      } else {
        (<any>$('#openNoteBookModal')).modal('hide');
        this.toasterService.error('Loading notebook failed, Please try again later...');
      }
    });
  }
}
