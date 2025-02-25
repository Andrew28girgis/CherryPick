/// <reference types="google.maps" />
import { ElementRef, EventEmitter, Injectable } from '@angular/core';
declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class MapDrawingService {
  private drawingManager!: google.maps.drawing.DrawingManager;
  private drawnPolygons: google.maps.Polygon[] = [];
  private drawnCircles: google.maps.Circle[] = [];
  private infoWindow!: google.maps.InfoWindow;
  private selectedPolygon!: google.maps.Polygon | null;
  private selectedCircle!: google.maps.Circle | null;
  private circleListener: google.maps.MapsEventListener | null = null;

  onPolygonCreated = new EventEmitter<google.maps.Polygon>();
  onPolygonDeleted = new EventEmitter<google.maps.Polygon>();
  onCircleCreated = new EventEmitter<google.maps.Circle>();
  onCircleDeleted = new EventEmitter<google.maps.Circle>();

  constructor() {}

  initializeMap(
    gmapContainer: ElementRef,
    lat?: any,
    lng?: any,
    zoom?: any
  ): google.maps.Map {
    // set saved coordinates if exists
    const mapOptions: google.maps.MapOptions = {
      center: { lat: lat || 37.7749, lng: lng || -122.4194 },
      zoom: zoom || 8,
    };

    // create the map
    const map = new google.maps.Map(gmapContainer.nativeElement, mapOptions);

    // listen to map clicks to remove any selection or popups
    this.addMapListner(map);

    // initialize popup window
    this.initializeInfoWindow();

    return map;
  }

  initializeDrawingManager(map: any): void {
    // setup drawing manager
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          // include circles creation
          google.maps.drawing.OverlayType.POLYGON,
          // include polygons creation
          google.maps.drawing.OverlayType.CIRCLE,
        ],
      },
      // setup polygons styles
      polygonOptions: {
        strokeColor: '#0000FF',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#0000FF',
        fillOpacity: 0.35,
        editable: true,
        draggable: true,
      },
      // setup circles styles
      circleOptions: {
        fillColor: '#FF0000',
        fillOpacity: 0.3,
        strokeWeight: 2,
        clickable: true,
        editable: true,
        draggable: true,
      },
    });

    // setup the drawing manager to the map
    this.drawingManager.setMap(map);

    // listen for polygons drawing completions to push it into drwan list
    this.addPolygonCompletionListner(map);

    // listen for drawing mode changes (stop drawing, polygon, circle)
    this.addDrawingChangeListner(map);
  }

  private initializeInfoWindow() {
    // iniialize the popup
    this.infoWindow = new google.maps.InfoWindow();
  }

  private drawNewCircle(map: any): void {
    // remove listner if exists
    if (this.circleListener) {
      google.maps.event.removeListener(this.circleListener);
      this.circleListener = null;
    }

    // add listner for new circle creation
    this.addCircleCreationListner(map);
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
    this.drawnPolygons = this.drawnPolygons.filter((p) => p !== polygon);
    // emit deleted polygon to component for any operation
    this.onPolygonDeleted.emit(polygon);
  }

  private hidePopupContent() {
    this.infoWindow.close();
    this.selectedPolygon = null;
    this.selectedCircle = null;
  }

  // listeners

  private addMapListner(map: any): void {
    map.addListener('click', () => {
      // close any popup is shown
      if (this.infoWindow) {
        this.infoWindow.close();
      }

      // remove any selected polygons or circles
      this.selectedPolygon = null;
      this.selectedCircle = null;
    });
  }

  private addDrawingChangeListner(map: any): void {
    google.maps.event.addListener(
      this.drawingManager,
      'drawingmode_changed',
      () => {
        // close any popup if exists
        if (this.infoWindow) {
          this.infoWindow.close();
        }

        // get current drawing mode
        const mode = this.drawingManager.getDrawingMode();
        // check if the current mode is circle mode
        if (mode === google.maps.drawing.OverlayType.CIRCLE) {
          // stop original functionality
          this.drawingManager.setDrawingMode(null);
          // replace the original functionality with custom circle creation
          this.drawNewCircle(map);
        } else {
          // remove circle listner if any drawing mode else
          if (this.circleListener) {
            google.maps.event.removeListener(this.circleListener);
            this.circleListener = null;
          }
        }
      }
    );
  }

  private addPolygonCompletionListner(map: any): void {
    google.maps.event.addListener(
      this.drawingManager,
      'overlaycomplete',
      (event: any) => {
        // check if drawn shape is polygon
        if (event.type === google.maps.drawing.OverlayType.POLYGON) {
          // create new polygon
          const newPolygon = event.overlay as google.maps.Polygon;
          // push the polygon into drawn list
          this.drawnPolygons.push(newPolygon);
          // emit created polygon to the component for any operation
          this.onPolygonCreated.emit(newPolygon);
          // handle event of the polygon
          this.addPolygonClickListener(map, newPolygon);
        }
      }
    );
  }

  private addCircleClickListner(map: any, circle: google.maps.Circle): void {
    circle.addListener('click', (event: google.maps.MapMouseEvent) => {
      // stop map event click
      event.stop();

      // set selected circle for the clicked circle
      this.selectedCircle = circle;
      // display popup with selected circle options
      this.showCircleOptions(map, circle);
    });
  }

  private addCircleSizeChangeListner(
    map: any,
    circle: google.maps.Circle
  ): void {
    let resizeTimeout: any;
    circle.addListener('radius_changed', () => {
      // detect that the resized circle is the selected circle
      if (this.selectedCircle === circle) {
        // close options popup
        this.infoWindow.close();

        // reset the timeout if has value
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }

        // display options again after resizeing
        resizeTimeout = setTimeout(() => {
          this.showCircleOptions(map, circle);
        }, 300);
      }
    });
  }

  private addCreateCircleButtonListner(
    map: any,
    createButton: any,
    e: google.maps.MapMouseEvent
  ): void {
    createButton.addEventListener('click', () => {
      // get radius input
      const radiusInput = document.getElementById(
        'circleRadiusInput'
      ) as HTMLInputElement;
      // set input value as a radius of the circle
      const radius = Number(radiusInput.value);
      // check for radius value
      if (!isNaN(radius) && radius > 0) {
        // create new circle
        const circle = new google.maps.Circle({
          map: map,
          center: e.latLng,
          radius: radius,
          fillColor: '#FF0000',
          fillOpacity: 0.3,
          strokeWeight: 2,
          strokeColor: '#FF0000',
          editable: true,
          draggable: true,
        });

        // add new circle inside drawn circles list
        this.drawnCircles.push(circle);
        // emit new circle to the component for any operations
        this.onCircleCreated.emit(circle);

        // add listner for new circle clicks
        this.addCircleClickListner(map, circle);

        // create listner for circle resizeing to hide circle options
        // and display it again with updated radius
        this.addCircleSizeChangeListner(map, circle);

        // remove creation listner after create the circle
        google.maps.event.removeListener(this.circleListener);
        this.circleListener = null;

        // close the popup if not selected
        this.infoWindow.close();
      } else {
        alert('Please enter a valid radius.');
      }
    });
  }

  private addCircleCreationListner(map: any): void {
    this.circleListener = map.addListener(
      'click',
      (e: google.maps.MapMouseEvent) => {
        // create circle creation popup
        const circleCreationPopup = this.getCircleCreationPopup();
        this.infoWindow.setContent(circleCreationPopup);
        this.infoWindow.setPosition(e.latLng);
        this.infoWindow.open(map);

        const creationButtonInterval = setInterval(() => {
          // get circle creation button after rendering
          const createButton = document.getElementById('createCircleBtn');
          if (createButton) {
            // stop the interval when button created
            clearInterval(creationButtonInterval);

            // create listner for creation button click
            this.addCreateCircleButtonListner(map, createButton, e);
          }
        }, 100);
      }
    );
  }

  private addCircleDeleteButtonListner(
    circle: google.maps.Circle,
    deleteButton: any
  ): void {
    deleteButton.addEventListener('click', () => {
      // remove circle from map
      circle.setMap(null);
      // remove circle from drawn circles list
      this.drawnCircles = this.drawnCircles.filter((c) => c !== circle);
      // emit deleted circle to component for any operation
      this.onCircleDeleted.emit(circle);
      // close the popup
      this.infoWindow.close();
    });
  }

  private addCircleUpdateButtonListner(
    circle: google.maps.Circle,
    confirmUpdateButton: any
  ): void {
    confirmUpdateButton.addEventListener('click', () => {
      // get radius input
      const radiusInput = document.getElementById(
        'circleRadiusInput'
      ) as HTMLInputElement;
      // extract radius value
      const newRadius = Number(radiusInput.value);
      // check for radius value
      if (!isNaN(newRadius) && newRadius > 0) {
        // update circle radius
        circle.setRadius(newRadius);
        // close the popup
        this.infoWindow.close();
      } else {
        alert('Please enter a valid radius.');
      }
    });
  }

  private addPolygonClickListener(map: any, polygon: google.maps.Polygon) {
    polygon.addListener('click', (event: google.maps.MapMouseEvent) => {
      // stop map click event
      event.stop();
      // set selected polygon to clicked polygon
      this.selectedPolygon = polygon;

      // display polygon options popup
      this.showPolygonsOptions(map, polygon, this.getPolygonCenter(polygon));
    });
  }

  private addPolygonDeleteButtonListner(
    deleteButton: any,
    polygon: google.maps.Polygon
  ): void {
    deleteButton.addEventListener('click', () => this.deletePolygon(polygon));
  }

  // options dialogs\

  private showCircleOptions(map: any, circle: google.maps.Circle): void {
    // get the center of the circle
    const center = circle.getCenter();
    if (!center) {
      return;
    }

    // get current circle radius
    const currentRadius = circle.getRadius();
    // get circle options popup
    const optionsContent = this.getSelectedCircleOptionsPopup(currentRadius);
    this.infoWindow.setContent(optionsContent);
    this.infoWindow.setPosition(center);
    this.infoWindow.open(map);

    setTimeout(() => {
      // get delete button
      const deleteButton = document.getElementById('deleteCircleBtn');
      if (deleteButton) {
        // listen for delete button click
        this.addCircleDeleteButtonListner(circle, deleteButton);
      }
      // get update button
      const updateButton = document.getElementById('updateCircleBtn');
      if (updateButton) {
        // listen for update button click
        updateButton.addEventListener('click', () => {
          // get circle update popup
          const updateContent = this.getCircleUpdateButtonPopup();
          this.infoWindow.setContent(updateContent);

          const updateButtonInterval = setInterval(() => {
            // get update button in update popup
            const confirmUpdateButton = document.getElementById(
              'confirmUpdateCircleBtn'
            );
            if (confirmUpdateButton) {
              // remove the interval when button found
              clearInterval(updateButtonInterval);

              // listen for update button clicked
              this.addCircleUpdateButtonListner(circle, confirmUpdateButton);
            }
          }, 100);
        });
      }
    }, 100);
  }

  private showPolygonsOptions(
    map: any,
    polygon: google.maps.Polygon,
    position: google.maps.LatLng | null
  ) {
    if (!position) return;

    const polygonSizeInMiles = this.getPolygonAreaInMiles(polygon);
    // get polygon options popup
    const options = this.getPolygonOptionsPopup(polygonSizeInMiles);

    this.infoWindow.setContent(options);
    this.infoWindow.setPosition(position);
    this.infoWindow.open(map);

    const deleteButtonInterval = setInterval(() => {
      // get delete button
      const deleteButton = document.getElementById('deletePolygonBtn');
      if (deleteButton) {
        // remove the interval when button found
        clearInterval(deleteButtonInterval);
        // add listner on delete button click
        this.addPolygonDeleteButtonListner(deleteButton, polygon);
      }
    }, 100);
  }

  // popups

  private getCircleCreationPopup(): string {
    return `
        <div
          style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem;
          "
        >
          <input
            id="circleRadiusInput"
            type="number"
            placeholder="Enter radius in meters"
            class="form-control"
          />

          <button
            id="createCircleBtn"
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
            Create
          </button>
        </div>
      `;
  }

  private getSelectedCircleOptionsPopup(currentRadius: number): string {
    return `<div
              style="
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 0.75rem;
                padding: 1rem;
              "
            >
              <div style="font-weight: 500">Radius : ${currentRadius.toFixed(
                2
              )} m</div>
              <div style="display: flex; align-items: center; gap: 0.5rem">
                <button
                  id="deleteCircleBtn"
                  style="
                    background-color: rgb(224, 0, 0);
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    cursor: pointer;
                    border-radius: 5px;
                    font-size: 14px;
                  "
                >
                  Delete
                </button>
                <button
                  id="updateCircleBtn"
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
                  Update
                </button>
              </div>
            </div>
          `;
  }

  private getCircleUpdateButtonPopup(): string {
    return `<div
              style="
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.75rem;
                padding: 1rem;
              "
            >
              <input
                id="circleRadiusInput"
                type="number"
                placeholder="Enter new radius in meters"
                class="form-control"
              />

              <button
                id="confirmUpdateCircleBtn"
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
                Update
              </button>
            </div>
          `;
  }

  private getPolygonOptionsPopup(sizeInMiles: number): string {
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
              <div style="font-weight: 500">Size : ${sizeInMiles} m</div>
              <button
                id="deletePolygonBtn"
                style="
                  background-color: rgb(224, 0, 0);
                  color: white;
                  border: none;
                  padding: 5px 10px;
                  cursor: pointer;
                  border-radius: 5px;
                  font-size: 14px;
                "
              >
                Delete
              </button>
            </div>
          `;
  }
}
