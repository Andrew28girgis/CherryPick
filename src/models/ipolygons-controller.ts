export interface IPolygonsController {}
export interface IPolygon {
  id: number;
  name: string;
  json: string;
  creationDate: Date;
  center: string | null;
  radius: string | null;
}
