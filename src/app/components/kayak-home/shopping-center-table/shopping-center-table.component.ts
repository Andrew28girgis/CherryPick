import {
  Component,
  OnInit,
  NgZone,
  ViewChild,
  ElementRef,
  TemplateRef,
  Output,
  EventEmitter,
  HostListener,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from './../../../../../src/app/services/places.service';
import {
  AllPlaces,
  type AnotherPlaces,
  General,
  type Property,
} from './../../../../../src/models/domain';
declare const google: any;
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MapsService } from 'src/app/services/maps.service';
import { BuyboxCategory } from 'src/models/buyboxCategory';
import { Center, Place } from 'src/models/shoppingCenters';
import { BbPlace } from 'src/models/buyboxPlaces';
import { DomSanitizer } from '@angular/platform-browser';
import { Polygons } from 'src/models/polygons';
import { ShareOrg } from 'src/models/shareOrg';
import { StateService } from 'src/app/services/state.service';
import { permission } from 'src/models/permission';
import {
  BuyBoxCityState,
  ShoppingCenter,
} from 'src/models/buyboxShoppingCenter';

interface Comment {
  id: number;
  text: string;
  user: string;
  parentId: number | null;
  replies: Comment[];
  MarketSurveyId: number;
}

@Component({
  selector: 'app-shopping-center-table',
  templateUrl: './shopping-center-table.component.html',
  styleUrls: ['./shopping-center-table.component.css'],
})
export class ShoppingCenterTableComponent implements OnInit {
  @ViewChild('mainContainer') mainContainer!: ElementRef;
  shoppingCenter: any;
  selectedView = 'shoppingCenters';
  General!: General;
  pageTitle!: string;
  BuyBoxId!: any;
  OrgId!: any;
  page = 1;
  pageSize = 25;
  paginatedProperties: Property[] = [];
  filteredProperties: Property[] = [];
  dropdowmOptions: any = [
    {
      text: 'Map View',
      icon: '../../../assets/Images/Icons/map.png',
      status: 1,
    },
    {
      text: 'Side List View',
      icon: '../../../assets/Images/Icons/element-3.png',
      status: 2,
    },
    {
      text: 'Cards View',
      icon: '../../../assets/Images/Icons/grid-1.png',
      status: 3,
    },
    {
      text: 'Table View',
      icon: '../../../assets/Images/Icons/grid-4.png',
      status: 4,
    },
    // {
    //   text: 'Social View',
    //   icon: '../../../assets/Images/Icons/globe-solid.svg',
    //   status: 5,
    // },
  ];
  isOpen = false;
  allPlaces!: AllPlaces;
  anotherPlaces!: AnotherPlaces;
  currentView: any;
  centerPoints: any[] = [];
  map: any;
  isCompetitorChecked = false;
  isCoTenantChecked = false;
  cardsSideList: any[] = [];
  selectedOption!: number;
  selectedSS!: any;
  savedMapView: any;
  mapViewOnePlacex = false;
  buyboxCategories: BuyboxCategory[] = [];
  showShoppingCenters = true;
  shoppingCenters: Center[] = [];
  MarketSurveyId: Center[] = [];
  BuyBoxCitiesStates!: BuyBoxCityState[];
  StateCodes: string[] = [];
  filteredCities: string[] = [];
  selectedState = '0';
  selectedCity = '';
  filteredBuyBoxPlacesAndShoppingCenter: ShoppingCenter[] = [];
  BuyBoxPlacesAndShoppingCenter: ShoppingCenter[] = [];
  @ViewChild('deleteShoppingCenterModal')
  deleteShoppingCenterModal!: TemplateRef<any>;
  shoppingCenterIdToDelete: number | null = null;
  @ViewChild('cardContainer') cardContainer!: ElementRef;
  lastTap = 0;
  showToast = false;
  toastMessage = '';
  reactions: { [key: number]: string } = {};
  showReactions: { [key: number]: boolean } = {};
  replyingTo: { [key: number]: number | null } = {};
  reactionTimers: { [key: number]: any } = {};
  newComments: { [key: number]: string } = {};
  newReplies: { [key: number]: string } = {};
  Comments: { [key: number]: string } = {};
  comments: { [key: number]: Comment[] } = {};
  likes: { [key: string]: number } = {};
  showComments: { [key: number]: boolean } = {};
  OrganizationContacts: any[] = [];
  newContact: any = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  };
  showbackIds: number[] = [];
  showbackIdsJoin: any;
  buyboxPlaces: BbPlace[] = [];
  Polygons: Polygons[] = [];
  ShareOrg: ShareOrg[] = [];
  shareLink: any;
  BuyBoxName = '';
  Permission: permission[] = [];
  placesRepresentative: boolean | undefined;
  selectedId: number | null = null;
  selectedIdCard: number | null = null;
  showStandalone = true;
  standAlone: Place[] = [];
  sanitizedUrl!: any;

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private modalService: NgbModal,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private markerService: MapsService,
    private ngZone: NgZone,
    private sanitizer: DomSanitizer,
    private stateService: StateService
  ) {
    this.currentView = localStorage.getItem('currentView') || '4';
    this.savedMapView = localStorage.getItem('mapView');
    this.markerService.clearMarkers();
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

    this.currentView = localStorage.getItem('currentView') || '4';
    this.BuyBoxPlacesCategories(this.BuyBoxId);
    this.GetOrganizationById(this.OrgId);
    this.getShoppingCenters(this.BuyBoxId);
    this.getBuyBoxPlaces(this.BuyBoxId);

    const selectedOption = this.dropdowmOptions.find(
      (option: any) => option.status === Number.parseInt(this.currentView)
    );

    if (selectedOption) {
      this.selectedOption = selectedOption.status;
    }
  }

  toggleShoppingCenters() {
    this.showShoppingCenters = !this.showShoppingCenters;
  }

  toggleStandalone() {
    this.showStandalone = !this.showStandalone;
  }

  deleteShopping(placeId: number) {
    const index = this.showbackIds.indexOf(placeId);
    if (index === -1) {
      this.showbackIds.push(placeId);
    } else {
      this.showbackIds.splice(index, 1);
    }
    this.selectedIdCard = null;
  }

  ArrOfDelete(modalTemplate: TemplateRef<any>) {
    this.showbackIdsJoin = this.showbackIds.join(',');
    this.openDeleteShoppingCenterModal(modalTemplate, this.showbackIdsJoin);
  }

  CancelDelete() {
    this.showbackIds = [];
  }

  CancelOneDelete(id: number) {
    const index = this.showbackIds.indexOf(id);
    if (index !== -1) {
      this.showbackIds.splice(index, 1);
    }
  }

  toggleShortcutsCard(id: number, close?: string): void {
    if (close === 'close') {
      this.selectedIdCard = null;
    } else {
      this.selectedIdCard = this.selectedIdCard === id ? null : id;
    }
  }

  toggleShortcuts(id: number, close?: string, event?: MouseEvent): void {
    if (close === 'close') {
      this.selectedId = null;
      this.selectedIdCard = null;
      return;
    }

    const targetElement = event?.target as HTMLElement;
    const rect = targetElement.getBoundingClientRect();

    const shortcutsIcon = document.querySelector(
      '.shortcuts_icon'
    ) as HTMLElement;

    if (shortcutsIcon) {
      shortcutsIcon.style.top = `${
        rect.top + window.scrollY + targetElement.offsetHeight
      }px`;
      shortcutsIcon.style.left = `${rect.left + window.scrollX}px`;
    }

    this.selectedId = this.selectedId === id ? null : id;
  }

  @Output() tabChange = new EventEmitter<{
    tabId: string;
    shoppingCenterId: number;
  }>();

  redirect(organizationId: any) {
    this.tabChange.emit({ tabId: 'Emily', shoppingCenterId: organizationId });
  }

  GetOrganizationById(orgId: number): void {
    const shareOrg = this.stateService.getShareOrg() || [];

    if (shareOrg && shareOrg.length > 0) {
      this.ShareOrg = this.stateService.getShareOrg();
      return;
    }

    const body: any = {
      Name: 'GetOrganizationById',
      Params: {
        organizationid: orgId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.ShareOrg = data.json;
        this.stateService.setShareOrg(data.json);
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  BuyBoxPlacesCategories(buyboxId: number): void {
    if (this.stateService.getBuyboxCategories().length > 0) {
      this.buyboxCategories = this.stateService.getBuyboxCategories();
      this.getShoppingCenters(buyboxId);
      return;
    }

    const body: any = {
      Name: 'GetRetailRelationCategories',
      Params: {
        BuyBoxId: buyboxId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.buyboxCategories = data.json;
        this.stateService.setBuyboxCategories(data.json);
        this.getShoppingCenters(this.BuyBoxId);
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  getShoppingCenters(buyboxId: number): void {
    if (this.stateService.getShoppingCenters().length > 0) {
      this.shoppingCenters = this.stateService.getShoppingCenters();
      return;
    }

    this.spinner.show();
    const body: any = {
      Name: 'GetMarketSurveyShoppingCenters',
      Params: {
        BuyBoxId: buyboxId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.shoppingCenters = data.json;
        this.stateService.setShoppingCenters(data.json);
        this.spinner.hide();
        this.getBuyBoxPlaces(this.BuyBoxId);
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  getBuyBoxPlaces(buyboxId: number): void {
    if (this.stateService.getBuyboxPlaces()?.length > 0) {
      this.buyboxPlaces = this.stateService.getBuyboxPlaces();
      this.getAllMarker();
      return;
    }

    const body: any = {
      Name: 'BuyBoxRelatedRetails',
      Params: {
        BuyBoxId: buyboxId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.buyboxPlaces = data.json;
        this.stateService.setBuyboxPlaces(data.json);
        this.buyboxCategories.forEach((category) => {
          category.isChecked = false;
          category.places = this.buyboxPlaces?.filter((place) =>
            place.RetailRelationCategories?.some((x) => x.Id === category.id)
          );
        });
        this.getAllMarker();
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  async getAllMarker() {
    try {
      this.spinner.show();
      const { Map } = await google.maps.importLibrary('maps');

      const mapElement = document.getElementById('map') as HTMLElement;
      if (!mapElement) {
        console.error('Element with id "map" not found.');
        return;
      }

      if (this.savedMapView) {
        const { lat, lng, zoom } = JSON.parse(this.savedMapView);
        this.map = new Map(mapElement, {
          center: { lat: lat, lng: lng },
          zoom: zoom,
          mapId: '1234567890',
        });
      } else {
        this.map = new Map(mapElement, {
          center: {
            lat: this.shoppingCenters
              ? this.shoppingCenters?.[0]?.Latitude
              : this.standAlone?.[0]?.Latitude || 0,
            lng: this.shoppingCenters
              ? this.shoppingCenters?.[0]?.Longitude
              : this.standAlone?.[0]?.Longitude || 0,
          },
          zoom: 8,
          mapId: '1234567890',
        });
      }

      this.map.addListener('dragend', () => this.onMapDragEnd(this.map));
      this.map.addListener('zoom_changed', () => this.onMapDragEnd(this.map));
      this.map.addListener('bounds_changed', () => this.onMapDragEnd(this.map));

      if (this.shoppingCenters && this.shoppingCenters.length > 0) {
        this.createMarkers(this.shoppingCenters, 'Shopping Center');
      }

      if (this.standAlone && this.standAlone.length > 0) {
        this.createMarkers(this.standAlone, 'Stand Alone');
      }

      this.createCustomMarkers(this.buyboxCategories);
    } catch (error) {
      console.error('Error loading markers:', error);
    } finally {
      this.spinner.hide();
    }
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

  deleteShCenter() {
    this.spinner.show();
    const body: any = {
      Name: 'DeleteShoppingCenterFromBuyBox',
      Params: {
        BuyBoxId: this.BuyBoxId,
        ShoppingCenterId: this.shoppingCenterIdToDelete,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.modalService.dismissAll();

        this.getMarketSurveyShoppingCenter();
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  getMarketSurveyShoppingCenter() {
    this.spinner.show();
    const body: any = {
      Name: 'GetMarketSurveyShoppingCenters',
      Params: {
        BuyBoxId: this.BuyBoxId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => this.handleSuccessResponse(data),
    });
  }

  private handleSuccessResponse(data: any) {
    this.shoppingCenters = data.json;
    this.stateService.setShoppingCenters(data.json);

    this.getBuyBoxPlaces(this.BuyBoxId);
    this.showbackIds = [];
    this.spinner.hide();
  }

  // Confirm deletion of Shopping Center
  confirmDeleteShoppingCenter(modal: NgbModalRef) {
    console.log(this.shoppingCenterIdToDelete);

    if (this.shoppingCenterIdToDelete !== null) {
      this.DeleteShoppingCenter().subscribe((res) => {
        this.getMarketSurveyShoppingCenter();

        this.BuyBoxPlacesAndShoppingCenter =
          this.BuyBoxPlacesAndShoppingCenter.filter(
            (center) => center.id !== this.shoppingCenterIdToDelete
          );
        modal.close('Delete click');
        this.shoppingCenterIdToDelete = null;
      });
    }
  }

  DeleteShoppingCenter() {
    const body: any = {
      Name: 'DeleteShoppingCenterFromBuyBox',
      Params: {
        BuyboxId: this.BuyBoxId,
        ShoppingCenterId: this.showbackIdsJoin,
      },
    };
    return this.PlacesService.GenericAPI(body);
  }

  createMarkers(markerDataArray: any[], type: string) {
    markerDataArray.forEach((markerData) => {
      this.markerService.createMarker(this.map, markerData, type);
      // this.markerService.fetchAndDrawPolygon(th)
    });
  }

  createCustomMarkers(markerDataArray: any[]) {
    markerDataArray?.forEach((categoryData) => {
      this.markerService.createCustomMarker(this.map, categoryData);
    });
  }

  isLast(currentItem: any, array: any[]): boolean {
    return array.indexOf(currentItem) === array.length - 1;
  }

  private onMapDragEnd(map: any) {
    this.saveMapView(map);
    this.updateShoppingCenterCoordinates();
    this.updateCardsSideList(map);
  }

  private saveMapView(map: any): void {
    const center = map.getCenter();
    const zoom = map.getZoom();
    localStorage.setItem(
      'mapView',
      JSON.stringify({
        lat: center.lat(),
        lng: center.lng(),
        zoom: zoom,
      })
    );
  }

  private updateShoppingCenterCoordinates(): void {
    if (this.shoppingCenters) {
      this.shoppingCenters?.forEach((center) => {
        // if (center.ShoppingCenter?.Places) {
        center.Latitude = center.Latitude;
        center.Longitude = center.Longitude;
        // }
      });
    }
  }

  private updateCardsSideList(map: any): void {
    const bounds = map.getBounds();
    const visibleMarkers =
      this.markerService?.getVisibleProspectMarkers(bounds);
    const visibleCoords = new Set(
      visibleMarkers.map((marker) => `${marker.lat},${marker.lng}`)
    );

    const allProperties = [
      ...(this.shoppingCenters || []),
      ...(this.standAlone || []),
    ];

    // Update the cardsSideList inside NgZone
    this.ngZone.run(() => {
      this.cardsSideList = allProperties.filter(
        (property) =>
          visibleCoords.has(`${property.Latitude},${property.Longitude}`) ||
          this.isWithinBounds(property, bounds)
      );
    });
  }

  private isWithinBounds(property: any, bounds: any): boolean {
    const lat = Number.parseFloat(property.Latitude);
    const lng = Number.parseFloat(property.Longitude);

    if (isNaN(lat) || isNaN(lng)) {
      console.warn('Invalid Latitude or Longitude for property:', property);
      return false;
    }

    return bounds?.contains({ lat, lng });
  }

  onMouseEnter(place: any): void {
    const { Latitude, Longitude } = place;
    const mapElement = document.getElementById('map') as HTMLElement;

    if (!mapElement) return;

    if (this.map) {
      this.map.setCenter({ lat: +Latitude, lng: +Longitude });
      this.map.setZoom(17);
    }
  }

  onMouseHighlight(place: any) {
    this.markerService.onMouseEnter(this.map, place);
  }

  onMouseLeaveHighlight(place: any) {
    this.markerService.onMouseLeave(this.map, place);
  }

  selectOption(option: any): void {
    this.selectedOption = option.status;
    this.currentView = option.status;
    this.isOpen = false;
    localStorage.setItem('currentView', this.currentView);
  }

  goToPlace(place: any) {
    if (place.CenterAddress) {
      this.router.navigate([
        '/landing',
        place.ShoppingCenter?.Places ? place.ShoppingCenter.Places[0].Id : 0,
        place.Id,
        this.BuyBoxId,
        this.OrgId,
      ]);
    } else {
      this.router.navigate([
        '/landing',
        place.Id,
        0,
        this.BuyBoxId,
        this.OrgId,
      ]);
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

  ngOnChanges() {
    if (this.General.modalObject?.StreetViewURL) {
      this.setIframeUrl(this.General.modalObject.StreetViewURL);
    }
  }

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  trackByIndex(index: number, item: any): number {
    return index; // Return the index to track by the position
  }

  StreetViewOnePlace!: boolean;

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
    const streetViewElement = document.getElementById('street-view');
    if (streetViewElement) {
      const panorama = new google.maps.StreetViewPanorama(
        streetViewElement as HTMLElement,
        {
          position: { lat: lat, lng: lng },
          pov: { heading: heading, pitch: 0 }, // Dynamic heading and pitch
          zoom: 1,
        }
      );
      this.addMarkerToStreetView(panorama, lat, lng);
    } else {
      console.error("Element with id 'street-view' not found in the DOM.");
    }
  }

  addMarkerToStreetView(panorama: any, lat: number, lng: number) {
    const svgPath =
      'M-1.547 12l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM0 0q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z';

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: panorama,
      icon: {
        path: svgPath,
        scale: 4,
        fillColor: 'black',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 1,
      },
    });
  }

  openMapViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.viewOnMap(modalObject.Latitude, modalObject.Longitude);
  }

  openLink(content: any, modalObject?: any) {
    this.shareLink = '';
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    if (modalObject) {
      if (modalObject.CenterAddress) {
        this.shareLink = `https://cp.cherrypick.com/?t=${this.ShareOrg[0].token}&r=/landing/${modalObject.ShoppingCenter.Places[0].Id}/${modalObject.Id}/${this.BuyBoxId}`;
      } else {
        this.shareLink = `https://cp.cherrypick.com/?t=${this.ShareOrg[0].token}&r=/landing/${modalObject.Id}/0/${this.BuyBoxId}`;
      }
    } else {
      this.shareLink = `https://cp.cherrypick.com/?t=${this.ShareOrg[0].token}&r=/home/${this.BuyBoxId}/${this.OrgId}`;
    }
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

  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true;

    if (!lat || !lng) {
      console.error('Latitude and longitude are required to display the map.');
      return;
    }
    // Load Google Maps API libraries
    const { Map } = (await google.maps.importLibrary('maps')) as any;
    const mapDiv = document.getElementById('mappopup') as HTMLElement;

    if (!mapDiv) {
      console.error('Element with ID "mappopup" not found.');
      return;
    }

    const map = new Map(mapDiv, {
      center: { lat, lng },
      zoom: 14,
    });

    // Create a new marker
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: 'Location Marker',
    });
  }

  getShoppingCenterUnitSize(shoppingCenter: any): any {
    const formatNumberWithCommas = (number: number) => {
      return number.toLocaleString(); // Format the number with commas
    };

    const formatLeasePrice = (price: any) => {
      if (price === 0 || price === 'On Request') return 'On Request';
      const priceNumber = Number.parseFloat(price);
      return !isNaN(priceNumber) ? Math.floor(priceNumber) : price; // Remove decimal points and return the whole number
    };

    const appendInfoIcon = (calculatedPrice: string, originalPrice: any) => {
      if (calculatedPrice === 'On Request') {
        return calculatedPrice; // No icon for "On Request"
      }
      const formattedOriginalPrice = `$${Number.parseFloat(
        originalPrice
      ).toLocaleString()}/sq ft./year`;

      // Inline styles can be adjusted as desired
      return `
        <div style="display:inline-block; text-align:left; line-height:1.2;">
          <div style="font-size:14px; font-weight:600; color:#333;">${formattedOriginalPrice}</div>
          <div style="font-size:12px; color:#666; margin-top:4px;">${calculatedPrice}</div>
        </div>
      `;
    };

    // Extract the places array
    const places = shoppingCenter?.ShoppingCenter?.Places || [];

    // Collect building sizes if available
    const buildingSizes = places
      .map((place: any) => place.BuildingSizeSf)
      .filter(
        (size: any) => size !== undefined && size !== null && !isNaN(size)
      );

    if (buildingSizes.length === 0) {
      // Handle case for a single shopping center without valid places
      const singleSize = shoppingCenter.BuildingSizeSf;
      if (singleSize) {
        const leasePrice = formatLeasePrice(shoppingCenter.ForLeasePrice);
        const resultPrice =
          leasePrice && leasePrice !== 'On Request'
            ? appendInfoIcon(
                `$${formatNumberWithCommas(
                  Math.floor((Number.parseFloat(leasePrice) * singleSize) / 12)
                )}/month`,
                shoppingCenter.ForLeasePrice
              )
            : 'On Request';
        return `Unit Size: ${formatNumberWithCommas(
          singleSize
        )} sq ft.<br>Lease price: ${resultPrice}`;
      }
      return null;
    }

    // Calculate min and max size
    const minSize = Math.min(...buildingSizes);
    const maxSize = Math.max(...buildingSizes);

    // Find corresponding lease prices for min and max sizes
    const minPrice =
      places.find((place: any) => place.BuildingSizeSf === minSize)
        ?.ForLeasePrice || 'On Request';
    const maxPrice =
      places.find((place: any) => place.BuildingSizeSf === maxSize)
        ?.ForLeasePrice || 'On Request';

    // Format unit sizes
    const sizeRange =
      minSize === maxSize
        ? `${formatNumberWithCommas(minSize)} sq ft.`
        : `${formatNumberWithCommas(minSize)} sq ft. - ${formatNumberWithCommas(
            maxSize
          )} sq ft.`;

    // Ensure only one price is shown if one is "On Request"
    const formattedMinPrice =
      minPrice === 'On Request'
        ? 'On Request'
        : appendInfoIcon(
            `$${formatNumberWithCommas(
              Math.floor((Number.parseFloat(minPrice) * minSize) / 12)
            )}/month`,
            minPrice
          );

    const formattedMaxPrice =
      maxPrice === 'On Request'
        ? 'On Request'
        : appendInfoIcon(
            `$${formatNumberWithCommas(
              Math.floor((Number.parseFloat(maxPrice) * maxSize) / 12)
            )}/month`,
            maxPrice
          );

    // Handle the lease price display logic
    let leasePriceRange;
    if (
      formattedMinPrice === 'On Request' &&
      formattedMaxPrice === 'On Request'
    ) {
      leasePriceRange = 'On Request';
    } else if (formattedMinPrice === 'On Request') {
      leasePriceRange = formattedMaxPrice;
    } else if (formattedMaxPrice === 'On Request') {
      leasePriceRange = formattedMinPrice;
    } else if (formattedMinPrice === formattedMaxPrice) {
      // If both are the same price, just show one
      leasePriceRange = formattedMinPrice;
    } else {
      leasePriceRange = `${formattedMinPrice} - ${formattedMaxPrice}`;
    }

    return `Unit Size: ${sizeRange}<br> <b>Lease price</b>: ${leasePriceRange}`;
  }

  getNeareastCategoryName(categoryId: number) {
    const categories = this.buyboxCategories.filter((x) => x.id == categoryId);
    return categories[0]?.name;
  }

  formatNumberWithCommas(value: number | null): string {
    if (value !== null) {
      return value?.toLocaleString();
    } else {
      return '';
    }
  }

  setDefaultView(viewValue: number) {
    this.selectedSS = viewValue;
    this.stateService.setSelectedSS(viewValue);
  } 

  react(shopping: any, reactionType: string): void {
    this.reactions[shopping.Id] = reactionType;
    this.showReactions[shopping.Id] = false;
  }

  getReaction(shopping: any): string {
    return this.reactions[shopping.Id] || '';
  }

  getTotalReactions(shopping: any): number {
    return this.reactions[shopping.Id] ? 1 : 0;
  }

  getPrimaryReaction(shopping: any): string {
    return this.reactions[shopping.Id] || 'Like';
  }

  toggleComments(shopping: any): void {
    this.showComments[shopping.Id] = !this.showComments[shopping.Id];
  }

  addComment(shopping: Center, marketSurveyId: number): void {
    if (this.newComments[marketSurveyId]) {
      const body = {
        Name: 'CreateComment',
        Params: {
          MarketSurveyId: shopping.MarketSurveyId,
          Comment: this.newComments[marketSurveyId],
          ParentCommentId: 0,
        },
      };

      this.PlacesService.GenericAPI(body).subscribe({
        next: (response: any) => {
          shopping.ShoppingCenter.Comments.push({
            Comment: this.newComments[marketSurveyId],
            CommentDate: new Date().toISOString(),
          });
        },
      });
    }
  }

  addReply(marketSurveyId: number, parentCommentId: number): void {
    if (this.newReplies[parentCommentId]) {
      const body = {
        Name: 'CreateComment',
        Params: {
          MarketSurveyId: marketSurveyId,
          Comment: this.newReplies[parentCommentId],
          ParentCommentId: parentCommentId,
        },
      };
      console.log(body),
        this.PlacesService.GenericAPI(body).subscribe({
          next: (response: any) => {
            const newReply: Comment = {
              id: response.id,
              text: this.newReplies[parentCommentId],
              user: 'Current User',
              parentId: parentCommentId,
              replies: [],
              MarketSurveyId: marketSurveyId,
            };
            this.newReplies[parentCommentId] = '';
            this.replyingTo[marketSurveyId] = null;

            this.getMarketSurveyShoppingCenter();
          },
          error: (error: any) => {
            console.error('Error adding reply:', error);
          },
        });
    }
  }

  openAddContactModal(content: any): void {
    this.newContact = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    };
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-add-contact',
      size: 'lg',
      centered: true,
      scrollable: true,
    });
  }

  @ViewChild('contactsModal', { static: true }) contactsModalTemplate: any;
  addContact(form: NgForm): void {
    this.spinner.show();
    const body: any = {
      Name: 'AddContactToOrganization',
      Params: {
        FirstName: this.newContact.firstName,
        LastName: this.newContact.lastName,
        OrganizationId: this.OrgId,
        email: this.newContact.email,
        password: this.newContact.password,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        this.spinner.hide();
        console.log('Contact added successfully:', data);
        this.newContact = {
          firstName: '',
          lastName: '',
          email: '',
          password: '',
        };
        form.resetForm();
        this.modalService.dismissAll();
        this.openContactsModal(this.contactsModalTemplate);
      },
      error: (error: any) => {
        console.error('Error adding contact:', error);
        this.spinner.hide();
      },
    });
  }

  openContactsModal(content: any): void {
    this.spinner.show();
    const body: any = {
      Name: 'GetOrganizationContacts',
      Params: {
        organizationId: this.OrgId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data: any) => {
        if (data && data.json) {
          this.OrganizationContacts = data.json;
        } else {
          this.OrganizationContacts = [];
        }
        this.spinner.hide();
        this.modalService.open(content, {
          size: 'lg',
          centered: true,
        });
      },
      error: (error: any) => {
        console.error('Error fetching Organization Contacts:', error);
        this.spinner.hide();
      },
    });
  }

  toggleReply(shopping: any, commentId: number): void {
    this.replyingTo[shopping.Id] =
      this.replyingTo[shopping.Id] === commentId ? null : commentId;
    console.log(commentId);
  }
}
