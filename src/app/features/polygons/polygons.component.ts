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
export class PolygonsComponent implements AfterViewInit, OnDestroy {
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

  constructor(
    private mapDrawingService: MapDrawingService,
    private campaignDrawingService: CampaignDrawingService,
    private placesService: PlacesService,
    private genericMapService: GenericMapService,
    private spinner: NgxSpinnerService,
    private changeDetector: ChangeDetectorRef
  ) {
    // Autocomplete pipeline with automatic unsubscribe on destroy
    this.searchInput$
      .pipe(
        filter((t) => (t ?? '').length >= this.minSearchLength),
        tap(() => {
          this.isLoadingSuggestions = true;
          this.showSuggestions = true;
          this.searchResults = [];
          this.mark();
        }),
        switchMap((term) => this.fetchAutocompleteResults(term)),
        takeUntil(this.destroy$)
      )
      .subscribe((items) => {
        this.isLoadingSuggestions = false;
        this.searchResults = items;
        this.showSuggestions = true;
        this.mark();
      });
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
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement)?.value ?? '';
    this.searchTerm = value;
    const trimmed = value.trim();
    if (trimmed.length < this.minSearchLength) {
      this.searchResults = [];
      this.showSuggestions = false;
      this.mark();
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
    this.mark;
  }

  isSelected(item: SearchItem) {
    return this.selectedItems.some((s) => this.areItemsEquivalent(s, item));
  }

  getItemLabel(item?: SearchItem): string {
    if (!item) return '';
    if (item.type === 'neighborhood') return item.name ?? '';
    if (item.type === 'city')
      return (
        item.name ?? `${item.city ?? ''}${item.state ? '' + item.state : ''}`
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
            this.mark();
            return;
          }
        } catch (err) {
          console.warn('Failed to load neighborhood geojson:', err);
        }
      }

      const geometrySrc = item.raw?.json ?? item.raw?.geometry ?? item.raw;
      const coords = this.convertGeoJsonToLatLng(geometrySrc);
      if (coords?.length) {
        const tempId = this.drawTemporaryPolygon(
          coords,
          item.name ?? undefined
        );
        this.mapFeatureIdByItemKey.set(itemKey, tempId);
        this.mark();
        return;
      }

      console.info('No geometry available to view for item', item);
    } catch (error) {
      console.error('Error viewing selected item:', error);
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
    this.mark();
  }

  onSaveLocationCriteria() {
    if (!this.selectedItems.length) return;

    const rows = this.selectedItems.map((it) => {
      const raw = it.raw ?? {};
      const isNeighborhood = it.type === 'neighborhood';
      return [
        isNeighborhood ? it.id ?? 'null' : 'null',
        isNeighborhood ? it.name ?? raw?.Name ?? 'null' : 'null',
        it.city ?? raw?.City ?? (it.type === 'city' ? it.name : 'null'),
        it.state ?? it.code ?? raw?.StateCode ?? 'null',
        raw?.StateName ?? 'null',
      ]
        .map((v) => (v == null || v === '' ? 'null' : String(v)))
        .join(', ');
    });

    const header =
      'Location Criteria\nId,NeighborhoodName,CityName,StateCode,StateName\n';
    const body = rows.join('\n') + '\n';
    this.placesService
      .sendmessages({ Chat: header + body, NeedToSaveIt: true })
      .subscribe();
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
    // returns trimmed string or null if incoming value is null/undefined/empty-after-trim
    const asNullable = (v: any): string | null => {
      if (v == null) return null;
      const s = String(v).trim();
      return s === '' ? null : s;
    };

    if (!record) return null;

    // Neighborhood (Id present)
    if (record?.Id != null) {
      const name = asNullable(record.Name);
      const city = asNullable(record.City);
      const state = asNullable(record.StateCode ?? record.StateName);

      return {
        type: 'neighborhood',
        id: Number(record.Id),
        // keep nulls as null; build label only when parts exist
        name:
          [name, city && `— ${city}`, state && `, ${state}`]
            .filter(Boolean)
            .join('') || null,
        city: city,
        state: state,
        raw: record,
      };
    }

    // City
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

    // State
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

    // Fallback name
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

  private mark() {
    this.changeDetector.markForCheck();
  }
}
