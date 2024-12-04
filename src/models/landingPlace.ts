export class LandingPlace {
  ShoppingCenter!: ShoppingCenter[]
  OtherPlaces!: OtherPlace[]
  Place!:OtherPlace[]
}

export class ShoppingCenter {
  Id!: number
  CenterName!: string
  CenterType!: string
  CenterAddress!: string
  CenterCity!: string
  CenterState!: string
  Latitude!: number
  Description!: string
  Longitude!: number
  MainImage!: string
  Heading!: number
  Pitch!: number
  StreetLatitude!: number
  StreetLongitude!: number
  PlaceKey!: string
  DocLink!: string
  SitePlan!: string
  DocsLink!: string
  Employees!: string
   
  HouseholdIncome!: string
  PopulationDensity!: any
  SiteSelectionReason!: string
  Suburban!: boolean
  Urban!: boolean
  StreetViewURL!: string
}

export class OtherPlace {
  Id!: number
  Address?: string
  City!: string
  State!: string
  Zip!: string
  Longitude!: number
  Latitude!: number
  Type!: string
  Units!: string
  ZoningCode!: string
  LandUse!: string
  BuildingSizeSf!: number
  Description!: string
  UploadDate!: string
  SitePlan!: string
  Class!: string
  SecondaryType!: string
  ListingType!: string
  MainImage!: string
  PopulationDensity: any
  ForLeasePrice!: string
  Employees!: string
  HouseholdIncome!: string
  Suburban!: boolean
  Urban!: boolean
  CenterName!: string
  LeaseType!: string
  SiteSelectionReason!: string
  Parking!: string
  Suite!: string
  Heading!: number
  Images!: string
  Notes!: string
  Pitch!: number
  StreetLatitude!: number
  StreetLongitude!: number
  StreetViewURL!: string
  Extras!: string
  ShoppingCenterId!: number
  DocsLink?: string  
}
