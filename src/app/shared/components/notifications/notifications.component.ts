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
import { ChangeDetectorRef, NgZone } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
// A unified item for the chat timeline
type ChatItem = {
  key: string; // unique key for trackBy
  from: 'system' | 'user';
  message: string;
  created: Date;
  // optional raw objects if you still need them:
  notification?: Notification;
  userMsg?: { message: string; createdDate: string };
};
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
    type?: string;
    overlayActive?: boolean;
  }>();

  public isOpen = true;
  isNotificationsOpen = false;

  electronSideBar = false;
  displayViewButton = true;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;
  outgoingText = '';
  isSending = false;
  sentMessages: any[] = [];
  isOverlayMode = false;
  overlayHtml: SafeHtml = '';
  private lastHtmlById = new Map<number, string>(); // id -> last html string we saw
  private currentHtmlSourceId: number | null = null;
  private currentHtmlCache = ''; // last html string we showed

  constructor(
    private elementRef: ElementRef,
    public notificationService: NotificationService,
    private placesService: PlacesService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private viewManagerService: ViewManagerService,
    private sanitizer: DomSanitizer,
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone,
  
  ) {}

  showScrollButton = false;
  newNotificationsCount = 0;
  previousNotificationsLength = 0;
  scrollThreshold = 100; // pixels from bottom to consider "at bottom"

  ngOnInit(): void {
    const testHtml = `<style>
  .shopping-centers {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
    padding: 8px;
  }
  .shopping-card {
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    box-shadow: 0 3px 8px rgba(0,0,0,0.08);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform .2s ease, box-shadow .2s ease;
  }
  .shopping-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 14px rgba(0,0,0,0.12);
  }
  .shopping-card img {
    width: 100%;
    height: 160px;
    object-fit: cover;
  }
  .shopping-card .card-body {
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .shopping-card h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }
  .shopping-card p {
    margin: 0;
    font-size: 14px;
    color: #666;
  }
  .shopping-card .tags {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .shopping-card .tag {
    background: #f3f3f3;
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 12px;
    color: #444;
  }
</style>

<div class="shopping-centers">
  <div class="shopping-card">
    <img src="https://picsum.photos/400/200?1" alt="Mall Image">
    <div class="card-body">
      <h4>Sunrise Plaza</h4>
      <p>123 Main Street, Springfield</p>
      <div class="tags">
        <span class="tag">Retail</span>
        <span class="tag">Food Court</span>
        <span class="tag">Cinema</span>
      </div>
    </div>
  </div>
  <div class="shopping-card">
    <img src="https://picsum.photos/400/200?2" alt="Mall Image">
    <div class="card-body">
      <h4>Riverside Mall</h4>
      <p>45 River Road, Riverside</p>
      <div class="tags">
        <span class="tag">Luxury</span>
        <span class="tag">Parking</span>
      </div>
    </div>
  </div>
  <div class="shopping-card">
    <img src="https://picsum.photos/400/200?3" alt="Mall Image">
    <div class="card-body">
      <h4>Downtown Center</h4>
      <p>78 City Ave, Downtown</p>
      <div class="tags">
        <span class="tag">Electronics</span>
        <span class="tag">Fashion</span>
      </div>
    </div>
  </div>
</div>
`;
    this.setOverlayHtmlFromApi(testHtml);

    this.activatedRoute.queryParamMap.subscribe((parms) => {
      const view = parms.get('View');

      if (view && !JSON.parse(view)) this.displayViewButton = false;
    });

    // Set isOpen to true by default
    this.isOpen = true;

    // Subscribe to chat open state changes (remove duplicate subscription)
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
      this.sortNotificationsByDateAsc();

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
        this.sortNotificationsByDateAsc();
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
              await this.saveShoppingCenterData(
                notification.json,
                notification
              );

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
        },
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
      notification.isLoading = true;
      notification.loadingStartTime = Date.now();
      if (choice !== undefined) {
        notification.loadingChoice = choice;
        this.loaded = true;
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

  onInputChange(event: any): void {
    this.outgoingText = event.target.innerText || '';
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    const text = this.outgoingText?.trim();
    if (!text || this.isSending) return;

    this.isSending = true;

    // Clear input immediately for better UX
    this.outgoingText = '';
    if (this.messageInput) {
      this.messageInput.nativeElement.innerText = '';
    }

    // Add message to local array
    this.sentMessages.push({
      message: text,
      createdDate: new Date().toISOString(),
    });

     this.scrollAfterRender();


    const body: any = {
      Chat: text,
    };

    this.placesService.sendmessages(body).subscribe({
      next: (response) => {
        this.isSending = false;
        setTimeout(() => this.scanAndOpenOverlayForHtml(), 0);
      },
      error: (err) => {
        console.error('sendmessage failed', err);
        this.isSending = false;
        // Restore text on error
        this.outgoingText = text;
        if (this.messageInput) {
          this.messageInput.nativeElement.innerText = text;
        }
        // Remove optimistic message on error
        this.sentMessages.pop();
      },
    });
  }

  toggleOverlayMode(): void {
    if (!this.isOpen) return;
    this.isOverlayMode = !this.isOverlayMode;

    this.sidebarStateChange.emit({
      isOpen: this.isOpen,
      isFullyOpen: this.isOpen,
      type: 'overlay',
      overlayActive: this.isOverlayMode,
    });
  }
  closeAll(): void {
    if (this.electronSideBar) {
      this.closeSide();
    } else {
      this.toggleSidebar();
    }

    // also close overlay if open
    if (this.isOverlayMode) {
      this.isOverlayMode = false;

      this.sidebarStateChange.emit({
        isOpen: this.isOpen,
        isFullyOpen: this.isOpen,
        type: 'overlay',
        overlayActive: false,
      });
    }
  }
  setOverlayHtmlFromApi(htmlFromApi: string) {
    this.overlayHtml = this.sanitizer.bypassSecurityTrustHtml(htmlFromApi);
  }

  /** Normalize any html payload to a comparable string */
  private htmlToString(raw: any): string {
    if (raw == null) return '';
    if (typeof raw === 'string') return raw;
    try {
      return String(raw);
    } catch {
      return '';
    }
  }

  /** True if notification has non-empty HTML */
  private hasHtml(n: Notification): boolean {
    const s = this.htmlToString(n?.html).trim();
    return s.length > 0;
  }

  /** Sanitize and set the overlay HTML */
  private setOverlayHtml(htmlFromApi: string): void {
    // If you need stricter validation, do it here, then trust whitelisted HTML only
    this.overlayHtml = this.sanitizer.bypassSecurityTrustHtml(htmlFromApi);
  }

  private scanAndOpenOverlayForHtml(): void {
    const list = this.notificationService?.notifications ?? [];
    if (!Array.isArray(list) || list.length === 0) return;

    // Find the newest by createdDate that has html
    let latest: Notification | null = null;
    for (const n of list) {
      if (!this.hasHtml(n)) continue;
      if (!latest) {
        latest = n;
      } else {
        const a = Date.parse(latest.createdDate);
        const b = Date.parse(n.createdDate);
        if (b > a) latest = n;
      }
    }
    if (!latest) return;

    const htmlStr = this.htmlToString(latest.html).trim();
    if (!htmlStr) return;

    const idChanged = this.currentHtmlSourceId !== latest.id;
    const htmlChanged = this.currentHtmlCache !== htmlStr;

    // Only update if different id or content
    if (idChanged || htmlChanged) {
      this.currentHtmlSourceId = latest.id;
      this.currentHtmlCache = htmlStr;
      this.lastHtmlById.set(latest.id, htmlStr);

      this.setOverlayHtmlFromApi(htmlStr);

      // Ensure the chat sidebar is visible
      if (!this.isOpen) {
        this.isOpen = true;
        this.notificationService.setChatOpen(true);
      }

      // Turn overlay on
      if (!this.isOverlayMode) {
        this.isOverlayMode = true;
      }

      // Emit overlay state
      this.sidebarStateChange.emit({
        isOpen: this.isOpen,
        isFullyOpen: this.isOpen,
        type: 'overlay',
        overlayActive: this.isOverlayMode,
      });
    }
  }

  get chatTimeline(): ChatItem[] {
    let seqCounter = 0; // optional if you want a stable sequence number

    const sys: ChatItem[] = (this.notificationService?.notifications ?? []).map(
      (n) => ({
        key: `n-${n.id}-${seqCounter++}`,
        from: 'system',
        message: n.message,
        created: new Date(n.createdDate),
        notification: n,
      })
    );

    const user: ChatItem[] = (this.sentMessages ?? []).map((m) => ({
      key: `u-${m.createdDate}-${seqCounter++}`,
      from: 'user',
      message: m.message,
      created: new Date(m.createdDate),
      userMsg: m,
    }));

    return [...sys, ...user].sort((a, b) => {
      const diff = a.created.getTime() - b.created.getTime();
      if (diff !== 0) return diff;

      // stable tie-breaker: ensures deterministic order
      return a.key.localeCompare(b.key);
    });
  }

  // optional but recommended: stable trackBy
  trackByChatItem = (_: number, item: ChatItem) => item.key;

  // (Optional) keep your notifications sorted alone, too:
  private sortNotificationsByDateAsc(): void {
    const arr = this.notificationService?.notifications;
    if (!Array.isArray(arr)) return;
    arr.sort(
      (a, b) =>
        new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
    );
  }

  private scrollAfterRender(): void {
    // Flush template changes
    this.cdRef.detectChanges();
  
    // Let the browser lay out the new DOM, then scroll
    requestAnimationFrame(() => this.scrollToBottom());
  }}
