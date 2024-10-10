import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import { Fbo, General, nearsetPlaces, Place, Property } from 'src/models/domain';
declare const google: any;
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfigService } from 'src/app/services/config.service';
import { getDomainConfig } from 'src/app/config';
import { Title } from '@angular/platform-browser';
import { AuthService } from 'src/app/services/auth.service';

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

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private configService: ConfigService,
    private titleService: Title,
    private authService: AuthService
  ) {
    let color = this.configService.getColor();
    if (color == '#161616') {
      this.titleService.setTitle('peak7holdings');
    } else if (color == '#0e1b4d') {
      this.titleService.setTitle('Common');
    } else if (color == '#f37f00') {
      this.titleService.setTitle('AutoZone');
    } else {
      this.titleService.setTitle('CherryPick');
    }
  }

  ngOnInit(): void {
    this.initializeParams();
    this.initializeQueryParams();
    this.initializeDefaults();
    this.applyDomainConfig();
  }


  private initializeParams(): void {
    this.activatedRoute.params.subscribe((params: any) => {
      this.placeId = +params.id; 
      this.BuyBoxId = params.buyboxid;
    });
  }

  private initializeQueryParams(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.token = params['Token'];
      this.Etoken = params['EToken'];
      if (this.Etoken) {
        localStorage.setItem('Token', this.Etoken);
        this.LoginWithContact(this.contactId, this.Etoken);
      } else if (!this.token) {
        this.getPlace(this.placeId);
      } else {
        this.GetSharedPlace(this.token, this.placeId);
      }
    });
  }

  private initializeDefaults(): void {
    this.General = new General();
    this.place = new Property();
    this.fbo = new Fbo();
    this.showAlert = false;
  }

  private applyDomainConfig(): void {
    const domain = window.location.href;
    this.initDomain = window.location.hostname;
    const config = getDomainConfig(domain);
    this.logoUrl = config.logo;
    this.color = config.color;
    document.documentElement.style.setProperty('--app-color', this.color);
    this.fontFamily = config.fontFamily;
  }

  LoginWithContact(contactId: any, token: any) {
    let x: any = {};
    x.contactId = contactId;
    x.token = token;
    localStorage.setItem('contactId', contactId);
    this.PlacesService.LoginWithContact(x).subscribe((res) => {
      this.authService.setToken(res.token);
      this.getPlace(this.placeId);
    });
  }

  
  anotherPlaces:any[]=[];
  getAnotherPlaces() {
    this.PlacesService.GetShoppingCenterPlaces(this.place.centerName  ,this.placeId ,   this.BuyBoxId).subscribe((res) => { 
      this.anotherPlaces = res.result;
    });
  } 

  GetUserEstimatedNumbers(placeId: number) {
    this.PlacesService.GetUserEstimatedNumbers(
      placeId,
      this.BuyBoxId
    ).subscribe((res) => {
      this.fbo = res;
    });
  }

  getSpecificPlaces(placeId: number, buyboxId: number) {
    this.PlacesService.getSpecificPlaces(placeId, buyboxId).subscribe((res) => {
      this.General.SpecificPlaces = res;
    });
  }

  GetUserEstimatedNumbersForShare(placeId: number, sharedId: number) {
    this.PlacesService.GetUserEstimatedNumbersForShared(
      placeId,
      sharedId,
      this.BuyBoxId
    ).subscribe((res) => {
      this.fbo = res;
    });
  }

  UpdateBuyBoxUserEstimatedNumbers() {
    this.fbo.PlaceId = this.placeId;
    this.PlacesService.UpdateBuyBoxUserEstimatedNumbers(this.fbo).subscribe(
      (res) => {}
    );
  }

  GetSharedPlace(token: number, sharedId: number) {
    this.spinner.show();
    this.PlacesService.GetSharedPlace(token, sharedId, this.BuyBoxId).subscribe(
      (data) => {
        this.place = data.place;
        this.placeId = this.place.id;
        this.GetUserEstimatedNumbersForShare(this.placeId, sharedId);
        this.GetAllFilesFromPlace(this.placeId);
        // this.place.maxBuildingSize =
        //   this.place?.maxBuildingSize === 0
        //     ? this.place?.landSf * this.place?.far
        //     : this.place?.maxBuildingSize ?? 0;
        // this.place.stages.forEach((s) => { 
        //   if (s.propertyName) {
        //     s.propertyName =
        //       s.propertyName.charAt(0).toLowerCase() + s.propertyName.slice(1);
        //   }
        // });
        // this.GetNearbyBuildings(this.place.lat, this.place.lon);
        //    this.getAllMarker();
        this.GetNearestPlaces();
        this.getSpecificPlaces(this.place.id, this.BuyBoxId);
        this.viewOnStreet();
        this.spinner.hide();
      }
    );
  }

  GetAllFilesFromPlace(placeId: number) {
    this.PlacesService.GetAllFilesFromPlace(placeId).subscribe((res) => {
      this.PlaceFiles = res.filenames;
    });
  }

  formattedFboUnit!: string | null;
  placeImage:string[]=[];
  getPlace(id: number) {
    this.spinner.show();
    this.PlacesService.GetBuyBoxOnePlace(id, this.BuyBoxId).subscribe(
      (data) => {
        this.place = data.place;
        this.placeImage  = this.place.imagesLinks?.split(',').map(link => link.trim());
        this.GetNearestPlaces();
        this.viewOnStreet();
        this.getAnotherPlaces();

        // if (this.place !== undefined) {
        //   this.theRating = this.place.isAccepted;
        // }
        // this.place.maxBuildingSize =
        //   this.place?.maxBuildingSize === 0
        //     ? this.place?.landSf * this.place?.far
        //     : this.place?.maxBuildingSize ?? 0;
        // this.place.stages.forEach((s) => {
        //   if (s.propertyName) {
        //     s.propertyName =
        //       s.propertyName.charAt(0).toLowerCase() + s.propertyName.slice(1);
        //   }
        // });
        this.getSpecificPlaces(this.place.id, this.BuyBoxId);
        // this.GetNearbyBuildings(this.place.lat, this.place.lon);
   
        this.GetUserEstimatedNumbers(this.place.id);
        // this.getComparable(this.place.id, this.place.organizationId);
        // this.GetAllFilesFromPlace(this.place.id);
        this.spinner.hide();
      }
    );
  }

  GetNearestPlaces() {
    this.General.nearsetPlaces = new nearsetPlaces();
    this.PlacesService.GetNearestBuyBoxPlaces(
      this.place.organizationId,
      this.place.id
    ).subscribe((res) => {
      this.General.nearsetPlaces = res;
      this.getAllMarker();
      // this.rentResults = this.findMinMaxRent(res);
    });
  }

  getComparable(placeId: number, orgId: number) {
    this.spinner.show();
    this.PlacesService.NearestFiveComparable(placeId, orgId).subscribe(
      (res) => {
        this.General.comparable = res;
      },
      (error) => {
        this.spinner.hide();
      }
    );
  }

  updateNoi(value: string): void {
    const numericValue = +value.replace(/,/g, '');
    this.fbo.noi = numericValue;
    this.UpdateBuyBoxUserEstimatedNumbers();
  }

  formatNumberWithCommas(value: number | null): string {
    if (value !== null) {
      return value?.toLocaleString();
    } else {
      return '';
    }
  }

  rentResults: any[] = [];
  GetNearbyBuildings(lat: number, lng: number) {
    this.PlacesService.GetNearbyBuildings(lat, lng).subscribe((data) => {
      this.General.Buildings = data;
      this.rentResults = this.findMinMaxRent(data);
    //  this.getAllMarker();
    });
  }

mapView!: boolean;
async getAllMarker() {
  this.mapView = true;
  try {
    this.spinner.show();
    let lat = +this.place.lat;
    let lon = +this.place.lon;
    let colorCompetitor = 'black';
    let colorCotenants = '#0652DD';
    let colorOurPlaces = 'red';

    const { Map, InfoWindow } = await google.maps.importLibrary('maps');
    const map = new Map(document.getElementById('map') as HTMLElement, {
      center: { lat: lat || 0, lng: lon || 0 },
      zoom: 14,
    });

    const createMarker = (markerData: any, color: string, useArrow: boolean = false , type: string) => {
      let icon;
      if (useArrow) {
        icon = {
          url: this.getArrowSvg(),
          scaledSize: new google.maps.Size(40, 40),
        };
      } else {  
        icon = {
          url: `https://osmows.cherrypick.com/logos/${ markerData.name }.jpg`, 
          scaledSize: new google.maps.Size(30, 30), // Adjust the size as needed
          origin: new google.maps.Point(0, 0), // Optional: Set the origin point
          anchor: new google.maps.Point(15, 15) // Optional: Set the anchor point
        };
        
        
      }

      const marker = new google.maps.Marker({
        map,
        position: { lat: useArrow ? Number(markerData.lat) : Number(markerData.latitude), lng: useArrow ? Number(markerData.lon) : Number(markerData.longitude) },
        icon: icon,
      });

      let content;
        if (type === 'Prospect Target') {
          content = `<div>
                        <h5 style="margin-top:10px">${type}</h5>
                        <strong>${markerData.address} </strong><br>
                          ${markerData.suite ? `<strong>Suite: ${markerData.suite}</strong><br>` : ''} 
                        ${markerData.buildingSizeSf ? `<strong>Building Size: ${markerData.buildingSizeSf} SF</strong><br>` : ''}
                        ${markerData.nearestBranchesInMiles ? `<strong>Nearest Branches: ${markerData.nearestBranchesInMiles.toFixed(2)} MI</strong><br>` : ''}
                        ${markerData.nearestCompetitorsInMiles ? `<strong>Nearest Competitors: ${markerData.nearestCompetitorsInMiles.toFixed(2)} MI</strong><br>` : ''}
                        ${markerData.nearestCotenantsMiles ? `<strong>Nearest Cotenants: ${markerData.nearestCotenantsMiles.toFixed(2)} MI</strong><br>` : ''}
                      </div>`; 
        } else {
          content = `<div>
                        <h5 style="margin-top:10px">${type}</h5>
                        <strong>${markerData.name}</strong><br>
                      </div>`; // Display the name and type of the place
        }
 
  
        const infoWindow = new InfoWindow({
          content: content,  
        });
  
        // Show info window on mouseover
        marker.addListener('mouseover', () => {
          infoWindow.open({
            anchor: marker,
            map,
            shouldFocus: false,
          });
        });
  
        // Hide info window on mouseout
        marker.addListener('mouseout', () => {
          infoWindow.close();
        });
    };
    

    // Create red marker for current place (lat and lon)
    createMarker(this.place , colorOurPlaces , true , 'Prospect Target');

    // Cotenants 
    if (this.General.nearsetPlaces.cotenants) {
      this.General.nearsetPlaces.cotenants.forEach((markerData) => {
        createMarker(markerData, colorCotenants , false , 'Co-Tenant');
      });
    }

    // Competitor Places
    if (this.General.nearsetPlaces?.competitorPlaces) {
      this.General.nearsetPlaces?.competitorPlaces.forEach((markerData) => {
        createMarker(markerData, colorCompetitor , false, 'Competitor');
      });
    }

  } finally {
    this.spinner.hide();
  }
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
  validatePercentageInput(event: any) {
    let inputValue = event.target.value;
    inputValue = parseFloat(inputValue.replace(/[^0-9.]/g, ''));
    if (!isNaN(inputValue)) {
      inputValue = Math.min(100, Math.max(0, inputValue));
    }
  }

  sendFeedBack() {
    this.spinner.show();
    let feedback: any = {};
    feedback['note'] = this.place.notes;
    feedback['placeId'] = this.placeId;
    feedback['buyboxId'] = +this.BuyBoxId;
    this.PlacesService.UpdateBuyBoxWorkSpacePlace(feedback).subscribe(
      (data) => {
        this.spinner.hide();
        this.showAlert = true;
        setTimeout(() => {
          this.showAlert = false;
        }, 3000);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    );
  }

  sendInterested(rate: number) {
    this.spinner.show();
    let feedback: any = {};
    feedback['placeId'] = this.placeId;
    feedback['IsAccepted'] = rate;
    feedback['buyboxId'] = +this.BuyBoxId;

    this.PlacesService.UpdatePlaceAcceptable(feedback).subscribe((data) => {
      this.getPlace(this.placeId);
      this.theRating = rate;
      this.spinner.hide();
    });
  }

  isActive(rate: any): boolean {
    return rate === this.theRating;
  }

  scrollToFeedback(el: HTMLElement) {
    el.scrollIntoView();
  }

  findMinMaxRent(data: any) {
    const rentMap = new Map();
    data.forEach((building: any) => {
      building.appartements.forEach((apartment: any) => {
        const { appartementType, rentPerMonth } = apartment;
        if (!rentMap.has(appartementType)) {
          // If the appartementType is not in the map, initialize it
          rentMap.set(appartementType, {
            minRent: rentPerMonth,
            maxRent: rentPerMonth,
          });
        } else { 
          rentMap.get(appartementType).minRent = Math.min(
            rentMap.get(appartementType).minRent,
            rentPerMonth
          ); 
          rentMap.get(appartementType).maxRent = Math.max(
            rentMap.get(appartementType).maxRent,
            rentPerMonth
          );
        }
      });
    });

    // Convert the rentMap to an array of objects
    const rentArray = Array.from(
      rentMap,
      ([appartementType, { minRent, maxRent }]) => ({
        appartementType,
        minRent,
        maxRent,
      })
    );
    return rentArray;
  }

  viewOnStreet() {
    let lat = this.place.streetLatitude;
    let lng = this.place.streetLongitude;
    let heading = this.place.heading || 165; // Default heading value
    let pitch = this.place.pitch || 0;       // Default pitch value
    // this.updateOpacity(mapdata);
    setTimeout(() => {
      const streetViewElement = document.getElementById('street-view');
      if (streetViewElement) {
        this.streetMap(lat, lng ,heading ,pitch);
      } else {
        console.error("Element with id 'street-view' not found.");
      }
    });
  }

  streetMap(lat: number, lng: number ,heading:number, pitch:number) {
    const streetViewElement = document.getElementById('street-view');
    if (streetViewElement) {
      const panorama = new google.maps.StreetViewPanorama(
        streetViewElement as HTMLElement,
        {
          position: { lat: lat, lng: lng },
          pov: { heading: heading, pitch: 0 }
        }
      );
    } else {
      console.error("Element with id 'street-view' not found in the DOM.");
    }
  }

  shareableLink!: string;
  SharePlace() {
    let share: any = {};
    share.BaseUrl = 'https://' + this.initDomain + '/landing';
    // share.BaseUrl = 'http://localhost:4200/landing' ;
    share.placeId = this.placeId;
    share.buyboxId = +this.BuyBoxId;
    this.PlacesService.SharePlace(share).subscribe((res) => {
      this.shareableLink = res.token;
    });
  }

  openShare(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'sm',
      scrollable: true,
    });
    this.General.modalObject = modalObject;
    this.SharePlace();
  }

  openMoreDetails(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.General.modalObject = modalObject;
  }

  // getValueOfPlace(stageName: string) {
  //   const propertyName = stageName;
  //   const value = this.place[propertyName];

  //   if (typeof value === 'number' && propertyName !== 'minHighwayDist') {
  //     return `${value.toFixed()} SF`;
  //   }

  //   if (propertyName == 'minHighwayDist' && value != null) {
  //     let x = value.toFixed(2);
  //     return Number(x);
  //   }

  //   return value;
  // }
}
