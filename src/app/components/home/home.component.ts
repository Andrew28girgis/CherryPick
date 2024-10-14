import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
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

  storedLat: any;
  storedLon: any;
  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private modalService: NgbModal,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private configService: ConfigService,
    private titleService: Title,
    private markerService: MapsService,
    private cdr: ChangeDetectorRef
  ) {
    this.titleService.setTitle('CherryPick');
    this.storedLat = localStorage.getItem('placeLat');
    this.storedLon = localStorage.getItem('placeLon');
  }

  ngOnInit(): void {
    this.selectedOption = this.dropdowmOptions[0];
    this.currentView = 1;
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
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }
  centerPoints: any[] = [];

  async getAllMarker() {
    try {
      this.spinner.show();
      const { Map } = await google.maps.importLibrary('maps');
      
      if (this.storedLat != null && this.storedLon != null) {
        this.map = new Map(document.getElementById('map') as HTMLElement, {
          center: {
            lat: +this.storedLat || 0,
            lng: +this.storedLon || 0,
          },
          zoom: 15,
          mapId: '1234567890',
        });
      } else {


        this.map = new Map(document.getElementById('map') as HTMLElement, {
          center: {
            lat: this.allPlaces.standAlonePlaces[0].latitude || 0,
            lng: this.allPlaces.standAlonePlaces[0].longitude || 0,
          },
          zoom: 10,
          mapId: '1234567890',
        });
      }
      if (this.allPlaces && this.allPlaces.centers) {
        this.allPlaces.centers.forEach((center) => {
          let shoppingCenter: any = {};
          shoppingCenter.name = center.centerName;
          shoppingCenter.avalibleUnits = center.places.length;
          shoppingCenter.address = center.places[0].address;
          shoppingCenter.city = center.places[0].city;
          shoppingCenter.state = center.places[0].state;
          shoppingCenter.nearestCompetitors =
            center.places[0].nearestCompetitorsInMiles;
          shoppingCenter.nearestCotenants =
            center.places[0].nearestCotenantsMiles;
          shoppingCenter.latitude = center.places[0].latitude;
          shoppingCenter.longitude = center.places[0].longitude;
          shoppingCenter.mainImage = center.places[0].mainImage;
          shoppingCenter.id = center.places[0].id;
          shoppingCenter.streetLatitude = center.places[0].streetLatitude;
          shoppingCenter.streetLongitude = center.places[0].streetLongitude;

          this.centerPoints.push(shoppingCenter);

          // center.places.forEach((markerData) => {
          //   centerPoints.push(markerData) ;
          // });
        });
      }

      this.createMarkers(
        this.anotherPlaces.competitorPlaces,
        '#0D0C0C',
        'Competitor'
      );
      this.createMarkers(this.anotherPlaces.cotenants, '#0074D9', 'Co-Tenant');
      this.createMarkers(this.anotherPlaces.ourPlaces, '#28A745', 'Our Place');
      this.createMarkers(
        this.allPlaces.standAlonePlaces,
        'rgb(212, 0, 42)',
        'Prospect Target',
        true
      );
      this.createMarkers(
        this.centerPoints,
        'rgb(212, 0, 42)',
        'Prospect Target',
        true
      );
    } finally {
      this.spinner.hide();
    }
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

  selectedOption: any;
  selectOption(option: any): void {
    this.selectedOption = option;
    this.currentView = option.status;
    this.isOpen = false;
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

  // Marker storage arrays
  // Marker storage arrays
  competitorMarkers: any[] = [];
  cotenantMarkers: any[] = [];
  ourPlaceMarkers: any[] = [];
  standAloneMarkers: any[] = [];
  map: any; // Add this property to your class

  isCompetitorChecked = true; // Track the checkbox state
  isCoTenantChecked = true;

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

  goToPlace(place: Property) {
    this.router.navigate(['/landing', place.id, this.BuyBoxId]);
  }

  getStatus(event: any) {
    let value = event.target.value;
    this.searchStatus = value;
  }

  GetBuyBoxNewPlaces() {
    this.PlacesService.GetBuyBoxNewPlaces(this.BuyBoxId).subscribe((res) => {});
  }

  openMapViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.General.modalObject = modalObject;

    // Add a delay to ensure the map element is rendered
    setTimeout(() => {
      this.initializeMapWithMarker();
    }, 100); // Adjust the delay as necessary
  }

  mapViewOnePlace!: boolean;
  async initializeMapWithMarker() {
    this.mapViewOnePlace = true;
    try {
      this.spinner.show();
      const { lat, lng, color } = this.extractCoordinates();
      await this.setupMap(lat, lng, color);
    } finally {
      this.spinner.hide();
    }
  }

  extractCoordinates() {
    const lat = +this.General.modalObject.latitude;
    const lng = +this.General.modalObject.longitude;
    const color = this.configService.getColor();
    return { lat, lng, color };
  }

  async setupMap(lat: number, lng: number, color: string): Promise<void> {
    const map = await this.createMap(lat, lng);
    this.addMarkerToMap(map, lat, lng, color);
  }

  async createMap(lat: number, lng: number) {
    const { Map } = (await google.maps.importLibrary('maps')) as any;
    return new Map(document.getElementById('map') as HTMLElement, {
      center: { lat, lng },
      zoom: 17,
      mapId: '1234567890',
    });
  }

  addMarkerToMap(map: any, lat: number, lng: number, color: string) {
    const svgPath =
      'M-1.547 12l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM0 0q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z';

    // Create a separate marker for the specified location
    new google.maps.Marker({
      map,
      position: { lat, lng },
      icon: {
        path: svgPath,
        scale: 2,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: 'black',
        strokeWeight: 2,
      },
    });
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

    let heading = this.General.modalObject.heading || 165; // Default heading value
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

  formatImageName(centerName: string): string {
    return centerName.replace(/'/g, '');
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


}
