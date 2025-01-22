/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BuyboxShoppingCentersComponent } from './buybox-shopping-centers.component';

describe('BuyboxShoppingCentersComponent', () => {
  let component: BuyboxShoppingCentersComponent;
  let fixture: ComponentFixture<BuyboxShoppingCentersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BuyboxShoppingCentersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyboxShoppingCentersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
