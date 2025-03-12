import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { PlacesService } from 'src/app/shared/services/places.service';
import { OrganizationsForEmail } from 'src/app/shared/models/emailyOrganization';

@Component({
  selector: 'app-emily-org',
  templateUrl: './emily-org.component.html',
  styleUrls: ['./emily-org.component.css'],
})
export class EmilyOrgComponent {
  buyBoxId!: number; // Change to number (remove | null)
  BuyBoxOrganizationsForEmail: OrganizationsForEmail[] = [];
  buyBoxMailActivity: any[] = [];
  showContactEmail: boolean = false; // Controls which component is displayed
  contactId!: number;
  orgId!: number;

  constructor(
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private PlacesService: PlacesService
  ) {
    this.route.paramMap.subscribe((params) => {
      this.buyBoxId = +params.get('buyboxid')!;
    });
  }

  ngOnInit() {
    this.GetBuyBoxOrganizationsForEmail();
    this.GetGetbuyBoxMailActivity();
  }
  // Method to toggle between components and store IDs
  toggleView(
    data: { contactId: number; orgId: number; buyBoxId: number } | boolean
  ) {
    if (typeof data === 'boolean') {
      // Handle the goBackEvent case
      this.showContactEmail = data;
    } else {
      // Handle the showContactEmail case
      this.contactId = data.contactId;
      this.orgId = data.orgId;
      this.buyBoxId = data.buyBoxId;
      this.showContactEmail = true; // Show the contact email component
    }
  }

  GetBuyBoxOrganizationsForEmail() {
    this.spinner.show();
    const body: any = {
      Name: 'GetBuyBoxOrganizationsForEmail',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data?.json && Array.isArray(data.json)) {
          this.BuyBoxOrganizationsForEmail = data.json;
          this.mergeOrganizationsWithDates();
          this.spinner.hide();
        } else {
          this.BuyBoxOrganizationsForEmail = [];
          this.spinner.hide();
        }
      },
      error: (err) => {
        this.BuyBoxOrganizationsForEmail = [];
        this.spinner.hide();
      },
    });
  }

  GetGetbuyBoxMailActivity() {
    this.spinner.show();
    const body: any = {
      Name: 'GetbuyBoxMailActivity',
      MainEntity: null,
      Params: {
        buyboxid: this.buyBoxId,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data?.json && Array.isArray(data.json)) {
          this.buyBoxMailActivity = data.json;
          this.mergeOrganizationsWithDates();
          this.spinner.hide();
        } else {
          this.buyBoxMailActivity = [];
          this.spinner.hide();
        }
      },
      error: (err) => {
        this.buyBoxMailActivity = [];
        this.spinner.hide();
      },
    });
  }

  mergeOrganizationsWithDates() {
    this.BuyBoxOrganizationsForEmail.forEach((organization: any) => {
      const relatedMailActivities = this.buyBoxMailActivity.filter(
        (activity) => activity.organizationId === organization.id
      );

      if (relatedMailActivities.length > 0) {
        organization.dates = relatedMailActivities.map(
          (activity) => activity.date
        );
      } else {
        organization.dates = [];
      }
    });
  }
}
