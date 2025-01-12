export interface GoogleMap {
  setMap(map: any): void;
  getPosition(): any;
  addListener(event: string, handler: Function): void;
  fitBounds(bounds: any): void;
}

export interface GoogleMapsLatLng {
  lat: number;
  lng: number;
}

export interface GoogleMapsMarker {
  setMap(map: any): void;
  getPosition(): any;
  addListener(event: string, handler: Function): void;
  setAnimation(animation: any): void;
}

export interface GoogleMapsBounds {
  extend(position: any): void;
}

export interface GoogleMapsOptions {
  zoom: number;
  center: GoogleMapsLatLng;
  mapTypeId: any;
  styles?: any[];
  mapTypeControl?: boolean;
  streetViewControl?: boolean;
  fullscreenControl?: boolean;
}

export interface GoogleMapsSize {
  new (width: number, height: number): any;
} 