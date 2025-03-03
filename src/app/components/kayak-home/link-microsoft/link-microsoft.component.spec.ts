import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkMicrosoftComponent } from './link-microsoft.component';

describe('LinkMicrosoftComponent', () => {
  let component: LinkMicrosoftComponent;
  let fixture: ComponentFixture<LinkMicrosoftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkMicrosoftComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LinkMicrosoftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
