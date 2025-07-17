export interface Tenant {
  id: number;
  name: string;
  URL?: string;
  LinkedIn?: string;
  Campaigns: Campaign[];
}

export interface Campaign {
  Id: number
  CampaignPrivacy: number
  CampaignName: string
  CreatedDate: string
  Sites: number
  MailsSent: number
}
