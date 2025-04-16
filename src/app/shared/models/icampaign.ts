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
  MailsSent: number
  Submissions?: Submission[] 
  Sites: number
  Stages?: Stage[]
  expanded?: boolean
  Kanban: KanbanStage[]; 

}
export interface MailsSent {
  MailsSent: number;
}

export interface KanbanStage {
  Id: number;
  stageName: string;
  stageOrder: number;
  isQualified: boolean;
  KanbanTemplateId: number;
  MarketSurveyShoppingCenters: KanbanOrganization[]; 
}
export interface KanbanOrganization {
  Id: number;
  OrganizationId: number;
  kanbanStageId: number;
}

export interface Submission {
  Id: number
  UserId: number
  ShoppingCenterId: number
  CreatedDate: string
  CampaignId: number
  StatusId: number
  SourceId: number
}

export interface MailsSent {
  MailsSent: number
}

export interface Stage {
  stageName: string
  Organizations: number
}
