import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { EditorModule } from 'primeng/editor';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { MailsGenerateOrSendComponent } from './mails-generate-or-send/mails-generate-or-send.component';
import { NewMulipleEmailComponent } from './new-muliple-email/new-muliple-email.component';
import { InboxComponent } from './inbox/inbox.component';
import { EmailInboxComponent } from './email-inbox/email-inbox.component';
import { EmailComposeComponent } from './inbox/email-compose/email-compose.component';

const routes: Routes = [
  { path: '', component: InboxComponent },
  { path: 'generate', component: MailsGenerateOrSendComponent },
  { path: 'multiple', component: NewMulipleEmailComponent },
  { path: 'inbox', component: EmailInboxComponent },
  { path: 'compose', component: EmailComposeComponent }
];

@NgModule({
  declarations: [
    MailsGenerateOrSendComponent,
    NewMulipleEmailComponent,
    InboxComponent,
    EmailInboxComponent,
    EmailComposeComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgxSpinnerModule,
    EditorModule,
    NgbPopoverModule,
    RouterModule.forChild(routes)
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Add schema to handle unknown elements
  exports: [RouterModule]
})
export class EmilyModule { }