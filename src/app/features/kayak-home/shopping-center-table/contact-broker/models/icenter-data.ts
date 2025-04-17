export interface ICenterData {
  Id: number;
  CenterName: string;
  CenterAddress?: string;
  MainImage?: string;
  P?: P[];
}

export interface P {
  BuildingSizeSf: number;
  ForLeasePrice: number;
}
