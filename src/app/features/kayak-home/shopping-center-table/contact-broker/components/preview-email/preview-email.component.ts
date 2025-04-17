import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PlacesService } from 'src/app/core/services/places.service';
import { IEmailContent } from '../../models/iemail-content';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-preview-email',
  templateUrl: './preview-email.component.html',
  styleUrl: './preview-email.component.css',
})
export class PreviewEmailComponent implements OnInit {
  protected emails!: IEmailContent[];

  @Input() mailContextId!: number;
  @Output() onStepDone = new EventEmitter<void>();

  constructor(
    private placeService: PlacesService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.readSpecificMails();
  }

  readSpecificMails(): void {
    this.spinner.show();
    const body = {
      Name: 'ReadSpecificMails',
      Params: {
        MailContextId: this.mailContextId,
        IsSent: 0,
      },
    };

    this.placeService.GenericAPI(body).subscribe((response) => {
      if (response.json && response.json.length > 0) {
        this.spinner.hide();
        this.emails = response.json;
        this.emails.forEach((email) => {
          email.isEditing = false;
        });
      } else {
        setTimeout(() => {
          this.readSpecificMails();
        }, 3000);
      }
    });
  }

  toggleEdit(email: any, bodyDiv: HTMLElement) {
    if (email.isEditing) {
      email.body = bodyDiv.innerHTML;
    }
    email.isEditing = !email.isEditing;
  }

  sendEmail(email: IEmailContent): void {
    // Only proceed if direction is equal to 4
    if (email.direction !== 4) {
      console.log('Email not sent - direction is not 4:', email.mailId);
      return;
    }

    this.spinner.show();

    const body: any = {
      Name: 'UpdateEmailData',
      MainEntity: null,
      Params: {
        MailId: email.mailId,
        Subject: email.subject,
        Body: email.body,
      },
      Json: null,
    };

    this.placeService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        this.showToast('Email sent successfully');
        this.emails = this.emails.filter((e) => e.mailId !== email.mailId);
        if (this.emails.length === 0) {
          this.onStepDone.emit();
        }
      },
    });
  }

  // Send all emails
  sendAllEmails(): void {
    // Filter emails to only include those with direction = 4
    const eligibleEmails = this.emails.filter((email) => email.direction === 4);
    // If no eligible emails, return early
    if (eligibleEmails.length === 0) {
      console.log('No eligible emails to send (direction = 4)');
      return;
    }

    // Create a counter to track when all emails are sent - use filtered length

    this.spinner.show();

    // Send each eligible email one by one - iterate through filtered array
    eligibleEmails.forEach((email) => {
      const body: any = {
        Name: 'UpdateEmailData',
        MainEntity: null,
        Params: {
          MailId: email.mailId,
          Subject: email.subject,
          Body: email.body,
        },
        Json: null,
      };
      this.placeService.GenericAPI(body).subscribe({
        next: (res: any) => {
          this.showToast('Emails sent successfully');
          this.emails = this.emails.filter((e) => e.mailId !== email.mailId);
          if (this.emails.length === 0) {
            this.spinner.hide();
            this.onStepDone.emit();
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

  onSubmit(): void {
    this.onStepDone.emit();
  }
}
