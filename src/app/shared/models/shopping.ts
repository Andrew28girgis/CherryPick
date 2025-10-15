export interface ShoppingCenter {

}


export interface ShoppingCenter {
  scId: number
  centerName: string
  centerAddress: string
  centerCity: string
  centerState: string
  mainImage: string
  Latitude: number
  Longitude: number
  DocsLink: string
  centerType: string
  category: string
  lastUpdateDate: Date
  source: string
  campaignId: number
  managerORG: string
  managerORGLogoURL: string
  ShoppingCenter: ShoppingCenterarr
  isShared?: boolean;
  isDropdownOpen?: boolean;
  buildingSizeSf?: number;
  forSalePrice?: number;
  lastForSalePrice?: number;
  organizationName:string
  forLeasePrice?: number;
}

export interface ShoppingCenterarr {
  managerOrganization: ManagerOrganization[]
  places: Place[]
}

export interface ManagerOrganization {
  Id: number
  Name: string
  ContactId: number
  Firstname: string
  LastName: string
  Email: string
}

export interface Place {
  Id: number
  BuildingSizeSf: number
  SecondaryType: string
  Suite: string
  Price: number
  LeaseType: string
}
