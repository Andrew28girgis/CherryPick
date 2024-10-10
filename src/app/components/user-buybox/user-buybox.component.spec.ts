import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserBuyboxComponent } from './user-buybox.component';

describe('UserBuyboxComponent', () => {
  let component: UserBuyboxComponent;
  let fixture: ComponentFixture<UserBuyboxComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserBuyboxComponent]
    });
    fixture = TestBed.createComponent(UserBuyboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
