// src/app/components/card-view/card-view.component.ts
import {
  Component,
  OnInit,
  Renderer2,
  ChangeDetectorRef,
  TemplateRef,
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

  shoppingCenterIdToDelete: number | null = null;
  showbackIds: number[] = [];
  buyboxPlaces: BbPlace[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private viewManager: ViewManagerService, // Inject the ViewManagerService,
    private spinner: NgxSpinnerService
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

  toggleShortcutsCard(id: number | null): void {
    this.selectedIdCard = id;
  }

  toggleShortcuts(id: number, close?: string): void {
    if (close === 'close') {
      this.selectedIdCard = null;
    }
  }

  isLast(currentItem: any, array: any[]): boolean {
    return this.viewManager.isLast(currentItem, array);
  }

  selectOption(option: any): void {
    this.selectedOption = option.status;
    this.currentView = option.status;
    this.isOpen = false;
    localStorage.setItem('currentViewDashBord', this.currentView);
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
    shoppingCenterId: any
  ) {
    this.shoppingCenterIdToDelete = shoppingCenterId;
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
    console.log('fffffffffff', this.BuyBoxId, this.shoppingCenterIdToDelete);

    if (this.shoppingCenterIdToDelete !== null) {
      try {
        this.spinner.show();
        await this.viewManager.deleteShoppingCenter(
          this.BuyBoxId,
          this.shoppingCenterIdToDelete
        );
        this.modalService.dismissAll();
        await this.refreshShoppingCenters();
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
}
