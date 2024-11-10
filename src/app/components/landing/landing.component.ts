import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import { Fbo, General, nearsetPlaces, Property } from 'src/models/domain';
declare const google: any;
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/services/auth.service';
import { LandingPlace, ShoppingCenter } from 'src/models/landingPlace';
import { NearByType } from 'src/models/nearBy';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent {
  General!: General;
  userToken!: string | null;
  placeId!: number;
  place!: Property;
  fbo!: Fbo;
  PlaceFiles: string[] = [];
  showAlert = false;
  token: any;
  Etoken: any;
  showWhatsApp = true;
  showEmail = true;
  logoUrl!: string;
  color!: string;
  fontFamily!: string;
  initDomain!: any;
  theRating!: any;
  rating: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  BuyBoxId!: number;
  contactId!: number;
  showFirstCol = true; // Toggle to false to hide the first col-md-7
  mapViewOnePlacex!: boolean;

  PlaceId!: number;
  CustomPlace!: LandingPlace;
  ShoppingCenter!: ShoppingCenter;
  NearByType: NearByType[] = []; 
  placeImage: string[] = [];
  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private authService: AuthService
  ) {
    localStorage.removeItem('placeLat');
    localStorage.removeItem('placeLon');
  }

  ngOnInit(): void {
    this.initializeParams();
    this.initializeDefaults();
    //this.initializeQueryParams();
  }

  private initializeParams(): void {
    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;
      this.PlaceId = params.id;
      this.GetPlaceDetails(this.PlaceId);
    });
  }

  private initializeDefaults(): void {
    this.General = new General();
    this.place = new Property();
    this.fbo = new Fbo();
    this.CustomPlace = new LandingPlace();
    this.showAlert = false;
  }

  GetPlaceDetails(placeId: number): void {
    const body: any = {
      Name: 'GetPlaceDetails',
      Params: {
        PlaceID: placeId,
        buyboxid: this.BuyBoxId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.CustomPlace = data.json[0];
        this.CustomPlace.PopulationDensity =
          +this.CustomPlace.PopulationDensity;

        if (this.CustomPlace.ShoppingCenters[0].CenterAddress) {
          this.ShoppingCenter = this.CustomPlace.ShoppingCenters[0];
        }

        console.log(`custom place`);
        console.log(this.CustomPlace);

        console.log(`shopping Center`);
        console.log(this.ShoppingCenter);
        if (this.ShoppingCenter) {
          this.getMinMaxUnitSize(this.ShoppingCenter);
        }
        this.viewOnStreet();


        this.placeImage = this.CustomPlace.Images?.split(',').map((link) =>
          link.trim()
        );
        this.GetPlaceNearBy(this.PlaceId);
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  getMinMaxUnitSize(ShoppingCenter: ShoppingCenter) {
    if (ShoppingCenter.OtherPlaces) {
      const places = ShoppingCenter.OtherPlaces;

      if (places.length > 0) {
        const buildingSizes = places.map((place: any) => place.BuildingSizeSf);
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

        if (minSize === maxSize) {
          return minPrice
            ? `Unit Size: ${minSize} SF<br>Lease Price: ${minPrice}`
            : `Unit Size: ${minSize} SF`;
        }

        let sizeRange = `Unit Size: ${minSize} SF - ${maxSize} SF`;

        if (minPrice || maxPrice) {
          sizeRange += `<br>Lease Price: ${minPrice ? minPrice : 'N/A'} - ${
            maxPrice ? maxPrice : 'N/A'
          }`;
        }

        return sizeRange;
      }
    }
    return null;
  }

  GetPlaceNearBy(placeId: number): void {
    const body: any = {
      Name: 'GetPlaceNearBy',
      Params: {
        PlaceID: placeId,
        BuyBoxId: this.BuyBoxId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.NearByType = data.json;
        console.log(`nearBy`);
        console.log(this.NearByType);
        this.getAllMarker();

      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  formatNumberWithCommas(value: number | null): string {
    if (value !== null) {
      return value?.toLocaleString();
    } else {
      return '';
    }
  }
  
  mapView!: boolean;

  async getAllMarker() {
    this.mapView = true;
    try {
      const lat = this.getLatitude();
      const lon = this.getLongitude(); 
      const map = await this.initializeMap(lat, lon);
      
      this.addMarkerForPrimaryLocation(map); 
      
      if (this.NearByType.length > 0) {
        this.NearByType.forEach((type) => {
          type.BuyBoxPlaces.slice(0, 5).forEach((place) => {
            this.createMarker(map, place, type.Name);
          });
        });
      }
    } finally {
      // Any cleanup if necessary
    }
  }

  getLatitude(): number {
    return this.ShoppingCenter
      ? +this.ShoppingCenter.Latitude
      : +this.CustomPlace.Latitude;
  }

  getLongitude(): number {
    return this.ShoppingCenter
      ? +this.ShoppingCenter.Longitude
      : +this.CustomPlace.Longitude;
  }


  async initializeMap(lat: number, lon: number): Promise<any> {
    const { Map } = await google.maps.importLibrary('maps');
    return new Map(document.getElementById('map') as HTMLElement, {
      center: { lat: lat || 0, lng: lon || 0 },
      zoom: 12,
    });
  }

  addMarkerForPrimaryLocation(map: any) {
    const primaryLocation = this.ShoppingCenter || this.CustomPlace;
    const type = this.ShoppingCenter ? 'Shopping Center' : 'Stand Alone';
    this.createMarker(map, primaryLocation, type);
  }

  createMarker(map: any, markerData: any, type: string) {
    const icon = this.getIcon(markerData, type);
    const marker = new google.maps.Marker({
      map,
      position: { lat: +markerData?.Latitude, lng: +markerData?.Longitude },
      icon: icon,
    });

    const infoWindow = new google.maps.InfoWindow({
      content: this.getInfoWindowContent(markerData, type),
    });

    this.addInfoWindowListeners(marker, infoWindow);
  }

  getIcon(markerData: any, type: string): any {
    
    if (type === 'Shopping Center' || type === 'Stand Alone') { 

      return {
        url: this.getArrowSvg(),
        scaledSize: new google.maps.Size(40, 40),
      };
    } else {
      return {
        url: `https://files.cherrypick.com/logos/${markerData.BuyBoxPlace[0].Id}.png`,
        scaledSize: new google.maps.Size(40, 40),
      };
    }
  }

  getInfoWindowContent(markerData: any, type: string): string { 
    
    if (type === 'Shopping Center') {
      return `<div class="info-window">  
              <div class="main-img"><img src="${
                markerData.MainImage
              }" alt="Main Image"></div>
              <div class="content-wrap">
                ${
                  markerData.CenterName
                    ? `<p class="content-title">${markerData.CenterName.toUpperCase()}</p>`
                    : ''
                }
                <p class="address-content">${this.getAddressContent(
                  markerData
                )}</p>
                <div class="row">${this.getSpecificationContent(
                  markerData
                )}</div>
              </div>
            </div>`;
    } else {
      return `<div class="info-window">  
              <div class="main-img"><img src="${
                markerData.MainImage
              }" alt="Main Image"></div>
              <div class="content-wrap">
                 
                <p class="address-content">${this.getAddressContentStandAlone(
                  markerData
                )}</p>
                <div class="row">${this.getSpecificationContent(
                  markerData
                )}</div>
              </div>
            </div>`;
    }
  }

  getAddressContent(markerData: any): string {
    return `<svg class="me-2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.9999 11.1917C11.4358 11.1917 12.5999 10.0276 12.5999 8.5917C12.5999 7.15576 11.4358 5.9917 9.9999 5.9917C8.56396 5.9917 7.3999 7.15576 7.3999 8.5917C7.3999 10.0276 8.56396 11.1917 9.9999 11.1917Z" stroke="#817A79" stroke-width="1.5"/>
            <path d="M3.01675 7.07484C4.65842 -0.141827 15.3501 -0.133494 16.9834 7.08317C17.9417 11.3165 15.3084 14.8998 13.0001 17.1165C11.3251 18.7332 8.67508 18.7332 6.99175 17.1165C4.69175 14.8998 2.05842 11.3082 3.01675 7.07484Z" stroke="#817A79" stroke-width="1.5"/>
          </svg> ${markerData.CenterAddress}, ${markerData.CenterCity}, ${markerData.CenterState}`;
  }

  getAddressContentStandAlone(markerData: any): string {
    return `<svg class="me-2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.9999 11.1917C11.4358 11.1917 12.5999 10.0276 12.5999 8.5917C12.5999 7.15576 11.4358 5.9917 9.9999 5.9917C8.56396 5.9917 7.3999 7.15576 7.3999 8.5917C7.3999 10.0276 8.56396 11.1917 9.9999 11.1917Z" stroke="#817A79" stroke-width="1.5"/>
            <path d="M3.01675 7.07484C4.65842 -0.141827 15.3501 -0.133494 16.9834 7.08317C17.9417 11.3165 15.3084 14.8998 13.0001 17.1165C11.3251 18.7332 8.67508 18.7332 6.99175 17.1165C4.69175 14.8998 2.05842 11.3082 3.01675 7.07484Z" stroke="#817A79" stroke-width="1.5"/>
          </svg> ${markerData.Address}, ${markerData.City}, ${markerData.State}`;
  }

  getSpecificationContent(markerData: any): string {
    return `
    ${
      markerData.nearestCompetitorsInMiles
        ? `<div class="col-md-4 col-sm-12 d-flex flex-column spec"><p class="spec-head">Nearest Competitors</p><p class="spec-content">${markerData.nearestCompetitorsInMiles.toFixed(
            2
          )} MI</p></div>`
        : ''
    }
    ${
      markerData.nearestCotenantsMiles
        ? `<div class="col-md-4 col-sm-12 d-flex flex-column spec"><p class="spec-head">Nearest Complementary</p><p class="spec-content">${markerData.nearestCotenantsMiles.toFixed(
            2
          )} MI</p></div>`
        : ''
    }
    ${
      markerData.avalibleUnits
        ? `<div class="col-md-4 col-sm-12 d-flex flex-column spec"><p class="spec-head">Available Units</p><p class="spec-content">${markerData.avalibleUnits}</p></div>`
        : ''
    }`;
  }

  addInfoWindowListeners(marker: any, infoWindow: any) {
    marker.addListener('click', () => {
      infoWindow.open({
        anchor: marker,
        map: marker.getMap(),
        shouldFocus: false,
      });
    });

    marker.addListener('mouseout', () => {
      infoWindow.close();
    });
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

  validatePercentageInput(event: any) {
    let inputValue = event.target.value;
    inputValue = parseFloat(inputValue.replace(/[^0-9.]/g, ''));
    if (!isNaN(inputValue)) {
      inputValue = Math.min(100, Math.max(0, inputValue));
    }
  }

  sendFeedBack(reaction: string) {
    this.place.reaction = reaction;
    let feedback: any = {};
    feedback['note'] = this.place.feedBack;
    feedback['placeId'] = this.placeId;

    if (reaction != '') {
      feedback['Reaction'] = reaction;
    }
    feedback['buyboxId'] = +this.BuyBoxId;
    this.PlacesService.UpdateBuyBoxWorkSpacePlace(feedback).subscribe(
      (data) => {
        this.showAlert = true;
        if (reaction == '') {
          setTimeout(() => {
            this.showAlert = false;
          }, 3000);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    );
  }  
 

  viewOnStreet() {
    let lat = this.getStreetLat();
    let lng = this.getStreetLong(); 
    let heading =   this.getStreetHeading() || 165 ; // Default heading value
    let pitch =  this.getStreetPitch() || 0  ; // Default pitch value
    console.log(lat, lng, heading, pitch);
    
    setTimeout(() => {
      const streetViewElement = document.getElementById('street-view');
      if (streetViewElement) {
        this.streetMap(lat, lng, heading, pitch);
      } else {
        console.error("Element with id 'street-view' not found.");
      }
    });
  }

  getStreetLat(): number {
    return this.ShoppingCenter
      ? +this.ShoppingCenter.StreetLatitude
      : +this.CustomPlace.StreetLatitude;
  }

  getStreetLong(): number {
    return this.ShoppingCenter
      ? +this.ShoppingCenter.StreetLongitude
      : +this.CustomPlace.StreetLongitude;
  } 
  
  getStreetHeading(): number {
    return this.ShoppingCenter
      ? +this.ShoppingCenter.Heading
      : +this.CustomPlace.Heading;
  }

  getStreetPitch(): number {
    return this.ShoppingCenter
      ? +this.ShoppingCenter.Pitch
      : +this.CustomPlace.Pitch;
  }

  streetMap(lat: number, lng: number, heading: number, pitch: number) {
    const streetViewElement = document.getElementById('street-view');
    if (streetViewElement) {
      const panorama = new google.maps.StreetViewPanorama(
        streetViewElement as HTMLElement,
        {
          position: { lat: lat, lng: lng },
          pov: { heading: heading, pitch: pitch },
        }
      );
    } else {
      console.error("Element with id 'street-view' not found in the DOM.");
    }
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

    // Find the map container element
    const mapDiv = document.getElementById('mapInPopup') as HTMLElement;

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

  openStreetViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.General.modalObject = modalObject;
    setTimeout(() => {
      this.viewOnStreetPopUp();
    }, 100);
  }
  StreetViewOnePlace!: boolean;

  viewOnStreetPopUp() {
    this.StreetViewOnePlace = true;
    let lat = +this.General.modalObject.StreetLatitude;
    let lng = +this.General.modalObject.StreetLongitude;

    let heading = this.General.modalObject.Heading || 165; // Default heading value
    let pitch = this.General.modalObject.Pitch || 0;

    setTimeout(() => {
      const streetViewElement = document.getElementById('street-view-pop');
      if (streetViewElement) {
        this.streetMapPopup(lat, lng, heading, pitch);
      } else {
        console.error("Element with id 'street-view' not found.");
      }
    });
  }

  streetMapPopup(lat: number, lng: number, heading: number, pitch: number) {
    const streetViewElement = document.getElementById('street-view-pop');
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


}
