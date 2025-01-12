import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TableRow } from 'src/models/kanbans';

@Component({
  selector: 'app-edit-popup',
  templateUrl: './edit-popup.component.html',
  styleUrls: ['./edit-popup.component.css']
})
export class EditPopupComponent {
  @Input() row!: TableRow;
  @Output() save = new EventEmitter<TableRow>();
  @Output() cancel = new EventEmitter<void>();
constructor(){}
editedRow: TableRow = {} as TableRow;

  ngOnInit() {
    this.editedRow = { ...this.row };
  }

  onSave() {
    this.save.emit(this.editedRow);
  }

  onCancel() {
    this.cancel.emit();
  }
}