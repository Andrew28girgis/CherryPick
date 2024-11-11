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
    private ngZone: NgZone
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
      Name: 'GetBuyBoxPlacesCategories',
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
      Name: 'MarketSurveyPlaces',
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
      Name: 'MarketSurveyStandalonePlaces',
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
      Name: 'BuyBoxPlaces',
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
            place.BuyBoxPlaces?.some((x) => x.CategoryId === category.id)
          );
        });
 
       

        
        this.getAllMarker();
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  getLogo(id: number) {
        
    // console.log(this.buyboxPlaces);

    for (const place of this.buyboxPlaces) {
      const foundBranch = place.BuyBoxPlaces?.find((branch) => branch.Id === id);
      if (foundBranch) {
        return place.Id;
      }
    }
    return undefined;
  }

  getLogoTitle(id: number) {
    for (const place of this.buyboxPlaces) {
      const foundBranch = place.BuyBoxPlaces?.find((branch) => branch.Id === id);
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
            lat: this.shoppingCenters[0].Latitude || 0,
            lng: this.shoppingCenters[0].Longitude || 0,
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
    const bounds = map.getBounds();
    const visibleMarkers = this.markerService.getVisibleProspectMarkers(bounds);
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

    this.shoppingCenters.forEach((center) => {
      const firstPlace = center.ShoppingCenter.Places[0];
      center.Latitude = firstPlace.Latitude;
      center.Longitude = firstPlace.Longitude;
    });

    const allPros: any[] = [...this.shoppingCenters, ...this.standAlone];

    // Update the cardsSideList inside NgZone
    this.ngZone.run(() => {
      this.cardsSideList = allPros.filter((property) =>
        visibleCoords.has(`${property.Latitude},${property.Longitude}`)
      );

      console.log('Filtered Properties:', this.cardsSideList);
    });
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
    if(place.CenterAddress){
      this.router.navigate(['/landing', place.ShoppingCenter.Places[0].Id, this.BuyBoxId]);
    }else{
      this.router.navigate(['/landing', place.Id, this.BuyBoxId]);
    }
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
    if (shoppingCenter.ShoppingCenter) {
        const places = shoppingCenter.ShoppingCenter.Places;

        if (places.length > 0) {
            const buildingSizes = places.map((place: any) => place.BuildingSizeSf);
            const leasePrices = places.map(
                (place: any) => place.ForLeasePrice || null
            );

            let minSize = Math.min(...buildingSizes);
            let maxSize = Math.max(...buildingSizes);

            let minPrice = null;
            let maxPrice = null;

            // Find lease prices corresponding to min and max sizes
            for (let place of places) {
                if (place.BuildingSizeSf === minSize) {
                    minPrice = place.ForLeasePrice;
                }
                if (place.BuildingSizeSf === maxSize) {
                    maxPrice = place.ForLeasePrice;
                }
            }

            // Check if min and max sizes are the same
            if (minSize === maxSize) {
                return minPrice
                    ? `Unit Size: ${this.formatNumberWithCommas(minSize)} SF<br>Lease Price: ${minPrice}`
                    : `Unit Size: ${this.formatNumberWithCommas(minSize)} SF`;
            }

            // Check if min and max lease prices are the same
            if (minPrice === maxPrice) {
                return minPrice
                    ? `Unit Size: ${this.formatNumberWithCommas(minSize)} SF - ${this.formatNumberWithCommas(maxSize)} SF<br>Lease Price: ${minPrice}`
                    : `Unit Size: ${this.formatNumberWithCommas(minSize)} SF - ${this.formatNumberWithCommas(maxSize)} SF`;
            }

            let sizeRange = `Unit Size: ${this.formatNumberWithCommas(minSize)} SF - ${this.formatNumberWithCommas(maxSize)} SF`;

            
            if (minPrice || maxPrice) {
                sizeRange += `<br>Lease Price: ${minPrice ? minPrice : ''} - ${
                    maxPrice ? maxPrice : ''
                }`;
            }

            return sizeRange;
        }
    } else{
        let sizeRange = `Unit Size: ${this.formatNumberWithCommas(shoppingCenter.BuildingSizeSf)} SF`;

         if (shoppingCenter.ForLeasePrice) {
          sizeRange += `<br>Lease Price: ${shoppingCenter. ForLeasePrice}`;
      }
        return sizeRange;
    }
    return null;
}



  getNeareastCategoryName(categoryId: number) {
    
    let categories = this.buyboxCategories.filter((x) => x.id == categoryId);
    return categories[0].name;
  }

  formatNumberWithCommas(value: number | null): string {
    if (value !== null) {
      return value?.toLocaleString();
    } else {
      return '';
    }
  }
}
