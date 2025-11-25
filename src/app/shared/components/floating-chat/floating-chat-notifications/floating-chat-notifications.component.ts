import {
  Component,
  OnInit,
  ElementRef,
  HostListener,
  ViewChild,
  AfterViewInit,
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
import { ICampaign } from 'src/app/shared/models/icampaign';

declare global {
  interface Window {
    electronAPI?: { chatbotOverlayVisible: (visible: boolean) => void };
  }
  interface CampaignComparisonDetails {
    campaignSpecs: any;
    propertySpecs: any;
    matchedPlaces: boolean;
    matchedState: boolean;
    matchedCity: boolean;
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
  // isDropdownOpen = false;
  campaigns: ICampaign[] = [];
  selectedCampaignIds: number[] = [];
  campaignSpecs: any;
  propertySpecs: any;
  matchedPlaces: boolean = false;
  matchedState: boolean = false;
  matchedCity: boolean = false;
  expandedCampaigns: { [id: number]: boolean } = {};
  campaignDetails: { [id: number]: CampaignComparisonDetails } = {};
  isInserting = false;

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
  overlayLeft = 16;
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
  objectForScan: any;
  scanningmessage!: string;
  isLastStep!: boolean;
  shoppingCenter: any;
  dots = new Array(6);
  isScanning: boolean = false;
  isready!: boolean;
  insertsuccess!: boolean;
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

    (window as any).electronMessage?.onSiteScanMessage((object: any) => {
      if (!this.isLastStep) {
        this.isScanning = true;
      }
      this.objectForScan = object;
      this.scanningmessage = object.message;
      this.shoppingCenter = object.data;
      this.isLastStep = object.isLastStep;
      if (this.isLastStep && !this.shoppingCenter) {
        this.scanningmessage = 'Emily is Ready For Your Questions!';
        this.isready = true;
        setTimeout(() => {
          this.isScanning = false;
        }, 2500);
      } else if (this.isLastStep && this.shoppingCenter) {
        this.isready = true;
        this.GetUserCampaigns();
      }
      console.log('objectForScan', this.objectForScan);
      console.log('scanningmessage', this.scanningmessage);
      console.log('isLastStep', this.isLastStep);
      console.log('shoppingCenter', this.shoppingCenter);
    });
  }

  toggleCampaignDetails(id: number): void {
    this.expandedCampaigns[id] = !this.expandedCampaigns[id];

    if (this.expandedCampaigns[id] && !this.campaignDetails[id]) {
      this.GetCampaignFullDetails(id);
    }
  }
  onCampaignChange(event: any, campaignId: number): void {
    const isChecked = event.target.checked;

    if (isChecked) {
      // Add campaign ID if checked
      if (!this.selectedCampaignIds.includes(campaignId)) {
        this.selectedCampaignIds.push(campaignId);
      }
    } else {
      // Remove campaign ID if unchecked
      this.selectedCampaignIds = this.selectedCampaignIds.filter(
        (id) => id !== campaignId
      );
    }

    // Trigger change detection to update the dropdown label
    this.cdRef.detectChanges();
  }

  getSelectedCampaignsText(): string {
    if (this.selectedCampaignIds.length === 0) {
      return 'Select campaigns...';
    }

    if (this.selectedCampaignIds.length === this.campaigns.length) {
      return 'All campaigns selected';
    }

    const selectedCount = this.selectedCampaignIds.length;
    return `${selectedCount} campaign${selectedCount > 1 ? 's' : ''} selected`;
  }

  // Close dropdown when clicking outside
  // @HostListener('document:click', ['$event'])
  // onDocumentClick(event: MouseEvent): void {
  //   const target = event.target as HTMLElement;
  //   if (!target.closest('.campaign-selection')) {
  //     this.closeDropdown();
  //   }
  // }

  // Campaign Methods
  GetUserCampaigns(): void {
    const body: any = {
      Name: 'GetUserCampaigns',
      Params: {},
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (response) => {
        if (response.json && response.json.length > 0) {
          this.campaigns = response.json as ICampaign[];
          console.log('this.campaigns', this.campaigns);
        } else {
          this.campaigns = [];
        }
      },
    });
  }
  GetCampaignFullDetails(id: any) {
    const body: any = {
      Name: 'GetCampaignFullDetails',
      Params: { CampaignId: id },
    };
    this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        const campaignSpecs = res.json;
        const propertySpecs = this.shoppingCenter;
        console.log('campaignSpecs', campaignSpecs);
        console.log('propertySpecs', propertySpecs);

        const matchedPlaces =
          !!propertySpecs.ShoppingCenter?.Places &&
          propertySpecs.ShoppingCenter.Places.length > 0;

        const matchedState =
          campaignSpecs.Locations?.some(
            (loc: any) => loc.State === propertySpecs.CenterState
          ) || false;

        const matchedCity =
          campaignSpecs.Locations?.some(
            (loc: any) => loc.CityName === propertySpecs.CenterCity
          ) || false;

        this.campaignDetails[id] = {
          campaignSpecs,
          propertySpecs,
          matchedPlaces,
          matchedState,
          matchedCity,
        };
      },
    });
  }
  checkPropertyTypeMatch(details: CampaignComparisonDetails): boolean {
    const propertySpecs = details.propertySpecs;
    const campaignSpecs = details.campaignSpecs;

    if (
      !propertySpecs.ShoppingCenter?.Places ||
      propertySpecs.ShoppingCenter.Places.length === 0
    ) {
      return false;
    }

    if (campaignSpecs.ForSale && campaignSpecs.ForLease) {
      return true;
    }

    return propertySpecs.ShoppingCenter.Places.some((place: any) => {
      const leaseType = place.LeaseType?.toLowerCase();
      if (campaignSpecs.ForSale && leaseType === 'sale') return true;
      if (campaignSpecs.ForLease && leaseType === 'lease') return true;
      return false;
    });
  }
  checkSizeMatch(details: CampaignComparisonDetails): boolean {
    const propertySpecs = details.propertySpecs;
    const campaignSpecs = details.campaignSpecs;

    if (
      !propertySpecs.ShoppingCenter?.Places ||
      propertySpecs.ShoppingCenter.Places.length === 0
    ) {
      return false;
    }

    return propertySpecs.Availability.some((place: any) => {
      const size = place.BuildingSizeSf;
      return (
        size >= campaignSpecs.MinUnitSize && size <= campaignSpecs.MaxUnitSize
      );
    });
  }
  getCampaignCities(details: CampaignComparisonDetails): string[] {
    const campaignSpecs = details.campaignSpecs;
    if (!campaignSpecs?.Locations) return [];    
    return campaignSpecs.Locations.filter((loc: any) => loc.CityName).map(
      (loc: any) => loc.CityName
    );
  }

  InsertSCCampaign(): void {
    this.isready = false;
    this.isInserting = true;
    this.insertsuccess = true;
    this.scanningmessage = 'Shopping  Center added successfully!';

    setTimeout(() => {
      this.isready = true;
      this.scanningmessage = 'Emily is Ready For Your Questions!';
    }, 2000);
    if (!this.shoppingCenter || this.selectedCampaignIds.length === 0) {
      console.warn('No shopping center or campaigns selected');
      return;
    }
    if (this.notificationSourceUrl) {
      (window as any).electronMessage.removeSiteScanJson(
        this.notificationSourceUrl
      );
    }

    // 1️⃣ Check if shoppingCenter has "campaignIds" field
    if (Array.isArray(this.shoppingCenter.campaignIds)) {
      // 2️⃣ Replace empty array with selectedCampaignIds
      this.shoppingCenter.campaignIds = [...this.selectedCampaignIds];
    } else {
      // If shoppingCenter does NOT have campaignIds at all, add it
      this.shoppingCenter.campaignIds = [...this.selectedCampaignIds];
    }

    // 3️⃣ Final JSON to send — ONLY the shoppingCenter object
    const body = this.shoppingCenter;
    console.log('Sending ShoppingCenter JSON:', body);

    // 4️⃣ Send to API
    this.placesService.InsertSC(body).subscribe({
      next: (response) => {
        console.log('InsertSC response', response);
        this.isready = true;

        // API returns { result: 1085 } — ensure we pass numeric id to InsertAutomation
        const insertedSCId = Number(response?.result);
        if (!isNaN(insertedSCId) && insertedSCId > 0) {
          this.InsertAutomation(insertedSCId);
        }

        this.isScanning = false;
        this.selectedCampaignIds = [];
      },
      error: (error) => {
        console.error('InsertSC error', error);
        this.scanningmessage =
          'Error adding shopping center. Please try again.';

        setTimeout(() => {
          this.scanningmessage = 'Emily is Ready For Your Questions!';
          this.isScanning = false;
        }, 3000);
      },
    });
  }

  InsertAutomation(id: any) {
    this.placesService.InsertAutomation(id).subscribe({
      next: () => {},
    });
  }
  cancelInsertion() {
    this.isScanning = false;
    this.selectedCampaignIds = [];
    this.scanningmessage = 'Emily is Ready For Your Questions!';
    console.log('notificationSourceUrl', this.notificationSourceUrl);

    if (this.notificationSourceUrl) {
      (window as any).electronMessage.removeSiteScanJson(
        this.notificationSourceUrl
      );
    }
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
