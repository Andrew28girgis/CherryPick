import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyInboxEmailListComponent } from './my-inbox-email-list.component';

describe('MyInboxEmailListComponent', () => {
  let component: MyInboxEmailListComponent;
  let fixture: ComponentFixture<MyInboxEmailListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyInboxEmailListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MyInboxEmailListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
