import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { PlacesService } from './places.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BuyboxCategory } from 'src/app/shared/models/buyboxCategory';
import { Center } from 'src/app/shared/models/shoppingCenters';
import { BbPlace } from 'src/app/shared/models/buyboxPlaces';

declare const google: any;
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ViewManagerService {
  // Data streams
  private _shoppingCenters = new BehaviorSubject<Center[]>([]);
  private _filteredCenters = new BehaviorSubject<Center[]>([]);
  private _allShoppingCenters = new BehaviorSubject<Center[]>([]); // Store all shopping centers
  private _kanbanStages = new BehaviorSubject<any[]>([]);
  private _lastBuyboxId: number | null = null;
  private _lastOrgId: number | null = null;

  // Search query
  private _searchQuery = new BehaviorSubject<string>('');

  // Selected items
  private _selectedStageId = new BehaviorSubject<number>(0); // Default to 0 (All)

  public selectedStageId$ = this._selectedStageId.asObservable();
  public kanbanStages$ = this._kanbanStages.asObservable();
  public selectedStageName$ = combineLatest([
    this.selectedStageId$,
    this.kanbanStages$,
  ]).pipe(
    map(([id, stages]) => {
      if (id === 0) return 'All';
      const s = stages.find((s) => s.id === id);
      return s?.stageName ?? 'Stage';
    })
  );

  // Current view
  private _currentView = new BehaviorSubject<number>(5); // Default to social view

 
  // Add stage update subject for communication between components
  private stageUpdateSubject = new Subject<void>();
  public stageUpdate$ = this.stageUpdateSubject.asObservable();

  // Public observables
  public shoppingCenters$ = this._shoppingCenters.asObservable();
  public filteredCenters$ = this._filteredCenters.asObservable();
  public allShoppingCenters$ = this._allShoppingCenters.asObservable();
  public searchQuery$ = this._searchQuery.asObservable();
  public currentView$ = this._currentView.asObservable();
 
  // Cache for optimizations
  private categoryNameCache = new Map<number, string>();
  private unitSizeCache = new Map<string, string>();

  StageId = 0;

  private sortOptionSubject = new BehaviorSubject<number>(1);
  sortOption$ = this.sortOptionSubject.asObservable();

  // Store current filter values for proper filtering
  private currentSearchQuery = '';
  private currentSelectedStageId = 0;
  private currentSortOption = 0;
  private streetViewLastRequestTime = 0;
  private readonly STREET_VIEW_MIN_DELAY = 5000; // 1 second between requests
  private activeStreetViews: { [key: string]: google.maps.StreetViewPanorama } =
    {};
  private streetViewCache: { [key: string]: any } = {};
  private _loadingComplete = new BehaviorSubject<boolean>(false);
  public loadingComplete$ = this._loadingComplete.asObservable();
  
  private _dataLoadedEvent = new Subject<void>();
  public dataLoadedEvent$ = this._dataLoadedEvent.asObservable();
  
 

  constructor(
    private placesService: PlacesService,
    private sanitizer: DomSanitizer
  ) {}

  /**
   * Initialize all data for the shopping center views
   * This should be called once when the main component loads
   */
  public initializeData(campaignId: number, orgId: number): void {
    if (this._lastBuyboxId === campaignId && this._lastOrgId === orgId) {
      return;
    }
  
    this._lastBuyboxId = campaignId;
    this._lastOrgId = orgId;
  
    this.categoryNameCache.clear();
    this.unitSizeCache.clear();
  
    this._loadingComplete.next(false); // reset loading state
  
    const promises = [this.loadShoppingCenters(campaignId)];
  
    Promise.all(promises)
      .then(() => {
        const centers = this._shoppingCenters.getValue();
        if (centers && centers.length > 0) {
          this.loadKanbanStages(centers[0].kanbanId);
        }
  
        this._loadingComplete.next(true); // ✅ mark as done
        this._dataLoadedEvent.next();     // ✅ emit event
      })
      .catch((error) => {
        console.error('Error loading data:', error);
        this._loadingComplete.next(false);
      });
  }
  

  /**
   * Set the current view
   */
  public setCurrentView(viewId: number): void {
    this._currentView.next(viewId);
    localStorage.setItem('currentViewDashBord', viewId.toString());
  }

  /**
   * Get the current view
   */
  public getCurrentView(): number {
    return this._currentView.getValue();
  }

  /**
   * Filter centers based on search query and stage ID
   */
  public filterCenters(query: string): void {
    this.currentSearchQuery = query;
    this._searchQuery.next(query);
    this.applyFilters();
  }

  /**
   * Set selected stage ID and filter centers
   */
  public setSelectedStageId(stageId: number): void {
    this.currentSelectedStageId = stageId;
    this._selectedStageId.next(stageId);
    this.applyFilters();
    // Store in localStorage to persist across page refreshes
    localStorage.setItem('selectedStageId', stageId.toString());
  }

  /**
   * Apply all filters (search query, stage ID, and sorting)
   */
  private applyFilters(): void {
    const allCenters = this._allShoppingCenters.getValue();

    let filtered = [...allCenters];

    // Apply stage filter if not "All" (0)
    if (this.currentSelectedStageId !== 0) {
      filtered = filtered.filter((center) => {
        const matches =
          center.kanbanTemplateStageId === this.currentSelectedStageId ||
          center.kanbanStageId === this.currentSelectedStageId;

        return matches;
      });
    }

    // Apply search filter
    if (this.currentSearchQuery && this.currentSearchQuery.trim()) {
      const query = this.currentSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (center) =>
          center.CenterName?.toLowerCase().includes(query) ||
          center.CenterAddress?.toLowerCase().includes(query) ||
          center.CenterCity?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (this.currentSortOption !== 0 && this.currentSortOption !== 3) {
      filtered = this.applySorting(filtered, this.currentSortOption);
    }
    this._filteredCenters.next(filtered);
    this._shoppingCenters.next(filtered);
  }

  /**
   * Apply sorting to centers
   */
  private applySorting(centers: Center[], sortOption: number): Center[] {
    const sortedCenters = [...centers];

    switch (sortOption) {
      case 1: // Name (A-Z)
        return sortedCenters.sort((a, b) =>
          (a.CenterName || '').localeCompare(b.CenterName || '')
        );
      case 2: // Name (Z-A)
        return sortedCenters.sort((a, b) =>
          (b.CenterName || '').localeCompare(a.CenterName || '')
        );
      default:
        return sortedCenters;
    }
  }

  /**
   * Get stage name for the selected ID
   */
  public getSelectedStageName(stageId: number): string {
    const stages = this._kanbanStages.getValue();
    if (!stages) return 'Select Stage';

    const stage = stages.find((s) => s.id === stageId);
    return stage ? stage.stageName : 'Select Stage';
  }

  /**
   * Update place kanban stage - Fixed version
   */
  public updatePlaceKanbanStage(
    marketSurveyId: number,
    stageId: number,
    shoppingCenter: any,
    campaignId: number
  ): void {
    const body: any = {
      Name: 'UpdatePlaceKanbanStage',
      Params: {
        stageid: stageId,
        marketsurveyid: marketSurveyId,
      },
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        // Update local data after successful API call
        shoppingCenter.kanbanStageId = stageId;
        shoppingCenter.stageName = this.getSelectedStageName(stageId);
        shoppingCenter.kanbanTemplateStageId = stageId;

        // Update the center in the all centers list
        const allCenters = this._allShoppingCenters.getValue();
        const updatedAllCenters = allCenters.map((center) =>
          center.Id === shoppingCenter.Id
            ? {
                ...center,
                kanbanStageId: stageId,
                stageName: this.getSelectedStageName(stageId),
                kanbanTemplateStageId: stageId,
              }
            : center
        );

        this._allShoppingCenters.next(updatedAllCenters);

        const updatedCenter = updatedAllCenters.find(
          (c) => c.Id === shoppingCenter.Id
        );

        this.applyFilters();

        // Notify about stage update
        this.stageUpdateSubject.next();
      },
      error: (err) => {
        console.error('Error updating kanban stage:', err);
      },
    });
  }

  /**
   * Get current selected stage ID
   */
  public getCurrentSelectedStageId(): number {
    return this._selectedStageId.getValue();
  }

  /**
   * Initialize map
   */
  public async initializeMap(
    elementId: string,
    lat: number,
    lng: number,
    zoom = 14
  ): Promise<any> {
    if (!lat || !lng) {
      return null;
    }

    try {
      const { Map } = (await google.maps.importLibrary('maps')) as any;
      const mapDiv = document.getElementById(elementId) as HTMLElement;

      if (!mapDiv) {
        return null;
      }

      const map = new Map(mapDiv, {
        center: { lat, lng },
        zoom: zoom,
      });

      // Create a new marker
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: 'Location Marker',
      });

      return map;
    } catch (error) {
      console.error('Error initializing map:', error);
      return null;
    }
  }

  /**
   * Initialize street view
   */

  public async initializeStreetView(
    elementId: string,
    lat: number,
    lng: number,
    heading = 165,
    pitch = 0
  ): Promise<any> {
    try {
      // Throttle requests
      const now = Date.now();
      const timeSinceLastRequest = now - this.streetViewLastRequestTime;

      if (timeSinceLastRequest < this.STREET_VIEW_MIN_DELAY) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.STREET_VIEW_MIN_DELAY - timeSinceLastRequest)
        );
      }

      this.streetViewLastRequestTime = Date.now();

      // Check cache
      const cacheKey = `${lat.toFixed(6)}_${lng.toFixed(6)}`;
      if (this.streetViewCache[cacheKey]) {
        return this.streetViewCache[cacheKey];
      }

      // Clean up previous instance
      if (this.activeStreetViews[elementId]) {
        this.activeStreetViews[elementId].unbind('pano_changed');
        this.activeStreetViews[elementId].setVisible(false);
        delete this.activeStreetViews[elementId];
      }

      const streetViewElement = document.getElementById(elementId);
      if (!streetViewElement) {
        throw new Error('Street View container element not found');
      }

      streetViewElement.innerHTML = '';

      const { StreetViewService, StreetViewPanorama } =
        (await google.maps.importLibrary('streetView')) as any;
      const svService = new StreetViewService();

      return new Promise((resolve) => {
        svService.getPanorama(
          {
            location: { lat, lng },
            radius: 50,
            source: google.maps.StreetViewSource.OUTDOOR,
          },
          (data: any, status: any) => {
            if (status === 'OK') {
              const panorama = new StreetViewPanorama(streetViewElement, {
                position: { lat, lng },
                pov: { heading, pitch },
                zoom: 1,
                addressControl: false,
                linksControl: false,
                panControl: false,
                enableCloseButton: false,
                showRoadLabels: false,
                disableDefaultUI: true,
              });

              this.activeStreetViews[elementId] = panorama;
              this.streetViewCache[cacheKey] = panorama;
              setTimeout(() => delete this.streetViewCache[cacheKey], 300000);
              resolve(panorama);
            } else {
              streetViewElement.innerHTML = `
            <div class="street-view-fallback">
              <i class="fa-solid fa-street-view"></i>
              <p>Street View is not available for this location</p>
            </div>
          `;
              resolve(null);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error initializing Street View:', error);
      const streetViewElement = document.getElementById(elementId);
      if (streetViewElement) {
        streetViewElement.innerHTML = `
        <div class="street-view-error">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p>Error loading Street View</p>
        </div>
      `;
      }
      return null;
    }
  }

  /**
   * Sanitize URL
   */
  public sanitizeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  public loadShoppingCenters(campaignId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const body: any = {
        Name: 'GetMarketSurveyShoppingCenters',
        Params: {
          CampaignId: campaignId,
          ShoppingCenterStageId: 0,
        },
      };
  
      this.placesService
        .GenericAPI(body)
        .pipe(take(1))
        .subscribe({
          next: (data) => {
            const centers = data.json;
  
            centers.forEach((center: any) => {
              if (center.ShoppingCenter?.Places) {
                const sizes: number[] = center.ShoppingCenter.Places.map(
                  (p: any) => p.BuildingSizeSf as number
                ).filter((s: number | null | undefined): s is number => s != null);
  
                if (sizes.length > 0) {
                  const uniqueSizes = Array.from(new Set<number>(sizes)).sort(
                    (a, b) => a - b
                  );
                  center.sizeRange =
                    uniqueSizes.length === 1
                      ? uniqueSizes[0]
                      : [uniqueSizes[0], uniqueSizes[uniqueSizes.length - 1]];
                } else {
                  center.sizeRange = null;
                }
              } else {
                center.sizeRange = null;
              }
            });
  
            this._allShoppingCenters.next(centers);
            this.applyFilters();
  
            resolve();
          },
          error: (err) => {
            reject(err);
          },
        });
    });
  }
  

  /**
   * Load kanban stages
   */
  private loadKanbanStages(kanbanId: number): void {
    const body: any = {
      Name: 'GetKanbanStages',
      Params: {
        kanbanid: kanbanId,
      },
    };

    this.placesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this._kanbanStages.next(res.json || []);
      },
      error: (err) => {
        console.error('Error loading kanban stages:', err);
      },
    });
  }

  setSortOption(sortId: number): void {
    this.currentSortOption = sortId;
    this.sortOptionSubject.next(sortId);

    // Re-apply all filters including the new sort option
    this.applyFilters();
  }
}
