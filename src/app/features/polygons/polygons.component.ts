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
  HostListener,
} from '@angular/core';

import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SelectItem } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, forkJoin, Observable, Subject, of } from 'rxjs';
import {
  switchMap,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  catchError,
  map,
} from 'rxjs/operators';

import { CampaignDrawingService } from 'src/app/core/services/campaign-drawing.service';
import { MapDrawingService } from 'src/app/core/services/map-drawing.service';
import { PlacesService } from 'src/app/core/services/places.service';
import { PolygonsControllerService } from 'src/app/core/services/polygons-controller.service';
import { GenericMapService } from 'src/app/core/services/generic-map.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { environment } from 'src/environments/environment';
import { IGeoJson } from 'src/app/shared/models/igeo-json';
import { IPolygon } from 'src/app/shared/models/ipolygons-controller';
import { ShoppingCenter } from 'src/app/shared/models/campaign-shopping';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';

interface NeighborhoodObject {
  id: number;
  name: string;
  featureId: number | string | null;
}

// Search types for the unified autocomplete
type SearchType = 'state' | 'city' | 'neighborhood';
interface SearchItem {
  type: SearchType;
  id?: number;
  code?: string;
  name: string;
  state?: string;
  city?: string;
  raw?: any;
}

@Component({
  selector: 'app-polygons',
  templateUrl: './polygons.component.html',
  styleUrls: ['./polygons.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    AutoCompleteModule,
    SelectButtonModule,
    TooltipModule,
    NgxSpinnerModule,
    DropdownModule,
    MultiSelectModule,
  ],
})
export class PolygonsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) gmapContainer!: ElementRef;
  @Input() userBuyBoxes: { id: number; name: string }[] = [];
  @Output() onCampaignCreated = new EventEmitter<void>();
  @ViewChild('searchContainer', { static: false }) searchContainer!: ElementRef;

  private destroy$ = new Subject<void>();
  private stateSubject = new Subject<string>();

  // map + readiness
  map!: google.maps.Map;
  private mapReady = false;
  private pendingAdditions = new Set<number>();
  private attemptedLoads = new Set<number>();
  private loadingSet = new Set<number>();

  // UI state
  selectedDrawingModeId = 1;
  visabilityOptions = [
    { label: 'Private', value: 1 },
    { label: 'Public', value: 0 },
  ];
  isPrivateCampaign = 1;
  campaignName = '';
  buyBoxId!: number;
  contactId!: number;
  polygonSearch = '';
  externalPolygons: IPolygon[] = [];
  displayedExternalPolygons: number[] = [];
  polygonShoppingCenters = new Map<number, ShoppingCenter[]>();
  searchedPolygonId = 0;
  displayedPolygonsCenters: number[] = [];
  userPolygons: IPolygon[] = [];
  displayUserPolygons = false;
  isSearching = false;
  selectedState?: string;
  neighborhoods: string[] = [];

  states: SelectItem[] = [];
  cities: SelectItem[] = [];
  selectedCities: string[] = [];
  filteredCities: SelectItem[] = [];

  // selected neighborhoods UI model
  neighOptions: SelectItem[] = [];
  neighIdToName = new Map<number, string>();
  selectedNeighborhoodIds: number[] = [];
  selectedNeighborhoodObjects: NeighborhoodObject[] = [];
  prevSelectedNeighborhoodIds = new Set<number>();

  // mapping neighborhood id -> server polygon id
  public neighborhoodToPolygonId = new Map<number, number>();

  // displayed geojsons (featureId mapping)
  displayedGeoJsons: {
    featureId: number | string;
    id: number;
    name: string;
  }[] = [];
  realTimeGeoJsons: { id: number; name: string; json?: any }[] = [];
  loadingGlobalPolygons = false;

  // saved ids (used by GetCampaignPolygons test button)
  public savedPolygonIds: number[] = [];

  // ---------- Unified autocomplete fields ----------
  searchTerm = '';
  searchResults: SearchItem[] = [];
  selectedItems: SearchItem[] = [];
  showSuggestions = false;
  isLoadingSuggestions = false;
  searchedOnce = false; // becomes true after first server response for the current query
  private searchSubject = new Subject<string>();

  constructor(
    private campaignDrawingService: MapDrawingService,
    private camDrawingService: CampaignDrawingService,
    private placesService: PlacesService,
    private httpClient: HttpClient,
    private polygonsControllerService: PolygonsControllerService,
    private genericMapService: GenericMapService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const contact = localStorage.getItem('contactId');
    if (contact) this.contactId = +contact;
    this.getAllStates();
    this.polygonsListeners();
    this.circlesListeners();
    this.drawingCancelListener();
    this.stateChangeListener();
    this.getUserPolygons();
    this.loadCampaignPolygons(1);

    // reactive search pipeline for unified autocomplete
    // inside ngOnInit()
    // call backend (debounced) and populate searchResults
    this.searchSubject
      .pipe(
        debounceTime(150), // adjust debounce as needed
        distinctUntilChanged(),
        switchMap((term) => this.callAutoCompletePolygonCityState(term)),
        takeUntil(this.destroy$)
      )
      .subscribe((res: SearchItem[]) => {
        // replace results with server normalized items
        this.searchResults = Array.isArray(res) ? res : [];

        // show only when we have items
        this.showSuggestions = this.searchResults.length > 0;

        // keep selectedItems untouched
        this.cdr.detectChanges();
      });

    // subscribe to delete events from drawingService to keep UI consistent
    this.campaignDrawingService.onPolygonDeleted
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => this.handleServerDeletedPolygon(id));
  }

  ngAfterViewInit(): void {
    this.map = this.campaignDrawingService.initializeMap(this.gmapContainer);
    this.campaignDrawingService.initializeDrawingManager(this.map);
    // pass map to optional campaign drawing if available
    try {
      const camAny = this.camDrawingService as any;
      if (typeof camAny.setMap === 'function') camAny.setMap(this.map);
    } catch (e) {
      /* optional */
    }
    this.mapReady = true;
    // process pending additions
    if (this.pendingAdditions.size) {
      const ids = Array.from(this.pendingAdditions);
      this.pendingAdditions.clear();
      ids.forEach((id) => {
        const name = this.neighIdToName.get(id) ?? '';
        this.addNewFeature({ id, name });
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stateSubject.complete();
    this.campaignDrawingService.clearDrawnLists();
    this.campaignDrawingService.completelyRemoveExplorePolygon();
  }

  startDrawing(modeId: number, shape: string) {
    this.selectedDrawingModeId = modeId;
    this.campaignDrawingService.setDrawingMode(shape);
    this.cdr.detectChanges();
  }

  /** ---------- Drawing event listeners (save created shapes) ---------- */
  polygonsListeners(): void {
    this.campaignDrawingService.onPolygonCreated
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (payload: any) => {
        this.startDrawing(1, 'move');
        try {
          const shape: google.maps.Polygon = payload?.shape ?? payload;
          if (!shape) return;
          if ((payload as any)?.id) return; // already created
          let geo: any = null;
          try {
            geo = await this.campaignDrawingService.convertPolygonToGeoJson(
              shape as google.maps.Polygon
            );
          } catch (err) {
            geo = this.polygonShapeToGeoJson(shape);
          }
          if (!geo) return;
          const city = geo?.properties?.city ?? this.selectedCities?.[0] ?? '';
          const state = geo?.properties?.state ?? this.selectedState ?? '';
          const newId = await this.addPolygonViaGenericExecute(
            geo,
            city,
            state
          );
          if (!newId) return;
          // attach id locally to shape/payload
          try {
            (payload as any).id = newId;
            (shape as any).id = newId;
          } catch {}
          const campaignId =
            (this as any).selectedCampaignId ??
            (this as any).currentCampaignId ??
            1;
          try {
            await this.addPolygonToCampaignViaGenericExecute(newId, campaignId);
          } catch {}
        } catch (err) {
          console.error('polygonsListeners error', err);
        }
      });
  }

  circlesListeners(): void {
    this.campaignDrawingService.onCircleCreated
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (payload: any) => {
        this.startDrawing(1, 'move');
        try {
          const circleShape: google.maps.Circle = payload?.shape ?? payload;
          if (!circleShape) return;
          if ((payload as any)?.id) return;
          const polygonShape =
            this.campaignDrawingService.convertCircleToPolygon(
              this.map,
              circleShape
            );
          let geo: any = null;
          try {
            geo = await this.campaignDrawingService.convertPolygonToGeoJson(
              polygonShape
            );
          } catch (err) {
            geo = this.polygonShapeToGeoJson(polygonShape);
          }
          if (!geo) return;
          const city = geo?.properties?.city ?? this.selectedCities?.[0] ?? '';
          const state = geo?.properties?.state ?? this.selectedState ?? '';
          const newId = await this.addPolygonViaGenericExecute(
            geo,
            city,
            state
          );
          if (!newId) return;
          try {
            (payload as any).id = newId;
            (circleShape as any).id = newId;
          } catch {}
          const campaignId =
            (this as any).selectedCampaignId ??
            (this as any).currentCampaignId ??
            1;
          try {
            await this.addPolygonToCampaignViaGenericExecute(newId, campaignId);
          } catch {}
        } catch (err) {
          console.error('circlesListeners error', err);
        }
      });
  }

  drawingCancelListener(): void {
    this.campaignDrawingService.onDrawingCancel
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.startDrawing(1, 'move'));
  }

  /** ---------- API wrappers ---------- */
  private async addPolygonViaGenericExecute(
    geo: any,
    city: string,
    state: string
  ): Promise<number | null> {
    const body = {
      Name: 'AddPolygon',
      Params: {
        city: city ?? '',
        state: state ?? '',
        json: JSON.stringify(geo),
      },
    };
    try {
      const resp: any = await firstValueFrom(
        this.placesService.GenericAPI(body)
      );
      // extract id robustly
      if (resp == null) return null;
      if (typeof resp === 'number') return Number(resp);
      if (Array.isArray(resp?.json) && resp.json[0]?.id != null)
        return Number(resp.json[0].id);
      if (resp?.id != null) return Number(resp.id);
      if (resp?.json && typeof resp.json === 'object' && resp.json.id != null)
        return Number(resp.json.id);
      return null;
    } catch (err) {
      console.error('[AddPolygon] failed', err);
      return null;
    }
  }

  private async addPolygonToCampaignViaGenericExecute(
    polygonId: number,
    campaignId: number = 1
  ): Promise<any> {
    const body = {
      Name: 'AddPolygonToCampaign',
      Params: { CampaignId: campaignId, PolygonId: polygonId },
    };
    try {
      return await firstValueFrom(this.placesService.GenericAPI(body));
    } catch (err) {
      console.error('[AddPolygonToCampaign] failed', err);
      throw err;
    }
  }

  /** ---------- GetUserPolygons, states/cities ---------- */
  getUserPolygons(): void {
    const body: any = { Name: 'GetUserPolygons', Params: {} };
    this.placesService
      .GenericAPI(body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.json?.length) {
            this.userPolygons = response.json;
            this.addUserPolygonsToMap();
          }
        },
        error: (err) => console.error('getUserPolygons failed', err),
      });
  }

  getAllStates(): void {
    const body = { Name: 'GetAllStates', Params: {} };
    this.placesService
      .GenericAPI(body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (Array.isArray(response?.json)) {
            this.states = response.json.map((s: any) => ({
              label: s.stateName ?? s.name ?? s,
              value: s.stateCode ?? s.value ?? s,
            }));
          } else this.states = [];
        },
        error: (err) => console.error('GetAllStates failed', err),
      });
  }

  onStateSelected(stateCode?: string) {
    if (!stateCode) {
      this.cities = [];
      this.selectedCities = [];
      return;
    }
    this.selectedCities = [];
    this.getAllCitiesByStateCode(stateCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.cities = response.json?.length
            ? response.json.map((c: any) => ({ label: c.City, value: c.City }))
            : [];
        },
        error: (err) => {
          console.error('getAllCitiesByStateCode failed', err);
          this.cities = [];
        },
      });
  }

  getAllCitiesByStateCode(stateCode: string): Observable<any> {
    const body = {
      Name: 'GetAllCityWithStateCode',
      Params: { StateCode: stateCode },
    };
    return this.placesService.GenericAPI(body);
  }

  stateChangeListener(): void {
    this.stateSubject
      .pipe(
        switchMap((s) => this.getAllCitiesByStateCode(s)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          if (response?.json && response.json.length) {
            this.cities = response.json.map((city: any) => ({
              label: city,
              value: city,
            }));
            this.filteredCities = this.cities;
          }
        },
        error: (err) => console.error('stateChangeListener failed', err),
      });
  }

  /** ---------- Save selected neighborhoods ---------- */
  public async saveSelectedNeighborhoods(campaignId?: number): Promise<void> {
    const campaign =
      campaignId ??
      (this as any).selectedCampaignId ??
      (this as any).currentCampaignId ??
      1;
    const selections = Array.isArray(this.selectedNeighborhoodObjects)
      ? [...this.selectedNeighborhoodObjects]
      : [];
    if (!selections.length) {
      alert('No neighborhoods selected to save.');
      return;
    }
    this.spinner.show();
    const successes: any[] = [],
      failures: any[] = [];
    try {
      for (const sel of selections) {
        const neighId = sel.id;
        try {
          if (this.neighborhoodToPolygonId.has(neighId)) {
            const existingPolygonId =
              this.neighborhoodToPolygonId.get(neighId)!;
            await this.addPolygonToCampaignViaGenericExecute(
              existingPolygonId,
              campaign
            );
            successes.push({ neighId, polygonId: existingPolygonId });
            continue;
          }
          const geo = await this.fetchGeoJsonForNeighborhood(neighId);
          if (!geo) {
            failures.push({ neighId, reason: 'no geojson' });
            continue;
          }
          const city = geo?.properties?.city ?? this.selectedCities?.[0] ?? '';
          const state = geo?.properties?.state ?? this.selectedState ?? '';
          const newPolygonId = await this.addPolygonViaGenericExecute(
            geo,
            city,
            state
          );
          if (!newPolygonId) {
            failures.push({ neighId, reason: 'AddPolygon failed' });
            continue;
          }
          this.neighborhoodToPolygonId.set(neighId, newPolygonId);
          await this.addPolygonToCampaignViaGenericExecute(
            newPolygonId,
            campaign
          );
          successes.push({ neighId, polygonId: newPolygonId });
        } catch (err) {
          failures.push({ neighId, reason: String(err) });
        }
      }
    } finally {
      this.spinner.hide();
    }
    alert(`Saved: ${successes.length} • Failed: ${failures.length}`);
  }

  private async fetchGeoJsonForNeighborhood(id: number): Promise<any | null> {
    const url = `${environment.geoJsonsFilesPath}/${id}.geojson`;
    try {
      const raw = await firstValueFrom(this.httpClient.get<any>(url));
      if (raw) return raw;
    } catch (err) {
      /* fallback */
    }

    const maybe = this.realTimeGeoJsons.find((r) => r.id === id);
    if (maybe) {
      if (typeof (maybe as any).json === 'string') {
        try {
          return JSON.parse((maybe as any).json);
        } catch {}
      } else if ((maybe as any).json) return (maybe as any).json;
      if ((maybe as any).geometry || (maybe as any).type) return maybe;
    }
    return null;
  }

  /** ---------- add/explore polygons management ---------- */
  addExplorePolygonsToMap(): void {
    for (const polygon of this.externalPolygons) {
      const coords = this.getPolygonCoordinates(polygon);
      if (coords)
        this.campaignDrawingService.insertExplorePolygon(
          polygon.id,
          coords,
          polygon.name
        );
    }
  }

  addUserPolygonsToMap(): void {
    for (const polygon of this.userPolygons) {
      const coords = this.getPolygonCoordinates(polygon);
      if (coords)
        this.campaignDrawingService.insertExplorePolygon(
          polygon.id,
          coords,
          polygon.name
        );
    }
  }

  toggleDisplayedExternalPolygon(polygon: IPolygon): void {
    const present = this.displayedExternalPolygons.includes(polygon.id);
    if (present) {
      this.displayedPolygonsCenters = this.displayedPolygonsCenters.filter(
        (p) => p !== polygon.id
      );
      this.campaignDrawingService.completelyRemoveMarkers(polygon.id);
      this.campaignDrawingService.hideShapeFromMap(polygon.id);
      this.displayedExternalPolygons = this.displayedExternalPolygons.filter(
        (id) => id !== polygon.id
      );
    } else {
      this.scrollToMap();
      if (!this.polygonShoppingCenters.has(polygon.id)) {
        this.getShoppingCentersByPolygonId(polygon.id);
      } else {
        this.viewShoppingCenterOnMap(polygon.id);
      }
      this.displayedExternalPolygons.push(polygon.id);
      const coordinates = this.getPolygonCoordinates(polygon);
      const center = this.getMapCenter(polygon.json);
      if (coordinates)
        this.campaignDrawingService.updateMapZoom(this.map, coordinates);
      else this.campaignDrawingService.updateMapCenter(this.map, center);
      this.campaignDrawingService.displayShapeOnMap(polygon.id, this.map);
    }
  }

  getShoppingCentersByPolygonId(polygonId: number) {
    this.searchedPolygonId = polygonId;
    const body = {
      Name: 'GetShoppingCentersByPolygonId',
      Params: { PolygonId: polygonId },
    };
    this.placesService
      .GenericAPI(body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.searchedPolygonId = 0;
          this.polygonShoppingCenters.set(
            polygonId,
            resp.json.length ? resp.json : []
          );
          this.viewShoppingCenterOnMap(polygonId);
        },
        error: (err) => {
          this.searchedPolygonId = 0;
          console.error('getShoppingCentersByPolygonId failed', err);
        },
      });
  }

  viewShoppingCenterOnMap(polygonId: number) {
    this.displayedPolygonsCenters.push(polygonId);
    if (this.campaignDrawingService.isMarkersExists(polygonId))
      this.campaignDrawingService.displayMarker(polygonId, this.map);
    else {
      for (const center of this.getShoppingCentersForPolygon(polygonId))
        this.campaignDrawingService.createMarker(this.map, polygonId, center);
    }
  }

  getShoppingCentersForPolygon(polygonId: number): ShoppingCenter[] {
    return this.polygonShoppingCenters.get(polygonId) ?? [];
  }

  concatSearchResult(): IPolygon[] {
    return this.displayUserPolygons && this.userPolygons.length
      ? [...this.externalPolygons, ...this.userPolygons]
      : this.externalPolygons;
  }

  /** ---------- geojson + util helpers ---------- */
  private safeParse<T = any>(text?: string | null): T | null {
    if (!text) return null;
    try {
      return JSON.parse(text as any) as T;
    } catch {
      return null;
    }
  }

  getPolygonCoordinates(polygon: IPolygon) {
    const geoJson = this.safeParse<IGeoJson>(polygon.json);
    if (!geoJson?.geometry?.coordinates) return null;
    const coords = geoJson.geometry.coordinates[0]?.map((coord: number[]) => ({
      lat: coord[1],
      lng: coord[0],
    }));
    return coords && coords.length ? coords : null;
  }

  getMapCenter(polygonJson: string) {
    const geoJson = this.safeParse<IGeoJson>(polygonJson);
    if (!geoJson?.geometry?.coordinates) return null;
    const points = geoJson.geometry.coordinates[0].map((coord: number[]) => ({
      lat: coord[1],
      lng: coord[0],
    }));
    if (!points.length) return null;
    const sum = points.reduce(
      (acc, p) => {
        acc.lat += p.lat;
        acc.lng += p.lng;
        return acc;
      },
      { lat: 0, lng: 0 }
    );
    return { lat: sum.lat / points.length, lng: sum.lng / points.length };
  }

  private polygonShapeToGeoJson(shape: google.maps.Polygon): any {
    try {
      const path: any = (shape as any).getPath
        ? (shape as any).getPath()
        : (shape as any).getPaths();
      let coords: number[][] = [];
      if (path && typeof path.getArray === 'function')
        coords = (path.getArray() as google.maps.LatLng[]).map((ll) => [
          ll.lng(),
          ll.lat(),
        ]);
      else if (path && typeof path.forEach === 'function') {
        const first: number[][] = [];
        (path as any).forEach((p: any) => {
          if (p && typeof p.getArray === 'function')
            first.push(
              ...(p.getArray() as google.maps.LatLng[]).map((ll: any) => [
                ll.lng(),
                ll.lat(),
              ])
            );
        });
        coords = first;
      }
      if (
        coords.length &&
        (coords[0][0] !== coords[coords.length - 1][0] ||
          coords[0][1] !== coords[coords.length - 1][1])
      )
        coords.push([coords[0][0], coords[0][1]]);
      return {
        type: 'Feature',
        properties: {
          city: this.selectedCities?.[0] ?? '',
          state: this.selectedState ?? '',
        },
        geometry: { type: 'Polygon', coordinates: [coords] },
      };
    } catch (err) {
      console.error('polygonShapeToGeoJson failed', err);
      return null;
    }
  }

  /** ---------- feature loading (geojson files) ---------- */
  protected addNewFeature(
    feature: { id: number; name: string },
    forceLoad = false
  ) {
    if (!feature || typeof feature.id !== 'number' || isNaN(feature.id)) return;

    const geoFeatureId = this.displayedGeoJsons.find(
      (g) => g.id === feature.id
    )?.featureId;
    const camAny: any = this.camDrawingService;
    const maybeCamMap =
      typeof camAny.getMap === 'function' ? camAny.getMap() : null;
    const map = maybeCamMap || this.map;

    if (!map || !this.mapReady) {
      this.pendingAdditions.add(feature.id);
      return;
    }

    if (!geoFeatureId) {
      if (this.attemptedLoads.has(feature.id) && !forceLoad) return;
      if (this.loadingSet.has(feature.id)) return;
      this.attemptedLoads.add(feature.id);
      this.loadingSet.add(feature.id);

      const url = `${environment.geoJsonsFilesPath}/${feature.id}.geojson`;
      this.genericMapService
        .loadGeoJsonFileOnMap(map, url)
        .then((featureId) => {
          this.loadingSet.delete(feature.id);
          if (featureId) {
            this.displayedGeoJsons.push({ featureId, ...feature });
            if (typeof camAny.addNewFeatureWithOriginalData === 'function')
              camAny.addNewFeatureWithOriginalData({ featureId, ...feature });
            const obj = this.selectedNeighborhoodObjects.find(
              (o) => o.id === feature.id
            );
            if (obj) obj.featureId = featureId;
          }
        })
        .catch((err) => {
          this.loadingSet.delete(feature.id);
          this.attemptedLoads.add(feature.id);
          console.error('addNewFeature -> loadGeoJsonFileOnMap failed', err);
        });
    } else {
      // already loaded - just make sure drawing service knows original id
      try {
        if (typeof camAny.addNewFeatureWithOriginalData === 'function')
          camAny.addNewFeatureWithOriginalData({
            featureId: geoFeatureId,
            ...feature,
          });
      } catch {}
      const obj = this.selectedNeighborhoodObjects.find(
        (o) => o.id === feature.id
      );
      if (obj) obj.featureId = geoFeatureId;
    }
  }

  protected checkDisplayedGeoJson(id: number): string | number | undefined {
    const geo = this.displayedGeoJsons.find((g) => g.id == id);
    return geo ? geo.featureId : undefined;
  }

  /** Called when multiSelect changes */
  public onNeighborhoodsChange(selectedIds: number[] | null): void {
    const selectedArr = Array.isArray(selectedIds) ? selectedIds : [];
    const selectedIdSet = new Set<number>(selectedArr);

    // additions
    for (const id of selectedArr) {
      if (!this.prevSelectedNeighborhoodIds.has(id)) {
        const name = this.neighIdToName.get(id) ?? '';
        let obj = this.selectedNeighborhoodObjects.find((o) => o.id === id);
        if (!obj) {
          obj = { id, name, featureId: null };
          this.selectedNeighborhoodObjects.push(obj);
        }
        const displayed = this.displayedGeoJsons.find((g) => g.id === id);
        if (displayed && displayed.featureId != null)
          obj.featureId = displayed.featureId;
        else this.addNewFeature({ id, name }, false);
      }
    }

    // removals
    for (const prevId of Array.from(this.prevSelectedNeighborhoodIds)) {
      if (!selectedIdSet.has(prevId)) {
        const displayed = this.displayedGeoJsons.find((g) => g.id === prevId);
        if (displayed && displayed.featureId != null) {
          const camAny: any = this.camDrawingService;
          const maybeCamMap =
            typeof camAny.getMap === 'function' ? camAny.getMap() : null;
          const map = maybeCamMap || this.map;
          if (map)
            this.genericMapService.removeFeatureById(map, displayed.featureId);
          this.displayedGeoJsons = this.displayedGeoJsons.filter(
            (g) => g.id !== prevId
          );
        } else {
          if (this.pendingAdditions.has(prevId))
            this.pendingAdditions.delete(prevId);
        }
        this.selectedNeighborhoodObjects =
          this.selectedNeighborhoodObjects.filter((o) => o.id !== prevId);
      }
    }

    this.prevSelectedNeighborhoodIds = selectedIdSet;
  }

  /** ---------- load campaign polygons ---------- */
  private async getCampaignPolygonIds(campaignId = 1): Promise<number[]> {
    const body = {
      Name: 'GetCampaignPolygonIds',
      Params: { CampaignId: campaignId },
    };
    try {
      const raw: any = await firstValueFrom(
        this.placesService.GenericAPI(body)
      );
      let ids: number[] = [];
      if (raw == null) return ids;
      if (Array.isArray(raw))
        ids = raw
          .map((r: any) => (typeof r === 'number' ? r : Number(r?.id ?? r)))
          .filter((n: number) => !isNaN(n));
      else if (Array.isArray(raw?.json))
        ids = raw.json
          .map((r: any) => Number(r?.id ?? r))
          .filter((n: number) => !isNaN(n));
      else if (Array.isArray(raw?.ids))
        ids = raw.ids
          .map((n: any) => Number(n))
          .filter((n: number) => !isNaN(n));
      else if (raw?.id) ids = [Number(raw.id)];
      return ids;
    } catch (err) {
      console.error('[GetCampaignPolygonIds] failed', err);
      return [];
    }
  }

  public async loadCampaignPolygons(campaignId = 1): Promise<void> {
    try {
      const ids = await this.getCampaignPolygonIds(campaignId);
      if (!ids || !ids.length) return;
      for (const id of ids) {
        try {
          this.addNewFeature({ id, name: '' }, false);
        } catch (err) {}
      }
    } catch (err) {
      console.error('loadCampaignPolygons failed', err);
    }
  }

  /** ---------- helpers used by template buttons ---------- */
  public async callGetCampaignPolygons(): Promise<any> {
    this.savedPolygonIds = this.gatherSavedPolygonIds();
    if (!this.savedPolygonIds.length) return null;
    const body = {
      Name: 'GetCampaignPolygons',
      Params: { PolygonIds: JSON.stringify(this.savedPolygonIds) },
    };
    try {
      const resp = await firstValueFrom(this.placesService.GenericAPI(body));
      console.debug('GetCampaignPolygons response:', resp);
      return resp;
    } catch (err) {
      console.error('callGetCampaignPolygons failed', err);
      return null;
    }
  }

  private gatherSavedPolygonIds(): number[] {
    const ids = new Set<number>();
    try {
      (this.campaignDrawingService.getDrawnPolygons || []).forEach((p: any) => {
        if (p?.id != null) ids.add(Number(p.id));
      });
    } catch {}
    try {
      (this.campaignDrawingService.getDrawnCircles || []).forEach((c: any) => {
        if (c?.id != null) ids.add(Number(c.id));
      });
    } catch {}
    try {
      (this.selectedNeighborhoodObjects || []).forEach((o: any) => {
        if (o?.id != null) ids.add(Number(o.id));
      });
    } catch {}
    try {
      (this.userPolygons || []).forEach((up: any) => {
        if (up?.id != null) ids.add(Number(up.id));
      });
    } catch {}
    return Array.from(ids);
  }

  /** ---------- small UI helpers ---------- */
  scrollToMap(): void {
    this.gmapContainer.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  /** ---------- cleaning up UI state when server deletes polygon ---------- */
  private handleServerDeletedPolygon(polygonId: number) {
    if (!polygonId) return;
    this.displayedExternalPolygons = this.displayedExternalPolygons.filter(
      (id) => id !== polygonId
    );
    for (const [neigh, poly] of Array.from(
      this.neighborhoodToPolygonId.entries()
    ))
      if (poly === polygonId) this.neighborhoodToPolygonId.delete(neigh);
    this.userPolygons = this.userPolygons.filter((p) => p.id !== polygonId);
    this.externalPolygons = this.externalPolygons.filter(
      (p) => p.id !== polygonId
    );
    this.selectedNeighborhoodObjects = this.selectedNeighborhoodObjects.filter(
      (o) => o.id !== polygonId
    );
    this.displayedGeoJsons = this.displayedGeoJsons.filter(
      (g) => g.id !== polygonId && g.featureId != polygonId
    );
    this.savedPolygonIds = (this.savedPolygonIds || []).filter(
      (id) => id !== polygonId
    );
    try {
      this.campaignDrawingService.completelyRemoveMarkers(polygonId);
      this.campaignDrawingService.removePolygonWithId(polygonId);
    } catch (e) {}
    if (this.polygonShoppingCenters.has(polygonId))
      this.polygonShoppingCenters.delete(polygonId);
  }

  /** ---------- UI API & neighborhoods helpers (used by city multi-select) ---------- */

  // public so template can call it (we use $any($event).value in template)
  public viewNeighborhoods(cityOrCities: string | string[]): void {
    this.loadingGlobalPolygons = true;
    this.realTimeGeoJsons = [];
    this.neighborhoods = [];
    this.cdr.detectChanges();

    if (!cityOrCities) {
      this.loadingGlobalPolygons = false;
      this.cdr.detectChanges();
      return;
    }

    if (Array.isArray(cityOrCities)) {
      const cities = cityOrCities.filter((c) => !!c);
      if (cities.length === 0) {
        this.loadingGlobalPolygons = false;
        this.cdr.detectChanges();
        return;
      }

      const calls = cities.map((city) =>
        this.getGeoJsonsFile(city).pipe(takeUntil(this.destroy$))
      );
      forkJoin(calls)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (responses: any[]) => {
            try {
              this.applyGeoJsonResponses(responses);
            } catch (err) {
              console.error(
                'Error processing neighborhood responses (multiple):',
                err
              );
              this.realTimeGeoJsons = [];
              this.neighborhoods = [];
              this.loadingGlobalPolygons = false;
              this.cdr.detectChanges();
            }
          },
          (err) => {
            console.error('viewNeighborhoods (multiple) failed', err);
            this.realTimeGeoJsons = [];
            this.neighborhoods = [];
            this.loadingGlobalPolygons = false;
            this.cdr.detectChanges();
          }
        );
    } else {
      const city = cityOrCities as string;
      this.getGeoJsonsFile(city)
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          (response: any) => {
            try {
              this.applyGeoJsonResponses([response]);
            } catch (err) {
              console.error(
                'Error processing neighborhood response (single):',
                err
              );
              this.realTimeGeoJsons = [];
              this.neighborhoods = [];
              this.loadingGlobalPolygons = false;
              this.cdr.detectChanges();
            }
          },
          (err) => {
            console.error('viewNeighborhoods (single) failed', err);
            this.realTimeGeoJsons = [];
            this.neighborhoods = [];
            this.loadingGlobalPolygons = false;
            this.cdr.detectChanges();
          }
        );
    }
  }

  private getGeoJsonsFile(city: string): Observable<any> {
    const body = {
      Name: 'GetPolygonsByCityAndState',
      Params: { City: city, State: this.selectedState ?? '' },
    };
    return this.placesService.GenericAPI(body);
  }

  private applyGeoJsonResponses(responses: any[]): void {
    this.realTimeGeoJsons = [];
    for (const response of responses) {
      if (
        response?.json &&
        Array.isArray(response.json) &&
        response.json.length > 0
      ) {
        const filtered = response.json.filter(
          (g: any) => g && g.name != null && String(g.name).trim().length > 0
        );
        this.realTimeGeoJsons.push(...filtered);
      }
    }

    // dedupe by id (prefer) or name fallback
    this.realTimeGeoJsons = this.realTimeGeoJsons.filter(
      (v, i, a) =>
        a.findIndex((t) => (t.id ?? t.name) === (v.id ?? v.name)) === i
    );
    this.realTimeGeoJsons.sort((a, b) =>
      (a.name ?? '').localeCompare(b.name ?? '')
    );

    this.neighborhoods = Array.from(
      new Set(this.realTimeGeoJsons.map((r) => (r.name ?? '').trim()))
    ).filter((n) => n.length > 0);

    this.buildNeighOptions();
    this.loadingGlobalPolygons = false;
    this.cdr.detectChanges();
  }

  private buildNeighOptions(): void {
    const map = new Map<string, { id?: number; name: string }>();
    for (const r of this.realTimeGeoJsons) {
      const name = (r.name ?? '').trim();
      if (!name) continue;
      if (!map.has(name)) map.set(name, { id: r.id, name });
    }

    this.neighIdToName.clear();
    this.neighOptions = Array.from(map.values())
      .filter((v) => v.id != null)
      .map((v) => {
        this.neighIdToName.set(v.id!, v.name);
        return { label: v.name, value: v.id! } as SelectItem;
      });

    this.selectedNeighborhoodIds = [];
    this.selectedNeighborhoodObjects = [];
    this.prevSelectedNeighborhoodIds.clear();
    this.pendingAdditions.clear();
  }

  /** ---------- modal actions (create campaign) ---------- */
  public createNewCampaign(): void {
    if (!this.buyBoxId) {
      alert('Please select a buybox first.');
      return;
    }

    if (this.campaignName.trim().length == 0) {
      alert('Please set campaign name first.');
      return;
    }

    this.spinner.show();
    const body: any = {
      Name: 'CreateCampaign',
      Params: {
        CampaignName: this.campaignName,
        CampaignPrivacy: this.isPrivateCampaign,
        BuyBoxId: this.buyBoxId,
        CreatedDate: new Date().toISOString(),
      },
    };

    this.placesService
      .GenericAPI(body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (
            response.json &&
            response.json.length > 0 &&
            response.json[0].id
          ) {
            this.spinner.hide();
            this.modalService.dismissAll();
            if (!this.router.url.includes('campaigns')) {
              this.router
                .navigate(['/campaigns'])
                .catch((err) => console.error('navigate failed', err));
            } else {
              this.onCampaignCreated.emit();
            }
            // save created shapes and attach to campaign
            this.saveShapesWithCampaign(response.json[0].id);
          } else {
            this.spinner.hide();
            console.warn('createNewCampaign: unexpected response', response);
          }
        },
        error: (err) => {
          this.spinner.hide();
          console.error('CreateCampaign failed', err);
        },
      });
  }

  /**
   * Save currently drawn polygons/circles to server via AddPolygon,
   * then attach each created polygon to the campaign via AddPolygonToCampaign.
   */
  public async saveShapesWithCampaign(campaignId: number): Promise<void> {
    if (!campaignId) {
      console.warn('saveShapesWithCampaign called without campaignId');
      return;
    }

    const drawnPolygons = this.campaignDrawingService.getDrawnPolygons || [];
    const drawnCircles = this.campaignDrawingService.getDrawnCircles || [];

    this.spinner.show();

    try {
      // handle polygons
      for (const polygonEntry of drawnPolygons) {
        try {
          // if it already has an id, just attach
          if (polygonEntry?.id) {
            await this.addPolygonToCampaignViaGenericExecute(
              Number(polygonEntry.id),
              campaignId
            );
            continue;
          }

          const polyShape = polygonEntry.shape as google.maps.Polygon;
          let geo: any = null;
          try {
            geo = await this.campaignDrawingService.convertPolygonToGeoJson(
              polyShape
            );
          } catch (err) {
            geo = this.polygonShapeToGeoJson(polyShape);
          }
          if (!geo) {
            console.warn(
              'saveShapesWithCampaign: polygon conversion failed, skipping one polygon'
            );
            continue;
          }

          const city = geo?.properties?.city ?? this.selectedCities?.[0] ?? '';
          const state = geo?.properties?.state ?? this.selectedState ?? '';

          const newId = await this.addPolygonViaGenericExecute(
            geo,
            city,
            state
          );
          if (!newId) {
            console.warn(
              'saveShapesWithCampaign: AddPolygon returned no id for polygon',
              polygonEntry
            );
            continue;
          }

          // persist id locally
          polygonEntry.id = newId;
          try {
            (polyShape as any).id = newId;
          } catch {}

          await this.addPolygonToCampaignViaGenericExecute(newId, campaignId);
        } catch (err) {
          console.error('saveShapesWithCampaign: error saving polygon', err);
        }
      }

      // handle circles (convert -> polygon, save, attach)
      for (const circleEntry of drawnCircles) {
        try {
          if (circleEntry?.id) {
            await this.addPolygonToCampaignViaGenericExecute(
              Number(circleEntry.id),
              campaignId
            );
            continue;
          }

          const circleShape = circleEntry.shape as google.maps.Circle;
          const polygonShape =
            this.campaignDrawingService.convertCircleToPolygon(
              this.map,
              circleShape
            );

          let geo: any = null;
          try {
            geo = await this.campaignDrawingService.convertPolygonToGeoJson(
              polygonShape
            );
          } catch (err) {
            geo = this.polygonShapeToGeoJson(polygonShape);
          }
          if (!geo) {
            console.warn(
              'saveShapesWithCampaign: circle->polygon conversion failed, skipping one circle'
            );
            continue;
          }

          const city = geo?.properties?.city ?? this.selectedCities?.[0] ?? '';
          const state = geo?.properties?.state ?? this.selectedState ?? '';

          const newId = await this.addPolygonViaGenericExecute(
            geo,
            city,
            state
          );
          if (!newId) {
            console.warn(
              'saveShapesWithCampaign: AddPolygon returned no id for circle',
              circleEntry
            );
            continue;
          }

          circleEntry.id = newId;
          try {
            (circleShape as any).id = newId;
          } catch {}

          await this.addPolygonToCampaignViaGenericExecute(newId, campaignId);
        } catch (err) {
          console.error('saveShapesWithCampaign: error saving circle', err);
        }
      }

      // optionally call sync action if your backend requires it
      try {
        await this.syncMarketSurveyWithCampaign(campaignId);
      } catch (e) {
        console.debug('syncMarketSurveyWithCampaign failed', e);
      }

      // clear local drawn lists
      this.campaignDrawingService.clearDrawnLists();
    } finally {
      this.spinner.hide();
    }
  }

  /**
   * wrapper for SyncMarketSurveyWithCampaign
   */
  private async syncMarketSurveyWithCampaign(campaignId: number): Promise<any> {
    const body: any = {
      Name: 'SyncMarketSurveyWithCampaign',
      Params: { CampaignId: campaignId },
    };
    try {
      return await firstValueFrom(this.placesService.GenericAPI(body));
    } catch (err) {
      console.error('syncMarketSurveyWithCampaign failed', err);
      throw err;
    }
  }

  // ------------------- Unified Autocomplete Methods -------------------

  // trackBy helpers
  public trackBySearchItem(index: number, it: SearchItem) {
    return it.type + '::' + (it.id ?? it.name);
  }
  public trackBySelected(index: number, it: SearchItem) {
    return it.type + '::' + (it.id ?? it.name);
  }

  onSearchInput(value: string) {
    this.searchTerm = value ?? '';
    if (!value || value.trim().length === 0) {
      this.searchResults = [];
      this.showSuggestions = false;
      return;
    }
    this.searchSubject.next(value.trim());
  }

  private autocompleteSearch(term: string): Observable<SearchItem[]> {
    if (!term || term.trim().length === 0) return of([]);

    // Placeholder backend action — replace with your actual action if different
    const body = { Name: 'SearchLocations', Params: { Query: term } };

    return this.placesService.GenericAPI(body).pipe(
      map((resp: any) => {
        const arr = Array.isArray(resp?.json)
          ? resp.json
          : Array.isArray(resp)
          ? resp
          : [];
        return arr.map((r: any) => this.normalizeSearchResultFromAPI(r));
      }),
      catchError((err) => {
        console.warn(
          'Autocomplete backend failed — falling back to local filtering',
          err
        );
        return of(this.localSearchFallback(term));
      })
    );
  }

  private normalizeSearchResultFromAPI(r: any): SearchItem {
    if (!r) return { type: 'neighborhood', name: '' };
    // If backend returns a plain string
    if (typeof r === 'string') return { type: 'state', name: r };

    const rawType = (r.type ?? r.Type ?? '').toString().toLowerCase();
    const type: SearchType =
      rawType === 'state' || rawType === 'city' || rawType === 'neighborhood'
        ? (rawType as SearchType)
        : 'neighborhood';
    return {
      type,
      id: r.id != null ? Number(r.id) : undefined,
      code: r.code ?? r.stateCode ?? undefined,
      name: r.name ?? r.Name ?? r.title ?? (typeof r === 'string' ? r : ''),
      state: r.state ?? r.stateCode ?? undefined,
      city: r.city ?? undefined,
      raw: r,
    };
  }

  private localSearchFallback(term: string): SearchItem[] {
    const q = term.toLowerCase();

    const stateItems: SearchItem[] = (this.states || [])
      .map((s: any) => ({
        type: 'state' as SearchType,
        name: s.label ?? s,
        code: s.value ?? s.stateCode ?? s.value,
        raw: s,
      }))
      .filter((s) => s.name.toLowerCase().includes(q));

    const cityItems: SearchItem[] = (this.cities || [])
      .map((c: any) => ({
        type: 'city' as SearchType,
        name: c.label ?? c.value ?? c,
        city: c.value ?? c.City ?? c,
        state: this.selectedState ?? undefined,
        raw: c,
      }))
      .filter((c) => c.name.toLowerCase().includes(q));

    const neighs: SearchItem[] = (this.realTimeGeoJsons || [])
      .map((r: any) => ({
        type: 'neighborhood' as SearchType,
        id: r.id,
        name: (r.name ?? '').toString(),
        city: r.city ?? undefined,
        state: r.state ?? this.selectedState ?? undefined,
        raw: r,
      }))
      .filter((n) => (n.name ?? '').toLowerCase().includes(q));

    const results: SearchItem[] = [
      ...neighs,
      ...cityItems,
      ...stateItems,
    ].slice(0, 50);
    return results;
  }

  isSelected(item: SearchItem): boolean {
    return this.selectedItems.some(
      (si) =>
        si.type === item.type &&
        (si.id != null ? si.id === item.id : si.name === item.name)
    );
  }

  public toggleItem(item: SearchItem) {
    const foundIndex = this.selectedItems.findIndex(
      (si) =>
        si.type === item.type &&
        (si.id != null ? si.id === item.id : si.name === item.name)
    );
    if (foundIndex >= 0) {
      const [removed] = this.selectedItems.splice(foundIndex, 1);
      this.afterDeselect(removed);
    } else {
      const clone = { ...item };
      this.selectedItems.push(clone);
      this.afterSelect(clone);
    }
    // keep suggestions open for multi-select UX
    this.cdr.detectChanges();
  }

  public removeSelected(item: SearchItem) {
    const idx = this.selectedItems.findIndex(
      (si) =>
        si.type === item.type &&
        (si.id != null ? si.id === item.id : si.name === item.name)
    );
    if (idx >= 0) {
      const [removed] = this.selectedItems.splice(idx, 1);
      this.afterDeselect(removed);
    }
    this.cdr.detectChanges();
  }

  private afterSelect(item: SearchItem) {
    if (item.type === 'state') {
      this.selectedState = (item.code ?? item.name) as any;
      this.onStateSelected(this.selectedState);
      // Clear cities & neighborhoods when selecting a new state (adjust if you want multi-state support)
      this.selectedCities = [];
      this.selectedNeighborhoodIds = [];
      this.neighOptions = [];
    } else if (item.type === 'city') {
      if (!this.selectedCities.includes(item.name)) {
        this.selectedCities = [...this.selectedCities, item.name];
      }
      this.viewNeighborhoods(this.selectedCities);
    } else if (item.type === 'neighborhood') {
      if (item.id != null && !this.selectedNeighborhoodIds.includes(item.id)) {
        this.selectedNeighborhoodIds = [
          ...this.selectedNeighborhoodIds,
          item.id,
        ];
        this.onNeighborhoodsChange(this.selectedNeighborhoodIds);
      } else if (item.name) {
        const found = (this.realTimeGeoJsons || []).find(
          (r) => (r.name ?? '').toString() === item.name
        );
        if (
          found &&
          found.id != null &&
          !this.selectedNeighborhoodIds.includes(found.id)
        ) {
          this.selectedNeighborhoodIds = [
            ...this.selectedNeighborhoodIds,
            found.id,
          ];
          this.onNeighborhoodsChange(this.selectedNeighborhoodIds);
        }
      }
    }
  }

  private afterDeselect(item: SearchItem) {
    if (item.type === 'state') {
      if (this.selectedState === (item.code ?? item.name)) {
        this.selectedState = undefined;
        this.cities = [];
        this.selectedCities = [];
        this.neighOptions = [];
        this.selectedNeighborhoodIds = [];
        this.onNeighborhoodsChange([]);
      }
    } else if (item.type === 'city') {
      this.selectedCities = (this.selectedCities || []).filter(
        (c) => c !== item.name
      );
      if (this.selectedCities.length)
        this.viewNeighborhoods(this.selectedCities);
      else {
        this.realTimeGeoJsons = [];
        this.neighborhoods = [];
        this.neighOptions = [];
        this.selectedNeighborhoodIds = [];
        this.onNeighborhoodsChange([]);
      }
    } else if (item.type === 'neighborhood') {
      if (item.id != null) {
        this.selectedNeighborhoodIds = (
          this.selectedNeighborhoodIds || []
        ).filter((id) => id !== item.id);
        this.onNeighborhoodsChange(this.selectedNeighborhoodIds);
      } else {
        const found = (this.realTimeGeoJsons || []).find(
          (r) => (r.name ?? '') === item.name
        );
        if (found && found.id != null) {
          this.selectedNeighborhoodIds = (
            this.selectedNeighborhoodIds || []
          ).filter((id) => id !== found.id);
          this.onNeighborhoodsChange(this.selectedNeighborhoodIds);
        }
      }
    }
  }

  /** ---------- small UI helpers ---------- */
  public trackByBuyBoxId(
    index: number,
    item: { id: number; name: string }
  ): number {
    return item?.id ?? index;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    try {
      if (!this.searchContainer) return;
      const el = this.searchContainer.nativeElement as HTMLElement;
      if (!el.contains(event.target as Node)) {
        // click outside -> hide suggestions
        this.showSuggestions = false;
        this.cdr.detectChanges();
      }
    } catch (e) {
      // ignore
    }
  }

  public itemDisplay(item: SearchItem): string {
    if (!item) return '';
    if (item.type === 'state') return item.name;
    if (item.type === 'city')
      return item.name + (item.state ? `, ${item.state}` : '');
    // neighborhood or fallback
    return item.name;
  }
public onSearchInputEvent(e: Event): void {
  const value = (e.target as HTMLInputElement)?.value ?? '';
  this.searchTerm = value;

  // empty input -> clear
  if (!value || value.trim().length === 0) {
    this.searchResults = [];
    this.showSuggestions = false;
    this.searchedOnce = false;
    return;
  }

  // trigger the debounced server call; don't set local fallback
  this.searchSubject.next(value.trim());
}


  private callAutoCompletePolygonCityState(
    term: string
  ): Observable<SearchItem[]> {
    if (!term || term.trim().length === 0) return of([]);

    const body = {
      Name: 'AutoComplePolygonCityState',
      Params: { input: term },
    };

    return this.placesService.GenericAPI(body).pipe(
      map((resp: any) => {
        // if server returned an error object or json is null -> return empty array
        if (resp?.error) {
          console.warn('AutoComplete backend error:', resp.error);
          return [];
        }

        // prefer resp.json if it's an array
        const arr = Array.isArray(resp?.json)
          ? resp.json
          : Array.isArray(resp)
          ? resp
          : null;

        if (!Array.isArray(arr)) {
          // server didn't return a usable array
          return [];
        }

        const mapped = arr.map((r: any) =>
          this.normalizeSearchResultFromAPI(r)
        );
        // dedupe (type + id/name)
        return mapped.filter(
          (v, i, a) =>
            a.findIndex(
              (t) => t.type === v.type && (t.id ?? t.name) === (v.id ?? v.name)
            ) === i
        );
      }),
      catchError((err) => {
        // network or other HTTP error -> return empty array (do NOT fallback locally)
        console.warn('AutoComplete API request failed', err);
        return of([]);
      })
    );
  }
}
