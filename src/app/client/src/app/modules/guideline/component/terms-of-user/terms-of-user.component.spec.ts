import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TermsOfUserComponent } from './terms-of-user.component';

describe('TermsOfUserComponent', () => {
  let component: TermsOfUserComponent;
  let fixture: ComponentFixture<TermsOfUserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TermsOfUserComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TermsOfUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
