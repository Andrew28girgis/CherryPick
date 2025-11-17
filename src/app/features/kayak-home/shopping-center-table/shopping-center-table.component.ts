import {
  Component,
  HostListener,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  ViewEncapsulation,
  TemplateRef,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { MapViewComponent } from './map-view/map-view.component';
import { NgbDropdown, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';
import { ICampaign } from 'src/app/shared/models/icampaign';
import { Stage } from 'src/app/shared/models/shoppingCenters';
import {
  interval,
  startWith,
  Subscription,
  switchMap,
  takeUntil,
  takeWhile,
  tap,
  timer,
} from 'rxjs';
import { PlacesService } from 'src/app/core/services/places.service';
import { Tenant } from 'src/app/shared/models/tenants';
import { NgxFileDropEntry } from 'ngx-file-drop';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { CreSite } from 'src/app/shared/models/urls';
import {
  ActivatedRoute,
  Router,
  NavigationStart,
  NavigationEnd,
  Event as NavigationEvent,
} from '@angular/router';
type Stat =
  | { key: 'owner'; label: string; name: string; avatarUrl: string }
  | { key: 'scoring'; label: string; values: number[] } // e.g., [17,15,50]
  | { key: 'text'; label: string; value: string | number };

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
  currentView = 3; // Change from 3 to 4
  isSocialView = false;
  isMapView = false;
  organizationName!: string;
  CampaignId!: any;
  OrgId!: any;
  selectedOption = 3; // Change from 5 to 4
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
  stats: Stat[] = [
    {
      key: 'owner',
      label: 'Owner',
      name: 'Hassan Magdy',
      avatarUrl: 'https://i.pravatar.cc/64?img=12',
    },
    { key: 'text', label: 'State', value: 'Texas' },
    { key: 'text', label: 'City', value: 'Austin' },
    { key: 'text', label: 'Date Created', value: 'Aug 20, 2025' },
    { key: 'text', label: 'Initial State Selection', value: '-------' },
    { key: 'text', label: 'Inriching', value: 50 },
    { key: 'scoring', label: 'Scoring', values: [17, 15, 50] },
    { key: 'text', label: 'Reaching Out', value: 120 },
    { key: 'text', label: 'Short Listed', value: 34 },
    { key: 'text', label: 'Shared With Tenant', value: 3 },
  ];

  selectedSortId = 0;
  isSortMenuOpen = false;
  imageLoadingStates: { [key: number]: boolean } = {}; // Track loading state for each image
  imageErrorStates: { [key: number]: boolean } = {}; // Track error state for each image
  @ViewChild('tenantDropdown') tenantDropdownRef!: NgbDropdown;
  @ViewChild('uploadTypes') uploadTypes!: any;
  @ViewChild('websiteModalTpl') websitemodal!: any;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  showFileDropArea = false;
  isUploading = false;
  selectedCampaignId: number | null = null;
  isSearchExpanded = false; // Add this property to track the search state

  // Add these properties
  isFilterMenuOpen = false;
  urls: any = [];
  showWebsiteCardsModal = false;
  websiteCards: CreSite[] = [];
  searchTerm = '';
  googleSite: CreSite = {
    name: 'Google',
    logo: 'https://www.google.com/favicon.ico',
    url: 'https://www.google.com',
    // optional: a search template if you store it
    // searchTemplate: 'https://www.google.com/search?q={q}'
  } as any;
  private urlsPollTimeoutId: any = null; // optional global timeout safeguard
  loadingUrls = false;
  private urlsPollSub: Subscription | null = null;
  private readonly URLS_POLL_MS = 2000;
  private readonly URLS_MAX_WAIT_MS = 30000; // optional safety cap
  private intervalId: any;

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
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params['openUpload'] === 'true') {
        setTimeout(() => this.openUpload(), 0);

        // 👇 remove the query param from the URL
        this.router.navigate([], {
          relativeTo: this.activatedRoute,
          queryParams: { openUpload: null },
          queryParamsHandling: 'merge',
          replaceUrl: true, // so it doesn't push a new history entry
        });
      }
    });

    this.GetAllActiveOrganizations();
    this.cdr.detectChanges();

    // Subscribe to filtered centers
    this.subscriptions.add(
      this.shoppingCenterService.filteredCenters$.subscribe((centers) => {
        this.filteredCenters = centers;
        this.cdr.detectChanges();
      })
    );

    // Modify the view initialization logic
    const savedView = 3;
    // if (savedView === '1') {
    //   this.currentView = 4; // Change from 3 to 4
    //   localStorage.setItem('currentViewDashBord', '4');
    // } else {
    //   this.currentView = Number(savedView || '4'); // Change default from '3' to '4'
    // }

    this.isSocialView = this.currentView === 5;
    this.isMapView = false; // Always keep map view disabled
    this.selectedOption = this.currentView;

    this.checkScreenSize();

    this.activatedRoute.params.subscribe((params: any) => {
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

      // this.shoppingCenterService.initializeData(this.CampaignId, this.OrgId);
    });
    this.GetCREUrls();

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
    this.shoppingCenterService.initializeData(this.CampaignId, this.OrgId);
    this.intervalId = setInterval(() => {
      this.shoppingCenterService.loadShoppingCenters(this.CampaignId);
    }, 30000);
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

    if (this.isSearchExpanded) {
      setTimeout(() => {
        this.searchInput?.nativeElement.focus({ preventScroll: true });
      }, 300); // wait for *ngIf render + CSS transition
    }
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
    this.isFilterMenuOpen = false;
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
    this.router.navigate(['/dashboard', campaignId]);
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

    this.router.navigate(['/dashboard', campaignId]);
    this.shoppingCenterService.loadShoppingCenters(campaignId);
    this.cdr.detectChanges();
    if (this.tenantDropdownRef) {
      this.tenantDropdownRef.close();
    }
  }

  getCurrentCampaignName(): string {
    // if (!this.selectedTenant || !this.selectedTenant.Campaigns) {
    //   return 'Campaign';
    // }

    const campaign = this.selectedTenant?.Campaigns.find(
      (c: any) => c.Id === this.selectedCampaignId
    );

    return campaign ? campaign.CampaignName : 'Campaign';
  }
  get dropdownItemCount(): number {
    return (this.tenants || []).reduce(
      (sum, t) => sum + (t.Campaigns?.length ?? 0),
      0
    );
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
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.subscriptions.unsubscribe();
    this.stopUrlsPolling();
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
    const body: any = { Name: 'GetAllActiveOrganizations', Params: {} };

    this.placesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        const orgs = data?.json ?? [];

        // No data? Reset everything.
        if (!orgs.length) {
          this.tenants = [];
          this.filteredTenants = [];
          this.groupTenantsByAlphabet();
          return;
        }

        // Normalize tenant data
        this.tenants = orgs.map((tenant: any) => ({
          ...tenant,
          Name: tenant.name,
          Id: tenant.id,
          OrganizationId: tenant.id,
          Campaigns: Array.isArray(tenant.Campaigns)
            ? tenant.Campaigns.filter((c: any) => c?.Id) // ignore bad campaigns
            : [],
        }));

        this.filteredTenants = this.tenants;
        this.groupTenantsByAlphabet();

        /** ⭐ Auto-select tenant by campaignId since orgId was removed from route */
        this.selectedTenant =
          this.tenants.find((t) =>
            t.Campaigns?.some((c) => c.Id == this.CampaignId)
          ) || null;

        /** Set selected campaign if found */
        if (this.selectedTenant) {
          this.selectedCampaignId = Number(this.CampaignId);
        }

        this.cdr.detectChanges();
      },

      error: () => {
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

  fileOver(event: any): void {}

  fileLeave(event: any): void {}

  uploadFile(file: File): void {
    this.isUploading = true;
    this.showFileDropArea = false;

    const formData = new FormData();
    formData.append('filename', file);

    const apiUrl = `${environment.api}/BrokerWithChatGPT/UploadOM/${this.CampaignId}`;
    this.http.post(apiUrl, formData).subscribe({
      next: (response: any) => {
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
        this.isUploading = false;
        this.showToast('Upload failed. Please try again.');
      },
    });
  }

  trackByStageId(index: number, stage: Stage): number {
    return stage?.id || index;
  }

  electronMessageWithcampaignId() {
    this.openWebsiteModal(this.websitemodal);
    this.websiteCards = this.urls || [];
  }
  onWebsiteCardClick(website: any) {
    this.showWebsiteCardsModal = false;
    const url = website.url || website.URL || 'https://www.google.com';
    window.location.href = url;
    // (window as any).electronMessage.startCREAutomation(
    //   this.CampaignId,
    //   localStorage.getItem('token')
    // );
  }
  // <CHANGE> Add method to close website cards modal
  closeWebsiteCardsModal() {
    this.showWebsiteCardsModal = false;
  }

  // Add this method
  toggleFilter(event: Event): void {
    event.stopPropagation();
    this.isFilterMenuOpen = !this.isFilterMenuOpen;
    // Close other dropdowns
    this.isSortMenuOpen = false;
    this.view = false;
  }

  GetCREUrls(): void {
    const body: any = {
      Name: 'GetCREUrls',
      Params: { CampaignId: this.CampaignId },
    };
    this.placesService.GenericAPI(body).subscribe({
      next: (response) => {
        const list = response?.json ?? [];
        this.urls = Array.isArray(list) ? list : [];
        this.cdr.detectChanges();
        if (this.urls.length > 0) {
          this.stopUrlsPolling();
        } else {
          this.startUrlsPolling();
        }
      },
      error: () => {
        this.startUrlsPolling();
      },
    });
  }

  private startUrlsPolling() {
    if (this.urlsPollSub) return; // already polling
    this.loadingUrls = true;

    const body: any = {
      Name: 'GetCREUrls',
      Params: { CampaignId: this.CampaignId },
    };

    // Poll immediately, then every 2s, stop when urls found OR after max wait.
    this.urlsPollSub = interval(this.URLS_POLL_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.placesService.GenericAPI(body)),
        tap((response: any) => {
          const list = response?.json ?? [];
          this.urls = Array.isArray(list) ? list : [];
          this.cdr.detectChanges();
        }),
        // keep polling while we DON'T have urls
        takeWhile(() => (this.urls?.length ?? 0) === 0, true),
        // optional: hard stop after max wait
        takeUntil(timer(this.URLS_MAX_WAIT_MS))
      )
      .subscribe({
        complete: () => this.stopUrlsPolling(),
        error: () => this.stopUrlsPolling(),
      });
  }

  private stopUrlsPolling() {
    if (this.urlsPollSub) {
      this.urlsPollSub.unsubscribe();
      this.urlsPollSub = null;
    }
    this.loadingUrls = false;
    this.cdr.detectChanges();
  }

  openWebsiteModal(tpl: TemplateRef<any>) {
    if (!this.urls || this.urls.length === 0) {
      this.startUrlsPolling(); // harmless if already polling due to guard in startUrlsPolling()
    } else {
      this.loadingUrls = false;
    }

    this.modalService.open(tpl, {
      size: 'l',
      centered: true,
      scrollable: true,
      backdrop: true,
      windowClass: 'website-modal-window',
      backdropClass: 'website-modal-backdrop',
    });
  }

  // Build a search URL for a given site + query
  private buildSearchUrl(site?: Partial<CreSite>, query = ''): string {
    const q = encodeURIComponent((query || '').trim());
    const siteUrl = (site?.url || '').trim();

    // If no query, just open the site home (same as card)
    if (!q) return siteUrl || 'https://www.google.com';

    // If the site model includes a specific template like "...?q={q}"
    const tpl = (site as any)?.searchTemplate as string | undefined;
    if (tpl && tpl.includes('{q}')) return tpl.replace('{q}', q);

    // Known defaults
    const host = siteUrl.toLowerCase();

    if (!host || host.includes('google.')) {
      return `https://www.google.com/search?q=${q}`;
    }
    if (host.includes('google.com/maps')) {
      return `https://www.google.com/maps/search/${q}`;
    }
    if (host.includes('bing.com')) {
      return `https://www.bing.com/search?q=${q}`;
    }

    // Generic fallback
    if (siteUrl) {
      const base = siteUrl.replace(/\/$/, '');
      // Try a common /search?q= pattern
      return `${base}/search?q=${q}`;
    }

    // Last resort → Google
    return `https://www.google.com/search?q=${q}`;
  }

  private openLikeCard(url: string) {
    this.showWebsiteCardsModal = false;
    window.location.href = url; // same as onWebsiteCardClick
    // (window as any).electronMessage.startCREAutomation(
    //   this.CampaignId,
    //   localStorage.getItem('token')
    // );
  }

  openSearchOnSite(
    site: Partial<CreSite> | undefined,
    query = '',
    newTab = true
  ) {
    const url = this.buildSearchUrl(site, query);
    if (newTab) {
      window.open(url, '_blank', 'noopener');
    } else {
      window.location.href = url;
    }
  }

  openGoogleSearch() {
    this.openSearchOnSite(this.googleSite, this.searchTerm, true);
  }

  onWebsiteCardSearch(website: CreSite) {
    this.openSearchOnSite(website, this.searchTerm, true);
  }

  openGoogleSearchLikeCard() {
    const url = this.buildSearchUrl(this.googleSite, this.searchTerm);
    this.openLikeCard(url);
  }

  // Called by “Search” on a specific site card
  onWebsiteCardSearchLikeCard(website: CreSite) {
    const url = this.buildSearchUrl(website, this.searchTerm);
    this.openLikeCard(url);
  }

  scoringColorClass(i: number): string {
    return ['score-low', 'score-mid', 'score-high'][i] || 'score-low';
  }
  getInitials(name: string): string {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  // deleteAutomation() {
  //   const body: any = {
  //     Name: 'DeleteAllWorkflowTriggers',
  //     Params: {},
  //   };
  //   this.placesService.GenericAPI(body).subscribe({
  //     next:()=> {
  //       this.showToast("Automation Workflows Deleted")
  //     },
  //   });
  // }
}
