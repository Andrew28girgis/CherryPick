export interface ICampaign {
  id: number;
  name: string;
  organizationid: number;
  Campaigns: Campaign[];
}

export interface Campaign {
  Id: number;
  CampaignName: string;
  BuyBoxId: number;
  CampaignPrivacy: number;
  Geojsons: Geojson[];
  CreatedDate?: string;
}

export interface Geojson {
  id: number;
  state: string;
}
