import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorEmailComponent } from './editor-email.component';

describe('EditorEmailComponent', () => {
  let component: EditorEmailComponent;
  let fixture: ComponentFixture<EditorEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorEmailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditorEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
