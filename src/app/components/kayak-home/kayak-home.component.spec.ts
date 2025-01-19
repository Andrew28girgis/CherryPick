import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KayakHomeComponent } from './kayak-home.component';

describe('KayakHomeComponent', () => {
  let component: KayakHomeComponent;
  let fixture: ComponentFixture<KayakHomeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KayakHomeComponent]
    });
    fixture = TestBed.createComponent(KayakHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
