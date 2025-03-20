import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../components/header/header.component';
import { NotificationsComponent } from '../components/notifications/notifications.component';
@NgModule({
  declarations: [HeaderComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    NotificationsComponent,
  ],
  exports: [HeaderComponent],
})
export class SharedModule {}
