import { Component, OnInit, Input } from '@angular/core';
import { CoursePriceService } from '../../services';
import { UserService, PaymentService } from '@sunbird/core';
import { ToasterService } from '@sunbird/shared';

@Component({
  selector: 'app-course-benefit',
  templateUrl: './course-benefit.component.html',
  styleUrls: ['./course-benefit.component.css']
})
export class CourseBenefitComponent implements OnInit {

  @Input() courseId: string;
  @Input() batchId: string;
  private orderData: any;
  private productData: any;
  isShowBTButton: boolean;
  showModel: boolean;
  progress: boolean;
  statusMessage: string;

  constructor(public coursePriceService: CoursePriceService, public userService: UserService,
  public paymentService: PaymentService, public toasterService: ToasterService) { }

  ngOnInit() {
    this.getProductDetail();
  }

  getProductDetail = () => {
    const request: any = {
      filters: {
        courseid: this.courseId,
        batchid: this.batchId
      }
    };
    this.coursePriceService.searchPrice(request).subscribe((response) => {
      if (response && response.responseCode === 'OK') {
        this.productData = response.result.response.content[0];
        this.getOrderDetail(this.productData.priceId);
      } else {
        // this.toasterService.error('Unable to get course price, Please try again later');
        console.log('Getting product detail failed...');
      }
    }, (err) => {
      console.log('err', err);
    });
  }

  private getOrderDetail(productId) {
    const request = {
      productId: productId,
      userId: this.userService.userid
    };
    this.paymentService.paymentStatus(request).subscribe((response) => {
      if (response && response.responseCode === 'OK') {
        this.orderData = response.result.response;
        if (this.orderData.cpTxnId && !this.orderData.spTxnId) {
          this.isShowBTButton = true;
        }
      } else {
        this.isShowBTButton = false;
        this.toasterService.error('Unable to get benefit detail, Please try again later');
      }
    }, (err) => {
      this.isShowBTButton = false;
      if (err.error.responseCode === 'RESOURCE_NOT_FOUND') {
        this.isShowBTButton = true;
      }
      this.toasterService.error('Unable to get payment detail, Please try again later');
    });
  }

  getBenefit = () => {
    this.progress = true;
    this.showModel = true;
    const data = {
      amount: this.productData.price * 100,
      refundAmount: this.productData.benefit * 100,
      orderId: this.orderData.orderId,
      paymentId: this.orderData.paymentId
    };
    this.paymentService.sendPayment(data).subscribe((resp) => {
      this.progress = false;
      if (resp && resp.responseCode === 'OK') {
        this.isShowBTButton = false;
        this.statusMessage = 'PAYMENT_SUCCESS';
      } else {
        this.statusMessage = 'PAYMENT_ERROR';
      }
    }, (err) => {
      this.progress = false;
      this.statusMessage = 'PAYMENT_ERROR';
    });
  }

  close() {
    this.showModel = false;
  }

}
