import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StageEmailComponent } from './stage-email.component';

describe('StageEmailComponent', () => {
  let component: StageEmailComponent;
  let fixture: ComponentFixture<StageEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StageEmailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StageEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
