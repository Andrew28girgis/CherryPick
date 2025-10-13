// src/app/core/services/notification-signalr.service.ts
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private hubConnection?: signalR.HubConnection;
  private isConnected = false;

  // Emits when a new notification is received
  notificationReceived$ = new Subject<any>();

  startConnection(): void {
    // Prevent multiple connections
    if (this.isConnected) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:5443/notificationHub', {
        
        withCredentials: true, // Must match backend CORS credentials
        transport: signalR.HttpTransportType.WebSockets, // Force WebSockets
      })
      .configureLogging(signalR.LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => {
        this.isConnected = true;
        console.log('✅ SignalR connection established');
      })
      .catch((err) => {
        this.isConnected = false;
        console.error('❌ SignalR connection error:', err);
      });

    // Reconnection handling
    this.hubConnection.onreconnected((connectionId) => {
      console.log('🔄 SignalR reconnected, id:', connectionId);
    });

    this.hubConnection.onclose(() => {
      this.isConnected = false;
      console.warn('⚠️ SignalR connection closed');
    });

    // Listening for backend pushes
    this.hubConnection.on('ReceiveNotification', (data: any) => {
      console.log('📩 Notification received from backend:', data);
      this.notificationReceived$.next(data);
    });
  }

  stopConnection(): void {
    if (this.hubConnection && this.isConnected) {
      this.hubConnection.stop().then(() => {
        this.isConnected = false;
        console.log('🛑 SignalR connection stopped');
      });
    }
  }
}
