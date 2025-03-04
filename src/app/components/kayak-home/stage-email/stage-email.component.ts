import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { PlacesService } from 'src/app/services/places.service';
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
} from 'src/models/buy-box-emails';
import { CardModule } from 'primeng/card';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EmailDashboardComponent } from "../email-dashboard/email-dashboard.component";
import { TableModule } from 'primeng/table';

interface Column {
  field: string;
  header: string;
}

@Component({
  selector: 'app-stage-email',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule, AccordionModule, CardModule, TableModule],
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
  selectedContact: Contact | null = null;
  Emails: EmailInfo[] = [];
  loginContact: any;
  emptyMessage: string = 'Select Contact in organization';
  selectedFilter: string = 'all';
  ShowSection: boolean = false;
  EmailDashboard: any[] = [];
  cols!: Column[];
  activeStageId!: number;
  activeOrgId!: number;
  openedStageId: number | null = null;
  openedOrgId: number | null = null;


  constructor(
    public spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.buyBoxId = localStorage.getItem('BuyBoxId');
    this.loginContact = localStorage.getItem('contactId');

    this.cols = [
      { field: 'Organizations', header: 'Organizations' },
      { field: 'Last Activity Date', header: 'Last Activity Date' },
    ];

    this.GetEmailDashboard();
    this.GetBuyBoxMicroDeals();
    this.GetBuyBoxEmails();
    this.GetStages();
  }


  Openaccordion(stageId: number, orgId: number) {
    if (this.openedStageId === stageId && this.openedOrgId === orgId) {
      this.openedStageId = null;
      this.openedOrgId = null;
    } else {
      this.openedStageId = stageId;
      this.openedOrgId = orgId;
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
      ? 'Send'
      : direction === -1
        ? 'Outbox'
        : direction === 1
          ? 'Received'
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

  GetMail(mailId: number, modal: any): void {
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
          this.Emails = data.json;
          this.modalService.open(modal, { size: 'xl', backdrop: true });
        } else {
          this.Emails = [];
        }
        this.mergeStagesWithGetBuyBoxMicroDeals();
        this.spinner.hide();
      },
    });
  }

  mergeStagesWithGetBuyBoxMicroDeals(): void {
    if (this.BuyBoxMicroDeals.length > 0 && this.Stages.length > 0) {
      this.Stages.forEach((stage: Stages) => {
        const matchingEmails = this.BuyBoxMicroDeals.filter(
          (buyBoxEmail: BuyBoxMicroDeals) => buyBoxEmail.StageId === stage.id
        );

        this.stageEmailsMap[stage.id] = matchingEmails;
      });
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
      return mail.MailsContacts.some((element: any) =>
        element.MailContactId === contactId
      );
    });
    this.emailsSentContact = [...mails];
  }

  getReceivedEmails(matchingEmails: any, contactId: number): void {
    let mails = matchingEmails.filter((mail: Mail) => {
      if (mail.ContactId != contactId) {
        return false;
      }
      return mail.MailsContacts.some((element: any) =>
        element.MailContactId == this.loginContact
      );
    });
    mails.forEach((mail: Mail) => {
      this.emailsSentContact.push(mail)
    });
  }

  filterEmails(type: string): void {
    if (type === 'all') {
      this.emailsSentContact = [...this.emailsSentContact];
    } else if (type === 'sent') {
      this.emailsSentContact = this.emailsSentContact.filter(email => email.Direction === 2);
    } else if (type === 'inbox') {
      this.emailsSentContact = this.emailsSentContact.filter(email => email.Direction === 1);
    } else if (type === 'outbox') {
      this.emailsSentContact = this.emailsSentContact.filter(email => email.Direction === -1);
    }
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

    if (type === 'all' && this.emailsSentContact.length === 0) {
      this.emptyMessage = 'empty emails';
    } else if (type !== 'all' && count === 0) {
      this.emptyMessage = `empty ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    }
  }

  getTotalEmails(contact: Contact): number {
    return (contact.EmailStats[0].Sent || 0) +
      (contact.EmailStats[0].Inbox || 0) +
      (contact.EmailStats[0].Outbox || 0);
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
}
