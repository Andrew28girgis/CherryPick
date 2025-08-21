import {
  Component,
  HostListener,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MapViewComponent } from './map-view/map-view.component';
import { NgbDropdown, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';
import { ICampaign } from 'src/app/shared/models/icampaign';
import { Stage } from 'src/app/shared/models/shoppingCenters';
import { Subscription } from 'rxjs';
import { PlacesService } from 'src/app/core/services/places.service';
import { Tenant } from 'src/app/shared/models/tenants';
import { NgxFileDropEntry } from 'ngx-file-drop';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-shopping-center-table',
  templateUrl: './shopping-center-table.component.html',
  styleUrls: ['./shopping-center-table.component.css'],
  encapsulation: ViewEncapsulation.None, // This allows :host-context to work
})
export class ShoppingCenterTableComponent implements OnInit, OnDestroy {
  @ViewChild('mapView') mapView!: MapViewComponent;
  filteredCenters: any[] = [];
  filteredCampaigns?: ICampaign[];
  isMobile = false;
  currentView = 3;
  isSocialView = false;
  isMapView = false;
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
      icon: '../../../assets/Images/Icons/card.svg',
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
    // {
    //   id: 6,
    //   text: 'Kanban View',
    //   icon: '../../../../assets/Images/Icons/Cadence.svg',
    // },
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
  @ViewChild('uploadTypes') uploadTypes!: any;
  showFileDropArea = false;
  isUploading = false;
  selectedCampaignId: number | null = null;
  isSearchExpanded = false; // Add this property to track the search state

  // Add these properties
  isFilterMenuOpen = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private shoppingCenterService: ViewManagerService,
    private placesService: PlacesService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private modalService: NgbModal,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.GetAllActiveOrganizations();
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
      this.OrgId = params.orgId;
      this.organizationName = params.orgName;
      this.tenantName = params.orgName || '';
      this.encodedName = encodeURIComponent(this.organizationName);
      this.CampaignId = params.campaignId;
      this.selectedCampaignId = params.campaignId
        ? Number(params.campaignId)
        : null;
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

    this.subscriptions.add(
      this.shoppingCenterService.kanbanStages$.subscribe((stages) => {
        this.stages = stages.map((s: any) => ({
          id: +s.id,
          stageName: s.stageName,
          stageOrder: +s.stageOrder || 0,
          isQualified: s.isQualified || true,
          kanbanTemplateId: +s.kanbanTemplateId || 0,
        }));
        this.updateStageName(this.selectedStageId);
        this.cdr.detectChanges();
      })
    );
    // Subscribe to stage changes
    this.subscriptions.add(
      this.shoppingCenterService.selectedStageId$.subscribe((id) => {
        this.selectedStageId = id;
        this.updateStageName(id);
        this.cdr.detectChanges();
      })
    );

    // Add this to load tenants
    this.getUserBuyBoxes();

    // Subscribe to stage updates from child components
    this.subscriptions.add(
      this.shoppingCenterService.stageUpdate$.subscribe(() => {
        // Ensure the current filter state is maintained
        this.syncFilterState();
        this.cdr.detectChanges();
      })
    );

    // Add subscription to reload event
    this.subscriptions.add(
      this.shoppingCenterService.reloadShoppingCenters$.subscribe((shouldReload) => {
        if (shouldReload) {
          const orgId = Number(localStorage.getItem('OrgId')) || 0;
          this.shoppingCenterService.initializeData(this.CampaignId, orgId);
        }
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

  selectStagekan(stageId: number): void {
    // Prevent interference from ongoing updates
    if (this.shoppingCenterService.getCurrentLoadingState()) {
      return;
    }

    this.selectedStageId = stageId;
    if (stageId === 0) {
      this.selectedStageName = 'All';
    } else if (stageId === 1) {
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

  toggleSearch(): void {
    this.isSearchExpanded = !this.isSearchExpanded;
  }

  toggleView(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.view = !this.view;
    // Close sort menu when opening view menu
    if (this.view) {
      this.isSortMenuOpen = false;
    }
  }

  selectOption(option: any): void {
    this.selectedOption = option.id;
    this.currentView = option.id;
    this.view = false; // Close the view menu after selection
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

  toggleSort(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSortMenuOpen = !this.isSortMenuOpen;
    // Close view menu when opening sort menu
    if (this.isSortMenuOpen) {
      this.view = false;
    }
  }

  selectSort(sortOption: any): void {
    this.selectedSortId = sortOption.id;
    this.isSortMenuOpen = false;
    this.shoppingCenterService.setSortOption(sortOption.id);
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

  GetAllActiveOrganizations(): void {
    const body: any = {
      Name: 'GetAllActiveOrganizations',
      Params: {},
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.tenants = data.json.map((tenant: any) => ({
          ...tenant,
          id: tenant.id,
          name: tenant.name,
          URL: tenant.URL,
          LinkedIn: tenant.LinkedIn,
          Campaigns: tenant.Campaigns || [],
        }));

        this.filteredTenants = this.tenants;
        this.groupTenantsByAlphabet();
        this.selectedTenant =
          this.tenants.find(
            (t) => t.id.toString() === this.OrgId || t.name === this.tenantName
          ) || null;

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading tenants:', error);
      },
    });
  }

  groupTenantsByAlphabet(): void {
    const sortedTenants = [...this.filteredTenants].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    this.groupedTenants = {};
    sortedTenants.forEach((tenant) => {
      const firstLetter = tenant.name.charAt(0).toUpperCase();
      if (!this.groupedTenants[firstLetter]) {
        this.groupedTenants[firstLetter] = [];
      }
      this.groupedTenants[firstLetter].push(tenant);
    });

    this.alphabetKeys = Object.keys(this.groupedTenants).sort();
  }

  goToTenant(tenant: any) {
    const campaignId =
      tenant.Campaigns?.length > 0 ? tenant.Campaigns[0].Id : 0;
    this.router.navigate(['/dashboard', tenant.id, tenant.name, campaignId]);
  }

  selectTenant(tenant: any, campaign?: any): void {
    this.selectedTenant = tenant;
    if (campaign) {
      this.selectedCampaignId = campaign.Id;
    } else {
      this.selectedCampaignId =
        tenant.Campaigns?.length > 0 ? tenant.Campaigns[0].Id : null;
    }
    const campaignId = campaign
      ? campaign.Id
      : tenant.Campaigns?.length > 0
      ? tenant.Campaigns[0].Id
      : 0;

    this.router.navigate(['/dashboard', tenant.id, tenant.name, campaignId]);

    if (this.tenantDropdownRef) {
      this.tenantDropdownRef.close();
    }
  }

  getCurrentCampaignName(): string {
    if (!this.selectedTenant || !this.selectedTenant.Campaigns) {
      return 'Campaign';
    }

    const campaign = this.selectedTenant.Campaigns.find(
      (c: any) => c.Id === this.selectedCampaignId
    );

    return campaign ? campaign.CampaignName : 'Campaign';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Existing sort button check
    const sortButton = document.querySelector('.sort-btn');
    const sortMenu = document.querySelector('.sort-menu');
    if (
      sortButton &&
      sortMenu &&
      !sortButton.contains(target) &&
      !sortMenu.contains(target)
    ) {
      this.isSortMenuOpen = false;
    }

    // Add filter button check
    const filterButton = document.querySelector('.filter-btn');
    const filterMenu = document.querySelector('.filter-menu');
    if (
      filterButton &&
      filterMenu &&
      !filterButton.contains(target) &&
      !filterMenu.contains(target)
    ) {
      this.isFilterMenuOpen = false;
    }

    // Existing view button check
    const viewButton = document.querySelector('.view-btn');
    const viewMenu = document.querySelector('.view-menu');
    if (
      viewButton &&
      viewMenu &&
      !viewButton.contains(target) &&
      !viewMenu.contains(target)
    ) {
      this.view = false;
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

  onDropdownOpenChange(isOpen: boolean) {
    this.showTenantDropdown = isOpen;
  }

  onImageError(event: any) {
    event.target.src = '../../../../assets/Images/placeholder.png';
  }

  navigateToMap(): void {
    const url = 'https://www.google.com/maps/search/shopping+centers+malls';
    window.location.href = `${url}?campaignId=${this.CampaignId}&campaignName=${this.organizationName}&organizationId=${this.OrgId}`;
  }

  getUserBuyBoxes(): void {
    const body: any = {
      Name: 'GetAllActiveOrganizations',
      Params: {},
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        if (!data.json || !data.json.length) {
          this.tenants = [];
          this.filteredTenants = [];
          this.groupTenantsByAlphabet();
          return;
        }

        this.tenants = data.json.map((tenant: any) => ({
          ...tenant,
          Name: tenant.name,
          Id: tenant.id,
          OrganizationId: tenant.id,
          Campaigns:
            tenant.Campaigns?.length && !tenant.Campaigns[0]?.Id
              ? []
              : tenant.Campaigns || [],
        }));

        this.filteredTenants = this.tenants;
        this.groupTenantsByAlphabet();

        this.selectedTenant =
          this.tenants.find((t) => t.OrganizationId == this.OrgId) || null;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading tenants:', error);
        this.tenants = [];
        this.filteredTenants = [];
        this.groupTenantsByAlphabet();
      },
    });
  }

  checkImage(event: Event) {
    const img = event.target as HTMLImageElement;

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      ).data;

      let isWhite = true;
      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];
        if (!(r > 240 && g > 240 && b > 240 && a > 0)) {
          isWhite = false;
          break;
        }
      }

      if (isWhite) {
        img.src = '../../../../assets/Images/placeholder.png';
      }
    } catch (err) {
      console.warn('Canvas image data blocked due to CORS:', err);
      if (img.naturalWidth <= 5 && img.naturalHeight <= 5) {
        img.src = '../../../../assets/Images/placeholder.png';
      }
    }
  }
  showToast(message: string) {
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
      toastMessage.innerText = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 5000);
    } else {
      console.warn('Toast elements not found in DOM.');
    }
  }

  openUpload(): void {
    if (this.uploadTypes) {
      this.modalService.open(this.uploadTypes, {
        size: 'md',
        backdrop: true,
        backdropClass: 'fancy-modal-backdrop',
        keyboard: true,
        windowClass: 'fancy-modal-window',
        centered: true,
      });
    }
  }

  openFileUpload(): void {
    if (!this.isUploading) {
      this.showFileDropArea = true;
    }
  }

  cancelFileUpload(): void {
    this.showFileDropArea = false;
  }

  dropped(files: NgxFileDropEntry[]): void {
    if (files.length > 0) {
      const droppedFile = files[0];

      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          if (
            file.type === 'application/pdf' ||
            file.name.toLowerCase().endsWith('.pdf')
          ) {
            this.uploadFile(file);
          } else {
            alert('Please select a PDF file only.');
          }
        });
      }
    }
  }

  fileOver(event: any): void {
    console.log('File over drop zone');
  }

  fileLeave(event: any): void {
    console.log('File left drop zone');
  }

  uploadFile(file: File): void {
    this.isUploading = true;
    this.showFileDropArea = false;

    const formData = new FormData();
    formData.append('filename', file);

    const apiUrl = `${environment.api}/BrokerWithChatGPT/UploadOM/${this.CampaignId}`;
    this.http.post(apiUrl, formData).subscribe({
      next: (response: any) => {
        console.log('Upload successful:', response);
        this.isUploading = false;

        this.modalService.dismissAll();

        if (
          response &&
          response.Message === 'The PDF has been uploaded successfully'
        ) {
          this.showToast(
            'Emily is processing with the PDF and will Notify when finished in the notifications'
          );
        } else {
          this.showToast(
            'File uploaded successfully! Emily will process it and notify you when finished.'
          );
        }
        // this.router.navigate(['/uploadOM', this.CampaignId], {
        //   state: { uploadResponse: response }
        // });
      },
      error: (error) => {
        console.error('Upload failed:', error);
        this.isUploading = false;
        this.showToast('Upload failed. Please try again.');
      },
    });
  }

  trackByStageId(index: number, stage: Stage): number {
    return stage?.id || index;
  }

  electronMessageWithcampaignId() {
    (window as any).electronMessage.startCREAutomation(
      this.CampaignId,
      localStorage.getItem('token')
    );
    const url = 'https://www.google.com';
    window.location.href = `${url}`;
  }

  // Add this method
  toggleFilter(event: Event): void {
    event.stopPropagation();
    this.isFilterMenuOpen = !this.isFilterMenuOpen;
    // Close other dropdowns
    this.isSortMenuOpen = false;
    this.view = false;
  }
}
