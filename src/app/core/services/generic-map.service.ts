/// <reference types="google.maps" />
import { ElementRef, EventEmitter, Injectable } from '@angular/core';
import { IMapBounds } from 'src/app/shared/interfaces/imap-bounds';
import { IMapState } from 'src/app/shared/interfaces/imap-state';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class GenericMapService {
  private tempCircles: { id: any; circle: google.maps.Circle }[] = [];

  onMapBoundsChanged = new EventEmitter<IMapBounds>();
  onMapZoomLevelChanged = new EventEmitter<number>();

  constructor() {}

  initializeMap(gmapContainer: ElementRef): google.maps.Map {
    const mapOptions: google.maps.MapOptions = {
      center: { lat: 38.889805, lng: -77.009056 },
      zoom: 8,
      disableDefaultUI: true,
    };

    const map: google.maps.Map = new google.maps.Map(
      gmapContainer.nativeElement,
      mapOptions
    );

    return map;
  }

  initializeStaticDrawingManager(): google.maps.drawing.DrawingManager {
    const drawingManager = new google.maps.drawing.DrawingManager({
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

    return drawingManager;
  }

  addBoundsChangeListener(map: google.maps.Map): void {
    if (!map) return;
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
          zoomLevel: zoomLevel ?? 0,
        };

        this.onMapBoundsChanged.emit(object);
      }
    });
  }

  addZoomLevelChangeListener(map: google.maps.Map): void {
    if (!map) return;
    map.addListener('zoom_changed', () => {
      const zoomLevel = map.getZoom();
      this.onMapZoomLevelChanged.emit(zoomLevel);
    });
  }

  updateMapZoomLevel(map: google.maps.Map, zoomLevel: number): void {
    if (!map || !zoomLevel) return;
    map.setZoom(zoomLevel);
  }

  loadGeoJsonFileOnMap(map: google.maps.Map, url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      map.data.loadGeoJson(url, null, (features) => {
        try {
          const zoomLevel = map.getZoom();
          if (zoomLevel && zoomLevel < 13) map.setZoom(13);
          // compute bounds over all features
          const bounds = new google.maps.LatLngBounds();
          features.forEach((f) => {
            f.getGeometry()?.forEachLatLng((latlng) => bounds.extend(latlng));
          });

          // fit & then bump the zoom
          const center = bounds.getCenter();
          map.setCenter(center);

          const type = features[0].getGeometry()?.getType();
          if (
            features[0].getGeometry() instanceof google.maps.Data.Point &&
            type &&
            type.trim().length > 0 &&
            type.toLowerCase() == 'point'
          ) {
            if (
              this.tempCircles.find(
                (t) => t.id == features[0].getProperty('REGIONID')
              )
            ) {
              const tempCircle = this.tempCircles.find(
                (t) => t.id == features[0].getProperty('REGIONID')
              );
              tempCircle?.circle.setMap(map);
            } else {
              const point = features[0].getGeometry() as google.maps.Data.Point;
              const latlng = (point as any).get();
              const tempCircle = this.drawStaticCircle(map, latlng);
              this.tempCircles.push({
                id: features[0].getProperty('REGIONID'),
                circle: tempCircle,
              });
            }
          }

          // resolve with whatever ID we picked up (or undefined if none)
          resolve(features[0].getProperty('REGIONID') || undefined);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  removeFeatureById(map: google.maps.Map, id: any): void {
    map.data.forEach((feature) => {
      if (feature.getProperty('REGIONID') === id) {
        const type = feature.getGeometry()?.getType();
        if (
          feature.getGeometry() instanceof google.maps.Data.Point &&
          type &&
          type.trim().length > 0 &&
          type.toLowerCase() == 'point'
        ) {
          if (
            this.tempCircles.find(
              (t) => t.id == feature.getProperty('REGIONID')
            )
          ) {
            const tempCircle = this.tempCircles.find(
              (t) => t.id == feature.getProperty('REGIONID')
            );
            tempCircle?.circle.setMap(null);
          }
        }
        map.data.remove(feature);
      }
    });
  }

  getStatesInsideMapView(
    map: google.maps.Map,
    callback: (states: IMapState[]) => void
  ): void {
    const bounds = map.getBounds();

    if (!bounds) {
      callback([]); // If bounds are not available, return an empty array
      return;
    }

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const latStep = (ne.lat() - sw.lat()) / 10; // Adjust grid size as needed
    const lngStep = (ne.lng() - sw.lng()) / 10;

    // Set to store unique states (using state code for uniqueness)
    const uniqueStates: Set<string> = new Set();
    const stateList: IMapState[] = [];

    // Use a counter to track the number of geocoding requests
    let totalRequests = 0;
    let completedRequests = 0;

    // Loop through coordinates within the bounds to reverse geocode
    for (let lat = sw.lat(); lat < ne.lat(); lat += latStep) {
      for (let lng = sw.lng(); lng < ne.lng(); lng += lngStep) {
        totalRequests++;
        this.reverseGeocodeForState(lat, lng, uniqueStates, stateList, () => {
          completedRequests++;
          // If all geocoding requests are complete, invoke the callback with the result
          if (completedRequests === totalRequests) {
            callback(stateList); // Return the stateList through the callback
          }
        });
      }
    }

    if (totalRequests === 0) {
      callback([]);
    }
  }

  reverseGeocodeForState(
    lat: number,
    lng: number,
    uniqueStates: Set<string>,
    stateList: IMapState[],
    callback: () => void
  ): void {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      { location: { lat, lng } },
      (
        results: google.maps.GeocoderResult[],
        status: google.maps.GeocoderStatus
      ) => {
        if (status === 'OK' && results[0]) {
          const state = results.find(
            (result: google.maps.GeocoderResult) =>
              result.types.includes('administrative_area_level_1') // This is the state level
          );
          if (state) {
            // Create IMapState object
            const mapState: IMapState = {
              code:
                state.address_components.find((component) =>
                  component.types.includes('administrative_area_level_1')
                )?.short_name || '',
            };
            if (!uniqueStates.has(mapState.code)) {
              uniqueStates.add(mapState.code);
              stateList.push(mapState);
            }
          }
        }
        callback(); // Call the callback after processing this request
      }
    );
  }

  private drawStaticCircle(map: any, center: any): google.maps.Circle {
    const circle = new google.maps.Circle({
      map: map,
      center: center,
      radius: 1000,
      fillColor: '#3395FF',
      fillOpacity: 0.3,
      strokeWeight: 2,
      strokeColor: '#3395FF',
      editable: false,
      draggable: false,
    });

    circle.setMap(map);
    return circle;
  }
}
