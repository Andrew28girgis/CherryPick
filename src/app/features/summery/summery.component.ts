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

@Component({
  selector: 'app-summery',
  templateUrl: './summery.component.html',
  styleUrls: ['./summery.component.css'],
})
export class SummeryComponent implements OnInit {
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

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private route: ActivatedRoute,
    private stateService: StateService,
    private modalService: NgbModal,
    private breadcrumbService: BreadcrumbService
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
  }

  getUserBuyBoxes(): void {
    this.isLoading = true;
    const body: any = {
      Name: 'GetUserBuyBoxes',
      Params: {},
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.tenants = data.json;
        if (this.tenants.length === 0 && !this.modalOpened) {
          this.modalOpened = true;
          this.openAddTenant(this.buyBoxProperty);
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
    modalRef.result
      .then((result) => {
        if (result && result.created) {
          this.getUserBuyBoxes();
          this.modalService.dismissAll();
        }
      })
      .catch((error) => {
        this.getUserBuyBoxes();
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
}
