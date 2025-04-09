import {
  Component,
  OnInit,
  ChangeDetectorRef,
  TemplateRef,
  Output,
  EventEmitter,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { General } from 'src/app/shared/models/domain';
import { BuyboxCategory } from 'src/app/shared/models/buyboxCategory';
import { Center } from 'src/app/shared/models/shoppingCenters';
import { ShareOrg } from 'src/app/shared/models/shareOrg';
   
import { BbPlace } from 'src/app/shared/models/buyboxPlaces';
import { Subscription } from 'rxjs';
import { StateService } from 'src/app/core/services/state.service';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';
import { PlacesService } from 'src/app/core/services/places.service';

@Component({
  selector: 'app-card-view',
  templateUrl: './card-view.component.html',
  styleUrls: ['./card-view.component.css'],
})
export class CardViewComponent implements OnInit, OnDestroy {
  General: General = new General();
  BuyBoxId!: any;
  OrgId!: any;
  selectedOption: number = 3;
  buyboxCategories: BuyboxCategory[] = [];
  shoppingCenters: Center[] = [];
  filteredCenters: Center[] = []; // This will contain the filtered shopping centers
  searchQuery: string = ''; // This will hold the search query from the input
  selectedIdCard: number | null = null;
  placesRepresentative: boolean | undefined;
  currentView: any;
  mapViewOnePlacex = false;
  sanitizedUrl!: any;
  StreetViewOnePlace!: boolean;
  selectedState = '0';
  selectedCity = '';
  BuyBoxName = '';
  ShareOrg: ShareOrg[] = [];
  shareLink: any;
  selectedId: number | null = null;
  @Output() viewChange = new EventEmitter<number>();
  shoppingCenterIdToDelete: number | null = null;
  showbackIds: number[] = [];
  buyboxPlaces: BbPlace[] = [];
  DeletedSC: any;
  private subscriptions = new Subscription();

  // Loading state for skeleton
  isLoading = true;
  // Interval for hiding spinner
       

  first: number = 0;
  rows: number = 9;
  totalRecords!: number;
  KanbanStages: any[] = [];
  activeDropdown: any = null;
  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
  }
  // Variable to hold the filtered list of shopping centers
  get currentShoppingCenters() {
    return this.filteredCenters.slice(this.first, this.first + this.rows);
  }
  constructor(
    private activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private stateService: StateService,
    private viewManager: ViewManagerService,
        
    private cdr: ChangeDetectorRef,
    private PlacesService: PlacesService,
  ) {}

  ngOnInit(): void {
    this.General = new General();
    this.selectedState = '';
    this.selectedCity = '';
    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;
      this.OrgId = params.orgId;
      this.BuyBoxName = params.buyboxName;
      localStorage.setItem('BuyBoxId', this.BuyBoxId);
      localStorage.setItem('OrgId', this.OrgId);
    });

    this.subscriptions.add(
      this.stateService.shoppingCenters$.subscribe((centers) => {
        this.shoppingCenters = centers;
        this.filteredCenters = centers; // Initially set filteredCenters to all centers
      })
    );

    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Method to hide spinner
  private hideSpinner(): void {
    try {
           
    } catch (error) {
      // Ignore errors
    }
  }

  async loadData() {
    try {
      this.isLoading = true; // Show skeleton
      // Hide any spinner

      this.shoppingCenters = await this.viewManager.getShoppingCenters(this.BuyBoxId);
      this.stateService.setShoppingCenters(this.shoppingCenters);
      this.filteredCenters = this.shoppingCenters; // Initialize the filteredCenters with the full list
      this.totalRecords = this.shoppingCenters.length;
     // Get kanban stages using the first kanban ID from the first shopping center
    if (this.shoppingCenters && this.shoppingCenters.length > 0) {
      this.GetKanbanStages(this.shoppingCenters[0].kanbanId);
    }

      this.buyboxCategories = await this.viewManager.getBuyBoxCategories(this.BuyBoxId);
      this.stateService.setBuyboxCategories(this.buyboxCategories);

      this.ShareOrg = await this.viewManager.getOrganizationById(this.OrgId);
      this.stateService.setShareOrg(this.ShareOrg);
    } catch (error) {
      // Handle error
    } finally {
      this.isLoading = false; // Hide skeleton
      // Make sure spinner is hidden
      this.cdr.detectChanges();
    }
  }

  GetKanbanStages(kanbanID: number): void {
    const body: any = {
      Name: 'GetKanbanStages',
      Params: {
        kanbanid: kanbanID,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.KanbanStages = res.json || [];
        this.cdr.detectChanges();
      }
    });
  }
  // Toggle dropdown visibility
toggleDropdown(shoppingCenter: any): void {
  // Close any open dropdown
  if (this.activeDropdown && this.activeDropdown !== shoppingCenter) {
    this.activeDropdown.isDropdownOpen = false;
  }
  // Toggle current dropdown
  shoppingCenter.isDropdownOpen = !shoppingCenter.isDropdownOpen;
  // Set as active dropdown
  this.activeDropdown = shoppingCenter.isDropdownOpen ? shoppingCenter : null;
  // If opening this dropdown, load kanban stages if not already loaded
  if (shoppingCenter.isDropdownOpen && (!this.KanbanStages || this.KanbanStages.length === 0)) {
    this.GetKanbanStages(shoppingCenter.kanbanId);
  }
}
// Get stage name for the selected ID
getSelectedStageName(stageId: number): string {
  if (!this.KanbanStages) return 'Select Stage';
  const stage = this.KanbanStages.find(s => s.id === stageId);
  return stage ? stage.stageName : 'Select Stage';
}
selectStage(marketSurveyId: number, stageId: number, shoppingCenter: any): void {
  // Close the dropdown
  shoppingCenter.isDropdownOpen = false;
  this.activeDropdown = null;
  this.UpdatePlaceKanbanStage(marketSurveyId, stageId, shoppingCenter);
}
// Update the API method to work with the new dropdown
UpdatePlaceKanbanStage(marketSurveyId: number, stageId: number, shoppingCenter: any): void {
  const body: any = {
    Name: 'UpdatePlaceKanbanStage',
    Params: {
      stageid: stageId,
      marketsurveyid: marketSurveyId,
    },
  };
  
  this.PlacesService.GenericAPI(body).subscribe({
    next: (res: any) => {
      // Update local data after successful API call
      shoppingCenter.kanbanStageId = stageId;
      shoppingCenter.stageName = this.getSelectedStageName(stageId);
      this.cdr.detectChanges();
    }
    
  });
}
@HostListener('document:click', ['$event'])
handleDocumentClick(event: MouseEvent): void {
  // Check if click is outside any dropdown
  const target = event.target as HTMLElement | null;
  if (this.activeDropdown && target && !target.closest('.custom-dropdown')) {
    this.activeDropdown.isDropdownOpen = false;
    this.activeDropdown = null;
    this.cdr.detectChanges();
  }
}
  // Filter shopping centers based on search query
  filterCenters() {
    if (this.searchQuery.trim()) {
      this.filteredCenters = this.shoppingCenters.filter((center) =>
        center.CenterName.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    } else {
      this.filteredCenters = this.shoppingCenters; // Show all centers if search query is empty
    }

    this.totalRecords = this.filteredCenters.length; // Update the total record count after filtering
  }

  getNeareastCategoryName(categoryId: number): string {
    return this.viewManager.getNearestCategoryName(
      categoryId,
      this.buyboxCategories
    );
  }

  getShoppingCenterUnitSize(shoppingCenter: any): string {
    return this.viewManager.getShoppingCenterUnitSize(shoppingCenter);
  }

  isLast(currentItem: any, array: any[]): boolean {
    return this.viewManager.isLast(currentItem, array);
  }

  async openMapViewPlace(content: any, modalObject?: any) {
      // Hide spinner before opening modal
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });

    this.mapViewOnePlacex = true;
    await this.viewManager.initializeMap(
      'mappopup',
      modalObject.Latitude,
      modalObject.Longitude
    );
      // Hide spinner after map is initialized
  }

  openStreetViewPlace(content: any, modalObject?: any) {
      // Hide spinner before opening modal
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
        this.viewOnStreet();
      }, 100);
    }
      // Hide spinner after street view is initialized
  }

  viewOnStreet() {
    this.StreetViewOnePlace = true;
    const lat = +this.General.modalObject.StreetLatitude;
    const lng = +this.General.modalObject.StreetLongitude;
    const heading = this.General.modalObject.Heading || 165;
    const pitch = this.General.modalObject.Pitch || 0;

    setTimeout(() => {
      const streetViewElement = document.getElementById('street-view');
      if (streetViewElement) {
        this.viewManager.initializeStreetView(
          'street-view',
          lat,
          lng,
          heading,
          pitch
        );
      } else {
        // Handle error
      }
        // Hide spinner after street view is initialized
    });
  }

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.viewManager.sanitizeUrl(url);
  }

  copyLink(link: string) {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        // Success
      })
      .catch((err) => {
        // Error
      });
  }

  openDeleteShoppingCenterModal(
    modalTemplate: TemplateRef<any>,
    shoppingCenter: any
  ) {
      // Hide spinner before opening modal
    this.DeletedSC = shoppingCenter;
    this.shoppingCenterIdToDelete = shoppingCenter.Id;
    this.modalService.open(modalTemplate, {
      ariaLabelledBy: 'modal-basic-title',
    });
  }

  async deleteShCenter() {
    this.shoppingCenters = this.shoppingCenters.map((x) =>
      x.Id === this.shoppingCenterIdToDelete ? { ...x, Deleted: true } : x
    );

    if (this.shoppingCenterIdToDelete !== null) {
      try {
        this.isLoading = true; // Show skeleton
          // Hide any spinner

        await this.viewManager.deleteShoppingCenter(
          this.BuyBoxId,
          this.shoppingCenterIdToDelete
        );
        this.modalService.dismissAll();
      } finally {
        this.isLoading = false; // Hide skeleton
          // Make sure spinner is hidden
        this.cdr.detectChanges();
      }
    }
  }

  RestoreShoppingCenter(MarketSurveyId: any, Deleted: boolean): void {
    this.isLoading = true; // Show skeleton
      // Hide any spinner

    this.viewManager
      .restoreShoppingCenter(MarketSurveyId, Deleted)
      .then((response: any) => {
        const marketSurveyIdNum = Number(MarketSurveyId);

        this.shoppingCenters = this.shoppingCenters.map((center) => {
          if (Number(center.MarketSurveyId) === marketSurveyIdNum) {
            return { ...center, Deleted: false };
          }
          return center;
        });
        this.isLoading = false; // Hide skeleton
          // Make sure spinner is hidden
        this.cdr.markForCheck();
      })
      .catch((error) => {
        // Handle error
        this.isLoading = false; // Hide skeleton
          // Make sure spinner is hidden
      });
  }

  outsideClickHandler = (event: Event): void => {
    const targetElement = event.target as HTMLElement;
    const isInside = targetElement.closest(
      '.shortcuts_iconCard, .ellipsis_icont'
    );

    if (!isInside) {
      this.selectedIdCard = null;
      document.removeEventListener('click', this.outsideClickHandler);
    }
  };

  toggleShortcutsCard(id: number | null, event?: MouseEvent): void {
    event?.stopPropagation();

    if (this.selectedIdCard === id) {
      this.selectedIdCard = null;
      document.removeEventListener('click', this.outsideClickHandler);
    } else {
      this.selectedIdCard = id;
      setTimeout(() => {
        document.addEventListener('click', this.outsideClickHandler);
      });
    }
  }

  toggleShortcuts(id: number, close?: string, event?: MouseEvent): void {
    if (close === 'close') {
      this.selectedIdCard = null;
      this.selectedId = null;
      return;
    }

    const targetElement = event?.target as HTMLElement;
    const rect = targetElement?.getBoundingClientRect();

    const shortcutsIcon = document.querySelector(
      '.shortcuts_icon'
    ) as HTMLElement;

    if (shortcutsIcon && rect) {
      shortcutsIcon.style.top = `${
        rect.top + window.scrollY + targetElement.offsetHeight
      }px`;
      shortcutsIcon.style.left = `${rect.left + window.scrollX}px`;
    }

    this.selectedIdCard = this.selectedIdCard === id ? null : id;
    this.selectedId = this.selectedId === id ? null : id;
  }
}
