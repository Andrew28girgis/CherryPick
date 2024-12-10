import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BuyboxCategory } from 'src/models/buyboxCategory';
declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class MapsService {
  private storedBuyBoxId: any;
  private markers: any[] = [];           // All markers created by createMarker()
  private prosMarkers: any[] = [];       // Subset of markers for "prospects"
  private markerMap: { [key: string]: any[] } = {}; // For custom markers keyed by category ID

  private openInfoWindow: any | null = null;
  private currentlyOpenInfoWindow: any | null = null;
  private map: any; // Keep a reference to the map object

  constructor(private router: Router) {
    this.storedBuyBoxId = localStorage.getItem('BuyBoxId');
  }

  /**
   * Initialize and place a standard marker on the map.
   */
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
    });

    marker.markerData = markerData;
    marker.type = type;
    // Store original icon immediately
    marker._originalIcon = icon;

    this.markers.push(marker);
    this.assignToProspectArray(marker, type);

    // Create InfoWindow and attach event listeners
    const infoWindow = this.createInfoWindow(markerData, type);
    this.attachMarkerListeners(marker, infoWindow);

    return marker;
  }

  /**
   * Attach event listeners for a newly created marker.
   */
  private attachMarkerListeners(marker: any, infoWindow: any): void {
    // Marker click to open InfoWindow
    marker.addListener('click', () => {
      this.handleMarkerClick(marker, infoWindow);
    });

    // Close currently open InfoWindow if map is clicked
    google.maps.event.addListener(this.map, 'click', () => {
      if (this.openInfoWindow) {
        this.openInfoWindow.close();
        this.openInfoWindow = null;
      }
    });
  }

  /**
   * Handle marker click events, open the associated infoWindow,
   * and add DOM event listeners once InfoWindow is rendered.
   */
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

  /**
   * Add a listener to the custom close button inside the InfoWindow.
   */
  private addCloseButtonListener(infoWindow: any): void {
    const closeButton = document.querySelector('.close-btn');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        infoWindow.close();
        this.openInfoWindow = null;
      });
    }
  }

  /**
   * Add a listener to the "View Details" button inside the InfoWindow.
   */
  private addViewDetailsButtonListener(marker: any): void {
    const markerData = marker.markerData;
    let placeId: number;

    if (marker.markerData.ShoppingCenter) {
      placeId = markerData.ShoppingCenter.Places[0].Id;
    } else {
      placeId = markerData.Id;
    }

    const shoppingCenterId = markerData.CenterName ? markerData.Id : 0;
    const viewDetailsButton = document.getElementById(`view-details-${placeId}`);

    if (viewDetailsButton) {
      viewDetailsButton.addEventListener('click', () => {
        this.handleViewDetailsClick(placeId, shoppingCenterId);
      });
    } else {
      console.log(`Button for marker ${placeId} not found`);
    }
  }

  /**
   * Handles the navigation to details page when View Details is clicked.
   */
  private handleViewDetailsClick(markerId: any, shoppingCenterId?: number): void {
    console.log(`View details for marker ID: ${markerId}`);
    this.router.navigate([
      '/landing',
      markerId,
      shoppingCenterId,
      this.storedBuyBoxId,
    ]);
  }

  /**
   * Assign marker to "prosMarkers" array if it’s a Shopping Center or Stand Alone.
   */
  private assignToProspectArray(marker: any, type: string): void {
    if (type === 'Shopping Center' || type === 'Stand Alone') {
      this.prosMarkers.push(marker);
    }
  }

  /**
   * Create an InfoWindow for a given markerData and type.
   */
  private createInfoWindow(markerData: any, type: string): any {
    const content =
      type === 'Shopping Center'
        ? this.shoppingCenterPopup(markerData)
        : this.standAlonePopup(markerData);

    const infoWindow = new google.maps.InfoWindow({ content });
    infoWindow.marker = null;
    return infoWindow;
  }

  /**
   * Generate HTML for Shopping Center popup.
   */
  private shoppingCenterPopup(markerData: any): string {
    const managerOrgs = markerData.ShoppingCenter.ManagerOrganization?.map(
      (org: any) => `
        <div class="contact-container">
          <p class="text-bold m-0">${org.Firstname} ${org.LastName}</p> 
        </div>
      `
    ).join('');

    return `
      <div class="info-window">
        <div class="main-img">
          <img src="${markerData.MainImage}" alt="Main Image">
          <span class="close-btn">&times;</span>
        </div>
        <div class="content-wrap">
          ${markerData.CenterName ? `<p class="content-title">${markerData.CenterName.toUpperCase()}</p>` : ''}
          <p class="address-content">${markerData.CenterAddress}, ${markerData.CenterCity}, ${markerData.CenterState}</p>
          ${
            this.getShoppingCenterUnitSize(markerData)
              ? `<p class="address-content">${this.getShoppingCenterUnitSize(markerData)}</p>`
              : ''
          }
          ${
            markerData.ShoppingCenter.ManagerOrganization && markerData.ShoppingCenter.ManagerOrganization[0]
              ? `<div class="d-flex align-items-center">
                  <b>${markerData.ShoppingCenter.ManagerOrganization[0]?.Name || ''}</b>
                  <img class="logo ms-2" style="width:40px"
                    src="https://api.cherrypick.com/api/Organization/GetOrgImag?orgId=${markerData.ShoppingCenter.ManagerOrganization[0]?.ID || ''}"
                    alt="${markerData.ShoppingCenter.ManagerOrganization[0]?.Name || ''}"
                  />
                </div>`
              : ''
          }
          <div class="py-2">${managerOrgs || ''}</div>
          <div class="buttons-wrap">
            <button id="view-details-${
              markerData.ShoppingCenter.Places ? markerData.ShoppingCenter.Places[0]?.Id : 0
            }" class="view-details-card">View Details
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="..." fill="#fff"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate HTML for Stand Alone popup.
   */
  private standAlonePopup(markerData: any): string {
    return `
      <div class="info-window">
        <div class="main-img">
          <img src="${markerData.MainImage}" alt="Main Image">
          <span class="close-btn">&times;</span>
        </div>
        <div class="content-wrap">  
          <p class="address-content">
            Address: ${markerData.Address}, ${markerData.City}, ${markerData.State}
          </p>
          <p class="address-content">
            Unit Size: ${this.formatNumberWithCommas(markerData.BuildingSizeSf)} SF
          </p>
          <p class="address-content">Lease price: ${this.getStandAloneLeasePrice(markerData.ForLeasePrice, markerData.BuildingSizeSf)}</p>
          <div class="buttons-wrap">
            <button id="view-details-${
              markerData.Id
            }" class="view-details-card">View Details
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12.9999 11.75C12.8099 11.75 12.6199 11.68 12.4699 11.53C12.1799 11.24 12.1799 10.76 12.4699 10.47L20.6699 2.26999C20.9599 1.97999 21.4399 1.97999 21.7299 2.26999C22.0199 2.55999 22.0199 3.03999 21.7299 3.32999L13.5299 11.53C13.3799 11.68 13.1899 11.75 12.9999 11.75Z" fill="#fff"/>
                <path d="M22.0002 7.55C21.5902 7.55 21.2502 7.21 21.2502 6.8V2.75H17.2002C16.7902 2.75 16.4502 2.41 16.4502 2C16.4502 1.59 16.7902 1.25 17.2002 1.25H22.0002C22.4102 1.25 22.7502 1.59 22.7502 2V6.8C22.7502 7.21 22.4102 7.55 22.0002 7.55Z" fill="#fff"/>
                <path d="M15 22.75H9C3.57 22.75 1.25 20.43 1.25 15V9C1.25 3.57 3.57 1.25 9 1.25H11C11.41 1.25 11.75 1.59 11.75 2C11.75 2.41 11.41 2.75 11 2.75H9C4.39 2.75 2.75 4.39 2.75 9V15C2.75 19.61 4.39 21.25 9 21.25H15C19.61 21.25 21.25 19.61 21.25 15V13C21.25 12.59 21.59 12.25 22 12.25C22.41 12.25 22.75 12.59 22.75 13V15C22.75 20.43 20.43 22.75 15 22.75Z" fill="#fff"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create custom markers for BuyboxCategory data.
   */
  createCustomMarker(map: any, markerData: BuyboxCategory): void {
    if (!this.markerMap[markerData.id]) {
      this.markerMap[markerData.id] = [];
    }

    // Prevent duplication
    if (this.markerMap[markerData.id].length > 0) {
      return;
    }

    markerData.places.forEach((place) => {
      const imgUrl = `https://api.cherrypick.com/api/Organization/GetOrgImag?orgId=${place.id}`;
      place.RetailRelationCategories.forEach((branch) => {
        branch.Branches.forEach((b) => {
          const lat = Number(b.Latitude);
          const lng = Number(b.Longitude);

          if (!isNaN(lat) && !isNaN(lng)) {
            const marker = new google.maps.Marker({
              position: { lat, lng },
              icon: {
                url: imgUrl,
                scaledSize: new google.maps.Size(30, 30),
              },
              map: map,
            });

            const infoWindowContent = this.getCustomInfoWindowContent(place, b);
            const infoWindow = new google.maps.InfoWindow({ content: infoWindowContent });

            // Marker click to show infoWindow
            marker.addListener('click', () => {
              if (this.currentlyOpenInfoWindow) {
                this.currentlyOpenInfoWindow.close();
              }
              infoWindow.open(map, marker);
              this.currentlyOpenInfoWindow = infoWindow;

              // Add close button listener once DOM is ready
              this.attachCustomInfoWindowClose(infoWindow, `close-button-${b.Id}`);
            });

            // Close infoWindow on map click
            this.addMapClickListenerCustom(map);
            this.markerMap[markerData.id].push(marker);
          }
        });
      });
    });

    this.toggleMarkers(map, markerData);
  }

  /**
   * Return HTML content for custom infoWindows.
   */
  private getCustomInfoWindowContent(place: any, b: any): string {
    const closeButtonId = `close-button-${b.Id}`;
    return `
      <div style="padding:0 10px">
        <div style="display: flex; justify-content: end">
          <button id="${closeButtonId}"
            style="background: transparent; border: none; cursor: pointer; font-size: 24px; color: black; padding:0;">
            &times;
          </button>
        </div>
        <div>
          <p style="font-size: 19px; font-weight: 500; margin: 0; padding: 13px;">${place.Name}</p>
        </div>
      </div>`;
  }

  /**
   * Attach a one-time listener to the custom infoWindow's close button.
   */
  private attachCustomInfoWindowClose(infoWindow: any, closeButtonId: string): void {
    google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
      const closeButton = document.getElementById(closeButtonId);
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          infoWindow.close();
          this.currentlyOpenInfoWindow = null;
        });
      }
    });
  }

  /**
   * Close the currently open InfoWindow if user clicks on the map.
   */
  private addMapClickListenerCustom(map: any): void {
    google.maps.event.addListener(map, 'click', () => {
      if (this.currentlyOpenInfoWindow) {
        this.currentlyOpenInfoWindow.close();
        this.currentlyOpenInfoWindow = null;
      }
    });
  }

  /**
   * Toggle visibility of custom markers based on isChecked value.
   */
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

  /**
   * Return visible prospect markers within given bounds.
   */
  getVisibleProspectMarkers(bounds: any): { lat: number; lng: number }[] {
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

  /**
   * Update marker styling on mouse enter/leave.
   * If marker not found, do nothing or consider re-creating if needed.
   */
  private updateMarker(map: any, place: any, isEntering: boolean): void {
    const { Latitude, Longitude, infoWindowContent } = place;
    if (!map || !this.markers) return;

    const markerIndex = this.markers.findIndex(
      (m: any) =>
        m.markerData.Latitude === +Latitude &&
        m.markerData.Longitude === +Longitude
    );

    // If marker found, update style
    if (markerIndex !== -1) {
      const existingMarker = this.markers[markerIndex];

      // Create a new infoWindow if needed
      const infoWindow = new google.maps.InfoWindow({ content: infoWindowContent });
      existingMarker.addListener('click', () => {
        infoWindow.open(map, existingMarker);
      });

      this.changeMarkerStyle(existingMarker, isEntering);
    }
  }

  /**
   * Change marker icon style on hover in/out.
   */
  private changeMarkerStyle(marker: any, isHovering: boolean): void {

    if (isHovering) {
      console.log(`is hover`);
      
      const hoverIcon = {
        url: this.getArrowSvgPurple(),
        scaledSize: new google.maps.Size(50, 50),
      };
      marker.setIcon(hoverIcon);
    } else {
      // Revert to original icon
      marker.setIcon(marker._originalIcon);
    }
  }
  clearMarkers() {
    this.markers.forEach(m => m.setMap(null));
    this.markers = [];
    this.prosMarkers = [];
    this.openInfoWindow = null;
    this.currentlyOpenInfoWindow = null;
  }
  
  /**
   * Public methods called by component templates to handle hover events.
   */
  onMouseEnter(map: any, place: any): void {
    this.updateMarker(map, place, true);
  }

  onMouseLeave(map: any, place: any): void {
    this.updateMarker(map, place, false);
  }

  /**
   * Returns red arrow SVG data URL.
   */
  private getArrowSvg(): string {
    return (
      'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M27.4933 11.2666C26.0933 5.10659 20.72 2.33325 16 2.33325C16 2.33325 16 2.33325 15.9867 2.33325C11.28 2.33325 5.89334 5.09325 4.49334 11.2533C2.93334 18.1333 7.14667 23.9599 10.96 27.6266C12.3733 28.9866 14.1867 29.6666 16 29.6666C17.8133 29.6666 19.6267 28.9866 21.0267 27.6266C24.84 23.9599 29.0533 18.1466 27.4933 11.2666ZM16 17.9466C13.68 17.9466 11.8 16.0666 11.8 13.7466C11.8 11.4266 13.68 9.54658 16 9.54658C18.32 9.54658 20.2 11.4266 20.2 13.7466C20.2 16.0666 18.32 17.9466 16 17.9466Z" fill="#FF4C4C"/>
      </svg>`)
    );
  }

  /**
   * Returns purple arrow SVG data URL.
   */
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
</svg>`)
    );
  }

  /**
   * Format and display unit size/lease info for shopping centers.
   */
  getShoppingCenterUnitSize(shoppingCenter: any): any {
    const formatNumberWithCommas = (number: number) => {
      return number.toLocaleString();
    };

    const formatLeasePrice = (price: any) => {
      if (price === 0 || price === 'On Request') return 'On Request';
      const priceNumber = parseFloat(price);
      return !isNaN(priceNumber) ? Math.floor(priceNumber) : price;
    };

    const places = shoppingCenter?.ShoppingCenter?.Places || [];
    const buildingSizes = places
      .map((place: any) => place.BuildingSizeSf)
      .filter((size: any) => size !== undefined && size !== null && !isNaN(size));

    if (buildingSizes.length === 0) {
      // If no valid places, check single center size
      const singleSize = shoppingCenter.BuildingSizeSf;
      if (singleSize) {
        const leasePrice = formatLeasePrice(shoppingCenter.ForLeasePrice);
        return (
          `Unit Size: ${formatNumberWithCommas(singleSize)} SF` +
          (leasePrice && leasePrice !== 'On Request'
            ? `<br>Lease Price: $${formatNumberWithCommas(leasePrice)}/month`
            : '')
        );
      }
      return null;
    }

    const minSize = Math.min(...buildingSizes);
    const maxSize = Math.max(...buildingSizes);
    const minPlace = places.find((p: any) => p.BuildingSizeSf === minSize);
    const maxPlace = places.find((p: any) => p.BuildingSizeSf === maxSize);

    const minPrice = minPlace?.ForLeasePrice || 'On Request';
    const maxPrice = maxPlace?.ForLeasePrice || 'On Request';

    const sizeRange =
      minSize === maxSize
        ? `${formatNumberWithCommas(minSize)} SF`
        : `${formatNumberWithCommas(minSize)} SF - ${formatNumberWithCommas(maxSize)} SF`;

    const formattedMinPrice = minPrice === 'On Request' ? 'On Request' : formatLeasePrice(minPrice);
    const formattedMaxPrice = maxPrice === 'On Request' ? 'On Request' : formatLeasePrice(maxPrice);

    // Determine displayed lease price
    const leasePrice =
      formattedMinPrice === 'On Request' && formattedMaxPrice === 'On Request'
        ? 'On Request'
        : formattedMinPrice === 'On Request'
        ? formattedMaxPrice
        : formattedMinPrice;

    const resultLeasePrice =
      leasePrice !== 'On Request'
        ? `$${formatNumberWithCommas(Math.floor((parseFloat(leasePrice) * minSize) / 12))}/month`
        : 'On Request';

    return `Unit Size: ${sizeRange}<br>Lease Price: ${resultLeasePrice}`;
  }

  /**
   * Calculate lease price for Stand-Alone units.
   */
  getStandAloneLeasePrice(forLeasePrice: any, buildingSizeSf: any): string {
    const leasePrice = Number(forLeasePrice);
    const size = Number(buildingSizeSf);

    if (!isNaN(leasePrice) && !isNaN(size) && leasePrice > 0 && size > 0) {
      const calculatedPrice = Math.floor((leasePrice * size) / 12);
      return `$${calculatedPrice.toLocaleString()}/month`;
    } else {
      return 'On Request';
    }
  }

  /**
   * Format numbers with commas.
   */
  formatNumberWithCommas(value: number | null): string {
    return value !== null ? value.toLocaleString() : '';
  }
}
