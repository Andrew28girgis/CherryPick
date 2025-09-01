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
  Input,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Notification } from 'src/app/shared/models/Notification';
import { PlacesService } from 'src/app/core/services/places.service';
import { FormsModule } from '@angular/forms';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';
import { ChangeDetectorRef, NgZone } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BehaviorSubject, debounceTime, Subscription } from 'rxjs';
import { take, finalize, filter } from 'rxjs/operators';
import html2pdf from 'html2pdf.js';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

type ChatFrom = 'user' | 'system' | 'ai';

type ChatItem = {
  key: string;
  from: 'user' | 'system' | 'ai';
  message: string;
  created: Date;
  // optional raw objects if you still need them:
  notification?: Notification;
  userMsg?: { message: string; createdDate: string };
};
declare global {
  interface Window {
    electronAPI?: { chatbotOverlayVisible: (visible: boolean) => void };
  }
}
export {};

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
  private lastUserMessageId: number | null = null;

  notifications: Notification[] = [];
  messageText = '';
  CampaignId: any;
  loaded = false;
  @Input() isChatbotRoute = false;
  @Output() overlayStateChange = new EventEmitter<boolean>(); // optional, only if you want to sync shell's overlay-active
  @Output() sidebarStateChange = new EventEmitter<{
    isOpen: boolean;
    isFullyOpen: boolean;
    type?: string;
    overlayActive?: boolean;
    isChatbotRoute?: boolean;
  }>();

  public isOpen = true;
  isNotificationsOpen = false;

  electronSideBar = false;
  displayViewButton = true;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;
  @ViewChild('contentToDownload') contentToDownload!: ElementRef;
  @ViewChild('notificationModal') notificationModal!: TemplateRef<any>;

  outgoingText = '';
  isSending = false;
  sentMessages: any[] = [];
  isOverlayMode = false;
  overlayHtml: SafeHtml = '';
  showPdfTitleDialog = false;
  pdfTitle = '';
  isGeneratingPdf = false;

  private currentHtmlSourceId: number | null = null;
  private currentHtmlCache = ''; // last html string we showed
  public selectedNotification: Notification | null = null;
  public isSaving = false; // component-level flag
  public showSaveToast = false;
  pdfId: string | number = '';
  currentMessage: string = '';
  private wasAtBottomBeforeUpdate = false;

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
    private modalService: NgbModal
  ) {}

  showScrollButton = false;
  newNotificationsCount = 0;
  previousNotificationsLength = 0;
  scrollThreshold = 100; // pixels from bottom to consider "at bottom"
  private chatOpenSub?: Subscription;

  ngOnInit(): void {
    this.chatOpenSub = this.notificationService.chatOpen$.subscribe((open) => {
      if (this.isOpen !== open) {
        this.isOpen = open;

        // keep parent/host in sync if you rely on this
        this.sidebarStateChange.emit({
          isOpen: this.isOpen,
          isFullyOpen: this.isOpen,
        });

        if (open) {
          // optional: ensure it scrolls when opened from avatar
          setTimeout(() => this.scrollToBottom(), 0);
        }
      }
    });
    this.isChatbotRoute = /^\/emily-chatsbot(\/|$)/.test(this.router.url);

    // auto-open in route mode
    if (this.isChatbotRoute) {
      this.isOpen = true;
      setTimeout(() => this.scrollToBottom(), 0);
    }

    // keep it updated on internal navigations
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        const url = e.urlAfterRedirects || e.url;
        this.isChatbotRoute = /^\/emily-chatsbot(\/|$)/.test(url);
      });

    this.notificationService.initNotifications(this.CampaignId);
    this.previousNotificationsLength =
      this.notificationService.notifications.length;

    // Debounced scan
    this.scanSub = this.scanTrigger$
      .pipe(debounceTime(120))
      .subscribe(() => this.scanAndOpenOverlayForHtml());

    // Polling
    this.intervalId = setInterval(() => {
// remember position BEFORE updating list
this.wasAtBottomBeforeUpdate = this.isAtBottom();

const prevLength = this.notificationService.notifications.length;
this.notificationService.fetchUserNotifications(this.CampaignId);
this.sortNotificationsByDateAsc();

setTimeout(() => {
  const newLength = this.notificationService.notifications.length;

  if (newLength > prevLength) {
    // only auto-scroll if user was at bottom BEFORE new message
    if (this.wasAtBottomBeforeUpdate) {
      this.ngZone.onStable.pipe(take(1)).subscribe(() => {
        this.scrollToBottom();
      });
    } else {
      this.newNotificationsCount += newLength - prevLength;
      this.showScrollButton = true;
    }
  }

  this.previousNotificationsLength = newLength;
  this.sortNotificationsByDateAsc();

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
    clearTimeout(this.typingHideTimer);
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

        container.scrollTop = container.scrollHeight;

        // Check immediately if we're at bottom and reset indicators
        if (this.isAtBottom()) {
          this.showScrollButton = false;
          this.newNotificationsCount = 0;
        }
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
  isAtTop(): boolean {
    if (!this.messagesContainer) return false;
    const container = this.messagesContainer.nativeElement;
    return container.scrollTop === 0;
  }
  private handleNewMessage(newMessage: Notification): void {
    const atBottom = this.isAtBottom();
    const atTop = this.isAtTop();
  
    // Case 1: If it's a reply to my last sent message → always scroll
    // if (this.lastUserMessageId && newMessage.replyToId === this.lastUserMessageId) {
    //   this.scrollToBottom();
    //   this.lastUserMessageId = null; // reset
    //   return;
    // }
  
    // Case 2: If user is at bottom OR at top → scroll to bottom
    if (atBottom || atTop) {
      this.scrollToBottom();
      return;
    }
  
    // Case 3: User is in the middle → show "scroll down" button
    this.newNotificationsCount++;
    this.showScrollButton = true;
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
    this.notificationService.setChatOpen(this.isOpen);
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
        this.lastUserMessageId = Math.max(
          ...this.notifications.map((n) => n.id)
        );
        this.awaitingResponse = true;
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
    if (this.isOverlayMode == false) {
      if (this.electronSideBar) {
        (window as any).electronMessage.maxmizeCRESideBrowser();
      }
    } else if (this.isOverlayMode == true) {
      if (this.electronSideBar) {
        (window as any).electronMessage.minimizeCRESideBrowser();
      }
    }
    this.overlayStateChange.emit(this.isOverlayMode); // optional
    this.sidebarStateChange.emit({
      isOpen: this.isOpen,
      isFullyOpen: this.isOpen,
      type: 'overlay',
      overlayActive: this.isOverlayMode,
      isChatbotRoute: this.isChatbotRoute,
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
      if (this.electronSideBar) {
        (window as any).electronMessage.minimizeCRESideBrowser();
      }
      this.isOverlayMode = false;
      this.overlayStateChange.emit(false); // optional

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

    const idKeyOf = (n: Notification) =>
      typeof n.id === 'number' ? n.id : String(n.id);
    const isUser = (n: Notification) =>
      n.notificationCategoryId === true || n.notificationCategoryId === 1;
    const isSystem = (n: Notification) => !isUser(n);
    const isNewSinceSend = (n: Notification) =>
      !this.preSendIds.has(idKeyOf(n));
    const matchesPendingText = (n: Notification) =>
      (n.message ?? '').trim() === this.pendingSentText.trim();

    // 1) Find user echo
    const userEcho = list.find(
      (n) => isUser(n) && isNewSinceSend(n) && matchesPendingText(n)
    );
    if (!userEcho) return;

    // 2) Find candidate system notification with HTML
    const candidate = list.find(
      (n) => isSystem(n) && isNewSinceSend(n) && this.hasHtml(n)
    );
    if (!candidate) return;

    const candId = idKeyOf(candidate);
    if (this.shownForIds.has(candId)) return;

    const htmlStr = this.htmlToString(candidate.html).trim();
    if (!htmlStr) return;

    // Mark shown and stop typing dots
    this.shownForIds.add(candId);
    this.awaitingResponse = false;
    this.hideTyping?.();

    // 🔑 Store candidate for overlay use
    this.selectedNotification = candidate;

    // Set overlay HTML
    this.currentHtmlSourceId = candidate.id as any;
    this.currentHtmlCache = htmlStr;
    this.setOverlayHtmlFromApi(htmlStr);

    // Ensure overlay visible
    if (!this.isOpen) {
      this.isOpen = true;
      this.notificationService.setChatOpen(true);
    }
    if (!this.isOverlayMode) {
      this.isOverlayMode = true;
      if (this.electronSideBar) {
        (window as any).electronMessage.maxmizeCRESideBrowser();
      }
    }

    this.sidebarStateChange.emit({
      isOpen: this.isOpen,
      isFullyOpen: this.isOpen,
      type: 'overlay',
      overlayActive: this.isOverlayMode,
    });

    // Scroll message into view after CD stabilizes
    this.cdRef.detectChanges();
    this.ngZone.onStable.pipe(take(1)).subscribe(() => {
      this.scrollMessageIntoView(candId);
      setTimeout(() => this.scrollMessageIntoView(candId), 80);
      requestAnimationFrame(() => this.scrollMessageIntoView(candId));
    });
  }

  get chatTimeline(): ChatItem[] {
    let seqCounter = 0;

    const notificationItems: ChatItem[] = (
      this.notificationService?.notifications ?? []
    ).map((n) => ({
      key: `n-${n.id}-${seqCounter++}`,
      from: this.mapCategoryToFrom(n.notificationCategoryId),
      message: n.message,
      created: new Date(n.createdDate),
      notification: n,
    }));

    // unchanged: “user” notifications are those with id === true | 1
    const userNotificationMessages = new Set(
      (this.notificationService?.notifications ?? [])
        .filter(
          (n) =>
            n.notificationCategoryId === true ||
            Number(n.notificationCategoryId) === 1
        )
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
      if (this.electronSideBar) {
        (window as any).electronMessage.minimizeCRESideBrowser();
      }
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
      const id =
        typeof targetId === 'number'
          ? `msg-${targetId}`
          : `msg-${String(targetId)}`;

      // Prefer offsetTop so transforms/positioning don’t affect math
      const el = container.querySelector<HTMLElement>(
        `#${CSS?.escape ? CSS.escape(id) : id}`
      );
      if (!el) return;

      // Compute desired top so the message sits slightly above the bottom
      const targetTop =
        el.offsetTop -
        Math.max(0, container.clientHeight - el.offsetHeight - 40);

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

  private mapCategoryToFrom(categoryId: unknown): ChatFrom {
    const cat = Number(categoryId); // handles number | string | boolean
    if (categoryId === true || cat === 1) return 'user';
    if (cat === 3) return 'ai';
    return 'system';
  }

  saveNotification(notification: Notification): void {
    if (!notification?.id) return;

    this.isSaving = true;

    this.placesService.savemessages(notification.id).subscribe({
      next: (res) => {
        // console.log('campaign is from electronnnnn', res);

        if (+notification.taskId === 3) {
          this.getCampaigns();
        }

        notification.isEndInsertion = 1;

        // show spinner for 1s then hide
        this.showSaveToast = true;
        this.cdRef.detectChanges();
        setTimeout(() => {
          this.showSaveToast = false;
          this.cdRef.detectChanges();
        }, 2500);

        this.isSaving = false;
      },
      error: (err) => {
        console.error('Save failed', err);
        this.isSaving = false;
        this.cdRef.detectChanges();
      },
    });
  }

  getCampaigns(): void {
    const request = { Name: 'GetCampaignsNeedUrls', Params: {} };
    this.placesService.GenericAPI(request).subscribe({
      next: (response: any) => {
        console.log('GetCampaignsNeedUrls response:', response);

        // Safely grab the first id from response.json
        const id = response?.json?.[0]?.id;
        // console.log(id,'idddddd');

        if (id == null) {
          console.error('No id found in response.json');
          return;
        }

        try {
          // console.log(id,'iddddddelectronnnn');

          (window as any).electronMessage.getLinksFromGoogle(
            '',
            localStorage.getItem('token'),
            id // <-- send only the id
          );
        } catch (e) {
          console.error('electronMessage.getLinksFromGoogle failed', e);
        }
      },
      error: (err) => {
        console.error('GetCampaignsNeedUrls failed', err);
      },
    });
  }

  get canShowSave(): boolean {
    const n = this.selectedNotification;
    if (!n) return false;

    // convert string -> number
    const taskId = +n.taskId;

    // normalize isEndInsertion (could be 0/1, "0"/"1", boolean)
    const isEnd =
      n.isEndInsertion === true ||
      n.isEndInsertion === 1 ||
      n.isEndInsertion === '1';

    return (taskId === 2 || taskId === 3) && !isEnd;
  }

  loadHtmlInsideNewWindow(notification: Notification): void {
    if (this.electronSideBar) {
      (window as any).electronMessage.loadHtmlInsideNewWindow(
        notification.html
      );
    } else {
      this.isOverlayMode = true;
      this.overlayHtml = notification.html;
    }
    console.log(notification.id, 'notification.id');
    this.selectedNotification = notification;
  }
  async downloadPDF(): Promise<void> {
    if (!this.contentToDownload) {
      console.error('No container found for PDF export');
      return;
    }

    const container = this.contentToDownload.nativeElement as HTMLElement;

    // 1) Fix cross-origin images
    const imgs = Array.from(
      container.querySelectorAll('img')
    ) as HTMLImageElement[];
    await Promise.all(
      imgs.map(async (img) => {
        try {
          if (
            /^https?:\/\//.test(img.src) &&
            !img.src.startsWith(window.location.origin)
          ) {
            img.src = await this.toDataURL(img.src);
          }
        } catch (err) {
          console.warn('Could not embed image:', img.src, err);
        }
      })
    );

    // 2) File name
    const filename = `Emily-Report-${Date.now()}.pdf`;

    // 3) Options
    const h2cOpts: any = { scale: 2, useCORS: true, allowTaint: false };
    const jsPDFOpts: any = {
      unit: 'pt',
      format: 'a4',
      orientation: 'portrait',
    };

    // 4) Generate
    await html2pdf()
      .from(container)
      .set({
        filename,
        margin: 15,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: h2cOpts,
        jsPDF: jsPDFOpts,
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .save();
  }

  // helper
  private async toDataURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = url;
    });
  }
  showPdfDialog(): void {
    this.pdfTitle = `Emily-Report-${new Date().toLocaleDateString()}`;
    this.showPdfTitleDialog = true;
  }

  cancelPdfDialog(): void {
    this.showPdfTitleDialog = false;
    this.pdfTitle = '';
  }

  confirmPdfDownload(): void {
    if (!this.pdfTitle.trim()) return;
    this.showPdfTitleDialog = false;
    this.downloadPDF();
  }

  saveTitleInNotification(): void {
    this.isSaving = true;

    const request = {
      Name: 'SetTitleInNotification',
      Params: {
        Id: this.selectedNotification?.id,
        Title: this.pdfTitle.trim(),
      },
    };

    this.placesService.GenericAPI(request).subscribe({
      next: (res) => {
        console.log('SetTitleInNotification response:', res);

        // Optionally update locally
        (this.selectedNotification as any).title = this.pdfTitle.trim();

        this.showSaveToast = true;
        this.cdRef.detectChanges();
        setTimeout(() => {
          this.showSaveToast = false;
          this.cdRef.detectChanges();
        }, 2500);

        this.isSaving = false;
        this.pdfTitle = ''; // reset
      },
      error: (err) => {
        console.error('SetTitleInNotification failed', err);
        this.isSaving = false;
      },
    });
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['isChatbotRoute']?.currentValue === true) {
      // open the panel and start in non-overlay mode (chat = 100%)
      this.isOpen = true;
      // don't force overlay here; overlay should be toggled by your existing button/action
    }
  }
  showprompt(message: any) {
    this.currentMessage = message;

    const modalRef = this.modalService.open(this.notificationModal, {
      size: 'md',
      centered: true,
    });
  }

  sendPromptMessage(message: any) {
    const body: any = { Chat: message };
    this.placesService.sendmessages(body).subscribe({});
  }
  isAutomationLoading(item: ChatItem, index: number): boolean {
    // ✅ Match with .includes instead of strict equality
    if (!item.message || !item.message.includes('I am searching the web now for your request')) {
      return false;
    }
  
    // If there is a next message after this one, stop animation
    const nextItem = this.chatTimeline[index + 1];
    return !nextItem;
  }
  
}
