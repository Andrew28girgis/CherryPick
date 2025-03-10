import { ChangeDetectorRef, Component, NgZone, TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MapsService } from 'src/app/services/maps.service';
import { BuyboxCategory } from 'src/models/buyboxCategory';
import { Center } from '../../../../../models/shoppingCenters';
import { StateService } from '../../../../services/state.service';
import { BbPlace } from 'src/models/buyboxPlaces';
import { Polygon } from 'src/models/polygons';
import { General } from 'src/models/domain';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

declare const google: any;

@Component({
  selector: 'app-side-list-view',
  templateUrl: './side-list-view.component.html',
  styleUrls: ['./side-list-view.component.css'],
})
export class SideListViewComponent {
  General: General = new General();
  cardsSideList: any[] = [];
  map: any;
  BuyBoxId!: any;
  mapViewOnePlacex: boolean = false;
  buyboxCategories: BuyboxCategory[] = [];
  shoppingCenters: Center[] = [];
  shoppingCenter: any;
  buyboxPlaces: BbPlace[] = [];
  savedMapView: any;
  Polygons: Polygon[] = [];
  placesRepresentative: boolean | undefined;
  selectedId: number | null = null;
  selectedIdCard: number | null = null;
  shoppingCenterIdToDelete: number | null = null;
  DeletedSC: any;
  sanitizedUrl!: any;
  shareLink: any;
  StreetViewOnePlace!: boolean;

  constructor(
    private markerService: MapsService,
    public activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private stateService: StateService,
    private spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {    
    this.General = new General();
    this.savedMapView = localStorage.getItem('mapView');
    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;
      localStorage.setItem('BuyBoxId', this.BuyBoxId);
    });

    this.BuyBoxPlacesCategories(this.BuyBoxId);
  }

  getShoppingCenters(buyboxId: number): void {
    if (this.stateService.getShoppingCenters().length > 0) {
      this.shoppingCenters = this.stateService.getShoppingCenters();
      this.getBuyBoxPlaces(this.BuyBoxId);
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
        this.shoppingCenters = this.shoppingCenters?.sort((a, b) =>
          a.CenterCity.localeCompare(b.CenterCity)
        );
        this.shoppingCenters = this.shoppingCenters?.filter(
          (element: any) => element.Deleted == false
        );

        this.stateService.setShoppingCenters(this.shoppingCenters);
        this.spinner.hide();
        this.getBuyBoxPlaces(this.BuyBoxId);
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

  GetPolygons(): void {
    const body: any = {
      Name: 'PolygonStats',
      Params: {
        buyboxid: this.BuyBoxId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.Polygons = data.json;
        this.markerService.drawMultiplePolygons(this.map, this.Polygons);
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  getPolygons() {
    const body: any = {
      Name: 'GetBuyBoxSCsIntersectPolys',
      Params: {
        BuyBoxId: this.BuyBoxId,
        PolygonSourceId: 0,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe((data) => {
      this.Polygons = data.json;
      this.markerService.drawMultiplePolygons(this.map, this.Polygons);
    });
  }

  onMouseHighlight(place: any) {
    this.markerService.onMouseEnter(this.map, place);
  }

  onMouseLeaveHighlight(place: any) {
    this.markerService.onMouseLeave(this.map, place);
  }

  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true;
    if (!lat || !lng) {
      console.error('Latitude and longitude are required to display the map.');
      return;
    }
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
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: 'Location Marker',
    });
  }
  
  async getAllMarker() {
    try {
      this.spinner.show();
      const { Map } = await google.maps.importLibrary('maps');
      if (this.savedMapView) {
        const { lat, lng, zoom } = JSON.parse(this.savedMapView);
        this.map = new Map(document.getElementById('map') as HTMLElement, {
          center: {
            lat: lat,
            lng: lng,
          },
          zoom: zoom,
          mapId: '1234567890',
        });
        this.map.addListener('dragend', () => this.onMapDragEnd(this.map));
        this.map.addListener('zoom_changed', () => this.onMapDragEnd(this.map));
        this.map.addListener('bounds_changed', () =>
          this.onMapDragEnd(this.map)
        );
      } else {
        this.map = new Map(document.getElementById('map') as HTMLElement, {
          center: {
            lat: this.shoppingCenters[0].Latitude,
            lng: this.shoppingCenters[0].Longitude,
          },
          zoom: 8,
          mapId: '1234567890',
        });
        this.map.addListener('dragend', () => this.onMapDragEnd(this.map));
        this.map.addListener('zoom_changed', () => this.onMapDragEnd(this.map));
        this.map.addListener('bounds_changed', () =>
          this.onMapDragEnd(this.map)
        );
      }

      if (this.shoppingCenters && this.shoppingCenters.length > 0) {
        this.createMarkers(this.shoppingCenters, 'Shopping Center');
      }

      this.GetPolygons();
      this.createCustomMarkers(this.buyboxCategories);
    } finally {
      this.spinner.hide();
    }
  }

  createCustomMarkers(markerDataArray: any[]) {
    markerDataArray.forEach((categoryData) => {
      this.markerService.createCustomMarker(this.map, categoryData);
    });
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
        center.Latitude = center.Latitude;
        center.Longitude = center.Longitude;
      });
    }
  }

  createMarkers(markerDataArray: any[], type: string) {
    markerDataArray.forEach((markerData) => {
      this.markerService.createMarker(this.map, markerData, type);
      // this.markerService.fetchAndDrawPolygon(th)
    });
  }

  private updateCardsSideList(map: any): void {
    const bounds = map.getBounds();
    const visibleMarkers = this.markerService.getVisibleProspectMarkers(bounds);
    const visibleCoords = new Set(
      visibleMarkers.map((marker) => `${marker.lat},${marker.lng}`)
    );
    const allProperties = [...(this.shoppingCenters || [])];
    this.ngZone.run(() => {
      this.cardsSideList = allProperties.filter(
        (property) =>
          visibleCoords.has(`${property.Latitude},${property.Longitude}`) ||
          this.isWithinBounds(property, bounds)
      );
    });
  }

  private isWithinBounds(property: any, bounds: any): boolean {
    const lat = parseFloat(property.Latitude);
    const lng = parseFloat(property.Longitude);
    if (isNaN(lat) || isNaN(lng)) {
      console.warn('Invalid Latitude or Longitude for property:', property);
      return false;
    }
    return bounds?.contains({ lat, lng });
  }

  getShoppingCenterUnitSize(shoppingCenter: any): any {
    const formatNumberWithCommas = (number: number) => {
      return number.toLocaleString(); // Format the number with commas
    };
    const formatLeasePrice = (price: any) => {
      if (price === 0 || price === 'On Request') return 'On Request';
      const priceNumber = parseFloat(price);
      return !isNaN(priceNumber) ? Math.floor(priceNumber) : price; // Remove decimal points and return the whole number
    };

    const appendInfoIcon = (calculatedPrice: string, originalPrice: any) => {
      if (calculatedPrice === 'On Request') {
        return calculatedPrice; // No icon for "On Request"
      }
      const formattedOriginalPrice = `$${parseFloat(
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
                  Math.floor((parseFloat(leasePrice) * singleSize) / 12)
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

    // Ensure only one price is shown if one is "On Request"
    const formattedMinPrice =
      minPrice === 'On Request'
        ? 'On Request'
        : appendInfoIcon(
            `$${formatNumberWithCommas(
              Math.floor((parseFloat(minPrice) * minSize) / 12)
            )}/month`,
            minPrice
          );

    const formattedMaxPrice =
      maxPrice === 'On Request'
        ? 'On Request'
        : appendInfoIcon(
            `$${formatNumberWithCommas(
              Math.floor((parseFloat(maxPrice) * maxSize) / 12)
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
      // If both are the same price, just show one
      leasePriceRange = formattedMinPrice;
    } else {
      leasePriceRange = `${formattedMinPrice} - ${formattedMaxPrice}`;
    }

    return `Unit Size: ${sizeRange}<br> <b>Lease price</b>: ${leasePriceRange}`;
  }

  getNeareastCategoryName(categoryId: number) {
    let categories = this.buyboxCategories.filter((x) => x.id == categoryId);
    return categories[0]?.name;
  }

  isLast(currentItem: any, array: any[]): boolean {
    return array.indexOf(currentItem) === array.length - 1;
  }

  openMapViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.viewOnMap(modalObject.Latitude, modalObject.Longitude);
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

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
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
        this.initializeStreetView(
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

  initializeStreetView(
    elementId: string,
    lat: number,
    lng: number,
    heading: number = 165,
    pitch: number = 0
  ): any {
    const streetViewElement = document.getElementById(elementId);
    if (!streetViewElement) {
      console.error(`Element with id '${elementId}' not found.`);
      return null;
    }

    const panorama = new google.maps.StreetViewPanorama(
      streetViewElement as HTMLElement,
      {
        position: { lat, lng },
        pov: { heading, pitch },
        zoom: 1,
      }
    );

    this.addMarkerToStreetView(panorama, lat, lng);
    return panorama;
  }

  addMarkerToStreetView(panorama: any, lat: number, lng: number): void {
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

  sanitizeUrl(url: string): SafeResourceUrl {
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
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

  deleteShCenter() {
    this.spinner.show();

    const body: any = {
      Name: 'DeleteShoppingCenterFromBuyBox',
      MainEntity: null,
      Params: {
        BuyBoxId: this.BuyBoxId,
        ShoppingCenterId: this.shoppingCenterIdToDelete,
      },
      Json: null,
    };
    this.PlacesService.GenericAPI(body).subscribe((data) => {
      this.modalService.dismissAll();
      this.stateService.setShoppingCenters(data.json.shoppingCenters); 
      this.stateService.setBuyboxCategories(data.json.buyboxCategories);
      this.ngZone.run(() => {
        this.cardsSideList = this.cardsSideList.filter(place => place.Id !== this.shoppingCenterIdToDelete);
      });
      this.spinner.hide();
    });
  }

  RestoreShoppingCenter(MarketSurveyId: any, Deleted: boolean,placeId : number) {
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
    this.PlacesService.GenericAPI(body).subscribe((data) => {
      this.stateService.setShoppingCenters(data.json.shoppingCenters); 
      this.stateService.setBuyboxCategories(data.json.buyboxCategories);
      this.toggleDeletedState(placeId, false);
      this.toggleShortcuts(placeId, 'close');
      this.spinner.hide();
    });
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

  toggleDeletedState(placeId: number, deleted: boolean): void {
    const updatedPlace = this.cardsSideList.find(place => place.Id === placeId);
    if (updatedPlace) {
      updatedPlace.Deleted = deleted;
    }
  }

  trackById(index: number, place: any): number {
    return place.Id;
  } 
}
