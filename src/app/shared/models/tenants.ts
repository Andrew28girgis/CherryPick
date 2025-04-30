export class Tenant {
    Id!: number;
    Name!: string;
    Description!: string;
    ComparableTypeId!: number;
    MinBuildingSize!: number;
    MaxBuildingSize!: number;
    OrganizationId!: number;
    ManagerOrganizationId!: number;
    ManagerContactId!: number;
    Campaigns!: Campaign[];
  }
  
  export class Campaign {
    Id!: number;
    CampaignPrivacy!: number;
    CampaignName!: string;
    CreatedDate!: string;
    Sites!: number;
    MailsSent!: number;
    Kanban!: Kanban[];
  }
  
  export class Kanban {
    Id!: number;
    stageName!: string;
    stageOrder!: number;
    isQualified!: boolean;
    KanbanTemplateId!: number;
    MarketSurveyShoppingCenters!: MarketSurveyShoppingCenter[];
  }
  
  export class MarketSurveyShoppingCenter {
    Id!: number;
    kanbanStageId!: number;
    BuyboxId!: number;
    ShoppingCenterId!: number;
    Deleted!: boolean;
    CampaignId!: number;
    SiteSelectionReason!: string;
    CampaignPolygonId!: number;
  }
  