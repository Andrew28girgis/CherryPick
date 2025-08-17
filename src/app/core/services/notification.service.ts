import { Injectable } from '@angular/core';
import { PlacesService } from 'src/app/core/services/places.service';
import { Notification } from 'src/app/shared/models/Notification';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  contactId = 0;
  notifications: Notification[] = [];
  dropdownVisible = false;
  unreadCount = 0;
  readCount = 0;
  isChatOpen = false;
  private notificationIdsWhenOpened: Set<number> = new Set();

  constructor(private placesService: PlacesService, private router: Router) {}

  getUploadRoute(notification: Notification): string | null {
    return notification.userSubmissionId
      ? `/uploadOM/${notification.userSubmissionId}`
      : null;
  }

  initNotifications(): void {
    const storedContactId = localStorage.getItem('contactId');
    if (storedContactId) {
      this.contactId = +storedContactId;
      this.fetchUserNotifications();
    }
  }

  fetchUserNotifications(): void {
    const request = {
      Name: 'GetUserNotifications',
      Params: { ContactId: this.contactId },
    };

    this.placesService.GenericAPI(request).subscribe({
      next: (response: any) => {
        const previousNotifications = [...this.notifications];
        // No conversion to boolean — keep the API's number
        this.notifications = (response.json || []) as Notification[];
        this.sortNotificationsByDate();

        if (this.isChatOpen) {
          this.handleNewMessagesWhileChatOpen(previousNotifications);
        }

        this.updateNotificationCounts();
      },
    });
  }

  private handleNewMessagesWhileChatOpen(
    previousNotifications: Notification[]
  ): void {
    const previousIds = new Set(previousNotifications.map((n) => n.id));

    // Find truly new notifications (not just updates to existing ones)
    const newNotifications = this.notifications.filter(
      (notification) =>
        !previousIds.has(notification.id) && notification.isRead === 0
    );

    if (newNotifications.length > 0) {
      // Mark these new notifications as read since chat is open
      newNotifications.forEach((notification) => {
        this.markNotificationAsRead(notification);
      });
    }
  }

  private markNotificationAsRead(notification: Notification): void {
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
      },
      error: (err) => {
        console.error('Error marking notification as read:', err);
      },
    });
  }

  setChatOpen(isOpen: boolean): void {
    this.isChatOpen = isOpen;
    this.dropdownVisible = isOpen;

    if (isOpen) {
      // Store IDs of notifications that exist when chat is opened
      this.notificationIdsWhenOpened = new Set(
        this.notifications.map((n) => n.id)
      );
    } else {
      this.notificationIdsWhenOpened.clear();
    }
  }

  shouldMarkAsReadOnOpen(notificationId: number): boolean {
    return this.notificationIdsWhenOpened.has(notificationId);
  }

  updateNotificationCounts(): void {
    this.readCount = this.notifications.filter((n) => n.isRead === 1).length;
    this.unreadCount = this.notifications.filter((n) => n.isRead === 0).length;
  }

  private sortNotificationsByDate(): void {
    this.notifications.sort(
      (a, b) =>
        new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
    );
  }
}
