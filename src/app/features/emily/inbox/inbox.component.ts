import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  BuyBoxEmails,
  BuyBoxMicroDeals,
  Contact,
  EmailInfo,
  Mail,
  MailsContact,
} from 'src/app/shared/models/buy-box-emails';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { PlacesService } from 'src/app/core/services/places.service';
import { GenerateContextDTO } from 'src/app/shared/models/GenerateContext';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BreadcrumbService } from 'src/app/core/services/breadcrumb.service';

@Component({
  selector: 'app-inbox',
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.css'],
})
export class InboxComponent implements OnInit {
  BuyBoxMicroDeals: BuyBoxMicroDeals[] = [];
  BuyBoxEmails: BuyBoxEmails[] = []; 
  emailsSentContact: Mail[] = [];
  selectedContact: Contact | null = null; 
  loginContact: any;
  emptyMessage: string = 'Select Contact in organization';
  selectedEmail: EmailInfo | null = null;    
  organization: any = {};
  contacts: Contact[] = [];  
  filteredEmails: Mail[] = []; 
  selectedFilter: string = 'all';
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
  emailBodySafe!: SafeHtml;

  constructor(
    public spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private breadcrumbService: BreadcrumbService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.buyBoxId = Number(params.get('buyBoxId'));
      this.campaignId = params.get('campaignId') || null;
      this.contactId = localStorage.getItem('contactId');
      this.orgId = Number(params.get('organizationId'));
    });
    this.updateBreadcrumb();
    this.getBuyBoxMicroDeals();
    this.getBuyBoxEmails();
    const guid = crypto.randomUUID();
    this.BatchGuid = guid;
  }

  updateBreadcrumb() {
    this.breadcrumbService.addBreadcrumb({
      label: 'Emily',
      url: `/organization-mail/${this.buyBoxId}/${this.orgId}/${this.campaignId}`,
    });
  }

  getBuyBoxEmails(): void {
    const body: any = {
      Name: 'GetBuyBoxEmails',
      MainEntity: null,
      Params: { buyboxid: this.buyBoxId },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.BuyBoxEmails = data.json;
        this.filteredEmails = this.sortEmailsByDateDesc(data.json);

        console.log('Emails', this.filteredEmails);
      },
    });
  }

  toggleBB(bb: any) {
    if (bb.isOpen) {
      bb.isOpen = false;
      return;
    }

    this.BuyBoxMicroDeals.forEach((item) => (item.isOpen = false));

    bb.isOpen = true;
  }

  getBuyBoxMicroDeals() {
    const body: any = {
      Name: 'GetBuyBoxMicroDeals',
      MainEntity: null,
      Params: { buyboxid: this.buyBoxId },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.BuyBoxMicroDeals = data.json;
        console.log('MicroDeals', this.BuyBoxMicroDeals);

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

  sortEmailsByDateDesc(emails: Mail[]): Mail[] {
    return [...emails].sort((a, b) => {
      const dateA = new Date(a.Date).getTime();
      const dateB = new Date(b.Date).getTime();
      return dateB - dateA;
    });
  }

  goBack(): void {
    this.selected = null;
  }

  openEmail(email: Mail): void {
    this.selected = email;
    this.GetMail(email.id);
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
        this.selectedEmail = data.json[0]; 
        this.emailBodySafe = this.sanitizer.bypassSecurityTrustHtml(
          this.selectedEmail!.Body
        );
      },
    });
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

  openmodel(modal: any, body: any, contactId: any) {  
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

  GetShoppingCenters: any[] = [];
  ResponseContextEmail: any;
  GenrateEmail: any;
  ContextEmail: any;
  listcenterName: string[] = [];
  showGenerateSection: boolean = false;
  isEmailBodyEmpty: boolean = true;



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
      } else {
        this.PutComposeEmail();
      }
    } else {
      alert('Please write the Email first then click send');
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
