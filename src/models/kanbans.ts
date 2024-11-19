import { KanbanAction } from "./kanbanActions"


export interface KanbanCard {
  Id: number
  targetStakeholderId: number
  kanbanName: string
  kanbanStages: KanbanStage[]
}

export interface KanbanStage {
  Id: number
  stageName: string
  stageOrder: number
  isQualified: boolean
  kanbanId: number
  kanbanOrganizations: KanbanOrganization[]
  stageActions: KanbanAction[]
}

export interface KanbanOrganization {
  Organization?: Organization[]
  Id?: number
  OrganizationId?: number
  kanbanStageId?: number
}

export interface Organization {
  ID?: number
  Name?: string
  stakeholderId:  number
}

export interface StakeHolder {
  id?: number
  name?: string
}