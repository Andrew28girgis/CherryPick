export interface PlaceCotenants {
  ID: number;
  Name: string;
  SubCategory: SubCategory[];
}

export interface SubCategory {
  OrganizationCategory: string;
  Branches: Branch[];
}

export interface Branch {
  Id: number;
  Latitude: number;
  Longitude: number;
  OrganizationId: number;
  Distance: number;
}

export interface ShoppingCenterTenant {
  OrganizationID: number;
  OrganizationName: string;
  BranchID: number;
  ShoppingCenterId: number;
  Distance: number;
  LogoURL: string;
}
