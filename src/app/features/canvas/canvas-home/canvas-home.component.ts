import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
interface Message {
  text: string;
  sender: 'user' | 'ai';
  time: string;
}
@Component({
  selector: 'app-canvas-home',
  standalone: false,
  templateUrl: './canvas-home.component.html',
  styleUrl: './canvas-home.component.css',
})
export class CanvasHomeComponent {
  constructor() {}

  ngOnInit() {}

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer') canvasContainer!: ElementRef;

  title = 'chat-canvas-app';

  messages: Message[] = [
    {
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: 'ai',
      time: this.getCurrentTime(),
    },
  ];

  newMessage = '';

  ngAfterViewInit() {}

  sendMessage() {
    if (this.newMessage.trim() === '') return;

    // Add user message
    this.messages.push({
      text: this.newMessage,
      sender: 'user',
      time: this.getCurrentTime(),
    });

    // Clear input field
    const userMessage = this.newMessage;
    this.newMessage = '';

    // Scroll to bottom
    setTimeout(() => {
      this.scrollToBottom();
    });

    // Simulate AI response
    setTimeout(() => {
      this.messages.push({
        text: 'I received your message. You can draw on the canvas on the right side!',
        sender: 'ai',
        time: this.getCurrentTime(),
      });

      setTimeout(() => {
        this.scrollToBottom();
      });
    }, 1000);
  }

  scrollToBottom() {
    const element = this.messagesContainer.nativeElement;
    element.scrollTop = element.scrollHeight;
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }

  // Add any additional methods or properties as needed
}
