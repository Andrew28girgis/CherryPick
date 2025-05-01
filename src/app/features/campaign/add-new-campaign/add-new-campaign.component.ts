import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { SelectItem } from 'primeng/api';
import {
  AutoCompleteCompleteEvent,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';
import {
  firstValueFrom,
  from,
  Observable,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import { BreadcrumbService } from 'src/app/core/services/breadcrumb.service';
import { CampaignDrawingService } from 'src/app/core/services/campaign-drawing.service';
import { GenericMapService } from 'src/app/core/services/generic-map.service';
import { MapDrawingService } from 'src/app/core/services/map-drawing.service';
import { PlacesService } from 'src/app/core/services/places.service';
import { PolygonsControllerService } from 'src/app/core/services/polygons-controller.service';
import { IMapBounds } from 'src/app/shared/interfaces/imap-bounds';
import { IMapCity } from 'src/app/shared/interfaces/imap-city';
import { IMapState } from 'src/app/shared/interfaces/imap-state';
import { IGeoJson } from 'src/app/shared/models/igeo-json';
import {
  Geometry,
  IGlobalGeoJson,
} from 'src/app/shared/models/iglobal-geo-json';
import { IPolygon } from 'src/app/shared/models/ipolygons-controller';
import { environment } from 'src/environments/environment';

// interface ShoppingCenter {
//   id: number;
//   centerName: string;
//   latitude: number;
//   longitude: number;
// }

@Component({
  selector: 'app-add-new-campaign',
  templateUrl: './add-new-campaign.component.html',
  styleUrl: './add-new-campaign.component.css',
})
export class AddNewCampaignComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private destroy$ = new Subject<void>();
  private stateSubject: Subject<string> = new Subject<string>();
  private contactId!: number;
  private addedStates: Map<string, string> = new Map<string, string>();
  private addedCities: Map<string, string[]> = new Map<string, string[]>();

  protected buyBoxId!: number;
  protected selectedDrawingModeId: number = 1;
  protected visabilityOptions: any[] = [
    { label: 'Private', value: 1 },
    { label: 'Public', value: 0 },
  ];
  protected isPrivateCampaign: number = 1;
  protected campaignName: string = '';
  protected loadingGlobalPolygons: boolean = false;
  protected mapBounds: IMapBounds | null = null;
  protected mapStates: IMapState[] = [];
  protected selectedStateTab: string = '';
  protected mapCities: IMapCity[] = [];
  protected mapAreasCollapsed: boolean = false;
  protected addedListCollapsed: boolean = false;
  protected addedListTabs: string[] = ['States', 'Cities', 'Neighborhoods'];
  protected selectedAddedListTab: string = '';

  @ViewChild('mapContainer', { static: false }) gmapContainer!: ElementRef;

  protected userBuyBoxes!: { Id: number; Name: string }[];

  // map!: google.maps.Map;
  // polygonSearch: string = '';
  // externalPolygons: IPolygon[] = [];
  // displayedExternalPolygons: number[] = [];
  // polygonShoppingCenters: Map<number, ShoppingCenter[]> = new Map<
  //   number,
  //   ShoppingCenter[]
  // >();
  // searchedPolygonId: number = 0;
  // displayedPolygonsCenters: number[] = [];
  // userPolygons: IPolygon[] = [];
  // displayUserPolygons: boolean = false;
  // isSearching: boolean = false;
  // states!: SelectItem[];
  // filteredStates!: SelectItem[];
  // selectedState: string | undefined;
  // cities!: SelectItem[];
  // filteredCities!: SelectItem[];
  // selectedCity: string | undefined;
  // globalPolygons: Map<string, Geometry> = new Map<string, Geometry>();

  // displayMapZoomMessage: boolean = false;
  // currentAdminLevel: number = 6;

  // infoWindow = new google.maps.InfoWindow();

  // @Output() onCampaignCreated = new EventEmitter<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private genericMapService: GenericMapService,
    private campaignDrawingService: CampaignDrawingService,
    private modalService: NgbModal,
    private placesService: PlacesService,
    private httpClient: HttpClient,
    private router: Router,
    private spinner: NgxSpinnerService,
    private polygonsControllerService: PolygonsControllerService,
    private breadcrumbService: BreadcrumbService
  ) {}

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Campaigns', url: '/summary' },
      { label: 'Add Campaign', url: '/add-campaign' },
    ]);
    const contact = localStorage.getItem('contactId');
    if (contact) {
      this.contactId = +contact;
    }

    this.mapBoundsChangeListeners();
    this.getUserBuyBoxes();
    // to be uncommented
    // this.getAllStates();
    // this.mapZoomLevelChangeListeners();
    // this.polygonsListeners();
    // this.circlesListeners();
    // this.drawingCancelListener();
    // this.getUserPolygons();
    // this.stateChangeListener();
  }

  ngAfterViewInit(): void {
    this.campaignDrawingService.initializeMap(this.gmapContainer);
    this.campaignDrawingService.initializeStaticDrawingManager();
    const map = this.campaignDrawingService.getMap();
    if (map) this.genericMapService.updateMapZoomLevel(map, 13);
    this.campaignDrawingService.addFeatureClickListener();
  }

  getUserBuyBoxes(): void {
    this.spinner.show();

    const body: any = {
      Name: 'GetUserBuyBoxes',
      Params: {},
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (response) => {
        this.spinner.hide();
        if (response.json && response.json.length > 0) {
          this.userBuyBoxes = response.json.map((buybox: any) => {
            return {
              Id: buybox.Id,
              Name: buybox.Name,
            };
          });
        } else {
          this.userBuyBoxes = [];
        }
      },
    });
  }

  startDrawing(modeId: number, shape: string) {
    this.selectedDrawingModeId = modeId;
    this.campaignDrawingService.setStaticDrawingMode(shape);
    this.cdr.detectChanges();
  }

  // to be uncommented
  // polygonsListeners(): void {
  //   this.campaignDrawingService.onPolygonCreated
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe((polygon) => {
  //       this.startDrawing(1, 'move');
  //     });
  // }

  mapBoundsChangeListeners(): void {
    this.genericMapService.onMapBoundsChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((bounds: IMapBounds) => {
        this.mapBounds = bounds;
        this.cdr.detectChanges();

        const map = this.campaignDrawingService.getMap();
        if (map)
          this.genericMapService.getStatesInsideMapView(map, (states) => {
            this.mapStates = states.sort((a: IMapState, b: IMapState) =>
              a.code.localeCompare(b.code)
            );
            if (this.mapStates && this.mapStates.length) {
              this.selectedStateTab = this.mapStates[0].code;
            }
            for (let state of this.mapStates) {
              this.getAllCitiesByStateCode(state);
            }

            this.cdr.detectChanges();
          });

        this.loadingGlobalPolygons = true;
        this.cdr.detectChanges();
        this.getGeoJsonsFile();
      });
  }

  /**/
  // to be uncommented
  // circlesListeners(): void {
  //   this.campaignDrawingService.onCircleCreated
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe((circle) => {
  //       this.startDrawing(1, 'move');
  //     });
  // }

  /**/
  // to be uncommented
  // drawingCancelListener(): void {
  //   this.campaignDrawingService.onDrawingCancel
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe(() => {
  //       this.startDrawing(1, 'move');
  //     });
  // }

  // to be uncommented
  // get getDrawnList() {
  //   return this.campaignDrawingService.getDrawnList();
  // }

  openNewCampaignPopup(content: TemplateRef<any>): void {
    this.modalService.open(content, { centered: true });
  }

  // to be uncommented
  // getUserPolygons(): void {
  //   const body: any = {
  //     Name: 'GetUserPolygons',
  //     Params: {},
  //   };

  //   this.placesService.GenericAPI(body).subscribe((response) => {
  //     if (response.json && response.json.length > 0) {
  //       this.userPolygons = response.json;
  //       this.addUserPolygonsToMap();
  //     }
  //   });
  // }

  syncMarketSurveyWithCampaign(campaignId: number): void {
    const body: any = {
      Name: 'SyncMarketSurveyWithCampaign',
      Params: { CampaignId: campaignId },
    };

    this.placesService.GenericAPI(body).subscribe((response) => {});
  }

  scrollToMap(): void {
    this.gmapContainer.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  // to be uncommented
  createNewCampaign(): void {
    if (!this.buyBoxId) {
      alert('Plese select a buybox first.');
      return;
    }

    if (this.campaignName.trim().length == 0) {
      alert('Plese set campaign name first.');
      return;
    }

    this.spinner.show();
    const body: any = {
      Name: 'CreateCampaign ',
      Params: {
        CampaignName: this.campaignName,
        CampaignPrivacy: this.isPrivateCampaign,
        BuyBoxId: this.buyBoxId,
        CreatedDate: new Date(),
      },
    };

    this.placesService.GenericAPI(body).subscribe((response) => {
      if (response.json && response.json.length > 0 && response.json[0].id) {
        setTimeout(() => {
          this.spinner.hide();
          this.modalService.dismissAll();
          this.router.navigate(['/summary']);
        }, 1000);
        this.attachAreasToCampaign(response.json[0].id);
        this.attachFeaturesToCampaign(response.json[0].id);
      }
    });
  }

  attachAreasToCampaign(campaignId: number): void {
    const states = Array.from(this.addedStates.keys()).join(', ');
    const cities = Array.from(this.addedCities.entries())
      .map(([key, value]) => ({
        key,
        value: value.join(', '),
      }))
      .map((city) => city.value)
      .join(', ');
    const body = {
      Name: 'SyncMarketSurveyWithCampaignByCityAndState',
      Params: {
        CampaignId: campaignId,
        States: states || '',
        Cities: cities || '',
      },
    };

    this.placesService.GenericAPI(body).subscribe((response) => {});
  }

  attachFeaturesToCampaign(campaignId: number): void {
    const PolygonIds = this.getAllAddedFeatures.join(', ');
    const body = {
      Name: 'SyncMarketSurveyWithCampaignByPolygonId',
      Params: {
        CampaignId: campaignId,
        PolygonIds: PolygonIds || '',
      },
    };

    this.placesService.GenericAPI(body).subscribe((response) => {});
  }

  async insertNewPolygons(data: {
    contactId: number;
    CampaignId: number;
    name: string;
    city: string;
    state: string;
    geoJson: any;
    center: string;
    radius: string;
  }): Promise<void> {
    const body: any = {
      State: data.state,
      City: data.city,
      Name: data.name,
      PropertyType: 'Polygon',
      ContactId: data.contactId,
      CampaignId: data.CampaignId,
      CreationDate: new Date(),
      Json: data.geoJson,
      Center: data.center,
      Radius: data.radius,
    };

    const response = await firstValueFrom(
      this.httpClient.post<any>(`${environment.api}/GeoJson/AddGeoJson`, body)
    );
  }

  async attachPolygonToMyCampaign(
    campaignId: number,
    polygonId: number
  ): Promise<void> {
    const body: any = {
      Name: 'AttachPolygonToBuyBox',
      Params: {
        CampaignId: campaignId,
        PolygonId: polygonId,
      },
    };

    const response = await firstValueFrom(this.placesService.GenericAPI(body));
  }

  // filterStates(event: AutoCompleteCompleteEvent) {
  //   //in a real application, make a request to a remote url with the query and return filtered results, for demo we filter at client side
  //   let filtered: any[] = [];
  //   let query = event.query;

  //   for (let i = 0; i < (this.states as any[]).length; i++) {
  //     let item = (this.states as any[])[i];
  //     if (item.label.toLowerCase().indexOf(query.toLowerCase()) == 0) {
  //       filtered.push(item);
  //     }
  //   }

  //   this.filteredStates = filtered;
  // }

  // filterCities(event: AutoCompleteCompleteEvent) {
  //   //in a real application, make a request to a remote url with the query and return filtered results, for demo we filter at client side
  //   let filtered: any[] = [];
  //   let query = event.query;

  //   for (let i = 0; i < (this.cities as any[]).length; i++) {
  //     let item = (this.cities as any[])[i];
  //     if (item.label.toLowerCase().indexOf(query.toLowerCase()) == 0) {
  //       filtered.push(item);
  //     }
  //   }

  //   this.filteredCities = filtered;
  // }

  // getAllStates(): void {
  //   const body: any = {
  //     Name: 'GetAllStates',
  //     Params: {},
  //   };

  //   this.placesService.GenericAPI(body).subscribe((response) => {
  //     if (response.json && response.json.length > 0) {
  //       const data: {
  //         stateName: string;
  //         stateCode: string;
  //       }[] = response.json;
  //       this.states = data.map((state) => ({
  //         label: state.stateName,
  //         value: state.stateCode,
  //       }));
  //       this.filteredStates = this.states;
  //     }
  //   });
  // }

  addState(stateCode: string, stateName: string): void {
    this.selectedAddedListTab = 'States';
    const condition = this.addedStates.has(stateCode);
    if (!condition) {
      this.selectedStateTab = '';
      this.addedStates.set(stateCode, stateName);
      const citiesCondition = this.addedCities.has(stateCode);
      if (citiesCondition) this.addedCities.delete(stateCode);
    }
  }

  removeState(stateCode: string): void {
    this.addedStates.delete(stateCode);
    this.selectedStateTab = stateCode;
  }

  addCity(stateCode: string, city: string): void {
    this.selectedAddedListTab = 'Cities';
    const condition = this.addedCities.get(stateCode)?.includes(city);
    if (!condition) {
      const cities = this.addedCities.get(stateCode) || [];
      cities.push(city);
      this.addedCities.set(stateCode, cities);
    }
  }

  removeCity(stateCode: string, city: string): void {
    let cities = this.addedCities.get(stateCode) || [];
    const condition = cities.includes(city);
    if (condition) {
      cities = cities.filter((c) => c !== city);
      if (cities.length > 0) {
        this.addedCities.delete(stateCode);
        this.addedCities.set(stateCode, cities);
      } else {
        this.addedCities.delete(stateCode);
      }
    }
  }

  removeAddedFeature(id: number): void {
    this.campaignDrawingService.removeFeatureById(id);
  }

  checkStateDisplay(stateCode: string): boolean {
    return this.addedStates.has(stateCode);
  }

  checkAddedListTabsDisplay(tab: string): boolean {
    if (tab === 'States') return this.addedStates.size > 0;
    if (tab === 'Cities') return this.addedCities.size > 0;
    if (tab === 'Neighborhoods') return this.getAllAddedFeatures.length > 0;
    return true;
  }

  checkCityDisplay(stateCode: string, city: string): boolean {
    const cities = this.addedCities.get(stateCode) || [];
    return cities.includes(city);
  }

  checkAddedListDisplay(): boolean {
    return (
      this.addedStates.size > 0 ||
      this.addedCities.size > 0 ||
      this.getAllAddedFeatures.length > 0
    );
  }

  get getAllAddedFeatures(): { id: number; name: string }[] {
    return this.campaignDrawingService.getAllAddedFeatures();
  }

  getAllAddedStates(): { key: string; value: string }[] {
    return Array.from(this.addedStates.entries()).map(([key, value]) => ({
      key,
      value,
    }));
  }

  getAllAddedCities(): { key: string; value: string[] }[] {
    return Array.from(this.addedCities.entries()).map(([key, value]) => ({
      key,
      value,
    }));
  }

  getAllCitiesByStateCode(state: IMapState): void {
    const body: any = {
      Name: 'GetAllCityWithStateCode',
      Params: {
        StateCode: state.code,
      },
    };

    this.placesService.GenericAPI(body).subscribe((response: any) => {
      if (response.json && response.json.length) {
        state.cities = response.json.sort((a: string, b: string) =>
          a.localeCompare(b)
        );
        this.cdr.detectChanges();
      }
    });
  }

  get getStatesToDisplay(): IMapState | null {
    const state = this.mapStates.find(
      (state) => state.code === this.selectedStateTab
    );
    return state || this.mapStates[0] || null;
  }

  // onStateSelected(event: AutoCompleteSelectEvent) {
  //   // pull your selected state out of `.suggestion`
  //   const state = event.value;

  //   this.filteredCities = [];
  //   this.cities = [];
  //   this.selectedCity = undefined;
  //   if (this.selectedState) {
  //     this.stateSubject.next(this.selectedState);
  //     // this.getAllCitiesByStateCode(this.selectedState);
  //   }
  // }

  // onStateChanged(event: any): void {
  //   if (event.trim().length == 0) {
  //     this.selectedState = undefined;
  //   }
  //   this.filteredCities = [];
  //   this.cities = [];
  //   this.selectedCity = undefined;
  // }

  // to be uncommented
  // async saveShapesWithCampaign(campaignId: number): Promise<void> {
  //   const drawnPolygons = this.campaignDrawingService.getDrawnPolygons;
  //   const drawnCircles = this.campaignDrawingService.getDrawnCircles;

  //   if (drawnPolygons && drawnPolygons.length > 0) {
  //     for (let polygon of drawnPolygons) {
  //       const geo = await this.campaignDrawingService.convertPolygonToGeoJson(
  //         polygon.shape as google.maps.Polygon
  //       );

  //       if (polygon.id) {
  //         this.attachPolygonToMyCampaign(campaignId, polygon.id);
  //       } else {
  //         await this.insertNewPolygons({
  //           CampaignId: campaignId,
  //           contactId: this.contactId,
  //           name: polygon.shape.get('label') ?? 'Shape',
  //           city: geo.properties.city,
  //           state: geo.properties.state,
  //           geoJson: JSON.stringify(geo),
  //           center: '',
  //           radius: '',
  //         });
  //       }
  //     }
  //   }

  //   if (drawnCircles && drawnCircles.length > 0) {
  //     for (let circle of drawnCircles) {
  //       const c = circle.shape as google.maps.Circle;
  //       const center = c.getCenter();
  //       const radius = c.getRadius();

  //       const polygon = this.campaignDrawingService.convertCircleToPolygon(
  //         this.map,
  //         c
  //       );

  //       const geo = await this.campaignDrawingService.convertPolygonToGeoJson(
  //         polygon
  //       );

  //       await this.insertNewPolygons({
  //         CampaignId: campaignId,
  //         contactId: this.contactId,
  //         name: circle.shape.get('label') ?? 'Shape',
  //         city: geo.properties.city,
  //         state: geo.properties.state,
  //         geoJson: JSON.stringify(geo),
  //         center: JSON.stringify(center),
  //         radius: JSON.stringify(radius),
  //       });
  //     }
  //   }

  //   this.syncMarketSurveyWithCampaign(campaignId);
  //   this.campaignDrawingService.clearDrawnLists();
  // }

  // centerShapeOnMap(polygon: IPolygon): void {
  //   if (this.displayedExternalPolygons.includes(polygon.id)) {
  //     const coordinates = this.getPolygonCoordinates(polygon);
  //     const point = this.getMapCenter(polygon.json);

  //     if (coordinates) {
  //       this.campaignDrawingService.updateMapZoom(this.map, coordinates);
  //     } else {
  //       if (point) {
  //         this.campaignDrawingService.updateMapCenter(this.map, point);
  //       } else {
  //         this.campaignDrawingService.updateMapCenter(this.map, null);
  //       }
  //     }
  //   }
  // }

  // getShoppingCentersByPolygonId(polygonId: number): void {
  //   this.searchedPolygonId = polygonId;
  //   const body: any = {
  //     Name: 'GetShoppingCentersByPolygonId',
  //     Params: {
  //       PolygonId: polygonId,
  //     },
  //   };

  //   this.placesService.GenericAPI(body).subscribe((response) => {
  //     if (response.json) {
  //       this.searchedPolygonId = 0;
  //       this.polygonShoppingCenters.set(
  //         polygonId,
  //         response.json.length > 0 ? response.json : []
  //       );
  //       this.viewShoppingCenterOnMap(polygonId);
  //     }
  //   });
  // }

  // checkHaveShoppingCenters(polygonId: number): boolean {
  //   return this.polygonShoppingCenters.has(polygonId);
  // }

  // getShoppingCentersForPolygon(polygonId: number): ShoppingCenter[] {
  //   return this.polygonShoppingCenters.get(polygonId)!;
  // }

  // to be uncommented
  // toggleDisplayedExternalPolygon(polygon: IPolygon): void {
  //   const check = this.displayedExternalPolygons.includes(polygon.id);
  //   if (check) {
  //     // this.mapDrawingService.removeMarkers(polygon.id);
  //     this.displayedPolygonsCenters = this.displayedPolygonsCenters.filter(
  //       (p) => p != polygon.id
  //     );
  //     this.campaignDrawingService.completelyRemoveMarkers(polygon.id);
  //     this.campaignDrawingService.hideShapeFromMap(polygon.id);
  //     this.displayedExternalPolygons = this.displayedExternalPolygons.filter(
  //       (id) => id != polygon.id
  //     );
  //   } else {
  //     this.scrollToMap();
  //     const shoppingCenters = this.polygonShoppingCenters.has(polygon.id);
  //     if (!shoppingCenters) {
  //       this.getShoppingCentersByPolygonId(polygon.id);
  //     } else {
  //       this.viewShoppingCenterOnMap(polygon.id);
  //     }
  //     // this.createPropertiesMarkers(polygon.id, false, true);
  //     this.displayedExternalPolygons.push(polygon.id);
  //     const coordinates = this.getPolygonCoordinates(polygon);
  //     const point = this.getMapCenter(polygon.json);

  //     if (coordinates) {
  //       this.campaignDrawingService.updateMapZoom(this.map, coordinates);
  //     } else {
  //       if (point) {
  //         this.campaignDrawingService.updateMapCenter(this.map, point);
  //       } else {
  //         this.campaignDrawingService.updateMapCenter(this.map, null);
  //       }
  //     }

  //     this.campaignDrawingService.displayShapeOnMap(polygon.id, this.map);
  //   }
  // }

  // stateChangeListener(): void {
  //   const observer = {
  //     next: (response: any) => {
  //       if (response.json && response.json.length > 0) {
  //         const data: string[] = response.json;

  //         this.cities = data.map((city) => ({
  //           label: city,
  //           value: city,
  //         }));
  //         this.filteredCities = this.cities;
  //       }
  //     },
  //   };

  //   this.stateSubject
  //     .pipe(
  //       // switchMap cancels previous requests when a new value is emitted
  //       switchMap((state: string) => this.getAllCitiesByStateCode(state)),
  //       takeUntil(this.destroy$)
  //     )
  //     .subscribe(observer);
  // }

  // to be uncommented
  // searchForPolygons(): void {
  //   this.isSearching = true;

  //   const object = {
  //     location: this.polygonSearch,
  //     city: this.selectedCity ?? '',
  //     state: this.selectedState ?? '',
  //   };
  //   this.polygonsControllerService.getPolygonsByName(object).subscribe({
  //     next: (response) => {
  //       if (response && response.length > 0) {
  //         this.isSearching = false;
  //         this.externalPolygons = response;
  //         this.addExplorePolygonsToMap();
  //       }
  //     },
  //     error: (error) => {
  //       this.isSearching = false;

  //       console.error(error);
  //     },
  //   });
  // }

  // addExplorePolygonsToMap(): void {
  //   for (let polygon of this.externalPolygons) {
  //     const coordinates = this.getPolygonCoordinates(polygon);
  //     if (coordinates) {
  //       this.campaignDrawingService.insertExplorePolygon(
  //         polygon.id,
  //         coordinates,
  //         polygon.name
  //       );
  //     }
  //   }
  // }

  // addUserPolygonsToMap(): void {
  //   for (let polygon of this.userPolygons) {
  //     const coordinates = this.getPolygonCoordinates(polygon);
  //     if (coordinates) {
  //       this.campaignDrawingService.insertExplorePolygon(
  //         polygon.id,
  //         coordinates,
  //         polygon.name
  //       );
  //     }
  //   }
  // }

  getPolygonCoordinates(polygon: IPolygon):
    | {
        lat: number;
        lng: number;
      }[]
    | null {
    try {
      const geoJson: IGeoJson = JSON.parse(polygon.json);

      if (!geoJson || !geoJson.geometry || !geoJson.geometry.coordinates) {
        return null;
      }

      const coordinates = geoJson.geometry.coordinates[0]?.map(
        (coord: number[]) => {
          return { lat: coord[1], lng: coord[0] };
        }
      );

      if (!coordinates) {
        return null;
      }

      return coordinates;
    } catch (error) {}
    return null;
  }

  getGlobalPolygonCoordinates(geometry: Geometry):
    | {
        lat: number;
        lng: number;
      }[]
    | null {
    try {
      const coordinates = geometry.coordinates[0]?.map((coord: number[]) => {
        return { lat: coord[1], lng: coord[0] };
      });

      if (!coordinates) {
        return null;
      }

      return coordinates;
    } catch (error) {}
    return null;
  }

  getMapCenter(polygon: string): {
    lat: number;
    lng: number;
  } | null {
    const geoJson: IGeoJson = JSON.parse(polygon);

    const points = geoJson.geometry.coordinates[0]?.map((coord: number[]) => {
      return { lat: coord[1], lng: coord[0] };
    });
    if (!points || points.length === 0) return null;

    const sum = points.reduce(
      (acc, point) => {
        acc.lat += point.lat;
        acc.lng += point.lng;
        return acc;
      },
      { lat: 0, lng: 0 }
    );

    return {
      lat: sum.lat / points.length,
      lng: sum.lng / points.length,
    };
  }

  // to be uncommented
  // attachPolygonToCampaign(polygonId: number): void {
  //   if (this.detectIncludeInSearch(polygonId)) {
  //     this.campaignDrawingService.removePolygonWithId(polygonId);
  //   } else {
  //     const polygon =
  //       this.externalPolygons.find((p) => p.id == polygonId) ||
  //       this.userPolygons.find((p) => p.id == polygonId);

  //     // this.campaignDrawingService.hideMyPolygons()
  //     this.campaignDrawingService.hideShapeFromMap(polygonId);
  //     if (polygon) {
  //       const coordinates = this.getPolygonCoordinates(polygon);
  //       if (coordinates) {
  //         this.campaignDrawingService.updateMapZoom(this.map, coordinates);
  //         this.campaignDrawingService.insertExplorePolygonToMyPolygons(
  //           this.map,
  //           polygon.id,
  //           coordinates,
  //           polygon.name
  //         );
  //       }
  //     }
  //   }
  //   // this.externalPolygons = this.externalPolygons.filter(
  //   //   (p) => p.id != polygonId
  //   // );
  // }

  /* */
  // to be uncommented
  // removePolygonWithIndex(index: number): void {
  //   this.campaignDrawingService.removePolygonWithIndex(index);
  // }
  // removeCircleWithIndex(index: number): void {
  //   this.campaignDrawingService.removeCircleWithIndex(index);
  // }

  // detectIncludeInSearch(id: number): boolean {
  //   const drawnPolygons = this.campaignDrawingService.getDrawnPolygons;
  //   const drawnCircles = this.campaignDrawingService.getDrawnCircles;
  //   if (
  //     drawnPolygons.find((p) => p.id == id) ||
  //     drawnCircles.find((c) => c.id == id)
  //   ) {
  //     return true;
  //   }
  //   return false;
  // }

  // to be uncommented
  // viewShoppingCenterOnMap(polygonId: number): void {
  //   this.displayedPolygonsCenters.push(polygonId);
  //   if (this.campaignDrawingService.isMarkersExists(polygonId)) {
  //     this.campaignDrawingService.displayMarker(polygonId, this.map);
  //   } else {
  //     for (let center of this.getShoppingCentersForPolygon(polygonId)) {
  //       this.campaignDrawingService.createMarker(this.map, polygonId, center);
  //     }
  //   }
  // }

  // concatSearchResult(): IPolygon[] {
  //   if (this.displayUserPolygons && this.userPolygons.length > 0) {
  //     return [...this.externalPolygons, ...this.userPolygons];
  //   }
  //   return this.externalPolygons;
  // }

  // to be uncommented
  // get getDrawnPolygons() {
  //   return this.campaignDrawingService.getDrawnPolygons;
  // }

  // get getDrawnCircles() {
  //   return this.campaignDrawingService.getDrawnCircles;
  // }

  getAdminLevel(): number {
    if (this.mapBounds) {
      const zoomLevel = this.mapBounds.zoomLevel;
      if (zoomLevel >= 7 && zoomLevel < 10) {
        return 0;
      } else if (zoomLevel >= 10 && zoomLevel < 13) {
        return 8;
      } else if (zoomLevel >= 11 && zoomLevel < 13) {
        return 0;
      } else if (zoomLevel >= 13) {
        return 0;
      }
    }

    return 0;
  }

  getGeoJsonsFile(): void {
    this.campaignDrawingService.removeAllFeatures();
    const body = {
      Name: 'GetViewportPolygons',
      Params: {
        minLat: this.mapBounds?.southWestLat,
        minLon: this.mapBounds?.southWestLng,
        maxLat: this.mapBounds?.northEastLat,
        maxLon: this.mapBounds?.northEastLng,
      },
    };

    this.placesService.GenericAPI(body).subscribe((response) => {
      this.loadingGlobalPolygons = false;
      this.cdr.detectChanges();
      if (response.json && response.json.length > 0) {
        const map = this.campaignDrawingService.getMap();
        if (!map) return;
        for (let path of response.json) {
          this.genericMapService.loadGeoJsonFileOnMap(
            map,
            `${environment.geoJsonsFilesPath}/${path.id}.geojson`
          );
        }
      }
    });
  }

  getPolygonsByMapBounds(): Observable<IGlobalGeoJson> {
    const adminLevel = this.getAdminLevel();
    const bounds = {
      minLat: this.mapBounds?.southWestLat,
      minLon: this.mapBounds?.southWestLng,
      maxLat: this.mapBounds?.northEastLat,
      maxLon: this.mapBounds?.northEastLng,
      adminLevel: adminLevel,
    };

    return this.httpClient.post<IGlobalGeoJson>(
      `${environment.api}/Overpass/neighbourhoods`,
      bounds
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.campaignDrawingService.removeAllAddedFeatures();
    // to be uncomment
    // this.campaignDrawingService.clearDrawnLists();
    // this.campaignDrawingService.completelyRemoveExplorePolygon();
    // this.globalPolygons.clear();
  }
}
