import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  BuyBoxEmails,
  BuyBoxMicroDeals,
  Contact,
  EmailInfo,
  Mail,
  MailsContact,
  Stages,
} from 'src/app/shared/models/buy-box-emails';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { PlacesService } from 'src/app/core/services/places.service';
import { EditorModule } from 'primeng/editor';
import { GenerateContextDTO } from 'src/app/shared/models/GenerateContext';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.css'],
})
export class InboxComponent implements OnInit {
  BuyBoxMicroDeals: BuyBoxMicroDeals[] = [];
  BuyBoxEmails: BuyBoxEmails[] = [];
  Stages: Stages[] = [];
  emailsSentContact: Mail[] = [];
  selectedContact: Contact | null = null;
  Emails: EmailInfo[] = [];
  loginContact: any;
  emptyMessage: string = 'Select Contact in organization';
  selectedEmail: EmailInfo | null = null;
  selectedMicroDealId!: number;
  formGroup!: FormGroup;
  bodyemail: any;
  contactIdemail: any;
  selectedOrganizationName!: string;
  organization: any = {};
  contacts: Contact[] = [];
  emails: EmailInfo[] = [];
  isScrolling = false;
  filteredEmails: Mail[] = [];
  isDropdownVisible: boolean = false; // Controls the visibility of the dropdown
  selectedFilter: string = 'all'; // Default selected filter
  selectedOption: string = 'All'; // Default text in the dropdown
  selectedMicro: any;
  selected: any = null;
  campaignId: any;
  emailBody: string = '';
  emailSubject: string = '';
  @Input() orgId!: number;
  @Input() buyBoxId!: number;
  @Output() goBackEvent = new EventEmitter<void>();

  contactId!: any;
  BatchGuid!: string;
  inputChanged: Subject<void> = new Subject<void>();
  emailBodySafe!: SafeHtml;

  constructor(
    public spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private _location: Location,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.contactId = localStorage.getItem('contactId');

    this.route.paramMap.subscribe((params) => {
      const buyboxId = params.get('buyBoxId');
      this.campaignId = params.get('campaignId');

      if (buyboxId) {
        this.buyBoxId = +buyboxId;
      }
      const orgId = params.get('organizationId');
      if (orgId) {
        this.orgId = +orgId;
      }
    });
    this.loadInitialData();
    const guid = crypto.randomUUID();
    this.BatchGuid = guid;

    this.inputChanged.pipe(debounceTime(300)).subscribe(() => {
      this.onInputChange();
    });
  }

  toggleDropdown() {
    this.isDropdownVisible = !this.isDropdownVisible;
  }

  loadInitialData(): void {
    this.filteredEmails = [];
    this.emailsSentContact = [];
    this.selectedEmail = null;
    this.BuyBoxMicroDeals = [];
    this.BuyBoxEmails = [];
    const microDealsPromise = new Promise<void>((resolve) => {
      this.GetBuyBoxMicroDeals(resolve);
    });
    const emailsPromise = new Promise<void>((resolve) => {
      this.GetBuyBoxEmails(resolve);
    });
    Promise.all([microDealsPromise, emailsPromise])
      .then(() => {
        if (this.contacts && this.contacts.length > 0) {
          // const contactWithInbox = this.contacts.find(
          //   (contact) =>
          //     contact.EmailStats &&
          //     contact.EmailStats[0] &&
          //     contact.EmailStats[0].Inbox > 0
          // );
          // if (contactWithInbox) {
          //   this.getEmailsForContact(contactWithInbox);
          // } else {
          //   this.getEmailsForContact(this.contacts[0]);
          // }
          this.getEmailsForContact(this.contacts[0]);
        }
      })
      .catch((error) => {});
  }

  onMicroDealChange(event: any): void {
    const selectedOrgId = event.target.value;
    this.contacts =
      this.BuyBoxMicroDeals.find((org) => org.OrganizationId == selectedOrgId)
        ?.Contact || [];

    this.GetBuyBoxEmails(() => {
      if (this.contacts.length > 0) {
        this.getEmailsForContact(this.contacts[0]);
      }
    });
  }

  GetBuyBoxMicroDeals(callback?: Function): void {
    const body: any = {
      Name: 'GetBuyBoxMicroDeals',
      MainEntity: null,
      Params: { buyboxid: this.buyBoxId },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.BuyBoxMicroDeals = data.json;

        // console.log(`BuyBoxMicroDeals`, this.BuyBoxMicroDeals);

        this.contacts = [];
        const microDeal = this.BuyBoxMicroDeals.find(
          (deal) => deal.OrganizationId === this.orgId
        );

        if (microDeal) {
          this.selectedMicro = microDeal.OrganizationId;
          this.contacts = microDeal.Contact;
        } else {
          this.contacts = this.BuyBoxMicroDeals[0].Contact;
          this.selectedMicro = this.BuyBoxMicroDeals[0].OrganizationId;
        }

        // this.selectedOrganizationName = this.BuyBoxMicroDeals.flatMap((m) =>
        //   m.Organization.filter((o) => o.OrganizationId === this.orgId).flatMap(
        //     (o) => o.OrganizationName || ''
        //   )
        // ).join(', ');

        // this.selectedOrganizationName =
        //   this.BuyBoxMicroDeals.find((m) => m.OrganizationId == this.orgId)
        //     ?.OrganizationName || '';

        // this.BuyBoxMicroDeals = [];
        this.GetBuyBoxEmails(() => {
          if (this.contacts.length > 0) {
            this.getEmailsForContact(this.contacts[0]);
          }
        });
      },
    });
  }

  GetBuyBoxEmails(callback?: Function): void {
    const body: any = {
      Name: 'GetBuyBoxEmails',
      MainEntity: null,
      Params: { buyboxid: this.buyBoxId },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.BuyBoxEmails = data.json;

        if (callback) {
          callback();
        }
      },
    });
  }
  getEmailsForContact(contact: Contact): void {
    if (this.selectedContact?.ContactId !== contact.ContactId) {
      this.selectedContact = contact;
      this.emailsSentContact = [];
      this.filteredEmails = [];
      this.emptyMessage = '';
      this.selectedEmail = null;
      this.selected = null; // Reset selected email to show the list view
    } else if (this.emailsSentContact.length > 0) {
      return;
    }

    // Since the API returns emails directly, use them as-is.
    const matchingEmails: any[] = this.BuyBoxEmails;

    // Filter emails that are related to the selected contact.
    this.emailsSentContact = matchingEmails?.filter(
      (email: Mail) =>
        email?.ContactId === contact.ContactId ||
        (email?.MailsContacts &&
          email.MailsContacts.some(
            (mc: MailsContact) => mc.MailContactId === contact.ContactId
          ))
    );

    // Apply the current filter (inbox, sent, etc.) on the loaded emails.
    this.filterEmails(this.selectedFilter);

    // If there are no emails, show an empty message.
    if (this.emailsSentContact.length === 0) {
      this.emptyMessage = 'No emails available for this contact';
    } else if (this.filteredEmails.length > 0) {
      // Open the first email by default.
      // this.openEmail(this.filteredEmails[0]); // Commented out to not auto-select
    }
  }

  // Scroll function and load email details API.
  openEmail(email: Mail): void {
    this.selected = email;
    this.GetMail(email.id);
  }

  goBackk(): void {
    this.selected = null;
  }
  GetMail(mailId: number): void {
    const body: any = {
      Name: 'GetMail',
      MainEntity: null,
      Params: { mailid: mailId, identity: this.loginContact },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && Array.isArray(data.json)) {
          this.selectedEmail = data.json[0];
          this.selectedMicroDealId = this.selectedEmail!.MicroDealId;
          this.emailBodySafe = this.sanitizer.bypassSecurityTrustHtml(
            this.selectedEmail!.Body
          );
        } else {
          this.selectedEmail = null;
        }
      },
    });
  }
  goBack() {
    this._location.back();
  }
  getTotalEmails(EmailStats: any): number {
    return (
      (EmailStats.Sent || 0) +
      (EmailStats.Inbox || 0) +
      (EmailStats.Outbox || 0)
    );
  }
  openCompoase(modal: any) {
    this.listcenterName = [];
    this.emailSubject = '';
    this.emailBody = '';
    this.ContextEmail = '';
    this.showGenerateSection = false;
    this.GetContactShoppingCenters();
    this.modalService.open(modal, { size: 'xl', backdrop: true });
  }

  openmodel(modal: any, body: any, contactId: any) {
    this.bodyemail = body;
    this.contactIdemail = contactId;
    this.modalService.open(modal, { size: 'xl', backdrop: true });
  }
  getDirectionIcon(direction: number): string {
    return direction === 2
      ? 'fa-reply send'
      : direction === -1
      ? 'fa-reply outbox'
      : direction === 1
      ? 'fa-share inbox'
      : '';
  }
  filterEmails(filterType: string): void {
    this.selectedFilter = filterType;
    this.isDropdownVisible = false; // Set this to false to hide the dropdown
    this.selected = null; // Reset selected email to show the list view

    // If no emails or contact selected, don't try to filter.
    if (!this.selectedContact || this.emailsSentContact?.length === 0) {
      this.filteredEmails = [];
      this.selectedEmail = null;
      return;
    }
    // Apply the filter based on the selected type.
    let filtered: Mail[] = [];
    switch (filterType) {
      case 'inbox':
        filtered = this.emailsSentContact.filter(
          (email) => email.Direction === 1
        );
        break;
      case 'outbox':
        filtered = this.emailsSentContact.filter(
          (email) => email.Direction === -1
        );
        break;
      case 'sent':
        filtered = this.emailsSentContact.filter(
          (email) => email.Direction === 2
        );
        break;
      case 'all':
      default:
        filtered = [...this.emailsSentContact];
        break;
    }

    // Sort emails by date in descending order (newest first).
    this.filteredEmails = this.sortEmailsByDateDesc(filtered);
    if (this.filteredEmails.length === 0) {
      this.emptyMessage = `No ${filterType} emails available for this contact`;
      this.selectedEmail = null;
    } else if (
      !this.selectedEmail ||
      !this.filteredEmails.some((email) => email.id === this.selectedEmail?.ID)
    ) {
      // Don't auto-select the first email anymore
      // this.openEmail(this.filteredEmails[0]);
    }
  }

  sortEmailsByDateDesc(emails: Mail[]): Mail[] {
    return [...emails].sort((a, b) => {
      const dateA = new Date(a.Date).getTime();
      const dateB = new Date(b.Date).getTime();
      return dateB - dateA;
    });
  }

  GetShoppingCenters: any[] = [];
  ResponseContextEmail: any;
  GenrateEmail: any;
  ContextEmail: any;
  listcenterName: string[] = [];
  showGenerateSection: boolean = false;
  isEmailBodyEmpty: boolean = true;

  GetContactShoppingCenters(): void {
    const body: any = {
      Name: 'GetShoppingCentersForContact',
      MainEntity: null,
      Params: {},
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.GetShoppingCenters = data.json;
      },
    });
  }

  onCheckboxChange(event: any, item: any) {
    this.showGenerateSection = true;
    if (event.target.checked) {
      if (!this.listcenterName.includes(item.centerName)) {
        this.listcenterName.push(item.centerName);
      }
    } else {
      const index = this.listcenterName.indexOf(item.centerName);
      if (index > -1) {
        this.listcenterName.splice(index, 1);
      }
    }
    this.showGenerateSection = this.listcenterName.length > 0;
  }

  async PutGenerateContext(): Promise<void> {
    this.ResponseContextEmail = {};

    const ContactName = `${this.selectedContact?.Firstname ?? ''} ${
      this.selectedContact?.Lastname ?? ''
    }`.trim();
    const ContantID = Number(this.selectedContact?.ContactId);
    const ContantShoppingCenter = this.listcenterName;

    this.spinner.show();
    const body: GenerateContextDTO = {
      ContactId: this.contactId,
      BuyBoxId: this.buyBoxId,
      CampaignId: this.campaignId,
      AddMinMaxSize: true,
      AddCompetitors: true,
      AddComplementaries: true,
      AddBuyBoxManageOrgDesc: true,
      AddSpecificBuyBoxDesc: true,
      AddBuyBoxDesc: true,
      AddLandLordPage: true,
      IsCC: true,
      GetContactManagers: [
        {
          ContactId: ContantID,
          ContactName: ContactName,
          ShoppingCentersName: ContantShoppingCenter,
        },
      ],
      OrganizationId: this.orgId,
    };

    this.PlacesService.GenerateContext(body).subscribe({
      next: (data) => {
        this.ResponseContextEmail = data;
        this.ContextEmail = this.ResponseContextEmail.context;
        this.ContextEmail = this.ContextEmail.replace(/\n/g, '<br>');
        this.showGenerateSection = true;
        this.spinner.hide();
      },
    });
  }

  async PutComposeEmail(): Promise<void> {
    this.spinner.show();
    const body: any = {
      Name: 'ComposeEmail',
      MainEntity: null,
      Params: {
        BuyBoxId: this.buyBoxId,
        CampaignId: this.campaignId,
        RecieverId: [Number(this.selectedContact?.ContactId)].join(','),
        Subject: this.emailSubject,
        Body: this.emailBody,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.GenrateEmail = data.json;
        this.spinner.hide();
        this.showGenerateSection = false;
        this.modalService.dismissAll();
        this.listcenterName = [];
        this.emailSubject = '';
        this.emailBody = '';
        this.ContextEmail = '';
        this.showToast('Send Success');
      },
    });
  }

  async PutMailsDraft(): Promise<void> {
    this.PutGenerateContext();

    this.spinner.show();
    const body: any = {
      Name: 'PutMailsDraft',
      MainEntity: null,
      Params: {
        BuyBoxId: this.buyBoxId,
        ContactId: this.contactId,
        PromptId: 21,
        IsCC: true,
        OrganizationId: this.orgId,
        context: this.ContextEmail,
        BatchGuid: this.BatchGuid,
        CampaignId: this.campaignId,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.spinner.hide();
        this.showGenerateSection = false;
        this.modalService.dismissAll();
        this.listcenterName = [];
        this.emailSubject = '';
        this.emailBody = '';
        this.ContextEmail = '';
        this.showToast('Generate Success');
      },
    });
  }

  Send(showGenerate: string) {
    if (this.emailSubject || this.ContextEmail || this.emailBody) {
      const ToggleGenerate = showGenerate;
      if (ToggleGenerate == 'Generate') {
        this.PutMailsDraft();
        // console.log('Generate');
      } else {
        this.PutComposeEmail();
        // console.log('Send');
      }
    } else {
      alert('Please write the Email first then click send');
    }
  }

  onInputChange(): void {
    const subjectEmpty = !this.emailSubject || this.emailSubject.trim() === '';
    const bodyTrimmed = (this.emailBody || '').trim();
    this.isEmailBodyEmpty = bodyTrimmed === '' || bodyTrimmed === '<p></p>';

    if (!subjectEmpty || !this.isEmailBodyEmpty) {
      this.showGenerateSection = false;
    }
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
