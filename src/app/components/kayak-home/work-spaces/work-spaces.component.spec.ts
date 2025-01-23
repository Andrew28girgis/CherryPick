import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkSpacesComponent } from './work-spaces.component';

describe('WorkSpacesComponent', () => {
  let component: WorkSpacesComponent;
  let fixture: ComponentFixture<WorkSpacesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WorkSpacesComponent]
    });
    fixture = TestBed.createComponent(WorkSpacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
