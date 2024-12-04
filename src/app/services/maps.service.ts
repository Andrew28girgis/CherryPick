import { Injectable } from '@angular/core';
import { BuyboxCategory } from 'src/models/buyboxCategory';
declare const google: any;
import {  Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class MapsService {
  storedBuyBoxId: any;
  private markers: any[] = [];
  private prosMarkers: any[] = [];
  private markerMap: { [key: string]: any[] } = {};
  private openInfoWindow: any | null = null;
  private map: any;

  constructor(public router: Router) {
    this.storedBuyBoxId = localStorage.getItem('BuyBoxId');
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
      // Close the info window when clicking on the map, if one is open
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
    marker.markerData.ShoppingCenter
      ? (placeId = markerData.ShoppingCenter.Places[0].Id)
      : (placeId = markerData.Id);

    const viewDetailsButton = document.getElementById(
      `view-details-${placeId}`
    );

    if (viewDetailsButton) {
      viewDetailsButton.addEventListener('click', () => {
        this.handleViewDetailsClick(placeId);
      });
    } else {
      console.log(`Button for marker ${placeId} not found`);
    }
  }

  private handleViewDetailsClick(markerId: any): void {
    console.log(`View details for marker ID: ${markerId}`);
    this.router.navigate(['/landing', markerId, 0 ,this.storedBuyBoxId]);
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
          <svg class="me-2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.9999 11.1917C11.4358 11.1917 12.5999 10.0276 12.5999 8.5917C12.5999 7.15576 11.4358 5.9917 9.9999 5.9917C8.56396 5.9917 7.3999 7.15576 7.3999 8.5917C7.3999 10.0276 8.56396 11.1917 9.9999 11.1917Z" stroke="#817A79" stroke-width="1.5"/>
            <path d="M3.01675 7.07484C4.65842 -0.141827 15.3501 -0.133494 16.9834 7.08317C17.9417 11.3165 15.3084 14.8998 13.0001 17.1165C11.3251 18.7332 8.67508 18.7332 6.99175 17.1165C4.69175 14.8998 2.05842 11.3082 3.01675 7.07484Z" stroke="#817A79" stroke-width="1.5"/>
          </svg>
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
        <div class="buttons-wrap">
        
          <button id="view-details-${
            markerData.ShoppingCenter.Places
              ? markerData.ShoppingCenter.Places[0].Id
              : 0
          }" class="view-details-card">View Details
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.9999 11.75C12.8099 11.75 12.6199 11.68 12.4699 11.53C12.1799 11.24 12.1799 10.76 12.4699 10.47L20.6699 2.26999C20.9599 1.97999 21.4399 1.97999 21.7299 2.26999C22.0199 2.55999 22.0199 3.03999 21.7299 3.32999L13.5299 11.53C13.3799 11.68 13.1899 11.75 12.9999 11.75Z" fill="#fff"/>
              <path d="M22.0002 7.55C21.5902 7.55 21.2502 7.21 21.2502 6.8V2.75H17.2002C16.7902 2.75 16.4502 2.41 16.4502 2C16.4502 1.59 16.7902 1.25 17.2002 1.25H22.0002C22.4102 1.25 22.7502 1.59 22.7502 2V6.8C22.7502 7.21 22.4102 7.55 22.0002 7.55Z" fill="#fff"/>
              <path d="M15 22.75H9C3.57 22.75 1.25 20.43 1.25 15V9C1.25 3.57 3.57 1.25 9 1.25H11C11.41 1.25 11.75 1.59 11.75 2C11.75 2.41 11.41 2.75 11 2.75H9C4.39 2.75 2.75 4.39 2.75 9V15C2.75 19.61 4.39 21.25 9 21.25H15C19.61 21.25 21.25 19.61 21.25 15V13C21.25 12.59 21.59 12.25 22 12.25C22.41 12.25 22.75 12.59 22.75 13V15C22.75 20.43 20.43 22.75 15 22.75Z" fill="#fff"/>
            </svg>
          </button>
        </div>
      </div>
    </div>`;
  }

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
          <p class="address-content"> 
            Lease Price: ${markerData.ForLeasePrice} 
          </p>
          <div class="buttons-wrap">
            <button id="view-details-${
              markerData.Id
            }" class="view-details-card">View Details
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

  private currentlyOpenInfoWindow: any | null = null;

  createCustomMarker(map: any, markerData: BuyboxCategory): void {
    console.log(`custom marker created`);
    console.log(markerData);

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

  onMouseEnter(map: any, place: any): void {
    const { Latitude, Longitude } = place;

    if (map && this.markers) {
      // Find the existing marker based on its latitude and longitude
      const markerIndex = this.markers.findIndex(
        (m: any) =>
          m.getPosition()?.lat() === +Latitude &&
          m.getPosition()?.lng() === +Longitude
      );

      // If a matching marker is found, remove it from the map and the markers array
      if (markerIndex !== -1) {
        const existingMarker = this.markers[markerIndex];
        existingMarker.setMap(null); // Remove from map
        this.markers.splice(markerIndex, 1); // Remove from markers array

        // Add a new marker with your custom icon
        const newMarker = new google.maps.Marker({
          position: { lat: +Latitude, lng: +Longitude },
          map,
          icon: {
            url: this.getArrowSvgPurple(),
            scaledSize: new google.maps.Size(40, 40),
          },
        });
        this.markers.push(newMarker);
      }
    }
  }

  onMouseLeave(map: any, place: any): void {
    const { Latitude, Longitude } = place;

    if (map && this.markers) {
      // Find the marker created on mouse enter
      const markerIndex = this.markers.findIndex(
        (m: any) =>
          m.getPosition()?.lat() === +Latitude &&
          m.getPosition()?.lng() === +Longitude
      );

      // If the marker exists, remove it and replace it with the original icon marker
      if (markerIndex !== -1) {
        const existingMarker = this.markers[markerIndex];
        existingMarker.setMap(null); // Remove it from the map
        this.markers.splice(markerIndex, 1); // Remove from markers array

        // Add a new marker with the original icon
        const originalMarker = new google.maps.Marker({
          position: { lat: +Latitude, lng: +Longitude },
          map,
          icon: {
            url: this.getArrowSvg(),
            scaledSize: new google.maps.Size(40, 40),
          },
        });

        this.markers.push(originalMarker);
      }
    }
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
      encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
            <g clip-path="url(#clip0_699_4706)">
            <path d="M34.0399 5.43991L27.0799 8.91991C25.1399 9.87991 22.8799 9.87991 20.9399 8.91991L13.9599 5.41991C7.99995 2.43991 1.69995 8.87991 4.81995 14.7799L6.45995 17.8599C6.67995 18.2799 7.03995 18.6199 7.47995 18.8199L32.7799 30.1999C33.8199 30.6599 35.0399 30.2399 35.5599 29.2399L43.1799 14.7599C46.2799 8.87991 39.9999 2.43991 34.0399 5.43991Z" fill="#007BFF"/>
            <path d="M31.1999 32.62L14.6399 25.16C12.7799 24.32 10.8999 26.32 11.8599 28.12L17.9399 39.66C20.5199 44.56 27.5199 44.56 30.0999 39.66L32.2399 35.58C32.7999 34.48 32.3199 33.14 31.1999 32.62Z" fill="#007BFF"/>
            </g>
            <defs>
            <clipPath id="clip0_699_4706">
            <rect width="48" height="48" fill="white"/>
            </clipPath>
            </defs>
            </svg>`)
    );
  }

  getShoppingCenterUnitSize(shoppingCenter: any): any {
    if (shoppingCenter.ShoppingCenter) {
      const places = shoppingCenter.ShoppingCenter.Places;
      if (places && places.length > 0) {
        const buildingSizes = places
          .map((place: any) => place.BuildingSizeSf)
          .filter(
            (size: any) => size !== undefined && size !== null && !isNaN(size)
          );

        if (buildingSizes.length === 0) {
          return null;
        }

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

        // Check if min and max lease prices are the same or if either is "On Request"
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

  formatNumberWithCommas(value: number | null): string {
    if (value !== null) {
      return value?.toLocaleString();
    } else {
      return '';
    }
  }
}
