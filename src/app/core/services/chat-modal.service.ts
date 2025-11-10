import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FloatingChatNotificationsComponent } from '../../shared/components/floating-chat-notifications/floating-chat-notifications.component';

@Injectable({ providedIn: 'root' })
export class ChatModalService {
  private ref?: NgbModalRef;
  private fabEl: HTMLElement | null = null;

  constructor(private modal: NgbModal) {}

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

    // --- Decide which side to open on ---
    const openOnRight = rect.right + popupWidth + margin < vw;
    const left = openOnRight
      ? rect.right + margin
      : rect.left - popupWidth - margin / 2; // tighter margin on left side

    // --- Center vertically relative to icon ---
    let top = rect.top + rect.height / 2 - popupHeight / 2;

    // --- Keep inside viewport ---
    if (top + popupHeight > vh) top = vh - popupHeight - margin;
    if (top < margin) top = margin;

    return { top, left };
  }

  openForButton(
    buttonEl?: HTMLElement,
    campaignId?: any,
    opts: { popupWidth?: number; popupHeight?: number; margin?: number } = {}
  ): void {
    const anchor = buttonEl ?? this.fabEl;
    if (!anchor) {
      console.warn('ChatModalService: No anchor element for positioning');
      this.open({ campaignId }); 
      return;
    }

    const { top, left } = this.calculatePosition(anchor, opts);
    this.open({ campaignId, top, left });
  }

  open(options: { campaignId?: any; top?: number; left?: number } = {}): void {
    if (this.ref) {
      try {
        this.ref.close();
      } catch {}
      this.ref = undefined;
      return;
    }

    this.ref = this.modal.open(FloatingChatNotificationsComponent, {
      backdrop: true,
      container: 'body',
      size: 'sm',
      windowClass: 'chat-notif-modal-window',
      modalDialogClass: 'chat-notif-modal-dialog dynamic-position',
      scrollable: true,
      keyboard: true,
      animation: false, 
    });

    const cmp = this.ref.componentInstance as FloatingChatNotificationsComponent;
    cmp.CampaignId = options.campaignId;

    const dialog = document.querySelector('.dynamic-position') as HTMLElement;
    if (!dialog) return;

    dialog.style.position = 'fixed';
    dialog.style.width = '420px';
    dialog.style.height = '560px';
    dialog.style.zIndex = '9999';
    dialog.style.right = 'auto';
    dialog.style.bottom = 'auto';

    if (options.left !== undefined && options.top !== undefined) {
      dialog.style.left = `${options.left}px`;
      dialog.style.top = `${options.top}px`;
    } else {
      dialog.style.right = '24px';
      dialog.style.bottom = '24px';
    }

    this.ref.closed.subscribe(() => (this.ref = undefined));
    this.ref.dismissed.subscribe(() => (this.ref = undefined));
  }

  updatePosition(top: number, left: number): void {
    const dialog = document.querySelector('.dynamic-position') as HTMLElement;
    if (dialog) {
      dialog.style.left = `${left}px`;
      dialog.style.top = `${top}px`;
    }
  }

  close(): void {
    this.ref?.close();
    this.ref = undefined;
  }

  isOpen(): boolean {
    return !!this.ref;
  }
}
