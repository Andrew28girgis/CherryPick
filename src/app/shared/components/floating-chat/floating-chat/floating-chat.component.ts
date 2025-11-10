import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CdkDragMove, CdkDragEnd } from '@angular/cdk/drag-drop';
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
export class FloatingChatComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() campaignId?: any;
  @Input() hidden = false;
  @ViewChild('fabBtn') fabBtn!: ElementRef<HTMLDivElement>;

  dragPos: Pos = { x: 0, y: 0 };
  unread = 0;
  private sub?: Subscription;
  private wasDragged = false;

  constructor(
    private chatModal: ChatModalService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.chatModal.setposition(this.fabBtn.nativeElement);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onDragStart(): void {
    this.wasDragged = true;
  }

  onDragMoved(e: CdkDragMove): void {
    if (this.chatModal.isOpen()) {
      const rect = this.fabBtn.nativeElement.getBoundingClientRect();
      const pos = this.calculateModalPosition(rect);
      this.chatModal.updatePosition(pos.top, pos.left);
    }
  }

  onDragEnd(e: CdkDragEnd): void {
    this.dragPos = e.source.getFreeDragPosition();
    localStorage.setItem(POS_KEY, JSON.stringify(this.dragPos));
    setTimeout(() => (this.wasDragged = false), 150);

    if (this.chatModal.isOpen()) {
      const rect = this.fabBtn.nativeElement.getBoundingClientRect();
      const pos = this.calculateModalPosition(rect);
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

  private calculateModalPosition(rect: DOMRect): { top: number; left: number } {
    const popupWidth = 420;
    const popupHeight = 560;
    const margin = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left =
      rect.right + popupWidth + margin < vw
        ? rect.right + margin
        : rect.left - popupWidth - margin;

    let top = rect.top + rect.height / 2 - popupHeight / 2;
    if (top + popupHeight > vh) top = vh - popupHeight - margin;
    if (top < margin) top = margin;

    return { top, left };
  }
}
