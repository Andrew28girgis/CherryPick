import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { lastValueFrom, Subject, switchMap, takeUntil } from 'rxjs';
import { MapDrawingService } from 'src/app/services/map-drawing.service';
import { PolygonsControllerService } from 'src/app/services/polygons-controller.service';
import { StateService } from 'src/app/services/state.service';
import { IGeoJson } from 'src/models/igeo-json';
import { IPolygon } from 'src/models/ipolygons-controller';
import { IProperty } from 'src/models/iproperty';

@Component({
  selector: 'app-polygons-controller',
  templateUrl: './polygons-controller.component.html',
  styleUrl: './polygons-controller.component.css',
})
export class PolygonsControllerComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private destroy$ = new Subject<void>();
  private searchSubject: Subject<string> = new Subject<string>();

  // create observable to destroy all subscribtions when component destroyed
  @ViewChild('mapContainer', { static: false }) gmapContainer!: ElementRef;
  map!: google.maps.Map;
  buyBoxId!: number;
  contactId!: number;
  polygonsOptions: {
    id: number;
    title: string;
    icon: string;
    selectedIcon: string;
  }[] = [
    {
      id: 1,
      title: 'My Polygons',
      icon: '../../../../assets/icons/svgs/buyBox-polygons.svg',
      selectedIcon:
        '../../../../assets/icons/svgs/buyBox-polygons-selected.svg',
    },
    {
      id: 2,
      title: 'Explore Polygons',
      icon: '../../../../assets/icons/svgs/explore-polygons.svg',
      selectedIcon:
        '../../../../assets/icons/svgs/explore-polygons-selected.svg',
    },
  ];
  displayedExternalPolygons: number[] = [];
  selectedPolygonOption: number = 1;
  polygonSearch: string = '';
  polygons: IPolygon[] = [];
  externalPolygons: IPolygon[] = [];
  selectedPolygonsIds: Set<number> = new Set<number>();
  selectedPolygon: IPolygon | null = null;
  properties: { polygonId: number; properties: IProperty[] }[] = [];

  constructor(
    private mapDrawingService: MapDrawingService,
    private polygonsControllerService: PolygonsControllerService,
    private stateService: StateService,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    const contact = localStorage.getItem('contactId');
    if (contact) {
      this.contactId = +contact;
    }

    const id = localStorage.getItem('BuyBoxId');
    if (id) {
      this.buyBoxId = +id;
    }

    // listen for polygons and circles changes
    this.polygonsListeners();
    this.circlesListeners();

    this.getPolygonsByNameListener();
  }

  ngAfterViewInit() {
    // initialize the map
    this.initializeMap();

    // initialize drawing manager
    this.mapDrawingService.initializeDrawingManager(this.map);

    // get all polygons from database
    this.getAllPolygons();
  }

  // use take until method to keep listening till the destroy observable completed
  polygonsListeners(): void {
    this.mapDrawingService.onPolygonCreated
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (polygon) => {
        const geo = await this.mapDrawingService.convertPolygonToGeoJson(
          polygon.shape as google.maps.Polygon
        );
        this.insertNewPolygon(polygon.shape.get('label'), geo, '', '');
      });

    this.mapDrawingService.onPolygonChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (polygon) => {
        const geo = await this.mapDrawingService.convertPolygonToGeoJson(
          polygon.shape as google.maps.Polygon
        );
        const element = this.polygons.find((p) => p.id == polygon.id);
        this.updatePolygon(polygon.id!, geo, '', '', element!.name);
      });

    this.mapDrawingService.onPolygonDeleted
      .pipe(takeUntil(this.destroy$))
      .subscribe((polygon) => {
        if (polygon.id) {
          this.polygons = this.polygons.filter((p) => p.id != polygon.id);
          this.deletePolygon(polygon.id);
        }
      });
  }

  // use take until method to keep listening till the destroy observable completed

  circlesListeners(): void {
    this.mapDrawingService.onCircleCreated
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (circle) => {
        const c = circle.shape as google.maps.Circle;
        const center = c.getCenter();
        const radius = c.getRadius();

        const polygon = this.mapDrawingService.convertCircleToPolygon(
          this.map,
          c
        );

        const geo = await this.mapDrawingService.convertPolygonToGeoJson(
          polygon
        );
        this.insertNewPolygon(
          circle.shape.get('label'),
          geo,
          JSON.stringify(center),
          JSON.stringify(radius)
        );
      });

    this.mapDrawingService.onCircleChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (circle) => {
        const c = circle.shape as google.maps.Circle;
        const center = c.getCenter();
        const radius = c.getRadius();

        const polygon = this.mapDrawingService.convertCircleToPolygon(
          this.map,
          c
        );

        const geo = await this.mapDrawingService.convertPolygonToGeoJson(
          polygon
        );
        const element = this.polygons.find((p) => p.id == circle.id);
        this.updatePolygon(
          circle.id!,
          geo,
          JSON.stringify(center),
          JSON.stringify(radius),
          element!.name
        );
      });

    this.mapDrawingService.onCircleDeleted
      .pipe(takeUntil(this.destroy$))
      .subscribe((circle) => {
        if (circle.id) {
          this.polygons = this.polygons.filter((p) => p.id != circle.id);
          this.deletePolygon(circle.id);
        }
      });
  }

  initializeMap(): void {
    // check for polygons exist
    if (this.polygons.length > 0) {
      const point = this.getMapCenter(this.polygons[0].json);
      if (point) {
        this.map = this.mapDrawingService.initializeMap(
          this.gmapContainer,
          point.lat,
          point.lng
        );
      } else {
        this.map = this.mapDrawingService.initializeMap(this.gmapContainer);
      }
    } else {
      // get center lat and lng if no polygons
      if (this.stateService.getShoppingCenters()?.length > 0) {
        const lat = this.stateService.getShoppingCenters()[0].Latitude;
        const lng = this.stateService.getShoppingCenters()[0].Longitude;
        this.map = this.mapDrawingService.initializeMap(
          this.gmapContainer,
          lat,
          lng
        );
      } else {
        this.map = this.mapDrawingService.initializeMap(this.gmapContainer);
      }
    }
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

  addPolygonsToMap(): void {
    for (let polygon of this.polygons) {
      try {
        const geoJson: IGeoJson = JSON.parse(polygon.json);

        if (!geoJson || !geoJson.geometry || !geoJson.geometry.coordinates) {
          console.error('Invalid GeoJSON:', polygon.json);
          continue;
        }

        // circle shape
        if (polygon.center && polygon.radius) {
          // Handle circle case
          this.mapDrawingService.insertExternalCircle(
            polygon.id,
            this.map,
            JSON.parse(polygon.center),
            JSON.parse(polygon.radius),
            polygon.name
          );
        }
        // polygon shape
        else {
          // convert to {lat, lng} format
          const coordinates = geoJson.geometry.coordinates[0]?.map(
            (coord: number[]) => {
              return { lat: coord[1], lng: coord[0] };
            }
          );

          if (!coordinates) {
            console.error('Invalid coordinates for polygon:', polygon.json);
            continue;
          }

          this.mapDrawingService.insertExternalPolygon(
            polygon.id,
            this.map,
            coordinates,
            polygon.name
          );
        }
      } catch (error) {
        console.error('Error parsing GeoJSON:', error, polygon.json);
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
        console.error('Invalid GeoJSON:', polygon.json);
        return null;
      }

      const coordinates = geoJson.geometry.coordinates[0]?.map(
        (coord: number[]) => {
          return { lat: coord[1], lng: coord[0] };
        }
      );

      if (!coordinates) {
        console.error('Invalid coordinates for polygon:', polygon.json);
        return null;
      }

      return coordinates;
    } catch (error) {
      console.error('Error parsing GeoJSON:', error, polygon.json);
    }
    return null;
  }

  addExplorePolygonsToMap(): void {
    for (let polygon of this.externalPolygons) {
      const coordinates = this.getPolygonCoordinates(polygon);
      if (coordinates) {
        this.mapDrawingService.insertExplorePolygon(polygon.id, coordinates);
      }
    }
  }

  getAllPolygons(): void {
    const observer = {
      next: (response: any) => {
        if (response.json) {
          // clear all lists to fill the data from database
          this.mapDrawingService.clearDrawnLists();
          this.polygons = response.json;

          if (!this.map) {
            this.initializeMap();
            // initialize drawing manager
            this.mapDrawingService.initializeDrawingManager(this.map);
          }

          const centers = this.stateService.getShoppingCenters();
          if (centers && centers.length > 0) {
            for (let center of centers) {
              this.mapDrawingService.createTempMarker(this.map, center);
            }
          }
          this.addPolygonsToMap();
        }
      },
      error: (error: any) => {
        console.error(error);
      },
    };

    this.polygonsControllerService
      .getAllPolygons(this.contactId, this.buyBoxId)
      .subscribe(observer);
  }

  insertNewPolygon(
    name: string,
    geoJson: IGeoJson,
    center: string,
    radius: string
  ): void {
    this.spinner.show();
    const observer = {
      next: (response: any) => {
        if (response) {
          this.spinner.hide();
          this.polygons.push(response);
          setTimeout(() => {
            const lastIndex = this.polygons.length - 1;
            const lastCheckbox = document.getElementById(
              'checkBox' + lastIndex
            ) as HTMLInputElement;
            if (lastCheckbox) {
              lastCheckbox.checked = true;

              this.selectedPolygonsIds.add(response.id);
              this.createPropertiesMarkers(response.id, false);
              if (center && radius) {
                this.mapDrawingService.updatePolygonId(response.id, true);
              } else {
                this.mapDrawingService.updatePolygonId(response.id, false);
              }
            }
          });
        }
      },
      error: (error: any) => {
        this.spinner.hide();
        console.error(error);
      },
    };

    this.polygonsControllerService
      .insertNewPolygons({
        buyBoxId: this.buyBoxId,
        contactId: this.contactId,
        name: name,
        city: geoJson.properties.city,
        state: geoJson.properties.state,
        geoJson: JSON.stringify(geoJson),
        center: center,
        radius: radius,
      })
      .subscribe(observer);
  }

  updatePolygon(
    id: number,
    geoJson: IGeoJson,
    center: string,
    radius: string,
    name: string
  ): void {
    this.spinner.show();
    const observer = {
      next: (response: any) => {
        this.spinner.hide();
        if (response) {
          let polygon = this.polygons.find((p) => p.id == id);
          if (polygon) {
            Object.assign(polygon, response);
            this.createPropertiesMarkers(id, true);
          }
        }
      },
      error: (error: any) => {
        this.spinner.hide();
        console.error(error);
      },
    };

    this.polygonsControllerService
      .updatePolygon(id, {
        buyBoxId: this.buyBoxId,
        contactId: this.contactId,
        name: name,
        city: geoJson.properties.city,
        state: geoJson.properties.state,
        geoJson: JSON.stringify(geoJson),
        center: center,
        radius: radius,
      })
      .subscribe(observer);
  }

  updatePolygonName(newPolygonName: HTMLInputElement): void {
    this.modalService.dismissAll();
    this.updatePolygon(
      this.selectedPolygon!.id,
      JSON.parse(this.selectedPolygon!.json),
      this.selectedPolygon!.center as string,
      this.selectedPolygon!.radius as string,
      newPolygonName.value
    );
  }

  deletePolygon(id: number): void {
    const observer = {
      next: (response: any) => {
        if (response) {
          this.mapDrawingService.completelyRemoveMarkers(id);
          this.properties = this.properties.filter((p) => p.polygonId != id);
        }
      },
      error: (error: any) => {
        console.error(error);
      },
    };

    this.polygonsControllerService.deletePolygon(id).subscribe(observer);
  }

  async createPropertiesMarkers(
    polygonId: number,
    updating: boolean
  ): Promise<void> {
    this.spinner.show();

    const property = this.properties.find((p) => p.polygonId == polygonId);
    if (property) {
      if (updating) {
        this.mapDrawingService.completelyRemoveMarkers(polygonId);
        this.properties = this.properties.filter(
          (p) => p.polygonId != polygonId
        );
        const properties = await this.getPolygonProperties(polygonId);
        if (properties && properties.length > 0) {
          this.properties.push({
            polygonId: polygonId,
            properties: properties,
          });
          for (let property of properties) {
            this.mapDrawingService.createMarker(this.map, polygonId, property);
          }
        }
        //update
      } else {
        this.mapDrawingService.displayMarker(polygonId, this.map);
      }
    } else {
      const properties = await this.getPolygonProperties(polygonId);
      if (properties && properties.length > 0) {
        this.properties.push({
          polygonId: polygonId,
          properties: properties,
        });
        for (let property of properties) {
          this.mapDrawingService.createMarker(this.map, polygonId, property);
        }
      }
    }
    this.spinner.hide();
  }

  async getPolygonProperties(polygonId: number): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.polygonsControllerService.getPolygonProperties(polygonId)
      );
      if (response.json) {
        return response.json;
      }
      return null;
    } catch (error) {
      console.error(error);
    }
  }

  onCheckBoxChange(event: any, id: number): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    isChecked ? this.displayShapeOnMap(id) : this.hideShapeFromMap(id);
  }

  displayShapeOnMap(id: number): void {
    this.selectedPolygonsIds.add(id);
    this.createPropertiesMarkers(id, false);

    const polygon = this.polygons.find((p) => p.id == id);
    if (polygon) {
      const point = this.getMapCenter(polygon.json);
      const coordinates = this.getPolygonCoordinates(polygon);
      if (coordinates) {
        this.mapDrawingService.updateMapZoom(this.map, coordinates);
      } else {
        if (point) {
          this.mapDrawingService.updateMapCenter(this.map, point);
        } else {
          this.mapDrawingService.updateMapCenter(this.map, null);
        }
      }
    }
    this.mapDrawingService.displayShapeOnMap(id, this.map);
  }

  hideShapeFromMap(id: number): void {
    this.selectedPolygonsIds.delete(id);
    this.mapDrawingService.removeMarkers(id);

    this.mapDrawingService.hideShapeFromMap(id);
  }

  openUpdatePolygonNameModal(content: TemplateRef<any>, polygon: IPolygon) {
    this.selectedPolygon = polygon;
    this.modalService.open(content);
  }

  getPolygonsByNameListener(): void {
    const observer = {
      next: (response: any) => {
        if (response.json && response.json.length > 0) {
          this.mapDrawingService.completelyRemoveExplorePolygon();
          this.externalPolygons = response.json;
          this.addExplorePolygonsToMap();
        }
      },
      error: (error: any) => {
        console.error(error);
      },
    };

    this.searchSubject
      .pipe(
        // switchMap cancels previous requests when a new value is emitted
        switchMap((searchTerm: string) =>
          this.polygonsControllerService.getPolygonsByName(searchTerm)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(observer);
  }

  onSearchChange(value: string): void {
    this.externalPolygons = [];
    this.displayedExternalPolygons = [];
    if (value.trim().length > 0) {
      this.searchSubject.next(value);
    } else {
      this.mapDrawingService.completelyRemoveExplorePolygon();
    }
  }

  onPolygonOptionChange(optionId: number): void {
    this.selectedPolygonOption = optionId;
    if (optionId == 1) {
      this.navigateToMyPolygons();
    } else {
      this.navigateToExplorePolygons();
    }
  }

  navigateToExplorePolygons(): void {
    this.polygons.forEach((p) =>
      this.mapDrawingService.completelyRemoveMarkers(p.id)
    );
    this.polygons = [];
    this.selectedPolygonsIds.clear();
    this.selectedPolygon = null;
    this.properties = [];
    this.mapDrawingService.clearDrawnLists();
  }

  navigateToMyPolygons(): void {
    this.polygonSearch = '';
    this.externalPolygons = [];
    this.displayedExternalPolygons = [];
    this.mapDrawingService.completelyRemoveExplorePolygon();
    this.getAllPolygons();
  }

  toggleDisplayedExternalPolygon(polygon: IPolygon): void {
    const check = this.displayedExternalPolygons.includes(polygon.id);
    if (check) {
      this.mapDrawingService.hideShapeFromMap(polygon.id);
      this.displayedExternalPolygons = this.displayedExternalPolygons.filter(
        (id) => id != polygon.id
      );
    } else {
      this.displayedExternalPolygons.push(polygon.id);
      const coordinates = this.getPolygonCoordinates(polygon);
      const point = this.getMapCenter(polygon.json);

      if (coordinates) {
        this.mapDrawingService.updateMapZoom(this.map, coordinates);
      } else {
        if (point) {
          this.mapDrawingService.updateMapCenter(this.map, point);
        } else {
          this.mapDrawingService.updateMapCenter(this.map, null);
        }
      }

      this.mapDrawingService.displayShapeOnMap(polygon.id, this.map);
    }
  }

  ngOnDestroy(): void {
    // emit next and complete states to end all subscribtions for all subscribers
    this.destroy$.next();
    this.destroy$.complete();
  }
}
