import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SideListViewComponent } from './side-list-view.component';

describe('SideListViewComponent', () => {
  let component: SideListViewComponent;
  let fixture: ComponentFixture<SideListViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SideListViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SideListViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
