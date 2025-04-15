import {
  ChangeDetectorRef,
  Component,
  HostListener,
  NgZone,
  OnInit,
  OnDestroy,
  TemplateRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BuyboxCategory } from 'src/app/shared/models/buyboxCategory';
import { Center } from '../../../../shared/models/shoppingCenters';
import { BbPlace } from 'src/app/shared/models/buyboxPlaces';
import { Polygon } from 'src/app/shared/models/polygons';
import { General } from 'src/app/shared/models/domain';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PlacesService } from 'src/app/core/services/places.service';
import { MapsService } from 'src/app/core/services/maps.service';
import { ViewManagerService } from 'src/app/core/services/view-manager.service';
import { Subscription } from 'rxjs';

declare const google: any;
@Component({
  selector: 'app-side-list-view',
  templateUrl: './side-list-view.component.html',
  styleUrls: ['./side-list-view.component.css'],
})
export class SideListViewComponent implements OnInit, OnDestroy {
  General: General = new General();
  cardsSideList: Center[] = [];
  map: any;
  BuyBoxId!: any;
  orgId!: any;
  
  mapViewOnePlacex: boolean = false;
  buyboxCategories: BuyboxCategory[] = [];
  shoppingCenters: Center[] = [];
  shoppingCenter: any;
  buyboxPlaces: BbPlace[] = [];
  savedMapView: any;
  Polygons: Polygon[] = [];
  placesRepresentative: boolean | undefined;
  selectedId: number | null = null;
  selectedIdCard: number | null = null;
  shoppingCenterIdToDelete: number | null = null;
  DeletedSC: any;
  sanitizedUrl!: any;
  shareLink: any;
  StreetViewOnePlace!: boolean;
  KanbanStages: any[] = [];
  activeDropdown: any = null;
  
  private subscriptions = new Subscription();

  constructor(
    private markerService: MapsService,
    public activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private PlacesService: PlacesService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private shoppingCenterService: ViewManagerService // Added the centralized service
  ) {}

  ngOnInit(): void {
    this.General = new General();
    this.savedMapView = localStorage.getItem('mapView');
    
    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;
      localStorage.setItem('BuyBoxId', this.BuyBoxId);
      
      // Initialize data using the centralized service
      this.shoppingCenterService.initializeData(this.BuyBoxId,this.orgId);
    });

    // Subscribe to data from the centralized service
    this.subscriptions.add(
      this.shoppingCenterService.buyboxCategories$.subscribe(categories => {
        this.buyboxCategories = categories;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.shoppingCenterService.shoppingCenters$.subscribe(centers => {
        this.shoppingCenters = centers;
        
        // Get kanban stages using the first kanban ID from the first shopping center
        if (this.shoppingCenters && this.shoppingCenters.length > 0 && !this.KanbanStages.length) {
          this.GetKanbanStages(this.shoppingCenters[0].kanbanId);
        }
        
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.shoppingCenterService.buyboxPlaces$.subscribe(places => {
        this.buyboxPlaces = places;
        
        if (this.buyboxCategories && this.buyboxPlaces) {
          this.buyboxCategories.forEach((category) => {
            category.isChecked = false;
            category.places = this.buyboxPlaces?.filter((place) =>
              place.RetailRelationCategories?.some((x) => x.Id === category.id)
            );
          });
          
          // Initialize map after we have all the data
          this.getAllMarker();
        }
        
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.shoppingCenterService.selectedId$.subscribe(id => {
        this.selectedId = id;
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.shoppingCenterService.selectedIdCard$.subscribe(id => {
        this.selectedIdCard = id;
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  GetKanbanStages(kanbanID: number): void {
    const body: any = {
      Name: 'GetKanbanStages',
      Params: {
        kanbanid: kanbanID,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        this.KanbanStages = res.json || [];
        this.cdr.detectChanges();
      }
    });
  }

  // Toggle dropdown visibility
  toggleDropdown(shoppingCenter: any): void {
    // Close any open dropdown
    if (this.activeDropdown && this.activeDropdown !== shoppingCenter) {
      this.activeDropdown.isDropdownOpen = false;
    }
    // Toggle current dropdown
    shoppingCenter.isDropdownOpen = !shoppingCenter.isDropdownOpen;
    // Set as active dropdown
    this.activeDropdown = shoppingCenter.isDropdownOpen ? shoppingCenter : null;
    // If opening this dropdown, load kanban stages if not already loaded
    if (shoppingCenter.isDropdownOpen && (!this.KanbanStages || this.KanbanStages.length === 0)) {
      this.GetKanbanStages(shoppingCenter.kanbanId);
    }
  }

  // Get stage name for the selected ID
  getSelectedStageName(stageId: number): string {
    if (!this.KanbanStages) return 'Select Stage';
    const stage = this.KanbanStages.find(s => s.id === stageId);
    return stage ? stage.stageName : 'Select Stage';
  }

  selectStage(marketSurveyId: number, stageId: number, shoppingCenter: any): void {
    // Close the dropdown
    shoppingCenter.isDropdownOpen = false;
    this.activeDropdown = null;
    this.UpdatePlaceKanbanStage(marketSurveyId, stageId, shoppingCenter);
  }

  // Update the API method to work with the new dropdown
  UpdatePlaceKanbanStage(marketSurveyId: number, stageId: number, shoppingCenter: any): void {
    const body: any = {
      Name: 'UpdatePlaceKanbanStage',
      Params: {
        stageid: stageId,
        marketsurveyid: marketSurveyId,
      },
    };
    
    this.PlacesService.GenericAPI(body).subscribe({
      next: (res: any) => {
        // Update local data after successful API call
        shoppingCenter.kanbanStageId = stageId;
        shoppingCenter.stageName = this.getSelectedStageName(stageId);
        this.cdr.detectChanges();
      }
    });
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    // Check if click is outside any dropdown
    const target = event.target as HTMLElement | null;
    if (this.activeDropdown && target && !target.closest('.custom-dropdown')) {
      this.activeDropdown.isDropdownOpen = false;
      this.activeDropdown = null;
      this.cdr.detectChanges();
    }
  }

  GetPolygons(): void {
    const body: any = {
      Name: 'PolygonStats',
      Params: {
        buyboxid: this.BuyBoxId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.Polygons = data.json;
        this.markerService.drawMultiplePolygons(this.map, this.Polygons);
      }
    });
  }

  getPolygons() {
    const body: any = {
      Name: 'GetBuyBoxSCsIntersectPolys',
      Params: {
        BuyBoxId: this.BuyBoxId,
        PolygonSourceId: 0,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe((data) => {
      this.Polygons = data.json;
      this.markerService.drawMultiplePolygons(this.map, this.Polygons);
    });
  }

  onMouseHighlight(place: any) {
    this.markerService.onMouseEnter(this.map, place);
  }

  onMouseLeaveHighlight(place: any) {
    this.markerService.onMouseLeave(this.map, place);
  }

  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true;
    if (!lat || !lng) {
      return;
    }
    const { Map } = (await google.maps.importLibrary('maps')) as any;
    const mapDiv = document.getElementById('mappopup') as HTMLElement;
    if (!mapDiv) {
      return;
    }
    const map = new Map(mapDiv, {
      center: { lat, lng },
      zoom: 14,
    });
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: 'Location Marker',
    });
  }

  async getAllMarker() {
    try {
      const { Map } = await google.maps.importLibrary('maps');
      if (this.savedMapView) {
        const { lat, lng, zoom } = JSON.parse(this.savedMapView);
        this.map = new Map(document.getElementById('map') as HTMLElement, {
          center: {
            lat: lat,
            lng: lng,
          },
          zoom: zoom,
          mapId: '1234567890',
        });
        this.map.addListener('dragend', () => this.onMapDragEnd(this.map));
        this.map.addListener('zoom_changed', () => this.onMapDragEnd(this.map));
        this.map.addListener('bounds_changed', () =>
          this.onMapDragEnd(this.map)
        );
      } else if (this.shoppingCenters && this.shoppingCenters.length > 0) {
        this.map = new Map(document.getElementById('map') as HTMLElement, {
          center: {
            lat: this.shoppingCenters[0].Latitude,
            lng: this.shoppingCenters[0].Longitude,
          },
          zoom: 8,
          mapId: '1234567890',
        });
        this.map.addListener('dragend', () => this.onMapDragEnd(this.map));
        this.map.addListener('zoom_changed', () => this.onMapDragEnd(this.map));
        this.map.addListener('bounds_changed', () =>
          this.onMapDragEnd(this.map)
        );
      }

      if (this.shoppingCenters && this.shoppingCenters.length > 0) {
        this.createMarkers(this.shoppingCenters, 'Shopping Center');
      }

      this.GetPolygons();
      this.createCustomMarkers(this.buyboxCategories);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  createCustomMarkers(markerDataArray: any[]) {
    markerDataArray.forEach((categoryData) => {
      this.markerService.createCustomMarker(this.map, categoryData);
    });
  }

  private onMapDragEnd(map: any) {
    this.saveMapView(map);
    this.updateShoppingCenterCoordinates();
    this.updateCardsSideList(map);
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

  private updateShoppingCenterCoordinates(): void {
    if (this.shoppingCenters) {
      this.shoppingCenters?.forEach((center) => {
        center.Latitude = center.Latitude;
        center.Longitude = center.Longitude;
      });
    }
  }

  createMarkers(markerDataArray: any[], type: string) {
    markerDataArray.forEach((markerData) => {
      this.markerService.createMarker(this.map, markerData, type);
    });
  }

  private updateCardsSideList(map: any): void {
    const bounds = map.getBounds();
    const visibleMarkers = this.markerService.getVisibleProspectMarkers(bounds);
    const visibleCoords = new Set(
      visibleMarkers.map((marker) => `${marker.lat},${marker.lng}`)
    );
    const allProperties = [...(this.shoppingCenters || [])];
    this.ngZone.run(() => {
      this.cardsSideList = allProperties.filter(
        (property) =>
          visibleCoords.has(`${property.Latitude},${property.Longitude}`) ||
          this.isWithinBounds(property, bounds)
      );
    });
  }

  private isWithinBounds(property: any, bounds: any): boolean {
    const lat = parseFloat(property.Latitude);
    const lng = parseFloat(property.Longitude);
    if (isNaN(lat) || isNaN(lng)) {
      return false;
    }
    return bounds?.contains({ lat, lng });
  }

  getShoppingCenterUnitSize(shoppingCenter: any): any {
    return this.shoppingCenterService.getShoppingCenterUnitSize(shoppingCenter);
  }

  getNeareastCategoryName(categoryId: number) {
    return this.shoppingCenterService.getNearestCategoryName(categoryId);
  }

  isLast(currentItem: any, array: any[]): boolean {
    return array.indexOf(currentItem) === array.length - 1;
  }

  openMapViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.viewOnMap(modalObject.Latitude, modalObject.Longitude);
  }

  openStreetViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });

    this.General.modalObject = modalObject;

    if (this.General.modalObject.StreetViewURL) {
      this.setIframeUrl(this.General.modalObject.StreetViewURL);
    } else {
      setTimeout(() => {
        this.viewOnStreet();
      }, 100);
    }
  }

  setIframeUrl(url: string): void {
    this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  viewOnStreet() {
    this.StreetViewOnePlace = true;
    const lat = +this.General.modalObject.StreetLatitude;
    const lng = +this.General.modalObject.StreetLongitude;
    const heading = this.General.modalObject.Heading || 165;
    const pitch = this.General.modalObject.Pitch || 0;

    setTimeout(() => {
      const streetViewElement = document.getElementById('street-view');
      if (streetViewElement) {
        this.initializeStreetView('street-view', lat, lng, heading, pitch);
      }
    });
  }

  initializeStreetView(
    elementId: string,
    lat: number,
    lng: number,
    heading: number = 165,
    pitch: number = 0
  ): any {
    return this.shoppingCenterService.initializeStreetView(
      elementId,
      lat,
      lng,
      heading,
      pitch
    );
  }

  addMarkerToStreetView(panorama: any, lat: number, lng: number): void {
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

  sanitizeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  copyLink(link: string) {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        // Success
      })
      .catch((err) => {
        // Error
        console.error('Could not copy text: ', err);
      });
  }

  openDeleteShoppingCenterModal(
    modalTemplate: TemplateRef<any>,
    shoppingCenter: any
  ) {
    this.DeletedSC = shoppingCenter;
    this.shoppingCenterIdToDelete = shoppingCenter.Id;
    this.modalService.open(modalTemplate, {
      ariaLabelledBy: 'modal-basic-title',
    });
  }

  deleteShCenter() {
    this.shoppingCenterService.deleteShoppingCenter(
      this.BuyBoxId,
      this.shoppingCenterIdToDelete!
    ).then(() => {
      this.modalService.dismissAll();
      this.ngZone.run(() => {
        this.cardsSideList = this.cardsSideList.filter(
          (place) => place.Id !== this.shoppingCenterIdToDelete
        );
      });
    });
  }

  RestoreShoppingCenter(
    MarketSurveyId: any,
    Deleted: boolean,
    placeId: number
  ) {
    this.shoppingCenterService.restoreShoppingCenter(MarketSurveyId, Deleted)
      .then(() => {
        this.toggleShortcuts(placeId, 'close');
      });
  }

  outsideClickHandler = (event: Event): void => {
    const targetElement = event.target as HTMLElement;
    const isInside = targetElement.closest(
      '.shortcuts_iconCard, .ellipsis_icont'
    );

    if (!isInside) {
      this.selectedIdCard = null;
      document.removeEventListener('click', this.outsideClickHandler);
    }
  };

  toggleShortcutsCard(id: number | null, event?: MouseEvent): void {
    event?.stopPropagation();

    if (this.selectedIdCard === id) {
      this.selectedIdCard = null;
      document.removeEventListener('click', this.outsideClickHandler);
    } else {
      this.selectedIdCard = id;
      setTimeout(() => {
        document.addEventListener('click', this.outsideClickHandler);
      });
    }
  }

  toggleShortcuts(id: number, close?: string, event?: MouseEvent): void {
    this.shoppingCenterService.toggleShortcuts(id, close, event);
  }

  trackById(index: number, place: any): number {
    return place.Id;
  }
}