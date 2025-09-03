export interface ShoppingCenter {
  mainImage: string;
  scId: number;
  centerAddress: string
  centerName: string
  centerType: string
  category: string
  lastUpdateDate: Date;
  organizationName:string
  campaignId: number
  buildingSizeSf?: number;
  forSalePrice?: number;
  lastForSalePrice?: number;
  forLeasePrice?: number;
  isShared?: boolean;
  isDropdownOpen?: boolean;
}