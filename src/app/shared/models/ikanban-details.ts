export interface IKanbanDetails {
  Id: number;
  targetStakeholderId: number;
  kanbanName: string;
  kanbanTemplateId: number;
  kanbanStages: KanbanStage[];
}

export interface KanbanStage {
  StageId: number;
  stageName: string;
  stageOrder: number;
  StageActions?: StageAction[];
  StageListings?: StageListing[];
  StageOrganizations?: StageOrganization[];

  // isQualified: boolean;
  // kanbanId: number;
  // kanbanTemplateStageId: number;
  // Actions?: Action[];
  // Id: number;
  // kanbanOrganizations: KanbanOrganization[];
}
export interface StageAction {
  ActionId: number;
  actionLevel: string;
  actionType: string;
  actionName: string;
  KanbanTemplateStageId: number;
}

export interface StageListing {
  MarketSurveyShoppingCenterId: number;
  ShoppingCenterId: number;
  CenterName: string;
  Id: number;
  Name: string;
  LogoURL: string;
  ContactId: number;
}

export interface StageOrganization {
  kanbanOrganizationid: number;
  OrganizationId: number;
  OrganizationName: string;
  LogoURL: string;
  Actions: Action[];
  OtherKanbans: OtherKanban[];
}

export interface Action {
  ActionId: number;
  actionLevel: string;
  actionType: string;
  actionName: string;
  actionURL: string;
  actionUrlDecode: string;
  KanbanTemplateStageId: number;
}

export interface OtherKanban {
  id: number;
  kanbanName: string;
}

export interface KanbanDragingData {
  type: 'organization' | 'center';
  orgIndex: number;
  centerIndex?: number;
  value: StageOrganization | StageListing;
}
