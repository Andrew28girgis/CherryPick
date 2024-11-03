import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  NgZone 
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import {
  AllPlaces,
  AnotherPlaces,
  General,
  GroupedProperties,
  Property,
} from 'src/models/domain';
declare const google: any;
import { Options } from 'ngx-slider-v2';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfigService } from 'src/app/services/config.service';
import { Title } from '@angular/platform-browser';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ViewportScroller } from '@angular/common';
import { MapsService } from 'src/app/services/maps.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  @ViewChild('scrollableDiv') scrollableDiv!: ElementRef;
  private savedScrollPosition: number = 0;

  General!: General;
  mapView!: boolean;
  userToken!: string | null;
  minValue: number = 0;
  maxValue: number = 100000;
  selectedStates!: string;
  MatchStatus!: number;
  selectedCity!: string;
  cities: string[] = [];
  minLandSize: any = null;
  maxLandSize: any = null;
  minNumberOfBeds: any = null;
  maxNumberOfBeds: any = null;

  options: Options = {
    floor: 0,
    ceil: 100000,
  };
  searchStatus!: string;
  currentCity!: string;
  pageTitle!: string;
  rating: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  city!: GroupedProperties;
  AllCities: GroupedProperties[] = [];
  matchStatus!: number;
  BuyBoxId!: any;
  page: number = 1;
  pageSize: number = 25;
  paginatedProperties: Property[] = [];
  filteredProperties: Property[] = [];
  contactId: any;
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
  cardView: boolean = true;
  currentView: any;
  centerPoints: any[] = [];
  // Marker storage arrays
  // Marker storage arrays
  competitorMarkers: any[] = [];
  cotenantMarkers: any[] = [];
  ourPlaceMarkers: any[] = [];
  standAloneMarkers: any[] = [];
  map: any; // Add this property to your class

  isCompetitorChecked = false; // Track the checkbox state
  isCoTenantChecked = false;
  cardsSideList: any[] = [];
  selectedOption: any;
  savedMapView: any;
  mapViewOnePlacex: boolean = false;

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private modalService: NgbModal,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private markerService: MapsService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {
    this.currentView = localStorage.getItem('currentView') || 2;
    this.savedMapView = localStorage.getItem('mapView');
  }

  ngOnInit(): void {
    this.selectedOption = this.dropdowmOptions[0];
    this.mapView = true;
    this.General = new General();
    this.activatedRoute.params.subscribe((params: any) => {
      this.contactId = params.contactId;
      this.selectedStates = params.State;
      this.currentCity = params.city;
      this.MatchStatus = +params.MatchStatus;
      this.BuyBoxId = params.buyboxid;
      localStorage.setItem('BuyBoxId', this.BuyBoxId);
      this.GetFilteredPlacesLookup();
    });
    if (history.state && history.state.city) {
      this.allPlaces = history.state.city;  
      //this.getPlaces();
    } else {
      console.log('No city object found in navigation state');
    }
    this.getAllBuyBoxComparables(this.BuyBoxId); 

    
    // setTimeout(() => {
    //   const storedScrollPosition = sessionStorage.getItem('scrollPosition');
    //   if (storedScrollPosition) {
    //     this.scrollableDiv.nativeElement.scrollTop = parseInt(storedScrollPosition, 10);
    //   }
    // }, 0);

    this.selectedOption = this.dropdowmOptions.find(
      (option: any) => +option.status == +this.currentView
    );
  }

  replaceApostrophe(name: string, replacement: string = ''): string {
    return name.toLowerCase().replace(/'/g, replacement);
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
            lat: this.allPlaces.standAlonePlaces[0].latitude || 0,
            lng: this.allPlaces.standAlonePlaces[0].longitude || 0,
          },
          zoom: 10,
          mapId: '1234567890',
        });
        this.map.addListener('dragend', () => this.onMapDragEnd(this.map));
        this.map.addListener('zoom_changed', () => this.onMapDragEnd(this.map));
        this.map.addListener('bounds_changed', () =>
          this.onMapDragEnd(this.map)
        );
      }
      if (this.allPlaces && this.allPlaces.centers) {
        this.allPlaces.centers.forEach((center) => {
          let shoppingCenter: any = {};
          shoppingCenter.id = center.places[0].id; 
          shoppingCenter.name = center.centerName;
          shoppingCenter.address = center.address;
          shoppingCenter.city = center.city;
          shoppingCenter.state = center.state;

          shoppingCenter.avalibleUnits = center.places.length; 
          shoppingCenter.mainImage = center.mainImage;

          shoppingCenter.latitude = center.lat;
          shoppingCenter.longitude = center.lng;
          shoppingCenter.streetLatitude = center.stLat;
          shoppingCenter.streetLongitude = center.stLng;
          shoppingCenter.heading = center.heading; 
          shoppingCenter.pitch = center.pitch;  
                  
          shoppingCenter.nearestCompetitors = center.nearestCompetitorsInMiles;
          shoppingCenter.nearestCotenants = center.nearestCotenantsMiles;
          shoppingCenter.leasePrice = center.leasePrice;
          shoppingCenter.minUnitSize = center.minUnitSize;
          shoppingCenter.maxUnitSize = center.maxUnitSize;
          shoppingCenter.nearestCompetitorsName = center.nearestCompetitorsName;
          shoppingCenter.nearestCotenantsName = center.nearestCotenantsName;

          this.centerPoints.push(shoppingCenter); 
        });
      }

      if (
        this.anotherPlaces.competitorPlaces &&
        this.anotherPlaces.competitorPlaces.length > 0
      ) {
        this.createMarkers(
          this.anotherPlaces.competitorPlaces,
          '#0D0C0C',
          'Competitor'
        );
      }

      if (
        this.anotherPlaces.cotenants &&
        this.anotherPlaces.cotenants.length > 0
      ) {
        this.createMarkers(
          this.anotherPlaces.cotenants,
          '#0074D9',
          'Co-Tenant'
        );
      }

      if (
        this.anotherPlaces.ourPlaces &&
        this.anotherPlaces.ourPlaces.length > 0
      ) {
        this.createMarkers(
          this.anotherPlaces.ourPlaces,
          '#28A745',
          'Our Place'
        );
      }

      if (
        this.allPlaces.standAlonePlaces &&
        this.allPlaces.standAlonePlaces.length > 0
      ) {
        this.createMarkers(
          this.allPlaces.standAlonePlaces,
          'rgb(212, 0, 42)',
          'Prospect Target',
          true
        );
      }

      if (this.centerPoints && this.centerPoints.length > 0) {
        this.createMarkers(
          this.centerPoints,
          'rgb(212, 0, 42)',
          'Prospect Target',
          true
        );
      }
      this.markerService.toggleMarkers(
        'Competitor',
        this.isCompetitorChecked,
        this.map
      );
      this.markerService.toggleMarkers(
        'Co-Tenant',
        this.isCoTenantChecked,
        this.map
      );
    } finally {
      this.spinner.hide();
    }
  }
  private onMapDragEnd(map: any) {
    const bounds = map.getBounds();
    const visibleMarkers = this.markerService.getVisibleProspectMarkers(bounds);

    // Save the current map view (center and zoom level) in local storage.
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

    const visibleCoords = new Set(
      visibleMarkers.map((marker) => `${marker.lat},${marker.lng}`)
    );

    this.allPlaces.centers.forEach((center) => {
      const firstPlace = center.places[0];
      center.latitude = firstPlace.latitude;
      center.longitude = firstPlace.longitude;
    });

    const allPros: any[] = [
      ...this.allPlaces.standAlonePlaces,
      ...this.allPlaces.centers,
    ];

    // Update the cardsSideList inside NgZone
    this.ngZone.run(() => {
      this.cardsSideList = allPros.filter((property) =>
        visibleCoords.has(`${property.latitude},${property.longitude}`)
      );

      console.log('Filtered Properties:', this.cardsSideList);
    });
}

  onMouseEnter(place: any): void {
    const { latitude, longitude } = place;
    const mapElement = document.getElementById('map') as HTMLElement;

    if (!mapElement) return;

    if (this.map) {
      this.map.setCenter({ lat: +latitude, lng: +longitude });
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

  GetFilteredPlacesLookup() {
    this.spinner.show();
    this.PlacesService.GetFilteredPlacesLookup(this.BuyBoxId).subscribe(
      (data) => {
        this.General.Filter = data;
        if (this.selectedStates) {
          this.fillCities();
        }
        this.spinner.hide();
      }
    );
  }

  fillCities() {
    this.General.Filter?.forEach((item) => {
      if (item.state == this.selectedStates) {
        item.cities?.forEach((c) => {
          this.cities.push(c);
        });
        this.cities.sort((a, b) => a.localeCompare(b));
        this.selectedCity = this.currentCity;
      }
    });
  }

  getPlaces() {
    this.updatePaginatedProperties();

    // if (this.currentCity != undefined) {
    //   this.AllCities = history.state.city;
    //   console.log(`cities`, this.AllCities);

    //   let ExictingCity = this.AllCities.filter(
    //     (c) => c.city == this.currentCity && c.state == this.selectedStates
    //   );
    //   this.city.properties = ExictingCity.flatMap((city) => city.properties);

    //   this.filteredProperties = [...this.city.properties];
    //   // this.filteredProperties.sort((a, b) => b.matchStatus - a.matchStatus);
    //   this.updatePaginatedProperties();
    // } else {
    //   this.AllCities = history.state.city;
    //   this.city.properties = [];
    //   this.city.properties = this.AllCities.flatMap((city) => city.properties);
    //   this.filteredProperties = [...this.city.properties];
    //   // this.filteredProperties.sort((a, b) => b.matchStatus - a.matchStatus);
    //   this.updatePaginatedProperties();
    // }
  }

  applyFilters() {
    const filters = [
      { property: 'state', value: this.selectedStates },
      { property: 'city', value: this.selectedCity },
    ];
    this.filterClient(filters);
  }

  filterClient(filters: { property: string; value: any }[]) {
    const allProperties = this.AllCities.flatMap((city) => city.properties);
    this.filteredProperties = allProperties;
    for (const filter of filters) {
      if (!filter.value || filter.value === 'All') {
        continue;
      }
      this.filteredProperties = this.filteredProperties.filter(
        (property: any) => property[filter.property] === filter.value
      );
    }
    this.city.properties = this.filteredProperties;
    this.page = 1;
    this.updatePaginatedProperties();
  }

  updatePaginatedProperties(): void {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedProperties = this.filteredProperties.slice(start, end);
    this.spinner.hide();
    this.getAllMarker();
  }

  onPageChange(): void {
    this.updatePaginatedProperties();
  }

  GetBuyBoxPlaces() {
    this.spinner.show();
    this.PlacesService.GetBuyBoxPlaces(this.BuyBoxId).subscribe((data) => {
      // this.General.places = data.places;
      this.General.fbo = data.fpo;
      this.getAllMarker();
      this.spinner.hide();
    });
  }

  getCitiesFromInit(state: any) {
    this.cities = [];
    this.General.Filter.forEach((item) => {
      if (item.state == state) {
        item.cities?.forEach((c) => {
          this.cities.push(c);
        });
        // Sort cities alphabetically
        this.cities.sort((a, b) => a.localeCompare(b));
        this.selectedCity = this.currentCity;
        this.filter();
      }
    });
  }

  selectOption(option: any): void {
    this.selectedOption = option;
    this.currentView = option.status;
    this.isOpen = false;
    localStorage.setItem('currentView', this.currentView);
  }

  changeView() {
    this.mapView = !this.mapView;
  }

  createMarkers(
    markerDataArray: any[],
    color: string,
    type: string,
    useArrow: boolean = false
  ) {
    markerDataArray.forEach((markerData) => {
      this.markerService.createMarker(
        this.map,
        markerData,
        color,
        type,
        useArrow
      );
    });
  }

  onCheckboxChange(value: string) {
    if (value == 'Competitor') {
      this.markerService.toggleMarkers(
        value,
        this.isCompetitorChecked,
        this.map
      );
    } else {
      this.markerService.toggleMarkers(value, this.isCoTenantChecked, this.map);
    }
  }

  getCities(event: any) {
    this.cities = [];
    this.selectedCity = '';
    let value = event.target.value;
    this.selectedStates = value;
    this.General.Filter.forEach((item) => {
      if (item.state == value) {
        item.cities?.forEach((c) => {
          this.cities.push(c);
        });
        this.cities.sort((a, b) => a.localeCompare(b));
      }
    });
  }

  filter() {
    let searchFilter: any = {};
    searchFilter.isAccepted = +this.searchStatus;
    searchFilter.City = this.selectedCity;
    searchFilter.City = this.selectedCity == 'All' ? null : this.selectedCity;
    searchFilter.State =
      this.selectedStates == 'All' ? null : this.selectedStates;
    searchFilter.MatchStatus = +this.MatchStatus;
    // searchFilter.MinLandSize = this.minLandSize;
    // searchFilter.MaxLandSize = this.maxLandSize;
    // searchFilter.MinNumOfBeds = this.minNumberOfBeds;
    // searchFilter.MaxNumOfBeds = this.maxNumberOfBeds;

    this.PlacesService.GetFilteredBuyBoxPlaces(
      searchFilter,
      this.BuyBoxId
    ).subscribe((data) => {
      this.General.places = data.places;
      this.getAllMarker();
    });
  }

  goToPlace(place: any) {
    if (place.id) {
      this.router.navigate(['/landing', place.id, this.BuyBoxId]);
    } else {
      this.router.navigate(['/landing', place.places[0].id, this.BuyBoxId]);
    }
  }

  getStatus(event: any) {
    let value = event.target.value;
    this.searchStatus = value;
  }

  GetBuyBoxNewPlaces() {
    this.PlacesService.GetBuyBoxNewPlaces(this.BuyBoxId).subscribe((res) => {});
  }

  openStreetViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.General.modalObject = modalObject;
    setTimeout(() => {
      this.viewOnStreet();
    }, 100);
  }

  StreetViewOnePlace!: boolean;

  viewOnStreet() {
    this.StreetViewOnePlace = true;
    let lat = +this.General.modalObject.streetLatitude;
    let lng = +this.General.modalObject.streetLongitude;
    let heading = this.General.modalObject.heading || 165;
    let pitch = this.General.modalObject.pitch || 0;

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
    })

   this.viewOnMap(modalObject.latitude, modalObject.longitude);


  }
  
  
 async viewOnMap(lat: number, lng: number) {
  this.mapViewOnePlacex = true; 

  if (!lat || !lng) {
    console.error("Latitude and longitude are required to display the map.");
    return;
  }

  // Load Google Maps API libraries
  const { Map } = (await google.maps.importLibrary('maps')) as any;

  // Find the map container element
  const mapDiv = document.getElementById('mappopup') as HTMLElement;

  // Check if the mapDiv exists
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

  
  

  formatImageName(centerName: string): string {
    return centerName.replace(/'/g, '');
  }

  trackByCenterName(index: number, place: any): string {
    return place.centerName;
  }

  private getArrowSvg(): string {
    return (
      'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
          <g clip-path="url(#clip0_32_4219)">
              <path d="M34.0399 5.43991L27.0799 8.91991C25.1399 9.87991 22.8799 9.87991 20.9399 8.91991L13.9599 5.41991C7.99995 2.43991 1.69995 8.87991 4.81995 14.7799L6.45995 17.8599C6.67995 18.2799 7.03995 18.6199 7.47995 18.8199L32.7799 30.1999C33.8199 30.6599 35.0399 30.2399 35.5599 29.2399L43.1799 14.7599C46.2799 8.87991 39.9999 2.43991 34.0399 5.43991Z" fill="#CC3D3D"/>
              <path d="M31.2 32.62L14.64 25.16C12.78 24.32 10.9 26.32 11.86 28.12L17.94 39.66C20.52 44.56 27.52 44.56 30.1 39.66L32.24 35.58C32.8 34.48 32.32 33.14 31.2 32.62Z" fill="#CC3D3D"/>
          </g>
          <defs>
              <clipPath id="clip0_32_4219">
                  <rect width="48" height="48" fill="white"/>
              </clipPath>
          </defs>
      </svg>
  `)
    );
  }


  private getArrowSvgBlack(): string {
    return (
      'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(`
       <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_456_4378)">
<path d="M34.0399 5.43991L27.0799 8.91991C25.1399 9.87991 22.8799 9.87991 20.9399 8.91991L13.9599 5.41991C7.99995 2.43991 1.69995 8.87991 4.81995 14.7799L6.45995 17.8599C6.67995 18.2799 7.03995 18.6199 7.47995 18.8199L32.7799 30.1999C33.8199 30.6599 35.0399 30.2399 35.5599 29.2399L43.1799 14.7599C46.2799 8.87991 39.9999 2.43991 34.0399 5.43991Z" fill="#0D0C0C"/>
<path d="M31.1999 32.62L14.6399 25.16C12.7799 24.32 10.8999 26.32 11.8599 28.12L17.9399 39.66C20.5199 44.56 27.5199 44.56 30.0999 39.66L32.2399 35.58C32.7999 34.48 32.3199 33.14 31.1999 32.62Z" fill="#0D0C0C"/>
</g>
<defs>
<clipPath id="clip0_456_4378">
<rect width="48" height="48" fill="white"/>
</clipPath>
</defs>
</svg>

    `)
    );
  }

 
// YourComponent.ts
getUnitSize(place: any): string {
  const minSize = place.minUnitSize;
  const maxSize = place.maxUnitSize;

  return minSize === maxSize
    ? `${minSize} SF`
    : `${minSize} SF - ${maxSize} SF`;
}


}
