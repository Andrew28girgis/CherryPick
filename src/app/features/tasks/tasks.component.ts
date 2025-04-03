import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { PlacesService } from 'src/app/core/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { CommonModule } from '@angular/common';
import { NgxSpinnerModule } from 'ngx-spinner';
import { EmailNotificationResponse, notificationCategory, SubmissionNotificationResponse, SyncNotificationResponse } from 'src/app/shared/models/notificationCategory';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

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
  NotificationCategoryAction: any = {};
  emailData: EmailNotificationResponse[] = [];
  categoryNames = {
    1: 'Reactions',
    2: 'Email Generated',
    3: 'Sync',
    4: 'Proposal Submissions'
  };
  @ViewChild('EmailView', { static: false }) EmailView!: TemplateRef<any>;
  selectedEmailIndex: number = 0; // Track the currently selected email

  constructor(
    private placesService: PlacesService,
    private spinner: NgxSpinnerService,
    private router: Router,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
  //   this.breadcrumbService.setBreadcrumbs([
  //     { label: 'Tasks', url: '/campaigns' }
  //  ]);
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
  handleNotificationClick(notification: notificationCategory): void {
    this.markAsRead(notification);
    this.GetNotificationActions(notification);
  }

  GetNotificationActions(notification: notificationCategory): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetNotificationActions',
      Params: {
        NotificationId: notification.id,
      },
    };
    
    this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        
        if (!res.json) {
          console.error('Empty response from GetNotificationActions');
          return;
        }
        this.NotificationCategoryAction = res.json;
        // Handle different notification categories
        switch(notification.notificationCategoryId) {
          case 2: // Email Generated
            // Make sure we're handling the array of emails properly
            if (Array.isArray(this.NotificationCategoryAction)) {
              this.emailData = this.NotificationCategoryAction;
              this.selectedEmailIndex = 0; // Reset to first email
              this.openEmailModal();
            } else {
              console.error('Expected array for email data but got:', this.NotificationCategoryAction);
            }
            break;
            
          case 3: // Sync
            try {
              const syncData = this.NotificationCategoryAction[0] as SyncNotificationResponse;
              if (syncData && syncData.id && syncData.organizationId && syncData.name) {
                console.log('Navigating to market-survey with params:', syncData);
                this.router.navigate([
                  '/market-survey', 
                  syncData.id,
                  syncData.organizationId,
                  syncData.name
                ]);
              } else {
                console.error('Invalid sync data format:', syncData);
              }
            } catch (error) {
              console.error('Error processing sync notification:', error);
            }
            break;
            
          case 4: // Proposal Submissions
            try {
              const submissionData = this.NotificationCategoryAction[0] as SubmissionNotificationResponse;
              if (submissionData && submissionData.actionId) {
                console.log('Navigating to submissions with actionId:', submissionData.actionId);
                this.router.navigate(['/submissions', submissionData.actionId]);
              } else {
                console.error('Invalid submission data format:', submissionData);
              }
            } catch (error) {
              console.error('Error processing submission notification:', error);
            }
            break;
            
          default:
            console.log('Unhandled notification category:', notification.notificationCategoryId);
        }
      },
      error: (err) => {
        console.error('Error fetching notification actions', err);
        this.spinner.hide();
      }
    });
  }

  openEmailModal(): void {
    this.modalService.open(this.EmailView, { 
      size: 'lg',
      centered: true,
      scrollable: true
    });
  }
  
  // For navigating between multiple emails in the modal
  nextEmail(): void {
    if (this.selectedEmailIndex < this.emailData.length - 1) {
      this.selectedEmailIndex++;
    }
  }
  previousEmail(): void {
    if (this.selectedEmailIndex > 0) {
      this.selectedEmailIndex--;
    }
  }
  // Helper method to get current email
  getCurrentEmail(): EmailNotificationResponse {
    return this.emailData[this.selectedEmailIndex];
  }
    // Send a single email
    sendEmail(email: EmailNotificationResponse): void {
      // Only proceed if direction is equal to 4
      if (email.direction !== 4) {
        console.log('Email not sent - direction is not 4:', email.id);
        return;
      }
      this.spinner.show();
      const body: any = {
        Name: 'SendMail',
        MainEntity: null,
        Params: {
          MailId: email.id,
        },
        Json: null,
      };
      this.placesService.GenericAPI(body).subscribe({
        next: (res: any) => {
          this.showToast('Email sent successfully');
          this.modalService.dismissAll();
          this.spinner.hide();
        }
      });
    }
  // Send all emails
  sendAllEmails(): void {
    // Filter emails to only include those with direction = 4
    const eligibleEmails = this.emailData.filter(email => email.direction === 4);
    // If no eligible emails, return early
    if (eligibleEmails.length === 0) {
      console.log('No eligible emails to send (direction = 4)');
      return;
    }
    // Create a counter to track when all emails are sent - use filtered length
    let emailCount = eligibleEmails.length;
    let successCount = 0;
    let errorCount = 0;
    this.spinner.show();
    // Send each eligible email one by one - iterate through filtered array
    eligibleEmails.forEach(email => {
      const body: any = {
        Name: 'SendMail',
        MainEntity: null,
        Params: {
          MailId: email.id,
        },
        Json: null,
      };
      this.placesService.GenericAPI(body).subscribe({
        next: (res: any) => {
          this.showToast('Emails sent successfully');
          successCount++;
          // Check if all emails have been processed
          if (--emailCount === 0) {
            this.modalService.dismissAll();
            this.spinner.hide();
          }
        }
      });
    });
  }
  showToast(message: string) {
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage!.innerText = message;
    toast!.classList.add('show');
    setTimeout(() => {
      toast!.classList.remove('show');
    }, 3000);
  }
}