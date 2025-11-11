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
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Notification } from 'src/app/shared/models/Notification';
import { PlacesService } from 'src/app/core/services/places.service';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef, NgZone } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BehaviorSubject, debounceTime, Subscription } from 'rxjs';
import { take, filter } from 'rxjs/operators';
import html2pdf from 'html2pdf.js';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefreshService } from 'src/app/core/services/refresh.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ChatModalService } from 'src/app/core/services/chat-modal.service';

// import { WebSocketService } from './../../../core/services/notification-signalr.service';

type ChatFrom = 'user' | 'system' | 'ai';

type ChatItem = {
  key: string;
  from: 'user' | 'system' | 'ai';
  message: string;
  created: Date;
  notification?: Notification;
  userMsg?: {
    message: string;
    createdDate: string;
    status: 'sending' | 'sent' | 'failed';
  };
};
declare global {
  interface Window {
    electronAPI?: { chatbotOverlayVisible: (visible: boolean) => void };
  }
}
export {};

@Component({
  selector: 'app-floating-chat-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './floating-chat-notifications.component.html',
  styleUrls: ['./floating-chat-notifications.component.css'],
})
export class FloatingChatNotificationsComponent
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
  @ViewChild('overlayModal') overlayModal!: TemplateRef<any>;
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

  private overlayModalRef: any;
  private currentHtmlSourceId: number | null = null;
  private currentHtmlCache = ''; // last html string we showed
  public selectedNotification: Notification | null = null;
  public isSaving = false; // component-level flag
  public showSaveToast = false;
  currentMessage: string = '';
  private wasAtBottomBeforeUpdate = false;
  // ADD — sticky bottom + observers
  private mo?: MutationObserver;
  private ro?: ResizeObserver;
  private wasSticky = true;

  private readonly BOTTOM_STICKY_THRESHOLD = 28;
  showingMap: boolean = false;
  isoverlaywide: boolean = false;
  scanEnabled: boolean = true;
  private wsConnected = false;
  private knownIds = new Set<string | number>();
  campaignId: any;
  shoppingCenterId: any;
  organizationId: any;
  contactId: any;
  conversationId: any;
  constructor(
    private elementRef: ElementRef,
    public notificationService: NotificationService,
    private placesService: PlacesService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone,
    private modalService: NgbModal,
    public activeModal: NgbActiveModal,
    private refreshService: RefreshService,
    private chatModal: ChatModalService
  ) {}

  showScrollButton = false;
  newNotificationsCount = 0;
  previousNotificationsLength = 0;
  scrollThreshold = 100;
  private chatOpenSub?: Subscription;
  public isOverlayhtml = false;
  private subs: Subscription[] = [];

  ngOnInit(): void {
    if (this.router.url.includes('chatbot')) {
      this.electronSideBar = true;
    }

    this.isChatbotRoute = /^\/emily-chatsbot(\/|$)/.test(this.router.url);
    if (this.isChatbotRoute) {
      this.isOpen = true;
      setTimeout(() => this.scrollToBottom(), 0);
    }

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        const url = e.urlAfterRedirects || e.url;
        this.isChatbotRoute = /^\/emily-chatsbot(\/|$)/.test(url);
      });

    this.notificationService
      .fetchUserNotifications(this.CampaignId)
      .subscribe(() => {
        this.previousNotificationsLength =
          this.notificationService.notifications.length;
        this.sortNotificationsByDateAsc();
        this.scrollToBottom();
      });

    const poll = () => {
      this.wasSticky = this.isAtBottom();
      const prevLength = this.notificationService.notifications.length;

      this.notificationService
        .fetchUserNotifications(this.CampaignId)
        .subscribe({
          complete: () => {
            const newLength = this.notificationService.notifications.length;
            const diff = newLength - prevLength;

            if (diff > 0) {
              const newMessages = this.notificationService.notifications.slice(
                -diff
              );
              this.checkForShoppingCentersReply(newMessages);
              this.onNewMessagesArrived(diff);
            }

            this.previousNotificationsLength = newLength;
            this.sortNotificationsByDateAsc();
            this.scanTrigger$.next();

            setTimeout(poll, 2000);
          },
        });
    };
    poll();

    this.scanSub = this.scanTrigger$.pipe(debounceTime(120)).subscribe(() => {
      this.scanAndOpenOverlayForHtml();
      this.scanForShowMap();
    });

    this.notificationService.openOverlay$.subscribe((notification) => {
      if (notification) {
        this.loadNotificationViewComponent(notification);
      }
    });

    this.sidebarStateChange.emit({ isOpen: true, isFullyOpen: this.isOpen });
    setTimeout(() => this.scrollToBottom(), 100);
    this.checkScreenSize();

    this.notificationService.mapOpen$.subscribe((open) => {
      this.showingMap = open;
      if (open) this.overlayHtml = '';
    });

    this.notificationService.overlayWide$.subscribe((wide) => {
      if (!this.electronSideBar) {
        this.isoverlaywide = wide;
        if (wide) {
          setTimeout(() => this.showTyping(), 2000);
        }
      }
    });

    this.notificationService.htmlOpen$.subscribe((open) => {
      this.isOverlayhtml = open;
      if (!open) this.overlayHtml = '';
    });

    this.subs.push(
      this.chatModal.campaignId$.subscribe((id) => (this.campaignId = id)),
      this.chatModal.shoppingCenterId$.subscribe(
        (id) => (this.shoppingCenterId = id)
      ),
      this.chatModal.organizationId$.subscribe(
        (id) => (this.organizationId = id)
      ),
      this.chatModal.contactId$.subscribe((id) => (this.contactId = id)),
      this.chatModal.conversationId$.subscribe(
        (id) => (this.conversationId = id)
      )
    );
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.scanSub?.unsubscribe?.();
    this.sidebarStateChange.emit({ isOpen: false, isFullyOpen: false });
    clearTimeout(this.typingHideTimer);
    this.mo?.disconnect();
    this.ro?.disconnect();
  }

  closePopup(): void {
    this.activeModal.close();
  }
  openOverlayModal(notification: any) {
    this.selectedNotification = notification;
    this.overlayHtml = notification.html;

    this.overlayModalRef = this.modalService.open(this.overlayModal, {
      size: 'xl',
      centered: true,
      keyboard: true,
    });
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const chatButton =
      this.elementRef.nativeElement.querySelector('.chat-button');
    const chatDropdown =
      this.elementRef.nativeElement.querySelector('.chat-dropdown');

    if (chatButton && chatButton.contains(target)) {
      return;
    }

    if (
      this.isOpen &&
      target &&
      chatDropdown &&
      !chatDropdown.contains(target)
    ) {
      this.notificationService.setChatOpen(false);
      this.isOpen = false;
    }
  }

  getSCsDataFromJsons(flag: boolean): void {
    (window as any).electronMessage.getSCsDataFromJsons(flag);
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
            } catch (error) {}
          }
          this.setNotificationLoading(notification, false);
          this.loadedNotifications.add(notification.id);
        },
        error: (error) => {
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
          this.setNotificationLoading(notification, false);
          this.loadedNotifications.add(notification.id);
        },
      });
    }
  }

  async saveShoppingCenterData(json: any, notification: any) {
    try {
      const parsedJson = JSON.parse(json);

      parsedJson.campaignId = notification.campaignId;
      parsedJson.AutomationJson = json;
      const response = await fetch(
        'https://127.0.0.1:5443/api/Enrichment/EnrichShoppingCenter',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parsedJson),
        }
      );

      return response;
    } catch (error) {
      return null;
    }
  }

  isNotificationLoaded(notification: any): boolean {
    return this.loadedNotifications.has(notification.id);
  }

  closeSide() {
    (window as any).electronMessage.closeEmilySideBrowser();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
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

  isAtTop(): boolean {
    if (!this.messagesContainer) return false;
    const container = this.messagesContainer.nativeElement;
    return container.scrollTop === 0;
  }

  onScroll(): void {
    this.wasSticky = this.isAtBottom();

    if (this.wasSticky) {
      this.showScrollButton = false;
      this.newNotificationsCount = 0;
    } else if (this.newNotificationsCount > 0) {
      this.showScrollButton = true;
    }
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

    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      campaignId: this.CampaignId,
      message: text,
      createdDate: new Date().toISOString(),
      notificationCategoryId: 1, // ✅ mark as user
      isTemp: true,
    };

    this.notificationService.notifications.push(optimisticMsg as any);

    this.sentMessages.push({
      message: text,
      createdDate: optimisticMsg.createdDate,
      status: 'sending',
    });

    this.scrollAfterRender();
    this.showTyping();

    const lastNotification =
      this.notificationService?.notifications[
        this.notificationService.notifications.length - 2
      ];
    const body: any = {
      Chat: text,
      ConversationId: this.conversationId
        ? this.conversationId
        : lastNotification.emilyConversationCategoryId,
    };
    console.log('lastNotificatio mmmmmmn', lastNotification);

    if (
      this.campaignId ||
      this.shoppingCenterId ||
      this.organizationId ||
      this.contactId
    ) {
      if (this.campaignId) body.CampaignId = this.campaignId;
      if (this.shoppingCenterId) body.ShoppingCenterId = this.shoppingCenterId;
      if (this.organizationId) body.OrganizationId = this.organizationId;
      if (this.contactId) body.ContactId = this.contactId;
    } else {
      console.log('elssssssssssss');
      if (lastNotification?.campaignId)
        body.CampaignId = lastNotification.campaignId;
      if (lastNotification?.shoppingCenterId)
        body.ShoppingCenterId = lastNotification.shoppingCenterId;
      if (lastNotification?.organizationId)
        body.OrganizationId = lastNotification.organizationId;
      if (lastNotification?.contactId)
        body.ContactId = lastNotification.contactId;
      if (lastNotification?.sourceUrl)
        body.SourceUrl = lastNotification.sourceUrl;
    }

    this.placesService.sendmessages(body).subscribe({
      next: () => {
        this.lastUserMessageId = Math.max(
          ...this.notifications.map((n) => n.id)
        );
        this.awaitingResponse = true;
        this.isSending = false;
        this.hideTyping();
        const lastMsg = this.sentMessages[this.sentMessages.length - 1];
        if (lastMsg) lastMsg.status = 'sent';
        this.scanTrigger$.next();
      },
      error: (err) => {
        this.isSending = false;
        this.hideTyping();
        // restore text
        this.outgoingText = text;
        if (this.messageInput) this.messageInput.nativeElement.innerText = text;

        // mark last message as failed
        const lastMsg = this.sentMessages[this.sentMessages.length - 1];
        if (lastMsg) lastMsg.status = 'failed';

        // cancel turn
        this.awaitingResponse = false;
        this.preSendIds.clear();
        this.pendingSentText = '';``
        this.shownForIds.clear();
      },
    });
  }

  toggleOverlayMode(): void {
    if (!this.isOpen) return;

    if (this.isOverlayMode || this.showingMap || this.isOverlayhtml) {
      this.closeOverlayContent();
    } else {
      if (!this.electronSideBar) {
        this.isOverlayMode = true;
      }

      this.overlayStateChange.emit(true);
      this.sidebarStateChange.emit({
        isOpen: this.isOpen,
        isFullyOpen: this.isOpen,
        type: 'overlay',
        overlayActive: true,
        isChatbotRoute: this.isChatbotRoute,
      });
    }
  }

  onOverlayBackdropClick(event: MouseEvent): void {
    if (this.isOverlayMode || this.showingMap || this.isOverlayhtml) {
      this.closeOverlayContent();
    }
  }

  setOverlayHtmlFromApi(htmlFromApi: string) {
    this.overlayHtml = this.sanitizer.bypassSecurityTrustHtml(htmlFromApi);
  }

  private htmlToString(raw: any): string {
    if (raw == null) return '';
    if (typeof raw === 'string') return raw;
    try {
      return String(raw);
    } catch {
      return '';
    }
  }

  private hasHtml(n: Notification): boolean {
    const htmlContent = this.htmlToString(n?.html).trim();
    return htmlContent.length > 0 && htmlContent !== n?.message?.trim();
  }

  private scanAndOpenOverlayForHtml(): void {
    console.log('not awaiting ');
    
    if (!this.awaitingResponse) return;
    console.log(' awaiting ');

    const list = this.notificationService?.notifications ?? [];
    console.log(' 2 ');

    if (!Array.isArray(list) || list.length === 0) return;
    console.log(' 1');

    const idKeyOf = (n: Notification) =>
      typeof n.id === 'number' ? n.id : String(n.id);
    const isUser = (n: Notification) =>
      n.notificationCategoryId === true || n.notificationCategoryId === 1;
    const isSystem = (n: Notification) => !isUser(n);
    const isNewSinceSend = (n: Notification) =>
      !this.preSendIds.has(idKeyOf(n));
    const matchesPendingText = (n: Notification) =>
      (n.message ?? '').trim() === this.pendingSentText.trim();
    console.log(' 3 ');

    // 1) Find user echo
    const userEcho = list.find(
      (n) => isUser(n) && isNewSinceSend(n) && matchesPendingText(n)
    );
    if (!userEcho) return;
    console.log(' 4 ');

    // 2) Find candidate system notification with HTML
    const candidate = list.find(
      (n) => isSystem(n) && isNewSinceSend(n) && this.hasHtml(n)
    );
    if (!candidate) return;
    console.log(' 5 ');

    const candId = idKeyOf(candidate);
    if (this.shownForIds.has(candId)) return;
    console.log(' 6 ');

    const htmlStr = this.htmlToString(candidate.html).trim();
    if (!htmlStr) return;

    console.log(' 7');
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
      this.openOverlayModal(this.selectedNotification);
      this.notificationService.setChatOpen(true);
    }
    if (!this.isOverlayMode) {
      if (!this.electronSideBar) {
        this.isOverlayMode = true;
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

    // 🔹 Filter notifications to include only Emily chat messages
    const emilyNotifications = (
      this.notificationService?.notifications ?? []
    ).filter((n) => n.isEmilyChat === true);

    // 🔹 Map notifications to ChatItems
    const notificationItems: ChatItem[] = emilyNotifications.map((n) => ({
      key: `n-${n.id}-${seqCounter++}`,
      from: this.mapCategoryToFrom(n.notificationCategoryId),
      message: n.message,
      created: new Date(n.createdDate),
      notification: n,
    }));

    // 🔹 Identify user messages (category 1 or boolean true)
    const userNotificationMessages = new Set(
      emilyNotifications
        .filter(
          (n) =>
            n.notificationCategoryId === true ||
            Number(n.notificationCategoryId) === 1
        )
        .map((n) => n.message.trim()?.toLowerCase())
    );

    // 🔹 Map optimistic (local) user-sent messages
    const sentMessageItems: ChatItem[] = (this.sentMessages ?? [])
      .filter(
        (m) => !userNotificationMessages.has(m.message.trim()?.toLowerCase())
      )
      .map((m) => ({
        key: `u-${m.createdDate}-${seqCounter++}`,
        from: 'user',
        message: m.message,
        created: new Date(m.createdDate),
        userMsg: m,
      }));

    // 🔹 Merge and sort all items chronologically
    return [...notificationItems, ...sentMessageItems].sort((a, b) => {
      const diff = a.created.getTime() - b.created.getTime();
      if (diff !== 0) return diff;
      return a.key.localeCompare(b.key);
    });
  }

  trackByChatItem = (_: number, item: ChatItem) => item.key;

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

  private showTyping() {
    if (this.isTyping) return;
    this.isTyping = true;

    this.cdRef.detectChanges();
    if (this.isAtBottom()) this.scrollToBottomNow();
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
        this.refreshService.triggerRefreshOrganizations();

        this.isSaving = false;
      },
    });
  }

  getCampaigns(): void {
    const request = { Name: 'GetCampaignsNeedUrls', Params: {} };
    this.placesService.GenericAPI(request).subscribe({
      next: (response: any) => {
        const id = response?.json?.[0]?.id;

        if (id == null) {
          return;
        }

        // try {
        //   (window as any).electronMessage.getLinksFromGoogle(
        //     '',
        //     localStorage.getItem('token'),
        //     id // <-- send only the id
        //   );
        // } catch (e) {}
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

  loadNotificationViewComponent(notification: Notification): void {
    if (this.electronSideBar) {
      (window as any).electronMessage.loadNotificationViewComponent(
        notification.id
      );
    } else {
      this.isOverlayMode = true;
      this.showingMap = false;
      this.overlayHtml = this.sanitizer.bypassSecurityTrustHtml(
        notification.html
      );
    }

    this.selectedNotification = notification;
  }
  async downloadPDF(container?: HTMLElement): Promise<void> {
    const containerEl = container ?? this.contentToDownload?.nativeElement;

    if (!containerEl) {
      console.error('Content container not found');
      return;
    }

    this.isGeneratingPdf = true;

    const imgs = Array.from(
      containerEl.querySelectorAll('img')
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
          console.warn('Could not process image:', img.src, err);
        }
      })
    );

    const filename = `${
      this.pdfTitle?.trim() || 'Emily-Report'
    }-${Date.now()}.pdf`;

    const h2cOpts: any = { scale: 2, useCORS: true, allowTaint: false };
    const jsPDFOpts: any = {
      unit: 'pt',
      format: 'a4',
      orientation: 'portrait',
    };

    try {
      await html2pdf()
        .from(containerEl)
        .set({
          filename,
          margin: 15,
          image: { type: 'jpeg', quality: 1 },
          html2canvas: h2cOpts,
          jsPDF: jsPDFOpts,
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .save();
    } finally {
      this.isGeneratingPdf = false;
    }
  }

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
      next: () => {
        (this.selectedNotification as any).title = this.pdfTitle.trim();

        this.showSaveToast = true;
        this.cdRef.detectChanges();
        setTimeout(() => {
          this.showSaveToast = false;
          this.cdRef.detectChanges();
        }, 2500);

        this.isSaving = false;
        this.pdfTitle = '';
        this.refreshService.triggerUserPagesRefresh();

        if (this.overlayModalRef) {
          this.overlayModalRef.close();
          this.overlayModalRef = null;
        }

        this.closeOverlayContent();
      },
      error: () => {
        this.isSaving = false;
      },
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isChatbotRoute']?.currentValue === true) {
      this.isOpen = true;
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
    if (
      !item.message ||
      (!item.message.includes('I am searching the web now for your request') &&
        !item.message.includes(
          'I will start scanning and analyzing the current page for you'
        ))
    ) {
      return false;
    }

    // Stop showing animation when next message arrives
    const nextItem = this.chatTimeline[index + 1];
    return !nextItem;
  }

  private get containerEl(): HTMLElement | null {
    return this.messagesContainer?.nativeElement ?? null;
  }

  isAtBottom(): boolean {
    const el = this.containerEl;
    if (!el) return true;
    const distance = el.scrollHeight - (el.scrollTop + el.clientHeight);
    return distance <= this.BOTTOM_STICKY_THRESHOLD;
  }

  private scrollToBottomNow(): void {
    const el = this.containerEl;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    this.showScrollButton = false;
    this.newNotificationsCount = 0;
  }

  ngAfterViewInit(): void {
    this.scrollToBottomNow();

    const el = this.containerEl;
    if (!el) return;

    // track stickiness at startup
    this.wasSticky = this.isAtBottom();

    // Observe DOM mutations (new messages appended)
    this.mo = new MutationObserver(() => this.onContentMutated());
    this.mo.observe(el, { childList: true, subtree: true });

    // Observe size changes (images, fonts, etc.)
    this.ro = new ResizeObserver(() => this.onContentMutated());
    this.ro.observe(el);
  }
  // ADD — called when DOM/size changes happen
  private onContentMutated(): void {
    // If user was sticky before the change, keep them pinned to bottom
    if (this.wasSticky) {
      this.cdRef.detectChanges();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => this.scrollToBottomNow());
      });
    }
    // recompute for the next cycle
    this.wasSticky = this.isAtBottom();
  }
  // ADD — handle "new X messages" badge only when not sticky
  private onNewMessagesArrived(count: number): void {
    if (count <= 0) return;
    if (this.wasSticky) {
      // do nothing; Mutation/Resize observers will keep you at bottom
      return;
    }
    this.newNotificationsCount += count;
    this.showScrollButton = true;
  }
  isCompilingReport(item: ChatItem, index: number): boolean {
    if (
      !item.message ||
      !item.message.includes('Compiling them into a nice report.')
    ) {
      return false;
    }
    const nextItem = this.chatTimeline[index + 1];
    return !nextItem;
  }

  openPolygonOverlay(notification: Notification): void {
    this.selectedNotification = notification;
    this.showingMap = true; // controls <app-polygons> rendering
    this.overlayHtml = ''; // clear HTML if previously set
    if (!this.electronSideBar) {
      this.isOverlayMode = true;
    }
    if (!this.isOpen) {
      this.isOpen = true;
      this.notificationService.setChatOpen(true);
    }

    this.sidebarStateChange.emit({
      isOpen: this.isOpen,
      isFullyOpen: this.isOpen,
      type: 'overlay',
      overlayActive: this.isOverlayMode,
    });

    this.cdRef.detectChanges();
  }
  private scanForShowMap(): void {
    const list = this.notificationService?.notifications ?? [];
    if (!Array.isArray(list) || list.length === 0) return;

    for (const n of list) {
      const idKey = typeof n.id === 'number' ? n.id : String(n.id);
      if (this.shownForIds.has(idKey)) continue;

      const isSystem = !(
        n.notificationCategoryId === true || n.notificationCategoryId === 1
      );
      if (isSystem && n.message?.toLowerCase().includes('show map')) {
        this.shownForIds.add(idKey);
        this.openPolygonOverlay(n);
      }
    }
  }
  private closeOverlayContent(): void {
    this.isOverlayMode = false;
    this.showingMap = false;
    this.isOverlayhtml = false;
    this.overlayHtml = '';

    this.notificationService.setMapOpen(false);
    this.notificationService.setOverlayWide(false);
    this.notificationService.setHtmlOpen(false);

    this.overlayStateChange.emit(false);
    this.sidebarStateChange.emit({
      isOpen: this.isOpen,
      isFullyOpen: this.isOpen,
      type: 'overlay',
      overlayActive: false,
    });
  }

  // scan(scan: boolean) {
  //   if (scan) {
  //     (window as any).electronMessage.enableCREAutomationMode(
  //       localStorage.getItem('token')
  //     );
  //   } else if (!scan) {
  //     (window as any).electronMessage.disableCREAutomationMode();
  //   }
  // }
  private checkForShoppingCentersReply(newMessages: Notification[]): void {
    for (const n of newMessages) {
      const isSystem = !(
        n.notificationCategoryId === true || n.notificationCategoryId === 1
      );
      if (!isSystem) continue;

      const match = n.message?.match(
        /(?:I have found\s+(\d+)\s+Shopping Centers|(\d+)\s+Shopping Centers are matching the geographic filter for the campaign\s+(.+))/i
      );

      if (match) {
        this.refreshService.triggerRefreshOrganizations();
        break;
      }
    }
  }

  private idKey(n: { id: any }): string | number {
    return typeof n.id === 'number' ? n.id : String(n.id);
  }

  private seedKnownIds(list: Notification[]): void {
    this.knownIds.clear();
    for (const n of list ?? []) this.knownIds.add(this.idKey(n));
  }

  /**
   * Incrementally merges new notifications without re-fetching everything.
   * Handles scroll stickiness and triggers scanning.
   */
  private ingestNotifications(newOnes: Notification[]): void {
    if (!Array.isArray(newOnes) || !newOnes.length) return;

    const list = this.notificationService.notifications ?? [];
    let added = 0;

    for (const n of newOnes) {
      const key = this.idKey(n);
      if (this.knownIds.has(key)) continue;
      this.knownIds.add(key);
      list.push(n);
      added++;
    }

    if (!added) return;

    list.sort(
      (a, b) =>
        new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
    );

    if (this.wasSticky) {
      this.cdRef.detectChanges();
      requestAnimationFrame(() => this.scrollToBottomNow());
    } else {
      this.onNewMessagesArrived(added);
    }

    this.scanTrigger$.next();
    this.hideTyping();
    this.awaitingResponse = false;
  }

  scrollToBottom(): void {
    const el = this.messagesContainer?.nativeElement as HTMLElement | undefined;
    if (!el) return;

    this.cdRef.detectChanges();
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
      if (this.isAtBottom()) {
        this.showScrollButton = false;
        this.newNotificationsCount = 0;
      }
    });
  }

  clearEmilyChat() {
    const request = {
      Name: 'DeleteEmilyChat',
      Params: {},
    };

    this.placesService.GenericAPI(request).subscribe({
      next: (response: any) => {
        // Remove Emily chat messages from the shared notifications array
        if (Array.isArray(this.notificationService.notifications)) {
          this.notificationService.notifications =
            this.notificationService.notifications.filter(
              (n) => !n.isEmilyChat
            );
        }

        // Clear optimistic/local sent messages as well
        this.sentMessages = [];

        this.cdRef.detectChanges();
        this.scrollToBottom();
      },
    });
  }
}
