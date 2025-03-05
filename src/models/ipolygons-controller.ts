export interface IPolygonsController {}
export interface IPolygon {
  id: number;
  name: string;
  city: string;
  state: string;
  json: string;
  creationDate: Date;
  center: string | null;
  radius: string | null;
}
