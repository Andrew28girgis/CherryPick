import { TestBed } from '@angular/core/testing';

import { SidbarService } from './sidbar.service';

describe('SidbarService', () => {
  let service: SidbarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SidbarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
