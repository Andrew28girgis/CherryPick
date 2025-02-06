import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KayakComponent } from './kayak.component';

describe('KayakComponent', () => {
  let component: KayakComponent;
  let fixture: ComponentFixture<KayakComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KayakComponent]
    });
    fixture = TestBed.createComponent(KayakComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
