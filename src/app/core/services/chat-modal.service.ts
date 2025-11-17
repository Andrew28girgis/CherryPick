import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FloatingChatNotificationsComponent } from '../../shared/components/floating-chat/floating-chat-notifications/floating-chat-notifications.component';
import { BehaviorSubject, Subject } from 'rxjs';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class ChatModalService {
  private ref?: NgbModalRef;
  private fabEl: HTMLElement | null = null;
  private campaignIdSource = new BehaviorSubject<any>(null);
  private shoppingCenterIdSource = new BehaviorSubject<any>(null);
  private organizationIdSource = new BehaviorSubject<any>(null);
  private contactIdSource = new BehaviorSubject<any>(null);
  private conversationIdSource = new BehaviorSubject<any>(null);
  private typing = new BehaviorSubject<any>(null);
  campaignId$ = this.campaignIdSource.asObservable();
  shoppingCenterId$ = this.shoppingCenterIdSource.asObservable();
  organizationId$ = this.organizationIdSource.asObservable();
  contactId$ = this.contactIdSource.asObservable();
  conversationId$ = this.conversationIdSource.asObservable();
  lockConversationContext = false;
  typing$ = this.typing.asObservable();

  constructor(
    private modal: NgbModal,
    private notificationService: NotificationService
  ) {}

  setFabElement(el: HTMLElement): void {
    this.fabEl = el;
  }

  private calculatePosition(
    anchor: HTMLElement,
    opts: { popupWidth?: number; popupHeight?: number; margin?: number } = {}
  ): { top: number; left: number } {
    const { popupWidth = 360, popupHeight = 560, margin = 24 } = opts;

    const rect = anchor.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const gap = 12; // space between the chat button and chat modal

    // Prefer opening to the right of the FAB if there’s space
    const openOnRight = rect.right + popupWidth + margin < vw;
    const left = openOnRight
      ? rect.right + margin
      : Math.max(margin, rect.left - popupWidth - margin / 2);

    // Position the modal directly below the FAB
    let top = rect.bottom + gap;

    // Ensure it stays inside the viewport vertically
    if (top + popupHeight > vh - margin) {
      top = vh - popupHeight - margin;
    }

    // Prevent it from going off the top
    if (top < margin) {
      top = margin;
    }

    // If the FAB is very low, prefer aligning it upwards
    if (rect.bottom > vh - popupHeight - margin) {
      top = Math.max(margin, rect.top - popupHeight - gap);
    }

    return { top, left };
  }

  openForButton(
    buttonEl?: HTMLElement,
    campaignId?: any,
    opts: { popupWidth?: number; popupHeight?: number; margin?: number } = {}
  ): Promise<FloatingChatNotificationsComponent | null> {
    return new Promise((resolve) => {
      if (this.ref) {
        try {
          this.ref.dismiss();
        } catch {}
        this.ref = undefined;
      }

      setTimeout(() => {
        const anchor = buttonEl ?? this.fabEl;
        if (!anchor) {
          console.warn('ChatModalService: No anchor element for positioning');
          resolve(this.open({ campaignId }));
          return;
        }

        const { top, left } = this.calculatePosition(anchor, opts);

        const cmp = this.open({ campaignId, top, left });

        this.notificationService.setChatOpenNew(true);

        resolve(cmp);
      }, 0);
    });
  }

  async open(
    options: { campaignId?: any; top?: number; left?: number } = {}
  ): Promise<FloatingChatNotificationsComponent | null> {
    // If modal is already open → destroy it fully first
    if (this.ref) {
      try {
        this.ref.dismiss(); // more reliable cleanup
      } catch {}

      this.ref = undefined;

      // ensure Angular destroys component before re-opening
      await Promise.resolve();
    }
    this.notificationService.notificationsnew = [];

    // Open new modal
    this.ref = this.modal.open(FloatingChatNotificationsComponent, {
      backdrop: true,
      container: 'body',
      windowClass: 'chat-notif-modal-window',
      modalDialogClass: 'chat-notif-modal-dialog dynamic-position',
      scrollable: true,
      keyboard: true,
      animation: false,
    });

    // Pass input
    const cmp = this.ref
      .componentInstance as FloatingChatNotificationsComponent;
    cmp.campaignId = options.campaignId;

    // Positioning
    const dialog = document.querySelector('.dynamic-position') as HTMLElement;
    if (dialog) {
      dialog.style.position = 'fixed';
      dialog.style.width = '420px';
      dialog.style.height = '560px';
      dialog.style.zIndex = '9999';

      if (options.left !== undefined && options.top !== undefined) {
        dialog.style.left = `${options.left}px`;
        dialog.style.top = `${options.top}px`;
      } else {
        dialog.style.right = '24px';
        dialog.style.bottom = '24px';
      }
    }

    // Remove reference when closed
    this.ref.closed.subscribe(() => (this.ref = undefined));
    this.ref.dismissed.subscribe(() => (this.ref = undefined));

    return cmp;
  }

  disableFabDrag(): void {
    if (this.fabEl) {
      this.fabEl.setAttribute('cdkDragDisabled', 'true');
      this.fabEl.style.pointerEvents = 'none';
    }
  }

  enableFabDrag(): void {
    if (this.fabEl) {
      this.fabEl.removeAttribute('cdkDragDisabled');
      this.fabEl.style.pointerEvents = 'auto';
    }
  }
  public getPositionForAnchor(
    anchor: HTMLElement,
    opts: { popupWidth?: number; popupHeight?: number; margin?: number } = {}
  ): { top: number; left: number } {
    return this.calculatePosition(anchor, opts);
  }

  updatePosition(top: number, left: number): void {
    const dialog = document.querySelector('.dynamic-position') as HTMLElement;
    if (dialog) {
      dialog.style.transition = 'top 0.1s linear, left 0.1s linear';
      dialog.style.left = `${left}px`;
      dialog.style.top = `${top}px`;
    }
  }

  close(): void {
    this.ref?.dismiss();
    this.ref = undefined;
  }

  isOpen(): boolean {
    return !!this.ref;
  }

  setCampaignId(campaignId: any, conversationId: any): void {
    this.clearAll();
    this.campaignIdSource.next(campaignId);
    this.conversationIdSource.next(conversationId);
    this.setTyping(true);
  }

  setShoppingCenterId(shoppingCenterId: any, conversationId: any): void {
    this.clearAll();
    this.shoppingCenterIdSource.next(shoppingCenterId);
    this.conversationIdSource.next(conversationId);
    this.setTyping(true);
  }

  setOrganizationId(organizationId: any, conversationId: any): void {
    this.clearAll();
    this.organizationIdSource.next(organizationId);
    this.conversationIdSource.next(conversationId);
    this.setTyping(true);
  }

  setContactId(contactId: any, conversationId: any): void {
    this.clearAll();
    this.contactIdSource.next(contactId);
    this.conversationIdSource.next(conversationId);
    this.setTyping(true);
  }
  setTyping(typing: boolean): void {
    this.typing.next(typing);
  }
  clearAll(): void {
    this.campaignIdSource.next(null);
    this.shoppingCenterIdSource.next(null);
    this.organizationIdSource.next(null);
    this.contactIdSource.next(null);
    this.conversationIdSource.next(null);
  }
}
