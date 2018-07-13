import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { PlayerService, CollectionHierarchyAPI, ContentService, UserService, BreadcrumbsService, PaymentService } from '@sunbird/core';
import { Observable } from 'rxjs/Observable';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import * as _ from 'lodash';
import {
  WindowScrollService, RouterNavigationService, ILoaderMessage, PlayerConfig,
  ICollectionTreeOptions, NavigationHelperService, ToasterService, ResourceService
} from '@sunbird/shared';
import { Subscription } from 'rxjs/Subscription';
import { CourseConsumptionService, JuliaNoteBookService, CourseProgressService, CoursePriceService } from './../../../services';
import { PopupEditorComponent, NoteCardComponent, INoteData } from '@sunbird/notes';
import { IInteractEventInput, IImpressionEventInput, IEndEventInput,
  IStartEventInput,  IInteractEventObject, IInteractEventEdata } from '@sunbird/telemetry';

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

  public collectionTitle: string;

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
	 * telemetry object version
	*/
  telemetryObjectVer = '1.0';

  /**
	 * common telemetry data for this component
  */
  telemetryData = { env: 'course', pageid: 'course-read', type: 'view' };

  /**
   * telemetry course end event
   */
  telemetryCourseEndEvent: IEndEventInput;


  telemetryCourseStart: IStartEventInput;

  contentIds = [];
  contentStatus: any;
  contentDetails = [];

  treeModel: any;
  nextPlaylistItem: any;
  prevPlaylistItem: any;
  noContentToPlay = 'No content to play';
  public loaderMessage: ILoaderMessage = {
    headerMessage: 'Please wait...',
    loaderMessage: 'Fetching content details!'
  };

  progress: number;

  /**
   * Time interval of pulling status
   */
  statePullingClearTimeInterval: any;
  statePullingTimeInterval = 4000;

  public collectionTreeOptions: ICollectionTreeOptions = {
    fileIcon: 'fa fa-file-o fa-lg',
    customFileIcon: {
      'video': 'fa fa-file-video-o fa-lg',
      'pdf': 'fa fa-file-pdf-o fa-lg',
      'youtube': 'fa fa-youtube fa-lg fancy_tree_red',
      'H5P': 'fa fa-html5 fa-lg',
      'audio': 'fa fa-file-audio-o fa-lg',
      'ECML': 'fa fa-file-code-o fa-lg',
      'HTML': 'fa fa-html5 fa-lg',
      'collection': 'fa fa-file-archive-o fa-lg',
      'epub': 'fa fa-file-text fa-lg',
      'doc': 'fa fa-file-text fa-lg'
    }
  };

  externalContentData: any;
  productData: any;
  orderData: any;

  /**
   * This variable is use for note book ping
   */
  private warnShown = false;

  constructor(contentService: ContentService, activatedRoute: ActivatedRoute,
    private courseConsumptionService: CourseConsumptionService, windowScrollService: WindowScrollService,
    router: Router, public navigationHelperService: NavigationHelperService, private userService: UserService,
    private toasterService: ToasterService, private resourceService: ResourceService, public breadcrumbsService: BreadcrumbsService,
    private  cdr: ChangeDetectorRef, public juliaNoteBookService: JuliaNoteBookService,
    public courseProgressService: CourseProgressService, public coursePriceService: CoursePriceService,
    public paymentService: PaymentService) {
    this.contentService = contentService;
    this.activatedRoute = activatedRoute;
    this.windowScrollService = windowScrollService;
    this.router = router;
    this.router.onSameUrlNavigation = 'ignore';
    (<any>window).open_notebook = this.open_notebook.bind(this);
  }
  ngOnInit() {
    this.activatedRouteSubscription = this.activatedRoute.params.first()
      .flatMap((params) => {
        this.courseId = params.courseId;
        this.batchId = params.batchId;
        this.courseStatus = params.courseStatus;
        // Create the telemetry impression event for course toc page
        this.telemetryCourseImpression = {
          context: {
            env: this.telemetryData.env
          },
          edata: {
            type: this.telemetryData.type,
            pageid: this.telemetryData.pageid,
            uri: '/learn/course/' + this.courseId
          },
          object: {
            id: this.courseId,
            type: 'course',
            ver: this.telemetryObjectVer
          }
        };
        return this.courseConsumptionService.getCourseHierarchy(params.courseId);
      }).subscribe((response) => {
        this.courseHierarchy = response;
        this.courseInteractObject = {
          id: this.courseHierarchy.identifier,
          type: 'Course',
          ver: this.courseHierarchy.pkgVersion ? this.courseHierarchy.pkgVersion.toString() : '1.0'
        };
        if (this.courseHierarchy.status === 'Flagged') {
          this.flaggedCourse = true;
        }
        if (this.batchId) {
          this.telemetryCourseImpression.edata.uri = '/learn/course/' + this.courseId + '/batch/' + this.batchId;
          this.enrolledCourse = true;
          this.setTelemetryStartEndData();
          this.getPriceDetail();
          this.parseChildContent(response);
          this.fetchContentStatus(response);
          this.subscribeToQueryParam(response);

        } else if (this.courseStatus === 'Unlisted') {
          this.telemetryCourseImpression.edata.uri = '/learn/course/' + this.courseId + '/unlisted';
          this.parseChildContent(response);
          this.subscribeToQueryParam(response);
        } else {
          this.parseChildContent(response);
        }
        this.collectionTreeNodes = { data: response };
        this.loader = false;
      }, (error) => {
        this.loader = false;
        this.toasterService.error(this.resourceService.messages.emsg.m0005); // need to change message
      });

  }
  public playContent(data: any): void {
    this.enableContentPlayer = false;
    this.loader = true;
    this.getConfigByContentSubscription = this.courseConsumptionService.getConfigByContent(data.id).subscribe((config) => {
      this.contentInteractObject = {
        id: config.metadata.identifier,
        type: config.metadata.contentType || config.metadata.resourceType || 'content',
        ver: config.metadata.pkgVersion ? config.metadata.pkgVersion.toString() : '1.0',
        rollup: {l1: this.courseId}
        // rollup: this.courseInteractObject
      };
      this.closeContentIntractEdata = {
        id: 'content-close',
        type: 'click',
        pageid: 'course-consumption'
      };
      this.loader = false;
      this.playerConfig = config;
      this.externalContentData = {
        batchId: this.batchId,
        courseId: this.courseId,
        contentId: this.contentId,
        userId: this.userService.userid
      };
      this.enableContentPlayer = true;
      this.contentTitle = data.title;
      this.breadcrumbsService.setBreadcrumbs([{ label: this.contentTitle, url: '' }]);
      this.windowScrollService.smoothScroll('app-player-collection-renderer', 500);
    }, (err) => {
      this.loader = false;
      this.toasterService.error(this.resourceService.messages.stmsg.m0009);
    });
  }

  private navigateToContent(content: { title: string, id: string }): void {
    const navigationExtras: NavigationExtras = {
      queryParams: { 'contentId': content.id },
      relativeTo: this.activatedRoute
    };
    if ((this.batchId && !this.flaggedCourse) || this.courseStatus === 'Unlisted') {
      this.router.navigate([], navigationExtras);
    }
  }

  private findContentById(id: string) {
    return this.treeModel.first((node) => {
      return node.model.identifier === id;
    });
  }

  public OnPlayContent(content: { title: string, id: string }) {
    if (content && content.id && ((this.enrolledCourse && !this.flaggedCourse) || this.courseStatus === 'Unlisted')) {
      this.contentId = content.id;
      this.setContentNavigators();
      this.playContent(content);
    } else {
    }
  }
  setContentNavigators() {
    const index = _.findIndex(this.contentDetails, ['id', this.contentId]);
    this.prevPlaylistItem = this.contentDetails[index - 1];
    this.nextPlaylistItem = this.contentDetails[index + 1];
  }

  subscribeToQueryParam(data) {
    this.queryParamSubscription = this.activatedRoute.queryParams.subscribe((queryParams) => {
      if (queryParams.contentId) {
        const content = this.findContentById(queryParams.contentId);
        if (content) {

          // Create the telemetry impression event for content player page
          this.telemetryContentImpression = {
            context: {
              env: this.telemetryData.env
            },
            edata: {
              type: this.telemetryData.type,
              pageid: this.telemetryData.pageid,
              uri: '/learn/course/' + this.courseId + '/batch/' + this.batchId + '?contentId=' + queryParams.contentId
            },
            object: {
              id: queryParams.contentId,
              type: 'content',
              ver: this.telemetryObjectVer,
              rollup: {
                l1: this.courseId,
                l2: queryParams.contentId
              }
            }
          };
          this.OnPlayContent({ title: _.get(content, 'model.name'), id: _.get(content, 'model.identifier') });
        } else {
          this.toasterService.error(this.resourceService.messages.emsg.m0005); // need to change message
        }
      } else {
        this.closeContentPlayer();
      }
    });
  }
  parseChildContent(tree) {
    const model = new TreeModel();
    const mimeTypeCount = {};
    this.treeModel = model.parse(tree);
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
  fetchContentStatus(data) {
    const req = {
      userId: this.userService.userid,
      courseId: this.courseId,
      contentIds: this.contentIds,
      batchId: this.batchId
    };
    this.courseConsumptionService.getContentStatus(req).subscribe((res) => {
      this.contentStatus = res.content;
    }, (err) => {
    });
  }
  public contentProgressEventnew(event) {
    if (this.batchId) {
      const eid = event.detail.telemetryData.eid;
      const request: any = {
        userId: this.userService.userid,
        contentId: this.contentId,
        courseId: this.courseId,
        batchId: this.batchId,
        status: eid === 'END' ? 2 : 1
      };
      this.updateContentsStateSubscription = this.courseConsumptionService.updateContentsState(request).subscribe((updatedRes) => {
        this.contentStatus = updatedRes.content;
      });
    }
  }

  closeContentPlayer() {

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
    if (this.progress !== 100) {
      this.statePullingClearTimeInterval = setInterval(() => {
        console.log('Time', Date.now());
        this.fetchContentStatus({});
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

  createEventEmitter(data) {
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
  }

  setTelemetryStartEndData() {
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
        pageid:  this.activatedRoute.snapshot.data.telemetry.pageid,
        mode:  'play'
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

  /**
   * This function help to get the detail to load content
   */
  loadCourseDetails () {
    const uid = this.externalContentData.userId;
    const contentId = this.externalContentData.contentId;
    const courseId = this.externalContentData.courseId;
    const batchId = this.externalContentData.batchId;
    const courseDetailsStr = '?courseId=' + courseId + '&contentId=' + contentId +
                             '&batchId=' + batchId + '&uid=' + uid;
    return courseDetailsStr;
  }

  /**
   * This function is use to open note book in new tab
   */
  open_notebook = (url) => {
    // TODO: ssoPing should be renamed to doSSO or ssoJuliaBox or something like that
    // TODO: this method is required to be invoked only the very first time. It is not required all the time
    // TODO: We should clear ping happening through startJuliaNoteBookPing OR should not call startJuliaNoteBookPing every time this is called
    // TODO: Show a loaded screen till the time window.open is called
    this.juliaNoteBookService.ssoPing({}).subscribe((r) => {
          const newUrl = url + this.loadCourseDetails();
          console.log('SSO successful :: Opening notebook :: ', newUrl);
          window.open(newUrl);
          this.startJuliaNoteBookPing();
    }, (err) => {
      console.log('Failed to load notebook :: ', JSON.stringify(err));
    });
  }

/**
 * This function is use to start ping
 */
  public startJuliaNoteBookPing = () => {
    setInterval(() => {
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

  private getOrderDetail() {
    const request = {
      productId: this.productData.priceId,
      userId: this.userService.userid
    };
    this.paymentService.paymentStatus(request).subscribe((response) => {
      if (response && response.responseCode === 'OK') {
        this.orderData = response.result.response;
      } else {
        this.toasterService.error('Unable to get order detail, Please try again later');
      }
    }, (err) => {
      console.log('err', err);
    });

  }
}
