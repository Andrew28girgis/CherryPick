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
  selectedMicroDealId!: number;
  formGroup!: FormGroup;
  bodyemail: any;
  contactIdemail: any;
  currentValue: any;
  selectedOrganizationName!: string;
  dataLoaded: boolean = false; // Flag to track if both APIs have loaded

  organization: any = {}; // or a more specific type if you have one
  contacts: Contact[] = []; // your list of contacts
  emails: EmailInfo[] = []; // your list of emails
  private subscription: Subscription | null = null;
  // scroll
  isScrolling = false; // Boolean to track if scrolling is active
  private scrollTimeout: any;

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
    // Load both APIs with Promise.all to ensure both are completed
    this.loadInitialData();
  }

  // New method to handle initial data loading
  loadInitialData(): void {
    this.spinner.show();
    // Call the first API
    this.GetBuyBoxMicroDeals();
    // Call the second API
    this.GetBuyBoxEmails();
  }

  GetBuyBoxMicroDeals(): void {
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
            this.selectedOrganizationName = selectedOrganization.OrganizationName;
            console.log('selectedOrganizationName', this.selectedOrganizationName);
            
            // Set the default selected contact if available
            if (this.contacts.length > 0) {
              // Automatically select the contact from contactId passed in route
              this.selectedContact =
                this.contacts.find(
                  (contact) => contact.ContactId === this.contactId
                ) || this.contacts[0]; // Default to first contact if specific one not found
              
              console.log('Selected contact:', this.selectedContact);
              // If BuyBoxEmails are already loaded, get emails for the selected contact
              if (this.BuyBoxEmails.length > 0 && this.selectedContact) {
                this.getEmailsForContact(this.selectedContact);
                this.spinner.hide();
              }
            }
          }
        } else {
          this.BuyBoxMicroDeals = [];
          this.spinner.hide();
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Error fetching BuyBoxMicroDeals', err);
      },
    });
  }

  getEmailsForContact(contact: Contact): void {
    // Only clear and reset if selecting a different contact
    if (this.selectedContact?.ContactId !== contact.ContactId) {
      this.selectedContact = contact; // Set the selected contact
      this.emailsSentContact = []; // Clear any previously loaded emails
      this.emptyMessage = '';
      this.selectedEmail = null; // Clear any selected email details
    } else if (this.emailsSentContact.length > 0) {
      // If same contact and emails already loaded, don't reload
      return;
    }

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

    console.log('Loaded emails for contact:', contact.ContactId, this.emailsSentContact);
    // If no emails found, show a message
    if (this.emailsSentContact.length === 0) {
      this.emptyMessage = 'No emails available for this contact';
    } else if (this.emailsSentContact.length > 0) {
      // Automatically open the first email if available
      this.openEmail(this.emailsSentContact[0]);
    }
  }
  GetBuyBoxEmails(): void {
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
            this.getEmailsForContact(this.selectedContact);
          }
        } else {
          this.BuyBoxEmails = [];
        }
        this.spinner.hide();
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Error fetching BuyBoxEmails', err);
      }
    });
  }
  openEmail(email: Mail): void {
    // Call GetMail() with the selected email's ID (mailId)
    this.GetMail(email.id);
    // smoth scroll to the email details
    setTimeout(() => {
      const emailDetailsSection = document.querySelector('.email-details-body') as HTMLElement;
      if (emailDetailsSection) {
        this.smoothScrollTo(emailDetailsSection, 300); // 300ms (0.3s) duration
      }
    }, 100);
  }

  smoothScrollTo(element: HTMLElement, duration: number) {
    const targetPosition = element.getBoundingClientRect().top + window.scrollY;
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    const startTime = performance.now();
  
    function animationStep(currentTime: number) {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const ease = progress < 0.5 
        ? 2 * progress * progress 
        : -1 + (4 - 2 * progress) * progress; // Smooth easing function
  
      window.scrollTo(0, startPosition + distance * ease);
  
      if (elapsedTime < duration) {
        requestAnimationFrame(animationStep);
      }
    }
  
    requestAnimationFrame(animationStep);
  }

  onScroll(): void {
    // Set `isScrolling` to true when scrolling starts
    if (!this.isScrolling) {
      this.isScrolling = true;
    }

    // Clear any existing timeout and set a new one
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false; // Remove the `scrolling` class after scrolling stops
    }, 500); // Adjust the delay as needed
  }
  GetMail(mailId: number): void {
    // this.spinner.show(); // Show the spinner while fetching email details

    const body: any = {
      Name: 'GetMail',
      MainEntity: null,
      Params: {
        mailid: mailId, // Send the selected mail's ID to the API
        identity: this.loginContact, // The user's identity, which you might need to pass
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json && Array.isArray(data.json)) {
          this.selectedEmail = data.json[0]; // Set the first email from response to selectedEmail
          this.selectedMicroDealId=this.selectedEmail!.MicroDealId;
          console.log('selectedMicroDealId', this.selectedMicroDealId);
          console.log('Fetched email details:', this.selectedEmail); // Debug log to check the response
        } else {
          this.selectedEmail = null; // If no email is found, reset selectedEmail
        }
        // this.spinner.hide(); // Hide the spinner after fetching the data
      },
      error: (err) => {
        // this.spinner.hide(); // Hide the spinner on error
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