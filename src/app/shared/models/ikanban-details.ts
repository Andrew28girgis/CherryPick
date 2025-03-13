export interface IKanbanDetails {
  Id: number;
  targetStakeholderId: number;
  kanbanName: string;
  kanbanTemplateId: number;
  kanbanStages: KanbanStage[];
}

export interface KanbanStage {
  stageOrder: number;
  isQualified: boolean;
  kanbanId: number;
  kanbanTemplateStageId: number;
  Id: number;
  stageName: string;
  kanbanOrganizations: KanbanOrganization[];
}

export interface KanbanOrganization {
  Organization: Organization[];
  Id?: number;
  OrganizationId?: number;
  kanbanStageId?: number;
}

export interface Organization {
  ShoppingCenters: ShoppingCenter[];
  ID?: number;
  Name?: string;
  LogoURL?: string;
  stakeholderId?: number;
}

export interface ShoppingCenter {
  MarketSurveyShoppingCenters: MarketSurveyShoppingCenter[];
  CenterName?: string;
  CenterAddress?: string;
  CenterCity?: string;
  CenterState?: string;
  MainImage?: string;
}

export interface MarketSurveyShoppingCenter {
  ShoppingCenterRep: ShoppingCenterRep[];
  MarketSurveyId?: number;
}

export interface ShoppingCenterRep {
  Contact: Contact[];
  id?: number;
  Name?: string;
  LogoURL?: string;
}

export interface Contact {
  id?: number;
  Firstname?: string;
  Lastname?: string;
}
