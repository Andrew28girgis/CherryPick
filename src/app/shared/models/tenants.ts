export class Tenant {
    id!: number;
    name!: string;
    URL!: string;
    LinkedIn!: string;
    Campaigns!: Campaign[];

    // Optional: You can keep these properties if they're used elsewhere in your application
    OrganizationId?: number; // Seems to be the same as id in the API response
    Name?: string; // Legacy property, can use name instead
    Id?: number; // Legacy property, can use id instead
}

export class Campaign {
    Id!: number;
    CampaignName!: string;
    CampaignPrivacy!: number;
    CreatedDate!: string;
    Kanban!: Kanban[];
    MailsSent!: number;
    Sites!: number;
}

export class Kanban {
    Id!: number;
    stageName!: string;
    stageOrder!: number;
    isQualified!: boolean;
    KanbanTemplateId!: number;
    MarketSurveyShoppingCenters?: MarketSurveyShoppingCenter[];
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