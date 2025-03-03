import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocialViewComponent } from './social-view.component';

describe('SocialViewComponent', () => {
  let component: SocialViewComponent;
  let fixture: ComponentFixture<SocialViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SocialViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
