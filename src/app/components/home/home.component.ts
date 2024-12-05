import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  NgZone,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import { AllPlaces, AnotherPlaces, General, Property } from 'src/models/domain';
declare const google: any;
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MapsService } from 'src/app/services/maps.service';
import { BuyboxCategory } from 'src/models/buyboxCategory';
import { Center, Place } from 'src/models/shoppingCenters';
import { BbPlace } from 'src/models/buyboxPlaces';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  General!: General;
  pageTitle!: string;
  BuyBoxId!: any;
  page: number = 1;
  pageSize: number = 25;
  paginatedProperties: Property[] = [];
  filteredProperties: Property[] = [];
  dropdowmOptions: any = [
    {
      text: 'Map View',
      icon: '../../../assets/Images/Icons/map.png',
      status: 1,
    }, // Add your SVG paths here
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
  ];
  isOpen = false;
  allPlaces!: AllPlaces;
  anotherPlaces!: AnotherPlaces;
  currentView: any;
  centerPoints: any[] = [];

  map: any; // Add this property to your class

  isCompetitorChecked = false; // Track the checkbox state
  isCoTenantChecked = false;
  cardsSideList: any[] = [];
  selectedOption: any;
  savedMapView: any;
  mapViewOnePlacex: boolean = false;

  buyboxCategories: BuyboxCategory[] = [];
  shoppingCenters: Center[] = [];
  standAlone: Place[] = [];
  buyboxPlaces: BbPlace[] = [];

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private modalService: NgbModal,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private markerService: MapsService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private sanitizer: DomSanitizer
  ) {
    this.currentView = localStorage.getItem('currentView') || 2;
    this.savedMapView = localStorage.getItem('mapView');
  }

  ngOnInit(): void {
    this.spinner.show();
    this.General = new General();
    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;
      localStorage.setItem('BuyBoxId', this.BuyBoxId);
    });

    this.selectedOption = this.dropdowmOptions[2];
    this.BuyBoxPlacesCategories(this.BuyBoxId);

    this.selectedOption = this.dropdowmOptions.find(
      (option: any) => +option.status == +this.currentView
    );
  }

  BuyBoxPlacesCategories(buyboxId: number): void {
    const body: any = {
      Name: 'GetRetailRelationCategories',
      Params: {
        BuyBoxId: buyboxId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.buyboxCategories = data.json;
        this.getShoppingCenters(this.BuyBoxId);
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  getShoppingCenters(buyboxId: number): void {
    const body: any = {
      Name: 'GetMarketSurveyShoppingCenters',
      Params: {
        BuyBoxId: buyboxId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.shoppingCenters = data.json;
        console.log(`shoppingCenters`);
        console.log(this.shoppingCenters);

        this.getStandAlonePlaces(this.BuyBoxId);
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  getStandAlonePlaces(buyboxId: number): void {
    const body: any = {
      Name: 'GetMarketSurveyStandalonePlaces',
      Params: {
        BuyBoxId: buyboxId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.standAlone = data.json;
        console.log(`standAlone`);
        console.log(this.standAlone);

        this.getBuyBoxPlaces(this.BuyBoxId);
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  getBuyBoxPlaces(buyboxId: number): void {
    const body: any = {
      Name: 'BuyBoxRelatedRetails',
      Params: {
        BuyBoxId: buyboxId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.buyboxPlaces = data.json;
        this.buyboxCategories.forEach((category) => {
          category.isChecked = false;
          category.places = this.buyboxPlaces.filter((place) =>
            place.RetailRelationCategories?.some((x) => x.Id === category.id)
          );
        });
        this.getAllMarker();
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  getLogo(id: number) {
    for (const place of this.buyboxPlaces) {
      const foundBranch = place.RetailRelationCategories[0].Branches.find(
        (branch) => branch.Id === id
      );
      if (foundBranch) {
        return place.id;
      }
    }
    return undefined;
  }

  getLogoTitle(id: number) {
    for (const place of this.buyboxPlaces) {
      const foundBranch = place.RetailRelationCategories[0].Branches.find(
        (branch) => branch.Id === id
      );
      if (foundBranch) {
        return place.Name;
      }
    }
    return undefined;
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
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
            lat: this.shoppingCenters
              ? this.shoppingCenters[0].Latitude
              : this.standAlone[0].Latitude || 0,
            lng: this.shoppingCenters
              ? this.shoppingCenters[0].Longitude
              : this.standAlone[0].Longitude || 0,
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

      if (this.standAlone && this.standAlone.length > 0) {
        this.createMarkers(this.standAlone, 'Stand Alone');
      }

      this.createCustomMarkers(this.buyboxCategories);
    } finally {
      this.spinner.hide();
    }
  }

  createMarkers(markerDataArray: any[], type: string) {
    markerDataArray.forEach((markerData) => {
      this.markerService.createMarker(this.map, markerData, type);
    });
  }

  createCustomMarkers(markerDataArray: any[]) {
    markerDataArray.forEach((categoryData) => {
      this.markerService.createCustomMarker(this.map, categoryData);
    });
  }

  onCheckboxChange(category: BuyboxCategory): void {
    this.markerService.toggleMarkers(this.map, category);
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
        if(center.ShoppingCenter.Places){
          const firstPlace = center.ShoppingCenter?.Places[0];
          center.Latitude = firstPlace.Latitude;
          center.Longitude = firstPlace.Longitude;
        } 
      });
    }
  }

  private updateCardsSideList(map: any): void {
    const bounds = map.getBounds();
    const visibleMarkers = this.markerService.getVisibleProspectMarkers(bounds);

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
    const lat = property.Latitude;
    const lng = property.Longitude;
    return bounds.contains({ lat, lng });
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
    console.log(`thiiiis placeee`)
    console.log(place)
    this.markerService.onMouseEnter(this.map, place);
  }

  onMouseLeaveHighlight(place: any) {
    this.markerService.onMouseLeave(this.map, place);
  }

  getAllBuyBoxComparables(buyboxId: number) {
    this.spinner.show();
    this.PlacesService.GetAllBuyBoxComparables(buyboxId).subscribe((data) => {
      this.anotherPlaces = data;
      this.getAllMarker();
      this.spinner.hide();
    });
  }

  selectOption(option: any): void {
    this.selectedOption = option;
    this.currentView = option.status;
    this.isOpen = false;
    localStorage.setItem('currentView', this.currentView);
  }

  goToPlace(place: any) {
    console.log(`from routing`);
    console.log(place);
    
    if (place.CenterAddress) {
      this.router.navigate([
        '/landing',
        place.ShoppingCenter.Places ? place.ShoppingCenter.Places[0].Id : 0,
        place.Id ,
        this.BuyBoxId,
      ]);
    } else {
      this.router.navigate(['/landing', place.Id , 0 , this.BuyBoxId]);
    }
  }

  sanitizedUrl!: any;
  openStreetViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.General.modalObject = modalObject;
    console.log(`street`);
    console.log(this.General.modalObject);
    
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
    let lat = +this.General.modalObject.StreetLatitude;
    let lng = +this.General.modalObject.StreetLongitude;
    let heading = this.General.modalObject.Heading || 165;
    let pitch = this.General.modalObject.Pitch || 0;

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
    // Helper function to format numbers with commas
    const formatNumberWithCommas = (number: number) => {
      return number.toLocaleString(); // Format the number with commas
    };
  
    // Helper function to format lease price (add $ and /month if needed)
    const formatLeasePrice = (price: any) => {
      if (price === 0 || price === 'On Request') return 'On Request';
      const priceNumber = parseFloat(price);
      return !isNaN(priceNumber) ? Math.floor(priceNumber) : price; // Remove decimal points and return the whole number
    };
  
    // Extract the places array
    const places = shoppingCenter?.ShoppingCenter?.Places || [];
  
    // Collect building sizes if available
    const buildingSizes = places
      .map((place: any) => place.BuildingSizeSf)
      .filter((size: any) => size !== undefined && size !== null && !isNaN(size));
  
    if (buildingSizes.length === 0) {
      // Handle case for a single shopping center without valid places
      const singleSize = shoppingCenter.BuildingSizeSf;
      if (singleSize) {
        const leasePrice = formatLeasePrice(shoppingCenter.ForLeasePrice);
        return `Unit Size: ${formatNumberWithCommas(singleSize)} SF` + 
               (leasePrice && leasePrice !== 'On Request' ? `<br>Lease price: $${formatNumberWithCommas(leasePrice)}/month` : '');
      }
      return null;
    }
  
    // Calculate min and max size
    const minSize = Math.min(...buildingSizes);
    const maxSize = Math.max(...buildingSizes);
  
    // Find corresponding lease prices for min and max sizes
    const minPrice = places.find((place: any) => place.BuildingSizeSf === minSize)?.ForLeasePrice || 'On Request';
    const maxPrice = places.find((place: any) => place.BuildingSizeSf === maxSize)?.ForLeasePrice || 'On Request';
  
    // Format unit sizes and lease price
    const sizeRange = minSize === maxSize
      ? `${formatNumberWithCommas(minSize)} SF`
      : `${formatNumberWithCommas(minSize)} SF - ${formatNumberWithCommas(maxSize)} SF`;
  
    // Ensure only one price is shown if one is "On Request"
    const formattedMinPrice = minPrice === 'On Request' ? 'On Request' : formatLeasePrice(minPrice);
    const formattedMaxPrice = maxPrice === 'On Request' ? 'On Request' : formatLeasePrice(maxPrice);
  
    // Calculate the price by multiplying unit size by the lease price, divided by 12 (annual cost)
    const leasePrice = (formattedMinPrice === 'On Request' && formattedMaxPrice === 'On Request') 
      ? 'On Request' 
      : (formattedMinPrice === 'On Request' ? formattedMaxPrice : formattedMinPrice);
  
    // Calculate and return the result without decimals, formatted as "$X/month"
    const resultLeasePrice = leasePrice !== 'On Request' 
      ? `$${formatNumberWithCommas(Math.floor(parseFloat(leasePrice) * minSize / 12))}/month` 
      : 'On Request';
  
    return `Unit Size: ${sizeRange}<br>Lease price: ${resultLeasePrice}`;
  }

  getStandAloneLeasePrice(forLeasePrice: any, buildingSizeSf: any): string {
    // Ensure the values are numbers by explicitly converting them
    const leasePrice = Number(forLeasePrice);
    const size = Number(buildingSizeSf);
  
    // Check if the values are valid numbers
    if (!isNaN(leasePrice) && !isNaN(size) && leasePrice > 0 && size > 0) {
      // Calculate the lease price per month
      const calculatedPrice = Math.floor(leasePrice * size / 12);
      
      // Format the calculated price with commas
      const formattedPrice = calculatedPrice.toLocaleString();
      
      // Return the formatted result
      return `$${formattedPrice}/month`;
    } else {
      // If invalid values are provided, return 'On Request'
      return 'On Request';
    }
  }
  
  
  
  
  
  getNeareastCategoryName(categoryId: number) {
    // console.log(categoryId);
    let categories = this.buyboxCategories.filter((x) => x.id == categoryId);
    return categories[0]?.name;
  }

  formatNumberWithCommas(value: number | null): string {
    if (value !== null) {
      return value?.toLocaleString();
    } else {
      return '';
    }
  }
}
