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
import { General } from 'src/app/shared/models/domain';
import { Center, Place } from 'src/app/shared/models/shoppingCenters';
import { BbPlace } from 'src/app/shared/models/buyboxPlaces';
import { BuyboxCategory } from 'src/app/shared/models/buyboxCategory';
import { ShareOrg } from 'src/app/shared/models/shareOrg';
import { PlacesService } from 'src/app/core/services/places.service';
import { MapsService } from 'src/app/core/services/maps.service';
import { StateService } from 'src/app/core/services/state.service';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';
import { Subscription, combineLatest, take } from 'rxjs';
declare const google: any;
@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css'],
})
export class MapViewComponent implements OnInit, OnDestroy {
  @ViewChild('map') mapElement!: ElementRef;
  @Output() viewChange = new EventEmitter<number>();
  map: any;
  markers: any[] = [];
  infoWindows: any[] = [];
  General: General = new General();
  // BuyBoxId!: any;
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
  isdataLoaded = false;
  private subscriptions: Subscription[] = [];
  CampaignId: any;

  constructor(
    private activatedRoute: ActivatedRoute,
    private PlacesService: PlacesService,
    private viewManagerService: ViewManagerService,
    private markerService: MapsService,
    private stateService: StateService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.General = new General();
    this.selectedState = '';
    this.selectedCity = '';
    this.activatedRoute.params.subscribe((params: any) => {
      // this.BuyBoxId = params.buyboxid;
      this.OrgId = params.orgId;
      this.BuyBoxName = params.buyboxName;
      this.CampaignId = params.campaignId;
      // localStorage.setItem('BuyBoxId', this.BuyBoxId);
      localStorage.setItem('OrgId', this.OrgId);
    });

    // Subscribe to data from ViewManagerService
    this.subscribeToServiceData();
   // this.viewManagerService.initializeData(this.CampaignId, this.OrgId);
  }
  private subscribeToServiceData(): void {
    // Subscribe to data loaded event
    this.subscriptions.push(
      this.viewManagerService.dataLoadedEvent$.subscribe(() => {
        // When all data is loaded, get it from the service
        this.loadDataFromService();
      })
    );
  }

  private loadDataFromService(): void {
    combineLatest([
      this.viewManagerService.shoppingCenters$,
      this.viewManagerService.buyboxPlaces$,
      this.viewManagerService.buyboxCategories$,
      this.viewManagerService.shareOrg$,
    ])
      .pipe(take(1))
      .subscribe(
        ([shoppingCenters, buyboxPlaces, buyboxCategories, shareOrg]) => {
          // Get shopping centers from service
          this.shoppingCenters = shoppingCenters;

          // Get buybox places from service
          this.buyboxPlaces = buyboxPlaces;

          // Get buybox categories from service
          this.buyboxCategories = buyboxCategories;

          // Get share org from service
          this.ShareOrg = shareOrg;

          // After data is loaded, update the map
          this.getAllMarker();
        }
      );
  }


  ngOnDestroy(): void {
    this.clearMarkers();
  }

  getShoppingCenters(): void {
    if (this.stateService.getShoppingCenters().length > 0) {
      this.shoppingCenters = this.stateService.getShoppingCenters();
      return;
    }

    const body: any = {
      Name: 'GetMarketSurveyShoppingCenters',
      Params: {
        CampaignId: this.CampaignId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.shoppingCenters = data.json;
        this.stateService.setShoppingCenters(data.json); 
        this.getBuyBoxPlaces(this.CampaignId);
      },
    });
  }

  getBuyBoxPlaces(campaignId: number): void {
    if (this.stateService.getBuyboxPlaces()?.length > 0) {
      this.buyboxPlaces = this.stateService.getBuyboxPlaces();
      this.getAllMarker();
      return;
    }

    const body: any = {
      Name: 'BuyBoxRelatedRetails',
      Params: {
        CampaignId: campaignId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.buyboxPlaces = data.json;
        this.stateService.setBuyboxPlaces(data.json);
        this.buyboxCategories?.forEach((category) => {
          category.isChecked = false;
          category.places = this.buyboxPlaces?.filter((place) =>
            place.RetailRelationCategories?.some((x) => x.Id === category.id)
          );
        });
        this.getAllMarker();
      },
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
      },
    });
  }

  BuyBoxPlacesCategories(): void {
    if (this.stateService.getBuyboxCategories().length > 0) {
      this.buyboxCategories = this.stateService.getBuyboxCategories();
      this.getShoppingCenters();
      return;
    }

    const body: any = {
      Name: 'GetRetailRelationCategories',
      Params: {
        CampaignId: this.CampaignId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.buyboxCategories = data.json;
        this.stateService.setBuyboxCategories(data.json);
        this.getShoppingCenters();
      },
    });
  }

  async getAllMarker() {
    try {
      const { Map } = await google.maps.importLibrary('maps');

      const mapElement = document.getElementById('map') as HTMLElement;
      if (!mapElement) {
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
            lat: this.shoppingCenters?.[0]?.Latitude,
            lng: this.shoppingCenters?.[0]?.Longitude,
          },
          zoom: 11,
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
    } finally {
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
