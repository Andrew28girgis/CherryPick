import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { PlacesService } from 'src/app/shared/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import {
  BuyBoxMicroDeals,
  Stages,
  BuyBoxEmails,
  Contact,
  EmailInfo,
} from 'src/app/shared/models/buy-box-emails';
import {
  FormGroup,
} from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-emily-stages',
  templateUrl: './emily-stages.component.html',
  styleUrls: ['./emily-stages.component.css'],
})
export class EmilyStagesComponent implements OnInit {
  BuyBoxMicroDeals: BuyBoxMicroDeals[] = [];
  BuyBoxEmails: BuyBoxEmails[] = [];
  Stages: Stages[] = [];
  stageEmailsMap: { [key: number]: BuyBoxMicroDeals[] } = {};
  Emails: EmailInfo[] = [];
  loginContact: any;
  openedStageId: number | null = null;
  formGroup!: FormGroup;
  @Input() emailBodyResponseSend!: any;
  currentValue: any;
  @Output() showContactEmail = new EventEmitter<{
    contactId: number;
    orgId: number;
    buyBoxId: number;
  }>();
  @Input() buyBoxId!: any;

  constructor(
    public spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    for (const stage of Object.values(this.stageEmailsMap)) {
      stage.forEach((email) => {
        email.Organization.forEach((org) => {
          org.showMoreContacts = false; // Initialize 'showMoreContacts' for each organization
        });
      });
    }
    this.buyBoxId = localStorage.getItem('BuyBoxId');
    this.loginContact = localStorage.getItem('contactId');
    this.GetBuyBoxMicroDeals();
    this.GetStages();
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
  mergeStagesWithGetBuyBoxMicroDeals(): void {
    if (this.BuyBoxMicroDeals.length > 0 && this.Stages.length > 0) {
      this.Stages.forEach((stage: Stages) => {
        const matchingEmails = this.BuyBoxMicroDeals.filter(
          (buyBoxEmail: BuyBoxMicroDeals) => buyBoxEmail.StageId === stage.id
        );
        this.stageEmailsMap[stage.id] = matchingEmails;
      });
      if (this.Stages.length > 0) {
        this.openedStageId = this.Stages[0].id; // Open the first stage by default
      }
    }
  }
  toggleViewMore(org: any) {
    org.showMoreContacts = !org.showMoreContacts;
  }
  getVisibleContacts(org: any): Contact[] {
    return org.showMoreContacts ? org.Contact : org.Contact.slice(0, 2);
  }
  onContactClick(contactId: number, orgId: number) {
    this.showContactEmail.emit({ contactId, orgId, buyBoxId: this.buyBoxId }); // Pass buyBoxId
  }
  toggleContacts(org: any) {
    org.showContacts = !org.showContacts;
  }
  goToOrgContact(orgId: number, contactId: number) {
    // Navigate to the new route, passing the orgId & contactId
    this.router.navigate(['/organization-mail', orgId, contactId]);
  }
  getTotalEmails(contact: Contact): number {
    return (
      (contact.EmailStats[0].Sent || 0) +
      (contact.EmailStats[0].Inbox || 0) +
      (contact.EmailStats[0].Outbox || 0)
    );
  }
  getTotalOrganizationEmails(contacts: Contact[]): number {
    if (!contacts || contacts.length === 0) {
      return 0;
    }

    return contacts.reduce((total, contact) => {
      return total + this.getTotalEmails(contact);
    }, 0);
  }
}
