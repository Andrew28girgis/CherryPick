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
import { Subject, takeUntil } from 'rxjs';
import { IPolygon } from 'src/app/shared/models/ipolygons-controller';
import { CampaignDrawingService } from 'src/app/shared/services/campaign-drawing.service';
import { PlacesService } from 'src/app/shared/services/places.service';

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

  constructor(
    private campaignDrawingService: CampaignDrawingService,
    private cdr: ChangeDetectorRef,
    private modalService: NgbModal,
    private placesService: PlacesService
  ) {}

  startDrawing(modeId: number, shape: string) {
    this.selectedDrawingModeId = modeId;
    // debugger
    this.campaignDrawingService.setDrawingMode(shape);
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
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
    console.log(this.campaignDrawingService.gettDrawnList());

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
        BuyBoxId: this.buyBoxId||217,
      },
    };

    debugger

    this.placesService.GenericAPI(body).subscribe((response) => {
      console.log(response);
      if(response.json&&response.json.length>0&&response.json[0].id)
      {
        
      }
    });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
