import {
  Component,
  OnInit,
  ChangeDetectorRef,
  TemplateRef,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BuyboxCategory } from 'src/app/shared/models/buyboxCategory';
import { Center } from '../../../../shared/models/shoppingCenters';
import { General } from 'src/app/shared/models/domain';
import { Subscription } from 'rxjs';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';

@Component({
  selector: 'app-card-view',
  templateUrl: './card-view.component.html',
  styleUrls: ['./card-view.component.css'],
})
export class CardViewComponent implements OnInit, OnDestroy {
  // Properties
  General: General = new General();
  buyboxCategories: BuyboxCategory[] = [];
  shoppingCenters: Center[] = [];
  filteredCenters: Center[] = [];
  searchQuery: string = '';
  selectedId: number | null = null;
  selectedIdCard: number | null = null;
  BuyBoxId!: any;
  OrgId!: any;
  activeDropdown: any = null;
  KanbanStages: any[] = [];
  isLoading = true;
  placesRepresentative: boolean | undefined;
  mapViewOnePlacex = false;
  sanitizedUrl!: any;
  shareLink: any;
  shoppingCenterIdToDelete: number | null = null;
  DeletedSC: any;

  private subscriptions = new Subscription();
  private outsideClickHandler: ((e: Event) => void) | null = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private shoppingCenterService: ViewManagerService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;
      this.OrgId = params.orgId;
      localStorage.setItem('BuyBoxId', this.BuyBoxId);
      localStorage.setItem('OrgId', this.OrgId);
      
      // Initialize data using the centralized service
      this.shoppingCenterService.initializeData(this.BuyBoxId, this.OrgId);
    });

    // Subscribe to data from the centralized service
    this.subscriptions.add(
      this.shoppingCenterService.isLoading$.subscribe(loading => {
        this.isLoading = loading;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.shoppingCenterService.shoppingCenters$.subscribe(centers => {
        this.shoppingCenters = centers;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.shoppingCenterService.filteredCenters$.subscribe(centers => {
        this.filteredCenters = centers;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.shoppingCenterService.buyboxCategories$.subscribe(categories => {
        this.buyboxCategories = categories;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.shoppingCenterService.selectedId$.subscribe(id => {
        this.selectedId = id;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.shoppingCenterService.selectedIdCard$.subscribe(id => {
        this.selectedIdCard = id;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.shoppingCenterService.searchQuery$.subscribe(query => {
        this.searchQuery = query;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.shoppingCenterService.kanbanStages$.subscribe(stages => {
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

  filterCenters(): void {
    this.shoppingCenterService.filterCenters(this.searchQuery);
  }

  RestoreShoppingCenter(MarketSurveyId: any, Deleted: boolean): void {
    this.shoppingCenterService.restoreShoppingCenter(MarketSurveyId, Deleted);
  }

  openDeleteShoppingCenterModal(
    modalTemplate: TemplateRef<any>,
    shoppingCenter: any
  ): void {
    this.DeletedSC = shoppingCenter;
    this.shoppingCenterIdToDelete = shoppingCenter.Id;
    this.modalService.open(modalTemplate, {
      ariaLabelledBy: 'modal-basic-title',
    });
  }

  async deleteShCenter(): Promise<void> {
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

  toggleShortcutsCard(id: number | null, event?: MouseEvent): void {
    event?.stopPropagation();

    // If clicking on the same card that's already selected, close it
    if (this.selectedIdCard === id) {
      this.selectedIdCard = null;
      this.shoppingCenterService.setSelectedIdCard(null);
      
      // Remove the outside click handler
      if (this.outsideClickHandler) {
        document.removeEventListener('click', this.outsideClickHandler);
        this.outsideClickHandler = null;
      }
    } else {
      // Otherwise, select the new card
      this.selectedIdCard = id;
      this.shoppingCenterService.setSelectedIdCard(id);

      // Add event listener to handle clicks outside
      if (this.outsideClickHandler) {
        document.removeEventListener('click', this.outsideClickHandler);
      }
      
      this.outsideClickHandler = (e: Event) => {
        const targetElement = e.target as HTMLElement;
        const isInside = targetElement.closest('.shortcuts_iconCard, .ellipsis_icont');

        if (!isInside) {
          this.selectedIdCard = null;
          this.shoppingCenterService.setSelectedIdCard(null);
          document.removeEventListener('click', this.outsideClickHandler!);
          this.outsideClickHandler = null;
          this.cdr.detectChanges();
        }
      };

      setTimeout(() => {
        document.addEventListener('click', this.outsideClickHandler!);
      });
    }
  }

  isLast(currentItem: any, array: any[]): boolean {
    return this.shoppingCenterService.isLast(currentItem, array);
  }

  openMapViewPlace(content: any, modalObject?: any): void {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.viewOnMap(modalObject.Latitude, modalObject.Longitude);
  }

  async viewOnMap(lat: number, lng: number): Promise<void> {
    this.mapViewOnePlacex = true;
    await this.shoppingCenterService.initializeMap('mappopup', lat, lng);
  }

  openStreetViewPlace(content: any, modalObject?: any): void {
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

  viewOnStreet(modalObject: any): void {
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

  copyLink(link: string) {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        // Success
      })
      .catch((err) => {
        // Error 
        console.error('Could not copy text: ', err);
      });
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
}