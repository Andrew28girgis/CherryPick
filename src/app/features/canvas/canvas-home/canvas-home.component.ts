import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CanvasService } from 'src/app/core/services/canvas.service';
import {
  AiResponse,
  CanvasChatDTO,
  GetGPTActionDTO,
} from 'src/app/shared/models/canvas/canvas';

@Component({
  selector: 'app-canvas-home',
  standalone: false,
  templateUrl: './canvas-home.component.html',
  styleUrl: './canvas-home.component.css',
})
export class CanvasHomeComponent {
  contactId: number | null = null;
  constructor(private CanvasService: CanvasService) {}

  ngOnInit() {
    this.contactId = Number(localStorage.getItem('contactId'));
    console.log(this.contactId);
  }

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer') canvasContainer!: ElementRef;
  title = 'chat-canvas-app';
  messages: CanvasChatDTO[] = [];
  aiResponse: AiResponse[] = [];
  newMessage = '';

  ngAfterViewInit() {}

  sendMessage() {
    const trimmedMessage = this.newMessage.trim();
    if (!trimmedMessage) return;
  
    const userMessage = {
      message: trimmedMessage,
      senderType: 'user',
      messageSendDate: this.getCurrentTime(),
    };
  
    this.messages.push(userMessage);
    this.newMessage = '';
  
    const messageRequest: GetGPTActionDTO = {
      contactId: this.contactId,
      canvasChats: [...this.messages],  
    };
   
  
    this.CanvasService.getGPTAction(messageRequest).subscribe({
      next: (response) => {
        this.aiResponse = response;
        console.log('AI Response:', this.aiResponse);
        console.log(this.messages);
        
      },
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
