import { Injectable } from '@angular/core';
import { PlacesService } from 'src/app/core/services/places.service';
import { Notification } from 'src/app/shared/models/Notification';
import { Router } from '@angular/router';
import { BehaviorSubject, tap, catchError, of, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  contactId = 0;
  notifications: Notification[] = [];
  dropdownVisible = false;
  unreadCount = 0;
  readCount = 0;
  isChatOpen = true;
  private notificationIdsWhenOpened: Set<number> = new Set();
  private chatOpenSubject = new BehaviorSubject<boolean>(true);
  public chatOpen$ = this.chatOpenSubject.asObservable();
  private mapOpenSubject = new BehaviorSubject<boolean>(false);
  private htmlOpenSubject = new BehaviorSubject<boolean>(false);
  private overlayWideSubject = new BehaviorSubject<boolean>(false);
  mapOpen$ = this.mapOpenSubject.asObservable();
  htmlOpen$ = this.htmlOpenSubject.asObservable();
  overlayWide$ = this.overlayWideSubject.asObservable();
  public newNotificationsCount = 0;
  CampaignId: any;
  params: any;
  private _openOverlaySource = new Subject<any>();
  openOverlay$ = this._openOverlaySource.asObservable();
  constructor(private placesService: PlacesService, private router: Router) {}

  getUploadRoute(notification: Notification): string | null {
    return notification.userSubmissionId
      ? `/uploadOM/${notification.userSubmissionId}`
      : null;
  }

  initNotifications(campaignId: any): void {
    this.initChatState();
    const storedContactId = localStorage.getItem('contactId');
    if (storedContactId) {
      this.contactId = +storedContactId;
      this.fetchUserNotifications(campaignId);
    }
  }

  fetchUserNotifications(campaignId: any) {
    const request = {
      Name: 'GetUserNotifications',
      Params: {
        ContactId: this.contactId,
        CampaignID: campaignId ?? null,
      },
    };

    return this.placesService.GenericAPI(request).pipe(
      tap((response: any) => {
        const previousNotifications = [...this.notifications];
        this.notifications = (response.json || []) as Notification[];
        this.sortNotificationsByDate();

        if (this.isChatOpen) {
          this.handleNewMessagesWhileChatOpen(previousNotifications);
        }

        this.updateNotificationCounts();
        this.newNotificationsCount = this.unreadCount;
      }),
      catchError((err) => {
        return of(null); // prevent breaking the stream
      })
    );
  }

  private handleNewMessagesWhileChatOpen(
    previousNotifications: Notification[]
  ): void {
    const previousIds = new Set(previousNotifications.map((n) => n.id));
    const newNotifications = this.notifications.filter(
      (notification) =>
        !previousIds.has(notification.id) && notification.isRead === false
    );

    if (newNotifications.length > 0) {
      newNotifications.forEach((notification) => {
        if (
          notification.isRead == false &&
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
        NotificationId: notification.isEmilyChat?notification.id:null,
      },
    };

    this.placesService.GenericAPI(request).subscribe({
      next: () => {
        notification.isRead = true;
        this.updateNotificationCounts();
        this.newNotificationsCount = this.unreadCount;
      },
    });
  }

  initChatState(): void {
    this.setChatOpen(true);
  }

  setChatOpen(isOpen: boolean): void {
    this.isChatOpen = isOpen;
    this.dropdownVisible = isOpen;
    this.chatOpenSubject.next(isOpen);

    if (isOpen) {
      this.notificationIdsWhenOpened = new Set(
        this.notifications.map((n) => n.id)
      );
      this.newNotificationsCount = 0;
      this.markAllAsRead();
    } else {
      this.notificationIdsWhenOpened.clear();
    }
  }

  markAllAsRead(): void {
    const unreadNotifications = this.notifications.filter(
      (n) => n.isRead === false &&n.isEmilyChat === true
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
    this.readCount = this.notifications.filter((n) => n.isRead === true).length;
    this.unreadCount = this.notifications.filter(
      (n) => n.isRead === false
    ).length;
    this.newNotificationsCount = this.unreadCount;
  }

  private sortNotificationsByDate(): void {
    this.notifications.sort(
      (a, b) =>
        new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
    );
  }
  setMapOpen(isOpen: boolean) {
    this.mapOpenSubject.next(isOpen);
    if (isOpen) {
      this.htmlOpenSubject.next(false);
    }
  }
  setHtmlOpen(isOpen: boolean) {
    this.htmlOpenSubject.next(isOpen);

    if (isOpen) {
      this.mapOpenSubject.next(false);
    }
  }
  setOverlayWide(isWide: boolean) {
    this.overlayWideSubject.next(isWide);
  }
  sendmessage(message: any) {
    const body: any = { Chat: message };
    this.placesService.sendmessages(body).subscribe({});
  }

  triggerOverlay(notification: any) {
    this._openOverlaySource.next(notification);
  }
}
