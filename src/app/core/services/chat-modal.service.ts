import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FloatingChatNotificationsComponent } from '../../shared/components/floating-chat-notifications/floating-chat-notifications.component';

@Injectable({ providedIn: 'root' })
export class ChatModalService {
  private ref?: NgbModalRef;
  constructor(private modal: NgbModal) {}

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

  setTimeout(() => {
    const dialog = document.querySelector('.dynamic-position') as HTMLElement;
    if (dialog && options.left !== undefined && options.top !== undefined) {
      dialog.style.position = 'fixed';
      dialog.style.left = `${options.left}px`;
      dialog.style.top = `${options.top}px`;
      dialog.style.right = 'auto';
      dialog.style.bottom = 'auto';
    }
  }, 0);

  this.ref.result.finally(() => (this.ref = undefined));
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
