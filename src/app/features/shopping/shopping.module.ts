import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShoppingComponent } from './shopping.component';
import { FileExplorerComponent } from './file-explorer/file-explorer.component';
import { NgxSpinnerModule } from 'ngx-spinner';

const routes: Routes = [
  { path: '', component: ShoppingComponent }
];

@NgModule({
  declarations: [
    ShoppingComponent,
    FileExplorerComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgxSpinnerModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class ShoppingModule { }