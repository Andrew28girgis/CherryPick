import {
  Component,
  OnInit,
  ElementRef,
  HostListener,
  OnDestroy,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Notification } from 'src/app/shared/models/Notification';
import { PlacesService } from 'src/app/core/services/places.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  unreadCount: any;
  readCount: number = 0;

  private intervalId: any;
  notifications: Notification[] = [];

  @Output() dropdownOpenChange = new EventEmitter<boolean>();

  constructor(
    private elementRef: ElementRef,
    public notificationService: NotificationService,
    private placesService: PlacesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.notificationService.initNotifications();

    this.intervalId = setInterval(() => {
      this.notificationService.fetchUserNotifications();
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  toggleDropdown(): void {
    this.notificationService.dropdownVisible =
      !this.notificationService.dropdownVisible;
    this.dropdownOpenChange.emit(this.notificationService.dropdownVisible);
  }
  handleNotificationClick(notification: Notification): void {
    this.markNotificationAsRead(notification);

    if (notification.userSubmissionId) {
      const route = `/uploadOM/${notification.userSubmissionId}`;
      this.router.navigate([route]);
    }
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
      },
    });
  }
  private updateNotificationCounts(): void {
    this.readCount = this.notifications.filter(
      (notification) => notification.isRead
    ).length;
    this.unreadCount = this.notifications.filter(
      (notification) => !notification.isRead
    ).length;
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.notificationService.dropdownVisible = false;
      this.dropdownOpenChange.emit(false);
    }
  }
}
