import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  Subject,
  defer,
  from,
  Subscription,
  timer,
} from 'rxjs';
import { map, delayWhen, repeatWhen, takeUntil } from 'rxjs/operators';
import { PlacesService } from './places.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BuyboxCategory } from 'src/app/shared/models/buyboxCategory';
import { Center } from 'src/app/shared/models/shoppingCenters';
import { BbPlace } from 'src/app/shared/models/buyboxPlaces';
import { ShareOrg } from 'src/app/shared/models/shareOrg';

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
  private _buyboxCategories = new BehaviorSubject<BuyboxCategory[]>([]);
  private _buyboxPlaces = new BehaviorSubject<BbPlace[]>([]);
  private _shareOrg = new BehaviorSubject<ShareOrg[]>([]);
  private _kanbanStages = new BehaviorSubject<any[]>([]);
  private _lastBuyboxId: number | null = null;
  private _lastOrgId: number | null = null;

  // Loading state
  private _isLoading = new BehaviorSubject<boolean>(false);

  // Search query
  private _searchQuery = new BehaviorSubject<string>('');

  // Selected items
  private _selectedIdCard = new BehaviorSubject<number | null>(null);
  private _selectedId = new BehaviorSubject<number | null>(null);
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

  // Data loaded flag
  private _dataLoaded = false;

  // Event emitters
  private _dataLoadedEvent = new Subject<void>();

  // Add stage update subject for communication between components
  private stageUpdateSubject = new Subject<void>();
  public stageUpdate$ = this.stageUpdateSubject.asObservable();

  // Public observables
  public shoppingCenters$ = this._shoppingCenters.asObservable();
  public filteredCenters$ = this._filteredCenters.asObservable();
  public allShoppingCenters$ = this._allShoppingCenters.asObservable();
  public buyboxCategories$ = this._buyboxCategories.asObservable();
  public buyboxPlaces$ = this._buyboxPlaces.asObservable();
  public shareOrg$ = this._shareOrg.asObservable();
  public isLoading$ = this._isLoading.asObservable();
  public searchQuery$ = this._searchQuery.asObservable();
  public selectedIdCard$ = this._selectedIdCard.asObservable();
  public selectedId$ = this._selectedId.asObservable();
  public currentView$ = this._currentView.asObservable();
  public dataLoadedEvent$ = this._dataLoadedEvent.asObservable();

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
  private shoppingCenterInterval: any;

  private reloadShoppingCentersSubject = new BehaviorSubject<boolean>(false);
  reloadShoppingCenters$ = this.reloadShoppingCentersSubject.asObservable();
  private shoppingCentersPollingSub?: Subscription;
  private stopPolling$ = new Subject<void>();

  constructor(
    private placesService: PlacesService,
    private sanitizer: DomSanitizer
  ) {}

  /**
   * Initialize all data for the shopping center views
   * This should be called once when the main component loads
   */
  public initializeData(campaignId: number, orgId: number): void {
    if (
      this._dataLoaded &&
      this._lastBuyboxId === campaignId &&
      this._lastOrgId === orgId
    ) {
      this._dataLoadedEvent.next();
      return;
    }

    this._lastBuyboxId = campaignId;
    this._lastOrgId = orgId;
    this._dataLoaded = false;

    this.categoryNameCache.clear();
    this.unitSizeCache.clear();

    this._isLoading.next(true);

    // Load all required data in parallel
    const promises = [
      this.loadShoppingCenters(campaignId),
      //this.loadBuyBoxCategories(campaignId),
      //this.loadOrganizationById(orgId),
      // this.loadBuyBoxPlaces(campaignId),
    ];

    Promise.all(promises)
      .then(() => {
        this._dataLoaded = true;
        this._dataLoadedEvent.next();

        // Start polling (waits 20s after each finished request)
        if (this._lastBuyboxId != null) {
          // this.startShoppingCentersPolling(this._lastBuyboxId);
        }

        const centers = this._shoppingCenters.getValue();
        if (centers && centers.length > 0) {
          this.loadKanbanStages(centers[0].kanbanId);
        }
      })
      .catch((error) => {
        console.error('Error loading data:', error);
      })
      .finally(() => {
        this._isLoading.next(false);
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
   * Get nearest category name
   */
  public getNearestCategoryName(categoryId: number): string {
    // Check cache first
    if (this.categoryNameCache.has(categoryId)) {
      return this.categoryNameCache.get(categoryId)!;
    }

    const categories = this._buyboxCategories.getValue();
    const matchedCategories = categories.filter((x) => x.id === categoryId);
    const result = matchedCategories[0]?.name || '';

    // Cache the result
    this.categoryNameCache.set(categoryId, result);
    return result;
  }

  /**
   * Get shopping center unit size
   */
  public getShoppingCenterUnitSize(shoppingCenter: any): string {
    const key = `${shoppingCenter.Id}`;
    if (this.unitSizeCache.has(key)) {
      return this.unitSizeCache.get(key)!;
    }

    const formatNumberWithCommas = (number: number) => {
      return number.toLocaleString();
    };

    const formatLeasePrice = (price: any) => {
      if (price === 0 || price === 'On Request') return 'On Request';
      const priceNumber = Number.parseFloat(price);
      return !isNaN(priceNumber) ? Math.floor(priceNumber) : price;
    };

    const appendInfoIcon = (calculatedPrice: string, originalPrice: any) => {
      if (calculatedPrice === 'On Request') {
        return calculatedPrice;
      }

      const formattedOriginalPrice = `$${Number.parseFloat(
        originalPrice
      ).toLocaleString()}/sq ft./year`;

      return `
        <div style="display:inline-block; text-align:left; line-height:1.2;">
        </div>
      `;
    };

    const places = shoppingCenter?.ShoppingCenter?.Places || [];
    const buildingSizes = places
      .map((place: any) => place.BuildingSizeSf)
      .filter(
        (size: any) => size !== undefined && size !== null && !isNaN(size)
      );

    let result = '';

    if (buildingSizes.length === 0) {
      const singleSize = shoppingCenter.BuildingSizeSf;
      if (singleSize) {
        const leasePrice = formatLeasePrice(shoppingCenter.ForLeasePrice);
        const resultPrice =
          leasePrice && leasePrice !== 'On Request'
            ? appendInfoIcon(
                `$${formatNumberWithCommas(
                  Math.floor((Number.parseFloat(leasePrice) * singleSize) / 12)
                )}/month`,
                shoppingCenter.ForLeasePrice
              )
            : 'On Request';
        result = `Unit Size: ${formatNumberWithCommas(
          singleSize
        )} sq ft.<br>Lease price: ${resultPrice}`;
      }
    } else {
      const minSize = Math.min(...buildingSizes);
      const maxSize = Math.max(...buildingSizes);
      const minPrice =
        places.find((place: any) => place.BuildingSizeSf === minSize)
          ?.ForLeasePrice || 'On Request';
      const maxPrice =
        places.find((place: any) => place.BuildingSizeSf === maxSize)
          ?.ForLeasePrice || 'On Request';

      const sizeRange =
        minSize === maxSize
          ? `${formatNumberWithCommas(minSize)} sq ft.`
          : `${formatNumberWithCommas(
              minSize
            )} sq ft. - ${formatNumberWithCommas(maxSize)} sq ft.`;

      const formattedMinPrice =
        minPrice === 'On Request'
          ? 'On Request'
          : appendInfoIcon(
              `$${formatNumberWithCommas(
                Math.floor((Number.parseFloat(minPrice) * minSize) / 12)
              )}/month`,
              minPrice
            );

      const formattedMaxPrice =
        maxPrice === 'On Request'
          ? 'On Request'
          : appendInfoIcon(
              `$${formatNumberWithCommas(
                Math.floor((Number.parseFloat(maxPrice) * maxSize) / 12)
              )}/month`,
              maxPrice
            );

      let leasePriceRange;

      if (
        formattedMinPrice === 'On Request' &&
        formattedMaxPrice === 'On Request'
      ) {
        leasePriceRange = 'On Request';
      } else if (formattedMinPrice === 'On Request') {
        leasePriceRange = formattedMaxPrice;
      } else if (formattedMaxPrice === 'On Request') {
        leasePriceRange = formattedMinPrice;
      } else if (formattedMinPrice === formattedMaxPrice) {
        leasePriceRange = formattedMinPrice;
      } else {
        leasePriceRange = `${formattedMinPrice} - ${formattedMaxPrice}`;
      }

      result = `Unit Size: ${sizeRange} ${leasePriceRange}`;
    }

    const extrasList = places
      .map((place: any) => place.Extras)
      .filter((extra: any) => extra && extra.trim() !== '');

    if (extrasList.length > 0) {
      const uniqueExtras = [...new Set(extrasList)];
    }

    const leaseType = places
      .map((place: any) => place.LeaseType)
      .filter((type: any) => type && type.trim() !== '');

    if (leaseType.length > 0) {
      const uniqueLeaseTypes = [...new Set(leaseType)];
    }

    const type = places
      .map((place: any) => place.Type)
      .filter((type: any) => type && type.trim() !== '');

    if (type.length > 0) {
      const uniqueTypes = [...new Set(type)];
    }

    // Cache the result
    this.unitSizeCache.set(key, result);
    return result;
  }

  /**
   * Toggle dropdown for kanban stages
   */
  public toggleDropdown(shoppingCenter: any, activeDropdown: any): any {
    // Close any open dropdown
    if (activeDropdown && activeDropdown !== shoppingCenter) {
      activeDropdown.isDropdownOpen = false;
    }

    // Toggle current dropdown
    shoppingCenter.isDropdownOpen = !shoppingCenter.isDropdownOpen;

    // Set as active dropdown
    const newActiveDropdown = shoppingCenter.isDropdownOpen
      ? shoppingCenter
      : null;

    // If opening this dropdown, load kanban stages if not already loaded
    if (shoppingCenter.isDropdownOpen) {
      const stages = this._kanbanStages.getValue();
      if (!stages || stages.length === 0) {
        this.loadKanbanStages(shoppingCenter.kanbanId);
      }
    }

    return newActiveDropdown;
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

    this._isLoading.next(true);

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
      complete: () => {
        this._isLoading.next(false);
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
   * Get current loading state
   */
  public getCurrentLoadingState(): boolean {
    return this._isLoading.getValue();
  }

  /**
   * Delete shopping center
   */
  public deleteShoppingCenter(
    buyBoxId: number,
    shoppingCenterId: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this._isLoading.next(true);

      const body: any = {
        Name: 'DeleteShoppingCenterFromBuyBox',
        MainEntity: null,
        Params: {
          BuyBoxId: buyBoxId,
          ShoppingCenterId: shoppingCenterId,
        },
        Json: null,
      };

      this.placesService.GenericAPI(body).subscribe({
        next: (data) => {
          // Update all centers
          const allCenters = this._allShoppingCenters.getValue();
          const updatedAllCenters = allCenters.map((center) =>
            center.Id === shoppingCenterId
              ? { ...center, Deleted: true }
              : center
          );

          this._allShoppingCenters.next(updatedAllCenters);

          // Re-apply filters
          this.applyFilters();

          resolve(data);
        },
        error: (err) => {
          console.error('Error deleting shopping center:', err);
          reject(err);
        },
        complete: () => {
          this._isLoading.next(false);
        },
      });
    });
  }

  /**
   * Restore shopping center
   */
  public restoreShoppingCenter(
    marketSurveyId: number,
    deleted: boolean
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this._isLoading.next(true);

      deleted = false;

      const body: any = {
        Name: 'RestoreShoppingCenter',
        MainEntity: null,
        Params: {
          marketsurveyid: marketSurveyId,
        },
        Json: null,
      };

      this.placesService.GenericAPI(body).subscribe({
        next: (data) => {
          // Update all centers
          const allCenters = this._allShoppingCenters.getValue();
          const updatedAllCenters = allCenters.map((center) =>
            Number(center.MarketSurveyId) === marketSurveyId
              ? { ...center, Deleted: false }
              : center
          );

          this._allShoppingCenters.next(updatedAllCenters);

          // Re-apply filters
          this.applyFilters();

          resolve(data);
        },
        error: (err) => {
          console.error('Error restoring shopping center:', err);
          reject(err);
        },
        complete: () => {
          this._isLoading.next(false);
        },
      });
    });
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
  private streetViewLastRequestTime = 0;
  private readonly STREET_VIEW_MIN_DELAY = 5000; // 1 second between requests
  private activeStreetViews: { [key: string]: google.maps.StreetViewPanorama } =
    {};
  private streetViewCache: { [key: string]: any } = {};

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

              this.addMarkerToStreetView(panorama, lat, lng);
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
   * Add marker to street view
   */
  private addMarkerToStreetView(panorama: any, lat: number, lng: number): void {
    const svgPath =
      'M-1.547 12l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM0 0q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z';

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: panorama,
      icon: {
        path: svgPath,
        scale: 4,
        fillColor: 'black',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 1,
      },
    });
  }

  /**
   * Sanitize URL
   */
  public sanitizeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /**
   * Check if item is last in array
   */
  public isLast(currentItem: any, array: any[]): boolean {
    return array.indexOf(currentItem) === array.length - 1;
  }

  /**
   * Set selected ID card
   */
  public setSelectedIdCard(id: number | null): void {
    this._selectedIdCard.next(id);
  }

  /**
   * Set selected ID
   */
  public setSelectedId(id: number | null): void {
    this._selectedId.next(id);
  }

  /**
   * Toggle shortcuts
   */
  toggleShortcuts(id: number, close?: string, event?: MouseEvent): void {
    if (close === 'close') {
      this.setSelectedIdCard(null);
      this.setSelectedId(null);
      return;
    }

    // Position the shortcuts menu if we have an event
    if (event) {
      const targetElement = event.target as HTMLElement;
      const rect = targetElement?.getBoundingClientRect();

      // Find the shortcuts_icon element in the DOM
      setTimeout(() => {
        const shortcutsIcon = document.querySelector(
          '.shortcuts_icon'
        ) as HTMLElement;
        if (shortcutsIcon && rect) {
          shortcutsIcon.style.top = `${
            rect.top + window.scrollY + targetElement.offsetHeight
          }px`;
          shortcutsIcon.style.left = `${rect.left + window.scrollX}px`;
        }
      }, 0);
    }

    // Toggle the selected ID
    const currentSelectedIdCard = this._selectedIdCard.getValue();
    const currentSelectedId = this._selectedId.getValue();

    // Also update the card ID
    this.setSelectedIdCard(currentSelectedIdCard === id ? null : id);
    this.setSelectedId(currentSelectedId === id ? null : id);
  }

  // Private methods for data loading

  /**
   * Load shopping centers
   */
  // private startShoppingCentersPolling(campaignId: number): void {
  //   // stop any previous polling
  //   this.stopShoppingCentersPolling();

  //   this.shoppingCentersPollingSub = defer(() =>
  //     from(this.loadShoppingCenters(campaignId))
  //   )
  //     .pipe(
  //       // after each successful completion, wait 20s, then resubscribe
  //       repeatWhen((completed$) =>
  //         completed$.pipe(delayWhen(() => timer(20000)))
  //       ),
  //       // allow external stop
  //       takeUntil(this.stopPolling$)
  //     )
  //     .subscribe({
  //       error: (err) => console.error('Polling error:', err),
  //     });
  // }

  // private stopShoppingCentersPolling(): void {
  //   this.stopPolling$.next();
  //   this.shoppingCentersPollingSub?.unsubscribe();
  //   this.shoppingCentersPollingSub = undefined;
  // }

  public loadShoppingCenters(campaignId: number) {
    
    console.log('Loading shopping centers for campaign:', campaignId);

    const body: any = {
      Name: 'GetMarketSurveyShoppingCenters',
      Params: {
        CampaignId: campaignId,
        ShoppingCenterStageId: 0,
      },
    };

    this.placesService.GenericAPI(body).pipe(take(1)).subscribe({
      next: (data) => {
        const centers = data.json;

        centers.forEach((center: any) => {
          if (center.ShoppingCenter?.Places) {
            const sizes: number[] = center.ShoppingCenter.Places
              .map((p: any) => p.BuildingSizeSf as number)
              .filter((s: number | null | undefined): s is number => s != null);

            if (sizes.length > 0) {
              const uniqueSizes = Array.from(new Set<number>(sizes)).sort((a, b) => a - b);
              center.sizeRange = uniqueSizes.length === 1
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
      },
    });

}

  /**
   * Load buybox categories
   */
  private loadBuyBoxCategories(campaignId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const body: any = {
        Name: 'GetRetailRelationCategories',
        Params: {
          CampaignId: campaignId,
        },
      };

      this.placesService.GenericAPI(body).subscribe({
        next: (data) => {
          const categories = data.json;
          this._buyboxCategories.next(categories);
          resolve();
        },
        error: (err) => {
          console.error('Error loading buybox categories:', err);
          reject(err);
        },
      });
    });
  }

  /**
   * Load organization by ID
   */
  private loadOrganizationById(orgId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const body: any = {
        Name: 'GetOrganizationById',
        Params: {
          organizationid: orgId,
        },
      };

      this.placesService.GenericAPI(body).subscribe({
        next: (data) => {
          const org = data.json;
          this._shareOrg.next(org);
          resolve();
        },
        error: (err) => {
          console.error('Error loading organization:', err);
          reject(err);
        },
      });
    });
  }

  /**
   * Load buybox places
   */
  private loadBuyBoxPlaces(campaignId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const body: any = {
        Name: 'BuyBoxRelatedRetails',
        Params: {
          CampaignId: campaignId,
        },
      };

      this.placesService.GenericAPI(body).subscribe({
        next: (data) => {
          const places = data.json;
          this._buyboxPlaces.next(places);

          // Update categories with places
          const categories = this._buyboxCategories.getValue();
          categories.forEach((category) => {
            category.isChecked = false;
            category.places = places?.filter(
              (place: { RetailRelationCategories: any[] }) =>
                place.RetailRelationCategories?.some(
                  (x: { Id: number }) => x.Id === category.id
                )
            );
          });

          this._buyboxCategories.next([...categories]);
          resolve();
        },
        error: (err) => {
          console.error('Error loading buybox places:', err);
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

  /**
   * Reset data loaded flag (for testing or forced refresh)
   */
  public resetDataLoaded(): void {
    this._dataLoaded = false;
  }

  // Add a method to reset the selected stage ID to 0 (All)
  public resetSelectedStageId(): void {
    this.currentSelectedStageId = 0;
    this._selectedStageId.next(0);
    // Don't save to localStorage since we want to reset when navigating away
  }

  setSortOption(sortId: number): void {
    this.currentSortOption = sortId;
    this.sortOptionSubject.next(sortId);

    // Re-apply all filters including the new sort option
    this.applyFilters();
  }

  triggerReload() {
    this.reloadShoppingCentersSubject.next(true);
  }
}
