import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KanbanHomeComponent } from './kanban-home.component';

describe('KanbanHomeComponent', () => {
  let component: KanbanHomeComponent;
  let fixture: ComponentFixture<KanbanHomeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KanbanHomeComponent]
    });
    fixture = TestBed.createComponent(KanbanHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
