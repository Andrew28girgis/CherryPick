export interface ICampaignSiteCadence {
  Id: number;
  targetStakeholderId: number;
  kanbanName: string;
  kanbanTemplateId: number;
  kanbanStages: KanbanStage[];
}

export interface KanbanStage {
  Id: number;
  stageName: string;
  stageOrder: number;
  isQualified: boolean;
  kanbanId: number;
  kanbanTemplateStageId: number;
  MarketSurveyShoppingCenters: MarketSurveyShoppingCenter[];
}

export interface MarketSurveyShoppingCenter {
  Id: number;
  kanbanStageId: number;
  BuyboxId: number;
  ShoppingCenterId: number;
  Deleted: boolean;
  CampaignId?: number;
  CampaignPolygonId?: number;
  SiteSelectionReason?: string;
}
