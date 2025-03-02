// src/app/components/card-view/card-view.component.ts
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Renderer2,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { General } from 'src/models/domain';
import { BuyboxCategory } from 'src/models/buyboxCategory';
import { Center } from 'src/models/shoppingCenters';
import { ShareOrg } from 'src/models/shareOrg';
import { ViewManagerService } from 'src/app/services/view-manager.service';

@Component({
  selector: 'app-card-view',
  templateUrl: './card-view.component.html',
  styleUrls: ['./card-view.component.css']
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

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private viewManager: ViewManagerService // Inject the ViewManagerService
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
      this.buyboxCategories = await this.viewManager.getBuyBoxCategories(this.BuyBoxId);
      
      // Then load shopping centers
      this.shoppingCenters = await this.viewManager.getShoppingCenters(this.BuyBoxId);
      
      // Load organization data
      this.ShareOrg = await this.viewManager.getOrganizationById(this.OrgId);
      
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  getNeareastCategoryName(categoryId: number): string {
    return this.viewManager.getNearestCategoryName(categoryId, this.buyboxCategories);
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
        this.viewManager.initializeStreetView('street-view', lat, lng, heading, pitch);
      } else {
        console.error("Element with id 'street-view' not found.");
      }
    });
  }

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.viewManager.sanitizeUrl(url);
  }

  openDeleteShoppingCenterModal(shoppingId: number): void {
    // Implementation for opening delete modal
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
} 