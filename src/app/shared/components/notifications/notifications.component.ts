import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlacesService } from 'src/app/core/services/places.service';

interface Notification {
  id: number;
  message: string;
  createdDate: string;
  isRead: boolean;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
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
        this.sortNotificationsByDate();
        this.updateNotificationCounts();
      },
      error: (error) => {
        console.error('Error fetching notifications:', error);
      },
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
        notification.isRead = true;
        this.updateNotificationCounts();
      },
      error: (error) => {
        console.error('Error updating notification:', error);
      },
    });
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.dropdownVisible = false;
    }
  }
}
