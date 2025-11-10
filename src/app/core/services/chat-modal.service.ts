import { Injectable, ElementRef } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FloatingChatNotificationsComponent } from '../../shared/components/floating-chat-notifications/floating-chat-notifications.component';

@Injectable({ providedIn: 'root' })
export class ChatModalService {
  private ref?: NgbModalRef;

  constructor(private modal: NgbModal) {}

  openForButton(
    buttonEl: HTMLElement,
    campaignId?: any,
    opts: { popupWidth?: number; popupHeight?: number; margin?: number } = {}
  ) {
    const { popupWidth = 420, popupHeight = 560, margin = 12 } = opts;
    const rect = buttonEl.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left: number;
    let top: number;

    // Decide which side to open on
    if (rect.right + popupWidth + margin < viewportWidth) {
      left = rect.right + margin;
    } else {
      left = rect.left - popupWidth - margin;
    }

    // Center vertically relative to the button
    top = rect.top + rect.height / 2 - popupHeight / 2;

    // Keep inside viewport vertically
    if (top + popupHeight > viewportHeight) {
      top = viewportHeight - popupHeight - margin;
    }
    if (top < margin) {
      top = margin;
    }

    // Call the standard open method
    this.open({ campaignId, top, left });
  }

  open(options: { campaignId?: any; top?: number; left?: number } = {}) {
    if (this.ref) {
      try {
        this.ref.close();
      } catch {}
      this.ref = undefined;
      return;
    }

    this.ref = this.modal.open(FloatingChatNotificationsComponent, {
      backdrop: true,
      size: 'sm',
      container: 'body',
      windowClass: 'chat-notif-modal-window',
      modalDialogClass: 'chat-notif-modal-dialog dynamic-position',
      scrollable: true,
      keyboard: true,
    });

    const cmp = this.ref.componentInstance as FloatingChatNotificationsComponent;
    cmp.CampaignId = options.campaignId;

    // Reposition modal after render
    setTimeout(() => {
      const dialog = document.querySelector('.dynamic-position') as HTMLElement;
      if (dialog) {
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
          // Default position (bottom right)
          dialog.style.right = '24px';
          dialog.style.bottom = '24px';
        }
      }
    }, 0);

    this.ref.closed.subscribe(() => (this.ref = undefined));
    this.ref.dismissed.subscribe(() => (this.ref = undefined));
  }

  updatePosition(top: number, left: number) {
    const dialog = document.querySelector('.dynamic-position') as HTMLElement;
    if (dialog) {
      dialog.style.left = `${left}px`;
      dialog.style.top = `${top}px`;
    }
  }

  close() {
    this.ref?.close();
    this.ref = undefined;
  }

  isOpen() {
    return !!this.ref;
  }
}
