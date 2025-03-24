import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subject, takeUntil } from 'rxjs';
import { CampaignDrawingService } from 'src/app/core/services/campaign-drawing.service';
import { PlacesService } from 'src/app/core/services/places.service';
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
  polygons: IPolygon[] = [];
  selectedDrawingModeId: number = 1;
  isDrawing: boolean = true;
  visabilityOptions: any[] = [
    { label: 'Private', value: 1 },
    { label: 'Public', value: 0 },
  ];
  isPrivateCampaign: number = 1;
  campaignName: string = '';
  buyBoxId!: number;
  contactId!: number;

  constructor(
    private campaignDrawingService: CampaignDrawingService,
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal,
    private placesService: PlacesService,
    private httpClient: HttpClient
  ) {}

  startDrawing(modeId: number, shape: string) {
    this.selectedDrawingModeId = modeId;
    // debugger
    this.campaignDrawingService.setDrawingMode(shape);
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    const contact = localStorage.getItem('contactId');
    if (contact) {
      this.contactId = +contact;
    }
    const id = localStorage.getItem('BuyBoxId');
    if (id) {
      this.buyBoxId = +id;
    }

    this.polygonsListeners();
    this.circlesListeners();
    this.drawingCancelListener();
  }

  ngAfterViewInit(): void {
    this.map = this.campaignDrawingService.initializeMap(this.gmapContainer);
    this.campaignDrawingService.initializeDrawingManager(this.map);
  }

  // use take until method to keep listening till the destroy observable completed
  polygonsListeners(): void {
    this.campaignDrawingService.onPolygonCreated
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (polygon) => {
        const geo = await this.campaignDrawingService.convertPolygonToGeoJson(
          polygon.shape as google.maps.Polygon
        );
        this.startDrawing(1, 'move');
        // this.insertNewPolygon(polygon.shape.get('label'), geo, '', '');
      });

    this.campaignDrawingService.onPolygonChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (polygon) => {
        const geo = await this.campaignDrawingService.convertPolygonToGeoJson(
          polygon.shape as google.maps.Polygon
        );
        const element = this.polygons.find((p) => p.id == polygon.id);
        this.startDrawing(1, 'move');

        // this.updatePolygon(polygon.id!, geo, '', '', element!.name);
      });

    this.campaignDrawingService.onPolygonDeleted
      .pipe(takeUntil(this.destroy$))
      .subscribe((polygon) => {
        if (polygon.id) {
          this.polygons = this.polygons.filter((p) => p.id != polygon.id);
          // this.campaignDrawingService.completelyRemoveMarkers(polygon.id);

          this.cdr.detectChanges();
          this.startDrawing(1, 'move');

          // this.deletePolygon(polygon.id);
        }
      });
  }

  // use take until method to keep listening till the destroy observable completed

  circlesListeners(): void {
    this.campaignDrawingService.onCircleCreated
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (circle) => {
        const c = circle.shape as google.maps.Circle;
        const center = c.getCenter();
        const radius = c.getRadius();
        debugger;

        const polygon = this.campaignDrawingService.convertCircleToPolygon(
          this.map,
          c
        );

        const geo = await this.campaignDrawingService.convertPolygonToGeoJson(
          polygon
        );
        // this.insertNewPolygon(
        //   circle.shape.get('label'),
        //   geo,
        //   JSON.stringify(center),
        //   JSON.stringify(radius)
        // );
        // debugger
        this.startDrawing(1, 'move');
      });

    this.campaignDrawingService.onCircleChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (circle) => {
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
        const element = this.polygons.find((p) => p.id == circle.id);
        // this.updatePolygon(
        //   circle.id!,
        //   geo,
        //   JSON.stringify(center),
        //   JSON.stringify(radius),
        //   element!.name
        // );
        this.startDrawing(1, 'move');
      });

    this.campaignDrawingService.onCircleDeleted
      .pipe(takeUntil(this.destroy$))
      .subscribe((circle) => {
        if (circle.id) {
          this.polygons = this.polygons.filter((p) => p.id != circle.id);

          this.cdr.detectChanges();
          // this.deletePolygon(circle.id);
        }
        this.startDrawing(1, 'move');
      });
  }

  drawingCancelListener(): void {
    this.campaignDrawingService.onDrawingCancel
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.startDrawing(1, 'move');
        // this.insertNewPolygon(polygon.shape.get('label'), geo, '', '');
      });
  }

  switchDrawingMode(): void {
    this.isDrawing = !this.isDrawing;
  }
  get getDrawnList() {
    // console.log(this.campaignDrawingService.gettDrawnList());

    return this.campaignDrawingService.getDrawnList();
  }
  openNewCampaignPopup(content: TemplateRef<any>): void {
    this.modalService.open(content, { centered: true });
  }
  createNewCampaign(): void {
    const body: any = {
      Name: 'CreateCampaign ',
      Params: {
        CampaignName: this.campaignName,
        CampaignPrivacy: this.isPrivateCampaign,
        BuyBoxId: this.buyBoxId || 211,
      },
    };

    debugger;

    this.placesService.GenericAPI(body).subscribe((response) => {
      console.log(response);
      if (response.json && response.json.length > 0 && response.json[0].id) {
        this.modalService.dismissAll();
        this.saveShapesWithCampaign(response.json[0].id);
      }
    });
  }

  insertNewPolygons(data: {
    contactId: number;
    CampaignId: number;
    name: string;
    city: string;
    state: string;
    geoJson: any;
    center: string;
    radius: string;
  }): void {
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

    this.httpClient
      .post<any>(`${environment.api}/GeoJson/AddGeoJson`, body)
      .subscribe({
        next: (response) => {},
        error: (error) => {},
      });
  }

  async saveShapesWithCampaign(campaignId: number): Promise<void> {
    const drawnPolygons = this.campaignDrawingService.getDrawnPolygons;
    const drawnCircles = this.campaignDrawingService.getDrawnCircles;

    if (drawnPolygons && drawnPolygons.length > 0) {
      for (let polygon of drawnPolygons) {
        const geo = await this.campaignDrawingService.convertPolygonToGeoJson(
          polygon.shape as google.maps.Polygon
        );

        this.insertNewPolygons({
          CampaignId: campaignId,
          contactId: this.contactId,
          name: polygon.shape.get('label'),
          city: geo.properties.city,
          state: geo.properties.state,
          geoJson: JSON.stringify(geo),
          center: '',
          radius: '',
        });
        // this.insertNewPolygons(polygon.shape.get('label'), geo, '', '');
      }
    }

    if (drawnCircles && drawnCircles.length > 0) {
      for (let circle of drawnCircles) {
        const c = circle.shape as google.maps.Circle;
        const center = c.getCenter();
        const radius = c.getRadius();
        debugger;

        const polygon = this.campaignDrawingService.convertCircleToPolygon(
          this.map,
          c
        );

        const geo = await this.campaignDrawingService.convertPolygonToGeoJson(
          polygon
        );
        // this.insertNewPolygon(
        //   circle.shape.get('label'),
        //   geo,
        //   JSON.stringify(center),
        //   JSON.stringify(radius)
        // );
        // debugger

        // const geo = await this.campaignDrawingService.convertPolygonToGeoJson(
        //   polygon.shape as google.maps.Polygon
        // );

        this.insertNewPolygons({
          CampaignId: campaignId,
          contactId: this.contactId,
          name: circle.shape.get('label'),
          city: geo.properties.city,
          state: geo.properties.state,
          geoJson: JSON.stringify(geo),
          center: JSON.stringify(center),
          radius: JSON.stringify(radius),
        });
        // this.insertNewPolygons(polygon.shape.get('label'), geo, '', '');
      }
    }

    this.campaignDrawingService.clearDrawnLists();
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
