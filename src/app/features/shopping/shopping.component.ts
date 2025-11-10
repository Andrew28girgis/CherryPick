import {
  Component,
  HostListener,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { PlacesService } from 'src/app/core/services/places.service';
import { HttpClient } from '@angular/common/http';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { FileExplorerComponent } from './file-explorer/file-explorer.component'; // Adjust path as needed
import { Place, ShoppingCenter } from 'src/app/shared/models/shopping';
import { Router } from '@angular/router';
import { ICampaign } from 'src/app/shared/models/icampaign';
import { environment } from 'src/environments/environment';
import { NgxFileDropEntry } from 'ngx-file-drop';
import { General } from 'src/app/shared/models/domain';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';
import { ContactBrokerComponent } from '../kayak-home/shopping-center-table/contact-broker/contact-broker.component';
import { MapsService } from 'src/app/core/services/maps.service';
import { signal, effect } from '@angular/core';
import { ChatModalService } from 'src/app/core/services/chat-modal.service';

@Component({
  selector: 'app-shopping',
  templateUrl: './shopping.component.html',
  styleUrls: ['./shopping.component.css'],
})
export class ShoppingComponent implements OnInit {
  @ViewChild('fileExplorer') fileExplorer!: FileExplorerComponent;
  @ViewChild('uploadTypes') uploadTypes!: any;

  Math = Math;
  contactID: any = localStorage.getItem('contactId');

  private modalRef?: NgbModalRef;
  searchTerm: string = '';
  centers: ShoppingCenter[] = [];
  filteredCenters = signal<ShoppingCenter[]>([]);
  showFilterDropdown: boolean = false;
  showSortDropdown: boolean = false;

  currentPage: number = 1;
  itemsPerPage: number = 30;
  totalItems: number = 0;
  totalPages: number = 0;
  visiblePages: number[] = [];

  shareFilter: 'all' | 'shared' | 'not-shared' = 'all';
  priceFrom: string = '';
  priceTo: string = '';
  sizeFrom: string = '';
  sizeTo: string = '';

  sortBy: string = ' ';
  sortOptions = [
    { value: 'name', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
    { value: 'price-low', label: 'Price Low to High' },
    { value: 'price-high', label: 'Price High to Low' },
    { value: 'size-small', label: 'Size Small to Large' },
    { value: 'size-large', label: 'Size Large to Small' },
  ];
  stateSelections: { [key: string]: boolean } = {};
  typeSelections: { [key: string]: boolean } = {};
  sourceSelections: { [key: string]: boolean } = {};
  leaseTypeSelections: { [key: string]: boolean } = {};

  isLoading: boolean = true;
  openMenuId: number | null = null;
  viewMode: 'grid' | 'table' | 'map' = 'grid';
  campaigns: ICampaign[] = [];
  selectedCampaign!: ICampaign;
  currentCenter!: number;
  rotatingKeys: { [id: number]: number } = {};
  showFileDropArea = false;
  isUploading = false;
  General: General = new General();
  mapViewOnePlacex = false;
  map: any;
  BuyBoxId!: any;
  openOrgMenuId: number | null = null;
  orgMenuPos: { top?: string; left?: string } = {};
  activeDropdownId: number | null = null;

  stateFilter: string = 'all';
  typeFilter: string = 'all';
  leaseTypeFilter: string = 'all';
  disabledCardIds: Set<number> = new Set();
  private refreshInterval: any;

  constructor(
    private placesService: PlacesService,
    private http: HttpClient,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private router: Router,
    private viewManagerService: ViewManagerService,
    private mapsService: MapsService,
    private chatModal: ChatModalService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.loadShoppingCenters();
    this.contactID = localStorage.getItem('contactId');
    // this.refreshInterval = setInterval(() => {
    //   this.loadShoppingCenters();
    // }, 30000);
    setTimeout(() => {
      this.availableStates.forEach((s) => (this.stateSelections[s] = false));
      this.availableTypes.forEach((t) => (this.typeSelections[t] = false));
      this.sources.forEach((s) => (this.sourceSelections[s] = false));
      this.availableLeaseTypes.forEach(
        (l) => (this.leaseTypeSelections[l] = false)
      );
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.mapsService.clearMarkers();
  }

  loadShoppingCenters(): void {
    const params = {
      Name: 'GetShoppingCenters',
      Params: {},
    };

    this.placesService.GenericAPI(params).subscribe((response: any) => {
      if (response && response.json) {
        this.centers = response.json.map((center: any, index: number) => ({
          ...center,
          id: center.id || index + 1,
          isShared: center.isShared || center.shared || false,
          mainImage: this.processImageUrl(center.mainImage),
        }));
        this.applyFiltersAndSort();
        this.isLoading = false;
      }
    });
  }

  processImageUrl(imageUrl: string): string {
    if (!imageUrl) {
      return 'assets/Images/placeholder.png';
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    if (imageUrl.startsWith('/') || imageUrl.startsWith('./')) {
      return imageUrl;
    }

    return imageUrl;
  }

  onImageError(event: any, center: ShoppingCenter): void {
    event.target.src = '/placeholder.svg?height=200&width=300';
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort(): void {
    const selectedStates = Object.keys(this.stateSelections).filter(
      (s) => this.stateSelections[s]
    );
    const selectedTypes = Object.keys(this.typeSelections).filter(
      (t) => this.typeSelections[t]
    );
    const selectedLeaseTypes = Object.keys(this.leaseTypeSelections).filter(
      (l) => this.leaseTypeSelections[l]
    );
    const selectedSources = Object.keys(this.sourceSelections).filter(
      (s) => this.sourceSelections[s]
    );

    let filtered = [...this.centers];

    if (this.searchTerm && this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (center) =>
          center.centerName?.toLowerCase().includes(searchLower) ||
          center.centerAddress?.toLowerCase().includes(searchLower)
      );
    }

    if (this.shareFilter !== 'all') {
      filtered = filtered.filter((center) => {
        if (this.shareFilter === 'shared') {
          return center.isShared === true;
        } else if (this.shareFilter === 'not-shared') {
          return center.isShared === false || center.isShared === undefined;
        }
        return true;
      });
    }

    if (this.priceFrom || this.priceTo) {
      filtered = filtered.filter((center) => {
        const price = center.forSalePrice || center.forLeasePrice || 0;
        if (price === 0) return false;
        const fromPrice = this.priceFrom ? parseFloat(this.priceFrom) : 0;
        const toPrice = this.priceTo ? parseFloat(this.priceTo) : Infinity;
        return price >= fromPrice && price <= toPrice;
      });
    }

    if (this.sizeFrom || this.sizeTo) {
      filtered = filtered.filter((center) => {
        if (!center.buildingSizeSf) return false;
        const size = center.buildingSizeSf;
        const fromSize = this.sizeFrom ? parseFloat(this.sizeFrom) : 0;
        const toSize = this.sizeTo ? parseFloat(this.sizeTo) : Infinity;
        return size >= fromSize && size <= toSize;
      });
    }

    if (selectedStates.length > 0) {
      filtered = filtered.filter((center) =>
        selectedStates.includes(center.centerState)
      );
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter((center) =>
        selectedTypes.includes(center.centerType)
      );
    }
    if (selectedSources.length > 0) {
      filtered = filtered.filter((center) => {
        const normalizedSource = this.getSourceDisplay(center.source)
          ?.toLowerCase()
          .trim();
        return selectedSources.includes(normalizedSource);
      });
    }

    if (selectedLeaseTypes.length > 0) {
      filtered = filtered.filter((center) =>
        center.shoppingCenter?.places?.some((place) =>
          selectedLeaseTypes.includes(place.leaseType)
        )
      );
    }

    this.filteredCenters.set(filtered);
    if (this.map && this.viewMode === 'map') {
      this.updateMarkersOnMap();
    }

    // Then apply pagination
    this.updatePagination();
  }

  onFilter(event: Event): void {
    event.stopPropagation();
    this.showFilterDropdown = !this.showFilterDropdown;
    this.showSortDropdown = false;
  }

  onSort(event: Event): void {
    event.stopPropagation();
    this.showSortDropdown = !this.showSortDropdown;
    this.showFilterDropdown = false;
  }

  closeDropdowns(): void {
    this.showFilterDropdown = false;
    this.showSortDropdown = false;
  }

  onFilterChange(): void {
    this.applyFiltersAndSort();
  }

  onSortChange(): void {
    this.applyFiltersAndSort();
    this.showSortDropdown = false;
  }

  toggleShareStatus(center: ShoppingCenter): void {
    center.isShared = !center.isShared;
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFiltersAndSort();
    }
  }

  get pages(): number[] {
    const pagesArray = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pagesArray.push(i);
    }
    return pagesArray;
  }

  updateVisiblePages(): void {
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;
    const visiblePages: number[] = [];

    let startPage = Math.max(currentPage - 2, 1);
    let endPage = Math.min(startPage + 4, totalPages);

    if (endPage - startPage < 4) {
      startPage = Math.max(endPage - 4, 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      visiblePages.push(i);
    }

    this.visiblePages = visiblePages;
  }

  shouldShowLeftDots(): boolean {
    return this.visiblePages[0] > 1;
  }

  shouldShowRightDots(): boolean {
    return this.visiblePages[this.visiblePages.length - 1] < this.totalPages;
  }

  // File Explorer Methods - Updated to call the component's openModal method directly
  openFileExplorer() {
    this.fileExplorer.openModal();
  }

  onFileSelected(filePath: string) {
    this.spinner.show();
    const body = {
      Name: 'AddFile',
      Params: {
        Path: filePath,
        isProcessed: false,
        ContactId: this.contactID,
      },
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        this.showToast('Shopping center added successfully! 🎉');
        setTimeout(() => {
          this.loadShoppingCenters();
        }, 500);
      },
      error: (err) => {
        this.spinner.hide();
        this.showToast('Failed to add shopping center. Please try again.');
      },
    });
  }

  onFileExplorerClose() {
    // Handle any cleanup when file explorer closes
  }

  showToast(message: string) {
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    if (toastMessage && toast) {
      toastMessage.innerText = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }
  }

  toggleMenu(scId: number, event: MouseEvent) {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === scId ? null : scId;
  }

  closeMenu() {
    this.openMenuId = null;
  }

  // Close on any outside click (document-level)
  @HostListener('document:click', ['$event'])
  onDocumentClick(_event: MouseEvent) {
    if (this.openMenuId !== null) {
      this.closeMenu();
    }
  }
  onDocumentsClick(): void {
    this.closeDropdowns();
  }

  onEnriche(center: any) {
    window.location.href = `https://www.google.com/search?q=${center.centerName}+${center.centerAddress}`;
  }

  setView(mode: 'grid' | 'table') {
    this.viewMode = mode;
  }

  onRowNavigate(center: any, event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.router.navigate(['/landing', 0, center?.scId, center.campaignId]);
  }
  addCenter(shoppingCenter: any, campaignId: number) {
    const campaignName = this.campaigns.find(
      (campaign) => campaign.Id === campaignId
    )?.CampaignName;
    const body: any = {
      Name: 'InsertSCToMSSC',
      Params: { ShoppingCenterId: shoppingCenter.scId, CampaignId: campaignId },
    };
    this.placesService.GenericAPI(body).subscribe({
      next: () => {
        this.showToast(
          ` ${shoppingCenter.centerName} added to ${campaignName} campaign successfully!`
        );
      },
    });
  }

  openCampaignModal(content: TemplateRef<any>, center: any): void {
    this.currentCenter = center;

    this.getAllCampaigns();

    this.modalService.open(content, {
      size: 'lg',
    });
  }

  getAllCampaigns(): void {
    const body: any = {
      Name: 'GetUserCampaigns',
      Params: {},
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (response) => {
        if (response.json && response.json.length > 0) {
          this.campaigns = response.json as ICampaign[];
        } else {
          this.campaigns = [];
        }
      },
    });
  }
  goToAddCampaign(): void {
    this.modalService.dismissAll();
    this.router.navigate(['/campaigns'], {
      queryParams: { openAdd: true },
    });
  }
  trackByCenterId(index: number, center: any): number {
    return center?.scId || index;
  }
  InsertAutomation(id: any, reload?: any) {
    if (reload) {
      this.rotatingKeys[id] = (this.rotatingKeys[id] || 0) + 1;

      setTimeout(() => {
        this.rotatingKeys[id] = 0;
      }, 1200);
    }

    this.placesService.InsertAutomation(id).subscribe({
      next: () => {
        if (!reload) {
          this.showToast('Automation Started');
        } else {
          this.showToast('Automation is running again');
          this.loadShoppingCenters();
        }
      },
    });
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
    this.showToast(
      'File uploaded successfully! Emily will process it and notify you when finished.'
    );
    console.log(
      'File uploaded successfully! Emily will process it and notify you when finished.'
    );

    this.isUploading = true;
    this.showFileDropArea = false;

    const formData = new FormData();
    formData.append('filename', file);

    const apiUrl = `${environment.api}/BrokerWithChatGPT/UploadOM/0`;
    this.http.post(apiUrl, formData).subscribe({
      next: (response: any) => {
        this.isUploading = false;

        this.modalService.dismissAll();

        this.showToast('The PDF has been uploaded successfully');
        console.log('The PDF has been uploaded successfully.');
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
  openUploadModal(content: TemplateRef<any>) {
    this.modalService.open(content, {
      size: 'md',
      backdrop: true,
      backdropClass: 'fancy-modal-backdrop',
      windowClass: 'fancy-modal-window',
      centered: true,
    });
  }

  deleteCenter(id: number) {
    const body: any = {
      Name: 'DeleteShoppingCenter',
      Params: { id: id },
    };
    this.placesService.GenericAPI(body).subscribe({
      next: () => {
        this.loadShoppingCenters();
      },
    });
  }
  getSourceDisplay(source: string): string {
    try {
      const url = new URL(source);
      let domain = url.hostname.replace(/^www\./, '');
      domain = domain.split('.')[0];
      return domain;
    } catch {
      return source;
    }
  }
  openMapViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.viewOnMap(modalObject.latitude, modalObject.longitude);
  }
  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true;
    this.map = await this.viewManagerService.initializeMap(
      'mappopup',
      lat,
      lng
    );
  }

  openStreetViewPlace(content: any, modalObject?: any) {
    const modalRef = this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });

    // Store the modal object
    this.General.modalObject = modalObject;

    // Initialize street view after modal is opened
    modalRef.result.then(
      () => {
        // Cleanup if needed
      },
      () => {
        // Cleanup if needed
      }
    );

    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      this.viewOnStreet();
    }, 100);
  }
  viewOnStreet() {
    if (!this.General.modalObject) return;

    const lat = Number.parseFloat(this.General.modalObject.latitude);
    const lng = Number.parseFloat(this.General.modalObject.longitude);

    // Default values for heading and pitch if not provided
    const heading = this.General.modalObject.Heading || 165;
    const pitch = this.General.modalObject.Pitch || 0;

    // Initialize street view
    this.viewManagerService.initializeStreetView(
      'street-view',
      lat,
      lng,
      heading,
      pitch
    );
  }

  openContactModal(center: any): void {
    const modalRef = this.modalService.open(ContactBrokerComponent, {
      size: 'lg',
      centered: true,
    });
    modalRef.componentInstance.center = center;
    modalRef.componentInstance.buyboxId = this.BuyBoxId;
  }

  toggleOrgMenu(id: number, event: MouseEvent) {
    event.stopPropagation(); // prevents bubbling to document

    if (this.openOrgMenuId === id) {
      this.closeOrgMenu();
    } else {
      this.openOrgMenuId = id;
      this.activeDropdownId = id;
      setTimeout(() => {
        document.addEventListener('click', this.handleOutsideClick, true);
      });
    }
  }
  // make sure to bind 'this' when declaring the handler
  handleOutsideClick = (event: Event) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.org-mini-menu') && !target.closest('.leased-by')) {
      this.closeOrgMenu();
    }
  };
  closeOrgMenu() {
    this.openOrgMenuId = null;
    this.activeDropdownId = null;
    document.removeEventListener('click', this.handleOutsideClick, true);
  }
  getMinMaxSizes(places: Place[]) {
    if (!places?.length) return null;

    const sizes = places
      .filter((p) => p.buildingSizeSf)
      .map((p) => p.buildingSizeSf);

    if (!sizes.length) return null;

    return {
      min: Math.min(...sizes),
      max: Math.max(...sizes),
    };
  }

  getMinMaxPrices(places: Place[]) {
    if (!places?.length) return null;

    const prices = places.filter((p) => p.price).map((p) => p.price);

    if (!prices.length) return null;

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  get availableStates(): string[] {
    return [...new Set(this.centers.map((c) => c.centerState))]
      .filter(Boolean)
      .sort();
  }

  get availableTypes(): string[] {
    return [...new Set(this.centers.map((c) => c.centerType))]
      .filter(Boolean)
      .sort();
  }
  get sources(): string[] {
    const normalized = this.centers
      .map((c) => this.getSourceDisplay(c.source)?.toLowerCase().trim())
      .filter((s): s is string => !!s);

    return [...new Set(normalized)].sort();
  }

  get availableLeaseTypes(): string[] {
    return [
      ...new Set(
        this.centers
          .flatMap((c) => c.shoppingCenter?.places || [])
          .map((p) => p.leaseType)
      ),
    ]
      .filter(Boolean)
      .sort();
  }

  private updatePagination(): void {
    const all = this.filteredCenters(); // read signal value

    this.totalItems = all.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    // Change this line - use filteredCenters instead of centers
    this.filteredCenters.set(all.slice(startIndex, endIndex));
  }
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;

    // Always show first page
    if (currentPage > 3) {
      pages.push(1);
      // Add ellipsis marker that won't be rendered as -1
      if (currentPage > 4) {
        pages.push(0); // Using 0 as ellipsis marker
      }
    }

    for (
      let i = Math.max(1, currentPage - 2);
      i <= Math.min(totalPages, currentPage + 2);
      i++
    ) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        pages.push(0); // Using 0 as ellipsis marker
      }
      pages.push(totalPages);
    }

    return pages;
  }

  toggleCardDisabled(centerId: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.disabledCardIds.has(centerId)) {
      this.disabledCardIds.delete(centerId);
    } else {
      this.disabledCardIds.add(centerId);
    }
  }
  resetFilters(): void {
    Object.keys(this.stateSelections).forEach(
      (k) => (this.stateSelections[k] = false)
    );
    Object.keys(this.typeSelections).forEach(
      (k) => (this.typeSelections[k] = false)
    );
    Object.keys(this.leaseTypeSelections).forEach(
      (k) => (this.leaseTypeSelections[k] = false)
    );
    Object.keys(this.sourceSelections).forEach(
      (s) => (this.sourceSelections[s] = false)
    );
    this.applyFiltersAndSort();
  }
  async initMapView(): Promise<void> {
    const mapElement = document.getElementById('shoppingMap') as HTMLElement;
    if (!mapElement) return;

    const config = this.mapsService.getDefaultMapConfig();
    this.map = this.mapsService.createMap(mapElement, config);

    // Center map on first result (optional)
    const first = this.filteredCenters()[0];
    if (first) {
      const lat = Number(first.latitude || first.latitude);
      const lng = Number(first.longitude || first.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        this.map.setCenter({ lat, lng });
      }
    }
  }

  addMapMarkers(): void {
    if (!this.map || !this.filteredCenters?.length) return;

    this.filteredCenters().forEach((center) => {
      if (!center.latitude && !center.latitude) return;

      const position = {
        lat: Number(center.latitude || center.latitude),
        lng: Number(center.longitude || center.longitude),
      };

      const marker = new google.maps.Marker({
        position,
        map: this.map,
        title: center.centerName,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-size:14px;line-height:1.4;">
            <strong>${center.centerName}</strong><br/>
            ${center.centerAddress || ''}<br/>
            ${center.centerCity || ''}, ${center.centerState || ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(this.map, marker);
      });
    });
  }
  ngOnChanges(): void {
    if (this.viewMode === 'map') {
      setTimeout(() => this.initMapView(), 200);
    }
  }

  switchView(mode: 'grid' | 'table' | 'map') {
    this.viewMode = mode;

    if (mode === 'map') {
      // Give Angular time to render the <div id="shoppingMap">
      setTimeout(async () => {
        if (!this.map) {
          await this.initMapView(); // Only create map once
        }
        // Re-render markers after map is ready
        this.updateMarkersOnMap();
      }, 200);
    }
  }

  mapEffect = effect(() => {
    // Skip if map not ready or not in map mode
    if (!this.map || this.viewMode !== 'map') return;

    // Wait a tick to ensure DOM + Google API ready
    queueMicrotask(() => this.updateMarkersOnMap());
  });

  updateMarkersOnMap(): void {
    if (!this.map) return;
    const centers = this.filteredCenters();
    this.mapsService.clearMarkers();

    centers.forEach((center) => {
      if (!center.latitude && !center.latitude) return;
      const markerData = {
        ...center,
        Latitude: center.latitude ?? center.latitude,
        Longitude: center.longitude ?? center.longitude,
        MainImage: center.mainImage,
        CenterName: center.centerName,
        CenterAddress: center.centerAddress,
        CenterCity: center.centerCity,
        CenterState: center.centerState,
        ShoppingCenter: { Places: center.shoppingCenter?.places ?? [] },
      };
      this.mapsService.createMarker(this.map, markerData, 'Shopping Center');
    });
  }
  editWithEMily(center: any): void {
    const body: any = {
      Chat: 'edit campaign with emily',
      ShoppingCenterId: center.scId,
      ConversationId: 2,
    };
    this.placesService.sendmessages(body).subscribe({});
    this.chatModal.openForButton();
    this.chatModal.setShoppingCenterId(center.scId, 2);
  }
}
