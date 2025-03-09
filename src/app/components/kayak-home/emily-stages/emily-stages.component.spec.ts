/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { EmilyStagesComponent } from './emily-stages.component';

describe('EmilyStagesComponent', () => {
  let component: EmilyStagesComponent;
  let fixture: ComponentFixture<EmilyStagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmilyStagesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmilyStagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
