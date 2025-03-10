import {
  Component,
  OnInit,
  Renderer2,
  ChangeDetectorRef,
  Output,
  EventEmitter,
  NgZone,
  TemplateRef,
  OnChanges,
  SimpleChanges,
  Input,
  OnDestroy,
  ApplicationRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from 'src/app/services/places.service';
import { General } from 'src/models/domain';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MapsService } from 'src/app/services/maps.service';
import { BuyboxCategory } from 'src/models/buyboxCategory';
import { Center, Place } from '../../../../../models/shoppingCenters';
import { DomSanitizer } from '@angular/platform-browser';
import { StateService } from '../../../../services/state.service';
import { BbPlace } from 'src/models/buyboxPlaces';
import { ShoppingCenter } from 'src/models/buyboxShoppingCenter';
import { ViewManagerService } from 'src/app/services/view-manager.service';
import { forkJoin, tap, catchError, of, Subject, takeUntil } from 'rxjs';
import { Polygon } from 'src/models/polygons';

declare const google: any;

@Component({
  selector: 'app-side-list-view',
  templateUrl: './side-list-view.component.html',
  styleUrls: ['./side-list-view.component.css'],
})
export class SideListViewComponent {
  cardsSideList: any[] = [];
  map: any;
  BuyBoxId!: any;
  mapViewOnePlacex: boolean = false;
  buyboxCategories: BuyboxCategory[] = [];
  shoppingCenters: Center[] = [];
  shoppingCenter: any;
  buyboxPlaces: BbPlace[] = [];
  savedMapView: any;
  selectedOption!: number;
  currentView: any;

  Polygons: Polygon[] = [];
  placesRepresentative: boolean | undefined;
  // dropdowmOptions: any = [
  //   {
  //     text: 'Map',
  //     icon: '../../../assets/Images/Icons/map.png',
  //     status: 1,
  //   },
  //   {
  //     text: 'Side',
  //     icon: '../../../assets/Images/Icons/element-3.png',
  //     status: 2,
  //   },
  //   {
  //     text: 'Cards',
  //     icon: '../../../assets/Images/Icons/grid-1.png',
  //     status: 3,
  //   },
  //   {
  //     text: 'Table',
  //     icon: '../../../assets/Images/Icons/grid-4.png',
  //     status: 4,
  //   },
  //   {
  //     text: 'Social',
  //     icon: '../../../assets/Images/Icons/globe-solid.svg',
  //     status: 5,
  //   },
  // ];

  constructor(
    private markerService: MapsService,
    public activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private stateService: StateService,
    private spinner: NgxSpinnerService,
    private PlacesService: PlacesService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.savedMapView = localStorage.getItem('mapView');

    this.activatedRoute.params.subscribe((params: any) => {
      this.BuyBoxId = params.buyboxid;

      localStorage.setItem('BuyBoxId', this.BuyBoxId);
    });

    this.BuyBoxPlacesCategories(this.BuyBoxId);
  }

  isLast(currentItem: any, array: any[]): boolean {
    return array.indexOf(currentItem) === array.length - 1;
  }

  onMouseHighlight(place: any) {
    this.markerService.onMouseEnter(this.map, place);
  }

  onMouseLeaveHighlight(place: any) {
    this.markerService.onMouseLeave(this.map, place);
  }
  openMapViewPlace(content: any, modalObject?: any) {
    this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      scrollable: true,
    });
    this.viewOnMap(modalObject.Latitude, modalObject.Longitude);
  }

  async viewOnMap(lat: number, lng: number) {
    this.mapViewOnePlacex = true;
    if (!lat || !lng) {
      console.error('Latitude and longitude are required to display the map.');
      return;
    }
    const { Map } = (await google.maps.importLibrary('maps')) as any;
    const mapDiv = document.getElementById('mappopup') as HTMLElement;
    if (!mapDiv) {
      console.error('Element with ID "mappopup" not found.');
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
  getShoppingCenterUnitSize(shoppingCenter: any): any {
    const formatNumberWithCommas = (number: number) => {
      return number.toLocaleString(); // Format the number with commas
    };
    const formatLeasePrice = (price: any) => {
      if (price === 0 || price === 'On Request') return 'On Request';
      const priceNumber = parseFloat(price);
      return !isNaN(priceNumber) ? Math.floor(priceNumber) : price; // Remove decimal points and return the whole number
    };

    const appendInfoIcon = (calculatedPrice: string, originalPrice: any) => {
      if (calculatedPrice === 'On Request') {
        return calculatedPrice; // No icon for "On Request"
      }
      const formattedOriginalPrice = `$${parseFloat(
        originalPrice
      ).toLocaleString()}/sq ft./year`;
      return `
        <div style="display:inline-block; text-align:left; line-height:1.2;">
          <div style="font-size:14px; font-weight:600; color:#333;">${formattedOriginalPrice}</div>
          <div style="font-size:12px; color:#666; margin-top:4px;">${calculatedPrice}</div>
        </div>
      `;
    };
    const places = shoppingCenter?.ShoppingCenter?.Places || [];
    const buildingSizes = places
      .map((place: any) => place.BuildingSizeSf)
      .filter(
        (size: any) => size !== undefined && size !== null && !isNaN(size)
      );

    if (buildingSizes.length === 0) {
      const singleSize = shoppingCenter.BuildingSizeSf;
      if (singleSize) {
        const leasePrice = formatLeasePrice(shoppingCenter.ForLeasePrice);
        const resultPrice =
          leasePrice && leasePrice !== 'On Request'
            ? appendInfoIcon(
                `$${formatNumberWithCommas(
                  Math.floor((parseFloat(leasePrice) * singleSize) / 12)
                )}/month`,
                shoppingCenter.ForLeasePrice
              )
            : 'On Request';
        return `Unit Size: ${formatNumberWithCommas(
          singleSize
        )} sq ft.<br>Lease price: ${resultPrice}`;
      }
      return null;
    }
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
        : `${formatNumberWithCommas(minSize)} sq ft. - ${formatNumberWithCommas(
            maxSize
          )} sq ft.`;

    // Ensure only one price is shown if one is "On Request"
    const formattedMinPrice =
      minPrice === 'On Request'
        ? 'On Request'
        : appendInfoIcon(
            `$${formatNumberWithCommas(
              Math.floor((parseFloat(minPrice) * minSize) / 12)
            )}/month`,
            minPrice
          );

    const formattedMaxPrice =
      maxPrice === 'On Request'
        ? 'On Request'
        : appendInfoIcon(
            `$${formatNumberWithCommas(
              Math.floor((parseFloat(maxPrice) * maxSize) / 12)
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
      // If both are the same price, just show one
      leasePriceRange = formattedMinPrice;
    } else {
      leasePriceRange = `${formattedMinPrice} - ${formattedMaxPrice}`;
    }

    return `Unit Size: ${sizeRange}<br> <b>Lease price</b>: ${leasePriceRange}`;
  }

  getNeareastCategoryName(categoryId: number) {
    let categories = this.buyboxCategories.filter((x) => x.id == categoryId);
    return categories[0]?.name;
  }

  selectOption(option: any): void {
    this.selectedOption = option;
    this.currentView = option.status;
    localStorage.setItem('currentView', this.currentView);
  }
  getShoppingCenters(buyboxId: number): void {
    if (this.stateService.getShoppingCenters().length > 0) {
      this.shoppingCenters = this.stateService.getShoppingCenters();
      this.getBuyBoxPlaces(this.BuyBoxId);
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
        this.shoppingCenters = this.shoppingCenters?.sort((a, b) =>
          a.CenterCity.localeCompare(b.CenterCity)
        );
        this.shoppingCenters = this.shoppingCenters?.filter(
          (element: any) => element.Deleted == false
        );
        console.log(`shy`);
        console.log(this.shoppingCenter);

        this.stateService.setShoppingCenters(this.shoppingCenters);
        this.spinner.hide();
        this.getBuyBoxPlaces(this.BuyBoxId);
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
        console.log(`1`);

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

  async getAllMarker() {
    console.log(`hello`);

    try {
      this.spinner.show();
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
      } else {
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
    } finally {
      this.spinner.hide();
    }
  }

  createCustomMarkers(markerDataArray: any[]) {
    markerDataArray.forEach((categoryData) => {
      this.markerService.createCustomMarker(this.map, categoryData);
    });
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
      },
      error: (error) => console.error('Error fetching APIs:', error),
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
      // this.markerService.fetchAndDrawPolygon(th)
    });

    // let centerIds: any[] = [];
    // this.shoppingCenters.forEach((center) => {
    //   // centerIds.push(center.Id);
    //   if (center.Latitude && center.Longitude) {
    //     // this.markerService.fetchAndDrawPolygon(this.map, center.CenterCity, center.CenterState , center.Neighbourhood);
    //     if (this.shoppingCenters.indexOf(center) < 1) {
    //       this.markerService.fetchAndDrawPolygon(
    //         this.map,
    //         center.CenterCity,
    //         center.CenterState,
    //         center.Latitude,
    //         center.Longitude
    //       );
    //     }
    //   }
    // });

    // const centerIdsString = centerIds.join(',');
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
      console.warn('Invalid Latitude or Longitude for property:', property);
      return false;
    }
    return bounds?.contains({ lat, lng });
  }
}
