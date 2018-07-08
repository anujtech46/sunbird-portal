import { TestBed, inject } from '@angular/core/testing';

import { CoursePriceService } from './course-price.service';

describe('CoursePriceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CoursePriceService]
    });
  });

  it('should be created', inject([CoursePriceService], (service: CoursePriceService) => {
    expect(service).toBeTruthy();
  }));
});
