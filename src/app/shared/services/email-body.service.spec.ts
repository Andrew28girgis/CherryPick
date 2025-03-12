import { TestBed } from '@angular/core/testing';

import { EmailBodyService } from './email-body.service';

describe('EmailBodyService', () => {
  let service: EmailBodyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmailBodyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
