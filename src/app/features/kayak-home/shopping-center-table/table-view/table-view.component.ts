import {
  Component,
  OnInit,
  ChangeDetectorRef,
  TemplateRef,
  Output,
  EventEmitter,
  OnDestroy,
  HostListener,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { BuyboxCategory } from 'src/app/shared/models/buyboxCategory';
import { Center } from '../../../../shared/models/shoppingCenters';
import { General } from 'src/app/shared/models/domain';
import { Subscription } from 'rxjs';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';
import { ContactBrokerComponent } from '../contact-broker/contact-broker.component';
import { PlacesService } from 'src/app/core/services/places.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-table-view',
  templateUrl: './table-view.component.html',
  styleUrls: ['./table-view.component.css'],
})
export class TableViewComponent implements OnInit, OnDestroy {
  // Properties
  General: General = new General();
  BuyBoxId!: any;
  campaignid!: any;
  OrgId!: any;
  buyboxCategories: BuyboxCategory[] = [];
  showShoppingCenters = true;
  shoppingCenters: Center[] = [];
  filteredCenters: Center[] = [];

  searchQuery: string = '';
  selectedId: number | null = null;
  placesRepresentative: boolean | undefined;
  StreetViewOnePlace!: boolean;
  sanitizedUrl!: any;
  mapViewOnePlacex = false;
  selectedIdCard: number | null = null;
  @Output() viewChange = new EventEmitter<number>();
  shoppingCenterIdToDelete: number | null = null;
  DeletedSC: any;

  // Loading state for skeleton
  isLoading = true;
  isLoadingstatus =true;
  // Kanban stages
  KanbanStages: any[] = [];
  activeDropdown: any = null;

  @ViewChild('statusModal', { static: true }) statusModal!: TemplateRef<any>;
  htmlContent!: SafeHtml;
  private modalRef?: NgbModalRef;

  private subscriptions = new Subscription();
  private outsideClickHandler: ((e: Event) => void) | null = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private shoppingCenterService: ViewManagerService,
    private placesService: PlacesService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.General = new General();

    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;
      this.OrgId = params.orgId;
      localStorage.setItem('BuyBoxId', this.BuyBoxId);
      localStorage.setItem('OrgId', this.OrgId);
    });

    // Subscribe to data from the centralized service
    this.subscriptions.add(
      this.shoppingCenterService.isLoading$.subscribe((loading) => {
        this.isLoading = loading;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.shoppingCenterService.shoppingCenters$.subscribe((centers) => {
        this.shoppingCenters = centers;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.shoppingCenterService.filteredCenters$.subscribe((centers) => {
        this.filteredCenters = centers;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.shoppingCenterService.buyboxCategories$.subscribe((categories) => {
        this.buyboxCategories = categories;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.shoppingCenterService.selectedId$.subscribe((id) => {
        this.selectedId = id;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.shoppingCenterService.selectedIdCard$.subscribe((id) => {
        this.selectedIdCard = id;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.shoppingCenterService.searchQuery$.subscribe((query) => {
        this.searchQuery = query;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.shoppingCenterService.kanbanStages$.subscribe((stages) => {
        this.KanbanStages = stages;
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();

    // Remove any document event listeners
    if (this.outsideClickHandler) {
      document.removeEventListener('click', this.outsideClickHandler);
      this.outsideClickHandler = null;
    }
  }

  filterCenters() {
    this.shoppingCenterService.filterCenters(this.searchQuery);
  }

  RestoreShoppingCenter(MarketSurveyId: any, Deleted: boolean): void {
    this.shoppingCenterService.restoreShoppingCenter(MarketSurveyId, Deleted);
  }

  openDeleteShoppingCenterModal(
    modalTemplate: TemplateRef<any>,
    shoppingCenter: any
  ) {
    this.DeletedSC = shoppingCenter;
    this.shoppingCenterIdToDelete = shoppingCenter.Id;
    this.modalService.open(modalTemplate, {
      ariaLabelledBy: 'modal-basic-title',
    });
  }

  async deleteShCenter() {
    if (this.shoppingCenterIdToDelete) {
      await this.shoppingCenterService.deleteShoppingCenter(
        this.BuyBoxId,
        this.shoppingCenterIdToDelete
      );
      this.modalService.dismissAll();
    }
  }

  getNeareastCategoryName(categoryId: number): string {
    return this.shoppingCenterService.getNearestCategoryName(categoryId);
  }

  getShoppingCenterUnitSize(shoppingCenter: any): string {
    return this.shoppingCenterService.getShoppingCenterUnitSize(shoppingCenter);
  }

  toggleShortcuts(id: number, close?: string, event?: MouseEvent): void {
    this.shoppingCenterService.toggleShortcuts(id, close, event);
  }

  outsideClickHandlerr = (event: Event): void => {
    const targetElement = event.target as HTMLElement;
    const isInside = targetElement.closest(
      '.shortcuts_iconCard, .ellipsis_icont'
    );

    if (!isInside) {
      this.shoppingCenterService.setSelectedIdCard(null);
      document.removeEventListener('click', this.outsideClickHandlerr);
    }
  };

  toggleShortcutsCard(id: number | null, event?: MouseEvent): void {
    event?.stopPropagation();

    if (this.selectedIdCard === id) {
      this.shoppingCenterService.setSelectedIdCard(null);
      document.removeEventListener('click', this.outsideClickHandlerr);
    } else {
      this.shoppingCenterService.setSelectedIdCard(id);
      setTimeout(() => {
        document.addEventListener('click', this.outsideClickHandlerr);
      });
    }
  }

  isLast(currentItem: any, array: any[]): boolean {
    return this.shoppingCenterService.isLast(currentItem, array);
  }

  openMapViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.viewOnMap(modalObject.Latitude, modalObject.Longitude);
  }

  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true;
    await this.shoppingCenterService.initializeMap('mappopup', lat, lng);
  }

  openStreetViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });

    this.General.modalObject = modalObject;

    if (this.General.modalObject.StreetViewURL) {
      this.setIframeUrl(this.General.modalObject.StreetViewURL);
    } else {
      setTimeout(() => {
        this.viewOnStreet(this.General.modalObject);
      }, 100);
    }
  }

  openStatus(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.General.modalObject = modalObject;
  }

  viewOnStreet(modalObject: any) {
    const lat = +modalObject.StreetLatitude;
    const lng = +modalObject.StreetLongitude;
    const heading = modalObject.Heading || 165;
    const pitch = modalObject.Pitch || 0;

    setTimeout(() => {
      this.shoppingCenterService.initializeStreetView(
        'street-view',
        lat,
        lng,
        heading,
        pitch
      );
    });
  }

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.shoppingCenterService.sanitizeUrl(url);
  }

  // Toggle dropdown for kanban stages
  toggleDropdown(shoppingCenter: any): void {
    this.activeDropdown = this.shoppingCenterService.toggleDropdown(
      shoppingCenter,
      this.activeDropdown
    );
  }

  // Get stage name for the selected ID
  getSelectedStageName(stageId: number): string {
    return this.shoppingCenterService.getSelectedStageName(stageId);
  }

  // Select a stage for a shopping center
  selectStage(
    marketSurveyId: number,
    stageId: number,
    shoppingCenter: any
  ): void {
    shoppingCenter.isDropdownOpen = false;
    this.activeDropdown = null;
    this.shoppingCenterService.updatePlaceKanbanStage(
      marketSurveyId,
      stageId,
      shoppingCenter
    );
  }

  // Handle document clicks to close dropdowns
  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (this.activeDropdown && target && !target.closest('.custom-dropdown')) {
      this.activeDropdown.isDropdownOpen = false;
      this.activeDropdown = null;
      this.cdr.detectChanges();
    }
  }

  openContactModal(center: Center): void {
    const modalRef = this.modalService.open(ContactBrokerComponent, {
      size: 'xl',
      centered: true,
      windowClass: 'contact-broker-modal-class',
    });
    modalRef.componentInstance.center = center;
    modalRef.componentInstance.buyboxId = this.BuyBoxId;
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  requestCenterStatus(shoppingCenterId: number, campaignId: any) {
    // Set loading state to true to show the skeleton loader
    this.isLoadingstatus = true;
  
    // Open the modal immediately
    this.modalRef = this.modalService.open(this.statusModal, {
      size: 'lg',
      scrollable: true,
    });
  
    // Fetch the actual data
    this.placesService.GetSiteCurrentStatus(shoppingCenterId, campaignId).subscribe({
      next: (res: any) => {
        // Update the content with the fetched data
        this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(res);
        this.isLoadingstatus = false; // Hide the skeleton loader
        this.cdr.detectChanges(); // Trigger change detection
      },
      error: () => {
        // Handle errors and show fallback content
        const errHtml = '<p>Error loading content</p>';
        this.htmlContent = this.sanitizer.bypassSecurityTrustHtml(errHtml);
        this.isLoadingstatus = false; // Hide the skeleton loader
        this.cdr.detectChanges();
      },
    });
  }
}
