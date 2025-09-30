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
import { ShoppingCenter } from 'src/app/shared/models/shopping';
import { Router } from '@angular/router';
import { ICampaign } from 'src/app/shared/models/icampaign';

@Component({
  selector: 'app-shopping',
  templateUrl: './shopping.component.html',
  styleUrls: ['./shopping.component.css'],
})
export class ShoppingComponent implements OnInit {
  @ViewChild('fileExplorer') fileExplorer!: FileExplorerComponent;

  Math = Math;
  contactID: any = localStorage.getItem('contactId');

  private modalRef?: NgbModalRef;
  searchTerm: string = '';
  centers: ShoppingCenter[] = [];
  filteredCenters: ShoppingCenter[] = [];
  showFilterDropdown: boolean = false;
  showSortDropdown: boolean = false;

  currentPage: number = 1;
  itemsPerPage: number = 9;
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

  isLoading: boolean = true;
  openMenuId: number | null = null;
  viewMode: 'grid' | 'table' = 'grid'; // default
  campaigns: ICampaign[] = [];
  selectedCampaign!: ICampaign;
  currentCenterId!: number;

  constructor(
    private placesService: PlacesService,
    private http: HttpClient,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.loadShoppingCenters();
    this.contactID = localStorage.getItem('contactId');
  }

  loadShoppingCenters(): void {
    const params = {
      Name: 'GetShoppingCenters',
      Params: {},
    };

    this.placesService.GenericAPI(params).subscribe(
      (response: any) => {
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
      }
    );
  }

  processImageUrl(imageUrl: string): string {
    if (!imageUrl) {
      return '/placeholder.svg?height=200&width=300';
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

    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return (a.centerName || '').localeCompare(b.centerName || '');
        case 'name-desc':
          return (b.centerName || '').localeCompare(a.centerName || '');
        case 'price-low':
          const priceA = a.forSalePrice || a.forLeasePrice || 0;
          const priceB = b.forSalePrice || b.forLeasePrice || 0;
          return priceA - priceB;
        case 'price-high':
          const priceA2 = a.forSalePrice || a.forLeasePrice || 0;
          const priceB2 = b.forSalePrice || b.forLeasePrice || 0;
          return priceB2 - priceA2;
        case 'size-small':
          return (a.buildingSizeSf || 0) - (b.buildingSizeSf || 0);
        case 'size-large':
          return (b.buildingSizeSf || 0) - (a.buildingSizeSf || 0);
        default:
          return 0;
      }
    });

    this.totalItems = filtered.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }

    this.updateVisiblePages();

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.filteredCenters = filtered.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
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
  addCenter(shoppingCenterId: number, campaignId: number) {
    const body: any = {
      Name: 'InsertSCToMSSC',
      Params: { ShoppingCenterId: shoppingCenterId, CampaignId: campaignId },
    };
    this.placesService.GenericAPI(body).subscribe({});
  }

  openCampaignModal(content: TemplateRef<any>, centerId: number): void {
    this.currentCenterId = centerId;

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
      }
    });
  }
  goToAddCampaign(): void {
    this.modalService.dismissAll();
    this.router.navigate(['/campaigns'], {
      queryParams: { openAdd: true },
    });
  }
  trackByCenterId(index: number, center: any): number {
    return center?.id || index;
  }
}
