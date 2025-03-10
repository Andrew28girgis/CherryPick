import {
  Component,
  OnInit,
  Renderer2,
  ChangeDetectorRef,
  TemplateRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import { General } from 'src/models/domain';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MapsService } from 'src/app/services/maps.service';
import { BuyboxCategory } from 'src/models/buyboxCategory';
import { Center } from '../../../../../models/shoppingCenters';
import { DomSanitizer } from '@angular/platform-browser';
import { StateService } from '../../../../services/state.service';
import { ShareOrg } from 'src/models/shareOrg';
import { BbPlace } from 'src/models/buyboxPlaces';
import { ViewManagerService } from 'src/app/services/view-manager.service';

declare const google: any;

@Component({
  selector: 'app-table-view',
  templateUrl: './table-view.component.html',
  styleUrls: ['./table-view.component.css'],
})
export class TableViewComponent implements OnInit {
  General: General = new General();
  BuyBoxId!: any;
  OrgId!: any;
  dropdowmOptions: any = [];
  selectedOption: number = 4;
  buyboxCategories: BuyboxCategory[] = [];
  showShoppingCenters = true;
  shoppingCenters: Center[] = [];
  selectedId: number | null = null;
  placesRepresentative: boolean | undefined;
  StreetViewOnePlace!: boolean;
  sanitizedUrl!: any;
  mapViewOnePlacex = false;
  selectedState = '0';
  selectedCity = '';
  BuyBoxName = '';
  ShareOrg: ShareOrg[] = [];
  activecomponent = 'Properties';
  selectedTab = 'Properties';
  currentView: any;
  shoppingCenterIdToDelete: number | null = null;
  deleteShoppingCenterModal!: TemplateRef<any>;
  showbackIds: number[] = [];
  buyboxPlaces: BbPlace[] = [];
  selectedIdCard: number | null = null;
  @Output() viewChange = new EventEmitter<number>();
  DeletedSC: any;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private markerService: MapsService,
    private sanitizer: DomSanitizer,
    private stateService: StateService,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private viewManagerService: ViewManagerService
  ) {
    this.dropdowmOptions = this.viewManagerService.dropdowmOptions;
  }

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

    this.currentView = localStorage.getItem('currentViewDashBord') || '5';
    this.initializeData();

    const selectedOption = this.dropdowmOptions.find(
      (option: any) => option.status === Number.parseInt(this.currentView)
    );

    if (selectedOption) {
      this.selectedOption = selectedOption.status;
    }
    this.activecomponent = 'Properties';
    this.selectedTab = 'Properties';
  }

  async initializeData() {
    try {
      // Load categories first
      this.buyboxCategories = await this.viewManagerService.getBuyBoxCategories(this.BuyBoxId);

      // Load shopping centers
      this.shoppingCenters = await this.viewManagerService.getShoppingCenters(this.BuyBoxId);

      // Load places
      this.buyboxPlaces = await this.viewManagerService.getBuyBoxPlaces(this.BuyBoxId);

      // Load organization data
      this.ShareOrg = await this.viewManagerService.getOrganizationById(this.OrgId);

      // Process categories with places
      this.buyboxCategories.forEach((category) => {
        category.isChecked = false;
        category.places = this.buyboxPlaces?.filter((place) =>
          place.RetailRelationCategories?.some((x) => x.Id === category.id)
        );
      });
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  }

  RestoreShoppingCenter(MarketSurveyId: any,Deleted :boolean) {
    this.spinner.show();
    Deleted = false;

    const body: any = {
      Name: 'RestoreShoppingCenter',
      MainEntity: null,
      Params: {
        marketsurveyid: +MarketSurveyId,
      },
      Json: null,
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: () => {
        const marketSurveyIdNum = Number(MarketSurveyId);
      
        this.shoppingCenters = this.shoppingCenters.map(center => {
          if (Number(center.MarketSurveyId) === marketSurveyIdNum) {
            return { ...center, Deleted: false };
          }
          return center;
        });
        
        this.cdr.markForCheck();
        // this.refreshShoppingCenters();
        this.spinner.hide();
      },
    });
  }


  getNeareastCategoryName(categoryId: number): string {
    return this.viewManagerService.getNearestCategoryName(categoryId, this.buyboxCategories);
  }

  getShoppingCenterUnitSize(shoppingCenter: any): string {
    return this.viewManagerService.getShoppingCenterUnitSize(shoppingCenter);
  }

  toggleShortcuts(id: number, close?: string, event?: MouseEvent): void {
    if (close === 'close') {
      this.selectedId = null;
      return;
    }

    const targetElement = event?.target as HTMLElement;
    const rect = targetElement?.getBoundingClientRect();

    const shortcutsIcon = document.querySelector(
      '.shortcuts_icon'
    ) as HTMLElement;

    if (shortcutsIcon && rect) {
      shortcutsIcon.style.top = `${rect.top + window.scrollY + targetElement.offsetHeight
        }px`;
      shortcutsIcon.style.left = `${rect.left + window.scrollX}px`;
    }

    this.selectedId = this.selectedId === id ? null : id;
  }

  isLast(currentItem: any, array: any[]): boolean {
    return this.viewManagerService.isLast(currentItem, array);
  }

  trackByIndex(index: number, item: any): number {
    return index;
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
    const map = await this.viewManagerService.initializeMap('mappopup', lat, lng);
    if (!map) {
      console.error('Failed to initialize map');
    }
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
        console.error("Element with id 'street-view' not found.");
      }
    });
  }

  streetMap(lat: number, lng: number, heading: number, pitch: number) {
    const panorama = this.viewManagerService.initializeStreetView('street-view', lat, lng, heading, pitch);
    if (!panorama) {
      console.error("Failed to initialize street view");
    }
  }

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.viewManagerService.sanitizeUrl(url);
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
    this.shoppingCenters = this.shoppingCenters.map((x) =>
      x.Id === this.shoppingCenterIdToDelete ? { ...x, Deleted: true } : x
    );


    if (this.shoppingCenterIdToDelete !== null) {
      try {
        this.spinner.show();
        await this.viewManagerService.deleteShoppingCenter(this.BuyBoxId, this.shoppingCenterIdToDelete);
        this.modalService.dismissAll();
        // await this.refreshShoppingCenters();
      } catch (error) {
        console.error('Error deleting shopping center:', error);
      } finally {
        this.spinner.hide();
      }
    }
  }

  async refreshShoppingCenters() {
    try {
      this.spinner.show();
      this.shoppingCenters = await this.viewManagerService.getShoppingCenters(this.BuyBoxId);
      this.buyboxPlaces = await this.viewManagerService.getBuyBoxPlaces(this.BuyBoxId);
      console.log('this.shoppingCenters',this.shoppingCenters);
      
      this.showbackIds = [];
    } catch (error) {
      console.error('Error refreshing shopping centers:', error);
    } finally {
      this.spinner.hide();
    }
  }

  toggleShortcutsCard(id: number | null): void {
    this.selectedIdCard = id;
  }

  selectOption(option: any): void {
    this.viewChange.emit(option.status)
  }
}