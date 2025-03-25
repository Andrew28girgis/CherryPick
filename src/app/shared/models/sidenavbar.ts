export class cadenceSidebar {
  tenantOrganizations: StageOrganization[] = [];
}

export interface StageOrganization {
  isOpen?: boolean;
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