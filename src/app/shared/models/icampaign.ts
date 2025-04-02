export interface ICampaign  {
  id: number
  name: string
  organizationid: number
  Campaigns: Campaign[]
}

export interface Campaign {
  Id: number
  CampaignPrivacy: number
  CampaignName: string
  CreatedDate: string
  Submissions?: Submission[]
  MailsSent: MailsSent[]
  Sites: number
  Stages?: Stage[]
  expanded?: boolean
}

export interface Submission {
  StatusId: number
  Submissions: number
}

export interface MailsSent {
  MailsSent: number
}

export interface Stage {
  stageName: string
  Organizations: number
}
