import {
  Component,
  OnInit,
  ElementRef,
  HostListener,
  OnDestroy,
  Output,
  EventEmitter,
  ViewChild,
  AfterViewInit,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
export class NotificationsComponent
  implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked
{
  private intervalId: any;
  notifications: Notification[] = [];
  messageText = '';
  CampaignId:any;

  @Output() sidebarStateChange = new EventEmitter<{
    isOpen: boolean;
    isFullyOpen: boolean;
  }>();
  public isOpen = true;

  electronSideBar = false;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  constructor(
    private elementRef: ElementRef,
    public notificationService: NotificationService,
    private placesService: PlacesService,
    private router: Router,
        private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
  
   if(this.router.url.includes('chatbot')){
    this.electronSideBar=true
   }

    this.activatedRoute.params.subscribe((params: any) => {
      this.CampaignId = params.campaignId;

    })
    this.notificationService.initNotifications();

    this.intervalId = setInterval(() => {
      this.notificationService.fetchUserNotifications();
    }, 10000);

    // Make sure we emit initial state
    this.sidebarStateChange.emit({
      isOpen: true,
      isFullyOpen: this.isOpen,
    });

    // When component initializes, scroll to bottom after a short delay
    setTimeout(() => {
      this.scrollToBottom();
    }, 100);

    this.checkScreenSize();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Reset state when component is destroyed
    this.sidebarStateChange.emit({
      isOpen: false,
      isFullyOpen: false,
    });
  }

  ngAfterViewInit(): void {
    // Scroll to bottom after view is initialized
    this.scrollToBottom();
  }

  ngAfterViewChecked(): void {
    // Scroll to bottom after view updates
    this.scrollToBottom();
  }

  toggleSidebar(): void {
    // Toggle the sidebar state
    this.isOpen = !this.isOpen;

    // Emit the state change
    this.sidebarStateChange.emit({
      isOpen: true, // Tab is always visible when component is shown
      isFullyOpen: this.isOpen,
    });

    console.log('Sidebar state:', this.isOpen);

    // If opening the sidebar, scroll to bottom after a short delay for animations
    if (this.isOpen) {
      setTimeout(() => {
        this.scrollToBottom();
      }, 300);
    }
  }

  scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
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
      this.isOpen &&
      target &&
      chatDropdown &&
      !chatDropdown.contains(target)
    ) {
      // Close the dropdown
      this.notificationService.setChatOpen(false); // Use new method instead of direct assignment
      this.isOpen = false;
      this.sidebarStateChange.emit({
        isOpen: true, // Tab remains visible
        isFullyOpen: false, // Panel is now closed
      });
    }
  }
  choose(choice: any, notification: any): void {
     
    if (choice === 1) {
      const request = {
        Name: 'DeleteJSONNotification',
        Params: { Id: notification.id }, 
      };

      this.placesService.GenericAPI(request).subscribe({
        next: async (response: any) => {
          console.log('API response for choice 1:', response);
          if (response) {
            await this.saveShoppingCenterData(notification.json,notification);
          } else {
            console.warn('Empty response received from API');
          }
        },
        error: (error) => {
          console.error('Error in DeleteJSONNotification API call:', error);
        },
        complete: () => {
          console.log('DeleteJSONNotification request completed');
        }
      });
    } else if (choice === 0) {
      const request = {
        Name: 'DeleteJSONNotification',
        Params: { Id: notification.id },  
      };

      this.placesService.GenericAPI(request).subscribe({
        next: (response: any) => {
        },
      });
    }
  }

  async saveShoppingCenterData(json: any,notification:any) {
    try {
      const response = await fetch(
        "https://127.0.0.1:5443/api/Enrichment/EnrichShoppingCenter",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: JSON.parse(json),
            campaignId: notification.campaignId
          })
        }
      );
      console.log("rr", await response.json());
      return response;
    } catch (error) {
      console.error(":x::x::x::x: Fetch error:", error);
      return null;
    }
  }
  closeSide() {
    (window as any).electronMessage.closeCRESideBrowser()
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    // You could dynamically adjust UI based on screen size if needed
    this.checkScreenSize();
  }

  checkScreenSize() {
    const width = window.innerWidth;
    // You can add logic here if needed to further adjust the UI
    // This will automatically work with the CSS media queries added above
  }
}
