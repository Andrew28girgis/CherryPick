import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmailInfoComponent } from './email-info.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ContactsComponent } from '../contacts/contacts.component';

const routes: Routes = [
  { path: '', component: EmailInfoComponent }
];

@NgModule({
  declarations: [
    EmailInfoComponent,
    ContactsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgxSpinnerModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class EmailInfoModule { }