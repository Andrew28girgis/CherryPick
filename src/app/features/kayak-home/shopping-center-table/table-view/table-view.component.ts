import {
  Component,
  OnInit,
  ChangeDetectorRef,
  TemplateRef,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { General } from 'src/app/shared/models/domain';
   
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BuyboxCategory } from 'src/app/shared/models/buyboxCategory';
import { Center } from '../../../../shared/models/shoppingCenters';
import { ShareOrg } from 'src/app/shared/models/shareOrg';
import { BbPlace } from 'src/app/shared/models/buyboxPlaces';
import { StateService } from 'src/app/core/services/state.service';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-table-view',
  templateUrl: './table-view.component.html',
  styleUrls: ['./table-view.component.css'],
})
export class TableViewComponent implements OnInit, OnDestroy {
  General: General = new General();
  BuyBoxId!: any;
  OrgId!: any;
  dropdowmOptions: any = [];
  selectedOption: number = 4;
  buyboxCategories: BuyboxCategory[] = [];
  showShoppingCenters = true;
  shoppingCenters: Center[] = [];
  filteredCenters: Center[] = []; // This will contain the filtered shopping centers
  searchQuery: string = ''; // This will hold the search query from the input
  selectedId: number | null = null;
  placesRepresentative: boolean | undefined;
  StreetViewOnePlace!: boolean;
  sanitizedUrl!: any;
  mapViewOnePlacex = false;
  selectedState = '0';
  selectedCity = '';
  BuyBoxName = '';
  ShareOrg: ShareOrg[] = [];
  currentView: any;
  shoppingCenterIdToDelete: number | null = null;
  showbackIds: number[] = [];
  buyboxPlaces: BbPlace[] = [];
  selectedIdCard: number | null = null;
  @Output() viewChange = new EventEmitter<number>();
  DeletedSC: any;
  
  // Loading state for skeleton
  isLoading = true;
  // Interval for hiding spinner
       
  private subscriptions = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
        
    private cdr: ChangeDetectorRef,
    private stateService: StateService,
    private viewManagerService: ViewManagerService
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

    this.initializeData();
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

  async initializeData() {
    try {
      this.isLoading = true; // Show skeleton
      // Hide any spinner
      
      this.shoppingCenters = await this.viewManagerService.getShoppingCenters(this.BuyBoxId);
      this.stateService.setShoppingCenters(this.shoppingCenters);
      
      this.filteredCenters = this.shoppingCenters; // Initially set filteredCenters to all centers
      this.buyboxCategories = await this.viewManagerService.getBuyBoxCategories(this.BuyBoxId);
      this.stateService.setBuyboxCategories(this.buyboxCategories);

      this.ShareOrg = await this.viewManagerService.getOrganizationById(this.OrgId);
      this.stateService.setShareOrg(this.ShareOrg);

      this.buyboxPlaces = await this.viewManagerService.getBuyBoxPlaces(this.BuyBoxId);
      this.stateService.setBuyboxPlaces(this.buyboxPlaces);
    } catch (error) {
      // Handle error
    } finally {
      this.isLoading = false; // Hide skeleton
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
  }

  get currentShoppingCenters() {
    return this.filteredCenters; // Use filtered centers here
  }

  RestoreShoppingCenter(MarketSurveyId: any, Deleted: boolean): void {
    this.isLoading = true; // Show skeleton
      // Hide any spinner
    
    this.viewManagerService
      .restoreShoppingCenter(MarketSurveyId, Deleted)
      .then((response: any) => {
        const marketSurveyIdNum = Number(MarketSurveyId);

        this.shoppingCenters = this.shoppingCenters.map((center) => {
          if (Number(center.MarketSurveyId) === marketSurveyIdNum) {
            return { ...center, Deleted: false };
          }
          return center;
        });
        this.cdr.markForCheck();
      })
      .finally(() => {
        this.isLoading = false; // Hide skeleton
          // Make sure spinner is hidden
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

    try {
      this.isLoading = true; // Show skeleton
        // Hide any spinner
      
      await this.viewManagerService.deleteShoppingCenter(
        this.BuyBoxId,
        this.shoppingCenterIdToDelete!
      );
      this.modalService.dismissAll();
    } catch (error) {
      // Handle error
    } finally {
      this.isLoading = false; // Hide skeleton
        // Make sure spinner is hidden
      this.cdr.markForCheck();
    }
  }

  async refreshShoppingCenters() {
    try {
      this.isLoading = true; // Show skeleton
        // Hide any spinner
      
      this.shoppingCenters = await this.viewManagerService.getShoppingCenters(
        this.BuyBoxId
      );
      this.buyboxPlaces = await this.viewManagerService.getBuyBoxPlaces(
        this.BuyBoxId
      );
      this.showbackIds = [];
    } catch (error) {
      // Handle error
    } finally {
      this.isLoading = false; // Hide skeleton
        // Make sure spinner is hidden
    }
  }

  getNeareastCategoryName(categoryId: number): string {
    return this.viewManagerService.getNearestCategoryName(
      categoryId,
      this.buyboxCategories
    );
  }

  getShoppingCenterUnitSize(shoppingCenter: any): string {
    return this.viewManagerService.getShoppingCenterUnitSize(shoppingCenter);
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

  toggleShortcutsCard(id: number | null): void {
    this.selectedIdCard = id;
  }

  isLast(currentItem: any, array: any[]): boolean {
    return this.viewManagerService.isLast(currentItem, array);
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  openMapViewPlace(content: any, modalObject?: any) {
      // Hide spinner before opening modal
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.viewOnMap(modalObject.Latitude, modalObject.Longitude);
  }

  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true;
    const map = await this.viewManagerService.initializeMap(
      'mappopup',
      lat,
      lng
    );
    if (!map) {
      // Handle error
    }
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
        this.streetMap(lat, lng, heading, pitch);
      } else {
        // Handle error
      }
        // Hide spinner after street view is initialized
    });
  }

  streetMap(lat: number, lng: number, heading: number, pitch: number) {
    const panorama = this.viewManagerService.initializeStreetView(
      'street-view',
      lat,
      lng,
      heading,
      pitch
    );
    if (!panorama) {
      // Handle error
    }
  }

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.viewManagerService.sanitizeUrl(url);
  }
} 