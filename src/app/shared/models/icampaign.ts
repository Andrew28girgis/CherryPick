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
  CreatedDate?: string;
  Geojsons: Geojson[];
  Submissions: Submission[];
  MailsSent: MailsSent[];
  Stages: Stage[];
}

export interface Submission {
  Submissions: number;
}

export interface MailsSent {
  MailsSent: number;
}

export interface Stage {
  Id: number;
  stageName: string;
  c: number;
}

export interface Geojson {
  id: number;
  Name: string;
  state: string;
  ShoppingCenters: ShoppingCenter[];
}

export interface ShoppingCenter {
  Latitude: number;
  Longitude: number;
  InPolygon: boolean;
  Contact: Contact[];
}

export interface Contact {
  id: number;
  OrganizationId: number;
}
