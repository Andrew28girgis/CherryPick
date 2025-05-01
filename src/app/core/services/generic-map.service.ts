/// <reference types="google.maps" />
import { ElementRef, EventEmitter, Injectable } from '@angular/core';
import { IMapBounds } from 'src/app/shared/interfaces/imap-bounds';
import { IMapCity } from 'src/app/shared/interfaces/imap-city';
import { IMapState } from 'src/app/shared/interfaces/imap-state';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class GenericMapService {
  private placesService?: google.maps.places.PlacesService;

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

  loadGeoJsonFileOnMap(map: google.maps.Map, url: string): void {
    map.data.loadGeoJson(url);
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

    // If no requests were made (empty bounds), invoke the callback with an empty array
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
              longName: state.formatted_address,
              code:
                state.address_components.find((component) =>
                  component.types.includes('administrative_area_level_1')
                )?.short_name || '',
              lat: state.geometry.location.lat(),
              lng: state.geometry.location.lng(),
            };

            // Check if the state code is unique and add it to the list
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

  // getCitiesInsideMapView(map: google.maps.Map, callback: (cities: IMapCity[]) => void): void {
  //   const bounds = map.getBounds();

  //   if (!bounds) {
  //     callback([]); // If bounds are not available, return an empty array
  //     return;
  //   }

  //   const ne = bounds.getNorthEast();
  //   const sw = bounds.getSouthWest();
  //   const latStep = (ne.lat() - sw.lat()) / 10; // Adjust grid size as needed
  //   const lngStep = (ne.lng() - sw.lng()) / 10;

  //   // Set to store unique cities (using placeId for uniqueness)
  //   const uniqueCities: Set<string> = new Set();
  //   const cityList: IMapCity[] = [];

  //   // Use a counter to track the number of geocoding requests
  //   let totalRequests = 0;
  //   let completedRequests = 0;

  //   // Loop through coordinates within the bounds to reverse geocode
  //   for (let lat = sw.lat(); lat < ne.lat(); lat += latStep) {
  //     for (let lng = sw.lng(); lng < ne.lng(); lng += lngStep) {
  //       totalRequests++;
  //       this.reverseGeocode(lat, lng, uniqueCities, cityList, () => {
  //         completedRequests++;
  //         // If all geocoding requests are complete, invoke the callback with the result
  //         if (completedRequests === totalRequests) {
  //           callback(cityList); // Return the cityList through the callback
  //         }
  //       });
  //     }
  //   }

  //   // If no requests were made (empty bounds), invoke the callback with an empty array
  //   if (totalRequests === 0) {
  //     callback([]);
  //   }
  // }

  // reverseGeocode(lat: number, lng: number, uniqueCities: Set<string>, cityList: IMapCity[], callback: () => void): void {
  //   const geocoder = new google.maps.Geocoder();
  //   geocoder.geocode({ location: { lat, lng } }, (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
  //     if (status === 'OK' && results[0]) {
  //       const city = results.find((result: google.maps.GeocoderResult) =>
  //         result.types.includes('locality')
  //       );
  //       if (city) {

  //         // Create IMapCity object
  //         const mapCity: IMapCity = {
  //           name: city.formatted_address,
  //           lat: city.geometry.location.lat(),
  //           lng: city.geometry.location.lng(),
  //           placeId: city.place_id,
  //         };

  //         // Check if the placeId is unique and add it to the list
  //         if (!uniqueCities.has(mapCity.placeId)) {
  //           uniqueCities.add(mapCity.placeId);
  //           cityList.push(mapCity);
  //         }
  //       }
  //     }
  //     callback(); // Call the callback after processing this request
  //   });
  // }

  // getCitiesInsideMapView(
  //   map: google.maps.Map,
  //   callback: (cities: IMapCity[]) => void
  // ): void {
  //   if (!map) {
  //     callback([]); // If no map, return empty array through callback
  //     return;
  //   }

  //   if (this.placesService) {
  //     this.placesService = undefined;
  //   }
  //   this.placesService = new google.maps.places.PlacesService(map);

  //   if (this.placesService) {
  //     const bounds = map.getBounds();

  //     this.placesService.nearbySearch(
  //       { bounds, type: 'locality' },
  //       (results, status) => {
  //         if (
  //           status !== google.maps.places.PlacesServiceStatus.OK ||
  //           !results
  //         ) {
  //           callback([]); // Call the callback with empty array if results are invalid
  //           return;
  //         }

  //         const cities: IMapCity[] = results
  //           .filter(
  //             (place) =>
  //               !!place.geometry &&
  //               !!place.geometry.location &&
  //               !!place.name &&
  //               !!place.place_id
  //           )
  //           .map((place) => {
  //             const loc = place.geometry!.location!;
  //             return {
  //               name: place.name!,
  //               lat: loc.lat(),
  //               lng: loc.lng(),
  //               placeId: place.place_id!,
  //             };
  //           });

  //         callback(cities); // Call the callback with the filtered cities
  //       }
  //     );
  //   }
  // }
}
