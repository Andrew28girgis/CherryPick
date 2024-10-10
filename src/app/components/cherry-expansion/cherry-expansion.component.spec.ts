import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CherryExpansionComponent } from './cherry-expansion.component';

describe('CherryExpansionComponent', () => {
  let component: CherryExpansionComponent;
  let fixture: ComponentFixture<CherryExpansionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CherryExpansionComponent]
    });
    fixture = TestBed.createComponent(CherryExpansionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
