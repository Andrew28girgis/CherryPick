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
import { BehaviorSubject } from 'rxjs';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
})
export class NotificationsComponent
  implements OnInit, OnDestroy, AfterViewInit
{
   private chatOpenSubject = new BehaviorSubject<boolean>(false);
  public chatOpen$ = this.chatOpenSubject.asObservable();
  private intervalId: any;
  private loadedNotifications: Set<string> = new Set(); // Use notification IDs
  notifications: Notification[] = [];
  messageText = '';
  CampaignId: any;
  loaded: boolean = false;
  @Output() sidebarStateChange = new EventEmitter<{
    isOpen: boolean;
    isFullyOpen: boolean;
  }>();
  public isOpen = true;
  isNotificationsOpen = false;

  electronSideBar = false;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  constructor(
    private elementRef: ElementRef,
    public notificationService: NotificationService,
    private placesService: PlacesService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private viewManagerService: ViewManagerService // Add this
  ) {}

  showScrollButton = false;
  newNotificationsCount = 0;
  previousNotificationsLength = 0;
  scrollThreshold = 100; // pixels from bottom to consider "at bottom"

  ngOnInit(): void {
    // Set isOpen to true by default
    this.isOpen = true;

    // Subscribe to chat open state changes
    this.notificationService.chatOpen$.subscribe((isOpen) => {
      this.isOpen = isOpen;

      // When opened, scroll to bottom after a short delay
      if (this.isOpen) {
        setTimeout(() => {
          this.scrollToBottom();
        }, 300);
      }
    });

    if (this.router.url.includes('chatbot')) {
      this.electronSideBar = true;
    }

    this.activatedRoute.params.subscribe((params: any) => {
      this.CampaignId = params.campaignId;
    });
    this.notificationService.initNotifications();

    this.previousNotificationsLength =
      this.notificationService.notifications.length;

    this.intervalId = setInterval(() => {
      const prevLength = this.notificationService.notifications.length;
      this.notificationService.fetchUserNotifications();

      // After a small delay to ensure notifications are updated
      setTimeout(() => {
        const newLength = this.notificationService.notifications.length;
        // Only increment the counter if we're not at the bottom AND there are new messages
        if (newLength > prevLength) {
          if (this.isAtBottom()) {
            // If at bottom, just scroll to bottom to show new messages
            this.scrollToBottom();
          } else {
            // If not at bottom, increment counter and show scroll button
            this.newNotificationsCount += newLength - prevLength;
            this.showScrollButton = true;
          }
        }
        this.previousNotificationsLength = newLength;
      }, 300);
    }, 2000);

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

  toggleSidebar(): void {
    this.isOpen = !this.isOpen;

    // Update the notification service state
    this.notificationService.setChatOpen(this.isOpen);

    // Emit the state change to the parent component
    this.sidebarStateChange.emit({
      isOpen: this.isOpen,
      isFullyOpen: this.isOpen,
    });

    // If closing, reset scroll behavior
    if (!this.isOpen) {
      this.showScrollButton = false;
      this.newNotificationsCount = 0;
    }
  }

  scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const container = this.messagesContainer.nativeElement;

        // Use smooth scrolling behavior
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });

        // Reset notification indicators after animation completes
        setTimeout(() => {
          if (this.isAtBottom()) {
            this.showScrollButton = false;
            this.newNotificationsCount = 0;
          }
        }, 300); // Timing to match scroll animation completion
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

  choose(choice: number, notification: any): void {
    this.setNotificationLoading(notification, true, choice);

    if (choice === 1) {
      const request = {
        Name: 'DeleteJSONNotification',
        Params: { Id: notification.id },
      };

      this.placesService.GenericAPI(request).subscribe({
        next: async (response: any) => {
          console.log('API response for choice 1:', response);
          if (response) {
            try {
              await this.saveShoppingCenterData(notification.json, notification);
              
              // Trigger reload instead of calling initializeData directly
              this.viewManagerService.triggerReload();
              
            } catch (error) {
              console.error('Error saving shopping center data:', error);
            }
          }
          this.setNotificationLoading(notification, false);
          this.loadedNotifications.add(notification.id);
        },
        error: (error) => {
          console.error('Error in DeleteJSONNotification API call:', error);
          this.setNotificationLoading(notification, false);
        }
      });
    } else if (choice === 0) {
      const request = {
        Name: 'DeleteJSONNotification',
        Params: { Id: notification.id },
      };

      this.placesService.GenericAPI(request).subscribe({
        next: (response: any) => {
          // Clear loading state when done
          this.setNotificationLoading(notification, false);
          this.loadedNotifications.add(notification.id);
        },
        error: (error) => {
          console.error(
            'Error in DeleteJSONNotification API call for choice 0:',
            error
          );
          // Clear loading state on error
          this.setNotificationLoading(notification, false);
        },
      });
    }
  }

  async saveShoppingCenterData(json: any, notification: any) {
    try {
      // Parse the JSON string into an object
      const parsedJson = JSON.parse(json);

      // Add campaignId directly into that object
      parsedJson.campaignId = notification.campaignId;

      const response = await fetch(
        'https://127.0.0.1:5443/api/Enrichment/EnrichShoppingCenter',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parsedJson), // send it as one object have campaign id
        }
      );

      console.log('rr', await response.json());
      return response;
    } catch (error) {
      console.error(':x::x::x::x: Fetch error:', error);
      return null;
    }
  }

  isNotificationLoaded(notification: any): boolean {
    return this.loadedNotifications.has(notification.id);
  }

  closeSide() {
    (window as any).electronMessage.closeCRESideBrowser();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    // You could dynamically adjust UI based on screen size if needed
    this.checkScreenSize();
  }

  checkScreenSize() {
    const width = window.innerWidth;
  }

  isNotificationLoading(notification: any): boolean {
    return !!notification.isLoading;
  }

  setNotificationLoading(
    notification: any,
    isLoading: boolean,
    choice?: number
  ): void {
    if (isLoading) {
      // When starting to load, set properties immediately
      notification.isLoading = true;
      notification.loadingStartTime = Date.now();
      if (choice !== undefined) {
        notification.loadingChoice = choice;
        this.loaded = true; // Reset loaded state when starting to load
      }
    } else {
      const minLoadingTime = 1500;
      const loadingStartTime = notification.loadingStartTime || Date.now();
      const elapsedTime = Date.now() - loadingStartTime;

      if (elapsedTime >= minLoadingTime) {
        notification.isLoading = false;
      } else {
        const remainingTime = minLoadingTime - elapsedTime;
        setTimeout(() => {
          notification.isLoading = false;
        }, remainingTime);
      }
    }
  }

  isAtBottom(): boolean {
    if (!this.messagesContainer) return true;

    const container = this.messagesContainer.nativeElement;
    const scrollPosition = container.scrollTop + container.clientHeight;
    const scrollHeight = container.scrollHeight;

    // Consider "at bottom" if within threshold (e.g., 20px from the bottom)
    return scrollHeight - scrollPosition <= this.scrollThreshold;
  }

  @HostListener('scroll', ['$event'])
  onScroll(event: any): void {
    // Check if the event is coming from our messages container
    if (
      this.messagesContainer &&
      event.target === this.messagesContainer.nativeElement
    ) {
      // If we've scrolled to the bottom (or close to it), reset the notification count
      if (this.isAtBottom()) {
        this.showScrollButton = false;
        this.newNotificationsCount = 0;
      } else {
        // If we're not at the bottom, show the button if there are new messages
        if (this.newNotificationsCount > 0) {
          this.showScrollButton = true;
        }
      }
    }
  }
  // In NotificationService, add this method:
  setChatOpen(isOpen: boolean): void {
    // Use a subject to communicate between components
    this.chatOpenSubject.next(isOpen);
  }
}
