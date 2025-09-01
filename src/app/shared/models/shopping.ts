export interface ShoppingCenter {
  mainImage: string;
  scId: number;
  centerAddress: string
  centerName: string
  campaignId: number
  buildingSizeSf?: number;
  forSalePrice?: number;
  lastForSalePrice?: number;
  forLeasePrice?: number;
  isShared?: boolean;
  isDropdownOpen?: boolean;
}