export interface Tenant {
  id: number;
  name: string;
  URL?: string;
  LinkedIn?: string;
  logoUrl ?: string;
  Campaigns: Campaign[];
}

export interface Campaign {
  Id: number;
  CampaignPrivacy: number;
  CampaignName: string;
  CreatedDate: string;
  Sites: number;
  MailsSent: number;
  Kanban?: Kanban[];
}

export interface Kanban {
  Id: number;
  stageName: string;
  stageOrder: number;
  isQualified: boolean;
  KanbanTemplateId: number;
  MarketSurveyShoppingCenters: MarketSurveyShoppingCenter[];
}

export interface MarketSurveyShoppingCenter {
  Id: number;
  kanbanStageId: number;
  ShoppingCenterId: number;
  Deleted: boolean;
  CampaignId: number;
}
