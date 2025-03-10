import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailReadComponent } from './email-read.component';

describe('EmailReadComponent', () => {
  let component: EmailReadComponent;
  let fixture: ComponentFixture<EmailReadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailReadComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmailReadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
