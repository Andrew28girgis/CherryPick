
export interface KanbanTemplate {
  Id: number
  targetStakeholderId: number
  kanbanTemplateName: string
  kanbanTemplateStages: KanbanTemplateStage[]
}

export interface KanbanTemplateStage {
  Id: number
  stageName: string
  stageOrder: number
  isQualified: boolean
  KanbanTemplateId: number
}
