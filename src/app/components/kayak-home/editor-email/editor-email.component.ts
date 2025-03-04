import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EditorModule } from 'primeng/editor';

@Component({
  selector: 'app-editor-email',
  standalone: true,
  imports: [ReactiveFormsModule, EditorModule],
  providers: [],
  templateUrl: './editor-email.component.html',
  styleUrl: './editor-email.component.css'
})
export class EditorEmailComponent implements OnInit {
  formGroup!: FormGroup;

  ngOnInit() {
    this.formGroup = new FormGroup({
      text: new FormControl('')
    });
  }

  logEditorContent() {
    console.log("Editor Content:", this.formGroup.get('text')?.value);
  }
}