/// <reference types="google.maps" />
import { ElementRef, EventEmitter, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { IGeoJson } from 'src/app/shared/models/igeo-json';
import { IMapShape } from 'src/app/shared/models/imap-shape';
import { IProperty } from 'src/app/shared/models/iproperty';
import { GenericMapService } from './generic-map.service';
import { IMapBounds } from 'src/app/shared/interfaces/imap-bounds';
declare const google: any;

interface ShoppingCenter {
  id: number;
  centerName: string;
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root',
})
export class MapDrawingService {
  private drawingManager!: google.maps.drawing.DrawingManager;
  private drawnPolygons: IMapShape[] = [];
  private drawnCircles: IMapShape[] = [];
  private infoWindow!: google.maps.InfoWindow;
  private modes: { [key: string]: google.maps.drawing.OverlayType } = {
    polygon: google.maps.drawing.OverlayType.POLYGON,
    circle: google.maps.drawing.OverlayType.CIRCLE,
  };
  private drawingMode: string | null = null;
  private explorePolygons: IMapShape[] = [];
  private globalPolygons: { id: string; shape: google.maps.Polygon }[] = [];
  private markers: { polygonId: number; marker: google.maps.Marker }[] = [];

  onPolygonCreated = new EventEmitter<IMapShape>();
  onCircleCreated = new EventEmitter<IMapShape>();
  onDrawingCancel = new EventEmitter<void>();
  onMapBoundsChanged = new EventEmitter<IMapBounds>();
  onMapZoomLevelChanged = new EventEmitter<boolean>();

  constructor() {}

  private initializeInfoWindow() {
    this.infoWindow = new google.maps.InfoWindow();
  }

  private getPolygonCenter(polygon: google.maps.Polygon): google.maps.LatLng {
    const path = polygon.getPath();
    let bounds = new google.maps.LatLngBounds();
    path.forEach((latLng) => bounds.extend(latLng));
    return bounds.getCenter();
  }

  private getPolygonAreaInMiles(polygon: google.maps.Polygon): number {
    const path = polygon.getPath();
    const areaInSquareMeters = google.maps.geometry.spherical.computeArea(path);
    const areaInSquareMiles = areaInSquareMeters / 2_589_988;
    return areaInSquareMiles;
  }

  private hidePopupContent() {
    this.infoWindow.close();
  }

  private addMapListener(map: any): void {
    map.addListener('click', () => {
      if (this.infoWindow) {
        this.hidePopupContent();
      }
    });
  }

  private addShapeCompletionListener(map: any): void {
    google.maps.event.addListener(
      this.drawingManager,
      'overlaycomplete',
      (event: any) => {
        if (event.type === google.maps.drawing.OverlayType.POLYGON) {
          const newPolygon = event.overlay as google.maps.Polygon;
          const polygonArea = this.getPolygonAreaInMiles(newPolygon);
          if (polygonArea > 100) {
            this.showLargeSizeAlert(
              map,
              newPolygon,
              this.getPolygonCenter(newPolygon),
              polygonArea
            );
          } else {
            this.showShapeNameOptions(map, newPolygon, false);
            this.addPolygonClickListener(map, newPolygon);
            this.addPolygonChangeListener(map, newPolygon);
            this.addPolygonDoubleClickListener(newPolygon);
          }
          this.drawingManager.setDrawingMode(null);
        }

        if (event.type === google.maps.drawing.OverlayType.CIRCLE) {
          const newCircle = event.overlay as google.maps.Circle;
          const currentRadius = newCircle.getRadius();
          const currentRadiusMiles = currentRadius * 0.000621371;
          const circleAreaMiles = Math.PI * Math.pow(currentRadiusMiles, 2);
          if (circleAreaMiles > 100) {
            this.showLargeSizeAlert(
              map,
              newCircle,
              newCircle.getCenter(),
              circleAreaMiles
            );
          } else {
            this.showShapeNameOptions(map, newCircle, true);
            this.addCircleClickListener(map, newCircle);
            this.addCircleChangeListener(map, newCircle);
            this.addCircleDoubleClickListener(newCircle);
          }

          this.drawingManager.setDrawingMode(null);
        }
      }
    );
  }

  private addCircleClickListener(map: any, circle: google.maps.Circle): void {
    circle.addListener('click', (event: google.maps.MapMouseEvent) => {
      event.stop();
      this.showCircleOptions(map, circle);
    });
  }

  private addCircleChangeListener(map: any, circle: google.maps.Circle): void {
    const oldCircle = circle;
    let resizeTimeout: any;
    circle.addListener('radius_changed', () => {
      this.hidePopupContent();
      const updatedCircle = this.drawnCircles.find((p) => p.shape == oldCircle);
      if (updatedCircle) {
        updatedCircle.shape = circle;
      }
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(() => {
        this.showCircleOptions(map, circle);
      }, 300);
    });

    circle.addListener('dragend', () => {
      const updatedCircle = this.drawnCircles.find((p) => p.shape == oldCircle);
      if (updatedCircle) {
        updatedCircle.shape = circle;
        circle.setDraggable(false);
      }
    });
  }

  private addCircleDoubleClickListener(circle: google.maps.Circle): void {
    circle.addListener('dblclick', (event: google.maps.MapMouseEvent) => {
      event.stop();
      circle.setDraggable(true);
    });
  }

  private addPolygonClickListener(
    map: any,
    polygon: google.maps.Polygon
  ): void {
    polygon.addListener('click', (event: google.maps.MapMouseEvent) => {
      event.stop();
      this.showPolygonsOptions(map, polygon);
    });
  }

  private addPolygonChangeListener(
    map: any,
    polygon: google.maps.Polygon
  ): void {
    const oldPolygon = polygon;
    let resizeTimeout: any;
    let isDragging = false;
    const emitChange = () => {
      const updatedPolygon = this.drawnPolygons.find(
        (p) => p.shape === oldPolygon
      );
      if (updatedPolygon) {
      }
    };
    const path = polygon.getPath();
    path.addListener('set_at', () => {
      if (isDragging) return;
      this.hidePopupContent();
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.showPolygonsOptions(map, polygon);
        emitChange();
      }, 300);
    });

    path.addListener('insert_at', () => {
      if (isDragging) return;
      this.hidePopupContent();
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        emitChange();
      }, 300);
    });

    path.addListener('remove_at', () => {
      if (isDragging) return;
      this.hidePopupContent();
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        emitChange();
      }, 300);
    });

    polygon.addListener('dragstart', () => {
      isDragging = true;
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
        resizeTimeout = null;
      }
    });

    polygon.addListener('dragend', () => {
      isDragging = false;
      emitChange();
      polygon.setDraggable(false);
    });
  }

  private addPolygonDoubleClickListener(polygon: google.maps.Polygon): void {
    polygon.addListener('dblclick', (event: google.maps.MapMouseEvent) => {
      event.stop();
      polygon.setDraggable(true);
    });
  }

  private getShapeTopPoint(
    shape: google.maps.Polygon | google.maps.Circle,
    isCircle: boolean
  ): google.maps.LatLng | null {
    if (isCircle) {
      const circle = shape as google.maps.Circle;
      const center = circle.getCenter();
      const radius = circle.getRadius();

      if (!center) return null;

      return google.maps.geometry.spherical.computeOffset(center, radius, 0);
    } else {
      const polygon = shape as google.maps.Polygon;
      const path = polygon.getPath();

      if (!path || path.getLength() === 0) return null;

      let topPoint = path.getAt(0);

      for (let i = 1; i < path.getLength(); i++) {
        const point = path.getAt(i);
        if (point.lat() > topPoint.lat()) {
          topPoint = point;
        }
      }

      return topPoint;
    }
  }

  private showShapeNameOptions(
    map: google.maps.Map,
    shape: google.maps.Polygon | google.maps.Circle,
    isCircle: boolean
  ): void {
    const position = isCircle
      ? (shape as google.maps.Circle).getCenter()
      : this.getPolygonCenter(shape as google.maps.Polygon);

    if (!position) return;

    const content = this.getShapeNameOptionsPopup();

    this.infoWindow.setContent(content);
    this.infoWindow.setPosition(position);
    this.infoWindow.open(map);

    // Add a one-time click listener on the map to hide the shape and remove its listeners.
    const mapClickListener = map.addListener('click', () => {
      this.setDrawingMode(this.drawingMode);
      // Hide the shape from the map.
      shape.setMap(null);
      // Remove all event listeners for this shape.
      google.maps.event.clearInstanceListeners(shape);
      // Close the infoWindow.
      this.infoWindow.close();
      // Remove this listener.
      google.maps.event.removeListener(mapClickListener);
    });

    setTimeout(() => {
      const saveButton = document.getElementById('saveShapeNameBtn');
      const input = document.getElementById(
        'shapeNameInput'
      ) as HTMLInputElement;

      saveButton!.addEventListener('click', () => {
        const targetArray = isCircle ? this.drawnCircles : this.drawnPolygons;
        targetArray.push({ shape: shape });
        const shapeEntry = targetArray.find((entry) => entry.shape === shape);
        const name = input.value.trim();

        if (shapeEntry) {
          shapeEntry.shape.set('label', name ? name : 'Shape');
        }
        // Remove the one-time map click listener since the shape is saved.
        google.maps.event.removeListener(mapClickListener);

        this.infoWindow.close();

        // emit created shape to the component for any operation
        const event = isCircle ? this.onCircleCreated : this.onPolygonCreated;
        event.emit(shapeEntry);
      });
    });
  }

  private showCircleOptions(map: any, circle: google.maps.Circle): void {
    const position = this.getShapeTopPoint(circle, true);
    if (!position) return;

    const offsetPosition = new google.maps.LatLng(
      position.lat() + 0.003,
      position.lng()
    );

    const optionsContent = this.getShapeOptionsPopup(circle.get('label'));
    this.infoWindow.setContent(optionsContent);
    this.infoWindow.setPosition(offsetPosition);
    this.infoWindow.open(map);

    const deleteButtonInterval = setInterval(() => {
      const deleteButton = document.getElementById('deleteShape');
      if (deleteButton) {
        clearInterval(deleteButtonInterval);
        deleteButton.addEventListener('click', () => {
          circle.setMap(null);
          this.hidePopupContent();

          this.drawnCircles = this.drawnCircles.filter(
            (p) => p.shape !== circle
          );
          this.onDrawingCancel.emit();
        });
      }
    }, 100);
  }

  private showPolygonsOptions(map: any, polygon: google.maps.Polygon): void {
    const position = this.getShapeTopPoint(polygon, false);
    if (!position) return;

    const offsetPosition = new google.maps.LatLng(
      position.lat() + 0.003,
      position.lng()
    );

    const options = this.getShapeOptionsPopup(polygon.get('label'));
    this.infoWindow.setContent(options);
    this.infoWindow.setPosition(offsetPosition);
    this.infoWindow.open(map);

    const deleteButtonInterval = setInterval(() => {
      const deleteButton = document.getElementById('deleteShape');
      if (deleteButton) {
        clearInterval(deleteButtonInterval);
        deleteButton.addEventListener('click', () => {
          polygon.setMap(null);
          this.hidePopupContent();

          this.drawnPolygons = this.drawnPolygons.filter(
            (p) => p.shape !== polygon
          );
          this.onDrawingCancel.emit();
        });
      }
    }, 100);
  }

  private showLargeSizeAlert(
    map: any,
    shape: google.maps.Polygon | google.maps.Circle,
    position: google.maps.LatLng | null,
    size: number
  ): void {
    if (!position) return;

    const options = this.getLargeSizeAlertPopup(size);

    this.infoWindow.setContent(options);
    this.infoWindow.setPosition(position);
    this.infoWindow.open(map);

    const mapClickListener = map.addListener('click', () => {
      shape.setMap(null);
      google.maps.event.clearInstanceListeners(shape);
      this.infoWindow.close();
      this.onDrawingCancel.emit();
      google.maps.event.removeListener(mapClickListener);
    });

    const cancelButtonInterval = setInterval(() => {
      const cancelButton = document.getElementById('cancelLargeSizeAlert');
      if (cancelButton) {
        clearInterval(cancelButtonInterval);
        cancelButton.addEventListener('click', () => {
          shape.setMap(null);
          this.hidePopupContent();
          this.onDrawingCancel.emit();
          google.maps.event.removeListener(mapClickListener);
        });
      }
    }, 100);
  }

  private getShapeNameOptionsPopup(): string {
    return `<div
              style="
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.75rem;
                padding: 1rem;
              "
            >
              <div>To mode this shape double click on it then move.</div>
              <input
                id="shapeNameInput"
                placeholder="Enter shape name"
                type="text"
                class="form-control"
              />

              <button
                id="saveShapeNameBtn"
                style="
                  background-color: black;
                  color: white;
                  border: none;
                  padding: 5px 10px;
                  cursor: pointer;
                  border-radius: 5px;
                  font-size: 14px;
                "
              >
                Save
              </button>
            </div>
          `;
  }

  private getShapeOptionsPopup(label: string): string {
    return `
          <div style="display: flex; align-items: center; gap: 1.5rem; padding: 0.5rem">
            <p style="margin: 0;
            font-weight: 500;">${label}</p>

            <div style="cursor:pointer;" id="deleteShape">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M21.0002 6.72998C20.9802 6.72998 20.9502 6.72998 20.9202 6.72998C15.6302 6.19998 10.3502 5.99998 5.12016 6.52998L3.08016 6.72998C2.66016 6.76998 2.29016 6.46998 2.25016 6.04998C2.21016 5.62998 2.51016 5.26998 2.92016 5.22998L4.96016 5.02998C10.2802 4.48998 15.6702 4.69998 21.0702 5.22998C21.4802 5.26998 21.7802 5.63998 21.7402 6.04998C21.7102 6.43998 21.3802 6.72998 21.0002 6.72998Z"
                  fill="#292D32"
                />
                <path
                  d="M8.49977 5.72C8.45977 5.72 8.41977 5.72 8.36977 5.71C7.96977 5.64 7.68977 5.25 7.75977 4.85L7.97977 3.54C8.13977 2.58 8.35977 1.25 10.6898 1.25H13.3098C15.6498 1.25 15.8698 2.63 16.0198 3.55L16.2398 4.85C16.3098 5.26 16.0298 5.65 15.6298 5.71C15.2198 5.78 14.8298 5.5 14.7698 5.1L14.5498 3.8C14.4098 2.93 14.3798 2.76 13.3198 2.76H10.6998C9.63977 2.76 9.61977 2.9 9.46977 3.79L9.23977 5.09C9.17977 5.46 8.85977 5.72 8.49977 5.72Z"
                  fill="#292D32"
                />
                <path
                  d="M15.2099 22.7501H8.7899C5.2999 22.7501 5.1599 20.8201 5.0499 19.2601L4.3999 9.19007C4.3699 8.78007 4.6899 8.42008 5.0999 8.39008C5.5199 8.37008 5.8699 8.68008 5.8999 9.09008L6.5499 19.1601C6.6599 20.6801 6.6999 21.2501 8.7899 21.2501H15.2099C17.3099 21.2501 17.3499 20.6801 17.4499 19.1601L18.0999 9.09008C18.1299 8.68008 18.4899 8.37008 18.8999 8.39008C19.3099 8.42008 19.6299 8.77007 19.5999 9.19007L18.9499 19.2601C18.8399 20.8201 18.6999 22.7501 15.2099 22.7501Z"
                  fill="#292D32"
                />
                <path
                  d="M13.6601 17.25H10.3301C9.92008 17.25 9.58008 16.91 9.58008 16.5C9.58008 16.09 9.92008 15.75 10.3301 15.75H13.6601C14.0701 15.75 14.4101 16.09 14.4101 16.5C14.4101 16.91 14.0701 17.25 13.6601 17.25Z"
                  fill="#292D32"
                />
                <path
                  d="M14.5 13.25H9.5C9.09 13.25 8.75 12.91 8.75 12.5C8.75 12.09 9.09 11.75 9.5 11.75H14.5C14.91 11.75 15.25 12.09 15.25 12.5C15.25 12.91 14.91 13.25 14.5 13.25Z"
                  fill="#292D32"
                />
              </svg>
            </div>
          </div>
          `;
  }

  private getLargeSizeAlertPopup(sizeInMiles: number): string {
    return `<div
              style="
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: 0.75rem;
                padding: 1rem;
              "
            >
              <div style="font-weight: 500">Shape size must be less than 100 miles.</div>
              <div >Your shape size : <strong>${sizeInMiles.toFixed()} MI</strong></div>
              <button
                id="cancelLargeSizeAlert"
                style="
                  background-color: black;
                  color: white;
                  border: none;
                  padding: 5px 10px;
                  cursor: pointer;
                  border-radius: 5px;
                  font-size: 14px;
                "
              >
                Cancel
              </button>
            </div>
          `;
  }

  private getLocationIconSvg(): string {
    return (
      'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M27.4933 11.2666C26.0933 5.10659 20.72 2.33325 16 2.33325C16 2.33325 16 2.33325 15.9867 2.33325C11.28 2.33325 5.89334 5.09325 4.49334 11.2533C2.93334 18.1333 7.14667 23.9599 10.96 27.6266C12.3733 28.9866 14.1867 29.6666 16 29.6666C17.8133 29.6666 19.6267 28.9866 21.0267 27.6266C24.84 23.9599 29.0533 18.1466 27.4933 11.2666ZM16 17.9466C13.68 17.9466 11.8 16.0666 11.8 13.7466C11.8 11.4266 13.68 9.54658 16 9.54658C18.32 9.54658 20.2 11.4266 20.2 13.7466C20.2 16.0666 18.32 17.9466 16 17.9466Z" fill="#FF4C4C"/>
      </svg>
    `)
    );
  }

  private boundsChangeListener(map: any): void {
    map.addListener('idle', () => {
      const bounds = map.getBounds();
      if (bounds) {
        const northEast = bounds.getNorthEast();
        const southWest = bounds.getSouthWest();
        const zoomLevel = map.getZoom();

        const object: IMapBounds = {
          northEastLat: northEast.lat(),
          northEastLng: northEast.lng(),
          southWestLat: southWest.lat(),
          southWestLng: southWest.lng(),
          zoomLevel: zoomLevel,
        };

        this.onMapBoundsChanged.emit(object);
      }
    });
  }

  private zoomLevelChangeListener(map: any): void {
    map.addListener('zoom_changed', () => {
      const zoomLevel = map.getZoom();
      if (zoomLevel <= 6) {
        this.onMapZoomLevelChanged.emit(true);
      } else {
        this.onMapZoomLevelChanged.emit(false);
      }
    });
  }

  private zoomChangeListener(map: any): void {
    map.addListener('zoom_changed', () => {
      const zoomLevel = map.getZoom();
    });
  }

  initializeMap(gmapContainer: ElementRef): google.maps.Map {
    const mapOptions: google.maps.MapOptions = {
      center: { lat: 38.889805, lng: -77.009056 },
      zoom: 8,
      disableDefaultUI: true,
    };

    const map = new google.maps.Map(gmapContainer.nativeElement, mapOptions);

    this.addMapListener(map);
    this.boundsChangeListener(map);
    this.zoomLevelChangeListener(map);
    this.zoomChangeListener(map);

    this.initializeInfoWindow();

    return map;
  }

  initializeDrawingManager(map: any): void {
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        strokeColor: '#0000FF',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#0000FF',
        fillOpacity: 0.35,
        editable: true,
        draggable: false,
      },
      circleOptions: {
        fillColor: '#FF0000',
        fillOpacity: 0.3,
        strokeWeight: 2,
        clickable: true,
        editable: true,
        draggable: false,
      },
    });

    this.drawingManager.setMap(map);

    this.addShapeCompletionListener(map);
  }

  setDrawingMode(shape: string | null) {
    this.drawingMode = shape ?? null;
    this.drawingManager.setDrawingMode(shape ? this.modes[shape] : null);
  }

  convertCircleToPolygon(
    map: any,
    circle: google.maps.Circle
  ): google.maps.Polygon {
    const center = circle.getCenter();
    const radius = circle.getRadius();

    const segmentLength = 20;
    const numSegments = Math.max(
      12,
      Math.round((2 * Math.PI * radius) / segmentLength)
    );

    const paths: google.maps.LatLngLiteral[] = [];

    for (let i = 0; i < numSegments; i++) {
      const angle = (i * 360) / numSegments;
      const point = google.maps.geometry.spherical.computeOffset(
        center,
        radius,
        angle
      );

      paths.push({ lat: point.lat(), lng: point.lng() });
    }

    const newPolygon: google.maps.Polygon = new google.maps.Polygon({
      paths: paths,
      map: map,
      fillColor: '#FF0000',
      strokeColor: '#FF0000',
      strokeWeight: 2,
      editable: true,
      draggable: true,
    });

    newPolygon.setMap(null);

    return newPolygon;
  }

  convertPolygonToGeoJson(polygon: google.maps.Polygon): Promise<IGeoJson> {
    return new Promise((resolve, reject) => {
      let bounds = new google.maps.LatLngBounds();
      polygon.getPath().forEach((latlng) => bounds.extend(latlng));
      const center = bounds.getCenter();

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: center }, (results: any, status: any) => {
        if (
          status === google.maps.GeocoderStatus.OK &&
          results &&
          results.length > 0
        ) {
          let city = '';
          let state = '';

          results[0].address_components.forEach((component: any) => {
            if (component.types.includes('locality')) {
              city = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
              state = component.short_name;
            }
          });

          const dataLayer = new google.maps.Data();
          const polygonFeature = new google.maps.Data.Feature({
            geometry: new google.maps.Data.Polygon([
              polygon.getPath().getArray(),
            ]),
          });

          polygonFeature.setProperty('city', city);
          polygonFeature.setProperty('state', state);
          dataLayer.add(polygonFeature);

          dataLayer.toGeoJson((geoJson: any) => {
            resolve(geoJson.features[0]);
          });
        } else {
          reject(new Error('Geocoder failed due to: ' + status));
        }
      });
    });
  }

  getDrawnList(): boolean {
    return this.drawnPolygons.length > 0 || this.drawnCircles.length > 0;
  }

  clearDrawnLists(): void {
    this.drawnPolygons.forEach((p) => p.shape.setMap(null));
    this.drawnCircles.forEach((c) => c.shape.setMap(null));
    this.drawnPolygons = [];
    this.drawnCircles = [];
  }

  completelyRemoveExplorePolygon(): void {
    this.explorePolygons.forEach((p) => p.shape.setMap(null));
    this.explorePolygons = [];
  }

  insertGlobalPolygon(
    map: any,
    id: string,
    coordinates: any,
    name: string
  ): void {
    const shape = this.globalPolygons.find((p) => p.id === id);
    if (shape) {
      return;
    }

    const polygon: google.maps.Polygon = new google.maps.Polygon({
      paths: coordinates,
      strokeColor: '#AA00FF',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#AA00FF',
      fillOpacity: 0.35,
      editable: false,
      draggable: false,
    });

    // Set the polygon on the map
    polygon.setMap(map);
    // Create a LatLngBounds object to compute the bounds
    const bounds = new google.maps.LatLngBounds();
    coordinates.forEach((coordinate: any) => {
      bounds.extend(new google.maps.LatLng(coordinate.lat, coordinate.lng));
    });

    // Get the center of the bounds
    const center = bounds.getCenter();

    // Add the name label above the polygon
    const label = new google.maps.Marker({
      position: center,
      map: map,
      label: {
        text: name,
        color: '#000',
        fontSize: '14px',
        fontWeight: 'bold',
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 0, // Use a scale of 0 to hide the marker icon (we only want the label)
        fillColor: 'transparent',
        strokeColor: 'transparent',
      },
    });
    label.setVisible(false);

    google.maps.event.addListener(map, 'zoom_changed', () => {
      const zoomLevel = map.getZoom();

      // Set the label's visibility based on the zoom level
      if (zoomLevel < 15) {
        // You can adjust this threshold value as needed
        label.setVisible(false); // Hide the label for low zoom levels
      } else {
        label.setVisible(true); // Show the label for higher zoom levels
      }
    });

    // push the polygon into drawn list
    this.globalPolygons.push({ id: id, shape: polygon });
  }

  completelyRemoveGlobalPolygon(): void {
    this.globalPolygons.forEach((p) => p.shape.setMap(null));
    this.globalPolygons = [];
  }

  insertExplorePolygon(
    polygonId: number,
    coordinates: any,
    name: string
  ): void {
    const shape = this.explorePolygons.find((p) => p.id === polygonId);
    if (shape) {
      return;
    }
    // create new polygon
    const polygon: google.maps.Polygon = new google.maps.Polygon({
      paths: coordinates,
      strokeColor: '#AA00FF',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#AA00FF',
      fillOpacity: 0.35,
      editable: false,
      draggable: false,
    });

    // Set the polygon on the map
    polygon.setMap(null);

    polygon.set('label', name.trim().length > 0 ? name : 'Shape');

    // push the polygon into drawn list
    this.explorePolygons.push({ id: polygonId, shape: polygon });
  }

  insertExplorePolygonToMyPolygons(
    map: any,
    polygonId: number,
    coordinates: any,
    name: string
  ): void {
    // create new polygon
    const polygon: google.maps.Polygon = new google.maps.Polygon({
      paths: coordinates,
      strokeColor: '#AA00FF',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#AA00FF',
      fillOpacity: 0.35,
      editable: false,
      draggable: false,
    });

    // Set the polygon on the map
    polygon.setMap(map);

    polygon.set('label', name.trim().length > 0 ? name : 'Shape');

    // push the polygon into drawn list
    this.drawnPolygons.push({ id: polygonId, shape: polygon });

    this.addPolygonClickListener(map, polygon);
    this.addPolygonChangeListener(map, polygon);
    this.addPolygonDoubleClickListener(polygon);
  }

  hideShapeFromMap(id: number): void {
    // get shape from the drawn list
    const shape =
      this.drawnPolygons.find((p) => p.id == id) ||
      this.drawnCircles.find((c) => c.id == id) ||
      this.explorePolygons.find((p) => p.id == id);
    // debugger
    if (shape) {
      // remove the shape from the map view
      shape.shape.setMap(null);
    }
  }

  updateMapZoomLevel(map: any, zoomLevel: number): void {
    map.setZoom(zoomLevel);
  }

  updateMapZoom(map: any, coordinates: any[]): void {
    if (map) {
      const bounds = new google.maps.LatLngBounds();

      // Extend the bounds to include each coordinate
      coordinates.forEach((point) => {
        bounds.extend(point);
      });

      // Adjust the map to fit the bounds with optional padding
      map.fitBounds(bounds, { padding: 20 });
    }
  }

  updateMapCenter(map: any, center: any): void {
    if (map) {
      const newCenter = center ? center : { lat: 37.7749, lng: -122.4194 };
      map.setCenter(newCenter);
    }
  }
  displayShapeOnMap(id: number, map: any): void {
    const shape =
      this.drawnPolygons.find((p) => p.id == id) ||
      this.drawnCircles.find((c) => c.id == id) ||
      this.explorePolygons.find((p) => p.id == id);
    if (shape) {
      shape.shape.setMap(map);
    }
  }

  hideMyPolygons(): void {
    this.drawnPolygons.forEach((d) => d.shape.setMap(null));
    this.drawnCircles.forEach((c) => c.shape.setMap(null));
  }

  displayMyPolygons(map: any): void {
    this.drawnPolygons.forEach((d) => d.shape.setMap(map));
    this.drawnCircles.forEach((c) => c.shape.setMap(map));
  }

  removePolygonWithId(polygonId: number): void {
    this.hideShapeFromMap(polygonId);
    this.drawnPolygons = this.drawnPolygons.filter((p) => p.id != polygonId);
  }

  removePolygonWithIndex(index: number): void {
    let polygon = this.drawnPolygons[index];
    if (polygon) {
      polygon.shape.setMap(null);
      this.drawnPolygons.splice(index, 1);
    }
  }

  removeCircleWithIndex(index: number): void {
    let circle = this.drawnCircles[index];
    if (circle) {
      circle.shape.setMap(null);
      this.drawnCircles.splice(index, 1);
    }
  }

  isMarkersExists(polygonId: number): boolean {
    const markers = this.markers.filter((m) => m.polygonId == polygonId);
    if (markers && markers.length > 0) {
      return true;
    }
    return false;
  }

  createMarker(
    map: any,
    polygonId: number,
    propertyData: ShoppingCenter
  ): void {
    const icon = this.getLocationIconSvg();
    let marker = new google.maps.Marker({
      map,
      position: {
        lat: Number(propertyData.latitude),
        lng: Number(propertyData.longitude),
      },
      icon: icon,
      // Use a higher zIndex to bring the marker “on top” of others
      zIndex: 999999,
    });

    marker.propertyData = propertyData;
    this.markers.push({ polygonId: polygonId, marker: marker });
  }

  displayMarker(polygonId: number, map: any): void {
    const markers = this.markers.filter((m) => m.polygonId == polygonId);
    if (markers && markers.length > 0) {
      markers.forEach((m) => m.marker.setMap(map));
    }
  }

  removeMarkers(polygonId: number): void {
    const markers = this.markers.filter((m) => m.polygonId == polygonId);
    markers.forEach((m) => m.marker.setMap(null));
  }

  completelyRemoveMarkers(polygonId: number): void {
    this.removeMarkers(polygonId);
    this.markers = this.markers.filter((m) => m.polygonId != polygonId);
  }

  get getDrawnPolygons() {
    return this.drawnPolygons;
  }

  get getDrawnCircles() {
    return this.drawnCircles;
  }
  displayPolygon(coordinates: any, map: any): void {
    // Convert the geoJSON coordinates into a google.maps.LatLng[] array
    // const coordinates = polygon.geoJson?.geometry.coordinates[0].map((coord: number[]) => {
    //   return { lat: coord[1], lng: coord[0] };
    // });

    const polygonObj = new google.maps.Polygon({
      paths: coordinates,
      strokeColor: '#4d65b4',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#4d65b4',
      fillOpacity: 0.35,
      editable: false,
      draggable: false,
      // You can set other options like strokeColor, fillColor, etc.
    });

    polygonObj.setMap(map);
    // debugger
    // return polygonObj;
  }
  hidePolygon(polygonObj: google.maps.Polygon): void {
    polygonObj.setMap(null);
  }

  getMapZoomLevel(map: any): number {
    return map.getZoom() || 0;
  }
}
