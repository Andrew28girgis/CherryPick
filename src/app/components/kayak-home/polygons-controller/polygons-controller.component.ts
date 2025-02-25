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
  // drawingManager!: google.maps.drawing.DrawingManager;
  // drawnPolygons: google.maps.Polygon[] = [];
  // drawnCircles: google.maps.Circle[] = [];
  // radiusLabel!: google.maps.InfoWindow;
  radiusInput: number = 100; // Default radius
  // currentCenter: google.maps.LatLng | null = null;

  // infoWindow!: google.maps.InfoWindow;
  // selectedPolygon!: google.maps.Polygon | null;
  savedMapView: any;
  constructor(private mapDrawingService: MapDrawingService) {}

  ngOnInit(): void {
    this.savedMapView = localStorage.getItem('mapView');
  }

  ngAfterViewInit() {
    if (this.savedMapView) {
      const { lat, lng, zoom } = JSON.parse(this.savedMapView);

      this.map = this.mapDrawingService.initializeMap(
        this.gmapContainer,
        lat,
        lng,
        zoom
      );
    } else {
      this.map = this.mapDrawingService.initializeMap(this.gmapContainer);
    }

    this.mapDrawingService.initializeDrawingManager(this.map);

    this.mapDrawingService.initializeInfoWindow();

    // this.initializeMap();
    // this.initializeDrawingManager();
    // this.initializeInfoWindow();
  }

  // initializeMap() {
  //   let mapOptions!: google.maps.MapOptions;

  //   if (this.savedMapView) {
  //     const { lat, lng, zoom } = JSON.parse(this.savedMapView);
  //     mapOptions = {
  //       center: { lat: lat, lng: lng },
  //       zoom: zoom,
  //     };
  //   } else {
  //     mapOptions = {
  //       center: { lat: 37.7749, lng: -122.4194 },
  //       zoom: 8,
  //     };
  //   }

  //   this.map = new google.maps.Map(
  //     this.gmapContainer.nativeElement,
  //     mapOptions
  //   );

  //   // Add click listener to get center point for circle
  //   // this.map.addListener('click', (e: google.maps.MapMouseEvent) => {
  //   //   if (this.drawingManager.getDrawingMode() === google.maps.drawing.OverlayType.CIRCLE) {
  //   //     this.currentCenter = e.latLng;
  //   //     this.drawCircleWithRadius();
  //   //   }
  //   // });

  //   // Hide popup when clicking anywhere else
  //   this.map.addListener('click', () => {
  //     this.hideDeletePopup();
  //   });
  // }

  // initializeDrawingManager() {
  //   this.drawingManager = new google.maps.drawing.DrawingManager({
  //     drawingMode: null,
  //     drawingControl: true,
  //     drawingControlOptions: {
  //       position: google.maps.ControlPosition.TOP_CENTER,
  //       drawingModes: [google.maps.drawing.OverlayType.POLYGON],
  //     },
  //     circleOptions: {
  //       fillColor: '#FF0000',
  //       fillOpacity: 0.3,
  //       strokeWeight: 2,
  //       clickable: true,
  //       editable: true,
  //       draggable: true,
  //     },
  //     polygonOptions: {
  //       strokeColor: '#0000FF',
  //       strokeOpacity: 0.8,
  //       strokeWeight: 2,
  //       fillColor: '#0000FF',
  //       fillOpacity: 0.35,
  //       editable: true,
  //       draggable: true,
  //     },
  //   });

  //   this.drawingManager.setMap(this.map);

  //   // Listen for drawn shapes
  //   google.maps.event.addListener(
  //     this.drawingManager,
  //     'overlaycomplete',
  //     (event: any) => {
  //       if (event.type === google.maps.drawing.OverlayType.POLYGON) {
  //         const newPolygon = event.overlay as google.maps.Polygon;
  //         this.drawnPolygons.push(newPolygon);
  //         this.handlePolygonEvents(newPolygon);
  //       }
  //     }
  //   );
  // }

  // Update the startDrawingCircle method
  startDrawingCircle() {
    this.mapDrawingService.startDrawingCircle(this.map);
  }
  // startDrawingCircle() {

  //   // Change cursor to crosshair
  //   this.map.setOptions({ draggableCursor: 'crosshair' });

  //   // Add one-time click listener for the map
  //   const clickListener = this.map.addListener(
  //     'click',
  //     (e: google.maps.MapMouseEvent) => {
  //       // Create circle at clicked location with specified radius
  //       const circle = new google.maps.Circle({
  //         map: this.map,
  //         center: e.latLng,
  //         radius: Number(this.radiusInput),
  //         fillColor: '#FF0000',
  //         fillOpacity: 0.3,
  //         strokeWeight: 2,
  //         strokeColor: '#FF0000',
  //         editable: true,
  //         draggable: true,
  //       });

  //       this.drawnCircles.push(circle);

  //       // Add click listener for deletion
  //       circle.addListener('click', (event: google.maps.MapMouseEvent) => {
  //         event.stop();
  //         const center = circle.getCenter();
  //         if (center) {
  //           const deleteButton = `<button id="deleteCircleBtn" style="
  //           background-color: black;
  //           color: white;
  //           border: none;
  //           padding: 5px 10px;
  //           cursor: pointer;
  //           border-radius: 5px;
  //           font-size: 14px;">Delete Circle</button>`;

  //           this.infoWindow.setContent(deleteButton);
  //           this.infoWindow.setPosition(center);
  //           this.infoWindow.open(this.map);

  //           setTimeout(() => {
  //             const deleteButton = document.getElementById('deleteCircleBtn');
  //             if (deleteButton) {
  //               deleteButton.addEventListener('click', () => {
  //                 circle.setMap(null);
  //                 this.drawnCircles = this.drawnCircles.filter(
  //                   (c) => c !== circle
  //                 );
  //                 this.infoWindow.close();
  //               });
  //             }
  //           }, 100);
  //         }
  //       });

  //       // Reset cursor to default
  //       this.map.setOptions({ draggableCursor: null });

  //       // Remove the click listener after creating the circle
  //       google.maps.event.removeListener(clickListener);
  //     }
  //   );
  // }

  // handlePolygonEvents(polygon: google.maps.Polygon) {
  //   polygon.addListener('click', (event: google.maps.MapMouseEvent) => {
  //     event.stop(); // Prevent hiding when clicking polygon
  //     this.selectedPolygon = polygon;
  //     this.logPolygonCoordinates(polygon)
  //     this.showDeletePopup(polygon, this.getPolygonCenter(polygon));
  //   });
  // }

  // initializeInfoWindow() {
  //   this.infoWindow = new google.maps.InfoWindow();
  // }

  // addPolygonClickListener(polygon: google.maps.Polygon) {
  //   polygon.addListener('click', (event: google.maps.MapMouseEvent) => {
  //     event.stop(); // Prevent hiding when clicking polygon
  //     this.selectedPolygon = polygon;

  //     this.showDeletePopup(polygon, this.getPolygonCenter(polygon));
  //   });
  // }

  // getPolygonCenter(polygon: google.maps.Polygon): google.maps.LatLng {
  //   const path = polygon.getPath();
  //   let bounds = new google.maps.LatLngBounds();
  //   path.forEach((latLng) => bounds.extend(latLng));
  //   return bounds.getCenter();
  // }

  // showDeletePopup(
  //   polygon: google.maps.Polygon,
  //   position: google.maps.LatLng | null
  // ) {
  //   if (!position) return;

  //   // HTML content for the popup
  //   const deleteButton = `<button id="deletePolygonBtn" style="
  //     background-color: black; color: white; border: none; padding: 5px 10px;
  //     cursor: pointer; border-radius: 5px; font-size: 14px;">Delete Polygon</button>`;

  //   this.infoWindow.setContent(deleteButton);
  //   this.infoWindow.setPosition(position);
  //   this.infoWindow.open(this.map);

  //   // Wait for the button to be available in the DOM, then add event listener
  //   setTimeout(() => {
  //     const deleteButton = document.getElementById('deletePolygonBtn');
  //     if (deleteButton) {
  //       deleteButton.addEventListener('click', () =>
  //         this.removePolygon(polygon)
  //       );
  //     }
  //   }, 100);
  // }

  // ------------------------------------

  // logPolygonCoordinates(polygon: google.maps.Polygon) {
  //   const path = polygon.getPath();
  //   const coordinates: { lat: number; lng: number }[] = [];

  //   path.forEach((latLng: google.maps.LatLng) => {
  //     coordinates.push({
  //       lat: latLng.lat(),
  //       lng: latLng.lng(),
  //     });
  //   });

  //   console.log('Polygon Coordinates:', coordinates);
  // }
  logPolygonCoordinates(polygon: google.maps.Polygon) {
    // Compute the bounds of the polygon
    let bounds = new google.maps.LatLngBounds();
    polygon.getPath().forEach((latlng) => bounds.extend(latlng));
    const center = bounds.getCenter();

    // Use the Geocoder to reverse geocode the center point
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: center }, (results: any, status: any) => {
      if (
        status === google.maps.GeocoderStatus.OK &&
        results &&
        results.length > 0
      ) {
        let city = '';
        let state = '';

        // Loop through the address components to extract city and state
        results[0].address_components.forEach((component: any) => {
          if (component.types.indexOf('locality') !== -1) {
            city = component.long_name;
          }
          if (component.types.indexOf('administrative_area_level_1') !== -1) {
            state = component.long_name;
          }
        });

        // Create a Data layer and add the polygon feature with custom properties
        const dataLayer = new google.maps.Data();
        const polygonFeature = new google.maps.Data.Feature({
          geometry: new google.maps.Data.Polygon([
            polygon.getPath().getArray(),
          ]),
        });
        polygonFeature.setProperty('city', city);
        polygonFeature.setProperty('state', state);
        dataLayer.add(polygonFeature);

        // Convert the Data layer features to GeoJSON and log the result
        dataLayer.toGeoJson((geoJson: any) => {
          console.log('GeoJSON output:', JSON.stringify(geoJson));
        });
      } else {
        console.error('Geocoder failed due to: ' + status);
      }
    });
  }

  // hideDeletePopup() {
  //   this.infoWindow.close();
  //   this.selectedPolygon = null;
  // }

  // removePolygon(polygon: google.maps.Polygon) {
  //   polygon.setMap(null); // Remove from map
  //   this.hideDeletePopup();
  //   this.drawnPolygons = this.drawnPolygons.filter((p) => p !== polygon);
  //   console.log('Polygon removed');
  // }
}
