import {
  Component,
  ChangeDetectorRef,
  ElementRef,
  HostListener,
} from '@angular/core';
import { NotificationService } from 'src/app/core/services/notification.service';
import { PlacesService } from 'src/app/core/services/places.service';
import { Notification } from 'src/app/shared/models/Notification';

@Component({
  selector: 'app-notifications-only-component',
  standalone: false,
  templateUrl: './notifications-only-component.component.html',
  styleUrl: './notifications-only-component.component.css',
})
export class NotificationsOnlyComponentComponent {
  notifications: Notification[] = [];
  unreadCount = 0;
  isOpen = false;
  private pollId: any;

  constructor(
    private notificationService: NotificationService,
    private placesService: PlacesService,
    private cd: ChangeDetectorRef,
    private hostRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.refresh();
    this.pollId = setInterval(() => this.refresh(), 3000);
  }

  ngOnDestroy(): void {
    if (this.pollId) clearInterval(this.pollId);
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  private refresh(): void {
    this.notificationService.fetchUserNotifications(undefined).subscribe({
      complete: () => this.applyFilter(),
      error: () => this.applyFilter(),
    });
  }

  private applyFilter(): void {
    const all = this.notificationService?.notifications ?? [];
    this.notifications = all
      .filter((n) => n.isEmilyChat === false)
      .sort(
        (a, b) =>
          new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
      );

    this.unreadCount = this.notifications.filter(
      (n) => !n.isRead && n.isEmilyChat === false
    ).length;
    this.cd.detectChanges();
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
        notification.isRead = true;
        this.unreadCount = this.notifications.filter((n) => !n.isRead).length;
      },
    });
  }

  markAllAsRead(): void {
    const unread = this.notifications.filter(
      (n) => n.isRead === false && n.isEmilyChat === false
    );

    unread.forEach((n) => {
      this.markNotificationAsRead(n);
    });
  }

  trackById(_: number, n: Notification): number | string {
    return n.id;
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen) return;

    const target = event.target as Node | null;
    if (target && this.hostRef.nativeElement.contains(target)) {
      return;
    }

    this.isOpen = false;
    this.cd.detectChanges();
  }
}
