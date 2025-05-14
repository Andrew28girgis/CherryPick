import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CanvasService } from 'src/app/core/services/canvas.service';
import { PlacesService } from 'src/app/core/services/places.service';
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
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer') canvasContainer!: ElementRef;
  title = 'chat-canvas-app';
  messages: CanvasChatDTO[] = [];
  aiResponse: AiResponse[] = [];
  newMessage = '';

  constructor(
    private CanvasService: CanvasService,
    private placesService: PlacesService
  ) {}

  ngOnInit() {
    this.contactId = Number(localStorage.getItem('contactId'));
    console.log(this.contactId);
  }

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
        this.aiResponse.forEach((response) => {
          if (response.actionName == 'Message') {
            this.messages.push({
              message: response.messageText,
              senderType: 'ai',
              messageSendDate: this.getCurrentTime(),
            });
          } else {
            this.makeAction(response.actionName, response.params);
          }
        });
      },
    });
  }
  tenant:any;
  makeAction(apiName: string, params: any[]) {
    const body = {
      Name: apiName,
      Params: params.length == 0 ? {} : {},
    };

    this.placesService.GenericAPI(body).subscribe((response) => {
      if (apiName == 'GetUserBuyBoxes') {
        this.tenant = response.json ;
      }else if (apiName == 'GetUserCampaigns') {

      }

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
