import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SummeryComponent } from './summery.component';
import { TenantCardComponent } from './tenant-card/tenant-card.component';
import { NgxSpinnerModule } from 'ngx-spinner';

const routes: Routes = [
  { path: '', component: SummeryComponent }
];

@NgModule({
  declarations: [
    SummeryComponent,
    TenantCardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgxSpinnerModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class SummeryModule { }