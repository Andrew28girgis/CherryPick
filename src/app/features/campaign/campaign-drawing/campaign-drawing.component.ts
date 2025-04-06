import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { firstValueFrom, Subject, switchMap, takeUntil } from 'rxjs';
import { CampaignDrawingService } from 'src/app/core/services/campaign-drawing.service';
import { MapDrawingService } from 'src/app/core/services/map-drawing.service';
import { PlacesService } from 'src/app/core/services/places.service';
import { PolygonsControllerService } from 'src/app/core/services/polygons-controller.service';
import { IGeoJson } from 'src/app/shared/models/igeo-json';
import { IPolygon } from 'src/app/shared/models/ipolygons-controller';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-campaign-drawing',
  templateUrl: './campaign-drawing.component.html',
  styleUrl: './campaign-drawing.component.css',
})
export class CampaignDrawingComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private destroy$ = new Subject<void>();

  @ViewChild('mapContainer', { static: false }) gmapContainer!: ElementRef;

  map!: google.maps.Map;
  // polygons: IPolygon[] = [];
  selectedDrawingModeId: number = 1;
  isDrawing: boolean = true;
  visabilityOptions: any[] = [
    { label: 'Private', value: 1 },
    { label: 'Public', value: 0 },
  ];
  isPrivateCampaign: number = 1;
  campaignName: string = '';
  @Input() buyBoxId!: number;
  @Output() onCampaignCreated = new EventEmitter<void>();
  contactId!: number;

  polygonsOptions: {
    id: number;
    title: string;
    icon: string;
    selectedIcon: string;
  }[] = [
    {
      id: 1,
      title: 'Draw Polygons',
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

  selectedPolygonOption: number = 1;
  polygonSearch: string = '';
  externalPolygons: IPolygon[] = [];
  displayedExternalPolygons: number[] = [];
  private searchSubject: Subject<string> = new Subject<string>();

  constructor(
    private campaignDrawingService: CampaignDrawingService,
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal,
    private placesService: PlacesService,
    private httpClient: HttpClient,
    private router: Router,
    private spinner: NgxSpinnerService,
    // private mapDrawingService: MapDrawingService,
    private polygonsControllerService: PolygonsControllerService
  ) {}

  ngOnInit(): void {
    if (!this.buyBoxId) {
      const id = localStorage.getItem('BuyBoxId');
      if (id) {
        this.buyBoxId = +id;
      }
    }
    const contact = localStorage.getItem('contactId');
    if (contact) {
      this.contactId = +contact;
    }

    this.polygonsListeners();
    this.circlesListeners();
    this.drawingCancelListener();
    this.getPolygonsByNameListener();
  }

  ngAfterViewInit(): void {
    this.map = this.campaignDrawingService.initializeMap(this.gmapContainer);
    this.campaignDrawingService.initializeDrawingManager(this.map);
  }

  startDrawing(modeId: number, shape: string) {
    this.selectedDrawingModeId = modeId;
    this.campaignDrawingService.setDrawingMode(shape);
    this.cdr.detectChanges();
  }

  polygonsListeners(): void {
    this.campaignDrawingService.onPolygonCreated
      .pipe(takeUntil(this.destroy$))
      .subscribe((polygon) => {
        this.startDrawing(1, 'move');
      });
  }

  circlesListeners(): void {
    this.campaignDrawingService.onCircleCreated
      .pipe(takeUntil(this.destroy$))
      .subscribe((circle) => {
        this.startDrawing(1, 'move');
      });
  }

  drawingCancelListener(): void {
    this.campaignDrawingService.onDrawingCancel
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.startDrawing(1, 'move');
      });
  }

  switchDrawingMode(): void {
    this.isDrawing = !this.isDrawing;
  }

  get getDrawnList() {
    return this.campaignDrawingService.getDrawnList();
  }

  openNewCampaignPopup(content: TemplateRef<any>): void {
    this.modalService.open(content, { centered: true });
  }

  syncMarketSurveyWithCampaign(campaignId: number): void {
    const body: any = {
      Name: 'SyncMarketSurveyWithCampaign',
      Params: { CampaignId: campaignId },
    };

    this.placesService.GenericAPI(body).subscribe((response) => {});
  }

  createNewCampaign(): void {
    this.spinner.show();
    const body: any = {
      Name: 'CreateCampaign ',
      Params: {
        CampaignName: this.campaignName,
        CampaignPrivacy: this.isPrivateCampaign,
        BuyBoxId: this.buyBoxId,
        CreatedDate: new Date(),
      },
    };

    this.placesService.GenericAPI(body).subscribe((response) => {
      if (response.json && response.json.length > 0 && response.json[0].id) {
        if (!this.router.url.includes('campaigns')) {
          setTimeout(() => {
            this.spinner.hide();
            this.modalService.dismissAll();
            this.router.navigate(['/campaigns']);
          }, 1000);
        } else {
          setTimeout(() => {
            this.spinner.hide();
            this.onCampaignCreated.emit();
          }, 1000);
        }
        this.saveShapesWithCampaign(response.json[0].id);
      }
    });
  }

  async insertNewPolygons(data: {
    contactId: number;
    CampaignId: number;
    name: string;
    city: string;
    state: string;
    geoJson: any;
    center: string;
    radius: string;
  }): Promise<void> {
    const body: any = {
      State: data.state,
      City: data.city,
      Name: data.name,
      PropertyType: 'Polygon',
      ContactId: data.contactId,
      CampaignId: data.CampaignId,
      CreationDate: new Date(),
      Json: data.geoJson,
      Center: data.center,
      Radius: data.radius,
    };

    const response = await firstValueFrom(
      this.httpClient.post<any>(`${environment.api}/GeoJson/AddGeoJson`, body)
    );
  }

  async attachPolygonToMyCampaign(
    campaignId: number,
    polygonId: number
  ): Promise<void> {
    const body: any = {
      Name: 'AttachPolygonToBuyBox',
      Params: {
        CampaignId: campaignId,
        PolygonId: polygonId,
      },
    };

    const response = await firstValueFrom(this.placesService.GenericAPI(body));
  }

  async saveShapesWithCampaign(campaignId: number): Promise<void> {
    const drawnPolygons = this.campaignDrawingService.getDrawnPolygons;
    const drawnCircles = this.campaignDrawingService.getDrawnCircles;

    if (drawnPolygons && drawnPolygons.length > 0) {
      for (let polygon of drawnPolygons) {
        const geo = await this.campaignDrawingService.convertPolygonToGeoJson(
          polygon.shape as google.maps.Polygon
        );

        if (polygon.id) {
          this.attachPolygonToMyCampaign(campaignId, polygon.id);
        } else {
          await this.insertNewPolygons({
            CampaignId: campaignId,
            contactId: this.contactId,
            name: polygon.shape.get('label') ?? 'Shape',
            city: geo.properties.city,
            state: geo.properties.state,
            geoJson: JSON.stringify(geo),
            center: '',
            radius: '',
          });
        }
      }
    }

    if (drawnCircles && drawnCircles.length > 0) {
      for (let circle of drawnCircles) {
        const c = circle.shape as google.maps.Circle;
        const center = c.getCenter();
        const radius = c.getRadius();

        const polygon = this.campaignDrawingService.convertCircleToPolygon(
          this.map,
          c
        );

        const geo = await this.campaignDrawingService.convertPolygonToGeoJson(
          polygon
        );

        await this.insertNewPolygons({
          CampaignId: campaignId,
          contactId: this.contactId,
          name: circle.shape.get('label') ?? 'Shape',
          city: geo.properties.city,
          state: geo.properties.state,
          geoJson: JSON.stringify(geo),
          center: JSON.stringify(center),
          radius: JSON.stringify(radius),
        });
      }
    }

    this.syncMarketSurveyWithCampaign(campaignId);
    this.campaignDrawingService.clearDrawnLists();
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
    this.campaignDrawingService.hideMyPolygons();
    // this.polygons.forEach((p) =>
    //   this.mapDrawingService.completelyRemoveMarkers(p.id)
    // );
    // this.polygons = [];
    // this.selectedPolygonsIds.clear();
    // this.selectedPolygon = null;
    // this.properties = [];
    // this.mapDrawingService.clearDrawnLists();
    // if (this.map) {
    //   this.switchDrawingMode()
    //   // this.mapDrawingService.hideDrawingManager();
    // }
  }

  navigateToMyPolygons(): void {
    // this.externalPolygons.forEach((p) =>
    //   this.mapDrawingService.completelyRemoveMarkers(p.id)
    // );
    this.polygonSearch = '';
    this.externalPolygons = [];
    this.displayedExternalPolygons = [];
    this.campaignDrawingService.completelyRemoveExplorePolygon();
    this.campaignDrawingService.displayMyPolygons(this.map);
    // if (this.map) {
    //   this.mapDrawingService.displayDrawingManager(this.map);
    // }
    // this.getAllPolygons();
  }

  onSearchChange(value: string): void {
    this.externalPolygons = [];
    this.displayedExternalPolygons = [];
    if (value.trim().length > 0) {
      this.searchSubject.next(value);
    } else {
      this.campaignDrawingService.completelyRemoveExplorePolygon();
    }
  }
  toggleDisplayedExternalPolygon(polygon: IPolygon): void {
    const check = this.displayedExternalPolygons.includes(polygon.id);
    if (check) {
      // this.mapDrawingService.removeMarkers(polygon.id);
      this.campaignDrawingService.hideShapeFromMap(polygon.id);
      this.displayedExternalPolygons = this.displayedExternalPolygons.filter(
        (id) => id != polygon.id
      );
    } else {
      // this.createPropertiesMarkers(polygon.id, false, true);
      this.displayedExternalPolygons.push(polygon.id);
      const coordinates = this.getPolygonCoordinates(polygon);
      const point = this.getMapCenter(polygon.json);

      if (coordinates) {
        this.campaignDrawingService.updateMapZoom(this.map, coordinates);
      } else {
        if (point) {
          this.campaignDrawingService.updateMapCenter(this.map, point);
        } else {
          this.campaignDrawingService.updateMapCenter(this.map, null);
        }
      }

      this.campaignDrawingService.displayShapeOnMap(polygon.id, this.map);
    }
  }

  getPolygonsByNameListener(): void {
    const observer = {
      next: (response: any) => {
        if (response.json && response.json.length > 0) {
          this.campaignDrawingService.completelyRemoveExplorePolygon();
          this.externalPolygons = response.json;
          this.addExplorePolygonsToMap();
        }
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

  addExplorePolygonsToMap(): void {
    for (let polygon of this.externalPolygons) {
      const coordinates = this.getPolygonCoordinates(polygon);
      if (coordinates) {
        this.campaignDrawingService.insertExplorePolygon(
          polygon.id,
          coordinates,
          polygon.name
        );
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
        return null;
      }

      const coordinates = geoJson.geometry.coordinates[0]?.map(
        (coord: number[]) => {
          return { lat: coord[1], lng: coord[0] };
        }
      );

      if (!coordinates) {
        return null;
      }

      return coordinates;
    } catch (error) {}
    return null;
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

  attachPolygonToCampaign(polygonId: number): void {
    const polygon = this.externalPolygons.find((p) => p.id == polygonId);
  
    // this.campaignDrawingService.hideMyPolygons()
    this.campaignDrawingService.hideShapeFromMap(polygonId);
    if (polygon) {
      const coordinates = this.getPolygonCoordinates(polygon);
      if (coordinates) {
        this.campaignDrawingService.insertExplorePolygonToMyPolygons(
          this.map,
          polygon.id,
          coordinates,
          polygon.name
        );
      }
    }
    this.externalPolygons = this.externalPolygons.filter(
      (p) => p.id != polygonId
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
