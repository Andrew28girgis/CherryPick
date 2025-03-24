/// <reference types="google.maps" />
import { ElementRef, EventEmitter, Injectable } from '@angular/core';
import { IGeoJson } from 'src/app/shared/models/igeo-json';
import { IMapShape } from 'src/app/shared/models/imap-shape';
declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class CampaignDrawingService {
  private drawingManager!: google.maps.drawing.DrawingManager;
  private drawnPolygons: IMapShape[] = [];
  private drawnCircles: IMapShape[] = [];
  // private explorePolygons: IMapShape[] = [];
  // private markers: { polygonId: number; marker: google.maps.Marker }[] = [];
  // tempMarkers: google.maps.Marker[] = [];
  private infoWindow!: google.maps.InfoWindow;

  private modes: { [key: string]: google.maps.drawing.OverlayType } = {
    polygon: google.maps.drawing.OverlayType.POLYGON,
    circle: google.maps.drawing.OverlayType.CIRCLE,
  };

  onPolygonCreated = new EventEmitter<IMapShape>();
  onPolygonChanged = new EventEmitter<IMapShape>();
  onPolygonDeleted = new EventEmitter<IMapShape>();
  onCircleCreated = new EventEmitter<IMapShape>();
  onCircleChanged = new EventEmitter<IMapShape>();
  onCircleDeleted = new EventEmitter<IMapShape>();
  onDrawingCancel = new EventEmitter<void>();

  constructor() {}

  setDrawingMode(shape: string) {
    this.drawingManager.setDrawingMode(this.modes[shape] || null);
  }

  initializeMap(gmapContainer: ElementRef): google.maps.Map {
    // set saved coordinates if exists
    const mapOptions: google.maps.MapOptions = {
      center: { lat: 38.889805, lng: -77.009056 },
      zoom: 8,
      disableDefaultUI: true,
    };

    // create the map
    const map = new google.maps.Map(gmapContainer.nativeElement, mapOptions);

    // listen to map clicks to remove any selection or popups
    this.addMapListener(map);

    // initialize popup window
    this.initializeInfoWindow();

    return map;
  }

  initializeDrawingManager(map: any): void {
    // setup drawing manager
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,

      // setup polygons styles
      polygonOptions: {
        strokeColor: '#0000FF',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#0000FF',
        fillOpacity: 0.35,
        editable: true,
        draggable: false,
      },
      // setup circles styles
      circleOptions: {
        fillColor: '#FF0000',
        fillOpacity: 0.3,
        strokeWeight: 2,
        clickable: true,
        editable: true,
        draggable: false,
      },
    });

    // setup the drawing manager to the map
    this.drawingManager.setMap(map);

    // listen for polygons drawing completions to push it into drwan list
    this.addShapeCompletionListener(map);
  }

  updateMapCenter(map: any, center: any): void {
    if (map) {
      const newCenter = center ? center : { lat: 38.889805, lng: -77.009056 };
      map.setCenter(newCenter);
    }
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

  clearDrawnLists(): void {
    this.drawnPolygons.forEach((p) => p.shape.setMap(null));
    this.drawnCircles.forEach((c) => c.shape.setMap(null));
    this.drawnPolygons = [];
    this.drawnCircles = [];
  }

  updatePolygonId(id: number, circle: boolean): void {
    if (circle) {
      const shape = this.drawnCircles[this.drawnCircles.length - 1];
      shape.id = id;
    } else {
      const shape = this.drawnPolygons[this.drawnPolygons.length - 1];
      shape.id = id;
    }
  }

  convertCircleToPolygon(
    map: any,
    circle: google.maps.Circle
  ): google.maps.Polygon {
    const center = circle.getCenter();
    // Radius in meters
    const radius = circle.getRadius();

    // Desired length of each segment in meters
    const segmentLength = 20;
    // Dynamically calculate the number of segments
    const numSegments = Math.max(
      12,
      Math.round((2 * Math.PI * radius) / segmentLength)
    );

    const paths: google.maps.LatLngLiteral[] = [];

    // Compute points around the circle
    for (let i = 0; i < numSegments; i++) {
      const angle = (i * 360) / numSegments;
      const point = google.maps.geometry.spherical.computeOffset(
        center,
        radius,
        angle
      );

      paths.push({ lat: point.lat(), lng: point.lng() });
    }

    // create new polygon
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
      // create bounds to calculate the polygon's center
      let bounds = new google.maps.LatLngBounds();
      polygon.getPath().forEach((latlng) => bounds.extend(latlng));
      const center = bounds.getCenter();

      // use geocoder to get location details from the center
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: center }, (results: any, status: any) => {
        if (
          status === google.maps.GeocoderStatus.OK &&
          results &&
          results.length > 0
        ) {
          let city = '';
          let state = '';

          // extract city and state from geocoding results
          results[0].address_components.forEach((component: any) => {
            if (component.types.includes('locality')) {
              city = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
              state = component.short_name;
            }
          });

          // create a Google Maps Data Layer
          const dataLayer = new google.maps.Data();
          const polygonFeature = new google.maps.Data.Feature({
            geometry: new google.maps.Data.Polygon([
              polygon.getPath().getArray(),
            ]),
          });

          // set city and state properties
          polygonFeature.setProperty('city', city);
          polygonFeature.setProperty('state', state);
          dataLayer.add(polygonFeature);

          // convert the polygon feature to GeoJSON
          dataLayer.toGeoJson((geoJson: any) => {
            resolve(geoJson.features[0]);
          });
        } else {
          reject(new Error('Geocoder failed due to: ' + status));
        }
      });
    });
  }

  private initializeInfoWindow() {
    // iniialize the popup
    this.infoWindow = new google.maps.InfoWindow();
  }

  private getPolygonCenter(polygon: google.maps.Polygon): google.maps.LatLng {
    // get polygon as lat and lng points
    const path = polygon.getPath();
    // create object that helps in lat and lng calculations
    let bounds = new google.maps.LatLngBounds();
    // iterate on all point to add then inside the lat and lng object (bounds)
    path.forEach((latLng) => bounds.extend(latLng));
    // return the center
    return bounds.getCenter();
  }

  private getPolygonAreaInMiles(polygon: google.maps.Polygon): number {
    // get polygon as lat and lng points
    const path = polygon.getPath();
    // Compute area in square meters
    const areaInSquareMeters = google.maps.geometry.spherical.computeArea(path);
    // Convert square meters to square miles
    const areaInSquareMiles = areaInSquareMeters / 2_589_988;
    // return size
    return areaInSquareMiles;
  }

  private deletePolygon(polygon: google.maps.Polygon) {
    // remove polygon from map
    polygon.setMap(null);
    // remove popup
    this.hidePopupContent();
    // remove polygon from drawn polygons list
    const deletedPolygon = this.drawnPolygons.find((p) => p.shape == polygon);
    this.drawnPolygons = this.drawnPolygons.filter((p) => p.shape !== polygon);
    // emit deleted polygon to component for any operation
    this.onPolygonDeleted.emit(deletedPolygon);
  }

  private hidePopupContent() {
    this.infoWindow.close();
  }

  // listeners

  private addMapListener(map: any): void {
    map.addListener('click', () => {
      // close any popup is shown
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
        // check if drawn shape is polygon
        if (event.type === google.maps.drawing.OverlayType.POLYGON) {
          // create new polygon
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
            // push the polygon into drawn list
            this.drawnPolygons.push({ shape: newPolygon });
            // take shape name
            this.showShapeNameOptions(map, newPolygon, false);
            // handle click event of the polygon
            this.addPolygonClickListener(map, newPolygon);
            // handle change event of the polygon
            this.addPolygonChangeListener(map, newPolygon);
            this.addPolygonDoubleClickListener(newPolygon);
          }
          this.drawingManager.setDrawingMode(null);
        }
        if (event.type === google.maps.drawing.OverlayType.CIRCLE) {
          // create new circle
          const newCircle = event.overlay as google.maps.Circle;

          // get current circle radius
          const currentRadius = newCircle.getRadius();
          // convert radius into miles
          const currentRadiusMiles = currentRadius * 0.000621371;
          // calculate circle area
          const circleAreaMiles = Math.PI * Math.pow(currentRadiusMiles, 2);

          if (circleAreaMiles > 100) {
            this.showLargeSizeAlert(
              map,
              newCircle,
              newCircle.getCenter(),
              circleAreaMiles
            );
          } else {
            // push the circle into drawn list
            this.drawnCircles.push({ shape: newCircle });
            // debugger;
            // take shape name
            this.showShapeNameOptions(map, newCircle, true);
            // handle click event of the circle
            this.addCircleClickListener(map, newCircle);
            // handle change event of the circle
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
      // stop map event click
      event.stop();
      debugger;
      // display popup with selected circle options
      this.showCircleOptions(map, circle);
    });
  }

  private addCircleChangeListener(map: any, circle: google.maps.Circle): void {
    const oldCircle = circle;
    let resizeTimeout: any;
    // listen for radius changes
    circle.addListener('radius_changed', () => {
      // close options popup
      this.hidePopupContent();

      // emti circle change to component for any operations
      const updatedCircle = this.drawnCircles.find((p) => p.shape == oldCircle);
      if (updatedCircle) {
        updatedCircle.shape = circle;
        this.onCircleChanged.emit(updatedCircle);
      }
      // reset the timeout if has value
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      // display options again after resizeing
      resizeTimeout = setTimeout(() => {
        this.showCircleOptions(map, circle);
      }, 300);
    });

    // listen for circle draging
    circle.addListener('dragend', () => {
      const updatedCircle = this.drawnCircles.find((p) => p.shape == oldCircle);
      if (updatedCircle) {
        updatedCircle.shape = circle;
        circle.setDraggable(false);
        this.onCircleChanged.emit(updatedCircle);
      }
    });
  }

  private addCircleDoubleClickListener(circle: google.maps.Circle): void {
    circle.addListener('dblclick', (event: google.maps.MapMouseEvent) => {
      event.stop(); // prevent propagation of the event
      circle.setDraggable(true);
    });
  }

  private addPolygonClickListener(
    map: any,
    polygon: google.maps.Polygon
  ): void {
    polygon.addListener('click', (event: google.maps.MapMouseEvent) => {
      // stop map click event
      event.stop();

      // display polygon options popup
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
        this.onPolygonChanged.emit(updatedPolygon);
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
      event.stop(); // prevent propagation of the event
      polygon.setDraggable(true);
    });
  }

  // options dialogs
  private getShapeTopPoint(
    shape: google.maps.Polygon | google.maps.Circle,
    isCircle: boolean
  ): google.maps.LatLng | null {
    if (isCircle) {
      const circle = shape as google.maps.Circle;
      const center = circle.getCenter();
      const radius = circle.getRadius();

      if (!center) return null;

      // Calculate the northernmost point of the circle (top point)
      return google.maps.geometry.spherical.computeOffset(
        center,
        radius,
        0 // 0 degrees = north
      );
    } else {
      const polygon = shape as google.maps.Polygon;
      const path = polygon.getPath();

      if (!path || path.getLength() === 0) return null;

      // Find the northernmost point (minimum latitude) in the polygon
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
    const position = this.getShapeTopPoint(shape, isCircle);

    if (!position) return;

    const offsetPosition = new google.maps.LatLng(
      position.lat() + 0.003,
      position.lng()
    );

    const content = this.getShapeNameOptionsPopup();

    this.infoWindow.setContent(content);
    this.infoWindow.setPosition(offsetPosition);
    this.infoWindow.open(map);

    const deleteButtonInterval = setInterval(() => {
      // get delete button
      const deleteButton = document.getElementById('deleteShape');
      if (deleteButton) {
        // remove the interval when button found
        clearInterval(deleteButtonInterval);
        // add listener on delete button click
        deleteButton.addEventListener('click', () => {
          shape.setMap(null);
          // remove popup
          this.hidePopupContent();
          // remove polygon from drawn polygons list
          let list = isCircle ? this.drawnCircles : this.drawnPolygons;
          const deletedPolygon = list.find((p) => p.shape == shape);
          const index = list.findIndex((p) => p.shape === shape);
          if (index !== -1) {
            list.splice(index, 1); // Removes the item in place
          }
          debugger;
          this.onDrawingCancel.emit();
          // emit deleted polygon to component for any operation
          isCircle
            ? this.onCircleDeleted.emit(deletedPolygon)
            : this.onPolygonDeleted.emit(deletedPolygon);
        });
      }
    }, 100);

    // Add a one-time click listener on the map to hide the shape and remove its listeners.

    setTimeout(() => {
      google.maps.event.clearListeners(map, 'click');

      const mapClickListener = map.addListener('click', () => {
        const input = document.getElementById(
          'shapeNameInput'
        ) as HTMLInputElement;
        debugger;
        const targetArray = isCircle ? this.drawnCircles : this.drawnPolygons;
        const shapeEntry = targetArray.find((entry) => entry.shape === shape);
        // debugger
        // const name = input.value.trim();

        if (shapeEntry) {
          shapeEntry.shape.set(
            'label',
            input?.value?.trim().length > 0 ? input.value.trim() : 'Shape'
          );
          // debugger
        }
        // Remove the one-time map click listener since the shape is saved.

        // emit created shape to the component for any operation
        const event = isCircle ? this.onCircleCreated : this.onPolygonCreated;
        event.emit(shapeEntry);
        // Hide the shape from the map.
        // shape.setMap(null);
        // Remove all event listeners for this shape.
        // google.maps.event.clearInstanceListeners(shape);
        // Close the infoWindow.
        this.infoWindow.close();
        this.addMapListener(map);
        // Remove this listener.
        google.maps.event.removeListener(mapClickListener);
      });
    });
  }

  private showCircleOptions(map: any, circle: google.maps.Circle): void {
    // get the center of the circle
    const position = this.getShapeTopPoint(circle, true);

    if (!position) return;

    const offsetPosition = new google.maps.LatLng(
      position.lat() + 0.003,
      position.lng()
    );

    // get current circle radius
    const currentRadius = circle.getRadius();
    // convert radius into miles
    const currentRadiusMiles = currentRadius * 0.000621371;
    // calculate circle area
    const circleAreaMiles = Math.PI * Math.pow(currentRadiusMiles, 2);

    // get circle options popup
    const optionsContent = this.getShapeOptionsPopup(circle.get('label'));
    this.infoWindow.setContent(optionsContent);
    this.infoWindow.setPosition(offsetPosition);
    this.infoWindow.open(map);

    const deleteButtonInterval = setInterval(() => {
      // get delete button
      const deleteButton = document.getElementById('deleteShape');
      if (deleteButton) {
        // remove the interval when button found
        clearInterval(deleteButtonInterval);
        // add listener on delete button click
        deleteButton.addEventListener('click', () => {
          circle.setMap(null);
          // remove popup
          this.hidePopupContent();
          // remove polygon from drawn polygons list
          // let list = this.drawnCircles;
          const deletedPolygon = this.drawnCircles.find(
            (p) => p.shape == circle
          );
          this.drawnCircles = this.drawnCircles.filter(
            (p) => p.shape !== circle
          );
          debugger;
          this.onDrawingCancel.emit();
          this.onCircleDeleted.emit(deletedPolygon);

          // emit deleted polygon to component for any operation
          // this.onPolygonDeleted.emit(deletedPolygon);
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
    const polygonSizeInMiles = this.getPolygonAreaInMiles(polygon);
    // get polygon options popup
    const options = this.getShapeOptionsPopup(polygon.get('label'));

    this.infoWindow.setContent(options);
    this.infoWindow.setPosition(offsetPosition);
    this.infoWindow.open(map);

    const deleteButtonInterval = setInterval(() => {
      // get delete button
      const deleteButton = document.getElementById('deleteShape');
      if (deleteButton) {
        // remove the interval when button found
        clearInterval(deleteButtonInterval);
        // add listener on delete button click
        deleteButton.addEventListener('click', () => {
          polygon.setMap(null);
          // remove popup
          this.hidePopupContent();
          // remove polygon from drawn polygons list
          // let list = this.drawnPolygons;
          const deletedPolygon = this.drawnPolygons.find(
            (p) => p.shape == polygon
          );
          this.drawnPolygons = this.drawnPolygons.filter(
            (p) => p.shape !== polygon
          );
          this.onDrawingCancel.emit();
          this.onPolygonDeleted.emit(deletedPolygon);

          // emit deleted polygon to component for any operation
          // this.onPolygonDeleted.emit(deletedPolygon);
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

    // get options popup
    const options = this.getLargeSizeAlertPopup(size);

    this.infoWindow.setContent(options);
    this.infoWindow.setPosition(position);
    this.infoWindow.open(map);

    // Add a one-time click listener on the map to hide the shape and remove its listeners.
    const mapClickListener = map.addListener('click', () => {
      // Hide the shape from the map.
      shape.setMap(null);
      // Remove all event listeners for this shape.
      google.maps.event.clearInstanceListeners(shape);
      // Close the infoWindow.
      this.infoWindow.close();
      this.onDrawingCancel.emit();
      // Remove this listener.
      google.maps.event.removeListener(mapClickListener);
    });

    const cancelButtonInterval = setInterval(() => {
      // get cancel button
      const cancelButton = document.getElementById('cancelLargeSizeAlert');
      if (cancelButton) {
        // remove the interval when button found
        clearInterval(cancelButtonInterval);
        // add listener on delete button click
        cancelButton.addEventListener('click', () => {
          shape.setMap(null);
          this.hidePopupContent();
          this.onDrawingCancel.emit();
          // Remove this listener.
          google.maps.event.removeListener(mapClickListener);
        });
      }
    }, 100);
  }

  // popups

  private getShapeNameOptionsPopup(): string {
    return `<div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem">
  <input
    id="shapeNameInput"
    placeholder="Enter shape name"
    type="text"
    class="form-control"
    style="border: none; background-color: transparent; box-shadow: none"
  />

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

  private getShapeOptionsPopup(label: string): string {
    return `<div style="display: flex; align-items: center; gap: 1.5rem; padding: 0.5rem">
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

  // others

  gettDrawnList(): number {
    return this.drawnPolygons.length || this.drawnCircles.length || 0;
  }
  getDrawnList(): boolean {
    return this.drawnPolygons.length > 0 || this.drawnCircles.length > 0;
  }
}
