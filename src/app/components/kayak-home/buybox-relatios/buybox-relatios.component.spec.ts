import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyboxRelatiosComponent } from './buybox-relatios.component';

describe('BuyboxRelatiosComponent', () => {
  let component: BuyboxRelatiosComponent;
  let fixture: ComponentFixture<BuyboxRelatiosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BuyboxRelatiosComponent]
    });
    fixture = TestBed.createComponent(BuyboxRelatiosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
