import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { SubmissionsComponent } from './logs.component';

const routes: Routes = [
  { path: '', component: SubmissionsComponent }
];

@NgModule({
  declarations: [
    SubmissionsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgxSpinnerModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class SubmissionsModule { }