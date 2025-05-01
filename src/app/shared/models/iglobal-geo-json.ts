export interface IGlobalGeoJson {
  features: Feature[];
  type: string;
  crs: any;
  bbox: any;
}

export interface Feature {
  id: string;
  geometry: Geometry;
  properties: Properties;
  type: string;
  crs: any;
  bbox: any;
}

export interface Geometry {
  coordinates: number[][][];
  type: string;
  crs: any;
  bbox: any;
}

export interface Properties {
  type: string;
  id: string;
  tags: string;
  relations: string;
  meta: string;
  geometry?: string;
}
