import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyboxDetailsComponent } from './buybox-details.component';

describe('BuyboxDetailsComponent', () => {
  let component: BuyboxDetailsComponent;
  let fixture: ComponentFixture<BuyboxDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BuyboxDetailsComponent]
    });
    fixture = TestBed.createComponent(BuyboxDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
