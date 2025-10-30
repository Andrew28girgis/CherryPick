import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Subject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MapDrawingService } from 'src/app/core/services/map-drawing.service';
import { CampaignDrawingService } from 'src/app/core/services/campaign-drawing.service';
import { PlacesService } from 'src/app/core/services/places.service';
import { GenericMapService } from 'src/app/core/services/generic-map.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { RefreshService } from 'src/app/core/services/refresh.service';
import { HttpClient } from '@angular/common/http';

type SearchType = 'state' | 'city' | 'neighborhood';
export interface SearchItem {
  type: SearchType;
  id?: number | null;
  code?: string | null;
  name: string | null;
  state?: string | null;
  city?: string | null;
  raw?: any;
}

@Component({
  selector: 'app-polygons',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxSpinnerModule],
  templateUrl: './polygons.component.html',
  styleUrls: ['./polygons.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolygonsComponent implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild('mapContainer', { static: false })
  private mapElement!: ElementRef<HTMLDivElement>;
  private map!: google.maps.Map;
  private searchInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  private mapFeatureIdByItemKey = new Map<string, number | string>();
  searchTerm = '';
  minSearchLength = 3;
  searchResults: SearchItem[] = [];
  selectedItems: SearchItem[] = [];
  showSuggestions = false;
  isLoadingSuggestions = false;
  @Input() userBuyBoxes: { id: number; name: string }[] = [];
  @Output() onCampaignCreated = new EventEmitter<void>();
  @Output() saveLocationCriteria = new EventEmitter<any>();
  @Input() locations: any[] = [];

  @ViewChild('drawControls', { static: false })
  private drawControlsRef!: ElementRef<HTMLDivElement>;

  private drawingManager?: google.maps.drawing.DrawingManager | null;
  private overlayCompleteListener?: google.maps.MapsEventListener | null;
  currentDrawingPolygon?: google.maps.Polygon | null;
  currentPolygonCoords: google.maps.LatLngLiteral[] = [];
  drawingActive = false;
  private drawControlsAddedToMap = false;
  selectedTenantId?: number;
  PolygonName: string = '';
  savedPolygonId?: number | null = null;
  locationDataVar: any;
  campaignLocationsList: any;

  constructor(
    private mapDrawingService: MapDrawingService,
    private campaignDrawingService: CampaignDrawingService,
    private placesService: PlacesService,
    private genericMapService: GenericMapService,
    private spinner: NgxSpinnerService,
    private changeDetector: ChangeDetectorRef,
    private refreshService: RefreshService,
    private http: HttpClient
  ) {
    // Autocomplete pipeline with automatic unsubscribe on destroy
    this.searchInput$
      .pipe(
        filter((t) => (t ?? '').length >= this.minSearchLength),
        tap(() => {
          this.isLoadingSuggestions = true;
          this.showSuggestions = true;
          this.searchResults = [];
          this.changeDetector.markForCheck();
        }),
        switchMap((term) => this.fetchAutocompleteResults(term)),
        takeUntil(this.destroy$)
      )
      .subscribe((items) => {
        this.isLoadingSuggestions = false;
        this.searchResults = items;
        this.showSuggestions = true;
        this.changeDetector.markForCheck();
      });
    this.refreshService.triggerPolygonSave$.subscribe((tenantName) => {
      this.onSaveLocationCriteria(tenantName);
    });
  }
  ngOnInit(): void {
    const tryAttach = () => {
      if (this.map && this.drawControlsRef?.nativeElement) {
        this.addDrawControlsToMap();
      } else {
        setTimeout(tryAttach, 100);
      }
    };
    tryAttach();
   }

  ngAfterViewInit(): void {
    this.map = this.mapDrawingService.initializeMap(this.mapElement);
    this.mapDrawingService.initializeDrawingManager(this.map);
    (this.campaignDrawingService as any)?.setMap?.(this.map);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.mapDrawingService.clearDrawnLists?.();
    (this.mapDrawingService as any)?.completelyRemoveExplorePolygon?.();

    this.removeDrawControlsFromMap();
    this.cleanupDrawingManager();
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement)?.value ?? '';
    this.searchTerm = value;
    const trimmed = value.trim();
    if (trimmed.length < this.minSearchLength) {
      this.searchResults = [];
      this.showSuggestions = false;
      this.changeDetector.markForCheck();
      return;
    }
    this.searchInput$.next(trimmed);
  }

  toggleSelection(item: SearchItem) {
    const index = this.selectedItems.findIndex((selected) =>
      this.areItemsEquivalent(selected, item)
    );
    if (index >= 0) {
      const [removedItem] = this.selectedItems.splice(index, 1);
      this.removeSelectedItem(removedItem);
    } else {
      this.selectedItems.push({ ...item });
    }
    this.changeDetector.markForCheck();
  }

  isSelected(item: SearchItem) {
    return this.selectedItems.some((s) => this.areItemsEquivalent(s, item));
  }

  getItemLabel(item?: SearchItem): string {
    if (!item) return '';
    if (item.type === 'neighborhood') return item.name ?? '';
    if (item.type === 'city')
      return (
        item.name ?? `${item.city ?? ''}${item.state ? ', ' + item.state : ''}`
      );
    if (item.type === 'state') return item.name ?? item.code ?? '';
    return item.name ?? '';
  }

  async viewSelectedItem(item: SearchItem) {
    const itemKey = this.getItemKey(item);
    this.spinner.show();
    try {
      (this.mapDrawingService as any)?.completelyRemoveExplorePolygon?.();

      if (
        item.type === 'neighborhood' &&
        typeof item.id === 'number' &&
        !isNaN(item.id)
      ) {
        try {
          const featureId = await this.genericMapService.loadGeoJsonFileOnMap(
            this.map,
            `${environment.geoJsonsFilesPath}/${item.id}.geojson`
          );
          if (featureId != null) {
            this.mapFeatureIdByItemKey.set(itemKey, featureId);
            this.changeDetector.markForCheck();
            return;
          }
        } catch (err) {}
      }

      const geometrySrc = item.raw?.json ?? item.raw?.geometry ?? item.raw;
      const coords = this.convertGeoJsonToLatLng(geometrySrc);
      if (coords?.length) {
        const tempId = this.drawTemporaryPolygon(
          coords,
          item.name ?? undefined
        );
        this.mapFeatureIdByItemKey.set(itemKey, tempId);
        this.changeDetector.markForCheck();
        return;
      }
    } catch (error) {
    } finally {
      this.spinner.hide();
    }
  }

  removeSelectedItem(item: SearchItem) {
    const key = this.getItemKey(item);
    const mapFeatureId = this.mapFeatureIdByItemKey.get(key);
    if (mapFeatureId != null) {
      this.genericMapService.removeFeatureById(this.map, mapFeatureId);
      this.mapFeatureIdByItemKey.delete(key);
    } else {
      (this.mapDrawingService as any)?.completelyRemoveExplorePolygon?.();
    }
    const index = this.selectedItems.findIndex((selected) =>
      this.areItemsEquivalent(selected, item)
    );
    if (index >= 0) this.selectedItems.splice(index, 1);
    this.changeDetector.markForCheck();
  }

  onSaveLocationCriteria(tenantId: number) {
    const locations = this.selectedItems.map((it) => {
      const raw = it.raw ?? {};
      const isNeighborhood = it.type === 'neighborhood';
      return {
        state: it.state ?? it.code ?? raw?.StateCode ?? null,
        city: it.city ?? raw?.City ?? (it.type === 'city' ? it.name : null),
        neighborhoodId: isNeighborhood ? it.id ?? null : null,
        neighborhoodName: isNeighborhood ? it.name ?? raw?.Name ?? null : null,
      };
    });

    const locationCriteria = {
      organizationId: tenantId,
      locationCriteria: { locations },
    };
    locationCriteria.locationCriteria?.locations?.length
      ? this.saveLocationCriteria.emit(locationCriteria)
      : this.saveLocationCriteria.emit(this.locationDataVar);
  }

  private areItemsEquivalent(a: SearchItem, b: SearchItem) {
    if (a.type !== b.type) return false;
    if (a.id != null || b.id != null) return a.id === b.id;
    return (a.name ?? '').toLowerCase() === (b.name ?? '').toLowerCase();
  }

  private getItemKey(item: SearchItem): string {
    const namePart = (item.name ?? '').toString().toLowerCase();
    return `${item.type}:${item.id ?? namePart}`;
  }
  private fetchAutocompleteResults(term: string): Observable<SearchItem[]> {
    return this.placesService
      .BetaGenericAPI({
        Name: 'AutoComplePolygonCityState',
        Params: { input: term },
      })
      .pipe(
        map((response: any) => {
          const list = Array.isArray(response?.json)
            ? response.json
            : Array.isArray(response)
            ? response
            : [];
          return list
            .map((r: any) => this.normalizeApiResponse(r))
            .filter(Boolean) as SearchItem[];
        })
      );
  }

  private normalizeApiResponse(record: any): SearchItem | null {
    const asNullable = (v: any): string | null => {
      if (v == null) return null;
      const s = String(v).trim();
      return s === '' ? null : s;
    };

    if (!record) return null;

    if (record?.Id != null) {
      const name = asNullable(record.Name);
      const city = asNullable(record.City);
      const state = asNullable(record.StateCode ?? record.StateName);

      return {
        type: 'neighborhood',
        id: Number(record.Id),
        name:
          [name, city && `— ${city}`, state && `, ${state}`]
            .filter(Boolean)
            .join('') || null,
        city: city,
        state: state,
        raw: record,
      };
    }

    if (record?.City != null) {
      const city = asNullable(record.City);
      const state = asNullable(record.StateCode ?? record.StateName);

      return {
        type: 'city',
        name: city ? (state ? `${city}, ${state}` : city) : null,
        city: city,
        state: state,
        raw: record,
      };
    }

    if (record?.StateName != null || record?.StateCode != null) {
      const stateName = asNullable(record.StateName ?? record.StateCode);
      const code = asNullable(record.StateCode);

      return {
        type: 'state',
        name: stateName ? (code ? `${stateName} (${code})` : stateName) : null,
        code: code,
        raw: record,
      };
    }

    if (record?.name || record?.Name) {
      const name = asNullable(record?.name ?? record?.Name);
      return { type: 'neighborhood', name: name, raw: record };
    }

    return null;
  }

  private convertGeoJsonToLatLng(
    geoJson: any
  ): google.maps.LatLngLiteral[] | null {
    if (!geoJson) return null;
    const parsed =
      typeof geoJson === 'string' ? this.safelyParseJson(geoJson) : geoJson;
    const obj =
      parsed?.type === 'Feature'
        ? parsed.geometry ?? parsed
        : parsed?.geometry ?? parsed;
    const type = obj?.type;
    const coords = obj?.coordinates;
    if (!coords || !type) return null;

    let ring: any[] | null = null;
    if (type === 'Polygon') ring = coords[0];
    else if (type === 'MultiPolygon') ring = coords[0]?.[0];
    else if (type === 'LineString') ring = coords;
    else if (type === 'Point') ring = [coords];
    else if (
      Array.isArray(coords) &&
      Array.isArray(coords[0]) &&
      Array.isArray(coords[0][0])
    ) {
      ring = coords[0][0];
    }

    if (!Array.isArray(ring)) return null;
    return ring.map((pt: any) => ({ lat: Number(pt[1]), lng: Number(pt[0]) }));
  }

  private safelyParseJson<T = any>(txt: string): T | null {
    try {
      return JSON.parse(txt) as T;
    } catch {
      return null;
    }
  }

  private drawTemporaryPolygon(
    coordinates: google.maps.LatLngLiteral[],
    label?: string
  ): string {
    const id = `ephemeral:${Date.now()}`;
    (this.mapDrawingService as any).insertExplorePolygonToMyPolygons?.(
      this.map,
      Date.now(),
      coordinates,
      label ?? ''
    );
    this.mapDrawingService.updateMapZoom(this.map, coordinates);
    return id;
  }

  get stateCityResults(): SearchItem[] {
    return Array.isArray(this.searchResults)
      ? this.searchResults.filter(
          (r) => r?.type === 'state' || r?.type === 'city'
        )
      : [];
  }

  get neighborhoodResults(): SearchItem[] {
    return Array.isArray(this.searchResults)
      ? this.searchResults.filter((r) => r?.type === 'neighborhood')
      : [];
  }

  getItemId(item: SearchItem): string {
    const namePart = (item.name ?? '')
      .toString()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_\-:]/g, '');
    return `chk-${item.type}-${item.id ?? namePart}`;
  }

  private initLocalDrawingManager() {
    if (!this.map) {
      console.error(
        'initLocalDrawingManager called before map initialization.'
      );
      return;
    }
    if (this.drawingManager) return;
    if (!('drawing' in google.maps)) {
      console.error(
        'Google Maps drawing library not loaded. Include &libraries=drawing in script URL.'
      );
      return;
    }

    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        editable: true,
        draggable: false,
        clickable: true,
        fillOpacity: 0.15,
        strokeWeight: 2,
      } as google.maps.PolygonOptions,
    });

    this.drawingManager.setMap(this.map);

    this.overlayCompleteListener = google.maps.event.addListener(
      this.drawingManager,
      'overlaycomplete',
      (event: google.maps.drawing.OverlayCompleteEvent) =>
        this.onOverlayComplete(event)
    );
  }

  private cleanupDrawingManager() {
    try {
      if (this.overlayCompleteListener) {
        google.maps.event.removeListener(this.overlayCompleteListener);
        this.overlayCompleteListener = null;
      }
      if (this.drawingManager) {
        this.drawingManager.setMap(null);
        this.drawingManager = undefined;
      }
    } catch (err) {
      console.warn('Error cleaning drawing manager', err);
    }
  }

  public startDrawPolygon() {
    if (!this.map) {
      return;
    }
    this.initLocalDrawingManager();
    if (!this.drawingManager) return;

    if (this.currentDrawingPolygon) {
      try {
        this.currentDrawingPolygon.setMap(null);
      } catch {}
      this.currentDrawingPolygon = undefined;
      this.currentPolygonCoords = [];
    }

    this.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    this.drawingActive = true;
    this.changeDetector.markForCheck();
  }

  private onOverlayComplete(event: google.maps.drawing.OverlayCompleteEvent) {
    if (event.type !== google.maps.drawing.OverlayType.POLYGON) return;

    if (this.currentDrawingPolygon) {
      try {
        this.currentDrawingPolygon.setMap(null);
      } catch {}
      this.currentDrawingPolygon = undefined;
      this.currentPolygonCoords = [];
    }

    const polygon = event.overlay as google.maps.Polygon;
    this.currentDrawingPolygon = polygon;
    polygon.setEditable(true);

    this.updateCurrentPolygonCoords();

    if (this.drawingManager) this.drawingManager.setDrawingMode(null);
    this.drawingActive = false;

    const path = polygon.getPath();
    path.addListener('set_at', () => this.updateCurrentPolygonCoords());
    path.addListener('insert_at', () => this.updateCurrentPolygonCoords());
    path.addListener('remove_at', () => this.updateCurrentPolygonCoords());

    this.changeDetector.markForCheck();
  }

  private updateCurrentPolygonCoords() {
    if (!this.currentDrawingPolygon) {
      this.currentPolygonCoords = [];
      this.changeDetector.markForCheck();
      return;
    }
    const path = this.currentDrawingPolygon.getPath();
    const coords: google.maps.LatLngLiteral[] = [];
    for (let i = 0; i < path.getLength(); i++) {
      const latLng = path.getAt(i);
      coords.push({ lat: latLng.lat(), lng: latLng.lng() });
    }
    this.currentPolygonCoords = coords;
    this.changeDetector.markForCheck();
  }

  public cancelDrawing() {
    if (this.currentDrawingPolygon) {
      try {
        this.currentDrawingPolygon.setMap(null);
      } catch {}
      this.currentDrawingPolygon = undefined;
      this.currentPolygonCoords = [];
    }

    this.savedPolygonId = null;

    if (this.drawingManager) this.drawingManager.setDrawingMode(null);
    this.drawingActive = false;
    this.changeDetector.markForCheck();
  }

  private buildPolygonGeoJsonString(): string | null {
    if (!this.currentPolygonCoords || this.currentPolygonCoords.length < 3)
      return null;

    const ring: [number, number][] = this.currentPolygonCoords.map((p) => [
      p.lng,
      p.lat,
    ]);

    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push([first[0], first[1]]);
    }

    const feature = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [ring],
      },
      properties: {
        createdAt: new Date().toISOString(),
      },
    };

    try {
      return JSON.stringify(feature);
    } catch (err) {
      console.error('Failed to stringify GeoJSON', err);
      return null;
    }
  }

  public async savePolygon() {
    if (!this.currentPolygonCoords || this.currentPolygonCoords.length < 3) {
      return;
    }

    const geoJsonStr = this.buildPolygonGeoJsonString();
    if (!geoJsonStr) {
      return;
    }

    if (!this.PolygonName?.trim()) {
      alert('Please enter a name for the polygon before saving.');
      return;
    }
  }

  private addDrawControlsToMap() {
    try {
      if (
        !this.map ||
        !this.drawControlsRef?.nativeElement ||
        this.drawControlsAddedToMap
      )
        return;
      const posArray =
        this.map.controls[google.maps.ControlPosition.TOP_CENTER];
      posArray.push(this.drawControlsRef.nativeElement);
      this.drawControlsAddedToMap = true;
      this.drawControlsRef.nativeElement.classList.add('gm-map-control');
    } catch (err) {
      console.warn('Could not add draw controls to map', err);
    }
  }

  private removeDrawControlsFromMap() {
    try {
      if (
        !this.map ||
        !this.drawControlsRef?.nativeElement ||
        !this.drawControlsAddedToMap
      )
        return;
      const posArray =
        this.map.controls[google.maps.ControlPosition.TOP_CENTER];
      const arr = posArray.getArray();
      const idx = arr.indexOf(this.drawControlsRef.nativeElement);
      if (idx >= 0) posArray.removeAt(idx);
      this.drawControlsAddedToMap = false;
    } catch (err) {
      console.warn('Could not remove draw controls from map', err);
    }
  }

  private calculateCentroid(
    coords: google.maps.LatLngLiteral[]
  ): google.maps.LatLngLiteral {
    let latSum = 0;
    let lngSum = 0;
    const numPoints = coords.length;

    coords.forEach((coord) => {
      latSum += coord.lat;
      lngSum += coord.lng;
    });

    return {
      lat: latSum / numPoints,
      lng: lngSum / numPoints,
    };
  }
}
