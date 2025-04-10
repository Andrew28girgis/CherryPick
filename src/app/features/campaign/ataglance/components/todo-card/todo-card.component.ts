import { Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { ICampaignEmail } from '../../models/icampaign-email';
import { PlacesService } from 'src/app/core/services/places.service';
import { Observable } from 'rxjs';
import { ICampaignEmailContent } from '../../models/icampaign-email-content';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-todo-card',
  templateUrl: './todo-card.component.html',
  styleUrl: './todo-card.component.css',
})
export class TodoCardComponent {
  @ViewChild('emailContent', { static: false }) emailContent!: TemplateRef<any>;
  @Input() email!: ICampaignEmail;
  selectedEmailIndex = 0;
  emailsContent: ICampaignEmailContent[] = [];

  constructor(
    private placeService: PlacesService,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService
  ) {}

  getCampaignEmailActions(id: number): void {
    this.spinner.show();
    const body = {
      name: 'GetNotificationActions',
      params: {
        NotificationId: id,
      },
    };

    this.placeService.GenericAPI(body).subscribe((response) => {
      this.spinner.hide();
      if (response.json && response.json.length > 0) {
        this.emailsContent = response.json;
        this.openActionModal();
      }
    });
  }

  get getCurrentEmail() {
    return this.emailsContent[this.selectedEmailIndex];
  }

  nextEmail(): void {
    if (this.selectedEmailIndex < this.emailsContent.length - 1) {
      this.selectedEmailIndex++;
    }
  }
  previousEmail(): void {
    if (this.selectedEmailIndex > 0) {
      this.selectedEmailIndex--;
    }
  }

  sendEmail(email: ICampaignEmailContent): void {
    // Only proceed if direction is equal to 4
    if (email.direction !== 4) {
      console.log('Email not sent - direction is not 4:', email.id);
      return;
    }

    const body: any = {
      Name: 'SendMail',
      MainEntity: null,
      Params: {
        MailId: email.id,
      },
      Json: null,
    };

    this.placeService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.showToast('Email sent successfully');
        this.modalService.dismissAll();
      },
    });
  }

  sendAllEmails(): void {
    // Filter emails to only include those with direction = 4
    const eligibleEmails = this.emailsContent.filter(
      (email) => email.direction === 4
    );
    // If no eligible emails, return early
    if (eligibleEmails.length === 0) {
      console.log('No eligible emails to send (direction = 4)');
      return;
    }

    // Create a counter to track when all emails are sent - use filtered length
    let emailCount = eligibleEmails.length;
    let successCount = 0;
    let errorCount = 0;

    // Send each eligible email one by one - iterate through filtered array
    eligibleEmails.forEach((email) => {
      const body: any = {
        Name: 'SendMail',
        MainEntity: null,
        Params: {
          MailId: email.id,
        },
        Json: null,
      };

      this.placeService.GenericAPI(body).subscribe({
        next: (res: any) => {
          this.showToast('Emails sent successfully');
          successCount++;
          // Check if all emails have been processed
          if (--emailCount === 0) {
            this.modalService.dismissAll();
          }
        },
        error: () => {
          errorCount++;
          // Check if all emails have been processed
          if (--emailCount === 0) {
          }
        },
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

  openActionModal(): void {
    this.modalService.open(this.emailContent, {
      size: 'lg',
      centered: true,
      scrollable: true,
    });
  }
}
