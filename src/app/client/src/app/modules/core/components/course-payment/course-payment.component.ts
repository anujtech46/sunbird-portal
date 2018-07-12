import { Component, OnInit, Input } from '@angular/core';
import { PaymentService, UserService } from '../../services';
import { ServerResponse, ToasterService } from '@sunbird/shared';

@Component({
  selector: 'app-course-payment',
  templateUrl: './course-payment.component.html',
  styleUrls: ['./course-payment.component.css']
})
export class CoursePaymentComponent implements OnInit {

  sdkUrl: string;
  apiKey: string;
  userId: string;
  @Input() productId: string;
  @Input() amount: number;

  constructor(public paymentService: PaymentService, public userService: UserService, public toasterService: ToasterService) {
    this.userId = userService.userid;
   }

  ngOnInit() {
    this.paymentService.startPayment().subscribe((resp: ServerResponse) => {
      console.log('response', resp);
      this.sdkUrl = resp.result && resp.result.sdkUrl;
      this.apiKey = resp.result && resp.result.apiKey;
    }, (err: ServerResponse) => {
      this.toasterService.error('Process failed, Please try again later to contact to admin...');
    });
  }

  createPayment() {
    if (!this.apiKey || !this.sdkUrl) {
      this.toasterService.error('Process failed, Please try again later to contact to admin...');
      return;
    }
    const data = {
      userId: this.userId,
      productId: this.productId,
      amount: this.amount
    };
    const paymentSdk = document.createElement('script');
    paymentSdk.setAttribute('src', this.sdkUrl);
    document.head.appendChild(paymentSdk);
    this.paymentService.createPayment(data).subscribe((resp: ServerResponse) => {
      const options = {
        key: this.apiKey,
        amount: this.amount * 100,
        name: 'Merchant Name',
        description: 'Purchase Description',
        image: '',
        handler: (response) => {
            alert(response.razorpay_payment_id);
            console.log(JSON.stringify(response));
        },
        theme: {
            color: '#F37254'
        },
        order_id: resp.result.orderId
      };
      const rzp1 = new window.Razorpay(options);
    }, (err: ServerResponse) => {
      this.toasterService.error('Process failed, Please try again later to contact to admin...');
    });
  }

}
