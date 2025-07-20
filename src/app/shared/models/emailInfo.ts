 export interface EmailData {
  mailId: number;
  subject: string;
  body: string;
  date: string;
  toAddress: string | null;
  fromAddress: string | null;
  direction: number;
  dealId: number | null;
  campaignId: number;
  campaignName: string;
  campaignCreatedDate: string;
  campaignPrivacy: number;
  buyboxId: number;
  buyboxName: string;
  minBuildingSize: number;
  maxBuildingSize: number;
  minLandSize: number | null;
  maxLandSize: number | null;
  buildingType: string | null;
  purchasePrice: number | null;
  zoning: string | null;
  vehiclePerDay: number | null;
}
