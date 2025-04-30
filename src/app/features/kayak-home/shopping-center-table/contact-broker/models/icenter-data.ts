import { IManager } from "./imanage-shopping";

export interface ICenterData {
  Id: number;
  CenterName: string;
  CenterAddress?: string;
  MainImage?: string;
  P?: P[];
  Managers?: IManager[];
}

export interface P {
  BuildingSizeSf: number;
  ForLeasePrice: number;
}
