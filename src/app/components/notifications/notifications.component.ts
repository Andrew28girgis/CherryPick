import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import { PlacesService } from '../../shared/services/places.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
})
export class NotificationsComponent implements OnInit {
  ContactId!: number;
  notificationsArray: any[] = [];
  message!: string;
  createdDate!: string;
  dropdownVisible: boolean = false;
  constructor(
    private spinner: NgxSpinnerService,
    private PlacesService: PlacesService
  ) {}
  ngOnInit(): void {
    const storedContactId = localStorage.getItem('contactId');
    if (storedContactId) {
      this.ContactId = +storedContactId;
      this.GetUserNotifications();
    }
  }
  toggleDropdown(): void {
    this.dropdownVisible = !this.dropdownVisible;
    if (this.dropdownVisible) {
    }
  }

  GetUserNotifications(): void {
    this.spinner.show();

    const body: any = {
      Name: 'GetUserNotifications',
      Params: {
        ContactId: this.ContactId,
      },
    };

    console.log('ContactId:', body.Params.ContactId);

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        console.log('Raw response:', res);
        this.notificationsArray = res.json || [];
        if (this.notificationsArray.length > 0) {
          this.message = this.notificationsArray[0].message;
          this.createdDate = this.notificationsArray[0].createdDate;
        } else {
          this.message = '';
          this.createdDate = '';
        }
        this.spinner.hide();
      },
      error: (err: any) => {
        console.error('Error from GetUserNotifications:', err);
        this.spinner.hide();
      },
    });
  }

  updateNotification(notification: any): void {
    console.log('Notification ID selected:', notification.id);

    if (!notification.isRead) {
      notification.isRead = true;
    }

    const body: any = {
      Name: 'UpdateNotification',
      Params: {
        NotificationId: notification.id,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        console.log('UpdateNotification response:', res);
      },
      error: (err: any) => {
        console.error('Error updating notification:', err);
      },
    });
  }

  isLast(notification: any): boolean {
    return (
      this.notificationsArray.indexOf(notification) ===
      this.notificationsArray.length - 1
    );
  }
}
