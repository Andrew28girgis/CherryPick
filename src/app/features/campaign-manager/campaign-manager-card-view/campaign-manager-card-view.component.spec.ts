import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampaignManagerCardViewComponent } from './campaign-manager-card-view.component';

describe('CampaignManagerCardViewComponent', () => {
  let component: CampaignManagerCardViewComponent;
  let fixture: ComponentFixture<CampaignManagerCardViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampaignManagerCardViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CampaignManagerCardViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
