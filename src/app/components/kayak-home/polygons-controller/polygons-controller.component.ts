/// <reference types="google.maps" />
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MapDrawingService } from 'src/app/services/map-drawing.service';
declare const google: any;

@Component({
  selector: 'app-polygons-controller',
  templateUrl: './polygons-controller.component.html',
  styleUrl: './polygons-controller.component.css',
})
export class PolygonsControllerComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) gmapContainer!: ElementRef;
  map!: google.maps.Map;
  savedMapView: any;

  constructor(private mapDrawingService: MapDrawingService) {}

  ngOnInit(): void {
    // get saved map view if exists
    this.savedMapView = localStorage.getItem('mapView');

    // listen for polygons and circles changes
    this.mapDrawingService.onPolygonCreated.subscribe((polygon) => {
      console.log('New polygon created:', polygon);
    });
    this.mapDrawingService.onPolygonDeleted.subscribe((polygon) => {
      console.log('Polygon deleted:', polygon);
    });
    this.mapDrawingService.onCircleCreated.subscribe((circle) => {
      console.log('New circle created:', circle);
    });
    this.mapDrawingService.onCircleDeleted.subscribe((circle) => {
      console.log('Circle deleted:', circle);
    });
  }

  ngAfterViewInit() {
    if (this.savedMapView) {
      const { lat, lng, zoom } = JSON.parse(this.savedMapView);

      // initialize map with saved view
      this.map = this.mapDrawingService.initializeMap(
        this.gmapContainer,
        lat,
        lng,
        zoom
      );
    } else {
      // initialize map with saved view
      this.map = this.mapDrawingService.initializeMap(this.gmapContainer);
    }

    // initialize drawing manager
    this.mapDrawingService.initializeDrawingManager(this.map);
  }
}
