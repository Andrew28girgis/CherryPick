import { Component, OnInit, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; 
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
})
export class NotificationsComponent implements OnInit, OnDestroy  {
unreadCount: any;
  private intervalId: any;

  constructor(
    private elementRef: ElementRef,
    public notificationService: NotificationService
  ) {}

   ngOnInit(): void {
  this.notificationService.initNotifications();

  this.intervalId = setInterval(() => {
    this.notificationService.fetchUserNotifications();
  }, 10000);
}

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  toggleDropdown(): void {
    this.notificationService.dropdownVisible = !this.notificationService.dropdownVisible;
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.notificationService.dropdownVisible = false;
    }
  }
}
