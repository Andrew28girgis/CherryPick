import {
  Component,
  Input,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CdkDragMove,CdkDragEnd} from '@angular/cdk/drag-drop';
import { ChatModalService } from 'src/app/core/services/chat-modal.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Subscription } from 'rxjs';

type Pos = { x: number; y: number };
const POS_KEY = 'floating_chat_fab_pos_v1';

@Component({
  selector: 'app-floating-chat',
  templateUrl: './floating-chat.component.html',
  styleUrls: ['./floating-chat.component.css'],
})
export class FloatingChatComponent implements OnDestroy {
  @Input() campaignId?: any;
  @Input() hidden = false;
  @ViewChild('fabBtn') fabBtn!: ElementRef<HTMLDivElement>;

  dragPos: Pos = { x: 0, y: 0 };
  unread = 0;
  private sub?: Subscription;
  private wasDragged = false;

  constructor( private chatModal: ChatModalService,private notificationService: NotificationService ) { }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onDragStart(): void {
    this.wasDragged = true;
  }

private calculateModalPosition(): { top: number; left: number } {
  const rect = this.fabBtn.nativeElement.getBoundingClientRect();
  const popupWidth = 420;
  const popupHeight = 560;
  const margin = 12;

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

  // Center vertically
  top = rect.top + rect.height / 2 - popupHeight / 2;

  // Keep inside viewport
  if (top + popupHeight > viewportHeight) {
    top = viewportHeight - popupHeight - margin;
  }
  if (top < margin) {
    top = margin;
  }

  return { top, left };
}

onDragMoved(e: CdkDragMove): void {
  if (this.chatModal.isOpen()) {
    const pos = this.calculateModalPosition();
    this.chatModal.updatePosition(pos.top, pos.left);
  }
}

onDragEnd(e: CdkDragEnd): void {
  this.dragPos = e.source.getFreeDragPosition();
  localStorage.setItem(POS_KEY, JSON.stringify(this.dragPos));
  setTimeout(() => (this.wasDragged = false), 150);

  if (this.chatModal.isOpen()) {
    const pos = this.calculateModalPosition();
    this.chatModal.updatePosition(pos.top, pos.left);
  }
}

open(): void {
    if (this.hidden || this.wasDragged) return;
    this.chatModal.openForButton(this.fabBtn.nativeElement, this.campaignId);

    if ((this.notificationService as any).setUnreadCount) {
      (this.notificationService as any).setUnreadCount(0);
    }
  }


}
