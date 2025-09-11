 import { Injectable } from '@angular/core';
import { PlacesService } from 'src/app/core/services/places.service';
import { Notification } from 'src/app/shared/models/Notification';
import {  Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationService  {
  contactId = 0;
  notifications: Notification[] = [];
  dropdownVisible = false;
  unreadCount = 0;
  readCount = 0;

  // Default to true so Emily is opened by default
  isChatOpen = true;
  private notificationIdsWhenOpened: Set<number> = new Set();

  // Initialize BehaviorSubject with true for default open state
  private chatOpenSubject = new BehaviorSubject<boolean>(true);
  public chatOpen$ = this.chatOpenSubject.asObservable();

  // Property for notification count in the badge
  public newNotificationsCount = 0;
  CampaignId: any;
  params: any;

  constructor(
    private placesService: PlacesService,
    private router: Router,
   ) {}

  
  getUploadRoute(notification: Notification): string | null {
    return notification.userSubmissionId
      ? `/uploadOM/${notification.userSubmissionId}`
      : null;
  }

  initNotifications(campaignId:any): void {
    const storedContactId = localStorage.getItem('contactId');
    if (storedContactId) {
      this.contactId = +storedContactId;
      this.fetchUserNotifications(campaignId);
    }
  }

  fetchUserNotifications(campaignId:any): void {
  
    const request = {
      Name: 'GetUserNotifications',
      Params: { ContactId: this.contactId, CampaignID:campaignId?campaignId:null },
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

        // Update the badge count for unread messages
        this.newNotificationsCount = this.unreadCount;
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
        if (
          notification.isRead == 0 &&
          notification.contextExtendPrompt &&
          notification.contextExtendPrompt.trim() !== '' &&
          notification.contextExtendPrompt.trim().toLowerCase() !== 'null'
        ) {
          const token = localStorage.getItem('token') || '';
          (window as any).electronMessage.startChatAutmation(
            notification.contextExtendPrompt,
            token
          );
        }
        this.markNotificationAsRead(notification);
      });
    }
  }

  markNotificationAsRead(notification: Notification): void {
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
        // Update badge count when a notification is read
        this.newNotificationsCount = this.unreadCount;
      },
      error: (err) => {
        console.error('Error marking notification as read:', err);
      },
    });
  }

  // Make sure to call this during app initialization
  initChatState(): void {
    // Set the chat to open by default
    this.setChatOpen(true);
  }

  setChatOpen(isOpen: boolean): void {
    this.isChatOpen = isOpen;
    this.dropdownVisible = isOpen;

    // Update the BehaviorSubject to notify all subscribers
    this.chatOpenSubject.next(isOpen);

    if (isOpen) {
      // Store IDs of notifications that exist when chat is opened
      this.notificationIdsWhenOpened = new Set(
        this.notifications.map((n) => n.id)
      );

      // Reset notification count when opening
      this.newNotificationsCount = 0;

      // Mark all as read when chat is opened
      this.markAllAsRead();
    } else {
      this.notificationIdsWhenOpened.clear();
    }
  }

  // Add a method to mark all notifications as read
  markAllAsRead(): void {
    const unreadNotifications = this.notifications.filter(
      (n) => n.isRead === 0
    );

    unreadNotifications.forEach((notification) => {
      if (!notification.contextExtendPrompt) {
        this.markNotificationAsRead(notification);
      }
    });
  }

  shouldMarkAsReadOnOpen(notificationId: number): boolean {
    return this.notificationIdsWhenOpened.has(notificationId);
  }

  updateNotificationCounts(): void {
    this.readCount = this.notifications.filter((n) => n.isRead === 1).length;
    this.unreadCount = this.notifications.filter((n) => n.isRead === 0).length;

    // Keep the badge count synced with unread count
    this.newNotificationsCount = this.unreadCount;
  }

  private sortNotificationsByDate(): void {
    this.notifications.sort(
      (a, b) =>
        new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
    );
  }
}
