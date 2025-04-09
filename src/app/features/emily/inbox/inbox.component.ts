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
  emailBodyResponse: any;
  emailSubject: any;
  @Input() orgId!: number;
  @Input() buyBoxId!: number;
  @Output() goBackEvent = new EventEmitter<void>();
  constructor(
    public spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private _location: Location
  ) {}

  ngOnInit() {
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
          const contactWithInbox = this.contacts.find(
            (contact) =>
              contact.EmailStats &&
              contact.EmailStats[0] &&
              contact.EmailStats[0].Inbox > 0
          );
          if (contactWithInbox) {
            this.getEmailsForContact(contactWithInbox);
          } else {
            this.getEmailsForContact(this.contacts[0]);
          }
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

        console.log(`BuyBoxMicroDeals`, this.BuyBoxMicroDeals);

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
      // If same contact and emails already loaded, do nothing.
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
        } else {
          this.selectedEmail = null;
        }
      },
    });
  }
  goBack() {
    this._location.back();
  }
  getTotalEmails(contact: Contact): number {
    return (
      (contact.EmailStats[0].Sent || 0) +
      (contact.EmailStats[0].Inbox || 0) +
      (contact.EmailStats[0].Outbox || 0)
    );
  }
  openCompoase(modal: any) {
    this.modalService.open(modal, { size: 'xl', backdrop: true });
    this.GetContactShoppingCenters();
  }

  openmodel(modal: any, body: any, contactId: any) {
    this.bodyemail = body;
    this.contactIdemail = contactId;
    this.modalService.open(modal, { size: 'xl', backdrop: true });
  }
  getDirectionIcon(direction: number): string {
    return direction === 2
      ? 'fa-envelope-circle-check send'
      : direction === -1
      ? 'fa-share outbox'
      : direction === 1
      ? 'fa-reply inbox'
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

  GetContactShoppingCenters(): void {
    const body: any = {
      Name: 'GetShoppingCentersForContact',
      MainEntity: null,
      Params: {},
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        console.log(data.json);
      },
    });
  }
}
