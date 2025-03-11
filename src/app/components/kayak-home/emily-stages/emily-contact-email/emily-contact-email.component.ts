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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

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
  // selectedFilter: string = 'all';
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

  filteredEmails: Mail[] = []; // Array to hold filtered emails
  selectedFilter: string = 'all'; // Default filter is 'all'  

  @Input() contactId!: number;
  @Input() orgId!: number;
  @Input() buyBoxId!: number;

  @Output() goBackEvent = new EventEmitter<void>();
  constructor(
    private route: ActivatedRoute,
    public spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private emailService: EmailService,
    private modalService: NgbModal
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
    // Store the currently selected contact ID before resetting
    const currentContactId = this.selectedContact?.ContactId || this.contactId;
    // Reset data
    this.filteredEmails = [];
    this.emailsSentContact = [];
    this.selectedEmail = null;
    this.BuyBoxMicroDeals = [];
    this.BuyBoxEmails = [];
    // Use Promise.all to ensure both API calls complete before processing
    const microDealsPromise = new Promise<void>((resolve) => {
      this.GetBuyBoxMicroDeals(resolve);
    });
    const emailsPromise = new Promise<void>((resolve) => {
      this.GetBuyBoxEmails(resolve);
    });
    // When both APIs complete, process the data
    Promise.all([microDealsPromise, emailsPromise]).then(() => {
      console.log('All data loaded');
      // Find and select the previously selected contact
      if (this.contacts && this.contacts.length > 0) {
        // Try to find the previously selected contact
        const contactToSelect = this.contacts.find(
          contact => contact.ContactId === currentContactId
        );
        
        // If found, select it, otherwise default to the first contact
        if (contactToSelect) {
          this.getEmailsForContact(contactToSelect);
        } else if (this.contacts.length > 0) {
          // If can't find previous contact, fall back to initial contact or first in list
          const initialContact = this.contacts.find(
            contact => contact.ContactId === this.contactId
          ) || this.contacts[0];
          this.getEmailsForContact(initialContact);
        }
      }
      this.spinner.hide();
    }).catch(error => {
      console.error('Error loading data', error);
      this.spinner.hide();
    });
  }

  GetBuyBoxMicroDeals(callback?: Function): void {
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
            // IMPORTANT: We no longer automatically select a contact here
            // This will be handled in the loadInitialData method after both API calls complete
          }
        } else {
          this.BuyBoxMicroDeals = [];
        }
        // Call the callback function if provided
        if (callback) {
          callback();
        }
      },
      error: (err) => {
        console.error('Error fetching BuyBoxMicroDeals', err);
        if (callback) {
          callback();
        }
        this.spinner.hide();
      },
    });
  }
  getEmailsForContact(contact: Contact): void {
    // Only clear and reset if selecting a different contact
    if (this.selectedContact?.ContactId !== contact.ContactId) {
      this.selectedContact = contact; // Set the selected contact
      this.emailsSentContact = []; // Clear any previously loaded emails
      this.filteredEmails = []; // Clear filtered emails
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

    console.log('Matching emails:', matchingEmails);
    
    // Filter emails where the contact is a recipient (in MailsContacts)
    this.emailsSentContact = matchingEmails.filter((email: Mail) => {
      if (email.Direction == 2) {
        // When direction is 2, filter based on the MailsContacts array
        return email.MailsContacts.some(
          (element: MailsContact) => element.MailContactId == contact.ContactId
        );
      } else if (email.Direction == 1) {
        // When direction is 1, filter based on the ContactId directly
        return email.ContactId == contact.ContactId;
      }
      return false; // If neither condition is met, return false
    });
    
    

    console.log('Loaded emails for contact:', contact.ContactId, this.emailsSentContact);
    // Apply the current filter to the newly loaded emails
    this.filterEmails(this.selectedFilter);
    
    // If no emails found, show a message
    if (this.emailsSentContact.length === 0) {
      this.emptyMessage = 'No emails available for this contact';
    }
  }
  GetBuyBoxEmails(callback?: Function): void {
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
          this.BuyBoxEmails = data.json;
          console.log('BuyBoxEmails', this.BuyBoxEmails);
     
        // Call the callback function if provided
        if (callback) {
          callback();
        }
      },
      error: (err) => {
        console.error('Error fetching BuyBoxEmails', err);
        if (callback) {
          callback();
        }
        this.spinner.hide();
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
  openmodel(modal: any, body: any, contactId: any) {
    this.bodyemail = body;
    this.contactIdemail = contactId;
    this.modalService.open(modal, { size: 'xl', backdrop: true });
  }
  getDirection(direction: number): string {
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
    // If no emails or contact selected, don't try to filter
    if (!this.selectedContact || this.emailsSentContact.length === 0) {
      this.filteredEmails = [];
      this.selectedEmail = null; // Clear selected email when no emails to filter
      return;
    }
    // Apply the filter based on the selected type
    let filtered: Mail[] = [];
    switch (filterType) {
      case 'inbox':
        // Direction = 1 for inbox
        filtered = this.emailsSentContact.filter(email => email.Direction === 1);
        break;
      case 'outbox':
        // Direction = -1 for outbox
        filtered = this.emailsSentContact.filter(email => email.Direction === -1);
        break;
      case 'sent':
        // Direction = 2 for sent
        filtered = this.emailsSentContact.filter(email => email.Direction === 2);
        break;
      case 'all':
      default:
        // Show all emails
        filtered = [...this.emailsSentContact];
        break;
    }
    // Sort emails by date in descending order (newest first)
    this.filteredEmails = this.sortEmailsByDateDesc(filtered);
    // Update the empty message based on filter results
    if (this.filteredEmails.length === 0) {
      this.emptyMessage = `No ${filterType} emails available for this contact`;
      this.selectedEmail = null; // Clear selected email when no filtered emails are found
    }
    // If there are filtered emails, select the first one by default
    if (this.filteredEmails.length > 0 && (!this.selectedEmail || 
        !this.filteredEmails.some(email => email.id === this.selectedEmail?.ID))) {
      this.openEmail(this.filteredEmails[0]);
    }
  }
  // Add this function to the EmilyContactEmailComponent class
  sortEmailsByDateDesc(emails: Mail[]): Mail[] {
    return [...emails].sort((a, b) => {
      const dateA = new Date(a.Date).getTime();
      const dateB = new Date(b.Date).getTime();
      return dateB - dateA; // Sort descending (newest first)
    });
  }
}