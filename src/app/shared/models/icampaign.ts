export interface ICampaign {
  id: number;
  name: string;
  organizationid: number;
  Campaigns: Campaign[];
}

export interface Campaign {
  Id: number;
  CampaignPrivacy: number;
  CampaignName: string;
  CreatedDate: Date;
  Submissions: Submission[];
  MailsSent: MailsSent[];
  Sites: number;
  Stages?: Stage[];
}

export interface Submission {
  Submissions: number;
}

export interface MailsSent {
  MailsSent: number;
}

export interface Stage {
  stageName: string;
  Organizations: number;
}
