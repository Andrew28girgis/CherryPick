import { Injectable } from '@angular/core';
import { PlacesService } from 'src/app/core/services/places.service';
import { Notification } from 'src/app/shared/models/Notification';
import { Router } from '@angular/router'; 

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
    contactId: number = 0;
    notifications: Notification[] = [];
    dropdownVisible: boolean = false;
    unreadCount: number = 0;
    readCount: number = 0;

  constructor(private placesService: PlacesService,
      private router: Router) { 
    
  }
  getUploadRoute(notification: Notification): string | null {
  return notification.userSubmissionId
    ? `/uploadOM/${notification.userSubmissionId}`
    : null;
}
initNotifications(): void {
  const storedContactId = localStorage.getItem('contactId');
  if (storedContactId) {
    this.contactId = +storedContactId;
    this.fetchUserNotifications();
  }
}

    fetchUserNotifications(): void {
      const request = {
        Name: 'GetUserNotifications',
        Params: {
          ContactId: this.contactId,
        },
      };
  
      this.placesService.GenericAPI(request).subscribe({
        next: (response: any) => {
          this.notifications = (response.json || []) as Notification[];
          console.log('Fetched notifications:', this.notifications);
          
          this.sortNotificationsByDate();
          this.updateNotificationCounts();
        }
      });
    }
  
    private sortNotificationsByDate(): void {
      this.notifications.sort(
        (a, b) =>
          new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
      );
    }
  
    private updateNotificationCounts(): void {
      this.readCount = this.notifications.filter(
        (notification) => notification.isRead
      ).length;
      this.unreadCount = this.notifications.filter(
        (notification) => !notification.isRead
      ).length;
    }
   
  

}
