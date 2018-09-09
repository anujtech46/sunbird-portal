import { TestBed, inject } from '@angular/core/testing';

import { CourseBadgeService } from './course-badge.service';

describe('CourseBadgeService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CourseBadgeService]
    });
  });

  it('should be created', inject([CourseBadgeService], (service: CourseBadgeService) => {
    expect(service).toBeTruthy();
  }));
});
