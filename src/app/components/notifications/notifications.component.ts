import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
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
  unreadCount: number = 0;
  readCount: number = 0;
  constructor(private PlacesService: PlacesService, private eRef: ElementRef) {}
  ngOnInit(): void {
    const storedContactId = localStorage.getItem('contactId');
    if (storedContactId) {
      this.ContactId = +storedContactId;
      this.GetUserNotifications();
    }
  }
  toggleDropdown(): void {
    this.dropdownVisible = !this.dropdownVisible;
  }

  GetUserNotifications(): void {
    const body: any = {
      Name: 'GetUserNotifications',
      Params: {
        ContactId: this.ContactId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.notificationsArray = res.json || [];
        this.notificationsArray.sort((a, b) => {
          return (
            new Date(b.createdDate).getTime() -
            new Date(a.createdDate).getTime()
          );
        });
        this.readCount = this.notificationsArray.filter(
          (notification) => notification.isRead
        ).length;
        this.unreadCount = this.notificationsArray.filter(
          (notification) => !notification.isRead
        ).length;
        if (this.notificationsArray.length > 0) {
          this.message = this.notificationsArray[0].message;
          this.createdDate = this.notificationsArray[0].createdDate;
        } else {
          this.message = '';
          this.createdDate = '';
        }
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
    });
    this.GetUserNotifications();
  }
  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: Event): void {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.dropdownVisible = false;
    }
  }
}
