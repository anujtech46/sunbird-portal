import { TestBed, inject } from '@angular/core/testing';

import { CourseInstructorService } from './course-instructor.service';

describe('CourseInstructorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CourseInstructorService]
    });
  });

  it('should be created', inject([CourseInstructorService], (service: CourseInstructorService) => {
    expect(service).toBeTruthy();
  }));
});
