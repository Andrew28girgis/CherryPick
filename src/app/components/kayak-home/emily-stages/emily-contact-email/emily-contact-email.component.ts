import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  BuyBoxEmails,
  BuyBoxMicroDeals,
  Contact,
  EmailInfo,
  Mail,
  MailsContact,
  Stages,
} from 'src/models/buy-box-emails';
import { PlacesService } from 'src/app/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { EmailService } from 'src/app/services/email-body.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-emily-contact-email',
  templateUrl: './emily-contact-email.component.html',
  styleUrls: ['./emily-contact-email.component.css'],
})
export class EmilyContactEmailComponent implements OnInit {
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
  ShowResaved: boolean = false;
  EmailDashboard: any[] = [];
  activeStageId!: number;
  activeOrgId!: number;
  openedStageId: number | null = null;
  openedOrgId: any;
  selectedEmail: EmailInfo | null = null;
  formGroup!: FormGroup;
  bodyemail: any;
  contactIdemail: any;
  currentValue: any;
  selectedOrganizationName!: string;

  organization: any = {}; // or a more specific type if you have one
  contacts: Contact[] = []; // your list of contacts
  emails: EmailInfo[] = []; // your list of emails
  private subscription: Subscription | null = null;

  @Input() contactId!: number;
  @Input() orgId!: number;
  @Input() buyBoxId!: number;

  @Output() goBackEvent = new EventEmitter<void>();
  constructor(
    private route: ActivatedRoute,
    public spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private emailService: EmailService
  ) {}

  ngOnInit() {
    console.log('orgId', this.orgId);
    console.log('contactId', this.contactId);
    console.log('buyBoxId', this.buyBoxId);
    this.GetBuyBoxMicroDeals();
    this.GetBuyBoxEmails();

    // Ensure emails are loaded for the selected contact on init
    if (this.contacts.length > 0) {
      // Find the contact by contactId or default to the first contact in the list
      this.selectedContact =
        this.contacts.find((contact) => contact.ContactId === this.contactId) ||
        this.contacts[0];
      console.log('Selected contact onInit:', this.selectedContact);

      // Automatically load emails for the selected contact
      if (this.selectedContact) {
        this.getEmailsForContact(this.selectedContact);
      }
    }
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
          console.log('BuyBoxMicroDeals', this.BuyBoxMicroDeals);

          // Reset contacts array before populating it
          this.contacts = [];

          // Find the organization that matches the selected orgId
          const selectedOrganization = this.BuyBoxMicroDeals.flatMap((deal) =>
            deal.Organization.filter((org) => org.OrganizationId === this.orgId)
          )[0];

          if (selectedOrganization) {
            // Extract contacts from the selected organization
            this.contacts = selectedOrganization.Contact || [];
            console.log('Contacts for selected organization:', this.contacts);
            this.selectedOrganizationName=selectedOrganization.OrganizationName;
            console.log('selectedOrganizationName',this.selectedOrganizationName);
            
            // Set the default selected contact if available
            if (this.contacts.length > 0) {
              // Automatically select the contact from contactId passed in route
              this.selectedContact =
                this.contacts.find(
                  (contact) => contact.ContactId === this.contactId
                ) || null;
              console.log('Selected contact:', this.selectedContact);

              if (this.selectedContact) {
                this.getEmailsForContact(this.selectedContact); // Automatically load emails for the selected contact
              }
            }
          }
        } else {
          this.BuyBoxMicroDeals = [];
        }
        this.spinner.hide();
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Error fetching BuyBoxMicroDeals', err);
      },
    });
  }
  getEmailsForContact(contact: Contact): void {
    // Skip if the contact is already selected and emails are already loaded
    if (this.selectedContact?.ContactId === contact.ContactId) {
      return;
    }

    this.selectedContact = contact; // Set the selected contact
    this.emailsSentContact = []; // Clear any previously loaded emails
    this.emptyMessage = '';

    // Filter emails based on the contact's ContactId
    const matchingEmails = this.BuyBoxEmails.flatMap(
      (buyBoxEmail) => buyBoxEmail.mail
    );

    // Filter emails where the contact is a recipient (in MailsContacts)
    this.emailsSentContact = matchingEmails.filter((email: Mail) => {
      return email.MailsContacts.some(
        (element: MailsContact) => element.MailContactId === contact.ContactId
      );
    });

    // If no emails found, show a message
    if (this.emailsSentContact.length === 0) {
      this.emptyMessage = 'No emails available for this contact';
    }
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
          console.log('BuyBoxEmails', this.BuyBoxEmails);

          // After emails are loaded, fetch the emails for the selected contact (if available)
          if (this.selectedContact) {
            this.getEmailsForContact(this.selectedContact); // Ensure emails are filtered after BuyBoxEmails are available
          }
        } else {
          this.BuyBoxEmails = [];
        }
        this.spinner.hide();
      },
    });
  }
  openEmail(email: Mail): void {
    // Call GetMail() with the selected email's ID (mailId)
    this.GetMail(email.id); // Pass the email ID to fetch its full details
  }

  GetMail(mailId: number): void {
    this.spinner.show(); // Show the spinner while fetching email details

    const body: any = {
      Name: 'GetMail',
      MainEntity: null,
      Params: {
        mailid: mailId, // Send the selected mail's ID to the API
        identity: this.loginContact, // The user’s identity, which you might need to pass
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && Array.isArray(data.json)) {
          this.selectedEmail = data.json[0]; // Set the first email from response to selectedEmail
          console.log('Fetched email details:', this.selectedEmail); // Debug log to check the response
        } else {
          this.selectedEmail = null; // If no email is found, reset selectedEmail
        }
        this.spinner.hide(); // Hide the spinner after fetching the data
      },
      error: (err) => {
        this.spinner.hide(); // Hide the spinner on error
        console.error('Error fetching email details', err);
      },
    });
  }

  goBack() {
    this.goBackEvent.emit();
  }
  // Get the total number of emails for a contact
  getTotalEmails(contact: Contact): number {
    return (
      (contact.EmailStats[0].Sent || 0) +
      (contact.EmailStats[0].Inbox || 0) +
      (contact.EmailStats[0].Outbox || 0)
    );
  }
}
