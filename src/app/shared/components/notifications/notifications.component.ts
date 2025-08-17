import {
  Component,
  OnInit,
  ElementRef,
  HostListener,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Notification } from 'src/app/shared/models/Notification';
import { PlacesService } from 'src/app/core/services/places.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private intervalId: any;
  notifications: Notification[] = [];
  messageText = '';

  @Output() dropdownOpenChange = new EventEmitter<boolean>();

  // Add this property to your component
  public isVisible = false;

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
    // Toggle the dropdown visibility state
    const wasVisible = this.notificationService.dropdownVisible;
    this.notificationService.setChatOpen(!wasVisible); // Use new method instead of direct assignment
    this.isVisible = this.notificationService.dropdownVisible;

    // Emit the event
    this.dropdownOpenChange.emit(this.notificationService.dropdownVisible);

    console.log('Dropdown visible state:', this.isVisible);

    // If opening the dropdown
    if (this.isVisible) {
      if (this.notificationService.unreadCount > 0) {
        this.markExistingAsRead();
      }

      // Scroll to bottom
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    }
  }

  scrollToBottom(): void {
    try {
      const chatContainer = this.elementRef.nativeElement.querySelector(
        '.chat-messages-container'
      );
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  handleNotificationClick(notification: Notification): void {
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
        this.notificationService.updateNotificationCounts();
      },
      error: (err) => {
        console.error('Error marking notification as read:', err);
      },
    });
  }

  markExistingAsRead(): void {
    const unreadNotifications = this.notificationService.notifications.filter(
      (n) => !n.isRead && this.notificationService.shouldMarkAsReadOnOpen(n.id)
    );

    if (unreadNotifications.length === 0) {
      return;
    }

    // Create array of promises to mark existing notifications as read
    const markPromises = unreadNotifications.map((notification) => {
      return new Promise<void>((resolve) => {
        const request = {
          Name: 'UpdateNotification',
          Params: {
            NotificationId: notification.id,
          },
        };

        this.placesService.GenericAPI(request).subscribe({
          next: () => {
            notification.isRead = 1;
            resolve();
          },
          error: () => {
            resolve(); // Still resolve even on error to continue processing
          },
        });
      });
    });

    // After all notifications are processed, update counts
    Promise.all(markPromises).then(() => {
      this.notificationService.updateNotificationCounts();
    });
  }

  markAllAsRead(): void {
    const unreadNotifications = this.notificationService.notifications.filter(
      (n) => !n.isRead
    );

    if (unreadNotifications.length === 0) {
      return;
    }

    // Create array of promises to mark all notifications as read
    const markPromises = unreadNotifications.map((notification) => {
      return new Promise<void>((resolve) => {
        const request = {
          Name: 'UpdateNotification',
          Params: {
            NotificationId: notification.id,
          },
        };

        this.placesService.GenericAPI(request).subscribe({
          next: () => {
            notification.isRead = 1;
            resolve();
          },
          error: () => {
            resolve(); // Still resolve even on error to continue processing
          },
        });
      });
    });

    // After all notifications are processed, update counts
    Promise.all(markPromises).then(() => {
      this.notificationService.updateNotificationCounts();
    });
  }

  // This would be implemented when sending is enabled
  sendMessage(): void {
    // Currently disabled
    console.log('Message sending is currently disabled');
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const chatButton =
      this.elementRef.nativeElement.querySelector('.chat-button');
    const chatDropdown =
      this.elementRef.nativeElement.querySelector('.chat-dropdown');

    // Check if the click was on the chat button
    if (chatButton && chatButton.contains(target)) {
      // The toggleDropdown method will be called by the click binding
      // so we don't need to do anything here
      return;
    }

    // If the dropdown is open and the click is outside both the button and dropdown
    if (
      this.isVisible &&
      target &&
      chatDropdown &&
      !chatDropdown.contains(target)
    ) {
      // Close the dropdown
      this.notificationService.setChatOpen(false); // Use new method instead of direct assignment
      this.isVisible = false;
      this.dropdownOpenChange.emit(false);
    }
  }
}
