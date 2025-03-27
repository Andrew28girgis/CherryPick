import { Component, EventEmitter, NgZone, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
declare const google: any;
import { NgxSpinnerService } from 'ngx-spinner';
import { BuyboxCategory } from 'src/app/shared/models/buyboxCategory';
import { BbPlace } from 'src/app/shared/models/buyboxPlaces';
import { General } from 'src/app/shared/models/domain';
import { Center } from 'src/app/shared/models/shoppingCenters';
import { StateService } from 'src/app/core/services/state.service';
import { PlacesService } from 'src/app/core/services/places.service';
import { Polygon } from 'src/app/shared/models/polygons';
import { MapsService } from 'src/app/core/services/maps.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-market-side-view',
  templateUrl: './market-side-view.component.html',
  styleUrls: ['./market-side-view.component.css']
})
export class MarketSideViewComponent implements OnInit {
 General: any = {};
  BuyBoxId!: any;
  buyboxCategories: BuyboxCategory[] = [];
  shoppingCenters: Center[] = [];
  buyboxPlaces: BbPlace[] = [];
  shoppingCenter: any;

  Polygons: Polygon[] = [];
  map: any;
  savedMapView: any;
  isMobileView: boolean;
  cardsSideList: Center[] = [];
  mapInitialized: boolean = false;
  mapViewOnePlacex: boolean = false;
  sanitizedUrl!: any;
  StreetViewOnePlace!: boolean;
  placesRepresentative: boolean | undefined;

  @Output() visibleCentersChanged = new EventEmitter<any[]>();
  visibleMarkersCount: number = 0;
  markers!: any[];
  private mapMovementDebounce: number | null = null;
  private lastUpdateTime = 0;
  private readonly UPDATE_INTERVAL = 100; // ms

  constructor(
    public activatedRoute: ActivatedRoute,
    private stateService: StateService,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private markerService: MapsService,
    private ngZone: NgZone,
    private modalService: NgbModal,
    private sanitizer: DomSanitizer,

  ) { 
    this.savedMapView = localStorage.getItem('mapView');
    this.isMobileView = window.innerWidth <= 768;
    this.markerService.clearMarkers();
  }

  ngOnInit() {
    this.General = new General();
    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;
      this.spinner.show();
      this.BuyBoxPlacesCategories(this.BuyBoxId);
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
      error: (err) => {
        console.error('Error loading categories:', err);
        this.spinner.hide();
      }
    });
  }

  getShoppingCenters(buyboxId: number): void {
    if (this.stateService.getShoppingCenters().length > 0) {
      this.shoppingCenters = this.stateService.getShoppingCenters();
      this.getBuyBoxPlaces(this.BuyBoxId);
      return;
    }
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
        this.cardsSideList = [...this.shoppingCenters];
        this.stateService.setShoppingCenters(this.shoppingCenters);
        this.getBuyBoxPlaces(this.BuyBoxId);
      },
      error: (err) => {
        console.error('Error loading shopping centers:', err);
        this.spinner.hide();
      }
    });
  }

  getBuyBoxPlaces(buyboxId: number): void {
    if (this.stateService.getBuyboxPlaces()?.length > 0) {
      this.buyboxPlaces = this.stateService.getBuyboxPlaces();
      this.processCategories();
      this.initializeMap();
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
        this.processCategories();
        this.initializeMap();
      },
      error: (err) => {
        console.error('Error loading buybox places:', err);
        this.spinner.hide();
      }
    });
  }
  // Process categories with buybox places
  processCategories(): void {
    this.buyboxCategories.forEach((category) => {
      category.isChecked = false;
      category.places = this.buyboxPlaces?.filter((place) =>
        place.RetailRelationCategories?.some((x) => x.Id === category.id)
      );
    });
  }
  // New method to wait for Google Maps to be ready
  async checkGoogleMapsAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.google && window.google.maps) {
        resolve(true);
        return;
      }
      // Poll for Google Maps to become available
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        console.error('Google Maps API not loaded after timeout');
        resolve(false);
      }, 10000);
    });
  }
  // Initialize map after data is loaded
  async initializeMap() {
    if (this.mapInitialized) return;
    
    try {
      // Ensure Google Maps is available
      const mapsAvailable = await this.checkGoogleMapsAvailable();
      if (!mapsAvailable) {
        this.spinner.hide();
        console.error('Google Maps API not available');
        return;
      }
      // Now initialize the map with data
      await this.createMap();
      this.mapInitialized = true;
    } catch (error) {
      console.error('Error initializing map:', error);
      this.spinner.hide();
    }
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
      error: (err) => {
        console.error('Error loading polygons:', err);
      }
    });
  }
  // Separate map creation from marker creation
  async createMap() {
    try {
      const mapElement = document.getElementById('map');
      if (!mapElement) {
        console.error('Map element not found');
        this.spinner.hide();
        return;
      }
      
      const { Map } = await google.maps.importLibrary('maps');
      const mapOptions: any = {
        center: { lat: 38.9072, lng: -77.0369 }, // Default to DC
        zoom: 8,
        mapId: '1234567890'
      };
      // Create the map
      this.map = new Map(mapElement, mapOptions);
      // Add new listeners for updating shopping centers
      this.map.addListener('drag', () => {
        this.handleMapMovement();
      });
      this.map.addListener('idle', () => {
        this.handleMapMovement();
      });
      this.map.addListener('zoom_changed', () => {
        this.handleMapMovement();
      });
      this.updateCardsSideList(this.map);
      this.addMarkersToMap();
    } catch (error) {
      console.error('Error creating map:', error);
      this.spinner.hide();
    }
  }
  private handleMapMovement() {
    const now = Date.now();
    if (now - this.lastUpdateTime < this.UPDATE_INTERVAL) {
      return;
    }
    if (this.mapMovementDebounce) {
      cancelAnimationFrame(this.mapMovementDebounce);
    }
    this.mapMovementDebounce = requestAnimationFrame(() => {
      this.lastUpdateTime = now;
      this.updateCardsSideList(this.map);
    });
  }
  // Add markers to the map after it's created
  addMarkersToMap() {
    try {
      // Create markers for shopping centers
      if (this.shoppingCenters && this.shoppingCenters.length > 0) {
        this.createMarkers(this.shoppingCenters, 'Shopping Center');
      }
      // Get polygons and create custom markers
      this.GetPolygons();
      if (this.buyboxCategories && this.buyboxCategories.length > 0) {
        this.createCustomMarkers(this.buyboxCategories);
      }
      // Update the cards side list
      if (this.map && this.map.getBounds()) {
        this.updateCardsSideList(this.map);
      }
    } finally {
      this.spinner.hide();
    }
  }

  createMarkers(markerDataArray: any[], type: string) {
    if (!this.map || !markerDataArray) return;   
    markerDataArray.forEach((markerData) => {
      if (markerData) {
        this.markerService.createMarker(this.map, markerData, type);
      }
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
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.Polygons = data.json;
        this.markerService.drawMultiplePolygons(this.map, this.Polygons);
      },
      error: (err) => {
        console.error('Error loading polygons:', err);
      }
    });
  }

  createCustomMarkers(markerDataArray: any[]) {
    if (!this.map || !markerDataArray) return;
    markerDataArray.forEach((categoryData) => {
      if (categoryData) {
        this.markerService.createCustomMarker(this.map, categoryData);
      }
    });
  }

  onCheckboxChange(category: BuyboxCategory): void {
    if (this.map) {
      this.markerService.toggleMarkers(this.map, category);
    }
  }

  private onMapDragEnd(map: any) {
    if (!map) return;
    
    this.saveMapView(map);
    this.updateShoppingCenterCoordinates();
    this.updateCardsSideList(map);
  }

  private saveMapView(map: any): void {
    if (!map || !map.getCenter) return;
    
    try {
      const center = map.getCenter();
      const zoom = map.getZoom();
      
      if (center && typeof center.lat === 'function' && typeof center.lng === 'function') {
        localStorage.setItem(
          'mapView',
          JSON.stringify({
            lat: center.lat(),
            lng: center.lng(),
            zoom: zoom || 8,
          })
        );
      }
    } catch (error) {
      console.error('Error saving map view:', error);
    }
  }
  
  private updateShoppingCenterCoordinates(): void {
    if (this.shoppingCenters) {
      this.shoppingCenters?.forEach((center) => {
        center.Latitude = center.Latitude;
        center.Longitude = center.Longitude;
      });
    }
  }

  

  private updateCardsSideList(map: google.maps.Map): void {
    if (!map || !map.getBounds) return;
    
    const bounds = map.getBounds();
    if (!bounds) return;
    
    // Use a simple array for quick coordinate comparison
    const visibleCoords = new Set<string>();
    
    // Get all markers that are currently visible
    const markers = this.markerService.getAllMarkers();
    markers.forEach((marker: google.maps.Marker) => {
      const position = marker.getPosition();
      if (position && bounds.contains(position)) {
        visibleCoords.add(`${position.lat()},${position.lng()}`);
      }
    });
    
    // Filter shopping centers based on visibility
    this.ngZone.run(() => {
      this.cardsSideList = this.shoppingCenters.filter(center => {
        try {
          const centerLatLng = new google.maps.LatLng(
            parseFloat(center.Latitude.toString()),
            parseFloat(center.Longitude.toString())
          );
          return visibleCoords.has(`${center.Latitude},${center.Longitude}`) || 
                 bounds.contains(centerLatLng);
        } catch (e) {
          console.error('Error checking center visibility:', e);
          return false;
        }
      });

    });
  }
  getAllMarkers(): google.maps.Marker[] {
    return this.markers; // Assuming you store markers in this.markers
  }
  // Add this helper method to your component
private isCenterVisible(center: any, bounds: any): boolean {
  try {
    const latLng = new google.maps.LatLng(center.Latitude, center.Longitude);
    return bounds.contains(latLng);
  } catch (e) {
    return false;
  }
}

  private isWithinBounds(property: any, bounds: any): boolean {
    if (!property || !bounds || !bounds.contains) return false;
    
    try {
      const lat = parseFloat(property.Latitude);
      const lng = parseFloat(property.Longitude);
      if (isNaN(lat) || isNaN(lng)) {
        return false;
      }
      return bounds.contains({ lat, lng });
    } catch (error) {
      console.error('Error checking if property is within bounds:', error);
      return false;
    }
  }

  onMouseEnter(place: any): void {
    if (!place || !this.map) return;
    
    try {
      const { Latitude, Longitude } = place;
      const lat = parseFloat(Latitude);
      const lng = parseFloat(Longitude);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        this.map.setCenter({ lat, lng });
        this.map.setZoom(17);
      }
    } catch (error) {
      console.error('Error in onMouseEnter:', error);
    }
  }

  onMouseHighlight(place: any) {
    if (this.map && place) {
      this.markerService.onMouseEnter(this.map, place);
    }
  }

  onMouseLeaveHighlight(place: any) {
    if (this.map && place) {
      this.markerService.onMouseLeave(this.map, place);
    }
  }
  
  streetMap(lat: number, lng: number, heading: number, pitch: number) {
    if (!google || !google.maps) return;
    
    try {
      const streetViewElement = document.getElementById('street-view');
      if (streetViewElement) {
        const panorama = new google.maps.StreetViewPanorama(
          streetViewElement,
          {
            position: { lat, lng },
            pov: { heading: heading || 0, pitch: pitch || 0 },
            zoom: 1,
          }
        );
        this.addMarkerToStreetView(panorama, lat, lng);
      }
    } catch (error) {
      console.error('Error creating street view:', error);
    }
  }

  addMarkerToStreetView(panorama: any, lat: number, lng: number) {
    if (!panorama || !google || !google.maps || !google.maps.Marker) return;
    
    try {
      const svgPath = 'M 0,0 m -12,0 a 12,12 0 1,0 24,0 a 12,12 0 1,0 -24,0';
      
      new google.maps.Marker({
        position: { lat, lng },
        map: panorama,
        icon: {
          path: svgPath,
          scale: 1,
          fillColor: 'black',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 1,
        },
      });
    } catch (error) {
      console.error('Error adding marker to street view:', error);
    }
  }
  /////////////////////////

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
      return;
    }
    const { Map } = (await google.maps.importLibrary('maps')) as any;
    const mapDiv = document.getElementById('mappopup') as HTMLElement;
    if (!mapDiv) {
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
    let lat = +this.General.modalObject.StreetLatitude;
    let lng = +this.General.modalObject.StreetLongitude;
    let heading = this.General.modalObject.Heading || 165;
    let pitch = this.General.modalObject.Pitch || 0;

    setTimeout(() => {
      const streetViewElement = document.getElementById('street-view');
      if (streetViewElement) {
        this.streetMap(lat, lng, heading, pitch);
      } else {
      }
    });
  }

  getNeareastCategoryName(categoryId: number) {
    let categories = this.buyboxCategories.filter((x) => x.id == categoryId);
    return categories[0]?.name;
  }
  isLast(currentItem: any, array: any[]): boolean {
    return array.indexOf(currentItem) === array.length - 1;
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
  onVisibleCentersChanged(event: {total: number, visible: number, markersCount: number}) {

    
    // You can update UI elements or perform actions based on these values
    // For example, show a summary of visible centers
  }
}