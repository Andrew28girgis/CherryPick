export class LandingPlace {
  ShoppingCenter!: ShoppingCenter[]
  OtherPlaces!: OtherPlace[]
   Contacts!:Contact[]
  CenterAddress!:string
  CenterName!:string
  DocsLink!:string
  SitePlan!:string
  MainImage!:any
  Place:place[] = []
  Longitude!:number
  Latitude!:number
}
export interface place{
  Id: number
  BuildingSizeSf: number
  LandSf: any
  SecondaryType: string
  Price: any
  LeaseType: string
  Suite: string
  StreetViewURL: any
  Extras: any
  Type: any
}

export interface Contact {
  OrganizationId: number;
  OrganizationName:string
  FirstName: string;
  LastName: string;
  Email: string;
}

export class ShoppingCenter {
  Id!: number
  CenterName!: string
  CenterType!: string
  CenterAddress!: string
  CenterCity!: string
  CenterState!: string
  Latitude!: number
  Images!:string
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
  SubletVacantSpace!: any
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
