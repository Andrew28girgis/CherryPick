import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PolygonsControllerComponent } from './polygons-controller.component';

describe('PolygonsControllerComponent', () => {
  let component: PolygonsControllerComponent;
  let fixture: ComponentFixture<PolygonsControllerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PolygonsControllerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PolygonsControllerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
