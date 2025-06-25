import { Component, OnInit, TemplateRef } from '@angular/core';
import { PlacesService } from 'src/app/core/services/places.service';
import { HttpClient } from '@angular/common/http';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { environment } from 'src/environments/environment';
import {
  Children,
  partitionParent,
  partitions,
} from 'src/app/shared/models/partitions';
import { NonGenericService } from 'src/app/core/services/non-generic.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface ShoppingCenter {
  mainImage: string;
  centerName: string;
  centerAddress: string;
  buildingSizeSf?: number;
  forSalePrice?: number;
  lastForSalePrice?: number;
  forLeasePrice?: number;
  id: number;
  isShared?: boolean;
}

@Component({
  selector: 'app-shopping',
  templateUrl: './shopping.component.html',
  styleUrls: ['./shopping.component.css'],
})
export class ShoppingComponent implements OnInit {
  Math = Math;
  contactID: any;
  DirectoryNames: partitions[] = [];
  childrenPaths: Children[] = [];
  selectedDrive = '';
  selectedPartition = '';
  selectedFullPath = '';
  pathStack: string[] = [];
  currentStep: 'pdf' = 'pdf';
  pdfPath: string = '';
  isUploading: boolean = false;
  uploadProgress: number = 0;
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
    { value: 'size-large', label: 'Size Large to Small' }
  ];

  isLoading: boolean = true;
  private navigationHistory: string[] = [];
  private currentHistoryIndex: number = -1;
  forwardHistory: string[] = [];
  sanitizedPdfUrl: SafeResourceUrl | null = null;
  showPreview: boolean = false;
  previewFile: Children | null = null;

  constructor(
    private placesService: PlacesService,
    private http: HttpClient,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private nonGenericService: NonGenericService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.loadShoppingCenters();
    this.contactID = localStorage.getItem('contactId');
  }

  loadShoppingCenters(): void {
    const params = {
      Name: "GetShoppingCenters",
      Params: {}
    };

    this.placesService.GenericAPI(params).subscribe(
      (response: any) => {
        if (response && response.json) {
          this.centers = response.json.map((center: any, index: number) => ({
            ...center,
            id: center.id || index + 1,
            isShared: center.isShared || center.shared || false,
            mainImage: this.processImageUrl(center.mainImage)
          }));
          this.applyFiltersAndSort();
          this.isLoading = false;
        }
      },
      (error) => {
        console.error('Error loading shopping centers:', error);
        this.isLoading = false;
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
      filtered = filtered.filter(center => 
        (center.centerName?.toLowerCase().includes(searchLower) ||
        center.centerAddress?.toLowerCase().includes(searchLower))
      );
    }

    if (this.shareFilter !== 'all') {
      filtered = filtered.filter(center => {
        if (this.shareFilter === 'shared') {
          return center.isShared === true;
        } else if (this.shareFilter === 'not-shared') {
          return center.isShared === false || center.isShared === undefined;
        }
        return true;
      });
    }

    if (this.priceFrom || this.priceTo) {
      filtered = filtered.filter(center => {
        const price = center.forSalePrice || center.forLeasePrice || 0;
        if (price === 0) return false;
        const fromPrice = this.priceFrom ? parseFloat(this.priceFrom) : 0;
        const toPrice = this.priceTo ? parseFloat(this.priceTo) : Infinity;
        return price >= fromPrice && price <= toPrice;
      });
    }

    if (this.sizeFrom || this.sizeTo) {
      filtered = filtered.filter(center => {
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
    this.filteredCenters = filtered.slice(startIndex, startIndex + this.itemsPerPage);
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

  onDocumentClick(): void {
    this.closeDropdowns();
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

  openPartitionModal(content: TemplateRef<any>) {
    this.currentStep = 'pdf';
    this.pdfPath = '';
    this.modalRef = this.modalService.open(content, { size: 'lg' });
    this.loadPartitions();

    this.modalRef.result.finally(() => {
      this.resetModalState();
    });
  }

  private resetModalState() {
    this.DirectoryNames = [];
    this.childrenPaths = [];
    this.selectedDrive = '';
    this.selectedPartition = '';
    this.selectedFullPath = '';
    this.pathStack = [];
    this.currentStep = 'pdf';
    this.pdfPath = '';
    this.sanitizedPdfUrl = null;
  }

  private loadPartitions() {
    this.spinner.show();
    this.nonGenericService.getPartitions().subscribe({
      next: (drives) => {
        this.DirectoryNames = drives;
        this.childrenPaths = [];
        this.pathStack = [];
        this.spinner.hide();
      },
      error: (err) => {
        console.error(err);
        this.spinner.hide();
      },
    });
  }

  onPartitionSelect(partition: string) {
    this.selectedDrive = partition;
    this.pathStack = [partition];
    this.forwardHistory = [];
    this.loadChildren(partition);
  }

  isFile(child: Children): boolean {
    return child.name.includes('.');
  }

  isValidFileType(child: Children): boolean {
    if (!this.isFile(child)) return false;
    const fileName = child.name.toLowerCase();
    return fileName.endsWith('.pdf');
  }

  isImageFile(child: Children): boolean {
    if (!this.isFile(child)) return false;
    const fileName = child.name.toLowerCase();
    return fileName.endsWith('.jpg') || 
           fileName.endsWith('.jpeg') || 
           fileName.endsWith('.png') || 
           fileName.endsWith('.gif');
  }

  onChildSelect(child: Children) {
    if (this.isFile(child)) {
      const fileExtension = child.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'pdf') {
        this.selectedFullPath = child.fullPath;
      } else {
        this.showToast('Please select a PDF file');
      }
      return;
    }
    this.forwardHistory = [];
    this.pathStack.push(child.fullPath);
    this.loadChildren(child.fullPath);
  }

  togglePreview(event: Event, child: Children) {
    event.stopPropagation();
    if (this.isFile(child) && child.name.toLowerCase().endsWith('.pdf')) {
      this.previewFile = child;
      this.showPreview = true;
      this.selectedFullPath = child.fullPath;
      this.createPdfPreviewUrl(child.fullPath);
    }
  }

  closePreview() {
    this.showPreview = false;
    this.previewFile = null;
    this.sanitizedPdfUrl = null;
  }

  private createPdfPreviewUrl(filePath: string) {
    this.sanitizedPdfUrl = null;
    
    const fileUrl = `file://${filePath}`;
    this.sanitizedPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
  }

  onBack() {
    if (this.pathStack.length > 1) {
      const currentPath = this.pathStack[this.pathStack.length - 1];
      this.forwardHistory.push(currentPath);
      this.pathStack.pop();
      this.loadChildren(this.pathStack[this.pathStack.length - 1]);
    } else {
      this.goToRoot();
    }
  }

  private loadChildren(path: string) {
    this.spinner.show();
    this.nonGenericService.getChildren(path).subscribe({
      next: (resp) => {
        this.selectedFullPath = resp.parentFullPath;
        this.selectedPartition = path;
        this.childrenPaths = resp.children;
        this.spinner.hide();
      },
      error: (err) => {
        console.error(err);
        this.spinner.hide();
      },
    });
  }

  sendPath() {
    if (!this.selectedFullPath) {
      this.showToast('Please select a PDF file');
      return;
    }

    this.spinner.show();
    const body = {
      Name: 'AddPDFDirectory',
      Params: {
        Path: this.selectedFullPath
      },
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.modalService.dismissAll();
        this.spinner.hide();
        this.showToast('Shopping center added successfully! 🎉');
        setTimeout(() => {
          this.loadShoppingCenters();
        }, 500);
      },
      error: (err) => {
        this.spinner.hide();
        this.showToast('Failed to add shopping center. Please try again.');
      }
    });
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

  onForward() {
    if (this.forwardHistory.length > 0) {
      const nextPath = this.forwardHistory.pop()!;
      this.pathStack.push(nextPath);
      this.loadChildren(nextPath);
    }
  }

  onUp() {
    if (this.pathStack.length > 1) {
      this.pathStack.pop();
      this.loadChildren(this.pathStack[this.pathStack.length - 1]);
    } else {
      this.goToRoot();
    }
  }

  refreshView() {
    if (this.selectedDrive) {
      this.loadChildren(this.pathStack[this.pathStack.length - 1]);
    } else {
      this.loadPartitions();
    }
  }

  goToRoot() {
    this.selectedDrive = '';
    this.selectedPartition = '';
    this.selectedFullPath = '';
    this.pathStack = [];
    this.childrenPaths = [];
  }

  goToPath(index: number) {
    if (index < this.pathStack.length - 1) {
      const removedPaths = this.pathStack.slice(index + 1);
      this.forwardHistory = [...removedPaths.reverse(), ...this.forwardHistory];
      
      const newPath = this.pathStack[index];
      this.pathStack = this.pathStack.slice(0, index + 1);
      this.loadChildren(newPath);
    }
  }

  getFileType(fileName: string): string {
    if (!fileName) return 'File';
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'PDF Document';
      case 'jpg':
      case 'jpeg':
        return 'JPEG Image';
      case 'png':
        return 'PNG Image';
      case 'gif':
        return 'GIF Image';
      default:
        return 'File';
    }
  }

  getItemCount(): number {
    if (!this.selectedDrive) {
      return this.DirectoryNames.length;
    }
    return this.childrenPaths.length;
  }
}