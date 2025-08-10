export interface ShoppingCenter {
  mainImage: string;
  centerName: string;
  centerAddress: string;
  buildingSizeSf?: number;
  forSalePrice?: number;
  lastForSalePrice?: number;
  forLeasePrice?: number;
  id: number;
  isShared?: boolean;
}