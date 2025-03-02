import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Renderer2,
  ChangeDetectorRef,
  Output,
  EventEmitter,
  NgZone,
  TemplateRef,
  OnChanges,
  SimpleChanges,
  Input,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import { General } from 'src/models/domain';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MapsService } from 'src/app/services/maps.service';
import { BuyboxCategory } from 'src/models/buyboxCategory';
import { Center, Place, Reaction } from '../../../../../models/shoppingCenters';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { StateService } from '../../../../services/state.service';
import { BbPlace } from 'src/models/buyboxPlaces';
import { ShoppingCenter } from 'src/models/buyboxShoppingCenter';
import { ViewManagerService } from 'src/app/services/view-manager.service';
import { forkJoin, tap, catchError, of } from 'rxjs';

declare const google: any;

@Component({
  selector: 'app-side-list-view',
  templateUrl: './side-list-view.component.html',
  styleUrls: ['./side-list-view.component.css'],
})
export class SideListViewComponent implements OnInit, OnChanges {
  @Output() highlightMarker = new EventEmitter<any>();
  @Output() unhighlightMarker = new EventEmitter<any>();

  General: General = new General();
  BuyBoxId!: any;
  OrgId!: any;
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
    {
      text: 'Social View',
      icon: '../../../assets/Images/Icons/globe-solid.svg',
      status: 5,
    },
  ];

  selectedOption: number = 2;
  buyboxCategories: BuyboxCategory[] = [];
  cardsSideList: any[] = [];
  selectedIdCard: number | null = null;
  placesRepresentative: boolean | undefined;
  showbackIds: number[] = [];
  isOpen = false;
  currentView: any;
  mapViewOnePlacex = false;
  sanitizedUrl!: any;
  StreetViewOnePlace!: boolean;
  shoppingCenters: Center[] = [];
  buyboxPlaces: BbPlace[] = [];
  savedMapView: any;
  standAlone: Place[] = [];
  map: any;
  markers: any[] = [];
  infoWindows: any[] = [];
  showbackIdsJoin: any;
  shoppingCenterIdToDelete: number | null = null;
  BuyBoxPlacesAndShoppingCenter: ShoppingCenter[] = [];
  selectedState = '0';
  selectedCity = '';
  BuyBoxName = '';

  ShareOrg: any[] = [];
  activeComponent: string = 'Properties';
  selectedTab: string = 'Properties';
  shoppingCenter: any;
  @Input() isVisible = false;
  dataLoaded: boolean =false;

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
    private ngZone: NgZone,
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

    this.currentView = localStorage.getItem('currentViewDashBord') || '5';
    const allProperties = [
      ...(this.shoppingCenters || []),
      ...(this.standAlone || []),
    ];
    this.cardsSideList = allProperties;

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
    this.activeComponent = 'Properties';
    this.selectedTab = 'Properties';
    this.initializeData();
  }

  async initializeData() {
    try {
      this.spinner.show();

      forkJoin({
        categories: this.viewManagerService.getBuyBoxCategories(this.BuyBoxId),
        centers: this.viewManagerService.getShoppingCenters(this.BuyBoxId),
        places: this.viewManagerService.getBuyBoxPlaces(this.BuyBoxId),
        org: this.viewManagerService.getOrganizationById(this.OrgId),
      })
        .pipe(
          tap((result) => {
            this.buyboxCategories = result.categories;
            this.shoppingCenters = result.centers;
            this.buyboxPlaces = result.places;
            this.ShareOrg = result.org;

            this.buyboxCategories.forEach((category) => {
              category.isChecked = false;
              category.places = this.buyboxPlaces?.filter((place) =>
                place.RetailRelationCategories?.some(
                  (x) => x.Id === category.id
                )
              );
            });
          }),
          catchError((error) => {
            console.error('Error initializing data:', error);
            return of(null);
          })
        )
        .subscribe(
          () => {
            this.dataLoaded = true;
            this.getAllMarker();
            this.cdr.detectChanges();
          },
          null,
          () => this.spinner.hide()
        );
    } catch (error) {
      console.error('Error in initializeData:', error);
      this.spinner.hide();
    }
  }


  getNeareastCategoryName(categoryId: number): string {
    const categories = this.buyboxCategories.filter((x) => x.id == categoryId);
    return categories[0]?.name || '';
  }

  getShoppingCenterUnitSize(shoppingCenter: any): string {
    const formatNumberWithCommas = (number: number) => {
      return number.toLocaleString();
    };

    const formatLeasePrice = (price: any) => {
      if (price === 0 || price === 'On Request') return 'On Request';
      const priceNumber = Number.parseFloat(price);
      return !isNaN(priceNumber) ? Math.floor(priceNumber) : price;
    };

    const appendInfoIcon = (calculatedPrice: string, originalPrice: any) => {
      if (calculatedPrice === 'On Request') {
        return calculatedPrice;
      }
      const formattedOriginalPrice = `$${Number.parseFloat(
        originalPrice
      ).toLocaleString()}/sq ft./year`;

      return `
        <div style="display:inline-block; text-align:left; line-height:1.2;">
          <div style="font-size:14px; font-weight:600; color:#333;">${formattedOriginalPrice}</div>
          <div style="font-size:12px; color:#666; margin-top:4px;">${calculatedPrice}</div>
        </div>
      `;
    };

    const places = shoppingCenter?.ShoppingCenter?.Places || [];
    const buildingSizes = places
      .map((place: any) => place.BuildingSizeSf)
      .filter(
        (size: any) => size !== undefined && size !== null && !isNaN(size)
      );

    if (buildingSizes.length === 0) {
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
      return '';
    }

    const minSize = Math.min(...buildingSizes);
    const maxSize = Math.max(...buildingSizes);

    const minPrice =
      places.find((place: any) => place.BuildingSizeSf === minSize)
        ?.ForLeasePrice || 'On Request';
    const maxPrice =
      places.find((place: any) => place.BuildingSizeSf === maxSize)
        ?.ForLeasePrice || 'On Request';

    const sizeRange =
      minSize === maxSize
        ? `${formatNumberWithCommas(minSize)} sq ft.`
        : `${formatNumberWithCommas(minSize)} sq ft. - ${formatNumberWithCommas(
            maxSize
          )} sq ft.`;

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
      leasePriceRange = formattedMinPrice;
    } else {
      leasePriceRange = `${formattedMinPrice} - ${formattedMaxPrice}`;
    }

    return `Unit Size: ${sizeRange}<br> <b>Lease price</b>: ${leasePriceRange}`;
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
    return array.indexOf(currentItem) === array.length - 1;
  }

  selectOption(option: any): void {
    this.selectedOption = option.status;
    this.currentView = option.status;
    this.isOpen = false;
    localStorage.setItem('currentViewDashBord', this.currentView);
  }

  onMouseHighlight(place: any): void {
    this.highlightMarker.emit(place);
  }

  onMouseLeaveHighlight(place: any): void {
    this.unhighlightMarker.emit(place);
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
  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  deleteShopping(id: number): void {
    if (this.showbackIds.includes(id)) {
      this.CancelOneDelete(id);
    } else {
      this.showbackIds.push(id);
    }
  }

  CancelOneDelete(id: number): void {
    this.showbackIds = this.showbackIds.filter((item) => item !== id);
  }

  CancelDelete(): void {
    this.showbackIds = [];
  }

  ArrOfDelete(modalTemplate: TemplateRef<any>) {
    this.showbackIdsJoin = this.showbackIds.join(',');
    this.openDeleteShoppingCenterModal(modalTemplate, this.showbackIdsJoin);
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
  private onMapDragEnd(map: any) {
    this.saveMapView(map);
    this.updateShoppingCenterCoordinates();
    this.updateCardsSideList(map);
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && this.isVisible) {
      this.loadShoppingCenters();
    }
  }

  private loadShoppingCenters(): void {
    // Check if shopping centers are already loaded in the state
    if (this.stateService.getShoppingCenters().length > 0) {
      this.shoppingCenters = this.stateService.getShoppingCenters();
      this.updateCards();
      return;
    }

    // If not loaded, fetch from API
    this.spinner.show();
    const body: any = {
      Name: 'GetMarketSurveyShoppingCenters',
      Params: {
        BuyBoxId: this.BuyBoxId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.shoppingCenters = data.json;
        this.stateService.setShoppingCenters(data.json);
        this.updateCards();
        this.spinner.hide();
      },
      error: (error) => {
        console.error('Error fetching shopping centers:', error);
        this.spinner.hide();
      },
    });
  }

  private updateCards(): void {
    // Update the cardsSideList with the loaded shopping centers
    this.cardsSideList = this.shoppingCenters;
    // Additional logic for filtering based on map bounds can be added here if needed
  }
}
