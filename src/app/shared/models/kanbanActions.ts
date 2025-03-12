export interface KanbanAction {
    Id: number
    actionName: string
    actionType: string
    actionLevel: string
    actionURL: string
    kanbanTemplateStageAction: KanbanTemplateStageAction[]
  }
  
  export interface KanbanTemplateStageAction {
    Id: number
    KanbanTemplateStageId: number
    KanbanActionId: number
    kanbanStages: KanbanStage[]
  }
  
  export interface KanbanStage {
    Id: number
    stageName: string
    stageOrder: number
    isQualified: boolean
    kanbanId: number
    kanbanTemplateStageId: number
  }
  