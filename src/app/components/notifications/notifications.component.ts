import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';
import { PlacesService } from '../../shared/services/places.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
})
export class NotificationsComponent implements OnInit {
  ContactId!: number;
  notificationsArray: any[] = [];
  message!: string;
  createdDate!: string;
  dropdownVisible: boolean = false;
  unreadCount: number = 0; 
  readCount: number = 0; 
  constructor(
    private spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private eRef: ElementRef

  ) {}
  ngOnInit(): void {
    const storedContactId = localStorage.getItem('contactId');
    if (storedContactId) {
      this.ContactId = +storedContactId;
      this.GetUserNotifications();

    }
  }
  toggleDropdown(): void {
    this.dropdownVisible = !this.dropdownVisible;
    if (this.dropdownVisible) {
    }
  }

  GetUserNotifications(): void {
    this.spinner.show();
  
    const body: any = {
      Name: 'GetUserNotifications',
      Params: {
        ContactId: this.ContactId,
      },
    };
  
    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.notificationsArray = res.json || [];
  
        // Sort the notifications by date so that the newest is at index 0
        this.notificationsArray.sort((a, b) => {
          return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
        });
     // Count the notifications based on 'isRead' status
     this.readCount = this.notificationsArray.filter(notification => notification.isRead).length;
     this.unreadCount = this.notificationsArray.filter(notification => !notification.isRead).length;
        // Optionally set message/createdDate if needed
        if (this.notificationsArray.length > 0) {
          this.message = this.notificationsArray[0].message;
          this.createdDate = this.notificationsArray[0].createdDate;
        } else {
          this.message = '';
          this.createdDate = '';
        }
  
        this.spinner.hide();
      },
      error: (err: any) => {
        console.error('Error from GetUserNotifications:', err);
        this.spinner.hide();
      },
    });
  }
  
  updateNotification(notification: any): void {
    console.log('Notification ID selected:', notification.id);

    if (!notification.isRead) {
      notification.isRead = true;
    }

    const body: any = {
      Name: 'UpdateNotification',
      Params: {
        NotificationId: notification.id,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        console.log('UpdateNotification response:', res);
      },
      error: (err: any) => {
        console.error('Error updating notification:', err);
      },
    });
  }

  isLast(notification: any): boolean {
    return (
      this.notificationsArray.indexOf(notification) ===
      this.notificationsArray.length - 1
    );
  }
    // Listen for clicks on the document
    @HostListener('document:click', ['$event'])
    handleOutsideClick(event: Event): void {
      // Check if the click target is inside this component.
      if (!this.eRef.nativeElement.contains(event.target)) {
        this.dropdownVisible = false;
      }
    }
}
