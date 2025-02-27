import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MapDrawingService } from 'src/app/services/map-drawing.service';
import { PolygonsControllerService } from 'src/app/services/polygons-controller.service';
import { StateService } from 'src/app/services/state.service';
import { IGeoJson } from 'src/models/igeo-json';
import { IPolygon } from 'src/models/ipolygons-controller';

@Component({
  selector: 'app-polygons-controller',
  templateUrl: './polygons-controller.component.html',
  styleUrl: './polygons-controller.component.css',
})
export class PolygonsControllerComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) gmapContainer!: ElementRef;
  map!: google.maps.Map;
  buyBoxId!: number;
  contactId!: number;
  polygons: IPolygon[] = [];
  selectedPolygon: IPolygon | null = null;

  constructor(
    private mapDrawingService: MapDrawingService,
    private polygonsControllerService: PolygonsControllerService,
    private stateService: StateService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    // get contact id from local storage
    const contact = localStorage.getItem('contactId');
    if (contact) {
      this.contactId = +contact;
    }

    // get buybox id from local storage
    const id = localStorage.getItem('BuyBoxId');
    if (id) {
      this.buyBoxId = +id;
    }

    // listen for polygons and circles changes
    this.polygonsListeners();
    this.circlesListeners();
  }

  ngAfterViewInit() {
    // initialize the map
    this.initializeMap();

    // initialize drawing manager
    this.mapDrawingService.initializeDrawingManager(this.map);

    // get all polygons from database
    this.getAllPolygons();
  }

  polygonsListeners(): void {
    this.mapDrawingService.onPolygonCreated.subscribe(async (polygon) => {
      const geo = await this.mapDrawingService.convertPolygonToGeoJson(
        polygon.shape as google.maps.Polygon
      );
      this.insertNewPolygon(polygon.shape.get('label'), geo, '', '');
    });

    this.mapDrawingService.onPolygonChanged.subscribe(async (polygon) => {
      const geo = await this.mapDrawingService.convertPolygonToGeoJson(
        polygon.shape as google.maps.Polygon
      );
      const element = this.polygons.find((p) => p.id == polygon.id);
      this.updatePolygon(polygon.id!, geo, '', '', element!.name);
    });

    this.mapDrawingService.onPolygonDeleted.subscribe((polygon) => {
      if (polygon.id) {
        this.polygons = this.polygons.filter((p) => p.id != polygon.id);
        this.deletePolygon(polygon.id);
      }
    });
  }

  circlesListeners(): void {
    this.mapDrawingService.onCircleCreated.subscribe(async (circle) => {
      const c = circle.shape as google.maps.Circle;
      const center = c.getCenter();
      const radius = c.getRadius();

      const polygon = this.mapDrawingService.convertCircleToPolygon(
        this.map,
        c
      );

      const geo = await this.mapDrawingService.convertPolygonToGeoJson(polygon);
      this.insertNewPolygon(
        circle.shape.get('label'),
        geo,
        JSON.stringify(center),
        JSON.stringify(radius)
      );
    });

    this.mapDrawingService.onCircleChanged.subscribe(async (circle) => {
      const c = circle.shape as google.maps.Circle;
      const center = c.getCenter();
      const radius = c.getRadius();

      const polygon = this.mapDrawingService.convertCircleToPolygon(
        this.map,
        c
      );

      const geo = await this.mapDrawingService.convertPolygonToGeoJson(polygon);
      const element = this.polygons.find((p) => p.id == circle.id);
      this.updatePolygon(
        circle.id!,
        geo,
        JSON.stringify(center),
        JSON.stringify(radius),
        element!.name
      );
    });

    this.mapDrawingService.onCircleDeleted.subscribe((circle) => {
      if (circle.id) {
        this.polygons = this.polygons.filter((p) => p.id != circle.id);
        this.deletePolygon(circle.id);
      }
    });
  }

  initializeMap(): void {
    // check for polygons exist
    if (this.polygons.length > 0) {
      // get first polygon center
      const point = this.getMapCenter();
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
      if (this.stateService.getShoppingCenters().length > 0) {
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

  getMapCenter(): {
    lat: number;
    lng: number;
  } | null {
    const geoJson: IGeoJson = JSON.parse(this.polygons[0].json);

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

  getAllPolygons(): void {
    const observer = {
      next: (response: any) => {
        if (response.json) {
          // clear all lists to fill the data from database
          this.mapDrawingService.clearDrawnLists();
          this.polygons = response.json;
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
    const observer = {
      next: (response: any) => {
        if (response) {
          this.polygons.push(response);
          setTimeout(() => {
            const lastIndex = this.polygons.length - 1;
            const lastCheckbox = document.getElementById(
              'checkBox' + lastIndex
            ) as HTMLInputElement;
            if (lastCheckbox) {
              lastCheckbox.checked = true;
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
    const observer = {
      next: (response: any) => {
        if (response) {
          let polygon = this.polygons.find((p) => p.id == id);
          if (polygon) {
            Object.assign(polygon, response);
          }
        }
      },
      error: (error: any) => {
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
        }
      },
      error: (error: any) => {
        console.error(error);
      },
    };

    this.polygonsControllerService.deletePolygon(id).subscribe(observer);
  }

  onCheckBoxChange(event: any, id: number): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    isChecked ? this.displayShapeOnMap(id) : this.hideShapeFromMap(id);
  }

  displayShapeOnMap(id: number): void {
    this.mapDrawingService.displayShapeOnMap(id, this.map);
  }

  hideShapeFromMap(id: number): void {
    this.mapDrawingService.hideShapeFromMap(id);
  }

  getPolygonCity(json: any): string {
    const geoJson: IGeoJson = JSON.parse(json);
    return geoJson.properties.city;
  }

  getPolygonState(json: any): string {
    const geoJson: IGeoJson = JSON.parse(json);
    return geoJson.properties.state;
  }

  openUpdatePolygonNameModal(content: TemplateRef<any>, polygon: IPolygon) {
    this.selectedPolygon = polygon;
    this.modalService.open(content);
  }
}
