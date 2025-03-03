import { Injectable } from '@angular/core';
import { PlacesService } from './places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { StateService } from './state.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BuyboxCategory } from 'src/models/buyboxCategory';
import { Center } from 'src/models/shoppingCenters';
import { BbPlace } from 'src/models/buyboxPlaces';
import { ShareOrg } from 'src/models/shareOrg';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class ViewManagerService {
  dropdowmOptions: any = [
    {
      text: 'Map View',
      icon: '../../../assets/Images/Icons/map.png',
      status: 1,
    },
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
    {
      text: 'Social View',
      icon: '../../../assets/Images/Icons/globe-solid.svg',
      status: 5,
    },
  ];

  constructor(
    private placesService: PlacesService,
    private spinner: NgxSpinnerService,
    private stateService: StateService,
    private sanitizer: DomSanitizer
  ) {}

  // Common methods
  getShoppingCenters(buyboxId: number): Promise<Center[]> {
    return new Promise((resolve, reject) => {
      if (this.stateService.getShoppingCenters().length > 0) {
        resolve(this.stateService.getShoppingCenters());
        return;
      }

      this.spinner.show();
      const body: any = {
        Name: 'GetMarketSurveyShoppingCenters',
        Params: {
          BuyBoxId: buyboxId,
        },
      };

      this.placesService.GenericAPI(body).subscribe({
        next: (data) => {
          const centers = data.json;
          this.stateService.setShoppingCenters(centers);
          this.spinner.hide();
          resolve(centers);
        },
        error: (error) => {
          console.error('Error fetching shopping centers:', error);
          this.spinner.hide();
          reject(error);
        },
      });
    });
  }

  getBuyBoxPlaces(buyboxId: number): Promise<BbPlace[]> {
    return new Promise((resolve, reject) => {
      if (this.stateService.getBuyboxPlaces()?.length > 0) {
        resolve(this.stateService.getBuyboxPlaces());
        return;
      }

      const body: any = {
        Name: 'BuyBoxRelatedRetails',
        Params: {
          BuyBoxId: buyboxId,
        },
      };

      this.placesService.GenericAPI(body).subscribe({
        next: (data) => {
          const places = data.json;
          this.stateService.setBuyboxPlaces(places);
          resolve(places);
        },
        error: (error) => {
          console.error('Error fetching places:', error);
          reject(error);
        },
      });
    });
  }

  getBuyBoxCategories(buyboxId: number): Promise<BuyboxCategory[]> {
    return new Promise((resolve, reject) => {
      if (this.stateService.getBuyboxCategories().length > 0) {
        resolve(this.stateService.getBuyboxCategories());
        return;
      }

      const body: any = {
        Name: 'GetRetailRelationCategories',
        Params: {
          BuyBoxId: buyboxId,
        },
      };

      this.placesService.GenericAPI(body).subscribe({
        next: (data) => {
          const categories = data.json;
          this.stateService.setBuyboxCategories(categories);
          resolve(categories);
        },
        error: (error) => {
          console.error('Error fetching categories:', error);
          reject(error);
        },
      });
    });
  }

  getOrganizationById(orgId: number): Promise<ShareOrg[]> {
    return new Promise((resolve, reject) => {
      const shareOrg = this.stateService.getShareOrg() || [];

      if (shareOrg && shareOrg.length > 0) {
        resolve(this.stateService.getShareOrg());
        return;
      }

      const body: any = {
        Name: 'GetOrganizationById',
        Params: {
          organizationid: orgId,
        },
      };

      this.placesService.GenericAPI(body).subscribe({
        next: (data) => {
          const org = data.json;
          this.stateService.setShareOrg(org);
          resolve(org);
        },
        error: (error) => {
          console.error('Error fetching organization:', error);
          reject(error);
        },
      });
    });
  }

  deleteShoppingCenter(
    buyboxId: number,
    shoppingCenterId: number | string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.spinner.show();
      const body: any = {
        Name: 'DeleteShoppingCenterFromBuyBox',
        Params: {
          BuyboxId: buyboxId,
          ShoppingCenterId: shoppingCenterId,
        },
      };

      this.placesService.GenericAPI(body).subscribe({
        next: (data) => {
          resolve(data);
        },
        error: (error) => {
          console.error('Error deleting shopping center:', error);
          reject(error);
        },
        complete: () => {
          this.spinner.hide();
        },
      });
    });
  }

  // Map and Street View methods
  async initializeMap(
    elementId: string,
    lat: number,
    lng: number,
    zoom: number = 14
  ): Promise<any> {
    if (!lat || !lng) {
      console.error('Latitude and longitude are required to display the map.');
      return null;
    }

    try {
      const { Map } = (await google.maps.importLibrary('maps')) as any;
      const mapDiv = document.getElementById(elementId) as HTMLElement;

      if (!mapDiv) {
        console.error(`Element with ID "${elementId}" not found.`);
        return null;
      }

      const map = new Map(mapDiv, {
        center: { lat, lng },
        zoom: zoom,
      });

      // Create a new marker
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: 'Location Marker',
      });

      return map;
    } catch (error) {
      console.error('Error initializing map:', error);
      return null;
    }
  }

  initializeStreetView(
    elementId: string,
    lat: number,
    lng: number,
    heading: number = 165,
    pitch: number = 0
  ): any {
    const streetViewElement = document.getElementById(elementId);
    if (!streetViewElement) {
      console.error(`Element with id '${elementId}' not found.`);
      return null;
    }

    const panorama = new google.maps.StreetViewPanorama(
      streetViewElement as HTMLElement,
      {
        position: { lat, lng },
        pov: { heading, pitch },
        zoom: 1,
      }
    );

    this.addMarkerToStreetView(panorama, lat, lng);
    return panorama;
  }

  addMarkerToStreetView(panorama: any, lat: number, lng: number): void {
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

  sanitizeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // Utility methods
  getNearestCategoryName(
    categoryId: number,
    categories: BuyboxCategory[]
  ): string {
    const matchedCategories = categories.filter((x) => x.id == categoryId);
    return matchedCategories[0]?.name || '';
  }

  getShoppingCenterUnitSize(shoppingCenter: any): string {
    const formatNumberWithCommas = (number: number) => {
      return number.toLocaleString();
    };

    const formatLeasePrice = (price: any) => {
      if (price === 0 || price === 'On Request') return 'On Request';
      const priceNumber = Number.parseFloat(price);
      return !isNaN(priceNumber) ? Math.floor(priceNumber) : price;
    };

    const appendInfoIcon = (calculatedPrice: string, originalPrice: any) => {
      if (calculatedPrice === 'On Request') {
        return calculatedPrice;
      }
      const formattedOriginalPrice = `$${Number.parseFloat(
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
                  Math.floor((Number.parseFloat(leasePrice) * singleSize) / 12)
                )}/month`,
                shoppingCenter.ForLeasePrice
              )
            : 'On Request';
        return `Unit Size: ${formatNumberWithCommas(
          singleSize
        )} sq ft.<br>Lease price: ${resultPrice}`;
      }
      return '';
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

    const formattedMinPrice =
      minPrice === 'On Request'
        ? 'On Request'
        : appendInfoIcon(
            `$${formatNumberWithCommas(
              Math.floor((Number.parseFloat(minPrice) * minSize) / 12)
            )}/month`,
            minPrice
          );

    const formattedMaxPrice =
      maxPrice === 'On Request'
        ? 'On Request'
        : appendInfoIcon(
            `$${formatNumberWithCommas(
              Math.floor((Number.parseFloat(maxPrice) * maxSize) / 12)
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
      leasePriceRange = formattedMinPrice;
    } else {
      leasePriceRange = `${formattedMinPrice} - ${formattedMaxPrice}`;
    }

    return `Unit Size: ${sizeRange}<br> <b>Lease price</b>: ${leasePriceRange}`;
  }

  isLast(currentItem: any, array: any[]): boolean {
    return array.indexOf(currentItem) === array.length - 1;
  }
}
