/// <reference types="google.maps" />
import { ElementRef, Injectable } from '@angular/core';
declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class MapDrawingService {
  drawingManager!: google.maps.drawing.DrawingManager;
  drawnPolygons: google.maps.Polygon[] = [];
  drawnCircles: google.maps.Circle[] = [];
  infoWindow!: google.maps.InfoWindow;
  selectedPolygon!: google.maps.Polygon | null;
  selectedCircle!: google.maps.Circle | null;
  savedMapView: any;
  // Keep a reference for the custom circle drawing click listener
  customCircleListener: google.maps.MapsEventListener | null = null;

  constructor() {}

  initializeMap(
    gmapContainer: ElementRef,
    lat?: any,
    lng?: any,
    zoom?: any
  ): google.maps.Map {
    const mapOptions: google.maps.MapOptions = {
      center: { lat: lat || 37.7749, lng: lng || -122.4194 },
      zoom: zoom || 8,
    };

    const map = new google.maps.Map(gmapContainer.nativeElement, mapOptions);

    // Hide any open popup when clicking anywhere on the map (outside drawn shapes)
    map.addListener('click', () => {
      if (this.infoWindow) {
        this.infoWindow.close();
      }
      this.selectedPolygon = null;
    });

    return map;
  }

  initializeDrawingManager(map: any) {
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          google.maps.drawing.OverlayType.POLYGON,
          google.maps.drawing.OverlayType.CIRCLE,
        ],
      },
      circleOptions: {
        fillColor: '#FF0000',
        fillOpacity: 0.3,
        strokeWeight: 2,
        clickable: true,
        editable: true,
        draggable: true,
      },
      polygonOptions: {
        strokeColor: '#0000FF',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#0000FF',
        fillOpacity: 0.35,
        editable: true,
        draggable: true,
      },
    });

    this.drawingManager.setMap(map);

    // Listen for polygon overlays as before.
    google.maps.event.addListener(
      this.drawingManager,
      'overlaycomplete',
      (event: any) => {
        if (event.type === google.maps.drawing.OverlayType.POLYGON) {
          const newPolygon = event.overlay as google.maps.Polygon;
          this.drawnPolygons.push(newPolygon);
          this.handlePolygonEvents(map, newPolygon);
        }
      }
    );

    // Listen for drawing mode changes.
    google.maps.event.addListener(
      this.drawingManager,
      'drawingmode_changed',
      () => {
        // Remove any active popup
        if (this.infoWindow) {
          this.infoWindow.close();
        }
        const mode = this.drawingManager.getDrawingMode();
        if (mode === google.maps.drawing.OverlayType.CIRCLE) {
          // Cancel built-in circle drawing
          this.drawingManager.setDrawingMode(null);
          // Start custom circle drawing
          this.startDrawingCircle(map);
        } else {
          // If not in circle mode, remove any pending custom circle click listener.
          if (this.customCircleListener) {
            google.maps.event.removeListener(this.customCircleListener);
            this.customCircleListener = null;
          }
        }
      }
    );
  }

  startDrawingCircle(map: any) {
    // Remove any existing custom listener to avoid duplicates.
    if (this.customCircleListener) {
      google.maps.event.removeListener(this.customCircleListener);
      this.customCircleListener = null;
    }

    // Set up a one-time click listener for the custom circle drawing.
    this.customCircleListener = map.addListener(
      'click',
      (e: google.maps.MapMouseEvent) => {
        const contentString = `
        <div style="display: flex; flex-direction: column; align-items: center;">
          <input id="circleRadiusInput" type="number" placeholder="Enter radius in meters" style="margin-bottom: 5px; padding: 5px;"/>
          <button id="createCircleBtn" style="
            background-color: black;
            color: white;
            border: none;
            padding: 5px 10px;
            cursor: pointer;
            border-radius: 5px;
            font-size: 14px;
          ">Create Circle</button>
        </div>
      `;
        this.infoWindow.setContent(contentString);
        this.infoWindow.setPosition(e.latLng);
        this.infoWindow.open(map);

        setTimeout(() => {
          const createButton = document.getElementById('createCircleBtn');
          if (createButton) {
            createButton.addEventListener('click', () => {
              const radiusInput = document.getElementById(
                'circleRadiusInput'
              ) as HTMLInputElement;
              const radius = Number(radiusInput.value);
              if (!isNaN(radius) && radius > 0) {
                // Create the circle using the provided radius.
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
                this.drawnCircles.push(circle);

                // When the circle is clicked, mark it as selected and show options.
                circle.addListener(
                  'click',
                  (event: google.maps.MapMouseEvent) => {
                    event.stop(); // Prevent map click event.
                    this.selectedCircle = circle;
                    this.showCircleOptions(map, circle);
                  }
                );

                // Attach a radius_changed listener to update the popup if the circle is selected.
                let resizeTimeout: any;
                circle.addListener('radius_changed', () => {
                  // Only update if this circle is currently selected.
                  if (this.selectedCircle === circle) {
                    // Immediately hide the popup.
                    this.infoWindow.close();
                    // Debounce updating the popup until the user stops resizing.
                    if (resizeTimeout) {
                      clearTimeout(resizeTimeout);
                    }
                    resizeTimeout = setTimeout(() => {
                      // Re-display the popup with updated radius.
                      this.showCircleOptions(map, circle);
                    }, 300);
                  }
                });

                // After creating the circle, remove the custom circle click listener.
                google.maps.event.removeListener(this.customCircleListener);
                this.customCircleListener = null;
                this.infoWindow.close();
              } else {
                alert('Please enter a valid radius.');
              }
            });
          }
        }, 100);
      }
    );
  }

  private showCircleOptions(map: any, circle: google.maps.Circle) {
    const center = circle.getCenter();
    if (!center) {
      return;
    }
    const currentRadius = circle.getRadius();
    const optionsContent = `
    <div style="display: flex; flex-direction: column; align-items: center;">
      <button id="deleteCircleBtn" style="
        background-color: black;
        color: white;
        border: none;
        padding: 5px 10px;
        cursor: pointer;
        border-radius: 5px;
        font-size: 14px;
        margin-bottom: 5px;
      ">Delete Circle (radius: ${currentRadius.toFixed(2)} m)</button>
      <button id="updateCircleBtn" style="
        background-color: black;
        color: white;
        border: none;
        padding: 5px 10px;
        cursor: pointer;
        border-radius: 5px;
        font-size: 14px;
      ">Update Radius (radius: ${currentRadius.toFixed(2)} m)</button>
    </div>
  `;
    this.infoWindow.setContent(optionsContent);
    this.infoWindow.setPosition(center);
    this.infoWindow.open(map);

    // Attach event listeners for the options.
    setTimeout(() => {
      const deleteButton = document.getElementById('deleteCircleBtn');
      if (deleteButton) {
        deleteButton.addEventListener('click', () => {
          circle.setMap(null);
          this.drawnCircles = this.drawnCircles.filter((c) => c !== circle);
          this.infoWindow.close();
        });
      }
      const updateButton = document.getElementById('updateCircleBtn');
      if (updateButton) {
        updateButton.addEventListener('click', () => {
          const updateContent = `
          <div style="display: flex; flex-direction: column; align-items: center;">
            <input id="circleRadiusInput" type="number" placeholder="Enter new radius in meters" style="margin-bottom: 5px; padding: 5px;"/>
            <button id="confirmUpdateCircleBtn" style="
              background-color: black;
              color: white;
              border: none;
              padding: 5px 10px;
              cursor: pointer;
              border-radius: 5px;
              font-size: 14px;
            ">Update (current: ${currentRadius.toFixed(2)} m)</button>
          </div>
        `;
          this.infoWindow.setContent(updateContent);
          setTimeout(() => {
            const confirmUpdateButton = document.getElementById(
              'confirmUpdateCircleBtn'
            );
            if (confirmUpdateButton) {
              confirmUpdateButton.addEventListener('click', () => {
                const radiusInput = document.getElementById(
                  'circleRadiusInput'
                ) as HTMLInputElement;
                const newRadius = Number(radiusInput.value);
                if (!isNaN(newRadius) && newRadius > 0) {
                  circle.setRadius(newRadius);
                  this.infoWindow.close();
                } else {
                  alert('Please enter a valid radius.');
                }
              });
            }
          }, 100);
        });
      }
    }, 100);
  }

  handlePolygonEvents(map: any, polygon: google.maps.Polygon) {
    polygon.addListener('click', (event: google.maps.MapMouseEvent) => {
      event.stop(); // Prevent hiding when clicking polygon
      console.log(this.selectedPolygon);
      this.selectedPolygon = polygon;

      console.log(this.selectedPolygon);

      this.showDeletePopup(map, polygon, this.getPolygonCenter(polygon));
    });
  }

  initializeInfoWindow() {
    this.infoWindow = new google.maps.InfoWindow();
  }

  addPolygonClickListener(map: any, polygon: google.maps.Polygon) {
    polygon.addListener('click', (event: google.maps.MapMouseEvent) => {
      event.stop(); // Prevent hiding when clicking polygon
      this.selectedPolygon = polygon;

      this.showDeletePopup(map, polygon, this.getPolygonCenter(polygon));
    });
  }

  getPolygonCenter(polygon: google.maps.Polygon): google.maps.LatLng {
    const path = polygon.getPath();
    let bounds = new google.maps.LatLngBounds();
    path.forEach((latLng) => bounds.extend(latLng));
    return bounds.getCenter();
  }

  showDeletePopup(
    map: any,
    polygon: google.maps.Polygon,
    position: google.maps.LatLng | null
  ) {
    if (!position) return;

    // HTML content for the popup
    const deleteButton = `<button id="deletePolygonBtn" style="
      background-color: black; color: white; border: none; padding: 5px 10px; 
      cursor: pointer; border-radius: 5px; font-size: 14px;">Delete Polygon</button>`;

    this.infoWindow.setContent(deleteButton);
    this.infoWindow.setPosition(position);
    this.infoWindow.open(map);

    // Wait for the button to be available in the DOM, then add event listener
    setTimeout(() => {
      const deleteButton = document.getElementById('deletePolygonBtn');
      if (deleteButton) {
        deleteButton.addEventListener('click', () =>
          this.removePolygon(polygon)
        );
      }
    }, 100);
  }

  hideDeletePopup() {
    this.infoWindow.close();
    this.selectedPolygon = null;
  }

  removePolygon(polygon: google.maps.Polygon) {
    polygon.setMap(null); // Remove from map
    this.hideDeletePopup();
    this.drawnPolygons = this.drawnPolygons.filter((p) => p !== polygon);
    console.log('Polygon removed');
  }
}
