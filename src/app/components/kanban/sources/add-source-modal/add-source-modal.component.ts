import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-source-modal',
  templateUrl: './add-source-modal.component.html',
  styleUrls: ['./add-source-modal.component.css']
})
export class AddSourceModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() addSource = new EventEmitter<string>();

  sourceForm: FormGroup;
  isLoading = false;

  constructor(private fb: FormBuilder) {
    this.sourceForm = this.fb.group({
      link: ['', [
        Validators.required, 
        Validators.pattern('https?://.+')
      ]]
    });
  }

  onSubmit() {
    if (this.sourceForm.valid) {
      this.isLoading = true;
      this.addSource.emit(this.sourceForm.value.link);
      this.isLoading = false;
      this.close.emit();
    }
  }

  onCancel() {
    this.close.emit();
  }
}