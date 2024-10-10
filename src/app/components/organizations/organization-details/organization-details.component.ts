import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfigService } from 'src/app/services/config.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OrganizationsService } from 'src/app/services/organizations.service';
import { Organization } from 'src/models/orgnizations';
declare const google: any;

@Component({
  selector: 'app-organization-details',
  templateUrl: './organization-details.component.html',
  styleUrls: ['./organization-details.component.css'],
})
export class OrganizationDetailsComponent {
  organization!: Organization;
  organizationId!: number;
  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private modalService: NgbModal,
    private OrganizationsService: OrganizationsService,
    private spinner: NgxSpinnerService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params: any) => {
      this.organizationId = params.id;
    });
    this.getOrgDetails(this.organizationId);
  }

  getOrgDetails(orgId: number) {
    this.OrganizationsService.GetOrganizationDetails(orgId).subscribe((res) => {
      this.organization = res;
      this.initMap();
    });
  }

  async initMap() {
    try {
      this.spinner.show();
      let markers = this.organization.timeline;
      // let fpo = this.General.fbo;
      // const goToPlace = this.goToPlace.bind(this);

      const { Map, InfoWindow } = await google.maps.importLibrary('maps');
      const map = new Map(document.getElementById('map') as HTMLElement, {
        center: {
          lat: markers[0]?.cityLatitude,
          lng: markers[0]?.cityLongitude,
        },
        zoom: 5,
        mapId: '1234567890',
      });

      markers.forEach((markerData, index) => {
        const lightness = 30 + (60 * index) / (markers.length - 1);
        const color = `hsl(0, 100%, ${lightness}%)`;
        const marker = new google.maps.Marker({
          map,
          position: {
            lat: markerData.cityLatitude,
            lng: markerData.cityLongitude,
          },
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 9, // Adjust the size of the circle
            fillColor: color, // Set the fill color to blue
            fillOpacity: 1, // Set the fill opacity
            strokeColor: 'white', // Set the stroke color
            strokeWeight: 2, // Set the stroke weight
          },
        });

        // marker.addListener('click', () => {
        //   const Id = markerData.placeId;
        //   goToPlace(markerData);
        // });

        // const distanceToNearestCommonBuilding = (
        //   markerData.distances.distance / 1000
        // ).toFixed(2);

        // const EstimatedBedsCurrentBuilding = Math.round(
        //   markerData.buildingSizeSf / fpo?.unit
        // );

        // const EstimatedBedsFutureBuilding = Math.round(
        //   (+markerData.far * markerData.landSf) / fpo?.unit
        // );

        const infoWindowContent = `
          <strong>City:</strong> ${markerData.city}
       <br>
          ${
            markerData.description
              ? `<strong>Description:</strong> ${markerData.description}<br>`
              : ''
          }
          ${
            markerData.eventTitle
              ? `<strong>Event Title:</strong> ${markerData.eventTitle} <br>`
              : ''
          }
          ${
            markerData.eventDate
              ? `<strong>Event Date:</strong> ${markerData.eventDate}<br>`
              : ''
          }
          <br>

        `;
        // <h6>WHY THIS OPPORTUNITY ?</h6>
        // <strong>Estimated Beds Current Building:</strong> ${EstimatedBedsCurrentBuilding}<br>
        // <strong>Estimated Beds Future Building:</strong> ${EstimatedBedsFutureBuilding}<br>
        // <strong>Distance For Nearest Common Building:</strong> ${distanceToNearestCommonBuilding} KM<br>

        const infoWindow = new InfoWindow({
          content: infoWindowContent,
        });

        // Event listener to show the InfoWindow when hovering over the marker
        marker.addListener('mouseover', () => {
          infoWindow.open(map, marker);
        });

        // Event listener to close the InfoWindow when the mouse leaves the marker
        marker.addListener('mouseout', () => {
          infoWindow.close();
        });
      });
    } finally {
      this.spinner.hide(); // Hide the spinner after map initialization
    }
  }
}
