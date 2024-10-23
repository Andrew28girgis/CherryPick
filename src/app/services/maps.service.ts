import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class MapsService {
  private competitorMarkers: any[] = [];
  private cotenantMarkers: any[] = [];
  storedBuyBoxId: any;
  storedLat: any;
  storedLon: any;
  private markers: any[] = []; // Array to hold all markers
  private prosMarkers: any[] = []; // Array to hold all markers

  constructor(private router: Router) {
    this.storedBuyBoxId = localStorage.getItem('BuyBoxId');
    this.storedLat = localStorage.getItem('placeLat');
    this.storedLon = localStorage.getItem('placeLon');
  }

  //Create Markers
  createMarker(
    map: any,
    markerData: any,
    color: string,
    type: string,
    useArrow: boolean = false,
    centerName?: string
  ): any {
    let icon = this.getMarkerIcon(markerData, color, useArrow, type);
    const marker = new google.maps.Marker({
      map,
      position: {
        lat: Number(markerData.latitude),
        lng: Number(markerData.longitude),
      },
      icon: icon,
    });
    this.markers.push(marker);

    this.assignToMarkerArray(marker, type);
    const infoWindow = this.createInfoWindow(markerData, type, centerName);
    this.addInfoWindowListener(marker, map, infoWindow, markerData);
    this.addMarkerEventListeners(marker, map, infoWindow, markerData);
    this.closeIconListeners(marker, map, infoWindow, markerData);

    return marker;
  }

  // Icons Style
  private getMarkerIcon(
    markerData: any,
    color: string,
    useArrow: boolean,
    type: string
  ): any {
    if (type === 'Co-Tenant' && markerData.name === 'Chipotle Mexican Grill') {
      return {
        url: 'https://seeklogo.com/images/C/chipotle-mexican-grill-logo-35771EBEA4-seeklogo.com.png',
        scaledSize: new google.maps.Size(28, 28),
      };
    } else if (type === 'Co-Tenant' && markerData.name == 'Five Guys') {
      return {
        url: 'https://wl3-cdn.landsec.com/sites/default/files/images/shops/logos/five_guys.jpg',
        scaledSize: new google.maps.Size(28, 28),
      };
    }

    if (useArrow) {
      return {
        url: this.getArrowSvg(),
        scaledSize: new google.maps.Size(40, 40),
      };
    }

    return {
      url: this.getArrowSvgBlack(),
      scaledSize: new google.maps.Size(30, 30),
    };
  }

  //Arrow SVG 
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

  //Black SVG  
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

  private assignToMarkerArray(marker: any, type: string): void {
    if (type === 'Competitor') {
      this.competitorMarkers.push(marker);
    } else if (type === 'Co-Tenant') {
      this.cotenantMarkers.push(marker);
    } else if (type === 'Prospect Target') {
      this.prosMarkers.push(marker);
    }
  }

  // Create Card Window
  private createInfoWindow(
    markerData: any,
    type: string,
    centerName?: string
  ): any {
    let content =
      type === 'Prospect Target'
        ? this.getInfoWindowContent(markerData, centerName)
        : this.getInfoWindowContentCompetitors(markerData, centerName);
    return new google.maps.InfoWindow({ content });
  }

  // Card Window Content
  private getInfoWindowContent(markerData: any, centerName?: string): string {
    return `
    
    <div class="info-window">
         
      <div class="main-img">
        <img src="../../../assets/Images/Main/${
          markerData.name
        }.jpg" alt="Main Image">
        <span class="close-btn">&times;</span>
      </div>

       <div class="content-wrap"> 
                ${
                  markerData.name
                    ? `<p class="content-title">${markerData.name.toUpperCase()}</p>`
                    : ''
                }
                    <p class="address-content">
                    <svg class="me-2" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.9999 11.1917C11.4358 11.1917 12.5999 10.0276 12.5999 8.5917C12.5999 7.15576 11.4358 5.9917 9.9999 5.9917C8.56396 5.9917 7.3999 7.15576 7.3999 8.5917C7.3999 10.0276 8.56396 11.1917 9.9999 11.1917Z" stroke="#817A79" stroke-width="1.5"/>
                      <path d="M3.01675 7.07484C4.65842 -0.141827 15.3501 -0.133494 16.9834 7.08317C17.9417 11.3165 15.3084 14.8998 13.0001 17.1165C11.3251 18.7332 8.67508 18.7332 6.99175 17.1165C4.69175 14.8998 2.05842 11.3082 3.01675 7.07484Z" stroke="#817A79" stroke-width="1.5"/>
                    </svg>
${markerData.address}, ${markerData.city}, ${markerData.state}</p>
                <div class="row"> 
                    ${
                      markerData.nearestCompetitors
                        ? `
                        <div class="col-md-4 col-sm-12 d-flex flex-column spec">
                            <p class="spec-head">Nearest Competitors</p>
                            <p class="spec-content">${markerData.nearestCompetitors.toFixed(
                              2
                            )} MI</p>
                        </div>`
                        : ''
                    }
                    ${
                      markerData.nearestCotenants
                        ? `
                        <div class="col-md-4 col-sm-12 d-flex flex-column spec">
                            <p class="spec-head">Nearest Complementary</p>
                            <p class="spec-content">${markerData.nearestCotenants.toFixed(
                              2
                            )} MI</p>
                        </div>`
                        : ''
                    }
                    ${
                      markerData.avalibleUnits
                        ? `
                        <div class="col-md-4 col-sm-12  d-flex flex-column spec">
                            <p class="spec-head">Available Units</p>
                            <p class="spec-content">${markerData.avalibleUnits}</p>
                        </div>`
                        : ''
                    }
                 
                </div>
                <div class="buttons-wrap">
                    <button id="view-details-${
                      markerData.id
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

  private getInfoWindowContentCompetitors(
    markerData: any,
    centerName?: string
  ): string {
    return ` <div> 
            <div class="p-3"> 
                ${
                  markerData.name
                    ? `<p class="content-title">${markerData.name.toUpperCase()}</p>`
                    : ''
                }
       
            </div>
        </div>`;
  }

  // Click View Details
  private addInfoWindowListener(
    marker: any,
    map: any,
    infoWindow: any,
    markerData: any
  ): void {
    this.storedBuyBoxId = localStorage.getItem('BuyBoxId');
    marker.addListener('click', () => infoWindow.open(map, marker));
    google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
      const viewDetailsButton = document.getElementById(
        `view-details-${markerData.id}`
      );
      if (viewDetailsButton) {
        viewDetailsButton.addEventListener('click', () =>
          this.router.navigate(['/landing', markerData.id, this.storedBuyBoxId])
        );
      }
    });
  }

  // Event On Point
  private addMarkerEventListeners(
    marker: any,
    map: any,
    infoWindow: any,
    markerData: any
  ): void {
    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    const viewDetailsButton = document.getElementById(
      `view-details-${markerData.id}`
    );
    // marker.addListener('mouseout', () => {
    //   infoWindow.close();
    // });
  }

  // Close Card
  private closeIconListeners(
    marker: any,
    map: any,
    infoWindow: any,
    markerData: any
  ): void {
    google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
      const close = document.querySelector('.close-btn');
      close?.addEventListener('click', () => {
        infoWindow.close();
      });
    });
  }

  //Toggle show and hide markers
  toggleMarkers(type: string, show: boolean, map: any) {
    let markers: any[] = [];
    switch (type) {
      case 'Competitor':
        markers = this.competitorMarkers;
        break;
      case 'Co-Tenant':
        markers = this.cotenantMarkers;
        break;

      default:
        console.error('Invalid marker type specified');
        return;
    }

    markers.forEach((marker) => {
      marker.setMap(show ? map : null);
    });
  }

  //Get Marker Icons
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
  
}
