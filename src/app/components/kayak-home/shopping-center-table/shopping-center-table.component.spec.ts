import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShoppingCenterTableComponent } from './shopping-center-table.component';

describe('ShoppingCenterTableComponent', () => {
  let component: ShoppingCenterTableComponent;
  let fixture: ComponentFixture<ShoppingCenterTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ShoppingCenterTableComponent]
    });
    fixture = TestBed.createComponent(ShoppingCenterTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
