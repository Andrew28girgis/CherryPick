import {
  ChangeDetectorRef,
  Component, 
  OnInit, 
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
import { Polygons } from 'src/models/polygons';
import { ShareOrg } from 'src/models/shareOrg';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  shoppingCenter: any;
  selectedView: string = 'shoppingCenters';
  General!: General;
  pageTitle!: string;
  BuyBoxId!: any;
  OrgId!: any;
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
  selectedOption!: number;
  selectedSS!: number;
  savedMapView: any;
  mapViewOnePlacex: boolean = false;
  buyboxCategories: BuyboxCategory[] = [];
  showShoppingCenters: boolean = true; // Ensure this reflects your initial state
  shoppingCenters: Center[] = [];
  toggleShoppingCenters() {
    this.showShoppingCenters = !this.showShoppingCenters;
  }
  showStandalone: boolean = true; // Ensure this reflects your initial state
  standAlone: Place[] = [];
  toggleStandalone() {
    this.showStandalone = !this.showStandalone;
  }

  buyboxPlaces: BbPlace[] = [];
  Polygons: Polygons[] = [];
  ShareOrg: ShareOrg[] = [];
  shareLink: any;

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
    this.markerService.clearMarkers();
  }

  ngOnInit(): void {
    this.loadShoppingCenterData();

    this.General = new General();
    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;
      this.OrgId = params.orgId;
      localStorage.setItem('BuyBoxId', this.BuyBoxId);
    });

    this.selectedSS = 1;
    this.BuyBoxPlacesCategories(this.BuyBoxId);
  }

  GetOrganizationById(orgId: number): void {
    const body: any = {
      Name: 'GetOrganizationById',
      Params: {
        organizationid: orgId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.ShareOrg = data.json;
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
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

  GetPolygons(buyboxId: number): void {
    const body: any = {
      Name: 'GetPolygons',
      Params: {
        buyboxid: buyboxId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.Polygons = data.json;
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  getShoppingCenters(buyboxId: number): void {
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
        console.log(`shoppingCenters`);
        console.log(this.shoppingCenters);
        this.spinner.hide();
        this.getStandAlonePlaces(this.BuyBoxId);
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  getStandAlonePlaces(buyboxId: number): void {
    this.spinner.show();
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
        this.spinner.hide();
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
          category.places = this.buyboxPlaces?.filter((place) =>
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
    // this.markerService.drawMultiplePolygons(this.map, this.Polygons);
  }

  createCustomMarkers(markerDataArray: any[]) {
    markerDataArray.forEach((categoryData) => {
      this.markerService.createCustomMarker(this.map, categoryData);
    });
  }

  onCheckboxChange(category: BuyboxCategory): void {
    this.markerService.toggleMarkers(this.map, category);
  }
  loadShoppingCenterData(): void {
    // Example API response structure
    this.shoppingCenter = {
      ShoppingCenter: {
        ManagerOrganization: [
          {
            Firstname: 'John',
            LastName: 'Doe',
            CellPhone: '123-456-7890',
            Email: 'john.doe@example.com',
          },
          {
            Firstname: 'Jane',
            LastName: 'Smith',
            CellPhone: '987-654-3210',
            Email: 'jane.smith@example.com',
          },
        ],
      },
    };
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
    const lat = parseFloat(property.Latitude);
    const lng = parseFloat(property.Longitude);

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
    if (place.CenterAddress) {
      this.router.navigate([
        '/landing',
        place.ShoppingCenter?.Places ? place.ShoppingCenter.Places[0].Id : 0,
        place.Id,

        this.BuyBoxId,
      ]);
    } else {
      this.router.navigate(['/landing', place.Id, 0, this.BuyBoxId]);
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
  // ngAfterViewInit(): void {
  //   // Initialize all popovers on the page
  //   const popoverTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="popover"]'));
  //   popoverTriggerList.forEach(popoverTriggerEl => {
  //     // new bootstrap.Popover(popoverTriggerEl);
  //   });
  // }

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
        // Optionally, you could show a toast or notification to the user
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

  getStandAloneLeasePrice(forLeasePrice: any, buildingSizeSf: any): string {
    // Ensure the values are numbers by explicitly converting them
    const leasePrice = Number(forLeasePrice);
    const size = Number(buildingSizeSf);

    // Check if the values are valid numbers
    if (!isNaN(leasePrice) && !isNaN(size) && leasePrice > 0 && size > 0) {
      // Calculate the lease price per month
      const calculatedPrice = Math.floor((leasePrice * size) / 12);

      // Format the calculated price with commas
      const formattedPrice = calculatedPrice.toLocaleString();

      // Format the original price in $X/sqft/Year format
      const formattedOriginalPrice = `$${leasePrice.toLocaleString()}/sq ft./year`;

      // Return formatted result in a stacked layout with an info icon
      return `
        <div style="display:inline-block; text-align:left; line-height:1.2; vertical-align:middle;">
        <b>Lease price:</b>
          <div style="font-size:14px; font-weight:600; color:#333;">
            ${formattedOriginalPrice}
          </div>
          <div style="font-size:12px; color:#666; margin-top:4px;">
            $${formattedPrice}/month 
           
          </div>
        </div>
      `;
    } else {
      return '<b>Lease price:</b> On Request';
    }
  }

  getNeareastCategoryName(categoryId: number) {
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

  setDefaultView(viewValue: number) {
    this.selectedSS = viewValue;
  }
}
