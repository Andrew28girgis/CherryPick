export interface IGeoJson {
  type: string;
  geometry: IGeometry;
  properties: IProperties;
}

export interface IGeometry {
  type: string;
  coordinates: number[][][];
}

export interface IProperties {
  city: string;
  state: string;
}
