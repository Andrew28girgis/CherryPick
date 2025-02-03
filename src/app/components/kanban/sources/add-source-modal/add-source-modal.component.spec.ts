import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSourceModalComponent } from './add-source-modal.component';

describe('AddSourceModalComponent', () => {
  let component: AddSourceModalComponent;
  let fixture: ComponentFixture<AddSourceModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddSourceModalComponent]
    });
    fixture = TestBed.createComponent(AddSourceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
