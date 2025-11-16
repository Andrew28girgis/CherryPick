import {
  Component,
  OnInit,
  ElementRef,
  HostListener,
  ViewChild,
  AfterViewInit,
  Input,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Notification } from 'src/app/shared/models/Notification';
import { PlacesService } from 'src/app/core/services/places.service';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import html2pdf from 'html2pdf.js';
import { RefreshService } from 'src/app/core/services/refresh.service';
import { ChatModalService } from 'src/app/core/services/chat-modal.service';

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
  implements OnInit, AfterViewInit
{
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;
  @ViewChild('contentToDownload') contentToDownload!: ElementRef;
  @Input() isChatbotRoute = false;

  private awaitingResponse = false;
  private preSendIds = new Set<string | number>();
  private pendingSentText = '';
  private shownForIds = new Set<string | number>();
  isTyping = false;
  private typingHideTimer?: any;
  private lastUserMessageId: number | null = null;
  notifications: Notification[] = [];
  messageText = '';
  CampaignId!: number;
  campaignId!: number;

  public isOpen = true;
  isNotificationsOpen = false;
  electronSideBar = false;
  outgoingText = '';
  isSending = false;
  sentMessages: any[] = [];
  overlayHtml: SafeHtml = '';
  pdfTitle = '';
  isGeneratingPdf = false;

  private overlayModalRef: any;
  public selectedNotification: Notification | null = null;
  public isSaving = false;
  private currentOpenNotificationId: number | null = null;
  public showSaveToast = false;

  private wasSticky = true;

  private readonly BOTTOM_STICKY_THRESHOLD = 28;

  shoppingCenterId!: number;
  organizationId!: number;
  contactId!: number;
  conversationId!: number;
  notificationSourceUrl!: string;
  showScrollButton = false;
  newNotificationsCount = 0;
  previousNotificationsLength = 0;
  private subs: Subscription[] = [];

  constructor(
    private elementRef: ElementRef,
    public notificationService: NotificationService,
    private placesService: PlacesService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private cdRef: ChangeDetectorRef,
    private refreshService: RefreshService,
    private chatModal: ChatModalService
  ) {}

  ngOnInit(): void {
    this.fetchSpecificNotifications();
    this.handleInitialRouteState();
    this.listenToRouteChanges();
    this.initializeNotifications();
    this.initializeChatModalSubscriptions();
  }

  private handleInitialRouteState(): void {
    if (this.router.url.includes('chatbot')) {
      this.electronSideBar = true;
    }
    this.isChatbotRoute = /^\/emily-chatsbot(\/|$)/.test(this.router.url);
    if (this.isChatbotRoute) {
      this.isOpen = true;
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  private listenToRouteChanges(): void {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        const url = e.urlAfterRedirects || e.url;
        this.isChatbotRoute = /^\/emily-chatsbot(\/|$)/.test(url);
      });
  }

  private initializeNotifications(): void {
    this.checkNotificationsCall();
    this.startPolling(2000);
  }

  private startPolling(intervalMs: number): void {
    const poll = () => {
      this.checkNotificationsCall();
      setTimeout(poll, intervalMs);
    };
    poll();
  }

  private checkNotificationsCall(): void {
    if (
      this.notificationSourceUrl ||
      this.notificationService.notificationsnew.length > 0
    ) {
      this.fetchSpecificNotifications();
    } else {
      this.getAllNotifications();
    }
  }

  private getAllNotifications(): void {
    this.notificationService
      .fetchUserNotifications(this.CampaignId)
      .subscribe(() => {
        this.notificationService.notifications =
          this.notificationService.notifications.filter(
            (n) => n.isEmilyChat === true
          );

        this.previousNotificationsLength =
          this.notificationService.notifications.length;

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

          this.fetchSpecificNotifications();
        }
      });
  }

  private fetchSpecificNotifications(): void {
    if (
      this.campaignId ||
      this.shoppingCenterId ||
      this.organizationId ||
      this.contactId
    ) {
      this.notificationSourceUrl = '';
    }

    this.notificationService
      .fetchUserNotificaetionsSpecific(
        this.campaignId,
        this.shoppingCenterId,
        this.organizationId,
        this.notificationSourceUrl
      )
      .subscribe(() => {
        this.notificationService.notificationsnew =
          this.notificationService.notificationsnew.filter(
            (n) => n.isEmilyChat === true
          );

        this.previousNotificationsLength =
          this.notificationService.notificationsnew.length;
      });
  }



  private initializeChatModalSubscriptions(): void {
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

  openOverlayModal(notification: any) {
    this.loadNotificationViewComponent(notification);
    const existingPanel = document.querySelector('.chat-details-panel');
    if (existingPanel && this.currentOpenNotificationId === notification.id) {
      return;
    }
    if (existingPanel) {
      existingPanel.remove();
    }

    this.currentOpenNotificationId = notification.id;

    const fabEl = this.chatModal['fabEl'] as HTMLElement;
    if (!fabEl) {
      console.warn('Floating chat button not found');
      return;
    }

    const chatDialog = document.querySelector(
      '.dynamic-position'
    ) as HTMLElement;
    if (!chatDialog) return;

    const chatRect = chatDialog.getBoundingClientRect();
    const detailsPanel = document.createElement('div');
    detailsPanel.classList.add('chat-details-panel');

    const safeHtmlString =
      (this.overlayHtml as any)?.changingThisBreaksApplicationSecurity || '';

    detailsPanel.innerHTML = `
    <div class="chat-details-header d-flex justify-content-between align-items-center flex-wrap gap-2">
      <h4 class="mb-0">Details</h4>

      <div class="d-flex align-items-center gap-2">
        <input type="text" id="pdfTitleInput" placeholder="Enter Title"
          class="form-control form-control-sm" style="width: 180px" />

        <button id="saveTitleBtn" class="btn btn-sm title-btn" disabled>
          Save Title
        </button>

        <button id="savePdfBtn" class="btn btn-sm save-pdf-btn">
          📄 Save PDF
        </button>

        <button class="chat-details-close btn btn-sm btn-light border">×</button>
      </div>
    </div>

    <div class="chat-details-body" id="detailsBody"
         style="padding: 16px; padding-bottom: 120px;">
      ${safeHtmlString}
    </div>
  `;

    detailsPanel.style.position = 'fixed';
    detailsPanel.style.top = `${chatRect.top}px`;
    detailsPanel.style.left = `16px`;
    detailsPanel.style.width = `${chatRect.left - 32}px`;
    detailsPanel.style.height = `${chatRect.height}px`;
    detailsPanel.style.background = '#fff';
    detailsPanel.style.borderRadius = '8px';
    detailsPanel.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)';
    detailsPanel.style.overflowY = 'auto';
    detailsPanel.style.zIndex = '999999999';
    detailsPanel.style.animation = 'fadeIn 0.25s ease forwards';

    const closeOverlay = () => {
      detailsPanel.style.animation = 'fadeOut 0.2s ease forwards';

      setTimeout(() => {
        detailsPanel.remove();
        this.currentOpenNotificationId = null;

        fabEl.style.top =
          fabEl.style.right =
          fabEl.style.left =
          fabEl.style.bottom =
            '';

        fabEl.style.position = 'fixed';
      }, 180);
    };

    detailsPanel.addEventListener('click', (e) => e.stopPropagation());

    const titleInput = detailsPanel.querySelector(
      '#pdfTitleInput'
    ) as HTMLInputElement;

    const saveTitleBtn = detailsPanel.querySelector(
      '#saveTitleBtn'
    ) as HTMLButtonElement;

    const savePdfBtn = detailsPanel.querySelector(
      '#savePdfBtn'
    ) as HTMLButtonElement;

    const toggleSaveButtons = () => {
      const hasText = titleInput.value.trim().length > 0;
      saveTitleBtn.disabled = !hasText;
      savePdfBtn.disabled = false;
    };

    titleInput.addEventListener('input', toggleSaveButtons);
    toggleSaveButtons();

    saveTitleBtn.addEventListener('click', () => {
      this.pdfTitle = titleInput.value.trim();
      if (!this.pdfTitle) return;
      this.saveTitleInNotification();
      closeOverlay();
    });

    savePdfBtn.addEventListener('click', () => {
      this.pdfTitle = titleInput.value.trim() || 'Emily-Report';
      const pdfContent = detailsPanel.querySelector(
        '#detailsBody'
      ) as HTMLElement;
      if (pdfContent) this.downloadPDF(pdfContent);
    });

    detailsPanel
      .querySelector('.chat-details-close')
      ?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeOverlay();
      });

    document.body.appendChild(detailsPanel);
    fabEl.addEventListener('click', () => {
      closeOverlay();
    });
    const outsideClickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      const clickedInsidePanel = detailsPanel.contains(target);
      const clickedInsideChat = chatDialog.contains(target);
      const clickedFab = fabEl.contains(target);

      if (!clickedInsidePanel && !clickedInsideChat && !clickedFab) {
        closeOverlay();
        document.removeEventListener('click', outsideClickHandler);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', outsideClickHandler);
    }, 50);

    const showSaveButton =
      this.selectedNotification &&
      [2, 3, 4, 5].includes(+this.selectedNotification.taskId) &&
      +this.selectedNotification.isEndInsertion === 0;

    if (showSaveButton) {
      const saveDiv = document.createElement('div');
      saveDiv.classList.add('save-div');

      saveDiv.innerHTML = `
      <button id="bottomSaveBtn" class="btn save-btn">Save</button>
    `;

      detailsPanel.appendChild(saveDiv);

      const bottomBtn = saveDiv.querySelector(
        '#bottomSaveBtn'
      ) as HTMLButtonElement;

      bottomBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.isSaving) return;
        this.saveNotification(this.selectedNotification!);
        closeOverlay();
      });
    }
  }

  async downloadPDF(container?: HTMLElement): Promise<void> {
    const containerEl = container ?? this.contentToDownload?.nativeElement;

    if (!containerEl) {
      console.error('Content container not found');
      return;
    }

    this.isGeneratingPdf = true;

    // Process images to fix cross-origin issues
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
            img.src = await this.toDataURL(img.src); // Convert image to Data URL
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

  saveNotification(notification: Notification): void {
    if (!notification?.id) return;

    this.isSaving = true;

    this.placesService.savemessages(notification.id).subscribe({
      next: (res) => {
        notification.isEndInsertion = 1;
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

  saveTitleInNotification(): void {
    if (!this.pdfTitle.trim()) {
      return;
    }

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
      },
      error: () => {
        this.isSaving = false;
      },
    });
  }

  @HostListener('document:click', ['$event'])
  clickOutSideClose(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const detailsPanel = document.querySelector('.chat-details-panel');
    if (detailsPanel && detailsPanel.contains(target)) return;

    if (detailsPanel) {
      const chatDialog = document.querySelector(
        '.dynamic-position'
      ) as HTMLElement;
      if (chatDialog?.contains(target)) return;
    }

    const fabEl = this.chatModal['fabEl'] as HTMLElement;
    if (fabEl?.contains(target)) return;

    const chatButton =
      this.elementRef.nativeElement.querySelector('.chat-button');
    const chatDropdown =
      this.elementRef.nativeElement.querySelector('.chat-dropdown');

    if (chatButton && chatButton.contains(target)) return;

    if (target && chatDropdown && !chatDropdown.contains(target)) {
      this.closeAll();
    }
  }

  closeAll(): void {
    this.chatModal.close();
  }

  closeSide() {
    (window as any).electronMessage.closeEmilySideBrowser();
  }

  onScroll(): void {
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
    for (const n of this.notificationService?.notificationsnew ?? []) {
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

    this.notificationService.notificationsnew.push(optimisticMsg as any);

    this.sentMessages.push({
      message: text,
      createdDate: optimisticMsg.createdDate,
    });

    this.scrollAfterRender();
    this.showTyping();

    const lastNotification =
      this.notificationService?.notificationsnew[
        this.notificationService.notificationsnew.length - 2
      ];
    let conversationIdtrust = this.conversationId;
    if (this.conversationId) {
      conversationIdtrust = this.conversationId;
    } else if (lastNotification.sourceUrl) {
      conversationIdtrust = lastNotification.emilyConversationCategoryId;
    }

    const body: any = {
      Chat: text,
      ConversationId: conversationIdtrust,
    };

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
      this.notificationSourceUrl = lastNotification.sourceUrl;
    }

    this.placesService.sendmessages(body).subscribe({
      next: () => {
        this.lastUserMessageId = Math.max(
          ...this.notifications.map((n) => n.id)
        );
        this.awaitingResponse = true;
        this.isSending = false;
        this.hideTyping();
      },
    });
  }

  get chatTimeline(): ChatItem[] {
    let seqCounter = 0;

    const emilyNotifications = (
      this.notificationService?.notificationsnew ?? []
    ).filter((n) => n.isEmilyChat === true && n.emilyConversationCategoryId);
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

  private scrollAfterRender(): void {
    this.cdRef.detectChanges();
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

  private mapCategoryToFrom(categoryId: unknown): ChatFrom {
    const cat = Number(categoryId); // handles number | string | boolean
    if (categoryId === true || cat === 1) return 'user';
    if (cat === 3) return 'ai';
    return 'system';
  }

  loadNotificationViewComponent(notification: Notification): void {
    if (this.electronSideBar) {
      (window as any).electronMessage.loadNotificationViewComponent(
        notification.id
      );
      return;
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = notification.html || '';
    const styleTags = tempDiv.querySelectorAll('style');
    styleTags.forEach((styleEl) => {
      const style = document.createElement('style');
      style.textContent = styleEl.textContent;
      document.head.appendChild(style);
      styleEl.remove();
    });

    const linkTags = tempDiv.querySelectorAll('link[rel="stylesheet"]');
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

    this.overlayHtml = this.sanitizer.bypassSecurityTrustHtml(
      tempDiv.innerHTML
    );
    this.selectedNotification = notification;
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

    this.wasSticky = this.isAtBottom();
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
    this.wasSticky = this.isAtBottom();
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
    if (!this.campaignId && !this.shoppingCenterId && !this.organizationId) {
    }
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
      next: (response: any) => {
        if (Array.isArray(this.notificationService.notificationsnew)) {
          this.notificationService.notificationsnew =
            this.notificationService.notificationsnew.filter(
              (n) => !n.isEmilyChat
            );
        }
        this.sentMessages = [];
        this.cdRef.detectChanges();
        this.scrollToBottom();
      },
    });
  }
}
