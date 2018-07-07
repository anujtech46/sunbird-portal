import { TestBed, inject } from '@angular/core/testing';

import { JuliaNoteBookService } from './julia-note-book.service';

describe('JuliaNoteBookService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [JuliaNoteBookService]
    });
  });

  it('should be created', inject([JuliaNoteBookService], (service: JuliaNoteBookService) => {
    expect(service).toBeTruthy();
  }));
});
