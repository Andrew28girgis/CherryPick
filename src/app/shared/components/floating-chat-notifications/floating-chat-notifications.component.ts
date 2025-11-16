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
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BehaviorSubject, debounceTime, Subscription } from 'rxjs';
import { take, filter } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import html2pdf from 'html2pdf.js';

import { NotificationService } from 'src/app/core/services/notification.service';
import { PlacesService } from 'src/app/core/services/places.service';
import { RefreshService } from 'src/app/core/services/refresh.service';
import { ChatModalService } from 'src/app/core/services/chat-modal.service';
import { Notification } from 'src/app/shared/models/Notification';

// ==================== Types ====================

type ChatFrom = 'user' | 'system' | 'ai';

interface ChatItem {
  key: string;
  from: ChatFrom;
  message: string;
  created: Date;
  notification?: Notification;
  userMsg?: {
    message: string;
    createdDate: string;
    status: 'sending' | 'sent' | 'failed';
  };
}

interface SidebarState {
  isOpen: boolean;
  isFullyOpen: boolean;
  type?: string;
  overlayActive?: boolean;
  isChatbotRoute?: boolean;
}

// ==================== Constants ====================

const CONSTANTS = {
  BOTTOM_STICKY_THRESHOLD: 28,
  POLLING_INTERVAL: 2000,
  DEBOUNCE_TIME: 120,
  TYPING_ANIMATION_DELAY: 2000,
  MIN_LOADING_TIME: 1500,
  TOAST_DURATION: 2500,
  SCROLL_ANIMATION_DELAY: 350,
  NOTIFICATION_DELAY: 80,
} as const;

const ROUTE_PATTERNS = {
  CHATBOT: /^\/emily-chatsbot(\/|$)/,
} as const;

// ==================== Component ====================

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
  // ==================== Inputs & Outputs ====================
  
  @Input() isChatbotRoute = false;
  @Output() overlayStateChange = new EventEmitter<boolean>();
  @Output() sidebarStateChange = new EventEmitter<SidebarState>();

  // ==================== ViewChild References ====================
  
  @ViewChild('overlayModal') overlayModal!: TemplateRef<any>;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLElement>;
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLElement>;
  @ViewChild('contentToDownload') contentToDownload!: ElementRef<HTMLElement>;
  @ViewChild('notificationModal') notificationModal!: TemplateRef<any>;
  @ViewChild('overlayContainer', { read: ElementRef }) overlayContainer!: ElementRef;

  // ==================== UI State ====================
  
  isOpen = true;
  isOverlayMode = false;
  isOverlayhtml = false;
  showingMap = false;
  isoverlaywide = false;
  electronSideBar = false;
  isTyping = false;
  showScrollButton = false;
  showPdfTitleDialog = false;
  showSaveToast = false;
  
  // ==================== Data State ====================
  
  notifications: Notification[] = [];
  sentMessages: any[] = [];
  overlayHtml: SafeHtml = '';
  outgoingText = '';
  pdfTitle = '';
  currentMessage = '';
  
  // ==================== Flags & Counters ====================
  
  isSending = false;
  isSaving = false;
  isGeneratingPdf = false;
  newNotificationsCount = 0;
  previousNotificationsLength = 0;
  loaded = false;
  scanEnabled = true;
  isfirstyping: any;
  newNotificationGetter = false;
  
  // ==================== IDs & References ====================
  
  CampaignId: any;
  campaignId: any;
  shoppingCenterId: any;
  organizationId: any;
  contactId: any;
  conversationId: any;
  notificationSourceUrl: any;
  selectedNotification: Notification | null = null;
  currentOpenNotificationId: number | null = null;
  lastUserMessageId: number | null = null;
  
  // ==================== Private State ====================
  
  private readonly loadedNotifications = new Set<string>();
  private readonly preSendIds = new Set<string | number>();
  private readonly shownForIds = new Set<string | number>();
  private readonly knownIds = new Set<string | number>();
  
  private awaitingResponse = false;
  private pendingSentText = '';
  private wasSticky = true;
  private currentHtmlSourceId: number | null = null;
  private currentHtmlCache = '';
  
  // ==================== Observables & Subscriptions ====================
  
  private readonly scanTrigger$ = new BehaviorSubject<void>(undefined);
  private readonly subscriptions: Subscription[] = [];
  private scanSub?: Subscription;
  
  // ==================== Timers & Observers ====================
  
  private intervalId: any;
  private typingHideTimer?: any;
  private mutationObserver?: MutationObserver;
  private resizeObserver?: ResizeObserver;
  private overlayModalRef: any;

  // ==================== Constructor ====================
  
  constructor(
    private readonly elementRef: ElementRef,
    private readonly notificationService: NotificationService,
    private readonly placesService: PlacesService,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
    private readonly cdRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly modalService: NgbModal,
    private readonly refreshService: RefreshService,
    private readonly chatModal: ChatModalService
  ) {}

  // ==================== Lifecycle Hooks ====================

  ngOnInit(): void {
    this.initializeRouteState();
    this.setupRouteListener();
    this.setupDataSubscriptions();
    this.setupNotificationServices();
    this.startPolling(CONSTANTS.POLLING_INTERVAL);
    this.emitInitialState();
  }

  ngAfterViewInit(): void {
    this.initializeScrollBehavior();
    this.setupDOMObservers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isChatbotRoute']?.currentValue === true) {
      this.isOpen = true;
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // ==================== Initialization Methods ====================

  private initializeRouteState(): void {
    const currentUrl = this.router.url;
    this.electronSideBar = currentUrl.includes('chatbot');
    this.isChatbotRoute = ROUTE_PATTERNS.CHATBOT.test(currentUrl);
    
    if (this.isChatbotRoute) {
      this.isOpen = true;
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  private setupRouteListener(): void {
    this.subscriptions.push(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe((e) => {
          const url = e.urlAfterRedirects || e.url;
          this.isChatbotRoute = ROUTE_PATTERNS.CHATBOT.test(url);
        })
    );
  }

  private setupDataSubscriptions(): void {
    this.subscriptions.push(
      this.chatModal.campaignId$.subscribe((id) => (this.campaignId = id)),
      this.chatModal.shoppingCenterId$.subscribe((id) => (this.shoppingCenterId = id)),
      this.chatModal.organizationId$.subscribe((id) => (this.organizationId = id)),
      this.chatModal.contactId$.subscribe((id) => (this.contactId = id)),
      this.chatModal.conversationId$.subscribe((id) => (this.conversationId = id)),
      this.chatModal.isfirstyping$.subscribe((bool) => (this.isfirstyping = bool))
    );
  }

  private setupNotificationServices(): void {
    // Scan trigger with debounce
    this.scanSub = this.scanTrigger$
      .pipe(debounceTime(CONSTANTS.DEBOUNCE_TIME))
      .subscribe(() => {
        this.scanAndOpenOverlayForHtml();
        this.scanForShowMap();
      });

    // Notification overlay listener
    this.subscriptions.push(
      this.notificationService.openOverlay$.subscribe((notification) => {
        if (notification) {
          this.loadNotificationViewComponent(notification);
        }
      })
    );

    // Map state listener
    this.subscriptions.push(
      this.notificationService.mapOpen$.subscribe((open) => {
        this.showingMap = open;
        if (open) this.overlayHtml = '';
      })
    );

    // Overlay width listener
    this.subscriptions.push(
      this.notificationService.overlayWide$.subscribe((wide) => {
        if (!this.electronSideBar) {
          this.isoverlaywide = wide;
          if (wide) {
            setTimeout(() => this.showTyping(), CONSTANTS.TYPING_ANIMATION_DELAY);
          }
        }
      })
    );

    // HTML overlay listener
    this.subscriptions.push(
      this.notificationService.htmlOpen$.subscribe((open) => {
        this.isOverlayhtml = open;
        if (!open) this.overlayHtml = '';
      })
    );

    // Initial fetch
    this.fetchNotifications();
  }

  private emitInitialState(): void {
    this.sidebarStateChange.emit({ isOpen: true, isFullyOpen: this.isOpen });
    setTimeout(() => this.scrollToBottom(), 100);
    this.checkScreenSize();
  }

  private initializeScrollBehavior(): void {
    this.scrollToBottomNow();
    const container = this.containerEl;
    if (container) {
      this.wasSticky = this.isAtBottom();
    }
  }

  private setupDOMObservers(): void {
    const container = this.containerEl;
    if (!container) return;

    // Mutation observer for DOM changes
    this.mutationObserver = new MutationObserver(() => this.handleContentMutation());
    this.mutationObserver.observe(container, { childList: true, subtree: true });

    // Resize observer for size changes
    this.resizeObserver = new ResizeObserver(() => this.handleContentMutation());
    this.resizeObserver.observe(container);
  }

  private cleanup(): void {
    // Clear intervals
    if (this.intervalId) clearInterval(this.intervalId);
    clearTimeout(this.typingHideTimer);

    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.scanSub?.unsubscribe();

    // Disconnect observers
    this.mutationObserver?.disconnect();
    this.resizeObserver?.disconnect();

    // Emit final state
    this.sidebarStateChange.emit({ isOpen: false, isFullyOpen: false });
  }

  // ==================== Message Handling ====================

  sendMessage(): void {
    if (this.isfirstyping || !this.canSendMessage()) return;

    const text = this.outgoingText.trim();
    this.prepareSendTurn(text);
    this.createOptimisticMessage(text);
    this.clearInputField();
    this.scrollAfterRender();
    this.showTyping();

    const requestBody = this.buildMessageRequest(text);
    this.sendMessageRequest(requestBody, text);
  }

  private canSendMessage(): boolean {
    const text = this.outgoingText?.trim();
    return !!(text && !this.isSending);
  }

  private prepareSendTurn(text: string): void {
    this.isSending = true;
    this.preSendIds.clear();
    
    for (const n of this.notificationService?.notificationsnew ?? []) {
      const idKey = typeof n.id === 'number' ? n.id : String(n.id);
      this.preSendIds.add(idKey);
    }
    
    this.pendingSentText = text;
    this.shownForIds.clear();
    this.awaitingResponse = true;
  }

  private createOptimisticMessage(text: string): void {
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      campaignId: this.CampaignId,
      message: text,
      createdDate: new Date().toISOString(),
      notificationCategoryId: 1,
      isTemp: true,
    };

    this.notificationService.notificationsnew.push(optimisticMsg as any);
    this.sentMessages.push({
      message: text,
      createdDate: optimisticMsg.createdDate,
      status: 'sending',
    });
  }

  private clearInputField(): void {
    this.outgoingText = '';
    if (this.messageInput) {
      this.messageInput.nativeElement.innerText = '';
    }
  }

  private buildMessageRequest(text: string): any {
    const lastNotification = this.getLastNotification();
    const conversationId = this.determineConversationId(lastNotification);
    
    const body: any = {
      Chat: text,
      ConversationId: conversationId,
    };

    this.addContextToRequest(body, lastNotification);
    return body;
  }

  private getLastNotification(): any {
    const notifications = this.notificationService?.notificationsnew;
    return notifications?.[notifications.length - 2];
  }

  private determineConversationId(lastNotification: any): any {
    if (this.conversationId) {
      return this.conversationId;
    }
    return lastNotification?.sourceUrl 
      ? lastNotification.emilyConversationCategoryId 
      : null;
  }

  private addContextToRequest(body: any, lastNotification: any): void {
    if (this.hasExplicitContext()) {
      this.newNotificationGetter = true;
      this.addExplicitContext(body);
    } else if (lastNotification) {
      this.addNotificationContext(body, lastNotification);
    }
  }

  private hasExplicitContext(): boolean {
    return !!(
      this.campaignId ||
      this.shoppingCenterId ||
      this.organizationId ||
      this.contactId
    );
  }

  private addExplicitContext(body: any): void {
    if (this.campaignId) body.CampaignId = this.campaignId;
    if (this.shoppingCenterId) body.ShoppingCenterId = this.shoppingCenterId;
    if (this.organizationId) body.OrganizationId = this.organizationId;
    if (this.contactId) body.ContactId = this.contactId;
  }

  private addNotificationContext(body: any, notification: any): void {
    if (notification.campaignId) body.CampaignId = notification.campaignId;
    if (notification.shoppingCenterId) body.ShoppingCenterId = notification.shoppingCenterId;
    if (notification.organizationId) body.OrganizationId = notification.organizationId;
    if (notification.contactId) body.ContactId = notification.contactId;
    if (notification.sourceUrl) {
      body.SourceUrl = notification.sourceUrl;
      this.notificationSourceUrl = notification.sourceUrl;
    }
  }

  private sendMessageRequest(body: any, originalText: string): void {
    this.placesService.sendmessages(body).subscribe({
      next: () => this.handleMessageSuccess(),
      error: (err) => this.handleMessageError(originalText),
    });
  }

  private handleMessageSuccess(): void {
    this.lastUserMessageId = Math.max(...this.notifications.map((n) => n.id));
    this.awaitingResponse = true;
    this.isSending = false;
    this.hideTyping();
    
    const lastMsg = this.sentMessages[this.sentMessages.length - 1];
    if (lastMsg) lastMsg.status = 'sent';
    
    this.scanTrigger$.next();
  }

  private handleMessageError(originalText: string): void {
    this.isSending = false;
    this.hideTyping();
    
    // Restore text
    this.outgoingText = originalText;
    if (this.messageInput) {
      this.messageInput.nativeElement.innerText = originalText;
    }

    // Mark message as failed
    const lastMsg = this.sentMessages[this.sentMessages.length - 1];
    if (lastMsg) lastMsg.status = 'failed';

    // Cancel turn
    this.awaitingResponse = false;
    this.preSendIds.clear();
    this.pendingSentText = '';
    this.shownForIds.clear();
  }

  // ==================== Notification Fetching ====================

  private fetchNotifications(): void {
    if (this.notificationSourceUrl || this.notificationService.notificationsnew.length > 0) {
      this.fetchSpecificNotifications();
    } else {
      this.fetchGeneralNotifications();
    }
  }

  private fetchSpecificNotifications(): void {
    if (this.hasExplicitContext()) {
      this.notificationSourceUrl = null;
    }

    this.notificationService
      .fetchUserNotificaetionsSpecific(
        this.campaignId,
        this.shoppingCenterId,
        this.organizationId,
        this.notificationSourceUrl
      )
      .subscribe(() => {
        this.filterEmilyChatNotifications();
        this.previousNotificationsLength = this.notificationService.notificationsnew.length;
        this.scanTrigger$.next();
      });
  }

  private fetchGeneralNotifications(): void {
    this.notificationService.fetchUserNotifications(this.CampaignId).subscribe(() => {
      this.filterEmilyChatNotifications();
      this.previousNotificationsLength = this.notificationService.notifications.length;

      if (!this.notificationSourceUrl && this.notificationService.notifications.length > 0) {
        this.setupInitialConversation();
        this.fetchSpecificNotifications();
      }

      this.scanTrigger$.next();
    });
  }

  private filterEmilyChatNotifications(): void {
    this.notificationService.notificationsnew = 
      this.notificationService.notificationsnew.filter((n) => n.isEmilyChat === true);
  }

  private setupInitialConversation(): void {
    const notifications = this.notificationService.notifications;
    const lastNotification = notifications[notifications.length - 1];
    
    this.notificationSourceUrl = lastNotification.sourceUrl;
    
    if (!this.chatModal.lockConversationContext && lastNotification.sourceUrl) {
      this.conversationId = lastNotification.emilyConversationCategoryId;
    }
  }

  private startPolling(intervalMs: number): void {
    const poll = () => {
      this.wasSticky = this.isAtBottom();
      this.handleFirstTyping();
      this.fetchNotifications();
      setTimeout(poll, intervalMs);
    };

    poll();
  }

  private handleFirstTyping(): void {
    const hasNotifications = this.notificationService.notificationsnew.length > 0;
    
    if (hasNotifications && this.isfirstyping) {
      this.isTyping = true;
      this.chatModal.setFirstTyping(false);
      this.isfirstyping = false;
    }
  }

  // ==================== Overlay Management ====================

  private scanAndOpenOverlayForHtml(): void {
    if (!this.awaitingResponse) return;

    const list = this.notificationService?.notificationsnew ?? [];
    if (!Array.isArray(list) || list.length === 0) return;

    const userEcho = this.findUserEcho(list);
    if (!userEcho) return;

    const candidate = this.findHtmlCandidate(list);
    if (!candidate) return;

    const candId = this.getIdKey(candidate);
    if (this.shownForIds.has(candId)) return;

    const htmlStr = this.htmlToString(candidate.html).trim();
    if (!htmlStr) return;

    this.processHtmlOverlay(candidate, candId, htmlStr);
  }

  private findUserEcho(list: Notification[]): Notification | undefined {
    return list.find((n) => 
      this.isUser(n) && 
      this.isNewSinceSend(n) && 
      this.matchesPendingText(n)
    );
  }

  private findHtmlCandidate(list: Notification[]): Notification | undefined {
    return list.find((n) => 
      this.isSystem(n) && 
      this.isNewSinceSend(n) && 
      this.hasHtml(n)
    );
  }

  private processHtmlOverlay(candidate: Notification, candId: string | number, htmlStr: string): void {
    this.shownForIds.add(candId);
    this.awaitingResponse = false;
    this.hideTyping();

    this.selectedNotification = candidate;
    this.currentHtmlSourceId = candidate.id as any;
    this.currentHtmlCache = htmlStr;
    
    this.setOverlayHtmlFromApi(htmlStr);
    this.openOverlayModal(this.selectedNotification);
    this.ensureOverlayVisible();
    this.scrollToNotification(candId);
  }

  private ensureOverlayVisible(): void {
    if (!this.isOpen) {
      this.isOpen = true;
      this.notificationService.setChatOpen(true);
    }
    
    if (!this.isOverlayMode && !this.electronSideBar) {
      this.isOverlayMode = true;
    }

    this.sidebarStateChange.emit({
      isOpen: this.isOpen,
      isFullyOpen: this.isOpen,
      type: 'overlay',
      overlayActive: this.isOverlayMode,
    });
  }

  private scrollToNotification(targetId: string | number): void {
    this.cdRef.detectChanges();
    
    this.ngZone.onStable.pipe(take(1)).subscribe(() => {
      this.scrollMessageIntoView(targetId);
      setTimeout(() => this.scrollMessageIntoView(targetId), CONSTANTS.NOTIFICATION_DELAY);
      requestAnimationFrame(() => this.scrollMessageIntoView(targetId));
    });
  }

  openOverlayModal(notification: Notification): void {
    this.loadNotificationViewComponent(notification);
    
    const existingPanel = document.querySelector('.chat-details-panel');
    if (existingPanel && this.currentOpenNotificationId === notification.id) {
      return;
    }
    
    if (existingPanel) {
      existingPanel.remove();
    }

    this.currentOpenNotificationId = notification.id;
    
    const chatDialog = document.querySelector('.dynamic-position') as HTMLElement;
    if (!chatDialog) return;

    const detailsPanel = this.createDetailsPanel(notification, chatDialog);
    this.setupPanelEventListeners(detailsPanel, chatDialog);
    
    document.body.appendChild(detailsPanel);
  }

  private createDetailsPanel(notification: Notification, chatDialog: HTMLElement): HTMLElement {
    const detailsPanel = document.createElement('div');
    detailsPanel.classList.add('chat-details-panel');

    const safeHtmlString = (this.overlayHtml as any)?.changingThisBreaksApplicationSecurity || '';
    const chatRect = chatDialog.getBoundingClientRect();

    detailsPanel.innerHTML = this.getDetailsPanelTemplate(safeHtmlString);
    this.applyDetailsPanelStyles(detailsPanel, chatRect);

    return detailsPanel;
  }

  private getDetailsPanelTemplate(htmlContent: string): string {
    return `
      <div class="chat-details-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h4 class="mb-0">Details</h4>
        <div class="d-flex align-items-center gap-2">
          <input type="text" id="pdfTitleInput" placeholder="Enter Title"
            class="form-control form-control-sm" style="width: 180px" />
          <button id="saveTitleBtn" class="btn btn-sm title-btn" disabled>Save Title</button>
          <button id="savePdfBtn" class="btn btn-sm save-pdf-btn">📄 Save PDF</button>
          <button class="chat-details-close btn btn-sm btn-light border">×</button>
        </div>
      </div>
      <div class="chat-details-body" id="detailsBody" style="padding: 16px; padding-bottom: 120px;">
        ${htmlContent}
      </div>
    `;
  }

  private applyDetailsPanelStyles(panel: HTMLElement, chatRect: DOMRect): void {
    Object.assign(panel.style, {
      position: 'fixed',
      top: `${chatRect.top}px`,
      left: '16px',
      width: `${chatRect.left - 32}px`,
      height: `${chatRect.height}px`,
      background: '#fff',
      borderRadius: '8px',
      boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
      overflowY: 'auto',
      zIndex: '999999999',
      animation: 'fadeIn 0.25s ease forwards',
    });
  }

  private setupPanelEventListeners(panel: HTMLElement, chatDialog: HTMLElement): void {
    const titleInput = panel.querySelector('#pdfTitleInput') as HTMLInputElement;
    const saveTitleBtn = panel.querySelector('#saveTitleBtn') as HTMLButtonElement;
    const savePdfBtn = panel.querySelector('#savePdfBtn') as HTMLButtonElement;
    const closeBtn = panel.querySelector('.chat-details-close') as HTMLButtonElement;

    const closeOverlay = () => this.closeDetailsPanel(panel);

    // Input validation
    titleInput.addEventListener('input', () => {
      const hasText = titleInput.value.trim().length > 0;
      saveTitleBtn.disabled = !hasText;
      savePdfBtn.disabled = false;
    });

    // Button handlers
    saveTitleBtn.addEventListener('click', () => {
      this.pdfTitle = titleInput.value.trim();
      if (this.pdfTitle) {
        this.saveTitleInNotification();
        closeOverlay();
      }
    });

    savePdfBtn.addEventListener('click', () => {
      this.pdfTitle = titleInput.value.trim() || 'Emily-Report';
      const pdfContent = panel.querySelector('#detailsBody') as HTMLElement;
      if (pdfContent) this.downloadPDF(pdfContent);
    });

    closeBtn.addEventListener('click', closeOverlay);

    // Outside click handler
    setTimeout(() => {
      document.addEventListener('click', (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!panel.contains(target) && !chatDialog.contains(target)) {
          closeOverlay();
        }
      });
    }, 50);

    // Optional: Add save button at bottom
    this.addBottomSaveButton(panel, closeOverlay);
  }

  private addBottomSaveButton(panel: HTMLElement, closeCallback: () => void): void {
    const shouldShowSave = this.selectedNotification && 
      [2, 3, 4, 5].includes(+this.selectedNotification.taskId) &&
      +this.selectedNotification.isEndInsertion === 0;

    if (shouldShowSave) {
      const saveDiv = document.createElement('div');
      saveDiv.classList.add('save-div');
      saveDiv.innerHTML = '<button id="bottomSaveBtn" class="btn save-btn">Save</button>';
      
      panel.appendChild(saveDiv);
      
      const bottomBtn = saveDiv.querySelector('#bottomSaveBtn') as HTMLButtonElement;
      bottomBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!this.isSaving && this.selectedNotification) {
          this.saveNotification(this.selectedNotification);
          closeCallback();
        }
      });
    }
  }

  private closeDetailsPanel(panel: HTMLElement): void {
    panel.style.animation = 'fadeOut 0.2s ease forwards';
    
    setTimeout(() => {
      panel.remove();
      this.currentOpenNotificationId = null;
      this.closeOverlayContent();
    }, 180);
  }

  closeOverlayContent(): void {
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

  // ==================== Notification Actions ====================

  saveNotification(notification: Notification): void {
    if (!notification?.id || this.isSaving) return;

    this.isSaving = true;

    this.placesService.savemessages(notification.id).subscribe({
      next: () => {
        if (+notification.taskId === 3) {
          this.getCampaigns();
        }

        notification.isEndInsertion = 1;

        this.showToast();
        this.refreshService.triggerRefreshOrganizations();
        this.isSaving = false;
      },
      error: () => {
        this.isSaving = false;
      },
    });
  }

  private showToast(): void {
    this.showSaveToast = true;
    this.cdRef.detectChanges();
    
    setTimeout(() => {
      this.showSaveToast = false;
      this.cdRef.detectChanges();
    }, CONSTANTS.TOAST_DURATION);
  }

  clearEmilyChat(): void {
    const request = {
      Name: 'DeleteEmilyChat',
      Params: {
        CampaignId: this.campaignId ?? null,
        ShoppingCenterId: this.shoppingCenterId ?? null,
        OrganizationId: this.organizationId ?? null,
        SourceUrl: this.notificationSourceUrl ?? null,
      },
    };

    this.placesService.GenericAPI(request).subscribe({
      next: () => {
        this.notificationService.notificationsnew = 
          this.notificationService.notificationsnew.filter((n) => !n.isEmilyChat);
        
        this.sentMessages = [];
        this.cdRef.detectChanges();
        this.scrollToBottom();
      },
    });
  }

  getCampaigns(): void {
    const request = { Name: 'GetCampaignsNeedUrls', Params: {} };
    
    this.placesService.GenericAPI(request).subscribe({
      next: (response: any) => {
        const campaignId = response?.json?.[0]?.id;
        if (campaignId != null) {
          // Handle campaign logic if needed
        }
      },
    });
  }

  // ==================== PDF Operations ====================

  async downloadPDF(container?: HTMLElement): Promise<void> {
    const containerEl = container ?? this.contentToDownload?.nativeElement;
    if (!containerEl) {
      console.error('Content container not found');
      return;
    }

    this.isGeneratingPdf = true;

    try {
      await this.processImagesForPDF(containerEl);
      await this.generatePDF(containerEl);
    } finally {
      this.isGeneratingPdf = false;
    }
  }

  private async processImagesForPDF(container: HTMLElement): Promise<void> {
    const images = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
    
    await Promise.all(
      images.map(async (img) => {
        try {
          if (this.isCrossOriginImage(img.src)) {
            img.src = await this.convertImageToDataURL(img.src);
          }
        } catch (err) {
          console.warn('Could not process image:', img.src, err);
        }
      })
    );
  }

  private isCrossOriginImage(src: string): boolean {
    return /^https?:\/\//.test(src) && !src.startsWith(window.location.origin);
  }

  private async convertImageToDataURL(url: string): Promise<string> {
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

  private async generatePDF(container: HTMLElement): Promise<void> {
    const filename = `${this.pdfTitle?.trim() || 'Emily-Report'}-${Date.now()}.pdf`;

    const html2canvasOptions = { 
      scale: 2, 
      useCORS: true, 
      allowTaint: false 
    };

    const jsPDFOptions = {
      unit: 'pt',
      format: 'a4',
      orientation: 'portrait' as const,
    };

    await html2pdf()
      .from(container)
      .set({
        filename,
        margin: 15,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: html2canvasOptions,
        jsPDF: jsPDFOptions,
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .save();
  }

  saveTitleInNotification(): void {
    if (!this.pdfTitle.trim() || this.isSaving) return;

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
        if (this.selectedNotification) {
          (this.selectedNotification as any).title = this.pdfTitle.trim();
        }

        this.showToast();
        this.refreshService.triggerUserPagesRefresh();
        
        this.isSaving = false;
        this.pdfTitle = '';
        
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

  // ==================== Modal Operations ====================

  showprompt(message: string): void {
    this.currentMessage = message;
    this.modalService.open(this.notificationModal, {
      size: 'md',
      centered: true,
    });
  }

  sendPromptMessage(message: string): void {
    const body = { Chat: message };
    this.placesService.sendmessages(body).subscribe();
  }

  // ==================== Map Operations ====================

  openPolygonOverlay(notification: Notification): void {
    this.selectedNotification = notification;
    this.showingMap = true;
    this.overlayHtml = '';
    
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
    const list = this.notificationService?.notificationsnew ?? [];
    if (!Array.isArray(list) || list.length === 0) return;

    for (const notification of list) {
      const idKey = this.getIdKey(notification);
      if (this.shownForIds.has(idKey)) continue;

      const isSystem = this.isSystem(notification);
      if (isSystem && notification.message?.toLowerCase().includes('show map')) {
        this.shownForIds.add(idKey);
        this.openPolygonOverlay(notification);
      }
    }
  }

  // ==================== Notification Loading ====================

  loadNotificationViewComponent(notification: Notification): void {
    if (this.electronSideBar) {
      (window as any).electronMessage?.loadNotificationViewComponent?.(notification.id);
      return;
    }

    this.isOverlayMode = true;
    this.showingMap = false;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = notification.html || '';

    this.processStyleTags(tempDiv);
    this.processLinkTags(tempDiv);

    this.overlayHtml = this.sanitizer.bypassSecurityTrustHtml(tempDiv.innerHTML);
    this.selectedNotification = notification;
  }

  private processStyleTags(container: HTMLElement): void {
    const styleTags = container.querySelectorAll('style');
    
    styleTags.forEach((styleEl) => {
      const style = document.createElement('style');
      style.textContent = styleEl.textContent;
      document.head.appendChild(style);
      styleEl.remove();
    });
  }

  private processLinkTags(container: HTMLElement): void {
    const linkTags = container.querySelectorAll('link[rel="stylesheet"]');
    
    linkTags.forEach((linkEl) => {
      const href = linkEl.getAttribute('href');
      if (href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
      linkEl.remove();
    });
  }

  setOverlayHtmlFromApi(htmlFromApi: string): void {
    this.overlayHtml = this.sanitizer.bypassSecurityTrustHtml(htmlFromApi);
  }

  // ==================== Notification State Management ====================

  isNotificationLoaded(notification: any): boolean {
    return this.loadedNotifications.has(String(notification.id));
  }

  isNotificationLoading(notification: any): boolean {
    return !!notification?.isLoading;
  }

  setNotificationLoading(notification: any, isLoading: boolean, choice?: number): void {
    if (isLoading) {
      notification.isLoading = true;
      notification.loadingStartTime = Date.now();
      if (choice !== undefined) {
        notification.loadingChoice = choice;
        this.loaded = true;
      }
    } else {
      const minLoadingTime = CONSTANTS.MIN_LOADING_TIME;
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

  // ==================== Shopping Center Operations ====================

  getSCsDataFromJsons(flag: boolean): void {
    (window as any).electronMessage?.getSCsDataFromJsons?.(flag);
  }

  choose(choice: number, notification: Notification): void {
    this.setNotificationLoading(notification, true, choice);

    if (choice === 1) {
      this.handleChoiceAccept(notification);
    } else if (choice === 0) {
      this.handleChoiceReject(notification);
    }
  }

  private handleChoiceAccept(notification: Notification): void {
    const request = {
      Name: 'DeleteJSONNotification',
      Params: { Id: notification.id },
    };

    this.placesService.GenericAPI(request).subscribe({
      next: async () => {
        try {
          await this.saveShoppingCenterData(notification.json, notification);
        } catch (error) {
          console.error('Error saving shopping center data:', error);
        }
        this.setNotificationLoading(notification, false);
        this.loadedNotifications.add(String(notification.id));
      },
      error: () => {
        this.setNotificationLoading(notification, false);
      },
    });
  }

  private handleChoiceReject(notification: Notification): void {
    const request = {
      Name: 'DeleteJSONNotification',
      Params: { Id: notification.id },
    };

    this.placesService.GenericAPI(request).subscribe({
      next: () => {
        this.setNotificationLoading(notification, false);
        this.loadedNotifications.add(String(notification.id));
      },
      error: () => {
        this.setNotificationLoading(notification, false);
      },
    });
  }

  private async saveShoppingCenterData(json: string, notification: Notification): Promise<Response | null> {
    try {
      const parsedJson = JSON.parse(json);
      parsedJson.campaignId = notification.campaignId;
      parsedJson.AutomationJson = json;

      const response = await fetch(
        'https://127.0.0.1:5443/api/Enrichment/EnrichShoppingCenter',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedJson),
        }
      );

      return response;
    } catch (error) {
      console.error('Error in saveShoppingCenterData:', error);
      return null;
    }
  }

  // ==================== Scroll Management ====================

  onScroll(): void {
    this.wasSticky = this.isAtBottom();

    if (this.wasSticky) {
      this.showScrollButton = false;
      this.newNotificationsCount = 0;
    } else if (this.newNotificationsCount > 0) {
      this.showScrollButton = true;
    }
  }

  scrollToBottom(): void {
    const container = this.messagesContainer?.nativeElement;
    if (!container) return;

    this.cdRef.detectChanges();
    
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
      if (this.isAtBottom()) {
        this.showScrollButton = false;
        this.newNotificationsCount = 0;
      }
    });
  }

  private scrollToBottomNow(): void {
    const container = this.containerEl;
    if (!container) return;
    
    container.scrollTop = container.scrollHeight;
    this.showScrollButton = false;
    this.newNotificationsCount = 0;
  }

  private scrollAfterRender(): void {
    this.cdRef.detectChanges();
    requestAnimationFrame(() => this.scrollToBottom());
  }

  private scrollMessageIntoView(targetId: string | number): void {
    try {
      if (!this.messagesContainer) return;
      
      const container = this.messagesContainer.nativeElement;
      const id = `msg-${String(targetId)}`;
      const element = container.querySelector<HTMLElement>(
        `#${CSS?.escape ? CSS.escape(id) : id}`
      );
      
      if (!element) return;

      const targetTop = element.offsetTop - 
        Math.max(0, container.clientHeight - element.offsetHeight - 40);

      container.scrollTo({ top: targetTop, behavior: 'smooth' });

      setTimeout(() => {
        if (this.isAtBottom()) {
          this.showScrollButton = false;
          this.newNotificationsCount = 0;
        }
      }, CONSTANTS.SCROLL_ANIMATION_DELAY);
    } catch {
      this.scrollToBottom();
    }
  }

  private handleContentMutation(): void {
    if (this.wasSticky) {
      this.cdRef.detectChanges();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => this.scrollToBottomNow());
      });
    }

    this.wasSticky = this.isAtBottom();
  }

  isAtBottom(): boolean {
    const container = this.containerEl;
    if (!container) return true;
    
    const distance = container.scrollHeight - (container.scrollTop + container.clientHeight);
    return distance <= CONSTANTS.BOTTOM_STICKY_THRESHOLD;
  }

  private get containerEl(): HTMLElement | null {
    return this.messagesContainer?.nativeElement ?? null;
  }

  // ==================== Input Handling ====================

  onInputChange(event: any): void {
    this.outgoingText = event.target.innerText || '';
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // ==================== Typing Indicator ====================

  private showTyping(): void {
    if (this.isTyping) return;
    
    this.isTyping = true;
    this.cdRef.detectChanges();
    
    if (this.isAtBottom()) {
      this.scrollToBottomNow();
    }
  }

  private hideTyping(): void {
    if (!this.isTyping) return;
    
    this.isTyping = false;
    clearTimeout(this.typingHideTimer);
    this.cdRef.detectChanges();
  }

  isAutomationLoading(item: ChatItem, index: number): boolean {
    if (!item.message) return false;

    const isSearching = item.message.includes('I am searching the web now for your request');
    const isScanning = item.message.includes('I will start scanning and analyzing the current page for you');

    if (!isSearching && !isScanning) return false;

    const nextItem = this.chatTimeline[index + 1];
    return !nextItem;
  }

  isCompilingReport(item: ChatItem, index: number): boolean {
    if (!item.message || !item.message.includes('Compiling them into a nice report.')) {
      return false;
    }
    
    const nextItem = this.chatTimeline[index + 1];
    return !nextItem;
  }

  // ==================== Chat Timeline ====================

  get chatTimeline(): ChatItem[] {
    let sequenceCounter = 0;

    const emilyNotifications = (this.notificationService?.notificationsnew ?? [])
      .filter((n) => n.isEmilyChat === true && n.emilyConversationCategoryId);

    const notificationItems: ChatItem[] = emilyNotifications.map((n) => ({
      key: `n-${n.id}-${sequenceCounter++}`,
      from: this.mapCategoryToFrom(n.notificationCategoryId),
      message: n.message,
      created: new Date(n.createdDate),
      notification: n,
    }));

    const userNotificationMessages = new Set(
      emilyNotifications
        .filter((n) => n.notificationCategoryId === true || Number(n.notificationCategoryId) === 1)
        .map((n) => n.message.trim()?.toLowerCase())
    );

    const sentMessageItems: ChatItem[] = (this.sentMessages ?? [])
      .filter((m) => !userNotificationMessages.has(m.message.trim()?.toLowerCase()))
      .map((m) => ({
        key: `u-${m.createdDate}-${sequenceCounter++}`,
        from: 'user' as ChatFrom,
        message: m.message,
        created: new Date(m.createdDate),
        userMsg: m,
      }));

    return [...notificationItems, ...sentMessageItems].sort((a, b) => {
      const timeDiff = a.created.getTime() - b.created.getTime();
      return timeDiff !== 0 ? timeDiff : a.key.localeCompare(b.key);
    });
  }

  trackByChatItem = (_index: number, item: ChatItem): string => item.key;

  // ==================== Helper Methods ====================

  private mapCategoryToFrom(categoryId: unknown): ChatFrom {
    const category = Number(categoryId);
    if (categoryId === true || category === 1) return 'user';
    if (category === 3) return 'ai';
    return 'system';
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

  private hasHtml(notification: Notification): boolean {
    const htmlContent = this.htmlToString(notification?.html).trim();
    return htmlContent.length > 0 && htmlContent !== notification?.message?.trim();
  }

  private getIdKey(notification: { id: any }): string | number {
    return typeof notification.id === 'number' ? notification.id : String(notification.id);
  }

  private isUser(notification: Notification): boolean {
    return notification.notificationCategoryId === true || 
           notification.notificationCategoryId === 1;
  }

  private isSystem(notification: Notification): boolean {
    return !this.isUser(notification);
  }

  private isNewSinceSend(notification: Notification): boolean {
    return !this.preSendIds.has(this.getIdKey(notification));
  }

  private matchesPendingText(notification: Notification): boolean {
    return (notification.message ?? '').trim() === this.pendingSentText.trim();
  }

  // ==================== Event Handlers ====================

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    const detailsPanel = document.querySelector('.chat-details-panel');
    if (detailsPanel && detailsPanel.contains(target)) return;

    const chatDialog = document.querySelector('.dynamic-position') as HTMLElement;
    if (chatDialog?.contains(target)) return;

    const fabEl = this.chatModal['fabEl'] as HTMLElement;
    if (fabEl?.contains(target)) return;

    const chatButton = this.elementRef.nativeElement.querySelector('.chat-button');
    const chatDropdown = this.elementRef.nativeElement.querySelector('.chat-dropdown');

    if (chatButton && chatButton.contains(target)) return;

    if (this.isOpen && target && chatDropdown && !chatDropdown.contains(target)) {
      this.notificationService.setChatOpen(false);
      this.isOpen = false;
      this.closeAll();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    const width = window.innerWidth;
    // Add responsive logic here if needed
  }

  closeAll(): void {
    try {
      // Close any active modals if needed
    } catch {}

    this.isOverlayMode = false;
    this.showingMap = false;
    this.isOverlayhtml = false;
    this.overlayHtml = '';

    this.notificationService.setMapOpen(false);
    this.notificationService.setOverlayWide(false);
    this.notificationService.setHtmlOpen(false);

    this.overlayStateChange.emit(false);
    this.sidebarStateChange.emit({
      isOpen: false,
      isFullyOpen: false,
      type: 'overlay',
      overlayActive: false,
    });

    this.chatModal.close();
  }

  private fetchNotifications(): void {
    // Main mode: always prefer specific notifications
    if (
      this.notificationSourceUrl ||
      this.notificationService.notificationsnew.length > 0
    ) {
      this.fetchSpecificNotifications();
    } else {
      // Only go general when we have no conversation yet
      this.fetchGeneralNotifications();
    }
  }

  private fetchSpecificNotifications(): void {
    console.log('specific fetch called',this.campaignId);
    
    if (
      this.campaignId ||
      this.shoppingCenterId ||
      this.organizationId ||
      this.contactId
    ) {
      this.notificationSourceUrl = null;
    }
    
    this.notificationService
      .fetchUserNotificaetionsSpecific(
        this.campaignId,
        this.shoppingCenterId,
        this.organizationId,
        this.notificationSourceUrl
      )
      .subscribe(() => {
        // Filter only Emily chat messages
        this.notificationService.notificationsnew =
          this.notificationService.notificationsnew.filter(
            (n) => n.isEmilyChat === true
          );

        this.previousNotificationsLength =
          this.notificationService.notificationsnew.length;
        // this.scrollToBottom();
        this.scanTrigger$.next();
      });
  }

  private fetchGeneralNotifications(): void {
    this.notificationService
      .fetchUserNotifications(this.CampaignId)
      .subscribe(() => {
        this.notificationService.notifications =
          this.notificationService.notifications.filter(
            (n) => n.isEmilyChat === true
          );

        this.previousNotificationsLength =
          this.notificationService.notifications.length;
        // this.scrollToBottom();

        if (
          !this.notificationSourceUrl &&
          this.notificationService.notifications.length > 0
        ) {
          const last =
            this.notificationService.notifications[
              this.notificationService.notifications.length - 1
            ];
          this.notificationSourceUrl = last.sourceUrl;
          if (!this.chatModal.lockConversationContext && last.sourceUrl) {
            this.conversationId = last.emilyConversationCategoryId;
          }

          // ✅ Once we have a valid conversation, immediately switch to specific fetch
          this.fetchSpecificNotifications();
        }

        this.scanTrigger$.next();
      });
  }

  private startPolling(intervalMs: number): void {
    const poll = () => {
      this.wasSticky = this.isAtBottom();
      if (
        this.notificationService.notificationsnew.length > 0 &&
        this.isfirstyping
      ) {
        console.log(
          'notification ',
          this.notificationService.notificationsnew[
            this.notificationService.notificationsnew.length - 1
          ]
        );
        console.log('first typing ', this.isfirstyping);
        this.isTyping = true;
        this.chatModal.setFirstTyping(false);
        this.isfirstyping = false;
        console.log('first typing set to false');
      }
      // Always call main unified method
      this.fetchNotifications();

      setTimeout(poll, intervalMs);
    };

    poll();
  }
}
