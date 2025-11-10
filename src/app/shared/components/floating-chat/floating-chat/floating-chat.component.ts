import {
  Component,
  Input,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
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
export class FloatingChatComponent implements AfterViewInit, OnDestroy {
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

  ngAfterViewInit(): void {
    this.chatModal.setFabElement(this.fabBtn.nativeElement);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onDragStart(): void {
    this.wasDragged = true;
  }

onDragMoved(e: CdkDragMove): void {
  if (this.chatModal.isOpen()) {
    const { top, left } = this.chatModal.getPositionForAnchor(this.fabBtn.nativeElement);
    this.chatModal.updatePosition(top, left);
  }
}

onDragEnd(e: CdkDragEnd): void {
  this.dragPos = e.source.getFreeDragPosition();
  localStorage.setItem(POS_KEY, JSON.stringify(this.dragPos));
  setTimeout(() => (this.wasDragged = false), 150);

  if (this.chatModal.isOpen()) {
    const { top, left } = this.chatModal.getPositionForAnchor(this.fabBtn.nativeElement);
    this.chatModal.updatePosition(top, left);
  }
}

  open(): void {
    if (this.hidden || this.wasDragged) return;
    this.chatModal.openForButton(this.fabBtn.nativeElement, this.campaignId);
    (this.notificationService as any).setUnreadCount?.(0);
  }
}
