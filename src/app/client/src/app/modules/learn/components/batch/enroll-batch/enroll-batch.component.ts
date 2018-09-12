
import { takeUntil } from 'rxjs/operators';
import { UserService, CoursesService } from '@sunbird/core';
import { ResourceService, ToasterService, ConfigService, ServerResponse } from '@sunbird/shared';
import { CourseBatchService } from './../../../services';
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IImpressionEventInput } from '@sunbird/telemetry';
import * as _ from 'lodash';
import { Subject } from 'rxjs';

// Julia customization
import { PaymentService } from '@sunbird/core';


@Component({
  selector: 'app-enroll-batch',
  templateUrl: './enroll-batch.component.html',
  styleUrls: ['./enroll-batch.component.css']
})
export class EnrollBatchComponent implements OnInit, OnDestroy {
  @ViewChild('enrollBatch') enrollBatch;
  batchId: string;
  batchDetails: any;
  showEnrollDetails = false;
  readMore = false;
  disableSubmitBtn = true;
  public unsubscribe = new Subject<void>();
  /**
	 * telemetryImpression object for update batch page
	*/
  telemetryImpression: IImpressionEventInput;

  // julia related variables
  sdkUrl: string;
  apiKey: string;
  productId: string;
  amount: number;
  orderData: any;
  paymentId: string;
  paymentType: string;
  orderDataStatus = false;

  constructor(public router: Router, public activatedRoute: ActivatedRoute, public courseBatchService: CourseBatchService,
    public resourceService: ResourceService, public toasterService: ToasterService, public userService: UserService,
    public configService: ConfigService, public coursesService: CoursesService,
    public paymentService: PaymentService,
    ) { }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.batchId = params.batchId;

      // Create the telemetry impression event for enroll batch page
      this.telemetryImpression = {
        context: {
          env: this.activatedRoute.snapshot.data.telemetry.env
        },
        edata: {
          type: this.activatedRoute.snapshot.data.telemetry.type,
          pageid: this.activatedRoute.snapshot.data.telemetry.pageid,
          uri: '/enroll/batch/' + this.batchId
        },
        object: {
          id: this.batchId,
          type: this.activatedRoute.snapshot.data.telemetry.object.type,
          ver: this.activatedRoute.snapshot.data.telemetry.object.ver
        }
      };

      this.courseBatchService.getEnrollToBatchDetails(this.batchId).pipe(
        takeUntil(this.unsubscribe))
        .subscribe((data) => {
          this.batchDetails = data;
          if (this.batchDetails.enrollmentType !== 'open') {
            this.toasterService.error(this.resourceService.messages.fmsg.m0082);
            this.redirect();
          }
          this.fetchParticipantsDetails();
        }, (err) => {
          this.toasterService.error(this.resourceService.messages.fmsg.m0054);
          this.redirect();
        });
        this.startPayment();
    });
  }
  ngOnDestroy() {
    if (this.enrollBatch && this.enrollBatch.deny) {
      this.enrollBatch.deny();
    }
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
  redirect() {
    this.router.navigate(['./'], { relativeTo: this.activatedRoute.parent });
  }
  fetchParticipantsDetails() {
    if (!_.isUndefined(this.batchDetails.participant)) {
      const request = {
        filters: {
          identifier: _.keys(this.batchDetails.participant)
        }
      };
      this.courseBatchService.getUserList(request).pipe(
        takeUntil(this.unsubscribe))
        .subscribe((res) => {
          this.batchDetails.participantDetails = res.result.response.content;
          this.showEnrollDetails = true;
        }, (err) => {
          this.toasterService.error(this.resourceService.messages.fmsg.m0056);
          this.redirect();
        });
    } else {
      this.showEnrollDetails = true;
    }
  }
  enrollToCourse(batchId) {
    const request = {
      request: {
        courseId: this.batchDetails.courseId,
        userId: this.userService.userid,
        batchId: this.batchDetails.identifier
      }
    };
    this.disableSubmitBtn = true;
    this.courseBatchService.enrollToCourse(request).pipe(
      takeUntil(this.unsubscribe))
      .subscribe((data) => {
        this.disableSubmitBtn = true;
        this.fetchEnrolledCourseData();
      }, (err) => {
        this.disableSubmitBtn = false;
        this.toasterService.error(this.resourceService.messages.emsg.m0001);
      });
  }
  fetchEnrolledCourseData() {
    setTimeout(() => {
      this.coursesService.getEnrolledCourses().pipe(
        takeUntil(this.unsubscribe))
        .subscribe(() => {
          this.disableSubmitBtn = false;
          this.toasterService.success(this.resourceService.messages.smsg.m0036);
          this.router.navigate(['/learn/course', this.batchDetails.courseId, 'batch', this.batchDetails.identifier]);
          window.location.reload();
        }, (err) => {
          this.disableSubmitBtn = false;
          this.router.navigate(['/learn']);
        });
    }, 2000);
  }

  // Julia related code

    /**
   * This function is use to get order detail. Order means transaction detail.
   * Calling payment status api to get detail
   * Once we get the response, We enable button to enroll course
   */
  private getOrderDetail() {
    const request = {
      productId: this.productId,
      userId: this.userService.userid
    };
    this.paymentService.paymentStatus(request).subscribe((response) => {
      if (response && response.responseCode === 'OK') {
        this.orderData = response.result.response;
        this.disableSubmitBtn = false;
        this.orderDataStatus = true;
      } else {
        this.orderDataStatus = true;
        this.toasterService.error('Unable to get order detail, Please try again later');
      }
    }, (err) => {
      this.orderDataStatus = true;
      if (err.error.responseCode === 'RESOURCE_NOT_FOUND') {
        this.disableSubmitBtn = false;
      }
      console.log('Payment Status err :: ', err);
    });
  }

    /**
   * This function is use to start payment:
   * Basically call start payment api to get the api key and payment sdk url.
   */
   startPayment() {
    this.paymentService.startPayment().subscribe((resp: ServerResponse) => {
      this.sdkUrl = resp.result && resp.result.sdkUrl;
      this.apiKey = resp.result && resp.result.apiKey;
    }, (err: ServerResponse) => {
      this.toasterService.error('Process failed, Please try again later to contact to admin...');
    });
  }

     /**
   * This function is called by child component once child component got the price data then component
   * fire event to update data.
   * Once we got the event then we call get order detail
   * We updating the amount b'coz payment provider need amount in price.
   * @param data : It's contains the productid and amount.
   */
  public updatePriceData(data: {productId: string, amount: number, payment: string}) {
    this.productId = data.productId;
    this.amount = data.amount * 100;
    this.paymentType = data.payment;
    if (!this.orderData) {
      this.getOrderDetail();
    }
  }

    /**
   * This function is use to create payment.
   * This function called by user when user click on enroll button.
   * In this we will check some condition, If user already paid for the course. so we will not collect
   * the payment and directly enroll.
   * Then we create payment api to create order and then initialize the payment sdk
   * @param batchId : string
   */
   createPayment(batchId) {
    if (this.orderData && (this.orderData.orderStatus === 'USER_PAID' || this.orderData.cpTxnId)) {
      console.log('User already paid for this course, So directly enroll the course');
      this.toasterService.info('We already received payment for this course...');
      this.enrollToCourse(batchId);
      this.showEnrollDetails = false;
      return;
    }
    if (!this.apiKey || !this.sdkUrl || !this.productId || !this.amount) {
      this.toasterService.error('Process failed, Please try again later...');
      return;
    }
    this.disableSubmitBtn = true;
    const data = {
      userId: this.userService.userid,
      productId: this.productId,
      amount: this.amount
    };
    const paymentSdk = document.createElement('script');
    paymentSdk.setAttribute('src', this.sdkUrl);
    document.head.appendChild(paymentSdk);
    this.toasterService.info('Please wait, We are initiating your request...');
    this.paymentService.createPayment(data).subscribe((resp: ServerResponse) => {
      this.orderData = resp.result;
      const options = {
        key: this.apiKey,
        amount: this.amount,
        name: 'JuliaBox',
        description: '',
        image: '',
        handler: (response) => {
           this.paymentId = response.razorpay_payment_id;
            this.submitPayment(batchId, response.razorpay_payment_id);
            console.log(JSON.stringify(response));
        },
        theme: {
            color: '#F37254'
        },
        order_id: resp.result.orderId,
        modal: {
          ondismiss: () => {
            if (this.paymentId) {
              // this.redirect();
            } else {
              this.showEnrollDetails = true;
              this.disableSubmitBtn = false;
            }
          },
          escape: false
        }
      };
      const rzp1 = new window.Razorpay(options);
      this.showEnrollDetails = false;
      rzp1.open();
    }, (err: ServerResponse) => {
      this.toasterService.error('Process failed, Please try again later to contact to admin...');
    });
  }

    /**
   * this function is use to submit payment, Once we got callback from the payment provider,
   * we call api to update the collect payment id and status
   * @param batchId : Batch id
   * @param paymentId : Payment id
   */
   private submitPayment(batchId: string, paymentId: string) {
    const req: any = {...this.orderData, ...{paymentId: paymentId, orderStatus: 'USER_PAID', amount: this.amount,
                    cpTxnId: paymentId, cpStatus: 'USER_PAID', cpCreatedDate: new Date().toISOString()}};
    this.paymentService.submitPayment(req).subscribe((resp) => {
      this.enrollToCourse(batchId);
    }, (err) => {
      this.enrollToCourse(batchId);
      console.log('Submit payment failed due to :: ', JSON.stringify(err));
    });
  }
}
