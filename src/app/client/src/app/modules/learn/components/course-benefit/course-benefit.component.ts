/**
 * @name: course-benefit.component.ts
 * @author: Anuj Gupta
 * @description: This component is use to handle the benefit transfer functionality
 */
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

  // Course id
  @Input() courseId: string;
  /**
   * Batch id
   */
  @Input() batchId: string;
  /**
   * Order data (Transaction data)
   */
  private orderData: any;
  /**
   * Product data contains course badge price information
   */
  private productData: any;
  /**
   * Used to show or hide Benefit transfer button
   */
  isShowBTButton: boolean;
  /**
   * Used to show Benefit transaction modal
   */
  showModel: boolean;
  /**
   * Used to check wither API call in progress on not
   */
  progress: boolean;
  /**
   * Used to show message on based of api call.
   */
  statusMessage: string;

  /**
   * constructor method
   * @param coursePriceService Course Price Service
   * @param userService : User Service
   * @param paymentService : Payment Service
   * @param toasterService : Toaster Service
   */
  constructor(public coursePriceService: CoursePriceService, public userService: UserService,
  public paymentService: PaymentService, public toasterService: ToasterService) { }

  /**
   * called when component initialized
   * On init we get the product detail
   */
  ngOnInit() {
    this.getProductDetail();
  }

  /**
   * Get the product detail (price data)
   * Once we got the product detail then we call the order detail
   */
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
        console.log('Getting product detail failed...', JSON.stringify(response));
      }
    }, (err) => {
      console.log('Getting product detail failed...', JSON.stringify(err));
    });
  }

  /**
   * Get the order details
   * Based on the response we are showing the benefit transfer button.
   */
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
        this.isShowBTButton = false;
        return;
      }
      this.toasterService.error('Unable to get payment detail, Please try again later');
    });
  }

  /**
   * We call the get benefit
   * Call the send payment api to get benefit
   */
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

  /**
   * Close the modal
   */
  close() {
    this.showModel = false;
  }

}
