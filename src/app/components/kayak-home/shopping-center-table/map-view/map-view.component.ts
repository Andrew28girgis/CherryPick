import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  NgZone,
  Output,
  EventEmitter,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlacesService } from 'src/app/shared/services/places.service';
import { General } from 'src/app/shared/models/domain';
import { NgxSpinnerService } from 'ngx-spinner';
import { MapsService } from 'src/app/shared/services/maps.service';
import { Center, Place } from 'src/app/shared/models/shoppingCenters';
import { StateService } from '../../../../shared/services/state.service';
import { BbPlace } from 'src/app/shared/models/buyboxPlaces';
import { BuyboxCategory } from 'src/app/shared/models/buyboxCategory';
import { ShareOrg } from 'src/app/shared/models/shareOrg';

declare const google: any;

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css'],
})
export class MapViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('map') mapElement!: ElementRef;
  @Output() viewChange = new EventEmitter<number>();
  map: any;
  markers: any[] = [];
  infoWindows: any[] = [];
  General: General = new General();
  BuyBoxId!: any;
  OrgId!: any;
  shoppingCenters: Center[] = [];
  buyboxPlaces: BbPlace[] = [];
  savedMapView: any;
  buyboxCategories: BuyboxCategory[] = [];
  standAlone: Place[] = [];
  cardsSideList: any[] = [];
  selectedState = '0';
  selectedCity = '';
  BuyBoxName = '';
  ShareOrg: ShareOrg[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private PlacesService: PlacesService,
    private spinner: NgxSpinnerService,
    private markerService: MapsService,
    private stateService: StateService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.General = new General();
    this.selectedState = '';
    this.selectedCity = '';
    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;
      this.OrgId = params.orgId;
      this.BuyBoxName = params.buyboxName;
      localStorage.setItem('BuyBoxId', this.BuyBoxId);
      localStorage.setItem('OrgId', this.OrgId);
    });

    this.BuyBoxPlacesCategories(this.BuyBoxId);
    this.GetOrganizationById(this.OrgId);
    this.getShoppingCenters(this.BuyBoxId);
    this.getBuyBoxPlaces(this.BuyBoxId);
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.clearMarkers();
  }

  getShoppingCenters(buyboxId: number): void {
    if (this.stateService.getShoppingCenters().length > 0) {
      this.shoppingCenters = this.stateService.getShoppingCenters();
      return;
    }

    this.spinner.show();
    const body: any = {
      Name: 'GetMarketSurveyShoppingCenters',
      Params: {
        BuyBoxId: buyboxId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.shoppingCenters = data.json;
        this.stateService.setShoppingCenters(data.json);
        this.spinner.hide();
        this.getBuyBoxPlaces(this.BuyBoxId);
      }
    });
  }

  getBuyBoxPlaces(buyboxId: number): void {
    if (this.stateService.getBuyboxPlaces()?.length > 0) {
      this.buyboxPlaces = this.stateService.getBuyboxPlaces();
      this.getAllMarker();
      return;
    }

    const body: any = {
      Name: 'BuyBoxRelatedRetails',
      Params: {
        BuyBoxId: buyboxId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.buyboxPlaces = data.json;
        this.stateService.setBuyboxPlaces(data.json);
        this.buyboxCategories.forEach((category) => {
          category.isChecked = false;
          category.places = this.buyboxPlaces?.filter((place) =>
            place.RetailRelationCategories?.some((x) => x.Id === category.id)
          );
        });
        this.getAllMarker();
      }
    });
  }

  GetOrganizationById(orgId: number): void {
    const shareOrg = this.stateService.getShareOrg() || [];

    if (shareOrg && shareOrg.length > 0) {
      this.ShareOrg = this.stateService.getShareOrg();
      return;
    }

    const body: any = {
      Name: 'GetOrganizationById',
      Params: {
        organizationid: orgId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.ShareOrg = data.json;
        this.stateService.setShareOrg(data.json);
      }
    });
  }

  BuyBoxPlacesCategories(buyboxId: number): void {
    if (this.stateService.getBuyboxCategories().length > 0) {
      this.buyboxCategories = this.stateService.getBuyboxCategories();
      this.getShoppingCenters(buyboxId);
      return;
    }

    const body: any = {
      Name: 'GetRetailRelationCategories',
      Params: {
        BuyBoxId: buyboxId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.buyboxCategories = data.json;
        this.stateService.setBuyboxCategories(data.json);
        this.getShoppingCenters(this.BuyBoxId);
      }
    });
  }

  async getAllMarker() {
    try {
      this.spinner.show();
      const { Map } = await google.maps.importLibrary('maps');

      const mapElement = document.getElementById('map') as HTMLElement;
      if (!mapElement) {
        console.error('Element with id "map" not found.');
        return;
      }

      if (this.savedMapView) {
        const { lat, lng, zoom } = JSON.parse(this.savedMapView);
        this.map = new Map(mapElement, {
          center: { lat: lat, lng: lng },
          zoom: zoom,
          mapId: '1234567890',
        });
      } else {
        this.map = new Map(mapElement, {
          center: {
            lat: this.shoppingCenters
              ? this.shoppingCenters?.[0]?.Latitude
              : this.standAlone?.[0]?.Latitude || 0,
            lng: this.shoppingCenters
              ? this.shoppingCenters?.[0]?.Longitude
              : this.standAlone?.[0]?.Longitude || 0,
          },
          zoom: 8,
          mapId: '1234567890',
        });
      }

      this.map.addListener('dragend', () => this.onMapDragEnd(this.map));
      this.map.addListener('zoom_changed', () => this.onMapDragEnd(this.map));
      this.map.addListener('bounds_changed', () => this.onMapDragEnd(this.map));

      if (this.shoppingCenters && this.shoppingCenters.length > 0) {
        this.createMarkers(this.shoppingCenters, 'Shopping Center');
      }

      if (this.standAlone && this.standAlone.length > 0) {
        this.createMarkers(this.standAlone, 'Stand Alone');
      }

      this.createCustomMarkers(this.buyboxCategories);
    } catch (error) {
      console.error('Error loading markers:', error);
    } finally {
      this.spinner.hide();
    }
  }

  createMarkers(markerDataArray: any[], type: string) {
    markerDataArray.forEach((markerData) => {
      this.markerService.createMarker(this.map, markerData, type);
      // this.markerService.fetchAndDrawPolygon(th)
    });
  }

  createCustomMarkers(markerDataArray: any[]) {
    markerDataArray?.forEach((categoryData) => {
      this.markerService.createCustomMarker(this.map, categoryData);
    });
  }

  private onMapDragEnd(map: any) {
    this.saveMapView(map);
    this.updateShoppingCenterCoordinates();
    this.updateCardsSideList(map);
  }

  private updateShoppingCenterCoordinates(): void {
    if (this.shoppingCenters) {
      this.shoppingCenters?.forEach((center) => {
        center.Latitude = center.Latitude;
        center.Longitude = center.Longitude;
      });
    }
  }

  private updateCardsSideList(map: any): void {
    const bounds = map.getBounds();
    const visibleMarkers =
      this.markerService?.getVisibleProspectMarkers(bounds);
    const visibleCoords = new Set(
      visibleMarkers.map((marker) => `${marker.lat},${marker.lng}`)
    );

    const allProperties = [
      ...(this.shoppingCenters || []),
      ...(this.standAlone || []),
    ];

    // Update the cardsSideList inside NgZone
    this.ngZone.run(() => {
      this.cardsSideList = allProperties.filter(
        (property) =>
          visibleCoords.has(`${property.Latitude},${property.Longitude}`) ||
          this.isWithinBounds(property, bounds)
      );
    });
  }

  private isWithinBounds(property: any, bounds: any): boolean {
    const lat = Number.parseFloat(property.Latitude);
    const lng = Number.parseFloat(property.Longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return false;
    }

    return bounds?.contains({ lat, lng });
  }

  private saveMapView(map: any): void {
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
  }

  private initMap(): void {
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
      setTimeout(() => this.initMap(), 1000);
      return;
    }

    const mapOptions = {
      center: { lat: 37.0902, lng: -95.7129 },
      zoom: 4,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
      fullscreenControl: true,
      streetViewControl: true,
      zoomControl: true,
    };

    this.map = new google.maps.Map(document.getElementById('map'), mapOptions);

    if (this.shoppingCenters.length > 0) {
      this.addMarkersToMap();
    }
  }

  private addMarkersToMap(): void {
    if (!this.map || !this.shoppingCenters.length) return;

    this.clearMarkers();
    const bounds = new google.maps.LatLngBounds();

    this.shoppingCenters.forEach((center: any) => {
      if (center.Latitude && center.Longitude) {
        const position = new google.maps.LatLng(
          center.Latitude,
          center.Longitude
        );
        bounds.extend(position);

        const marker = new google.maps.Marker({
          position: position,
          map: this.map,
          title: center.CenterName,
          animation: google.maps.Animation.DROP,
          icon: {
            url: 'assets/Images/Icons/map-marker.png',
            scaledSize: new google.maps.Size(30, 40),
          },
        });

        const infoWindow = new google.maps.InfoWindow({
          content: this.createInfoWindowContent(center),
        });

        marker.addListener('click', () => {
          this.closeAllInfoWindows();
          infoWindow.open(this.map, marker);
        });

        this.markers.push(marker);
        this.infoWindows.push(infoWindow);
      }
    });

    if (!bounds.isEmpty()) {
      this.map.fitBounds(bounds);

      // Adjust zoom level if there's only one marker
      if (this.markers.length === 1) {
        this.ngZone.runOutsideAngular(() => {
          google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
            this.map.setZoom(15);
          });
        });
      }
    }
  }

  private createInfoWindowContent(center: any): string {
    return `
      <div class="info-window">
        <h4>${center.CenterName}</h4>
        <p>${center.CenterAddress}, ${center.CenterCity}, ${
      center.CenterState
    }</p>
        <a href="/landing/${center.ShoppingCenter?.Places?.[0]?.Id || 0}/${
      center.Id
    }/${this.BuyBoxId}" class="info-link">View Details</a>
      </div>
    `;
  }

  private closeAllInfoWindows(): void {
    this.infoWindows.forEach((window) => window.close());
  }

  private clearMarkers(): void {
    this.markers.forEach((marker) => marker.setMap(null));
    this.markers = [];
    this.infoWindows = [];
  }

  highlightMarker(place: any): void {
    if (!place.Latitude || !place.Longitude) return;

    const markerIndex = this.markers.findIndex(
      (marker) =>
        marker.getPosition().lat() === place.Latitude &&
        marker.getPosition().lng() === place.Longitude
    );

    if (markerIndex !== -1) {
      this.markers[markerIndex].setAnimation(google.maps.Animation.BOUNCE);
      this.map.panTo(this.markers[markerIndex].getPosition());
    }
  }

  unhighlightMarker(place: any): void {
    if (!place.Latitude || !place.Longitude) return;

    const markerIndex = this.markers.findIndex(
      (marker) =>
        marker.getPosition().lat() === place.Latitude &&
        marker.getPosition().lng() === place.Longitude
    );

    if (markerIndex !== -1) {
      this.markers[markerIndex].setAnimation(null);
    }
  }
}
