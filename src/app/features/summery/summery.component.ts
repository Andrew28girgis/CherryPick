import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlacesService } from 'src/app/core/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Tenant } from 'src/app/shared/models/tenant';

@Component({
  selector: 'app-summery',
  templateUrl: './summery.component.html',
  styleUrls: ['./summery.component.css'],
})
export class SummeryComponent implements OnInit {
  @ViewChild('tenantModal', { static: true })
  private tenantModal!: TemplateRef<any>;
  @ViewChild('campaignModal', { static: true })
  private campaignModal!: TemplateRef<any>;
  private tenants: Tenant[] = [];
  private newTenantId!: number;

  protected sortBy: string = 'newest';
  protected sortOptions = [
    { value: 'alphabetical', label: 'Alphabetical' },
    { value: 'newest', label: 'Newest to Oldest' },
    { value: 'oldest', label: 'Oldest to Newest' },
  ];
  protected newTenant = {
    name: '',
    url: '',
    linkedin: '',
  };
  protected campaignMinSize: number = 100;
  protected campaignMaxSize: number = 100;
  protected searchQuery: string = '';
  protected filteredTenants: Tenant[] = [];

  constructor(
    public router: Router,
    private placeService: PlacesService,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.getUserBuyBoxes();
  }

  private getUserBuyBoxes(): void {
    const body: any = {
      Name: 'GetAllOrganizations',
      Params: {},
    };

    this.placeService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.tenants = data.json;
        this.tenants = this.tenants.map((t) => ({
          ...t,
          Campaigns:
            t.Campaigns?.length && !t.Campaigns[0]?.Id ? [] : t.Campaigns,
        }));
        this.filteredTenants = this.tenants;

        if (!this.tenants || this.tenants.length === 0) {
          this.openAddTenantModal(this.tenantModal);
        }
      },
    });
  }

  private resetAddTenantForm() {
    this.newTenant = { name: '', url: '', linkedin: '' };
  }

  private openCampaignModal(content: any): void {
    this.modalService.open(content, { centered: true });
  }

  private createNewTenant(): void {
    this.spinner.show();
    const body = {
      Name: 'CreateOrganizationByName',
      Params: {
        Name: this.newTenant.name,
        URL: this.newTenant.url.trim().length ? this.newTenant.url : '',
        LinkedIn: this.newTenant.linkedin.trim().length
          ? this.newTenant.linkedin
          : '',
      },
    };

    this.placeService.GenericAPI(body).subscribe((orgResponse: any) => {
      this.spinner.hide();
      const orgId = orgResponse?.json?.[0]?.id;
      if (!orgId) {
        alert('Tenant creation failed. Please try again.');
        return;
      } else {
        this.newTenantId = orgId;
        this.getUserBuyBoxes();
        this.modalService.dismissAll();
        this.resetAddTenantForm();
        this.openCampaignModal(this.campaignModal);
      }
    });
  }

  protected filterTenants(): void {
    let tenants = this.tenants.filter((tenant) =>
      this.searchQuery.trim().length
        ? tenant.name.toLowerCase().includes(this.searchQuery.toLowerCase())
        : true
    );

    this.filteredTenants = tenants.sort((a, b) => {
      switch (this.sortBy) {
        case 'alphabetical':
          return (a.name || '').localeCompare(b.name || '');
        case 'newest':
          return (b.id || 0) - (a.id || 0);
        case 'oldest':
          return (a.id || 0) - (b.id || 0);
        default:
          return 0;
      }
    });
  }

  protected addNewTenant() {
    if (!this.newTenant.name.trim().length) return;

    this.createNewTenant();
  }

  protected openAddTenantModal(content: any): void {
    this.modalService.open(content, { centered: true });
  }

  protected navigateToCampaign(): void {
    this.modalService.dismissAll();
    this.router.navigate(['/campaigns/add-campaign', this.newTenantId], {
      queryParams: {
        minSize: this.campaignMinSize,
        maxSize: this.campaignMaxSize,
      },
    });
  }
}
