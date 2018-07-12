import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseBenefitComponent } from './course-benefit.component';

describe('CourseBenefitComponent', () => {
  let component: CourseBenefitComponent;
  let fixture: ComponentFixture<CourseBenefitComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CourseBenefitComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CourseBenefitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
