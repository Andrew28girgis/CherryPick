import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddTenantsComponent } from './add-tenants.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { NgxFileDropModule } from 'ngx-file-drop';
import { TooltipModule } from 'primeng/tooltip';

const routes: Routes = [
  { path: '', component: AddTenantsComponent }
];

@NgModule({
  declarations: [
    AddTenantsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxSpinnerModule,
    StepperModule,
    ButtonModule,
    SelectButtonModule,
    NgxFileDropModule,
    TooltipModule,
    RouterModule.forChild(routes)
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [RouterModule]
})
export class AddTenantsModule { }