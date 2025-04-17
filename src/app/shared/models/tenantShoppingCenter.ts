export interface TenantShoppingCenter {
  Id: number
  CenterName: string
  CenterType: string
  CenterAddress: string
  CenterCity: string
  CenterState: string
  CenterCounty: string
  NumberOfParkingSpaces: number
  TotalAvailableSpace_SF: number
  MainImage: string
  ZipCode: string
  StreetViewURL: string
  Description: string
  DocsLink: string
  Images: string
  SitePlan: string
  SiteSelectionReason: string
  O: O[]
}

export interface O {
  ID: number
  Name: string
  P: P[]
}

export interface P {
  PlaceId: number
  Type: string
  BuildingSizeSf: number
  ForSalePrice: number
  PlaceDescription: string
  SecondaryType: string
  PlaceMainImage: string
  ForLeasePrice: number
  LeaseType: string
  Suite: string
  PlaceImages: string
  PlaceStreetViewURL: string
}
  