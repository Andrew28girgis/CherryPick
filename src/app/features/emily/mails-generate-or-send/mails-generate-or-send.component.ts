import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/core/services/places.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BreadcrumbService } from 'src/app/core/services/breadcrumb.service';

@Component({
  selector: 'app-mails-generate-or-send',
  templateUrl: './mails-generate-or-send.component.html',
  styleUrl: './mails-generate-or-send.component.css',
})
export class MailsGenerateOrSendComponent {
  MailContextId!: any;
  IsSent!: any;
  contactId!: any;
  returnGetMailContextGenerated!: any;
  emailBody!: SafeHtml;

  constructor(
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private sanitizer: DomSanitizer,
    private breadcrumbService: BreadcrumbService
  ) {
    this.route.paramMap.subscribe((params) => {
      this.MailContextId = params.get('MailContextId');
      this.IsSent = params.get('IsSent');
    });
  }

  async ngOnInit() {
    this.contactId = localStorage.getItem('contactId');
    if (this.MailContextId && this.IsSent) {
      this.ReadSpecificMails();
    }
    this.breadcrumbService.addBreadcrumb({
      label: 'MailsList',
      url: `MailsList/${this.MailContextId}/${this.IsSent}`,
    });
  }

  ReadSpecificMails() {
    this.spinner.show();
    const isSentBoolean =
      this.IsSent === '1' ? 0 : this.IsSent === '2' ? 1 : Boolean(this.IsSent);

    var body: any = {
      Name: 'ReadSpecificMails',
      MainEntity: null,
      Params: {
        MailContextId: Number(this.MailContextId),
        IsSent: isSentBoolean,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.returnGetMailContextGenerated = data.json;
        // Sanitize and apply HTML content to emailBody
        this.emailBody = this.sanitizer.bypassSecurityTrustHtml(
          this.returnGetMailContextGenerated[0].body
        );
        this.spinner.hide();
      },
    });
  }

  SendMailTemplate(emailItem: any) {
    this.spinner.show();

    var body: any = {
      Name: 'SendMail',
      MainEntity: null,
      Params: {
        MailId: emailItem.mailId,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.showToast('Email Send successfully!');
        this.ReadSpecificMails();
        this.spinner.hide();
      },
    });
  }

  DeleteMailTemplate(emailItem: any) {
    this.spinner.show();

    var body: any = {
      Name: 'DeleteMail',
      MainEntity: null,
      Params: {
        MailId: emailItem.mailId,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.showToast('Email Deleted successfully!');
        this.ReadSpecificMails();
        this.spinner.hide();
      },
    });
  }

  updateBody(event: any, returnEmail: any) {
    returnEmail.body = event.target.innerHTML;
    this.UpdateGeneration(returnEmail);
  }
  UpdateGeneration(emailItem?: any) {
    this.spinner.show();
    var body: any = {
      Name: 'UpdateGeneration',
      MainEntity: null,
      Params: {
        id: emailItem.mailId,
        body: emailItem.body,
        subject: emailItem.subject,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.ReadSpecificMails();
        this.spinner.hide();
      },
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

  closeToast() {
    const toast = document.getElementById('customToast');
    toast!.classList.remove('show');
  }
}
