import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlacesService } from 'src/app/core/services/places.service';
import { Notification } from 'src/app/shared/models/Notification';
import { RouterModule } from '@angular/router'; 




@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
})
export class NotificationsComponent implements OnInit {
  private contactId: number = 0;
  notifications: Notification[] = [];
  dropdownVisible: boolean = false;
  unreadCount: number = 0;
  readCount: number = 0;

  constructor(
    private placesService: PlacesService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    const storedContactId = localStorage.getItem('contactId');
    if (storedContactId) {
      this.contactId = +storedContactId;
      this.fetchUserNotifications();
    }
  }

  toggleDropdown(): void {
    this.dropdownVisible = !this.dropdownVisible;
  }

  fetchUserNotifications(): void {
    const request = {
      Name: 'GetUserNotifications',
      Params: {
        ContactId: this.contactId,
      },
    };

    this.placesService.GenericAPI(request).subscribe({
      next: (response: any) => {
        this.notifications = (response.json || []) as Notification[];
        console.log('Fetched notifications:', this.notifications);
        
        this.sortNotificationsByDate();
        this.updateNotificationCounts();
      }
    });
  }

  private sortNotificationsByDate(): void {
    this.notifications.sort(
      (a, b) =>
        new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    );
  }

  private updateNotificationCounts(): void {
    this.readCount = this.notifications.filter(
      (notification) => notification.isRead
    ).length;
    this.unreadCount = this.notifications.filter(
      (notification) => !notification.isRead
    ).length;
  }
  getUploadRoute(notification: Notification): string | null {
  if (notification.userSubmissionId) {
    return `/uploadOM/${notification.userSubmissionId}`;
  }
  return null;
}


  markNotificationAsRead(notification: Notification): void {
    if (notification.isRead) {
      return;
    }

    const request = {
      Name: 'UpdateNotification',
      Params: {
        NotificationId: notification.id,
      },
    };

    this.placesService.GenericAPI(request).subscribe({
      next: () => {
        notification.isRead = 1;
        this.updateNotificationCounts();
      }
    });
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.dropdownVisible = false;
    }
  }
}
