import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TasksComponent } from './tasks.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

const routes: Routes = [
  { path: '', component: TasksComponent }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgxSpinnerModule,
    NgbTooltipModule,
    RouterModule.forChild(routes),
    TasksComponent // Import standalone component instead of declaring
  ],
  exports: [RouterModule]
})
export class TasksModule { }