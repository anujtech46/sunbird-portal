/**
 * @name: course-price.component.ts
 * @author: Anuj Gupta
 * @description: This component is use to handle course batch price
 */
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UserService } from '@sunbird/core';
import { CoursePriceService } from '../../services/course-price/course-price.service';
import { ToasterService, UpdatePriceI, CoursePriceModelI } from '@sunbird/shared';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-course-price',
  templateUrl: './course-price.component.html',
  styleUrls: ['./course-price.component.css']
})
export class CoursePriceComponent implements OnInit {

  /**
   * viewType: Contains tell where we are using this component [ICON, CARD]
   */
  @Input() viewType: string;
  /**
   * Course id
   */
  @Input() courseId: string;
  /**
   * Batch Id
   */
  @Input() batchId: string;
  /**
   * updatePriceData: Contains price data
   */
  @Output() updatePriceData: EventEmitter<any> = new EventEmitter();
  userId: string;
  data: any = {} ;
  titleMessage: string;
  showCoursePriceModal = false;
  showLoader = false;
  loaderMessage = {
    loaderMessage: 'Submitting price detail, Please wait...'
  };
  modelDataForm: FormGroup;

  constructor(public coursePriceService: CoursePriceService, public toasterService: ToasterService,
    public userService: UserService) {
    this.userId = userService.userid;
  }

  ngOnInit() {
    if (this.viewType === 'CARD') {
      this.initializeModal();
    }
  }

  /**
   * Initialize model and get course price data
   */
  initializeModal() {
    const request: any = {
      filters: {
        courseid: this.courseId,
        batchid: this.batchId
      }
    };
    this.showLoader = true;
    this.coursePriceService.searchPrice(request).subscribe((response) => {
      this.showLoader = false;
      if (response && response.responseCode === 'OK') {
        this.data = response.result.response.content[0] || {};
        if (this.viewType === 'ICON') {
          this.updateModelData();
        }
        if (this.viewType === 'CARD') {
          this.updatePriceData.emit({productId: this.data.priceId, amount: this.data.price,
            benefit: this.data.benefit, payment: this.data.payment});
        }
        this.titleMessage = this.data && this.data.priceId ? 'Update Price' : 'Add Price';
      } else {
        this.toasterService.error('Unable to get course price, Please try again later');
      }
    }, (err) => {
      this.showLoader = false;
      console.log('search price err :: ', err);
      this.toasterService.error('Unable to update price, please try again later');
    });
  }

  /**
   * Update Data for form model
   */
  updateModelData() {
    this.modelDataForm = new FormGroup({
      price: new FormControl(this.data.price, [Validators.required]),
      benefit: new FormControl(this.data.benefit, [Validators.required]),
      payment: new FormControl(this.data.payment, [Validators.required]),
      priceId: new FormControl(this.data.priceId, [Validators.required])
    });
    this.showCoursePriceModal = true;
  }

  /**
   * Hide the model
   */
  close() {
    this.showCoursePriceModal = false;
  }

  /**
   * Save meta data
   * @param data : {Response data}
   */
  saveMetaData(data) {
    if (this.data && this.data.priceId) {
      this.updatePrice(data);
    } else {
      this.addPrice(data);
    }
  }

  /**
   * get data for request
   * @param data {Form model data}
   */
  getRequest(data) {
    return {
      courseId: this.courseId,
      batchId: this.batchId,
      payment: this.modelDataForm.value.payment,
      price: Number(this.modelDataForm.value.price),
      benefit: Number(this.modelDataForm.value.benefit),
      createdDate: this.data && this.data.createdDate
        ? this.data.createdDate
        : (new Date()).toISOString(),
      updatedDate: (new Date()).toISOString()
    };
  }

  /**
   * Add price
   * @param data {Request data}
   */
  addPrice(data) {
    this.showLoader = true;
    const request = this.getRequest(data);
    this.coursePriceService.createPrice(request).subscribe((response) => {
      this.showLoader = false;
      if (response && response.responseCode === 'OK') {
        this.toasterService.success('Price added successfully...');
        this.data = response.result.data;
        this.close();
      } else {
        this.toasterService.error('Unable to add price, please try again later');
      }
    }, (err) => {
      console.log('err', err);
      this.showLoader = false;
      this.toasterService.error('Unable to add price, please try again later');
    });
  }

  /**
   * Update price
   * @param data {Request data}
   */
  updatePrice(data) {
    this.showLoader = true;
    const request: UpdatePriceI = { ...this.getRequest(data), ...{ priceId: this.modelDataForm.value.priceId } };

    this.coursePriceService.updatePrice(request).subscribe((response) => {
      this.showLoader = false;
      if (response && response.responseCode === 'OK') {
        this.data = request;
        this.close();
        this.toasterService.success('Price updated successfully...');
      } else {
        this.toasterService.error('Unable to update price, please try again later');
      }
    }, (err) => {
      console.log('err', err);
      this.showLoader = false;
      this.toasterService.error('Unable to update price, please try again later');
    });
  }

}
