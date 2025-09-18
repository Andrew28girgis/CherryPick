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
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  tap,
} from 'rxjs/operators';
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
  id?: number;
  code?: string;
  name: string;
  state?: string;
  city?: string;
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

  searchTerm = '';
  minSearchLength = 3;
  searchResults: SearchItem[] = [];
  selectedItems: SearchItem[] = [];
  showSuggestions = false;
  isLoadingSuggestions = false;
  @Input() userBuyBoxes: { id: number; name: string }[] = [];
  @Output() onCampaignCreated = new EventEmitter<void>();

  private searchInput$ = new Subject<string>();
  private mapFeatureIdByItemKey = new Map<string, number | string>();

  constructor(
    private mapDrawingService: MapDrawingService,
    private campaignDrawingService: CampaignDrawingService,
    private placesService: PlacesService,
    private genericMapService: GenericMapService,
    private spinner: NgxSpinnerService,
    private changeDetector: ChangeDetectorRef
  ) {
    this.searchInput$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        filter((term) => (term ?? '').length >= this.minSearchLength),
        tap(() => {
          this.isLoadingSuggestions = true;
          this.showSuggestions = true;
          this.searchResults = [];
          this.changeDetector.markForCheck();
        }),
        switchMap((term) => this.fetchAutocompleteResults(term))
      )
      .subscribe((items) => {
        this.isLoadingSuggestions = false;
        this.searchResults = items;
        this.showSuggestions = true;
        this.changeDetector.markForCheck();
      });
  }

  ngAfterViewInit(): void {
    this.map = this.mapDrawingService.initializeMap(this.mapElement);
    this.mapDrawingService.initializeDrawingManager(this.map);
    (this.campaignDrawingService as any)?.setMap?.(this.map);
  }

  ngOnDestroy(): void {
    this.mapDrawingService.clearDrawnLists?.();
    (this.mapDrawingService as any)?.completelyRemoveExplorePolygon?.();
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement)?.value ?? '';
    this.searchTerm = value;

    const trimmedValue = value.trim();
    if (trimmedValue.length < this.minSearchLength) {
      this.searchResults = [];
      this.showSuggestions = false;
      this.changeDetector.markForCheck();
      return;
    }
    this.searchInput$.next(trimmedValue);
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

  isSelected(item: SearchItem): boolean {
    return this.selectedItems.some((selected) =>
      this.areItemsEquivalent(selected, item)
    );
  }

  getItemLabel(item: SearchItem): string {
    if (!item) return '';
    if (item.type === 'neighborhood') return item.name;
    if (item.type === 'city')
      return item.name || `${item.city}${item.state ? ', ' + item.state : ''}`;
    if (item.type === 'state') return item.name || item.code || '';
    return item.name;
  }

  async viewSelectedItem(item: SearchItem) {
    const itemKey = this.getItemKey(item);
    this.spinner.show();

    try {
      (this.mapDrawingService as any)?.completelyRemoveExplorePolygon?.();

      if (item.type === 'neighborhood' && item.id != null) {
        const geoJsonUrl = `${environment.geoJsonsFilesPath}/${item.id}.geojson`;

        if (typeof item.id !== 'number' || isNaN(item.id)) return;

        this.genericMapService
          .loadGeoJsonFileOnMap(
            this.map,
            `${environment.geoJsonsFilesPath}/${item.id}.geojson`
          )
          .then((featureId) => {
            if (featureId) {
              if (featureId != null) {
                this.mapFeatureIdByItemKey.set(itemKey, featureId);

                this.changeDetector.markForCheck();
                return;
              }
            }
          });
      }

      const geometrySource = item.raw?.json ?? item.raw?.geometry ?? item.raw;
      const coordinates = this.convertGeoJsonToLatLng(geometrySource);
      if (coordinates?.length) {
        const temporaryPolygonId = this.drawTemporaryPolygon(
          coordinates,
          item.name
        );
        this.mapFeatureIdByItemKey.set(itemKey, temporaryPolygonId);
        this.changeDetector.markForCheck();
        return;
      }
    } catch (error) {
      console.error('Error viewing selected item:', error);
    } finally {
      this.spinner.hide();
    }
  }

  removeSelectedItem(item: SearchItem) {
    const itemKey = this.getItemKey(item);
    const mapFeatureId = this.mapFeatureIdByItemKey.get(itemKey);

    if (mapFeatureId != null) {
      this.genericMapService.removeFeatureById(this.map, mapFeatureId);

      this.mapFeatureIdByItemKey.delete(itemKey);
    } else {
      (this.mapDrawingService as any)?.completelyRemoveExplorePolygon?.();
    }
    const index = this.selectedItems.findIndex((selected) =>
      this.areItemsEquivalent(selected, item)
    );
    if (index >= 0) this.selectedItems.splice(index, 1);

    this.changeDetector.markForCheck();
  }

  onSaveLocationCriteria() {
    if (!this.selectedItems.length) {
      return;
    }

    const csvRows = this.selectedItems.map((item) => {
      const rawData = item.raw ?? {};
      const isNeighborhood = item.type === 'neighborhood';
      return {
        Id: isNeighborhood ? item.id ?? null : null,
        NeighborhoodName: isNeighborhood
          ? item.name ?? rawData?.Name ?? null
          : null,
        CityName:
          item.city ??
          rawData?.City ??
          (item.type === 'city' ? item.name : null),
        StateCode: item.state ?? item.code ?? rawData?.StateCode ?? null,
        StateName: rawData?.StateName ?? null,
      };
    });

    const csvHeader =
      'Location Criteria\nId,NeighborhoodName,CityName,StateCode,StateName\n';
    const csvBody =
      csvRows
        .map((row) =>
          [
            row.Id ?? 'null',
            row.NeighborhoodName ?? 'null',
            row.CityName ?? 'null',
            row.StateCode ?? 'null',
            row.StateName ?? 'null',
          ].join(', ')
        )
        .join('\n') + '\n';

    this.placesService
      .sendmessages({ Chat: csvHeader + csvBody, NeedToSaveIt: true })
      .subscribe();
  }

  private areItemsEquivalent(itemA: SearchItem, itemB: SearchItem): boolean {
    if (itemA.type !== itemB.type) return false;
    if (itemA.id != null || itemB.id != null) return itemA.id === itemB.id;
    return (
      (itemA.name ?? '').toLowerCase() === (itemB.name ?? '').toLowerCase()
    );
  }

  private getItemKey(item: SearchItem): string {
    return `${item.type}:${item.id ?? item.name.toLowerCase()}`;
  }

  private fetchAutocompleteResults(term: string): Observable<SearchItem[]> {
    const body = {
      Name: 'AutoComplePolygonCityState',
      Params: { input: term },
    };
    return this.placesService.BetaGenericAPI(body).pipe(
      map((response: any) => {
        const list = Array.isArray(response?.json)
          ? response.json
          : Array.isArray(response)
          ? response
          : [];
        return (list as any[])
          .map((record) => this.normalizeApiResponse(record))
          .filter(Boolean) as SearchItem[];
      })
    );
  }

  private normalizeApiResponse(record: any): SearchItem | null {
    if (record?.Id != null) {
      // Neighborhood type
      const name = String(record.Name ?? '').trim();
      const city = String(record.City ?? '').trim();
      const state = String(record.StateCode ?? record.StateName ?? '').trim();
      return {
        type: 'neighborhood',
        id: Number(record.Id),
        name: [name, city && `— ${city}`, state && `, ${state}`]
          .filter(Boolean)
          .join(''),
        city: city || undefined,
        state: state || undefined,
        raw: record,
      };
    }
    if (record?.City != null) {
      // City type
      const city = String(record.City ?? '').trim();
      const state = String(record.StateCode ?? record.StateName ?? '').trim();
      return {
        type: 'city',
        name: state ? `${city}, ${state}` : city,
        city,
        state: state || undefined,
        raw: record,
      };
    }
    if (record?.StateName != null || record?.StateCode != null) {
      // State type
      const stateName = String(
        record.StateName ?? record.StateCode ?? ''
      ).trim();
      const code = String(record.StateCode ?? '').trim();
      return {
        type: 'state',
        name: code ? `${stateName} (${code})` : stateName,
        code: code || undefined,
        raw: record,
      };
    }
    if (record?.name || record?.Name) {
      // Fallback for any other potential type
      return {
        type: 'neighborhood',
        name: String(record?.name ?? record?.Name ?? '').trim(),
        raw: record,
      };
    }
    return null;
  }

  private convertGeoJsonToLatLng(
    geoJson: any
  ): google.maps.LatLngLiteral[] | null {
    if (!geoJson) return null;

    const geoObject =
      typeof geoJson === 'string' ? this.safelyParseJson(geoJson) : geoJson;
    const feature = geoObject?.type === 'Feature' ? geoObject : null;
    const geometry = feature?.geometry ?? geoObject?.geometry ?? geoObject;

    const coordinates: any = geometry?.coordinates;
    const geometryType: string = geometry?.type;

    if (!coordinates || !geometryType) return null;

    const ring =
      geometryType === 'Polygon'
        ? coordinates[0]
        : geometryType === 'MultiPolygon'
        ? coordinates[0]?.[0] // Use the first ring of the first polygon
        : null;

    if (!Array.isArray(ring)) return null;

    return ring.map((point: number[]) => ({
      lat: Number(point[1]),
      lng: Number(point[0]),
    }));
  }

  private safelyParseJson<T = any>(text: string): T | null {
    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }

  private drawTemporaryPolygon(
    coordinates: google.maps.LatLngLiteral[],
    label?: string
  ): string {
    const temporaryId = `ephemeral:${Date.now()}`;
    (this.mapDrawingService as any).insertExplorePolygonToMyPolygons?.(
      this.map,
      Date.now(),
      coordinates,
      label ?? ''
    );
    this.mapDrawingService.updateMapZoom(this.map, coordinates);
    return temporaryId;
  }
}
