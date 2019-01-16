import { TestBed, inject } from '@angular/core/testing';

import { JuliaBoxService } from './julia-box.service';

describe('Service', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [JuliaBoxService]
    });
  });

  it('should be created', inject([JuliaBoxService], (service: JuliaBoxService) => {
    expect(service).toBeTruthy();
  }));
});