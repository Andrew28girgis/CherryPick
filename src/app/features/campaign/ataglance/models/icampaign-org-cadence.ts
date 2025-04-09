export interface ICampaignOrgCadence {
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
  kanbanOrganizations: KanbanOrganization[];
}

export interface KanbanOrganization {
  Id: number;
  OrganizationId: number;
  kanbanStageId: number;
}
