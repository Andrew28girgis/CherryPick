import {
  Component,
  OnInit,
  ChangeDetectorRef,
  TemplateRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { General } from 'src/app/shared/models/domain';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BuyboxCategory } from 'src/app/shared/models/buyboxCategory';
import { Center } from '../../../../shared/models/shoppingCenters';
import { ShareOrg } from 'src/app/shared/models/shareOrg';
import { BbPlace } from 'src/app/shared/models/buyboxPlaces';
import { StateService } from 'src/app/core/services/state.service';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';

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
  currentView: any;
  shoppingCenterIdToDelete: number | null = null;
  showbackIds: number[] = [];
  buyboxPlaces: BbPlace[] = [];
  selectedIdCard: number | null = null;
  @Output() viewChange = new EventEmitter<number>();
  DeletedSC: any;

  constructor(
    private activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService,
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

  async initializeData() {
    try {
      this.shoppingCenters = await this.viewManagerService.getShoppingCenters(
        this.BuyBoxId
      );
      this.stateService.setShoppingCenters(this.shoppingCenters);

      this.buyboxCategories = await this.viewManagerService.getBuyBoxCategories(
        this.BuyBoxId
      );
      this.stateService.setBuyboxCategories(this.buyboxCategories);

      this.ShareOrg = await this.viewManagerService.getOrganizationById(
        this.OrgId
      );
      this.stateService.setShareOrg(this.ShareOrg);

      this.buyboxPlaces = await this.viewManagerService.getBuyBoxPlaces(
        this.BuyBoxId
      );
      this.stateService.setBuyboxPlaces(this.buyboxPlaces);

      // Process categories with places
      this.buyboxCategories.forEach((category) => {
        category.isChecked = false;
        category.places = this.buyboxPlaces?.filter((place) =>
          place.RetailRelationCategories?.some((x) => x.Id === category.id)
        );
      });
    } catch (error) {
    }
  }

  RestoreShoppingCenter(MarketSurveyId: any, Deleted: boolean): void {
    this.spinner.show();
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
        this.spinner.hide();
      });
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

    try {
      this.spinner.show();
      await this.viewManagerService.deleteShoppingCenter(
        this.BuyBoxId,
        this.shoppingCenterIdToDelete!
      );
      this.modalService.dismissAll();
    } catch (error) {
    } finally {
      this.spinner.hide();
      this.cdr.markForCheck();
    }
  }

  async refreshShoppingCenters() {
    try {
      this.spinner.show();
      this.shoppingCenters = await this.viewManagerService.getShoppingCenters(
        this.BuyBoxId
      );
      this.buyboxPlaces = await this.viewManagerService.getBuyBoxPlaces(
        this.BuyBoxId
      );
      this.showbackIds = [];
    } catch (error) {
    } finally {
      this.spinner.hide();
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
      }
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
    }
  }

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.viewManagerService.sanitizeUrl(url);
  }
}
