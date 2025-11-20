import {
  Component,
  OnInit,
  ElementRef,
  HostListener,
  ViewChild,
  AfterViewInit,
  OnDestroy,
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
import { RefreshService } from 'src/app/core/services/refresh.service';
import { ChatModalService } from 'src/app/core/services/chat-modal.service';
import { ChatItem } from 'src/app/shared/models/Notification';
import { ChatFrom } from 'src/app/shared/models/Notification';
import { PdfGeneratorService } from 'src/app/core/services/pdf-generator.service';
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
  @ViewChild('chatWrapper', { static: true }) wrapperEl!: ElementRef;
  @ViewChild('detailsBody') detailsBody!: ElementRef;

  isTyping = false;
  campaignId!: number;
  electronSideBar = false;
  outgoingText = '';
  isSending = false;
  sentMessages: any[] = [];
  overlayHtml: SafeHtml = '';
  pdfTitle = '';
  overlayOpen = false;
  canSaveTitle = false;
  showBottomSave: any = false;
  overlayTop = 0;
  overlayLeft = 16; // SAME as before!
  overlayWidth = 0;
  overlayHeight = 0;

  safeHtmlString: SafeHtml = '';

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
  awaitingresponse: boolean = false;
  constructor(
    private elementRef: ElementRef,
    public notificationService: NotificationService,
    private placesService: PlacesService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private cdRef: ChangeDetectorRef,
    private refreshService: RefreshService,
    private chatModal: ChatModalService,
    private pdfService: PdfGeneratorService
  ) {}

  ngOnInit(): void {
    this.initializeChatContext();
    this.initializeChatModalSubscriptions();
    this.startPolling(2000);
  }
  private initializeChatContext(): void {
    this.handleInitialRouteState();
    this.listenToRouteChanges();
    this.fetchMessages();

    (window as any).electronMessage?.onSiteScanned((url: any) => {
      this.conversationId = 3;
      this.notificationSourceUrl = url;
    });
  }

  private handleInitialRouteState(): void {
    if (this.router.url.includes('chatbot')) {
      this.electronSideBar = true;
    }
  }

  private listenToRouteChanges(): void {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        const url = e.urlAfterRedirects || e.url;
      });
  }

  private startPolling(interval: number): void {
    const poll = () => {
      this.fetchMessages();
      setTimeout(poll, interval);
    };
    poll();
  }

  private fetchMessages(): void {
    this.notificationService
      .fetchUserNotificationsSpecific(
        this.campaignId,
        this.shoppingCenterId,
        this.organizationId,
        this.notificationSourceUrl
      )
      .subscribe(() => {
        this.notificationService.notificationsnew =
          this.notificationService.notificationsnew.filter(
            (n) => n.isEmilyChat
          );

        this.handleNewMessages();
      });
  }

  sendMessage(): void {
    const text = this.outgoingText.trim();
    if (!text || this.isSending) return;

    this.startSending(text);
    this.insertOptimisticMessage(text);
    this.showTyping();
    this.sendToApi(text);
  }
  private startSending(text: string) {
    this.isSending = true;
    this.outgoingText = '';
    this.messageInput.nativeElement.innerText = '';
  }
  private sendToApi(text: string): void {
    this.awaitingresponse = false;
    const body = {
      Chat: text,
      ConversationId: this.conversationId,
      CampaignId: this.campaignId,
      ShoppingCenterId: this.shoppingCenterId,
      OrganizationId: this.organizationId,
      ContactId: this.contactId,
      SourceUrl: this.notificationSourceUrl,
    };

    this.placesService.sendmessages(body).subscribe({
      next: () => {
        this.awaitingresponse = true;
        this.isSending = false;
        this.hideTyping();
      },
    });
  }

  private handleNewMessages(): void {
    const list = this.notificationService.notificationsnew;
    const hasNew = list.length > this.previousNotificationsLength;

    if (!hasNew) return;
    this.cdRef.detectChanges();
    if (this.isAtBottom()) {
      this.scrollToBottom();
    } else if (!this.isTyping) {
      this.newNotificationsCount++;
      this.showScrollButton = true;
    }
    this.previousNotificationsLength = list.length;
    if (
      this.awaitingresponse &&
      list[list.length - 1].html &&
      !this.electronSideBar
    ) {
      this.openOverlayModal(list[list.length - 1]);
      this.awaitingresponse = false;
    }
  }
  private insertOptimisticMessage(text: string): void {
    const tempMsg: any = {
      id: `temp-${Date.now()}`,
      message: text,
      createdDate: new Date().toISOString(),
      notificationCategoryId: 1,
      isEmilyChat: true,
      isTemp: true,
    };
    this.notificationService.notificationsnew.push(tempMsg);
    this.sentMessages.push({
      message: text,
      createdDate: tempMsg.createdDate,
    });
    this.cdRef.detectChanges();
    this.scrollToBottom();
  }

  private initializeChatModalSubscriptions(): void {
    this.subs.push(
      this.chatModal.campaignId$.subscribe((id) => (this.campaignId = id)),
      this.chatModal.typing$.subscribe((typing) =>
        setTimeout(() => {
          this.isTyping = typing;
          this.scrollToBottom();
        }, 3000)
      ),
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

    this.currentOpenNotificationId = notification.id;

    const chatDialog = document.querySelector(
      '.dynamic-position'
    ) as HTMLElement;
    if (!chatDialog) return;

    const chatRect = chatDialog.getBoundingClientRect();
    const wrapperRect = this.wrapperEl.nativeElement.getBoundingClientRect();

    // Position relative to chat wrapper (NOT whole page)
    this.overlayTop = chatRect.top - wrapperRect.top;
    this.overlayWidth = chatRect.left - wrapperRect.left - 16;
    this.overlayHeight = chatRect.height;

    this.safeHtmlString = this.overlayHtml;
    this.overlayOpen = true;

    this.showBottomSave =
      this.selectedNotification &&
      [2, 3, 4, 5].includes(+this.selectedNotification.taskId) &&
      +this.selectedNotification.isEndInsertion === 0;
  }
  updateSaveButtons() {
    this.canSaveTitle = this.pdfTitle?.trim().length > 0;
  }

  closeOverlay() {
    this.overlayOpen = false;
    this.currentOpenNotificationId = null;
  }

  saveTitleInOverlay() {
    if (!this.pdfTitle.trim()) return;
    this.saveTitleInNotification();
    this.closeOverlay();
  }

  savePdfInOverlay() {
    if (this.detailsBody?.nativeElement) {
      this.pdfService.generatePDF(
        this.detailsBody.nativeElement,
        this.pdfTitle || 'Emily-Report'
      );
    }
  }

  saveNotificationInOverlay() {
    if (this.isSaving) return;
    this.saveNotification(this.selectedNotification!);
    this.closeOverlay();
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

        if (this.overlayOpen) {
          this.closeOverlay();
        }
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
    const atBottom = this.isAtBottom();
    this.wasSticky = atBottom;
    if (atBottom) {
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
    const userNotificationMessages = new Set(
      emilyNotifications
        .filter(
          (n) =>
            n.notificationCategoryId === true ||
            Number(n.notificationCategoryId) === 1
        )
        .map((n) => n.message.trim()?.toLowerCase())
    );

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
    return [...notificationItems, ...sentMessageItems].sort((a, b) => {
      const diff = a.created.getTime() - b.created.getTime();
      if (diff !== 0) return diff;
      return a.key.localeCompare(b.key);
    });
  }

  trackByChatItem = (_: number, item: ChatItem) => item.key;

  private showTyping() {
    if (this.isTyping) return;
    this.isTyping = true;

    this.cdRef.detectChanges();
    if (this.isAtBottom()) this.scrollToBottom();
  }
  private hideTyping() {
    if (!this.isTyping) return;
    this.isTyping = false;
    this.cdRef.detectChanges();
  }

  private mapCategoryToFrom(categoryId: unknown): ChatFrom {
    const cat = Number(categoryId);
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
  isScanningPageContents(item: ChatItem, index: number): boolean {
    if (
      !item.message ||
      !item.message.includes('I am scanning the page contents now')
    ) {
      return false;
    }

    const nextItem = this.chatTimeline[index + 1];
    return !nextItem; // animate only while waiting for next AI message
  }

  isAtBottom(): boolean {
    const el = this.messagesContainer.nativeElement;
    if (!el) return true;
    const distance = el.scrollHeight - (el.scrollTop + el.clientHeight);
    return distance <= this.BOTTOM_STICKY_THRESHOLD;
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
    const el = this.messagesContainer.nativeElement;
    if (!el) return;
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
    const el = this.messagesContainer.nativeElement;
    if (!el) return;

    this.cdRef.detectChanges();
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
      this.wasSticky = true;
      this.showScrollButton = false;
      this.newNotificationsCount = 0;
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

    this.placesService.GenericAPI(request).subscribe({});
  }
}
