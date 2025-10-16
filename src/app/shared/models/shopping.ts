export interface ShoppingCenter {
  scId: number;
  centerName: string;
  centerAddress: string;
  centerCity: string;
  centerState: string;
  mainImage: string;
  latitude: number;
  longitude: number;
  docsLink: string;
  centerType: string;
  category: string;
  lastUpdateDate: Date;
  source: string;
  campaignId: number;
  managerORG: string;
  managerORGLogoURL: string;
  shoppingCenter: ShoppingCenterarr;
  isShared?: boolean;
  isDropdownOpen?: boolean;
  buildingSizeSf?: number;
  forSalePrice?: number;
  lastForSalePrice?: number;
  organizationName: string;
  forLeasePrice?: number;
  centerZibCode: any;
  centerCounty: any;
}

export interface ShoppingCenterarr {
  managerOrganization: ManagerOrganization[];
  places: Place[];
}

export interface ManagerOrganization {
  id: number;
  name: string;
  contactId: number;
  firstname: string;
  lastName: string;
  email: string;
}

export interface Place {
  id: number;
  buildingSizeSf: number;
  secondaryType: string;
  suite: string;
  price: number; // lowercase
  leaseType: string;
}
