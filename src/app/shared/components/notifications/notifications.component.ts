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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Notification } from 'src/app/shared/models/Notification';
import { PlacesService } from 'src/app/core/services/places.service';
import { FormsModule } from '@angular/forms';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';
import { ChangeDetectorRef, NgZone } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BehaviorSubject, debounceTime, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

type ChatItem = {
  key: string;
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
   private awaitingResponse = false;
  private preSendIds = new Set<string | number>(); // ids present before send
  private pendingSentText = ''; // optional: to match echo text
  private shownForIds = new Set<string | number>(); // avoid re-opening same overlay
  private scanTrigger$ = new BehaviorSubject<void>(undefined);
  private scanSub?: import('rxjs').Subscription;
 private typingTempId = '__typing__'; // a stable pseudo id for trackBy
isTyping = false;
private typingHideTimer?: any; // to auto-hide after a long delay, just in case

  notifications: Notification[] = [];
  messageText = '';
  CampaignId: any;
  loaded = false;
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
  private lastSentMessageNotificationBaseline = 0;

  constructor(
    private elementRef: ElementRef,
    public notificationService: NotificationService,
    private placesService: PlacesService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private viewManagerService: ViewManagerService,
    private sanitizer: DomSanitizer,
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  showScrollButton = false;
  newNotificationsCount = 0;
  previousNotificationsLength = 0;
  scrollThreshold = 100; // pixels from bottom to consider "at bottom"

  ngOnInit(): void {
    this.activatedRoute.queryParamMap.subscribe((parms) => {
      const view = parms.get('View');
      if (view && !JSON.parse(view)) this.displayViewButton = false;
    });

    this.isOpen = true;

    this.notificationService.chatOpen$.subscribe((isOpen) => {
      this.isOpen = isOpen;
      if (this.isOpen) setTimeout(() => this.scrollToBottom(), 300);
    });

    if (this.router.url.includes('chatbot')) this.electronSideBar = true;

    this.activatedRoute.params.subscribe((params: any) => {
      this.CampaignId = params.campaignId;
    });

    this.notificationService.initNotifications();
    this.previousNotificationsLength =
      this.notificationService.notifications.length;

    // Debounced scan
    this.scanSub = this.scanTrigger$
      .pipe(debounceTime(120))
      .subscribe(() => this.scanAndOpenOverlayForHtml());

    // Polling
    this.intervalId = setInterval(() => {
      const prevLength = this.notificationService.notifications.length;
      this.notificationService.fetchUserNotifications();
      this.sortNotificationsByDateAsc();

      setTimeout(() => {
        const newLength = this.notificationService.notifications.length;

        if (newLength > prevLength) {
          if (this.isAtBottom()) this.scrollToBottom();
          else {
            this.newNotificationsCount += newLength - prevLength;
            this.showScrollButton = true;
          }
        }
        this.previousNotificationsLength = newLength;
        this.sortNotificationsByDateAsc();

        // trigger scan after updates
        this.scanTrigger$.next();
      }, 200);
    }, 2000);

    this.sidebarStateChange.emit({ isOpen: true, isFullyOpen: this.isOpen });
    setTimeout(() => this.scrollToBottom(), 100);
    this.checkScreenSize();
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.scanSub?.unsubscribe?.();
    this.sidebarStateChange.emit({ isOpen: false, isFullyOpen: false });
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

    // === TURN START (ID SNAPSHOT) ===
    this.preSendIds.clear();
    for (const n of this.notificationService?.notifications ?? []) {
      const idKey = typeof n.id === 'number' ? n.id : String(n.id);
      this.preSendIds.add(idKey);
    }
    this.pendingSentText = text;
    this.shownForIds.clear();
    this.awaitingResponse = true;

    // Clear input immediately
    this.outgoingText = '';
    if (this.messageInput) this.messageInput.nativeElement.innerText = '';

    // Optimistic local bubble
    this.sentMessages.push({
      message: text,
      createdDate: new Date().toISOString(),
    });
    this.scrollAfterRender();
    this.showTyping();

    const body: any = { Chat: text };
    this.placesService.sendmessages(body).subscribe({
      next: () => {
        this.isSending = false;
        this.hideTyping();
        this.scanTrigger$.next();
      },
      error: (err) => {
        console.error('sendmessage failed', err);
        this.isSending = false;

        // restore text
        this.outgoingText = text;
        if (this.messageInput) this.messageInput.nativeElement.innerText = text;

        // remove optimistic bubble
        this.sentMessages.pop();

        // cancel turn
        this.awaitingResponse = false;
        this.preSendIds.clear();
        this.pendingSentText = '';
        this.shownForIds.clear();
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
    const htmlContent = this.htmlToString(n?.html).trim();
    return htmlContent.length > 0 && htmlContent !== n?.message?.trim();
  }

  private scanAndOpenOverlayForHtml(): void {
    if (!this.awaitingResponse) return;
  
    const list = this.notificationService?.notifications ?? [];
    if (!Array.isArray(list) || list.length === 0) return;
  
    const idKeyOf = (n: Notification) => (typeof n.id === 'number') ? n.id : String(n.id);
    const isUser   = (n: Notification) => (n.role === true || n.role === 1);
    const isSystem = (n: Notification) => !isUser(n);
    const isNewSinceSend = (n: Notification) => !this.preSendIds.has(idKeyOf(n));
    const matchesPendingText = (n: Notification) => ((n.message ?? '').trim() === this.pendingSentText.trim());
  
    // 1) Wait for the *user echo* (new user notif matching this turn)
    let userEcho: Notification | undefined;
    for (const n of list) {
      if (isUser(n) && isNewSinceSend(n) && matchesPendingText(n)) {
        userEcho = n; break;
      }
    }
    if (!userEcho) return;
  
    // 2) First new *system* notif with HTML = reply candidate
    let candidate: Notification | undefined;
    for (const n of list) {
      if (isSystem(n) && isNewSinceSend(n) && this.hasHtml(n)) {
        candidate = n; break;
      }
    }
    if (!candidate) return;
  
    const candId = idKeyOf(candidate);
    if (this.shownForIds.has(candId)) return;
  
    const htmlStr = this.htmlToString(candidate.html).trim();
    if (!htmlStr) return;
  
    // Finish the turn
    this.shownForIds.add(candId);
    this.awaitingResponse = false;
  
    // Stop typing dots (if in use)
    this.hideTyping?.();
  
    // Update overlay content
    this.currentHtmlSourceId = candidate.id as any;
    this.currentHtmlCache = htmlStr;
    this.setOverlayHtmlFromApi(htmlStr);
  
    // Ensure chat panel + overlay are visible
    if (!this.isOpen) {
      this.isOpen = true;
      this.notificationService.setChatOpen(true);
    }
    if (!this.isOverlayMode) this.isOverlayMode = true;
  
    this.sidebarStateChange.emit({
      isOpen: this.isOpen,
      isFullyOpen: this.isOpen,
      type: 'overlay',
      overlayActive: this.isOverlayMode,
    });
  
    // 🔑 CRUCIAL: wait for CD + stable view, THEN scroll to the exact row
    this.cdRef.detectChanges();
    this.ngZone.onStable.pipe(take(1)).subscribe(() => {
      this.scrollMessageIntoView(candId);         // first attempt
      // small delayed retry in case images/fonts shift layout
      setTimeout(() => this.scrollMessageIntoView(candId), 80);
      requestAnimationFrame(() => this.scrollMessageIntoView(candId));
    });
  }
  
  

  get chatTimeline(): ChatItem[] {
    let seqCounter = 0; // optional if you want a stable sequence number

    const notificationItems: ChatItem[] = (
      this.notificationService?.notifications ?? []
    ).map((n) => ({
      key: `n-${n.id}-${seqCounter++}`,
      from: n.role === true || n.role === 1 ? 'user' : 'system',
      message: n.message,
      created: new Date(n.createdDate),
      notification: n,
    }));

    const userNotificationMessages = new Set(
      (this.notificationService?.notifications ?? [])
        .filter((n) => n.role === true || n.role === 1)
        .map((n) => n.message.trim().toLowerCase())
    );

    const sentMessageItems: ChatItem[] = (this.sentMessages ?? [])
      .filter(
        (m) => !userNotificationMessages.has(m.message.trim().toLowerCase())
      )
      .map((m) => ({
        key: `u-${m.createdDate}-${seqCounter++}`,
        from: 'user',
        message: m.message,
        created: new Date(m.createdDate),
        userMsg: m,
      }));

    return [...notificationItems, ...sentMessageItems].sort((a, b) => {
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
  }

  onOverlayBackdropClick(event: MouseEvent): void {
    // Any click directly on the backdrop should close overlay
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
  private showTyping() {
    if (this.isTyping) return;
    this.isTyping = true;
  
    // safety auto-hide (e.g., after 30s) in case no reply arrives
    clearTimeout(this.typingHideTimer);
    this.typingHideTimer = setTimeout(() => this.hideTyping(), 30000);
  
    // cause a render & scroll if you're at bottom
    this.cdRef.detectChanges();
    if (this.isAtBottom()) this.scrollToBottom();
  }
  
  private hideTyping() {
    if (!this.isTyping) return;
    this.isTyping = false;
    clearTimeout(this.typingHideTimer);
    this.cdRef.detectChanges();
  }
  private scrollMessageIntoView(targetId: string | number): void {
    try {
      if (!this.messagesContainer) return;
      const container: HTMLElement = this.messagesContainer.nativeElement;
      const id = typeof targetId === 'number' ? `msg-${targetId}` : `msg-${String(targetId)}`;
  
      // Prefer offsetTop so transforms/positioning don’t affect math
      const el = container.querySelector<HTMLElement>(`#${CSS?.escape ? CSS.escape(id) : id}`);
      if (!el) return;
  
      // Compute desired top so the message sits slightly above the bottom
      const targetTop = el.offsetTop - Math.max(0, container.clientHeight - el.offsetHeight - 40);
  
      container.scrollTo({ top: targetTop, behavior: 'smooth' });
  
      // If we effectively reached bottom, clear badges
      setTimeout(() => {
        if (this.isAtBottom()) {
          this.showScrollButton = false;
          this.newNotificationsCount = 0;
        }
      }, 350);
    } catch {
      // fallback
      this.scrollToBottom();
    }
  }
  
  
}
