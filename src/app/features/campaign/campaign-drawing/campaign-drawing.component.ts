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
  Observable,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import { CampaignDrawingService } from 'src/app/core/services/campaign-drawing.service';
import { PlacesService } from 'src/app/core/services/places.service';
import { PolygonsControllerService } from 'src/app/core/services/polygons-controller.service';
import { IGeoJson } from 'src/app/shared/models/igeo-json';
import { IPolygon } from 'src/app/shared/models/ipolygons-controller';
import { environment } from 'src/environments/environment';

interface ShoppingCenter {
  id: number;
  centerName: string;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-campaign-drawing',
  templateUrl: './campaign-drawing.component.html',
  styleUrl: './campaign-drawing.component.css',
})
export class CampaignDrawingComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private destroy$ = new Subject<void>();
  private stateSubject: Subject<string> = new Subject<string>();

  @ViewChild('mapContainer', { static: false }) gmapContainer!: ElementRef;

  map!: google.maps.Map;
  selectedDrawingModeId: number = 1;
  visabilityOptions: any[] = [
    { label: 'Private', value: 1 },
    { label: 'Public', value: 0 },
  ];
  isPrivateCampaign: number = 1;
  campaignName: string = '';
  buyBoxId!: number;
  contactId!: number;
  polygonSearch: string = '';
  externalPolygons: IPolygon[] = [];
  displayedExternalPolygons: number[] = [];
  polygonShoppingCenters: Map<number, ShoppingCenter[]> = new Map<
    number,
    ShoppingCenter[]
  >();
  searchedPolygonId: number = 0;
  displayedPolygonsCenters: number[] = [];
  userPolygons: IPolygon[] = [];
  displayUserPolygons: boolean = false;
  isSearching: boolean = false;
  states!: SelectItem[];
  filteredStates!: SelectItem[];
  selectedState: string | undefined;
  cities!: SelectItem[];
  filteredCities!: SelectItem[];
  selectedCity: string | undefined;

  @Output() onCampaignCreated = new EventEmitter<void>();
  @Input() userBuyBoxes: { id: number; name: string }[] = [];

  constructor(
    private campaignDrawingService: CampaignDrawingService,
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal,
    private placesService: PlacesService,
    private httpClient: HttpClient,
    private router: Router,
    private spinner: NgxSpinnerService,
    private polygonsControllerService: PolygonsControllerService
  ) {}

  ngOnInit(): void {
    // if (!this.buyBoxId) {
    //   const id = localStorage.getItem('BuyBoxId');
    //   if (id) {
    //     this.buyBoxId = +id;
    //   }
    // }
    const contact = localStorage.getItem('contactId');
    if (contact) {
      this.contactId = +contact;
    }

    this.getAllStates();
    this.polygonsListeners();
    this.circlesListeners();
    this.drawingCancelListener();
    this.stateChangeListener();
    this.getUserPolygons();
  }

  ngAfterViewInit(): void {
    this.map = this.campaignDrawingService.initializeMap(this.gmapContainer);
    this.campaignDrawingService.initializeDrawingManager(this.map);
  }

  startDrawing(modeId: number, shape: string) {
    this.selectedDrawingModeId = modeId;
    this.campaignDrawingService.setDrawingMode(shape);
    this.cdr.detectChanges();
  }

  polygonsListeners(): void {
    this.campaignDrawingService.onPolygonCreated
      .pipe(takeUntil(this.destroy$))
      .subscribe((polygon) => {
        this.startDrawing(1, 'move');
      });
  }

  circlesListeners(): void {
    this.campaignDrawingService.onCircleCreated
      .pipe(takeUntil(this.destroy$))
      .subscribe((circle) => {
        this.startDrawing(1, 'move');
      });
  }

  drawingCancelListener(): void {
    this.campaignDrawingService.onDrawingCancel
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.startDrawing(1, 'move');
      });
  }

  get getDrawnList() {
    return this.campaignDrawingService.getDrawnList();
  }

  openNewCampaignPopup(content: TemplateRef<any>): void {
    this.modalService.open(content, { centered: true });
  }

  getUserPolygons(): void {
    const body: any = {
      Name: 'GetUserPolygons',
      Params: {},
    };

    this.placesService.GenericAPI(body).subscribe((response) => {
      if (response.json && response.json.length > 0) {
        this.userPolygons = response.json;
        this.addUserPolygonsToMap();
      }
    });
  }

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
        if (!this.router.url.includes('campaigns')) {
          setTimeout(() => {
            this.spinner.hide();
            this.modalService.dismissAll();
            this.router.navigate(['/campaigns']);
          }, 1000);
        } else {
          setTimeout(() => {
            this.spinner.hide();
            this.onCampaignCreated.emit();
          }, 1000);
        }
        this.saveShapesWithCampaign(response.json[0].id);
      }
    });
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

  filterStates(event: AutoCompleteCompleteEvent) {
    //in a real application, make a request to a remote url with the query and return filtered results, for demo we filter at client side
    let filtered: any[] = [];
    let query = event.query;

    for (let i = 0; i < (this.states as any[]).length; i++) {
      let item = (this.states as any[])[i];
      if (item.label.toLowerCase().indexOf(query.toLowerCase()) == 0) {
        filtered.push(item);
      }
    }

    this.filteredStates = filtered;
  }

  filterCities(event: AutoCompleteCompleteEvent) {
    //in a real application, make a request to a remote url with the query and return filtered results, for demo we filter at client side
    let filtered: any[] = [];
    let query = event.query;

    for (let i = 0; i < (this.cities as any[]).length; i++) {
      let item = (this.cities as any[])[i];
      if (item.label.toLowerCase().indexOf(query.toLowerCase()) == 0) {
        filtered.push(item);
      }
    }

    this.filteredCities = filtered;
  }

  getAllStates(): void {
    const body: any = {
      Name: 'GetAllStates',
      Params: {},
    };

    this.placesService.GenericAPI(body).subscribe((response) => {
      if (response.json && response.json.length > 0) {
        const data: {
          stateName: string;
          stateCode: string;
        }[] = response.json;
        this.states = data.map((state) => ({
          label: state.stateName,
          value: state.stateCode,
        }));
        this.filteredStates = this.states;
        console.log(this.states);
      }
    });
  }

  getAllCitiesByStateCode(stateCode: string): Observable<any> {
    const body: any = {
      Name: 'GetAllCityWithStateCode',
      Params: {
        StateCode: stateCode,
      },
    };

    return this.placesService.GenericAPI(body);
  }

  onStateSelected(event: AutoCompleteSelectEvent) {
    // pull your selected state out of `.suggestion`
    const state = event.value;
    console.log(state);
    console.log(this.selectedState);

    this.filteredCities = [];
    this.cities = [];
    this.selectedCity = undefined;
    if (this.selectedState) {
      this.stateSubject.next(this.selectedState);
      // this.getAllCitiesByStateCode(this.selectedState);
    }
  }

  onStateChanged(event: any): void {
    if (event.trim().length == 0) {
      this.selectedState = undefined;
    }
    this.filteredCities = [];
    this.cities = [];
    this.selectedCity = undefined;
  }

  async saveShapesWithCampaign(campaignId: number): Promise<void> {
    const drawnPolygons = this.campaignDrawingService.getDrawnPolygons;
    const drawnCircles = this.campaignDrawingService.getDrawnCircles;

    if (drawnPolygons && drawnPolygons.length > 0) {
      for (let polygon of drawnPolygons) {
        const geo = await this.campaignDrawingService.convertPolygonToGeoJson(
          polygon.shape as google.maps.Polygon
        );

        if (polygon.id) {
          this.attachPolygonToMyCampaign(campaignId, polygon.id);
        } else {
          await this.insertNewPolygons({
            CampaignId: campaignId,
            contactId: this.contactId,
            name: polygon.shape.get('label') ?? 'Shape',
            city: geo.properties.city,
            state: geo.properties.state,
            geoJson: JSON.stringify(geo),
            center: '',
            radius: '',
          });
        }
      }
    }

    if (drawnCircles && drawnCircles.length > 0) {
      for (let circle of drawnCircles) {
        const c = circle.shape as google.maps.Circle;
        const center = c.getCenter();
        const radius = c.getRadius();

        const polygon = this.campaignDrawingService.convertCircleToPolygon(
          this.map,
          c
        );

        const geo = await this.campaignDrawingService.convertPolygonToGeoJson(
          polygon
        );

        await this.insertNewPolygons({
          CampaignId: campaignId,
          contactId: this.contactId,
          name: circle.shape.get('label') ?? 'Shape',
          city: geo.properties.city,
          state: geo.properties.state,
          geoJson: JSON.stringify(geo),
          center: JSON.stringify(center),
          radius: JSON.stringify(radius),
        });
      }
    }

    this.syncMarketSurveyWithCampaign(campaignId);
    this.campaignDrawingService.clearDrawnLists();
  }

  centerShapeOnMap(polygon: IPolygon): void {
    if (this.displayedExternalPolygons.includes(polygon.id)) {
      const coordinates = this.getPolygonCoordinates(polygon);
      const point = this.getMapCenter(polygon.json);

      if (coordinates) {
        this.campaignDrawingService.updateMapZoom(this.map, coordinates);
      } else {
        if (point) {
          this.campaignDrawingService.updateMapCenter(this.map, point);
        } else {
          this.campaignDrawingService.updateMapCenter(this.map, null);
        }
      }
    }
  }

  getShoppingCentersByPolygonId(polygonId: number): void {
    this.searchedPolygonId = polygonId;
    const body: any = {
      Name: 'GetShoppingCentersByPolygonId',
      Params: {
        PolygonId: polygonId,
      },
    };

    this.placesService.GenericAPI(body).subscribe((response) => {
      if (response.json) {
        this.searchedPolygonId = 0;
        this.polygonShoppingCenters.set(
          polygonId,
          response.json.length > 0 ? response.json : []
        );
        this.viewShoppingCenterOnMap(polygonId);
      }
    });
  }

  checkHaveShoppingCenters(polygonId: number): boolean {
    return this.polygonShoppingCenters.has(polygonId);
  }

  getShoppingCentersForPolygon(polygonId: number): ShoppingCenter[] {
    return this.polygonShoppingCenters.get(polygonId)!;
  }

  toggleDisplayedExternalPolygon(polygon: IPolygon): void {
    const check = this.displayedExternalPolygons.includes(polygon.id);
    if (check) {
      // this.mapDrawingService.removeMarkers(polygon.id);
      this.displayedPolygonsCenters = this.displayedPolygonsCenters.filter(
        (p) => p != polygon.id
      );
      this.campaignDrawingService.completelyRemoveMarkers(polygon.id);
      this.campaignDrawingService.hideShapeFromMap(polygon.id);
      this.displayedExternalPolygons = this.displayedExternalPolygons.filter(
        (id) => id != polygon.id
      );
    } else {
      this.scrollToMap();
      const shoppingCenters = this.polygonShoppingCenters.has(polygon.id);
      if (!shoppingCenters) {
        this.getShoppingCentersByPolygonId(polygon.id);
      } else {
        this.viewShoppingCenterOnMap(polygon.id);
      }
      // this.createPropertiesMarkers(polygon.id, false, true);
      this.displayedExternalPolygons.push(polygon.id);
      const coordinates = this.getPolygonCoordinates(polygon);
      const point = this.getMapCenter(polygon.json);

      if (coordinates) {
        this.campaignDrawingService.updateMapZoom(this.map, coordinates);
      } else {
        if (point) {
          this.campaignDrawingService.updateMapCenter(this.map, point);
        } else {
          this.campaignDrawingService.updateMapCenter(this.map, null);
        }
      }

      this.campaignDrawingService.displayShapeOnMap(polygon.id, this.map);
    }
  }

  stateChangeListener(): void {
    const observer = {
      next: (response: any) => {
        if (response.json && response.json.length > 0) {
          const data: string[] = response.json;

          this.cities = data.map((city) => ({
            label: city,
            value: city,
          }));
          this.filteredCities = this.cities;
          console.log(this.filteredCities);
        }
      },
    };

    this.stateSubject
      .pipe(
        // switchMap cancels previous requests when a new value is emitted
        switchMap((state: string) => this.getAllCitiesByStateCode(state)),
        takeUntil(this.destroy$)
      )
      .subscribe(observer);
  }
  searchForPolygons(): void {
    console.log('hello');
    this.isSearching = true;

    const object = {
      location: this.polygonSearch,
      city: this.selectedCity ?? '',
      state: this.selectedState ?? '',
    };
    this.polygonsControllerService.getPolygonsByName(object).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.isSearching = false;
          this.externalPolygons = response;
          this.addExplorePolygonsToMap();
        }
      },
      error: (error) => {
        this.isSearching = false;

        console.error(error);
      },
    });
  }
  addExplorePolygonsToMap(): void {
    for (let polygon of this.externalPolygons) {
      const coordinates = this.getPolygonCoordinates(polygon);
      if (coordinates) {
        this.campaignDrawingService.insertExplorePolygon(
          polygon.id,
          coordinates,
          polygon.name
        );
      }
    }
  }

  addUserPolygonsToMap(): void {
    for (let polygon of this.userPolygons) {
      const coordinates = this.getPolygonCoordinates(polygon);
      if (coordinates) {
        this.campaignDrawingService.insertExplorePolygon(
          polygon.id,
          coordinates,
          polygon.name
        );
      }
    }
  }

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

  attachPolygonToCampaign(polygonId: number): void {
    if (this.detectIncludeInSearch(polygonId)) {
      this.campaignDrawingService.removePolygonWithId(polygonId);
    } else {
      const polygon =
        this.externalPolygons.find((p) => p.id == polygonId) ||
        this.userPolygons.find((p) => p.id == polygonId);

      // this.campaignDrawingService.hideMyPolygons()
      this.campaignDrawingService.hideShapeFromMap(polygonId);
      if (polygon) {
        const coordinates = this.getPolygonCoordinates(polygon);
        if (coordinates) {
          this.campaignDrawingService.updateMapZoom(this.map, coordinates);
          this.campaignDrawingService.insertExplorePolygonToMyPolygons(
            this.map,
            polygon.id,
            coordinates,
            polygon.name
          );
        }
      }
    }
    // this.externalPolygons = this.externalPolygons.filter(
    //   (p) => p.id != polygonId
    // );
  }

  removePolygonWithIndex(index: number): void {
    this.campaignDrawingService.removePolygonWithIndex(index);
  }
  removeCircleWithIndex(index: number): void {
    this.campaignDrawingService.removeCircleWithIndex(index);
  }

  detectIncludeInSearch(id: number): boolean {
    const drawnPolygons = this.campaignDrawingService.getDrawnPolygons;
    const drawnCircles = this.campaignDrawingService.getDrawnCircles;
    if (
      drawnPolygons.find((p) => p.id == id) ||
      drawnCircles.find((c) => c.id == id)
    ) {
      return true;
    }
    return false;
  }

  viewShoppingCenterOnMap(polygonId: number): void {
    this.displayedPolygonsCenters.push(polygonId);
    if (this.campaignDrawingService.isMarkersExists(polygonId)) {
      this.campaignDrawingService.displayMarker(polygonId, this.map);
    } else {
      for (let center of this.getShoppingCentersForPolygon(polygonId)) {
        this.campaignDrawingService.createMarker(this.map, polygonId, center);
      }
    }
  }

  concatSearchResult(): IPolygon[] {
    if (this.displayUserPolygons && this.userPolygons.length > 0) {
      return [...this.externalPolygons, ...this.userPolygons];
    }
    return this.externalPolygons;
  }

  get getDrawnPolygons() {
    return this.campaignDrawingService.getDrawnPolygons;
  }

  get getDrawnCircles() {
    return this.campaignDrawingService.getDrawnCircles;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
