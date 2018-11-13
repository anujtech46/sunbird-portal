import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddusersorgsComponent } from './addusersorgs.component';

describe('AddusersorgsComponent', () => {
  let component: AddusersorgsComponent;
  let fixture: ComponentFixture<AddusersorgsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddusersorgsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddusersorgsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
