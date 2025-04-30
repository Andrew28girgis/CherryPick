import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {
  BuyBoxEmails,
  BuyBoxMicroDeals,
  Contact,
  EmailInfo,
  Mail,
} from 'src/app/shared/models/buy-box-emails';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { PlacesService } from 'src/app/core/services/places.service';
import { GenerateContextDTO } from 'src/app/shared/models/GenerateContext';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BreadcrumbService } from 'src/app/core/services/breadcrumb.service';
import { EmailComposeComponent } from './email-compose/email-compose.component';
import { IEmailContent } from '../../kayak-home/shopping-center-table/contact-broker/models/iemail-content';

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
  emptyMessage: string = '';
  selectedEmail: EmailInfo | null = null;
  organization: any = {};
  contacts: Contact[] = [];
  filteredEmails: Mail[] = [];
  selectedFilter: string = 'all';
  selectedMicro: any;
  selected: any = null;
  campaignId: any;
  emailBody: string = '';
  sanitizedEmailBody!: SafeHtml; // ONLY for [innerHTML] if you display it elsewhere
  sanitizedEmailBodyDraft!: SafeHtml;
  emailSubject: string = '';
  @Input() orgId!: number;
  @Input() buyBoxId!: number;
  @Output() goBackEvent = new EventEmitter<void>();
  contactId!: any;
  BatchGuid!: string;
  emailBodySafe!: SafeHtml;

  GetShoppingCenters: any[] = [];
  ResponseContextEmail: any;
  GenrateEmail: any;
  ContextEmail: any;
  listcenterName: string[] = [];
  showGenerateSection: boolean = false;
  isEmailBodyEmpty: boolean = true;
  selectedEmailToDelete: any | null;
  @ViewChild('deleteEmailModal') deleteEmailModal: any;
  @ViewChild('sendEmailModal') sendEmailModal: any;
  selectedEmailForSend: EmailInfo | null = null;
  emailSubjectModal?: string = '';
  emailBodySafeModal: SafeHtml = '';
  constructor(
    public spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private breadcrumbService: BreadcrumbService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.buyBoxId = Number(params.get('buyBoxId'));
      this.campaignId = params.get('campaignId') || null;
      this.orgId = Number(params.get('organizationId'));
      this.contactId = localStorage.getItem('contactId');
    });
    this.updateBreadcrumb();
    this.getOrganizations();
    this.getAllEmails();
    const guid = crypto.randomUUID();
    this.BatchGuid = guid;
  }

  updateBreadcrumb() {
    this.breadcrumbService.addBreadcrumb({
      label: 'Emily',
      url: `/organization-mail/${this.buyBoxId}/${this.orgId}/${this.campaignId}`,
    });
  }

  // getAllEmails(): void {
  //   const body: any = {
  //     Name: 'GetBuyBoxEmails',
  //     MainEntity: null,
  //     Params: { buyboxid: this.buyBoxId },
  //     Json: null,
  //   };
  //   this.PlacesService.GenericAPI(body).subscribe({
  //     next: (data) => {
  //       this.BuyBoxEmails = data.json;
  //       this.filteredEmails = this.sortEmails(data.json);
  //     },
  //   });
  // }
  getAllEmails(): void {
    const body: any = {
      Name: 'GetBuyBoxEmails',
      MainEntity: null,
      Params: { buyboxid: this.buyBoxId },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.BuyBoxEmails = data.json;
        this.filteredEmails = this.sortEmails(data.json);
        // Apply the current filter
        this.filterEmails(this.selectedFilter);
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

  getOrganizations() {
    const body: any = {
      Name: 'GetBuyBoxMicroDeals',
      MainEntity: null,
      Params: { buyboxid: this.buyBoxId },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.BuyBoxMicroDeals = data.json;
        this.contacts = [];
        const microDeal = this.BuyBoxMicroDeals.find(
          (deal) => deal.OrganizationId === this.orgId
        );

        if (microDeal) {
          this.selectedMicro = microDeal.OrganizationId;
          this.contacts = microDeal.Contact;
          this.getEmailsForContact(this.contacts[0]);
          this.BuyBoxMicroDeals.forEach((item) => {
            if (item.OrganizationId === this.selectedMicro) {
              item.isOpen = true;
              // this.scrollToOpenItem(item);
            }
          });
        } else {
          this.contacts = this.BuyBoxMicroDeals[0].Contact;
          this.selectedMicro = this.BuyBoxMicroDeals[0].OrganizationId;
        }
        this.changeDetectorRef.detectChanges();
      },
    });
  }
  // @ViewChildren('itemRef') itemRefs: QueryList<any> | undefined;
  // ngAfterViewChecked() {
  //   // After view checks, try scrolling to the first opened item
  //   const firstOpenItem = this.BuyBoxMicroDeals.find((item) => item.isOpen);
  //   if (firstOpenItem) {
  //     this.scrollToOpenItem(firstOpenItem);
  //   }
  // }
  // scrollToOpenItem(bb: any): void {
  //   // Find the corresponding element using the data-org-id attribute
  //   const element = this.itemRefs
  //     ?.toArray()
  //     .find(
  //       (item) =>
  //         item.nativeElement.getAttribute('data-org-id') ===
  //         bb.OrganizationId.toString()
  //     );
  //   if (element) {
  //     // Scroll the item into view
  //     element.nativeElement.scrollIntoView({
  //       behavior: 'smooth',
  //       block: 'start',
  //     });
  //   }
  // }

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
        (email?.O &&
          email.O.some(
            (organization: { MailsContacts: { MailContactId: number }[] }) =>
              organization.MailsContacts.some(
                (mc: { MailContactId: number }) =>
                  mc.MailContactId === contact.ContactId
              )
          ))
    );

    // console.log('matchingEmails', this.emailsSentContact);

    this.filterEmails(this.selectedFilter);
    if (this.emailsSentContact.length === 0) {
      this.emptyMessage = 'No emails available for this contact';
    } else if (this.filteredEmails.length > 0) {
    }
  }

  sortEmails(emails: Mail[]): Mail[] {
    return [...emails].sort((a, b) => {
      const dateA = new Date(a.Date).getTime();
      const dateB = new Date(b.Date).getTime();
      return dateB - dateA;
    });
  }

  goBack(): void {
    this.selected = null;
    this.emailSubjectModal = '';
    this.emailBodySafeModal = '';
  }

  openEmail(email: Mail): void {
    this.selected = email;
    this.getOneMail(email.id);
  }

  getOneMail(mailId: number): void {
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
        this.emailBodySafeModal = this.emailBodySafe;
        this.emailSubjectModal = this.selectedEmail?.Subject;
      },
    });
  }

  getTotalEmailsCount(EmailStats: any): number {
    return (
      (EmailStats.Sent || 0) +
      (EmailStats.Inbox || 0) +
      (EmailStats.Outbox || 0)
    );
  }

  GetContactShoppingCenters(contactId: number): void {
    const body: any = {
      Name: 'GetShoppingCentersForContact',
      MainEntity: null,
      Params: {
        ContactId: contactId,
        CampaignId: this.campaignId,
      },
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
      ? 'fa-reply send' // Sent
      : direction === -1
      ? 'fa-reply outbox' // Outbox
      : direction === 1
      ? 'fa-share inbox' // Inbox
      : direction === 4
      ? 'fa-pencil-alt drafts' // Drafts
      : ''; // Default: return an empty string if the direction is unknown
  }
  getDirectionLabel(direction: number): string {
    return direction === 2
      ? 'Sent'
      : direction === -1
      ? 'Outbox'
      : direction === 1
      ? 'Inbox'
      : direction === 4
      ? 'Drafts'
      : 'Unknown';
  }
  getDirectionColor(direction: number): string {
    switch (direction) {
      case 2:
        return '#d1e7dd'; // Sent - greenish
      case -1:
        return '#f8d7da'; // Outbox - reddish
      case 1:
        return '#cff4fc'; // Inbox - light blue
      case 4:
        return '#fff3cd'; // Drafts - yellowish
      default:
        return '#e2e3e5'; // Unknown - grey
    }
  }

  // filterEmails(filterType: string): void {
  //   this.selectedFilter = filterType;
  //   this.selected = null; // Reset selected email to show the list view

  //   // If no emails or contact selected, don't try to filter.
  //   if (!this.selectedContact || this.emailsSentContact?.length === 0) {
  //     this.filteredEmails = [];
  //     this.selectedEmail = null;
  //     return;
  //   }
  //   // Apply the filter based on the selected type.
  //   let filtered: Mail[] = [];
  //   switch (filterType) {
  //     case 'inbox':
  //       filtered = this.emailsSentContact.filter(
  //         (email) => email.Direction === 1
  //       );
  //       break;
  //     case 'outbox':
  //       filtered = this.emailsSentContact.filter(
  //         (email) => email.Direction === -1
  //       );
  //       break;
  //     case 'sent':
  //       filtered = this.emailsSentContact.filter(
  //         (email) => email.Direction === 2
  //       );
  //       break;
  //     case 'drafts':
  //       filtered = this.emailsSentContact.filter(
  //         (email) => email.Direction === 4
  //       );
  //       break;
  //     case 'all':
  //     default:
  //       filtered = [...this.emailsSentContact];
  //       break;
  //   }
  //   this.filteredEmails = this.sortEmails(filtered);
  //   if (this.filteredEmails.length === 0) {
  //     this.emptyMessage = `No ${filterType} emails available for this contact`;
  //     this.selectedEmail = null;
  //   } else if (
  //     !this.selectedEmail ||
  //     !this.filteredEmails.some((email) => email.id === this.selectedEmail?.ID)
  //   ) {
  //   }
  // }
  filterEmails(filterType: string): void {
    this.selectedFilter = filterType;
    this.selected = null; // Reset selected email to show the list view
    // Create a properly typed source array based on whether a contact is selected
    let sourceEmails: Mail[] = [];
    if (this.selectedContact) {
      // If contact is selected, use their emails
      sourceEmails = this.emailsSentContact;
    } else {
      // If no contact is selected, use all emails
      sourceEmails = this.BuyBoxEmails as any[] as Mail[];
      // You might need to adjust this depending on the actual structure of BuyBoxEmails
    }
    // If no emails available, don't try to filter
    if (!sourceEmails || sourceEmails.length === 0) {
      this.filteredEmails = [];
      this.selectedEmail = null;
      this.emptyMessage = 'No emails available';
      return;
    }
    // Apply the filter based on the selected type
    let filtered: Mail[] = [];
    switch (filterType) {
      case 'inbox':
        filtered = sourceEmails.filter((email) => email.Direction === 1);
        break;
      case 'outbox':
        filtered = sourceEmails.filter((email) => email.Direction === -1);
        break;
      case 'sent':
        filtered = sourceEmails.filter((email) => email.Direction === 2);
        break;
      case 'drafts':
        filtered = sourceEmails.filter((email) => email.Direction === 4);
        break;
      case 'all':
      default:
        filtered = [...sourceEmails];
        break;
    }
    this.filteredEmails = this.sortEmails(filtered);
    if (this.filteredEmails.length === 0) {
      // this.emptyMessage = `No ${filterType} emails available`;
      this.selectedEmail = null;
    }
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

  generateContext() {
    this.ResponseContextEmail = {};
    const ContactName = `${this.selectedContact?.Firstname ?? ''} ${
      this.selectedContact?.Lastname ?? ''
    }`.trim();

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
          ContactId: Number(this.selectedContact?.ContactId),
          ContactName: ContactName,
          ShoppingCentersName: this.listcenterName,
        },
      ],
      OrganizationId: this.orgId,
    };

    this.PlacesService.GenerateContext(body).subscribe({
      next: (data) => {
        this.ResponseContextEmail = data;
        this.ContextEmail = this.ResponseContextEmail.context.replace(
          /\n/g,
          '<br>'
        );
        this.showGenerateSection = true;
        this.putMailsDraft();
      },
    });
  }

  putMailsDraft() {
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
        this.getGeneratedEmail(data.json[0].id);
        this.showGenerateSection = false;
        this.listcenterName = [];
        this.ContextEmail = '';
      },
    });
  }
  onContentChange(event: Event) {
    const target = event.target as HTMLElement;
    this.emailBody = target.innerText;
  }

  getGeneratedEmail(mailContextId: number): void {
    this.spinner.show();
    const body: any = {
      Name: 'ReadSpecificMails',
      MainEntity: null,
      Params: {
        MailContextId: Number(mailContextId),
        IsSent: 0,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        const response = data.json;
        if (!response || response.length === 0) {
          setTimeout(() => {
            this.getGeneratedEmail(mailContextId);
          }, 3000);
        } else {
          this.emailBody = response[0].body; // <-- Must assign plain string here!
          // If you want to display safely elsewhere, use this:
          this.sanitizedEmailBody = this.sanitizer.bypassSecurityTrustHtml(
            this.emailBody
          );

          this.emailSubject = response[0].subject;
          this.spinner.hide();
        }
      },
    });
  }

  sendEmail() {
    this.spinner.show();
    const body: any = {
      Name: 'ComposeEmail',
      MainEntity: null,
      Params: {
        BuyBoxId: +this.buyBoxId,
        CampaignId: +this.campaignId,
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
        this.sanitizedEmailBody = '';
        this.showToast('Send Success');
      },
    });
  }

  // showAllEmails() {
  //   this.BuyBoxMicroDeals.forEach((item) => (item.isOpen = false));
  //   this.getAllEmails();
  // }
  showAllEmails() {
    // Close all organization dropdowns
    this.BuyBoxMicroDeals.forEach((item) => (item.isOpen = false));
    // Clear the selected contact
    this.selectedContact = null;
    // Reset to show all emails
    this.emailsSentContact = [];
    this.getAllEmails();
    // Apply the current filter to all emails
    this.filterEmails(this.selectedFilter);
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
  // openCompoase(modal: any, contactId: number) {
  //   this.listcenterName = [];
  //   this.emailSubject = '';
  //   this.emailBody = '';
  //   this.ContextEmail = '';
  //   this.showGenerateSection = false;
  //   this.GetContactShoppingCenters(contactId);
  //   this.modalService.open(modal, { size: 'xl', backdrop: true });
  // }
  openCompose(contact: Contact) {
    const modalRef = this.modalService.open(EmailComposeComponent, {
      size: 'xl',
      backdrop: true,
    });
    modalRef.componentInstance.contactId = contact.ContactId;
    modalRef.componentInstance.buyBoxId = this.buyBoxId;
    modalRef.componentInstance.orgId = this.orgId;
    modalRef.componentInstance.campaignId = this.campaignId;
    modalRef.componentInstance.email = contact.Email;
    modalRef.componentInstance.contactName = `${contact.Firstname ?? ''} ${
      contact.Lastname ?? ''
    }`.trim();

    modalRef.result
      .then((result) => {
        if (result === 'sent' && this.selectedContact) {
          this.getEmailsForContact(this.selectedContact);
        }
      })
      .catch(() => {
        /* dismissed */
      });
  }
  send(email: EmailInfo | null): void {
    if (!email) {
      // Handle the case where email is null (for example, show an error message or return early)
      return;
    }

    // Map EmailInfo to Mail (creating a new Mail object)
    const mail: Mail = {
      body: email.Body, // Mapping Body from EmailInfo to Mail
      id: email.ID, // Mapping ID from EmailInfo to Mail
      Subject: email.Subject, // Mapping Subject from EmailInfo to Mail
      Date: email.Date, // Mapping Date from EmailInfo to Mail
      Direction: email.Direction, // Mapping Direction from EmailInfo to Mail
      ContactId: email.ContactId, // Mapping ContactId from EmailInfo to Mail
      O: [], // Assuming O is an array and you might need to adjust this
    };
    const emailContent: IEmailContent = {
      mailId: mail.id,
      direction: mail.Direction,
      subject: mail.Subject,
      body: mail.body, // Mail body
      organizationId: 0, // You can fill this in as needed
      organizationName: '', // You can fill this in as needed
      isEditing: false, // Adjust this based on your needs
    };

    this.spinner.show();
    const body: any = {
      Name: 'UpdateEmailData',
      MainEntity: null,
      Params: {
        MailId: emailContent.mailId,
        Subject: emailContent.subject,
        Body: emailContent.body,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        this.showToast('Email sent successfully');
        this.getAllEmails();
      },
    });
  }
  DeleteMailTemplate(email: any): void {
    // Set the email to be deleted as the selected email
    this.selectedEmailToDelete = email;
    const modalRef = this.modalService.open(this.deleteEmailModal);
    modalRef.result.then((result) => {
      // Handle modal dismissal
      if (result === 'Delete') {
        this.deleteEmail();
      }
    });
  }
  deleteEmail(): void {
    if (!this.selectedEmailToDelete) {
      return;
    }
    this.spinner.show();
    const body: any = {
      Name: 'DeleteMail',
      MainEntity: null,
      Params: {
        MailId:
          this.selectedEmailToDelete.id === undefined
            ? this.selectedEmailToDelete.ID
            : this.selectedEmailToDelete.id,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.spinner.hide();
        this.showToast('Email Deleted successfully!');
        this.modalService.dismissAll();
        this.getAllEmails();
      },
      error: (err) => {
        this.spinner.hide();
        this.showToast('Error deleting email.');
      },
    });
  }
  // This method opens the modal for sending an email
  openSendEmailModal(email: Mail): void {
    // First, fetch the email details (including body) using getOneMail
    this.getOneMail(email.id);
    // Now open the modal, as the email body will be set after calling getOneMail
    const modalRef = this.modalService.open(this.sendEmailModal, {
      size: 'xl',
    });
    modalRef.result.then((result) => {
      if (result === 'Send') {
        this.sendDraftEmail(); // If confirmed, send the email
      }
    });
  }
  sendDraftEmail(): void {
    if (!this.selectedEmailForSend) {
      return;
    }
    // Use the provided send function to send the email
    this.send(this.selectedEmailForSend);
  }

  onBodyChange(event: Event): void {
    const target = event.target as HTMLElement;
    if (this.selectedEmail) {
      this.selectedEmail.Body = target.innerHTML;
    }
  }
}
