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

@Component({
  selector: 'app-market-map-view',
  templateUrl: './market-map-view.component.html',
  styleUrls: ['./market-map-view.component.css']
})
export class MarketMapViewComponent implements OnInit {
  General: any = {};
  BuyBoxId!: any;
  OrgId!: any;
  buyboxCategories: BuyboxCategory[] = [];
  shoppingCenters: Center[] = [];
  buyboxPlaces: BbPlace[] = [];

  Polygons: Polygon[] = [];
  map: any;
  savedMapView: any;
  isMobileView: boolean;
  cardsSideList: any[] = [];
  mapInitialized: boolean = false;

  @Output() visibleCentersChanged = new EventEmitter<any[]>();

  constructor(
    public activatedRoute: ActivatedRoute,
    private stateService: StateService,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private markerService: MapsService,
    private ngZone: NgZone,
  ) { 
    this.savedMapView = localStorage.getItem('mapView');
    this.isMobileView = window.innerWidth <= 768;
    this.markerService.clearMarkers();
  }

  ngOnInit() {
    this.General = new General();
    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;
      this.OrgId = params.orgId;
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
      // Import Google Maps library
      const { Map } = await google.maps.importLibrary('maps');
      // Use default coordinates if no shopping centers or saved view is available
      let mapOptions: any = {
        center: { lat: 38.9072, lng: -77.0369 }, // Default to DC
        zoom: 8,
        mapId: '1234567890'
      };
      
      // Try to use saved map view if available
      if (this.savedMapView) {
        try {
          const savedView = JSON.parse(this.savedMapView);
          if (savedView && 
              typeof savedView.lat === 'number' && !isNaN(savedView.lat) &&
              typeof savedView.lng === 'number' && !isNaN(savedView.lng) &&
              typeof savedView.zoom === 'number' && !isNaN(savedView.zoom)) {
            mapOptions.center = { lat: savedView.lat, lng: savedView.lng };
            mapOptions.zoom = savedView.zoom;
          }
        } catch (e) {
          console.error('Error parsing saved map view:', e);
        }
      } 
      // Otherwise, try to use the first shopping center
      else if (this.shoppingCenters && this.shoppingCenters.length > 0) {
        const firstCenter = this.shoppingCenters[0];
        const lat = firstCenter.Latitude;
        const lng = firstCenter.Longitude;
        if (!isNaN(lat) && !isNaN(lng)) {
          mapOptions.center = { lat, lng };
        }
      }
      
      // Create the map
      this.map = new Map(mapElement, mapOptions);
      
      // Add listeners after map is created
      this.map.addListener('dragend', () => this.onMapDragEnd(this.map));
      this.map.addListener('zoom_changed', () => this.onMapDragEnd(this.map));
      this.map.addListener('bounds_changed', () => this.onMapDragEnd(this.map));
      
      // Now add markers and polygons
      this.addMarkersToMap();
      
    } catch (error) {
      console.error('Error creating map:', error);
      this.spinner.hide();
    }
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

  

  private updateCardsSideList(map: any): void {
    if (!map || !map.getBounds) return;
    
    const bounds = map.getBounds();
    if (!bounds) return;
    
    try {
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
    } catch (error) {
      console.error('Error updating cards side list:', error);
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
}