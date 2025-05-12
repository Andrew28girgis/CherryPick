import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CanvasService } from 'src/app/core/services/canvas.service';
import { CanvasChatDTO } from 'src/app/shared/models/canvas/canvas';

@Component({
  selector: 'app-canvas-home',
  standalone: false,
  templateUrl: './canvas-home.component.html',
  styleUrl: './canvas-home.component.css',
})
export class CanvasHomeComponent {
  contactId: string | null = null;
  constructor(private CanvasService: CanvasService) {}

  ngOnInit() {
    this.contactId = localStorage.getItem('contactId');
    console.log(this.contactId);
    
  }

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer') canvasContainer!: ElementRef;
  title = 'chat-canvas-app';
  messages: CanvasChatDTO[] = [];
  newMessage = '';

  ngAfterViewInit() {}

  sendMessage() {
    if (this.newMessage.trim() === '') return;
    this.messages.push({
      message: this.newMessage,
      senderType: 'user',
      messageSendDate: this.getCurrentTime(),
    });

    this.newMessage = '';
    this.CanvasService.getGPTAction(this.messages).subscribe((res: any) => {
      console.log(res);
    });
  }

  scrollToBottom() {
    const element = this.messagesContainer.nativeElement;
    element.scrollTop = element.scrollHeight;
  }

  getCurrentTime(): string {
    return new Date().toLocaleString([], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }
}
