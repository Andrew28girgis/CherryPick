import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Fbo, General, Property } from 'src/app/shared/models/domain';
import { Branch } from 'src/app/shared/models/branches';
declare const google: any;
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LandingPlace, OtherPlace } from 'src/app/shared/models/landingPlace';
import { NearByType } from 'src/app/shared/models/nearBy';
import { DomSanitizer } from '@angular/platform-browser';
import {
  PlaceCotenants,
  ShoppingCenterTenant,
} from 'src/app/shared/models/PlaceCo';
import { BuyboxOrg } from 'src/app/shared/models/buyboxOrg';
import { OrgBranch } from 'src/app/shared/models/branches';
import { permission } from 'src/app/shared/models/permission';
import { Enriche } from 'src/app/shared/models/enriche';
import { PlacesService } from 'src/app/core/services/places.service';
import { BreadcrumbService } from 'src/app/core/services/breadcrumb.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent {
  General!: General;
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
  // BuyBoxId!: number;
  contactId!: number;
  showFirstCol = true; // Toggle to false to hide the first col-md-7
  mapViewOnePlacex!: boolean;
  PlaceId!: number;
  CustomPlace!: LandingPlace;
  ShoppingCenter!: any;
  NearByType: NearByType[] = [];
  placeImage: string[] = [];
  placeCotenants: PlaceCotenants[] = [];
  ShoppingCenterId!: number;
  StandAlonePlace!: OtherPlace | null | undefined;
  BuyboxOrg!: BuyboxOrg;
  OrganizationBranches!: OrgBranch;
  uniqueCategories!: any[];
  filterCotenats: PlaceCotenants[] = [];
  OrgId!: number;
  sanitizedUrl: any;
  sanitizedUrlPopup: any;
  placesRepresentative: boolean | undefined;
  Permission: permission[] = [];
  windowHistrony: any;
  enriche!: Enriche;
  placeId!: any;
  shoppingId!: any;
  campaignId!: any;
  isMapView = true;
  tenant: ShoppingCenterTenant[] = [];
  tenantGroups = {
    onSite: [] as ShoppingCenterTenant[],
    veryShort: [] as ShoppingCenterTenant[],
    walking: [] as ShoppingCenterTenant[],
    longer: [] as ShoppingCenterTenant[],
  };
  categoryIcons: { [key: string]: string } = {

  };

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private sanitizer: DomSanitizer,
    private breadcrumbService: BreadcrumbService
  ) {
    localStorage.removeItem('placeLat');
    localStorage.removeItem('placeLon');
  }

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      this.placeId = params.get('placeId');
      this.shoppingId = params.get('shoppingId');
      this.campaignId = params.get('campaignId');
    });

    this.windowHistrony = window.history.length;
    this.initializeParams();
    this.initializeDefaults();

    this.breadcrumbService.addBreadcrumb({
      label: 'Details',
      url: `/landing/${this.placeId}/${this.shoppingId}/${this.campaignId}`,
    });
  }

  // GetCustomSections(): void {
  //   const body: any = {
  //     Name: 'GetCustomSections',
  //     Params: {
  //       CampaignId: this.campaignId,
  //     },
  //   };

  //   this.PlacesService.GenericAPI(body).subscribe({
  //     next: (data) => {
  //       this.Permission = data.json;
  //       this.placesRepresentative = this.Permission?.find(
  //         (item: permission) => item.sectionName === 'PlacesRepresentative'
  //       )?.visible;
  //     },
  //   });
  // }

  private initializeParams(): void {
    this.activatedRoute.params.subscribe((params: any) => {
      this.campaignId = params.campaignId;
      this.PlaceId = params.id;
      this.ShoppingCenterId = params.shoppiongCenterId;
      // this.OrgId = params.orgId;
      // this.GetCustomSections();
      if (this.ShoppingCenterId != 0) {
        this.GetBuyBoxOrganizationDetails(this.ShoppingCenterId, 0);

        this.GetPlaceDetails(0, this.ShoppingCenterId);
      } else {
        this.GetBuyBoxOrganizationDetails(this.ShoppingCenterId, this.PlaceId);

        this.GetPlaceDetails(this.PlaceId, 0);
      }
      this.GetPlaceCotenants(this.PlaceId);
    });
  }

  private initializeDefaults(): void {
    this.General = new General();
    this.place = new Property();
    this.fbo = new Fbo();
    this.CustomPlace = new LandingPlace();
    this.showAlert = false;
  }

  GetPlaceDetails(placeId: number, ShoppingcenterId: number): void {
    const body: any = {
      Name: 'GetShoppingCenterDetails',
      Params: {
        PlaceID: placeId,
        shoppingcenterId: ShoppingcenterId,
        CampaignId: this.campaignId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.CustomPlace = data.json?.[0] || null;
        this.initializeMap(this.CustomPlace.Latitude, this.CustomPlace.Longitude);
  this.streetMap(
        this.CustomPlace.Latitude,
        this.CustomPlace.Longitude,
      );
        if (this.ShoppingCenter && this.ShoppingCenter.Images) {
          this.placeImage = this.ShoppingCenter.Images?.split(',').map(
            (link: any) => link.trim()
          );

          if (this.CustomPlace.OtherPlaces) {
            this.StandAlonePlace = this.CustomPlace.OtherPlaces[0];
            this.StandAlonePlace.PopulationDensity =
              +this.StandAlonePlace.PopulationDensity;
          }

          this.getMinMaxUnitSize();

          this.ShoppingCenter.StreetViewURL
            ? this.changeStreetView(this.ShoppingCenter)
            : this.viewOnStreet();
        } else {
          this.StandAlonePlace?.StreetViewURL
            ? this.changeStreetView(this.StandAlonePlace)
            : this.viewOnStreet();
        }
        this.GetPlaceNearBy(this.PlaceId);
      },
    });
  }

  GetPlaceCotenants(placeId: number): void {
    const body: any = {
      Name: 'GetPlaceCotenants',
      Params: {
        ShoppingCenterId: this.ShoppingCenterId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        const tenants: ShoppingCenterTenant[] = data.json || [];

        this.tenantGroups = {
          onSite: tenants
            .filter((t) => t.Distance >= 0 && t.Distance < 100)
            .sort((a, b) => a.Distance - b.Distance),
          veryShort: tenants
            .filter((t) => t.Distance >= 100 && t.Distance < 400)
            .sort((a, b) => a.Distance - b.Distance),

          walking: tenants
            .filter((t) => t.Distance >= 400 && t.Distance < 800)
            .sort((a, b) => a.Distance - b.Distance),

          longer: tenants
            .filter((t) => t.Distance >= 800 && t.Distance <= 1200)
            .sort((a, b) => a.Distance - b.Distance),
        };
      },
    });
  }

  filterCotent(event: any) {
    const value = event.target.value;
    if (value === 'All') {
      this.filterCotenats = this.placeCotenants;
    } else {
      this.filterCotenats = this.placeCotenants.filter((co) => {
        return co.SubCategory[0].OrganizationCategory === value;
      });
    }
  }

  GetBuyBoxOrganizationDetails(
    Shoppingcenterid: number,
    PlaceId: number
  ): void {
    const body: any = {
      Name: 'GetBuyBoxOrganizationDetails',
      Params: {
        shoppingcenterid: +Shoppingcenterid,
        placeId: +PlaceId,
        CampaignId: this.campaignId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        if (data.json) {
          this.OrganizationBranches = data.json[0];
        }
      },
    });
  } 

  changeStreetView(place: any) {
    this.sanitizedUrl = '';

    if (place.StreetViewURL) {
      this.setIframeUrl(place.StreetViewURL);
    } else {
      this.streetMap(
        place.StreetLatitude,
        place.StreetLongitude,
        place.Heading,
        0
      );
    }
  }

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  setIframeUrlPopup(url: string): void {
    this.sanitizedUrlPopup = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnChanges() {
    if (this.StandAlonePlace?.StreetViewURL) {
      this.setIframeUrl(this.StandAlonePlace.StreetViewURL);
    }
  }

  getMinMaxUnitSize() {
    if (this.CustomPlace.OtherPlaces) {
      const places = this.CustomPlace.OtherPlaces;
      if (places.length > 0) {
        const buildingSizes = places
          .map((place: any) => place.BuildingSizeSf)
          .filter(
            (size: any) => size !== undefined && size !== null && !isNaN(size)
          );

        if (buildingSizes.length === 0) {
          return null;
        }

        const minSize = Math.min(...buildingSizes);
        const maxSize = Math.max(...buildingSizes);
        let minPrice = null;
        let maxPrice = null;

        for (let place of places) {
          if (place.BuildingSizeSf === minSize) {
            minPrice = place.ForLeasePrice;
          }
          if (place.BuildingSizeSf === maxSize) {
            maxPrice = place.ForLeasePrice;
          }
        }

        const calculateLeasePrice = (price: any, size: any) => {
          if (price === 'On Request' || price === 0 || size === 0) {
            return '<b>On Request</b>';
          }
          const pricePerSF = parseFloat(price);
          const unitSize = parseFloat(size);
          if (!isNaN(pricePerSF) && !isNaN(unitSize)) {
            const monthlyLease = Math.floor((pricePerSF * unitSize) / 12);
            return `<b>$${monthlyLease.toLocaleString()}</b>/month`;
          }
          return '<b>On Request</b>';
        };

        const formatNumberWithCommas = (number: number) => {
          return `<b>${number.toLocaleString()}</b>`;
        };

        const appendInfoIcon = (
          calculatedPrice: string,
          originalPrice: any
        ) => {
          if (calculatedPrice === '<b>On Request</b>') {
            return calculatedPrice;
          }

          const formattedOriginalPrice = `<b>$${parseFloat(
            originalPrice
          ).toLocaleString()}</b>/sq ft./year`;

          // Adjust inline styles as desired
          return `
            <div style="display:flex;">
              <p class="mx-2"> ${formattedOriginalPrice},   ${calculatedPrice}  </p> 
            </div>
          `;
        };

        // If minSize and maxSize are the same
        if (minSize === maxSize) {
          const formattedPrice = minPrice
            ? appendInfoIcon(calculateLeasePrice(minPrice, minSize), minPrice)
            : '<b>On Request</b>';
          return `Unit Size:  <p class="px-2 mb-0"> ${formatNumberWithCommas(
            minSize
          )}sq ft. </p>  <p class="px-2 m-0"> Lease Price: ${formattedPrice} </p>`;
        }

        let sizeRange = `Unit Size:  <p class="px-2 mb-0"> ${formatNumberWithCommas(
          minSize
        )}</p> sq ft. - <p class="px-2 mb-0" >${formatNumberWithCommas(
          maxSize
        )} sq ft. </p>`;

        // Calculate lease prices for min and max
        const minLeasePrice = minPrice
          ? appendInfoIcon(calculateLeasePrice(minPrice, minSize), minPrice)
          : '<b>On Request</b>';
        const maxLeasePrice = maxPrice
          ? appendInfoIcon(calculateLeasePrice(maxPrice, maxSize), maxPrice)
          : '<b>On Request</b>';

        // Handle display of prices
        let leasePriceRange: string;
        if (
          minLeasePrice === '<b>On Request</b>' &&
          maxLeasePrice === '<b>On Request</b>'
        ) {
          leasePriceRange = '<b>On Request</b>';
        } else if (minLeasePrice === '<b>On Request</b>') {
          leasePriceRange = `${maxLeasePrice}`;
        } else if (maxLeasePrice === '<b>On Request</b>') {
          leasePriceRange = `${minLeasePrice}`;
        } else {
          leasePriceRange = `${minLeasePrice} - ${maxLeasePrice}`;
        }

        return `${sizeRange} Lease Price: ${leasePriceRange}`;
      }
    }
    return null;
  }

  GetPlaceNearBy(placeId: number): void {
    const body: any = {
      Name: 'GetNearBuyRetails',
      Params: {
        PlaceID: placeId,
        ShoppingCenterId: this.ShoppingCenterId,
        CampaignId: this.campaignId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.NearByType = data.json;
        //this.getAllMarker();
      },
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

      if (this.NearByType && this.NearByType.length > 0) {
        this.NearByType.forEach((type) => {
          type.Branches.slice(0, 5).forEach((place) => {
            this.createMarker(map, place, type.Name);
          });
        });
      }
      if (
        this.OrganizationBranches?.Branches &&
        this.OrganizationBranches.Branches.length > 0
      ) {
        this.OrganizationBranches.Branches.forEach((Branch) => {
          this.getCityAndState(Branch);
          this.createMarker(map, Branch, 'Branch');
        });
      }
    } finally {
    }
  }
  getCityAndState(Branch: Branch) {
    const lat = Branch.Latitude;
    const lon = Branch.Longitude;
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        Branch.City =
          data.address.city || data.address.town || data.address.village;
        Branch.State = data.address.state;
      });
  }

  getLatitude(): any {
    return this.ShoppingCenter
      ? +this.ShoppingCenter.Latitude
      : this.StandAlonePlace?.Latitude;
  }

  getLongitude(): any {
    return this.ShoppingCenter
      ? +this.ShoppingCenter.Longitude
      : this.StandAlonePlace?.Longitude;
  }

async initializeMap(lat: number, lon: number): Promise<any> {
  // Use Promise.all to import multiple libraries efficiently
  const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
    google.maps.importLibrary('maps'),
    google.maps.importLibrary('marker'),
  ]);

  // Define the position for the map center and marker
  const position = { lat: lat || 0, lng: lon || 0 };

  const map = new Map(document.getElementById('map') as HTMLElement, {
    center: position,
    zoom: 13,
    // A mapId is required for using Advanced Markers
    mapId: 'YOUR_MAP_ID', 
  });

  // Create and add the marker to the map
  const marker = new AdvancedMarkerElement({
    map: map,
    position: position,
    title: 'This is a marker!',
  });

  return map;
}

  addMarkerForPrimaryLocation(map: any) {
    const primaryLocation = this.CustomPlace;
  
    
    
    const type = this.CustomPlace ? 'Shopping Center' : 'Stand Alone';
    this.createMarker(map, primaryLocation, type);

  }

  private currentlyOpenInfoWindow: any | null = null;

  createMarker(map: any, markerData: any, type: string): void {
    const marker = this.initializeMarker(map, markerData, type);
    //const infoWindow = this.initializeInfoWindow(markerData, type);
    //this.addMarkerClickListener(marker, map, infoWindow);
    //this.addCloseButtonListener(infoWindow, marker);

    this.addMapClickListener(map);
  }

  // Method to initialize a marker with custom icon and position
  private initializeMarker(map: any, markerData: any, type: string): any {
    //const icon = this.getIcon(markerData, type);
      console.log(`777`);
    console.log(markerData);
    return new google.maps.Marker({
      map,
      position: { lat: +markerData?.Latitude, lng: +markerData?.Longitude },
      //icon: icon,
      zIndex: 999999,
    });
  }

  // Method to initialize an InfoWindow
  private initializeInfoWindow(markerData: any, type: string): any {
    return new google.maps.InfoWindow({
      content: this.getInfoWindowContent(markerData, type),
    });
  }

  // Method to add a click listener to the marker
  private addMarkerClickListener(marker: any, map: any, infoWindow: any): void {
    marker.addListener('click', () => {
      if (this.currentlyOpenInfoWindow) {
        this.currentlyOpenInfoWindow.close();
      }

      // Open the new InfoWindow
      infoWindow.open(map, marker);
      this.currentlyOpenInfoWindow = infoWindow; // Track the currently open InfoWindow
    });
  }

  // Method to handle the close button click events within the InfoWindow
  private addCloseButtonListener(infoWindow: any, marker: any): void {
    google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
      const closeButton = document.getElementById(`close-btn-${marker.id}`);

      if (closeButton) {
        closeButton.addEventListener('click', () => {
          infoWindow.close();
          if (this.currentlyOpenInfoWindow === infoWindow) {
            this.currentlyOpenInfoWindow = null;
          }
        });
      }
    });
  }

  // Method to add a click listener to the map to close any open InfoWindow when clicking outside
  private addMapClickListener(map: any): void {
    google.maps.event.addListener(map, 'click', (event: any) => {
      if (this.currentlyOpenInfoWindow) {
        this.currentlyOpenInfoWindow.close();
        this.currentlyOpenInfoWindow = null; // Reset the currently open InfoWindow reference
      }
    });
  }

  getIcon(markerData: any, type: string): any {
    const defaultIconUrl = this.getArrowSvg();
    if (type === 'Shopping Center' || type === 'Stand Alone') {
      return {
        url: defaultIconUrl,
        scaledSize: new google.maps.Size(60, 60),
      };
    } else {
      return {
        url: `https://api.cherrypick.com/api/Organization/GetOrgImag?orgId=${markerData.OrganizationId}`,
        scaledSize: new google.maps.Size(30, 30),
      };
    }
  }

  getInfoWindowContent(markerData: any, type: string): string {
    if (type === 'Shopping Center') {
      return this.getShoppingCenterInfoWindowContent(markerData);
    } else if (type === 'Stand Alone') {
      return this.getOtherPlaceInfoWindowContent(markerData);
    }

    return this.getIconsContent(markerData);
  }

  private getShoppingCenterInfoWindowContent(markerData: any): string {
    return `
    <div class="info-window">
      <div class="main-img">
        <img src="${markerData.MainImage}" alt="Main Image">
        <span class="close-btn" id="close-btn-${markerData.id}">&times;</span>
      </div>
      <div class="content-wrap">
        ${
          markerData.CenterName
            ? `<p class="content-title">${markerData.CenterName.toUpperCase()}</p>`
            : ''
        }
        <p class="address-content">
          <svg class="me-2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.9999 11.1917C11.4358 11.1917 12.5999 10.0276 12.5999 8.5917C12.5999 7.15576 11.4358 5.9917 9.9999 5.9917C8.56396 5.9917 7.3999 7.15576 7.3999 8.5917C7.3999 10.0276 8.56396 11.1917 9.9999 11.1917Z" stroke="#817A79" stroke-width="1.5"/>
            <path d="M3.01675 7.07484C4.65842 -0.141827 15.3501 -0.133494 16.9834 7.08317C17.9417 11.3165 15.3084 14.8998 13.0001 17.1165C11.3251 18.7332 8.67508 18.7332 6.99175 17.1165C4.69175 14.8998 2.05842 11.3082 3.01675 7.07484Z" stroke="#817A79" stroke-width="1.5"/>
          </svg>
          ${markerData.CenterAddress}, ${markerData.CenterCity}, ${
      markerData.CenterState
    }
    ${
      markerData.OtherPlaces &&
      markerData.OtherPlaces.length > 0 &&
      markerData.OtherPlaces[0].BuildingSizeSf !== undefined &&
      !isNaN(markerData.OtherPlaces[0].BuildingSizeSf)
        ? `
      <p class="address-content">
        Unit Size: ${this.formatNumberWithCommas(
          markerData.OtherPlaces[0].BuildingSizeSf
        )} SF
      </p>
    `
        : ''
    }

    <p class="address-content">
        Lease price: ${markerData.OtherPlaces[0].ForLeasePrice}
    </p> 
      </div>
    </div>
  `;
  }

  private getOtherPlaceInfoWindowContent(markerData: any): string {
    return `
    <div class="info-window">
      <div class="main-img">
        <img src="${markerData.MainImage}" alt="Main Image">
        <span class="close-btn" id="close-btn-${markerData.id}">&times;</span>
      </div>
      <div class="content-wrap">
        <p class="address-content">${this.getAddressContentStandAlone(
          markerData
        )}</p>

        <p class="address-content"> 
          Unit Size: ${this.formatNumberWithCommas(
            markerData.BuildingSizeSf
          )} SF
        </p>

        <p class="address-content"> 
          Lease Price: ${markerData.ForLeasePrice} 
        </p>
      </div> 
    </div>
  `;
  }

  private getIconsContent(markerData: any): string {
    return `
    <div class="info-window p-0">
        <div> 
        <div style="padding:9px">
           <span class="close-btn" id="close-btn-${
             markerData.id
           }">&times;</span>
        </div>
            <div>
              <p style="font-size: 19px; font-weight: 500; margin:0; padding:15px">${
                markerData.RelationOrganization[0].Name
              }: ${markerData.RelationOrganization[0].Distance.toFixed(
      2
    )} MI</p>
            </div>
          </div>
    </div>
  `;
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

        // Helper function to format lease price
        const formatLeasePrice = (price: any) => {
          return price === 'On Request' ? 'On Request' : price;
        };

        // Check if min and max sizes are the same
        if (minSize === maxSize) {
          return minPrice
            ? `Unit Size: ${this.formatNumberWithCommas(
                minSize
              )} SF<br>Lease Price: ${formatLeasePrice(minPrice)}`
            : `Unit Size: ${this.formatNumberWithCommas(minSize)} SF`;
        }

        if (
          minPrice === maxPrice ||
          minPrice === 'On Request' ||
          maxPrice === 'On Request'
        ) {
          return minPrice
            ? `Unit Size: ${this.formatNumberWithCommas(
                minSize
              )} SF - ${this.formatNumberWithCommas(
                maxSize
              )} SF<br>Lease Price: ${formatLeasePrice(minPrice)}`
            : `Unit Size: ${this.formatNumberWithCommas(
                minSize
              )} SF - ${this.formatNumberWithCommas(maxSize)} SF`;
        }

        let sizeRange = `Unit Size: ${this.formatNumberWithCommas(
          minSize
        )} SF - ${this.formatNumberWithCommas(maxSize)} SF`;
        // Avoid range like "On Request - $55 SF/YR" by checking if either value is "On Request"
        if (minPrice && maxPrice) {
          if (minPrice === 'On Request' || maxPrice === 'On Request') {
            sizeRange += `<br>Lease Price: On Request`;
          } else {
            sizeRange += `<br>Lease Price: ${minPrice} - ${maxPrice}`;
          }
        } else if (minPrice) {
          sizeRange += `<br>Lease Price: ${formatLeasePrice(minPrice)}`;
        } else if (maxPrice) {
          sizeRange += `<br>Lease Price: ${formatLeasePrice(maxPrice)}`;
        }
        return sizeRange;
      }
    } else {
      let sizeRange = `Unit Size: ${this.formatNumberWithCommas(
        shoppingCenter.BuildingSizeSf
      )} SF`;

      if (shoppingCenter.ForLeasePrice) {
        sizeRange += `<br>Lease Price: ${
          shoppingCenter.ForLeasePrice === 'On Request'
            ? 'On Request'
            : shoppingCenter.ForLeasePrice
        }`;
      }
      return sizeRange;
    }
    return null;
  }

  getLeasePriceStandAlone(StandALone: any) {
    let leasePrice =
      '$' +
      this.formatNumberWithCommas(
        Math.floor((StandALone.ForLeasePrice * StandALone.BuildingSizeSf) / 12)
      ) +
      '/month';

    return leasePrice;
  }

  getAddressContentStandAlone(markerData: any): string {
    return `<svg class="me-2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.9999 11.1917C11.4358 11.1917 12.5999 10.0276 12.5999 8.5917C12.5999 7.15576 11.4358 5.9917 9.9999 5.9917C8.56396 5.9917 7.3999 7.15576 7.3999 8.5917C7.3999 10.0276 8.56396 11.1917 9.9999 11.1917Z" stroke="#817A79" stroke-width="1.5"/>
            <path d="M3.01675 7.07484C4.65842 -0.141827 15.3501 -0.133494 16.9834 7.08317C17.9417 11.3165 15.3084 14.8998 13.0001 17.1165C11.3251 18.7332 8.67508 18.7332 6.99175 17.1165C4.69175 14.8998 2.05842 11.3082 3.01675 7.07484Z" stroke="#817A79" stroke-width="1.5"/>
          </svg> ${markerData.Address}, ${markerData.City}, ${markerData.State}`;
  }

  addInfoWindowListeners(marker: any, infoWindow: any) {
    marker.addListener('click', () => {
      infoWindow.open({
        anchor: marker,
        map: marker.getMap(),
        shouldFocus: false,
      });
    });
  }

  private getArrowSvg(): string {
    return (
      'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
       <path d="M27.4933 11.2666C26.0933 5.10659 20.72 2.33325 16 2.33325C16 2.33325 16 2.33325 15.9867 2.33325C11.28 2.33325 5.89334 5.09325 4.49334 11.2533C2.93334 18.1333 7.14667 23.9599 10.96 27.6266C12.3733 28.9866 14.1867 29.6666 16 29.6666C17.8133 29.6666 19.6267 28.9866 21.0267 27.6266C24.84 23.9599 29.0533 18.1466 27.4933 11.2666ZM16 17.9466C13.68 17.9466 11.8 16.0666 11.8 13.7466C11.8 11.4266 13.68 9.54658 16 9.54658C18.32 9.54658 20.2 11.4266 20.2 13.7466C20.2 16.0666 18.32 17.9466 16 17.9466Z" fill="#FF4C4C"/>
        </svg>
    `)
    );
  }
  sendEmojFeedBack(reaction: number) {
    const body: any = {
      Name: 'CreatePropertyReaction',
      Params: {
        reactionId: reaction,
        // marketsurveyid: this.marketsurveyid,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {},
    });
  }

  // sendFeedBack(reaction: string) {
  //   this.place.reaction = reaction;
  //   let feedback: any = {};
  //   feedback['note'] = this.place.feedBack;
  //   feedback['placeId'] = this.PlaceId;

  //   if (reaction != '') {
  //     feedback['Reaction'] = reaction;
  //   }
  //   feedback['buyboxId'] = +this.BuyBoxId;
  //   this.PlacesService.UpdateBuyBoxWorkSpacePlace(feedback).subscribe(
  //     (data) => {
  //       this.showAlert = true;
  //       if (reaction == '') {
  //         setTimeout(() => {
  //           this.showAlert = false;
  //         }, 3000);
  //         window.scrollTo({ top: 0, behavior: 'smooth' });
  //       }
  //     }
  //   );
  // }

  // viewOnStreet() {
  //   let lat = this.getStreetLat();
  //   let lng = this.getStreetLong();
  //   let heading = this.getStreetHeading() || 165;
  //   let pitch = this.getStreetPitch() || 0;

  //   setTimeout(() => {
  //     const streetViewElement = document.getElementById('street-view');
  //     if (streetViewElement) {
  //       this.streetMap(lat, lng, heading, pitch);
  //     } else {
  //     }
  //   });
  // }

  getStreetLat(): any {
    return this.ShoppingCenter
      ? +this.ShoppingCenter.StreetLatitude
      : this.StandAlonePlace?.StreetLatitude;
  }

  getStreetLong(): any {
    return this.ShoppingCenter
      ? +this.ShoppingCenter.StreetLongitude
      : this.StandAlonePlace?.StreetLongitude;
  }

  getStreetHeading(): number {
    return this.ShoppingCenter
      ? +this.ShoppingCenter.Heading
      : +this.CustomPlace?.OtherPlaces?.[0]?.Heading;
  }

  getStreetPitch(): number {
    return this.ShoppingCenter
      ? +this.ShoppingCenter.Pitch
      : +this.CustomPlace?.OtherPlaces?.[0]?.Pitch;
  }

  streetMap(lat: number, lng: number, heading?: number, pitch?: number) {
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
    }
  }

  open(content: any, modalObject?: any) {
    this.enriche = new Enriche();
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.enriche.taskId = modalObject;
  }

  openMapViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.viewOnMap(modalObject.Latitude, modalObject.Longitude);
  }
  @ViewChild('galleryModal', { static: true }) galleryModal: any;

  openGallery() {
    this.modalService.open(this.galleryModal, { size: 'xl', centered: true });
  }

  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true;
    if (!lat || !lng) {
      return;
    }
    const { Map } = (await google.maps.importLibrary('maps')) as any;

    const mapDiv = document.getElementById('mapInPopup') as HTMLElement;

    if (!mapDiv) {
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
    // Always use coords (no URL path here)
    this.sanitizedUrlPopup = null;
    this.StreetViewOnePlace = true; // turns on the *ngIf for the div
    this.General.modalObject = modalObject; // used for heading/pitch if you have them

    const modalRef = this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });

    // When the modal is in the DOM and sized, create the panorama
    this.waitForElementSize('#street-view-pop')
      .then(() => this.viewOnStreetPopUp())
      .catch(() => {
        /* no-op or toast */
      });

    modalRef.result.finally(() => {
      this.StreetViewOnePlace = false;
    });
  }

  private waitForElementSize(
    selector: string,
    tries = 40,
    interval = 50
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setInterval(() => {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
          clearInterval(timer);
          resolve();
        } else if (--tries <= 0) {
          clearInterval(timer);
          reject(new Error(`Element ${selector} not sized in time`));
        }
      }, interval);
    });
  }
  viewOnStreet() {
    // Read from ShoppingCenter first, fallback to StandAlonePlace
    const lat = Number(
      this.ShoppingCenter?.Latitude ?? this.StandAlonePlace?.Latitude
    );
    const lng = Number(
      this.ShoppingCenter?.Longitude ?? this.StandAlonePlace?.Longitude
    );

    // Safe defaults
    const heading = Number(this.ShoppingCenter?.Heading ?? 165);
    const pitch = Number(this.ShoppingCenter?.Pitch ?? 0);

    // Make sure the div has size before creating the panorama
    this.waitForElementSize('#street-view')
      .then(() => {
        const el = document.getElementById('street-view');
        if (!el || isNaN(lat) || isNaN(lng)) return;

        const pano = new google.maps.StreetViewPanorama(el, {
          position: { lat, lng },
          pov: { heading, pitch },
          zoom: 1,
        });

        // small nudge in case of CSS transitions
        setTimeout(() => google.maps.event.trigger(pano, 'resize'), 0);
      })
      .catch(() => {
        /* no-op or toast */
      });
  }
  onStreetToggle() {
    // If you previously showed an iframe, blank it so the div renders
    this.sanitizedUrl = null;
    // Render Street View into #street-view using the ShoppingCenter coords
    this.viewOnStreet();
  }

  StreetViewOnePlace!: boolean;

  viewOnStreetPopUp() {
    // Prefer explicit Street coords if you have them; otherwise use main lat/lng
    const lat = Number(
      this.General.modalObject?.StreetLatitude ??
        this.General.modalObject?.Latitude ??
        this.ShoppingCenter?.Latitude ??
        this.StandAlonePlace?.Latitude
    );
    const lng = Number(
      this.General.modalObject?.StreetLongitude ??
        this.General.modalObject?.Longitude ??
        this.ShoppingCenter?.Longitude ??
        this.StandAlonePlace?.Longitude
    );

    const heading = Number(
      this.General.modalObject?.Heading ?? this.ShoppingCenter?.Heading ?? 165
    );
    const pitch = Number(
      this.General.modalObject?.Pitch ?? this.ShoppingCenter?.Pitch ?? 0
    );

    const el = document.getElementById('street-view-pop');
    if (!el || isNaN(lat) || isNaN(lng)) return;

    const pano = new google.maps.StreetViewPanorama(el, {
      position: { lat, lng },
      pov: { heading, pitch },
      zoom: 1,
    });

    setTimeout(() => google.maps.event.trigger(pano, 'resize'), 0);
  }

  streetMapPopup(lat: number, lng: number, heading: number, pitch: number) {
    const streetViewElement = document.getElementById('street-view-pop');
    if (streetViewElement) {
      const panorama = new google.maps.StreetViewPanorama(
        streetViewElement as HTMLElement,
        {
          position: { lat: lat, lng: lng },
          pov: { heading: heading, pitch: pitch }, // Dynamic heading and pitch
          zoom: 1,
        }
      );
      this.addMarkerToStreetView(panorama, lat, lng);
    } else {
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
      animation: google.maps.Animation.DROP, // Animated drop effect
    });
  }

  goBack() {
    window.history.back();
  }

  getBackgroundImage(): string {
    const imageUrl =
      this.CustomPlace?.MainImage || this.StandAlonePlace?.MainImage;
    return imageUrl ? `url(${imageUrl}) no-repeat center center / cover` : '';
  }

  getAddress(): string {
    const capitalizeFirst = (value: string) =>
      value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : '';

    const addressParts = [
      this.ShoppingCenter?.CenterAddress,
      capitalizeFirst(this.ShoppingCenter?.CenterCity),
      this.ShoppingCenter?.CenterState.toUpperCase(),
    ];

    return addressParts
      ? addressParts.filter(Boolean).join(', ')
      : 'Address not available';
  }
  onImageError(event: any) {
    event.target.src =
      'https://d2jhcfgvzjqsa8.cloudfront.net/storage/2022/04/download.png';
  }
  checkImage(event: Event) {
    const img = event.target as HTMLImageElement;

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      ).data;

      let isWhite = true;
      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];
        if (!(r > 240 && g > 240 && b > 240 && a > 0)) {
          isWhite = false;
          break;
        }
      }

      if (isWhite) {
        img.src = 'assets/Images/placeholder.png';
      }
    } catch (err) {
      console.warn('Canvas image data blocked due to CORS:', err);
      if (img.naturalWidth <= 5 && img.naturalHeight <= 5) {
        img.src =
          'https://d2jhcfgvzjqsa8.cloudfront.net/storage/2022/04/download.png';
      }
    }
  }
  isTextTruncated(text: string): boolean {
    const testElement = document.createElement('span');
    testElement.style.visibility = 'hidden';
    testElement.style.whiteSpace = 'nowrap';
    testElement.innerHTML = text;
    document.body.appendChild(testElement);

    const textWidth = testElement.offsetWidth;
    const container = document.querySelector('.contact-info') as HTMLElement;
    const containerWidth = container?.offsetWidth || 0;

    document.body.removeChild(testElement);

    return textWidth > containerWidth;
  }
  getInitials(firstName: string, secondName: string): string {
    const name = firstName + ' ' + secondName;
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  getInitial(name: string): string {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }
 

  getCategoryIcon(category: string): string {
    if (!category) return this.categoryIcons['unknown'];

    const key = category.toLowerCase();
  
    // Try exact match first
    if (this.categoryIcons[key]) {
      return this.categoryIcons[key];
    }
  
    // If not exact, try substring match
    for (const iconKey in this.categoryIcons) {
      if (key.includes(iconKey)) {
        return this.categoryIcons[iconKey];
      }
    }
  
    // Fallback
    return this.categoryIcons['unknown'];
  }
  
  hasContacts(): boolean {
    return !!this.CustomPlace?.Contacts?.some(
      c => c.FirstName || c.LastName || c.Email
    );
  }
  
}
