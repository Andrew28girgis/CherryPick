import { Component,  OnInit, ChangeDetectorRef,  TemplateRef,  Output,  EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { General } from 'src/models/domain';
import { BuyboxCategory } from 'src/models/buyboxCategory';
import { Center } from 'src/models/shoppingCenters';
import { ShareOrg } from 'src/models/shareOrg';
import { ViewManagerService } from 'src/app/services/view-manager.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { BbPlace } from 'src/models/buyboxPlaces';

@Component({
  selector: 'app-card-view',
  templateUrl: './card-view.component.html',
  styleUrls: ['./card-view.component.css'],
})
export class CardViewComponent implements OnInit  {
  General: General = new General();
  BuyBoxId!: any;
  OrgId!: any;
  selectedOption: number = 3;
  buyboxCategories: BuyboxCategory[] = [];
  shoppingCenters: Center[] = [];
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

  constructor(
    private activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private viewManager: ViewManagerService,
    private spinner: NgxSpinnerService,
    private cdr: ChangeDetectorRef,
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
    
    this.loadData();
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
        await this.viewManager.deleteShoppingCenter(
          this.BuyBoxId,
          this.shoppingCenterIdToDelete
        );
        this.modalService.dismissAll();
      } catch (error) {
        console.error('Error deleting shopping center:', error);
      } finally {
        this.spinner.hide();
      }
    }
  }

  RestoreShoppingCenter(MarketSurveyId: any, Deleted: boolean): void {
    this.viewManager.restoreShoppingCenter(MarketSurveyId, Deleted)
      .then(() => {
        const marketSurveyIdNum = Number(MarketSurveyId);
        
        this.shoppingCenters = this.shoppingCenters.map(center => {
          if (Number(center.MarketSurveyId) === marketSurveyIdNum) {
            return { ...center, Deleted: false };
          }
          return center;
        });
        this.cdr.markForCheck();
      })
  }

  outsideClickHandler = (event: Event): void => {
    const targetElement = event.target as HTMLElement;
    const isInside = targetElement.closest('.shortcuts_iconCard, .ellipsis_icont');

    if (!isInside) {
      this.selectedIdCard = null;
      document.removeEventListener('click', this.outsideClickHandler);
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
      shortcutsIcon.style.top = `${rect.top + window.scrollY + targetElement.offsetHeight}px`;
      shortcutsIcon.style.left = `${rect.left + window.scrollX}px`;
    }
  
    this.selectedIdCard = this.selectedIdCard === id ? null : id;
    this.selectedId = this.selectedId === id ? null : id;
  }
}
