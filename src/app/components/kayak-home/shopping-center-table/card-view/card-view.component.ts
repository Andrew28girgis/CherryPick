// src/app/components/card-view/card-view.component.ts
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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { General } from 'src/models/domain';
import { BuyboxCategory } from 'src/models/buyboxCategory';
import { Center } from 'src/models/shoppingCenters';
import { ShareOrg } from 'src/models/shareOrg';
import { ViewManagerService } from 'src/app/services/view-manager.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { BbPlace } from 'src/models/buyboxPlaces';
import { PlacesService } from 'src/app/services/places.service';

@Component({
  selector: 'app-card-view',
  templateUrl: './card-view.component.html',
  styleUrls: ['./card-view.component.css'],
})
export class CardViewComponent implements OnInit {
  General: General = new General();
  BuyBoxId!: any;
  OrgId!: any;

  // Use the dropdown options from the service
  get dropdowmOptions() {
    return this.viewManager.dropdowmOptions;
  }

  selectedOption: number = 3;
  buyboxCategories: BuyboxCategory[] = [];
  shoppingCenters: Center[] = [];
  selectedIdCard: number | null = null;
  placesRepresentative: boolean | undefined;
  isOpen = false;
  currentView: any;
  mapViewOnePlacex = false;
  sanitizedUrl!: any;
  StreetViewOnePlace!: boolean;
  selectedState = '0';
  selectedCity = '';
  BuyBoxName = '';
  ShareOrg: ShareOrg[] = [];
  activeComponent: string = 'Properties';
  selectedTab: string = 'Properties';
  shareLink: any;
  selectedId: number | null = null;
  @Output() viewChange = new EventEmitter<number>();
  shoppingCenterIdToDelete: number | null = null;
  showbackIds: number[] = [];
  buyboxPlaces: BbPlace[] = [];
  DeletedSC: any;

  constructor(
    private activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private PlacesService: PlacesService,
    private viewManager: ViewManagerService, // Inject the ViewManagerService,
    private spinner: NgxSpinnerService
  ) { }

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
    this.loadData();

    const selectedOption = this.dropdowmOptions.find(
      (option: any) => option.status === Number.parseInt(this.currentView)
    );

    if (selectedOption) {
      this.selectedOption = selectedOption.status;
    }
    this.activeComponent = 'Properties';
    this.selectedTab = 'Properties';
  }

  async loadData() {
    try {
      // Load categories first
      this.buyboxCategories = await this.viewManager.getBuyBoxCategories(
        this.BuyBoxId
      );

      // Then load shopping centers
      this.shoppingCenters = await this.viewManager.getShoppingCenters(
        this.BuyBoxId
      );

      // Load organization data
      this.ShareOrg = await this.viewManager.getOrganizationById(this.OrgId);
    } catch (error) {
      console.error('Error loading data:', error);
    }
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
        this.viewManager.initializeStreetView(
          'street-view',
          lat,
          lng,
          heading,
          pitch
        );
      } else {
        console.error("Element with id 'street-view' not found.");
      }
    });
  }

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.viewManager.sanitizeUrl(url);
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

  copyLink(link: string) {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        console.log('Link copied to clipboard!');
      })
      .catch((err) => {
        console.error('Could not copy text: ', err);
      });
  }

  async deleteShCenter() {
    this.shoppingCenters = this.shoppingCenters.map((x) =>
      x.Id === this.shoppingCenterIdToDelete ? { ...x, Deleted: true } : x
    );

    if (this.shoppingCenterIdToDelete !== null) {
      try {
        this.spinner.show();
        await this.viewManager.deleteShoppingCenter(
          this.BuyBoxId,
          this.shoppingCenterIdToDelete
        );
        this.modalService.dismissAll();
        // await this.refreshShoppingCenters();
      } catch (error) {
        console.error('Error deleting shopping center:', error);
      } finally {
        this.spinner.hide();
      }
    }
  }

  RestoreShoppingCenter(MarketSurveyId: any) {
    this.spinner.show();

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
        this.spinner.hide();
        this.refreshShoppingCenters();
        this.loadData();
      },
    });
  }

  async refreshShoppingCenters() {
    try {
      this.spinner.show();
      this.shoppingCenters = await this.viewManager.getShoppingCenters(
        this.BuyBoxId
      );
      this.buyboxPlaces = await this.viewManager.getBuyBoxPlaces(this.BuyBoxId);
      this.showbackIds = [];
    } catch (error) {
      console.error('Error refreshing shopping centers:', error);
    } finally {
      this.spinner.hide();
    }
  }

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

  outsideClickHandler = (event: Event): void => {
    const targetElement = event.target as HTMLElement;
    const isInside = targetElement.closest('.shortcuts_iconCard, .ellipsis_icont');

    if (!isInside) {
      this.selectedIdCard = null;
      document.removeEventListener('click', this.outsideClickHandler);
    }
  };

  selectOption(option: any): void {
    this.viewChange.emit(option.status)
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
}
