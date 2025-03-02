import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { StateService } from 'src/app/services/state.service';
import { MapViewComponent } from './map-view/map-view.component';

@Component({
  selector: 'app-shopping-center-table',
  templateUrl: './shopping-center-table.component.html',
  styleUrls: ['./shopping-center-table.component.css']
})
export class ShoppingCenterTableComponent implements OnInit {
  @ViewChild('mapView') mapView!: MapViewComponent;
  
  currentView: number = 5; // Default view is Social View
  BuyBoxId!: any;
  OrgId!: any;
  selectedOption: number = 5;
  
  dropdowmOptions: any = [
    {
      text: 'Map',
      icon: '../../../assets/Images/Icons/map.png',
      status: 1,
    },
    {
      text: 'Side',
      icon: '../../../assets/Images/Icons/element-3.png',
      status: 2,
    },
    {
      text: 'Cards',
      icon: '../../../assets/Images/Icons/grid-1.png',
      status: 3,
    },
    {
      text: 'Table',
      icon: '../../../assets/Images/Icons/grid-4.png',
      status: 4,
    },
    {
      text: 'Social',
      icon: '../../../assets/Images/Icons/globe-solid.svg',
      status: 5,
    },
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private placesService: PlacesService,
    private spinner: NgxSpinnerService,
    private stateService: StateService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;
      this.OrgId = params.orgId;
      localStorage.setItem('BuyBoxId', this.BuyBoxId);
      localStorage.setItem('OrgId', this.OrgId);
    });

<<<<<<< HEAD
    this.currentView = Number(localStorage.getItem('currentViewDashBord') || '5');
    this.selectedOption = this.currentView;
=======
    this.currentView = localStorage.getItem('currentViewDashBord') || '5';
    this.BuyBoxPlacesCategories(this.BuyBoxId);
    this.GetOrganizationById(this.OrgId);
    this.getShoppingCenters(this.BuyBoxId);
    this.getBuyBoxPlaces(this.BuyBoxId);

    const selectedOption = this.dropdowmOptions.find(
      (option: any) => option.status === Number.parseInt(this.currentView)
    );

    if (selectedOption) {
      this.selectedOption = selectedOption.status;
    }
    this.activeComponent = 'Properties';
    this.selectedTab = 'Properties';
  }
  hideAllComments(): void {
    for (const key in this.showComments) {
      this.showComments[key] = false;
    }
  }
  toggleShoppingCenters() {
    this.showShoppingCenters = !this.showShoppingCenters;
  }

  toggleStandalone() {
    this.showStandalone = !this.showStandalone;
  }

  deleteShopping(placeId: number) {
    const index = this.showbackIds.indexOf(placeId);
    if (index === -1) {
      this.showbackIds.push(placeId);
    } else {
      this.showbackIds.splice(index, 1);
    }
    this.selectedIdCard = null;
  }

  ArrOfDelete(modalTemplate: TemplateRef<any>) {
    this.showbackIdsJoin = this.showbackIds.join(',');
    this.openDeleteShoppingCenterModal(modalTemplate, this.showbackIdsJoin);
  }

  CancelDelete() {
    this.showbackIds = [];
  }

  CancelOneDelete(id: number) {
    const index = this.showbackIds.indexOf(id);
    if (index !== -1) {
      this.showbackIds.splice(index, 1);
    }
  }

  toggleShortcutsCard(id: number | null, close?: string): void {
    // if (close === 'close') {
    //   this.selectedIdCard = null;
    // } else {
    //   this.selectedIdCard = this.selectedIdCard === id ? null : id;
    // }
    this.selectedIdCard=id;
  }

  toggleShortcuts(id: number, close?: string, event?: MouseEvent): void {
    if (close === 'close') {
      this.selectedId = null;
      this.selectedIdCard = null;
      return;
    }

    const targetElement = event?.target as HTMLElement;
    const rect = targetElement.getBoundingClientRect();

    const shortcutsIcon = document.querySelector(
      '.shortcuts_icon'
    ) as HTMLElement;

    if (shortcutsIcon) {
      shortcutsIcon.style.top = `${
        rect.top + window.scrollY + targetElement.offsetHeight
      }px`;
      shortcutsIcon.style.left = `${rect.left + window.scrollX}px`;
    }

    this.selectedId = this.selectedId === id ? null : id;
  }

  @Output() tabChange = new EventEmitter<{
    tabId: string;
    shoppingCenterId: number;
  }>();

  // redirect(organizationId: any) {
  //   this.tabChange.emit({ tabId: 'Emily', shoppingCenterId: organizationId });
  // }

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
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  BuyBoxPlacesCategories(buyboxId: number): void {
    if (this.stateService.getBuyboxCategories().length > 0) {
      this.buyboxCategories = this.stateService.getBuyboxCategories();
      this.getShoppingCenters(buyboxId);
      return;
    }

    const body: any = {
      Name: 'GetRetailRelationCategories',
      Params: {
        BuyBoxId: buyboxId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.buyboxCategories = data.json;
        this.stateService.setBuyboxCategories(data.json);
        this.getShoppingCenters(this.BuyBoxId);
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  getShoppingCenters(buyboxId: number): void {
    if (this.stateService.getShoppingCenters()?.length > 0) {
      this.shoppingCenters = this.stateService.getShoppingCenters();
      return;
    }

    this.spinner.show();
    const body: any = {
      Name: 'GetMarketSurveyShoppingCenters',
      Params: {
        BuyBoxId: buyboxId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.shoppingCenters = data.json;
        this.stateService.setShoppingCenters(data.json);
        this.spinner.hide();
        this.getBuyBoxPlaces(this.BuyBoxId);
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  getBuyBoxPlaces(buyboxId: number): void {
    if (this.stateService.getBuyboxPlaces()?.length > 0) {
      this.buyboxPlaces = this.stateService.getBuyboxPlaces();
      this.getAllMarker();
      return;
    }

    const body: any = {
      Name: 'BuyBoxRelatedRetails',
      Params: {
        BuyBoxId: buyboxId,
      },
    };
    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.buyboxPlaces = data.json;
        this.stateService.setBuyboxPlaces(data.json);
        this.buyboxCategories.forEach((category) => {
          category.isChecked = false;
          category.places = this.buyboxPlaces?.filter((place) =>
            place.RetailRelationCategories?.some((x) => x.Id === category.id)
          );
        });
        this.getAllMarker();
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  async getAllMarker() {
    try {
      this.spinner.show();
      const { Map } = await google.maps.importLibrary('maps');

      const mapElement = document.getElementById('map') as HTMLElement;
      if (!mapElement) {
        console.error('Element with id "map" not found.');
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
            lat: this.shoppingCenters
              ? this.shoppingCenters?.[0]?.Latitude
              : this.standAlone?.[0]?.Latitude || 0,
            lng: this.shoppingCenters
              ? this.shoppingCenters?.[0]?.Longitude
              : this.standAlone?.[0]?.Longitude || 0,
          },
          zoom: 8,
          mapId: '1234567890',
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
      console.error('Error loading markers:', error);
    } finally {
      this.spinner.hide();
    }
  }

  openDeleteShoppingCenterModal(
    modalTemplate: TemplateRef<any>,
    shoppingCenterId: any
  ) {
    this.shoppingCenterIdToDelete = shoppingCenterId;
    this.modalService.open(modalTemplate, {
      ariaLabelledBy: 'modal-basic-title',
    });
  }

  deleteShCenter() {
    this.spinner.show();
    const body: any = {
      Name: 'DeleteShoppingCenterFromBuyBox',
      Params: {
        BuyBoxId: this.BuyBoxId,
        ShoppingCenterId: this.shoppingCenterIdToDelete,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => {
        this.modalService.dismissAll();

        this.getMarketSurveyShoppingCenter();
      },
      error: (error) => console.error('Error fetching APIs:', error),
    });
  }

  getMarketSurveyShoppingCenter() {
    this.spinner.show();
    const body: any = {
      Name: 'GetMarketSurveyShoppingCenters',
      Params: {
        BuyBoxId: this.BuyBoxId,
      },
    };

    this.PlacesService.GenericAPI(body).subscribe({
      next: (data) => this.handleSuccessResponse(data),
    });
  }

  private handleSuccessResponse(data: any) {
    this.shoppingCenters = data.json;
    this.stateService.setShoppingCenters(data.json);

    this.getBuyBoxPlaces(this.BuyBoxId);
    this.showbackIds = [];
    this.spinner.hide();
  }

  // Confirm deletion of Shopping Center
  confirmDeleteShoppingCenter(modal: NgbModalRef) {
    console.log(this.shoppingCenterIdToDelete);

    if (this.shoppingCenterIdToDelete !== null) {
      this.DeleteShoppingCenter().subscribe((res) => {
        this.getMarketSurveyShoppingCenter();

        this.BuyBoxPlacesAndShoppingCenter =
          this.BuyBoxPlacesAndShoppingCenter.filter(
            (center) => center.id !== this.shoppingCenterIdToDelete
          );
        modal.close('Delete click');
        this.shoppingCenterIdToDelete = null;
      });
    }
  }

  DeleteShoppingCenter() {
    const body: any = {
      Name: 'DeleteShoppingCenterFromBuyBox',
      Params: {
        BuyboxId: this.BuyBoxId,
        ShoppingCenterId: this.showbackIdsJoin,
      },
    };
    return this.PlacesService.GenericAPI(body);
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

  isLast(currentItem: any, array: any[]): boolean {
    return array.indexOf(currentItem) === array.length - 1;
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
        // if (center.ShoppingCenter?.Places) {
        center.Latitude = center.Latitude;
        center.Longitude = center.Longitude;
        // }
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
      console.warn('Invalid Latitude or Longitude for property:', property);
      return false;
    }

    return bounds?.contains({ lat, lng });
  }

  onMouseEnter(place: any): void {
    const { Latitude, Longitude } = place;
    const mapElement = document.getElementById('map') as HTMLElement;

    if (!mapElement) return;

    if (this.map) {
      this.map.setCenter({ lat: +Latitude, lng: +Longitude });
      this.map.setZoom(17);
    }
  }

  onMouseHighlight(place: any) {
    this.markerService.onMouseEnter(this.map, place);
  }

  onMouseLeaveHighlight(place: any) {
    this.markerService.onMouseLeave(this.map, place);
>>>>>>> acba0644998a85988630c703ddcbae3156f74817
  }

  selectOption(option: any): void {
    this.selectedOption = option.status;
    this.currentView = option.status;
    localStorage.setItem('currentViewDashBord', this.currentView.toString());
  }
  
  onHighlightMarker(place: any): void {
    if (this.mapView) {
      this.mapView.highlightMarker(place);
    }
  }
  
  onUnhighlightMarker(place: any): void {
    if (this.mapView) {
      this.mapView.unhighlightMarker(place);
    }
  }
}