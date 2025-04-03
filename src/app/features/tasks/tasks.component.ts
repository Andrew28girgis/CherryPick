import { Component, OnInit } from '@angular/core';
import { PlacesService } from 'src/app/core/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { CommonModule } from '@angular/common';
import { NgxSpinnerModule } from 'ngx-spinner';
import { notificationCategory } from 'src/app/shared/models/notificationCategory';
import { BreadcrumbService } from 'src/app/core/services/breadcrumb.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    NgxSpinnerModule
  ],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
})
export class TasksComponent implements OnInit {
  UserNotifications: notificationCategory[] = [];
  ContactId!: number;
  categoryNames = {
    1: 'Reactions',
    2: 'Email Generated',
    3: 'Sync',
    4: 'Proposal Submissions'
  };

  constructor(
    private placesService: PlacesService,
    private spinner: NgxSpinnerService,
    private breadcrumbService: BreadcrumbService,
  ) {}

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Tasks', url: '/campaigns' }
   ]);
    const storedContactId = localStorage.getItem('contactId');
    if (storedContactId) {
      this.ContactId = +storedContactId;
      this.GetUserNotifications();
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
    this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.UserNotifications = res.json || [];
        this.spinner.hide();
      },
    });
  }

  getNotificationsByCategory(categoryId: number): notificationCategory[] {
    return this.UserNotifications.filter(
      notification => notification.notificationCategoryId === categoryId
    ).sort((a, b) => {
      return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    });
  }

  markAsRead(notification: notificationCategory): void {
    notification.isRead = true;
  }
}