import {
  Component,
  HostListener,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BuyBoxModel } from 'src/app/shared/models/BuyBoxModel';
import { PlacesService } from 'src/app/core/services/places.service';
import { StateService } from 'src/app/core/services/state.service';
import { BreadcrumbService } from 'src/app/core/services/breadcrumb.service';
import { Tenant } from 'src/app/shared/models/tenants';
import { EncodeService } from 'src/app/core/services/encode.service';
import {
  DropboxService,
  UploadArgs,
} from 'src/app/core/services/dropbox.service';

@Component({
  selector: 'app-summery',
  templateUrl: './summery.component.html',
  styleUrls: ['./summery.component.css'],
})
export class SummeryComponent implements OnInit {
  @ViewChild('tenantModal') tenantModal!: TemplateRef<any>;
  tenants: Tenant[] = [];
  Token: any;
  orgId!: number;
  organizationId!: any;
  Obj!: BuyBoxModel;
  @ViewChild('BuyBoxProperty') buyBoxProperty!: TemplateRef<any>;
  modalOpened: boolean = false;
  isLoading = true;
  showCampaigns: boolean = false;
  campaignsViewMode: 'table' | 'card' = 'table';
  currentView: 'tenants' | 'campaigns-table' | 'campaigns-card' = 'tenants';
  isMobile = false;
  campaignsLoaded = false;
  // Add Tenant Modal
  isModalOpen = false;
  tenant = {
    name: '',
    url: '',
    linkedin: '',
  };
  // Search
  searchQuery: string = '';
  filteredTenants: Tenant[] = [];

  // Filter
  showFilterDropdown: boolean = false;
  showSortDropdown: boolean = false;
  filters = {
    active: false,
    inactive: false,
    fastFood: false,
    sportswear: false,
    luxury: false,
    fastFashion: false,
  };

  // Sort
  sortField: 'alphabetical' | 'newest' | 'oldest' = 'alphabetical';

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private route: ActivatedRoute,
    private stateService: StateService,
    private modalService: NgbModal,
    private breadcrumbService: BreadcrumbService,
    private base62: EncodeService,
    private dropbox: DropboxService,
  ) {}

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'My Tenants', url: '/summary' },
    ]);
    this.stateService.clearAll();
    this.route.queryParams.subscribe((params) => {
      this.getUserBuyBoxes();
      this.organizationId = localStorage.getItem('orgId');
    });
    this.modalOpened = false;
    this.checkScreenSize();
    this.filteredTenants = this.tenants;
  }

  getUserBuyBoxes(): void {
    this.isLoading = true;
    const body: any = {
      Name: 'GetUserBuyBoxes',
      Params: {},
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.tenants = data.json;
        this.filteredTenants = this.tenants;

        if (!this.tenants || this.tenants.length === 0) {
          this.router.navigate(['/add-tenant']);
          // this.modalOpened = true;
          // this.openAddTenant(this.buyBoxProperty);
        }
        this.isLoading = false;
      },
    });
  }

  openAddTenant(content: any) {
    const modalRef = this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      scrollable: true,
      size: 'xl',
    });
    this.Obj = new BuyBoxModel();
    modalRef.result.then((result) => {
      if (result && result.created) {
        this.getUserBuyBoxes();
        this.modalService.dismissAll();
      }
    });
  }

  showCampaignsTable() {
    this.showCampaigns = true;
    this.campaignsViewMode = 'table';
    this.currentView = 'campaigns-table';
    this.campaignsLoaded = true;
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Campaigns', url: '/campaigns' },
    ]);
  }

  showCampaignsCard() {
    this.showCampaigns = true;
    this.campaignsViewMode = 'card';
    this.currentView = 'campaigns-card';
    this.campaignsLoaded = true;
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Campaigns', url: '/campaigns' },
    ]);
  }

  showTenants() {
    this.showCampaigns = false;
    this.currentView = 'tenants';
    this.breadcrumbService.setBreadcrumbs([
      { label: 'My Tenants', url: '/summary' },
    ]);
  }
  goToTenant(tenant: Tenant) {
    this.router.navigate([
      '/dashboard',
      tenant.Id,
      tenant.OrganizationId,
      tenant.Name,
      tenant.Campaigns[0].Id,
    ]);
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 767;
    if (this.isMobile) {
      this.campaignsViewMode = 'card';
    } else {
      const savedViewMode = localStorage.getItem('campaignViewMode') as
        | 'table'
        | 'card';
      if (savedViewMode) {
        this.campaignsViewMode = savedViewMode;
      }
    }
  }

  // Search and Filter Functions
  filterTenants() {
    this.filteredTenants = this.tenants.filter((tenant) => {
      // Search filter
      const matchesSearch =
        !this.searchQuery ||
        tenant.Name.toLowerCase().includes(this.searchQuery.toLowerCase());

      // Status filters
      const statusMatch =
        (!this.filters.active && !this.filters.inactive) ||
        (this.filters.active && tenant.Status === 'Active') ||
        (this.filters.inactive && tenant.Status === 'Inactive');

      // Category filters
      const categoryMatch =
        (!this.filters.fastFood &&
          !this.filters.sportswear &&
          !this.filters.luxury &&
          !this.filters.fastFashion) ||
        (this.filters.fastFood && tenant.Category === 'Fast Food Brand') ||
        (this.filters.sportswear && tenant.Category === 'Sportswear') ||
        (this.filters.luxury && tenant.Category === 'Luxury Brands') ||
        (this.filters.fastFashion &&
          tenant.Category === 'Basic & Everyday Wear');

      return matchesSearch && statusMatch && categoryMatch;
    });

    // Maintain current sort
    this.sortTenants(this.sortField);
  }

  // Sort Functions
  sortTenants(field: 'alphabetical' | 'newest' | 'oldest') {
    this.sortField = field;

    this.filteredTenants.sort((a, b) => {
      switch (field) {
        case 'alphabetical':
          return a.Name.localeCompare(b.Name);
        case 'newest':
          return (
            new Date(b.CreatedDate).getTime() -
            new Date(a.CreatedDate).getTime()
          );
        case 'oldest':
          return (
            new Date(a.CreatedDate).getTime() -
            new Date(b.CreatedDate).getTime()
          );
        default:
          return 0;
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Get the clicked element
    const clickedElement = event.target as HTMLElement;

    // Check if click is outside filter button and dropdown
    if (
      !clickedElement.closest('.filter-btn') &&
      !clickedElement.closest('.filter-dropdown')
    ) {
      this.showFilterDropdown = false;
    }

    // Check if click is outside sort button and dropdown
    if (
      !clickedElement.closest('.sort-btn') &&
      !clickedElement.closest('.sort-dropdown')
    ) {
      this.showSortDropdown = false;
    }
  }

  // Toggle Dropdowns
  toggleFilter(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.showFilterDropdown = !this.showFilterDropdown;
    this.showSortDropdown = false;
  }

  toggleSort(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.showSortDropdown = !this.showSortDropdown;
    this.showFilterDropdown = false;
  }

  openAddTenants() {
    this.router.navigate(['/add-tenant']);
  }

  onImageError(event: any) {
    event.target.src = 'assets/Images/placeholder.png';
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.resetForm();
  }

  addTenant() {
    if (!this.tenant.name) return;

    console.log('Tenant Added:', this.tenant);
    this.closeModal();
  }

  resetForm() {
    this.tenant = { name: '', url: '', linkedin: '' };
  }
  onBackdropClick(event: MouseEvent): void {
  this.closeModal(); 
}
}
