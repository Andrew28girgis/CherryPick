import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmilyOrgComponent } from './emily-org.component';

describe('EmilyOrgComponent', () => {
  let component: EmilyOrgComponent;
  let fixture: ComponentFixture<EmilyOrgComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmilyOrgComponent]
    });
    fixture = TestBed.createComponent(EmilyOrgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
