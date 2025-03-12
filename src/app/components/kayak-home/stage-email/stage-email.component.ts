import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { PlacesService } from 'src/app/shared/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgxSpinnerModule } from 'ngx-spinner';
import { AccordionModule } from 'primeng/accordion';
import {
  BuyBoxMicroDeals,
  Stages,
  BuyBoxEmails,
  Mail,
  Contact,
  EmailInfo,
} from 'src/app/shared/models/buy-box-emails';
import { CardModule } from 'primeng/card';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TableModule } from 'primeng/table';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { EditorModule } from 'primeng/editor';
import { EmilyComponent } from '../emily/emily.component';
import { RouterModule } from '@angular/router';

interface Column {
  field: string;
  header: string;
}

@Component({
  selector: 'app-stage-email',
  standalone: true,
  imports: [
    CommonModule,
    NgxSpinnerModule,
    AccordionModule,
    CardModule,
    TableModule,
    ReactiveFormsModule,
    EditorModule,
    EmilyComponent,
    FormsModule,
    RouterModule,
  ],
  providers: [NgxSpinnerService, PlacesService],
  templateUrl: './stage-email.component.html',
  styleUrl: './stage-email.component.css',
})
export class StageEmailComponent implements OnInit {
  buyBoxId!: any;
  BuyBoxMicroDeals: BuyBoxMicroDeals[] = [];
  BuyBoxEmails: BuyBoxEmails[] = [];
  Stages: Stages[] = [];
  stageEmailsMap: { [key: number]: BuyBoxMicroDeals[] } = {};
  emailsSentContact: Mail[] = [];
  filteredEmails: Mail[] = [];
  selectedContact: Contact | null = null;
  Emails: EmailInfo[] = [];
  loginContact: any;
  emptyMessage: string = 'Select Contact in organization';
  selectedFilter: string = 'sent';
  ShowSection: boolean = false;
  ShowResaved: boolean = false;
  EmailDashboard: any[] = [];
  cols!: Column[];
  activeStageId!: number;
  activeOrgId!: number;
  openedStageId: number | null = null;
  openedOrgId: any;
  selectedEmail: EmailInfo | null = null;
  formGroup!: FormGroup;
  bodyemail: any;
  contactIdemail: any;
  accordionClicked: boolean = false;
  accordionSecondClicked: boolean = false;

  constructor(
    public spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.buyBoxId = localStorage.getItem('BuyBoxId');
    this.loginContact = localStorage.getItem('contactId');

    this.cols = [
      { field: 'Organizations', header: 'Organizations' },
      { field: 'Last Activity Date', header: 'Last Activity Date' },
    ];

    this.formGroup = new FormGroup({
      body: new FormControl(''),
      subject: new FormControl(''),
      IsCC: new FormControl(false),
    });

    this.GetEmailDashboard();
    this.GetBuyBoxMicroDeals();
    this.GetBuyBoxEmails();
    this.GetStages();
  }

  Openaccordion(stageId: number, orgId: number) {
    this.accordionClicked = true;
    this.accordionSecondClicked = true;
    this.openedStageId = stageId;
    this.openedOrgId = orgId;

    const stageEmails = this.stageEmailsMap[stageId];
    if (stageEmails) {
      for (let email of stageEmails) {
        if (email.Organization) {
          for (let org of email.Organization) {
            if (org.OrganizationId === orgId) {
              if (org.Contact && org.Contact.length > 0) {
                this.getEmailsForContact(org.Contact[0]);
                return;
              }
            }
          }
        }
      }
    }
  }

  getActiveIndex(stageId: number): number {
    if (this.openedStageId === stageId) {
      return 0;
    }
    return -1;
  }

  getActiveIndex2(orgId: number): number {
    if (this.openedOrgId === orgId) {
      return 0;
    }
    return -1;
  }

  onButtonClicked() {
    this.ShowSection = false;
  }

  getDirection(direction: number): string {
    return direction === 2
      ? 'fa-envelope-circle-check send'
      : direction === -1
      ? 'fa-share outbox'
      : direction === 1
      ? 'fa-reply outbox'
      : '';
  }

  GetBuyBoxEmails(): void {
    this.spinner.show();

    const body: any = {
      Name: 'GetBuyBoxEmails',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && Array.isArray(data.json)) {
          this.BuyBoxEmails = data.json;
        } else {
          this.BuyBoxEmails = [];
        }
        this.spinner.hide();
      },
    });
  }

  GetBuyBoxMicroDeals(): void {
    this.spinner.show();

    const body: any = {
      Name: 'GetBuyBoxMicroDeals',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && Array.isArray(data.json)) {
          this.BuyBoxMicroDeals = data.json;
        } else {
          this.BuyBoxMicroDeals = [];
        }
        this.mergeStagesWithGetBuyBoxMicroDeals();
        this.spinner.hide();
      },
    });
  }

  GetStages(): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetStages',
      MainEntity: null,
      Params: {},
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && Array.isArray(data.json)) {
          this.Stages = data.json;
        } else {
          this.Stages = [];
        }
        this.mergeStagesWithGetBuyBoxMicroDeals();
        this.spinner.hide();
      },
    });
  }

  GetMail(mailId: number): void {
    this.spinner.show();

    const body: any = {
      Name: 'GetMail',
      MainEntity: null,
      Params: {
        mailid: mailId,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && Array.isArray(data.json)) {
          this.selectedEmail = data.json[0];
          this.SetAsOpen(mailId);
        } else {
          this.selectedEmail = null;
        }
        this.mergeStagesWithGetBuyBoxMicroDeals();
        this.spinner.hide();
      },
    });
  }

  SetAsOpen(mailId: number): void {
    this.spinner.show();

    const body: any = {
      Name: 'SetAsOpen',
      MainEntity: null,
      Params: {
        mailid: mailId,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.spinner.hide();
      },
    });
  }

  close() {
    this.selectedEmail = null;
  }

  mergeStagesWithGetBuyBoxMicroDeals(): void {
    if (this.BuyBoxMicroDeals.length > 0 && this.Stages.length > 0) {
      this.Stages.forEach((stage: Stages) => {
        const matchingEmails = this.BuyBoxMicroDeals.filter(
          (buyBoxEmail: BuyBoxMicroDeals) => buyBoxEmail.StageId === stage.id
        );
        this.stageEmailsMap[stage.id] = matchingEmails;
      });
      if (!this.openedStageId && this.Stages.length > 0) {
        this.openedStageId = this.Stages[0].id;
      }
    }
  }

  OverView() {
    this.ShowSection = false;
    this.accordionClicked = false;
    this.accordionSecondClicked = false;
    this.openedOrgId = null;
    if (this.Stages.length > 0) {
      this.openedStageId = this.Stages[0].id;
    }
  }

  getEmailsForContact(contact: Contact): void {
    this.emailsSentContact = [];
    this.selectedContact = contact;
    this.emptyMessage = '';
    this.ShowSection = true;

    const matchingEmails = this.BuyBoxEmails.flatMap(
      (buyBoxEmail) => buyBoxEmail.mail
    );

    // new line
    // this.emailsSentContact = [...this.emailsSentContact];
    if (this.emailsSentContact.length === 0) {
      this.emptyMessage = 'empty emails';
    }

    this.getSentEmails(matchingEmails, contact.ContactId);
    this.getReceivedEmails(matchingEmails, contact.ContactId);
  }

  getSentEmails(matchingEmails: any, contactId: number): void {
    let mails = matchingEmails.filter((mail: Mail) => {
      if (mail.ContactId != this.loginContact) {
        return false;
      }
      return mail.MailsContacts.some(
        (element: any) => element.MailContactId === contactId
      );
    });
    this.emailsSentContact = [...mails];
    this.selectedFilter = 'sent';
    this.checkAndFilterEmails('sent');
  }

  getReceivedEmails(matchingEmails: any, contactId: number): void {
    console.log(`match emails`);
    console.log(matchingEmails);

    let mails = matchingEmails.filter((mail: Mail) => {
      if (mail.ContactId != contactId) {
        return false;
      }
      return mail.MailsContacts.some(
        (element: any) => element.MailContactId == this.loginContact
      );
    });
    mails.forEach((mail: Mail) => {
      this.emailsSentContact.push(mail);
    });
  }

  checkAndFilterEmails(type: string): void {
    this.selectedFilter = type;
    let count = 0;
    this.emptyMessage = '';

    if (type === 'sent') {
      count = this.selectedContact?.EmailStats[0].Sent || 0;
    } else if (type === 'inbox') {
      count = this.selectedContact?.EmailStats[0].Inbox || 0;
    } else if (type === 'outbox') {
      count = this.selectedContact?.EmailStats[0].Outbox || 0;
    }

    this.filterEmails(type);

    if (type === 'all' && this.filteredEmails.length === 0) {
      this.emptyMessage = 'empty emails';
    } else if (type !== 'all' && count === 0) {
      this.emptyMessage = `empty ${
        type.charAt(0).toUpperCase() + type.slice(1)
      }`;
    }
  }

  filterEmails(type: string): void {
    if (type === 'sent') {
      this.filteredEmails = this.emailsSentContact.filter(
        (email) => email.Direction == 2
      );
    } else if (type === 'inbox') {
      this.filteredEmails = this.emailsSentContact.filter(
        (email) => email.Direction == 1
      );
    } else if (type === 'outbox') {
      this.filteredEmails = this.emailsSentContact.filter(
        (email) => email.Direction == -1
      );
    }
  }

  getTotalEmails(contact: Contact): number {
    return (
      (contact.EmailStats[0].Sent || 0) +
      (contact.EmailStats[0].Inbox || 0) +
      (contact.EmailStats[0].Outbox || 0)
    );
  }

  GetEmailDashboard(): void {
    this.spinner.show();

    const body: any = {
      Name: 'EmailDashboard',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && Array.isArray(data.json)) {
          this.EmailDashboard = data.json;
        } else {
          this.EmailDashboard = [];
        }
        this.spinner.hide();
      },
    });
  }

  AddEmail() {
    this.spinner.show();

    const body: any = {
      Name: 'AddEmail',
      MainEntity: null,
      Params: {
        Body: this.formGroup.get('body')?.value + this.bodyemail,
        Date: new Date().toISOString(),
        Subject: this.formGroup.get('subject')?.value,
        Direction: -1,
        outbox: '',
        BuyBoxId: +this.buyBoxId,
        IsCC: this.formGroup.get('IsCC')?.value ? 1 : 0,
        FromContactId: +this.loginContact,
        ContactIds: String(this.contactIdemail),
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.spinner.hide();
      },
    });
  }

  Send() {
    console.log('Editor Content:', this.formGroup.get('text')?.value);
    this.AddEmail();
  }

  openmodel(modal: any, body: any, contactId: any) {
    this.bodyemail = body;
    this.contactIdemail = contactId;
    this.modalService.open(modal, { size: 'xl', backdrop: true });
  }
}
