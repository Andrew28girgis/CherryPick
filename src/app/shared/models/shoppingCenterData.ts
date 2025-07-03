export interface shoppingCenterDTO {
  Id: number
  CenterName: string
  CenterType: string
  CenterAddress: string
  CenterCity: string
  CenterState: string
  CenterCounty: string
  LandArea_SF: number
  Latitude: number
  Longitude: number
  NumberOfParkingSpaces: number
  NumberOfPropertiesInCenter: number
  TotalAvailableSpace_SF: number
  MainImage: string
  ZipCode: string
  PlaceKey: string
  StreetViewURL: string
  DocsLink: string
  Description: string
  Images: string
  Notes: string
  PopulationDensity: number
  SitePlan: string
  Place: Place[]
}

export interface Place {
  Id: number
  BuildingSizeSf: number
  SecondaryType?: string
  ForLeasePrice?: number
  Suite: string
  StreetViewURL?: string
  LeaseType: string
  Extras?: string
  Type?: string
  C: C[]
}

export interface C {
  Id: number
  CampaignName: string
  CO: Co[]
}

export interface Co {
  Firstname: string
  LastName: string
  Email: string
}
