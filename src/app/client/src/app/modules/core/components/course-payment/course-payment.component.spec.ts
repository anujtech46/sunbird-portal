import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoursePaymentComponent } from './course-payment.component';

describe('CoursePaymentComponent', () => {
  let component: CoursePaymentComponent;
  let fixture: ComponentFixture<CoursePaymentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CoursePaymentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CoursePaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
