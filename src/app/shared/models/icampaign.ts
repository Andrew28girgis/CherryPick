export interface ICampaign {
  Id: number;
  OrganizationId: number;
  CampaignPrivacy: number;
  OrganizationName: string;
  CampaignName: string;
  CreatedDate: string;
  logoUrl: string;
  MailsSent: number;
  Submissions?: Submission[];
  Sites: number;
  Stages?: Stage[];
  expanded?: boolean;
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
  kanbanStageId: number;
  BuyboxId: number;
  ShoppingCenterId: number;
  Deleted: boolean;
  CampaignId: number;
  CampaignPolygonId: number;
}

export interface Submission {
  Id: number;
  UserId: number;
  ShoppingCenterId: number;
  CreatedDate: string;
  CampaignId: number;
  StatusId: number;
  SourceId: number;
}

export interface MailsSent {
  MailsSent: number;
}

export interface Stage {
  stageName: string;
  Organizations: number;
}
