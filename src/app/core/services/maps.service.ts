import { Injectable } from '@angular/core';
import { BuyboxCategory } from 'src/app/shared/models/buyboxCategory';
declare const google: any;
import { Router } from '@angular/router';
import { permission } from 'src/app/shared/models/permission';
import { PlacesService } from './places.service';
import { StateService } from './state.service';

@Injectable({
  providedIn: 'root',
})
export class MapsService {
  storedBuyBoxId: any;
  storedOrgId: any;
  private markers: any[] = [];
  private prosMarkers: any[] = [];
  private markerMap: { [key: string]: any[] } = {};
  private openInfoWindow: any | null = null;
  private map: any;
  placesRepresentative: boolean | undefined;
  Permission: permission[] = [];

  constructor(
    public router: Router,
    private PlacesService: PlacesService,
    private stateService: StateService
  ) {}

  // Add this method to get all markers
  getAllMarkers(): google.maps.Marker[] {
    return this.markers;
  }

  createMarker(map: any, markerData: any, type: string): any {
    this.map = map;
    const icon = this.getArrowSvg();
    const marker = new google.maps.Marker({
      map,
      position: {
        lat: Number(markerData.Latitude),
        lng: Number(markerData.Longitude),
      },
      icon: icon,
      // Use a higher zIndex to bring the marker “on top” of others
      zIndex: 999999,
    });

    marker.markerData = markerData;
    marker.type = type;
    this.markers.push(marker);
    this.assignToMarkerArray(marker, type);

    const infoWindow = this.createInfoWindow(markerData, type);
    this.addMarkerEventListeners(marker, infoWindow);

    return marker;
  }

  private addMarkerEventListeners(marker: any, infoWindow: any): void {
    marker.addListener('click', () => {
      this.handleMarkerClick(marker, infoWindow);
    });
    google.maps.event.addListener(this.map, 'click', (event: any) => {
      if (this.openInfoWindow) {
        this.openInfoWindow.close();
        this.openInfoWindow = null;
      }
    });
  }

  private handleMarkerClick(marker: any, infoWindow: any): void {
    if (this.openInfoWindow && this.openInfoWindow !== infoWindow) {
      this.openInfoWindow.close();
    }

    infoWindow.open(this.map, marker);
    infoWindow.marker = marker;
    this.openInfoWindow = infoWindow;

    google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
      this.addViewDetailsButtonListener(marker);
      this.addCloseButtonListener(infoWindow);
    });
  }

  private addCloseButtonListener(infoWindow: any): void {
    const closeButton = document.querySelector('.close-btn');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        infoWindow.close();
        this.openInfoWindow = null;
      });
    }
  }

  private addViewDetailsButtonListener(marker: any): void {
    const markerData = marker.markerData;
    let placeId: number;

    marker.markerData.ShoppingCenter?.Places
      ? (placeId = markerData.ShoppingCenter.Places[0].Id)
      : (placeId = markerData.Id);

    const viewDetailsButton = document.getElementById(
      `view-details-${placeId}`
    );

    let shoppingCenterId = markerData.CenterName ? markerData.Id : 0;
    if (viewDetailsButton) {
      viewDetailsButton.addEventListener('click', () => {
        this.handleViewDetailsClick(
          placeId,
          shoppingCenterId,
          marker.markerData.CenterAddress ? 'Shopping Center' : 'Stand Alone'
        );
      });
    } else {
    }
  }

  private handleViewDetailsClick(
    markerId: any,
    shoppingCenterId?: number,
    placeType?: string
  ): void {
    this.storedBuyBoxId = localStorage.getItem('BuyBoxId');
    this.storedOrgId = localStorage.getItem('OrgId');
    if (placeType == 'Shopping Center') {
      this.router.navigate([
        '/landing',
        markerId == shoppingCenterId ? 0 : markerId,
        shoppingCenterId,
        this.storedBuyBoxId,
      ]);
    } else {
      this.router.navigate(['/landing', markerId, 0, this.storedBuyBoxId]);
    }
  }

  private assignToMarkerArray(marker: any, type: string): void {
    if (type === 'Shopping Center' || type === 'Stand Alone') {
      this.prosMarkers.push(marker);
    }
  }

  private createInfoWindow(markerData: any, type: string): any {
    let content =
      type === 'Shopping Center'
        ? this.shoopingCenterPopup(markerData)
        : this.standAlonerPopup(markerData);
    const infoWindow = new google.maps.InfoWindow({ content });
    infoWindow.marker = null;
    return infoWindow;
  }

  private shoopingCenterPopup(markerData: any): string {
    const managerOrgs =
      markerData.ShoppingCenter?.ManagerOrganization?.map((org: any) => {
        if (org.Firstname && org.LastName) {
          return `
            <div class="contact-container">
             <p class="text-bold m-0">
                ${
                  org.Firstname.charAt(0).toUpperCase() +
                  org.Firstname.slice(1).toLowerCase()
                }
                ${
                  org.LastName.charAt(0).toUpperCase() +
                  org.LastName.slice(1).toLowerCase()
                }
              </p>
            </div>
          `;
        } else {
          // If either Firstname or LastName is missing, return an empty string
          return '';
        }
      }).join('') || '';

    return `
      <div class="info-window">
        <div class="main-img">
          <img src="${markerData.MainImage}" alt="Main Image">
          <span class="close-btn">&times;</span>
        </div>
        <div class="content-wrap">
          ${
            markerData.CenterName
              ? `<p class="content-title">${markerData.CenterName.toUpperCase()}</p>`
              : ''
          }
          <p class="address-content"> 
            ${markerData.CenterAddress}, ${markerData.CenterCity}, ${
      markerData.CenterState
    }
          </p>
          ${
            this.getShoppingCenterUnitSize(markerData)
              ? `<p class="address-content">${this.getShoppingCenterUnitSize(
                  markerData
                )}</p>`
              : ''
          }
  
          ${
            this.getPlacesRepresentative() !== false &&
            markerData.ShoppingCenter?.ManagerOrganization &&
            markerData.ShoppingCenter?.ManagerOrganization[0]
              ? `
                <div class="d-flex align-items-center">
                  <b>${
                    markerData.ShoppingCenter.ManagerOrganization[0]?.Name || ''
                  }</b>
                  <img
                    class="logo ms-2"
                    style="width:40px"
                    src="https://api.cherrypick.com/api/Organization/GetOrgImag?orgId=${
                      markerData.ShoppingCenter.ManagerOrganization[0]?.ID || ''
                    }"
                    alt="${
                      markerData.ShoppingCenter.ManagerOrganization[0]?.Name ||
                      ''
                    }"
                  />
                </div>
              `
              : ''
          }
          
    ${
      managerOrgs && this.getPlacesRepresentative() !== false
        ? `<div class="py-2">${managerOrgs}</div>`
        : ''
    }
          
    
        </div>
      </div>
    `;
  }

//   <div class="buttons-wrap">
//   <button id="view-details-${
//     markerData.ShoppingCenter?.Places
//       ? markerData.ShoppingCenter.Places[0]?.Id
//       : markerData.Id
//   }" class="view-details-card">View Details
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
//       <path d="..." fill="#fff"></path>
//     </svg>
//   </button>
// </div>
  private standAlonerPopup(markerData: any): string {
    return `  
      <div class="info-window">
        <div class="main-img">
          <img src="${markerData.MainImage}" alt="Main Image">
          <span class="close-btn">&times;</span>
        </div>
        <div class="content-wrap">  
          <p class="address-content"> 
            Address: ${markerData.Address}, ${markerData.City}, ${
      markerData.State
    }
          </p>
          <p class="address-content"> 
            Unit Size: ${this.formatNumberWithCommas(
              markerData.BuildingSizeSf
            )} SF
          </p>
         ${`<p class="address-content">Lease price: ${this.getStandAloneLeasePrice(
           markerData.ForLeasePrice,
           markerData.BuildingSizeSf
         )}</p>`}

        </div>
      </div>
    `;
  }
//   <div class="buttons-wrap">
//   <button id="view-details-${
//     markerData.Id
//   }" class="view-details-card">View Details
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//       <path d="M12.9999 11.75C12.8099 11.75 12.6199 11.68 12.4699 11.53C12.1799 11.24 12.1799 10.76 12.4699 10.47L20.6699 2.26999C20.9599 1.97999 21.4399 1.97999 21.7299 2.26999C22.0199 2.55999 22.0199 3.03999 21.7299 3.32999L13.5299 11.53C13.3799 11.68 13.1899 11.75 12.9999 11.75Z" fill="#fff"/>
//       <path d="M22.0002 7.55C21.5902 7.55 21.2502 7.21 21.2502 6.8V2.75H17.2002C16.7902 2.75 16.4502 2.41 16.4502 2C16.4502 1.59 16.7902 1.25 17.2002 1.25H22.0002C22.4102 1.25 22.7502 1.59 22.7502 2V6.8C22.7502 7.21 22.4102 7.55 22.0002 7.55Z" fill="#fff"/>
//       <path d="M15 22.75H9C3.57 22.75 1.25 20.43 1.25 15V9C1.25 3.57 3.57 1.25 9 1.25H11C11.41 1.25 11.75 1.59 11.75 2C11.75 2.41 11.41 2.75 11 2.75H9C4.39 2.75 2.75 4.39 2.75 9V15C2.75 19.61 4.39 21.25 9 21.25H15C19.61 21.25 21.25 19.61 21.25 15V13C21.25 12.59 21.59 12.25 22 12.25C22.41 12.25 22.75 12.59 22.75 13V15C22.75 20.43 20.43 22.75 15 22.75Z" fill="#fff"/>
//     </svg>
//   </button>
// </div>
  

  private currentlyOpenInfoWindow: any | null = null;

  createCustomMarker(map: any, markerData: BuyboxCategory): void {
    if (!this.markerMap[markerData.id]) {
      this.markerMap[markerData.id] = [];
    }

    if (this.markerMap[markerData.id].length > 0) {
      return;
    }

    markerData.places.forEach((place) => {
      const imgUrl = `https://api.cherrypick.com/api/Organization/GetOrgImag?orgId=${place.id}`;
      place.RetailRelationCategories.forEach((branch) => {
        branch.Branches.forEach((b) => {
          const latitude = Number(b.Latitude);
          const longitude = Number(b.Longitude);

          if (!isNaN(latitude) && !isNaN(longitude)) {
            const marker = new google.maps.Marker({
              position: {
                lat: latitude,
                lng: longitude,
              },
              icon: {
                url: imgUrl,
                scaledSize: new google.maps.Size(30, 30),
              },
              map: map,
            });

            const closeButtonId = `close-button-${b.Id}`;

            const infoWindowContent = `
          <div style="padding:0 10px">
             <div style="display: flex; justify-content: end">
            <button id="${closeButtonId}" style="background: transparent; border: none; cursor: pointer; font-size: 24px; color: black; padding:0; border: none; outline: none;">
              &times;
            </button>
          </div>
            <div>
              <p style="font-size: 19px; font-weight: 500;margin: 0;padding: 13px;">${place.Name}</p>
            </div>
          </div>`;

            const infoWindow = new google.maps.InfoWindow({
              content: infoWindowContent,
            });

            // Add a click listener to the marker to show the InfoWindow
            marker.addListener('click', () => {
              // Close any previously opened InfoWindow
              if (this.currentlyOpenInfoWindow) {
                this.currentlyOpenInfoWindow.close();
              }

              // Open the new InfoWindow
              infoWindow.open(map, marker);
              this.currentlyOpenInfoWindow = infoWindow;

              // Add the close button listener to the InfoWindow
              this.closeSmall(infoWindow, closeButtonId);
            });

            // Add listener for clicking on the map to close the currently open InfoWindow
            this.addMapClickListenerCustom(map);

            // Store the marker
            this.markerMap[markerData.id].push(marker);
          }
        });
      });
    });

    this.toggleMarkers(map, markerData);
  }

  private addMapClickListenerCustom(map: any): void {
    google.maps.event.addListener(map, 'click', () => {
      if (this.currentlyOpenInfoWindow) {
        this.currentlyOpenInfoWindow.close();
        this.currentlyOpenInfoWindow = null; // Reset the reference to indicate no InfoWindow is open
      }
    });
  }

  // Function to handle the close button click events
  private closeSmall(infoWindow: any, buttonId: string): void {
    google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
      const closeButton = document.getElementById(buttonId);
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          infoWindow.close();
          this.currentlyOpenInfoWindow = null;
        });
      }
    });
  }

  toggleMarkers(map: any, markerData: any): void {
    if (markerData.isChecked) {
      this.showMarkers(map, markerData.id);
    } else {
      this.hideMarkers(markerData.id);
    }
  }

  showMarkers(map: any, id: number): void {
    if (this.markerMap[id]) {
      this.markerMap[id].forEach((marker) => {
        marker.setMap(map);
      });
    }
  }

  hideMarkers(id: string): void {
    if (this.markerMap[id]) {
      this.markerMap[id].forEach((marker) => {
        marker.setMap(null);
      });
    }
  }

  getVisibleProspectMarkers(bounds: any) {
    return this.prosMarkers
      .filter((marker) => bounds.contains(marker.getPosition()))
      .map((marker) => {
        const position = marker.getPosition();
        return {
          lat: position.lat(),
          lng: position.lng(),
        };
      });
  }

  private updateMarker(map: any, place: any, isEntering: boolean): void {
    const { Latitude, Longitude, infoWindowContent } = place;

    if (!map || !this.markers) return;
    // Find the existing marker based on its latitude and longitude
    const markerIndex = this.markers.findIndex(
      (m: any) =>
        m.markerData.Latitude === +Latitude &&
        m.markerData.Longitude === +Longitude
    );

    // Create the InfoWindow for the existing marker
    const infoWindow = new google.maps.InfoWindow({
      content: infoWindowContent,
    });

    // If the marker exists, we need to re-attach the infoWindow event listener
    if (markerIndex !== -1) {
      const existingMarker = this.markers[markerIndex];

      // Re-attach the InfoWindow click event
      existingMarker.addListener('click', () => {
        infoWindow.open(map, existingMarker);
      });

      // Trigger the hover effect
      if (isEntering) {
        this.changeMarkerStyle(existingMarker, true); // On hover in, change icon
      } else {
        this.changeMarkerStyle(existingMarker, false); // On hover out, revert icon
      }
    }
  }

  private changeMarkerStyle(marker: any, isHovering: boolean): void {
    const originalIcon = marker.getIcon(); // Save the original icon on the first hover

    // Store the original icon in the marker itself (so we can access it later)
    if (!marker._originalIcon) {
      marker._originalIcon = originalIcon; // Only save once
    }

    if (isHovering) {
      // Placeholder icon when hovering
      const hoverIcon = {
        url: this.getArrowSvgPurple(), // Placeholder icon (can be an image URL or SVG)
        scaledSize: new google.maps.Size(50, 50), // Adjust the size of the placeholder icon
      };
      marker.setIcon(hoverIcon); // Change to the placeholder icon
    } else {
      // Reset to the original icon when mouse leaves
      marker.setIcon(marker._originalIcon); // Revert back to the original icon
    }
  }

  onMouseEnter(map: any, place: any): void {
    this.updateMarker(map, place, true); // Trigger icon change on hover
  }

  onMouseLeave(map: any, place: any): void {
    this.updateMarker(map, place, false); // Revert to the original icon on mouse leave
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

  private getArrowSvgPurple(): string {
    return (
      'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(`<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_4994_40245)">
<path d="M27.4933 11.2666C26.0933 5.10659 20.72 2.33325 16 2.33325C16 2.33325 16 2.33325 15.9867 2.33325C11.28 2.33325 5.89334 5.09325 4.49334 11.2533C2.93334 18.1333 7.14667 23.9599 10.96 27.6266C12.3733 28.9866 14.1867 29.6666 16 29.6666C17.8133 29.6666 19.6267 28.9866 21.0267 27.6266C24.84 23.9599 29.0533 18.1466 27.4933 11.2666ZM16 17.9466C13.68 17.9466 11.8 16.0666 11.8 13.7466C11.8 11.4266 13.68 9.54658 16 9.54658C18.32 9.54658 20.2 11.4266 20.2 13.7466C20.2 16.0666 18.32 17.9466 16 17.9466Z" fill="#2B26CE"/>
</g>
<defs>
<clipPath id="clip0_4994_40245">
<rect width="32" height="32" fill="white"/>
</clipPath>
</defs>
</svg>
`)
    );
  }

  private getShoppingCenterUnitSize(shoppingCenter: any): string | null {
    // Helper function to format numbers with commas
    const formatNumberWithCommas = (num: number) => num.toLocaleString();

    // Format lease price as a whole number or "On Request"
    const formatLeasePrice = (price: any): string => {
      if (price === 0 || price === 'On Request') return 'On Request';
      const priceNumber = parseFloat(price);
      return !isNaN(priceNumber)
        ? Math.floor(priceNumber).toString()
        : 'On Request';
    };

    const places = shoppingCenter?.ShoppingCenter?.Places || [];
    const buildingSizes = places
      .map((place: any) => place.BuildingSizeSf)
      .filter(
        (size: any) => size !== undefined && size !== null && !isNaN(size)
      );

    // If no valid building sizes from places:
    if (buildingSizes.length === 0) {
      // Fall back to single center logic
      const singleSize = shoppingCenter.BuildingSizeSf;
      if (singleSize && !isNaN(singleSize)) {
        const leasePriceStr = formatLeasePrice(shoppingCenter.ForLeasePrice);
        const leasePriceDisplay =
          leasePriceStr !== 'On Request'
            ? `Lease Price: $${formatNumberWithCommas(
                Math.floor((parseFloat(leasePriceStr) * singleSize) / 12)
              )}/month`
            : ''; // If lease price is On Request, show nothing here

        return `Unit Size: ${formatNumberWithCommas(singleSize)} SF${
          leasePriceDisplay ? `<br>${leasePriceDisplay}` : ''
        }`;
      }
      // No sizes at all, return null if no unit size
      return null;
    }

    // We have at least one building size
    const minSize = Math.min(...buildingSizes);
    const maxSize = Math.max(...buildingSizes);

    // Find prices for min and max sizes
    const findPriceForSize = (size: number): string => {
      const place = places.find((p: any) => p.BuildingSizeSf === size);
      return place?.ForLeasePrice ?? 'On Request';
    };

    const minPriceStr = findPriceForSize(minSize);
    const maxPriceStr = findPriceForSize(maxSize);

    // Format unit size range
    const sizeRange =
      minSize === maxSize
        ? `${formatNumberWithCommas(minSize)} SF`
        : `${formatNumberWithCommas(minSize)} SF - ${formatNumberWithCommas(
            maxSize
          )} SF`;

    // Format the minimum and maximum prices
    const formattedMinPrice = formatLeasePrice(minPriceStr);
    const formattedMaxPrice = formatLeasePrice(maxPriceStr);

    // Determine which lease price to use
    let finalLeasePrice: string;
    if (
      formattedMinPrice === 'On Request' &&
      formattedMaxPrice === 'On Request'
    ) {
      finalLeasePrice = 'On Request';
    } else if (formattedMinPrice === 'On Request') {
      // Only max is valid
      finalLeasePrice = formattedMaxPrice;
    } else if (formattedMaxPrice === 'On Request') {
      // Only min is valid
      finalLeasePrice = formattedMinPrice;
    } else {
      // Both are valid numbers: Use the min price to calculate
      finalLeasePrice = formattedMinPrice;
    }

    // Calculate monthly lease price if possible
    let resultLeasePrice = 'On Request';
    if (finalLeasePrice !== 'On Request') {
      const leaseNumeric = parseFloat(finalLeasePrice);
      if (!isNaN(leaseNumeric)) {
        const monthlyCost = Math.floor((leaseNumeric * minSize) / 12);
        resultLeasePrice = `$${formatNumberWithCommas(monthlyCost)}/month`;
      } else {
        resultLeasePrice = 'On Request';
      }
    }

    return `Unit Size: ${sizeRange}<br>Lease Price: ${resultLeasePrice}`;
  }

  getStandAloneLeasePrice(forLeasePrice: any, buildingSizeSf: any): string {
    const leasePrice = Number(forLeasePrice);
    const size = Number(buildingSizeSf);
    if (!isNaN(leasePrice) && !isNaN(size) && leasePrice > 0 && size > 0) {
      const calculatedPrice = Math.floor((leasePrice * size) / 12);
      const formattedPrice = calculatedPrice.toLocaleString();
      return `$${formattedPrice}/month`;
    } else {
      return 'On Request';
    }
  }

  formatNumberWithCommas(value: number | null): string {
    if (value !== null) {
      return value?.toLocaleString();
    } else {
      return '';
    }
  }

  clearMarkers() {
    this.markers.forEach((m) => m.setMap(null));
    this.markers = [];
    this.prosMarkers = [];
    this.openInfoWindow = null;
    this.currentlyOpenInfoWindow = null;
  }

  addPropertyMarker(
    map: any,
    position: { lat: number; lng: number },
    property: any
  ) {
    return new google.maps.Marker({
      position,
      map,
      title: property.title,
    });
  }

  getDefaultMapConfig() {
    return {
      center: { lat: 39.8283, lng: -98.5795 }, // Center of USA
      zoom: 4,
      mapTypeControl: false,
      streetViewControl: false,
    };
  }

  createMap(element: HTMLElement, config: any): any {
    return new google.maps.Map(element, config);
  }

  setPlacesRepresentative(PlacesRepresentative: any) {
    this.placesRepresentative = PlacesRepresentative;
  }

  getPlacesRepresentative(): boolean | undefined {
    return this.placesRepresentative;
  }

  drawMultiplePolygons(map: any, polygonFeatures: any[]): void {
    polygonFeatures?.forEach((feature) => {
      this.drawSinglePolygon(map, feature);
    });
  }

  drawSinglePolygon(map: any, feature: any): void {
    try {
      const geoJson = JSON.parse(feature.PolygonJson[0].json);
      const coordinates = geoJson.geometry.coordinates[0];
      const polygonCoords = coordinates.map((coord: number[]) => ({
        lat: coord[1],
        lng: coord[0],
      }));

      const polygon = new google.maps.Polygon({
        paths: polygonCoords,
        strokeColor: '#3498db',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#3498db',
        fillOpacity: 0.35,
        map: map,
      });

      // Calculate polygon center
      const bounds = new google.maps.LatLngBounds();
      polygonCoords.forEach((coord: any) => {
        bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
      });
      const center = bounds.getCenter();

      // Create info window for detailed information
      const infoWindow = new google.maps.InfoWindow({
        content: this.createInfoWindowContent(feature),
        disableAutoPan: true,
      });

      // Track the currently open info window
      let openInfoWindow: google.maps.InfoWindow | null = null;

      // Close any existing info windows before opening a new one
      const closeAllInfoWindows = () => {
        if (openInfoWindow) {
          openInfoWindow.close();
          openInfoWindow = null;
        }
      };

      // Add hover events to the polygon
      // polygon.addListener('mouseover', () => {
      //   // Close any existing info windows
      //   closeAllInfoWindows();

      //   // Open info window at polygon's center
      //   infoWindow.setPosition(center);
      //   infoWindow.open(map);
      //   openInfoWindow = infoWindow;

      //   // Optional: Change polygon style on hover
      //   polygon.setOptions({
      //     fillOpacity: 0.5,
      //     strokeWeight: 3,
      //   });
      // });

      polygon.addListener('mouseout', () => {
        // Close the info window
        closeAllInfoWindows();

        // Revert polygon style
        polygon.setOptions({
          fillOpacity: 0.35,
          strokeWeight: 2,
        });
      });

      // Close info window when clicking outside
      map.addListener('click', () => {
        closeAllInfoWindows();
      });

      // Display the polygon's name on the polygon with margin
      const polygonLabel = new google.maps.Marker({
        position: { lat: center.lat(), lng: center.lng() },
        map: map,
        label: {
          text: feature.Name,
          color: '#001f3f',
          fontSize: '11px',
          fontWeight: 'bold',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 0, // Hide the default circle icon
        },
        title: feature.Name,
      });
    } catch (error) {}
  }

  // Helper method to create detailed info window content
  private createInfoWindowContent(feature: any): string {
    // Helper function to format number as currency
    const formatCurrency = (value: number) => {
      return value !== null && value !== undefined && value !== 0
        ? `$${value.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`
        : '';
    };

    return `
      <div style="padding:10px; max-width:250px; color:#000">
        <h3 style="font-size:14px ; margin:0">${
          feature.Name || 'Unnamed Location'
        }</h3>
        <hr style="margin:10px 0">
        <p class="py-1"><strong>Shopping centers:</strong> ${
          feature.shoppingcenters !== null &&
          feature.shoppingcenters !== undefined
            ? feature.shoppingcenters
            : 'N/A'
        }</p>
        ${
          feature.minForlease !== 0 || feature.maxforlease !== 0
            ? `<p class="py-1"><strong>Lease price:</strong> 
             ${formatCurrency(feature.minForlease)} ${
                feature.minForlease !== 0 && feature.maxforlease !== 0
                  ? '- '
                  : ''
              }${formatCurrency(feature.maxforlease)}
             </p>`
            : ''
        }
        <p class="py-1"> <strong>Spaces:</strong> 
          ${
            feature.minspace !== null &&
            feature.minspace !== undefined &&
            feature.maxspace !== null &&
            feature.maxspace !== undefined
              ? `${feature.minspace} sq ft - ${feature.maxspace} sq ft`
              : 'No space information available'
          }
        </p>
      </div>
    `;
  }

  // drawPolygons(map: any, response: any): void {
  //   if (!map || !response || !Array.isArray(response)) {
  //     return;
  //   }

  //   response.forEach((polygonCoordinates: number[][][]) => {
  //     const paths = polygonCoordinates.map((coords) => {
  //       return coords
  //         .map((coord: any) => {
  //           // Ensure that latitude and longitude are numbers
  //           const lat = parseFloat(coord[1]);
  //           const lng = parseFloat(coord[0]);

  //           // Check if they are valid numbers
  //           if (isNaN(lat) || isNaN(lng)) {
  //             return null;
  //           }

  //           return { lat, lng };
  //         })
  //         .filter((point) => point !== null); // Remove invalid points
  //     });

  //     // Create the polygon
  //     const polygon = new google.maps.Polygon({
  //       paths,
  //       strokeColor: '#FF0000',
  //       strokeOpacity: 0.8,
  //       strokeWeight: 2,
  //       fillColor: '#FF0000',
  //       fillOpacity: 0.35,
  //     });

  //     polygon.setMap(map);
  //   });
  // }

  // async fetchAndDrawPolygon(
  //   map: any,
  //   city: any,
  //   state: any,
  //   lat?: any,
  //   lng?: any
  // ): Promise<void> {

  //   // const boundaryUrl = `https://nominatim.openstreetmap.org/search.php?q=${encodeURIComponent(area)}&polygon_geojson=1&format=geojson&addressdetails=1n`;
  //   const boundaryUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&polygon_geojson=1`;

  //   try {
  //     const response = await fetch(boundaryUrl);
  //     const data: any = await response.json();
  //     data.features?.forEach((f: any) => {
  //       if (f.geometry.type === 'Polygon') {
  //         // && f.properties['ISO3166-2'] === `US${state}`
  //         // Draw polygon
  //         const paths = f.geometry.coordinates[0].map((coord: number[]) => {
  //           return {
  //             lat: coord[1],
  //             lng: coord[0],
  //           };
  //         });

  //         const polygon = new google.maps.Polygon({
  //           paths: paths,
  //           strokeColor: '#e74c3c',
  //           strokeOpacity: 0.8,
  //           strokeWeight: 2,
  //           fillColor: '#e74c3c',
  //           fillOpacity: 0.35,
  //           map: map,
  //         });

  //         // Calculate polygon center for label placement
  //         const bounds = new google.maps.LatLngBounds();
  //         paths.forEach((path: any) => bounds.extend(path));
  //         const center = bounds.getCenter();

  //         // Show name by default
  //         const infoWindow = new google.maps.InfoWindow({
  //           content: `<div style="color: #3498db; font-weight: bold ; background-color: transparent">${f.properties.name}</div>`,
  //           position: center,
  //         });
  //         infoWindow.open(map);
  //       }
  //     });
  //   } catch (error) {
  //   }
  // }

  // async fetchAndDrawPolygons(
  //   map: any,
  //   buyboxId: any,
  // ): Promise<void> {

  //   // const boundaryUrl = `https://nominatim.openstreetmap.org/search.php?q=${encodeURIComponent(area)}&polygon_geojson=1&format=geojson&addressdetails=1n`;
  //   const boundaryUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&polygon_geojson=1`;

  //   try {
  //     const response = await fetch(boundaryUrl);
  //     const data: any = await response.json();
  //     data.features?.forEach((f: any) => {
  //       if (f.geometry.type === 'Polygon') {
  //         // && f.properties['ISO3166-2'] === `US${state}`
  //         // Draw polygon
  //         const paths = f.geometry.coordinates[0].map((coord: number[]) => {
  //           return {
  //             lat: coord[1],
  //             lng: coord[0],
  //           };
  //         });

  //         const polygon = new google.maps.Polygon({
  //           paths: paths,
  //           strokeColor: '#e74c3c',
  //           strokeOpacity: 0.8,
  //           strokeWeight: 2,
  //           fillColor: '#e74c3c',
  //           fillOpacity: 0.35,
  //           map: map,
  //         });

  //         // Calculate polygon center for label placement
  //         const bounds = new google.maps.LatLngBounds();
  //         paths.forEach((path: any) => bounds.extend(path));
  //         const center = bounds.getCenter();

  //         // Show name by default
  //         const infoWindow = new google.maps.InfoWindow({
  //           content: `<div style="color: #3498db; font-weight: bold ; background-color: transparent">${f.properties.name}</div>`,
  //           position: center,
  //         });
  //         infoWindow.open(map);
  //       }
  //     });
  //   } catch (error) {
  //   }
  // }

  //  async fetchAndDrawPolygon(map: any, city:any , state:any , area: string): Promise<void> {

  //   const boundaryUrl = `https://nominatim.openstreetmap.org/search.php?q=${encodeURIComponent(area)}&polygon_geojson=1&format=geojson&addressdetails=1n`;
  //   try {
  //     const response = await fetch(boundaryUrl);
  //     const data: any = await response.json();

  //     data.features.forEach((f:any) => {
  //       // if(f.geometry.type == 'Point' && f.properties.type == 'neighbourhood'  ){
  //       //   // Draw circle only
  //       //   const [lng, lat] = f.geometry.coordinates;

  //       //   // Add circle around point
  //       //   const circle = new google.maps.Circle({
  //       //     strokeColor: '#3498db',
  //       //     strokeOpacity: 0.8,
  //       //     strokeWeight: 2,
  //       //     fillColor: '#3498db',
  //       //     fillOpacity: 0.35,
  //       //     map: map,
  //       //     center: { lat, lng },
  //       //     radius: 1600 // 1km radius
  //       //   });

  //       //   // Show name by default
  //       //   const infoWindow = new google.maps.InfoWindow({
  //       //     content: `<div style="color: #3498db; font-weight: bold ; background-color: transparent ;padding: 7px">${f.properties.name}</div>`,
  //       //     position: { lat, lng }
  //       //   });
  //       //   infoWindow.open(map);

  //       // }
  //        if (
  //         f.geometry.type === 'Polygon'
  //       )
  //       // && f.properties['ISO3166-2'] === `US${state}`
  //       {
  //         // Draw polygon
  //         const paths = f.geometry.coordinates[0].map((coord: number[]) => {
  //           return {
  //             lat: coord[1],
  //             lng: coord[0]
  //           };
  //         });

  //         const polygon = new google.maps.Polygon({
  //           paths: paths,
  //           strokeColor: '#e74c3c',
  //           strokeOpacity: 0.8,
  //           strokeWeight: 2,
  //           fillColor: '#e74c3c',
  //           fillOpacity: 0.35,
  //           map: map
  //         });

  //         // Calculate polygon center for label placement
  //         const bounds = new google.maps.LatLngBounds();
  //         paths.forEach((path:any) => bounds.extend(path));
  //         const center = bounds.getCenter();

  //         // Show name by default
  //         const infoWindow = new google.maps.InfoWindow({
  //           content: `<div style="color: #3498db; font-weight: bold ; background-color: transparent">${f.properties.name}</div>`,
  //           position: center
  //         });
  //         infoWindow.open(map);
  //       }
  //     });
  //   } catch (error) {
  //   }
  // }
}
