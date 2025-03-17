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
  Actions?: Action[];
  Id: number;
  stageName: string;
  kanbanOrganizations: KanbanOrganization[];
}

export interface Action {
  Id: number;
  actionName: string;
  actionType: string;
  actionLevel: string;
  actionURL: string;
  KanbanTemplateStageId: number;
}

export interface KanbanOrganization {
  Organization: Organization[];
  Id?: number;
  OrganizationId?: number;
  kanbanStageId?: number;
}

export interface Organization {
  OrganizationID: number;
  OrganizationName: string;
  OrganizationLogoURL: string;
  ShoppingCenters: ShoppingCenter[];
  OrganizationStakeholderId?: number;
}

export interface ShoppingCenter {
  CenterName: string;
  CenterAddress: string;
  CenterCity: string;
  CenterState: string;
  MainImage: string;
  MarketSurveyShoppingCenters: MarketSurveyShoppingCenter[];
}

export interface MarketSurveyShoppingCenter {
  ShoppingCenterRep: ShoppingCenterRep[];
  MarketSurveyId?: number;
}

export interface ShoppingCenterRep {
  ShoppingCenterRepId: number;
  ShoppingCenterRepName: string;
  ShoppingCenterRepLogoURL: string;
  Contact: Contact[];
}

export interface Contact {
  ContactId: number;
  ContactFirstname: string;
  ContactLastname: string;
}

export interface KanbanDragingData {
  type: 'organization' | 'center';
  orgIndex: number;
  centerIndex?: number;
  value: Organization | ShoppingCenter;
}
