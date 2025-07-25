import {
  Component,
  HostListener,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MapViewComponent } from './map-view/map-view.component';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';
import { ICampaign } from 'src/app/shared/models/icampaign';
import { Stage } from 'src/app/shared/models/shoppingCenters';
import { Subscription } from 'rxjs';
import { PlacesService } from 'src/app/core/services/places.service';
import { Tenant } from 'src/app/shared/models/tenants';

@Component({
  selector: 'app-shopping-center-table',
  templateUrl: './shopping-center-table.component.html',
  styleUrls: ['./shopping-center-table.component.css'],
})
export class ShoppingCenterTableComponent implements OnInit, OnDestroy {
  @ViewChild('mapView') mapView!: MapViewComponent;
  filteredCenters: any[] = [];
  filteredCampaigns?: ICampaign[];
  isMobile = false;
  currentView = 3;
  isSocialView = false;
  isMapView = false;
  // BuyBoxId!: any;
  // BuyBoxName!: string;
  organizationName!: string;
  CampaignId!: any;
  OrgId!: any;
  selectedOption = 5;
  view = false;
  StageId = 0;
  stages: Stage[] = [];
  selectedStageId = 0;
  selectedStageName = 'Filter';
  encodedName = '';
  searchQuery = '';
  isFilterOpen = false;
  isSortOpen = false;
  private subscriptions = new Subscription();
  tenantName = '';
  tenantImageUrl = '';

  // Add tenant dropdown properties
  tenants: Tenant[] = [];
  selectedTenant: Tenant | null = null;
  showTenantDropdown = false; // Make sure this is defined
  filteredTenants: Tenant[] = [];

  // Add grouped tenants property
  groupedTenants: { [key: string]: Tenant[] } = {};
  alphabetKeys: string[] = [];

  dropdowmOptions = [
    { id: 1, text: 'Map View', icon: '../../../assets/Images/Icons/map.png' },
    {
      id: 2,
      text: 'Side View',
      icon: '../../../assets/Images/Icons/element-3.png',
    },
    {
      id: 3,
      text: 'Cards View',
      icon: '../../../assets/Images/Icons/grid-1.png',
    },
    {
      id: 4,
      text: 'Table View',
      icon: '../../../assets/Images/Icons/grid-4.png',
    },
    {
      id: 5,
      text: 'Social View',
      icon: '../../../assets/Images/Icons/globe-solid.svg',
    },
    {
      id: 6,
      text: 'Kanban View',
      icon: '../../../../assets/Images/Icons/Cadence.svg',
    },
  ];

  sortOptions = [
    { id: 3, text: 'Default', icon: 'fa-solid fa-ban' },
    { id: 1, text: 'Name (A-Z)', icon: 'fa-solid fa-sort-alpha-down' },
    { id: 2, text: 'Name (Z-A)', icon: 'fa-solid fa-sort-alpha-up' },
  ];

  selectedSortId = 0;
  isSortMenuOpen = false;
  imageLoadingStates: { [key: number]: boolean } = {}; // Track loading state for each image
  imageErrorStates: { [key: number]: boolean } = {}; // Track error state for each image
  @ViewChild('tenantDropdown') tenantDropdownRef!: NgbDropdown;

  constructor(
    private activatedRoute: ActivatedRoute,
    private shoppingCenterService: ViewManagerService,
    private placesService: PlacesService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cdr.detectChanges();

    // Subscribe to filtered centers
    this.subscriptions.add(
      this.shoppingCenterService.filteredCenters$.subscribe((centers) => {
        this.filteredCenters = centers;
        this.cdr.detectChanges();
      })
    );

    // Set default view to card view (3) if current view is map view (1)
    const savedView = localStorage.getItem('currentViewDashBord');
    if (savedView === '1') {
      this.currentView = 3;
      localStorage.setItem('currentViewDashBord', '3');
    } else {
      this.currentView = Number(savedView || '3');
    }

    this.isSocialView = this.currentView === 5;
    this.isMapView = false; // Always keep map view disabled
    this.selectedOption = this.currentView;

    this.checkScreenSize();

    this.activatedRoute.params.subscribe((params: any) => {
      // this.BuyBoxId = params.buyboxid;
      this.OrgId = params.orgId;
      this.organizationName = params.orgName;
      this.tenantName = params.orgName || '';
      this.encodedName = encodeURIComponent(this.organizationName);
      this.CampaignId = params.campaignId;

      // localStorage.setItem('BuyBoxId', this.BuyBoxId);
      localStorage.setItem('OrgId', this.OrgId);

      // Set tenant image URL
      if (this.OrgId) {
        this.tenantImageUrl = `https://api.cherrypick.com/api/Organization/GetOrgImag?orgId=${this.OrgId}`;
      }

      if (Number(localStorage.getItem('currentViewDashBord')) !== 1) {
        this.shoppingCenterService.initializeData(this.CampaignId, this.OrgId);
      }
    });

    this.shoppingCenterService.setCurrentView(this.currentView);
    this.filterDropdownOptions();

    // Subscribe to search query changes
    this.subscriptions.add(
      this.shoppingCenterService.searchQuery$.subscribe((query) => {
        this.searchQuery = query;
        this.cdr.detectChanges();
      })
    );

    // Load stages and set up stage filtering
    this.loadStages();

    // Subscribe to stage changes
    this.subscriptions.add(
      this.shoppingCenterService.selectedStageId$.subscribe((id) => {
        this.selectedStageId = id;
        this.updateStageName(id);
        this.cdr.detectChanges();
      })
    );

    // Add this to load tenants
    // this.getUserBuyBoxes();

    // Subscribe to stage updates from child components
    this.subscriptions.add(
      this.shoppingCenterService.stageUpdate$.subscribe(() => {
        // Ensure the current filter state is maintained
        this.syncFilterState();
        this.cdr.detectChanges();
      })
    );
  }

  // Add method to sync filter state
  private syncFilterState(): void {
    // Get the current stage ID from the service
    const serviceStageId =
      this.shoppingCenterService.getCurrentSelectedStageId();

    // Update local state if it differs from service state
    if (this.selectedStageId !== serviceStageId) {
      this.selectedStageId = serviceStageId;
      this.updateStageName(serviceStageId);
    }
  }

  private updateStageName(id: number): void {
    if (id === 0) {
      this.selectedStageName = 'All';
    } else {
      const stage = this.stages.find((s) => s.id === id);
      this.selectedStageName = stage ? stage.stageName : 'Stage';
    }
  }

  loadStages(): void {
    const body = {
      Name: 'GetKanbanTemplateStages',
      Params: { KanbanTemplateId: 6 },
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        if (res && res.json) {
          this.stages = res.json
            .map((s: any) => ({
              id: +s.id,
              stageName: s.stageName,
              stageOrder: +s.stageOrder,
              isQualified: s.isQualified,
              kanbanTemplateId: +s.kanbanTemplateId,
            }))
            .sort((a: any, b: any) => a.stageOrder - b.stageOrder);
          console.log('Stages loaded:', this.stages);

          this.updateStageName(this.selectedStageId);
          this.cdr.detectChanges();
        }
      },
      error: (error: Error) => {
        console.error('Error loading kanban stages:', error);
      },
    });
  }

  selectStagekan(stageId: number): void {
    // Prevent interference from ongoing updates
    if (this.shoppingCenterService.getCurrentLoadingState()) {
      return;
    }

    this.selectedStageId = stageId;
    if (stageId === 0) {
      this.selectedStageName = 'All';
    } else {
      const stage = this.stages.find((s) => s.id === stageId);
      this.selectedStageName = stage ? stage.stageName : 'Filter';
    }

    // Update the service and trigger filtering
    this.shoppingCenterService.setSelectedStageId(stageId);

    // Force change detection
    this.cdr.detectChanges();
  }

  onSearch(event: any): void {
    this.searchQuery = event.target.value;
    this.shoppingCenterService.filterCenters(this.searchQuery);
  }

  selectOption(option: any): void {
    this.selectedOption = option.id;
    this.currentView = option.id;
    this.isSocialView = this.currentView === 5;
    this.isMapView = this.currentView === 1;
    localStorage.setItem('currentViewDashBord', this.currentView.toString());
    this.shoppingCenterService.setCurrentView(this.currentView);
    this.cdr.detectChanges();
  }

  getCurrentViewName(): string {
    const option = this.dropdowmOptions.find(
      (opt) => opt.id === this.currentView
    );
    return option ? option.text : this.dropdowmOptions[0].text;
  }

  getCurrentViewIcon(): string {
    const option = this.dropdowmOptions.find(
      (opt) => opt.id === this.currentView
    );
    return option ? option.icon : this.dropdowmOptions[0].icon;
  }

  onHighlightMarker(place: any): void {
    if (this.mapView) {
      this.mapView.highlightMarker(place);
    }
  }

  onUnhighlightMarker(place: any): void {
    if (this.mapView) {
      this.mapView.unhighlightMarker(place);
    }
  }

  onViewChange(viewStatus: number): void {
    this.currentView = viewStatus;
    this.selectedOption = viewStatus;
    this.shoppingCenterService.setCurrentView(this.currentView);
  }

  toggleSort(): void {
    this.isSortMenuOpen = !this.isSortMenuOpen;
  }

  selectSort(sortOption: any): void {
    this.selectedSortId = sortOption.id;
    this.isSortMenuOpen = false;
    this.shoppingCenterService.setSortOption(sortOption.id);
  }

  getSelectedSortIcon(): string {
    if (this.selectedSortId === 0) {
      return 'fa-solid fa-sort';
    }
    const option = this.sortOptions.find(
      (opt) => opt.id === this.selectedSortId
    );
    return option?.icon || 'fa-solid fa-sort';
  }

  getSelectedSortText(): string {
    if (this.selectedSortId === 0) {
      return 'Sort';
    }
    const option = this.sortOptions.find(
      (opt) => opt.id === this.selectedSortId
    );
    return option?.text || 'Sort';
  }

  // getUserBuyBoxes(): void {
  //   const body: any = {
  //     Name: 'GetUserBuyBoxes',
  //     Params: {},
  //   };

  //   this.placesService.GenericAPI(body).subscribe({
  //     next: (data: any) => {
  //       this.tenants = data.json;
  //       this.filteredTenants = this.tenants;
  //       this.groupTenantsByAlphabet();
  //       this.selectedTenant =
  //         this.tenants.find((t) => t.Id == this.BuyBoxId) || null;
  //       this.cdr.detectChanges();
  //     },
  //     error: (error) => {
  //       console.error('Error loading tenants:', error);
  //     },
  //   });
  // }

  groupTenantsByAlphabet(): void {
    const sortedTenants = [...this.filteredTenants].sort((a, b) =>
      a.Name.localeCompare(b.Name)
    );

    this.groupedTenants = {};
    sortedTenants.forEach((tenant) => {
      const firstLetter = tenant.Name.charAt(0).toUpperCase();
      if (!this.groupedTenants[firstLetter]) {
        this.groupedTenants[firstLetter] = [];
      }
      this.groupedTenants[firstLetter].push(tenant);
    });

    this.alphabetKeys = Object.keys(this.groupedTenants).sort();
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

  selectTenant(tenant: Tenant) {
    this.selectedTenant = tenant;
    this.goToTenant(tenant);
    this.tenantDropdownRef.close();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Handle sort dropdown
    const sortButton = document.querySelector('.sort-container');
    if (sortButton && !sortButton.contains(target)) {
      this.isSortMenuOpen = false;
    }

    this.cdr.detectChanges();
  }

  filterDropdownOptions(): void {
    if (window.innerWidth < 768) {
      this.dropdowmOptions = this.dropdowmOptions.filter(
        (option) => option.id !== 2
      );
    }
  }

  @HostListener('window:resize')
  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 767;
    this.filterDropdownOptions();
  }

  ngOnDestroy(): void {
    this.shoppingCenterService.resetSelectedStageId();
    this.subscriptions.unsubscribe();
  }

  generateSafeUrl(): string {
    const safeEncodedName = encodeURIComponent(this.organizationName || '');
    return `/market-survey?orgId=${this.OrgId}&name=${safeEncodedName}&campaignId=${this.CampaignId}`;
  }

  // Add this method to handle dropdown state changes
  onDropdownOpenChange(isOpen: boolean) {
    this.showTenantDropdown = isOpen;
  }

  onImageError(event: any) {
    event.target.src = 'assets/Images/placeholder.png';
  }

  navigateToMap(): void {
    const url = 'https://www.google.com/maps/search/shopping+centers+malls';
    window.location.href = `${url}?campaignId=${this.CampaignId}&campaignName=${this.organizationName}&organizationId=${this.OrgId}`;
  }
}
